const express = require('express');
const IntelligentEmailAgent = require('../agents/IntelligentEmailAgent');

// 创建全局智能邮件代理实例
let intelligentAgent = null;

const router = express.Router();

// 初始化智能代理
router.post('/init', async (req, res) => {
  try {
    if (intelligentAgent) {
      await intelligentAgent.shutdown();
    }

    intelligentAgent = new IntelligentEmailAgent();
    
    // 设置事件监听器
    intelligentAgent.on('campaignStarted', (campaign) => {
      console.log('📢 活动已启动:', campaign.name);
    });

    intelligentAgent.on('leadsDiscovered', (leads) => {
      console.log('📢 发现新的潜在客户:', leads.length);
    });

    intelligentAgent.on('emailSent', ({ lead, emailContent }) => {
      console.log('📢 邮件已发送:', `${lead.name} (${lead.email})`);
    });

    intelligentAgent.on('replyReceived', ({ lead, reply, autoReply }) => {
      console.log('📢 收到回复:', `${lead.name} - ${autoReply ? '已自动回复' : '需人工处理'}`);
    });

    intelligentAgent.on('error', (error) => {
      console.error('📢 系统错误:', error);
    });

    res.json({
      success: true,
      message: '智能邮件代理初始化成功',
      data: {
        initialized: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('初始化智能代理失败:', error);
    res.status(500).json({
      success: false,
      error: '初始化失败: ' + error.message
    });
  }
});

// 配置SMTP
router.post('/configure-smtp', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    const smtpConfig = req.body;
    
    // 验证必需字段
    const required = ['host', 'port', 'username', 'password', 'senderName'];
    for (const field of required) {
      if (!smtpConfig[field]) {
        return res.status(400).json({
          success: false,
          error: `缺少必需字段: ${field}`
        });
      }
    }

    await intelligentAgent.configureSMTP(smtpConfig);

    res.json({
      success: true,
      message: 'SMTP配置成功',
      data: {
        configured: true,
        host: smtpConfig.host,
        username: smtpConfig.username,
        senderName: smtpConfig.senderName
      }
    });

  } catch (error) {
    console.error('配置SMTP失败:', error);
    res.status(500).json({
      success: false,
      error: 'SMTP配置失败: ' + error.message
    });
  }
});

// 启动智能邮件活动
router.post('/start-campaign', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    const campaignConfig = req.body;
    
    // 验证必需字段
    if (!campaignConfig.targetWebsite || !campaignConfig.goal) {
      return res.status(400).json({
        success: false,
        error: '请提供目标网站和营销目标'
      });
    }

    const campaign = await intelligentAgent.startCampaign(campaignConfig);

    res.json({
      success: true,
      message: '智能邮件活动已启动',
      data: campaign
    });

  } catch (error) {
    console.error('启动活动失败:', error);
    res.status(500).json({
      success: false,
      error: '启动活动失败: ' + error.message
    });
  }
});

// 停止活动
router.post('/stop-campaign', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    await intelligentAgent.stopCampaign();

    res.json({
      success: true,
      message: '智能邮件活动已停止',
      data: {
        stoppedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('停止活动失败:', error);
    res.status(500).json({
      success: false,
      error: '停止活动失败: ' + error.message
    });
  }
});

// 获取系统状态
router.get('/status', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.json({
        success: true,
        data: {
          agentInitialized: false,
          message: '智能代理未初始化'
        }
      });
    }

    const status = await intelligentAgent.getStatus();

    res.json({
      success: true,
      data: {
        agentInitialized: true,
        ...status,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取状态失败: ' + error.message
    });
  }
});

// 获取潜在客户列表
router.get('/leads', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { status } = req.query;
    const leads = await intelligentAgent.getLeads(status);

    res.json({
      success: true,
      data: {
        leads: leads,
        count: leads.length,
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error('获取潜在客户失败:', error);
    res.status(500).json({
      success: false,
      error: '获取潜在客户失败: ' + error.message
    });
  }
});

// 手动添加潜在客户
router.post('/leads', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const leadData = req.body;
    
    // 验证必需字段
    const required = ['name', 'email', 'company'];
    for (const field of required) {
      if (!leadData[field]) {
        return res.status(400).json({
          success: false,
          error: `缺少必需字段: ${field}`
        });
      }
    }

    const lead = await intelligentAgent.addManualLead(leadData);

    res.json({
      success: true,
      message: '潜在客户添加成功',
      data: lead
    });

  } catch (error) {
    console.error('添加潜在客户失败:', error);
    res.status(500).json({
      success: false,
      error: '添加潜在客户失败: ' + error.message
    });
  }
});

