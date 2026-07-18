import fs from 'fs';
import path from 'path';

function testLogic() {
    const lines = fs.readFileSync('public/books/nyayamruta/sa/paricheda1/prakarana1/3.md', 'utf8').split(/\r?\n/);
    let mode = 'header'; // 'frontmatter', 'header', 'nyayamruta', 'commentary'
    
    for(let i=0; i<lines.length; i++) {
        const line = lines[i].trim();
        
        if (i === 0 && line === '---') {
            mode = 'frontmatter';
            console.log(`[SKIP Frontmatter] ${line}`);
            continue;
        }
        if (mode === 'frontmatter') {
            console.log(`[SKIP Frontmatter] ${line}`);
            if (line === '---') mode = 'header';
            continue;
        }
        
        if (line === '<details>' || line.startsWith('<summary>') || line === '</details>' || line === '') {
            console.log(`[SKIP Structural] ${line}`);
            continue;
        }
        
        if (line.includes('न्यायामृत')) {
            mode = 'nyayamruta';
            console.log(`[TRANSLITERATE] ${line}`);
            continue;
        }
        
        if (line.startsWith('**समीरवाणी')) {
            mode = 'commentary';
            console.log(`[TRANSLATE] ${line}`);
            continue;
        }
        
        if (mode === 'nyayamruta') {
            console.log(`[TRANSLITERATE] ${line}`);
        } else {
            console.log(`[TRANSLATE] ${line}`);
        }
    }
}

testLogic();
