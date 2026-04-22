
const Papa = require('papaparse');

const SECOND_SPREADSHEET_ID = '1SfoOcgusTj3abbaGmMSGQCLTCuuExD_ha3feURYeON0';

async function scanSecondPucho() {
    for (let gid = 0; gid < 10; gid++) {
        console.log(`Scanning Second Sheet GID ${gid} for "pucholive"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SECOND_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            if (csvText.toLowerCase().includes('pucholive') || csvText.toLowerCase().includes('.png') || csvText.toLowerCase().includes('.jpg')) {
                console.log(`POTENTIAL MATCH FOUND in Second Sheet GID ${gid}! Scanning rows...`);
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

scanSecondPucho();
