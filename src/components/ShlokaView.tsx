import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  Search,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

export interface ParsedShloka {
  index: number;
  number: string;
  speaker?: string;
  firstWords: string;
  fullVerse: string;
  verseLines: string[];
  rawMarkdown: string;
}

export const parseChapterShlokas = (content: string): ParsedShloka[] => {
  if (!content) return [];

  // Match blocks starting with **श्लोकः <num>** or **श्लोक <num>**
  const shlokaBlockRegex = /(?=\*\*श्लोकः?\s*[०-९\d]+\*\*)/;
  const blocks = content.split(shlokaBlockRegex).filter(b => b.trim().length > 0);

  const parsedShlokas: ParsedShloka[] = [];

  blocks.forEach((block) => {
    const match = block.match(/\*\*श्लोकः?\s*([०-९\d]+)\*\*/);
    if (match) {
      const number = match[1];

      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const verseLines: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Metadata headers break verse collection immediately
        if (
          line.includes('सन्धिः') ||
          line.includes('पदपरिचयः') ||
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

        const cleanLine = line.replace(/\*\*/g, '').trim();

        if (cleanLine && !cleanLine.startsWith('श्लोकः')) {
          // Check if speaker tag is merged at start of line (e.g. सञ्जय उवाच एवमुक्त्वा...)
          const speakerMatch = cleanLine.match(/^(सञ्जय उवाच|श्री\s*भगवानुवाच|श्रीभगवानुवाच|अर्जुन उवाच|धृतराष्ट्र उवाच)\s*(.*)/);
          if (speakerMatch) {
            const spk = speakerMatch[1].trim();
            const verseRest = speakerMatch[2].trim();
            if (spk) verseLines.push(spk);
            if (verseRest) verseLines.push(verseRest);
          } else {
            verseLines.push(cleanLine);
          }

          // Double danda (॥) marks the exact end of the Mula Shloka verse!
          if (cleanLine.includes('॥')) {
            break;
          }
        }
      }

      const fullVerse = verseLines.join(' ');
      const words = fullVerse.split(/\s+/).filter(Boolean);
      const firstWords = words.length > 0 ? words.slice(0, 6).join(' ') + '...' : `श्लोकः ${number}`;

      parsedShlokas.push({
        index: parsedShlokas.length,
        number,
        firstWords,
        fullVerse,
        verseLines,
        rawMarkdown: block.trim()
      });
    }
  });

  return parsedShlokas;
};

interface ShlokaListViewProps {
  shlokas: ParsedShloka[];
  chapterTitle: string;
  activeLanguage: string;
  onSelectShloka: (index: number) => void;
  onSwitchToContinuous?: () => void;
}

