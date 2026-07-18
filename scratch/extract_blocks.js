import fs from 'fs';
import path from 'path';

const bookBaseDir = path.resolve('public/books/nyayamruta');
const saDir = path.join(bookBaseDir, 'sa', 'paricheda1', 'prakarana1');
const fileNames = ['5.md', '6.md', '7.md', '8.md'];
const output = {};

for (const fileName of fileNames) {
  const saFile = path.join(saDir, fileName);
  if (!fs.existsSync(saFile)) continue;
  
  const content = fs.readFileSync(saFile, 'utf8');
  const parts = content.split('**समीरवाणी \\-**');
  
  const blocks = [];
  for (let i = 1; i < parts.length; i++) {
    let block = parts[i];
    let endIdx1 = block.indexOf('**न्यायामृतम्**');
    let endIdx2 = block.indexOf('</details>');
    
    let endIdx = -1;
    if (endIdx1 !== -1 && endIdx2 !== -1) endIdx = Math.min(endIdx1, endIdx2);
    else if (endIdx1 !== -1) endIdx = endIdx1;
    else if (endIdx2 !== -1) endIdx = endIdx2;
    
    if (endIdx !== -1) {
      blocks.push(block.substring(0, endIdx).trim());
    } else {
      blocks.push(block.trim());
    }
  }
  output[fileName] = blocks;
}

fs.writeFileSync(path.resolve('scratch/sa_blocks_fixed.json'), JSON.stringify(output, null, 2));
console.log('Extracted blocks to scratch/sa_blocks_fixed.json');
