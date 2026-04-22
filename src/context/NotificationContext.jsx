import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchSheetData } from '../utils/googleSheets';
import { GOOGLE_SHEETS_CONFIG } from '../config';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

// Shared Enrichment Logic (Used by both Context background poller and manual triggers)
export const mapJDApprovalData = (jdRow, logId, masterImage = null, reqIntakeRow = null) => {
    if (!jdRow) return null;

    // Robust Key Finding
    const findKey = (row, keywords) => {
        return Object.keys(row).find(k =>
            keywords.some(kw => String(k || '').trim().toLowerCase().includes(kw.toLowerCase()))
        );
    };

    const roleKey = findKey(jdRow, ['role name', 'role title', 'role']);
    const imageKeyFound = findKey(jdRow, ['jd image', 'image', 'poster', 'preview', 'visual', 'jd_image', 'image url']);
    const docKey = findKey(jdRow, ['jd doc', 'jd text', 'document link', 'document_link', 'doc_link', 'doc_url']);
    const descKey = findKey(jdRow, ['description', 'jd description', 'job description', 'jd_description']);

    const jdApprovalImage = (imageKeyFound && jdRow[imageKeyFound] && String(jdRow[imageKeyFound]) !== 'undefined') ? String(jdRow[imageKeyFound]).trim() : null;

    // Prioritize JD Image from Approval Sheet, then fallback to Master Sheet, then fuzzy match
    const rawImage = jdRow['JD Image'] || jdRow['image'] || jdApprovalImage || masterImage || null;
    const finalImage = rawImage ? String(rawImage).trim() : null;

    const getValidUrl = (val) => {
        const s = String(val || '').trim();
        return (s && s !== 'undefined' && s !== 'null' && (s.startsWith('http') || s.includes('drive.google.com'))) ? s : null;
    };

    const acceptKey = Object.keys(jdRow).find(k =>
        k.toLowerCase().includes('status=accepted') ||
        k.toLowerCase().includes('accept') ||
        k.toLowerCase().includes('approve') ||
        k.toLowerCase().includes('jd accepted')
    );
    const rejectKey = Object.keys(jdRow).find(k =>
        k.toLowerCase().includes('status=rejected') ||
        k.toLowerCase().includes('reject') ||
        k.toLowerCase().includes('decline') ||
        k.toLowerCase().includes('jd rejected')
    );
    const valAccept = Object.values(jdRow).find(v => v && String(v).includes('status=Accepted') && String(v) !== 'undefined');
    const valReject = Object.values(jdRow).find(v => v && String(v).includes('status=Rejected') && String(v) !== 'undefined');

    const finalAcceptUrl = getValidUrl(jdRow['JD Accepted']) || getValidUrl(jdRow['Accepted']) || (acceptKey ? getValidUrl(jdRow[acceptKey]) : null) || getValidUrl(valAccept);
    const finalRejectUrl = getValidUrl(jdRow['JD Rejected']) || getValidUrl(jdRow['Rejected']) || (rejectKey ? getValidUrl(jdRow[rejectKey]) : null) || getValidUrl(valReject);

    // Get the doc URL, trimming any newlines/whitespace from the sheet value
    const rawDocUrl = jdRow[docKey] || jdRow['JD DOC'] || jdRow['JD Doc'] || jdRow['JD Text'] || null;
    const finalDocUrl = rawDocUrl ? String(rawDocUrl).trim() : null;

    const mapped = {
        ...jdRow,
        'Log ID': logId,
        'Role_Name': jdRow[roleKey] || jdRow['Role Name'] || jdRow['Role'] || 'Untitled Role',
        'JD_Poster': finalImage,
        'Text': finalDocUrl,
        'Description': jdRow[descKey] || jdRow['Description'] || jdRow['JD Description'] || null,
        'Accept_URL': finalAcceptUrl,
        'Reject_URL': finalRejectUrl,

        // Merge Intake Data if provided
        'Salary': reqIntakeRow ? (reqIntakeRow['Salary'] || 'Not specified') : 'Not specified',
        'Experience': reqIntakeRow ? (reqIntakeRow['Experience'] || 'Not specified') : 'Not specified',
        'Location': reqIntakeRow ? (reqIntakeRow['Location'] || 'Not specified') : 'Not specified',
        'Urgency': reqIntakeRow ? (reqIntakeRow['Urgency'] || 'Normal') : 'Normal',
        'Category': reqIntakeRow ? (reqIntakeRow['Category'] || reqIntakeRow['category'] || 'New JD') : 'New JD',
        'Education': reqIntakeRow ? (reqIntakeRow['Education'] || '') : '',
        'Department': reqIntakeRow ? (reqIntakeRow['Department'] || '') : '',
        'Job_Description': reqIntakeRow ? (reqIntakeRow['Job Description'] || '') : '',
        'Key_Responsibilities': reqIntakeRow ? (reqIntakeRow['Key Responsibilities'] || '') : '',
        'Total': reqIntakeRow ? (reqIntakeRow['Total Requirement'] || reqIntakeRow['Total No of Requirment'] || 1) : 1,

        originalData: jdRow
    };

    console.log(`[mapJDApprovalData] LogID=${logId}`, {
        Role: mapped.Role_Name,
        Image: mapped.JD_Poster ? mapped.JD_Poster.substring(0, 60) + '...' : 'NONE',
        Doc: mapped.Text ? mapped.Text.substring(0, 60) + '...' : 'NONE',
        AcceptURL: mapped.Accept_URL ? 'YES' : 'NONE',
        RejectURL: mapped.Reject_URL ? 'YES' : 'NONE',
    });

    return mapped;
};

