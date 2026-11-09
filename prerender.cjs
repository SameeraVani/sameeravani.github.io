const fs = require('fs');
const path = require('path');

// Determine repo base url & domain url
const domainUrl = (process.env.SITE_URL || 'https://sameeravani-books.web.app').replace(/\/+$/, '');
const baseUrl = '/';

console.log(`Prerendering configurations:`);
console.log(`- Domain URL: ${domainUrl}`);
console.log(`- Base Path: ${baseUrl}`);

// Sitemaps tracking
const sitemapUrls = new Map();
sitemapUrls.set('/', { loc: `${domainUrl}/`, priority: '1.0', changefreq: 'daily' });

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

  // Canonical link replacement
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/g, `<link rel="canonical" href="${fullUrl}" />`);

  // URL replacement
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/g, `<meta property="og:url" content="${fullUrl}" />`);

  // Record for sitemap
  const pathParts = cleanSubPath.split('/').filter(Boolean);
  let priority = '0.7';
  let changefreq = 'weekly';
  if (pathParts.length <= 1) {
    priority = '0.9';
    changefreq = 'daily';
  } else if (pathParts.length === 2) {
    priority = '0.8';
    changefreq = 'weekly';
  }
  sitemapUrls.set(cleanSubPath, { loc: fullUrl, priority, changefreq });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

