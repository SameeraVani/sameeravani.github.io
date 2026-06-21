const fs = require('fs');
const path = require('path');

const directoriesToProcess = [
  path.join(__dirname, 'public', 'books'),
  path.join(__dirname, 'RefBooks')
];

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  }
  return filelist;
}

function extractLanguage(filePath) {
  // Check if path contains language code like \en\, \hi\, \kn\, \sa\, \ta\, \te\
  const normalizedPath = filePath.replace(/\\/g, '/');
  const match = normalizedPath.match(/\/books\/[^\/]+\/([a-z]{2})\//);
  if (match && match[1]) {
    return match[1];
  }
  return 'sa'; // Default to sanskrit or generic for RefBooks if not found
}

let updatedCount = 0;
let skippedCount = 0;

directoriesToProcess.forEach(dir => {
  const files = walkSync(dir);
  
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (!content.startsWith('---')) {
        const basename = path.basename(file, '.md');
        const lang = extractLanguage(file);
        
        const frontmatter = `---
title: "${basename}"
type: "book"
language: "${lang}"
---
`;
        
        fs.writeFileSync(file, frontmatter + content, 'utf8');
        console.log(`Updated: ${file}`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  });
});

console.log(`\nProcess Complete!`);
console.log(`Files Updated: ${updatedCount}`);
console.log(`Files Skipped (already had frontmatter): ${skippedCount}`);
