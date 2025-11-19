# Campaign Isolation & Data Quality Fixes - Testing Checklist

## Issues Fixed

### 1. Generic/Low-Quality Prospect Filtering ✅
**Problem:** Prospects with generic emails (info@, example@, hi@, hello@) were showing up in the UI

**Fix Applied:**
- Created `/server/utils/emailEnrichment.js` utility that:
  - Detects generic email prefixes (info, contact, hello, hi, support, admin, example, etc.)
  - Extracts real names from email addresses (handles first.last, camelCase, initials formats)
  - Identifies departments (Food Science, Marketing, HR, IT, etc.)
  - Determines job titles (CEO, Director, Manager, etc.)
  - Calculates quality scores
  - Determines employment type (Academic, Government, Full-time)
  - Assigns seniority levels (Senior, Mid-level, Junior)

- Integrated enrichment in `/server/agents/ProspectSearchAgent.js`:
  - All discovered prospects pass through `enhanceProspect()` function
  - Filters out prospects with `isGeneric=true` OR `qualityScore < 60`
  - Logs: `🚫 Filtered out X generic/low-quality prospects`

**Files Modified:**
- `server/utils/emailEnrichment.js` (NEW)
- `server/agents/ProspectSearchAgent.js`
- `client/src/components/JobRightProspectCard.jsx`

### 2. Campaign Data Mixing (Email Cross-Contamination) ✅
**Problem:** First generated emails from one campaign were appearing in other campaigns' email editor and email campaign pages

**Root Cause:**
- Frontend WebSocket handlers were adding emails to `generatedEmails` state without checking campaignId
- When switching campaigns, old emails remained in state
- No campaign filtering on incoming WebSocket messages

**Fix Applied:**
Added campaign isolation checks to ALL WebSocket handlers in `SimpleWorkflowDashboard.jsx`:

1. **`email_preview_generated` handler** (line 4773-4786)
   ```javascript
   const emailCampaignId = data.data.campaignId || emailForReview.campaignId;
   if (emailCampaignId === currentCampaignId) {
     // Only add if campaign matches
   } else {
     console.log(`🚫 [CAMPAIGN ISOLATION] Skipping email from different campaign`);
   }
   ```

2. **`data_update` handler** (line 4454-4469)
   - Added campaignId check before adding emails to `generatedEmails`
   - Logs campaign match/mismatch

3. **`email_sent/email_generated` handler** (line 4615-4629)
   - Validates campaignId before processing email updates
   - Prevents cross-campaign contamination

4. **`email_awaiting_approval` handler** (line 4681-4695)
   - Checks campaignId before adding to `generatedEmails`
   - Ensures only current campaign emails are shown

**Backend Already Had Protection:**
- `/server/routes/workflow.js` already filters emails by campaignId in `/api/workflow/results` endpoint
- `/server/agents/LangGraphMarketingAgent.js` already includes campaignId in all emails
- Issue was ONLY in frontend WebSocket handling

**Files Modified:**
- `client/src/components/SimpleWorkflowDashboard.jsx` (4 WebSocket handlers updated)

---

## Manual Testing Checklist

### Test 1: Generic Prospect Filtering ✅

**Steps:**
1. Start the server: `npm run server:dev`
2. Start the client: `npm run dev`
3. Create a new campaign (Campaign A)
4. Start prospect discovery
5. Monitor console logs for:
   ```
   🚫 Filtered out X generic/low-quality prospects (e.g., info@, hello@, example@)
   ```
6. Check prospect cards - verify NO cards with these names:
   - "Example"
   - "Hi"
   - "Info"
   - "Hello"
   - "Contact"
   - "Support"
   - Gmail/Yahoo addresses unless high quality score

**Expected Results:**
- Only high-quality prospects with real names or company names
- Generic emails filtered out
- Console shows filter count

### Test 2: Campaign Isolation (Critical) ✅

**Steps:**
1. **Create Campaign A:**
   - Name: "Campaign A - Test 1"
   - Start workflow
   - Wait for first email to generate
   - Note the prospect email (e.g., `prospect1@company1.com`)
   - Approve or reject the email
   - Let it generate 2-3 more emails

