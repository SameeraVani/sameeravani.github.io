export interface Chapter {
  id: string;
  title: string;
  path: string;
  shlokaLabel?: string;
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
  shlokaLabel?: string;
  localized?: {
    [lang: string]: {
      title: string;
      description: string;
      shlokaLabel?: string;
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LocalizedArticleContent {
  title: string;
  summary: string;
  content?: string;
  path?: string;
  quiz?: QuizQuestion[];
}

export type LocalizedLessonContent = LocalizedArticleContent;

export interface Article {
  id: string;
  topicId?: string;
  title?: string;
  summary?: string;
  content?: string;
  date?: string;
  path?: string;
  quiz?: QuizQuestion[];
  localized?: {
    [lang: string]: LocalizedArticleContent;
  };
}

export type MicroLesson = Article;

export interface ArticleTopic {
  id: string;
  title: string;
  description?: string;
  category?: string;
  coverUrl?: string;
  localized?: {
    [lang: string]: {
      title: string;
      description?: string;
    };
  };
  lessons: Article[];
}

export type LessonTopic = ArticleTopic;

export interface ArticleProgress {
  completed: boolean;
  score: number;
  total: number;
  lastAttemptTime: number;
}

export type LessonProgress = ArticleProgress;

export interface ArticleProgressMap {
  [articleId: string]: ArticleProgress;
}

export type LessonProgressMap = ArticleProgressMap;

