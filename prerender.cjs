const fs = require('fs');
const path = require('path');

// Determine repo base url & domain url
const githubRepo = process.env.GITHUB_REPOSITORY || '';
let owner = 'sameeravani';
let repo = 'svbooks';
let isRootDomain = false;

if (githubRepo) {
  const parts = githubRepo.split('/');
  owner = parts[0];
  repo = parts[1];
  isRootDomain = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
}

const baseUrl = githubRepo ? (isRootDomain ? '/' : `/${repo}/`) : '/';
const domainUrl = `https://${owner.toLowerCase()}.github.io${isRootDomain ? '' : `/${repo}`}`;

console.log(`Prerendering configurations:`);
console.log(`- Domain URL: ${domainUrl}`);
console.log(`- Base Path: ${baseUrl}`);

const distDir = path.join(__dirname, 'dist');
const catalogPath = path.join(__dirname, 'public/books/catalog.json');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Error: dist/index.html not found! Run npm run build first.');
  process.exit(1);
}

if (!fs.existsSync(catalogPath)) {
  console.error('Error: public/books/catalog.json not found!');
  process.exit(1);
}

const template = fs.readFileSync(indexHtmlPath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

function extractSnippet(markdownContent) {
  if (!markdownContent) return '';
  // Strip YAML frontmatter
  let text = markdownContent.replace(/^---[\s\S]*?---\r?\n/, '');
  // Strip GitHub alerts like > [!NOTE], > [!TIP], etc.
  text = text.replace(/>\s*\[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, ' ');
  // Strip HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  // Strip Markdown headers, blockquotes, lists, symbols
  text = text.replace(/^[#\-\*\d\.\>\s]+/gm, ' ');
  text = text.replace(/[\*\#\`\-\_\>]+/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > 155) {
    text = text.substring(0, 155) + '...';
  }
  return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writePage(subPath, title, description, coverImage) {
  const targetDir = path.join(distDir, subPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cleanSubPath = subPath.endsWith('/') ? subPath : `${subPath}/`;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const fullUrl = `${domainUrl}${cleanBaseUrl}${cleanSubPath}`;
  const absoluteCoverUrl = `${domainUrl}/${coverImage}`;

  const safeTitle = (title || '').replace(/"/g, '&quot;');
  const safeDescription = (description || '').replace(/"/g, '&quot;');

  // Replace metadata in template
  let html = template;

  // Title replacement
  html = html.replace(/<title>[^<]*<\/title>/g, `<title>${safeTitle}</title>`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/g, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/g, `<meta name="twitter:title" content="${safeTitle}" />`);

  // Description replacement
  html = html.replace(/<meta name="description" content="[^"]*" \/>/g, `<meta name="description" content="${safeDescription}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/g, `<meta property="og:description" content="${safeDescription}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/g, `<meta name="twitter:description" content="${safeDescription}" />`);

  // Image replacement
  html = html.replace(/<meta property="og:image" content="[^"]*" \/>/g, `<meta property="og:image" content="${absoluteCoverUrl}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/g, `<meta name="twitter:image" content="${absoluteCoverUrl}" />`);

  // URL replacement
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/g, `<meta property="og:url" content="${fullUrl}" />`);

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

catalog.forEach((book) => {
  const bookTitle = book.title;
  const bookDesc = book.description;
  const cover = book.coverUrl;

  // 1. Write book-level page
  writePage(`/books/${book.id}`, `${bookTitle} | SameeraVani`, bookDesc, cover);

  // 2. Write language and chapter pages
  const languages = book.languages || [];
  languages.forEach((lang) => {
    let langTitle = bookTitle;
    let langDesc = bookDesc;
    if (book.localized && book.localized[lang]) {
      langTitle = book.localized[lang].title;
      langDesc = book.localized[lang].description;
    }

    writePage(`/books/${book.id}/${lang}`, `${langTitle} (${lang}) | SameeraVani`, langDesc, cover);

    const chapters = book.chapters?.[lang] || [];
    chapters.forEach((chapter) => {
      let chapterDesc = langDesc;
      const mdPath = path.join(__dirname, 'public', chapter.path);
      if (fs.existsSync(mdPath)) {
        const mdContent = fs.readFileSync(mdPath, 'utf8');
        const extracted = extractSnippet(mdContent);
        if (extracted) {
          chapterDesc = extracted;
        }
      }

      writePage(
        `/books/${book.id}/${lang}/${chapter.id}`,
        `${chapter.title} — ${langTitle} | SameeraVani`,
        chapterDesc,
        cover
      );
    });
  });
});

console.log(`Pre-rendering finished successfully! Generated metadata-optimized files.`);
