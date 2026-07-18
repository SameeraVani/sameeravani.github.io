import fs from 'fs';
import path from 'path';
import Sanscript from '@indic-transliteration/sanscript';

const targetLangs = ['en', 'hi', 'kn', 'ta', 'te'];
const langToScript = {
  'en': 'iast',
  'hi': 'devanagari',
  'kn': 'kannada',
  'ta': 'tamil',
  'te': 'telugu'
};

const nyayamrutamLinesSa = [
  "**१. न्यायामृतम्: मिथ्यात्वं च यद्यपि नात्यन्तासत्त्वम्, अपसिद्धान्तात् ।**",
  "**२. न्यायामृतम्: नाप्यनिर्वाच्यत्वम्, अप्रसिद्धेः ।**",
  "**३. न्यायामृतम्: नापि सद्विविक्तत्वम्, सतोऽपि सदन्तरविविक्तत्वात् ।**",
  "**४. न्यायामृतम्: नापि सत्त्वानधिकरणत्वम्, निर्धर्मके ब्रह्मण्यपि सत्त्वात् ।**",
  "**५. न्यायामृतम्: न च प्रमित्यविषयत्वं मिथ्यात्वम्...**"
];

const nyayamrutamLinesSa2 = [
  "**१. न्यायामृतम् - मिथ्यात्वं च यद्यपि नात्यन्तासत्त्वम्, अपसिद्धान्तात् ।**",
  "**२. न्यायामृतम् - नाप्यनिर्वाच्यत्वम्, अप्रसिद्धेः ।**",
  "**३. न्यायामृतम् - नापि सद्विविक्तत्वम्, सतोऽपि सदन्तरविविक्तत्वात् ।**",
  "**४. न्यायामृतम् - नापि सत्त्वानधिकरणत्वम्, निर्धर्मके ब्रह्मण्यपि सत्त्वात् ।**",
  "**५. न्यायामृतम् - न च प्रमित्यविषयत्वं मिथ्यात्वम्...**"
];


const translationsFile = 'scratch/translations_6.json';
const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

// Regex patterns to identify the lines we want to replace in the different languages.
// 1. English
const enPatterns = [
  /^\*\*1\. Nyayamrutam: Mithyatvam is not absolute non-existence.*?\*\*/m,
  /^\*\*2\. Nyayamrutam: It is not indefinability.*?\*\*/m,
  /^\*\*3\. Nyayamrutam: It is not 'difference from the real'.*?\*\*/m,
  /^\*\*4\. Nyayamrutam: It is not 'the absence of the attribute of existence'.*?\*\*/m,
  /^\*\*5\. Nyayamrutam: It is not 'being un-objectifiable by valid knowledge'.*?\*\*/m
];

// 2. Hindi
const hiPatterns = [
  /^\*\*१\. न्यायामृतम्: मिथ्यात्व अत्यन्तासत् नहीं है.*?\*\*/m,
  /^\*\*२\. न्यायामृतम्: मिथ्यात्व अनिर्वाच्य नहीं है.*?\*\*/m,
  /^\*\*३\. न्यायामृतम्: मिथ्यात्व 'सत् से भिन्नता'.*?\*\*/m,
  /^\*\*४\. न्यायामृतम्: मिथ्यात्व 'सत्त्व धर्म का अभाव'.*?\*\*/m,
  /^\*\*५\. न्यायामृतम्: मिथ्यात्व 'प्रमा का अविषय होना'.*?\*\*/m
];

// 3. Kannada
const knPatterns = [
  /^\*\*೧\. ನ್ಯಾಯಾಮೃತಮ್: ಮಿಥ್ಯಾತ್ವವು ಅತ್ಯಂತಾಸತ್ ಅಲ್ಲ.*?\*\*/m,
  /^\*\*೨\. ನ್ಯಾಯಾಮೃತಮ್: ಮಿಥ್ಯಾತ್ವವು ಅನಿರ್ವಾಚ್ಯವಲ್ಲ.*?\*\*/m,
  /^\*\*೩\. ನ್ಯಾಯಾಮೃತಮ್: ಮಿಥ್ಯಾತ್ವವು 'ಸತ್ ನಿಂದ ಭಿನ್ನವಾಗಿರುವುದು'.*?\*\*/m,
  /^\*\*೪\. ನ್ಯಾಯಾಮೃತಮ್: ಮಿಥ್ಯಾತ್ವವು 'ಸತ್ವ ಧర్మದ ಅಭಾವ'.*?\*\*/m,
  /^\*\*೫\. ನ್ಯಾಯಾಮೃತಮ್: ಮಿಥ್ಯಾತ್ವವು 'ಪ್ರಮೆಗೆ ಅವಿಷಯವಾಗಿರುವುದು'.*?\*\*/m
];

// 4. Tamil
const taPatterns = [
  /^\*\*1\. மித்யாத்வம் என்பது முற்றிலும் இல்லாதது.*?\*\*/m,
  /^\*\*2\. மித்யாத்வம் என்பது அநிர்வாச்யமல்ல.*?\*\*/m,
  /^\*\*3\. மித்யாத்வம் என்பது 'சத்திலிருந்து வேறுபட்டிருப்பது'.*?\*\*/m,
  /^\*\*4\. மித்யாத்வம் என்பது 'சத்வ தர்மத்தின் இன்மை'.*?\*\*/m,
  /^\*\*5\. மித்யாத்வம் என்பது 'பிரமைக்கு அறியப்படாதது'.*?\*\*/m
];

// 5. Telugu
const tePatterns = [
  /^\*\*1\. మిథ్యాత్వం అంటే అత్యంత అసత్తు కాదు.*?\*\*/m,
  /^\*\*2\. మిథ్యాత్వం అంటే అనిర్వాచ్యం కాదు.*?\*\*/m,
  /^\*\*3\. మిథ్యాత్వం అంటే 'సత్తు నుండి భిన్నంగా ఉండటం'.*?\*\*/m,
  /^\*\*4\. మిథ్యాత్వం అంటే 'సత్వ ధర్మం లేకపోవడం'.*?\*\*/m,
  /^\*\*5\. మిథ్యాత్వం అంటే 'ప్రమకు అవిషయంగా ఉండటం'.*?\*\*/m
];

const patterns = {
  'en': enPatterns,
  'hi': hiPatterns,
  'kn': knPatterns,
  'ta': taPatterns,
  'te': tePatterns
};

targetLangs.forEach(lang => {
  let content = translations['6.md'][lang][0];
  const langPatterns = patterns[lang];
  const script = langToScript[lang];
  
  for (let i = 0; i < 5; i++) {
    // Generate transliteration of the line
    let transliteratedLine = nyayamrutamLinesSa[i];
    if (script !== 'devanagari') {
      transliteratedLine = Sanscript.t(nyayamrutamLinesSa[i], 'devanagari', script);
    }
    
    // For English (IAST), replace Devanagari numbers with standard numbers manually as Sanscript might keep them or do weird things
    if (lang === 'en' || lang === 'ta' || lang === 'te') {
      transliteratedLine = transliteratedLine.replace('१', '1').replace('२', '2').replace('३', '3').replace('४', '4').replace('५', '5');
    }
    
    if(content.match(langPatterns[i])) {
      content = content.replace(langPatterns[i], transliteratedLine);
    } else {
      console.log(`Warning: Pattern ${i+1} not found in ${lang}`);
    }
  }
  
  translations['6.md'][lang][0] = content;
});

fs.writeFileSync(translationsFile, JSON.stringify(translations, null, 2));
console.log('Updated translations_6.json with transliterated Nyayamrutam texts.');
