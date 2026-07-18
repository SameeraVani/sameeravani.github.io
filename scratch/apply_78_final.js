import fs from 'fs';
import path from 'path';

const targetLangs = ['en', 'hi', 'kn', 'ta', 'te'];
const translationsFile = 'scratch/translations_78_final.json';
const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

const filesToProcess = ['7.md', '8.md'];

filesToProcess.forEach(filename => {
    targetLangs.forEach(lang => {
        const filePath = path.resolve(`public/books/nyayamruta/${lang}/paricheda1/prakarana1/${filename}`);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the <details> summary block for Sameeravani
        const regex = /(<details>\s*<summary>.*?<\/summary>)([\s\S]*?)(<\/details>)/i;
        
        const match = content.match(regex);
        if (match) {
            const replacementText = "\n\n" + translations[filename][lang][0] + "\n\n";
            content = content.replace(regex, `$1${replacementText}$3`);
            
            // Fix language in frontmatter! The user's earlier problem was also language tag.
            content = content.replace(/language:\s*sa/i, `language: ${lang}`);
            
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${filePath}`);
        } else {
            console.log(`Could not find Sameeravani block in ${filePath}`);
        }
    });
});
