
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanDeepPucho() {
    for (let gid = 10; gid < 30; gid++) {
        console.log(`Scanning GID ${gid} for "pucholive"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            if (csvText.toLowerCase().includes('pucholive') || csvText.toLowerCase().includes('.png') || csvText.toLowerCase().includes('.jpg')) {
                console.log(`POTENTIAL MATCH FOUND in GID ${gid}! Scanning rows...`);
                const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                results.data.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        const cellStr = String(cell).toLowerCase();
                        if (cellStr.includes('pucholive') || cellStr.includes('.png') || cellStr.includes('.jpg')) {
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

scanDeepPucho();
