/**
 * Settings API Routes - Handle all user configuration updates
 */

const express = require('express');
const router = express.Router();

// In-memory settings storage (in production, use database)
let userSettings = {
  smtp: {},
  campaign: {},
  targeting: {},
  templates: {},
  ai: {},
  notifications: {},
  websiteAnalysis: {}
};

/**
 * GET /api/settings - Retrieve all user settings
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: userSettings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取设置失败'
    });
  }
});

/**
 * POST /api/settings/smtp - Update SMTP configuration
 */
router.post('/smtp', async (req, res) => {
  try {
    const { smtpConfig, timestamp } = req.body;
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';

    console.log(`📧 [User: ${userId}] 更新SMTP配置:`, smtpConfig);

    // Validate required fields
    const required = ['host', 'username', 'password'];
    const missing = required.filter(field => !smtpConfig[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必需字段: ${missing.join(', ')}`
      });
    }

    // Store SMTP configuration in memory (for backwards compatibility)
    userSettings.smtp = {
      ...smtpConfig,
      updatedAt: timestamp || new Date().toISOString()
    };

    // 💾 CRITICAL: Save SMTP config to database for user persistence
    try {
      const db = require('../models/database');
      await db.saveSMTPConfig(smtpConfig, userId);
      console.log(`✅ [User: ${userId}] SMTP config saved to database successfully`);
    } catch (dbError) {
      console.error(`❌ [User: ${userId}] Failed to save SMTP config to database:`, dbError);
      // Continue anyway - at least we have it in memory
    }

    // 🔥 FIX: Clear SMTP transporter cache when config is updated
    // This ensures new credentials are used immediately
    try {
      // 🔥 CRITICAL FIX: Try user-specific agent first, then global
      const workflowRoute = require('./workflow');
      let agent = null;

      // Check for user-specific agents (all campaigns for this user)
      const activeAgents = workflowRoute.listActiveAgents ? workflowRoute.listActiveAgents() : [];
      const userAgents = activeAgents.filter(a => a.userId === userId);

      if (userAgents.length > 0) {
        // Clear SMTP cache on all user's agents
        for (const agentInfo of userAgents) {
          const userAgent = workflowRoute.getUserCampaignAgent(agentInfo.userId, agentInfo.campaignId);
          if (userAgent && userAgent.clearSMTPCache) {
            userAgent.clearSMTPCache();
            console.log(`✅ [User: ${userId}] SMTP cache cleared on agent for campaign ${agentInfo.campaignId}`);
          }
        }
      }

      // Also clear on global agent for good measure
      agent = req.app.locals.langGraphAgent;
      if (agent && agent.clearSMTPCache) {
        agent.clearSMTPCache();
        console.log(`✅ [User: ${userId}] SMTP cache cleared on global agent`);
      }
    } catch (cacheError) {
      console.error(`⚠️ [User: ${userId}] Failed to clear SMTP cache:`, cacheError.message);
    }

    // Notify WebSocket manager about config update
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'smtp',
        data: userSettings.smtp
      });
    }

    console.log(`✅ [User: ${userId}] SMTP配置已保存并广播更新`);

    // 🔥 AUTO-START IMAP MONITORING for email tracking
    try {
      const IMAPEmailTracker = require('../services/IMAPEmailTracker');

      // Check if IMAP tracker already exists
      if (!req.app.locals.imapTracker) {
        console.log('📬 Starting IMAP monitoring automatically...');

        const imapTracker = new IMAPEmailTracker();

        // Convert SMTP config to IMAP config
        const imapConnection = {
          user: smtpConfig.username,
          password: smtpConfig.password,
          host: smtpConfig.host.replace('smtp', 'imap'),
          port: 993
        };

        await imapTracker.connect(imapConnection);
        await imapTracker.startMonitoring(5); // Check every 5 minutes

        // Store globally so it persists
        req.app.locals.imapTracker = imapTracker;

        console.log('✅ IMAP monitoring started successfully');
      } else {
        console.log('📬 IMAP monitoring already active');
      }
    } catch (imapError) {
      console.error('⚠️ Failed to start IMAP monitoring:', imapError.message);
      // Continue anyway - IMAP is optional
    }

    res.json({
      success: true,
      message: 'SMTP配置更新成功',
      data: userSettings.smtp,
      imapMonitoring: req.app.locals.imapTracker ? 'active' : 'inactive'
    });

  } catch (error) {
    console.error('保存SMTP配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存SMTP配置失败'
    });
  }
});

/**
 * POST /api/settings/campaign - Update campaign configuration
 */
router.post('/campaign', (req, res) => {
  try {
    const { campaignConfig } = req.body;
    
    console.log('🎯 更新活动配置:', campaignConfig);
    
    userSettings.campaign = {
      ...campaignConfig,
      updatedAt: new Date().toISOString()
    };
    
    // Notify WebSocket manager
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'campaign',
        data: userSettings.campaign
      });
    }
    
    res.json({
      success: true,
      message: '活动配置更新成功',
      data: userSettings.campaign
    });
    
  } catch (error) {
    console.error('保存活动配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存活动配置失败'
    });
  }
});

/**
 * POST /api/settings/targeting - Update targeting configuration
 */
router.post('/targeting', (req, res) => {
  try {
    const { targetingConfig } = req.body;
    
    console.log('🎯 更新目标配置:', targetingConfig);
    
    userSettings.targeting = {
      ...targetingConfig,
      updatedAt: new Date().toISOString()
    };
    
    // Notify WebSocket manager
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated', 
        category: 'targeting',
        data: userSettings.targeting
      });
    }
    
    res.json({
      success: true,
      message: '目标配置更新成功',
      data: userSettings.targeting
    });
    
  } catch (error) {
    console.error('保存目标配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存目标配置失败'
    });
  }
});

/**
 * POST /api/settings/templates - Update template preferences  
 */
router.post('/templates', (req, res) => {
  try {
    const { templateConfig } = req.body;
    
    console.log('📧 更新模板配置:', templateConfig);
    
    userSettings.templates = {
      ...templateConfig,
      updatedAt: new Date().toISOString()
    };
    
    // Notify WebSocket manager
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'templates', 
        data: userSettings.templates
      });
    }
    
    res.json({
      success: true,
      message: '模板配置更新成功',
      data: userSettings.templates
    });
    
  } catch (error) {
    console.error('保存模板配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存模板配置失败'
    });
  }
});

/**
 * POST /api/settings/ai - Update AI model configuration
 */
router.post('/ai', (req, res) => {
  try {
    const { aiConfig } = req.body;
    
    console.log('🤖 更新AI配置:', aiConfig);
    
    userSettings.ai = {
      ...aiConfig,
      updatedAt: new Date().toISOString()
    };
    
    // Notify WebSocket manager
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'ai',
        data: userSettings.ai
      });
    }
    
    res.json({
      success: true,
      message: 'AI配置更新成功',
      data: userSettings.ai
    });
    
  } catch (error) {
    console.error('保存AI配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存AI配置失败'
    });
  }
});

/**
 * GET /api/settings/website-analysis - Get website analysis from user's agent config
 */
router.get('/website-analysis', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const UserStorageService = require('../services/UserStorageService');
    const storage = new UserStorageService(userId);

    console.log(`🌐 [User: ${userId}] Loading website analysis settings...`);

    // Get config from user storage (same place the wizard saves it)
    const config = await storage.getConfig();

    if (config && config.websiteAnalysis) {
      console.log(`✅ [User: ${userId}] Found website analysis:`, {
        businessName: config.websiteAnalysis.businessName,
        productType: config.websiteAnalysis.productType,
        hasLogo: !!config.websiteAnalysis.logo,
        benchmarkBrands: config.websiteAnalysis.benchmarkBrands?.length || 0,
        sellingPoints: config.websiteAnalysis.sellingPoints?.length || 0,
        audiences: config.websiteAnalysis.audiences?.length || 0,
        techStack: config.websiteAnalysis.techStack?.length || 0
      });

      res.json({
        success: true,
        data: {
          targetWebsite: config.targetWebsite || config.websiteAnalysis.url || '',
          businessName: config.websiteAnalysis.businessName || '',
          logo: config.websiteAnalysis.logo || '',
          productType: config.websiteAnalysis.productType || config.websiteAnalysis.industry || '',
          benchmarkBrands: config.websiteAnalysis.benchmarkBrands || [],
          businessIntro: config.websiteAnalysis.businessIntro || config.websiteAnalysis.valueProposition || '',
          sellingPoints: config.websiteAnalysis.sellingPoints || [],
          audiences: config.websiteAnalysis.audiences || [],
          social: config.websiteAnalysis.social || {},
          techStack: config.websiteAnalysis.techStack || [],
          contactInfo: config.websiteAnalysis.contactInfo || {}
        }
      });
    } else {
      console.log(`⚠️ [User: ${userId}] No website analysis found in config`);
      res.json({
        success: true,
        data: {
          targetWebsite: '',
          businessName: '',
          logo: '',
          productType: '',
          benchmarkBrands: [],
          businessIntro: '',
          sellingPoints: [],
          audiences: [],
          social: {},
          techStack: [],
          contactInfo: {}
        }
      });
    }
  } catch (error) {
    console.error('获取网站分析配置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取网站分析配置失败'
    });
  }
});

/**
 * POST /api/settings/website-analysis - Update website analysis configuration
 */
router.post('/website-analysis', async (req, res) => {
  try {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const UserStorageService = require('../services/UserStorageService');
    const storage = new UserStorageService(userId);

    // Accept both formats: direct fields or wrapped in websiteAnalysisConfig
    const websiteData = req.body.websiteAnalysisConfig || req.body;

    console.log('🌐 更新网站分析配置:', {
      userId,
      businessName: websiteData.businessName,
      productType: websiteData.productType,
      hasLogo: !!websiteData.logo,
      benchmarkBrands: websiteData.benchmarkBrands?.length || 0,
      sellingPoints: websiteData.sellingPoints?.length || 0,
      audiences: websiteData.audiences?.length || 0
    });

    // Get existing config
    let config = await storage.getConfig() || {};

    // Update websiteAnalysis in the config
    config.websiteAnalysis = {
      ...config.websiteAnalysis,
      businessName: websiteData.businessName,
      logo: websiteData.logo,
      productType: websiteData.productType,
      industry: websiteData.productType, // Also save as industry for compatibility
      benchmarkBrands: websiteData.benchmarkBrands || [],
      businessIntro: websiteData.businessIntro,
      valueProposition: websiteData.businessIntro, // Also save as valueProposition
      sellingPoints: websiteData.sellingPoints || [],
      audiences: websiteData.audiences || [],
      social: websiteData.social || {},
      techStack: websiteData.techStack || [],
      contactInfo: websiteData.contactInfo || {},
      updatedAt: new Date().toISOString()
    };

    // Also update targetWebsite if provided
    if (websiteData.targetWebsite) {
      config.targetWebsite = websiteData.targetWebsite;
    }

    // Save updated config
    await storage.saveConfig(config);
    console.log(`✅ [User: ${userId}] Website analysis saved to user config`);

    // Also update in-memory settings for backwards compatibility
    userSettings.websiteAnalysis = {
      ...websiteData,
      updatedAt: new Date().toISOString()
    };

    // Notify WebSocket manager
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'websiteAnalysis',
        data: userSettings.websiteAnalysis
      });
    }

    res.json({
      success: true,
      message: '网站分析配置更新成功',
      data: config.websiteAnalysis
    });

  } catch (error) {
    console.error('保存网站分析配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存网站分析配置失败'
    });
  }
});

/**
 * POST /api/settings/bulk - Update multiple configuration sections at once
 */
router.post('/bulk', (req, res) => {
  try {
    const { settings } = req.body;
    
    console.log('🔄 批量更新设置:', Object.keys(settings));
    
    // Update each section that's provided
    Object.keys(settings).forEach(section => {
      if (userSettings.hasOwnProperty(section)) {
        userSettings[section] = {
          ...userSettings[section],
          ...settings[section],
          updatedAt: new Date().toISOString()
        };
      }
    });
    
    // Broadcast all updates
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_bulk_updated',
        data: userSettings
      });
    }
    
    res.json({
      success: true,
      message: '批量配置更新成功',
      data: userSettings,
      updatedSections: Object.keys(settings)
    });
    
  } catch (error) {
    console.error('批量保存设置失败:', error);
    res.status(500).json({
      success: false,
      error: '批量保存设置失败'
    });
  }
});

module.exports = router;