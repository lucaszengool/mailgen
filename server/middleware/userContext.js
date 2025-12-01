/**
 * User Context Middleware
 * Extracts authenticated user information from Clerk and adds it to req.user
 * For multi-tenant data isolation
 *
 * 🔥 IMPORTANT: No demo/anonymous users allowed - authentication is REQUIRED
 */

const { clerkClient } = require('@clerk/express');

/**
 * Middleware to extract and validate user from Clerk authentication
 * Adds req.userId for easy access throughout the application
 */
const extractUserContext = async (req, res, next) => {
  try {
    // Get auth object from Clerk middleware
    const { userId, sessionId } = req.auth || {};

    // Also check for x-user-id header (from frontend)
    const headerUserId = req.headers['x-user-id'];

    // If no userId, this is an unauthenticated request
    if (!userId && !headerUserId) {
      req.userId = null;
      req.isAuthenticated = false;
      return next();
    }

    // Set user context - prefer Clerk auth over header
    req.userId = userId || headerUserId;
    req.sessionId = sessionId;
    req.isAuthenticated = true;

    // 🔥 Reject demo/anonymous users
    if (req.userId === 'demo' || req.userId === 'anonymous') {
      req.userId = null;
      req.isAuthenticated = false;
      console.log(`⚠️ Rejected demo/anonymous user - auth required`);
      return next();
    }

    // Try to get user email for better tracking
    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        req.userEmail = user.emailAddresses?.[0]?.emailAddress || null;
      } catch (e) {
        // Ignore - user email is optional
      }
    }

    console.log(`🔐 Authenticated request - User: ${req.userId}`);

    next();
  } catch (error) {
    console.error('❌ Error extracting user context:', error);
    req.userId = null;
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 * 🔥 NO demo/anonymous fallback
 */
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in to continue.',
      requiresAuth: true
    });
  }

  // Double-check for demo/anonymous
  if (req.userId === 'demo' || req.userId === 'anonymous') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Demo mode is not supported.',
      requiresAuth: true
    });
  }

  next();
};

/**
 * Middleware for optional authentication (backwards compatibility)
 * 🔥 CHANGED: No longer falls back to 'demo' - leaves userId as null if not authenticated
 */
const optionalAuth = (req, res, next) => {
  // If no userId from Clerk, check for x-user-id header
  if (!req.userId) {
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && headerUserId !== 'anonymous' && headerUserId !== 'demo') {
      req.userId = headerUserId;
      req.isAuthenticated = true;
      console.log(`📧 Using x-user-id header: ${headerUserId}`);
    } else {
      // 🔥 NO MORE DEMO FALLBACK - leave as null
      req.userId = null;
      req.isAuthenticated = false;
      console.log('⚠️ No authentication - userId is null (no demo fallback)');
    }
  }
  next();
};

/**
 * Middleware to strictly require authentication for protected routes
 * 🔥 NEW: Use this for all workflow/campaign operations
 */
const strictAuth = (req, res, next) => {
  // First try to get auth from Clerk
  const { userId } = req.auth || {};
  const headerUserId = req.headers['x-user-id'];

  const effectiveUserId = userId || headerUserId;

  // Reject if no user or demo/anonymous
  if (!effectiveUserId || effectiveUserId === 'demo' || effectiveUserId === 'anonymous') {
    console.log(`🚫 [strictAuth] Rejected request - no valid userId`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please sign in to access this feature.',
      requiresAuth: true,
      redirectTo: '/'
    });
  }

  req.userId = effectiveUserId;
  req.isAuthenticated = true;
  next();
};

module.exports = {
  extractUserContext,
  requireAuth,
  optionalAuth,
  strictAuth
};
