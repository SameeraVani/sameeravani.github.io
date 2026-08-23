import { useState, useEffect } from 'react';
import { Catalog } from './components/Catalog';
import { Reader } from './components/Reader';
import { VideoLibrary } from './components/video/VideoLibrary';
import { Articles } from './components/articles/Articles';
import { parseRoute, getUrlForRoute, getVideoUrlForRoute, getArticleUrlForRoute } from './utils/route';
import type { ReadingProgressMap, Bookmark } from './types';

function App() {
  const [appMode, setAppMode] = useState<'reading' | 'video' | 'articles' | 'lessons'>(() => {
    const route = parseRoute();
    return route.mode;
  });

  const [selectedBookId, setSelectedBookId] = useState<string | null>(() => {
    const route = parseRoute();
    if (route.mode === 'reading' && route.bookId) return route.bookId;
    return route.mode === 'reading' ? localStorage.getItem('active-book-id') : null;
  });

  const [appLanguage, setAppLanguage] = useState<string>(() => {
    const route = parseRoute();
    if (route.lang) return route.lang;
    return localStorage.getItem('app-language') || 'sanskrit';
  });

  const handleLanguageChange = (lang: string) => {
    setAppLanguage(lang);
    localStorage.setItem('app-language', lang);
    const route = parseRoute();
    if (route.mode === 'reading' && route.bookId) {
      const newUrl = getUrlForRoute(route.bookId, lang, route.chapterId);
      window.history.replaceState(null, '', newUrl);
    } else if (route.mode === 'articles' || route.mode === 'lessons') {
      const newUrl = getArticleUrlForRoute(route.topicId, lang, route.lessonId);
      window.history.replaceState(null, '', newUrl);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();
      setAppMode(route.mode);
      if (route.mode === 'reading') {
        setSelectedBookId(route.bookId);
        if (route.lang) {
          setAppLanguage(route.lang);
        }
      } else if (route.mode === 'articles' || route.mode === 'lessons') {
        setSelectedBookId(null);
        if (route.lang) {
          setAppLanguage(route.lang);
        }
      } else {
        setSelectedBookId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [progress, setProgress] = useState<ReadingProgressMap>(() => {
    const saved = localStorage.getItem('reader-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved progress:', e);
      }
    }
    return {};
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('reader-bookmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved bookmarks:', e);
      }
    }
    return [];
  });

  // Track page theme updates based on reader configuration
  // This updates the data-theme attribute on documentElement or body so that global scrollbars/bg match
  useEffect(() => {
    const syncTheme = () => {
      const settingsLocal = localStorage.getItem('reader-settings');
      if (settingsLocal) {
        try {
          const settings = JSON.parse(settingsLocal);
          if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
            return;
          }
        } catch (e) {}
      }
      document.documentElement.setAttribute('data-theme', 'light');
    };

    // Run initially
    syncTheme();

    // Re-run whenever settings change in reader
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Avoid infinite loop by ignoring changes triggered on the documentElement itself
        if (mutation.target === document.documentElement) return;

        // If the reader's element changed theme, sync it here
        const readerEl = document.querySelector('.reader-layout');
        if (readerEl) {
          const readerTheme = readerEl.getAttribute('data-theme');
          if (readerTheme && document.documentElement.getAttribute('data-theme') !== readerTheme) {
            document.documentElement.setAttribute('data-theme', readerTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, [selectedBookId]);

  // Sync state to local storage when changed
  const handleUpdateProgress = (bookId: string, language: string, chapterId: string, scrollPercent: number) => {
    setProgress((prev) => {
      const updated = {
        ...prev,
        [bookId]: {
          currentLanguage: language,
          currentChapterId: chapterId,
          scrollPercent,
          lastReadTime: Date.now(),
        },
      };
      localStorage.setItem('reader-progress', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddBookmark = (bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmarkData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };

    setBookmarks((prev) => {
      const updated = [...prev, newBookmark];
      localStorage.setItem('reader-bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== bookmarkId);
      localStorage.setItem('reader-bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    localStorage.setItem('active-book-id', bookId);
    const newUrl = getUrlForRoute(bookId, appLanguage, null);
    window.history.pushState(null, '', newUrl);
  };

  const handleBackToCatalog = () => {
    setSelectedBookId(null);
    localStorage.removeItem('active-book-id');
    // Revert global theme back to light or default when exiting reader
    document.documentElement.setAttribute('data-theme', 'light');
    document.title = 'SameeraVani — Premium Reading & Publishing Portal';
    const newUrl = getUrlForRoute(null, null, null);
    window.history.pushState(null, '', newUrl);
  };

  return (
    <div className="app-container">
      {appMode === 'reading' && selectedBookId ? (
        <Reader
          bookId={selectedBookId}
          onBack={handleBackToCatalog}
          savedProgress={progress[selectedBookId]}
          onUpdateProgress={handleUpdateProgress}
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          appLanguage={appLanguage}
          onChangeLanguage={handleLanguageChange}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header style={{ display: 'flex', justifyContent: 'center', padding: '15px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setAppMode('reading');
                const newUrl = getUrlForRoute(null, null, null);
                window.history.pushState(null, '', newUrl);
              }}
              style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: appMode === 'reading' ? 'var(--accent)' : 'var(--bg-tertiary)', color: appMode === 'reading' ? 'white' : 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Books Library
            </button>
            <button 
              onClick={() => {
                setAppMode('video');
                const newUrl = getVideoUrlForRoute(null, null, null);
                window.history.pushState(null, '', newUrl);
              }}
              style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: appMode === 'video' ? 'var(--accent)' : 'var(--bg-tertiary)', color: appMode === 'video' ? 'white' : 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Video Library
            </button>
            <button 
              onClick={() => {
                setAppMode('articles');
                const newUrl = getArticleUrlForRoute(null, appLanguage);
                window.history.pushState(null, '', newUrl);
              }}
              style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: (appMode === 'articles' || appMode === 'lessons') ? 'var(--accent)' : 'var(--bg-tertiary)', color: (appMode === 'articles' || appMode === 'lessons') ? 'white' : 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Articles
            </button>
          </header>
          <div style={{ flex: 1 }}>
            {appMode === 'reading' ? (
              <Catalog 
                onSelectBook={handleSelectBook} 
                progress={progress} 
                appLanguage={appLanguage}
                onChangeLanguage={handleLanguageChange}
              />
            ) : appMode === 'video' ? (
              <VideoLibrary />
            ) : (
              <Articles 
                appLanguage={appLanguage}
                onChangeLanguage={handleLanguageChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

