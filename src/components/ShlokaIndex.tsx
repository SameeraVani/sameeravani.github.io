import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { formatShlokaNumberWithEnglish, stripMarkdown, isSpeakerLine } from '../utils/digitUtils';

export interface ShlokaIndexItem {
  number: string;
  firstWords: string;
  fullText: string;
  rawMarkdown?: string;
  preamble?: string;
}

export const parseShlokas = (content: string): ShlokaIndexItem[] => {
  if (!content) return [];

  // First try parsing structured shloka blocks starting with **श्लोक...**
  const shlokaBlockRegex = /(?=\*\*श्लोकः?\s*[०-९\d]+(?:\.[०-९\d]+)?\*\*)/;
  const blocks = content.split(shlokaBlockRegex).filter(b => b.trim().length > 0);

  if (blocks.length > 1 || (blocks.length === 1 && blocks[0].includes('श्लोक'))) {
    const items: ShlokaIndexItem[] = [];
    blocks.forEach((block) => {
      const match = block.match(/\*\*श्लोकः?\s*([०-९\d]+(?:\.[०-९\d]+)?)\*\*/);
      if (match) {
        const num = match[1];
        const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        let firstFewWords = '';
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes('सन्धिः') ||
            line.includes('पदपरिचयः') ||
            line.includes('पदविभागः') ||
            line.includes('अन्वयः') ||
            line.includes('गीताविवृतिः') ||
            line.includes('भावार्थः') ||
            line.includes('व्याकरणविश्लेषणम्') ||
            line.startsWith('---') ||
            line.startsWith('|') ||
            line.startsWith('#')
          ) {
            break;
          }
          const clean = stripMarkdown(line);
          if (clean && !clean.startsWith('श्लोक')) {
            if (isSpeakerLine(clean)) {
              continue;
            }
            firstFewWords = clean;
            break;
          }
        }
        const cleanWordsWithoutDanda = firstFewWords.replace(/॥\s*[०-९\d]+(?:\.[०-९\d]+)?\s*॥/g, '').trim();
        const words = cleanWordsWithoutDanda.split(/\s+/).filter(w => w && w !== '।' && w !== '॥' && w !== '-');
        const snippet = words.slice(0, 4).join(' ');
        items.push({
          number: num,
          firstWords: snippet ? `${snippet}...` : `Shloka ${num}`,
          fullText: cleanWordsWithoutDanda || firstFewWords
        });
      }
    });
    if (items.length > 0) return items;
  }

  // Fallback to danda matching e.g. ॥ १ ॥ or ॥ १.१ ॥ or ॥ 1 ॥
  const lines = content.split('\n');
  const items: ShlokaIndexItem[] = [];
  const shlokaRegex = /॥\s*([०-९\d]+(?:\.[०-९\d]+)?)\s*॥/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(shlokaRegex);
    if (match) {
      const num = match[1];

      const shlokaLines: string[] = [line];

      // Look back up to 2 lines for the start of the shloka
      for (let j = 1; j <= 2; j++) {
        const prevIdx = i - j;
        if (prevIdx < 0) break;
        const prevLine = lines[prevIdx].trim();
        if (
          prevLine === '' ||
          prevLine.startsWith('#') ||
          prevLine.startsWith('**') ||
          prevLine.startsWith('<') ||
          prevLine.startsWith('|') ||
          prevLine.includes('॥')
        ) {
          break;
        }
        shlokaLines.unshift(lines[prevIdx]);
      }

      const combinedText = shlokaLines.join(' ');
      const cleanText = stripMarkdown(combinedText)
        .replace(/\(.*?\)/g, '')
        .replace(/॥\s*[०-९\d]+(?:\.[०-९\d]+)?\s*॥/g, '')
        .replace(/#meaning-\S+/g, '')
        .replace(/\]\s*\(.*?\)/g, '')
        .trim();

      const words = cleanText.split(/\s+/).filter(w => w && w !== '।' && w !== '॥' && w !== '-');
      const firstFewWords = words.slice(0, 4).join(' ');

      items.push({
        number: num,
        firstWords: firstFewWords ? `${firstFewWords}...` : `Shloka ${num}`,
        fullText: cleanText
      });
    }
  }

  if (items.length > 0) return items;

  // Fallback: Parse section / part / topic headings (### or ####)
  return parseHeadingSections(content);
};

