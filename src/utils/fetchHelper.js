/**
 * Fetches a URL with retry logic.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} retries - Number of retries (default 3).
 * @param {number} backoff - Initial backoff delay in ms (default 300).
 * @returns {Promise<Response>}
 */
export const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 300) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // If it's a server error (5xx), we might want to retry.
            // If it's a client error (4xx), retrying might not help, but for now we treat all non-200 as failures to be safe or retryable.
            // Actually, usually we only retry 5xx or network errors.
            // But for this webhook, let's assume valid requests should always succeed.
            if (retries > 0 && response.status >= 500) {
                throw new Error(`Server Error: ${response.status}`);
            }
            return response; // Return 4xx responses to be handled by caller
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying... (${retries} attempts left) - ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
};
