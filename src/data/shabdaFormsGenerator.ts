// Declension Forms Generator for Sanskrit Nouns (Lesson 6 & Textbook Exercises)
// Accurately conjugates nouns and generates 4 clubbed options (एक. - द्वि. - बहु.) per row.

export type VibhaktiName = 'प्रथमा' | 'द्वितीया' | 'तृतीया' | 'चतुर्थी' | 'पञ्चमी' | 'षष्ठी' | 'सप्तमी';

export const VIBHAKTI_LIST: VibhaktiName[] = [
  'प्रथमा',
  'द्वितीया',
  'तृतीया',
  'चतुर्थी',
  'पञ्चमी',
  'षष्ठी',
  'सप्तमी'
];

export interface DeclensionRow {
  id: string;
  stem: string;
  meaning?: string;
  paradigm: string;
  paradigmLabel: string;
  vibhakti: VibhaktiName;
  ekavachana: string;
  dvivachana: string;
  bahuvachana: string;
  correctCombined: string; // e.g. "छात्रस्य - छात्रयोः - छात्राणाम्"
  options: string[]; // 4 clubbed options
  notes?: string;
}

interface StemDefinition {
  stem: string;
  meaning: string;
  paradigm: 'akaranta-pu' | 'ikaranta-pu' | 'ukaranta-pu' | 'akaranta-stree' | 'ikaranta-stree' | 'eekaranta-stree' | 'akaranta-napum';
  paradigmLabel: string;
  hasNatvaR?: boolean; // contains r/sh triggering n -> n
}

export const CHAPTER_6_NOUNS: StemDefinition[] = [
  // 1. अकारान्तः पुल्लिङ्गः (राम शब्दवत्)
  { stem: 'छात्र', meaning: 'student', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'बालक', meaning: 'boy', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: false },
  { stem: 'सूर्य', meaning: 'sun', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'वृक्ष', meaning: 'tree', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'कृष्ण', meaning: 'Krishna', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'देव', meaning: 'deva / god', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: false },
  { stem: 'नृप', meaning: 'king', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'गज', meaning: 'elephant', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: false },
  { stem: 'अश्व', meaning: 'horse', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: false },
  { stem: 'ग्राम', meaning: 'village', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },
  { stem: 'हस्त', meaning: 'hand', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: false },
  { stem: 'पुत्र', meaning: 'son', paradigm: 'akaranta-pu', paradigmLabel: 'अकारान्तः पुल्लिङ्गः (रामवत्)', hasNatvaR: true },

  // 2. इकारान्तः पुल्लिङ्गः (हरि शब्दवत्)
  { stem: 'मुनि', meaning: 'sage / ascetic', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: false },
  { stem: 'कवि', meaning: 'poet', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: false },
  { stem: 'ऋषि', meaning: 'seer / rishi', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: true },
  { stem: 'रवि', meaning: 'sun', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: true },
  { stem: 'गिरि', meaning: 'mountain', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: true },
  { stem: 'कपि', meaning: 'monkey', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: false },
  { stem: 'अग्नि', meaning: 'fire', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: false },
  { stem: 'यति', meaning: 'ascetic', paradigm: 'ikaranta-pu', paradigmLabel: 'इकारान्तः पुल्लिङ्गः (हरिवत्)', hasNatvaR: false },

  // 3. उकारान्तः पुल्लिङ्गः (गुरु शब्दवत्)
  { stem: 'साधु', meaning: 'virtuous saint', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },
  { stem: 'भानु', meaning: 'sun', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },
  { stem: 'शिशु', meaning: 'child / infant', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },
  { stem: 'विष्णु', meaning: 'Vishnu', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: true },
  { stem: 'वायु', meaning: 'wind', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },
  { stem: 'प्रभु', meaning: 'master / lord', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: true },
  { stem: 'बन्धु', meaning: 'kinsman / relative', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },
  { stem: 'शम्भु', meaning: 'Shiva', paradigm: 'ukaranta-pu', paradigmLabel: 'उकारान्तः पुल्लिङ्गः (गुरुवत्)', hasNatvaR: false },

  // 4. आकारान्तः स्त्रीलिङ्गः (रमा / लता शब्दवत्)
  { stem: 'लता', meaning: 'creeper / vine', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'सीता', meaning: 'Sita', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'माला', meaning: 'garland', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'बाला', meaning: 'girl', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'शाला', meaning: 'school / hall', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'कथा', meaning: 'story', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },
  { stem: 'क्रीडा', meaning: 'sport / play', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: true },
  { stem: 'छाया', meaning: 'shade', paradigm: 'akaranta-stree', paradigmLabel: 'आकारान्तः स्त्रीलिङ्गः (रमावत्)', hasNatvaR: false },

  // 5. इकारान्तः स्त्रीलिङ्गः (रुचि / मति शब्दवत्)
  { stem: 'मति', meaning: 'intellect / mind', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'कीर्ति', meaning: 'fame', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: true },
  { stem: 'भूमि', meaning: 'earth', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'शक्ति', meaning: 'power', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'भक्ति', meaning: 'devotion', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'शान्ति', meaning: 'peace', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'बुद्धि', meaning: 'wisdom', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: false },
  { stem: 'प्रीति', meaning: 'affection / love', paradigm: 'ikaranta-stree', paradigmLabel: 'इकारान्तः स्त्रीलिङ्गः (रुचिवत्)', hasNatvaR: true },

  // 6. ईकारान्तः स्त्रीलिङ्गः (नदी शब्दवत्)
  { stem: 'जननी', meaning: 'mother', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: false },
  { stem: 'गौरी', meaning: 'Gauri', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: true },
  { stem: 'पार्वती', meaning: 'Parvati', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: true },
  { stem: 'भगिनी', meaning: 'sister', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: false },
  { stem: 'सरस्वती', meaning: 'Sarasvati', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: true },
  { stem: 'नगरी', meaning: 'city', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: true },
  { stem: 'वाणी', meaning: 'speech', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: true },
  { stem: 'दासी', meaning: 'female servant', paradigm: 'eekaranta-stree', paradigmLabel: 'ईकारान्तः स्त्रीलिङ्गः (नदीवत्)', hasNatvaR: false },

  // 7. अकारान्तः नपुंसकलिङ्गः (ज्ञान / फल शब्दवत्)
  { stem: 'फल', meaning: 'fruit', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: false },
  { stem: 'पुस्तक', meaning: 'book', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: false },
  { stem: 'वन', meaning: 'forest', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: false },
  { stem: 'जल', meaning: 'water', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: false },
  { stem: 'पुष्प', meaning: 'flower', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: true },
  { stem: 'पत्र', meaning: 'leaf / letter', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: true },
  { stem: 'नेत्र', meaning: 'eye', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: true },
  { stem: 'गृह', meaning: 'house', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: true },
  { stem: 'कमल', meaning: 'lotus', paradigm: 'akaranta-napum', paradigmLabel: 'अकारान्तः नपुंसकलिङ्गः (फलवत्)', hasNatvaR: false },
];

