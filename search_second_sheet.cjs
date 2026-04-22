
const Papa = require('papaparse');

const SECOND_SPREADSHEET_ID = '1SfoOcgusTj3abbaGmMSGQCLTCuuExD_ha3feURYeON0';

async function searchSecond() {
    for (let gid = 0; gid < 5; gid++) {
        console.log(`Searching Second Sheet GID ${gid}...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SECOND_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
            const row = results.data.find(r =>
                Object.values(r).some(v => String(v).includes('78W61L18WG'))
            );
            if (row) {
                console.log(`FOUND in Second Sheet GID ${gid}:`, JSON.stringify(row, null, 2));
            }
        } catch (e) {
            // console.error(`Error:`, e.message);
        }
    }
}

searchSecond();
