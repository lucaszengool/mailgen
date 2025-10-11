// 智能邮件调度器 - 管理邮件发送时间和频率
const EnhancedEmailSequenceManager = require('./EnhancedEmailSequenceManager');
const MarketingStrategyAgent = require('./MarketingStrategyAgent');

class SmartEmailScheduler {
  constructor() {
    this.sequenceManager = new EnhancedEmailSequenceManager();
    this.marketingAgent = new MarketingStrategyAgent();
    
    // 智能发送时间优化
    this.optimalSendTimes = {
      b2b: {
        days: ['tuesday', 'wednesday', 'thursday'], // 最佳工作日
        hours: [9, 10, 11, 14, 15], // 上午9-11点，下午2-3点
        timezone: 'business_hours'
      },
      b2c: {
        days: ['tuesday', 'wednesday', 'saturday', 'sunday'],
        hours: [10, 11, 19, 20], // 上午10-11点，晚上7-8点
        timezone: 'local'
      }
    };
    
    // 发送频率限制 (避免被标记为垃圾邮件)
    this.sendingLimits = {
      hourly: 50,    // 每小时最多50封
      daily: 500,    // 每天最多500封
      perDomain: 10  // 每个域名每小时最多10封
    };
    
    // 邮件性能监控
    this.performanceThresholds = {
      minOpenRate: 15,    // 最低打开率15%
      minClickRate: 2,    // 最低点击率2%
      maxBounceRate: 5,   // 最高退回率5%
      maxUnsubscribeRate: 1 // 最高取消订阅率1%
    };
    
    this.sendingStats = {
      hourly: {},
      daily: {},
      domainCounts: {}
    };
    
    // 启动调度器
    this.startScheduler();
  }

  // 启动智能调度器
  startScheduler() {
    console.log('🚀 启动智能邮件调度器...');
    
    // 每分钟检查一次待发送邮件
    this.schedulerInterval = setInterval(() => {
      this.processScheduledEmails();
    }, 60000); // 1分钟
    
    // 每小时重置发送计数
    this.hourlyResetInterval = setInterval(() => {
      this.resetHourlyCounts();
    }, 3600000); // 1小时
    
    // 每天重置日发送计数
    this.dailyResetInterval = setInterval(() => {
      this.resetDailyCounts();
    }, 86400000); // 24小时
    
    console.log('✅ 智能调度器已启动');
  }

  // 处理计划发送的邮件
  async processScheduledEmails() {
    try {
      const scheduledEmails = await this.sequenceManager.getNextScheduledEmails();
      
      if (scheduledEmails.length === 0) {
        return; // 没有待发送邮件
      }
      
      console.log(`📧 发现 ${scheduledEmails.length} 封待发送邮件`);
      
      for (const email of scheduledEmails) {
        // 检查发送限制
        if (!this.canSendEmail(email)) {
          console.log(`⏸️ 暂停发送 ${email.prospectEmail} - 超出发送限制`);
          await this.rescheduleEmail(email, 'rate_limit');
          continue;
        }
        
        // 优化发送时间
        if (!this.isOptimalSendTime(email.sequenceType)) {
          console.log(`⏸️ 延迟发送 ${email.prospectEmail} - 非最佳时间`);
          await this.rescheduleToOptimalTime(email);
          continue;
        }
        
        // 发送邮件
        await this.sendScheduledEmail(email);
      }
      
    } catch (error) {
      console.error('处理计划邮件失败:', error);
    }
  }

  // 发送计划邮件
  async sendScheduledEmail(emailData) {
    try {
      console.log(`📤 发送序列邮件: ${emailData.type} to ${emailData.prospectEmail}`);
      
      // 生成AI个性化内容 (如果还没有)
      if (!emailData.personalizedContent) {
        emailData.personalizedContent = await this.generateAIContent(emailData);
      }
      
      // 模拟邮件发送 (集成到实际SMTP发送)
      const sendResult = await this.simulateEmailSend(emailData);
      
      if (sendResult.success) {
        // 更新发送统计
        this.updateSendingStats(emailData.prospectEmail);
        
        // 标记为已发送
        await this.sequenceManager.markEmailAsSent(
          emailData.sequenceId, 
          sendResult.messageId
        );
        
        console.log(`✅ 序列邮件发送成功: ${emailData.prospectEmail}`);
        
        // 调度下一封邮件 (如果有的话)
        await this.scheduleNextEmailInSequence(emailData);
        
      } else {
        console.error(`❌ 邮件发送失败: ${sendResult.error}`);
        await this.handleSendFailure(emailData, sendResult.error);
      }
      
    } catch (error) {
      console.error('发送计划邮件失败:', error);
      await this.handleSendFailure(emailData, error.message);
    }
  }

