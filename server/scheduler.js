import express from 'express';
import { google } from 'googleapis';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1jVSZ_LnNuGspcVcIdWNy_IPhOlgRzuxROAR38UZ860g';
const SHEET_RANGE = 'Log!A:Z';

// Webhook URL (same as frontend)
const AI_CALL_WEBHOOK = 'https://studio.pucho.ai/api/v1/webhooks/flcmow4Rl8mvhNQE62ESr/sync';

// Persistent storage file for triggered calls
const TRIGGERED_FILE = path.join(process.cwd(), 'triggered_calls.json');

// Load triggered calls from file
const loadTriggeredCalls = () => {
    try {
        if (fs.existsSync(TRIGGERED_FILE)) {
            const data = fs.readFileSync(TRIGGERED_FILE, 'utf8');
            return new Map(Object.entries(JSON.parse(data)));
        }
    } catch (error) {
        console.error('[STORAGE] Error loading triggered calls:', error.message);
    }
    return new Map();
};

// Save triggered calls to file
const saveTriggeredCalls = (map) => {
    try {
        const obj = Object.fromEntries(map);
        fs.writeFileSync(TRIGGERED_FILE, JSON.stringify(obj, null, 2));
    } catch (error) {
        console.error('[STORAGE] Error saving triggered calls:', error.message);
    }
};

// Track triggered calls to prevent duplicates
const triggeredCalls = loadTriggeredCalls();

// Initialize Google Sheets auth
const getGoogleSheetsClient = async () => {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
        throw new Error('Google credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY env vars.');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    return google.sheets({ version: 'v4', auth });
};

// Get current time in IST
const getISTTime = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    return {
        day: String(istNow.getUTCDate()).padStart(2, '0'),
        month: String(istNow.getUTCMonth() + 1).padStart(2, '0'),
        year: istNow.getUTCFullYear(),
        hour: istNow.getUTCHours(),
        minute: istNow.getUTCMinutes(),
        date: `${String(istNow.getUTCDate()).padStart(2, '0')}/${String(istNow.getUTCMonth() + 1).padStart(2, '0')}/${istNow.getUTCFullYear()}`,
        time: `${String(istNow.getUTCHours()).padStart(2, '0')}:${String(istNow.getUTCMinutes()).padStart(2, '0')}`
    };
};

// Parse time string to hours and minutes
const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const ampm = match[3];
    
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    return { hour, minute };
};

