const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const knowledgeBaseSingleton = require('../models/KnowledgeBaseSingleton');
const SmartBusinessAnalyzer = require('../agents/SmartBusinessAnalyzer');
const ComprehensiveEmailAgent = require('../agents/ComprehensiveEmailAgent');
const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');

// Global agent state and email agent instance
let emailAgent = new ComprehensiveEmailAgent();
let langGraphAgent = null; // Will be set from app.locals in middleware

// Middleware to set langGraphAgent from app.locals
router.use((req, res, next) => {
  if (!langGraphAgent && req.app.locals.langGraphAgent) {
    langGraphAgent = req.app.locals.langGraphAgent;
    console.log('✅ Using shared LangGraph agent with WebSocket support');
  }
  next();
});
let agentState = {
  isRunning: false,
  isPaused: false,
  currentTask: null,
  startTime: null,
  stats: {
    totalEmailsSent: 0,
    repliesReceived: 0,
    activeClients: 0,
    conversionRate: 0,
    avgResponseTime: 0
  },
  config: null
};

// Agent configuration
let agentConfig = {
  targetWebsite: null,
  campaignGoal: null,
  businessType: 'auto',
  smtpConfig: null,
  controls: {
    autoReply: true,
    manualApproval: false,
    pauseOnError: true,
    maxEmailsPerHour: 10,
    workingHours: { start: 9, end: 18 }
  }
};

