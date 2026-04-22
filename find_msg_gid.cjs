
const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function findMessageApproval() {
    for (let gid = 0; gid < 50; gid++) {
        process.stdout.write(`\rScanning GID ${gid}...`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const header = csvText.split('\n')[0].toLowerCase();
            if (header.includes('generated message') || header.includes('purpose') || header.includes('chat id')) {
                console.log(`\n[FOUND] GID ${gid} Header: ${header.substring(0, 100)}`);
            }
        } catch (e) {
            // Ignored
        }
    }
}

findMessageApproval();