// Trigger AI Call webhook (matching original frontend payload exactly)
const triggerAICall = async (candidate) => {
    // Match the exact payload structure from the original Interviews.jsx
    const payload = {
        "Name of the Candidate": candidate.name || '',
        "Email": candidate.email || '',
        "Role": candidate.role || '',
        "Position": candidate.position || '',
        "Department": candidate.department || '',
        "Log ID": candidate.logId || '',
        "Row ID": candidate.rowId || '',
        "row_id": candidate.rowId || '',
        "Contact Number": candidate.contact || '',
        "CV": candidate.cv || '',
        "Summary": candidate.summary || '',
        "Score": candidate.score || '',
        "Status": candidate.status || '',
        "Interview date": candidate.interviewDate || '',
        "Interview type": candidate.interviewType || '',
        "Meeting link": candidate.meetingLink || '',
        "Location": candidate.location || '',
        "log_id": candidate.logId || '',
        "location": candidate.location || '',
        "department": candidate.department || '',
        "position": candidate.position || ''
    };

    console.log(`[AI CALL] Triggering for ${candidate.name}`);
    console.log(`[AI CALL] Payload:`, JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(AI_CALL_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.text();
        console.log(`[AI CALL] Response status: ${response.status}`);
        console.log(`[AI CALL] Response: ${result}`);
        
        return { success: response.ok, result };
    } catch (error) {
        console.error(`[AI CALL] Error:`, error.message);
        return { success: false, error: error.message };
    }
};

// Main check function
const checkAndTrigger = async () => {
    try {
        const ist = getISTTime();
        console.log(`\n[SCHEDULER] ====== CHECK START at ${ist.date} ${ist.time} ======`);

        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: SHEET_RANGE
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('[SCHEDULER] No data found in sheet');
            return;
        }

        // Get headers (first row)
        const headers = rows[0].map(h => h?.trim() || '');
        const nameIdx = headers.indexOf('Name of the Candidate');
        const emailIdx = headers.indexOf('Email');
        const roleIdx = headers.indexOf('Role');
        const logIdIdx = headers.indexOf('Log ID');
        const rowIdIdx = headers.indexOf('Row ID');
        const contactIdx = headers.indexOf('Contact Number');
        const cvIdx = headers.indexOf('CV');
        const summaryIdx = headers.indexOf('Summary');
        const scoreIdx = headers.indexOf('Score');
        const statusIdx = headers.indexOf('Status');
        const interviewDateIdx = headers.indexOf('Interview date');
        const interviewTypeIdx = headers.indexOf('Interview type');
        const meetingLinkIdx = headers.indexOf('Meeting link');
        const locationIdx = headers.indexOf('Location');
        const departmentIdx = headers.indexOf('Department');
        const positionIdx = headers.indexOf('Position');

        let triggeredCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const interviewType = (row[interviewTypeIdx] || '').toLowerCase().trim();
            const isAiCall = interviewType.includes('ai') && 
                           (interviewType.includes('call') || interviewType.includes('voice') || interviewType.includes('agent'));
            
            if (!isAiCall) continue;

            const interviewDateTime = (row[interviewDateIdx] || '').trim();
            if (!interviewDateTime) continue;

            // Parse date and time from format: "30/03/2026, 11:14 am"
            const parts = interviewDateTime.split(',').map(s => s.trim());
            const datePart = parts[0] || '';
            const timePart = parts[1] || '';

            // Check date match (DD/MM/YYYY format)
            if (datePart !== ist.date) continue;

            // Parse time
            const parsedTime = parseTime(timePart);
            if (!parsedTime) {
                console.log(`[SCHEDULER] Could not parse time: ${timePart}`);
                continue;
            }

            // Check time match (within current minute)
            if (parsedTime.hour !== ist.hour || parsedTime.minute !== ist.minute) continue;

            // Check if already triggered (use logId + date as unique key)
            const callKey = `${row[logIdIdx] || ''}_${datePart}`;
            if (triggeredCalls.has(callKey)) {
                console.log(`[SCHEDULER] Already triggered: ${callKey}`);
                continue;
            }

            console.log(`[SCHEDULER] MATCH FOUND: ${row[nameIdx]} at ${timePart}`);

            const candidate = {
                name: row[nameIdx] || '',
                email: row[emailIdx] || '',
                role: row[roleIdx] || '',
                logId: row[logIdIdx] || '',
                rowId: row[rowIdIdx] || '',
                contact: row[contactIdx] || '',
                cv: row[cvIdx] || '',
                summary: row[summaryIdx] || '',
                score: row[scoreIdx] || '',
                status: row[statusIdx] || '',
                interviewDate: interviewDateTime,
                interviewType: row[interviewTypeIdx] || '',
                meetingLink: row[meetingLinkIdx] || '',
                location: row[locationIdx] || '',
                department: row[departmentIdx] || '',
                position: row[positionIdx] || ''
            };

            const result = await triggerAICall(candidate);
            
            if (result.success) {
                triggeredCalls.set(callKey, new Date().toISOString());
                saveTriggeredCalls(triggeredCalls);
                triggeredCount++;
                console.log(`[SCHEDULER] Successfully triggered for ${candidate.name}`);
            } else {
                console.error(`[SCHEDULER] Failed to trigger for ${candidate.name}`);
            }
        }

        console.log(`[SCHEDULER] ====== CHECK END - Triggered: ${triggeredCount} ======`);

    } catch (error) {
        console.error('[SCHEDULER] Error:', error.message);
        console.error('[SCHEDULER] Stack:', error.stack);
    }
};

// Schedule to run every minute at :00 seconds
cron.schedule('* * * * *', () => {
    checkAndTrigger();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        triggeredCallsCount: triggeredCalls.size,
        uptime: process.uptime()
    });
});

// Manual trigger endpoint (for testing)
app.post('/trigger-check', async (req, res) => {
    try {
        await checkAndTrigger();
        res.json({ status: 'check completed', success: true });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Clear triggered calls (for testing)
app.post('/clear-triggered', (req, res) => {
    triggeredCalls.clear();
    saveTriggeredCalls(triggeredCalls);
    res.json({ status: 'cleared', success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] AI Call Scheduler running on port ${PORT}`);
    console.log(`[SERVER] Sheet ID: ${SHEET_ID}`);
    console.log(`[SERVER] Checking every minute for scheduled AI calls`);
    console.log(`[SERVER] Loaded ${triggeredCalls.size} previously triggered calls`);
    
    // Run once on startup
    setTimeout(() => {
        checkAndTrigger();
    }, 5000); // Wait 5 seconds for server to be ready
});
