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
        
        // We will regenerate the lang file completely based on saFile
        const newLines = [];
        let mode = 'header'; // 'frontmatter', 'header', 'nyayamruta', 'commentary'
        const script = langToScript[lang];
        
        for (let i = 0; i < saLines.length; i++) {
            const line = saLines[i].trim();
            const saLineFull = saLines[i];
            
            if (i === 0 && line === '---') {
                mode = 'frontmatter';
                newLines.push(saLineFull);
                continue;
            }
            if (mode === 'frontmatter') {
                if (line.startsWith('language:')) {
                    newLines.push(`language: ${lang}`);
                } else {
                    newLines.push(saLineFull);
                }
                if (line === '---') mode = 'header';
                continue;
            }
            
            if (line === '<details>' || line.startsWith('<summary>') || line === '</details>' || line === '') {
                newLines.push(saLineFull);
                continue;
            }
            
            if (line.includes('न्यायामृत')) {
                mode = 'nyayamruta';
            } else if (line.startsWith('**समीरवाणी')) {
                mode = 'commentary';
            }
            
            if (mode === 'nyayamruta') {
                // Transliterate
                let transliterated = saLineFull;
                if (script !== 'devanagari') {
                    transliterated = Sanscript.t(saLineFull, 'devanagari', script);
                }
                newLines.push(transliterated);
                console.log(`[Transliterated] ${filename} - ${lang}: ${saLineFull.substring(0,20)}...`);
            } else {
                // Translate
                let translated = await translateText(saLineFull, lang);
                // Ensure no Devanagari is left!
                if (script !== 'devanagari') {
                    translated = Sanscript.t(translated, 'devanagari', script);
                }
                newLines.push(translated);
                console.log(`[Translated] ${filename} - ${lang}: ${saLineFull.substring(0,20)}...`);
            }
        }
        
        fs.writeFileSync(langFilePath, newLines.join('\n'));
        console.log(`Updated ${langFilePath}`);
    }
}

async function run() {
    console.log("Starting translation for 2, 3, 4, 5...");
    for (const f of ['2.md', '3.md', '4.md', '5.md']) {
        await processFile(f);
    }
    console.log("Done!");
}
run();
