
const Papa = require('papaparse');

const GOOGLE_SHEETS_CONFIG = {
    HR_WORKFLOW_ID: '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc',
    GIDS: {
        JD: '1710919034'
    }
};

const TARGET_ROLE = 'Sr. Executive - Health, Safety & Environment';

async function searchJD() {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID}/export?format=csv&gid=${GOOGLE_SHEETS_CONFIG.GIDS.JD}`;
    console.log(`Searching JD sheet for "${TARGET_ROLE}"...`);
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
        const matches = results.data.filter(r => (r.Role || r.ROLE || '').includes('Health, Safety & Environment'));
        if (matches.length > 0) {
            console.log(`Found ${matches.length} matches:`, JSON.stringify(matches, null, 2));
        } else {
            console.log(`No matches found in JD sheet.`);
        }
    } catch (e) {
        console.error(`Error searching sheet:`, e.message);
    }
}

searchJD();
