
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanForPucho() {
    for (let gid = 0; gid < 10; gid++) {
        console.log(`Scanning GID ${gid} for "pucholive"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            if (csvText.includes('pucholive')) {
                console.log(`MATCH FOUND in GID ${gid}! Scanning rows...`);
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                results.data.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (String(cell).includes('pucholive')) {
                            console.log(`  Row ${i} Col ${j}: ${cell}`);
                        }
                    });
                });
            }
        } catch (e) {
            // Ignored
        }
    }
}

scanForPucho();