catalog.forEach((book) => {
  let bookData = book;
  const perBookCatalog = path.join(__dirname, 'public/books', book.id, 'catalog.json');
  if (fs.existsSync(perBookCatalog)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(perBookCatalog, 'utf8'));
      bookData = { ...book, ...parsed };
    } catch (e) {
      console.warn('Could not read per-book catalog for', book.id, e);
    }
  }

  const bookTitle = bookData.title;
  const bookDesc = bookData.description;
  const cover = bookData.coverUrl;

  // 1. Write book-level page
  writePage(`/books/${bookData.id}`, `${bookTitle} | SameeraVani`, bookDesc, cover);

  // 2. Write language and chapter pages
  const languages = bookData.languages || [];
  languages.forEach((lang) => {
    let langTitle = bookTitle;
    let langDesc = bookDesc;
    if (bookData.localized && bookData.localized[lang]) {
      langTitle = bookData.localized[lang].title;
      langDesc = bookData.localized[lang].description;
    }

    writePage(`/books/${bookData.id}/${lang}`, `${langTitle} (${lang}) | SameeraVani`, langDesc, cover);

    const chapters = bookData.chapters?.[lang] || [];
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

// Prerender video routes
const videoCatalogPath = path.join(__dirname, 'public/books/video-catalog.json');
if (fs.existsSync(videoCatalogPath)) {
  const videoCatalog = JSON.parse(fs.readFileSync(videoCatalogPath, 'utf8'));

  writePage('/videos', 'Video Library | SameeraVani', 'Explore video lessons, recitations, and courses on SameeraVani.', 'books/default-cover.png');

  videoCatalog.forEach((book) => {
    const bookTitle = book.title;
    const bookDesc = book.description || 'Video course & recitations.';
    const cover = book.coverUrl || 'books/default-cover.png';

    writePage(`/videos/${book.id}`, `${bookTitle} — Video Lessons | SameeraVani`, bookDesc, cover);

    const playlists = book.playlists || {};
    Object.values(playlists).flat().forEach((playlist) => {
      if (playlist && playlist.id) {
        // Use primary ID if comma-separated to avoid OS max path length errors
        const primaryId = playlist.id.split(',')[0].trim();
        if (primaryId) {
          writePage(
            `/videos/${book.id}/${encodeURIComponent(primaryId)}`,
            `${playlist.title} — ${bookTitle} | SameeraVani`,
            bookDesc,
            cover
          );
        }
      }
    });
  });
}

// Prerender articles routes
let articlesCatalogPath = path.join(__dirname, 'public/articles/catalog.json');
if (!fs.existsSync(articlesCatalogPath)) {
  articlesCatalogPath = path.join(__dirname, 'public/lessons/catalog.json');
}
if (fs.existsSync(articlesCatalogPath)) {
  const articlesCatalog = JSON.parse(fs.readFileSync(articlesCatalogPath, 'utf8'));

  writePage('/articles', 'Articles & Questionnaire Archive | SameeraVani', 'Bite-sized daily articles, philosophical insights, and 3-question quizzes.', 'books/default-cover.png');
  const articleLangs = ['tamil', 'english', 'sanskrit', 'hindi', 'kannada', 'telugu'];
  
  articleLangs.forEach(lang => {
    writePage(`/articles/${lang}`, `Articles (${lang}) | SameeraVani`, 'Bite-sized daily articles, philosophical insights, and Vedantic reflections.', 'books/default-cover.png');
  });

  articlesCatalog.forEach((topic) => {
    const topicTitle = topic.title;
    const topicDesc = topic.description || 'Articles topic.';
    const cover = topic.coverUrl || 'books/default-cover.png';

    writePage(`/articles/${topic.id}`, `${topicTitle} — Articles | SameeraVani`, topicDesc, cover);
    writePage(`/quick-lessons/${topic.id}`, `${topicTitle} — Articles | SameeraVani`, topicDesc, cover);

    (topic.lessons || topic.articles || []).forEach((article) => {
      if (article && article.id) {
        let articleTitle = article.title;
        let articleDesc = article.summary || topicDesc;
        const mdPath = article.path ? path.join(__dirname, 'public', article.path) : null;
        let mdContent = '';
        if (mdPath && fs.existsSync(mdPath)) {
          mdContent = fs.readFileSync(mdPath, 'utf8');
          const titleMatch = mdContent.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            articleTitle = titleMatch[1].trim();
          }
        }
        if (!articleTitle) {
          articleTitle = article.id.replace(/-/g, ' ');
        }

        writePage(
          `/articles/${topic.id}/${article.id}`,
          `${articleTitle} — ${topicTitle} | SameeraVani`,
          articleDesc,
          cover
        );
        writePage(
          `/quick-lessons/${topic.id}/${article.id}`,
          `${articleTitle} — ${topicTitle} | SameeraVani`,
          articleDesc,
          cover
        );

        articleLangs.forEach(lang => {
          let langTitle = articleTitle;
          let langDesc = articleDesc;

          if (mdContent) {
            // Check frontmatter title/summary
            const titleMatch = mdContent.match(new RegExp(`${lang}\\s*:\\s*["']([^"']+)["']`, 'i'));
            if (titleMatch) {
              langTitle = titleMatch[1];
            }

            const langRegex = new RegExp(`<!--\\s*lang:\\s*${lang}\\s*-->([\\s\\S]*?)(?=<!--\\s*lang:|$)`, 'i');
            const match = mdContent.match(langRegex);
            if (match) {
              const sectionText = match[1];
              const h1 = sectionText.match(/^#\s+(.+)$/m);
              if (h1 && !titleMatch) {
                langTitle = h1[1].trim();
              }

              // Extract snippet if summary not explicitly matched
              const snippet = extractSnippet(sectionText);
              if (snippet) {
                langDesc = snippet;
              }
            }
          }

          writePage(
            `/articles/${topic.id}/${lang}/${article.id}`,
            `${langTitle} | SameeraVani`,
            langDesc,
            cover
          );
        });
      }
    });
  });
}

// Generate sitemap.xml
const today = new Date().toISOString().split('T')[0];
const urlEntries = Array.from(sitemapUrls.values()).map(
  (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'public/sitemap.xml'), sitemapXml, 'utf8');
console.log(`Generated sitemap.xml with ${sitemapUrls.size} URLs.`);

// Ensure robots.txt in dist/
const robotsSrc = path.join(__dirname, 'public/robots.txt');
if (fs.existsSync(robotsSrc)) {
  fs.copyFileSync(robotsSrc, path.join(distDir, 'robots.txt'));
  console.log(`Verified robots.txt in dist/`);
}

console.log(`Pre-rendering finished successfully! Generated metadata-optimized files.`);


