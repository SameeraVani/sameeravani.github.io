import React, { useState, useEffect } from 'react';
import type { Book, ReadingProgressMap } from '../types';
import { Search, BookOpen, Layers, ArrowRight } from 'lucide-react';

interface CatalogProps {
  onSelectBook: (bookId: string) => void;
  progress: ReadingProgressMap;
  appLanguage: string;
  onChangeLanguage: (lang: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ 
  onSelectBook, 
  progress,
  appLanguage,
  onChangeLanguage
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/catalog.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load book catalog. Please ensure books/catalog.json exists.');
        }
        return res.json();
      })
      .then((data: Book[]) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'An error occurred while loading books.');
        setLoading(false);
      });
  }, []);

  // Filter books based on search query and selected genre
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  // Extract unique genres for filter dropdown
  const genres = ['all', ...Array.from(new Set(books.map((b) => b.genre)))];

  // Calculate reading progress percentage
  const getBookProgressPercent = (book: Book) => {
    const bookProgress = progress[book.id];
    if (!bookProgress) return 0;
    
    const activeLang = bookProgress.currentLanguage || book.languages[0];
    const langChapters = book.chapters[activeLang];
    if (!langChapters || langChapters.length === 0) return 0;

    // Find index of the current chapter
    const currentIdx = langChapters.findIndex((c) => c.id === bookProgress.currentChapterId);
    if (currentIdx === -1) return 0;

    // Calculate percentage based on chapter index and the scroll position of that chapter
    const totalChapters = langChapters.length;
    
    // Each chapter represents an equal fraction of the book
    const baseProgress = (currentIdx / totalChapters) * 100;
    const chapterWeight = 100 / totalChapters;
    const scrollContribution = (bookProgress.scrollPercent / 100) * chapterWeight;
    
    const overall = Math.min(Math.round(baseProgress + scrollContribution), 100);
    return overall;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Opening the archives, please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loader-container" style={{ color: '#ef4444' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <header className="hero-section">
        <h1 className="hero-title">SameeraVani</h1>
        <p className="hero-subtitle">
          Explore our collection of classics and modern literature. Customize your typography, track your progress, and take bookmarks on any device.
        </p>
      </header>

      <div className="control-bar">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            id="catalog-search"
            type="text"
            className="search-input"
            placeholder="Search by title, author, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          id="global-language-select"
          className="genre-select"
          value={appLanguage}
          onChange={(e) => onChangeLanguage(e.target.value)}
          title="Choose display language"
        >
          <option value="english">English</option>
          <option value="sanskrit">Sanskrit (संस्कृतम्)</option>
          <option value="hindi">Hindi (हिन्दी)</option>
          <option value="kannada">Kannada (ಕನ್ನಡ)</option>
          <option value="tamil">Tamil (தமிழ்)</option>
          <option value="telugu">Telugu (తెలుగు)</option>
        </select>

        <select
          id="genre-filter"
          className="genre-select"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre === 'all' ? 'All Genres' : genre}
            </option>
          ))}
        </select>
      </div>

      <main className="books-grid">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => {
            const progressPercent = getBookProgressPercent(book);
            const coverUrlPath = book.coverUrl.startsWith('http')
              ? book.coverUrl
              : `${import.meta.env.BASE_URL}${book.coverUrl}`;
              
            return (
              <article
                key={book.id}
                className="book-card"
                onClick={() => onSelectBook(book.id)}
              >
                <div className="book-cover-container">
                  <span className="genre-badge">{book.genre}</span>
                  <img
                    src={coverUrlPath}
                    alt={`${book.title} cover`}
                    className="book-cover"
                    loading="lazy"
                  />
                </div>
                
                <div className="book-details">
                  <div className="book-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>{book.year}</span>
                    <span> &bull; </span>
                    <span>{book.chapters[book.languages[0]]?.length || 0} Chapters</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                      {book.languages.map((lang) => {
                        const labels: Record<string, string> = {
                          english: 'EN',
                          sanskrit: 'SA',
                          hindi: 'HI',
                          kannada: 'KN',
                          tamil: 'TA',
                          telugu: 'TE'
                        };
                        return (
                          <span 
                            key={lang} 
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              backgroundColor: 'var(--bg-tertiary)', 
                              fontWeight: 700,
                              color: 'var(--text-muted)' 
                            }}
                            title={lang.charAt(0).toUpperCase() + lang.slice(1)}
                          >
                            {labels[lang] || lang.substring(0, 2).toUpperCase()}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                  {(() => {
                    const activeLang = book.languages.includes(appLanguage) ? appLanguage : book.languages[0];
                    const displayTitle = book.localized?.[activeLang]?.title || book.title;
                    const displayDesc = book.localized?.[activeLang]?.description || book.description;
                    return (
                      <>
                        <h2 className="book-title">{displayTitle}</h2>
                        <p className="book-author">by {book.author}</p>
                        <p className="book-desc">{displayDesc}</p>
                      </>
                    );
                  })()}
                  
                  <div className="card-progress-container">
                    <div className="progress-header">
                      <span>{progressPercent > 0 ? 'Reading Progress' : 'Not started'}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <button className="card-action-btn">
                      <BookOpen size={16} />
                      {progressPercent === 100 ? (
                        <span>Read Again</span>
                      ) : progressPercent > 0 ? (
                        <span>Continue Reading</span>
                      ) : (
                        <span>Start Reading</span>
                      )}
                      <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <Layers size={48} style={{ marginBottom: '16px' }} />
            <h3>No books found matching your criteria.</h3>
            <p>Try clearing filters or refining your search keywords.</p>
          </div>
        )}
      </main>
    </div>
  );
};
