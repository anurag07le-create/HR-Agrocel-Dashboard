import { fetchSheetData } from './src/utils/googleSheets.js';
import { GOOGLE_SHEETS_CONFIG } from './src/config.js';

async function run() {
    try {
        const data = await fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.JD_APPROVAL);
        console.log("LAST ROW:");
        console.log(JSON.stringify(data[data.length - 1], null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
