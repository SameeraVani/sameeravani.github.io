import fs from 'fs';
const langs = ['en','hi','kn','ta','te'];
const results = {};
langs.forEach(l => {
  const c = fs.readFileSync('scratch/'+l+'_6.txt','utf8');
  results[l] = c.match(/\*\*\".*?\"\*\*/g);
});
fs.writeFileSync('scratch/quotes.json', JSON.stringify(results, null, 2));
