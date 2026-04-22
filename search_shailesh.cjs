
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function searchShailesh() {
    for (let gid = 0; gid < 100; gid++) {
        process.stdout.write(`\rScanning GID ${gid}...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            if (csvText.toLowerCase().includes('shailesh.limbani')) {
                console.log(`\nMATCH FOUND in GID ${gid}! Scanning rows...`);
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                results.data.forEach((row, i) => {
                    const rowStr = JSON.stringify(row);
                    if (rowStr.toLowerCase().includes('shailesh.limbani')) {
                        console.log(`  Row ${i}: ${rowStr}`);
                    }
                });
            }
        } catch (e) {
            // Ignored
        }
    }
}

searchShailesh();
