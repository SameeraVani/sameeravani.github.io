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

const nyayamrutamQuotes = [
    "मिथ्यात्वं च यद्यपि नात्यन्तासत्त्वम्, अपसिद्धान्तात् ।",
    "नाप्यनिर्वाच्यत्वम्, अप्रसिद्धेः ।",
    "नापि सद्विविक्तत्वम्, सतोऽपि सदन्तरविविक्तत्वात् ।",
    "निर्धर्मके ब्रह्मण्यपि सत्त्वात् ।",
    "न च ... इति वाच्यम्",
    "अन्यथाऽसत्त्वानधिकरणत्वस्यापि...",
    "न च प्रमित्यविषयत्वं मिथ्यात्वम्, ब्रह्म तु वेदान्तजन्यवृत्तिव्याप्यमिति वाच्यम् ।",
    "शुक्तिरूप्यादेरपि व्यवसायद्वारा अनुव्यवसायं प्रति साक्षाच्च बाधकज्ञानं प्रति निषेध्यत्वेन विषयत्वात् ।",
    "सत्त्वप्रकारकप्रमां प्रति साक्षादविषयत्वं चेद्...",
    "आवश्यकत्वात् सत्त्वाभाव एव मिथ्यात्वं स्यात् ।",
    "भ्रान्ति-विषयत्वं मिथ्यात्वम्",
    "नापि भ्रान्ति-विषयत्वम्, ब्रह्मणोऽपि अधिष्ठानत्वेन तद्विषयत्वात्",
    "नापि भ्रान्ति-विषयत्वम्, ब्रह्मणोऽप्यधिष्ठानत्वेन तद्विषयत्वात्",
    "भ्रान्तिमात्र-विषयत्वस्य च उक्तररीत्या शुक्तिरूप्यादौ अप्यभावात्",
    "भ्रान्तिमात्रविषयत्वस्य चोक्तरीत्या शुक्तिरूप्यादावप्यभावात्",
    "अध्यस्ततया भ्रान्तिविषयत्वं चेत्, विशेष्यवैयर्थ्यात्",
    "अध्यस्ततया भ्रान्तिविषयत्वं चेद्, विशेष्यवैयर्थ्यात्",
    "विशेषणमात्रस्य च निरुच्यमानमिथ्यात्वा-अनतिरेकात्",
    "विशेषणमात्रस्य च निरुच्यमानमिथ्यात्वानतिरेकात्",
    "बाध्यत्वं मिथ्यात्वम्",
    "नापि बाध्यत्वम्",
    "तद्धि न तावद् अन्यथा विज्ञातस्य सम्यग् विज्ञातत्वम्",
    "तद्धि न तावदन्यथा विज्ञातस्य सम्यग्विज्ज्ञातत्वम्",
    "मिथ्यात्व-क्षणिकत्वादिना विज्ञातस्य प्रपञ्चस्य सत्यत्व-स्थायित्वादिना विज्ञातत्वेन सिद्धसाधनात्",
    "मिथ्यात्वक्षणिकत्वादिना विज्ञातस्य प्रपञ्चस्य सत्यत्वस्थायित्वादिना विज्ञातत्वेन सिद्धसाधनात्",
    "बाधकज्ञान-विषयत्वं मिथ्यात्वम्",
    "नापि बाधकज्ञान-विषयत्वम्, ब्रह्मणि अतिव्याप्तेः",
    "नापि बाधकज्ञानविषयत्वम्, ब्रह्मण्यतिव्याप्तेः",
    "नापि नास्ति नासीत् न भविष्यति इति बोध्यमानाभाव-प्रतियोगित्वेन तद्विषयत्वम्",
    "नापि नास्ति नासीन्न भविष्यतीति बोध्यमानाभावप्रतियोगित्वेन तद्विषयत्वम्",
    "मन्मते हि आपणस्थ-रूप्यस्य एव तत्प्रतियोगित्वात्",
    "मन्मते ह्यापणस्थरूप्यस्यैव तत्प्रतियोगित्वात्",
    "उत्तरज्ञाननिवर्त्यपूर्वज्ञानादाविव सत्त्वेऽप्युपपत्तेः ।",
    "सत्त्वेऽप्युपपत्तेः",
    "अव्याप्यवृत्तिसंयोगादेरिव सत्त्वेऽप्युपपत्तेः ।",
    "नाप्यव्याप्यवृत्तित्वानाश्रयस्वसमानाधिकरणात्यन्ताभावप्रतियोगित्वम् ।",
    "सदसत्त्वानधिकरणत्वरूपम्",
    "तत्प्रसिद्धिश्च ख्यातिवादे वक्ष्यते",
    "सदसद्वैलक्षण्यम्"
];

