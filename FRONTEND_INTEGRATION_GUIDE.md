# Frontend Integration Guide - Multi-Tenant Support

## Overview

This guide explains how to integrate multi-tenant authentication into your React frontend.

---

## Quick Start

### 1. Import the API Client

Replace all direct `fetch` calls with the authenticated API client:

```javascript
// Old way (no authentication)
const response = await fetch('/api/agent/clients');

// New way (with authentication)
import { apiGet } from '../utils/apiClient';
const data = await apiGet('/api/agent/clients');
```

### 2. Add Dev User Switcher (Development Only)

Add the DevUserSwitcher component to your main App component:

```javascript
// In App.jsx or main layout
import DevUserSwitcher from './components/DevUserSwitcher';

function App() {
  return (
    <div>
      {/* Your app content */}

      {/* Dev user switcher (only shows in development) */}
      <DevUserSwitcher />
    </div>
  );
}
```

---

## API Client Usage

### Basic Operations

```javascript
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../utils/apiClient';

// GET request
const clients = await apiGet('/api/agent/clients');

// POST request
const result = await apiPost('/api/agent/config', {
  campaignGoal: 'partnership',
  targetWebsite: 'https://example.com'
});

// PATCH request
await apiPatch(`/api/agent/clients/${clientId}`, {
  status: 'contacted'
});

// DELETE request
await apiDelete(`/api/agent/clients/${clientId}`);
```

### Error Handling

```javascript
import { apiGet } from '../utils/apiClient';

try {
  const data = await apiGet('/api/agent/clients');
  console.log('Clients:', data);
} catch (error) {
  if (error.message.includes('Authentication required')) {
    // Redirect to login
    window.location.href = '/login';
  } else {
    console.error('API error:', error);
  }
}
```

### Using Raw Request Method

For more control:

```javascript
import { apiRequest } from '../utils/apiClient';

const response = await apiRequest('/api/agent/clients', {
  method: 'GET',
  headers: {
    'X-Custom-Header': 'value'
  }
});

const data = await response.json();
```

---

## Migration Examples

### Example 1: Workflow Dashboard

**Before:**
```javascript
const fetchWorkflowStatus = async () => {
  const response = await fetch('/api/workflow/status');
  const data = await response.json();
  setWorkflowState(data.data);
};
```

**After:**
```javascript
import { apiGet } from '../utils/apiClient';

const fetchWorkflowStatus = async () => {
  const data = await apiGet('/api/workflow/status');
  setWorkflowState(data.data);
};
```

### Example 2: Starting a Campaign

**Before:**
```javascript
const startCampaign = async () => {
  const response = await fetch('/api/workflow/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignConfig)
  });

  const result = await response.json();
  return result;
};
```

**After:**
```javascript
import { apiPost } from '../utils/apiClient';

const startCampaign = async () => {
  const result = await apiPost('/api/workflow/start', campaignConfig);
  return result;
};
```

### Example 3: Component with Multiple API Calls

```javascript
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../utils/apiClient';

const ClientsPanel = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/agent/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (clientId, updates) => {
    try {
      await apiPost(`/api/agent/clients/${clientId}`, updates);
      await loadClients(); // Refresh list
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {clients.map(client => (
            <li key={client.id}>{client.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientsPanel;
```

---

## Development Testing

### Setting Test User ID

Use the DevUserSwitcher component or programmatically:

```javascript
import { setDevUserId } from '../utils/apiClient';

// Set user ID
setDevUserId('user_a');

// Clear user ID (use anonymous)
setDevUserId(null);
```

### Testing Multi-User Isolation

1. **Open two browser windows/tabs**
2. **Window 1:** Set user to `user_a` using DevUserSwitcher
3. **Window 2:** Set user to `user_b` using DevUserSwitcher
4. **Test:** Create data in Window 1, verify it doesn't appear in Window 2

### Testing with Browser DevTools

```javascript
// In browser console:

// Check current user
localStorage.getItem('dev_user_id');

// Change user
localStorage.setItem('dev_user_id', 'user_test');
location.reload();

// Use anonymous
localStorage.removeItem('dev_user_id');
location.reload();
```

---

## Production Setup (Clerk)

### 1. Install Clerk

```bash
npm install @clerk/clerk-react
```

### 2. Configure Clerk Provider

```javascript
// In main.jsx or App.jsx
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Your app */}
    </ClerkProvider>
  );
}
```

### 3. Add Sign In/Sign Up

```javascript
import { SignIn, SignUp, UserButton } from '@clerk/clerk-react';

function AuthPage() {
  return (
    <div>
      <SignIn />
      {/* or */}
      <SignUp />
    </div>
  );
}

// In header
function Header() {
  return (
    <header>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
```

### 4. Protected Routes

```javascript
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 5. Display User Info

```javascript
import { useUser } from '@clerk/clerk-react';

