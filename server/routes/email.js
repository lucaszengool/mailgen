const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../models/database');
const EmailService = require('../services/EmailService');
const analyticsRoutes = require('./analytics');
const trackEmailSent = analyticsRoutes.trackEmailSent;
const trackEmailDelivered = analyticsRoutes.trackEmailDelivered;
const trackEmailOpened = analyticsRoutes.trackEmailOpened;
const trackEmailClicked = analyticsRoutes.trackEmailClicked;

// Initialize email service
const emailService = new EmailService();

// Current SMTP configuration
let currentSmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: '',
  password: '',
  senderName: 'AI Email Agent'
};

// Helper function to save SMTP config
function saveSmtpConfig(config) {
  currentSmtpConfig = config;
  // In production, save to database or config file
}

// 发送邮件
router.post('/send', async (req, res) => {
  try {
    const {
      to,
      subject,
      body,
      from,
      smtpConfig,
      trackingEnabled = true,
      campaignId
    } = req.body;

    // 验证必需参数
    if (!to || !subject || !body || !smtpConfig) {
      return res.status(400).json({
        success: false,
        error: '缺少必需的邮件参数'
      });
    }

    // Generate tracking ID if enabled
    const trackingId = trackingEnabled ? `${campaignId || 'manual'}_${Date.now()}` : null;

    // Try to use OAuth first, then fall back to provided SMTP config
    // EmailService will check OAuth if userId is provided
    const userId = req.userId || 'anonymous';

    // Add tracking pixel to body
    const trackingPixel = trackingEnabled && trackingId ?
      `<img src="http://localhost:3333/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;">` : '';

    // Send email using EmailService (supports OAuth)
    const result = await emailService.sendEmail({
      to,
      subject,
      html: `${body}${trackingPixel}`,
      from,
      trackingId,
      userId
    });

    // 记录发送日志
    db.logEmailSent({
      to: to,
      subject: subject,
      campaignId: campaignId,
      messageId: result.messageId,
      status: 'sent',
      sentAt: new Date().toISOString()
    });

    // Track analytics
    try {
      trackEmailSent(campaignId || 'manual', { email: to }, subject, body);
      // For simplicity, assume email is delivered immediately (in reality you'd need webhooks)
      trackEmailDelivered(campaignId || 'manual', to, result.messageId);
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        sentAt: result.sentAt || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('发送邮件错误:', error);
    
    // 记录发送失败
    db.logEmailSent({
      to: req.body.to,
      subject: req.body.subject,
      campaignId: req.body.campaignId,
      status: 'failed',
      error: error.message,
      sentAt: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: '邮件发送失败: ' + error.message
    });
  }
});

// 批量发送邮件
router.post('/send-bulk', async (req, res) => {
  try {
    const {
      recipients,
      subject,
      body,
      smtpConfig,
      campaignId,
      delayBetweenEmails = 5000 // 默认5秒间隔
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: '收件人列表不能为空'
      });
    }

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // 开始批量发送
    res.json({
      success: true,
      message: '批量发送已开始',
      taskId: campaignId
    });

    // 异步处理批量发送 (pass userId for OAuth support)
    const userId = req.userId || 'anonymous';
    processBulkSend(recipients, subject, body, smtpConfig, campaignId, delayBetweenEmails, results, userId);

  } catch (error) {
    console.error('批量发送初始化错误:', error);
    res.status(500).json({
      success: false,
      error: '批量发送初始化失败'
    });
  }
});

// 异步批量发送处理函数
async function processBulkSend(recipients, subject, body, smtpConfig, campaignId, delay, results, userId) {
  // Use EmailService which supports OAuth

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    try {
      // 个性化邮件内容
      let personalizedBody = body;
      let personalizedSubject = subject;
      
      // 替换占位符
      if (recipient.name) {
        personalizedBody = personalizedBody.replace(/\{name\}/g, recipient.name);
        personalizedSubject = personalizedSubject.replace(/\{name\}/g, recipient.name);
      }
      if (recipient.company) {
        personalizedBody = personalizedBody.replace(/\{company\}/g, recipient.company);
        personalizedSubject = personalizedSubject.replace(/\{company\}/g, recipient.company);
      }

      // Generate tracking ID
      const trackingId = `${campaignId}_${i}`;
      const trackingPixel = `<img src="http://localhost:3333/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;">`;

      // Send email using EmailService (supports OAuth)
      const result = await emailService.sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        html: `${personalizedBody}${trackingPixel}`,
        from: smtpConfig.username,
        trackingId,
        userId
      });

      results.sent++;

      // 记录成功发送
      db.logEmailSent({
        to: recipient.email,
        subject: personalizedSubject,
        campaignId: campaignId,
        messageId: result.messageId,
        status: 'sent',
        recipientIndex: i,
        sentAt: new Date().toISOString()
      });

      // Track analytics
      try {
        trackEmailSent(campaignId, recipient, personalizedSubject, personalizedBody);
        trackEmailDelivered(campaignId, recipient.email, result.messageId);
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
      }

      console.log(`邮件发送成功 (${i + 1}/${recipients.length}): ${recipient.email}`);

    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: error.message
      });

      // 记录发送失败
      db.logEmailSent({
        to: recipient.email,
        subject: subject,
        campaignId: campaignId,
        status: 'failed',
        error: error.message,
        recipientIndex: i,
        sentAt: new Date().toISOString()
      });

      console.error(`邮件发送失败 (${i + 1}/${recipients.length}): ${recipient.email}`, error.message);
    }

    // 发送间隔延迟
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log(`批量发送完成: 成功 ${results.sent}, 失败 ${results.failed}`);
}

