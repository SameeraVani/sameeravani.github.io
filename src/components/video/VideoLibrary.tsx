import React, { useState, useEffect } from 'react';
import type { Book, VideoPlaylist } from '../../types';
import { Search, ArrowLeft, PlayCircle } from 'lucide-react';
import { VideoDashboard } from './VideoDashboard';

export const VideoLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<VideoPlaylist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/video-catalog.json?t=${Date.now()}`)
      .then(res => res.json())
      .then((data: Book[]) => {
        // Filter only books that have playlists in at least one language
        const booksWithVideos = data.filter(book => {
          return book.playlists && Object.values(book.playlists).some(lists => lists.length > 0);
        });
        setBooks(booksWithVideos);
      });
  }, []);

  if (selectedPlaylist && selectedBook) {
    return (
      <VideoDashboard 
        activePlaylist={selectedPlaylist} 
        onBack={() => setSelectedPlaylist(null)} 
      />
    );
  }

  return (
    <div className="catalog-container" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '20px' }}>
      <div className="catalog-content">
        <header className="catalog-header" style={{ marginBottom: '30px' }}>
          <h1 className="catalog-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedBook ? (
              <>
                <button onClick={() => setSelectedBook(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={24} />
                </button>
                {selectedBook.title} - Video Playlists
              </>
            ) : (
              <>
                <PlayCircle size={32} color="var(--accent)" />
                Video Library
              </>
            )}
          </h1>
          <div className="catalog-search" style={{ marginTop: '20px', position: 'relative' }}>
            <Search className="search-icon" size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="search-input"
              placeholder={selectedBook ? "Search playlists..." : "Search video books..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>
        </header>

        {!selectedBook ? (
          <div className="catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(book => (
              <div 
                key={book.id} 
                className="book-card" 
                onClick={() => setSelectedBook(book)}
                style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '20px', flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-primary)' }}>{book.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>{book.description.substring(0, 100)}...</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <PlayCircle size={16} />
                    {Object.values(book.playlists || {}).reduce((acc, curr) => acc + curr.length, 0)} Playlists Available
                  </div>
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No video books available.
              </div>
            )}
          </div>
        ) : (
          <div className="catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {Object.entries(selectedBook.playlists || {}).flatMap(([lang, lists]) => 
              lists.map(list => ({ ...list, lang }))
            ).filter(list => list.title.toLowerCase().includes(searchQuery.toLowerCase())).map((playlist, idx) => (
              <div 
                key={`${playlist.id}-${idx}`} 
                onClick={() => setSelectedPlaylist(playlist)}
                style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <PlayCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{playlist.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Language: {playlist.lang}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