export const NotificationProvider = ({ children }) => {
    const [notificationData, setNotificationData] = useState(null);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [waitingForLogId, setWaitingForLogId] = useState(null);
    const [pollingStartTime, setPollingStartTime] = useState(null);
    const [processedLogIds, setProcessedLogIds] = useState(() => {
        try {
            const saved = localStorage.getItem('processedNotificationLogIds');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Clean up expired entries (older than 24 hours)
                const now = Date.now();
                const cleaned = Object.entries(parsed).filter(([, ts]) => now - ts < 86400000);
                return new Map(cleaned);
            }
        } catch (e) { /* ignore */ }
        return new Map();
    });

    // Persistent Notification Fetching
    const refreshNotifications = async (isPolling = false) => {
        try {

            const forceOpt = isPolling ? { force: true } : {};
            const [jdApprovalData, jdMasterData, reqIntakeData] = await Promise.all([
                fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.JD_APPROVAL, forceOpt),
                fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.JD, forceOpt),
                fetchSheetData(GOOGLE_SHEETS_CONFIG.HR_WORKFLOW_ID, GOOGLE_SHEETS_CONFIG.GIDS.REQUIREMENT_INTAKE, forceOpt)
            ]);

            if (!jdApprovalData || jdApprovalData.length === 0) {
                setNotificationData(null);
                setHasNewNotification(false);
                setNotificationCount(0);
                return false;
            }

            let pendingList = [];
            let count = 0;

            const masterImageMap = new Map();
            jdMasterData.forEach(row => {
                const logId = String(row['Log ID'] || '').trim();
                if (logId) {
                    const imageKey = Object.keys(row).find(k =>
                        k.trim().toLowerCase().includes('image') ||
                        k.trim().toLowerCase().includes('poster')
                    );
                    if (imageKey && row[imageKey]) {
                        masterImageMap.set(logId, row[imageKey]);
                    }
                }
            });

            const approvedLogIds = new Set(masterImageMap.keys());
            const jdMap = new Map();
            jdApprovalData.forEach(row => {
                const logId = String(row['Log ID'] || row['log_id'] || '').trim();
                if (logId) {
                    jdMap.set(logId, row);
                }
            });

            for (const req of reqIntakeData) {
                const logId = String(req['Log ID'] || req['log_id'] || '').trim();
                const status = req['Status'] || req['status'] || req['Current Status of Requirement'] || '';

                if (!logId) continue;
                const isPendingStatus = !status || String(status).trim() === '' || String(status).trim().toLowerCase() === 'open';
                if (!isPendingStatus) continue;
                if (approvedLogIds.has(logId)) continue;
                // Skip locally processed items that are still pending on the backend (24 hour expiry, persisted to localStorage)
                const processedAt = processedLogIds.get(logId);
                if (processedAt && (Date.now() - processedAt < 86400000)) continue; // 24 hour expiry

                const jdRow = jdMap.get(logId);
                if (jdRow) {
                    const notificationItem = {
                        ...mapJDApprovalData(jdRow, logId, masterImageMap.get(logId) || null, req),
                        onRetry: () => { setWaitingForLogId(logId); setPollingStartTime(Date.now()); }
                    };
                    pendingList.push(notificationItem);
                    count++;
                }
            }

            if (waitingForLogId) {
                // Find the specific item we are waiting for
                const newItem = pendingList.find(item => item['Log ID'] === waitingForLogId);
                const currentItem = notificationData?.find(item => item['Log ID'] === waitingForLogId);

                let isTrulyNew = false;
                if (newItem && currentItem) {
                    const isContentChanged =
                        newItem['JD_Poster'] !== currentItem['JD_Poster'] ||
                        newItem['Text'] !== currentItem['Text'] ||
                        newItem['Description'] !== currentItem['Description'] ||
                        newItem['Role_Name'] !== currentItem['Role_Name'];
                    isTrulyNew = isContentChanged;
                } else if (newItem && !currentItem) {
                    isTrulyNew = true;
                }

                const hasTimedOut = pollingStartTime && (Date.now() - pollingStartTime > 90000); // 1:30 minute timeout

                if (isTrulyNew || hasTimedOut) {
                    setNotificationData(pendingList);
                    setHasNewNotification(true);
                    setNotificationCount(count);
                    setWaitingForLogId(null);
                    setPollingStartTime(null);
                    setShowModal(true);
                    if (hasTimedOut && !isTrulyNew) {
                        console.warn('Polling for regenerated JD timed out after 1:30 minute.');
                    }
                    return true;
                }
                return false;
            }

            if (pendingList.length > 0) {
                setNotificationData(pendingList);
                setHasNewNotification(true);
                setNotificationCount(count);
            } else {
                if (!waitingForLogId && !showModal) {
                    setNotificationData(null);
                    setHasNewNotification(false);
                    setNotificationCount(0);
                }
            }
            return pendingList.length > 0;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error refreshing notifications:', error);
            }
            return false;
        }
    };

    // Periodic Background Polling (Every 30 seconds)
    useEffect(() => {
        const pollerId = setInterval(() => {
            if (!waitingForLogId) {
                refreshNotifications(true);
            }
        }, 30000);

        return () => clearInterval(pollerId);
    }, [waitingForLogId]);

    // Initial Fetch
    useEffect(() => {
        refreshNotifications();
    }, []);

    // Effect for Polling when waitingForLogId is true
    useEffect(() => {
        let intervalId;
        if (waitingForLogId) {
            intervalId = setInterval(async () => {
                await refreshNotifications(true);
            }, 10000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [waitingForLogId]);

    const triggerNotification = (data) => {
        if (data) {
            const items = Array.isArray(data) ? data : [data];
            setNotificationData(items);
            setNotificationCount(items.length); // SYNC COUNT
            setHasNewNotification(true);
            setShowModal(true);
        }
    };

    const openNotification = () => {
        if (hasNewNotification || notificationData) {
            setShowModal(true);
        }
    };

    const closeNotification = () => {
        setShowModal(false);
        // Do NOT stop waiting if user manually closes. 
        // We want to keep polling so the notification pops up when ready.
    };

    const clearNotification = () => {
        setShowModal(false);
        setHasNewNotification(false);
        setNotificationData(null);
        setWaitingForLogId(null);
        setPollingStartTime(null);
    };

    const markAsProcessed = (logId) => {
        setProcessedLogIds(prev => {
            const next = new Map(prev);
            next.set(logId, Date.now());
            // Persist to localStorage
            try {
                const obj = Object.fromEntries(next);
                localStorage.setItem('processedNotificationLogIds', JSON.stringify(obj));
            } catch (e) { /* ignore */ }
            return next;
        });

        // If the current notification matches this processed ID, move it out immediately
        if (notificationData) {
            const updatedData = notificationData.filter(item => item['Log ID'] !== logId);
            if (updatedData.length > 0) {
                setNotificationData(updatedData);
                setNotificationCount(updatedData.length);
            } else {
                // LAST ITEM PROCESSED: 
                // Don't clearNotification() immediately if modal is open,
                // let the modal's internal close handle it after the action delay
                setHasNewNotification(false);
                setNotificationCount(0);
                if (!showModal) {
                    clearNotification();
                }
            }
        }
    };

    const clearProcessedLogId = (logId) => {
        setProcessedLogIds(prev => {
            const next = new Map(prev);
            next.delete(logId);
            try {
                const obj = Object.fromEntries(next);
                localStorage.setItem('processedNotificationLogIds', JSON.stringify(obj));
            } catch (e) { /* ignore */ }
            return next;
        });
    };

    return (
        <NotificationContext.Provider value={{
            notificationData,
            hasNewNotification,
            notificationCount,
            showModal,
            waitingForLogId,
            setWaitingForLogId,
            setPollingStartTime,
            refreshNotifications,
            triggerNotification,
            openNotification,
            closeNotification,
            clearNotification,
            markAsProcessed,
            clearProcessedLogId
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
