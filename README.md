# HR Dashboard

A React-based HR Dashboard for Pucho.ai.

## Features
- **Requirement Intake**: Real-time data from Google Sheets.
- **JD (Job Description)**: View JDs and images.
- **Log**: Activity tracking.
- **Shortlist Candidate**: Candidate management.
- **Interview Feedback**: Embedded feedback form.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Configuration (IMPORTANT)

The application fetches data from Google Sheets. You must configure the **Sheet GIDs** (Tab IDs) in `src/config.js` for the data to load correctly.

1.  Open `src/config.js`.
2.  Update the `GIDS` object:
    ```javascript
    export const GOOGLE_SHEETS_CONFIG = {
      // ...
      GIDS: {
        REQUIREMENT_INTAKE: '0', // Usually 0 for the first tab
        JD: 'YOUR_JD_GID_HERE', // Look at the URL of the sheet: gid=12345
        LOG: 'YOUR_LOG_GID_HERE',
        SHORTLIST: 'YOUR_SHORTLIST_GID_HERE'
      }
    };
    ```
    *   **How to find GID**: Open the Google Sheet in your browser. Click on the specific tab (e.g., JD). Look at the URL in the address bar. It will look like `.../edit#gid=12345`. The number after `gid=` is the ID you need.

## Data Sources
- **HR Workflow Sheet**: `https://docs.google.com/spreadsheets/d/1ENRs3BQ-PcJNea3OUorSszA7eml0yAgMNNMe-CN0WCE`
- **Shortlist Candidate Sheet**: `https://docs.google.com/spreadsheets/d/16pUY0EgcxcKe4qkASMjdR_5SN4qKOD4GUfm9iKn4HtY`
- **Interview Feedback Form**: `https://studio.pucho.ai/forms/JbhPfkSmWvnQUtSNC1n5f?useDraft=true`