  // 生成AI个性化内容
  async generateAIContent(emailData) {
    try {
      const prospect = {
        email: emailData.prospectEmail,
        name: emailData.personalizationVars.first_name,
        company: emailData.personalizationVars.company_name
      };
      
      // 基于序列类型生成不同风格的内容
      const contentPrompt = this.generateContentPrompt(emailData);
      
      // 使用MarketingStrategyAgent生成内容
      const mockBusinessAnalysis = {
        companyName: emailData.personalizationVars.brand_name,
        industry: emailData.personalizationVars.industry,
        valueProposition: {
          primaryContent: {
            description: emailData.personalizationVars.benefit
          }
        }
      };
      
      const emailResult = await this.marketingAgent.generatePersonalizedEmail(
        prospect,
        { target_audience: { type: emailData.sequenceType.includes('b2b') ? 'tob' : 'toc' } },
        [],
        `https://${emailData.personalizationVars.brand_name.toLowerCase()}.com`
      );
      
      return {
        subject: emailData.personalizedSubject || emailResult.subject,
        content: emailResult.content,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('生成AI内容失败:', error);
      return {
        subject: emailData.personalizedSubject,
        content: this.generateFallbackContent(emailData),
        generatedAt: new Date().toISOString()
      };
    }
  }

  // 生成内容提示词
  generateContentPrompt(emailData) {
    const prompts = {
      introduction: `Write a brief, professional introduction email focusing on value proposition`,
      value_content: `Create an educational email sharing valuable insights and resources`,
      social_proof: `Write an email featuring customer success stories and testimonials`,
      objection_handling: `Address common concerns and objections professionally`,
      demo_offer: `Create a compelling demo invitation email`,
      scarcity: `Write an urgency-driven email with time-sensitive offers`,
      break_up: `Create a friendly break-up email for re-engagement`,
      welcome: `Write a warm welcome email for new subscribers`,
      tutorial: `Create a helpful tutorial/onboarding email`,
      reminder: `Write a gentle reminder email for abandoned carts`,
      incentive: `Create an incentive-driven email with special offers`
    };
    
    return prompts[emailData.type] || prompts.introduction;
  }

  // 生成备用内容
  generateFallbackContent(emailData) {
    const templates = {
      introduction: `Hi ${emailData.personalizationVars.first_name},\n\nI hope this email finds you well. I wanted to reach out because I believe ${emailData.personalizationVars.brand_name} could help ${emailData.personalizationVars.company_name} with ${emailData.personalizationVars.pain_point}.\n\nWould you be open to a brief conversation about how we can help?\n\nBest regards,\n${emailData.personalizationVars.brand_name} Team`,
      
      value_content: `Hi ${emailData.personalizationVars.first_name},\n\nI thought you might find this ${emailData.personalizationVars.resource_type} helpful for ${emailData.personalizationVars.company_name}.\n\nIt covers best practices for ${emailData.personalizationVars.benefit} in the ${emailData.personalizationVars.industry} industry.\n\nWould you like me to send it over?\n\nBest regards,\n${emailData.personalizationVars.brand_name} Team`,
      
      social_proof: `Hi ${emailData.personalizationVars.first_name},\n\nI wanted to share how ${emailData.personalizationVars.similar_company} achieved ${emailData.personalizationVars.result} using ${emailData.personalizationVars.brand_name}.\n\nI think ${emailData.personalizationVars.company_name} might see similar results.\n\nInterested in learning more?\n\nBest regards,\n${emailData.personalizationVars.brand_name} Team`
    };
    
    return templates[emailData.type] || templates.introduction;
  }

  // 检查是否可以发送邮件
  canSendEmail(email) {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toDateString();
    
    // 检查小时限制
    const hourlyKey = `${today}_${currentHour}`;
    if ((this.sendingStats.hourly[hourlyKey] || 0) >= this.sendingLimits.hourly) {
      return false;
    }
    
    // 检查日限制
    if ((this.sendingStats.daily[today] || 0) >= this.sendingLimits.daily) {
      return false;
    }
    
    // 检查域名限制
    const domain = email.prospectEmail.split('@')[1];
    const domainKey = `${hourlyKey}_${domain}`;
    if ((this.sendingStats.domainCounts[domainKey] || 0) >= this.sendingLimits.perDomain) {
      return false;
    }
    
    return true;
  }

  // 检查是否为最佳发送时间
  isOptimalSendTime(sequenceType) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    
    const businessType = sequenceType.includes('b2b') ? 'b2b' : 'b2c';
    const optimal = this.optimalSendTimes[businessType];
    
    return optimal.days.includes(currentDay) && optimal.hours.includes(currentHour);
  }

