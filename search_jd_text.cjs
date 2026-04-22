
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '1710919034';

async function searchByPosterText() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
        console.log(`Searching ${results.data.length} rows in Master JD...`);
        results.data.forEach((row, i) => {
            const rowStr = JSON.stringify(row);
            if (rowStr.toLowerCase().includes('ehs') || rowStr.toLowerCase().includes('safety') || rowStr.toLowerCase().includes('ghorasal')) {
                console.log(`MATCH Row ${i}:`, rowStr);
            }
        });
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchByPosterText();