export const parseHeadingSections = (content: string): ShlokaIndexItem[] => {
  if (!content) return [];

  const lines = content.split('\n');
  
  // Find all line indices of heading boundaries (### or #### or bold **Part N**)
  const headingIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^#{2,4}\s+/) || line.match(/^\*\*(?:Part|भाग|विषय)\s*[०-९\d]+/i)) {
      // Exclude document-level metadata headers and Adhikarana danda headers
      if (
        line.startsWith('# अध्याय') ||
        line.startsWith('## पाद') ||
        line.startsWith('### अधिकरणम्') ||
        line.startsWith('## शान्ति') ||
        line.startsWith('## उपनिषत्') ||
        line.includes('॥') ||
        line.startsWith('---') ||
        line.startsWith('>')
      ) {
        continue;
      }
      headingIndices.push(i);
    }
  }

  if (headingIndices.length === 0) return [];

  // Extract preamble (content before the first part, e.g. Shanti Mantra or Mula Shloka)
  const preamble = headingIndices[0] > 0
    ? lines.slice(0, headingIndices[0]).join('\n').replace(/^---[\s\S]*?---\r?\n/, '').trim()
    : '';

  const items: ShlokaIndexItem[] = [];
  let partCounter = 1;

  for (let idx = 0; idx < headingIndices.length; idx++) {
    const startLineIdx = headingIndices[idx];
    const endLineIdx = idx < headingIndices.length - 1 ? headingIndices[idx + 1] : lines.length;

    const rawBlockLines = lines.slice(startLineIdx, endLineIdx);
    const rawBlock = rawBlockLines.join('\n').trim();

    const headingLine = lines[startLineIdx].trim();
    const rawHeading = headingLine.replace(/^#{2,4}\s+/, '').replace(/^\*\*|\*\*$/g, '').trim();
    const cleanHeading = stripMarkdown(rawHeading);

    if (!cleanHeading) continue;

    // Determine Part / Section Number and Clean Title
    let num = `Part ${partCounter}`;
    let title = cleanHeading;
    const partMatch = cleanHeading.match(/^(?:Part|भाग|विषय)\s*[-–—]?\s*([०-९\d]+)\s*[-–—:]*\s*(.*)$/i);
    if (partMatch) {
      const explicitNum = parseInt(partMatch[1], 10);
      if (!isNaN(explicitNum)) {
        num = `Part ${explicitNum}`;
        partCounter = Math.max(partCounter, explicitNum + 1);
      } else {
        num = `Part ${partCounter}`;
        partCounter++;
      }
      if (partMatch[2] && partMatch[2].trim()) {
        title = partMatch[2].trim();
      }
    } else {
      num = `Part ${partCounter}`;
      partCounter++;
    }

    // Extract first few body words for preview snippet reference
    const bodyWords: string[] = [];
    for (let j = 1; j < rawBlockLines.length; j++) {
      const l = stripMarkdown(rawBlockLines[j]);
      if (l && !l.startsWith('---') && !l.startsWith('|')) {
        const words = l.split(/\s+/).filter(w => w && w !== '।' && w !== '॥' && w !== '-');
        bodyWords.push(...words);
        if (bodyWords.length >= 25) break;
      }
    }
    const snippet = bodyWords.length > 0 ? (bodyWords.slice(0, 22).join(' ') + '...') : '';

    items.push({
      number: num,
      firstWords: title,
      fullText: snippet || title,
      rawMarkdown: rawBlock,
      preamble: idx === 0 ? preamble : undefined
    });
  }

  return items;
};

