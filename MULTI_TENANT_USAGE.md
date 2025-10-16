# Multi-Tenant Implementation - Usage Guide

## Overview

The system now supports multi-tenant architecture with complete user data isolation. Each user's data is completely separated at all levels:
- Database (SQLite with user_id columns)
- File Storage (user-specific directories)
- Memory/Cache (Redis with user-scoped keys)
- Workflow State (per-user workflow tracking)

## Quick Start

### 1. Run Migration (One-Time Setup)

```bash
# Migrate existing data to 'anonymous' user
cd server
node scripts/migrate-to-multi-tenant.js

# Or migrate to a specific user ID
node scripts/migrate-to-multi-tenant.js user_123
```

### 2. User Authentication

All API endpoints now support the `optionalAuth` middleware which extracts the user ID from:
- Clerk authentication headers
- Custom `x-user-id` header (for testing)
- Falls back to 'anonymous' if not authenticated

## API Changes

### Authentication Headers

Include one of the following in your requests:

```javascript
// Option 1: Clerk authentication (production)
headers: {
  'Authorization': 'Bearer <clerk_session_token>'
}

// Option 2: Custom user ID (testing/development)
headers: {
  'x-user-id': 'user_123'
}
```

### Updated Endpoints

All these endpoints now support user isolation:

#### Agent Routes (`/api/agent`)
- `GET /config` - Get user-specific configuration
- `POST /config` - Save user-specific configuration
- `POST /reset` - Reset only user's data
- `GET /clients` - Get user's clients/prospects
- `GET /clients/:id` - Get specific client (validates ownership)
- `PATCH /clients/:id` - Update client (validates ownership)
- `GET /clients/:id/emails` - Get user's email history

#### Workflow Routes (`/api/workflow`)
- `GET /status` - Get user's workflow status
- `POST /start` - Start user's workflow
- `POST /pause` - Pause user's workflow
- `POST /resume` - Resume user's workflow
- `POST /reset` - Reset user's workflow
- `GET /results` - Get user's campaign results
- `GET /step/:stepId` - Get user's step details

## Frontend Integration

### Example: API Call with Authentication

```javascript
// Using Clerk authentication
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchUserData = async () => {
    const token = await getToken();

    const response = await fetch('/api/agent/clients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  };

  // ...
}
```

### Example: Custom User ID (Testing)

```javascript
// For testing without Clerk
const response = await fetch('/api/agent/clients', {
  headers: {
    'x-user-id': 'test_user_123',
    'Content-Type': 'application/json'
  }
});
```

## Data Isolation Guarantees

### Database Level
- All queries automatically filter by `user_id`
- Users can only access their own prospects, emails, and campaigns
- Indexes on `user_id` columns ensure fast queries

```sql
-- Example: User can only see their own prospects
SELECT * FROM prospects WHERE user_id = 'user_123';
```

### File Storage Level
- User data stored in separate directories:
```
data/
  users/
    user_123/
      config.json
      prospects.json
      emails.json
    user_456/
      config.json
      prospects.json
      emails.json
```

### Cache Level (Redis)
- All Redis keys scoped to users:
```
user:user_123:config
user:user_123:workflow_state
user:user_456:config
user:user_456:workflow_state
```

### Workflow State Level
- In-memory workflow states stored in Map per user
- Each user has independent workflow execution

## Redis User Cache API

```javascript
const redisCache = require('./server/utils/RedisUserCache');

// Set user-specific cache
await redisCache.set('user_123', 'campaign_data', campaignData, 3600);

// Get user-specific cache
const data = await redisCache.get('user_123', 'campaign_data');

// Delete user's specific key
await redisCache.delete('user_123', 'campaign_data');

// Delete all user's data
await redisCache.deleteUserData('user_123');

// Check if key exists
const exists = await redisCache.exists('user_123', 'campaign_data');

// Increment counter
const count = await redisCache.increment('user_123', 'email_count');
```

## Testing Multi-Tenant Isolation

### Test Scenario 1: Two Users with Separate Data

```bash
# Terminal 1: User A creates prospects
curl -X POST http://localhost:3001/api/workflow/start \
  -H "x-user-id: user_a" \
  -H "Content-Type: application/json" \
  -d '{"targetWebsite": "https://example-a.com"}'

# Terminal 2: User B creates prospects
curl -X POST http://localhost:3001/api/workflow/start \
  -H "x-user-id: user_b" \
  -H "Content-Type: application/json" \
  -d '{"targetWebsite": "https://example-b.com"}'

# Verify isolation: User A can only see their prospects
curl http://localhost:3001/api/agent/clients \
  -H "x-user-id: user_a"

# Verify isolation: User B can only see their prospects
curl http://localhost:3001/api/agent/clients \
  -H "x-user-id: user_b"
```

