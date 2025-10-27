# Moving OAuth to Production Mode

## Current Status ✅

Your OAuth app is in **Testing Mode** with credentials configured.
- **Status:** Testing (100 user limit)
- **Credentials:** Set in Railway environment variables (not stored in code)

## Two Options

### Option 1: Stay in Testing Mode (Recommended for Now)

**Pros:**
- ✅ Works immediately - no verification needed
- ✅ Supports up to 100 test users
- ✅ Full functionality
- ✅ Perfect for beta/early access

**Cons:**
- ⚠️ Shows "This app isn't verified" warning to users
- ⚠️ Limited to 100 users
- ⚠️ Must manually add each user as "test user"

**How to Add Test Users:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Under **Test users**, click **"+ ADD USERS"**
5. Enter email addresses (one per line)
6. Click **"SAVE"**

Users can now connect their Gmail accounts!

---

### Option 2: Move to Production Mode (For Public Launch)

**Requirements:**
- ✅ Privacy Policy page (DONE - deployed at `/privacy`)
- ✅ Terms of Service page (DONE - deployed at `/terms`)
- ✅ Verified domain ownership
- ⏳ Google verification process (1-6 weeks)

**Steps to Submit for Verification:**

#### Step 1: Update OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → OAuth consent screen
3. Fill out all required fields:

**App Information:**
```
App name: MailGen
User support email: your-email@gmail.com
App logo: (upload a 120x120px logo)

App domain:
  - Application home page: https://honest-hope-production.up.railway.app
  - Privacy policy: https://honest-hope-production.up.railway.app/privacy
  - Terms of service: https://honest-hope-production.up.railway.app/terms

Authorized domains:
  - railway.app

Developer contact: your-email@gmail.com
```

#### Step 2: Verify Domain (Railway)

Railway provides a verified domain automatically, but you need to:

1. Go to your Railway project
2. Settings → Domains
3. Note your Railway domain: `honest-hope-production.up.railway.app`
4. Use this in OAuth consent screen

#### Step 3: Prepare Verification Documents

Google will ask for:

1. **Video Demo:**
   - Record a screen recording showing:
   - How users connect Gmail
   - Where OAuth scopes are used
   - Privacy/terms pages
   - How email data is handled

2. **Justification for Scopes:**
```
REQUESTED SCOPES:
- gmail.send: Required to send marketing emails on behalf of users
- gmail.readonly: Required to track email opens and replies for analytics
- mail.google.com: Required for full email campaign management

JUSTIFICATION:
MailGen is an email marketing automation platform. Users connect their
Gmail accounts to send personalized marketing campaigns. We need:
- Send permission: To send emails they create
- Read permission: To provide analytics on campaign performance
- Full scope: For comprehensive campaign management and tracking
```

3. **YouTube Video (Unlisted):**
   - Upload demo to YouTube as "Unlisted"
   - Show complete OAuth flow
   - Demonstrate how scopes are used
   - Show privacy settings

#### Step 4: Submit for Verification

1. On OAuth consent screen, click **"PUBLISH APP"**
2. Click **"Prepare for verification"**
3. Fill out the verification form:
   - App name & domain
   - Link to privacy policy & terms
   - Link to demo video
   - Justification for each scope
   - Contact information

4. Click **"Submit for verification"**

#### Step 5: Wait for Google Review

- **Timeline:** 1-6 weeks typically
- **Communication:** Google emails you with questions
- **Be Responsive:** Answer quickly to avoid delays

**Common Questions from Google:**
1. "Why do you need full Gmail access?"
   - Answer: For complete email campaign management
2. "How is user data stored?"
   - Answer: Encrypted OAuth tokens, not reading/storing email content
3. "How do users revoke access?"
   - Answer: Through Google account settings or app settings

---

## Recommended Approach

### Phase 1: Testing Mode (Now - Next 2 months)
1. ✅ Add OAuth credentials to Railway (DONE)
2. Add beta users as test users (up to 100)
3. Collect feedback and iterate
4. Build user base and case studies

### Phase 2: Submit for Production (When ready)
1. Create demo video
2. Submit verification application
3. Continue using Testing mode during review
4. Once approved, automatically becomes production

---

## Railway Configuration (Required Now)

### Add Environment Variables

For **honest-hope** service:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_from_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
```

For **mailgen** service (if separate):
```bash
GOOGLE_CLIENT_ID=your_google_client_id_from_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
```

### Steps:
1. Go to https://railway.app
2. Select your project
3. Click **honest-hope** service
4. Click **"Variables"** tab
5. Click **"+ New Variable"**
6. Add `GOOGLE_CLIENT_ID` and its value
7. Add `GOOGLE_CLIENT_SECRET` and its value
8. Click **"Redeploy"**

After redeployment (2-3 minutes), OAuth will work!

---

## Testing OAuth

1. Go to: https://honest-hope-production.up.railway.app
2. Navigate to SMTP Setup
3. Click **"Connect with Gmail"**
4. You should see Google's login page (not an error!)
5. Sign in with a test user account
6. Grant permissions
7. You'll be redirected back with success

---

## Current URLs

These are now live:
- **Privacy Policy:** https://honest-hope-production.up.railway.app/privacy
- **Terms of Service:** https://honest-hope-production.up.railway.app/terms
- **OAuth Callback:** https://honest-hope-production.up.railway.app/api/auth/gmail/callback

---

## Security Best Practices

✅ **Implemented:**
- OAuth credentials in environment variables (not code)
- HTTPS for all production traffic
- Privacy policy compliant with Google requirements
- Terms of service with acceptable use policy

⚠️ **Recommended:**
- Encrypt OAuth tokens before storing in database
- Implement token rotation
- Add rate limiting on OAuth endpoints
- Log OAuth access for security monitoring

---

## Need Help?

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Gmail API Policies:** https://developers.google.com/terms/api-services-user-data-policy
- **Railway Support:** https://railway.app/help

---

## Summary

**Right Now:**
- ✅ Add credentials to Railway environment variables
- ✅ Add yourself as a test user in Google Cloud Console
- ✅ Test OAuth connection
- ✅ Add up to 100 beta users

**Later (When ready for public):**
- Create demo video
- Submit for verification
- Wait 1-6 weeks for approval

You're ready to test OAuth! 🚀
