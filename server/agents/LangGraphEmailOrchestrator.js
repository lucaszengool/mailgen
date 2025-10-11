// LangGraph风格的邮件营销工作流编排器
const EmailDiscoveryAgent = require('./EmailDiscoveryAgent');
const EnhancedEmailValidator = require('../services/EnhancedEmailValidator');
const ImprovedMarketingStrategy = require('./ImprovedMarketingStrategy');
const ContentStateManager = require('../services/ContentStateManager');

class LangGraphEmailOrchestrator {
  constructor() {
    // 初始化各个代理
    this.emailDiscovery = new EmailDiscoveryAgent();
    this.emailValidator = new EnhancedEmailValidator();
    this.strategyGenerator = new ImprovedMarketingStrategy();
    this.stateManager = new ContentStateManager();
    
    // LangGraph风格的状态管理
    this.workflowState = {
      currentStep: 'idle',
      progress: 0,
      data: {},
      errors: [],
      retryCount: 0,
      maxRetries: 3
    };
    
    // 定义工作流步骤
    this.workflowSteps = [
      'website_analysis',
      'strategy_generation', 
      'lead_discovery',
      'email_validation',
      'content_generation',
      'email_sending',
      'performance_tracking'
    ];
    
    // 步骤执行器映射
    this.stepExecutors = {
      website_analysis: this.executeWebsiteAnalysis.bind(this),
      strategy_generation: this.executeStrategyGeneration.bind(this),
      lead_discovery: this.executeLeadDiscovery.bind(this),
      email_validation: this.executeEmailValidation.bind(this),
      content_generation: this.executeContentGeneration.bind(this),
      email_sending: this.executeEmailSending.bind(this),
      performance_tracking: this.executePerformanceTracking.bind(this)
    };
    
    // 工作流统计
    this.stats = {
      workflowsStarted: 0,
      workflowsCompleted: 0,
      workflowsFailed: 0,
      avgExecutionTime: 0,
      totalEmailsDiscovered: 0,
      totalEmailsSent: 0
    };
  }

  // 启动完整的邮件营销工作流
  async startEmailMarketingWorkflow(config) {
    console.log('🚀 启动LangGraph邮件营销工作流');
    console.log(`📋 配置: ${JSON.stringify(config, null, 2)}`);
    
    this.stats.workflowsStarted++;
    const startTime = Date.now();
    
    // 初始化工作流状态
    this.workflowState = {
      currentStep: 'website_analysis',
      progress: 0,
      data: {
        config,
        website: config.targetWebsite,
        businessType: config.businessType || 'auto',
        campaignGoal: config.campaignGoal || 'promote product'
      },
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      startTime,
      sessionId: this.generateSessionId()
    };
    
    try {
      // 执行工作流步骤
      for (let i = 0; i < this.workflowSteps.length; i++) {
        const step = this.workflowSteps[i];
        this.workflowState.currentStep = step;
        this.workflowState.progress = Math.round((i / this.workflowSteps.length) * 100);
        
        console.log(`\n📍 执行步骤 ${i + 1}/${this.workflowSteps.length}: ${step}`);
        console.log(`📊 进度: ${this.workflowState.progress}%`);
        
        // 执行当前步骤
        const stepResult = await this.executeStep(step);
        
        if (!stepResult.success) {
          // 步骤失败，检查是否需要重试
          if (this.workflowState.retryCount < this.workflowState.maxRetries) {
            console.log(`⚠️ 步骤失败，重试 ${this.workflowState.retryCount + 1}/${this.workflowState.maxRetries}`);
            this.workflowState.retryCount++;
            i--; // 重试当前步骤
            continue;
          } else {
            throw new Error(`步骤 ${step} 失败: ${stepResult.error}`);
          }
        }
        
        // 步骤成功，重置重试计数
        this.workflowState.retryCount = 0;
        this.workflowState.data[step] = stepResult.data;
        
        console.log(`✅ 步骤 ${step} 完成`);
      }
      
      // 工作流完成
      this.workflowState.currentStep = 'completed';
      this.workflowState.progress = 100;
      
      const executionTime = Date.now() - startTime;
      this.stats.workflowsCompleted++;
      this.updateAvgExecutionTime(executionTime);
      
      console.log(`🎉 工作流完成! 执行时间: ${executionTime}ms`);
      
      return {
        success: true,
        sessionId: this.workflowState.sessionId,
        executionTime,
        data: this.workflowState.data,
        stats: this.generateWorkflowStats()
      };
      
    } catch (error) {
      console.error('❌ 工作流失败:', error.message);
      this.workflowState.errors.push(error.message);
      this.stats.workflowsFailed++;
      
      return {
        success: false,
        error: error.message,
        sessionId: this.workflowState.sessionId,
        partialData: this.workflowState.data,
        errors: this.workflowState.errors
      };
    }
  }

