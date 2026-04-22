
const Papa = require('papaparse');

const GOOGLE_SHEETS_CONFIG = {
    HR_WORKFLOW_ID: '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc',
    GIDS: {
        JD: '1710919034'
    }
};

const TARGET_DOC = 'https://studio.pucho.ai/api/v1/step-files/signed?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJmaWxlSWQiOiJGOFRnbHMzcTg4Z25pSjgyUmxMSGwiLCJpYXQiOjE3NzAyODM0NDksImV4cCI6MTc3Mjg3NTQ0OSwiaXNzIjoiYWN0aXZlcGllY2VzIn0.OSJVtMkyTxDEiG1TMeKdrFenA9DV3d2DBKDwiezFk68';

async function searchByDoc() {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID}/export?format=csv&gid=${GOOGLE_SHEETS_CONFIG.GIDS.JD}`;
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const row = results.data.find(r =>
            (r['JOB DESCRIPTION'] || r['JD Doc'] || '').includes('F8Tgls3q88gniJ82RlMHL') // The fileId part of the token
        );
        if (row) {
            console.log(`Found MATCHING DOC in JD Master:`, JSON.stringify(row, null, 2));
        } else {
            console.log(`Doc NOT found in JD Master.`);
        }
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

searchByDoc();