/**
 * Computes the 3 forms (एकवचनम्, द्विवचनम्, बहुवचनम्) for any stem and requested vibhakti.
 */
export function getDeclensionForms(def: StemDefinition, vibhakti: VibhaktiName): { ek: string; dvi: string; bahu: string; notes?: string } {
  const { stem, paradigm, hasNatvaR } = def;

  // 1. अकारान्तः पुल्लिङ्गः (रामवत्)
  if (paradigm === 'akaranta-pu') {
    const ena = hasNatvaR ? `${stem}ेण` : `${stem}ेन`;
    const anam = hasNatvaR ? `${stem}ाणाम्` : `${stem}ानाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}ः`, dvi: `${stem}ौ`, bahu: `${stem}ाः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${stem}ौ`, bahu: `${stem}ान्` };
      case 'तृतीया': return { ek: ena, dvi: `${stem}ाभ्याम्`, bahu: `${stem}ैः`, notes: hasNatvaR ? 'णत्वम् (ण)' : 'नत्वम् (न)' };
      case 'चतुर्थी': return { ek: `${stem}ाय`, dvi: `${stem}ाभ्याम्`, bahu: `${stem}ेभ्यः` };
      case 'पञ्चमी': return { ek: `${stem}ात्`, dvi: `${stem}ाभ्याम्`, bahu: `${stem}ेभ्यः` };
      case 'षष्ठी': return { ek: `${stem}स्य`, dvi: `${stem}योः`, bahu: anam, notes: hasNatvaR ? 'णत्वम् (णाम्)' : 'नत्वम् (नाम्)' };
      case 'सप्तमी': return { ek: `${stem}े`, dvi: `${stem}योः`, bahu: `${stem}ेषु` };
    }
  }

  // 2. इकारान्तः पुल्लिङ्गः (हरिवत्)
  if (paradigm === 'ikaranta-pu') {
    const base = stem.slice(0, -1); // strip 'ि'
    const ina = hasNatvaR ? `${base}िणा` : `${base}िना`;
    const inam = hasNatvaR ? `${base}ीणाम्` : `${base}ीनाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}ः`, dvi: `${base}ी`, bahu: `${base}यः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${base}ी`, bahu: `${base}ीन्` };
      case 'तृतीया': return { ek: ina, dvi: `${stem}भ्याम्`, bahu: `${stem}भिः` };
      case 'चतुर्थी': return { ek: `${base}ये`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'पञ्चमी': return { ek: `${base}ेः`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'षष्ठी': return { ek: `${base}ेः`, dvi: `${base}्योः`, bahu: inam };
      case 'सप्तमी': return { ek: `${base}ौ`, dvi: `${base}्योः`, bahu: `${stem}षु` };
    }
  }

  // 3. उकारान्तः पुल्लिङ्गः (गुरुवत्)
  if (paradigm === 'ukaranta-pu') {
    const base = stem.slice(0, -1); // strip 'ु'
    const una = hasNatvaR ? `${base}ुणा` : `${base}ुना`;
    const unam = hasNatvaR ? `${base}ूणाम्` : `${base}ूनाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}ः`, dvi: `${base}ू`, bahu: `${base}वः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${base}ू`, bahu: `${base}ून्` };
      case 'तृतीया': return { ek: una, dvi: `${stem}भ्याम्`, bahu: `${stem}भिः` };
      case 'चतुर्थी': return { ek: `${base}वे`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'पञ्चमी': return { ek: `${base}ोः`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'षष्ठी': return { ek: `${base}ोः`, dvi: `${base}्वोः`, bahu: unam };
      case 'सप्तमी': return { ek: `${base}ौ`, dvi: `${base}्वोः`, bahu: `${stem}षु` };
    }
  }

  // 4. आकारान्तः स्त्रीलिङ्गः (रमावत् / लतावत्)
  if (paradigm === 'akaranta-stree') {
    const base = stem.slice(0, -1); // strip 'ा'
    const anam = hasNatvaR ? `${base}ाणाम्` : `${base}ानाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}`, dvi: `${base}े`, bahu: `${stem}ः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${base}े`, bahu: `${stem}ः` };
      case 'तृतीया': return { ek: `${base}या`, dvi: `${stem}भ्याम्`, bahu: `${stem}भिः` };
      case 'चतुर्थी': return { ek: `${base}ायै`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'पञ्चमी': return { ek: `${base}ायाः`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'षष्ठी': return { ek: `${base}ायाः`, dvi: `${base}योः`, bahu: anam };
      case 'सप्तमी': return { ek: `${base}ायाम्`, dvi: `${base}योः`, bahu: `${stem}सु` };
    }
  }

  // 5. इकारान्तः स्त्रीलिङ्गः (रुचि / मति शब्दवत्)
  if (paradigm === 'ikaranta-stree') {
    const base = stem.slice(0, -1); // strip 'ि'
    const inam = hasNatvaR ? `${base}ीणाम्` : `${base}ीनाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}ः`, dvi: `${base}ी`, bahu: `${base}यः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${base}ी`, bahu: `${base}ीः` };
      case 'तृतीया': return { ek: `${base}्या`, dvi: `${stem}भ्याम्`, bahu: `${stem}भिः` };
      case 'चतुर्थी': return { ek: `${base}ये`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'पञ्चमी': return { ek: `${base}ेः`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'षष्ठी': return { ek: `${base}ेः`, dvi: `${base}्योः`, bahu: inam };
      case 'सप्तमी': return { ek: `${base}ौ`, dvi: `${base}्योः`, bahu: `${stem}षु` };
    }
  }

  // 6. ईकारान्तः स्त्रीलिङ्गः (नदी शब्दवत्)
  if (paradigm === 'eekaranta-stree') {
    const base = stem.slice(0, -1); // strip 'ी'
    const inam = hasNatvaR ? `${base}ीणाम्` : `${base}ीनाम्`;
    switch (vibhakti) {
      case 'प्रथमा': return { ek: `${stem}`, dvi: `${base}्यौ`, bahu: `${base}्यः` };
      case 'द्वितीया': return { ek: `${stem}म्`, dvi: `${base}्यौ`, bahu: `${stem}ः` };
      case 'तृतीया': return { ek: `${base}्या`, dvi: `${stem}भ्याम्`, bahu: `${stem}भिः` };
      case 'चतुर्थी': return { ek: `${base}्यै`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'पञ्चमी': return { ek: `${base}्याः`, dvi: `${stem}भ्याम्`, bahu: `${stem}भ्यः` };
      case 'षष्ठी': return { ek: `${base}्याः`, dvi: `${base}्योः`, bahu: inam };
      case 'सप्तमी': return { ek: `${base}्याम्`, dvi: `${base}्योः`, bahu: `${stem}षु` };
    }
  }

  // 7. अकारान्तः नपुंसकलिङ्गः (ज्ञान / फल शब्दवत्)
  const base = stem;
  const ena = hasNatvaR ? `${base}ेण` : `${base}ेन`;
  const anam = hasNatvaR ? `${base}ाणाम्` : `${base}ानाम्`;
  const ani = hasNatvaR ? `${base}ाणि` : `${base}ानि`;

  switch (vibhakti) {
    case 'प्रथमा': return { ek: `${base}म्`, dvi: `${base}े`, bahu: ani };
    case 'द्वितीया': return { ek: `${base}म्`, dvi: `${base}े`, bahu: ani };
    case 'तृतीया': return { ek: ena, dvi: `${base}ाभ्याम्`, bahu: `${base}ैः` };
    case 'चतुर्थी': return { ek: `${base}ाय`, dvi: `${base}ाभ्याम्`, bahu: `${base}ेभ्यः` };
    case 'पञ्चमी': return { ek: `${base}ात्`, dvi: `${base}ाभ्याम्`, bahu: `${base}ेभ्यः` };
    case 'षष्ठी': return { ek: `${base}स्य`, dvi: `${base}योः`, bahu: anam };
    case 'सप्तमी': return { ek: `${base}े`, dvi: `${base}योः`, bahu: `${base}ेषु` };
  }
}

