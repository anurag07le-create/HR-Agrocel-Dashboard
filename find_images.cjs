
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '2038967090';

async function findImages() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        results.data.forEach((row, i) => {
            console.log(`Checking Row ${i}...`);
            Object.entries(row).forEach(([k, v]) => {
                if (String(v).includes('pucholive') || String(v).match(/\.(png|jpg|jpeg|gif)/i)) {
                    console.log(`  POTENTIAL IMAGE in "${k}": ${v}`);
                }
            });
        });
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

findImages();
