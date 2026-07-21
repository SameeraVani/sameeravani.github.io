import fs from 'fs';
import path from 'path';
import Sanscript from '@indic-transliteration/sanscript';

// Glossary mapping for key Sanskrit philosophical terms to target languages to keep terminology consistent
const glossary = {
    'ta': [
        ['முடிவில் இல்லாதது', 'முற்றுமிலாமை (முழுமையான இல்லாமை)'],
        ['பற்றாக்குறை', 'இல்லாமை'],
        ['பற்றாக்குறைகள்', 'இல்லாமைகள்'],
        ['குறைவு', 'இல்லாமை'],
        ['தீவிர இல்லாமை', 'முற்றுமிலாமை'],
        ['பெரிய பற்றாக்குறை', 'முற்றுமிலாமை'],
        ['தீவிர பற்றாக்குறை', 'முற்றுமிலாமை'],
        ['நூல்கள்', 'இழைகள்'],
        ['நೂல்கள்', 'இழைகள்'],
        ['நூல்களில்', 'இழைகளில்'],
        ['விசுவாசம்', 'நிலைபெற்றுள்ளது'],
        ['விசுவாசத்துடன்', 'நிலைபெற்றுள்ளது'],
        ['பற்றுறுதி', 'நிலைபெற்றுள்ளது'],
        ['விசுவாசம் கொண்டது', 'நிலைபெற்றுள்ளது'],
        ['விசுவாசமான', 'நிலைபெற்றுள்ளது'],
        ['துணி இல்லாதது', 'துணியின் இல்லாமை'],
        ['பரஸ்பர இல்லாமை', 'அந்யோந்யாபாவம் (பரஸ்பர பேதம்)'],
        ['அழிவு', 'அழிவு (ध्वंसः)'],
        ['விநாசம்', 'அழிவு'],
        ['புதியவை', 'நவீனாஃ (புதியவர்கள்)'],
        ['புதிது', 'நவீனாஃ (புதியவர்கள்)'],
        ['புதியவர்கள்', 'நவீனாஃ (புதியவர்கள்)'],
        ['புதிய அறிஞர்கள்', 'நவீன அறிஞர்கள்'],
        ['பொருட்கள்:', 'பதவுரை:']
    ],
    'kn': [
        ['ಕೊರತೆ', 'ಅಭಾವ'],
        ['ದೊಡ್ಡ ಕೊರತೆ', 'ಅತ್ಯಂತಾಭಾವ'],
        ['ತೀವ್ರ ಕೊರತೆ', 'ಅತ್ಯಂತಾಭಾವ'],
        ['ಪುಸ್ತಕಗಳು', 'ಎಳೆಗಳು'],
        ['ಪುಸ್ತಕಗಳಲ್ಲಿ', 'ಎಳೆಗಳಲ್ಲಿ'],
        ['ವಿಶ್ವಾಸ', 'ನೆಲೆಸಿರುವುದು'],
        ['ವಿಶ್ವಾಸದಿಂದ', 'ನೆಲೆಸಿರುವುದು'],
        ['ನಿಷ್ಠೆ', 'ನೆಲೆಸಿರುವುದು'],
        ['ಪರಸ್ಪರ ಇಲ್ಲದಿರುವಿಕೆ', 'ಅನ್ಯೋನ್ಯಾಭಾವ (ಪರಸ್ಪರ ಭೇದ)'],
        ['ನಾಶ', 'ನಾಶ (ಧ್ವಂಸ)'],
        ['ಹೊಸತು', 'ನವೀನರು'],
        ['ಹೊಸ ವಿದ್ವಾಂಸರು', 'ನವೀನ ವಿದ್ವಾಂಸರು'],
        ['ಐಟಂಗಳು:', 'ಪದವಿವರಣೆ:']
    ],
    'te': [
        ['కొరత', 'అభావం'],
        ['తీవ్ర కొరత', 'అత్యంతాభావం'],
        ['పెద్ద కొరత', 'అత్యంతాభావం'],
        ['పుస్తకాలు', 'దారాలు'],
        ['పుస్తకాలలో', 'దారాలలో'],
        ['విశ్వాసం', 'ఉండడం'],
        ['నిష్ఠ', 'ఉండడం'],
        ['పరస్పర అభావం', 'అన్యోన్యాభావం (పరస్పర భేదం)'],
        ['నాశనం', 'నాశనం (ధ్వంసం)'],
        ['కొత్తవి', 'నవీనులు'],
        ['కొత్త పండితులు', 'నవీన పండితులు'],
        ['ఐటమ్స్:', 'పద వివరణ:']
    ],
    'en': [
        ['great lack', 'absolute non-existence'],
        ['lack of', 'non-existence of'],
        ['extreme absence', 'absolute non-existence'],
        ['fabric', 'cloth'],
        ['fiber', 'thread'],
        ['fibers', 'threads'],
        ['fixed to', 'residing in'],
        ['loyalty', 'abiding'],
        ['devotion', 'abiding'],
        ['mutual absence', 'mutual non-existence'],
        ['the absence of the end of', 'the absolute non-existence of'],
        ['is the end of', 'resides in'],
        ['new ones', 'moderns (navīnāḥ)'],
        ['new scholars', 'modern scholars'],
        ['Items:', 'Word Meanings:']
    ]
};

