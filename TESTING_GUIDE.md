# Multi-Tenant Testing Guide

## Quick Test Instructions

### Prerequisites

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   # Or
   node index.js
   ```

2. **Verify Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Running the Test Suite

```bash
# Make test script executable (first time only)
chmod +x test-multi-tenant.sh

# Run all tests
./test-multi-tenant.sh
```

### Expected Output

```
🧪 Multi-Tenant Isolation Test Suite
====================================

=== Server Health Check ===
Test 1: Server is running
✓ PASSED

=== User A: Create Configuration ===
Test 2: User A creates config
✓ PASSED

=== User B: Create Configuration ===
Test 3: User B creates config
✓ PASSED

...

====================================
Test Summary
====================================
Total Tests: 18
Passed: 18
Failed: 0

✓ All tests passed!
Multi-tenant isolation is working correctly.
```

---

## Manual Testing

### Test Scenario 1: Configuration Isolation

```bash
# Create config for User A
curl -X POST http://localhost:3001/api/agent/config \
  -H "x-user-id: user_a" \
  -H "Content-Type: application/json" \
  -d '{"campaignGoal":"partnership","targetWebsite":"https://company-a.com"}'

# Create config for User B
curl -X POST http://localhost:3001/api/agent/config \
  -H "x-user-id: user_b" \
  -H "Content-Type: application/json" \
  -d '{"campaignGoal":"sales","targetWebsite":"https://company-b.com"}'

# Verify User A's config
curl http://localhost:3001/api/agent/config \
  -H "x-user-id: user_a"
# Should return: company-a.com

# Verify User B's config
curl http://localhost:3001/api/agent/config \
  -H "x-user-id: user_b"
# Should return: company-b.com
```

### Test Scenario 2: Workflow Isolation

```bash
# Start workflow for User A
curl -X POST http://localhost:3001/api/workflow/start \
  -H "x-user-id: user_a" \
  -H "Content-Type: application/json" \
  -d '{"targetWebsite":"https://company-a.com"}'

# Start workflow for User B
curl -X POST http://localhost:3001/api/workflow/start \
  -H "x-user-id: user_b" \
  -H "Content-Type: application/json" \
  -d '{"targetWebsite":"https://company-b.com"}'

# Check User A's workflow
curl http://localhost:3001/api/workflow/status \
  -H "x-user-id: user_a" | jq '.data.userId'
# Should return: "user_a"

# Check User B's workflow
curl http://localhost:3001/api/workflow/status \
  -H "x-user-id: user_b" | jq '.data.userId'
# Should return: "user_b"

# Pause User A's workflow
curl -X POST http://localhost:3001/api/workflow/pause \
  -H "x-user-id: user_a"

# Verify User B's workflow still running
curl http://localhost:3001/api/workflow/status \
  -H "x-user-id: user_b" | jq '.data.isRunning'
# Should return: true
```

### Test Scenario 3: Database Isolation

```bash
# Check database for user_id column
sqlite3 server/data/enhanced_knowledge_base.db \
  "PRAGMA table_info(prospects);"

# Expected output should include:
# user_id|TEXT|0||anonymous

# Query User A's prospects
sqlite3 server/data/enhanced_knowledge_base.db \
  "SELECT COUNT(*) FROM prospects WHERE user_id = 'user_a';"

# Query User B's prospects
sqlite3 server/data/enhanced_knowledge_base.db \
  "SELECT COUNT(*) FROM prospects WHERE user_id = 'user_b';"
```

### Test Scenario 4: Redis Isolation

```bash
# Check Redis keys for User A
redis-cli KEYS "user:user_a:*"

# Check Redis keys for User B
redis-cli KEYS "user:user_b:*"

# Verify keys are scoped
redis-cli GET "user:user_a:config"
redis-cli GET "user:user_b:config"
```

### Test Scenario 5: File Storage Isolation

```bash
# Check user directories
ls -la server/data/users/

# Should show:
# anonymous/
# user_a/
# user_b/

# Check User A's files
ls -la server/data/users/user_a/

# Check User B's files
ls -la server/data/users/user_b/
```

---

## Frontend Testing

### Using DevUserSwitcher Component

1. **Open the application in browser**
2. **Look for DevUserSwitcher in bottom-right corner**
3. **Switch to "User A"**
4. **Create some data (prospects, campaigns, etc.)**
5. **Switch to "User B"**
6. **Verify User B cannot see User A's data**

### Using Browser Console

```javascript
// Set user A
localStorage.setItem('dev_user_id', 'user_a');
location.reload();

// Create some data...

// Switch to user B
localStorage.setItem('dev_user_id', 'user_b');
location.reload();

// Verify isolation - data should be empty

