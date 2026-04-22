
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanDeep() {
    for (let gid = 0; gid < 100; gid++) {
        // Skip already checked
        if ([0, 1, 2, 1710919034, 2038967090, 339974753, 852833659, 730726534].map(String).includes(String(gid))) continue;

        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            if (csvText.length < 10) continue;
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            if (results.data.length > 0) {
                console.log(`Deep Found GID ${gid}: ${results.data.length} rows.`);
                const row = results.data.find(r =>
                    Object.values(r).some(v => String(v).includes('78W61L18WG'))
                );
                if (row) {
                    console.log(`  MATCH AT GID ${gid}! Data:`, JSON.stringify(row, null, 2));
                }
            }
        } catch (e) {
            // Ignored
        }
    }
}

scanDeep();