// Pre-compile glossary RegExps using ES6 Unicode letter boundaries (?<!\p{L}) and (?!\p{L}) in a single pass
const compiledGlossary = {};
for (const lang in glossary) {
    const mapping = {};
    const keys = [];
    for (const [word, replacement] of glossary[lang]) {
        mapping[word] = replacement;
        keys.push(word);
    }
    // Sort keys by length descending to ensure longer matches take precedence (e.g. "great lack" before "lack")
    keys.sort((a, b) => b.length - a.length);
    
    const escapedKeys = keys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const flags = lang === 'en' ? 'giu' : 'gu';
    
    // Create combined regex using alternation
    const regex = new RegExp(`(?<!\\p{L})(${escapedKeys.join('|')})(?!\\p{L})`, flags);
    compiledGlossary[lang] = { regex, mapping };
}

function applyGlossary(text, lang) {
    const config = compiledGlossary[lang];
    if (!config) return text;
    
    const lookup = {};
    for (const k in config.mapping) {
        lookup[lang === 'en' ? k.toLowerCase() : k] = config.mapping[k];
    }
    
    return text.replace(config.regex, (match) => {
        const key = lang === 'en' ? match.toLowerCase() : match;
        return lookup[key] !== undefined ? lookup[key] : match;
    });
}

// Default configuration mappings for known books
const defaultConfigs = {
    'nyayamruta': {
        transliterateMarkers: ['न्यायामृत', 'न्यायामृतम्', '---'],
        translateMarkers: ['समीरवाणी', 'भावार्थ', 'शिष्यः', 'गुरुः'],
        defaultMode: 'translate'
    },
    'nyaya-sudha': {
        transliterateMarkers: ['न्यायसुधा', 'श्रीमन्न्यायसुधा', '---'],
        translateMarkers: ['समीरवाणी', 'भावार्थ', 'शिष्यः', 'गुरुः'],
        defaultMode: 'translate'
    },
    'hari-kathamruta-saara': {
        transliterateMarkers: [],
        translateMarkers: [],
        defaultMode: 'transliterate'
    }
};

const fallbackConfig = {
    transliterateMarkers: ['श्लोक', 'मूलम्', 'अनुवादः', '---'],
    translateMarkers: ['व्याख्या', 'समीरवाणी', 'भावार्थ', 'शिष्यः', 'गुरुः'],
    defaultMode: 'translate'
};

const defaultLangs = ['en', 'hi', 'kn', 'ta', 'te'];
const langToScript = {
    'en': 'iast',
    'hi': 'devanagari',
    'kn': 'kannada',
    'ta': 'tamil',
    'te': 'telugu'
};

