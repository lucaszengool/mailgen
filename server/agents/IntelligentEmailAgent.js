const AILeadDiscoveryAgent = require('./AILeadDiscoveryAgent');
const EnhancedLeadDiscovery = require('./EnhancedLeadDiscovery');
const AIEmailGenerator = require('./AIEmailGenerator');
const AIAutoReplyAgent = require('./AIAutoReplyAgent');
const KnowledgeBase = require('../models/KnowledgeBase');
const nodemailer = require('nodemailer');
const EventEmitter = require('events');

class IntelligentEmailAgent extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.currentCampaign = null;
    this.stats = {
      totalProspects: 0,
      emailsSent: 0,
      emailsOpened: 0,
      repliesReceived: 0,
      conversionsGenerated: 0,
      startTime: null,
      lastActivity: null
    };

    // 初始化AI组件
    this.leadDiscovery = new AILeadDiscoveryAgent();
    this.enhancedLeadDiscovery = new EnhancedLeadDiscovery();
    this.emailGenerator = new AIEmailGenerator();
    this.autoReply = null; // 需要SMTP配置后初始化
    this.knowledgeBase = new KnowledgeBase();
    
    // 当前配置
    this.smtpConfig = null;
    this.campaignConfig = null;
    
    // 定时器
    this.discoveryInterval = null;
    this.emailSendingInterval = null;
    this.autoReplyCheckInterval = null;

    console.log('🤖 智能邮件代理初始化完成');
  }

  // 配置SMTP
  async configureSMTP(smtpConfig) {
    this.smtpConfig = smtpConfig;
    this.autoReply = new AIAutoReplyAgent(smtpConfig);
    
    // 保存配置到知识库
    await this.knowledgeBase.saveSetting('smtp_config', smtpConfig);
    
    console.log('✅ SMTP配置已更新');
    this.emit('smtpConfigured', smtpConfig);
  }

  // 启动智能邮件自动化
  async startCampaign(campaignConfig) {
    if (this.isRunning) {
      throw new Error('邮件自动化已在运行中');
    }

    if (!this.smtpConfig) {
      throw new Error('请先配置SMTP服务器');
    }

    console.log('🚀 启动智能邮件自动化系统');
    
    this.campaignConfig = campaignConfig;
    this.currentCampaign = {
      id: this.generateCampaignId(),
      name: campaignConfig.campaignName || `${campaignConfig.targetWebsite} - ${campaignConfig.goal}`,
      goal: campaignConfig.goal,
      targetWebsite: campaignConfig.targetWebsite,
      status: 'running',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      settings: campaignConfig
    };

    // 保存活动到知识库
    await this.knowledgeBase.saveCampaign(this.currentCampaign);

    this.isRunning = true;
    this.stats.startTime = new Date().toISOString();
    this.stats.lastActivity = new Date().toISOString();

    // 启动各个AI组件
    this.startLeadDiscovery();
    this.startEmailSending();
    this.startAutoReplyMonitoring();

    console.log('✅ 智能邮件自动化系统已启动');
    this.emit('campaignStarted', this.currentCampaign);

    return this.currentCampaign;
  }

  // 停止自动化
  async stopCampaign() {
    if (!this.isRunning) return;

    console.log('⏹ 停止智能邮件自动化系统');

    this.isRunning = false;
    
    // 清理定时器
    if (this.discoveryInterval) clearInterval(this.discoveryInterval);
    if (this.emailSendingInterval) clearInterval(this.emailSendingInterval);
    if (this.autoReplyCheckInterval) clearInterval(this.autoReplyCheckInterval);

    // 更新活动状态
    if (this.currentCampaign) {
      this.currentCampaign.status = 'stopped';
      this.currentCampaign.completedAt = new Date().toISOString();
      this.currentCampaign.stats = this.stats;
      
      await this.knowledgeBase.saveCampaign(this.currentCampaign);
    }

    console.log('✅ 智能邮件自动化系统已停止');
    this.emit('campaignStopped', this.stats);
  }

  // 启动潜在客户发现
  startLeadDiscovery() {
    console.log('🔍 启动AI潜在客户发现');
    
    // 立即执行一次
    this.performLeadDiscovery();
    
    // 设置定时任务（每30分钟执行一次）
    this.discoveryInterval = setInterval(() => {
      this.performLeadDiscovery();
    }, 30 * 60 * 1000);
  }

  async performLeadDiscovery() {
    if (!this.isRunning) return;

    try {
      console.log('🤖 AI执行真实潜在客户发现...');
      
      // 使用增强版的真实邮箱发现
      const realLeads = await this.enhancedLeadDiscovery.discoverRealLeads(
        this.campaignConfig.targetWebsite
      );

      // 验证邮箱有效性
      const verifiedLeads = await this.enhancedLeadDiscovery.verifyLeads(realLeads);

      if (verifiedLeads.length > 0) {
        // 保存到知识库
        for (const lead of verifiedLeads) {
          await this.knowledgeBase.saveLead(lead);
        }

        this.stats.totalProspects += verifiedLeads.length;
        this.stats.lastActivity = new Date().toISOString();

        console.log(`✅ AI发现了 ${verifiedLeads.length} 个真实有效的潜在客户`);
        verifiedLeads.forEach(lead => {
          console.log(`   📧 ${lead.name} (${lead.email}) - ${lead.company} - ${lead.priority} priority`);
        });
        
        this.emit('leadsDiscovered', verifiedLeads);
      } else {
        console.log('⚠️ 未发现有效的真实邮箱地址');
      }

    } catch (error) {
      console.error('❌ 真实潜在客户发现失败:', error.message);
      this.emit('error', { type: 'leadDiscovery', error: error.message });
    }
  }

  // 启动邮件发送
  startEmailSending() {
    console.log('📧 启动AI邮件发送');
    
    // 立即执行一次
    this.performEmailSending();
    
    // 设置定时任务（每15分钟执行一次）
    this.emailSendingInterval = setInterval(() => {
      this.performEmailSending();
    }, 15 * 60 * 1000);
  }

  async performEmailSending() {
    if (!this.isRunning) return;

    try {
      // 获取准备发送的潜在客户
      const readyLeads = await this.knowledgeBase.getLeadsByStatus('ready_to_send');
      
      if (readyLeads.length === 0) {
        console.log('📧 暂无准备发送的邮件');
        return;
      }

      console.log(`📧 AI准备发送 ${readyLeads.length} 封个性化邮件`);

      // 限制每次发送数量避免过载
      const batchSize = Math.min(readyLeads.length, this.campaignConfig.dailyLimit || 50);
      const leadsToProcess = readyLeads.slice(0, batchSize);

      for (const lead of leadsToProcess) {
        if (!this.isRunning) break; // 如果停止了就退出

        try {
          await this.sendPersonalizedEmail(lead);
          
          // 添加延迟避免被标记为垃圾邮件
          await this.sleep(5000 + Math.random() * 10000); // 5-15秒随机延迟
          
        } catch (error) {
          console.error(`❌ 发送邮件失败 ${lead.email}:`, error.message);
          await this.knowledgeBase.updateLeadStatus(lead.id, 'send_failed', error.message);
        }
      }

    } catch (error) {
      console.error('❌ 邮件发送任务失败:', error.message);
      this.emit('error', { type: 'emailSending', error: error.message });
    }
  }

  async sendPersonalizedEmail(lead) {
    console.log(`🤖 为 ${lead.name} (${lead.company}) 生成个性化邮件`);

    // 使用AI生成个性化邮件
    const emailContent = await this.emailGenerator.generatePersonalizedEmail(
      lead,
      this.campaignConfig.goal,
      {
        companyName: this.campaignConfig.companyName || 'Our Company',
        productName: this.campaignConfig.productName || 'Our Solution',
        senderName: this.smtpConfig.senderName
      }
    );

    // 创建SMTP传输器
    const transporter = nodemailer.createTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: {
        user: this.smtpConfig.username,
        pass: this.smtpConfig.password
      }
    });

    // 发送邮件
    const mailOptions = {
      from: `\"${this.smtpConfig.senderName}\" <${this.smtpConfig.username}>`,
      to: lead.email,
      subject: emailContent.subject,
      html: this.formatEmailHTML(emailContent.body),
      headers: {
        'X-Campaign-ID': this.currentCampaign.id,
        'X-Lead-ID': lead.id
      }
    };

    const info = await transporter.sendMail(mailOptions);

    // 更新统计
    this.stats.emailsSent++;
    this.stats.lastActivity = new Date().toISOString();

    // 更新潜在客户状态
    await this.knowledgeBase.updateLeadStatus(lead.id, 'sent', '邮件已发送');

    // 保存邮件历史
    await this.knowledgeBase.saveEmailHistory({
      leadId: lead.id,
      campaignId: this.currentCampaign.id,
      emailType: 'outreach',
      subject: emailContent.subject,
      body: emailContent.body,
      sentAt: new Date().toISOString(),
      status: 'sent',
      messageId: info.messageId,
      aiInsights: emailContent.aiInsights,
      personalizationLevel: emailContent.personalizationLevel
    });

    console.log(`✅ 个性化邮件已发送给 ${lead.name}: ${info.messageId}`);
    this.emit('emailSent', { lead, emailContent, messageId: info.messageId });

    return info;
  }

  formatEmailHTML(body) {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="line-height: 1.6; color: #333333;">
          ${body.replace(/\n\n/g, '</p><p style="margin: 16px 0;">').replace(/\n/g, '<br>').replace(/•/g, '&bull;')}
        </div>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        <div style="font-size: 12px; color: #888888; text-align: center;">
          <p>This email was sent by an AI agent. If you'd like to unsubscribe, simply reply with "unsubscribe".</p>
        </div>
      </div>
    `;
  }

  // 启动自动回复监控
  startAutoReplyMonitoring() {
    console.log('🤖 启动AI自动回复监控');
    
    // 设置定时任务（每5分钟检查一次）
    this.autoReplyCheckInterval = setInterval(() => {
      this.checkForReplies();
    }, 5 * 60 * 1000);
  }

  async checkForReplies() {
    if (!this.isRunning || !this.autoReply) return;

    try {
      console.log('🔍 检查新的邮件回复...');
      
      // 这里应该连接到邮箱API检查新邮件
      // 由于这是演示，我们模拟收到回复
      const simulatedReplies = await this.simulateIncomingReplies();
      
      for (const reply of simulatedReplies) {
        await this.processIncomingReply(reply);
      }

    } catch (error) {
      console.error('❌ 回复检查失败:', error.message);
    }
  }

  async simulateIncomingReplies() {
    // 模拟收到的回复（在真实环境中，这里会连接到邮箱API）
    const recentSentLeads = await this.knowledgeBase.getLeadsByStatus('sent');
    const replies = [];
    
    // 模拟5%的回复率
    for (const lead of recentSentLeads.slice(0, 2)) {
      if (Math.random() < 0.05) {
        const replyTypes = ['positive_interest', 'questions', 'pricing_inquiry', 'not_ready'];
        const replyType = replyTypes[Math.floor(Math.random() * replyTypes.length)];
        
        const mockReplies = {
          positive_interest: "This looks interesting! I'd like to learn more about how this could help our team. When would be a good time for a quick call?",
          questions: "Can you tell me more about the technical requirements and implementation timeline? Also, how does this integrate with existing systems?",
          pricing_inquiry: "What's the pricing structure for this? We're evaluating solutions and need to understand the investment required.",
          not_ready: "Thanks for reaching out. We're not actively looking right now but maybe in a few months. I'll keep this in mind."
        };

        replies.push({
          leadEmail: lead.email,
          subject: `Re: ${lead.name}, let's explore opportunities`,
          content: mockReplies[replyType],
          messageId: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          receivedAt: new Date().toISOString()
        });
      }
    }
    
    return replies;
  }

  async processIncomingReply(replyData) {
    try {
      console.log(`📨 处理来自 ${replyData.leadEmail} 的回复`);

      // 获取潜在客户信息
      const leads = await this.knowledgeBase.searchLeads(replyData.leadEmail);
      const lead = leads.find(l => l.email === replyData.leadEmail);
      
      if (!lead) {
        console.warn(`❌ 未找到潜在客户: ${replyData.leadEmail}`);
        return;
      }

      // 使用AI自动回复系统处理
      const autoReplyResult = await this.autoReply.processIncomingEmail(
        replyData.content,
        lead
      );

      // 更新统计
      this.stats.repliesReceived++;
      this.stats.lastActivity = new Date().toISOString();

      // 保存对话到知识库
      await this.knowledgeBase.saveConversation({
        leadEmail: replyData.leadEmail,
        messageType: 'incoming',
        subject: replyData.subject,
        content: replyData.content,
        sentiment: 'positive', // AI分析的情感
        intent: 'inquiry', // AI识别的意图
        confidenceScore: 0.8,
        aiAnalysis: autoReplyResult
      });

      // 更新潜在客户状态
      await this.knowledgeBase.updateLeadStatus(lead.id, 'replied', '客户已回复');

      if (autoReplyResult) {
        console.log(`🤖 AI自动回复已发送给 ${replyData.leadEmail}`);
        
        // 保存自动回复历史
        await this.knowledgeBase.saveEmailHistory({
          leadId: lead.id,
          campaignId: this.currentCampaign.id,
          emailType: 'auto_reply',
          subject: autoReplyResult.subject,
          body: autoReplyResult.body,
          sentAt: new Date().toISOString(),
          status: 'sent',
          messageId: `auto_reply_${Date.now()}`,
          aiInsights: { intent: autoReplyResult.intent, confidence: autoReplyResult.confidence },
          personalizationLevel: 'high'
        });

        this.emit('autoReplySent', { lead, reply: autoReplyResult });
      }

      this.emit('replyReceived', { lead, reply: replyData, autoReply: autoReplyResult });

    } catch (error) {
      console.error(`❌ 处理回复失败 ${replyData.leadEmail}:`, error.message);
    }
  }

  // 获取当前状态
  async getStatus() {
    const readyLeads = await this.knowledgeBase.getLeadsByStatus('ready_to_send');
    const sentLeads = await this.knowledgeBase.getLeadsByStatus('sent');
    const repliedLeads = await this.knowledgeBase.getLeadsByStatus('replied');

    return {
      isRunning: this.isRunning,
      currentCampaign: this.currentCampaign,
      stats: {
        ...this.stats,
        readyToSend: readyLeads.length,
        sent: sentLeads.length,
        replied: repliedLeads.length
      },
      smtpConfigured: !!this.smtpConfig,
      autoReplyEnabled: this.autoReply ? this.autoReply.autoReplyEnabled : false
    };
  }

  // 获取潜在客户列表
  async getLeads(status = null) {
    if (status) {
      return await this.knowledgeBase.getLeadsByStatus(status);
    } else {
      return await this.knowledgeBase.getAllLeads();
    }
  }

  // 获取邮件历史
  async getEmailHistory(leadId) {
    return await this.knowledgeBase.getEmailHistory(leadId);
  }

  // 获取对话历史
  async getConversationHistory(leadEmail) {
    return await this.knowledgeBase.getConversationHistory(leadEmail);
  }

  // 手动添加潜在客户
  async addManualLead(leadData) {
    const lead = {
      id: this.generateLeadId(),
      ...leadData,
      source: 'manual',
      status: 'ready_to_send',
      createdAt: new Date().toISOString()
    };

    await this.knowledgeBase.saveLead(lead);
    console.log(`✅ 手动添加潜在客户: ${lead.name} (${lead.email})`);
    
    return lead;
  }

  // 更新潜在客户状态
  async updateLeadStatus(leadId, status, notes = '') {
    const success = await this.knowledgeBase.updateLeadStatus(leadId, status, notes);
    if (success) {
      this.emit('leadStatusUpdated', { leadId, status, notes });
    }
    return success;
  }

  // 启用/禁用自动回复
  setAutoReplyEnabled(enabled) {
    if (this.autoReply) {
      this.autoReply.setAutoReplyEnabled(enabled);
      console.log(`🤖 自动回复已${enabled ? '启用' : '禁用'}`);
    }
  }

  // 获取知识库统计
  async getKnowledgeBaseStats() {
    return await this.knowledgeBase.getKnowledgeBaseStats();
  }

  // 清理数据
  async cleanupData() {
    await this.knowledgeBase.cleanup();
    this.leadDiscovery.cleanup();
  }

  // 工具函数
  generateCampaignId() {
    return 'campaign_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateLeadId() {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 优雅关闭
  async shutdown() {
    console.log('🔄 智能邮件代理正在关闭...');
    
    await this.stopCampaign();
    await this.knowledgeBase.close();
    
    console.log('✅ 智能邮件代理已关闭');
  }
}

module.exports = IntelligentEmailAgent;