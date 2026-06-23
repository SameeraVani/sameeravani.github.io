import * as cheerio from 'cheerio';

async function run() {
    const idxRes = await fetch('https://madhwafestivals.com/2017/03/16/harikathamruta-saara/');
    const idxHtml = await idxRes.text();
    const $idx = cheerio.load(idxHtml);

    $idx('.entry-content a').each((i, el) => {
        let text = $idx(el).text().trim();
        if (text.length > 0) {
            console.log(`Link text: "${text}"`);
        }
    });
}
run().catch(console.error);
