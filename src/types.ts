export interface Chapter {
  id: string;
  title: string;
  path: string;
  topics?: Chapter[];
}

export interface VideoPlaylist {
  id: string;
  title: string;
  groupRegex?: string;
  groupPrefix?: string;
  chunkSize?: number;
  chunkPrefix?: string;
}

export interface Book {
  id: string;
  author: string;
  year: string;
  genre: string;
  coverUrl: string;
  languages: string[]; // List of supported languages, e.g., ['english', 'sanskrit']
  title: string; // Default title
  description: string; // Default description
  localized?: {
    [lang: string]: {
      title: string;
      description: string;
    };
  };
  chapters?: {
    [lang: string]: Chapter[];
  };
  playlists?: {
    [lang: string]: VideoPlaylist[];
  };
}

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'slate';
export type ReaderFontFamily = 'lora' | 'inter' | 'opendyslexic';
export type ReaderLineHeight = 'compact' | 'standard' | 'spacious';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number;
  fontFamily: ReaderFontFamily;
  lineHeight: ReaderLineHeight;
}

export interface BookReadingProgress {
  currentLanguage: string;
  currentChapterId: string;
  scrollPercent: number;
  lastReadTime: number;
}

export interface ReadingProgressMap {
  [bookId: string]: BookReadingProgress;
}

export interface Bookmark {
  id: string;
  bookId: string;
  language: string;
  chapterId: string;
  chapterTitle: string;
  textSnippet: string;
  scrollPercent: number;
  createdAt: number;
}
