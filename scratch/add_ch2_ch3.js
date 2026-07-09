import fs from 'fs';
import path from 'path';

const lettersPath = path.join(process.cwd(), 'public/books/sanskrit-learner/practice/letters.json');
let letters = JSON.parse(fs.readFileSync(lettersPath, 'utf8'));

// Add Gunita (ch2)
const gunitas = ['का', 'कि', 'की', 'कु', 'कू', 'कृ', 'कॄ', 'कॢ', 'के', 'कै', 'को', 'कौ', 'कं', 'कः'];
gunitas.forEach((char, i) => {
  letters.push({
    id: `g${i+1}`,
    char: char,
    type: "gunita"
  });
});

// Parse Conjuncts (ch3)
const ch3Path = path.join(process.cwd(), 'public/books/sanskrit-learner/te/ch3.md');
const ch3Content = fs.readFileSync(ch3Path, 'utf8');

// Match `<b>क् + क् + अ = क्क</b>` and `(अक्का)`
const conjunctRegex = /<b>.*?=\s*([^<]+)<\/b>.*?<span[^>]*>\(([^)]+)\)<\/span>/g;
let match;
let cIndex = 1;

while ((match = conjunctRegex.exec(ch3Content)) !== null) {
  const char = match[1].trim();
  const example = match[2].trim();
  letters.push({
    id: `cj${cIndex++}`,
    char: char,
    type: "conjunct",
    example: example
  });
}

fs.writeFileSync(lettersPath, JSON.stringify(letters, null, 2));
console.log(`Added ${gunitas.length} gunitas and ${cIndex - 1} conjuncts.`);