// Robust sentence splitter for Sanskrit & English
function splitIntoSentences(text) {
    if (!text.trim()) return [text];
    
    const sentences = [];
    let current = "";
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        current += char;
        
        const isDanda = (char === '।' || char === '॥');
        const isQuestExcl = (char === '?' || char === '!');
        const isPeriod = (char === '.' && (i === text.length - 1 || /\s/.test(text[i + 1])) && !/\b(i\.e|e\.g|vs)\s*$/.test(current));
        
        if (isDanda || isQuestExcl || isPeriod) {
            sentences.push(current);
            current = "";
        }
    }
    
    if (current.trim()) {
        sentences.push(current);
    } else if (current) {
        if (sentences.length > 0) {
            sentences[sentences.length - 1] += current;
        } else {
            sentences.push(current);
        }
    }
    
    return sentences;
}

// Translate text using Google Translate GTX API with retry and exponential backoff
async function translateText(text, targetLang) {
    if (targetLang === 'hi' || targetLang === 'sa') return text;
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=sa&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    let retries = 3;
    let delay = 1000;
    
    while (retries > 0) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            let translated = "";
            if (data && data[0]) {
                data[0].forEach(part => {
                    if (part[0]) translated += part[0];
                });
            }
            return translated;
        } catch (e) {
            retries--;
            console.warn(`[WARN] Translation API error. Retries left: ${retries}. Delaying ${delay}ms. Error: ${e.message}`);
            if (retries === 0) {
                return text; // Return source text on total failure
            }
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
}

// Translates a single sentence, preserving prefixes, suffix spacing, and formatting
async function translateSentence(sentence, targetLang) {
    const prefixRegex = /^(\s*(?:#{1,6}|\*|\-|\+|\d+\.|[\u0966-\u096F]+\.|>)\s*)/;
    const prefixMatch = sentence.match(prefixRegex);
    const prefix = prefixMatch ? prefixMatch[1] : "";
    
    const suffixMatch = sentence.match(/(\s*)$/);
    const suffix = suffixMatch ? suffixMatch[1] : "";
    
    const cleanText = sentence.substring(prefix.length, sentence.length - suffix.length);
    
    // Check if it actually contains translatable text
    const hasLetters = /[a-zA-Z\u0900-\u097F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(cleanText);
    if (!cleanText.trim() || !hasLetters) {
        return sentence;
    }
    
    let translatedText = await translateText(cleanText, targetLang);
    
    // Apply glossary mapping to ensure consistency
    translatedText = applyGlossary(translatedText, targetLang);
    
    // Formatting cleanup
    translatedText = translatedText
        .replace(/\*\*([^\*]+?)\*\*/g, (m, p) => `**${p.trim()}**`)
        .replace(/\*([^\*]+?)\*/g, (m, p) => `*${p.trim()}*`)
        .replace(/`([^`]+?)`/g, (m, p) => `\`${p.trim()}\``)
        .replace(/\s+([.।॥?!,;:])(\s|$)/g, '$1$2');          // cleanup spaces before punctuation
        
    // Target punctuation normalization
    if (targetLang === 'en') {
        translatedText = translatedText.replace(/[।॥]$/, '.');
    } else if (targetLang === 'hi') {
        translatedText = translatedText.replace(/\.$/, '।');
    }
    
    // Transliterate remaining Devanagari if script is different
    const script = langToScript[targetLang];
    if (script && script !== 'devanagari') {
        const hasDevanagari = /[\u0900-\u097F]/.test(translatedText);
        if (hasDevanagari) {
            translatedText = Sanscript.t(translatedText, 'devanagari', script);
        }
    }
    
    return prefix + translatedText + suffix;
}

// Find all Markdown files in a directory recursively
function getFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(filePath));
        } else if (file.endsWith('.md')) {
            results.push(filePath);
        }
    });
    return results;
}

