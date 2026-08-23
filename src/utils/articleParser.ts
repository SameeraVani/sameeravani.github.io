export interface ArticleMetadata {
  id?: string;
  topicId?: string;
  titles?: { [lang: string]: string };
  summaries?: { [lang: string]: string };
  coverUrl?: string;
  author?: string;
  date?: string;
  tags?: string[];
}

export interface ParsedArticle {
  metadata: ArticleMetadata;
  title: string;
  summary: string;
  content: string;
}

/**
 * Simple frontmatter parser for markdown files (--- key: value ---)
 */
export function parseFrontmatter(rawText: string): { frontmatter: ArticleMetadata; body: string } {
  const meta: ArticleMetadata = {
    titles: {},
    summaries: {},
  };

  if (!rawText.startsWith('---')) {
    return { frontmatter: meta, body: rawText };
  }

  const endIndex = rawText.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { frontmatter: meta, body: rawText };
  }

  const yamlBlock = rawText.substring(3, endIndex).trim();
  const body = rawText.substring(endIndex + 4).trim();

  let currentSection: 'titles' | 'summaries' | null = null;

  yamlBlock.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (trimmed === 'title:' || trimmed === 'titles:') {
      currentSection = 'titles';
      return;
    }
    if (trimmed === 'summary:' || trimmed === 'summaries:') {
      currentSection = 'summaries';
      return;
    }

    // Check key-value inside section
    if (currentSection && (line.startsWith('  ') || line.startsWith('\t'))) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*["']?(.*?)["']?$/);
      if (match) {
        const [, langKey, val] = match;
        const cleanVal = val.replace(/^["']|["']$/g, '');
        if (currentSection === 'titles' && meta.titles) {
          meta.titles[langKey.toLowerCase()] = cleanVal;
        } else if (currentSection === 'summaries' && meta.summaries) {
          meta.summaries[langKey.toLowerCase()] = cleanVal;
        }
      }
      return;
    }

    // Top-level key: value
    currentSection = null;
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*["']?(.*?)["']?$/);
    if (match) {
      const [, key, val] = match;
      const cleanVal = val.replace(/^["']|["']$/g, '');
      if (key === 'id') meta.id = cleanVal;
      if (key === 'topicId') meta.topicId = cleanVal;
      if (key === 'coverUrl') meta.coverUrl = cleanVal;
      if (key === 'author') meta.author = cleanVal;
      if (key === 'date') meta.date = cleanVal;
    }
  });

  return { frontmatter: meta, body };
}

/**
 * Extracts a specific language section from markdown content using <!-- lang: <code|name> -->
 */
export function extractLanguageContent(body: string, lang: string): string {
  if (!body) return '';
  const targetLang = (lang || 'tamil').toLowerCase();

  const regex = new RegExp(`<!--\\s*lang:\\s*${targetLang}\\s*-->([\\s\\S]*?)(?=<!--\\s*lang:|$)`, 'i');
  const match = body.match(regex);
  if (match && match[1].trim()) {
    return match[1].trim();
  }

  const shortCodeMap: { [k: string]: string } = {
    tamil: 'ta',
    english: 'en',
    sanskrit: 'sa',
    hindi: 'hi',
    kannada: 'kn',
    telugu: 'te',
  };

  const shortCode = shortCodeMap[targetLang];
  if (shortCode) {
    const shortRegex = new RegExp(`<!--\\s*lang:\\s*${shortCode}\\s*-->([\\s\\S]*?)(?=<!--\\s*lang:|$)`, 'i');
    const shortMatch = body.match(shortRegex);
    if (shortMatch && shortMatch[1].trim()) {
      return shortMatch[1].trim();
    }
  }

  if (body.includes('<!-- lang:')) {
    const taMatch = body.match(/<!--\s*lang:\s*(?:tamil|ta)\s*-->([\s\S]*?)(?=<!--\s*lang:|$)/i);
    if (taMatch && taMatch[1].trim()) return taMatch[1].trim();

    const enMatch = body.match(/<!--\s*lang:\s*(?:english|en)\s*-->([\s\S]*?)(?=<!--\s*lang:|$)/i);
    if (enMatch && enMatch[1].trim()) return enMatch[1].trim();

    const firstMatch = body.match(/<!--\s*lang:\s*\w+\s*-->([\s\S]*?)(?=<!--\s*lang:|$)/i);
    if (firstMatch && firstMatch[1].trim()) return firstMatch[1].trim();
  }

  return body;
}

/**
 * Parse an article markdown text into title, summary, and content for a given language
 */
export function parseArticleMarkdown(rawMarkdown: string, lang: string, fallbackTitle?: string): ParsedArticle {
  const { frontmatter, body } = parseFrontmatter(rawMarkdown);
  const langBody = extractLanguageContent(body, lang);

  const targetLang = (lang || 'tamil').toLowerCase();

  // Try title from frontmatter
  let title = frontmatter.titles?.[targetLang] || frontmatter.titles?.tamil || frontmatter.titles?.english || '';

  // If not in frontmatter, extract first # Heading
  if (!title) {
    const headingMatch = langBody.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    }
  }

  if (!title && fallbackTitle) {
    title = fallbackTitle;
  }

  // Try summary from frontmatter
  let summary = frontmatter.summaries?.[targetLang] || frontmatter.summaries?.tamil || frontmatter.summaries?.english || '';

  // If not in frontmatter, extract first blockquote or lead paragraph
  if (!summary) {
    const blockquoteMatch = langBody.match(/^>\s*(.+)$/m);
    if (blockquoteMatch) {
      summary = blockquoteMatch[1].replace(/[*_#`]/g, '').trim();
    }
  }

  return {
    metadata: frontmatter,
    title: title || 'Article',
    summary: summary || '',
    content: langBody,
  };
}
