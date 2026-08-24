import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Article, ArticleTopic } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  List,
  Share2,
  Check,
  Sparkles,
  Clock,
  BookOpen,
  ArrowUp,
  Calendar,
} from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { getArticleUrlForRoute } from '../../utils/route';
import { parseArticleMarkdown } from '../../utils/articleParser';
import './articles.css';

interface ArticleViewerProps {
  topic: ArticleTopic;
  article: Article;
  topics?: ArticleTopic[];
  currentLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
  onNavigateArticle: (nextArticle: Article, targetTopic?: ArticleTopic) => void;
  onBackToArchive: () => void;
  onCompleteQuiz: (score: number, total: number) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'tamil', label: 'தமிழ்' },
  { code: 'english', label: 'English' },
  { code: 'sanskrit', label: 'संस्कृतम्' },
  { code: 'hindi', label: 'हिंदी' },
  { code: 'kannada', label: 'ಕನ್ನಡ' },
  { code: 'telugu', label: 'తెలుగు' },
];

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  topic,
  article,
  topics,
  currentLanguage: externalLang,
  onChangeLanguage,
  onNavigateArticle,
  onBackToArchive,
  onCompleteQuiz,
}) => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return externalLang || localStorage.getItem('app-language') || localStorage.getItem('article-language') || 'tamil';
  });

  const [copied, setCopied] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [rawMarkdown, setRawMarkdown] = useState<string>('');
  const [loadingMarkdown, setLoadingMarkdown] = useState<boolean>(false);

  useEffect(() => {
    if (externalLang && externalLang !== currentLang) {
      setCurrentLang(externalLang);
    }
  }, [externalLang]);

  useEffect(() => {
    const desiredUrl = getArticleUrlForRoute(topic.id, currentLang, article.id);
    const currentPath = window.location.pathname;
    if (!currentPath.includes(`/${currentLang}/`)) {
      window.history.replaceState(null, '', desiredUrl);
    }
  }, [topic.id, currentLang, article.id]);

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scrollPercent = (totalScroll / windowHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('app-language', lang);
    localStorage.setItem('article-language', lang);
    window.history.replaceState(null, '', getArticleUrlForRoute(topic.id, lang, article.id));
    if (onChangeLanguage) {
      onChangeLanguage(lang);
    }
  };

  const currentIndex = topic.lessons.findIndex((l) => l.id === article.id);
  const prevArticle = currentIndex > 0 ? topic.lessons[currentIndex - 1] : null;
  const nextArticle = currentIndex < topic.lessons.length - 1 ? topic.lessons[currentIndex + 1] : null;

  const activePath = article.path || (article.id ? `articles/${topic.id}/${article.id}.md` : '');

  useEffect(() => {
    if (activePath) {
      setLoadingMarkdown(true);
      fetch(`${import.meta.env.BASE_URL}${activePath}?t=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Could not load ${activePath}`);
          return res.text();
        })
        .then((text) => {
          setRawMarkdown(text);
          setLoadingMarkdown(false);
        })
        .catch((err) => {
          console.warn('Failed to fetch article markdown, using fallback:', err);
          setRawMarkdown(article.content || '');
          setLoadingMarkdown(false);
        });
    } else {
      setRawMarkdown(article.content || '');
      setLoadingMarkdown(false);
    }
  }, [activePath, article.content]);

  // Parse markdown with frontmatter and language section extraction
  const parsed = parseArticleMarkdown(rawMarkdown, currentLang, article.title);

  const activeTitle = parsed.title;
  const activeSummary = parsed.summary;
  const activeContent = parsed.content;
  const activeDate = parsed.metadata?.date || article.date || '2026-08-23';
  const activeQuiz = article.quiz;

  // Calculate approximate reading time (approx 180 words/min)
  const wordCount = (activeContent || '').split(/\s+/).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  const currentUrl = window.location.origin + getArticleUrlForRoute(topic.id, currentLang, article.id);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy share link:', e);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href) return;

    // In-page anchor link
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      const targetEl = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // External link
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Internal article / markdown cross-reference
    // Matches e.g., "articles/bhagavad-gita/atma-sakshi-faq.md", "atma-sakshi-faq.md", "/articles/bhagavad-gita/atma-sakshi-faq", "atma-sakshi-faq"
    const cleanHref = href.replace(/\\/g, '/');
    const filenameMatch = cleanHref.match(/([^/]+?)(?:\.md)?(?:[?#].*)?$/i);
    const targetId = filenameMatch ? filenameMatch[1].trim() : '';

    if (targetId) {
      // 1. Search in current topic lessons
      const foundInCurrentTopic = topic.lessons.find(
        (l) => l.id === targetId || (l.path && l.path.includes(targetId))
      );

      if (foundInCurrentTopic) {
        e.preventDefault();
        onNavigateArticle(foundInCurrentTopic, topic);
        scrollToTop();
        return;
      }

      // 2. Search across all topics
      if (topics) {
        for (const t of topics) {
          const found = t.lessons.find(
            (l) => l.id === targetId || (l.path && l.path.includes(targetId))
          );
          if (found) {
            e.preventDefault();
            onNavigateArticle(found, t);
            scrollToTop();
            return;
          }
        }
      }
    }
  };

  return (
    <div className="article-page-container" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Scroll Progress Bar */}
      <div className="reading-progress-track">
        <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div
        style={{
          maxWidth: '880px',
          margin: '0 auto',
          padding: '24px 20px',
        }}
      >
        {/* Top Header Bar (Non-sticky) */}
        <div
          className="article-header-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            onClick={onBackToArchive}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '20px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.88rem',
              transition: 'var(--transition-fast)',
            }}
          >
            <List size={16} /> Articles Archive
          </button>

          {/* 6-Language Pill Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
              background: 'var(--bg-secondary)',
              padding: '4px 8px',
              borderRadius: '24px',
              border: '1px solid var(--border)',
            }}
          >
            <Globe size={16} color="var(--accent)" style={{ marginLeft: '4px', marginRight: '4px' }} />
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`lang-pill-btn ${currentLang === lang.code ? 'active' : ''}`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Share Button & Font Sizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyLink}
              title="Share & Copy Article Link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: copied ? '#16a34a' : 'var(--bg-primary)',
                color: copied ? '#ffffff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? 'Copied!' : 'Share'}
            </button>

            <button
              onClick={() => setFontSizeOffset((prev) => (prev >= 4 ? 0 : prev + 2))}
              title="Adjust Font Size"
              style={{
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              A{fontSizeOffset > 0 ? `+${fontSizeOffset}` : ''}
            </button>
          </div>
        </div>

        {/* Hero Article Card with Ambient Radiant Glow */}
        <div className="article-hero-card">
          <div className="article-ambient-glow" />

          {/* Meta Chips Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '18px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))',
                color: '#d97706',
                fontWeight: '700',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <Sparkles size={13} /> {topic.category || topic.title}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              <Calendar size={14} /> {activeDate}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              <Clock size={14} /> {readTimeMin} min read
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              <BookOpen size={14} /> Vedantic Reflection
            </span>
          </div>

          {/* Article Title */}
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              margin: '0 0 16px 0',
              letterSpacing: '-0.01em',
            }}
          >
            {activeTitle}
          </h1>

          {/* Article Summary Box */}
          {activeSummary && (
            <div
              style={{
                position: 'relative',
                padding: '16px 20px 16px 24px',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                borderLeft: '4px solid #f59e0b',
                border: '1px solid var(--border)',
                borderLeftWidth: '4px',
                borderLeftColor: '#f59e0b',
                marginTop: '16px',
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                {activeSummary}
              </p>
            </div>
          )}

          <hr
            style={{
              border: 'none',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
              margin: '28px 0',
            }}
          />

          {/* Article Body Content */}
          {loadingMarkdown ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
              }}
            >
              <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div> Loading article content...
            </div>
          ) : (
            <div
              className="article-markdown-body markdown-body"
              style={{
                fontSize: `${1.12 + fontSizeOffset * 0.08}rem`,
                lineHeight: 1.85,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  a: ({ href, children, ...props }) => {
                    const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
                    return (
                      <a
                        href={href}
                        onClick={(e) => handleLinkClick(e, href)}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {activeContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Interactive Quiz (if present) */}
        {activeQuiz && activeQuiz.length > 0 && (
          <QuizPlayer
            quiz={activeQuiz}
            lessonTitle={activeTitle}
            shareUrl={currentUrl}
            onComplete={onCompleteQuiz}
          />
        )}

        {/* Footer Navigation Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}
        >
          {topic.lessons.length > 1 ? (
            <>
              {prevArticle ? (
                <button
                  onClick={() => onNavigateArticle(prevArticle)}
                  className="floating-action-btn"
                >
                  <ArrowLeft size={18} /> Previous Article
                </button>
              ) : (
                <div />
              )}

              {nextArticle ? (
                <button
                  onClick={() => onNavigateArticle(nextArticle)}
                  className="floating-action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                  }}
                >
                  Next Article <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={onBackToArchive}
                  className="floating-action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  Back to Archive
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onBackToArchive}
              className="floating-action-btn"
              style={{
                background: 'var(--bg-primary)',
                padding: '12px 24px',
                borderRadius: '24px',
              }}
            >
              <ArrowLeft size={18} /> Back to Articles Archive
            </button>
          )}
        </div>
      </div>

      {/* Round Floating Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="floating-back-to-top"
        title="Back to Top"
        aria-label="Back to Top"
      >
        <ArrowUp size={22} />
      </button>

      {/* Floating Share Toast Confirmation */}
      {copied && (
        <div className="share-toast">
          <Check size={16} color="#22c55e" />
          Link copied to clipboard with selected language!
        </div>
      )}
    </div>
  );
};
