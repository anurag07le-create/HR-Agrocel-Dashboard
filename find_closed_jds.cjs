
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
        const jdRowsRaw = jdText.split('\n');
        const jdHeader = jdRowsRaw[0].split(',').map(h => h.trim());
        const jdRows = jdRowsRaw.slice(1).map(l => {
            const cols = l.split(',');
            const obj = {};
            jdHeader.forEach((h, idx) => obj[h] = cols[idx]);
            return obj;
        });

        const reqRes = await fetch(reqUrl);
        const reqText = await reqRes.text();
        const reqRowsRaw = reqText.split('\n');
        const reqHeader = reqRowsRaw[0].split(',').map(h => h.trim());
        const reqRows = reqRowsRaw.slice(1).map(l => {
            const cols = l.split(',');
            const obj = {};
            reqHeader.forEach((h, idx) => obj[h] = cols[idx]);
            return obj;
        });

        let closedCount = 0;
        jdRows.forEach((item, index) => {
            const logId = (item['Log ID'] || '').toString().trim();
            if (!logId) return;

            const jdStatus = (item.Status || item.status || '').toString().trim().toLowerCase();
            let rawStatus = jdStatus;

            if (!rawStatus) {
                const matchingReq = reqRows.find(r => String(r['Log ID'] || r['log_id']) === String(logId));
                rawStatus = (matchingReq?.Status || matchingReq?.status || (matchingReq ? matchingReq['Current Status of Requirement'] : null) || 'open').toString().trim().toLowerCase();
            }

            const isClosed = rawStatus.includes('close');
            if (isClosed) {
                closedCount++;
                console.log(`CLOSED JD: LogID=${logId}, RawStatus=${rawStatus}`);
            }
        });
        console.log(`Total Closed JDs: ${closedCount}`);
    } catch (e) {
        console.log("Error:", e.message);
    }
}

simulateJDFilter();
