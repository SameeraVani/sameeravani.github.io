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
  ArrowLeft,
  CheckCircle2,
  Zap,
  ArrowUp
} from 'lucide-react';
import { toEnglishDigits, formatShlokaNumberWithEnglish, stripMarkdown, isSpeakerLine } from '../utils/digitUtils';
import { transformCommentaryToCollapsible, sanitizeCommentaryMarkdown } from '../utils/commentaryUtils';
import { parseHeadingSections } from './ShlokaIndex';
import { QuizPlayer } from './articles/QuizPlayer';
import type { ArticleTopic, ArticleProgressMap } from '../types';

let articlesCatalogCache: ArticleTopic[] | null = null;
const fetchArticlesCatalog = async (): Promise<ArticleTopic[]> => {
  if (articlesCatalogCache) return articlesCatalogCache;
  try {
    let res = await fetch(`${import.meta.env.BASE_URL}articles/catalog.json?t=${Date.now()}`);
    if (!res.ok) {
      res = await fetch(`${import.meta.env.BASE_URL}lessons/catalog.json?t=${Date.now()}`);
    }
    articlesCatalogCache = await res.json();
    return articlesCatalogCache || [];
  } catch (err) {
    console.error('Failed to load articles catalog in ShlokaView:', err);
    return [];
  }
};