// 跟踪邮件打开
router.get('/track/open/:trackingId', (req, res) => {
  const { trackingId } = req.params;

  // 记录邮件打开事件
  db.logEmailOpen({
    trackingId: trackingId,
    openedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Track analytics
  try {
    // Extract campaign ID and recipient email from tracking ID
    const parts = trackingId.split('_');
    const campaignId = parts[0] || 'manual';
    // In production, you'd retrieve the email from database using trackingId
    trackEmailOpened(campaignId, 'recipient@example.com', 'Email Subject');
  } catch (analyticsError) {
    console.error('Analytics tracking error:', analyticsError);
  }

  // 返回1x1透明像素图片
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': pixel.length
  });
  res.end(pixel);
});

// 跟踪邮件链接点击
router.get('/track/click/:campaignId/:linkId', (req, res) => {
  const { campaignId, linkId } = req.params;
  const { url } = req.query;

  // 记录链接点击事件
  db.logEmailClick({
    campaignId: campaignId,
    linkId: linkId,
    targetUrl: url,
    clickedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Track analytics
  try {
    // In production, you'd retrieve the email from database using linkId
    trackEmailClicked(campaignId, 'recipient@example.com', url || '');
  } catch (analyticsError) {
    console.error('Analytics tracking error:', analyticsError);
  }

  // 重定向到目标URL
  if (url) {
    res.redirect(url);
  } else {
    res.status(400).send('无效的跳转链接');
  }
});

// 获取当前SMTP配置
router.get('/smtp-config', (req, res) => {
  res.json({
    success: true,
    data: currentSmtpConfig
  });
});

// 更新SMTP配置
router.post('/smtp-config', async (req, res) => {
  try {
    const { host, port, secure, username, password, senderName } = req.body;
    
    const newConfig = {
      host: host || currentSmtpConfig.host,
      port: port || currentSmtpConfig.port,
      secure: secure !== undefined ? secure : currentSmtpConfig.secure,
      username: username || currentSmtpConfig.username,
      password: password || currentSmtpConfig.password,
      senderName: senderName || currentSmtpConfig.senderName
    };
    
    // 测试新配置
    const transporter = nodemailer.createTransport({
      host: newConfig.host,
      port: newConfig.port,
      secure: newConfig.secure,
      auth: {
        user: newConfig.username,
        pass: newConfig.password
      }
    });
    
    await transporter.verify();
    
    // 保存配置
    currentSmtpConfig = newConfig;
    saveSmtpConfig(newConfig);
    
    res.json({
      success: true,
      message: 'SMTP配置更新成功',
      data: currentSmtpConfig
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SMTP配置更新失败: ' + error.message
    });
  }
});

// 测试SMTP配置
router.post('/test-smtp', async (req, res) => {
  try {
    const { smtpConfig } = req.body;
    const configToTest = smtpConfig || currentSmtpConfig;

    const transporter = nodemailer.createTransport({
      host: configToTest.host,
      port: configToTest.port,
      secure: configToTest.secure,
      auth: {
        user: configToTest.username,
        pass: configToTest.password
      }
    });

    // 验证连接
    await transporter.verify();

    // 发送测试邮件
    const testMailOptions = {
      from: `"${configToTest.senderName}" <${configToTest.username}>`,
      to: configToTest.username,
      subject: '📧 SMTP配置测试成功',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #28a745;">✅ SMTP配置测试成功！</h2>
          <p>恭喜！您的邮件发送配置已经成功设置。</p>
          <hr>
          <h3>配置信息：</h3>
          <ul>
            <li><strong>SMTP服务器：</strong>${configToTest.host}:${configToTest.port}</li>
            <li><strong>用户名：</strong>${configToTest.username}</li>
            <li><strong>加密方式：</strong>${configToTest.secure ? 'SSL' : 'STARTTLS'}</li>
            <li><strong>发件人名称：</strong>${configToTest.senderName}</li>
          </ul>
          <p style="color: #28a745; font-weight: bold;">🚀 现在您可以开始使用AI邮件自动化系统了！</p>
        </div>
      `
    };

    await transporter.sendMail(testMailOptions);

    res.json({
      success: true,
      message: 'SMTP配置测试成功！测试邮件已发送',
      data: {
        host: configToTest.host,
        port: configToTest.port,
        username: configToTest.username,
        senderName: configToTest.senderName
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SMTP配置无效: ' + error.message
    });
  }
});

// 获取邮件发送统计
router.get('/stats/:campaignId?', (req, res) => {
  try {
    const { campaignId } = req.params;
    const stats = db.getEmailStats(campaignId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

// Generate personalized email content using AI
router.post('/generate-personalized-content', async (req, res) => {
  try {
    const { recipient, templateComponents, templateSubject, templatePreheader } = req.body;

    if (!recipient || !templateComponents) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipient or template components'
      });
    }

    // Initialize EmailAutomationAgent for AI content generation
    const EmailAutomationAgent = require('../agents/EmailAutomationAgent');
    const emailAgent = new EmailAutomationAgent();

    // Create context for AI generation
    const context = {
      prospectName: recipient.name || recipient.recipientName || recipient.to?.split('@')[0] || 'there',
      prospectCompany: recipient.company || recipient.companyName || 'your company',
      prospectPosition: recipient.position || recipient.title || '',
      prospectIndustry: recipient.industry || '',
      prospectPainPoints: [],
      prospectInterests: [],
      companyInfo: {
        name: 'Our Company',
        value_proposition: 'We help businesses grow with AI-powered solutions'
      },
      marketInsights: { keyMessages: [] },
      targetWebsite: 'example.com'
    };

    // Extract text content from template components to understand structure
    let templateStructure = '';
    if (templateComponents && Array.isArray(templateComponents)) {
      templateComponents.forEach(comp => {
        if (comp.type === 'freeform_editor' && comp.content?.html) {
          // Extract text from HTML
          const textContent = comp.content.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          templateStructure += textContent + '\n\n';
        } else if (comp.content) {
          // Extract relevant text from other component types
          if (comp.content.title) templateStructure += comp.content.title + '\n';
          if (comp.content.subtitle) templateStructure += comp.content.subtitle + '\n';
          if (comp.content.text) templateStructure += comp.content.text + '\n';
          if (comp.content.content) templateStructure += comp.content.content + '\n';
          templateStructure += '\n';
        }
      });
    }

    // Create a basic template for AI generation
    const template = {
      structure: `Generate professional email content following this structure:
${templateStructure}

Use the same tone and format, but personalize the content for the specific recipient.`
    };

    // Generate AI content
    let personalizedContent;
    try {
      personalizedContent = await emailAgent.generateAIContent(template, context);
      if (!personalizedContent || !personalizedContent.body) {
        throw new Error('No content generated by AI');
      }
    } catch (aiError) {
      console.error('AI generation failed:', aiError.message);
      // Fallback to simple template content
      personalizedContent = {
        subject: templateSubject || `Hello ${context.prospectName}`,
        body: templateStructure || `Hello ${context.prospectName}, this is a personalized message for ${context.prospectCompany}.`,
        preheader: templatePreheader || ''
      };
    }

    res.json({
      success: true,
      data: {
        subject: personalizedContent.subject || templateSubject || 'Hello from our team',
        preheader: personalizedContent.preheader || templatePreheader || '',
        content: personalizedContent.body || 'Personalized content could not be generated',
        recipient: context.prospectName,
        company: context.prospectCompany
      }
    });

  } catch (error) {
    console.error('❌ Error generating personalized content:', error);

    // Return fallback content instead of error
    const fallbackContent = {
      subject: templateSubject || `Hello ${context.prospectName}`,
      body: templateStructure || `Hello ${context.prospectName}, this is a personalized message for ${context.prospectCompany}.`,
      preheader: templatePreheader || '',
      recipient: context.prospectName,
      company: context.prospectCompany
    };

    res.json({
      success: true,
      data: fallbackContent,
      warning: 'Used fallback content due to AI generation error: ' + error.message
    });
  }
});

module.exports = router;