const getShlokaHeaderTitle = (lang: string, isPartMode = false): string => {
  if (isPartMode) {
    const partTitles: Record<string, string> = {
      english: 'Jump to Part / Topic',
      sanskrit: 'विषयः / भागः',
      hindi: 'भाग / विषय पर जाएँ',
      kannada: 'ಭಾಗ / ವಿಷಯಕ್ಕೆ ಹೋಗಿ',
      tamil: 'பகுதி / தலைப்பிற்குச் செல்',
      telugu: 'భాగం / అంశానికి వెళ్ళండి'
    };
    return partTitles[lang] || 'Jump to Part / Topic';
  }
  const titles: Record<string, string> = {
    english: 'Jump to Shloka',
    sanskrit: 'श्लोक-गन्तव्यम्',
    hindi: 'श्लोक पर जाएँ',
    kannada: 'ಶ್ಲೋಕಕ್ಕೆ ಹೋಗಿ',
    tamil: 'ஸ்லோகத்திற்குச் செல்',
    telugu: 'శ్లోకానికి వెళ్ళండి'
  };
  return titles[lang] || 'Jump to Shloka';
};

interface ShlokaDashboardProps {
  shlokas: ShlokaIndexItem[];
  activeLanguage: string;
  customLabel?: string;
  onSelectShloka: (shloka: ShlokaIndexItem) => void;
}

export const ShlokaDashboard: React.FC<ShlokaDashboardProps> = ({
  shlokas,
  activeLanguage,
  customLabel,
  onSelectShloka
}) => {
  if (shlokas.length === 0) return null;

  const isPartMode = shlokas.some(s => s.number.toLowerCase().includes('part') || s.number.toLowerCase().includes('topic') || s.number.toLowerCase().includes('section'));
  const headerTitle = customLabel || getShlokaHeaderTitle(activeLanguage, isPartMode);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && shlokas[idx]) {
      setSelectedIndex(idx);
      onSelectShloka(shlokas[idx]);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      const nextIdx = selectedIndex - 1;
      setSelectedIndex(nextIdx);
      onSelectShloka(shlokas[nextIdx]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < shlokas.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      onSelectShloka(shlokas[nextIdx]);
    }
  };

  return (
    <div
      className="shloka-single-row-bar"
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      <div className="shloka-label-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
        <BookOpen size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {headerTitle} ({shlokas.length})
        </span>
      </div>

      <div className="shloka-controls-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', maxWidth: '520px' }}>
        <button
          onClick={handlePrev}
          disabled={selectedIndex === 0}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            cursor: selectedIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedIndex === 0 ? 0.4 : 1,
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'all 0.15s ease'
          }}
          title="Previous Shloka"
        >
          ‹
        </button>

        <select
          value={selectedIndex}
          onChange={handleSelectChange}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '6px 12px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            outline: 'none',
            textOverflow: 'ellipsis'
          }}
        >
          {shlokas.map((shloka, index) => {
            const isPart = isPartMode || shloka.number.toLowerCase().includes('part') || shloka.number.toLowerCase().includes('topic');
            const formattedNum = formatShlokaNumberWithEnglish(shloka.number);
            const textLabel = isPart
              ? (shloka.firstWords.toLowerCase().includes(shloka.number.toLowerCase()) ? shloka.firstWords : `${formattedNum}: ${shloka.firstWords}`)
              : `${formattedNum}. ${shloka.firstWords}`;
            return (
              <option key={index} value={index}>
                {textLabel}
              </option>
            );
          })}
        </select>

        <button
          onClick={handleNext}
          disabled={selectedIndex === shlokas.length - 1}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            cursor: selectedIndex === shlokas.length - 1 ? 'not-allowed' : 'pointer',
            opacity: selectedIndex === shlokas.length - 1 ? 0.4 : 1,
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 700,
            transition: 'all 0.15s ease'
          }}
          title="Next Shloka"
        >
          ›
        </button>
      </div>
    </div>
  );
};

