
const CONFIG = {
    HR_WORKFLOW_ID: '1jVSZ_LnNuGspcVcIdWNy_IPhOlgRzuxROAR38UZ860g',
    GIDS: {
        JD: '442882796',
        REQUIREMENT_INTAKE: '0'
    }
};

async function simulateJDFilter() {
    const jdUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.HR_WORKFLOW_ID}/export?format=csv&gid=${CONFIG.GIDS.JD}`;
    const reqUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.HR_WORKFLOW_ID}/export?format=csv&gid=${CONFIG.GIDS.REQUIREMENT_INTAKE}`;

    try {
        const jdRes = await fetch(jdUrl);
        const jdText = await jdRes.text();
        const jdLines = jdText.split('\n');
        const jdHeader = jdLines[0].split(',').map(h => h.trim());
        const jdRows = jdLines.slice(1).map(l => {
            const cols = l.split(',');
            const obj = {};
            jdHeader.forEach((h, i) => obj[h] = cols[i]);
            return obj;
        });

        const reqRes = await fetch(reqUrl);
        const reqText = await reqRes.text();
        const reqLines = reqText.split('\n');
        const reqHeader = reqLines[0].split(',').map(h => h.trim());
        const reqRows = reqLines.slice(1).map(l => {
            const cols = l.split(',');
            const obj = {};
            reqHeader.forEach((h, i) => obj[h] = cols[i]);
            return obj;
        });

        console.log(`JD Rows: ${jdRows.length}`);
        console.log(`Req Rows: ${reqRows.length}`);

        const closedJDs = jdRows.filter(item => {
            const logId = (item['Log ID'] || '').toString().trim();
            if (!logId) return false;

            // Simplified logic from JD.jsx
            const jdStatus = (item.Status || item.status || '').toString().trim().toLowerCase();
            let rawStatus = jdStatus;

            if (!rawStatus) {
                const matchingReq = reqRows.find(r => String(r['Log ID'] || r['log_id']) === String(logId));
                rawStatus = (matchingReq?.Status || matchingReq?.status || (matchingReq ? matchingReq['Current Status of Requirement'] : null) || 'open').toString().trim().toLowerCase();
            }

            const itemStatus = (rawStatus === 'close' || rawStatus === 'closed') ? 'closed' : 'open';
            if (i < 5) console.log(`Debug Row ${i}: LogID=${logId}, RawStatus=${rawStatus}, ItemStatus=${itemStatus}`);
            return itemStatus === 'closed';
        });

        console.log(`Closed JDs found: ${closedJDs.length}`);
        if (closedJDs.length > 0) {
            console.log("Example Closed JD Log IDs:", closedJDs.slice(0, 3).map(j => j['Log ID']));
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

simulateJDFilter();
