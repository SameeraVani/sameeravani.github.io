import type { Book, Chapter } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

/**
 * Show the Save dialog BEFORE starting generation (while user gesture is fresh).
 * Returns the file handle, or null if cancelled or not supported.
 */
export async function acquireSaveFileHandle(filename: string): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) return null;
  try {
    return await (window as any).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return null; // User cancelled
    return null;
  }
}

/**
 * Write a Blob to a pre-acquired file handle, or fall back to saveAs.
 */
async function saveBlob(blob: Blob, filename: string, fileHandle?: FileSystemFileHandle | null): Promise<void> {
  if (fileHandle) {
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  // Fallback for Firefox, Safari, and mobile browsers
  saveAs(blob, filename);
}

const pdfStyles = `
  .pdf-container {
    font-family: 'Lora', serif;
    line-height: 1.6;
    color: #333;
    background-color: #ffffff;
    padding: 20px;
    width: 760px;
  }
  .pdf-container h1, .pdf-container h2, .pdf-container h3, .pdf-container h4 {
    color: #1a1a1a;
    font-family: 'Inter', sans-serif;
  }
  .pdf-container h1 {
    font-size: 2em;
    border-bottom: 2px solid #eaeaea;
    padding-bottom: 0.3em;
    margin-bottom: 1em;
  }
  .pdf-container h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 0.3em;
    margin-top: 1.5em;
  }
  .pdf-container p {
    margin-bottom: 1em;
  }
  .pdf-container img {
    max-width: 100%;
    height: auto;
  }
  .pdf-container table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
  }
  .pdf-container table td, .pdf-container table th {
    border: 1px solid #ccc;
    padding: 6px 10px;
  }
  .book-title-page {
    text-align: center;
    padding-top: 60%;
  }
  .book-title-page h1 {
    border: none;
    font-size: 2.5em;
  }
  .book-title-page h2 {
    border: none;
    font-weight: normal;
    color: #666;
    font-size: 1.2em;
  }
`;

/**
 * Renders a single HTML chunk to a canvas, then appends it to the provided jsPDF doc.
 * Automatically splits the rendered image across multiple pages if it's taller than one A4 page.
 */
async function appendChunkToPdf(pdf: jsPDF, htmlContent: string, isFirst: boolean): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-99999px';
  container.style.left = '0';
  container.style.backgroundColor = '#ffffff';

  const style = document.createElement('style');
  style.textContent = pdfStyles;
  container.appendChild(style);

  const inner = document.createElement('div');
  inner.className = 'pdf-container';
  inner.innerHTML = htmlContent;
  container.appendChild(inner);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
    });

    const margin = 15; // mm
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    // Canvas dimensions in mm
    const canvasWidthMm = contentWidth;
    const mmPerPx = canvasWidthMm / canvas.width;
    const canvasHeightMm = canvas.height * mmPerPx;

    // Number of pages this chunk needs
    const numPages = Math.ceil(canvasHeightMm / contentHeight);

    for (let p = 0; p < numPages; p++) {
      if (!isFirst || p > 0) {
        pdf.addPage();
      }

      // Slice the canvas for this page
      const sourceYPx = p * (contentHeight / mmPerPx);
      const sourceHeightPx = Math.min(contentHeight / mmPerPx, canvas.height - sourceYPx);
      const sliceHeightMm = sourceHeightPx * mmPerPx;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sourceHeightPx;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, sourceYPx, canvas.width, sourceHeightPx, 0, 0, canvas.width, sourceHeightPx);
      }

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, sliceHeightMm);
    }
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates a PDF from an array of HTML chunks and downloads it as a named file.
 * Processes each chunk independently to avoid browser canvas height limits.
 */
async function generatePdfFromChunks(htmlChunks: string[], filename: string, fileHandle?: FileSystemFileHandle | null): Promise<void> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  for (let i = 0; i < htmlChunks.length; i++) {
    await appendChunkToPdf(pdf, htmlChunks[i], i === 0);
  }

  const blob = pdf.output('blob');
  await saveBlob(blob, filename, fileHandle);
}

/**
 * Utility to trigger a browser download for a specific chapter as PDF.
 */
export async function downloadChapterAsPdf(markdownText: string, filename: string, chapterTitle: string, fileHandle?: FileSystemFileHandle | null): Promise<void> {
  const processedMarkdown = markdownText.replace(/!\[([^\]]*)\]\((?!http|\/)([^)]+)\)/g, `![$1](${window.location.origin}${import.meta.env.BASE_URL}$2)`);
  const rawHtml = await marked(processedMarkdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  const contentHtml = `
    <h1>${chapterTitle}</h1>
    ${cleanHtml}
  `;

  return generatePdfFromChunks([contentHtml], filename, fileHandle);
}

/**
 * Utility to fetch and download all chapters of a book in a specific language as PDF.
 */
export async function downloadFullBookAsPdf(book: Book, language: string, fileHandle?: FileSystemFileHandle | null): Promise<void> {
  const rawChapters = book.chapters?.[language] || [];
  if (rawChapters.length === 0) {
    console.warn('No chapters found for this language.');
    return;
  }

  const flattenChapters = (chapList: Chapter[]): Chapter[] => {
    return chapList.reduce((acc: Chapter[], ch) => {
      if (ch.topics && ch.topics.length > 0) {
        acc = acc.concat(flattenChapters(ch.topics));
      } else {
        acc.push(ch);
      }
      return acc;
    }, []);
  };

  const chapters = flattenChapters(rawChapters);

  const bookTitle = book.localized?.[language]?.title || book.title;
  const author = book.author;
  const description = book.localized?.[language]?.description || book.description;

  const chunks: string[] = [];

  chunks.push(`
    <div class="book-title-page">
      <h1>${bookTitle}</h1>
      <h2>By ${author}</h2>
      <p style="margin-top: 2em; max-width: 500px; margin-left: auto; margin-right: auto; text-align: left;">
        ${description}
      </p>
    </div>
  `);

  for (const chapter of chapters) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}${chapter.path}?t=${Date.now()}`);
      if (res.ok) {
        let text = await res.text();
        text = text.replace(/!\[([^\]]*)\]\((?!http|\/)([^)]+)\)/g, `![$1](${window.location.origin}${import.meta.env.BASE_URL}$2)`);
        const rawHtml = await marked(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        chunks.push(`<h1>${chapter.title}</h1>${cleanHtml}`);
      } else {
        chunks.push(`<h1>${chapter.title}</h1><p>[Error loading chapter content]</p>`);
      }
    } catch (err) {
      console.error(`Failed to fetch chapter: ${chapter.id}`, err);
      chunks.push(`<h1>${chapter.title}</h1><p>[Failed to load chapter content]</p>`);
    }
  }

  const filename = `${book.id}-${language}.pdf`;
  return generatePdfFromChunks(chunks, filename, fileHandle);
}
