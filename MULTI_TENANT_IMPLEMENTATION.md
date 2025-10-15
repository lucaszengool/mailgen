# Multi-Tenant Data Isolation Implementation Guide

## Overview
This document outlines the implementation of multi-tenant data isolation for MailGen, ensuring each user's data (workflows, prospects, emails, templates, website analysis) is stored and accessed independently.

## Architecture

### 1. User Context Middleware ✅ COMPLETED
Location: `/server/middleware/userContext.js`

**Features:**
- Extracts `userId` from Clerk authentication
- Adds `req.userId` and `req.isAuthenticated` to all requests
- Provides `requireAuth()` and `optionalAuth()` middlewares
- Falls back to 'demo' userId for development

**Usage:**
```javascript
const { requireAuth, optionalAuth } = require('./middleware/userContext');

// Require authentication
router.get('/data', requireAuth, (req, res) => {
  const userId = req.userId; // Always available
});

// Optional authentication (demo mode fallback)
router.get('/public', optionalAuth, (req, res) => {
  const userId = req.userId; // 'demo' if not authenticated
});
```

### 2. Data Storage Strategy

#### Current Storage Structure:
```
/server/data/
├── agent-config.json          → User-specific configs
├── prospects.json             → User-specific prospects
├── real_prospects.json        → User-specific prospects
├── email_templates.json       → User-specific templates
├── knowledge-base.db          → SQLite with userId column
└── langgraph_checkpoints.db   → SQLite with userId column
```

#### New Storage Structure (User-Scoped):
```
/server/data/users/{userId}/
├── agent-config.json
├── prospects.json
├── email_templates.json
├── workflow-state.json
└── website-analysis.json

/server/data/shared/
├── knowledge-base.db     (with userId column)
├── email_agent.db        (with userId column)
└── langgraph_checkpoints.db (with userId column)
```

### 3. Implementation Steps

#### Step 1: Create User-Scoped Storage Service
Create `/server/services/UserStorageService.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');

class UserStorageService {
  constructor(userId) {
    this.userId = userId || 'demo';
    this.basePath = path.join(__dirname, '../data/users', this.userId);
  }

  async ensureUserDirectory() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async saveConfig(config) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'agent-config.json');
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
  }

  async getConfig() {
    try {
      const filePath = path.join(this.basePath, 'agent-config.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveProspects(prospects) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'prospects.json');
    await fs.writeFile(filePath, JSON.stringify(prospects, null, 2));
  }

  async getProspects() {
    try {
      const filePath = path.join(this.basePath, 'prospects.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveWorkflowState(state) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'workflow-state.json');
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
  }

  async getWorkflowState() {
    try {
      const filePath = path.join(this.basePath, 'workflow-state.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}

module.exports = UserStorageService;
```

#### Step 2: Update Agent Routes (agent.js)

**Before:**
```javascript
router.get('/config', async (req, res) => {
  const configPath = path.join(__dirname, '../data/agent-config.json');
  const config = await fs.readFile(configPath, 'utf8');
  res.json(JSON.parse(config));
});
```

**After:**
```javascript
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

router.get('/config', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const config = await storage.getConfig();
  res.json(config);
});

router.post('/config', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  await storage.saveConfig(req.body);
  res.json({ success: true });
});
```

#### Step 3: Update Workflow Routes (workflow.js)

Add userId filtering to all workflow endpoints:

```javascript
const { optionalAuth } = require('../middleware/userContext');

router.get('/results', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const workflowState = await storage.getWorkflowState();
  res.json(workflowState || { prospects: [], emails: [] });
});

router.post('/results', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  await storage.saveWorkflowState(req.body);
  res.json({ success: true });
});
```

#### Step 4: Update Database Models

**KnowledgeBase (SQLite):**
```sql
-- Add userId column to all tables
ALTER TABLE prospects ADD COLUMN user_id TEXT DEFAULT 'demo';
ALTER TABLE emails ADD COLUMN user_id TEXT DEFAULT 'demo';
ALTER TABLE templates ADD COLUMN user_id TEXT DEFAULT 'demo';

-- Create index for faster queries
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_templates_user_id ON templates(user_id);
```

**Update queries to filter by userId:**
```javascript
async getAllProspects(userId) {
  return await this.db.all(
    'SELECT * FROM prospects WHERE user_id = ?',
    [userId]
  );
}

async saveProspect(userId, prospect) {
  return await this.db.run(
    'INSERT INTO prospects (user_id, email, company, ...) VALUES (?, ?, ?, ...)',
    [userId, prospect.email, prospect.company, ...]
  );
}
```

#### Step 5: Update Template Routes

```javascript
const { optionalAuth } = require('../middleware/userContext');

router.get('/templates', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const templates = await storage.getTemplates();
  res.json(templates);
});

router.post('/templates', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  await storage.saveTemplate(req.body);
  res.json({ success: true });
});
```

