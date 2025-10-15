# Next Steps: Complete Multi-Tenant Implementation

## ✅ What's Already Done

1. **User Context Middleware** - Extracts `userId` from Clerk authentication (`req.userId`)
2. **UserStorageService** - Complete service for user-scoped file storage
3. **Infrastructure** - Directory structure and service methods ready to use

## 🔄 What Needs to Be Done

The heavy lifting is complete! Now we just need to integrate UserStorageService into existing routes.

### Priority 1: Update Agent Config Routes (CRITICAL)

**File:** `/server/routes/agent.js`

**Current behavior:** Stores config in global `agentConfig` variable and `/data/agent-config.json`

**Required changes:**

```javascript
// At the top of agent.js
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

// Update GET /config
router.get('/config', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    const config = await storage.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POST /config
router.post('/config', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    await storage.saveConfig(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POST /reset
router.post('/reset', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    await storage.deleteConfig();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Priority 2: Update Workflow Results Routes

**File:** `/server/routes/workflow.js`

**Current behavior:** Uses global `lastWorkflowResults` variable

**Required changes:**

```javascript
// Update GET /results
router.get('/results', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    const workflowState = await storage.getWorkflowState();

    if (workflowState) {
      return res.json({
        success: true,
        data: workflowState
      });
    }

    // Return empty state if no workflow found
    res.json({
      success: true,
      data: {
        prospects: [],
        emailCampaign: null,
        workflowState: 'idle'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setLastWorkflowResults to save per-user
async function setLastWorkflowResults(results, userId = 'demo') {
  const storage = new UserStorageService(userId);
  await storage.saveWorkflowState(results);
  console.log(`📦 Saved workflow results for user: ${userId}`);
}
```

### Priority 3: Update Template Routes

**File:** `/server/routes/template.js`

**Required changes:**

```javascript
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

// GET templates
router.get('/', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const templates = await storage.getTemplates();
  res.json(templates);
});

// POST new template
router.post('/', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const template = await storage.addTemplate(req.body);
  res.json({ success: true, template });
});
```

### Priority 4: Update Website Analysis Routes

**File:** `/server/routes/website-analysis.js`

**Required changes:**

```javascript
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

// POST analyze
router.post('/analyze', optionalAuth, async (req, res) => {
  const { url } = req.body;
  const storage = new UserStorageService(req.userId);

  // Perform analysis
  const analysis = await analyzeWebsite(url);

  // Save to user's storage
  await storage.saveWebsiteAnalysis(url, analysis);

  res.json(analysis);
});

// GET analysis/:url
router.get('/analysis/:url', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const analysis = await storage.getWebsiteAnalysis(req.params.url);
  res.json(analysis);
});
```

### Priority 5: Update Prospects/Emails Routes

**File:** `/server/routes/agent.js` (clients endpoints)

**Required changes:**

```javascript
// GET /clients (prospects)
router.get('/clients', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const prospects = await storage.getProspects();
  res.json(prospects);
});

// POST /clients (add prospect)
router.post('/clients', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const prospect = await storage.addProspect(req.body);
  res.json({ success: true, prospect });
});
```

## 📝 Implementation Strategy

### Phase 1: Agent Config (30 minutes)
1. Update `/server/routes/agent.js`
2. Add `optionalAuth` to config endpoints
3. Replace file operations with `UserStorageService`
4. Test with multiple users

### Phase 2: Workflow State (30 minutes)
1. Update `/server/routes/workflow.js`
2. Make `setLastWorkflowResults` accept `userId`
3. Save workflow state per user
4. Test workflow execution

### Phase 3: Templates & Analysis (20 minutes)
1. Update template routes
2. Update website analysis routes
3. Test template customization per user

### Phase 4: Prospects & Emails (20 minutes)
1. Update prospects endpoints
2. Test prospect isolation

### Phase 5: Frontend & Testing (30 minutes)
1. Verify Clerk automatically sends auth headers
2. Test with 2+ user accounts
3. Verify data isolation

## 🧪 Testing Plan

### Test Case 1: Basic User Isolation
```bash
# User A creates config
curl -H "Authorization: Bearer <user_a_token>" \
  -X POST http://localhost:3333/api/agent/config \
  -d '{"targetWebsite": "techstartup.com"}'

# User B creates different config
curl -H "Authorization: Bearer <user_b_token>" \
  -X POST http://localhost:3333/api/agent/config \
  -d '{"targetWebsite": "restaurant.com"}'

# Verify User A only sees their config
curl -H "Authorization: Bearer <user_a_token>" \
  http://localhost:3333/api/agent/config
# Should return: {"targetWebsite": "techstartup.com"}

# Verify User B only sees their config
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:3333/api/agent/config
# Should return: {"targetWebsite": "restaurant.com"}
```

### Test Case 2: Workflow Isolation
```bash
# User A starts workflow
# Should only see User A's prospects

# User B starts workflow
# Should only see User B's prospects

# Verify no cross-contamination
```

### Test Case 3: Demo Mode
```bash
# Unauthenticated request should use 'demo' userId
curl http://localhost:3333/api/agent/config
# Should work and use demo user data
```

## 🎯 Quick Win: Start with Agent Config

The easiest and most impactful change is updating agent config routes. Here's a complete working example:

```javascript
// /server/routes/agent.js - Updated config endpoints

const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

// Get agent configuration (UPDATED)
router.get('/config', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    const config = await storage.getConfig();

    console.log(`📖 Loading config for user: ${req.userId}`);
    res.json(config);
  } catch (error) {
    console.error('Failed to get config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save agent configuration (UPDATED)
router.post('/config', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    await storage.saveConfig(req.body);

    console.log(`💾 Config saved for user: ${req.userId}`);
    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Failed to save config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset agent configuration (UPDATED)
router.post('/reset', optionalAuth, async (req, res) => {
  try {
    const storage = new UserStorageService(req.userId);
    await storage.deleteConfig();

    console.log(`🗑️ Config reset for user: ${req.userId}`);
    res.json({ success: true, message: 'Configuration reset' });
  } catch (error) {
    console.error('Failed to reset config:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## 🚀 Deployment to Railway

Once local testing is complete:

1. **Commit all changes:**
   ```bash
   git add -A
   git commit -m "Complete multi-tenant data isolation"
   git push origin main
   ```

2. **Verify Railway environment variables are set:**
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

3. **Railway will auto-deploy**

4. **Test in production:**
   - Create 2 test accounts
   - Verify data isolation
   - Test demo mode (logged out)

## ⚡ Key Points

1. **UserStorageService handles everything** - Just instantiate with `req.userId`
2. **optionalAuth provides userId** - Works for authenticated and demo users
3. **No breaking changes** - Demo mode ensures existing functionality works
4. **Gradual rollout** - Update one route file at a time
5. **Easy to test** - Create 2 user accounts and verify isolation

## 📞 Need Help?

- Check `/MULTI_TENANT_IMPLEMENTATION.md` for detailed architecture
- Review `/server/services/UserStorageService.js` for available methods
- Test with `userId='demo'` first before testing with real Clerk users

## Summary

You now have:
- ✅ Complete infrastructure
- ✅ Working service layer
- ✅ Auth middleware ready
- 📝 Clear implementation plan
- 🧪 Testing strategy

**Estimated time to complete:** 2-3 hours of focused work

**Start with:** Agent config routes (easiest win, biggest impact)
