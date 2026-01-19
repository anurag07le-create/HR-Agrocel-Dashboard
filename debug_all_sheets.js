import Papa from 'papaparse';

const SHEET_ID = '1ENRs3BQ-PcJNea3OUorSszA7eml0yAgMNNMe-CN0WCE';
const SHORTLIST_ID = '16pUY0EgcxcKe4qkASMjdR_5SN4qKOD4GUfm9iKn4HtY';

const GIDS = {
    REQUIREMENT_INTAKE: { id: SHEET_ID, gid: '0', name: 'Requirement Intake' },
    JD: { id: SHEET_ID, gid: '28969301', name: 'JD' },
    LOG: { id: SHEET_ID, gid: '918448908', name: 'Log' },
    SHORTLIST: { id: SHORTLIST_ID, gid: '1844578548', name: 'Shortlist' }
};

async function fetchHeaders(name, sheetId, gid) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
        console.log(`Fetching ${name}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
        const text = await response.text();

        return new Promise((resolve) => {
            Papa.parse(text, {
                header: true,
                preview: 1, // Only parse first row
                complete: (results) => {
                    if (results.meta.fields) {
                        console.log(`${name} Headers:`, results.meta.fields);
                    } else {
                        console.log(`${name}: No headers found`);
                    }
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error(`Error fetching ${name}:`, error.message);
    }
}

async function debugAll() {
    for (const key in GIDS) {
        const { id, gid, name } = GIDS[key];
        await fetchHeaders(name, id, gid);
    }
}

debugAll();
