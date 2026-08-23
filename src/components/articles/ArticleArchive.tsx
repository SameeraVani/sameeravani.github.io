import React, { useState, useEffect } from 'react';
import type { ArticleTopic, Article, ArticleProgressMap } from '../../types';
import { Search, ArrowRight, CheckCircle2, BookOpen, Globe, Sparkles, ArrowUp, Calendar } from 'lucide-react';
import { parseArticleMarkdown } from '../../utils/articleParser';
import { getArticleUrlForRoute } from '../../utils/route';
import './articles.css';

interface ArticleArchiveProps {
  topics: ArticleTopic[];
  progressMap: ArticleProgressMap;
  currentLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
  onSelectArticle: (topic: ArticleTopic, article: Article, lang?: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'tamil', label: 'தமிழ்' },
  { code: 'english', label: 'English' },
  { code: 'sanskrit', label: 'संस्कृतम्' },
  { code: 'hindi', label: 'हिंदी' },
  { code: 'kannada', label: 'ಕನ್ನಡ' },
  { code: 'telugu', label: 'తెలుగు' },
];

const ARCHIVE_LABELS: { [lang: string]: { title: string; subtitle: string; searchPlaceholder: string; allTopics: string; noResults: string } } = {
  tamil: {
    title: 'கட்டுரைகள் & தத்துவச் சிந்தனைகள்',
    subtitle: 'பகவத் கீதை மற்றும் வேதாந்தத்தின் ஆழமான தத்துவார்த்த விளக்கங்கள்.',
    searchPlaceholder: 'கட்டுரைகளைத் தேடுக...',
    allTopics: 'அனைத்துத் தலைப்புகள்',
    noResults: 'கட்டுரைகள் எதுவும் கிடைக்கவில்லை.',
  },
  english: {
    title: 'Articles & Philosophical Archive',
    subtitle: 'In-depth philosophical expositions and Vedantic reflections.',
    searchPlaceholder: 'Search articles...',
    allTopics: 'All Topics',
    noResults: 'No matching articles found.',
  },
  sanskrit: {
    title: 'तत्त्वलेखाः वेदान्तविचाराश्च',
    subtitle: 'श्रीमद्भगवद्गीतायाः वेदान्तदर्शनस्य च गम्भीरविचाराः।',
    searchPlaceholder: 'लेखानाम् अन्वेषणम्...',
    allTopics: 'सर्वे विषयाः',
    noResults: 'लेखाः न लब्धाः।',
  },
  hindi: {
    title: 'तत्त्व लेख एवं वेदान्त विचार',
    subtitle: 'भगवद्गीता और वेदान्त दर्शन के प्रामाणिक एवं गूढ़ विचार।',
    searchPlaceholder: 'लेख खोजें...',
    allTopics: 'सभी विषय',
    noResults: 'कोई लेख नहीं मिला।',
  },
  kannada: {
    title: 'ತತ್ತ್ವ ಲೇಖನಗಳು ಮತ್ತು ವಿಚಾರಧಾರೆ',
    subtitle: 'ಭಗವದ್ಗೀತೆ ಮತ್ತು ವೇದಾಂತದ ಆಳವಾದ ತತ್ತ್ವ ಸಿದ್ಧಾಂತಗಳು.',
    searchPlaceholder: 'ಲೇಖನಗಳನ್ನು ಹುಡುಕಿ...',
    allTopics: 'ಎಲ್ಲಾ ವಿಷಯಗಳು',
    noResults: 'ಯಾವುದೇ ಲೇಖನಗಳು ದೊರೆಯಲಿಲ್ಲ.',
  },
  telugu: {
    title: 'తత్త్వ వ్యాసములు & వేదాంత విచారము',
    subtitle: 'భగవద్గీత మరియు వేదాంత దర్శన పరమార్థములు.',
    searchPlaceholder: 'వ్యాసములను శోధించండి...',
    allTopics: 'అన్ని అంశములు',
    noResults: 'వ్యాసములు దొరకలేదు.',
  },
};