2. **Create Campaign B (Without Closing Campaign A):**
   - Click "+ New Campaign" or switch campaigns
   - Name: "Campaign B - Test 2"
   - Start workflow
   - Wait for first email to generate
   - Note the prospect email (e.g., `prospect2@company2.com`)

3. **Verify Email Editor Isolation:**
   - Go to Email Editor tab in Campaign B
   - **CHECK:** Only emails from Campaign B should appear
   - **FAIL IF:** You see emails from Campaign A (prospect1@company1.com)

4. **Verify Email Campaign Page Isolation:**
   - Go to Email Campaign tab in Campaign B
   - **CHECK:** Only emails from Campaign B should appear
   - **FAIL IF:** You see emails from Campaign A

5. **Switch Back to Campaign A:**
   - Select Campaign A from campaign selector
   - Go to Email Editor tab
   - **CHECK:** Only Campaign A emails should appear
   - **FAIL IF:** You see emails from Campaign B (prospect2@company2.com)

6. **Monitor Console Logs:**
   Look for these messages during email generation:
   ```
   ✅ [CAMPAIGN MATCH] Adding email from campaign campaign_xxxxx
   🚫 [CAMPAIGN ISOLATION] Skipping email from different campaign (Email: campaign_A, Current: campaign_B)
   ```

**Expected Results:**
- ✅ Each campaign shows ONLY its own emails
- ✅ No mixing of emails between campaigns
- ✅ Console logs show campaign isolation working
- ✅ Switching campaigns updates email list correctly

### Test 3: Backend Campaign Filtering ✅

**Steps:**
1. Open browser DevTools → Network tab
2. Start Campaign A and generate 3 emails
3. Create Campaign B and generate 2 emails
4. Look for API calls to `/api/workflow/results?campaignId=campaign_A`
5. Check the response - should only contain Campaign A data

**Expected Results:**
- API responses include campaignId filter
- Each request returns ONLY that campaign's data
- No data leakage between campaigns

---

## Console Log Patterns to Watch For

### ✅ GOOD (Working Correctly)
```
✅ [CAMPAIGN MATCH] Adding email from campaign campaign_12345
✅ [User: anonymous, Campaign: campaign_12345] First email added to workflow results
🔒 Campaign isolation: 10 total → 5 for campaign campaign_12345
📦 [STORAGE] Storing email with final Campaign ID: campaign_12345
```

### ❌ BAD (Indicates Problem)
```
⚠️  WARNING: Email being stored WITHOUT campaignId! This will cause isolation issues.
⚠️  Filtering out email WITHOUT campaignId: prospect@company.com (will cause mixing!)
🚫 [CAMPAIGN ISOLATION] Skipping email from different campaign (BUT EMAIL STILL APPEARS IN UI)
```

---

## Rollback Instructions

If the fixes cause issues, revert these files:

```bash
# Revert prospect filtering
git checkout HEAD -- server/utils/emailEnrichment.js
git checkout HEAD -- server/agents/ProspectSearchAgent.js

# Revert campaign isolation
git checkout HEAD -- client/src/components/SimpleWorkflowDashboard.jsx
```

---

## Additional Notes

1. **Prospect Quality Improvements:**
   - Names now extracted from emails: `sarah.johnson@xyz.com` → "Sarah Johnson"
   - Departments detected: `foodsci@psu.edu` → "Food Science"
   - Job titles extracted: `ceo@company.com` → "CEO"
   - Employment type: `.edu` → "Academic/Research"

2. **Campaign Isolation:**
   - campaignId is stored in BOTH camelCase (`campaignId`) and snake_case (`campaign_id`)
   - Backend filters by campaignId in memory storage
   - Frontend filters WebSocket messages by campaignId
   - Database queries include campaign filter

3. **Performance:**
   - Email enrichment adds minimal overhead (simple regex/lookup)
   - Campaign filtering is O(1) comparison
   - No database migrations required
