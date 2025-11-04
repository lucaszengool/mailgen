/**
 * Gmail OAuth Service
 * Handles Google OAuth 2.0 flow for Gmail access
 */

const { google } = require('googleapis');
const UserStorageService = require('./UserStorageService');

class GmailOAuthService {
  constructor() {
    // OAuth2 credentials from Google Cloud Console
    // TODO: User needs to create these in Google Cloud Console
    this.CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
    this.CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
    this.REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      console.warn('⚠️ Google OAuth credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET');
    }
  }

  /**
   * Create OAuth2 client
   */
  createOAuth2Client() {
    return new google.auth.OAuth2(
      this.CLIENT_ID,
      this.CLIENT_SECRET,
      this.REDIRECT_URI
    );
  }

  /**
   * Generate authorization URL for user to grant access
   */
  getAuthUrl(userId) {
    const oauth2Client = this.createOAuth2Client();

    // Generate the url that will be used for the consent dialog
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://mail.google.com/', // Full Gmail access for SMTP/IMAP
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      // Include user ID in state to identify user after OAuth callback
      state: userId,
      prompt: 'consent' // Force consent screen to get refresh token
    });

    console.log(`🔗 Generated OAuth URL for user ${userId}`);
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const oauth2Client = this.createOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('✅ OAuth tokens obtained:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date
      });

      // Get user email from Google
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        ...tokens,
        email: data.email
      };
    } catch (error) {
      console.error('❌ Error getting tokens from code:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('✅ Access token refreshed');
      return credentials;
    } catch (error) {
      console.error('❌ Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get valid access token for user (refresh if expired)
   */
  async getValidAccessToken(userId) {
    const userStorage = new UserStorageService(userId);
    const tokens = await userStorage.getOAuthTokens();

    if (!tokens) {
      throw new Error('No OAuth tokens found for user');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const expiryTime = tokens.expiry_date;
    const isExpired = !expiryTime || expiryTime - now < 5 * 60 * 1000;

    if (isExpired && tokens.refresh_token) {
      console.log(`🔄 Access token expired for user ${userId}, refreshing...`);
      const newTokens = await this.refreshAccessToken(tokens.refresh_token);

      // Save updated tokens
      await userStorage.saveOAuthTokens({
        ...newTokens,
        refresh_token: tokens.refresh_token, // Preserve refresh token
        email: tokens.email
      });

      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Get SMTP configuration using OAuth tokens
   */
  async getSMTPConfigWithOAuth(userId) {
    const userStorage = new UserStorageService(userId);
    const tokens = await userStorage.getOAuthTokens();

    if (!tokens) {
      return null;
    }

    // Get fresh access token
    const accessToken = await this.getValidAccessToken(userId);

    return {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: tokens.email,
        accessToken: accessToken,
        refreshToken: tokens.refresh_token,
        clientId: this.CLIENT_ID,
        clientSecret: this.CLIENT_SECRET
      }
    };
  }

  /**
   * Get IMAP configuration using OAuth tokens
   */
  async getIMAPConfigWithOAuth(userId) {
    const userStorage = new UserStorageService(userId);
    const tokens = await userStorage.getOAuthTokens();

    if (!tokens) {
      return null;
    }

    // Get fresh access token
    const accessToken = await this.getValidAccessToken(userId);

    return {
      user: tokens.email,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10000,
      xoauth2: accessToken // IMAP supports xoauth2
    };
  }

  /**
   * Revoke OAuth tokens (disconnect Gmail)
   */
  async revokeTokens(userId) {
    const userStorage = new UserStorageService(userId);
    const tokens = await userStorage.getOAuthTokens();

    if (!tokens) {
      return;
    }

    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    try {
      await oauth2Client.revokeCredentials();
      console.log(`🗑️ OAuth tokens revoked for user ${userId}`);
    } catch (error) {
      console.error('❌ Error revoking tokens:', error);
      // Continue anyway to clear local tokens
    }

    // Clear local tokens
    await userStorage.clearOAuthTokens();
  }
}

module.exports = new GmailOAuthService();
