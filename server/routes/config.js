const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { optionalAuth } = require('../middleware/userContext');

/**
 * GET /api/config/current
 * Get current user configuration (SMTP, Website Analysis, Campaign Settings)
 */
router.get('/current', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    console.log(`🔧 [CONFIG] Loading config for user: ${userId}`);

    // Get config from database
    const config = await db.getUserConfig(userId);

    // Provide default values if none exist
    const response = {
      success: true,
      smtp: config.smtp || getDefaultSmtpConfig(),
      website: config.website || getDefaultWebsiteConfig(),
      campaign: config.campaign || getDefaultCampaignConfig()
    };

    console.log(`✅ [CONFIG] Config loaded for user: ${userId}`);
    res.json(response);
  } catch (error) {
    console.error('❌ [CONFIG] Failed to load config:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      // Still provide defaults on error
      smtp: getDefaultSmtpConfig(),
      website: getDefaultWebsiteConfig(),
      campaign: getDefaultCampaignConfig()
    });
  }
});

/**
 * POST /api/config/update
 * Update user configuration
 */
router.post('/update', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    const { smtp, website, campaign } = req.body;

    console.log(`💾 [CONFIG] Saving config for user: ${userId}`);
    console.log(`   - SMTP: ${smtp ? 'provided' : 'not provided'}`);
    console.log(`   - Website: ${website ? 'provided' : 'not provided'}`);
    console.log(`   - Campaign: ${campaign ? 'provided' : 'not provided'}`);

    // Save to database
    await db.saveUserConfig(userId, { smtp, website, campaign });

    console.log(`✅ [CONFIG] Config saved successfully for user: ${userId}`);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      userId
    });
  } catch (error) {
    console.error('❌ [CONFIG] Failed to save config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Default SMTP Configuration
 */
function getDefaultSmtpConfig() {
  return {
    name: '',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    senderName: '',
    senderEmail: '',
    companyName: ''
  };
}

/**
 * Default Website Analysis Configuration
 */
function getDefaultWebsiteConfig() {
  return {
    targetWebsite: '',
    businessName: '',
    productType: '',
    businessIntro: ''
  };
}

/**
 * Default Campaign Configuration
 */
function getDefaultCampaignConfig() {
  return {
    defaultProspectCount: 10,
    searchStrategy: 'balanced', // 'aggressive', 'balanced', 'conservative'
    emailFrequency: 'daily', // 'hourly', 'daily', 'weekly'
    followUpEnabled: true,
    followUpDays: 3
  };
}

module.exports = router;
