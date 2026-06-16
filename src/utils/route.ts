export interface ParsedRoute {
  bookId: string | null;
  lang: string | null;
  chapterId: string | null;
}

export function parseRoute(): ParsedRoute {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Try query params first (backward compatibility)
  const qBook = searchParams.get('book');
  const qLang = searchParams.get('lang');
  const qChapter = searchParams.get('chapter');
  
  if (qBook) {
    return { bookId: qBook, lang: qLang, chapterId: qChapter };
  }
  
  // Try clean paths
  const baseUrl = import.meta.env.BASE_URL; // e.g. "/" or "/repo/"
  let relativePath = pathname;
  if (baseUrl !== '/' && pathname.startsWith(baseUrl)) {
    relativePath = pathname.substring(baseUrl.length - 1); // keep leading "/"
  }
  
  // Clean trailing slashes and split
  const parts = relativePath.split('/').filter(Boolean); // e.g. ["books", "sanskrit-learner", "sa", "ch2"]
  
  if (parts[0] === 'books' && parts[1]) {
    return {
      bookId: parts[1],
      lang: parts[2] || null,
      chapterId: parts[3] || null
    };
  }
  
  return { bookId: null, lang: null, chapterId: null };
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