  // 执行单个步骤
  async executeStep(stepName) {
    try {
      const executor = this.stepExecutors[stepName];
      if (!executor) {
        throw new Error(`未找到步骤执行器: ${stepName}`);
      }
      
      const result = await executor();
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error(`❌ 步骤 ${stepName} 执行失败:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 步骤1: 网站分析
  async executeWebsiteAnalysis() {
    console.log('  🔍 分析目标网站...');
    
    const website = this.workflowState.data.website;
    const businessType = this.workflowState.data.businessType;
    
    // 使用改进的策略生成器进行网站分析
    const analysis = await this.strategyGenerator.analyzeWebsiteContent(website);
    
    // 确定业务类型
    const actualBusinessType = businessType === 'auto' ? 
      analysis.businessType : businessType;
    
    return {
      website,
      analysis,
      businessType: actualBusinessType,
      analyzedAt: new Date().toISOString()
    };
  }

  // 步骤2: 策略生成
  async executeStrategyGeneration() {
    console.log('  🎯 生成营销策略...');
    
    const { website, businessType } = this.workflowState.data.website_analysis;
    const campaignGoal = this.workflowState.data.campaignGoal;
    
    const strategy = await this.strategyGenerator.generateImprovedStrategy(
      website,
      campaignGoal,
      businessType
    );
    
    return {
      strategy,
      generatedAt: new Date().toISOString()
    };
  }

  // 步骤3: 潜在客户发现
  async executeLeadDiscovery() {
    console.log('  🔎 发现潜在客户邮件...');
    
    const { analysis } = this.workflowState.data.website_analysis;
    const { strategy } = this.workflowState.data.strategy_generation;
    
    // 提取公司和域名信息
    const company = analysis.title || 'Target Company';
    const domain = this.extractDomainFromUrl(analysis.website);
    
    // 使用邮件发现代理
    const discoveryResult = await this.emailDiscovery.discoverEmails(company, domain);
    
    // 生成基于策略的额外潜在客户
    const strategicLeads = this.generateStrategicLeads(strategy, discoveryResult);
    
    this.stats.totalEmailsDiscovered += discoveryResult.emails.length;
    
    return {
      discoveredEmails: discoveryResult.emails,
      discoveryStats: discoveryResult.stats,
      strategicLeads,
      totalFound: discoveryResult.emails.length + strategicLeads.length
    };
  }

  // 步骤4: 邮件验证
  async executeEmailValidation() {
    console.log('  ✅ 验证发现的邮件地址...');
    
    const { discoveredEmails, strategicLeads } = this.workflowState.data.lead_discovery;
    
    // 合并所有邮件地址
    const allEmails = [
      ...(discoveredEmails || []).map(e => typeof e === 'string' ? e : e.email),
      ...(strategicLeads || []).map(l => typeof l === 'string' ? l : l.email)
    ].filter(email => email && typeof email === 'string');
    
    // 批量验证
    const validationResults = await this.emailValidator.validateBulk(allEmails, {
      skipDNS: false // 进行完整验证
    });
    
    // 过滤有效邮件
    const validEmails = validationResults.valid.filter(v => v.confidence >= 0.7);
    
    return {
      totalValidated: allEmails.length,
      validEmails,
      validationStats: validationResults.stats,
      suggestions: validationResults.suggestions
    };
  }

  // 步骤5: 内容生成
  async executeContentGeneration() {
    console.log('  ✍️ 生成个性化内容...');
    
    const { strategy } = this.workflowState.data.strategy_generation;
    const { validEmails } = this.workflowState.data.email_validation;
    const website = this.workflowState.data.website;
    
    const generatedContent = [];
    
    // 为每个有效邮件生成个性化内容
    for (const emailData of validEmails.slice(0, 20)) { // 限制数量
      const content = this.generatePersonalizedContent(
        emailData.email,
        strategy,
        website
      );
      
      generatedContent.push({
        email: emailData.email,
        subject: content.subject,
        body: content.body,
        confidence: emailData.confidence,
        generatedAt: new Date().toISOString()
      });
    }
    
    return {
      totalGenerated: generatedContent.length,
      emailContents: generatedContent
    };
  }

  // 步骤6: 邮件发送
  async executeEmailSending() {
    console.log('  📧 模拟邮件发送...');
    
    const { emailContents } = this.workflowState.data.content_generation;
    
    // 模拟发送过程
    const sendResults = [];
    
    for (const content of emailContents) {
      // 模拟发送延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟发送成功率 (95%)
      const success = Math.random() > 0.05;
      
      sendResults.push({
        email: content.email,
        subject: content.subject,
        success,
        sentAt: success ? new Date().toISOString() : null,
        error: success ? null : 'Simulated send failure'
      });
    }
    
    const successfulSends = sendResults.filter(r => r.success);
    this.stats.totalEmailsSent += successfulSends.length;
    
    return {
      totalAttempted: sendResults.length,
      successful: successfulSends.length,
      failed: sendResults.length - successfulSends.length,
      sendResults
    };
  }

  // 步骤7: 性能跟踪
  async executePerformanceTracking() {
    console.log('  📊 生成性能报告...');
    
    const workflowData = this.workflowState.data;
    
    return {
      websiteAnalyzed: workflowData.website,
      emailsDiscovered: workflowData.lead_discovery?.totalFound || 0,
      emailsValidated: workflowData.email_validation?.totalValidated || 0,
      emailsValid: workflowData.email_validation?.validEmails?.length || 0,
      emailsGenerated: workflowData.content_generation?.totalGenerated || 0,
      emailsSent: workflowData.email_sending?.successful || 0,
      overallSuccessRate: this.calculateOverallSuccessRate(),
      recommendations: this.generateRecommendations()
    };
  }

  // 辅助方法
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
  }

  generateStrategicLeads(strategy, discoveryResult) {
    // 基于策略生成额外的潜在客户
    const leads = [];
    const targetType = strategy.targetAudience?.type || 'toc';
    
    if (targetType === 'tob') {
      // B2B潜在客户
      leads.push(
        { email: 'sales@example-corp.com', type: 'strategic', confidence: 0.6 },
        { email: 'business@partner-company.com', type: 'strategic', confidence: 0.6 }
      );
    } else {
      // B2C潜在客户
      leads.push(
        { email: 'user1@gmail.com', type: 'strategic', confidence: 0.5 },
        { email: 'customer@yahoo.com', type: 'strategic', confidence: 0.5 }
      );
    }
    
    return leads;
  }

  generatePersonalizedContent(email, strategy, website) {
    const isB2B = strategy.targetAudience?.type === 'tob';
    const websiteName = website.includes('headai') ? 'HeadAI' : 
                       website.includes('fruitai') ? 'FruitAI' : 'Our Platform';
    
    let subject, body;
    
    if (isB2B) {
      subject = `Transform Your Business with ${websiteName} - AI Solutions`;
      body = `Dear Business Leader,

I hope this email finds you well. I wanted to introduce you to ${websiteName}, our cutting-edge AI platform designed to revolutionize how businesses operate.

Key benefits:
• Streamlined operations with AI automation
• Data-driven insights for better decisions  
• Seamless integration with existing systems
• Proven ROI across various industries

Would you be interested in a brief demo to see how ${websiteName} can transform your business?

Best regards,
The ${websiteName} Team
${website}`;
    } else {
      subject = `Discover ${websiteName} - Your New AI Assistant`;
      body = `Hi there!

Have you ever wished for a smarter way to handle everyday tasks? ${websiteName} is here to help!

With ${websiteName}, you can:
• Save time with intelligent automation
• Make better decisions with AI insights
• Enjoy a simple, user-friendly experience

Try ${websiteName} today and see the difference AI can make in your life!

Best regards,
The ${websiteName} Team
${website}`;
    }
    
    return { subject, body };
  }

  calculateOverallSuccessRate() {
    const data = this.workflowState.data;
    const discovered = data.lead_discovery?.totalFound || 0;
    const sent = data.email_sending?.successful || 0;
    
    return discovered > 0 ? (sent / discovered * 100).toFixed(2) + '%' : '0%';
  }

  generateRecommendations() {
    const recommendations = [];
    const data = this.workflowState.data;
    
    if (data.email_validation?.validationStats?.disposable > 0) {
      recommendations.push('检测到一次性邮箱，建议使用更好的潜在客户源');
    }
    
    if (data.email_sending?.failed > 0) {
      recommendations.push('部分邮件发送失败，建议检查SMTP配置');
    }
    
    if (data.lead_discovery?.totalFound < 5) {
      recommendations.push('发现的邮件地址较少，建议扩展搜索策略');
    }
    
    return recommendations;
  }

  generateWorkflowStats() {
    return {
      executionStats: this.stats,
      currentWorkflow: {
        sessionId: this.workflowState.sessionId,
        progress: this.workflowState.progress,
        currentStep: this.workflowState.currentStep,
        errors: this.workflowState.errors
      }
    };
  }

  updateAvgExecutionTime(executionTime) {
    const totalWorkflows = this.stats.workflowsCompleted;
    this.stats.avgExecutionTime = (
      (this.stats.avgExecutionTime * (totalWorkflows - 1) + executionTime) / totalWorkflows
    );
  }

  // 获取当前工作流状态
  getWorkflowState() {
    return {
      ...this.workflowState,
      stats: this.stats
    };
  }

  // 重置工作流状态
  resetWorkflow() {
    this.workflowState = {
      currentStep: 'idle',
      progress: 0,
      data: {},
      errors: [],
      retryCount: 0,
      maxRetries: 3
    };
  }
}

module.exports = LangGraphEmailOrchestrator;