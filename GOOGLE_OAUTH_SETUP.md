# Google OAuth Setup Guide

## Prerequisites
1. Google Cloud Console account
2. A project in Google Cloud Console

## Setup Steps

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - Choose **External** (for testing) or **Internal** (for Google Workspace)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if using External type
6. Create OAuth client:
   - Application type: **Web application**
   - Name: Blood Donation System
   - **Authorized JavaScript origins** (for use with requests from a browser):
     - `http://localhost:5173` (development - your frontend URL)
     - `http://localhost:5000` (development - your backend URL, if needed)
     - `https://yourdomain.com` (production - your frontend domain)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)

### 2. Get Your Credentials

After creating, you'll get:
- **Client ID** (e.g., `123456789-abcdefg.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abcdefghijklmnop`)

### 3. Configure Environment Variables

Add these to your `.env` file in the backend directory:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 4. Install Dependencies (if needed)

The current implementation uses native `fetch` API, so no additional packages are required. However, for production, you might want to use `google-auth-library`:

```bash
cd backend
npm install google-auth-library
```

### 5. Test the Integration

1. Start your backend server
2. Start your frontend server
3. Go to the login page
4. Select a role
5. Click "Continue with Google"
6. You should be redirected to Google's consent screen
7. After authorization, you'll be redirected back and logged in

## Notes

- The OAuth flow creates new users automatically if they don't exist
- Users created via OAuth won't have a password (password field is null)
- You may want to prompt users for additional required fields after OAuth login
- For production, use HTTPS and secure your redirect URIs

## Troubleshooting

- **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console matches exactly with `GOOGLE_REDIRECT_URI` in your `.env`
- **"Invalid Origin: URI must not be empty"**: Make sure you've added at least one entry in "Authorized JavaScript origins" (e.g., `http://localhost:5173`)
- **"invalid_client"**: Check that your Client ID and Secret are correct
- **"access_denied"**: User cancelled the authorization or consent screen wasn't configured properly
- **"origin_mismatch"**: Ensure the JavaScript origin (where the OAuth request starts) is listed in "Authorized JavaScript origins"
