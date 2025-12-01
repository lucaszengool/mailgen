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

  try {
    // Check if Clerk is available (production)
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 🔥 CRITICAL: Also include user ID in x-user-id header for backend compatibility
      if (window.Clerk.user && window.Clerk.user.id) {
        headers['x-user-id'] = window.Clerk.user.id;
        console.log(`✅ Using Clerk user ID: ${window.Clerk.user.id}`);
        return headers;
      }
    }
  } catch (error) {
    console.warn('⚠️ Clerk authentication not available:', error.message);
  }

  // Fallback: Check for development user ID in localStorage (for local dev only)
  const devUserId = localStorage.getItem('dev_user_id');
  if (devUserId && devUserId !== 'demo' && devUserId !== 'anonymous') {
    headers['x-user-id'] = devUserId;
    console.log(`✅ Using development user ID: ${devUserId}`);
    return headers;
  }

  // 🔥 NO MORE ANONYMOUS FALLBACK - throw error if not authenticated
  console.error('❌ No authentication available - user must be signed in');
  // Don't set anonymous - let the backend reject it
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
 * Get current user ID - returns null if not authenticated
 * 🔥 NO MORE ANONYMOUS FALLBACK
 */
export const getCurrentUserId = async () => {
  try {
    // Try Clerk first
    if (window.Clerk && window.Clerk.user) {
      return window.Clerk.user.id;
    }
  } catch (error) {
    console.warn('Could not get Clerk user ID:', error);
  }

  // Fallback to dev user ID (for local development only)
  const devUserId = localStorage.getItem('dev_user_id');
  if (devUserId && devUserId !== 'demo' && devUserId !== 'anonymous') {
    return devUserId;
  }

  // 🔥 Return null instead of 'anonymous' - caller must handle auth requirement
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
