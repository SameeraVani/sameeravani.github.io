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
  ArrowUp,
  BookOpen,
  Download
} from 'lucide-react';

import { downloadChapterAsPdf, downloadFullBookAsPdf } from '../utils/download';


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

        // 1. Resolve Language
        if (urlLang && found.languages.includes(urlLang)) {
          initialLang = urlLang;
        } else {
          const savedLang = savedProgress?.currentLanguage;
          if (savedLang && found.languages.includes(savedLang)) {
            initialLang = savedLang;
          } else {
            initialLang = (appLanguage && found.languages.includes(appLanguage))
              ? appLanguage
              : (found.languages.length > 0 ? found.languages[0] : '');
          }
        }

        // 2. Resolve Chapter ID (only set if in URL and valid)
        if (initialLang) {
          const chapters = found.chapters[initialLang] || [];
          if (urlChapter && chapters.some((c) => c.id === urlChapter)) {
            initialChapter = urlChapter;
            if (savedProgress && savedProgress.currentLanguage === initialLang && savedProgress.currentChapterId === urlChapter) {
              initialScroll = savedProgress.scrollPercent;
            }
          } else {
            // No valid chapter in URL means we land on the Book Overview page ("")
            initialChapter = '';
          }
        }

        if (initialLang) {
          setActiveLanguage(initialLang);
          setActiveChapterId(initialChapter);
          setRestoreScrollPercent(initialScroll);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error occurred while loading book structure.');
        setLoadingBook(false);
      });
  }, [bookId]);

  // Synchronize component state on browser back/forward popstate events
  useEffect(() => {
    const handlePopState = () => {
      if (!book) return;
      const route = parseRoute();
      if (route.bookId === bookId) {
        if (route.lang && book.languages.includes(route.lang)) {
          setActiveLanguage(route.lang);
        }
        const chapters = book.chapters[route.lang || ''] || [];
        if (route.chapterId && chapters.some((c) => c.id === route.chapterId)) {
          setActiveChapterId(route.chapterId);
        } else {
          setActiveChapterId('');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [bookId, book]);

  // Auto-sync active language/chapter state to URL path parameters
  useEffect(() => {
    if (bookId && activeLanguage) {
      const cleanPath = getUrlForRoute(bookId, activeLanguage, activeChapterId || null);
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
          const res = await fetch(`${import.meta.env.BASE_URL}${chapter.path}?t=${Date.now()}`);
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
    if (!book || !activeLanguage) return;
    
    if (activeChapterId === '') {
      setChapterContent('');
      setLoadingChapter(false);
      const displayTitle = book.localized?.[activeLanguage]?.title || book.title;
      document.title = `${displayTitle} — About | SameeraVani`;
      window.dispatchEvent(new Event('locationchange'));
      return;
    }
    
    const langChapters = book.chapters[activeLanguage] || [];
    const activeChapter = langChapters.find((c) => c.id === activeChapterId);
    if (!activeChapter) return;

    setLoadingChapter(true);
    fetch(`${import.meta.env.BASE_URL}${activeChapter.path}?t=${Date.now()}`)
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
      if (!book || !activeLanguage || settingsOpen || activeChapterId === '') return;
      
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

    // Push new history frame
    const cleanPath = getUrlForRoute(bookId, activeLanguage, chapterId || null);
    if (window.location.pathname !== cleanPath) {
      window.history.pushState(null, '', cleanPath);
    }
  };

  const handleNavigateToIntro = () => {
    setActiveChapterId('');
    setChapterContent('');
    setRestoreScrollPercent(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }

    // Push new history frame
    const cleanPath = getUrlForRoute(bookId, activeLanguage, null);
    if (window.location.pathname !== cleanPath) {
      window.history.pushState(null, '', cleanPath);
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

    const cleanPath = getUrlForRoute(bookId, bookmark.language, bookmark.chapterId);
    if (window.location.pathname !== cleanPath) {
      window.history.pushState(null, '', cleanPath);
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
    } else if (activeChapterId === '') {
      targetChapterId = '';
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
    setActiveChapterId(targetChapterId);
    setRestoreScrollPercent(scrollPercent);
    
    // Sync immediate storage update
    if (targetChapterId) {
      onUpdateProgress(book.id, newLang, targetChapterId, scrollPercent);
    }

    // Push new history frame
    const cleanPath = getUrlForRoute(book.id, newLang, targetChapterId || null);
    if (window.location.pathname !== cleanPath) {
      window.history.pushState(null, '', cleanPath);
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

  const getAboutLabel = (lang: string) => {
    const labels: Record<string, string> = {
      english: 'About this Book',
      sanskrit: 'पुस्तकमधिकृत्य (परिचयः)',
      hindi: 'इस पुस्तक के बारे में',
      kannada: 'ಈ ಪುಸ್ತಕದ ಬಗ್ಗೆ',
      tamil: 'நூல் அறிமுகம்',
      telugu: 'ఈ పుస్తకం గురించి'
    };
    return labels[lang] || 'About this Book';
  };

  const getGrammarHeaderTitle = (chapterId: string, lang: string) => {
    if (chapterId === 'ch6') {
      const titles: Record<string, string> = {
        english: 'Noun Declensions Quick Index (Shabda)',
        sanskrit: 'शब्दरूपाणि त्वरित-सूची',
        hindi: 'शब्द रूप त्वरित सूची',
        kannada: 'ಶಬ್ದ ರೂಪಗಳು ಶೀಘ್ರ ಸೂಚಿ',
        tamil: 'பெயர்ச்சொல் உருபுகள் விரைவுப் பட்டி',
        telugu: 'శబ్ద రూపములు శీఘ్ర సూచిక'
      };
      return titles[lang] || 'Noun Declensions Quick Index';
    }
    if (chapterId === 'ch8') {
      const titles: Record<string, string> = {
        english: 'Verb Conjugations Quick Index (Dhatu)',
        sanskrit: 'धातुरूपाणि त्वरित-सूची',
        hindi: 'धातु रूप त्वरित सूची',
        kannada: 'ಧಾತು ರೂಪಗಳು ಶೀಘ್ರ ಸೂಚಿ',
        tamil: 'வினைச்சொல் வடிவங்கள் விரைவுப் பட்டி',
        telugu: 'ధాతు రూపములు శీఘ్ర సూచిక'
      };
      return titles[lang] || 'Verb Conjugations Quick Index';
    }
    if (chapterId === 'ch9') {
      const titles: Record<string, string> = {
        english: 'Sandhi Rules Quick Index (Sandhi)',
        sanskrit: 'सन्धिप्रकरणम् त्वरित-सूची',
        hindi: 'सन्धि प्रकरण त्वरित सूची',
        kannada: 'ಸಂಧಿ ಪ್ರಕರಣ ಶೀಘ್ರ ಸೂಚಿ',
        tamil: 'புணர்ச்சி விதிகள் விரைவுப் பட்டி',
        telugu: 'సంధి ప్రకరణము శీఘ్ర సూచిక'
      };
      return titles[lang] || 'Sandhi Rules Quick Index';
    }
    if (chapterId === 'ch10') {
      const titles: Record<string, string> = {
        english: 'Compounds & Derivations Quick Index (Samasa)',
        sanskrit: 'समासाः वृत्तयश्च त्वरित-सूची',
        hindi: 'समास एवं वृत्तियाँ त्वरित सूची',
        kannada: 'ಸಮಾಸಗಳು ಮತ್ತು ವೃತ್ತಿಗಳು ಶೀಘ್ರ ಸೂಚಿ',
        tamil: 'கூட்டுச் சொற்கள் (ஸமாஸங்கள்) விரைவுப் பட்டி',
        telugu: 'సమాసములు మరియు వృత్తులు శీఘ్ర సూచిక'
      };
      return titles[lang] || 'Compounds & Derivations Quick Index';
    }
    return '';
  };

  const scrollToHeading = (prefix: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const article = container.querySelector('.reader-markdown');
    if (!article) return;

    const candidates = Array.from(article.querySelectorAll('h1, h2, h3, h4, h5, h6, p, strong, th, td, span'));
    const normalizedPrefix = prefix.trim().toLowerCase();

    let foundElement: HTMLElement | null = null;

    for (const el of candidates) {
      const text = el.textContent || '';
      const normalizedText = text.trim().toLowerCase();
      
      const cleanText = normalizedText.replace(/[\*\_\`\#]/g, '').trim();
      const cleanPrefix = normalizedPrefix.replace(/[\*\_\`\#]/g, '').trim();

      if (cleanText.startsWith(cleanPrefix) || cleanText.includes(cleanPrefix)) {
        foundElement = el as HTMLElement;
        break;
      }
    }

    if (foundElement) {
      foundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      foundElement.classList.remove('heading-highlight-flash');
      void foundElement.offsetWidth; // force reflow
      foundElement.classList.add('heading-highlight-flash');
    } else {
      console.warn(`Could not find heading for prefix: ${prefix}`);
    }
  };

  const renderShabdaIndex = () => {
    const shabdaItems = [
      { id: 1, label: 'रामः (Rāma)', prefix: '1.' },
      { id: 2, label: 'हरिः (Hari)', prefix: '2.' },
      { id: 3, label: 'गुरुः (Guru)', prefix: '3.' },
      { id: 4, label: 'रमा (Ramā)', prefix: '4.' },
      { id: 5, label: 'रुचिः (Ruchi)', prefix: '5.' },
      { id: 6, label: 'नदी (Nadī)', prefix: '6.' },
      { id: 7, label: 'ज्ञानम् (Jñāna)', prefix: '7.' },
      { id: 8, label: 'तद् - पुल्लिङ्गः (He/That)', prefix: '8.' },
      { id: 9, label: 'तद् - स्त्रीलिङ्गः (She)', prefix: '9.' },
      { id: 10, label: 'तद् - नपुंसकलिङ्गः (It)', prefix: '10.' },
      { id: 11, label: 'किम् - पुल्लिङ्गः (Who?)', prefix: '11.' },
      { id: 12, label: 'किम् - स्त्रीलिङ्गः (Who?)', prefix: '12.' },
      { id: 13, label: 'किम् - नपुंसकलिङ्गः (What?)', prefix: '13.' },
      { id: 14, label: 'इदम् - पुल्लिङ्गः (This)', prefix: '14.' },
      { id: 15, label: 'इदम् - स्त्रीलिङ्गः (This)', prefix: '15.' },
      { id: 16, label: 'इदम् - नपुंसकलिङ्गः (This)', prefix: '16.' },
      { id: 17, label: 'एतद् - पुल्लिङ्गः (This near)', prefix: '17.' },
      { id: 18, label: 'एतद् - स्त्रीलिङ्गः (This near)', prefix: '18.' },
      { id: 19, label: 'एतद् - नपुंसकलिङ्गः (This near)', prefix: '19.' },
      { id: 20, label: 'अस्मद् (I/We)', prefix: '20.' },
      { id: 21, label: 'युष्मद् (You)', prefix: '21.' }
    ];

    return (
      <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {shabdaItems.map((item) => (
          <button
            key={item.id}
            className="quick-pill-btn"
            onClick={() => scrollToHeading(item.prefix)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  };

  const renderDhatuIndex = () => {
    const parasmaipadaVerbs = [
      { id: 1, label: '१. पठ् (to read)', prefix: '1.' },
      { id: 2, label: '२. लिख् (to write)', prefix: '2.' },
      { id: 3, label: '३. गम् (to go)', prefix: '3.' },
      { id: 4, label: '४. भू (to be)', prefix: '4.' },
      { id: 5, label: '५. क्रीड् (to play)', prefix: '5.' },
      { id: 6, label: '६. खाद् (to eat)', prefix: '6.' },
      { id: 7, label: '७. पा (to drink)', prefix: '7.' },
      { id: 8, label: '८. दृश् (to see)', prefix: '8.' },
      { id: 9, label: '९. धाव् (to run)', prefix: '9.' },
      { id: 10, label: '१०. हस् (to laugh)', prefix: '10.' }
    ];

    const atmanepadaVerbs = [
      { id: 11, label: '११. वन्द् (to salute)', prefix: '11.' },
      { id: 12, label: '१२. सेव् (to serve)', prefix: '12.' },
      { id: 13, label: '१३. लभ् (to obtain)', prefix: '13.' },
      { id: 14, label: '१४. रम् (to rejoice)', prefix: '14.' },
      { id: 15, label: '१५. मुद् (to be happy)', prefix: '15.' }
    ];

    const labelsParasmai: Record<string, string> = {
      english: 'Parasmaipada Verbs',
      sanskrit: 'परस्मैपदिनः धातवः',
      hindi: 'परस्मैपद धातु',
      kannada: 'ಪರಸ್ಮೈಪದ ಧಾತುಗಳು',
      tamil: 'பரஸ்மைபத வினைகள்',
      telugu: 'పరస్మైపద ధాతువులు'
    };

    const labelsAtmane: Record<string, string> = {
      english: 'Atmanepada Verbs',
      sanskrit: 'आत्मनेपदिनः धातवः',
      hindi: 'आत्मनेपद धातु',
      kannada: 'ಆತ್ಮನೇಪದ ಧಾತುಗಳು',
      tamil: 'ஆத்மநேபத வினைகள்',
      telugu: 'ఆత్మనేపద ధాతువులు'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsParasmai[activeLanguage] || 'Parasmaipada Verbs'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {parasmaipadaVerbs.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsAtmane[activeLanguage] || 'Atmanepada Verbs'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {atmanepadaVerbs.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSandhiIndex = () => {
    const svaraSandhis = [
      { id: 1, label: '१.१ सवर्णदीर्घ', prefix: '१.१' },
      { id: 2, label: '१.२ गुण', prefix: '१.२' },
      { id: 3, label: '१.३ वृद्धि', prefix: '१.३' },
      { id: 4, label: '१.४ पूर्वरूप', prefix: '१.४' },
      { id: 5, label: '१.५ यण्', prefix: '१.५' },
      { id: 6, label: '१.६ यान्त-वान्तादेश', prefix: '१.६' },
      { id: 7, label: '१.७ प्रकृतिभाव', prefix: '१.७' }
    ];

    const vyanjanaSandhis = [
      { id: 8, label: '२.१ श्चुत्व', prefix: '२.१' },
      { id: 9, label: '२.२ ष्टुत्व', prefix: '२.२' },
      { id: 10, label: '२.३ जश्त्व', prefix: '२.३' },
      { id: 11, label: '२.४ अनुनासिक', prefix: '२.४' },
      { id: 12, label: '२.५ अनुस्वार', prefix: '२.५' },
      { id: 13, label: '२.६ परसवर्ण', prefix: '२.६' },
      { id: 14, label: '२.७ ङमुडागम', prefix: '२.७' },
      { id: 15, label: '२.८ छत्व', prefix: '२.८ छत्व' },
      { id: 16, label: '२.८ लत्व', prefix: '२.८ लत्व' },
      { id: 17, label: '२.९ रेफलोप', prefix: '२.९' },
      { id: 18, label: '२.१० शर्', prefix: '२.१०' }
    ];

    const visargaSandhis = [
      { id: 19, label: '३.१ सकारादेश', prefix: '३.१' },
      { id: 20, label: '३.२ उकारदेश', prefix: '३.२' },
      { id: 21, label: '३.३ रेफादेश', prefix: '३.३' },
      { id: 22, label: '३.४ विसर्गलोप', prefix: '३.४' }
    ];

    const labelsSvara: Record<string, string> = {
      english: 'Svara Sandhi (Vowels)',
      sanskrit: 'स्वरसन्धिः (अच् सन्धिः)',
      hindi: 'स्वर सन्धि',
      kannada: 'ಸ್ವರ ಸಂಧಿ',
      tamil: 'உயிர் புணர்ச்சி (ஸ்வர சந்தி)',
      telugu: 'స్వర సంధి'
    };

    const labelsVyanjana: Record<string, string> = {
      english: 'Vyanjana Sandhi (Consonants)',
      sanskrit: 'व्यञ्जनसन्धिः (हल् सन्धिः)',
      hindi: 'व्यञ्जन सन्धि',
      kannada: 'ವ್ಯಂಜನ ಸಂಧಿ',
      tamil: 'மெய் புணர்ச்சி (வ்யஞ்ஜன சந்தி)',
      telugu: 'వ్యంజన సంధి'
    };

    const labelsVisarga: Record<string, string> = {
      english: 'Visarga Sandhi',
      sanskrit: 'विसर्गसन्धिः',
      hindi: 'विसर्ग सन्धि',
      kannada: 'ವಿಸರ್ಗ ಸಂಧಿ',
      tamil: 'விசர்க்க புணர்ச்சி',
      telugu: 'విసర్గ సంధి'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsSvara[activeLanguage] || 'Svara Sandhi'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {svaraSandhis.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsVyanjana[activeLanguage] || 'Vyanjana Sandhi'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {vyanjanaSandhis.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsVisarga[activeLanguage] || 'Visarga Sandhi'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {visargaSandhis.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSamasaIndex = () => {
    const compoundPills = [
      { id: 1, label: '१.१ सामान्य-तत्पुरुष (General Tatpurusha)', prefix: '१.१ सामान्य' },
      { id: 2, label: '१.२ नञ्-तत्पुरुष (Negative)', prefix: '१.२ नञ्' },
      { id: 3, label: '१.३ उपपद-तत्पुरुष (Upapada)', prefix: '१.३' },
      { id: 4, label: '१.४ प्रादि-तत्पुरुष (Pradi)', prefix: '१.४' },
      { id: 5, label: '१.५ कर्मधारय (Karmadharaya)', prefix: '१.५' },
      { id: 6, label: '१.६ द्विगु (Dvigu)', prefix: '१.६' },
      { id: 7, label: '२.१ इतरेतर-द्वन्द्व (Itaretara Dvandva)', prefix: '२.१' },
      { id: 8, label: '२.२ समाहार-द्वन्द्व (Samahara Dvandva)', prefix: '२.२' },
      { id: 9, label: '३) अव्ययीभाव (Avyayibhava)', prefix: '३) अव्ययीभाव' },
      { id: 10, label: '४.१ समानाधिकरण-बहुव्रीहि (Bahuvrihi)', prefix: '४.१' }
    ];

    const derivationPills = [
      { id: 11, label: '२. एकशेषवृत्तिः (Ekashesha)', prefix: '२. एकशेषवृत्तिः' },
      { id: 12, label: '३. कृत् वृत्तिः (Kridanta / Verbal Adjectives)', prefix: '३. कृत्' },
      { id: 13, label: '४. तद्धित-प्रत्ययाः (Taddhita / Nominal Derivations)', prefix: '४. तद्धित' },
      { id: 14, label: '५) सनाद्यन्तधातुवृत्तिः (Sanadyanta)', prefix: 'सनाद्यन्त' },
      { id: 15, label: 'प्रयोगाः कारकाणि च (Voices & Cases)', prefix: 'प्रयोगाः' }
    ];

    const labelsCompound: Record<string, string> = {
      english: 'Compound Words (समासाः)',
      sanskrit: 'समासाः',
      hindi: 'समास',
      kannada: 'ಸಮಾಸಗಳು',
      tamil: 'கூட்டுச் சொற்கள் (ஸமாஸங்கள்)',
      telugu: 'సమాసములు'
    };

    const labelsDerivation: Record<string, string> = {
      english: 'Derivations & Voices (वृत्तयः प्रयोगाश्च)',
      sanskrit: 'वृत्तयः प्रयोगाश्च',
      hindi: 'वृत्तियाँ एवं प्रयोग',
      kannada: 'ವೃತ್ತಿಗಳು ಮತ್ತು ಪ್ರಯೋಗಗಳು',
      tamil: 'விருத்திகள் மற்றும் பிரयोகங்கள்',
      telugu: 'వృత్తులు మరియు ప్రయోగములు'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsCompound[activeLanguage] || 'Compound Words'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {compoundPills.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labelsDerivation[activeLanguage] || 'Derivations & Voices'}
          </h4>
          <div className="quick-ref-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {derivationPills.map((item) => (
              <button
                key={item.id}
                className="quick-pill-btn"
                onClick={() => scrollToHeading(item.prefix)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGrammarDashboard = () => {
    if (!['ch6', 'ch8', 'ch9', 'ch10'].includes(activeChapterId)) return null;

    const headerTitle = getGrammarHeaderTitle(activeChapterId, activeLanguage);

    return (
      <div className="grammar-quick-reference open" style={{ marginTop: '16px', width: '100%' }}>
        <div className="quick-ref-static-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 20px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border)',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text-primary)'
        }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          <span>{headerTitle}</span>
        </div>

        <div className="quick-ref-content-single">
          {activeChapterId === 'ch6' && renderShabdaIndex()}
          {activeChapterId === 'ch8' && renderDhatuIndex()}
          {activeChapterId === 'ch9' && renderSandhiIndex()}
          {activeChapterId === 'ch10' && renderSamasaIndex()}
        </div>
      </div>
    );
  };

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
          {activeChapter ? activeChapter.title : (activeChapterId === '' ? getAboutLabel(activeLanguage) : 'Loading Chapter...')}
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

          {activeChapterId !== '' && (
            <button
              className="icon-btn"
              onClick={() => {
                if (activeChapter) {
                  downloadChapterAsPdf(chapterContent, `${activeChapter.id}-${activeLanguage}.pdf`, activeChapter.title);
                }
              }}
              title="Download chapter as PDF"
            >
              <Download size={18} />
            </button>
          )}

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
              <button
                className={`toc-item ${activeChapterId === '' ? 'active' : ''}`}
                onClick={handleNavigateToIntro}
                style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, marginBottom: '8px', paddingBottom: '12px' }}
              >
                <span className="toc-status-indicator"></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{getAboutLabel(activeLanguage)}</div>
                </div>
              </button>
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
            ) : activeChapterId === '' ? (
              <div className="book-intro-container">
                <div className="book-intro-card">
                  <div className="book-intro-cover-wrapper">
                    <img 
                      src={`${import.meta.env.BASE_URL}${book.coverUrl}`} 
                      alt={displayTitle} 
                      className="book-intro-cover" 
                    />
                  </div>
                  <div className="book-intro-info">
                    <h1 className="book-intro-title">{displayTitle}</h1>
                    <div className="book-intro-author">By {book.author}</div>
                    
                    <div className="book-intro-meta">
                      <span className="intro-meta-item">{book.genre}</span>
                      <span className="intro-meta-divider">•</span>
                      <span className="intro-meta-item">{book.year}</span>
                    </div>
                    
                    <p className="book-intro-desc">
                      {book.localized?.[activeLanguage]?.description || book.description}
                    </p>
                    
                    <div className="book-intro-actions">
                      <button 
                        className="intro-btn-primary" 
                        onClick={() => {
                          if (langChapters.length > 0) {
                            handleNavigateToChapter(langChapters[0].id);
                          }
                        }}
                      >
                        Start Reading
                      </button>
                      
                      {savedProgress && savedProgress.currentLanguage === activeLanguage && (
                        <button 
                          className="intro-btn-secondary"
                          onClick={() => {
                            handleNavigateToChapter(savedProgress.currentChapterId, savedProgress.scrollPercent);
                          }}
                        >
                          Resume: {Math.round(savedProgress.scrollPercent)}% (Chapter {
                            (() => {
                              const chIdx = langChapters.findIndex(c => c.id === savedProgress.currentChapterId);
                              return chIdx !== -1 ? chIdx + 1 : 1;
                            })()
                          })
                        </button>
                      )}
                      
                      <button
                        className="intro-btn-secondary"
                        onClick={() => downloadFullBookAsPdf(book, activeLanguage)}
                        title={`Download entire book as PDF in ${activeLanguage}`}
                      >
                        <Download size={16} style={{ marginRight: '6px' }} />
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="book-intro-chapters-section">
                  <h2 className="chapters-section-title">Table of Contents</h2>
                  <div className="intro-chapters-list">
                    {langChapters.map((chapter, index) => {
                      const progressPercent = getChapterProgressPercent(chapter.id);
                      return (
                        <button
                          key={chapter.id}
                          className="intro-chapter-card"
                          onClick={() => handleNavigateToChapter(chapter.id)}
                        >
                          <span className="intro-chapter-num">{index + 1}</span>
                          <div className="intro-chapter-details">
                            <span className="intro-chapter-title">{chapter.title}</span>
                            <span className="intro-chapter-progress">
                              {progressPercent === 100 ? 'Completed' : progressPercent > 0 ? `${progressPercent}% read` : 'Unread'}
                            </span>
                          </div>
                          <span className="intro-chapter-arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {renderGrammarDashboard()}
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
                      <button 
                        className="nav-btn prev"
                        onClick={handleNavigateToIntro}
                      >
                        <span className="nav-btn-label">Book Info</span>
                        <span className="nav-btn-title">About this Book</span>
                      </button>
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
              </>
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
