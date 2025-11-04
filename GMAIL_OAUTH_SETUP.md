# Gmail OAuth 2.0 Setup Guide

This guide will walk you through setting up Gmail OAuth 2.0 for your email marketing platform.

## Why Use OAuth?

✅ **No App Passwords Needed** - Connect directly with your Google account
✅ **More Secure** - Tokens auto-refresh and can be revoked anytime
✅ **Better UX** - One-click connection via Google's OAuth popup
✅ **Persistent** - Saved per-user, no need to re-enter credentials

---

## Prerequisites

- A Google Account (Gmail)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name (e.g., "Email Marketing Platform")
4. Click **"Create"**

---

## Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click **"Enable"**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Click **"Create"**

### Fill in the form:

- **App name**: Your app name (e.g., "Email Marketing Platform")
- **User support email**: Your email
- **Developer contact**: Your email
- Click **"Save and Continue"**

### Scopes:

1. Click **"Add or Remove Scopes"**
2. Add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   https://mail.google.com/
   ```
3. Click **"Update"** → **"Save and Continue"**

### Test Users (for External apps in testing):

1. Click **"Add Users"**
2. Add your Gmail address
3. Click **"Save and Continue"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Select **"Web application"**

### Configure:

- **Name**: Your app name (e.g., "Email Marketing OAuth")
- **Authorized JavaScript origins**:
  ```
  http://localhost:3000
  https://your-production-domain.com
  ```
- **Authorized redirect URIs**:
  ```
  http://localhost:5000/api/gmail-oauth/callback
  https://your-production-domain.com/api/gmail-oauth/callback
  ```
4. Click **"Create"**

### Save Your Credentials:

You'll see a popup with:
- **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123xyz789`

**Copy these!** You'll need them next.

---

## Step 5: Add Credentials to Your App

1. Open your `.env` file
2. Add these lines:

```env
# Gmail OAuth 2.0 Configuration
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/gmail-oauth/callback
```

3. Replace `your-client-id-here` and `your-client-secret-here` with the values from Step 4
4. Save the file

---

## Step 6: Restart Your Server

```bash
npm run dev
```

---

## Step 7: Connect Gmail in Your App

1. Go to **Settings** page in your app
2. You'll see a "Gmail OAuth Connection" section
3. Click **"Connect with Gmail"**
4. A Google OAuth popup will open
5. Select your Gmail account
6. Grant permissions
7. You'll be redirected back to Settings with "Gmail connected successfully!" message

---

## Production Deployment

### Railway / Heroku / Other Platforms:

1. Add the same environment variables to your deployment platform
2. Update redirect URI to your production domain:
   ```env
   GOOGLE_OAUTH_REDIRECT_URI=https://your-app.railway.app/api/gmail-oauth/callback
   ```
3. Add production redirect URI to Google Cloud Console:
   - Go to **Credentials** → Edit your OAuth client
   - Add `https://your-app.railway.app/api/gmail-oauth/callback`
   - Save

### Publish Your OAuth App (Optional):

If you want users outside your test list to connect:

1. Go to **OAuth consent screen**
2. Click **"Publish App"**
3. Submit for verification (Google will review)

---

## Testing Your Setup

1. After connecting Gmail, click **"Test Connection"** button
2. You should see "OAuth connection is working!" message
3. Try sending a test email through your campaign

---

## Troubleshooting

### "OAuth not configured" error

- Check that `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set in `.env`
- Restart your server after adding environment variables

### "Redirect URI mismatch" error

- Verify redirect URI in `.env` matches exactly what's in Google Cloud Console
- Common issue: `http://localhost:5000` vs `http://localhost:3000`

### "Access denied" error

- For External apps in testing, make sure your Gmail is added as a Test User
- Check that you granted all requested permissions

### Tokens expired

- Tokens auto-refresh! The app handles this automatically
- If issues persist, disconnect and reconnect Gmail

---

## Security Notes

- **Never commit** your `.env` file to Git
- OAuth tokens are stored per-user in `user-data/{userId}/gmail-oauth.json`
- Users can revoke access anytime from [Google Account Permissions](https://myaccount.google.com/permissions)

---

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all steps above were completed
3. Test with a simple Gmail account first
4. Check [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## Advanced: Refresh Token Handling

The app automatically:
- Refreshes expired access tokens
- Caches valid tokens
- Falls back to password auth if OAuth fails

You can monitor OAuth usage in logs:
```
🔐 Using Gmail OAuth for email sending
✅ Access token refreshed
```

---

## Migration from App Passwords

Already using App Passwords? No problem!

1. Connect Gmail with OAuth (Steps 1-7 above)
2. OAuth takes priority over password auth
3. Your app password still works as fallback
4. Once OAuth is working, you can remove the app password

---

**You're all set!** 🎉

Users can now connect their Gmail accounts with one click, and the app will automatically use OAuth for sending emails.
