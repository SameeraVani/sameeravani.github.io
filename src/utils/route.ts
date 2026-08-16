export interface ParsedRoute {
  mode: 'reading' | 'video';
  bookId: string | null;
  lang: string | null;
  chapterId: string | null;
  playlistId: string | null;
  videoId: string | null;
}

export function parseRoute(): ParsedRoute {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Try query params first
  const qMode = searchParams.get('mode');
  const qBook = searchParams.get('book');
  const qLang = searchParams.get('lang');
  const qChapter = searchParams.get('chapter');
  const qPlaylist = searchParams.get('playlist');
  const qVideo = searchParams.get('video') || searchParams.get('v');
  
  const baseUrl = import.meta.env.BASE_URL; // e.g. "/" or "/repo/"
  let relativePath = pathname;
  if (baseUrl !== '/' && pathname.startsWith(baseUrl)) {
    relativePath = pathname.substring(baseUrl.length - 1); // keep leading "/"
  }
  
  const parts = relativePath.split('/').filter(Boolean);
  
  // If URL explicitly points to /videos
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
    };
  }

  // If URL points to /books
  if (parts[0] === 'books' && parts[1]) {
    return {
      mode: 'reading',
      bookId: parts[1],
      lang: parts[2] || qLang || null,
      chapterId: parts[3] || qChapter || null,
      playlistId: null,
      videoId: null,
    };
  }

  // Fallback query parameters
  if (qMode === 'video' || qVideo || qPlaylist) {
    return {
      mode: 'video',
      bookId: qBook,
      lang: qLang,
      chapterId: null,
      playlistId: qPlaylist,
      videoId: qVideo,
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
    };
  }

  return {
    mode: 'reading',
    bookId: null,
    lang: null,
    chapterId: null,
    playlistId: null,
    videoId: null,
  };
}

export function getUrlForRoute(bookId: string | null, lang: string | null, chapterId: string | null): string {
  const baseUrl = import.meta.env.BASE_URL; // e.g. "/" or "/repo/"
  const basePrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  
  if (!bookId) {
    return baseUrl; // catalog root
  }
  
  let path = `${basePrefix}books/${bookId}`;
  if (lang) {
    path += `/${lang}`;
    if (chapterId) {
      path += `/${chapterId}`;
    }
  }
  return path + '/';
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
    const primaryId = playlistId.split(',')[0].trim();
    path += `/${encodeURIComponent(primaryId)}`;
    if (videoId) {
      path += `/${videoId}`;
    }
  } else if (videoId) {
    path += `?v=${videoId}`;
  }

  return path.includes('?') ? path : path + '/';
}