export const ArticleArchive: React.FC<ArticleArchiveProps> = ({
  topics,
  progressMap,
  currentLanguage: externalLang,
  onChangeLanguage,
  onSelectArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return externalLang || localStorage.getItem('app-language') || localStorage.getItem('article-language') || 'tamil';
  });

  const [parsedMetaMap, setParsedMetaMap] = useState<{
    [articleId: string]: {
      [lang: string]: { title: string; summary: string; date?: string };
    };
  }>({});

  useEffect(() => {
    if (externalLang && externalLang !== currentLang) {
      setCurrentLang(externalLang);
    }
  }, [externalLang]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/articles') && !currentPath.includes(`/${currentLang}`) && !currentPath.includes('/bhagavad-gita')) {
      window.history.replaceState(null, '', getArticleUrlForRoute(null, currentLang));
    }
  }, [currentLang]);

  // Asynchronously load article metadata directly from markdown files
  useEffect(() => {
    topics.forEach((topic) => {
      topic.lessons.forEach((article) => {
        const path = article.path || `articles/${topic.id}/${article.id}.md`;
        fetch(`${import.meta.env.BASE_URL}${path}?t=${Date.now()}`)
          .then((res) => {
            if (!res.ok) return '';
            return res.text();
          })
          .then((text) => {
            if (!text) return;
            const langMap: { [lang: string]: { title: string; summary: string; date?: string } } = {};
            SUPPORTED_LANGUAGES.forEach((l) => {
              const p = parseArticleMarkdown(text, l.code, article.title);
              langMap[l.code] = {
                title: p.title,
                summary: p.summary,
                date: p.metadata?.date || article.date || '2026-08-23',
              };
            });

            setParsedMetaMap((prev) => ({
              ...prev,
              [article.id]: langMap,
            }));
          })
          .catch(() => {});
      });
    });
  }, [topics]);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('app-language', lang);
    localStorage.setItem('article-language', lang);
    window.history.replaceState(null, '', getArticleUrlForRoute(null, lang));
    if (onChangeLanguage) {
      onChangeLanguage(lang);
    }
  };

  const labels = ARCHIVE_LABELS[currentLang] || ARCHIVE_LABELS.english;

  const filteredTopics = topics.map((t) => {
    const locTopic = t.localized?.[currentLang] || t;
    const topicTitle = locTopic.title || t.title;
    const topicDesc = locTopic.description || t.description || '';

    const filteredLessons = t.lessons.filter((l) => {
      const parsedInfo = parsedMetaMap[l.id]?.[currentLang];
      const articleTitle = parsedInfo?.title || l.title || l.id;
      const articleSummary = parsedInfo?.summary || l.summary || '';

      const q = searchQuery.toLowerCase();
      return (
        topicTitle.toLowerCase().includes(q) ||
        topicDesc.toLowerCase().includes(q) ||
        articleTitle.toLowerCase().includes(q) ||
        articleSummary.toLowerCase().includes(q)
      );
    });

    return {
      ...t,
      title: topicTitle,
      description: topicDesc,
      lessons: filteredLessons,
    };
  }).filter((t) => t.lessons.length > 0);

  return (
    <div
      className="article-page-container"
      style={{
        maxWidth: '980px',
        margin: '0 auto',
        padding: '36px 20px 80px 20px',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '36px',
        }}
      >
        {/* Language Switcher Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            background: 'var(--bg-secondary)',
            padding: '5px 10px',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
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

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
            color: '#d97706',
            fontWeight: '700',
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <Sparkles size={14} /> SameeraVani Wisdom Library
        </div>

        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
          }}
        >
          {labels.title}
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 0 28px 0',
            lineHeight: 1.5,
          }}
        >
          {labels.subtitle}
        </p>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '520px',
          }}
        >
          <Search
            size={19}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px 14px 46px',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.98rem',
              outline: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Topics & Articles Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {filteredTopics.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
            }}
          >
            <BookOpen size={38} style={{ margin: '0 auto 14px auto', opacity: 0.4 }} />
            <p style={{ fontSize: '1.05rem', margin: 0 }}>{labels.noResults}</p>
          </div>
        ) : null}

        {filteredTopics.map((topic) => (
          <div key={topic.id} className="archive-topic-card">
            {/* Topic Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '22px',
              }}
            >
              {topic.coverUrl && (
                <img
                  src={`${import.meta.env.BASE_URL}${topic.coverUrl}`}
                  alt={topic.title}
                  style={{
                    width: '64px',
                    height: '84px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#d97706',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '4px',
                  }}
                >
                  {topic.category || 'Bhagavad Gita'}
                </div>
                <h2
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    margin: '0 0 6px 0',
                    color: 'var(--text-primary)',
                  }}
                >
                  {topic.title}
                </h2>
                {topic.description && (
                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {topic.description}
                  </p>
                )}
              </div>
            </div>

            {/* Articles List */}
            <div>
              {topic.lessons.map((article, idx) => {
                const parsedInfo = parsedMetaMap[article.id]?.[currentLang];
                const articleTitle = parsedInfo?.title || article.title || article.id;
                const articleSummary = parsedInfo?.summary || article.summary || '';
                const articleDate = parsedInfo?.date || article.date || '2026-08-23';

                const prog = progressMap[article.id];
                const isCompleted = prog?.completed;

                return (
                  <div
                    key={article.id}
                    className="archive-article-row"
                    onClick={() => onSelectArticle(topic, article, currentLang)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
                          color: isCompleted ? '#16a34a' : '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          flexShrink: 0,
                          border: isCompleted ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <h3
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: '700',
                              margin: 0,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {articleTitle}
                          </h3>
                          {articleDate && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                                fontWeight: '500',
                              }}
                            >
                              <Calendar size={13} /> {articleDate}
                            </span>
                          )}
                        </div>

                        {articleSummary && (
                          <p
                            style={{
                              fontSize: '0.92rem',
                              color: 'var(--text-secondary)',
                              margin: 0,
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {articleSummary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--accent)',
                        }}
                      >
                        <ArrowRight size={17} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Round Floating Back to Top Button */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }}
        className="floating-back-to-top"
        title="Back to Top"
        aria-label="Back to Top"
      >
        <ArrowUp size={22} />
      </button>
    </div>
  );
};

