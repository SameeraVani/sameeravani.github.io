export interface ParsedRoute {
  mode: 'reading' | 'video' | 'articles' | 'lessons';
  bookId: string | null;
  lang: string | null;
  chapterId: string | null;
  playlistId: string | null;
  videoId: string | null;
  topicId: string | null;
  lessonId: string | null;
}

const KNOWN_LANGUAGES = ['tamil', 'english', 'sanskrit', 'hindi', 'kannada', 'telugu', 'ta', 'en', 'sa', 'hi', 'kn', 'te'];

const normalizeLang = (l: string | null): string | null => {
  if (!l) return null;
  const map: { [k: string]: string } = {
    ta: 'tamil',
    en: 'english',
    sa: 'sanskrit',
    hi: 'hindi',
    kn: 'kannada',
    te: 'telugu',
  };
  return map[l.toLowerCase()] || l.toLowerCase();
};

export function parseRoute(): ParsedRoute {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Try query params
  const qMode = searchParams.get('mode');
  const qBook = searchParams.get('book');
  const qLang = normalizeLang(searchParams.get('lang'));
  const qChapter = searchParams.get('chapter');
  const qPlaylist = searchParams.get('playlist');
  const qVideo = searchParams.get('video') || searchParams.get('v');
  const qTopic = searchParams.get('topic');
  const qLesson = searchParams.get('lesson') || searchParams.get('article');
  
  const baseUrl = import.meta.env.BASE_URL; // e.g. "/" or "/repo/"
  let relativePath = pathname;
  if (baseUrl !== '/' && pathname.startsWith(baseUrl)) {
    relativePath = pathname.substring(baseUrl.length - 1); // keep leading "/"
  }
  
  const parts = relativePath.split('/').filter(Boolean);

  // Articles / Quick Lessons path: /articles, /quick-lessons or /lessons
  if (parts[0] === 'articles' || parts[0] === 'quick-lessons' || parts[0] === 'lessons') {
    let topicId: string | null = null;
    let lang: string | null = qLang;
    let lessonId: string | null = qLesson || null;

    if (parts.length === 2) {
      if (KNOWN_LANGUAGES.includes(parts[1].toLowerCase())) {
        lang = normalizeLang(parts[1]);
      } else {
        topicId = parts[1];
      }
    } else if (parts.length === 3) {
      if (KNOWN_LANGUAGES.includes(parts[1].toLowerCase())) {
        lang = normalizeLang(parts[1]);
        topicId = parts[2];
      } else if (KNOWN_LANGUAGES.includes(parts[2].toLowerCase())) {
        topicId = parts[1];
        lang = normalizeLang(parts[2]);
      } else {
        topicId = parts[1];
        lessonId = parts[2];
      }
    } else if (parts.length >= 4) {
      if (KNOWN_LANGUAGES.includes(parts[1].toLowerCase())) {
        lang = normalizeLang(parts[1]);
        topicId = parts[2];
        lessonId = parts[3];
      } else if (KNOWN_LANGUAGES.includes(parts[2].toLowerCase())) {
        topicId = parts[1];
        lang = normalizeLang(parts[2]);
        lessonId = parts[3];
      } else {
        topicId = parts[1];
        lessonId = parts[2];
      }
    }

    return {
      mode: 'articles',
      bookId: null,
      lang: lang || qLang || null,
      chapterId: null,
      playlistId: null,
      videoId: null,
      topicId: topicId || qTopic || null,
      lessonId: lessonId || qLesson || null,
    };
  }

  // Videos path: /videos
  if (parts[0] === 'videos') {
    const bookId = parts[1] || qBook || null;
    let playlistId: string | null = qPlaylist || null;
    let videoId: string | null = qVideo || null;
    
    if (parts[2]) {
      const rawPart2 = decodeURIComponent(parts[2]);
      if (parts[3]) {
        playlistId = rawPart2;
        videoId = parts[3];
      } else {
        playlistId = rawPart2;
      }
    }
    
    return {
      mode: 'video',
      bookId,
      lang: qLang,
      chapterId: null,
      playlistId,
      videoId,
      topicId: null,
      lessonId: null,
    };
  }

  // Books path: /books
  if (parts[0] === 'books' && parts[1]) {
    return {
      mode: 'reading',
      bookId: parts[1],
      lang: normalizeLang(parts[2]) || qLang || null,
      chapterId: parts[3] || qChapter || null,
      playlistId: null,
      videoId: null,
      topicId: null,
      lessonId: null,
    };
  }

  // Fallback query parameters
  if (qMode === 'articles' || qMode === 'lessons' || qTopic || qLesson) {
    return {
      mode: 'articles',
      bookId: null,
      lang: qLang,
      chapterId: null,
      playlistId: null,
      videoId: null,
      topicId: qTopic || null,
      lessonId: qLesson || null,
    };
  }

  if (qMode === 'video' || qVideo || qPlaylist) {
    return {
      mode: 'video',
      bookId: qBook,
      lang: qLang,
      chapterId: null,
      playlistId: qPlaylist,
      videoId: qVideo,
      topicId: null,
      lessonId: null,
    };
  }

  if (qBook) {
    return {
      mode: 'reading',
      bookId: qBook,
      lang: qLang,
      chapterId: qChapter,
      playlistId: null,
      videoId: null,
      topicId: null,
      lessonId: null,
    };
  }

  return {
    mode: 'reading',
    bookId: null,
    lang: qLang,
    chapterId: null,
    playlistId: null,
    videoId: null,
    topicId: null,
    lessonId: null,
  };
}

export function getUrlForRoute(
  bookId?: string | null,
  lang?: string | null,
  chapterId?: string | null
): string {
  const baseUrl = import.meta.env.BASE_URL;
  const basePrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  if (!bookId) {
    return basePrefix;
  }

  let path = `${basePrefix}books/${bookId}`;
  if (lang) {
    path += `/${lang}`;
    if (chapterId) {
      path += `/${chapterId}`;
    }
  }

  return path.endsWith('/') ? path : path + '/';
}

export function getVideoUrlForRoute(
  bookId?: string | null,
  playlistId?: string | null,
  videoId?: string | null
): string {
  const baseUrl = import.meta.env.BASE_URL;
  const basePrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  if (!bookId) {
    return `${basePrefix}videos/`;
  }

  let path = `${basePrefix}videos/${bookId}`;
  if (playlistId) {
    path += `/${encodeURIComponent(playlistId)}`;
  }
  if (videoId) {
    path += `?v=${videoId}`;
  }

  return path.includes('?') ? path : path + '/';
}

export function getArticleUrlForRoute(
  topicId?: string | null,
  langOrArticleId?: string | null,
  articleId?: string | null
): string {
  const baseUrl = import.meta.env.BASE_URL;
  const basePrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  let lang: string | null = null;
  let artId: string | null = null;

  if (KNOWN_LANGUAGES.includes((langOrArticleId || '').toLowerCase())) {
    lang = langOrArticleId || null;
    artId = articleId || null;
  } else {
    artId = langOrArticleId || null;
    lang = articleId || null;
  }

  if (!topicId) {
    if (lang) {
      return `${basePrefix}articles/${lang}/`;
    }
    return `${basePrefix}articles/`;
  }

  let path = `${basePrefix}articles/${topicId}`;
  if (lang) {
    path += `/${lang}`;
  }
  if (artId) {
    path += `/${artId}`;
  }

  return path.endsWith('/') ? path : path + '/';
}

export const getQuickLessonUrlForRoute = getArticleUrlForRoute;
