export const GOOGLE_SHEETS_CONFIG = {
    HR_WORKFLOW_ID: '1jVSZ_LnNuGspcVcIdWNy_IPhOlgRzuxROAR38UZ860g',
    SHORTLIST_CANDIDATE_ID: '1jVSZ_LnNuGspcVcIdWNy_IPhOlgRzuxROAR38UZ860g',

    // GIDs (Sheet IDs)
    GIDS: {
        REQUIREMENT_INTAKE: '0',
        JD: '2120917162',          // Final JD
        JD_APPROVAL: '442882796', // JD Approval (separate Tab)
        LOG: '788979327',         // Candidate Log
        SHORTLIST: '730726534',   // Legacy GID, verify if needed
        MESSAGE_APPROVAL: '1034386471' // Message Generator
    }
};

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isDev ? '/studio-api' : 'https://studio.pucho.ai';

export const WEBHOOK_URLS = {
    INTERVIEW_FEEDBACK: `${API_BASE}/api/v1/webhooks/yZQpIgAHEmu8oFzl8EThv`,
    REQUIREMENT_INTAKE: `${API_BASE}/api/v1/webhooks/oUudFZHwpYryW5Sp1Njwj`,
    JD_UPLOAD: `${API_BASE}/api/v1/webhooks/oUudFZHwpYryW5Sp1Njwj`,
    JD_DECLINED: `${API_BASE}/api/v1/webhooks/oUudFZHwpYryW5Sp1Njwj`,
    // JD_APPROVED: Removed — JD approval uses dynamic URLs from the JD Approval sheet, not a static webhook.
    NOTIFICATIONS: `${API_BASE}/api/v1/webhooks/dEcIGDsPpJO6MzV1aFMeX/sync`,
    COMMUNICATION: `${API_BASE}/api/v1/webhooks/822lgy0OGlooPDYVT5zpB/sync`,
    STATUS_ACTION_WEBHOOK: `${API_BASE}/api/v1/webhooks/Byk1W0uE4IzSsuVEsA4H8/sync`,
    JD_STATUS_UPDATE: `${API_BASE}/api/v1/webhooks/V4nqnS3Lft5bWJ9fYj42W`,
    LOG_STATUS_UPDATE: `${API_BASE}/api/v1/webhooks/Byk1W0uE4IzSsuVEsA4H8/sync`,
    AI_MESSAGE_GEN: `${API_BASE}/api/v1/webhooks/822lgy0OGlooPDYVT5zpB/sync`,
    SHORTLIST_STATUS: `${API_BASE}/api/v1/webhooks/Byk1W0uE4IzSsuVEsA4H8/sync`,
    AI_CALL: `${API_BASE}/api/v1/webhooks/flcmow4Rl8mvhNQE62ESr/sync`,
    FINAL_JD_PUBLISH: `${API_BASE}/api/v1/webhooks/BBJ7iomdqpYT1yf9kfZev`
};

export const CALENDLY_CONFIG = {
    TOKEN: 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY5MDg0NjIzLCJqdGkiOiI3MmY3NDM4OC1iNWY4LTQ5NzItYjJkNS05MTAzNTI2NTkxNDAiLCJ1c2VyX3V1aWQiOiJmMTYyNTk1NC0wNDA2LTRhMWYtOTVlNC01NzJmOWU5YWU5OWUifQ.krFt-4HYSugL1XSIXEi-FbxiA-RKN7Q3Qzbhws835Cn8hZCyl73lE4hA95teVnbplox44P9T5ySRGHU-cRjZJA'
};

export const LINKEDIN_CONFIG = {
    CLIENT_ID: '86qq2cp5d73qvm',
    CLIENT_SECRET: 'WPL_AP1.Q0CotD8gCNWCtVGw.hC6nDw==',
    REDIRECT_URI: typeof window !== 'undefined' ? `${window.location.origin}/linkedin/callback` : 'http://localhost:5173/linkedin/callback',
    SCOPE: 'openid profile w_member_social email'
};

export const SUPABASE_CONFIG = {
    URL: 'https://nmwuzchyhcwdgckwwpeg.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5td3V6Y2h5aGN3ZGdja3d3cGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTc2MTMsImV4cCI6MjA4NDY5MzYxM30.pj7sgP4ClheUHHUd1PMd9ZLCSPZZzLn7JoHJ5dp01sU',
    SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5td3V6Y2h5aGN3ZGdja3d3cGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTExNzYxMywiZXhwIjoyMDg0NjkzNjEzfQ.yAroF_EFf9o7PD12I1yReD_BFhAb6ydpuAj8cPCIPiQ'
};
