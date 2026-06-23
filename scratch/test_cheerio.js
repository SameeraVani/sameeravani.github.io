import * as cheerio from 'cheerio';
import fs from 'fs';

async function testScrape() {
    const res = await fetch('https://madhwafestivals.com/2016/09/03/mangala-charana-sandhi-hari-kathamrutha-saara/');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const content = $('.entry-content');
    
    let verses = [];
    content.find('p').each((i, el) => {
        // replace <br> with newlines
        $(el).find('br').replaceWith('\n');
        let text = $(el).text().trim();
        // remove extra spaces but keep newlines
        text = text.replace(/ +/g, ' '); 
        if (text && text.match(/[\u0C80-\u0CFF]/)) { 
            verses.push(text);
        }
    });

    console.log("First verse:\n", verses[0]);
    console.log("Second verse:\n", verses[1]);
}

testScrape().catch(console.error);
