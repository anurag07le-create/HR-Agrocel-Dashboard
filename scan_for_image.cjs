
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanForImage() {
    for (let gid = 0; gid < 20; gid++) {
        console.log(`Scanning GID ${gid} for image column...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            if (results.data.length > 0) {
                const keys = Object.keys(results.data[0]);
                const imageKey = keys.find(k => k.toLowerCase().includes('image'));
                if (imageKey) {
                    console.log(`  GID ${gid} HAS IMAGE COLUMN: "${imageKey}"`);
                    const rowWithImage = results.data.find(r => r[imageKey] && r[imageKey].startsWith('http'));
                    if (rowWithImage) {
                        console.log(`  Found Row with Image! Log ID: ${rowWithImage['Log ID']}, Value: ${rowWithImage[imageKey]}`);
                    }
                }
            }
        } catch (e) {
            // Ignored
        }
    }
}

scanForImage();
