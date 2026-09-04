import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface MangalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle?: string;
  activeLanguage?: string;
  chapterPath?: string;
  chapterId?: string;
  fontFamily?: string;
}

const DEFAULT_MANGALA = `# मङ्गलश्लोकाः

॥ श्री गुरुभ्यो नमः ॥  
॥ हरिः ॐ ॥

### श्रीहरिवन्दना
**नारायणं निखिलपूर्णगुणैकदेहं**  
**निर्दोषमाप्यतममप्यखिलैः सुवाक्यैः ।**  
**अस्योद्भवादिदमतः समुदीक्षितं च**  
**सञ्चिन्तयन् विमलगौरवमाश्रयेऽहम् ॥**

---

### गुरुवन्दना
**अभ्रामं भङ्गरहितमजडं विमलं सदा ।**  
**आनन्दतीर्थमतुलं भजे तापत्रयापहम् ॥**

**चित्रं वटतरोर्मूले वृद्धाः शिष्या गुरुर्युवा ।**  
**गुरोस्तु मौनं व्याख्यानं शिष्यास्तु छिन्नसंशयाः ॥**

**आपदामपहर्तारं दातारं सर्वसम्पदाम् ।**  
**लोकाभिरामं श्रीरामं भूयो भूयो नमाम्यहम् ॥**
`;

export const MangalaModal: React.FC<MangalaModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  activeLanguage,
  chapterPath,
  chapterId,
  fontFamily = 'lora'
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(20);

  // Fetch book-specific or upanishad-specific mangala.md
  useEffect(() => {
    if (!isOpen || !bookId) return;

    let isMounted = true;
    setLoading(true);

    const isValidMarkdown = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const trimmed = text.trim();
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return false;
      if (trimmed.includes('<script') && (trimmed.includes('/@vite/client') || trimmed.includes('/src/main.tsx') || trimmed.includes('<div id="root"'))) return false;
      return true;
    };

    const fetchMangala = async () => {
      try {
        const langCode = activeLanguage === 'sanskrit' ? 'sa' : activeLanguage === 'kannada' ? 'kn' : activeLanguage === 'english' ? 'en' : activeLanguage;
        const candidatePaths: string[] = [];

        // 1. If chapterPath is provided (e.g. books/upanishad/sa/ishavasya/ch1.md), check the specific folder first
        if (chapterPath) {
          const cleanChapterPath = chapterPath.startsWith('/') ? chapterPath.slice(1) : chapterPath;
          const lastSlash = cleanChapterPath.lastIndexOf('/');
          if (lastSlash !== -1) {
            const chapterDir = cleanChapterPath.slice(0, lastSlash);
            candidatePaths.push(`${import.meta.env.BASE_URL}${chapterDir}/mangala.md`);

            // Also check without language subfolder: e.g. "books/upanishad/ishavasya/mangala.md"
            const withoutLang = chapterDir.replace(/\/(sa|en|kn|sanskrit|english|kannada)\//, '/');
            if (withoutLang !== chapterDir) {
              candidatePaths.push(`${import.meta.env.BASE_URL}${withoutLang}/mangala.md`);
            }
          }
        }

        // 2. If upanishad slug is identifiable from chapterId (e.g. ishavasya-ch1)
        if (chapterId && bookId === 'upanishad') {
          const upanishadSlug = chapterId.split('-')[0];
          if (upanishadSlug) {
            candidatePaths.push(`${import.meta.env.BASE_URL}books/upanishad/sa/${upanishadSlug}/mangala.md`);
            candidatePaths.push(`${import.meta.env.BASE_URL}books/upanishad/${upanishadSlug}/mangala.md`);
            if (langCode) {
              candidatePaths.push(`${import.meta.env.BASE_URL}books/upanishad/${langCode}/${upanishadSlug}/mangala.md`);
            }
          }
        }

        // 3. Book-level mangala.md (only for books where mangala is book-wide, not upanishads which differ per upanishad)
        if (bookId !== 'upanishad') {
          candidatePaths.push(`${import.meta.env.BASE_URL}books/${bookId}/mangala.md`);
          if (langCode) {
            candidatePaths.push(`${import.meta.env.BASE_URL}books/${bookId}/${langCode}/mangala.md`);
          }
        }

        // De-duplicate candidate paths
        const uniquePaths = Array.from(new Set(candidatePaths.filter(Boolean)));

        for (const p of uniquePaths) {
          try {
            const res = await fetch(`${p}?t=${Date.now()}`);
            if (res.ok) {
              const text = await res.text();
              if (isValidMarkdown(text)) {
                if (isMounted) {
                  setContent(text);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch {
            // continue to next candidate
          }
        }

        // Fallback to default mangala if none found
        if (isMounted) {
          setContent(DEFAULT_MANGALA);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setContent(DEFAULT_MANGALA);
          setLoading(false);
        }
      }
    };

    fetchMangala();

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookId, activeLanguage, chapterPath, chapterId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mangala-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Mangala Shloka Modal"
    >
      <div
        className="mangala-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mangala-modal-header">
          <div className="mangala-header-title-box">
            <span className="mangala-om-badge">ॐ</span>
            <div>
              <h2 className="mangala-modal-title">मङ्गलश्लोकाः • Mangala Shloka</h2>
              <p className="mangala-modal-subtitle">
                {bookTitle ? `${bookTitle} — ` : ''}प्रारम्भप्रार्थना (Class Opening Chant)
              </p>
            </div>
          </div>

          <div className="mangala-header-actions">
            <button
              className="icon-btn"
              onClick={() => setFontSize((s) => Math.max(16, s - 2))}
              title="Decrease text size"
              aria-label="Decrease text size"
            >
              <ZoomOut size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
              title="Increase text size"
              aria-label="Increase text size"
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setFontSize(20)}
              title="Reset font size"
              aria-label="Reset font size"
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="icon-btn mangala-close-btn"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className={`mangala-modal-body read-font-${fontFamily}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {loading ? (
            <div className="mangala-loading">
              <div className="spinner" style={{ width: 28, height: 28 }}></div>
              <p>मङ्गलश्लोकाः प्रस्तूयन्ते...</p>
            </div>
          ) : (
            <article className="reader-markdown mangala-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {content}
              </ReactMarkdown>
            </article>
          )}
        </div>

        {/* Footer */}
        <div className="mangala-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button
            className="mangala-dismiss-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