// Check current user
localStorage.getItem('dev_user_id');
```

### Using Multiple Browser Windows

1. **Window 1:** Set to `user_a`
2. **Window 2:** Set to `user_b`
3. **Window 1:** Create a campaign
4. **Window 2:** Refresh and verify campaign doesn't appear
5. **Window 2:** Create a different campaign
6. **Window 1:** Refresh and verify only User A's campaign appears

---

## Testing Checklist

- [ ] Migration script runs successfully
- [ ] Database has user_id columns
- [ ] Database queries filter by user_id
- [ ] Redis keys are user-scoped
- [ ] File storage is user-specific
- [ ] API endpoints require authentication
- [ ] User A cannot see User B's data
- [ ] User A cannot modify User B's data
- [ ] Workflow states are isolated
- [ ] Configuration is isolated
- [ ] Clients/prospects are isolated
- [ ] Email campaigns are isolated
- [ ] Frontend DevUserSwitcher works
- [ ] Frontend API client sends auth headers

---

## Troubleshooting Tests

### Issue: Tests fail with "command not found: jq"

```bash
# Install jq (JSON processor)
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or run tests without jq
curl -s http://localhost:3001/api/agent/config \
  -H "x-user-id: user_a"
```

### Issue: Server not running

```bash
# Start server
cd server
npm run dev

# Verify server is running
curl http://localhost:3001/api/agent/status
```

### Issue: Redis connection failed

```bash
# Start Redis
redis-server

# Or install Redis
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### Issue: Database migration errors

```bash
# Re-run migration
node server/scripts/migrate-to-multi-tenant.js

# Or manually check database
sqlite3 server/data/enhanced_knowledge_base.db \
  "SELECT sql FROM sqlite_master WHERE name='prospects';"
```

---

## Performance Testing

### Load Test with Multiple Users

```bash
# Create 100 users making concurrent requests
for i in {1..100}; do
  curl -s -X POST http://localhost:3001/api/agent/config \
    -H "x-user-id: user_$i" \
    -H "Content-Type: application/json" \
    -d "{\"campaignGoal\":\"test\",\"targetWebsite\":\"https://example-$i.com\"}" &
done
wait

# Verify all configs are isolated
for i in {1..100}; do
  curl -s http://localhost:3001/api/agent/config \
    -H "x-user-id: user_$i" | grep "example-$i.com"
done
```

### Database Query Performance

```bash
# Check query performance with user_id index
sqlite3 server/data/enhanced_knowledge_base.db \
  "EXPLAIN QUERY PLAN SELECT * FROM prospects WHERE user_id = 'user_a';"

# Should use index: idx_prospects_user_id
```

---

## Security Testing

### Test 1: Cannot access other user's data

```bash
# Create data for User A
curl -X POST http://localhost:3001/api/agent/config \
  -H "x-user-id: user_a" \
  -H "Content-Type: application/json" \
  -d '{"campaignGoal":"secret","targetWebsite":"https://secret.com"}'

# Try to access as User B
curl http://localhost:3001/api/agent/config \
  -H "x-user-id: user_b"

# Should NOT return User A's data
```

### Test 2: Cannot modify other user's data

```bash
# Try to reset User A's workflow as User B
curl -X POST http://localhost:3001/api/workflow/reset \
  -H "x-user-id: user_b"

# Should only reset User B's workflow, not User A's
```

### Test 3: SQL Injection Protection

```bash
# Try SQL injection
curl http://localhost:3001/api/agent/config \
  -H "x-user-id: user_a' OR '1'='1"

# Should fail safely (user_id will be literal string)
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Multi-Tenant Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd server
          npm install

      - name: Run migration
        run: node server/scripts/migrate-to-multi-tenant.js

      - name: Start server
        run: |
          cd server
          npm run dev &
          sleep 5

      - name: Run tests
        run: ./test-multi-tenant.sh
```

---

## Test Results Documentation

### Example Test Run

```
Date: 2025-01-16
Server Version: 1.0.0
Tests Run: 18
Tests Passed: 18
Tests Failed: 0
Duration: 12.3s

All multi-tenant isolation tests passed successfully.
```

### Known Issues

None currently identified.

### Next Steps After Testing

1. Update frontend to use API client
2. Add Clerk authentication in production
3. Monitor logs for user-specific operations
4. Set up automated testing in CI/CD
5. Document any edge cases discovered

---

## Support

If tests fail:
1. Check server logs for errors
2. Verify database schema with `PRAGMA table_info(prospects)`
3. Check Redis connectivity with `redis-cli ping`
4. Review `MULTI_TENANT_USAGE.md` for implementation details
5. Check GitHub issues or create new one with test output