// 更新潜在客户状态
router.patch('/leads/:leadId/status', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { leadId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: '请提供状态'
      });
    }

    const success = await intelligentAgent.updateLeadStatus(leadId, status, notes);

    if (success) {
      res.json({
        success: true,
        message: '潜在客户状态更新成功',
        data: { leadId, status, notes }
      });
    } else {
      res.status(404).json({
        success: false,
        error: '潜在客户不存在'
      });
    }

  } catch (error) {
    console.error('更新潜在客户状态失败:', error);
    res.status(500).json({
      success: false,
      error: '更新状态失败: ' + error.message
    });
  }
});

// 获取邮件历史
router.get('/leads/:leadId/emails', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { leadId } = req.params;
    const emailHistory = await intelligentAgent.getEmailHistory(leadId);

    res.json({
      success: true,
      data: {
        leadId: leadId,
        emails: emailHistory,
        count: emailHistory.length
      }
    });

  } catch (error) {
    console.error('获取邮件历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取邮件历史失败: ' + error.message
    });
  }
});

// 获取对话历史
router.get('/leads/:leadEmail/conversations', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { leadEmail } = req.params;
    const conversations = await intelligentAgent.getConversationHistory(leadEmail);

    res.json({
      success: true,
      data: {
        leadEmail: leadEmail,
        conversations: conversations,
        count: conversations.length
      }
    });

  } catch (error) {
    console.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取对话历史失败: ' + error.message
    });
  }
});

// 启用/禁用自动回复
router.post('/auto-reply/toggle', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { enabled } = req.body;
    intelligentAgent.setAutoReplyEnabled(enabled);

    res.json({
      success: true,
      message: `自动回复已${enabled ? '启用' : '禁用'}`,
      data: { autoReplyEnabled: enabled }
    });

  } catch (error) {
    console.error('切换自动回复失败:', error);
    res.status(500).json({
      success: false,
      error: '切换自动回复失败: ' + error.message
    });
  }
});

// 获取知识库统计
router.get('/knowledge-base/stats', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const stats = await intelligentAgent.getKnowledgeBaseStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取知识库统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取知识库统计失败: ' + error.message
    });
  }
});

// 手动触发潜在客户发现
router.post('/discover-leads', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    // 手动触发潜在客户发现
    await intelligentAgent.performLeadDiscovery();

    res.json({
      success: true,
      message: '潜在客户发现任务已触发',
      data: {
        triggeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('触发潜在客户发现失败:', error);
    res.status(500).json({
      success: false,
      error: '触发潜在客户发现失败: ' + error.message
    });
  }
});

// 手动触发邮件发送
router.post('/send-emails', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    // 手动触发邮件发送
    await intelligentAgent.performEmailSending();

    res.json({
      success: true,
      message: '邮件发送任务已触发',
      data: {
        triggeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('触发邮件发送失败:', error);
    res.status(500).json({
      success: false,
      error: '触发邮件发送失败: ' + error.message
    });
  }
});

// 处理邮件回复 (Webhook接收)
router.post('/webhook/reply', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    const { leadEmail, subject, content, messageId } = req.body;

    if (!leadEmail || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的回复信息'
      });
    }

    // 模拟处理来信
    const replyData = {
      leadEmail,
      subject: subject || 'Re: Your inquiry',
      content,
      messageId: messageId || `reply_${Date.now()}`,
      receivedAt: new Date().toISOString()
    };

    await intelligentAgent.processIncomingReply(replyData);

    res.json({
      success: true,
      message: '邮件回复处理成功',
      data: {
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('处理邮件回复失败:', error);
    res.status(500).json({
      success: false,
      error: '处理邮件回复失败: ' + error.message
    });
  }
});

// 数据清理
router.post('/cleanup', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '智能代理未初始化'
      });
    }

    await intelligentAgent.cleanupData();

    res.json({
      success: true,
      message: '数据清理完成',
      data: {
        cleanedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('数据清理失败:', error);
    res.status(500).json({
      success: false,
      error: '数据清理失败: ' + error.message
    });
  }
});

// 系统重置
router.post('/reset', async (req, res) => {
  try {
    if (intelligentAgent) {
      await intelligentAgent.shutdown();
      intelligentAgent = null;
    }

    res.json({
      success: true,
      message: '系统已重置',
      data: {
        resetAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('系统重置失败:', error);
    res.status(500).json({
      success: false,
      error: '系统重置失败: ' + error.message
    });
  }
});

// 获取AI生成统计
router.get('/ai/stats', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.json({
        success: true,
        data: {
          agentInitialized: false,
          message: '智能代理未初始化'
        }
      });
    }

    const stats = {
      leadDiscovery: intelligentAgent.leadDiscovery.getKnowledgeBaseStats(),
      emailGeneration: intelligentAgent.emailGenerator.getGenerationStats(),
      autoReply: intelligentAgent.autoReply ? intelligentAgent.autoReply.getAutoReplyStats() : null
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取AI统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取AI统计失败: ' + error.message
    });
  }
});