/**
 * Generates an array of randomized exercise rows.
 * Each row includes 4 clubbed options ("एकवचनम् - द्विवचनम् - बहुवचनम्") for students to choose from a dropdown!
 */
export function generateDeclensionExercise(count = 7, paradigmFilter?: string): DeclensionRow[] {
  let pool = CHAPTER_6_NOUNS;
  if (paradigmFilter && paradigmFilter !== 'all') {
    pool = pool.filter(n => n.paradigm === paradigmFilter);
  }

  const shuffledStems = [...pool].sort(() => 0.5 - Math.random());
  const selectedStems = shuffledStems.slice(0, Math.min(count, shuffledStems.length));

  return selectedStems.map((stemDef, idx) => {
    // 1. Pick a target vibhakti
    const vibhakti = VIBHAKTI_LIST[Math.floor(Math.random() * VIBHAKTI_LIST.length)];
    const correctForms = getDeclensionForms(stemDef, vibhakti);
    const correctCombined = `${correctForms.ek} – ${correctForms.dvi} – ${correctForms.bahu}`;

    // 2. Pick 3 distinct other vibhaktis as distractors
    const otherVibhaktis = VIBHAKTI_LIST
      .filter(v => v !== vibhakti)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const distractorOptions = otherVibhaktis.map(v => {
      const f = getDeclensionForms(stemDef, v);
      return `${f.ek} – ${f.dvi} – ${f.bahu}`;
    });

    // 3. Shuffle all 4 options
    const allOptions = [correctCombined, ...distractorOptions].sort(() => 0.5 - Math.random());

    return {
      id: `decl-${stemDef.stem}-${vibhakti}-${idx}-${Date.now()}`,
      stem: stemDef.stem,
      meaning: stemDef.meaning,
      paradigm: stemDef.paradigm,
      paradigmLabel: stemDef.paradigmLabel,
      vibhakti,
      ekavachana: correctForms.ek,
      dvivachana: correctForms.dvi,
      bahuvachana: correctForms.bahu,
      correctCombined,
      options: allOptions,
      notes: correctForms.notes
    };
  });
}
