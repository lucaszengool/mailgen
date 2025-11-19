# Analytics Testing Guide - Manual Steps

## Current Status ✅

**Servers Running:**
- ✅ Backend: `http://localhost:3333`
- ✅ Frontend: `http://localhost:3001` (opened in browser)
- ✅ SMTP Configured: `fruitaiofficial@gmail.com`

**Gmail Credentials:**
- Email: `fruitaiofficial@gmail.com`
- App Password: `rlvyvbyeiygmjmbj` (spaces removed)

---

## Issue: Analytics Showing All Zeros

**Root Cause:** Analytics page queries the database for email logs, but there are no sent emails yet.

**Solution:** Send real emails through the system to populate analytics data.

---

## Step-by-Step Testing Instructions

### Step 1: Configure SMTP Settings (Already Done ✅)

The SMTP configuration has been saved to the database with your Gmail credentials.

### Step 2: Create a Campaign and Send Emails

1. **Open the Application:**
   - Go to `http://localhost:3001`
   - You should see the Campaign Workflow dashboard

2. **Configure SMTP in UI (Optional - Verify Settings):**
   - Click on "Settings" tab
   - Go to "SMTP Settings"
   - Verify the configuration shows:
     ```
     Host: smtp.gmail.com
     Port: 587
     Username: fruitaiofficial@gmail.com
     ```
   - If empty, fill in the credentials and click "Update SMTP Config"

3. **Create a New Campaign:**
   - Click "+ New Campaign" button
   - Name it: "Analytics Test Campaign"
   - Click "Create Campaign"

4. **Configure Campaign Settings:**
   - In the Settings tab, go to "Website Analysis"
   - Fill in:
     - Target Website: `https://yourwebsite.com`
     - Business Name: `FruitAI`
     - Product Type: `Food Technology`
     - Business Introduction: `AI-powered food analysis platform`
   - Click "Update Website Analysis"

5. **Start Prospect Discovery:**
   - Go back to "Campaign Workflow" tab
   - Click "START CAMPAIGN" button
   - Wait for prospects to be discovered
   - You should see prospect cards appearing

6. **Generate and Send Emails:**
   - Wait for the first email to be generated
   - A modal will appear showing the generated email
   - Click "Approve & Continue" or "Send Email"
   - The system will generate more emails for other prospects
   - Let it generate at least 3-5 emails

### Step 3: Verify Email Sending

1. **Check Server Logs:**
   - Look at your terminal where the server is running
   - You should see messages like:
     ```
     📧 Sending email to: prospect@example.com
     ✅ Email sent successfully
     📊 Email logged to database with tracking
     ```

2. **Check Gmail Inbox:**
   - Go to https://mail.google.com/mail/u/0/#inbox
   - Login with: `fruitaiofficial@gmail.com`
   - Look for sent emails in "Sent" folder
   - You should see the test emails sent to prospects

### Step 4: Check Analytics Page

1. **Navigate to Analytics:**
   - In the app, click on "Analytics" tab
   - The page should now show non-zero metrics:
     - **Total Emails Sent**: Should match number of emails sent
     - **Delivery Rate**: Should be 100% (or close)
     - **Open Rate**: Will be 0% initially (until someone opens)
     - **Click-Through Rate**: Will be 0% initially

2. **Expected Data:**
   ```
   Total Emails Sent: 5 (or however many you sent)
   Delivery Rate: 100%
   Open Rate: 0% (will update when emails are opened)
   Click Rate: 0% (will update when links are clicked)
   Active Campaigns: 1
   ```

3. **Charts Should Show:**
   - Email Performance Trends: Line showing sent emails over time
   - Campaign Performance: Your "Analytics Test Campaign" listed
   - Deliverability by Provider: Shows breakdown by email domains

### Step 5: Test Open and Click Tracking

#### To Test Open Tracking:

1. **Emails Include Tracking Pixel:**
   - All sent emails include a 1x1 pixel image
   - When someone opens the email, the pixel loads
   - This triggers the `/api/analytics/track-open` endpoint

2. **Manual Test:**
   - Open one of the sent emails in Gmail
   - The tracking pixel will automatically load
   - Wait 10 seconds
   - Refresh the Analytics page
   - **Open Rate** should now show a percentage

#### To Test Click Tracking:

1. **Emails Include Tracked Links:**
   - Links in emails are wrapped with tracking URLs
   - Format: `http://localhost:3333/api/analytics/track-click/{campaignId}/{linkId}`

