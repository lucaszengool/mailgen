/**
 * Gmail OAuth Routes
 * Handles Google OAuth 2.0 flow for Gmail access
 */

const express = require('express');
const router = express.Router();
const GmailOAuthService = require('../services/GmailOAuthService');
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth } = require('../middleware/userContext');

/**
 * Step 1: Initiate OAuth flow
 * GET /api/gmail-oauth/authorize
 */
router.get('/authorize', optionalAuth, (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    console.log(`🔐 Starting OAuth flow for user: ${userId}`);

    const authUrl = GmailOAuthService.getAuthUrl(userId);

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to grant Gmail access'
    });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Step 2: Handle OAuth callback from Google
 * GET /api/gmail-oauth/callback?code=xxx&state=userId
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state || 'anonymous';

    if (!code) {
      throw new Error('No authorization code provided');
    }

    console.log(`🔄 Processing OAuth callback for user: ${userId}`);

    // Exchange code for tokens
    const tokens = await GmailOAuthService.getTokensFromCode(code);

    // Save tokens to user storage
    const userStorage = new UserStorageService(userId);
    await userStorage.saveOAuthTokens(tokens);

    console.log(`✅ OAuth tokens saved for user: ${userId} (${tokens.email})`);

    // Redirect to frontend with success message
    // Detect frontend URL from environment or request origin
    const frontendUrl = process.env.FRONTEND_URL ||
                       (req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');

    res.redirect(`${frontendUrl}/settings?oauth=success&email=${encodeURIComponent(tokens.email)}`);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL ||
                       (req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');

    res.redirect(`${frontendUrl}/settings?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Check OAuth status for current user
 * GET /api/gmail-oauth/status
 */
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    const userStorage = new UserStorageService(userId);

    const hasOAuth = await userStorage.hasOAuthTokens();
    let oauthInfo = null;

    if (hasOAuth) {
      const tokens = await userStorage.getOAuthTokens();
      oauthInfo = {
        email: tokens.email,
        connectedAt: tokens.savedAt,
        hasRefreshToken: !!tokens.refresh_token
      };
    }

    res.json({
      success: true,
      hasOAuth,
      oauthInfo
    });

  } catch (error) {
    console.error('❌ Error checking OAuth status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Disconnect Gmail (revoke OAuth tokens)
 * POST /api/gmail-oauth/disconnect
 */
router.post('/disconnect', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    console.log(`🔌 Disconnecting Gmail for user: ${userId}`);

    await GmailOAuthService.revokeTokens(userId);

    res.json({
      success: true,
      message: 'Gmail disconnected successfully'
    });

  } catch (error) {
    console.error('❌ Error disconnecting Gmail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test OAuth tokens (verify they work)
 * GET /api/gmail-oauth/test
 */
router.get('/test', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    console.log(`🧪 Testing OAuth tokens for user: ${userId}`);

    const accessToken = await GmailOAuthService.getValidAccessToken(userId);

    res.json({
      success: true,
      message: 'OAuth tokens are valid',
      hasAccessToken: !!accessToken
    });

  } catch (error) {
    console.error('❌ OAuth test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'OAuth tokens are invalid or expired'
    });
  }
});

module.exports = router;
