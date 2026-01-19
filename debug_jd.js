import Papa from 'papaparse';

const SHEET_ID = '1ENRs3BQ-PcJNea3OUorSszA7eml0yAgMNNMe-CN0WCE';
const GID = '28969301';
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function debug() {
    try {
        console.log(`Fetching from: ${URL}`);
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const text = await response.text();
        console.log("Raw CSV (first 200 chars):", text.substring(0, 200));

        Papa.parse(text, {
            header: true,
            complete: (results) => {
                if (results.data.length > 0) {
                    console.log("First row keys:", Object.keys(results.data[0]));
                    console.log("First row data:", results.data[0]);
                } else {
                    console.log("No data found.");
                }
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

debug();
