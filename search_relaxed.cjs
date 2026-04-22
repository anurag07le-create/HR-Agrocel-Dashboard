
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '1710919034';

async function searchRelaxed() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        console.log(`Searching ${results.data.length} rows in Master JD...`);
        results.data.forEach((row, i) => {
            const role = String(row['Role'] || row['Role Name'] || '').toLowerCase();
            if (role.includes('safety') || role.includes('environment')) {
                console.log(`MATCH Row ${i}:`, JSON.stringify(row, null, 2));
            }
        });
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchRelaxed();
