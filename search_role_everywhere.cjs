
const Papa = require('papaparse');

const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';
const GIDS = {
    REQUIREMENT_INTAKE: '339974753',
    JD: '1710919034',
    JD_APPROVAL: '2038967090',
    LOG: '852833659',
    SHORTLIST: '730726534'
};

const TARGET_ROLE = 'Health, Safety & Environment';

async function searchRoleEverywhere() {
    for (const [name, gid] of Object.entries(GIDS)) {
        console.log(`Searching ${name} for "${TARGET_ROLE}"...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            const matches = results.data.filter(r =>
                Object.values(r).some(v => String(v).includes(TARGET_ROLE))
            );
            if (matches.length > 0) {
                console.log(`  FOUND in ${name}:`, JSON.stringify(matches, null, 2));
            }
        } catch (e) {
            // console.error(`Error:`, e.message);
        }
    }
}

searchRoleEverywhere();
