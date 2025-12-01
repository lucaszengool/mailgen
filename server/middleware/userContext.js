/**
 * User Context Middleware
 * Extracts authenticated user information from Clerk and adds it to req.user
 * For multi-tenant data isolation
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

    // If no userId, this is an unauthenticated request
    if (!userId) {
      req.userId = null;
      req.isAuthenticated = false;
      return next();
    }

    // Set user context
    req.userId = userId;
    req.sessionId = sessionId;
    req.isAuthenticated = true;

    console.log(`🔐 Authenticated request - User: ${userId}`);

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
 */
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource'
    });
  }
  next();
};

/**
 * Middleware to optionally allow authentication
 * Sets req.userId from x-user-id header or 'demo' for unauthenticated users
 */
const optionalAuth = (req, res, next) => {
  // If no userId from Clerk, check for x-user-id header
  if (!req.userId) {
    const headerUserId = req.headers['x-user-id'];
    if (headerUserId && headerUserId !== 'anonymous') {
      req.userId = headerUserId;
      console.log(`📧 Using x-user-id header: ${headerUserId}`);
    } else {
      // Fallback to demo mode
      req.userId = 'demo';
      req.isDemo = true;
      console.log('⚠️ Demo mode - Using demo userId');
    }
  }
  next();
};

module.exports = {
  extractUserContext,
  requireAuth,
  optionalAuth
};