2. **Manual Test:**
   - Find a link in one of the sent emails
   - Click the link
   - This will record a click and redirect you
   - Refresh the Analytics page
   - **Click-Through Rate** should now show a percentage

---

## Debugging: If Analytics Still Shows Zeros

### Check 1: Verify Database Has Email Logs

Run this query in your terminal:

```bash
sqlite3 server/data/email_agent.db "SELECT COUNT(*) FROM email_logs;"
```

Expected output: A number > 0 (e.g., "5")

If output is "0", emails were not logged to database.

### Check 2: Check Email Logs Table

```bash
sqlite3 server/data/email_agent.db "SELECT campaign_id, recipient_email, status, sent_at FROM email_logs LIMIT 5;"
```

This should show your sent emails.

### Check 3: Verify API Endpoints

Open these URLs in your browser:

1. **Email Metrics:**
   ```
   http://localhost:3333/api/analytics/email-metrics?timeRange=24h&campaign=all&userId=anonymous
   ```
   Should return JSON with `totalSent`, `totalDelivered`, etc.

2. **Campaign Performance:**
   ```
   http://localhost:3333/api/analytics/campaign-performance?timeRange=24h&campaign=all&userId=anonymous
   ```
   Should return array of campaigns with sent/open/click stats.

### Check 4: Frontend Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   ```
   Failed to fetch analytics data
   ```
4. Check Network tab for failed API requests

---

## Alternative: Send Manual Test Email via Email Editor

If the campaign workflow isn't working:

1. **Go to Email Editor Tab**
2. **Click "New Email"**
3. **Fill in:**
   - To: `fruitaiofficial@gmail.com` (send to yourself)
   - Subject: `Test Email for Analytics`
   - Body: Write some test content with a link
4. **Click "Send Email"**
5. **Check Analytics** - should show 1 sent email

---

## Expected Results After Sending 5 Emails

### Analytics Page Should Show:

```
📊 Email Campaign Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Emails Sent: 5
Delivery Rate: 100% (5 delivered)
Open Rate: 20% (1 open) [after you open one email]
Click-Through Rate: 20% (1 click) [after you click one link]
Reply Rate: 0%
Bounce Rate: 0%
Unsubscribe Rate: 0%
Active Campaigns: 1

Email Performance Trends:
[Chart showing 5 emails sent on today's date]

Campaign Performance Overview:
┌──────────────────────────┬──────┬───────────┬──────┬────────┐
│ Campaign Name            │ Sent │ Delivered │ Opens│ Clicks │
├──────────────────────────┼──────┼───────────┼──────┼────────┤
│ Analytics Test Campaign  │  5   │     5     │  1   │   1    │
└──────────────────────────┴──────┴───────────┴──────┴────────┘
```

---

## IMAP Monitoring (Advanced)

The system includes automatic IMAP monitoring for:
- Delivery confirmations
- Bounce notifications
- Out-of-office replies
- Email opens (if client loads images)

**Status:** Check `http://localhost:3333/api/analytics/imap-monitoring-status`

This should show:
```json
{
  "isActive": true,
  "status": "connected",
  "lastCheck": "2025-11-19T14:00:00.000Z",
  "emailsProcessed": 0,
  "account": "fruitaiofficial@gmail.com"
}
```

---

## Troubleshooting

### Problem: "No emails sent" despite clicking Send

**Check:**
1. SMTP credentials are correct (check Settings tab)
2. Gmail allows "Less secure app access" or using App Password
3. Server logs show any SMTP errors

### Problem: Analytics page still shows 0 after sending

**Check:**
1. Campaign ID matches between sent emails and analytics query
2. userId is "anonymous" (default) in both database and API calls
3. Time range includes the time emails were sent (use "Last 24 Hours")

### Problem: Emails sent but not showing in Analytics

**Fix:**
The analytics API requires both `userId` and `campaignId` to match:

```javascript
// Frontend should call:
fetch('/api/analytics/email-metrics?timeRange=24h&campaign=all&userId=anonymous')
```

---

## Current SMTP Configuration

```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: 'fruitaiofficial@gmail.com',
  password: 'rlvyvbyeiygmjmbj',
  from: 'fruitaiofficial@gmail.com',
  fromName: 'FruitAI Team'
}
```

**Status:** ✅ Saved to database and active

---

## Next Steps

1. **Start a campaign** and send 5 test emails
2. **Verify emails appear** in Gmail Sent folder
3. **Check Analytics page** - should show metrics
4. **Open one email** to test open tracking
5. **Click a link** to test click tracking
6. **Refresh Analytics** to see updated metrics

All servers are running and ready for testing! 🚀
