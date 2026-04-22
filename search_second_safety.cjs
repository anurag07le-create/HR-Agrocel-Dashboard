
const Papa = require('papaparse');

const SHORTLIST_SPREADSHEET_ID = '1SfoOcgusTj3abbaGmMSGQCLTCuuExD_ha3feURYeON0';

async function searchSecondSafety() {
    for (let gid = 0; gid < 10; gid++) {
        console.log(`Searching Second Sheet GID ${gid} for "Safety"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SHORTLIST_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            const match = results.data.find(r =>
                Object.values(r).some(v => String(v).includes('Safety'))
            );
            if (match) {
                console.log(`FOUND in Second Sheet GID ${gid}:`, JSON.stringify(match, null, 2));
            }
        } catch (e) {
            // Ignored
        }
    }
}

searchSecondSafety();
