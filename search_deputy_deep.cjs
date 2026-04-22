
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GIDS = {
    JD_APPROVAL: '2038967090',
    REQUIREMENT_INTAKE: '339974753',
    JD: '1710919034'
};

async function searchDeputy() {
    for (const [name, gid] of Object.entries(GIDS)) {
        console.log(`Searching in ${name} (GID ${gid})...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
            const matches = results.data.filter(r =>
                Object.values(r).some(v => String(v).includes('Deputy'))
            );
            if (matches.length > 0) {
                console.log(`FOUND ${matches.length} matches:`, JSON.stringify(matches, null, 2));
            } else {
                console.log(`No matches in ${name}.`);
            }
        } catch (e) {
            console.error(`Error in ${name}:`, e.message);
        }
    }
}

searchDeputy();
