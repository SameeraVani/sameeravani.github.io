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
    { sa: "मिथ्यात्वं च यद्यपि नात्यन्तासत्त्वम्, अपसिद्धान्तात् ।" },
    { sa: "नाप्यनिर्वाच्यत्वम्, अप्रसिद्धेः ।" },
    { sa: "नापि सद्विविक्तत्वम्, सतोऽपि सदन्तरविविक्तत्वात् ।" },
    { sa: "निर्धर्मके ब्रह्मण्यपि सत्त्वात् ।" },
    { sa: "न च ... इति वाच्यम्" },
    { sa: "अन्यथाऽसत्त्वानधिकरणत्वस्यापि..." },
    { sa: "न च प्रमित्यविषयत्वं मिथ्यात्वम्, ब्रह्म तु वेदान्तजन्यवृत्तिव्याप्यमिति वाच्यम् ।" },
    { sa: "शुक्तिरूप्यादेरपि व्यवसायद्वारा अनुव्यवसायं प्रति साक्षाच्च बाधकज्ञानं प्रति निषेध्यत्वेन विषयत्वात् ।" },
    { sa: "सत्त्वप्रकारकप्रमां प्रति साक्षादविषयत्वं चेद्..." },
    { sa: "आवश्यकत्वात् सत्त्वाभाव एव मिथ्यात्वं स्यात् ।" },
    // From 7.md and 8.md:
    { sa: "भ्रान्ति-विषयत्वं मिथ्यात्वम्" },
    { sa: "नापि भ्रान्ति-विषयत्वम्, ब्रह्मणोऽपि अधिष्ठानत्वेन तद्विषयत्वात्" },
    { sa: "भ्रान्तिमात्र-विषयत्वस्य च उक्तररीत्या शुक्तिरूप्यादौ अप्यभावात्" },
    { sa: "अध्यस्ततया भ्रान्तिविषयत्वं चेत्, विशेष्यवैयर्थ्यात्" },
    { sa: "विशेषणमात्रस्य च निरुच्यमानमिथ्यात्वा-अनतिरेकात्" },
    { sa: "बाध्यत्वं मिथ्यात्वम्" },
    { sa: "नापि बाध्यत्वम्" },
    { sa: "तद्धि न तावद् अन्यथा विज्ञातस्य सम्यग् विज्ञातत्वम्" },
    { sa: "मिथ्यात्व-क्षणिकत्वादिना विज्ञातस्य प्रपञ्चस्य सत्यत्व-स्थायित्वादिना विज्ञातत्वेन सिद्धसाधनात्" },
    { sa: "बाधकज्ञान-विषयत्वं मिथ्यात्वम्" },
    { sa: "नापि बाधकज्ञान-विषयत्वम्, ब्रह्मणि अतिव्याप्तेः" },
    { sa: "नापि नास्ति नासीत् न भविष्यति इति बोध्यमानाभाव-प्रतियोगित्वेन तद्विषयत्वम्" },
    { sa: "मन्मते हि आपणस्थ-रूप्यस्य एव तत्प्रतियोगित्वात्" }
];

async function translateText(text, targetLang) {
    if (targetLang === 'hi' || targetLang === 'sa') return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=sa&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        let translated = "";
        data[0].forEach(part => {
            translated += part[0];
        });
        return translated;
    } catch (e) {
        console.error("Translation error:", e);
        return text;
    }
}

async function processFile(filename) {
    const filePath = path.resolve(`public/books/nyayamruta/sa/paricheda1/prakarana1/${filename}`);
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = [];
    
    // Extract Sameeravani blocks
    const regex = /\*\*समीरवाणी \\\-\*\*([\s\S]*?)<\/details>/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        blocks.push(match[1].trim());
    }
    
    const translationsFile = `scratch/translations_${filename.replace('.md', '')}.json`;
    let translations = { [filename]: {} };
    for (const lang of targetLangs) {
        translations[filename][lang] = [];
    }

    console.log(`Processing ${filename}, found ${blocks.length} blocks.`);
    
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const paragraphs = block.split('\n\n').filter(p => p.trim() !== '');
        
        for (const lang of targetLangs) {
            let translatedBlock = "";
            for (const p of paragraphs) {
                // If it's a quote, transliterate it without translating
                if (p.includes("**न्यायामृतम्**") || p.includes("**न्यायामृत वाक्यम् \\-") || p.includes("**\"")) {
                    let transliterated = p;
                    const script = langToScript[lang];
                    if (script !== 'devanagari') {
                        transliterated = Sanscript.t(p, 'devanagari', script);
                    }
                    translatedBlock += transliterated + '\n\n';
                    continue;
                }
                
                let transP = await translateText(p, lang);
                translatedBlock += transP + '\n\n';
            }
            translations[filename][lang].push(translatedBlock.trim());
        }
    }
    
    fs.writeFileSync(translationsFile, JSON.stringify(translations, null, 2));
    console.log(`Saved translations for ${filename}`);
}

async function run() {
    await processFile('7.md');
    await processFile('8.md');
}
run();
