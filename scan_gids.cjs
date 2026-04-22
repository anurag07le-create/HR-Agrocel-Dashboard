
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanGids() {
    for (let gid = 0; gid < 20; gid++) {
        console.log(`Scanning GID ${gid}...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            if (results.data.length > 0) {
                console.log(`  GID ${gid} found: ${results.data.length} rows. First Log ID: ${results.data[0]['Log ID']}`);
            }
        } catch (e) {
            // Ignored
        }
    }
}

scanGids();
