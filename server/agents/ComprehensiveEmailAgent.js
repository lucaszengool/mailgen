const nodemailer = require('nodemailer');
const EnhancedKnowledgeBase = require('../models/EnhancedKnowledgeBase');
const SmartBusinessAnalyzer = require('./SmartBusinessAnalyzer');
const MarketingStrategyAgent = require('./MarketingStrategyAgent');
const ProspectSearchAgent = require('./ProspectSearchAgent');
const OllamaLearningAgent = require('./OllamaLearningAgent');

class ComprehensiveEmailAgent {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.transporter = null;
    this.config = null;
    this.prospects = [];
    this.emailQueue = [];
    this.sentEmails = [];
    this.intervalId = null;
    this.smtpWorking = false;
    
    // AI代理
    this.marketingAgent = new MarketingStrategyAgent();
    this.prospectAgent = new ProspectSearchAgent();
    
    // 营销策略
    this.marketingStrategy = null;
    
    // 邮件监控
    this.emailMonitorInterval = null;
    this.autoReplyEnabled = true;
    
    // 知识库
    this.knowledgeBase = new EnhancedKnowledgeBase();
    
    // 学习代理
    this.learningAgent = new OllamaLearningAgent();
    
    // 邮件发送频率限制
    this.maxEmailsPerHour = 10;
    this.emailsSentThisHour = 0;
    this.hourlyResetTimer = null;
    this.lastEmailTime = null;
    this.emailTimes = []; // 记录最近一小时的发送时间
    
