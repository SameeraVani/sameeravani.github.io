import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export interface ShlokaIndexItem {
  number: string;
  firstWords: string;
  fullText: string;
}

export const parseShlokas = (content: string): ShlokaIndexItem[] => {
  if (!content) return [];

  const lines = content.split('\n');
  const items: ShlokaIndexItem[] = [];

  // Match Devanagari or Arabic numerals in double dandas e.g. ॥ १ ॥ or ॥ 1 ॥
  const shlokaRegex = /॥\s*([०-९\d]+)\s*॥/;

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
      const cleanText = combinedText
        .replace(/[\*\_`#\[\]]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/॥\s*[०-९\d]+\s*॥/g, '')
        .replace(/#meaning-\S+/g, '')
        .replace(/\]\s*\(.*?\)/g, '')
        .trim();

      const words = cleanText.split(/\s+/).filter(Boolean);
      const firstFewWords = words.slice(0, 4).join(' ');

      items.push({
        number: num,
        firstWords: firstFewWords ? `${firstFewWords}...` : `Shloka ${num}`,
        fullText: cleanText
      });
    }
  }

  return items;
};

const getShlokaHeaderTitle = (lang: string): string => {
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

  const headerTitle = customLabel || getShlokaHeaderTitle(activeLanguage);
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
          {shlokas.map((shloka, index) => (
            <option key={index} value={index}>
              {shloka.number}. {shloka.firstWords}
            </option>
          ))}
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

