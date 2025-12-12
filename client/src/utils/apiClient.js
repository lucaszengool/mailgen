/**
 * API Client with Multi-Tenant Support
 * Centralized API communication with automatic user authentication
 *
 * 🔥 IMPORTANT: No anonymous/demo users allowed - authentication is REQUIRED
 */

/**
 * Get authentication headers
 * Extracts user ID from Clerk - no fallback to anonymous
 */
const getAuthHeaders = async () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // 🔥 PRIORITY 1: Check localStorage for user ID (set by SimpleWorkflowDashboard when Clerk loads)
  // This is more reliable than window.Clerk as it persists across page refreshes
  const storedUserId = localStorage.getItem('userId') || localStorage.getItem('dev_user_id');
  if (storedUserId && storedUserId !== 'demo' && storedUserId !== 'anonymous') {
    headers['x-user-id'] = storedUserId;
    console.log(`✅ Using stored user ID: ${storedUserId}`);
  }

  // 🔥 PRIORITY 2: Try to get fresh token from Clerk if available
  try {
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Also update user ID from Clerk if available (most up-to-date)
      if (window.Clerk.user && window.Clerk.user.id) {
        headers['x-user-id'] = window.Clerk.user.id;
        // Keep localStorage in sync
        localStorage.setItem('userId', window.Clerk.user.id);
        console.log(`✅ Using Clerk user ID: ${window.Clerk.user.id}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Clerk authentication not available:', error.message);
  }

  // If we still don't have a user ID, log a warning but still return headers
  // The backend will handle unauthenticated requests appropriately
  if (!headers['x-user-id']) {
    console.warn('⚠️ No user ID available - API calls will be anonymous');
  }

  return headers;
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (url, options = {}) => {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.error('❌ Authentication failed');
      // Optionally trigger login flow
      throw new Error('Authentication required');
    }

    return response;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = async (url) => {
  const response = await apiRequest(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * POST request
 */
export const apiPost = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`POST ${url} failed: ${errorText}`);
  }

  return response.json();
};

/**
 * PUT request
 */
export const apiPut = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`PUT ${url} failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * PATCH request
 */
export const apiPatch = async (url, data) => {
  const response = await apiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`PATCH ${url} failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * DELETE request
 */
export const apiDelete = async (url) => {
  const response = await apiRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`DELETE ${url} failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Set development user ID (for testing without Clerk)
 */
export const setDevUserId = (userId) => {
  if (userId) {
    localStorage.setItem('dev_user_id', userId);
    console.log(`✅ Development user ID set to: ${userId}`);
  } else {
    localStorage.removeItem('dev_user_id');
    console.log('✅ Development user ID cleared');
  }
};

/**
 * Get current user ID - returns stored ID or null
 * Checks localStorage first (set by SimpleWorkflowDashboard), then Clerk
 */
export const getCurrentUserId = async () => {
  // 🔥 PRIORITY 1: Check localStorage (most reliable, set when Clerk loads in dashboard)
  const storedUserId = localStorage.getItem('userId') || localStorage.getItem('dev_user_id');
  if (storedUserId && storedUserId !== 'demo' && storedUserId !== 'anonymous') {
    return storedUserId;
  }

  // 🔥 PRIORITY 2: Try Clerk directly
  try {
    if (window.Clerk && window.Clerk.user) {
      const clerkUserId = window.Clerk.user.id;
      // Store it for future use
      localStorage.setItem('userId', clerkUserId);
      return clerkUserId;
    }
  } catch (error) {
    console.warn('Could not get Clerk user ID:', error);
  }

  // Return null if no user ID available
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    if (window.Clerk && window.Clerk.session) {
      return true;
    }
  } catch (error) {
    // Clerk not available
  }

  // Check for dev user ID
  return !!localStorage.getItem('dev_user_id');
};

// Export default object with all methods
export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  setDevUserId,
  getCurrentUserId,
  isAuthenticated,
};