// 测试完整工作流
router.post('/test/workflow', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    console.log('🧪 开始测试完整工作流程...');

    // 1. 配置测试SMTP
    const testSmtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'luzgool001@gmail.com',
      password: 'rksj xojs zqbs fnsg',
      senderName: 'Petpo AI Agent'
    };

    await intelligentAgent.configureSMTP(testSmtpConfig);
    console.log('✅ SMTP配置完成');

    // 2. 启动测试活动
    const testCampaign = {
      targetWebsite: 'https://example.com',
      goal: 'product_demo',
      campaignName: 'AI测试活动',
      companyName: 'Petpo',
      productName: 'AI Marketing Suite',
      dailyLimit: 10
    };

    const campaign = await intelligentAgent.startCampaign(testCampaign);
    console.log('✅ 测试活动启动');

    // 3. 等待一点时间让系统运行
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. 手动触发一些操作
    await intelligentAgent.performLeadDiscovery();
    console.log('✅ 潜在客户发现完成');

    await intelligentAgent.performEmailSending();
    console.log('✅ 邮件发送完成');

    // 5. 获取最终状态
    const finalStatus = await intelligentAgent.getStatus();

    res.json({
      success: true,
      message: '完整工作流测试完成',
      data: {
        campaign: campaign,
        finalStatus: finalStatus,
        testCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('工作流测试失败:', error);
    res.status(500).json({
      success: false,
      error: '工作流测试失败: ' + error.message
    });
  }
});

