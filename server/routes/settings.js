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
  notifications: {}
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
router.post('/smtp', (req, res) => {
  try {
    const { smtpConfig, timestamp } = req.body;
    
    console.log('📧 更新SMTP配置:', smtpConfig);
    
    // Validate required fields
    const required = ['host', 'username', 'password', 'senderName', 'companyName'];
    const missing = required.filter(field => !smtpConfig[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必需字段: ${missing.join(', ')}`
      });
    }
    
    // Store SMTP configuration
    userSettings.smtp = {
      ...smtpConfig,
      updatedAt: timestamp || new Date().toISOString()
    };
    
    // Notify WebSocket manager about config update
    if (req.app.locals.wsManager) {
      req.app.locals.wsManager.broadcast({
        type: 'settings_updated',
        category: 'smtp',
        data: userSettings.smtp
      });
    }
    
    console.log('✅ SMTP配置已保存并广播更新');
    
    res.json({
      success: true,
      message: 'SMTP配置更新成功',
      data: userSettings.smtp
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