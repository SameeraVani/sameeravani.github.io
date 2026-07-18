import fs from 'fs';
import path from 'path';

const bookBaseDir = path.resolve('public/books/nyayamruta');
const targetLangs = ['en', 'hi', 'kn', 'ta', 'te'];

// Read the translations map
// translations is an object: { "file_name.md": { "en": [ block1, block2, block3 ], "hi": [ block1, block2, ... ] } }
const translationsFile = process.argv[2] || 'scratch/translations.json';
const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

for (const fileName of Object.keys(translations)) {
  const saFile = path.join(bookBaseDir, 'sa', 'paricheda1', 'prakarana1', fileName);
  if (!fs.existsSync(saFile)) continue;
  
  const content = fs.readFileSync(saFile, 'utf8');
  
  // Extract all sameeravani blocks from the Sanskrit file (we assume they match the number of blocks in JSON)
  // But since we just want to replace them, let's parse the file and split by `**समीरवाणी \-**`
  // Actually, the easiest way is to use a regex to match all `**समीरवाणी \-**` blocks until the next `**न्यायामृतम्**` or `</details>`
  
  for (const lang of targetLangs) {
    const targetFile = path.join(bookBaseDir, lang, 'paricheda1', 'prakarana1', fileName);
    if (!fs.existsSync(targetFile)) continue;
    
    let targetContent = fs.readFileSync(targetFile, 'utf8');
    
    // The target file currently has transliterated **समीरवाणी \-** sections.
    // For English it might be **samīravāṇī \-**, for Kannada **ಸಮೀರವಾಣೀ \-** etc.
    // However, it's easier to just take the Sanskrit file's structure, replace the blocks with target language blocks,
    // and then transliterate ONLY the **न्यायामृतम्** blocks. 
    // Wait, the transliteration for 35 files is already done! 
    // We can just find the blocks in the target file and replace them.
    // But since the transliteration might have slightly changed the marker, we need language specific markers.
    
    const markers = {
      'en': '**samīravāṇī \\-**', // IAST
      'hi': '**समीरवाणी \\-**', // Devanagari
      'kn': '**ಸಮೀರವಾಣೀ \\-**', // Kannada
      'ta': '**ஸமீரவாணீ \\-**', // Tamil
      'te': '**సమీరవాణీ \\-**'  // Telugu
    };
    
    const endMarkers = {
      'en': ['**nyāyāmṛtam**', '</details>'],
      'hi': ['**न्यायामृतम्**', '</details>'],
      'kn': ['**ನ್ಯಾಯಾಮೃತಮ್**', '</details>'],
      'ta': ['**ந்யாயாம்ரு\'தம்**', '</details>'],
      'te': ['**న్యాయామృతమ్**', '</details>']
    };
    
    const marker = markers[lang];
    const endMarker1 = endMarkers[lang][0];
    const endMarker2 = endMarkers[lang][1];
    
    const translatedBlocks = translations[fileName][lang];
    if (!translatedBlocks) continue;
    
    let parts = targetContent.split(marker);
    if (parts.length - 1 !== translatedBlocks.length) {
      console.error(`Mismatch in blocks for ${fileName} in ${lang}. Expected ${parts.length - 1}, got ${translatedBlocks.length}`);
      continue;
    }
    
    let newContent = parts[0];
    for (let i = 1; i < parts.length; i++) {
      let block = parts[i];
      // Find where this block ends (either at nyayamruta or </details>)
      let endIdx1 = block.indexOf(endMarker1);
      let endIdx2 = block.indexOf(endMarker2);
      
      let endIdx = -1;
      if (endIdx1 !== -1 && endIdx2 !== -1) endIdx = Math.min(endIdx1, endIdx2);
      else if (endIdx1 !== -1) endIdx = endIdx1;
      else if (endIdx2 !== -1) endIdx = endIdx2;
      
      let rest = '';
      if (endIdx !== -1) {
        rest = block.substring(endIdx);
      }
      
      newContent += `**Sameeravani -** \n\n${translatedBlocks[i-1]}\n\n` + rest;
    }
    
    fs.writeFileSync(targetFile, newContent);
    console.log(`Updated translations for ${fileName} in ${lang}`);
  }
}
