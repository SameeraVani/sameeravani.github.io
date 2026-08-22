/**
 * Utility to transform commentary sections (like Gita Bhashya / Vivruti) into collapsible <details> HTML blocks.
 * Sections are collapsed by default to allow readers to view verses and grammar without excessive scrolling.
 * Includes Gita Bhashya Sanskrit sentences, SameeraVani explanation points, and Bhashya Bhavartha summaries all together.
 */
export const transformCommentaryToCollapsible = (markdown: string): string => {
  if (!markdown) return '';

  // Prevent accidental Markdown Setext headings (e.g. text followed immediately by --- on next line becomes <h2>)
  const sanitizedMarkdown = markdown.replace(/([^\r\n])\r?\n(---+)/g, '$1\n\n$2');

  const lines = sanitizedMarkdown.split(/\r?\n/);
  const outLines: string[] = [];
  let inCollapsible = false;
  let summaryTitle = '';

  const isCommentaryHeader = (trimmed: string): string | null => {
    if (!trimmed) return null;
    // Exclude sub-items like '**१. गीताभाष्यम् \-**' or '**समीरवाणी \-**'
    if (/^\*\*[०-९\d]+\.\s*(?:गीताभाष्यम्|भागवततात्पर्य|भाष्यम्)/.test(trimmed)) return null;
    if (/^\*\*समीरवाणी/.test(trimmed)) return null;
    if (/^\*\*श्रीमदानन्दतीर्थ[^\n]*?भावार्थः/.test(trimmed)) return null;

    // Match Gita Bhashya, Gita Vivruti, Bhagavata Tatparya Nirnaya, etc.
    const match = trimmed.match(/^\*\*([^\n*]*(?:गीताभाष्यम्|गीताविवृतिः|भागवततात्पर्यनिर्णय[^\n*]*|तात्पर्यनिर्णय[^\n*]*|भाष्यम्|विवृतिः|प्रमेयदिपिका|प्रकाशिका)[^\n*]*)\*\*(?:\s*\([^)]*\))?:?$/);
    if (match) {
      return trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim();
    }
    return null;
  };

  const isMajorSectionBoundary = (line: string, nextLine: string = ''): boolean => {
    const trimmed = line.trim();
    const nextTrimmed = nextLine ? nextLine.trim() : '';

    // A shloka header is always a boundary
    if (/^\*\*श्लोकः?\s*[०-९\d\-]+(?:\.[०-९\d]+)?\*\*/.test(trimmed)) return true;

    // A markdown heading (# or ##) is a boundary
    if (trimmed.startsWith('#')) return true;

    // Next shloka components are boundaries
    if (/^\*\*(?:सन्धिः|पदपरिचयः|पदविभागः|अन्वयः|व्याकरणविश्लेषणम्|व्याकरणम्)\*\*/.test(trimmed)) return true;

    // A horizontal rule '---' is a boundary ONLY if it is immediately followed by a new shloka or end of shloka
    if (trimmed.startsWith('---')) {
      if (nextTrimmed.startsWith('---') || /^\*\*श्लोकः/.test(nextTrimmed) || nextTrimmed.startsWith('#')) {
        return true;
      }
    }

    // A new commentary header
    if (isCommentaryHeader(trimmed)) return true;

    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    const trimmed = line.trim();
    const headerTitle = isCommentaryHeader(trimmed);

    if (headerTitle) {
      if (inCollapsible) {
        outLines.push('</div>\n</details>\n');
        inCollapsible = false;
      }
      summaryTitle = headerTitle;
      outLines.push(
        `\n<details class="commentary-collapsible" data-commentary="${summaryTitle}">\n` +
        `  <summary class="commentary-summary">\n` +
        `    <span class="commentary-icon">📖</span>\n` +
        `    <span class="commentary-title">${summaryTitle}</span>\n` +
        `    <span class="commentary-badge">Commentary / भाष्यम्</span>\n` +
        `    <span class="commentary-toggle-hint">Click to expand</span>\n` +
        `  </summary>\n` +
        `  <div class="commentary-content">\n`
      );
      inCollapsible = true;
      continue;
    }

    if (inCollapsible && isMajorSectionBoundary(line, nextLine)) {
      outLines.push('</div>\n</details>\n');
      inCollapsible = false;

      const newHeader = isCommentaryHeader(trimmed);
      if (newHeader) {
        summaryTitle = newHeader;
        outLines.push(
          `\n<details class="commentary-collapsible" data-commentary="${summaryTitle}">\n` +
          `  <summary class="commentary-summary">\n` +
          `    <span class="commentary-icon">📖</span>\n` +
          `    <span class="commentary-title">${summaryTitle}</span>\n` +
          `    <span class="commentary-badge">Commentary / भाष्यम्</span>\n` +
          `    <span class="commentary-toggle-hint">Click to expand</span>\n` +
          `  </summary>\n` +
          `  <div class="commentary-content">\n`
        );
        inCollapsible = true;
        continue;
      }
    }

    outLines.push(line);
  }

  if (inCollapsible) {
    outLines.push('</div>\n</details>\n');
    inCollapsible = false;
  }

  return outLines.join('\n');
};