### Test Scenario 2: Workflow State Isolation

```javascript
// User A starts workflow
await fetch('/api/workflow/start', {
  headers: { 'x-user-id': 'user_a' }
});

// User B starts workflow (independent from User A)
await fetch('/api/workflow/start', {
  headers: { 'x-user-id': 'user_b' }
});

// User A pauses their workflow (doesn't affect User B)
await fetch('/api/workflow/pause', {
  method: 'POST',
  headers: { 'x-user-id': 'user_a' }
});

// User B's workflow is still running
const statusB = await fetch('/api/workflow/status', {
  headers: { 'x-user-id': 'user_b' }
});
```

## Security Considerations

1. **Authentication Required**: In production, ensure all requests are authenticated via Clerk
2. **User ID Validation**: Never trust client-provided user IDs - always extract from auth token
3. **Authorization**: The system validates user ownership before allowing access/modifications
4. **Database Queries**: All queries include `user_id` filter to prevent data leakage
5. **File Permissions**: Ensure user directories have appropriate permissions

## Migration Notes

### What the Migration Script Does

1. **Database Schema**:
   - Adds `user_id` column to all relevant tables
   - Creates indexes for performance
   - Assigns existing data to specified user (default: 'anonymous')

2. **File Storage**:
   - Creates `data/users/{userId}/` directories
   - Copies existing files to user directories
   - Preserves original files for backup

3. **Redis Cache**:
   - Renames all keys to user-scoped format: `user:{userId}:{key}`
   - Preserves TTL values
   - Deletes old non-scoped keys

### Rollback Procedure

If you need to rollback the migration:

1. Restore database from backup (before migration)
2. Delete user directories: `rm -rf data/users/`
3. Flush Redis: `redis-cli FLUSHALL`

## Performance Considerations

- **Database Indexes**: User_id columns are indexed for fast queries
- **Redis Caching**: User-scoped caching reduces database load
- **In-Memory State**: Workflow states stored in memory for fast access
- **Connection Pooling**: Database connections are reused via singleton pattern

## Monitoring and Debugging

### Check User Data

```bash
# Check database for user's prospects
sqlite3 server/data/enhanced_knowledge_base.db \
  "SELECT COUNT(*) FROM prospects WHERE user_id = 'user_123';"

# Check Redis for user's keys
redis-cli KEYS "user:user_123:*"

# Check user's file storage
ls -la server/data/users/user_123/
```

### Logs

All user-specific operations are logged with `[User: {userId}]` prefix:

```
✅ [User: user_123] Found stored workflow results with 10 prospects
📦 [User: user_123] Stored workflow results with 10 prospects and 5 emails
🗑️ [User: user_123] Resetting workflow
```

## Troubleshooting

### Issue: User sees another user's data

**Solution**: Check authentication middleware is properly extracting userId:
```javascript
// In middleware/userContext.js
console.log('Extracted userId:', req.userId);
```

### Issue: Database queries returning no results

**Solution**: Verify user_id column exists and has data:
```bash
sqlite3 server/data/enhanced_knowledge_base.db \
  "PRAGMA table_info(prospects);"
```

### Issue: Redis keys not found

**Solution**: Verify Redis connection and key format:
```bash
redis-cli KEYS "user:*"
```

## Best Practices

1. **Always use optionalAuth middleware** for protected routes
2. **Never hardcode userId** - always extract from authentication
3. **Test with multiple users** to verify isolation
4. **Monitor database sizes** per user for scaling decisions
5. **Use Redis cache** for frequently accessed user data
6. **Log userId** in all operations for debugging
7. **Backup user data** regularly
8. **Document userId format** used in your system

## Future Enhancements

- [ ] User data export/import
- [ ] User data deletion (GDPR compliance)
- [ ] User storage quotas
- [ ] Cross-user data sharing (with permissions)
- [ ] User activity analytics
- [ ] Automated user data cleanup
- [ ] User data archival

## Support

For issues or questions:
1. Check logs for `[User: {userId}]` prefixed messages
2. Verify migration script ran successfully
3. Test with `x-user-id` header in development
4. Review middleware authentication setup
