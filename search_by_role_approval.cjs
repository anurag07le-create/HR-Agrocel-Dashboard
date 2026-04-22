
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '2038967090';

async function searchByRole() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const matches = results.data.filter(r =>
            (r['Role Name'] || r['Role'] || '').includes('Health, Safety & Environment')
        );
        if (matches.length > 0) {
            console.log(`FOUND matches in JD_APPROVAL:`, JSON.stringify(matches, null, 2));
        } else {
            console.log(`No matches found in JD_APPROVAL.`);
        }
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchByRole();