const findTopicForChapter = (topics: ArticleTopic[], bookId?: string, chapterId?: string): ArticleTopic | null => {
  if (!topics || !chapterId) return null;
  const targetId = `${bookId || ''}-${chapterId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return (
    topics.find(
      (t) =>
        t.id.toLowerCase() === targetId ||
        t.id.toLowerCase() === chapterId.toLowerCase() ||
        t.id.toLowerCase().includes(chapterId.toLowerCase())
    ) || null
  );
};

export interface ParsedShloka {
  index: number;
  number: string;
  speaker?: string;
  firstWords: string;
  fullVerse: string;
  verseLines: string[];
  rawMarkdown: string;
  preamble?: string;
}

export const parseChapterShlokas = (content: string): ParsedShloka[] => {
  if (!content) return [];

  // Match blocks starting with **श्लोकः <num>** or **श्लोक <num>** (including 1.1, १.१, २१-२२, 21-22 etc.)
  const shlokaBlockRegex = /(?=\*\*श्लोकः?\s*[०-९\d]+(?:[.\-–—][०-९\d]+)?\*\*)/;
  const blocks = content.split(shlokaBlockRegex).filter(b => b.trim().length > 0);

  const parsedShlokas: ParsedShloka[] = [];

  blocks.forEach((block) => {
    const match = block.match(/\*\*श्लोकः?\s*([०-९\d]+(?:[.\-–—][०-९\d]+)?)\*\*/);
    if (match) {
      const number = match[1];

      const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const verseLines: string[] = [];
      let speaker: string | undefined = undefined;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Metadata headers break verse collection immediately
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

        const cleanLine = stripMarkdown(line);
        if (cleanLine.length > 0) {
          if (isSpeakerLine(cleanLine)) {
            speaker = cleanLine;
          } else {
            verseLines.push(cleanLine);
          }
        }
      }

      const fullVerse = verseLines.join(' ');
      const cleanVerseWithoutDanda = fullVerse.replace(/॥\s*[०-९\d]+(?:\.[०-९\d]+)?\s*॥/g, '').trim();
      const words = cleanVerseWithoutDanda.split(/\s+/).filter(w => w && w !== '।' && w !== '॥' && w !== '-');
      const firstWords = words.length > 0 ? `${words.slice(0, 4).join(' ')}...` : `Shloka ${number}`;

      parsedShlokas.push({
        index: parsedShlokas.length,
        number,
        speaker,
        firstWords,
        fullVerse,
        verseLines,
        rawMarkdown: block
      });
    }
  });

  // Fallback: If no **श्लोकः** blocks were found, parse headings (#### Part 1, ### Adhikarana, etc.)
  if (parsedShlokas.length === 0) {
    const headingSections = parseHeadingSections(content);
    if (headingSections.length > 0) {
      const preamble = headingSections[0]?.preamble;
      headingSections.forEach((sec, idx) => {
        const cleanTitle = stripMarkdown(sec.firstWords);
        const snippet = sec.fullText && sec.fullText !== sec.firstWords ? sec.fullText : '';
        parsedShlokas.push({
          index: idx,
          number: sec.number,
          firstWords: cleanTitle,
          fullVerse: cleanTitle,
          verseLines: snippet ? [snippet] : [],
          rawMarkdown: sec.rawMarkdown || sec.fullText || '',
          preamble: idx === 0 ? preamble : undefined
        });
      });
    }
  }

  return parsedShlokas;
};

// ==========================================
// 1. Shloka / Parts List View
// ==========================================

export interface ShlokaListViewProps {
  shlokas: ParsedShloka[];
  chapterTitle: string;
  activeLanguage: string;
  bookId?: string;
  chapterId?: string;
  onSelectShloka: (index: number) => void;
  onOpenQuiz?: (partIndex?: number) => void;
  onSwitchToContinuous?: () => void;
}

export const ShlokaListView: React.FC<ShlokaListViewProps> = ({
  shlokas,
  chapterTitle,
  activeLanguage,
  bookId,
  chapterId,
  onSelectShloka,
  onOpenQuiz
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [topic, setTopic] = useState<ArticleTopic | null>(null);
  const [progressMap, setProgressMap] = useState<ArticleProgressMap>(() => {
    const saved = localStorage.getItem('article-progress') || localStorage.getItem('lesson-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse article progress:', e);
      }
    }
    return {};
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('article-progress') || localStorage.getItem('lesson-progress');
      if (saved) {
        try {
          setProgressMap(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse article progress:', e);
        }
      }
    };
    window.addEventListener('focus', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('focus', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    fetchArticlesCatalog().then((allTopics) => {
      const matched = findTopicForChapter(allTopics, bookId, chapterId);
      setTopic(matched);
    });
  }, [bookId, chapterId]);

  const filteredShlokas = shlokas.filter(s => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.trim().toLowerCase();
    const engQuery = toEnglishDigits(query);
    const engShlokaNum = toEnglishDigits(s.number);
    return (
      s.number.toLowerCase().includes(query) ||
      engShlokaNum.includes(engQuery) ||
      s.fullVerse.toLowerCase().includes(query)
    );
  });

  const isPartMode = shlokas.some(s => s.number.toLowerCase().includes('part') || s.number.toLowerCase().includes('topic') || s.number.toLowerCase().includes('section'));

  const labels: Record<string, { listTitle: string; searchPlaceholder: string; continuous: string; totalShlokas: string; shlokaPrefix: string; chapterQuizBtn: string; readCommentary: string; takeQuiz: string }> = isPartMode ? {
    english: { listTitle: 'Parts & Topics Directory', searchPlaceholder: 'Filter by part number or text...', continuous: 'Full Chapter Scroll', totalShlokas: 'Parts', shlokaPrefix: 'Part', chapterQuizBtn: 'Take Chapter Quiz', readCommentary: 'Read Commentary', takeQuiz: 'Quiz' },
    sanskrit: { listTitle: 'भागविषयसूची', searchPlaceholder: 'भागसङ्ख्यायाः पाठस्य वा अन्वेषणम्...', continuous: 'पूर्णमध्यायपठनम्', totalShlokas: 'भागाः', shlokaPrefix: 'भागः', chapterQuizBtn: 'अध्यायप्रश्नोत्तरी', readCommentary: 'भाष्यपठनम्', takeQuiz: 'प्रश्नोत्तरी' },
    hindi: { listTitle: 'भाग एवं विषय सूची', searchPlaceholder: 'भाग संख्या या पाठ खोजें...', continuous: 'पूरा अध्याय पढ़ें', totalShlokas: 'भाग', shlokaPrefix: 'भाग', chapterQuizBtn: 'अध्याय प्रश्नोत्तरी', readCommentary: 'व्याख्या पढ़ें', takeQuiz: 'प्रश्नोत्तरी' },
    kannada: { listTitle: 'ಭಾಗ ಮತ್ತು ವಿಷಯ ಸೂಚಿ', searchPlaceholder: 'ಭಾಗ ಸಂಖ್ಯೆ ಅಥವಾ ಪಠ್ಯ ಹುಡುಕಿ...', continuous: 'ಪೂರ್ಣ ಅಧ್ಯಾಯ ಓದಿ', totalShlokas: 'ಭಾಗಗಳು', shlokaPrefix: 'ಭಾಗ', chapterQuizBtn: 'ಅಧ್ಯಾಯ ರಸಪ್ರಶ್ನೆ', readCommentary: 'ವಿವರಣೆ ಓದಿ', takeQuiz: 'ರಸಪ್ರಶ್ನೆ' },
    tamil: { listTitle: 'பகுதி / தலைப்புப் பட்டியல்', searchPlaceholder: 'பகுதி எண் அல்லது உரையைத் தேடுக...', continuous: 'முழு அத்தியாயம் படிக்க', totalShlokas: 'பகுதிகள்', shlokaPrefix: 'பகுதி', chapterQuizBtn: 'அத்தியாய வினாடி வினா', readCommentary: 'விளக்கம் படிக்க', takeQuiz: 'வினாடி வினா' },
    telugu: { listTitle: 'భాగం & అంశం సూచిక', searchPlaceholder: 'భాగం సంఖ్య లేదా పాఠ్యం శోధించండి...', continuous: 'పూర్తి అధ్యాయం చదవండి', totalShlokas: 'భాగాలు', shlokaPrefix: 'భాగం', chapterQuizBtn: 'అధ్యాయ క్విజ్', readCommentary: 'వివరణ చదవండి', takeQuiz: 'క్విజ్' }
  } : {
    english: { listTitle: 'Shloka Directory', searchPlaceholder: 'Filter by shloka number or text...', continuous: 'Full Chapter Scroll', totalShlokas: 'Shlokas', shlokaPrefix: 'Shloka', chapterQuizBtn: 'Chapter Quiz', readCommentary: 'Read Commentary', takeQuiz: 'Quiz' },
    sanskrit: { listTitle: 'श्लोकसूची', searchPlaceholder: 'श्लोकसङ्ख्यायाः पाठस्य वा अन्वेषणम्...', continuous: 'पूर्णमध्यायपठनम्', totalShlokas: 'श्लोकाः', shlokaPrefix: 'श्लोकः', chapterQuizBtn: 'श्लोकप्रश्नोत्तरी', readCommentary: 'भाष्यपठनम्', takeQuiz: 'प्रश्नोत्तरी' },
    hindi: { listTitle: 'श्लोक सूची', searchPlaceholder: 'श्लोक संख्या या पाठ खोजें...', continuous: 'पूरा अध्याय पढ़ें', totalShlokas: 'श्लोक', shlokaPrefix: 'श्लोक', chapterQuizBtn: 'श्लोक प्रश्नोत्तरी', readCommentary: 'व्याख्या पढ़ें', takeQuiz: 'प्रश्नोत्तरी' },
    kannada: { listTitle: 'ಶ್ಲೋಕ ಸೂಚಿ', searchPlaceholder: 'ಶ್ಲೋಕ ಸಂಖ್ಯೆ ಅಥವಾ ಪಠ್ಯ ಹುಡುಕಿ...', continuous: 'ಪೂರ್ಣ ಅಧ್ಯಾಯ ಓದಿ', totalShlokas: 'ಶ್ಲೋಕಗಳು', shlokaPrefix: 'ಶ್ಲೋಕ', chapterQuizBtn: 'ಶ್ಲೋಕ ರಸಪ್ರಶ್ನೆ', readCommentary: 'ವಿವರಣೆ ಓದಿ', takeQuiz: 'ರಸಪ್ರಶ್ನೆ' },
    tamil: { listTitle: 'ஸ்லோகப் பட்டியல்', searchPlaceholder: 'ஸ்லோக எண் அல்லது உரையைத் தேடுக...', continuous: 'முழு அத்தியாயம் படிக்க', totalShlokas: 'ஸ்லோகங்கள்', shlokaPrefix: 'ஸ்லோகம்', chapterQuizBtn: 'ஸ்லோக வினாடி வினா', readCommentary: 'விளக்கம் படிக்க', takeQuiz: 'வினாடி வினா' },
    telugu: { listTitle: 'శ్లోక సూచిక', searchPlaceholder: 'శ్లోక సంఖ్య లేదా పాఠ్యం శోధించండి...', continuous: 'పూర్తి అధ్యాయం చదవండి', totalShlokas: 'శ్లోకాలు', shlokaPrefix: 'శ్లోకం', chapterQuizBtn: 'శ్లోక క్విజ్', readCommentary: 'వివరణ చదవండి', takeQuiz: 'క్విజ్' }
  };

  const l = labels[activeLanguage] || labels.english;
  const hasTopicQuizzes = Boolean(topic?.lessons && topic.lessons.some(les => les.quiz && les.quiz.length > 0));
  const totalQuestions = (topic?.lessons || []).reduce((acc, les) => acc + (les.quiz?.length || 0), 0);

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

        {/* Right Controls: Chapter Quiz Action & Search Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 340px', justifyContent: 'flex-end' }}>
          {hasTopicQuizzes && onOpenQuiz && (
            <button
              onClick={() => onOpenQuiz(0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'all 0.15s ease'
              }}
              title="Open the complete interactive quiz page with all questions"
            >
              <Zap size={15} fill="currentColor" />
              <span>{l.chapterQuizBtn} ({totalQuestions > 0 ? totalQuestions : 'Quiz'})</span>
            </button>
          )}

          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
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

      {/* Chapter Preamble (e.g. Upanishad Shloka & Shanti Mantra) */}
      {shlokas[0]?.preamble && !searchFilter.trim() && (
        <div
          className="chapter-preamble-card"
          style={{
            marginBottom: '24px',
            padding: '20px 24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <BookOpen size={16} />
            <span>{activeLanguage === 'sanskrit' ? 'मूलमन्त्रः' : activeLanguage === 'kannada' ? 'ಮೂಲ ಮಂತ್ರ' : 'Mula Mantra'}</span>
          </div>
          <article className="reader-markdown" style={{ fontSize: '1.05rem', lineHeight: 1.75 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {shlokas[0].preamble}
            </ReactMarkdown>
          </article>
        </div>
      )}

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
          No parts found matching "{searchFilter}".
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '14px'
          }}
        >
          {filteredShlokas.map((shloka) => {
            const lesson = topic?.lessons[shloka.index] || topic?.lessons.find(les => les.id === `part-${shloka.index + 1}`);
            const prog = lesson ? progressMap[lesson.id] : null;
            const isCompleted = prog?.completed;
            const score = prog?.score ?? 0;
            const total = prog?.total ?? 0;
            const stars = isCompleted && total > 0 ? (Math.round((score / total) * 100) === 100 ? '⭐⭐⭐' : '⭐⭐') : null;

            return (
              <div
                key={shloka.index}
                className="shloka-card-item"
                role="button"
                tabIndex={0}
                onClick={() => onSelectShloka(shloka.index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectShloka(shloka.index);
                  }
                }}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
              >
                {/* Part Header & Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        backgroundColor: 'var(--accent-light)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {(() => {
                        if (isPartMode) {
                          const partNumMatch = shloka.number.match(/\d+/);
                          const digit = partNumMatch ? partNumMatch[0] : (shloka.index + 1).toString();
                          const indicDigit = activeLanguage === 'sanskrit' || activeLanguage === 'hindi'
                            ? digit.replace(/\d/g, d => '०१२३४५६७८९'[parseInt(d, 10)])
                            : activeLanguage === 'kannada'
                            ? digit.replace(/\d/g, d => '೦೧೨೩೪೫೬೭೮೯'[parseInt(d, 10)])
                            : digit;
                          return `${l.shlokaPrefix} ${indicDigit}`;
                        }
                        return shloka.number.startsWith('श्लोक') || shloka.number.startsWith('Shloka')
                          ? formatShlokaNumberWithEnglish(shloka.number)
                          : `${l.shlokaPrefix} ${formatShlokaNumberWithEnglish(shloka.number)}`;
                      })()}
                    </span>

                    {shloka.speaker && (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-sm)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {shloka.speaker}
                      </span>
                    )}

                    {isPartMode && shloka.firstWords && (
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {shloka.firstWords}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCompleted && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#2e7d32',
                          backgroundColor: '#e8f5e9',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          border: '1px solid #c8e6c9'
                        }}
                      >
                        <CheckCircle2 size={13} color="#2e7d32" />
                        <span>Score: {score}/{total} {stars}</span>
                      </span>
                    )}

                    {lesson && lesson.quiz && lesson.quiz.length > 0 && onOpenQuiz && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuiz(shloka.index);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--accent)',
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Take the quiz for this part on the quiz page"
                      >
                        <Zap size={13} />
                        <span>{l.takeQuiz}</span>
                      </button>
                    )}

                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
                  </div>
                </div>

                {/* Verse lines or Initial Words preview snippet */}
                {shloka.verseLines && shloka.verseLines.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: isPartMode ? '2px' : '0' }}>
                    {shloka.verseLines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        style={{
                          fontSize: isPartMode ? '0.92rem' : '1.04rem',
                          fontWeight: isPartMode ? 500 : 700,
                          color: isPartMode ? 'var(--text-secondary)' : 'var(--text-primary)',
                          lineHeight: '1.6',
                          fontFamily: 'var(--font-lora)'
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ==========================================
// 2. Dedicated Chapter Quiz Page (All Questions with Navigation)
// ==========================================

export interface ChapterQuizViewProps {
  shlokas: ParsedShloka[];
  chapterTitle: string;
  activeLanguage: string;
  bookId?: string;
  chapterId?: string;
  initialPartIdx?: number;
  onBackToList: () => void;
  onSelectShloka: (index: number) => void;
}

export const ChapterQuizView: React.FC<ChapterQuizViewProps> = ({
  shlokas,
  chapterTitle,
  activeLanguage,
  bookId,
  chapterId,
  initialPartIdx,
  onBackToList,
  onSelectShloka
}) => {
  const [topic, setTopic] = useState<ArticleTopic | null>(null);
  const [progressMap, setProgressMap] = useState<ArticleProgressMap>(() => {
    const saved = localStorage.getItem('article-progress') || localStorage.getItem('lesson-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse article progress:', e);
      }
    }
    return {};
  });

  useEffect(() => {
    fetchArticlesCatalog().then((allTopics) => {
      const matched = findTopicForChapter(allTopics, bookId, chapterId);
      setTopic(matched);
    });
  }, [bookId, chapterId]);

  // Auto scroll to initially selected part
  useEffect(() => {
    if (initialPartIdx !== undefined && initialPartIdx >= 0) {
      setTimeout(() => {
        const el = document.getElementById(`quiz-part-${initialPartIdx + 1}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [initialPartIdx]);

  const handleCompleteQuizForPart = (lessonId: string, score: number, total: number) => {
    setProgressMap((prev) => {
      const updated = {
        ...prev,
        [lessonId]: {
          completed: true,
          score,
          total,
          lastAttemptTime: Date.now(),
        },
      };
      localStorage.setItem('lesson-progress', JSON.stringify(updated));
      return updated;
    });
  };

  const handleJumpToPart = (idx: number) => {
    const el = document.getElementById(`quiz-part-${idx + 1}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    const readerContainer = document.getElementById('reader-text-container');
    if (readerContainer) {
      readerContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const lessonsWithQuiz = (topic?.lessons || []).filter(les => les.quiz && les.quiz.length > 0);
  const totalPartsWithQuiz = lessonsWithQuiz.length || shlokas.length;

  let completedCount = 0;
  let totalScore = 0;
  let maxPossibleScore = 0;

  lessonsWithQuiz.forEach(les => {
    const prog = progressMap[les.id];
    if (prog?.completed) {
      completedCount++;
      totalScore += prog.score;
    }
    maxPossibleScore += (les.quiz?.length || 3);
  });

  const quizLabels: Record<string, { pageTitle: string; backToChapter: string; totalScore: string; completedParts: string; readCommentary: string; jumpTo: string; scrollToTop: string; partPrefix: string }> = {
    english: { pageTitle: 'Complete Chapter Quiz', backToChapter: 'Back to Parts List', totalScore: 'Score', completedParts: 'Completed', readCommentary: 'Read Commentary', jumpTo: 'Jump to Part:', scrollToTop: 'Scroll to Top', partPrefix: 'Part' },
    sanskrit: { pageTitle: 'अध्यायप्रश्नोत्तरी', backToChapter: 'भागसूचीं प्रति', totalScore: 'गुणाः', completedParts: 'सम्पन्नाः', readCommentary: 'भाष्यपठनम्', jumpTo: 'भागचयनम्:', scrollToTop: 'उपरि गच्छतु', partPrefix: 'भागः' },
    hindi: { pageTitle: 'संपूर्ण अध्याय प्रश्नोत्तरी', backToChapter: 'भाग सूची पर वापस', totalScore: 'अंक', completedParts: 'पूर्ण', readCommentary: 'व्याख्या पढ़ें', jumpTo: 'भाग चुनें:', scrollToTop: 'ऊपर जाएं', partPrefix: 'भाग' },
    kannada: { pageTitle: 'ಸಂಪೂರ್ಣ ಅಧ್ಯಾಯ ರಸಪ್ರಶ್ನೆ', backToChapter: 'ಭಾಗ ಸೂಚಿ', totalScore: 'ಅಂಕಗಳು', completedParts: 'ಪೂರ್ಣಗೊಂಡವು', readCommentary: 'ವಿವರಣೆ ಓದಿ', jumpTo: 'ಭಾಗ ಆಯ್ಕೆ:', scrollToTop: 'ಮೇಲಕ್ಕೆ', partPrefix: 'ಭಾಗ' },
    tamil: { pageTitle: 'முழு அத்தியாய வினாடி வினா', backToChapter: 'பகுதிப் பட்டியல்', totalScore: 'மதிப்பெண்', completedParts: 'முடிந்தவை', readCommentary: 'விளக்கம் படிக்க', jumpTo: 'பகுதி தேர்வு:', scrollToTop: 'மேலே செல்ல', partPrefix: 'பகுதி' },
    telugu: { pageTitle: 'సంపూర్ణ అధ్యాయ క్విజ్', backToChapter: 'భాగ సూచిక', totalScore: 'స్కోరు', completedParts: 'పూర్తయినవి', readCommentary: 'వివరణ చదవండి', jumpTo: 'భాగం ఎంచుకోండి:', scrollToTop: 'పైకి వెళ్ళండి', partPrefix: 'భాగం' }
  };

  const ql = quizLabels[activeLanguage] || quizLabels.english;

  return (
    <div className="chapter-quiz-page" style={{ width: '100%', paddingBottom: '60px' }}>
      {/* Sticky Top Header & Navigation Bar */}
      <div
        className="quiz-header-bar"
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 10,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onBackToList}
              style={{
                display: 'inline-flex',
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
              <span>{ql.backToChapter}</span>
            </button>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {ql.pageTitle}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {chapterTitle}
              </div>
            </div>
          </div>

          {/* Progress Tracker Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                {ql.completedParts}: <strong style={{ color: 'var(--text-primary)' }}>{completedCount}/{totalPartsWithQuiz}</strong>
              </span>
              <span style={{ color: 'var(--border)' }}>•</span>
              <span style={{ color: '#2e7d32' }}>
                {ql.totalScore}: <strong>{totalScore}/{maxPossibleScore}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick-Jump Navigation Carousel / Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {ql.jumpTo}
          </span>
          {shlokas.map((s, sIdx) => {
            const lesson = topic?.lessons[sIdx] || topic?.lessons.find(les => les.id === `part-${sIdx + 1}`);
            const prog = lesson ? progressMap[lesson.id] : null;
            const isComp = prog?.completed;

            return (
              <button
                key={sIdx}
                onClick={() => handleJumpToPart(sIdx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isComp ? '#c8e6c9' : 'var(--border)',
                  backgroundColor: isComp ? '#e8f5e9' : 'var(--bg-secondary)',
                  color: isComp ? '#2e7d32' : 'var(--text-primary)',
                  transition: 'all 0.15s ease'
                }}
                title={s.firstWords}
              >
                {isComp && <CheckCircle2 size={11} color="#2e7d32" />}
                <span>P{sIdx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Part Quizzes Listed in Continuous Order */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {shlokas.map((shloka) => {
          const lesson = topic?.lessons[shloka.index] || topic?.lessons.find(les => les.id === `part-${shloka.index + 1}`);
          const prog = lesson ? progressMap[lesson.id] : null;
          const isCompleted = prog?.completed;
          const score = prog?.score ?? 0;
          const total = prog?.total ?? 0;
          const stars = isCompleted && total > 0 ? (Math.round((score / total) * 100) === 100 ? '⭐⭐⭐' : '⭐⭐') : null;

          return (
            <div
              key={shloka.index}
              id={`quiz-part-${shloka.index + 1}`}
              className="part-quiz-card"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                scrollMarginTop: '140px'
              }}
            >
              {/* Part Section Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      backgroundColor: 'var(--accent-light)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {shloka.number.startsWith('श्लोक') || shloka.number.startsWith('Shloka')
                      ? formatShlokaNumberWithEnglish(shloka.number)
                      : `${ql.partPrefix} ${formatShlokaNumberWithEnglish(shloka.number)}`}
                  </span>

                  {shloka.firstWords && (
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {shloka.firstWords}
                    </h3>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isCompleted && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#2e7d32',
                        backgroundColor: '#e8f5e9',
                        padding: '4px 12px',
                        borderRadius: '14px',
                        border: '1px solid #c8e6c9'
                      }}
                    >
                      <CheckCircle2 size={14} color="#2e7d32" />
                      <span>Score: {score}/{total} {stars}</span>
                    </span>
                  )}

                  <button
                    onClick={() => onSelectShloka(shloka.index)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Read full commentary for this part"
                  >
                    <BookOpen size={13} color="var(--accent)" />
                    <span>{ql.readCommentary}</span>
                  </button>
                </div>
              </div>

              {/* Render Interactive QuizPlayer for this Part */}
              {lesson && lesson.quiz && lesson.quiz.length > 0 ? (
                <div style={{ width: '100%' }}>
                  <QuizPlayer
                    quiz={lesson.quiz}
                    lessonTitle={lesson.title || `${shloka.number}: ${shloka.firstWords}`}
                    shareUrl={`${window.location.origin}${window.location.pathname}#quiz-part-${shloka.index + 1}`}
                    onComplete={(qScore, qTotal) => handleCompleteQuizForPart(lesson.id, qScore, qTotal)}
                  />
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No quiz questions available for this section.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Navigation Footer */}
      <div
        className="quiz-bottom-bar"
        style={{
          marginTop: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 20px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onBackToList}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>{ql.backToChapter}</span>
        </button>

        <button
          onClick={scrollToTop}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowUp size={16} />
          <span>{ql.scrollToTop}</span>
        </button>
      </div>
    </div>
  );
};


