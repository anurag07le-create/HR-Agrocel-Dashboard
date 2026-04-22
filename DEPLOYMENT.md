# Deployment Guide for Dokploy

## Overview
This HR Dashboard consists of two parts:
1. **Frontend** - React SPA (can be deployed on any static host or Dokploy)
2. **Backend Scheduler** - Node.js server for AI Call automation (deploy on Dokploy)

---

## Part 1: Backend Scheduler (Dokploy)

### Prerequisites
- Google Service Account with Sheets read access
- Google Sheet ID
- Dokploy account

### Environment Variables
Set these in Dokploy:

```
GOOGLE_SHEET_ID=1jVSZ_LnNuGspcVcIdWNy_IPhOlgRzuxROAR38UZ860g
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n
PORT=3001
```

### Steps
1. Push your code to GitHub/GitLab
2. In Dokploy, create a new project
3. Select the repository
4. Set the build context to `/server`
5. Add environment variables
6. Deploy

### Endpoints
- `GET /health` - Health check (returns status, uptime, triggered calls count)
- `POST /trigger-check` - Manually trigger a check
- `POST /clear-triggered` - Clear triggered calls history

---

## Part 2: Frontend (Netlify/Vercel/Dokploy)

### Build Settings
```
Build command: npm run build
Output directory: dist
Node version: 18+
```

### Environment Variables
None required (uses hardcoded config in `src/config.js`)

---

## Google Sheets Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Share your Google Sheet with the service account email
6. Copy `client_email` and `private_key` to Dokploy env vars

---

## Verification

After deployment:
1. Check backend health: `https://your-backend-url/health`
2. Check logs for successful sheet reads
3. Verify AI calls trigger at scheduled times

---

## File Structure
```
/
├── server/
│   ├── scheduler.js      # Main scheduler
│   ├── package.json      # Dependencies
│   ├── Dockerfile        # Docker config
│   └── .env.example      # Env template
├── src/                  # Frontend React app
│   ├── components/
│   ├── context/
│   ├── config.js         # Webhook URLs
│   └── ...
└── package.json          # Frontend dependencies
```

---

## Webhook Payload (AI Call)
The scheduler sends this payload to `https://studio.pucho.ai/api/v1/webhooks/flcmow4Rl8mvhNQE62ESr/sync`:

```json
{
    "Name of the Candidate": "John Doe",
    "Email": "john@example.com",
    "Role": "Software Engineer",
    "Position": "Senior Developer",
    "Department": "Engineering",
    "Log ID": "TA800VXFGD",
    "Row ID": "row_123",
    "row_id": "row_123",
    "Contact Number": "8490849441",
    "CV": "https://...",
    "Summary": "...",
    "Score": "8",
    "Status": "Shortlisted",
    "Interview date": "30/03/2026, 11:14 am",
    "Interview type": "AI call",
    "Meeting link": "",
    "Location": "Remote",
    "log_id": "TA800VXFGD",
    "location": "Remote",
    "department": "Engineering",
    "position": "Senior Developer"
}
```