  // 重新调度到最佳时间
  async rescheduleToOptimalTime(email) {
    const now = new Date();
    const businessType = email.sequenceType.includes('b2b') ? 'b2b' : 'b2c';
    const optimal = this.optimalSendTimes[businessType];
    
    // 找到下一个最佳发送时间
    const nextOptimalTime = this.calculateNextOptimalTime(now, optimal);
    
    // 更新邮件发送时间 (这里需要实现数据库更新)
    console.log(`⏰ 重新调度邮件到最佳时间: ${nextOptimalTime.toISOString()}`);
  }

  // 计算下一个最佳发送时间
  calculateNextOptimalTime(currentTime, optimal) {
    const nextTime = new Date(currentTime);
    
    // 简化逻辑：找到下一个工作日的第一个最佳小时
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      nextTime.setDate(currentTime.getDate() + daysToAdd);
      const dayName = nextTime.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
      
      if (optimal.days.includes(dayName)) {
        nextTime.setHours(optimal.hours[0], 0, 0, 0);
        return nextTime;
      }
      daysToAdd++;
    }
    
    return nextTime;
  }

  // 更新发送统计
  updateSendingStats(email) {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toDateString();
    const domain = email.split('@')[1];
    
    // 更新小时统计
    const hourlyKey = `${today}_${currentHour}`;
    this.sendingStats.hourly[hourlyKey] = (this.sendingStats.hourly[hourlyKey] || 0) + 1;
    
    // 更新日统计
    this.sendingStats.daily[today] = (this.sendingStats.daily[today] || 0) + 1;
    
    // 更新域名统计
    const domainKey = `${hourlyKey}_${domain}`;
    this.sendingStats.domainCounts[domainKey] = (this.sendingStats.domainCounts[domainKey] || 0) + 1;
  }

  // 模拟邮件发送
  async simulateEmailSend(emailData) {
    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟95%成功率
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: 'SMTP connection failed'
      };
    }
  }

  // 处理发送失败
  async handleSendFailure(emailData, error) {
    console.log(`❌ 处理发送失败: ${emailData.prospectEmail} - ${error}`);
    
    // 重试逻辑
    if (error.includes('rate limit') || error.includes('connection')) {
      await this.rescheduleEmail(emailData, 'retry');
    } else {
      // 标记为失败，暂停序列
      console.log(`⏸️ 暂停序列: ${emailData.sequenceId}`);
    }
  }

  // 重新调度邮件
  async rescheduleEmail(emailData, reason) {
    const delay = reason === 'rate_limit' ? 30 : 60; // 分钟
    const newTime = new Date(Date.now() + delay * 60000);
    
    console.log(`⏰ 重新调度邮件: ${emailData.prospectEmail} 延迟 ${delay} 分钟`);
    // 这里需要更新数据库中的发送时间
  }

  // 调度序列中的下一封邮件
  async scheduleNextEmailInSequence(currentEmail) {
    // 序列管理器会自动处理这个逻辑
    console.log(`📅 下一封邮件已在序列中自动调度`);
  }

  // 重置计数器
  resetHourlyCounts() {
    const cutoffTime = Date.now() - 3600000; // 1小时前
    
    Object.keys(this.sendingStats.hourly).forEach(key => {
      const [date, hour] = key.split('_');
      const keyTime = new Date(`${date} ${hour}:00:00`).getTime();
      
      if (keyTime < cutoffTime) {
        delete this.sendingStats.hourly[key];
      }
    });
    
    console.log('⏰ 重置每小时发送计数');
  }

  resetDailyCounts() {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    Object.keys(this.sendingStats.daily).forEach(date => {
      if (date === yesterday) {
        delete this.sendingStats.daily[date];
      }
    });
    
    console.log('📅 重置每日发送计数');
  }

  // 获取发送统计
  getSendingStats() {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toDateString();
    const hourlyKey = `${today}_${currentHour}`;
    
    return {
      current: {
        hour: this.sendingStats.hourly[hourlyKey] || 0,
        day: this.sendingStats.daily[today] || 0,
        limits: this.sendingLimits
      },
      performance: this.performanceThresholds,
      status: this.isSchedulerRunning() ? 'running' : 'stopped'
    };
  }

  // 检查调度器状态
  isSchedulerRunning() {
    return !!this.schedulerInterval;
  }

  // 停止调度器
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    if (this.hourlyResetInterval) {
      clearInterval(this.hourlyResetInterval);
      this.hourlyResetInterval = null;
    }
    
    if (this.dailyResetInterval) {
      clearInterval(this.dailyResetInterval);
      this.dailyResetInterval = null;
    }
    
    console.log('⏹️ 智能调度器已停止');
  }

  // 手动触发邮件处理 (用于测试)
  async triggerManualProcessing() {
    console.log('🔄 手动触发邮件处理...');
    await this.processScheduledEmails();
  }
}

module.exports = SmartEmailScheduler;