async function translateText(text, targetLang) {
    if (targetLang === 'hi' || targetLang === 'sa') return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=sa&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        let translated = "";
        data[0].forEach(part => { translated += part[0]; });
        return translated;
    } catch (e) {
        console.error("Translation error:", e);
        return text;
    }
}

async function processFile(filename) {
    const saFilePath = path.resolve(`public/books/nyayamruta/sa/paricheda1/prakarana1/${filename}`);
    if (!fs.existsSync(saFilePath)) return;
    
    const saLines = fs.readFileSync(saFilePath, 'utf8').split(/\r?\n/);
    
    for (const lang of targetLangs) {
        const langFilePath = path.resolve(`public/books/nyayamruta/${lang}/paricheda1/prakarana1/${filename}`);
        if (!fs.existsSync(langFilePath)) continue;
        
        const langLines = fs.readFileSync(langFilePath, 'utf8').split(/\r?\n/);
        let inDialogue = false;
        
        for (let i = 0; i < saLines.length; i++) {
            const saLine = saLines[i].trim();
            const saLineFull = saLines[i];
            
            // Logic to determine if we are in a dialogue block
            if (saLine === '</details>' || saLine.includes('न्यायामृत')) {
                inDialogue = false;
            } else if (saLine.startsWith('**समीरवाणी')) {
                inDialogue = true;
            } else if (inDialogue && saLine !== '') {
                // Catch any multi-line quotes that slipped through
                if (saLine.startsWith('**त्वम् ।') || saLine.startsWith('**तत्प्रसिद्धिश्च')) {
                    inDialogue = false;
                    continue;
                }
                
                // We are in dialogue! Translate!
                let textToTranslate = saLineFull;
                const placeholders = [];
                let counter = 0;
                
                // Protect quotes
                for (const quote of nyayamrutamQuotes) {
                    if (textToTranslate.includes(quote)) {
                        const placeholder = `__QUOTE_${counter}__`;
                        textToTranslate = textToTranslate.replace(quote, placeholder);
                        placeholders.push({ placeholder, quote });
                        counter++;
                    }
                }
                
                let translatedLine = await translateText(textToTranslate, lang);
                translatedLine = translatedLine.replace(/__\s*QUOTE\s*_\s*(\d+)\s*__/g, "__QUOTE_$1__");
                
                if (lang === 'en') {
                    translatedLine = translatedLine.replace(/\*\*शिष्यः.*?\*\*/, '**Disciple**');
                    translatedLine = translatedLine.replace(/\*\*गुरुः.*?\*\*/, '**Guru**');
                }
                
                const script = langToScript[lang];
                for (const p of placeholders) {
                    let transliteratedQuote = p.quote;
                    if (script !== 'devanagari') {
                        transliteratedQuote = Sanscript.t(p.quote, 'devanagari', script);
                    }
                    translatedLine = translatedLine.replace(p.placeholder, transliteratedQuote);
                }
                
                langLines[i] = translatedLine;
                console.log(`Translated line ${i} for ${lang} in ${filename}`);
            }
        }
        
        // Ensure language tag is fixed
        for (let i = 0; i < 10; i++) {
            if (langLines[i] && langLines[i].startsWith('language:')) {
                langLines[i] = `language: ${lang}`;
            }
        }
        
        fs.writeFileSync(langFilePath, langLines.join('\n'));
        console.log(`Updated ${langFilePath}`);
    }
}

async function run() {
    console.log("Starting smart translation...");
    await processFile('7.md');
    await processFile('8.md');
    console.log("Done!");
}
run();
