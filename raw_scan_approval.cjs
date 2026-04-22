
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '2038967090';

async function rawScan() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
        results.data.forEach((row, i) => {
            console.log(`Row ${i} (${row.length} cols):`, JSON.stringify(row));
        });
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

rawScan();
