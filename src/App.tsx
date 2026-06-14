import { useState, useEffect } from 'react';
import { Catalog } from './components/Catalog';
import { Reader } from './components/Reader';
import type { ReadingProgressMap, Bookmark } from './types';

function App() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(() => {
    // Restore last active book if any
    return localStorage.getItem('active-book-id');
  });

  const [appLanguage, setAppLanguage] = useState<string>(() => {
    return localStorage.getItem('app-language') || 'english';
  });

  const handleLanguageChange = (lang: string) => {
    setAppLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

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
  };

  const handleBackToCatalog = () => {
    setSelectedBookId(null);
    localStorage.removeItem('active-book-id');
    // Revert global theme back to light or default when exiting reader
    document.documentElement.setAttribute('data-theme', 'light');
  };

  return (
    <div className="app-container">
      {selectedBookId ? (
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
        <Catalog 
          onSelectBook={handleSelectBook} 
          progress={progress} 
          appLanguage={appLanguage}
          onChangeLanguage={handleLanguageChange}
        />
      )}
    </div>
  );
}

export default App;