    // 初始化每小时重置计数器
    this.initializeHourlyReset();
  }

  // 初始化每小时重置
  initializeHourlyReset() {
    // 每小时重置邮件计数
    this.hourlyResetTimer = setInterval(() => {
      const now = Date.now();
      // 移除超过1小时的记录
      this.emailTimes = this.emailTimes.filter(time => now - time < 3600000);
      this.emailsSentThisHour = this.emailTimes.length;
      
      console.log(`⏰ 每小时邮件发送重置: ${this.emailsSentThisHour}/${this.maxEmailsPerHour}`);
      
      // 如果之前因为达到限制而暂停，现在可以继续
      if (this.emailsSentThisHour < this.maxEmailsPerHour && this.isPaused) {
        console.log('✅ 邮件发送限制解除，继续发送');
        this.isPaused = false;
      }
    }, 60000); // 每分钟检查一次
  }

  // 检查是否可以发送邮件
  canSendEmail() {
    const now = Date.now();
    // 移除超过1小时的记录
    this.emailTimes = this.emailTimes.filter(time => now - time < 3600000);
    this.emailsSentThisHour = this.emailTimes.length;
    
    return this.emailsSentThisHour < this.maxEmailsPerHour;
  }

  // 记录邮件发送
  recordEmailSent() {
    const now = Date.now();
    this.emailTimes.push(now);
    this.emailsSentThisHour = this.emailTimes.length;
    this.lastEmailTime = now;
    
    console.log(`📊 邮件发送计数: ${this.emailsSentThisHour}/${this.maxEmailsPerHour}`);
    
    // 如果达到限制，暂停代理
    if (this.emailsSentThisHour >= this.maxEmailsPerHour) {
      console.log('⚠️ 达到每小时邮件发送限制，暂停代理');
      this.isPaused = true;
    }
  }

  // 获取邮件发送统计
  getEmailStats() {
    const now = Date.now();
    // 移除超过1小时的记录
    this.emailTimes = this.emailTimes.filter(time => now - time < 3600000);
    this.emailsSentThisHour = this.emailTimes.length;
    
    return {
      sentThisHour: this.emailsSentThisHour,
      maxPerHour: this.maxEmailsPerHour,
      remaining: this.maxEmailsPerHour - this.emailsSentThisHour,
      canSend: this.canSendEmail(),
      isPaused: this.isPaused,
      lastEmailTime: this.lastEmailTime
    };
  }

  async initialize(config) {
    this.config = config;
    this.smtpWorking = false;
    
    console.log('🚀 初始化全面的AI邮件营销系统...');
    
    // 0. 连接知识库和学习代理
    await this.knowledgeBase.connect();
    await this.learningAgent.initialize();
    
    // 1. 分析目标网站
    console.log('🔍 第一步：分析目标网站...');
    const businessAnalysis = await this.analyzeTargetBusiness();
    
    // 2. 生成AI营销策略
    console.log('🧠 第二步：生成AI营销策略...');
    const strategyResult = await this.marketingAgent.generateMarketingStrategy(
      config.targetWebsite,
      config.campaignGoal,
      businessAnalysis,
      config.businessType || 'auto'
    );
    this.marketingStrategy = strategyResult.strategy;
    
    // 保存策略到知识库
    await this.knowledgeBase.saveMarketingStrategy({
      website: config.targetWebsite,
      goal: config.campaignGoal,
      strategy: this.marketingStrategy,
      business_analysis: businessAnalysis,
      created_at: new Date().toISOString()
    });
    
    // 3. 设置SMTP
    console.log('📧 第三步：配置SMTP连接...');
    await this.setupSMTP();
    
    // 4. 初始化邮件监控
    console.log('📨 第四步：初始化邮件监控系统...');
    this.initializeEmailMonitoring();
    
    console.log('✅ AI邮件营销系统初始化完成');
    return {
      success: true,
      strategy: this.marketingStrategy,
      smtp_status: this.smtpWorking ? 'working' : 'simulation_mode'
    };
  }

  async analyzeTargetBusiness() {
    try {
      const analyzer = new SmartBusinessAnalyzer();
      const analysis = await analyzer.analyzeTargetBusiness(
        this.config.targetWebsite,
        this.config.campaignGoal
      );
      
      // 保存分析结果到知识库
      await this.knowledgeBase.saveBusinessAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      console.error('❌ 业务分析失败:', error.message);
      return {
        companyName: 'Professional Organization',
        industry: 'general',
        valueProposition: '提供优质服务',
        targetMarket: ['business'],
        keyFeatures: ['quality', 'reliability']
      };
    }
  }

  async setupSMTP() {
    try {
      console.log('📧 设置SMTP配置:', {
        host: this.config.smtpConfig.host,
        port: this.config.smtpConfig.port,
        username: this.config.smtpConfig.username,
        senderName: this.config.smtpConfig.senderName
      });
      
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpConfig.host,
        port: this.config.smtpConfig.port,
        secure: this.config.smtpConfig.secure || false,
        auth: {
          user: this.config.smtpConfig.username,
          pass: this.config.smtpConfig.password
        }
      });

      await this.transporter.verify();
      this.smtpWorking = true;
      console.log('✅ SMTP连接验证成功 - 将发送真实邮件');
      console.log(`📧 发件人配置: ${this.config.smtpConfig.senderName} <${this.config.smtpConfig.username}>`);
    } catch (error) {
      console.error('❌ SMTP验证失败:', error.message);
      console.log('📧 运行在模拟模式 - 邮件将被记录但不发送');
      this.smtpWorking = false;
      this.transporter = null;
    }
  }

  initializeEmailMonitoring() {
    // 每30秒检查一次新回复
    this.emailMonitorInterval = setInterval(async () => {
      if (this.isRunning && !this.isPaused && this.autoReplyEnabled) {
        await this.checkForNewReplies();
      }
    }, 30000);
  }

  async start() {
    if (this.isRunning) return { success: false, error: 'Agent already running' };
    
    this.isRunning = true;
    this.isPaused = false;
    
    console.log('🚀 启动AI邮件营销代理...');
    
    try {
      // 开始主要工作流程
      await this.runMainWorkflow();
      
      return { success: true, message: 'AI邮件营销代理启动成功' };
    } catch (error) {
      console.error('❌ 代理启动失败:', error.message);
      this.isRunning = false;
      return { success: false, error: error.message };
    }
  }

  async runMainWorkflow() {
    console.log('📋 开始执行完整营销工作流...');
    
    // 步骤1：搜索潜在客户
    await this.discoverProspects();
    
    // 步骤2：为每个潜在客户生成个性化邮件
    await this.generatePersonalizedEmails();
    
    // 步骤3：开始发送邮件流程
    this.startEmailSendingProcess();
    
    // 步骤4：开始监控回复
    this.startReplyMonitoring();
    
    // 步骤5：启动学习代理
    await this.learningAgent.startContinuousLearning();
  }

  async discoverProspects() {
    console.log('🔍 AI搜索潜在客户中...');
    
    try {
      // 基于营销策略搜索潜在客户
      const discoveredProspects = await this.prospectAgent.searchProspects(
        this.marketingStrategy,
        this.marketingStrategy.target_audience.primary_segments[0] || 'business'
      );
      
      // 检查并保存到知识库，避免重复
      const uniqueProspects = [];
      for (const prospect of discoveredProspects) {
        // 检查是否已经存在该邮箱的联系人，避免重复
        const existingProspect = await this.knowledgeBase.getProspectByEmail(prospect.email);
        
        if (!existingProspect) {
          await this.knowledgeBase.addProspect(prospect);
          uniqueProspects.push(prospect);
          console.log(`➕ 新增联系人: ${prospect.email} (${prospect.company})`);
        } else {
          console.log(`🔄 跳过重复联系人: ${prospect.email} (已存在)`);
        }
      }
      
      this.prospects = uniqueProspects;
      console.log(`✅ 发现 ${this.prospects.length} 个潜在客户`);
      
    } catch (error) {
      console.error('❌ 潜在客户搜索失败:', error.message);
      // 不使用任何备用数据，直接抛出错误
      throw new Error(`潜在客户搜索失败: ${error.message}`);
    }
  }

  // 移除所有fallback数据生成

  async generatePersonalizedEmails() {
    console.log('🎯 生成个性化邮件内容...');
    
    // 去重prospects，防止重复生成邮件
    const uniqueProspects = this.prospects.filter((prospect, index, self) => 
      index === self.findIndex(p => p.email === prospect.email)
    );
    
    console.log(`📧 为 ${uniqueProspects.length} 个唯一客户生成邮件`);
    
    for (const prospect of uniqueProspects) {
      try {
        // 检查是否已经为该邮箱生成过邮件
        const existingEmail = this.emailQueue.find(email => 
          email.prospect.email === prospect.email
        );
        
        if (existingEmail) {
          console.log(`⚠️ 跳过重复邮件生成: ${prospect.email}`);
          continue;
        }
        
        // 获取该客户的邮件历史
        const emailHistory = await this.knowledgeBase.getEmailHistory(prospect.id);
        
        // 生成个性化邮件
        const emailData = await this.marketingAgent.generatePersonalizedEmail(
          prospect,
          this.marketingStrategy,
          emailHistory,
          this.config.targetWebsite
        );
        
        // 添加到发送队列
        const emailItem = {
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prospect,
          subject: emailData.subject,
          content: emailData.content,
          personalization_notes: emailData.personalization_notes,
          scheduled: new Date(), // 立即发送，不延迟
          status: 'queued',
          type: 'outbound'
        };
        
        this.emailQueue.push(emailItem);
        
        // 保存到知识库
        await this.knowledgeBase.saveEmail({
          prospect_id: prospect.id,
          subject: emailData.subject,
          content: emailData.content,
          type: 'outbound',
          status: 'queued',
          scheduled_at: emailItem.scheduled.toISOString(),
          personalization_notes: emailData.personalization_notes
        });
        
      } catch (error) {
        console.error(`❌ 为 ${prospect.company} 生成邮件失败:`, error.message);
      }
    }
    
    console.log(`✅ 生成 ${this.emailQueue.length} 封个性化邮件`);
  }

  startEmailSendingProcess() {
    console.log('📤 开始邮件发送流程...');
    
    // 每5秒检查并发送到期的邮件（立即发送模式）
    this.intervalId = setInterval(async () => {
      if (!this.isRunning || this.isPaused) return;
      
      await this.processPendingEmails();
    }, 5000); // 5秒检查一次，快速发送
    
    // 立即执行一次，不用等待
    this.processPendingEmails();
  }

  async processPendingEmails() {
    const now = new Date();
    const emailsToSend = this.emailQueue.filter(email => 
      email.status === 'queued' && email.scheduled <= now
    );

    for (const emailItem of emailsToSend) {
      if (!this.isRunning || this.isPaused) break;
      
      // 检查邮件发送频率限制
      if (!this.canSendEmail()) {
        console.log('⚠️ 达到每小时邮件发送限制，暂停发送');
        this.isPaused = true;
        break;
      }
      
      // 检查是否已经向该邮箱发送过邮件，防止重复发送
      const alreadySent = this.sentEmails.some(sent => 
        sent.prospect.email === emailItem.prospect.email
      );
      
      if (alreadySent) {
        console.log(`🚫 跳过重复邮件: ${emailItem.prospect.email} (已发送过)`);
        emailItem.status = 'skipped';
        this.emailQueue = this.emailQueue.filter(e => e !== emailItem);
        continue;
      }
      
      try {
        await this.sendEmail(emailItem);
        emailItem.status = 'sent';
        emailItem.sentAt = new Date();
        
        // 记录邮件发送
        this.recordEmailSent();
        
        // 移动到已发送列表
        this.sentEmails.push(emailItem);
        this.emailQueue = this.emailQueue.filter(e => e !== emailItem);
        
        console.log(`✅ 邮件已发送至 ${emailItem.prospect.email}`);
        
        // 更新知识库
        await this.knowledgeBase.updateProspect(emailItem.prospect.id, {
          status: 'contacted',
          last_contact: new Date().toISOString(),
          emails_sent: (emailItem.prospect.emails_sent || 0) + 1
        });
        
        // 发送间隔控制（短间隔测试）
        await this.delay(1000); // 1秒间隔，快速测试
        
      } catch (error) {
        console.error(`❌ 发送邮件失败 ${emailItem.prospect.email}:`, error.message);
        emailItem.status = 'failed';
        emailItem.error = error.message;
      }
    }
  }

  async sendEmail(emailItem) {
    const mailOptions = {
      from: `${this.config.smtpConfig.senderName} <${this.config.smtpConfig.username}>`,
      to: emailItem.prospect.email,
      subject: emailItem.subject,
      html: emailItem.content,
      headers: {
        'X-Campaign-ID': `marketing_${Date.now()}`,
        'X-Prospect-ID': emailItem.prospect.id
      }
    };
    
    console.log('📧 邮件发送配置:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    if (this.smtpWorking && this.transporter) {
      // 发送真实邮件
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 真实邮件已发送至 ${emailItem.prospect.email}`);
      
      // 保存邮件记录
      await this.knowledgeBase.saveEmail({
        prospect_id: emailItem.prospect.id,
        subject: emailItem.subject,
        content: emailItem.content,
        type: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_id: result.messageId
      });
      
      return result;
    } else {
      // 模拟邮件发送
      const result = {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        response: '邮件模拟发送 - SMTP未配置'
      };
      
      console.log(`📧 模拟邮件发送至 ${emailItem.prospect.email}`);
      console.log(`   主题: ${emailItem.subject}`);
      
      // 保存模拟邮件记录
      await this.knowledgeBase.saveEmail({
        prospect_id: emailItem.prospect.id,
        subject: emailItem.subject,
        content: emailItem.content,
        type: 'outbound',
        status: 'simulated',
        sent_at: new Date().toISOString(),
        message_id: result.messageId
      });
      
      return result;
    }
  }

  startReplyMonitoring() {
    console.log('👁️ 开始邮件回复监控...');
    
    // 这里可以集成真实的邮件监控服务
    // 目前使用模拟回复进行演示
    this.simulateIncomingReplies();
  }

  async simulateIncomingReplies() {
    // 模拟一些客户回复
    setTimeout(async () => {
      if (!this.isRunning) return;
      
      const repliedProspects = this.prospects.slice(0, 2); // 模拟前2个客户回复
      
      for (const prospect of repliedProspects) {
        const simulatedReply = {
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prospect_id: prospect.id,
          from: prospect.email,
          subject: `Re: ${this.marketingStrategy.messaging_framework.value_proposition}`,
          content: '我们对您的解决方案很感兴趣，能否提供更多详细信息？',
          received_at: new Date().toISOString(),
          type: 'inbound',
          status: 'new'
        };
        
        await this.handleIncomingReply(simulatedReply);
      }
    }, 120000); // 2分钟后模拟回复
  }

  async handleIncomingReply(incomingEmail) {
    console.log(`📩 收到 ${incomingEmail.from} 的回复`);
    
    try {
      // 保存回复到知识库
      await this.knowledgeBase.saveEmail({
        prospect_id: incomingEmail.prospect_id,
        subject: incomingEmail.subject,
        content: incomingEmail.content,
        type: 'inbound',
        status: 'received',
        received_at: incomingEmail.received_at,
        from_email: incomingEmail.from
      });
      
      // 更新潜在客户状态
      const prospect = this.prospects.find(p => p.id === incomingEmail.prospect_id);
      if (prospect) {
        prospect.status = 'replied';
        prospect.last_reply = incomingEmail.content;
        prospect.replies_received = (prospect.replies_received || 0) + 1;
        
        await this.knowledgeBase.updateProspect(prospect.id, {
          status: 'replied',
          last_reply: incomingEmail.content,
          replies_received: prospect.replies_received,
          last_contact: new Date().toISOString()
        });
      }
      
      // 如果启用自动回复，生成并发送回复
      if (this.autoReplyEnabled && prospect && !prospect.manual_intervention) {
        await this.generateAndSendAutoReply(prospect, incomingEmail);
      }
      
    } catch (error) {
      console.error('❌ 处理回复失败:', error.message);
    }
  }

  async generateAndSendAutoReply(prospect, incomingEmail) {
    console.log(`🤖 为 ${prospect.company} 生成自动回复...`);
    
    try {
      // 获取完整的邮件历史
      const emailHistory = await this.knowledgeBase.getEmailHistory(prospect.id);
      
      // 生成AI回复
      const replyData = await this.marketingAgent.generateReplyEmail(
        prospect,
        this.marketingStrategy,
        emailHistory,
        incomingEmail
      );
      
      // 创建回复邮件
      const replyEmail = {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prospect,
        subject: replyData.subject,
        content: replyData.content,
        type: 'auto_reply',
        scheduled: new Date(Date.now() + 300000), // 5分钟后发送
        status: 'queued',
        intent_analysis: replyData.intent_analysis,
        response_strategy: replyData.response_strategy,
        next_action: replyData.next_action
      };
      
      // 添加到发送队列
      this.emailQueue.push(replyEmail);
      
      console.log(`✅ 自动回复已排队: ${prospect.company}`);
      
    } catch (error) {
      console.error(`❌ 自动回复生成失败 ${prospect.company}:`, error.message);
    }
  }

  async checkForNewReplies() {
    // 在真实实现中，这里会检查邮箱服务器的新邮件
    // 目前使用知识库中的邮件状态模拟
    try {
      const newReplies = await this.knowledgeBase.getNewReplies();
      
      for (const reply of newReplies) {
        await this.handleIncomingReply(reply);
      }
      
    } catch (error) {
      console.error('❌ 检查新回复失败:', error.message);
    }
  }

  async stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.emailMonitorInterval) {
      clearInterval(this.emailMonitorInterval);
      this.emailMonitorInterval = null;
    }
    
    // 停止学习代理
    this.learningAgent.stopLearning();
    
    console.log('⏹️ AI邮件营销代理已停止');
    
    return { success: true, message: 'AI邮件营销代理停止成功' };
  }

  pause() {
    this.isPaused = !this.isPaused;
    console.log(`${this.isPaused ? '⏸️' : '▶️'} AI邮件营销代理 ${this.isPaused ? '暂停' : '恢复'}`);
    
    return {
      success: true,
      message: `AI邮件营销代理 ${this.isPaused ? '暂停' : '恢复'} 成功`
    };
  }

  setAutoReply(enabled, prospectId = null) {
    if (prospectId) {
      // 为特定客户设置自动回复
      const prospect = this.prospects.find(p => p.id === prospectId);
      if (prospect) {
        prospect.manual_intervention = !enabled;
        console.log(`${enabled ? '启用' : '禁用'} ${prospect.company} 的自动回复`);
      }
    } else {
      // 全局设置
      this.autoReplyEnabled = enabled;
      console.log(`${enabled ? '启用' : '禁用'} 全局自动回复`);
    }
  }

  getStats() {
    const totalSent = this.sentEmails.length;
    const totalQueued = this.emailQueue.filter(e => e.status === 'queued').length;
    const totalFailed = this.emailQueue.filter(e => e.status === 'failed').length;
    const totalReplies = this.prospects.reduce((sum, p) => sum + (p.replies_received || 0), 0);
    const activeClients = this.prospects.filter(p => p.status === 'replied').length;
    
    return {
      totalEmailsSent: totalSent,
      repliesReceived: totalReplies,
      activeClients: activeClients,
      conversionRate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : 0,
      avgResponseTime: 0, // 可以基于时间戳计算
      queuedEmails: totalQueued,
      failedEmails: totalFailed,
      discoveredProspects: this.prospects.length,
      autoReplyEnabled: this.autoReplyEnabled
    };
  }

  getCurrentTask() {
    if (!this.isRunning) return null;
    if (this.isPaused) return 'AI代理已暂停';
    
    const queuedCount = this.emailQueue.filter(e => e.status === 'queued').length;
    const mode = this.smtpWorking ? '发送' : '模拟';
    
    if (queuedCount > 0) {
      return `${mode}邮件中... (${queuedCount} 在队列中)`;
    } else if (this.prospects.length === 0) {
      return 'AI搜索潜在客户中...';
    } else {
      return `${mode}完成 - 监控回复中 (${this.prospects.length} 个客户)`;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ComprehensiveEmailAgent;