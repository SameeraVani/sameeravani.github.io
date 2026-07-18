import fs from 'fs';
import path from 'path';
import Sanscript from '@indic-transliteration/sanscript';

const catalogFile = path.resolve('public/books/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));

const nyayamruta = catalog.find(b => b.id === 'nyayamruta');
if (nyayamruta) {
  const targetLangs = ['sanskrit', 'english', 'hindi', 'kannada', 'tamil', 'telugu'];
  const langToScript = {
    'sanskrit': 'devanagari',
    'english': 'iast',
    'hindi': 'devanagari',
    'kannada': 'kannada',
    'tamil': 'tamil',
    'telugu': 'telugu'
  };

  const newSaTitle = "मङ्गलाचरणम्";

  for (const lang of targetLangs) {
    const chapter = nyayamruta.chapters[lang]?.find(c => c.id === 'paricheda-1-prakarana-1');
    if (chapter) {
      const topic1 = chapter.topics?.find(t => t.id === 'paricheda-1-prakarana-1-topic-1');
      if (topic1) {
        const script = langToScript[lang];
        topic1.title = script === 'devanagari' ? newSaTitle : Sanscript.t(newSaTitle, 'devanagari', script);
      }
    }
  }

  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 4));
  console.log('Updated topic 1 title in catalog.json');
}
