const fs = require('fs');
const path = require('path');

// Target book folder and languages (defaults to nyaya-sudha, or pass as 3rd arg)
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('\nUsage: node replicate.js <source-language> <relative-file-path> [book-folder-name]');
  console.log('Example: node replicate.js sa adhyaya1/pada1/adhikarana1/part1.md');
  console.log('Example for other books: node replicate.js sa adhyaya1/pada1/adhikarana1/part1.md brahmasutram\n');
  process.exit(1);
}

const targetBook = args[2] || 'nyaya-sudha';
const bookBaseDir = path.join(__dirname, 'public/books', targetBook);
const allLanguages = ['en', 'sa', 'hi', 'kn', 'ta', 'te'];

const sourceLang = args[0].toLowerCase();
const relativeFilePath = args[1];

// Validate source language
if (!allLanguages.includes(sourceLang)) {
  console.error(`Error: Invalid source language "${sourceLang}". Supported languages: ${allLanguages.join(', ')}`);
  process.exit(1);
}

const sourceFile = path.join(bookBaseDir, sourceLang, relativeFilePath);

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file does not exist at: ${sourceFile}`);
  process.exit(1);
}

// Replicate to all other languages
const targetLanguages = allLanguages.filter(lang => lang !== sourceLang);
let copyCount = 0;

targetLanguages.forEach((targetLang) => {
  const targetFile = path.join(bookBaseDir, targetLang, relativeFilePath);
  const targetDir = path.dirname(targetFile);

  try {
    // Ensure target folder hierarchy exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`[Copied] -> ${targetLang}/${relativeFilePath}`);
    copyCount++;
  } catch (err) {
    console.error(`Failed to copy to ${targetLang}:`, err.message);
  }
});

console.log(`\nSuccess! Replicated file content to ${copyCount} languages.`);
