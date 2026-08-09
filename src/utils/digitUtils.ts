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
