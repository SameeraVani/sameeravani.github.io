import fs from 'fs';
import path from 'path';

function testDialogue() {
    const lines = fs.readFileSync('public/books/nyayamruta/sa/paricheda1/prakarana1/7.md', 'utf8').split(/\r?\n/);
    let inDialogue = false;
    let translatedCount = 0;
    
    for(let i=0; i<lines.length; i++) {
        const line = lines[i].trim();
        
        // Stop condition for dialogue block
        if (line === '</details>' || line.includes('न्यायामृत')) {
            inDialogue = false;
        } 
        // Start condition for dialogue block
        else if (line.startsWith('**समीरवाणी')) {
            inDialogue = true;
        } 
        // Inside dialogue block
        else if (inDialogue && line !== '') {
            // Check if it's the second line of a multi-line Nyayamrutam quote that slipped through
            if (line.startsWith('**त्वम् ।') || line.startsWith('**तत्प्रसिद्धिश्च')) {
                inDialogue = false;
                continue;
            }
            
            translatedCount++;
            console.log(`Translate line ${i}: ${line.substring(0, 50)}...`);
        }
    }
    console.log('Total translated lines:', translatedCount);
}

testDialogue();
