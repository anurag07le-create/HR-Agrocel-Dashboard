import Papa from 'papaparse';

const SHEET_ID = '1ENRs3BQ-PcJNea3OUorSszA7eml0yAgMNNMe-CN0WCE';
const GID = '1844578548'; // Shortlist GID
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

async function debug() {
    try {
        const response = await fetch(URL);
        const text = await response.text();
        console.log("Raw Text Preview (first 500 chars):", text.substring(0, 500));

        Papa.parse(text, {
            header: false, // Turn off header parsing to avoid duplicate header errors
            complete: (results) => {
                console.log("Total rows:", results.data.length);
                if (results.data.length > 1) {
                    // Assume row 0 is header, row 1 is data
                    console.log("Header Row:", results.data[0]);
                    console.log("First Data Row:", results.data[1]);
                }
            }
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

debug();
