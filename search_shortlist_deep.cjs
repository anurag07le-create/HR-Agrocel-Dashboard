
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '730726534'; // Shortlist tab

async function searchShortlist() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
        const row = results.data.find(r =>
            Object.values(r).some(v => String(v).includes('78W61L18WG'))
        );
        if (row) {
            console.log(`FOUND in SHORTLIST sheet:`, JSON.stringify(row, null, 2));
        } else {
            console.log(`Not found in SHORTLIST sheet.`);
        }
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchShortlist();
