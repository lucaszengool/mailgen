# Railway Production Deployment Guide

## How This Works on Railway

### Per-User, Per-Campaign Isolation
- Every user can run multiple campaigns
- Each campaign has its own prospects and emails
- Zero data mixing between users or campaigns

### Database Persistence
**Dual-layer approach:**
1. In-memory cache (fast)
2. Database (persistent)

**On Railway restart:**
- Memory cleared
- Data auto-reconstructed from database
- No data loss

### Environment Variables (Set in Railway)
```
NODE_ENV=production
PORT=3333
DATABASE_PATH=/data/email_agent.db (optional)
CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

### Deployment
1. Push to GitHub: `git push origin main`
2. Railway auto-deploys
3. Check logs: `railway logs`

### Look for these in logs:
```
✅ [DATABASE] SQLite connected successfully
🚀 [PRODUCTION] Workflow storage initialized
📦 [PRODUCTION] Storing results for User: X, Campaign: Y
```

## Production Ready!
✅ Multi-user support
✅ Multi-campaign per user
✅ Railway restart handling
✅ Database persistence
✅ Per-campaign stats
