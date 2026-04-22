import React, { createContext, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { fetchSheetsParallel, invalidateCache } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Sheet definitions - computed once
const SHEETS = [
    { gid: GOOGLE_SHEETS_CONFIG.GIDS.JD, key: 'jd' },
    { gid: GOOGLE_SHEETS_CONFIG.GIDS.LOG, key: 'log' },
    { gid: GOOGLE_SHEETS_CONFIG.GIDS.REQUIREMENT_INTAKE, key: 'requirements' },
    { gid: GOOGLE_SHEETS_CONFIG.GIDS.JD_APPROVAL, key: 'jdApproval' },
    { gid: GOOGLE_SHEETS_CONFIG.GIDS.MESSAGE_APPROVAL, key: 'messageApproval' },
];

export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        jd: [],
        log: [],
        requirements: [],
        jdApproval: [],
        messageApproval: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(0);
    const fetchInProgress = useRef(false);
    const mountedRef = useRef(true);
    const abortRef = useRef(null);
    const initialLoadDone = useRef(false);

    // Normalize log data
    const normalizeLogData = useCallback((rawData) => {
        if (!Array.isArray(rawData)) return [];
        
        return rawData.map((item) => {
            const Role = (item.Role || item.role || '').trim();
            const Name = (item['Name of the Candidate'] || item.Name || item.name || '').trim();
            const Email = (item.Email || item.email || '').trim();
            const CV = (item.CV || item.cv || '').trim();
            const LogID = (item['Log ID'] || item.log_id || '').trim();
            const Contact = (item['Contact Number'] || item.contact || '').trim();
            
            let statusValue = (item.Status || item.status || '').trim();
            let normalizedStatus = statusValue;

            if (statusValue.toLowerCase().includes('shortlist') && !statusValue.toLowerCase().includes('not')) {
                normalizedStatus = 'Shortlisted for Round 1';
            } else if (statusValue.toLowerCase().includes('reject') || statusValue.toLowerCase().includes('not shortlist')) {
                normalizedStatus = 'Rejected';
            } else if (!statusValue) {
                normalizedStatus = 'Pending';
            }

            return {
                ...item,
                Role,
                Name,
                'Name of the Candidate': Name,
                Email,
                CV,
                'Contact Number': Contact,
                Status: normalizedStatus,
                status: normalizedStatus,
                'Log ID': LogID
            };
        });
    }, []);

    // Core fetch function - optimized with parallel batch fetch
    const fetchSheets = useCallback(async (force = false) => {
        if (fetchInProgress.current && !force) return;
        fetchInProgress.current = true;

        // Cancel any previous in-flight fetch
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        const startTime = performance.now();

        try {
            if (force) {
                // Invalidate cache for force refresh
                invalidateCache(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID);
            }

            // Fetch ALL sheets in true parallel
            const results = await fetchSheetsParallel(
                GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID,
                SHEETS,
                { force, signal: controller.signal }
            );

            if (!mountedRef.current) return;

            // Normalize log data
            if (results.log) {
                results.log = normalizeLogData(results.log);
            }

            const elapsed = Math.round(performance.now() - startTime);
            console.log(`[DataContext] All sheets fetched in ${elapsed}ms ${force ? '(forced)' : '(cached)'}`);

            setData(results);
            setLastFetch(Date.now());
            setError(null);
            initialLoadDone.current = true;
        } catch (err) {
            if (err.name === 'AbortError') return; // Cancelled, ignore
            console.error('Fetch error:', err);
            if (mountedRef.current) setError(err.message);
        } finally {
            fetchInProgress.current = false;
            if (mountedRef.current) setLoading(false);
        }
    }, [normalizeLogData]);

    // Force refresh - bypasses cache, used after webhooks
    const forceRefresh = useCallback(() => {
        console.log('[DataContext] Force refresh triggered');
        fetchSheets(true);
    }, [fetchSheets]);

    // Regular refresh with minimal debounce
    const refreshData = useCallback(async (silent = false) => {
        // Only prevent fetches within 1 second
        if (Date.now() - lastFetch < 1000) return;
        
        if (!silent) setLoading(true);
        await fetchSheets();
    }, [fetchSheets, lastFetch]);

    // Initial load - fetch immediately

    useEffect(() => {
        mountedRef.current = true;
        fetchSheets();
        return () => {
            mountedRef.current = false;
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    // Background polling - 5s default for real-time updates (silent)
    useEffect(() => {
        const intervalTime = 5000;
        const interval = setInterval(() => {
            fetchSheets(true); // Always force fetch silently
        }, intervalTime);
        return () => clearInterval(interval);
    }, [fetchSheets]);

    // Refresh on tab visibility
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                // Only force refresh if data is more than 10s old
                if (Date.now() - lastFetch > 10000) {
                    fetchSheets(true);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [fetchSheets, lastFetch]);

    const setActiveRoute = useCallback((route) => {
        // No-op for compatibility
    }, []);

    const value = useMemo(() => ({
        ...data,
        loading,
        error,
        refreshData,
        forceRefresh,
        setActiveRoute,
        lastFetch
    }), [data, loading, error, refreshData, forceRefresh, setActiveRoute, lastFetch]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
