
const SPREADSHEET_ID = '1aWU51LjKnrq6lauTL2srDCAFUPldDiqh5yl80lpPZkc';

async function scanGidsExtended() {
    process.stdout.write('Starting scan...\n');
    for (let gid = 0; gid < 40; gid++) {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            const response = await fetch(url);
            if (!response.ok) continue;
            const csvText = await response.text();
            const header = csvText.split('\n')[0].toLowerCase().trim();

            if (header.length > 5) {
                console.log(`GID: ${gid} | Header: ${header.substring(0, 50)}`);
            }
        } catch (e) {
            // Ignored
        }
    }
}

scanGidsExtended();
