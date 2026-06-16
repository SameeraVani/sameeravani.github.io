import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { parseRoute, getUrlForRoute } from '../utils/route';
import type { Book, ReaderSettings, Bookmark, BookReadingProgress } from '../types';
import { 
  Settings, 
  Bookmark as BookmarkIcon, 
  Search, 
  Plus, 
  Minus, 
  Home, 
  List, 
  Trash2,
  ExternalLink,
  Share2,
  ArrowUp
} from 'lucide-react';

interface ReaderProps {
  bookId: string;
  onBack: () => void;
  savedProgress: BookReadingProgress | undefined;
  onUpdateProgress: (bookId: string, language: string, chapterId: string, scrollPercent: number) => void;
  bookmarks: Bookmark[];
  onAddBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  appLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  bookId,
  onBack,
  savedProgress,
  onUpdateProgress,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  appLanguage,
  onChangeLanguage
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [loadingChapter, setLoadingChapter] = useState<boolean>(true);
  const [loadingBook, setLoadingBook] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reader UI States
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'search' | 'bookmarks'>('toc');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showShareTooltip, setShowShareTooltip] = useState<boolean>(false);
  const [showGoToTop, setShowGoToTop] = useState<boolean>(false);

  // In-Book Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCurrentChapterOnly, setSearchCurrentChapterOnly] = useState<boolean>(false);
  const [allChaptersContent, setAllChaptersContent] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<{ chapterId: string; chapterTitle: string; snippet: string; textIndex: number }[]>([]);
  const [searchingAll, setSearchingAll] = useState<boolean>(false);

  // E-Reader preferences
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const local = localStorage.getItem('reader-settings');
    if (local) {
      try { return JSON.parse(local); } catch(e) {}
    }
    return {
      theme: 'sepia',
      fontSize: 18,
      fontFamily: 'lora',
      lineHeight: 'standard'
    };
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [restoreScrollPercent, setRestoreScrollPercent] = useState<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Fetch the selected book structure
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/catalog.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load books catalog.');
        return res.json();
      })
      .then((catalog: Book[]) => {
        const found = catalog.find((b) => b.id === bookId);
        if (!found) throw new Error('Book not found in catalog.');
        setBook(found);
        setLoadingBook(false);
        
        // Initialize language and chapter selection
        const route = parseRoute();
        const urlLang = route.lang;
        const urlChapter = route.chapterId;

        let initialLang = '';
        let initialChapter = '';
        let initialScroll = 0;

        if (urlLang && found.languages.includes(urlLang)) {
          initialLang = urlLang;
          const chapters = found.chapters[urlLang] || [];
          if (urlChapter && chapters.some((c) => c.id === urlChapter)) {
            initialChapter = urlChapter;
            if (savedProgress && savedProgress.currentLanguage === urlLang && savedProgress.currentChapterId === urlChapter) {
              initialScroll = savedProgress.scrollPercent;
            }
          } else if (chapters.length > 0) {
            initialChapter = chapters[0].id;
          }
        }

        if (initialLang && initialChapter) {
          setActiveLanguage(initialLang);
          setActiveChapterId(initialChapter);
          setRestoreScrollPercent(initialScroll);
        } else {
          const savedLang = savedProgress?.currentLanguage;
          if (savedLang && found.languages.includes(savedLang)) {
            setActiveLanguage(savedLang);
            const langChapters = found.chapters[savedLang] || [];
            if (langChapters.some((c) => c.id === savedProgress.currentChapterId)) {
              setActiveChapterId(savedProgress.currentChapterId);
              setRestoreScrollPercent(savedProgress.scrollPercent);
            } else if (langChapters.length > 0) {
              setActiveChapterId(langChapters[0].id);
              setRestoreScrollPercent(0);
            }
          } else {
            const defaultLang = (appLanguage && found.languages.includes(appLanguage))
              ? appLanguage
              : (found.languages.length > 0 ? found.languages[0] : '');
            if (defaultLang) {
              setActiveLanguage(defaultLang);
              const langChapters = found.chapters[defaultLang] || [];
              if (langChapters.length > 0) {
                setActiveChapterId(langChapters[0].id);
              }
              setRestoreScrollPercent(0);
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Error occurred while loading book structure.');
        setLoadingBook(false);
      });
  }, [bookId]);

  // Auto-sync active language/chapter state to URL path parameters
  useEffect(() => {
    if (bookId && activeLanguage && activeChapterId) {
      const cleanPath = getUrlForRoute(bookId, activeLanguage, activeChapterId);
      if (window.location.pathname !== cleanPath) {
        window.history.replaceState(null, '', cleanPath);
      }
    }
  }, [bookId, activeLanguage, activeChapterId]);

  // Pre-load active language chapters content in the background for full-text search indexing
  useEffect(() => {
    if (!book || !activeLanguage) return;
    
    const loadAllContent = async () => {
      setSearchingAll(true);
      const contentsMap: Record<string, string> = {};
      const langChapters = book.chapters[activeLanguage] || [];
      
      for (const chapter of langChapters) {
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}${chapter.path}`);
          if (res.ok) {
            const text = await res.text();
            contentsMap[chapter.id] = text;
          }
        } catch (e) {
          console.error(`Error background-indexing chapter ${chapter.id}:`, e);
        }
      }
      setAllChaptersContent(contentsMap);
      setSearchingAll(false);
    };

    loadAllContent();
  }, [book, activeLanguage]);

  // Load active chapter markdown
  useEffect(() => {
    if (!book || !activeLanguage || !activeChapterId) return;
    
    const langChapters = book.chapters[activeLanguage] || [];
    const activeChapter = langChapters.find((c) => c.id === activeChapterId);
    if (!activeChapter) return;

    setLoadingChapter(true);
    fetch(`${import.meta.env.BASE_URL}${activeChapter.path}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load chapter file: ${activeChapter.title}`);
        return res.text();
      })
      .then((text) => {
        setChapterContent(text);
        setLoadingChapter(false);
        // Dynamically update document title to reflect active chapter & book
        document.title = `${activeChapter.title} — ${book.title} | SameeraVani`;
        window.dispatchEvent(new Event('locationchange'));
      })
      .catch((err) => {
        setChapterContent(`# Error\nCould not load the chapter content: ${err.message}`);
        setLoadingChapter(false);
      });
  }, [book, activeLanguage, activeChapterId]);

  // Restore Scroll Position once content loads
  useEffect(() => {
    if (!loadingChapter && restoreScrollPercent !== null && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const targetScrollTop = (restoreScrollPercent / 100) * (scrollHeight - clientHeight);
          container.scrollTop = targetScrollTop;
          setShowGoToTop(targetScrollTop > 0);
        }
        setRestoreScrollPercent(null);
      }, 120); // Small timeout to ensure markdown rendering is fully layout-calculated
      return () => clearTimeout(timer);
    }
  }, [chapterContent, loadingChapter]);

  // Track scrolling and update progress in real time
  const handleScroll = () => {
    if (!book || !activeLanguage || !activeChapterId || loadingChapter || restoreScrollPercent !== null) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Toggle Go to Top button visibility
    setShowGoToTop(scrollTop > 0);

    const maxScroll = scrollHeight - clientHeight;
    const scrollPercent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    
    onUpdateProgress(book.id, activeLanguage, activeChapterId, scrollPercent);
  };

  // Keyboard navigation listener (Left/Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!book || !activeLanguage || settingsOpen) return;
      
      const langChapters = book.chapters[activeLanguage] || [];
      const currentIdx = langChapters.findIndex((c) => c.id === activeChapterId);
      if (currentIdx === -1) return;

      if (e.key === 'ArrowRight' && currentIdx < langChapters.length - 1) {
        // Go to next chapter
        handleNavigateToChapter(langChapters[currentIdx + 1].id);
      } else if (e.key === 'ArrowLeft' && currentIdx > 0) {
        // Go to prev chapter
        handleNavigateToChapter(langChapters[currentIdx - 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, activeLanguage, activeChapterId, settingsOpen]);

  // Handle clicking outside settings overlay to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  // Persistent settings updater
  const updateSettings = (updates: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('reader-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleNavigateToChapter = (chapterId: string, targetScrollPercent: number = 0) => {
    setActiveChapterId(chapterId);
    setRestoreScrollPercent(targetScrollPercent);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNavigateToBookmark = (bookmark: Bookmark) => {
    if (bookmark.language !== activeLanguage) {
      setActiveLanguage(bookmark.language);
    }
    setActiveChapterId(bookmark.chapterId);
    setRestoreScrollPercent(bookmark.scrollPercent);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Dynamic Language Swapping
  const handleLanguageChange = (newLang: string) => {
    if (!book) return;

    const currentLangChapters = book.chapters[activeLanguage] || [];
    const currentChapterIdx = currentLangChapters.findIndex((c) => c.id === activeChapterId);
    
    const targetLangChapters = book.chapters[newLang] || [];
    let targetChapterId = '';
    
    // Jump to the same chapter index in the new language
    if (currentChapterIdx !== -1 && currentChapterIdx < targetLangChapters.length) {
      targetChapterId = targetLangChapters[currentChapterIdx].id;
    } else if (targetLangChapters.length > 0) {
      targetChapterId = targetLangChapters[0].id;
    }
    
    // Compute current scroll percent to carry over
    let scrollPercent = 0;
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      scrollPercent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    }

    setActiveLanguage(newLang);
    onChangeLanguage?.(newLang);
    if (targetChapterId) {
      setActiveChapterId(targetChapterId);
      setRestoreScrollPercent(scrollPercent);
    }
    
    // Sync immediate storage update
    if (targetChapterId) {
      onUpdateProgress(book.id, newLang, targetChapterId, scrollPercent);
    }
  };

  // Full-Text In-Book Search Implementation
  const runBookSearch = (query: string) => {
    if (!book || !activeLanguage || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const matches: typeof searchResults = [];
    const langChapters = book.chapters[activeLanguage] || [];
    const chaptersToSearch = searchCurrentChapterOnly 
      ? langChapters.filter(c => c.id === activeChapterId)
      : langChapters;

    chaptersToSearch.forEach((chapter) => {
      const content = allChaptersContent[chapter.id];
      if (!content) return;

      let pos = content.toLowerCase().indexOf(query.toLowerCase());
      while (pos !== -1) {
        // Build surrounding snippet context
        const start = Math.max(0, pos - 40);
        const end = Math.min(content.length, pos + query.length + 40);
        let snippet = content.substring(start, end);
        
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';

        matches.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          snippet,
          textIndex: pos
        });

        // Search next occurrence
        pos = content.toLowerCase().indexOf(query.toLowerCase(), pos + 1);
      }
    });

    setSearchResults(matches);
  };

  useEffect(() => {
    runBookSearch(searchQuery);
  }, [searchQuery, searchCurrentChapterOnly, allChaptersContent]);

  // Bookmark creation
  const handleAddBookmarkClick = () => {
    if (!book || !activeLanguage || !activeChapterId) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const langChapters = book.chapters[activeLanguage] || [];
    const activeChapter = langChapters.find((c) => c.id === activeChapterId);
    if (!activeChapter) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const scrollPercent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    // Grab snippet from markdown heading or first paragraph
    let snippet = `Bookmark in ${activeChapter.title}`;
    const cleanLines = chapterContent.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    if (cleanLines.length > 0) {
      // Find a line corresponding roughly to scroll percentage
      const estimatedLineIdx = Math.floor((scrollPercent / 100) * cleanLines.length);
      const targetLine = cleanLines[Math.min(estimatedLineIdx, cleanLines.length - 1)];
      snippet = targetLine.length > 100 ? targetLine.substring(0, 100) + '...' : targetLine;
    }

    onAddBookmark({
      bookId: book.id,
      language: activeLanguage,
      chapterId: activeChapterId,
      chapterTitle: activeChapter.title,
      textSnippet: snippet,
      scrollPercent: scrollPercent
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };

  const getChapterProgressPercent = (chapterId: string) => {
    if (activeChapterId === chapterId && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      return maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
    }
    
    if (savedProgress && savedProgress.currentLanguage === activeLanguage && savedProgress.currentChapterId === chapterId) {
      return Math.round(savedProgress.scrollPercent);
    }

    if (book) {
      const langChapters = book.chapters[activeLanguage] || [];
      const activeIdx = langChapters.findIndex((c) => c.id === activeChapterId);
      const thisIdx = langChapters.findIndex((c) => c.id === chapterId);
      if (activeIdx > thisIdx) return 100;
    }

    return 0;
  };

  if (error) {
    return (
      <div className="loader-container" style={{ color: '#ef4444' }}>
        <p>Error: {error}</p>
        <button className="back-button" onClick={onBack} style={{ marginTop: '16px' }}>
          <Home size={16} />
          <span>Return to Bookshelf</span>
        </button>
      </div>
    );
  }

  if (loadingBook || !book || !activeLanguage) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading e-book index...</p>
      </div>
    );
  }

  const langChapters = book.chapters[activeLanguage] || [];
  const activeChapterIdx = langChapters.findIndex((c) => c.id === activeChapterId);
  const activeChapter = langChapters[activeChapterIdx];
  const hasPrevChapter = activeChapterIdx > 0;
  const hasNextChapter = activeChapterIdx < langChapters.length - 1;

  // Bookmarks for this book and language specifically
  const bookBookmarks = bookmarks.filter((b) => b.bookId === book.id && b.language === activeLanguage);

  // Compute total reading progress for top-bar bar
  const totalChapters = langChapters.length;
  const currentProgressPercent = activeChapterIdx !== -1 
    ? Math.round(((activeChapterIdx + (scrollContainerRef.current ? (scrollContainerRef.current.scrollTop / (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight || 1)) : 0)) / totalChapters) * 100) 
    : 0;

  // Localized title & description if available
  const displayTitle = book.localized?.[activeLanguage]?.title || book.title;

  return (
    <div className="reader-layout" data-theme={settings.theme}>
      
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Top Navbar */}
      <nav className="reader-topbar" id="reader-navigation">
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="back-button" onClick={onBack} title="Return to Bookshelf">
            <Home size={16} />
            <span>Bookshelf</span>
          </button>
          <span className="reader-book-title" style={{ marginLeft: '12px' }}>{displayTitle}</span>

          {/* Language Selector Dropdown */}
          {book.languages.length > 1 && (
            <select
              id="reader-language-select"
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginLeft: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {book.languages.map((lang) => {
                const labels: Record<string, string> = {
                  english: 'English',
                  sanskrit: 'Sanskrit (संस्कृतम्)',
                  hindi: 'Hindi (हिन्दी)',
                  kannada: 'Kannada (ಕನ್ನಡ)',
                  tamil: 'Tamil (தமிழ்)',
                  telugu: 'Telugu (తెలుగు)'
                };
                return (
                  <option key={lang} value={lang}>
                    {labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className="topbar-center" id="reader-chapter-title">
          {activeChapter ? activeChapter.title : 'Loading Chapter...'}
        </div>

        <div className="topbar-right">
          <button 
            className={`icon-btn ${sidebarOpen ? 'active' : ''}`} 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            <List size={18} />
          </button>

          <button 
            className="icon-btn" 
            onClick={handleAddBookmarkClick}
            title="Bookmark this page"
          >
            <BookmarkIcon size={18} />
          </button>

          <button 
            className="icon-btn" 
            onClick={handleShare}
            title="Share this page link"
            style={{ position: 'relative' }}
          >
            <Share2 size={18} />
            {showShareTooltip && (
              <span className="share-tooltip">
                Link copied!
              </span>
            )}
          </button>

          <button 
            className={`icon-btn ${settingsOpen ? 'active' : ''}`} 
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Reading Preferences"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Global Book progress bar line at top */}
        <div 
          className="reading-progress-top" 
          style={{ width: `${Math.min(Math.max(currentProgressPercent, 0), 100)}%` }}
        ></div>
      </nav>

      {/* Collapsible Sidebar */}
      <aside className={`reader-sidebar ${sidebarOpen ? '' : 'collapsed'}`} id="reader-sidebar-panel">
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${sidebarTab === 'toc' ? 'active' : ''}`}
            onClick={() => setSidebarTab('toc')}
          >
            <List size={16} />
            <span>Index</span>
          </button>
          <button 
            className={`sidebar-tab ${sidebarTab === 'search' ? 'active' : ''}`}
            onClick={() => setSidebarTab('search')}
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          <button 
            className={`sidebar-tab ${sidebarTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setSidebarTab('bookmarks')}
          >
            <BookmarkIcon size={16} />
            <span>Bookmarks ({bookBookmarks.length})</span>
          </button>
        </div>

        <div className="sidebar-content">
          {sidebarTab === 'toc' && (
            <div className="toc-list" id="table-of-contents">
              {langChapters.map((chapter) => {
                const isActive = chapter.id === activeChapterId;
                const chapterReadPercent = getChapterProgressPercent(chapter.id);
                return (
                  <button
                    key={chapter.id}
                    className={`toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigateToChapter(chapter.id)}
                  >
                    <span className="toc-status-indicator"></span>
                    <div style={{ flex: 1 }}>
                      <div>{chapter.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {chapterReadPercent === 100 ? 'Completed' : chapterReadPercent > 0 ? `${chapterReadPercent}% read` : 'Unread'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {sidebarTab === 'search' && (
            <div>
              <div className="sidebar-search-box">
                <input
                  type="text"
                  placeholder="Find text inside book..."
                  className="search-input"
                  style={{ padding: '8px 12px 8px 36px', height: '40px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="search-icon" style={{ left: '12px' }} />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={searchCurrentChapterOnly}
                  onChange={(e) => setSearchCurrentChapterOnly(e.target.checked)}
                />
                Current chapter only
              </label>

              {searchingAll ? (
                <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.85rem' }}>
                  <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto 8px' }}></div>
                  Indexing pages...
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className="sidebar-search-results">
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Found {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''}
                  </div>
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="search-result-card"
                      onClick={() => handleNavigateToChapter(result.chapterId, 0)} // Jump to chapter
                    >
                      <div className="search-result-chapter">{result.chapterTitle}</div>
                      <div className="search-result-text">
                        {/* Highlights query text */}
                        {(() => {
                          const queryIndex = result.snippet.toLowerCase().indexOf(searchQuery.toLowerCase());
                          if (queryIndex === -1) return result.snippet;
                          
                          const startText = result.snippet.substring(0, queryIndex);
                          const matchText = result.snippet.substring(queryIndex, queryIndex + searchQuery.length);
                          const endText = result.snippet.substring(queryIndex + searchQuery.length);
                          
                          return (
                            <>
                              {startText}
                              <mark className="search-result-highlight">{matchText}</mark>
                              {endText}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Type a search keyword to scan pages.
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'bookmarks' && (
            <div className="bookmarks-list">
              {bookBookmarks.length > 0 ? (
                bookBookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-card">
                    <div className="bookmark-header">
                      <span>{bookmark.chapterTitle}</span>
                      <span>{Math.round(bookmark.scrollPercent)}%</span>
                    </div>
                    <p className="bookmark-snippet">"{bookmark.textSnippet}"</p>
                    <div className="bookmark-actions">
                      <button 
                        className="bookmark-go-btn"
                        onClick={() => handleNavigateToBookmark(bookmark)}
                      >
                        <span>Jump to page</span>
                        <ExternalLink size={12} />
                      </button>
                      <button 
                        className="bookmark-delete-btn"
                        onClick={() => onDeleteBookmark(bookmark.id)}
                        title="Delete Bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No bookmarks taken for this book in {activeLanguage.charAt(0).toUpperCase() + activeLanguage.slice(1)}. Press the bookmark icon in the top navigation bar to save your current page spot.
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Floating Settings Popover */}
      {settingsOpen && (
        <div className="settings-overlay" ref={settingsRef} id="reader-settings-panel">
          <div>
            <h3 className="settings-section-title">Visual Mode</h3>
            <div className="theme-picker">
              {(['light', 'dark', 'sepia', 'slate'] as const).map((t) => (
                <button
                  key={t}
                  className={`theme-opt-btn ${t} ${settings.theme === t ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="settings-section-title">Font Size</h3>
            <div className="size-control">
              <button 
                className="size-btn" 
                onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                disabled={settings.fontSize <= 14}
              >
                <Minus size={14} />
              </button>
              <span className="size-display">{settings.fontSize}px</span>
              <button 
                className="size-btn" 
                onClick={() => updateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                disabled={settings.fontSize >= 26}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="settings-section-title">Typeface</h3>
            <div className="font-picker">
              <button
                className={`font-picker-btn lora ${settings.fontFamily === 'lora' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontFamily: 'lora' })}
              >
                Lora (Book Serif)
              </button>
              <button
                className={`font-picker-btn inter ${settings.fontFamily === 'inter' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontFamily: 'inter' })}
              >
                Inter (Clean Sans)
              </button>
              <button
                className={`font-picker-btn opendyslexic ${settings.fontFamily === 'opendyslexic' ? 'active' : ''}`}
                onClick={() => updateSettings({ fontFamily: 'opendyslexic' })}
              >
                OpenDyslexic (Readable)
              </button>
            </div>
          </div>

          <div>
            <h3 className="settings-section-title">Line Spacing</h3>
            <div className="lh-picker">
              {(['compact', 'standard', 'spacious'] as const).map((lh) => (
                <button
                  key={lh}
                  className={`lh-btn ${settings.lineHeight === lh ? 'active' : ''}`}
                  onClick={() => updateSettings({ lineHeight: lh })}
                >
                  {lh.charAt(0).toUpperCase() + lh.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reader Content Area */}
      <div className="reader-workspace">
        <div 
          className="reader-content-scroll" 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          id="reader-text-container"
        >
          <div className="reader-content-width">
            {loadingChapter ? (
              <div className="loader-container">
                <div className="spinner"></div>
                <p>Opening chapter pages...</p>
              </div>
            ) : (
              <article 
                className={`reader-markdown read-font-${settings.fontFamily} lh-${settings.lineHeight}`}
                style={{ fontSize: `${settings.fontSize}px` }}
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
                  {chapterContent}
                </ReactMarkdown>

                {/* Next / Prev Chapter buttons */}
                <div className="chapter-nav-buttons">
                  {hasPrevChapter ? (
                    <button 
                      className="nav-btn prev"
                      onClick={() => handleNavigateToChapter(langChapters[activeChapterIdx - 1].id)}
                    >
                      <span className="nav-btn-label">Previous Chapter</span>
                      <span className="nav-btn-title">{langChapters[activeChapterIdx - 1].title}</span>
                    </button>
                  ) : (
                    <div style={{ flex: 1 }}></div>
                  )}

                  {hasNextChapter ? (
                    <button 
                      className="nav-btn next"
                      onClick={() => handleNavigateToChapter(langChapters[activeChapterIdx + 1].id)}
                    >
                      <span className="nav-btn-label">Next Chapter</span>
                      <span className="nav-btn-title">{langChapters[activeChapterIdx + 1].title}</span>
                    </button>
                  ) : (
                    <button className="nav-btn next" onClick={onBack}>
                      <span className="nav-btn-label">Finish Reading</span>
                      <span className="nav-btn-title">Return to Bookshelf</span>
                    </button>
                  )}
                </div>
              </article>
            )}
          </div>
        </div>

        {/* Go to Top floating button */}
        {showGoToTop && (
          <button 
            className="go-to-top-btn"
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            title="Go to Top"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>

    </div>
  );
};