// 测试真实邮箱发现和发送
router.post('/test/real-emails', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    console.log('🧪 测试真实邮箱发现和发送...');

    // 1. 配置SMTP
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'luzgool001@gmail.com',
      password: 'rksj xojs zqbs fnsg',
      senderName: 'Petpo'
    };

    await intelligentAgent.configureSMTP(smtpConfig);
    console.log('✅ SMTP配置完成');

    // 2. 使用真实网站进行测试（从公开的商业邮箱开始）
    const realLeads = await intelligentAgent.enhancedLeadDiscovery.discoverRealLeads('https://www.tesla.com');
    console.log(`🔍 发现 ${realLeads.length} 个真实潜在客户`);

    const verifiedLeads = await intelligentAgent.enhancedLeadDiscovery.verifyLeads(realLeads);
    console.log(`✅ 验证了 ${verifiedLeads.length} 个有效邮箱`);

    // 3. 保存潜在客户到知识库
    for (const lead of verifiedLeads.slice(0, 3)) { // 限制测试3个
      await intelligentAgent.knowledgeBase.saveLead(lead);
    }

    // 4. 生成并发送真实邮件
    const emailResults = [];
    for (const lead of verifiedLeads.slice(0, 3)) {
      try {
        console.log(`📧 为 ${lead.name} (${lead.email}) 生成个性化邮件`);
        
        const emailContent = await intelligentAgent.emailGenerator.generatePersonalizedEmail(
          lead,
          'product_demo',
          {
            companyName: 'Petpo',
            productName: 'AI Marketing Suite',
            senderName: 'Petpo Team'
          }
        );

        console.log(`✉️ 邮件内容: ${emailContent.subject}`);
        console.log(`📝 邮件正文摘要: ${emailContent.body.substring(0, 100)}...`);

        // 实际发送邮件
        const transporter = require('nodemailer').createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password
          }
        });

        const mailOptions = {
          from: `\"${smtpConfig.senderName}\" <${smtpConfig.username}>`,
          to: lead.email,
          subject: emailContent.subject,
          html: intelligentAgent.formatEmailHTML(emailContent.body)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ 邮件已发送: ${info.messageId}`);

        emailResults.push({
          lead: lead,
          emailContent: emailContent,
          messageId: info.messageId,
          status: 'sent'
        });

        // 添加延迟避免被标记为垃圾邮件
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`❌ 发送邮件失败 ${lead.email}:`, error.message);
        emailResults.push({
          lead: lead,
          error: error.message,
          status: 'failed'
        });
      }
    }

    res.json({
      success: true,
      message: '真实邮箱测试完成',
      data: {
        discoveredLeads: realLeads.length,
        verifiedLeads: verifiedLeads.length,
        emailsSent: emailResults.filter(r => r.status === 'sent').length,
        emailsFailed: emailResults.filter(r => r.status === 'failed').length,
        results: emailResults,
        testCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('真实邮箱测试失败:', error);
    res.status(500).json({
      success: false,
      error: '真实邮箱测试失败: ' + error.message
    });
  }
});

// 测试完整的真实流程（AI增强版）
router.post('/test/complete-real-flow', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    const { targetWebsite, enableRealAPIs = false } = req.body;
    const testWebsite = targetWebsite || 'https://petpoofficial.org';

    console.log('🧪 测试完整的真实AI增强流程...');
    console.log(`🎯 目标网站: ${testWebsite}`);
    console.log(`🔧 真实API启用: ${enableRealAPIs}`);

    // 1. 配置SMTP
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'luzgool001@gmail.com',
      password: 'rksj xojs zqbs fnsg',
      senderName: 'Petpo AI Agent'
    };

    await intelligentAgent.configureSMTP(smtpConfig);
    console.log('✅ SMTP配置完成');

    // 2. AI增强业务分析
    console.log(`🤖 AI增强业务分析: ${testWebsite}`);
    const businessAnalysis = await intelligentAgent.enhancedLeadDiscovery.businessAnalyzer.analyzeTargetBusiness(testWebsite);
    
    // 尝试AI增强（如果配置了API密钥）
    let enhancedAnalysis = businessAnalysis;
    try {
      enhancedAnalysis = await intelligentAgent.enhancedLeadDiscovery.aiStrategyEngine.enhanceBusinessAnalysis(businessAnalysis);
      console.log('🎯 AI增强分析成功');
    } catch (error) {
      console.log('⚠️ AI增强分析失败，使用基础分析');
    }
    
    console.log('📊 最终业务分析:');
    console.log(`   公司: ${enhancedAnalysis.companyName}`);
    console.log(`   行业: ${enhancedAnalysis.industry}`);
    console.log(`   主要产品: ${enhancedAnalysis.mainProducts?.join(', ')}`);
    console.log(`   价值主张: ${enhancedAnalysis.valueProposition}`);
    if (enhancedAnalysis.aiEnhanced) {
      console.log(`   AI洞察: ${Object.keys(enhancedAnalysis.aiInsights || {}).join(', ')}`);
    }

    // 3. AI增强匹配策略生成
    console.log('🎯 生成AI增强匹配策略...');
    let matchingStrategy;
    try {
      matchingStrategy = await intelligentAgent.enhancedLeadDiscovery.aiStrategyEngine.generateEnhancedMatchingStrategy(enhancedAnalysis);
      console.log('✅ AI增强策略生成成功');
    } catch (error) {
      console.log('⚠️ AI策略生成失败，使用基础策略');
      matchingStrategy = intelligentAgent.enhancedLeadDiscovery.businessAnalyzer.generateLeadMatchingStrategy(enhancedAnalysis);
    }
    
    console.log(`   目标行业: ${matchingStrategy.targetIndustries?.join(', ')}`);
    console.log(`   个性化级别: ${matchingStrategy.personalizationLevel || '标准'}`);

    // 4. 真实潜在客户发现
    console.log('🔍 真实潜在客户发现...');
    const smartLeads = await intelligentAgent.enhancedLeadDiscovery.discoverRealLeads(testWebsite);
    console.log(`✅ 发现 ${smartLeads.length} 个真实潜在客户`);

    // 5. AI增强邮件生成示例
    const emailExamples = [];
    const processedLeads = [];
    
    for (const lead of smartLeads.slice(0, 3)) { // 处理前3个潜在客户
      console.log(`📧 为 ${lead.company} 生成AI增强邮件...`);
      
      try {
        // 生成AI增强邮件
        const emailContent = await intelligentAgent.emailGenerator.generatePersonalizedEmail(
          lead,
          'partnership',
          {
            companyName: enhancedAnalysis.companyName,
            productName: enhancedAnalysis.mainProducts?.[0] || 'AI Services',
            senderName: 'Petpo AI Team'
          }
        );

        emailExamples.push({
          lead: {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            industry: lead.smartAnalysis?.targetIndustry,
            matchReason: lead.smartAnalysis?.matchReason,
            synergies: lead.smartAnalysis?.synergies,
            relevanceScore: lead.smartAnalysis?.priority || 'medium'
          },
          email: {
            subject: emailContent.subject,
            bodyPreview: emailContent.body.substring(0, 400) + '...',
            personalizationLevel: emailContent.personalizationLevel,
            aiEnhanced: emailContent.aiEnhanced || false,
            businessAware: emailContent.businessAware || false,
            realAI: emailContent.realAI || false
          }
        });
        
        processedLeads.push({
          ...lead,
          emailGenerated: true,
          generatedAt: new Date().toISOString()
        });

        console.log(`   主题: ${emailContent.subject}`);
        console.log(`   个性化评分: ${emailContent.personalizationLevel}/100`);
        console.log(`   AI增强: ${emailContent.aiEnhanced ? '是' : '否'}`);

      } catch (error) {
        console.log(`   ❌ 邮件生成失败: ${error.message}`);
        emailExamples.push({
          lead: { name: lead.name, email: lead.email, company: lead.company },
          error: error.message
        });
      }
    }

    // 6. 系统性能评估
    const performanceMetrics = {
      businessAnalysisTime: '~2s',
      aiEnhancementAvailable: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      realSearchAvailable: enableRealAPIs && (
        !!process.env.GOOGLE_SEARCH_API_KEY || 
        !!process.env.YELP_API_KEY ||
        !!process.env.GOOGLE_PLACES_API_KEY
      ),
      leadDiscoverySuccess: smartLeads.length > 0,
      emailGenerationSuccess: emailExamples.filter(e => !e.error).length,
      overallSystemHealth: 'operational'
    };

    res.json({
      success: true,
      message: '完整真实流程测试完成',
      data: {
        testConfiguration: {
          targetWebsite: testWebsite,
          realAPIsEnabled: enableRealAPIs,
          aiEnhancementEnabled: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY
        },
        businessAnalysis: {
          companyName: enhancedAnalysis.companyName,
          industry: enhancedAnalysis.industry,
          mainProducts: enhancedAnalysis.mainProducts,
          valueProposition: enhancedAnalysis.valueProposition,
          aiEnhanced: enhancedAnalysis.aiEnhanced || false,
          aiInsights: enhancedAnalysis.aiInsights ? Object.keys(enhancedAnalysis.aiInsights) : []
        },
        matchingStrategy: {
          targetIndustries: matchingStrategy.targetIndustries,
          personalizedApproach: matchingStrategy.approachStrategy,
          aiGenerated: matchingStrategy.aiGenerated || false,
          specificity: matchingStrategy.specificity || 'standard'
        },
        leadDiscovery: {
          totalLeadsFound: smartLeads.length,
          processedLeads: processedLeads.length,
          averageRelevanceScore: smartLeads.reduce((sum, lead) => sum + (lead.relevanceScore || 50), 0) / smartLeads.length,
          realTimeSearch: true
        },
        emailGeneration: {
          totalEmails: emailExamples.length,
          successfulEmails: emailExamples.filter(e => !e.error).length,
          averagePersonalization: emailExamples
            .filter(e => e.email && e.email.personalizationLevel)
            .reduce((sum, e) => sum + e.email.personalizationLevel, 0) / 
            emailExamples.filter(e => e.email && e.email.personalizationLevel).length,
          aiEnhancedEmails: emailExamples.filter(e => e.email && e.email.aiEnhanced).length
        },
        emailExamples: emailExamples,
        performanceMetrics: performanceMetrics,
        recommendations: [
          !performanceMetrics.aiEnhancementAvailable ? '配置AI API密钥以启用高级个性化' : null,
          !performanceMetrics.realSearchAvailable ? '配置搜索API以获得更多真实潜在客户' : null,
          smartLeads.length < 5 ? '考虑扩大搜索范围或调整匹配策略' : null
        ].filter(Boolean),
        testCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('完整流程测试失败:', error);
    res.status(500).json({
      success: false,
      error: '完整流程测试失败: ' + error.message,
      stack: error.stack
    });
  }
});

// 测试智能业务分析和匹配（保留原有功能）
router.post('/test/smart-matching', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    const { targetWebsite } = req.body;
    const testWebsite = targetWebsite || 'https://petpoofficial.org';

    console.log('🧪 测试智能业务分析和匹配...');

    // 1. 配置SMTP
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'luzgool001@gmail.com',
      password: 'rksj xojs zqbs fnsg',
      senderName: 'Petpo'
    };

    await intelligentAgent.configureSMTP(smtpConfig);
    console.log('✅ SMTP配置完成');

    // 2. 深度分析目标网站
    console.log(`🔍 深度分析目标网站: ${testWebsite}`);
    const businessAnalysis = await intelligentAgent.enhancedLeadDiscovery.businessAnalyzer.analyzeTargetBusiness(testWebsite);
    
    console.log('📊 业务分析结果:');
    console.log(`   公司: ${businessAnalysis.companyName}`);
    console.log(`   行业: ${businessAnalysis.industry}`);
    console.log(`   主要产品: ${businessAnalysis.mainProducts.join(', ')}`);
    console.log(`   价值主张: ${businessAnalysis.valueProposition}`);

    // 3. 生成匹配策略
    const matchingStrategy = intelligentAgent.enhancedLeadDiscovery.businessAnalyzer.generateLeadMatchingStrategy(businessAnalysis);
    console.log('🎯 匹配策略:');
    console.log(`   目标行业: ${matchingStrategy.targetIndustries.join(', ')}`);
    console.log(`   理想客户: ${matchingStrategy.idealCustomerProfile.businessTypes.join(', ')}`);

    // 4. 发现匹配的潜在客户
    const smartLeads = await intelligentAgent.enhancedLeadDiscovery.discoverRealLeads(testWebsite);
    console.log(`✅ 发现 ${smartLeads.length} 个匹配的潜在客户`);

    // 5. 生成个性化邮件示例
    const emailExamples = [];
    for (const lead of smartLeads.slice(0, 2)) {
      console.log(`📧 为 ${lead.company} (${lead.smartAnalysis?.targetIndustry}) 生成个性化邮件`);
      
      const emailContent = await intelligentAgent.emailGenerator.generatePersonalizedEmail(
        lead,
        'partnership',
        {
          companyName: businessAnalysis.companyName,
          productName: businessAnalysis.mainProducts[0] || 'AI Services',
          senderName: 'Petpo Team'
        }
      );

      emailExamples.push({
        lead: {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          industry: lead.smartAnalysis?.targetIndustry,
          matchReason: lead.smartAnalysis?.matchReason,
          synergies: lead.smartAnalysis?.synergies
        },
        email: {
          subject: emailContent.subject,
          bodyPreview: emailContent.body.substring(0, 300) + '...',
          personalizationLevel: emailContent.personalizationLevel,
          businessAware: emailContent.businessAware
        }
      });
    }

    res.json({
      success: true,
      message: '智能匹配测试完成',
      data: {
        targetWebsite: testWebsite,
        businessAnalysis: {
          companyName: businessAnalysis.companyName,
          industry: businessAnalysis.industry,
          mainProducts: businessAnalysis.mainProducts,
          valueProposition: businessAnalysis.valueProposition,
          targetCustomers: businessAnalysis.targetCustomers
        },
        matchingStrategy: {
          targetIndustries: matchingStrategy.targetIndustries,
          idealCustomerProfile: matchingStrategy.idealCustomerProfile,
          approachStrategy: matchingStrategy.approachStrategy
        },
        smartLeads: smartLeads.length,
        emailExamples: emailExamples,
        testCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('智能匹配测试失败:', error);
    res.status(500).json({
      success: false,
      error: '智能匹配测试失败: ' + error.message
    });
  }
});

// AI驱动的真实潜在客户发现和定制化邮件发送
router.post('/test/ai-driven-outreach', async (req, res) => {
  try {
    if (!intelligentAgent) {
      return res.status(400).json({
        success: false,
        error: '请先初始化智能代理'
      });
    }

    console.log('🤖 开始AI驱动的真实潜在客户发现和定制化邮件发送...');

    const { targetWebsite, maxLeads = 3, campaignObjective = 'partnership' } = req.body;
    const websiteToAnalyze = targetWebsite || 'https://petpoofficial.org';

    // 导入AI驱动的组件
    const AIProspectDiscoveryEngine = require('../agents/AIProspectDiscoveryEngine');
    const AIEmailContentGenerator = require('../agents/AIEmailContentGenerator');
    
    const aiProspectEngine = new AIProspectDiscoveryEngine();
    const aiEmailGenerator = new AIEmailContentGenerator();

    // 1. 配置SMTP
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: 'luzgool001@gmail.com',
      password: 'rksj xojs zqbs fnsg',
      senderName: 'Petpo AI Team'
    };

    await intelligentAgent.configureSMTP(smtpConfig);
    console.log('✅ SMTP配置完成');

    // 2. AI深度分析目标业务
    console.log(`🔍 AI深度分析目标业务: ${websiteToAnalyze}`);
    const businessAnalysis = await intelligentAgent.enhancedLeadDiscovery.businessAnalyzer.analyzeTargetBusiness(websiteToAnalyze);
    console.log(`📊 业务分析完成: ${businessAnalysis.companyName} (${businessAnalysis.industry})`);

    // 3. AI生成搜索策略
    console.log('🎯 AI生成潜在客户搜索策略...');
    const searchStrategy = await aiProspectEngine.generateSearchStrategy(businessAnalysis);
    console.log(`✅ 搜索策略生成: ${searchStrategy.searchQueries?.length || 0} 个查询`);

    // 4. AI引导的真实搜索
    console.log('🔍 执行AI引导的真实潜在客户搜索...');
    const discoveredProspects = await aiProspectEngine.executeAIGuidedSearch(searchStrategy, businessAnalysis);
    console.log(`✅ AI发现 ${discoveredProspects.length} 个验证的潜在客户`);

    if (discoveredProspects.length === 0) {
      return res.json({
        success: true,
        message: 'AI搜索完成，但未发现符合条件的潜在客户',
        data: {
          searchStrategy: searchStrategy,
          businessAnalysis: {
            companyName: businessAnalysis.companyName,
            industry: businessAnalysis.industry,
            mainProducts: businessAnalysis.mainProducts
          },
          discoveredProspects: 0,
          recommendations: [
            '尝试扩大搜索范围',
            '调整搜索关键词',
            '考虑不同的目标行业',
            '检查Ollama模型连接'
          ]
        }
      });
    }

    const testLeads = discoveredProspects.slice(0, maxLeads);

    console.log(`📋 准备为 ${testLeads.length} 个AI验证的潜在客户生成完全定制化邮件`);

    // 5. AI生成完全定制化邮件并发送
    const emailResults = [];
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      }
    });

    for (const prospect of testLeads) {
      try {
        console.log(`🤖 为 ${prospect.company} 生成AI完全定制化邮件...`);
        console.log(`📊 潜在客户匹配分数: ${prospect.matchScore}/100`);
        console.log(`💼 业务类型: ${prospect.businessType}`);
        
        // 使用AI生成完全定制化的邮件内容
        const customEmail = await aiEmailGenerator.generateFullyCustomizedEmail(
          prospect,
          businessAnalysis,
          campaignObjective
        );

        console.log(`✉️ AI邮件主题: ${customEmail.subject}`);
        console.log(`📝 个性化评分: ${customEmail.personalizationLevel}/100`);
        console.log(`🎯 定制化级别: ${customEmail.fullyCustomized ? '完全定制' : '标准'}`);
        
        // 使用AI生成的HTML邮件内容
        const htmlBody = customEmail.body || `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${customEmail.plainTextBody ? customEmail.plainTextBody.split('\n').map(line => 
            line.trim() === '' ? '<br>' : `<p style="margin-bottom: 12px;">${line}</p>`
          ).join('') : '<p>AI生成的邮件内容</p>'}
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              <strong>AI分析:</strong> 匹配分数 ${prospect.matchScore}/100<br>
              <strong>业务关系:</strong> ${customEmail.relationshipAnalysis?.relationshipType || 'Partnership'}<br>
              <strong>成功概率:</strong> ${customEmail.relationshipAnalysis?.successProbability || 'N/A'}%<br>
              <strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}
            </p>
          </div>
        </div>`;

        const mailOptions = {
          from: `"${smtpConfig.senderName}" <${smtpConfig.username}>`,
          to: prospect.contactInfo.emails[0], // 使用第一个邮箱
          subject: customEmail.subject,
          html: htmlBody,
          text: customEmail.plainTextBody, // AI生成的纯文本版本
          headers: {
            'X-Campaign-Type': 'AI-Fully-Customized',
            'X-Lead-Industry': prospect.industry,
            'X-Match-Score': prospect.matchScore,
            'X-Business-Type': prospect.businessType,
            'X-AI-Generated': 'true',
            'X-Personalization-Score': customEmail.personalizationLevel
          }
        };

        // 发送真实邮件
        const emailAddress = prospect.contactInfo.emails[0];
        console.log(`🚀 发送AI定制邮件到 ${emailAddress}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ 邮件发送成功: ${info.messageId}`);

        emailResults.push({
          prospect: {
            company: prospect.company,
            email: emailAddress,
            industry: prospect.industry,
            businessType: prospect.businessType,
            matchScore: prospect.matchScore,
            aiAnalysis: prospect.aiAnalysis
          },
          email: {
            subject: customEmail.subject,
            messageId: info.messageId,
            personalizationLevel: customEmail.personalizationLevel,
            fullyCustomized: customEmail.fullyCustomized,
            aiGenerated: customEmail.aiGenerated,
            relationshipAnalysis: customEmail.relationshipAnalysis,
            emailStrategy: customEmail.emailStrategy,
            sentAt: new Date().toISOString()
          },
          status: 'sent',
          deliveryInfo: {
            accepted: info.accepted,
            rejected: info.rejected,
            pending: info.pending,
            response: info.response
          }
        });

        // 添加延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`❌ AI邮件生成/发送失败 ${prospect.company}:`, error.message);
        emailResults.push({
          prospect: {
            company: prospect.company,
            email: prospect.contactInfo?.emails?.[0] || 'unknown',
            industry: prospect.industry
          },
          error: error.message,
          status: 'failed',
          failedAt: new Date().toISOString()
        });
      }
    }

    // 6. AI驱动系统统计结果
    const sentEmails = emailResults.filter(r => r.status === 'sent').length;
    const failedEmails = emailResults.filter(r => r.status === 'failed').length;
    const avgPersonalization = emailResults
      .filter(r => r.email && r.email.personalizationLevel)
      .reduce((sum, r) => sum + r.email.personalizationLevel, 0) / sentEmails;
    const avgMatchScore = testLeads
      .reduce((sum, lead) => sum + (lead.matchScore || 0), 0) / testLeads.length;

    console.log(`📊 AI驱动邮件营销统计:`);
    console.log(`   成功发送: ${sentEmails}`);
    console.log(`   发送失败: ${failedEmails}`);
    console.log(`   平均个性化评分: ${avgPersonalization || 0}/100`);
    console.log(`   平均匹配评分: ${avgMatchScore || 0}/100`);
    console.log(`   完全定制化邮件: ${emailResults.filter(r => r.email?.fullyCustomized).length}`);

    res.json({
      success: true,
      message: 'AI驱动的真实潜在客户发现和定制化邮件发送完成',
      data: {
        testConfiguration: {
          targetWebsite: websiteToAnalyze,
          maxLeads: maxLeads,
          campaignObjective: campaignObjective,
          aiDriven: true,
          ollamaEnabled: true
        },
        businessAnalysis: {
          companyName: businessAnalysis.companyName,
          industry: businessAnalysis.industry,
          mainProducts: businessAnalysis.mainProducts,
          valueProposition: businessAnalysis.valueProposition
        },
        searchStrategy: {
          queries: searchStrategy.searchQueries,
          targetIndustries: searchStrategy.targetIndustries,
          validationCriteria: searchStrategy.prospectValidationCriteria,
          aiGenerated: true
        },
        prospectDiscovery: {
          totalDiscovered: discoveredProspects.length,
          aiValidated: discoveredProspects.filter(p => p.matchScore > 70).length,
          averageMatchScore: avgMatchScore,
          searchMethod: 'AI-guided real-time search'
        },
        emailResults: emailResults,
        aiMetrics: {
          totalEmails: emailResults.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails,
          averagePersonalization: avgPersonalization || 0,
          fullyCustomizedEmails: emailResults.filter(r => r.email?.fullyCustomized).length,
          aiGeneratedEmails: emailResults.filter(r => r.email?.aiGenerated).length,
          averageSuccessProbability: emailResults
            .filter(r => r.email?.relationshipAnalysis?.successProbability)
            .reduce((sum, r) => sum + r.email.relationshipAnalysis.successProbability, 0) / 
            emailResults.filter(r => r.email?.relationshipAnalysis?.successProbability).length || 0
        },
        deliveryDetails: emailResults.map(r => ({
          company: r.prospect?.company,
          recipient: r.prospect?.email,
          status: r.status,
          messageId: r.email?.messageId,
          subject: r.email?.subject,
          personalizationLevel: r.email?.personalizationLevel,
          matchScore: r.prospect?.matchScore,
          sentAt: r.email?.sentAt || r.failedAt
        })),
        recommendations: [
          sentEmails === 0 ? '检查Ollama模型连接和配置' : null,
          avgPersonalization < 80 ? '考虑配置更强大的AI模型以提高个性化' : null,
          discoveredProspects.length < 5 ? '尝试扩大搜索范围或调整关键词' : null
        ].filter(Boolean),
        testCompletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('真实邮件发送测试失败:', error);
    res.status(500).json({
      success: false,
      error: '真实邮件发送测试失败: ' + error.message,
      stack: error.stack
    });
  }
});

// 辅助函数：生成匹配原因
function generateMatchReason(businessAnalysis, contact) {
  if (businessAnalysis.industry === 'pet-tech' || businessAnalysis.industry === 'ai-ml') {
    if (contact.industry === 'technology') {
      return 'AI-powered solutions can enhance technology company operations and customer engagement';
    }
    if (contact.industry === 'entertainment') {
      return 'Entertainment companies can leverage AI for personalized content and customer experiences';
    }
  }
  
  return `${businessAnalysis.companyName}'s innovative solutions align with ${contact.company}'s business needs`;
}

// 辅助函数：生成协同效应
function generateSynergies(businessAnalysis, contact) {
  const synergies = [];
  
  if (businessAnalysis.industry === 'ai-ml') {
    synergies.push('AI-powered automation and efficiency');
    synergies.push('Enhanced customer experience through technology');
  }
  
  if (contact.industry === 'technology') {
    synergies.push('Technology integration opportunities');
    synergies.push('Innovation partnership potential');
  }
  
  if (contact.industry === 'entertainment') {
    synergies.push('Creative content generation solutions');
    synergies.push('Audience engagement enhancement');
  }
  
  return synergies.length > 0 ? synergies : ['Business growth partnership', 'Service enhancement opportunities'];
}

module.exports = router;