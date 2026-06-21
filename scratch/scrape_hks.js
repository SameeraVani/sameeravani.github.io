import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import Sanscript from '@indic-transliteration/sanscript';

const outBase = path.join(process.cwd(), 'public/books/hari-kathamruta-saara');

const langConfig = {
    kn: { script: 'kannada', type: 'Kannada' },
    en: { script: 'iast', type: 'English' },
    hi: { script: 'devanagari', type: 'Hindi' },
    sa: { script: 'devanagari', type: 'Sanskrit' },
    ta: { script: 'tamil', type: 'Tamil' },
    te: { script: 'telugu', type: 'Telugu' }
};

function transliterate(text, targetScript) {
    if (targetScript === 'kannada') return text;
    return Sanscript.t(text, 'kannada', targetScript);
}

function createFrontmatter(title, langType) {
    let cleanTitle = title.replace(/"/g, '\\"');
    return `---
title: "${cleanTitle}"
type: "Hari Kathamruta Saara"
language: "${langType}"
---
`;
}

async function run() {
    console.log("Fetching index page...");
    const idxRes = await fetch('https://madhwafestivals.com/2017/03/16/harikathamruta-saara/');
    const idxHtml = await idxRes.text();
    const $idx = cheerio.load(idxHtml);

    const chapters = [];
    let chNum = 1;
    $idx('.entry-content a').each((i, el) => {
        const url = $idx(el).attr('href');
        let text = $idx(el).text().trim();
        
        if (text.includes('ಸಂಧಿ') || text.toLowerCase().includes('sandhi')) {
            let parts = text.split('/');
            let engPart = parts[parts.length - 1].trim();
            let name = engPart.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (!name) name = 'sandhi';
            
            const filename = `${chNum}-${name}.md`;
            
            if (!chapters.find(c => c.url === url)) {
                chapters.push({ num: chNum, name, url, title: text, filename });
                chNum++;
            }
        }
    });

    console.log(`Found ${chapters.length} chapters.`);
    
    for (const ch of chapters) {
        console.log(`Processing Chapter ${ch.num}: ${ch.filename}`);
        const res = await fetch(ch.url);
        const html = await res.text();
        const $ = cheerio.load(html);
        const content = $('.entry-content');

        let knVerses = [];
        content.find('p').each((i, el) => {
            $(el).find('br').replaceWith('__BR__');
            let text = $(el).text().trim().replace(/\s+/g, ' ');
            text = text.replace(/ ?__BR__ ?/g, '<br/>');
            if (text && text.match(/[\u0C80-\u0CFF]/)) {
                knVerses.push(text);
            }
        });
        
        if (knVerses.length === 0) {
            console.log("  No Kannada verses found.");
            continue;
        }

        const moolaKn = knVerses.join('\n\n');

        for (const [lang, cfg] of Object.entries(langConfig)) {
            const dirpath = path.join(outBase, lang);
            if (!fs.existsSync(dirpath)) {
                fs.mkdirSync(dirpath, { recursive: true });
            }
            
            const filepath = path.join(dirpath, ch.filename);
            const translatedText = transliterate(moolaKn, cfg.script);
            const fileContent = createFrontmatter(ch.title, cfg.type) + '\n' + translatedText + '\n';
            fs.writeFileSync(filepath, fileContent, 'utf-8');
        }
    }
    console.log("Done.");
}

run().catch(console.error);
