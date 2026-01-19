export const GOOGLE_SHEETS_CONFIG = {
    HR_WORKFLOW_ID: '1ENRs3BQ-PcJNea3OUorSszA7eml0yAgMNNMe-CN0WCE',
    SHORTLIST_CANDIDATE_ID: '16pUY0EgcxcKe4qkASMjdR_5SN4qKOD4GUfm9iKn4HtY',

    // GIDs (Sheet IDs)
    GIDS: {
        REQUIREMENT_INTAKE: '0',
        JD: '28969301',
        JD_APPROVAL: '1733213639',
        LOG: '918448908',
        SHORTLIST: '2129720095'
    }
};

export const WEBHOOK_URLS = {
    INTERVIEW_FEEDBACK: 'https://studio.pucho.ai/api/v1/webhooks/JbhPfkSmWvnQUtSNC1n5f',
    REQUIREMENT_INTAKE: 'https://studio.pucho.ai/api/v1/webhooks/dEcIGDsPpJO6MzV1aFMeX/sync',
    NOTIFICATIONS: 'https://studio.pucho.ai/api/v1/webhooks/dEcIGDsPpJO6MzV1aFMeX/sync'
};

export const CALENDLY_CONFIG = {
    TOKEN: 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY0NjU1ODY3LCJqdGkiOiI4YWQyNjY5Ny1iMWE5LTQ4YWYtYWE1ZS1hODRlODgxNzg1MzgiLCJ1c2VyX3V1aWQiOiJjOTI4YWZkYi01NjE3LTRkMjYtYjNlYS05ZWY0YWFlMDE2MzYifQ._LzuGcQCTfWXPgE4-WZWfOTFep1qLVS100yao0A1r4pTE2a1nH7GvkqwRihtRuFw5XGm0kYxquXBtK4zKFSIKg'
};

export const LINKEDIN_CONFIG = {
    CLIENT_ID: '86qq2cp5d73qvm',
    CLIENT_SECRET: 'WPL_AP1.Q0CotD8gCNWCtVGw.hC6nDw==',
    REDIRECT_URI: typeof window !== 'undefined' ? `${window.location.origin}/linkedin/callback` : 'http://localhost:5173/linkedin/callback',
    SCOPE: 'openid profile w_member_social email'
};