function UserProfile() {
  const { user } = useUser();

  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      <p>User ID: {user?.id}</p>
    </div>
  );
}
```

---

## API Client Behavior

### Authentication Priority

The API client checks for authentication in this order:

1. **Clerk Authentication** (Production)
   - Looks for `window.Clerk.session`
   - Extracts token automatically
   - Sends as `Authorization: Bearer <token>`

2. **Development User ID** (Development)
   - Checks `localStorage.getItem('dev_user_id')`
   - Sends as `x-user-id: <userId>`

3. **Anonymous User** (Fallback)
   - Uses `x-user-id: anonymous`

### Automatic Header Injection

The API client automatically adds:

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>', // OR
  'x-user-id': '<userId>'
}
```

---

## Troubleshooting

### Issue: API calls not authenticated

**Check:**
```javascript
// In browser console
localStorage.getItem('dev_user_id');
// Should return your test user ID

// Check if Clerk is loaded
window.Clerk;
// Should be defined in production
```

**Solution:**
- Development: Use DevUserSwitcher or set `dev_user_id` in localStorage
- Production: Ensure Clerk is properly configured

### Issue: User sees another user's data

**Check:**
- Network tab in DevTools
- Verify `x-user-id` or `Authorization` header is being sent
- Check backend logs for `[User: {userId}]` messages

**Solution:**
- Clear localStorage and set correct user ID
- Verify Clerk session is active

### Issue: 401 Unauthorized errors

**Check:**
- Is Clerk session active? (production)
- Is dev user ID set? (development)

**Solution:**
```javascript
import { isAuthenticated } from '../utils/apiClient';

const authed = await isAuthenticated();
if (!authed) {
  // Redirect to login
}
```

---

## Best Practices

### 1. Use API Client Consistently

❌ **Don't:**
```javascript
fetch('/api/agent/clients'); // Missing authentication
```

✅ **Do:**
```javascript
import { apiGet } from '../utils/apiClient';
apiGet('/api/agent/clients'); // Automatic authentication
```

### 2. Handle Errors Gracefully

```javascript
const loadData = async () => {
  try {
    const data = await apiGet('/api/data');
    setData(data);
  } catch (error) {
    if (error.message.includes('Authentication required')) {
      // Redirect to login
      navigate('/login');
    } else {
      // Show error message
      setError(error.message);
    }
  }
};
```

### 3. Test with Multiple Users

Always test your features with different users:

```javascript
// Test scenario
1. Login as user_a
2. Create a campaign
3. Logout
4. Login as user_b
5. Verify user_b cannot see user_a's campaign
```

### 4. Log User Context

For debugging:

```javascript
import { getCurrentUserId } from '../utils/apiClient';

const userId = await getCurrentUserId();
console.log('Operating as user:', userId);
```

---

## Complete Example: Dashboard Component

```javascript
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, getCurrentUserId } from '../utils/apiClient';
import DevUserSwitcher from '../components/DevUserSwitcher';

const Dashboard = () => {
  const [userId, setUserId] = useState('');
  const [clients, setClients] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);

      // Load user's data in parallel
      const [clientsData, statusData] = await Promise.all([
        apiGet('/api/agent/clients'),
        apiGet('/api/workflow/status')
      ]);

      setClients(clientsData);
      setWorkflowStatus(statusData.data);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async () => {
    try {
      await apiPost('/api/workflow/start', {
        targetWebsite: 'https://example.com',
        campaignGoal: 'partnership'
      });

      // Reload dashboard
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={loadDashboard}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* User info */}
      <div className="user-info">
        <p>Logged in as: <strong>{userId}</strong></p>
      </div>

      {/* Clients */}
      <div className="clients-section">
        <h2>My Clients ({clients.length})</h2>
        <ul>
          {clients.map(client => (
            <li key={client.id}>{client.name}</li>
          ))}
        </ul>
      </div>

      {/* Workflow */}
      <div className="workflow-section">
        <h2>Workflow Status</h2>
        <p>Status: {workflowStatus?.currentStep || 'Not started'}</p>
        <button onClick={startWorkflow}>Start Workflow</button>
      </div>

      {/* Dev tools */}
      <DevUserSwitcher />
    </div>
  );
};

export default Dashboard;
```

---

## Checklist

- [ ] Install `@clerk/clerk-react` for production
- [ ] Replace all `fetch` calls with `apiClient` methods
- [ ] Add `DevUserSwitcher` component to main layout
- [ ] Test with multiple users in development
- [ ] Configure Clerk provider in production
- [ ] Add protected routes
- [ ] Test authentication flow
- [ ] Verify data isolation

---

## Next Steps

1. **Run migration:** `node server/scripts/migrate-to-multi-tenant.js`
2. **Update fetch calls:** Replace with API client
3. **Test locally:** Use DevUserSwitcher
4. **Deploy:** Configure Clerk in production
5. **Monitor:** Check logs for user-specific operations

---

## Support

For issues:
- Check browser console for authentication errors
- Verify network requests include auth headers
- Check backend logs for `[User: {userId}]` messages
- Review `MULTI_TENANT_USAGE.md` for backend details
