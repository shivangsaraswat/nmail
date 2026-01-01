# Setting Up Credentials

## Part 1: Google OAuth (for Login)

1.  Go to **[Google Cloud Console](https://console.cloud.google.com/)** and create a **New Project**.
2.  **OAuth Consent Screen**:
    *   Go to **APIs & Services > OAuth consent screen**.
    *   Select **External**. Fill in App Name and Email. Save.
3.  **Create Credentials**:
    *   Go to **APIs & Services > Credentials**.
    *   Click **CREATE CREDENTIALS** > **OAuth client ID**.
    *   **Type**: Web application.
    *   **Redirect URI**: `http://localhost:3000/api/auth/callback/google`
    *   Click **Create**.
4.  **Result**: Copy **Client ID** and **Client Secret** to your `.env` file.

## Part 2: Gmail SMTP (for Sending)

1.  Go to **[Google Account Security](https://myaccount.google.com/security)**.
2.  Enable **2-Step Verification**.
3.  Search for **"App passwords"** in the account search bar.
4.  Create a new App Password named "Nmail".
5.  **Result**: Copy the 16-character password to `SMTP_PASS` in your `.env` file. Use your Gmail address for `SMTP_USER`.

## Part 3: Environment File

Rename your `env-example` to `.env.local` and ensure all fields are filled.
```bash
mv env-example .env.local
```
