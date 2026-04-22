
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GID = '339974753';

async function findInReq() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
        results.data.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (String(cell).startsWith('http')) {
                    console.log(`URL FOUND in REQUIREMENT_INTAKE Row ${i} Col ${j}: ${cell}`);
                }
            });
        });
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

findInReq();
