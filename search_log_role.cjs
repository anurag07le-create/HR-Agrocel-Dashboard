
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '852833659'; // LOG tab

async function searchLogByRole() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const matches = results.data.filter(r =>
            Object.values(r).some(v => String(v).includes('Health, Safety & Environment'))
        );
        if (matches.length > 0) {
            console.log(`FOUND in LOG sheet:`, JSON.stringify(matches, null, 2));
        } else {
            console.log(`Not found in LOG sheet.`);
        }
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchLogByRole();
