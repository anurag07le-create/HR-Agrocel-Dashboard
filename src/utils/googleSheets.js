import Papa from 'papaparse';

export const fetchSheetData = async (sheetId, gid) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error("Error fetching sheet data:", error);
        return [];
    }
};
