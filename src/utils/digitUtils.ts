/**
 * Converts Indic digits (Devanagari, Kannada, Telugu, Tamil, etc.) to English (ASCII) digits.
 */
export const toEnglishDigits = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[०0೦౦௦]/g, '0')
    .replace(/[१1೧౧௧]/g, '1')
    .replace(/[२2೨౨௨]/g, '2')
    .replace(/[३3೩౩௩]/g, '3')
    .replace(/[४4೪౪௪]/g, '4')
    .replace(/[५5೫౫௫]/g, '5')
    .replace(/[६6೬౬௬]/g, '6')
    .replace(/[७7೭౭௭]/g, '7')
    .replace(/[८8೮౮௮]/g, '8')
    .replace(/[९9೯౯]/g, '9');
};

/**
 * Formats a shloka number string to include the English digit representation if different from original.
 * Example: "१.५" => "१.५ (#1.5)"
 * Example: "1.5" => "1.5"
 */
export const formatShlokaNumberWithEnglish = (num: string): string => {
  if (!num) return '';
  const engNum = toEnglishDigits(num);
  if (!engNum || engNum === num || num.includes(`#${engNum}`)) {
    return num;
  }
  return `${num} (#${engNum})`;
};

/**
 * Strips markdown symbols, markdown escapes, links, and HTML tags from a text string.
 */
export const stripMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1') // unescape markdown backslashes e.g. \- or \!
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) -> link text
    .replace(/[*_~`#]/g, '') // remove bold, italic, strikethrough, backticks, headings
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/\s+/g, ' ') // collapse consecutive whitespace
    .trim();
};

/**
 * Checks whether a line is a speaker header (e.g. सञ्जय उवाच, श्री भगवानुवाच, अर्जुन उवाच, Sanjaya uvaca).
 */
export const isSpeakerLine = (line: string): boolean => {
  const clean = stripMarkdown(line);
  if (!clean) return false;

  // Sanskrit / Devanagari speaker lines
  if (
    /^(?:श्री\s*)?(?:भगवान्?|सञ्जय|संजय|अर्जुन|धृतराष्ट्र|भीष्म|द्रोण|विदुर|गान्धारी|कुन्ती|युधिष्ठिर|भीम|नकुल|सहदेव|सूत|शौनक|ब्रह्मा|रुद्र|इन्द्र|नारद|कपिल|ऋषि|ऋषयः?|देव)\s*(?:उवाच|ऊचुः|उवाचुः):?$/i.test(
      clean
    )
  ) {
    return true;
  }

  if (
    clean.endsWith('उवाच') ||
    clean.endsWith('उवाच:') ||
    clean.endsWith('ऊचुः') ||
    clean.endsWith('ऊचुः:') ||
    clean.endsWith('उवाचुः') ||
    clean.endsWith('उवाचुः:')
  ) {
    return true;
  }

  // English / IAST transliteration patterns (e.g. Sanjaya uvāca, Arjuna said, Lord Krishna said)
  if (/^[A-Z][a-zA-Z\s]+(?:uvāca|uvaca|said|spoke):?$/i.test(clean)) {
    return true;
  }

  return false;
};