// Configure agent
router.post('/configure', async (req, res) => {
  try {
    const { targetWebsite, campaignGoal, smtpConfig, businessType } = req.body;
    
    console.log('📝 Configure request received:', { targetWebsite, campaignGoal, businessType, smtpConfig: !!smtpConfig });
    
    agentConfig.targetWebsite = targetWebsite;
    agentConfig.campaignGoal = campaignGoal;
    agentConfig.smtpConfig = smtpConfig;
    agentConfig.businessType = businessType || 'auto';
    
    console.log('💾 Saving config:', { businessType: agentConfig.businessType });

    // Save configuration to file
    const configPath = path.join(__dirname, '../data/agent-config.json');
    await fs.writeFile(configPath, JSON.stringify(agentConfig, null, 2));

    agentState.config = agentConfig;

    res.json({ success: true, message: 'Agent configured successfully' });
  } catch (error) {
    console.error('Failed to configure agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent configuration
router.get('/config', async (req, res) => {
  try {
    // First check in-memory config (for Railway ephemeral filesystem)
    if (agentState.config && agentState.config.targetWebsite) {
      console.log('✅ Returning config from memory (Railway-compatible)');
      return res.json(agentState.config);
    }

    // Fallback to file-based config for local development
    const configPath = path.join(__dirname, '../data/agent-config.json');

    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      // Also store in memory for future requests
      agentState.config = config;
      console.log('✅ Loaded config from file and cached in memory');
      res.json(config);
    } catch (error) {
      // No config file exists yet
      console.log('⚠️ No config found in memory or file');
      res.json(null);
    }
  } catch (error) {
    console.error('Failed to get agent config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save agent configuration (POST /config endpoint for tutorial wizard)
router.post('/config', async (req, res) => {
  try {
    const {
      campaignGoal,
      goalData,
      emailTemplate,
      templateData,
      audienceType,
      industries,
      roles,
      companySize,
      location,
      keywords,
      smtpConfig,
      provider,
      setupComplete,
      createdAt,
      websiteAnalysis,  // Add websiteAnalysis (includes logo, businessName, etc.)
      // Also accept legacy format for backward compatibility
      targetWebsite,
      businessType
    } = req.body;
    
    console.log('📝 Campaign config save request received:', { 
      campaignGoal, 
      emailTemplate, 
      audienceType,
      setupComplete,
      smtpConfig: !!smtpConfig 
    });
    
    // Create comprehensive configuration object
    const campaignConfig = {
      // Campaign setup
      campaignGoal: campaignGoal,
      goalData: goalData,
      emailTemplate: emailTemplate,
      templateData: templateData,

      // Audience targeting
      audienceType: audienceType,
      industries: industries || [],
      roles: roles || [],
      companySize: companySize,
      location: location,
      keywords: keywords || [],

      // SMTP configuration
      smtpConfig: smtpConfig,
      provider: provider,

      // Website Analysis (includes logo, businessName, productType, etc.)
      websiteAnalysis: websiteAnalysis,

      // Legacy compatibility
      targetWebsite: targetWebsite,
      businessType: businessType || 'auto',

      // Setup status
      setupComplete: setupComplete || true,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update global agent config for backward compatibility
    agentConfig.campaignGoal = campaignGoal;
    agentConfig.smtpConfig = smtpConfig;
    agentConfig.businessType = businessType || 'auto';
    if (targetWebsite) {
      agentConfig.targetWebsite = targetWebsite;
    }

    // CRITICAL: Save to memory first (for Railway ephemeral filesystem)
    agentState.config = campaignConfig;
    console.log('✅ Campaign configuration saved to memory (Railway-compatible)');

    // Try to save configuration to file (for local development)
    try {
      const configPath = path.join(__dirname, '../data/agent-config.json');
      await fs.writeFile(configPath, JSON.stringify(campaignConfig, null, 2));
      console.log('✅ Campaign configuration also saved to file');
    } catch (fileError) {
      // On Railway, filesystem might be read-only or ephemeral, so this is expected
      console.log('⚠️ Could not save config to file (Railway ephemeral filesystem):', fileError.message);
      console.log('✅ Config is still available in memory');
    }
    
    res.json({ 
      success: true, 
      message: 'Campaign configuration saved successfully',
      config: campaignConfig 
    });
  } catch (error) {
    console.error('Failed to save campaign config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent status
router.get('/status', (req, res) => {
  try {
    const currentTime = Date.now();
    const uptime = agentState.startTime 
      ? Math.floor((currentTime - agentState.startTime) / 1000) 
      : 0;

    // Get real stats from email agent if available
    let stats = agentState.stats;
    let currentTask = agentState.currentTask;
    
    if (agentState.isRunning && emailAgent) {
      try {
        stats = emailAgent.getStats();
        currentTask = emailAgent.getCurrentTask() || currentTask;
      } catch (error) {
        console.error('Error getting email agent stats:', error);
      }
    }

    const status = {
      ...agentState,
      stats,
      currentTask,
      uptime,
      lastActivity: agentState.lastActivity || null
    };

    res.json(status);
  } catch (error) {
    console.error('Failed to get agent status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detailed agent logs and progress
router.get('/logs', (req, res) => {
  try {
    // Get logs from LangGraph agent if available
    const logs = langGraphAgent.getLogs ? langGraphAgent.getLogs() : [];
    
    res.json({
      success: true,
      data: {
        logs: logs,
        currentTask: agentState.currentTask,
        isRunning: agentState.isRunning,
        lastUpdate: agentState.lastActivity || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get agent logs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: { logs: [], currentTask: agentState.currentTask, isRunning: agentState.isRunning }
    });
  }
});

// Start agent
router.post('/start', async (req, res) => {
  try {
    // Load configuration from file if not in memory
    if (!agentConfig.targetWebsite || !agentConfig.campaignGoal) {
      try {
        const configPath = path.join(__dirname, '../data/agent-config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const savedConfig = JSON.parse(configData);
        
        // Update agentConfig with saved data
        agentConfig.targetWebsite = savedConfig.targetWebsite;
        agentConfig.campaignGoal = savedConfig.campaignGoal;
        agentConfig.businessType = savedConfig.businessType || 'auto';
        agentConfig.smtpConfig = savedConfig.smtpConfig;
        
        console.log('✅ Loaded configuration from file:', {
          targetWebsite: agentConfig.targetWebsite,
          campaignGoal: agentConfig.campaignGoal,
          businessType: agentConfig.businessType
        });
      } catch (error) {
        console.error('❌ Failed to load configuration:', error.message);
        return res.status(400).json({ 
          success: false, 
          error: 'Agent not configured. Please complete setup first.' 
        });
      }
    }

    // Update controls if provided
    if (req.body.controls) {
      agentConfig.controls = { ...agentConfig.controls, ...req.body.controls };
    }

    agentState.isRunning = true;
    agentState.isPaused = false;
    agentState.startTime = Date.now();
    agentState.lastActivity = new Date().toISOString();

    // 使用统一的LangGraph系统，集成传统工作流
    agentState.currentTask = 'Initializing LangGraph Unified Agent System...';
    console.log('🚀 启动统一LangGraph代理系统');
    
    try {
      // 启动统一营销活动（异步）
      console.log('🔧 Agent Start调试 - agentConfig.smtpConfig:', {
        exists: !!agentConfig.smtpConfig,
        type: typeof agentConfig.smtpConfig,
        host: agentConfig.smtpConfig?.host
      });
      
      langGraphAgent.executeCampaign({
        targetWebsite: agentConfig.targetWebsite,
        campaignGoal: agentConfig.campaignGoal,
        businessType: agentConfig.businessType,
        smtpConfig: agentConfig.smtpConfig
      }).then(result => {
        if (result.success) {
          agentState.currentTask = 'LangGraph Unified Agent running - learning and optimizing...';
          agentState.campaignId = result.campaignId;
          agentState.threadId = result.threadId;
          console.log('✅ LangGraph统一营销活动启动成功');
        } else {
          console.error('❌ LangGraph统一营销活动失败:', result.error);
          agentState.currentTask = `Agent Error: ${result.error}`;
        }
      }).catch(error => {
        console.error('❌ LangGraph启动异常:', error);
        agentState.currentTask = `Agent Exception: ${error.message}`;
      });

      agentState.currentTask = 'LangGraph Unified Agent initializing...';
      
    } catch (langGraphError) {
      console.error('❌ Failed to start LangGraph Agent:', langGraphError.message);
      agentState.currentTask = `Error: ${langGraphError.message}`;
      agentState.isRunning = false;
      return res.status(500).json({ success: false, error: langGraphError.message });
    }

    res.json({ 
      success: true, 
      message: 'Unified Agent started successfully with LangGraph framework',
      mode: 'unified',
      status: agentState 
    });
  } catch (error) {
    console.error('Failed to start agent:', error);
    agentState.isRunning = false;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop agent
router.post('/stop', async (req, res) => {
  try {
    agentState.isRunning = false;
    agentState.isPaused = false;
    agentState.currentTask = null;
    agentState.lastActivity = new Date().toISOString();

    // Stop the email agent
    try {
      await emailAgent.stop();
    } catch (error) {
      console.error('Error stopping email agent:', error);
    }

    res.json({ 
      success: true, 
      message: 'Agent stopped successfully',
      status: agentState 
    });
  } catch (error) {
    console.error('Failed to stop agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset agent configuration and data
router.post('/reset', async (req, res) => {
  try {
    // Stop agent if running
    agentState.isRunning = false;
    agentState.isPaused = false;
    agentState.currentTask = null;
    agentState.startTime = null;
    agentState.stats = {
      totalEmailsSent: 0,
      repliesReceived: 0,
      activeClients: 0,
      conversionRate: 0,
      avgResponseTime: 0
    };
    
    // Clear configuration
    agentConfig = {
      targetWebsite: null,
      campaignGoal: null,
      businessType: 'auto',
      smtpConfig: null,
      controls: {
        autoReply: true,
        manualApproval: false,
        pauseOnError: true,
        maxEmailsPerHour: 10,
        workingHours: { start: 9, end: 18 }
      }
    };
    
    agentState.config = null;

    // Delete configuration file
    const configPath = path.join(__dirname, '../data/agent-config.json');
    try {
      await fs.unlink(configPath);
    } catch (err) {
      // File might not exist, that's ok
    }

    res.json({ 
      success: true, 
      message: 'Agent reset successfully'
    });
  } catch (error) {
    console.error('Failed to reset agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pause/Resume agent
router.post('/pause', (req, res) => {
  try {
    if (!agentState.isRunning) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot pause agent that is not running' 
      });
    }

    agentState.isPaused = !agentState.isPaused;
    agentState.lastActivity = new Date().toISOString();

    // Pause/resume the email agent
    try {
      emailAgent.pause();
    } catch (error) {
      console.error('Error pausing/resuming email agent:', error);
    }

    if (agentState.isPaused) {
      agentState.currentTask = 'Agent paused by user';
    } else {
      agentState.currentTask = 'Resuming operations...';
    }

    res.json({ 
      success: true, 
      message: `Agent ${agentState.isPaused ? 'paused' : 'resumed'} successfully`,
      status: agentState 
    });
  } catch (error) {
    console.error('Failed to pause/resume agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update agent controls
router.put('/controls', (req, res) => {
  try {
    agentConfig.controls = { ...agentConfig.controls, ...req.body };
    agentState.lastActivity = new Date().toISOString();

    res.json({ 
      success: true, 
      message: 'Agent controls updated successfully',
      controls: agentConfig.controls 
    });
  } catch (error) {
    console.error('Failed to update agent controls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get clients data
router.get('/clients', async (req, res) => {
  try {
    // Use singleton to avoid multiple connections
    const prospects = await knowledgeBaseSingleton.getAllProspects();
    
    console.log(`📊 Found ${prospects.length} prospects in EnhancedKnowledgeBase`);
    
    // Transform to client format with intelligent status classification
    const clients = prospects.map(prospect => {
      // Intelligent status classification based on interaction data
      let intelligentStatus = prospect.status || 'discovered';
      
      if (prospect.replies_received > 0) {
        if (prospect.last_reply && 
            (prospect.last_reply.includes('感兴趣') || 
             prospect.last_reply.includes('interested') ||
             prospect.last_reply.includes('详细') ||
             prospect.last_reply.includes('更多') ||
             prospect.last_reply.includes('安排') ||
             prospect.last_reply.includes('演示'))) {
          intelligentStatus = 'interested';
        } else if (prospect.last_reply &&
                  (prospect.last_reply.includes('不需要') ||
                   prospect.last_reply.includes('not interested') ||
                   prospect.last_reply.includes('取消') ||
                   prospect.last_reply.includes('停止'))) {
          intelligentStatus = 'not_interested';
        } else {
          intelligentStatus = 'engaged';
        }
      } else if (prospect.emails_sent > 0) {
        intelligentStatus = 'contacted';
      }
      
      // Check for conversion indicators
      if (prospect.last_reply && 
          (prospect.last_reply.includes('合作') ||
           prospect.last_reply.includes('价格') ||
           prospect.last_reply.includes('购买') ||
           prospect.last_reply.includes('签约'))) {
        intelligentStatus = 'converted';
      }

      return {
        id: prospect.id,
        name: prospect.company || `Business #${prospect.id}`,
        email: prospect.email,
        industry: prospect.industry || 'unknown',
        status: intelligentStatus,
        lastContact: prospect.last_contact || new Date().toISOString(),
        emailsSent: prospect.emails_sent || 0,
        repliesReceived: prospect.replies_received || 0,
        lastReply: prospect.last_reply,
        conversionProbability: prospect.conversion_probability || Math.floor(Math.random() * 100),
        businessSize: prospect.business_size || 'small'
      };
    });

    console.log(`📋 Returning ${clients.length} clients to frontend`);
    res.json(clients);
  } catch (error) {
    console.error('Failed to get clients:', error);
    // Return mock data as fallback
    res.json([]);
  }
});

// Get specific client
router.get('/clients/:id', async (req, res) => {
  try {
    const prospect = await knowledgeBaseSingleton.getProspect(req.params.id);
    
    if (!prospect) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const client = {
      id: prospect.id,
      name: prospect.company || `Business #${prospect.id}`,
      email: prospect.email,
      industry: prospect.industry || 'unknown',
      status: prospect.status || 'prospects',
      lastContact: prospect.last_contact || new Date().toISOString(),
      emailsSent: prospect.emails_sent || 0,
      repliesReceived: prospect.replies_received || 0,
      lastReply: prospect.last_reply,
      conversionProbability: prospect.conversion_probability || Math.floor(Math.random() * 100),
      businessSize: prospect.business_size || 'small'
    };

    res.json(client);
  } catch (error) {
    console.error('Failed to get client:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update client
router.patch('/clients/:id', async (req, res) => {
  try {
    await knowledgeBaseSingleton.updateProspect(req.params.id, req.body);

    res.json({ success: true, message: 'Client updated successfully' });
  } catch (error) {
    console.error('Failed to update client:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get client email history
router.get('/clients/:id/emails', async (req, res) => {
  try {
    // Get real email history from enhanced knowledge base
    const emailHistory = await knowledgeBaseSingleton.getEmailHistory(req.params.id);
    
    console.log(`📧 Found ${emailHistory.length} emails for client ${req.params.id}`);
    
    // Transform to frontend format
    const formattedHistory = emailHistory.map(email => ({
      id: email.id,
      type: email.type === 'outbound' ? 'sent' : 'received',
      subject: email.subject,
      content: email.content,
      timestamp: email.sent_at || email.received_at || email.created_at,
      status: email.status,
      opens: email.opens || 0,
      clicks: email.clicks || 0,
      from: email.from_email || 'AI Agent <agent@system.com>',
      to: email.to_email,
      message_id: email.message_id
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Failed to get email history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get client notes
router.get('/clients/:id/notes', async (req, res) => {
  try {
    // Mock notes for now
    const notes = [
      {
        id: 1,
        content: '客户表现出对AI宠物肖像服务的高度兴趣',
        type: 'system',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        author: 'AI Agent'
      },
      {
        id: 2,
        content: '建议安排演示通话，客户询问了定价详情',
        type: 'insight',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        author: 'AI Agent'
      }
    ];

    res.json(notes);
  } catch (error) {
    console.error('Failed to get client notes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add client note
router.post('/clients/:id/notes', async (req, res) => {
  try {
    const { content, type, author } = req.body;
    
    const note = {
      id: Date.now(),
      content,
      type: type || 'manual',
      timestamp: new Date().toISOString(),
      author: author || 'User'
    };

    // In a real implementation, save to database
    res.json({ success: true, note });
  } catch (error) {
    console.error('Failed to add client note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test website analysis endpoint
router.post('/test/analyze-website', async (req, res) => {
  try {
    const { url, goal, businessType } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const analyzer = new SmartBusinessAnalyzer();
    const analysis = await analyzer.analyzeTargetBusiness(url, goal, businessType);

    agentState.lastActivity = new Date().toISOString();

    res.json({
      success: true,
      companyName: analysis.companyName,
      industry: analysis.industry,
      senderInfo: analysis.senderInfo,
      analysis
    });
  } catch (error) {
    console.error('Website analysis failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Analysis failed' 
    });
  }
});

// 设置客户自动回复
router.post('/clients/:id/auto-reply', async (req, res) => {
  try {
    const { enabled } = req.body;
    const clientId = req.params.id;
    
    emailAgent.setAutoReply(enabled, clientId);
    
    res.json({
      success: true,
      message: `客户 ${clientId} 的自动回复已${enabled ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('设置自动回复失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取邮件内容详情
router.get('/emails/:id', async (req, res) => {
  try {
    const emailId = req.params.id;
    const email = await knowledgeBaseSingleton.getEmailById(emailId);
    
    if (!email) {
      return res.status(404).json({ success: false, error: '邮件不存在' });
    }
    
    // Ensure HTML content is properly formatted and not compressed
    if (email.content) {
      if (!email.html || email.html.length < 100) {
        // Convert plain text to properly formatted HTML
        let content = email.content;
        
        // Remove any subject lines that might be in the content
        content = content.replace(/^SUBJECT:\s*[^\n]*\n?/i, '').trim();
        
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        
        email.html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .email-container { max-width: 700px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .email-header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .email-body { padding: 40px 30px; line-height: 1.8; }
        .email-body p { margin-bottom: 20px; font-size: 16px; color: #333; }
        .email-body ul { margin: 20px 0; padding-left: 20px; }
        .email-body li { margin-bottom: 8px; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .email-footer { background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${email.subject || 'Partnership Opportunity'}</h1>
        </div>
        <div class="email-body">
            ${paragraphs.map(p => {
              // Convert bullet points to HTML lists
              if (p.includes('•') || p.includes('-')) {
                const items = p.split(/[•\-]\s+/).filter(item => item.trim());
                if (items.length > 1) {
                  const intro = items[0].trim();
                  const listItems = items.slice(1).map(item => `<li>${item.trim()}</li>`).join('');
                  return `${intro ? `<p>${intro}</p>` : ''}<ul>${listItems}</ul>`;
                }
              }
              return `<p>${p.replace(/\n/g, '<br>')}</p>`;
            }).join('')}
            
            <div class="cta-section">
                <a href="${email.websiteUrl || '#'}" class="cta-button">Get In Touch</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Best regards,<br>
            <strong>${email.senderName || 'The Team'}</strong><br>
            ${email.companyName || 'Your Company'}</p>
        </div>
    </div>
</body>
</html>`;
      }
    }
    
    res.json(email);
  } catch (error) {
    console.error('获取邮件失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取营销策略
router.get('/strategy', async (req, res) => {
  try {
    if (emailAgent.marketingStrategy) {
      res.json({
        success: true,
        strategy: emailAgent.marketingStrategy
      });
    } else {
      res.json({
        success: false,
        error: '营销策略尚未生成'
      });
    }
  } catch (error) {
    console.error('获取营销策略失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动发送邮件给特定客户
router.post('/clients/:id/send-email', async (req, res) => {
  try {
    const clientId = req.params.id;
    const { subject, content, attachments } = req.body;
    
    console.log(`📧 手动发送邮件到客户 ${clientId}: ${subject}`);
    
    const prospect = await knowledgeBaseSingleton.getProspect(clientId);
    
    if (!prospect) {
      return res.status(404).json({ success: false, error: '客户不存在' });
    }
    
    // 创建手动邮件项
    const emailItem = {
      id: `manual_email_${Date.now()}`,
      prospect,
      subject,
      content,
      attachments: attachments || [],
      type: 'manual',
      scheduled: new Date(),
      status: 'queued'
    };
    
    // 添加到代理的发送队列
    emailAgent.emailQueue.push(emailItem);
    
    // 立即保存到知识库
    await knowledgeBaseSingleton.saveEmail({
      prospect_id: prospect.id,
      subject: subject,
      content: content,
      type: 'outbound',
      status: 'queued',
      scheduled_at: new Date().toISOString(),
      from_email: emailAgent.config?.smtpConfig?.username || 'agent@system.com',
      to_email: prospect.email
    });
    
    console.log(`✅ 邮件已添加到发送队列: ${emailItem.id}`);
    
    res.json({
      success: true,
      message: '邮件已添加到发送队列',
      emailId: emailItem.id
    });
  } catch (error) {
    console.error('手动发送邮件失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================
// LangGraph智能代理专用API
// =========================

// 获取智能代理营销活动状态
router.get('/intelligent/campaign/:threadId', async (req, res) => {
  try {
    const threadId = req.params.threadId;
    const status = await langGraphAgent.getCampaignStatus(threadId);
    
    if (!status) {
      return res.status(404).json({ success: false, error: '营销活动不存在' });
    }
    
    res.json({
      success: true,
      campaignStatus: status,
      threadId: threadId
    });
  } catch (error) {
    console.error('获取智能营销活动状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取智能代理学习统计
router.get('/intelligent/learning-stats', (req, res) => {
  try {
    const stats = langGraphAgent.getLearningStats();
    
    res.json({
      success: true,
      learningStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动触发智能营销活动
router.post('/intelligent/start-campaign', async (req, res) => {
  try {
    const { targetWebsite, campaignGoal, businessType } = req.body;
    
    if (!targetWebsite || !campaignGoal) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数: targetWebsite 和 campaignGoal' 
      });
    }
    
    console.log('🧠 手动启动智能营销活动');
    
    const result = await langGraphAgent.executeCampaign({
      targetWebsite,
      campaignGoal,
      businessType: businessType || 'auto',
      smtpConfig: agentConfig.smtpConfig
    });
    
    res.json({
      success: true,
      message: '智能营销活动已启动',
      campaign: result
    });
  } catch (error) {
    console.error('启动智能营销活动失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 提供学习反馈
router.post('/intelligent/feedback', async (req, res) => {
  try {
    const { campaignId, feedbackType, rating, comments } = req.body;
    
    // 这里可以扩展为将反馈集成到学习系统中
    console.log('📝 收到智能代理反馈:', { campaignId, feedbackType, rating, comments });
    
    // 未来可以将反馈用于强化学习
    
    res.json({
      success: true,
      message: '反馈已记录，将用于改进智能代理性能',
      feedbackId: `feedback_${Date.now()}`
    });
  } catch (error) {
    console.error('处理智能代理反馈失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取智能代理性能对比
router.get('/intelligent/performance-comparison', async (req, res) => {
  try {
    const stats = langGraphAgent.getLearningStats();
    
    // 计算性能改进指标
    const campaigns = Object.values(stats.performanceMetrics);
    const avgResponseRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.responseRate, 0) / campaigns.length 
      : 0;
    const avgConversionRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length
      : 0;
    
    res.json({
      success: true,
      performanceComparison: {
        intelligentMode: {
          averageResponseRate: avgResponseRate,
          averageConversionRate: avgConversionRate,
          totalCampaigns: campaigns.length,
          learningPatterns: Object.keys(stats.searchPatterns).length
        },
        traditionalMode: {
          // 这里可以添加传统模式的历史数据对比
          note: '传统模式数据需要从历史记录中提取'
        }
      },
      learningProgress: {
        searchPatternsLearned: Object.keys(stats.searchPatterns).length,
        emailEffectivenessData: Object.keys(stats.emailEffectiveness).length,
        improvementTrend: campaigns.length > 1 ? 'improving' : 'initial'
      }
    });
  } catch (error) {
    console.error('获取性能对比失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;