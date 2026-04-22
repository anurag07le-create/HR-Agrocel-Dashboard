/**
 * Parse interview date from Google Sheet column I
 * Handles multiple formats:
 * - "17/03/2026, 12:00 am" (DD/MM/YYYY, HH:MM AM/PM)
 * - "2026-02-19T16:00:00.000Z" (ISO format)
 * - "2026-02-21" (YYYY-MM-DD)
 */
export const parseCustomDate = (dateStr) => {
    if (!dateStr) return null;
    
    const str = String(dateStr).trim();
    
    // Format 1 & 2: DD/MM/YYYY or DD-MM-YYYY (with or without time)
    // Example: "17/03/2026, 12:00 am" or "22/4/2026 11:00:00" or "22-04-2026"
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10);
        const year = parseInt(ddmmyyyyMatch[3], 10);
        return new Date(year, month - 1, day);
    }
    
    // Format 3: "2026-02-19T16:00:00.000Z" or "2026-02-21" (ISO/YYYY-MM-DD)
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        return new Date(year, month - 1, day);
    }
    
    console.log('[parseCustomDate] Could not parse:', str);
    return null;
};

/**
 * Extract time from interview date string
 * Format: "17/03/2026, 12:00 am" → "12:00 AM", or "22/4/2026 11:00:00" → "11:00:00"
 */
export const extractTimeFromDate = (rawDate) => {
    if (!rawDate) return null;
    
    const str = String(rawDate).trim();
    
    // Match time part with AM/PM: "12:00 am"
    const matchAmPm = str.match(/(\d{1,2}:\d{2})\s*(am|pm)/i);
    if (matchAmPm) {
        return `${matchAmPm[1]} ${matchAmPm[2].toUpperCase()}`;
    }
    
    // Match 24-hour time part or time with seconds: "11:00:00" or "14:30"
    const match24 = str.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (match24) {
        return match24[1];
    }
    
    return null;
};

/**
 * Format date to DD/MM/YYYY for display
 */
export const formatDateToDDMMYYYY = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};
