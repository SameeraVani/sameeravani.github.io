const fs = require('fs');
const path = require('path');

const paths = [
  'public/books/sanskrit-learner/sa/ch6.md',
  'public/books/sanskrit-learner/kn/ch6.md',
  'RefBooks/sanskrit learner/Shabda - Kannada.md',
  'public/books/sanskrit-learner/hi/ch6.md',
  'public/books/sanskrit-learner/ta/ch6.md',
  'public/books/sanskrit-learner/te/ch6.md',
  'public/books/sanskrit-learner/en/ch6.md'
];

paths.forEach(p => {
  const fullPath = path.resolve(__dirname, '..', p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/ज्ञानैभ्यः/g, 'ज्ञानेभ्यः');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${p}`);
  } else {
    console.log(`File not found: ${p}`);
  }
});
