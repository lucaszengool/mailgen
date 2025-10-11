const express = require('express');
const router = express.Router();

/**
 * Gmail OAuth Flow
 * Redirects user to Google's OAuth consent page for email access
 */
router.get('/gmail', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/gmail/callback`;
  const scope = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://mail.google.com/'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

/**
 * Gmail OAuth Callback
 * Handles the OAuth response from Google
 */
router.get('/gmail/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error)}`);
  }

  try {
    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/gmail/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    // Store tokens securely (you should encrypt these)
    // For now, we'll pass them to the settings page
    const tokenData = encodeURIComponent(JSON.stringify({
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    }));

    res.redirect(`/settings?oauth=success&tokens=${tokenData}`);
  } catch (error) {
    console.error('Gmail OAuth error:', error);
    res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Outlook/Hotmail OAuth Flow
 */
router.get('/outlook', (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/outlook/callback`;
  const scope = [
    'https://outlook.office.com/SMTP.Send',
    'https://outlook.office.com/Mail.Read',
    'offline_access'
  ].join(' ');

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_mode=query`;

  res.redirect(authUrl);
});

/**
 * Outlook OAuth Callback
 */
router.get('/outlook/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error)}`);
  }

  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/outlook/callback`;

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    const tokenData = encodeURIComponent(JSON.stringify({
      provider: 'outlook',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    }));

    res.redirect(`/settings?oauth=success&tokens=${tokenData}`);
  } catch (error) {
    console.error('Outlook OAuth error:', error);
    res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Yahoo OAuth Flow
 */
router.get('/yahoo', (req, res) => {
  const clientId = process.env.YAHOO_CLIENT_ID || 'YOUR_YAHOO_CLIENT_ID';
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/yahoo/callback`;

  const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=mail-w`;

  res.redirect(authUrl);
});

/**
 * Yahoo OAuth Callback
 */
router.get('/yahoo/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error)}`);
  }

  try {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/yahoo/callback`;

    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    const tokenData = encodeURIComponent(JSON.stringify({
      provider: 'yahoo',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    }));

    res.redirect(`/settings?oauth=success&tokens=${tokenData}`);
  } catch (error) {
    console.error('Yahoo OAuth error:', error);
    res.redirect(`/settings?oauth=error&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;
