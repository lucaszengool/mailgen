# OAuth Setup Guide for Email Providers

## Issue
When clicking "Connect with Gmail/Outlook/Yahoo", you get an error: `invalid_client - The OAuth client was not found`

## Root Cause
The application needs OAuth credentials (Client ID and Client Secret) from Google, Microsoft, and Yahoo to access user email accounts.

## Setup Instructions

### 1. Gmail OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `MailGen Email Marketing`
4. Click "Create"

#### Step 2: Enable Gmail API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Enable"

#### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen first if prompted:
   - User Type: External
   - App name: `MailGen`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `gmail.send` and `gmail.readonly`
   - Test users: Add your email
4. Application type: **Web application**
5. Name: `MailGen Web Client`
6. Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/gmail/callback
   https://mailgen-production.up.railway.app/api/auth/gmail/callback
   https://honest-hope-production.up.railway.app/api/auth/gmail/callback
   ```
7. Click "Create"
8. **Copy the Client ID and Client Secret**

### 2. Outlook/Microsoft OAuth Setup

#### Step 1: Register App
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: `MailGen Email Marketing`
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
6. Redirect URI: Web
   ```
   http://localhost:5000/api/auth/outlook/callback
   https://mailgen-production.up.railway.app/api/auth/outlook/callback
   https://honest-hope-production.up.railway.app/api/auth/outlook/callback
   ```
7. Click "Register"

#### Step 2: Configure API Permissions
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph"
3. Select "Delegated permissions"
4. Add:
   - `Mail.Send`
   - `Mail.Read`
   - `offline_access`
5. Click "Grant admin consent"

#### Step 3: Create Client Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: `MailGen Secret`
4. Expires: 24 months
5. Click "Add"
6. **Copy the Value (this is your Client Secret)**

### 3. Yahoo OAuth Setup

#### Step 1: Create Yahoo App
1. Go to [Yahoo Developer Network](https://developer.yahoo.com/apps/)
2. Click "Create an App"
3. Application Name: `MailGen`
4. Application Type: `Web Application`
5. Redirect URI:
   ```
   http://localhost:5000/api/auth/yahoo/callback
   https://mailgen-production.up.railway.app/api/auth/yahoo/callback
   https://honest-hope-production.up.railway.app/api/auth/yahoo/callback
   ```
6. API Permissions: Select `Mail`

#### Step 2: Get Credentials
1. After creating, you'll see:
   - **Client ID (Consumer Key)**
   - **Client Secret (Consumer Secret)**
2. Copy both values

## Configuration

### Local Development (.env file)
Create/update `.env` file in `/Users/James/Desktop/agent/server/`:

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Outlook OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Yahoo OAuth
YAHOO_CLIENT_ID=your_yahoo_client_id_here
YAHOO_CLIENT_SECRET=your_yahoo_client_secret_here
```

### Railway Production

1. Go to Railway Dashboard
2. Select your project
3. Go to each service (honest-hope, mailgen)
4. Click "Variables" tab
5. Add these variables:

```
GOOGLE_CLIENT_ID = your_google_client_id_here
GOOGLE_CLIENT_SECRET = your_google_client_secret_here
MICROSOFT_CLIENT_ID = your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET = your_microsoft_client_secret_here
YAHOO_CLIENT_ID = your_yahoo_client_id_here
YAHOO_CLIENT_SECRET = your_yahoo_client_secret_here
```

6. Click "Redeploy" for changes to take effect

## Testing

1. Start your server locally or wait for Railway deployment
2. Go to SMTP Setup page
3. Click "Connect with Gmail" (or Outlook/Yahoo)
4. You should be redirected to the provider's login page
5. Sign in and grant permissions
6. You'll be redirected back with OAuth tokens

## What Happens After Connection

1. User clicks "Connect with Gmail"
2. App redirects to Google OAuth consent page
3. User signs in and grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access token & refresh token
6. Tokens are stored and used to:
   - Send emails via SMTP
   - Track email opens
   - Track email replies
   - Monitor email analytics

## Security Notes

- Never commit `.env` files to git
- Tokens should be encrypted before storage
- Refresh tokens periodically
- Use HTTPS in production
- Store tokens in a secure database, not localStorage

## Troubleshooting

### "invalid_client" Error
- Environment variables not set
- Check Railway deployment logs
- Verify credentials are correct

### "redirect_uri_mismatch" Error
- Check that redirect URIs match exactly in OAuth settings
- Include both localhost and production URLs

### "access_denied" Error
- User declined permissions
- Check OAuth scopes match what's configured

## Alternative: Skip OAuth for Now

If you want to skip OAuth setup temporarily, users can still use:
1. **Manual SMTP Setup** - Enter credentials manually
2. **App-Specific Passwords** - Use Gmail/Outlook app passwords
   - Still requires 2FA but no OAuth app setup needed
   - Good for testing

Users would enter:
- Email: their.email@gmail.com
- Password: their app-specific password (not regular password)
