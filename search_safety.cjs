
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function searchSafety() {
    const gids = ['0', '1710919034'];
    for (const gid of gids) {
        console.log(`Checking GID ${gid} for "Safety"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            const match = results.data.find(r =>
                Object.values(r).some(v => String(v).includes('Safety'))
            );
            if (match) {
                console.log(`FOUND in GID ${gid}:`, JSON.stringify(match, null, 2));
            } else {
                console.log(`Not found in GID ${gid}.`);
            }
        } catch (e) {
            console.error(`Error:`, e.message);
        }
    }
}

searchSafety();