// ==========================================
// 3. Single Shloka / Part Commentary Viewer
// ==========================================

export interface SingleShlokaViewerProps {
  shloka: ParsedShloka;
  totalShlokas: number;
  allShlokas: ParsedShloka[];
  activeLanguage: string;
  bookId?: string;
  chapterId?: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: string;
  onPrev: () => void;
  onNext: () => void;
  onSelectShloka: (index: number) => void;
  onBackToList: () => void;
  onOpenQuiz?: (partIndex?: number) => void;
  onSwitchToContinuous?: () => void;
}

export const navLabels: Record<string, { prev: string; next: string; backList: string; selectShloka: string; takeQuiz: string }> = {
  english: { prev: 'Previous', next: 'Next', backList: 'Parts List', selectShloka: 'Select Part', takeQuiz: 'Quiz' },
  sanskrit: { prev: 'पूर्वः', next: 'अग्रिमः', backList: 'भागसूची', selectShloka: 'भागचयनम्', takeQuiz: 'प्रश्नोत्तरी' },
  hindi: { prev: 'पिछला', next: 'अगला', backList: 'भाग सूची', selectShloka: 'भाग चुनें', takeQuiz: 'प्रश्नोत्तरी' },
  kannada: { prev: 'ಹಿಂದಿನ', next: 'ಮುಂದಿನ', backList: 'ಭಾಗ ಸೂಚಿ', selectShloka: 'ಭಾಗ ಆಯ್ಕೆ', takeQuiz: 'ರಸಪ್ರಶ್ನೆ' },
  tamil: { prev: 'முந்தைய', next: 'அடுத்த', backList: 'பகுதிப் பட்டியல்', selectShloka: 'பகுதி தேர்வு', takeQuiz: 'வினாடி வினா' },
  telugu: { prev: 'మునుపటి', next: 'తరువాతి', backList: 'భాగ సూచిక', selectShloka: 'భాగం ఎంచుకోండి', takeQuiz: 'క్విజ్' }
};

export const SingleShlokaViewer: React.FC<SingleShlokaViewerProps> = ({
  shloka,
  totalShlokas,
  allShlokas: _allShlokas,
  activeLanguage,
  fontFamily,
  fontSize,
  lineHeight,
  onPrev,
  onNext,
  onSelectShloka: _onSelectShloka,
  onBackToList,
  onOpenQuiz
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

  const l = navLabels[activeLanguage] || navLabels.english;
  const isPart = shloka.number.toLowerCase().includes('part') || shloka.number.toLowerCase().includes('topic') || shloka.number.toLowerCase().includes('section');

  return (
    <div className="single-shloka-container" style={{ width: '100%', paddingBottom: '60px' }}>
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
          {isPart
            ? sanitizeCommentaryMarkdown(shloka.rawMarkdown)
            : transformCommentaryToCollapsible(shloka.rawMarkdown)}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            <span>{isPart ? l.backList : `${l.backList} (${shloka.index + 1} / ${totalShlokas})`}</span>
          </button>

          {onOpenQuiz && (
            <button
              onClick={() => onOpenQuiz(shloka.index)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Open the chapter quiz"
            >
              <Zap size={15} />
              <span>{l.takeQuiz}</span>
            </button>
          )}
        </div>

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
