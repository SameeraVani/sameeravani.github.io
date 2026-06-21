import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'public/books/catalog.json');
const hksPath = path.join(process.cwd(), 'public/books/hari-kathamruta-saara');

let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Remove if it already exists
catalog = catalog.filter(b => b.id !== 'hari-kathamruta-saara');

const languages = ['en', 'hi', 'kn', 'sa', 'ta', 'te'];
const langMap = {
    'en': 'english',
    'hi': 'hindi',
    'kn': 'kannada',
    'sa': 'sanskrit',
    'ta': 'tamil',
    'te': 'telugu'
};

const bookObj = {
    id: "hari-kathamruta-saara",
    title: "Hari Kathamruta Saara",
    author: "Sri Jagannatha Dasa",
    year: "18th Century CE",
    genre: "Devotional / Haridasa Sahitya",
    description: "Hari Kathamruta Saara is a magnum opus of Haridasa literature written by Sri Jagannatha Dasa in Kannada. It distills the complex philosophy of Dvaita Vedanta into accessible poetic verses.",
    coverUrl: "books/hari-kathamruta-saara/cover.png",
    languages: ["english", "sanskrit", "hindi", "kannada", "tamil", "telugu"],
    localized: {
        "sanskrit": {
            "title": "हरिकथामृतसारः",
            "description": "हरिकथामृतसारः श्रीजगन्नाथदासेन रचितः हरिदाससाहित्यस्य महाग्रन्थः अस्ति। अस्मिन् द्वैतवेदान्तस्य गहनतत्त्वानि सुलभरूपेण वर्णितानि सन्ति।"
        },
        "hindi": {
            "title": "हरिकथामृतसार",
            "description": "हरिकथामृतसार श्री जगन्नाथ दास द्वारा रचित हरिदास साहित्य का एक महान ग्रंथ है। इसमें द्वैत वेदांत के जटिल दर्शन को सरल काव्य रूप में प्रस्तुत किया गया है।"
        },
        "kannada": {
            "title": "ಹರಿಕಥಾಮೃತಸಾರ",
            "description": "ಹರಿಕಥಾಮೃತಸಾರವು ಶ್ರೀ ಜಗನ್ನಾಥ ದಾಸರಿಂದ ರಚಿತವಾದ ಹರಿದಾಸ ಸಾಹಿತ್ಯದ ಒಂದು ಶ್ರೇಷ್ಠ ಕೃತಿಯಾಗಿದೆ. ದ್ವೈತ ವೇದಾಂತದ ಗಹನವಾದ ತತ್ವಗಳನ್ನು ಇದು ಸುಲಭವಾಗಿ ತಿಳಿಸುತ್ತದೆ."
        },
        "tamil": {
            "title": "ஹரிகதாம்ருத சாரம்",
            "description": "ஹரிகதாம்ருத சாரம் ஸ்ரீ ஜெகந்நாத தாசரால் இயற்றப்பட்ட ஹரிதாச இலக்கியத்தின் ஒரு தலைசிறந்த படைப்பாகும். இது துவைத வேதாந்தத்தின் சிக்கலான தத்துவங்களை எளிமையான கவிதை வடிவில் வழங்குகிறது."
        },
        "telugu": {
            "title": "హరికథామృతసారము",
            "description": "హరికథామృతసారము శ్రీ జగన్నాథ దాసులచే రచింపబడిన హరిదాస సాహిత్యములోని మహా గ్రంథము. ఇది ద్వైత వేదాంతము యొక్క క్లిష్టమైన తత్వమును సరళమైన కావ్య రూపములో బోధిస్తుంది."
        }
    },
    chapters: {}
};

for (const shortLang of languages) {
    const fullLang = langMap[shortLang];
    const dir = path.join(hksPath, shortLang);
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    files.sort((a, b) => {
        const numA = parseInt(a.split('-')[0]);
        const numB = parseInt(b.split('-')[0]);
        return numA - numB;
    });

    const chapters = files.map(file => {
        const num = file.split('-')[0];
        let namePart = file.replace(`${num}-`, '').replace('.md', '');
        // capitalize
        const titleWords = namePart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
        const cleanName = titleWords.join(' ');

        let prefix = "Chapter";
        if (fullLang === "sanskrit") prefix = "अध्यायः";
        if (fullLang === "hindi") prefix = "अध्याय";
        if (fullLang === "kannada") prefix = "ಸಂಧಿ"; // Wait, user said chapter number and name mixed. Let's just keep simple title.

        const chapterTitles = {
            'english': `Sandhi ${num}: ${cleanName}`,
            'sanskrit': `सन्धिः ${num}`,
            'hindi': `सन्धि ${num}`,
            'kannada': `ಸಂಧಿ ${num}`,
            'tamil': `சந்தி ${num}`,
            'telugu': `సంధి ${num}`
        };

        return {
            id: `sandhi-${num}`,
            title: chapterTitles[fullLang] || `Sandhi ${num}`,
            path: `books/hari-kathamruta-saara/${shortLang}/${file}`
        };
    });

    bookObj.chapters[fullLang] = chapters;
}

catalog.push(bookObj);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log("Updated catalog.json with Hari Kathamruta Saara!");