#### Step 6: Update Website Analysis Routes

```javascript
const { optionalAuth } = require('../middleware/userContext');

router.post('/analyze', optionalAuth, async (req, res) => {
  const { url } = req.body;
  const storage = new UserStorageService(req.userId);

  // Perform analysis
  const analysis = await analyzeWebsite(url);

  // Save to user's storage
  await storage.saveWebsiteAnalysis(url, analysis);

  res.json(analysis);
});

router.get('/analysis/:url', optionalAuth, async (req, res) => {
  const storage = new UserStorageService(req.userId);
  const analysis = await storage.getWebsiteAnalysis(req.params.url);
  res.json(analysis);
});
```

### 4. Frontend Updates

#### Update API calls to use authentication:

**Before:**
```javascript
const response = await fetch('/api/agent/config');
```

**After:**
```javascript
// Clerk automatically adds authentication headers
// No changes needed if using Clerk's built-in fetch
const response = await fetch('/api/agent/config');

// Or explicitly with Clerk session
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchData = async () => {
    const token = await getToken();
    const response = await fetch('/api/agent/config', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  };
}
```

### 5. Testing Strategy

#### Test Multi-User Isolation:

1. **Create two test users:**
   - User A: Creates campaign with "Tech Startups" target
   - User B: Creates campaign with "Restaurants" target

2. **Verify data isolation:**
   ```bash
   # User A should only see their data
   GET /api/agent/config (as User A)
   # Should return: { targetWebsite: "tech-startup.com", ... }

   GET /api/workflow/results (as User A)
   # Should return: { prospects: [tech prospects], ... }

   # User B should only see their data
   GET /api/agent/config (as User B)
   # Should return: { targetWebsite: "restaurant.com", ... }

   GET /api/workflow/results (as User B)
   # Should return: { prospects: [restaurant prospects], ... }
   ```

3. **Test demo mode (unauthenticated):**
   ```bash
   # Without authentication
   GET /api/agent/config
   # Should use userId='demo' and return demo data
   ```

### 6. Migration Script

Create a script to migrate existing data to user-scoped structure:

```javascript
// /server/scripts/migrate-to-multi-tenant.js
const fs = require('fs').promises;
const path = require('path');

async function migrateToMultiTenant() {
  const demoUserId = 'demo';
  const oldDataPath = path.join(__dirname, '../data');
  const newDataPath = path.join(__dirname, '../data/users', demoUserId);

  // Create demo user directory
  await fs.mkdir(newDataPath, { recursive: true });

  // Move existing files to demo user directory
  const filesToMove = [
    'agent-config.json',
    'prospects.json',
    'real_prospects.json',
    'email_templates.json'
  ];

  for (const file of filesToMove) {
    try {
      const oldPath = path.join(oldDataPath, file);
      const newPath = path.join(newDataPath, file);
      await fs.copyFile(oldPath, newPath);
      console.log(`✅ Migrated ${file}`);
    } catch (error) {
      console.log(`⚠️ Could not migrate ${file}:`, error.message);
    }
  }

  console.log('✅ Migration complete!');
}

migrateToMultiTenant().catch(console.error);
```

Run migration:
```bash
node server/scripts/migrate-to-multi-tenant.js
```

### 7. Deployment Checklist

- [ ] Create UserStorageService
- [ ] Update all route files to use optionalAuth middleware
- [ ] Update database schemas to include userId
- [ ] Update all database queries to filter by userId
- [ ] Test with multiple users
- [ ] Run migration script for existing data
- [ ] Update frontend to handle authentication
- [ ] Test demo mode (unauthenticated users)
- [ ] Deploy to Railway with CLERK environment variables
- [ ] Verify data isolation in production

### 8. Security Considerations

1. **Never trust client-provided userId** - Always use `req.userId` from middleware
2. **All database queries MUST filter by userId**
3. **File paths MUST be validated** to prevent directory traversal
4. **Demo mode** should have limited capabilities in production
5. **API rate limiting** should be per-user, not global

### 9. Performance Optimization

1. **Cache user data** in memory (with TTL)
2. **Index userId columns** in all database tables
3. **Lazy load** user directories (create on first use)
4. **Connection pooling** for database connections per user

### 10. Next Steps

1. Implement UserStorageService
2. Update one route at a time (start with /agent/config)
3. Test each route with multiple users
4. Add comprehensive logging for debugging
5. Monitor performance and optimize

## Questions?

If you have any questions during implementation, refer to:
- Clerk Documentation: https://clerk.com/docs
- User Context Middleware: `/server/middleware/userContext.js`
- This guide: `/MULTI_TENANT_IMPLEMENTATION.md`
