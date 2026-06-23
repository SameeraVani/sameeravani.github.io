import type { Book } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const pdfCss = `
<style>
  body {
    font-family: 'Lora', serif;
    line-height: 1.6;
    color: #333;
    padding: 20px;
  }
  h1, h2, h3, h4 {
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
  }
  h1 {
    font-size: 2em;
    border-bottom: 2px solid #eaeaea;
    padding-bottom: 0.3em;
    margin-bottom: 1em;
  }
  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 0.3em;
    margin-top: 1.5em;
  }
  p {
    margin-bottom: 1em;
  }
  .page-break {
    page-break-before: always;
  }
  .book-title-page {
    text-align: center;
    margin-top: 30%;
    page-break-after: always;
  }
  .book-title-page h1 {
    border: none;
    font-size: 3em;
  }
  .book-title-page h2 {
    border: none;
    font-weight: normal;
    color: #666;
  }
</style>
`;

/**
 * Generate a PDF from an HTML string and trigger a download.
 */
function generatePdfFromHtml(htmlContent: string, filename: string) {
  const container = document.createElement('div');
  container.innerHTML = pdfCss + htmlContent;
  
  // Hide element from user view but allow html2pdf to read it
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const opt = {
    margin:       [15, 15, 15, 15] as [number, number, number, number],
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  });
}

/**
 * Utility to trigger a browser download for a specific chapter as PDF.
 */
export async function downloadChapterAsPdf(markdownText: string, filename: string, chapterTitle: string) {
  const rawHtml = await marked(markdownText);
  const cleanHtml = DOMPurify.sanitize(rawHtml);
  
  const contentHtml = `
    <div class="chapter-content">
      <h1>${chapterTitle}</h1>
      ${cleanHtml}
    </div>
  `;
  
  generatePdfFromHtml(contentHtml, filename);
}

/**
 * Utility to fetch and download all chapters of a book in a specific language as PDF.
 */
export async function downloadFullBookAsPdf(book: Book, language: string) {
  const chapters = book.chapters[language] || [];
  if (chapters.length === 0) {
    console.warn('No chapters found for this language.');
    return;
  }

  const bookTitle = book.localized?.[language]?.title || book.title;
  const author = book.author;
  const description = book.localized?.[language]?.description || book.description;

  let fullHtml = `
    <div class="book-title-page">
      <h1>${bookTitle}</h1>
      <h2>By ${author}</h2>
      <p style="margin-top: 2em; max-width: 600px; margin-left: auto; margin-right: auto; text-align: left;">
        ${description}
      </p>
    </div>
  `;

  // Fetch all chapters sequentially
  for (const chapter of chapters) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}${chapter.path}?t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        const rawHtml = await marked(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        
        fullHtml += `
          <div class="chapter-section page-break">
            <h1>${chapter.title}</h1>
            ${cleanHtml}
          </div>
        `;
      } else {
        fullHtml += `<div class="chapter-section page-break"><h1>${chapter.title}</h1><p>[Error loading chapter content]</p></div>`;
      }
    } catch (err) {
      console.error(`Failed to fetch chapter: ${chapter.id}`, err);
      fullHtml += `<div class="chapter-section page-break"><h1>${chapter.title}</h1><p>[Failed to load chapter content]</p></div>`;
    }
  }

  const filename = `${book.id}-${language}.pdf`;
  generatePdfFromHtml(fullHtml, filename);
}