export const ShlokaListView: React.FC<ShlokaListViewProps> = ({
  shlokas,
  chapterTitle,
  activeLanguage,
  onSelectShloka
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredShlokas = shlokas.filter(s => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase().trim();
    return (
      s.number.includes(query) ||
      s.fullVerse.toLowerCase().includes(query)
    );
  });

  const labels: Record<string, { listTitle: string; searchPlaceholder: string; continuous: string; totalShlokas: string }> = {
    english: { listTitle: 'Shloka Directory', searchPlaceholder: 'Filter by shloka number or text...', continuous: 'Full Chapter Scroll', totalShlokas: 'Shlokas' },
    sanskrit: { listTitle: 'श्लोकसूची', searchPlaceholder: 'श्लोकसङ्ख्यायाः पाठस्य वा अन्वेषणम्...', continuous: 'पूर्णमध्यायपठनम्', totalShlokas: 'श्लोकाः' },
    hindi: { listTitle: 'श्लोक सूची', searchPlaceholder: 'श्लोक संख्या या पाठ खोजें...', continuous: 'पूरा अध्याय पढ़ें', totalShlokas: 'श्लोक' },
    kannada: { listTitle: 'ಶ್ಲೋಕ ಸೂಚಿ', searchPlaceholder: 'ಶ್ಲೋಕ ಸಂಖ್ಯೆ ಅಥವಾ ಪಠ್ಯ ಹುಡುಕಿ...', continuous: 'ಪೂರ್ಣ ಅಧ್ಯಾಯ ಓದಿ', totalShlokas: 'ಶ್ಲೋಕಗಳು' },
    tamil: { listTitle: 'ஸ்லோகப் பட்டியல்', searchPlaceholder: 'ஸ்லோக எண் அல்லது உரையைத் தேடுக...', continuous: 'முழு அத்தியாயம் படிக்க', totalShlokas: 'ஸ்லோகங்கள்' },
    telugu: { listTitle: 'శ్లోక సూచిక', searchPlaceholder: 'శ్లోక సంఖ్య లేదా పాఠ్యం శోధించండి...', continuous: 'పూర్తి అధ్యాయం చదవండి', totalShlokas: 'శ్లోకాలు' }
  };

  const l = labels[activeLanguage] || labels.english;

  return (
    <div className="shloka-list-container" style={{ padding: '8px 0 40px 0', width: '100%' }}>
      {/* Header Controls Bar */}
      <div
        className="shloka-list-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {l.listTitle}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {chapterTitle} • {shlokas.length} {l.totalShlokas}
            </div>
          </div>
        </div>

        {/* Search Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 300px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '360px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder={l.searchPlaceholder}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Shlokas List */}
      {filteredShlokas.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)'
          }}
        >
          No shlokas found matching "{searchFilter}".
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '14px'
          }}
        >
          {filteredShlokas.map((shloka) => (
            <div
              key={shloka.index}
              className="shloka-card-item"
              onClick={() => onSelectShloka(shloka.index)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative'
              }}
            >
              {/* Complete Shloka Verse lines displayed directly, no separate header row */}
              {shloka.verseLines.map((line, lIdx) => (
                <div
                  key={lIdx}
                  style={{
                    fontSize: '1.06rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: '1.65',
                    fontFamily: 'var(--font-lora)'
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


interface SingleShlokaViewerProps {
  shloka: ParsedShloka;
  totalShlokas: number;
  allShlokas: ParsedShloka[];
  activeLanguage: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: string;
  onPrev: () => void;
  onNext: () => void;
  onSelectShloka: (index: number) => void;
  onBackToList: () => void;
  onSwitchToContinuous?: () => void;
}

export const SingleShlokaViewer: React.FC<SingleShlokaViewerProps> = ({
  shloka,
  totalShlokas,
  allShlokas,
  activeLanguage,
  fontFamily,
  fontSize,
  lineHeight,
  onPrev,
  onNext,
  onSelectShloka,
  onBackToList
}) => {
  // Keyboard arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && shloka.index > 0) {
        onPrev();
      } else if (e.key === 'ArrowRight' && shloka.index < totalShlokas - 1) {
        onNext();
      } else if (e.key === 'Escape') {
        onBackToList();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shloka.index, totalShlokas, onPrev, onNext, onBackToList]);

  const navLabels: Record<string, { prev: string; next: string; backList: string; selectShloka: string }> = {
    english: { prev: 'Previous', next: 'Next', backList: 'Shloka List', selectShloka: 'Select Shloka' },
    sanskrit: { prev: 'पूर्वः', next: 'अग्रिमः', backList: 'श्लोकसूची', selectShloka: 'श्लोकचयनम्' },
    hindi: { prev: 'पिछला', next: 'अगला', backList: 'श्लोक सूची', selectShloka: 'श्लोक चुनें' },
    kannada: { prev: 'ಹಿಂದಿನ', next: 'ಮುಂದಿನ', backList: 'ಶ್ಲೋಕ ಸೂಚಿ', selectShloka: 'ಶ್ಲೋಕ ಆಯ್ಕೆ' },
    tamil: { prev: 'முந்தைய', next: 'அடுத்த', backList: 'ஸ்லோகப் பட்டியல்', selectShloka: 'ஸ்லோகம் தேர்வு' },
    telugu: { prev: 'మునుపటి', next: 'తరువాతి', backList: 'శ్లోక సూచిక', selectShloka: 'శ్లోకం ఎంచుకోండి' }
  };

  const l = navLabels[activeLanguage] || navLabels.english;

  return (
    <div className="single-shloka-container" style={{ width: '100%', paddingBottom: '60px' }}>
      {/* Sticky Top Navigation Bar */}
      <div
        className="single-shloka-nav-bar top"
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 16px',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onBackToList}
          className="shloka-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={15} />
          <span>{l.backList}</span>
        </button>

        {/* Shloka Selector Dropdown & Prev/Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '480px', justifyContent: 'center' }}>
          <button
            onClick={onPrev}
            disabled={shloka.index === 0}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: shloka.index === 0 ? 'not-allowed' : 'pointer',
              opacity: shloka.index === 0 ? 0.4 : 1,
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Previous Shloka (Left Arrow)"
          >
            <ChevronLeft size={16} />
            <span style={{ display: 'inline' }}>{l.prev}</span>
          </button>

          <select
            value={shloka.index}
            onChange={(e) => onSelectShloka(parseInt(e.target.value, 10))}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              textOverflow: 'ellipsis'
            }}
          >
            {allShlokas.map((s) => (
              <option key={s.index} value={s.index}>
                श्लोकः {s.number} ({s.index + 1}/{totalShlokas}) - {s.firstWords}
              </option>
            ))}
          </select>

          <button
            onClick={onNext}
            disabled={shloka.index === totalShlokas - 1}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: shloka.index === totalShlokas - 1 ? 'not-allowed' : 'pointer',
              opacity: shloka.index === totalShlokas - 1 ? 0.4 : 1,
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Next Shloka (Right Arrow)"
          >
            <span style={{ display: 'inline' }}>{l.next}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Render Single Shloka Markdown Article */}
      <article
        className={`reader-markdown single-shloka-markdown read-font-${fontFamily} lh-${lineHeight}`}
        style={{
          fontSize: `${fontSize}px`,
          backgroundColor: 'var(--bg-primary)',
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img: ({ node, src, ...props }) => {
              let resolvedSrc = src;
              if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
                resolvedSrc = `${import.meta.env.BASE_URL}${src}`;
              }
              return <img src={resolvedSrc} {...props} style={{ maxWidth: '100%', height: 'auto' }} />;
            }
          }}
        >
          {shloka.rawMarkdown}
        </ReactMarkdown>
      </article>

      {/* Sticky Bottom Navigation Footer */}
      <div
        className="single-shloka-nav-bar bottom"
        style={{
          marginTop: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onPrev}
          disabled={shloka.index === 0}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: shloka.index === 0 ? 'not-allowed' : 'pointer',
            opacity: shloka.index === 0 ? 0.4 : 1,
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} />
          <span>{l.prev}</span>
        </button>

        <button
          onClick={onBackToList}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ListIcon size={15} />
          <span>{l.backList} ({shloka.index + 1} / {totalShlokas})</span>
        </button>

        <button
          onClick={onNext}
          disabled={shloka.index === totalShlokas - 1}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: shloka.index === totalShlokas - 1 ? 'not-allowed' : 'pointer',
            opacity: shloka.index === totalShlokas - 1 ? 0.4 : 1,
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{l.next}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
