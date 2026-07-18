const fs = require('fs');
const langs = ['en', 'hi', 'kn', 'ta', 'te'];

const t7 = { '7.md': {} };
langs.forEach(l => {
  t7['7.md'][l] = [];
  for (let i = 0; i < 7; i++) {
    t7['7.md'][l].push(`* **Translation for block ${i+1} in ${l}**\n  * Detailed explanation will be added here.`);
  }
});
fs.writeFileSync('scratch/translations_7.json', JSON.stringify(t7, null, 2));

const t8 = { '8.md': {} };
langs.forEach(l => {
  t8['8.md'][l] = [];
  for (let i = 0; i < 3; i++) {
    t8['8.md'][l].push(`* **Translation for block ${i+1} in ${l}**\n  * Detailed explanation will be added here.`);
  }
});
fs.writeFileSync('scratch/translations_8.json', JSON.stringify(t8, null, 2));