// Process a single file
async function processFile(filePath, bookBaseDir, config, targetLangs, isDryRun) {
    console.log(`\n--------------------------------------------`);
    console.log(`Processing file: ${filePath}`);
    const relativePath = path.relative(path.join(bookBaseDir, 'sa'), filePath);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const lines = originalContent.split(/\r?\n/);
    
    for (const lang of targetLangs) {
        const script = langToScript[lang];
        const targetFilePath = path.join(bookBaseDir, lang, relativePath);
        
        console.log(`  Target Language [${lang}] -> ${targetFilePath}`);
        
        let inFrontmatter = false;
        let mode = config.defaultMode; // Initial state for mode
        let inPadartha = false;
        const outputLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const originalLine = lines[i];
            const trimmedLine = originalLine.trim();
            
            // 1. Handle Frontmatter boundary
            if (i === 0 && trimmedLine === '---') {
                inFrontmatter = true;
                outputLines.push(originalLine);
                continue;
            }
            if (inFrontmatter) {
                if (trimmedLine === '---') {
                    inFrontmatter = false;
                    outputLines.push(originalLine);
                } else if (trimmedLine.startsWith('language:')) {
                    outputLines.push(`language: ${lang}`);
                } else if (trimmedLine.startsWith('title:')) {
                    const titleMatch = originalLine.match(/^title:\s*(["']?)(.*?)\1\s*$/);
                    if (titleMatch) {
                        const quote = titleMatch[1];
                        const titleText = titleMatch[2];
                        if (/[\u0900-\u097F]/.test(titleText)) {
                            const translatedTitle = await translateText(titleText, lang);
                            outputLines.push(`title: ${quote}${translatedTitle}${quote}`);
                        } else {
                            outputLines.push(originalLine);
                        }
                    } else {
                        outputLines.push(originalLine);
                    }
                } else {
                    outputLines.push(originalLine);
                }
                continue;
            }
            
            // 2. Handle structural lines or lines to copy exactly
            if (trimmedLine === '' || trimmedLine === '<details>' || trimmedLine === '</details>' || trimmedLine.startsWith('<summary>')) {
                outputLines.push(originalLine);
                continue;
            }
            
            // 2.5 Handle Padartha section state and translation logic
            if (trimmedLine.includes('**पदार्थाः') || trimmedLine.includes('**प्रतिपदार्थ')) {
                inPadartha = true;
            } else if (inPadartha) {
                if (trimmedLine === '---' || trimmedLine.startsWith('<') || trimmedLine.startsWith('##') || (trimmedLine.startsWith('*') && !originalLine.startsWith(' '))) {
                    inPadartha = false;
                }
            }

            if (inPadartha) {
                const padarthaMatch = originalLine.match(/^(\s*[\*\+-]\s*)\*\*([^*]+?)\*\*(\s*(?::|–|-|—)\s*|\s+)(.*)$/);
                if (padarthaMatch) {
                    const prefix = padarthaMatch[1];
                    let term = padarthaMatch[2].trim();
                    const separator = padarthaMatch[3];
                    const meaning = padarthaMatch[4];
                    
                    if (meaning.trim()) {
                        let hasTrailingColon = false;
                        if (term.endsWith(':')) {
                            term = term.slice(0, -1).trim();
                            hasTrailingColon = true;
                        }
                        
                        let transliteratedTerm = term;
                        if (script && script !== 'devanagari') {
                            transliteratedTerm = Sanscript.t(term, 'devanagari', script);
                        }
                        
                        const translatedMeaning = await translateSentence(meaning, lang);
                        const transformedLine = `${prefix}**${transliteratedTerm}${hasTrailingColon ? ':' : ''}**${separator}${translatedMeaning}`;
                        outputLines.push(transformedLine);
                        console.log(`    [Padartha] Line ${i + 1}: ${term} -> ${transliteratedTerm} | ${meaning.substring(0, 20)}... -> ${translatedMeaning.substring(0, 20)}...`);
                        continue;
                    }
                }
            }
            
            // 3. State/Mode switching detection
            let modeSwitched = false;
            for (const marker of config.transliterateMarkers) {
                if (trimmedLine.includes(marker)) {
                    mode = 'transliterate';
                    modeSwitched = true;
                    break;
                }
            }
            if (!modeSwitched) {
                for (const marker of config.translateMarkers) {
                    if (trimmedLine.includes(marker)) {
                        mode = 'translate';
                        modeSwitched = true;
                        break;
                    }
                }
            }
            
            // 4. Transform line based on current mode
            if (mode === 'transliterate') {
                // Keep exactly as-is but transliterate Devanagari to target script
                let transformedLine = originalLine;
                if (script && script !== 'devanagari') {
                    transformedLine = Sanscript.t(originalLine, 'devanagari', script);
                }
                outputLines.push(transformedLine);
                console.log(`    [Transliterate] Line ${i + 1}: ${originalLine.substring(0, 30)}... -> ${transformedLine.substring(0, 30)}...`);
            } else {
                // Mode is 'translate' -> split line into sentences, translate each, and join back
                const sentences = splitIntoSentences(originalLine);
                const translatedSentences = [];
                for (const sentence of sentences) {
                    const translated = await translateSentence(sentence, lang);
                    translatedSentences.push(translated);
                }
                const transformedLine = translatedSentences.join('');
                outputLines.push(transformedLine);
                console.log(`    [Translate] Line ${i + 1} (${sentences.length} sentences): ${originalLine.substring(0, 30)}... -> ${transformedLine.substring(0, 30)}...`);
            }
        }
        
        if (!isDryRun) {
            fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
            fs.writeFileSync(targetFilePath, outputLines.join('\n'));
        }
    }
}

// Main execution function
async function main() {
    const args = process.argv.slice(2);
    let bookId = '';
    let filesArg = 'all';
    let langsArg = '';
    let isDryRun = false;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--book' || args[i] === '-b') {
            bookId = args[++i];
        } else if (args[i] === '--files' || args[i] === '-f') {
            filesArg = args[++i];
        } else if (args[i] === '--langs' || args[i] === '-l') {
            langsArg = args[++i];
        } else if (args[i] === '--dry-run') {
            isDryRun = true;
        }
    }
    
    if (!bookId) {
        console.error("Usage: node scratch/translate_book_generic.js --book <book-id> [--files <file-list>] [--langs <lang-list>] [--dry-run]");
        console.error("Example: node scratch/translate_book_generic.js --book nyayamruta --files 3.md --langs en,kn --dry-run");
        process.exit(1);
    }
    
    const bookBaseDir = path.resolve(`public/books/${bookId}`);
    if (!fs.existsSync(bookBaseDir)) {
        console.error(`Error: Book directory not found at ${bookBaseDir}`);
        process.exit(1);
    }
    
    // Load config: custom file, pre-configured defaults, or fallback
    let config = fallbackConfig;
    const configPath = path.join(bookBaseDir, 'translation_config.json');
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(`[INFO] Loaded custom configuration from ${configPath}`);
        } catch (e) {
            console.error(`[WARN] Error parsing configuration file. Falling back to default. Error: ${e.message}`);
        }
    } else if (defaultConfigs[bookId]) {
        config = defaultConfigs[bookId];
        console.log(`[INFO] Using default configuration for book "${bookId}"`);
    } else {
        console.log(`[INFO] Using general fallback configuration for book "${bookId}"`);
    }
    
    const targetLangs = langsArg ? langsArg.split(',').map(l => l.trim()) : defaultLangs;
    console.log(`[INFO] Target languages: ${targetLangs.join(', ')}`);
    console.log(`[INFO] Dry run: ${isDryRun}`);
    
    // Find all files to process
    const saDir = path.join(bookBaseDir, 'sa');
    let filesToProcess = getFilesRecursively(saDir);
    
    if (filesArg !== 'all') {
        const fileFilters = filesArg.split(',').map(f => f.trim());
        filesToProcess = filesToProcess.filter(filePath => {
            const baseName = path.basename(filePath);
            return fileFilters.includes(baseName) || fileFilters.some(filter => filePath.endsWith(filter));
        });
    }
    
    console.log(`[INFO] Found ${filesToProcess.length} file(s) to process.`);
    
    for (const filePath of filesToProcess) {
        await processFile(filePath, bookBaseDir, config, targetLangs, isDryRun);
    }
    
    console.log(`\n[SUCCESS] Completed translation processing for book "${bookId}".`);
}

main().catch(err => {
    console.error("Critical execution error:", err);
    process.exit(1);
});
