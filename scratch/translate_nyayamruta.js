import fs from 'fs';
import path from 'path';
import Sanscript from '@indic-transliteration/sanscript';

const bookBaseDir = path.resolve('public/books/nyayamruta');
const targetLangs = ['en', 'hi', 'kn', 'ta', 'te'];

const langToScript = {
  'en': 'iast',
  'hi': 'devanagari',
  'kn': 'kannada',
  'ta': 'tamil',
  'te': 'telugu'
};

const saDir = path.join(bookBaseDir, 'sa', 'paricheda1', 'prakarana1');
const fileNames = ['2.md', '3.md', '4.md', '5.md', '6.md', '7.md', '8.md'];

for (const fileName of fileNames) {
  const saFile = path.join(saDir, fileName);
  if (!fs.existsSync(saFile)) continue;
  
  const content = fs.readFileSync(saFile, 'utf8');
  
  for (const lang of targetLangs) {
    const targetDir = path.join(bookBaseDir, lang, 'paricheda1', 'prakarana1');
    fs.mkdirSync(targetDir, { recursive: true });
    
    let transliterated = content;
    const script = langToScript[lang];
    if (script !== 'devanagari') {
      transliterated = Sanscript.t(content, 'devanagari', script);
    }
    
    fs.writeFileSync(path.join(targetDir, fileName), transliterated);
    console.log(`Transliterated ${fileName} to ${lang}`);
  }
}

// Update catalog.json
const catalogFile = path.resolve('public/books/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
const nyayamruta = catalog.find(b => b.id === 'nyayamruta');

if (nyayamruta) {
  const saChapter = nyayamruta.chapters.sanskrit.find(c => c.id === 'paricheda-1-prakarana-1');
  const saTopics = saChapter.topics;
  
  const langKeyMap = {
    'en': 'english',
    'hi': 'hindi',
    'kn': 'kannada',
    'ta': 'tamil',
    'te': 'telugu'
  };
  
  for (const lang of targetLangs) {
    const catalogLang = langKeyMap[lang];
    if (!nyayamruta.chapters[catalogLang]) {
      nyayamruta.chapters[catalogLang] = [];
    }
    const chapter = nyayamruta.chapters[catalogLang].find(c => c.id === 'paricheda-1-prakarana-1');
    if (chapter) {
      // Filter out existing topics 2-8 to avoid duplicates if script is run multiple times
      chapter.topics = chapter.topics.filter(t => t.id === 'paricheda-1-prakarana-1-topic-1'); 
      
      for (let i = 1; i <= 7; i++) {
        const saTopic = saTopics[i];
        if (!saTopic) continue;
        
        const script = langToScript[lang];
        const title = script === 'devanagari' ? saTopic.title : Sanscript.t(saTopic.title, 'devanagari', script);
        
        chapter.topics.push({
          id: saTopic.id,
          title: title,
          path: `books/nyayamruta/${lang}/paricheda1/prakarana1/${i+1}.md`
        });
      }
    }
  }
  
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 4));
  console.log('Updated catalog.json');
}
