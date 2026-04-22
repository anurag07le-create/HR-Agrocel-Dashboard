import Papa from 'papaparse';

// ─── In-Memory Cache ───
const cache = new Map();
const CACHE_TTL = 1000; // 1 second - data older than this triggers background refresh
const STALE_TTL = 2000; // 2 seconds - data older than this is truly stale

// Pre-warm: restore from sessionStorage on first load
const SESSION_KEY = 'hr_sheet_cache';
try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, entry]) => {
            // Only restore if less than 60s old
            if (Date.now() - entry.timestamp < 60000) {
                cache.set(key, entry);
            }
        });
    }
} catch (e) { /* ignore parse errors */ }

// Persist cache to sessionStorage (debounced)
let persistTimer = null;
const persistCache = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        try {
            const obj = {};
            cache.forEach((val, key) => { obj[key] = val; });
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
        } catch (e) { /* quota exceeded or private mode */ }
    }, 500);
};

// Dedup in-flight requests
const inflightRequests = new Map();

/**
 * Fast CSV parser - runs synchronously for small datasets
 */
const parseCSV = (csvText) => {
    const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header, index) => header.trim() || `Col_${index}`,
    });
    // Filter out truly empty rows
    return result.data.filter(row =>
        Object.values(row).some(val => val !== null && val !== undefined && val !== '')
    );
};

/**
 * Fetch sheet data with aggressive caching and request deduplication.
 * Returns cached data instantly if available, fetches in background if stale.
 * 
 * @param {string} sheetId - The Google Sheet ID
 * @param {string} gid - The sheet tab GID
 * @param {object} options - { force: boolean, signal: AbortSignal }
 * @returns {Promise<Array>}
 */
export const fetchSheetData = async (sheetId, gid, options = {}) => {
    const cacheKey = `${sheetId}_${gid}`;
    const { force = false, signal } = options;
    const now = Date.now();

    // 1. Return from cache if fresh enough (unless forced)
    const cached = cache.get(cacheKey);
    if (cached && !force) {
        const age = now - cached.timestamp;
        if (age < CACHE_TTL) {
            return cached.data;
        }
        // If stale but not too old, return cached and refresh in background
        if (age < STALE_TTL) {
            // Fire background refresh (don't await)
            backgroundRefresh(sheetId, gid, cacheKey);
            return cached.data;
        }
    }

    // 2. Deduplicate concurrent requests for the same sheet
    if (inflightRequests.has(cacheKey) && !force) {
        return inflightRequests.get(cacheKey);
    }

    // 3. Fetch fresh data
    const fetchPromise = doFetch(sheetId, gid, cacheKey, signal);
    inflightRequests.set(cacheKey, fetchPromise);

    try {
        const result = await fetchPromise;
        return result;
    } finally {
        inflightRequests.delete(cacheKey);
    }
};

/**
 * Actual network fetch + parse + cache update
 */
const doFetch = async (sheetId, gid, cacheKey, signal) => {
    // Add timestamp to bypass Google's CDN edge cache
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;

    try {
        const response = await fetch(url, {
            signal,
            // Always fetch fresh from Google - our in-memory cache handles dedup
            cache: 'no-store',
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const csvText = await response.text();
        const data = parseCSV(csvText);

        // Update cache
        cache.set(cacheKey, { data, timestamp: Date.now() });
        persistCache();

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error; // Let caller (DataContext) handle the abort silently
        }
        
        // On network error, return stale cache if available
        const stale = cache.get(cacheKey);
        if (stale) {
            console.warn(`[GoogleSheets] Network error, using stale cache for gid=${gid}`);
            return stale.data;
        }
        console.error("Error fetching sheet data:", error);
        return [];
    }
};

/**
 * Background refresh - doesn't block the caller
 */
const backgroundRefresh = (sheetId, gid, cacheKey) => {
    if (inflightRequests.has(cacheKey)) return; // Already refreshing
    const promise = doFetch(sheetId, gid, cacheKey);
    inflightRequests.set(cacheKey, promise);
    promise.finally(() => inflightRequests.delete(cacheKey));
};

/**
 * Fetch multiple sheets in parallel - optimized batch fetch.
 * Returns results as a Map of { key: data[] }
 */
export const fetchSheetsParallel = async (sheetId, sheets, options = {}) => {
    const { force = false, signal } = options;
    const results = {};

    // Start all fetches concurrently
    const promises = sheets.map(async ({ gid, key }) => {
        try {
            const data = await fetchSheetData(sheetId, gid, { force, signal });
            results[key] = data || [];
        } catch (err) {
            if (err.name === 'AbortError') {
                throw err;
            }
            console.error(`Error fetching ${key}:`, err);
            results[key] = [];
        }
    });

    await Promise.all(promises);
    return results;
};

/**
 * Invalidate cache for a specific sheet or all sheets
 */
export const invalidateCache = (sheetId, gid) => {
    if (gid) {
        cache.delete(`${sheetId}_${gid}`);
    } else {
        // Invalidate all entries for this sheetId
        for (const key of cache.keys()) {
            if (key.startsWith(sheetId)) {
                cache.delete(key);
            }
        }
    }
    persistCache();
};
