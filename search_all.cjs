
const Papa = require('papaparse');

const GOOGLE_SHEETS_CONFIG = {
    HR_WORKFLOW_ID: '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc',
    GIDS: {
        REQUIREMENT_INTAKE: '339974753',
        JD: '1710919034',
        JD_APPROVAL: '2038967090',
        LOG: '852833659',
        SHORTLIST: '730726534'
    }
};

const TARGET_LOG_ID = '78W61L18WG';

async function searchAll() {
    for (const [name, gid] of Object.entries(GOOGLE_SHEETS_CONFIG.GIDS)) {
        console.log(`Searching ${name} (GID: ${gid})...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            const csvText = await response.text();
            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
            const row = results.data.find(r => String(r['Log ID'] || '').trim() === TARGET_LOG_ID);
            if (row) {
                console.log(`FOUND in ${name}:`, JSON.stringify(row, null, 2));
            }
        } catch (e) {
            console.error(`Error searching ${name}:`, e.message);
        }
    }
}

searchAll();
