# UI Consistency Update Plan

## Design Tokens (from ComprehensiveCompanyDetailPage)

### Colors
- **Background:** `bg-white` (pure white, not gray-50)
- **Card Background:** `bg-white`
- **Text Primary:** `text-gray-900`
- **Text Secondary:** `text-gray-600`
- **Border:** `border-gray-200`
- **Accent Color:** `#00f5a0` (JobRight green)
- **Focus Ring:** `ring-green-500`

### Typography
- **Page Title:** `text-3xl font-bold text-gray-900`
- **Section Header:** `text-xl font-semibold text-gray-900`
- **Subtitle:** `text-gray-600`
- **Label:** `text-sm font-medium text-gray-700`

### Spacing
- **Page Padding:** `px-6 py-8`
- **Card Padding:** `p-6`
- **Section Spacing:** `space-y-6`

### Components
- **Input Fields:**
  ```jsx
  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg
             focus:ring-2 focus:ring-green-500 focus:border-green-500
             transition-all bg-white text-gray-900"
  ```

- **Buttons (Primary):**
  ```jsx
  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white
             rounded-lg font-medium transition-all shadow-sm
             hover:shadow-md"
  ```

- **Cards:**
  ```jsx
  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
  ```

---

## Pages to Update

### 1. System Settings Page (SimpleWorkflowDashboard.jsx)
**Current Issues:**
- Uses `bg-gray-50` for page background
- Input fields have `bg-gray-50 hover:bg-white`
- Needs to match white background style

**Changes Needed:**
- Change page background from `bg-gray-50` to `bg-white`
- Update input fields to use `bg-white` consistently
- Update card shadows to match ComprehensiveCompanyDetailPage
- Add proper border styling: `border border-gray-200`

**Lines to Update:** ~1313-1500 (Settings section)

---

### 2. Market Research Page (MarketResearch.jsx)
**Current Issues:**
- Likely uses dark theme or gray background
- Needs to match white background style

**Changes Needed:**
- Update to white background (`bg-white`)
- Update all cards to use consistent styling
- Update button colors to match green accent
- Update text colors to gray-900/gray-600

---

### 3. Analytics Page (Analytics.jsx)
**Current Issues:**
- Likely uses dark theme or gray background
- Needs to match white background style

**Changes Needed:**
- Update to white background (`bg-white`)
- Update chart colors to use green accent
- Update card styling to match
- Update text colors

---

## Additional Requirements

### 4. Settings - Show Current Values
**Issue:** Settings page doesn't show default/current config values

**Solution:**
- Load current SMTP config from backend on mount
- Load current website analysis config
- Load current campaign config
- Display in form fields as placeholder or default values

**Implementation:**
```javascript
useEffect(() => {
  // Load current config from API
  fetch('/api/config/current')
    .then(res => res.json())
    .then(data => {
      setSmtpConfig(data.smtp || defaultSmtpConfig);
      setWebsiteConfig(data.website || defaultWebsiteConfig);
      setCampaignConfig(data.campaign || defaultCampaignConfig);
    });
}, []);
```

---

### 5. Settings - Propagate Updates
**Issue:** Settings updates don't propagate to workflow config

**Solution:**
- When user saves settings, call backend API
- Backend updates workflow config
- Future prospect/email generation uses updated values

**Implementation:**
```javascript
const saveConfig = async () => {
  const response = await fetch('/api/config/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smtp: smtpConfig,
      website: websiteConfig,
      campaign: campaignConfig
    })
  });

  if (response.ok) {
    toast.success('Config updated! Future campaigns will use these settings');
  }
};
```

---

## Implementation Steps

1. **Phase 1:** Update Settings page UI
   - Change background colors
   - Update input styling
   - Add borders and shadows

2. **Phase 2:** Update MarketResearch component
   - Apply white background theme
   - Update cards and buttons
   - Update text colors

3. **Phase 3:** Update Analytics component
   - Apply white background theme
   - Update charts
   - Update cards

4. **Phase 4:** Add config loading
   - Create API endpoint for current config
   - Load config on Settings mount
   - Display in form fields

5. **Phase 5:** Add config saving
   - Update save handler
   - Call backend API
   - Show success message

---

## Testing Checklist

- [ ] Settings page has white background
- [ ] Research page has white background
- [ ] Analytics page has white background
- [ ] All cards use same shadow/border style
- [ ] All inputs use same styling
- [ ] All buttons use green accent color
- [ ] Settings show current/default values
- [ ] Settings updates save to backend
- [ ] Future workflows use updated settings

---

## Files to Modify

1. `/Users/James/Desktop/agent/client/src/components/SimpleWorkflowDashboard.jsx`
2. `/Users/James/Desktop/agent/client/src/components/MarketResearch.jsx`
3. `/Users/James/Desktop/agent/client/src/pages/Analytics.jsx`
4. `/Users/James/Desktop/agent/server/routes/` (new config endpoints if needed)
