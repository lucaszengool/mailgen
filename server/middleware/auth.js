/**
 * Optional Authentication Middleware
 * Allows requests to proceed with or without authentication
 * Sets req.userId if user is authenticated, otherwise uses 'anonymous'
 */

const optionalAuth = (req, res, next) => {
  // For now, all users are anonymous
  // TODO: Implement proper authentication when user system is added
  req.userId = 'anonymous';
  next();
};

module.exports = { optionalAuth };
