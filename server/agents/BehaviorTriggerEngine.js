// 行为触发器引擎 - 基于用户行为的智能邮件触发
const EnhancedEmailSequenceManager = require('./EnhancedEmailSequenceManager');

class BehaviorTriggerEngine {
  constructor() {
    this.sequenceManager = new EnhancedEmailSequenceManager();
    
    // 行为事件定义
    this.behaviorEvents = {
      // 邮件行为
      email_opened: { weight: 1, category: 'engagement' },
      email_clicked: { weight: 3, category: 'interest' },
      email_replied: { weight: 5, category: 'high_intent' },
      email_forwarded: { weight: 4, category: 'advocacy' },
      
      // 网站行为
      website_visited: { weight: 2, category: 'awareness' },
      pricing_page_viewed: { weight: 4, category: 'consideration' },
      demo_page_viewed: { weight: 5, category: 'high_intent' },
      contact_page_viewed: { weight: 5, category: 'high_intent' },
      case_studies_viewed: { weight: 3, category: 'research' },
      blog_article_read: { weight: 1, category: 'education' },
      
      // 社交媒体行为
      linkedin_profile_viewed: { weight: 2, category: 'research' },
      linkedin_post_engaged: { weight: 3, category: 'interest' },
      twitter_mention: { weight: 3, category: 'awareness' },
      
      // 下载/订阅行为
      whitepaper_downloaded: { weight: 4, category: 'lead_magnet' },
      webinar_registered: { weight: 4, category: 'education' },
      newsletter_subscribed: { weight: 2, category: 'awareness' },
      
      // 负面行为
      unsubscribed: { weight: -10, category: 'negative' },
      marked_as_spam: { weight: -15, category: 'negative' },
      bounced_email: { weight: -5, category: 'deliverability' }
    };
    
    // 用户行为得分系统
    this.scoringRules = {
      cold: { min: -10, max: 5, actions: ['nurture', 'educational_content'] },
      warm: { min: 6, max: 15, actions: ['targeted_content', 'case_studies'] },
      hot: { min: 16, max: 30, actions: ['demo_invite', 'sales_call'] },
      qualified: { min: 31, max: 100, actions: ['priority_follow_up', 'sales_handoff'] }
    };
    
    // 触发条件配置
    this.triggerConditions = {
      immediate: {
        email_replied: ['send_thank_you', 'notify_sales'],
        demo_page_viewed: ['send_demo_offer', 'accelerate_sequence'],
        pricing_page_viewed: ['send_pricing_info', 'offer_consultation'],
        contact_page_viewed: ['send_contact_follow_up', 'notify_sales']
      },
      delayed: {
        email_opened: { delay: 2, action: 'send_follow_up' }, // 2小时后
        website_visited: { delay: 24, action: 'send_targeted_content' }, // 24小时后
        whitepaper_downloaded: { delay: 48, action: 'send_related_content' } // 48小时后
      },
      accumulated: {
        multiple_email_opens: { threshold: 3, action: 'increase_engagement_score' },
        multiple_page_views: { threshold: 5, action: 'mark_as_interested' },
        social_engagement: { threshold: 2, action: 'add_to_social_sequence' }
      }
    };
    
    // 用户行为数据存储
    this.behaviorData = new Map();
    
    console.log('🎯 行为触发器引擎初始化完成');
  }

  // 记录用户行为事件
  async recordBehaviorEvent(userId, eventType, eventData = {}) {
    try {
      console.log(`📊 记录行为事件: ${userId} - ${eventType}`);
      
      // 获取或创建用户行为档案
      let userProfile = this.behaviorData.get(userId) || this.createUserProfile(userId);
      
      // 创建事件记录
      const event = {
        type: eventType,
        timestamp: new Date().toISOString(),
        data: eventData,
        weight: this.behaviorEvents[eventType]?.weight || 0,
        category: this.behaviorEvents[eventType]?.category || 'unknown'
      };
      
      // 添加到用户事件历史
      userProfile.events.push(event);
      
      // 更新用户得分
      userProfile.score += event.weight;
      userProfile.lastActivity = event.timestamp;
      
      // 更新用户阶段
      const previousStage = userProfile.stage;
      userProfile.stage = this.calculateUserStage(userProfile.score);
      
      // 保存更新的档案
      this.behaviorData.set(userId, userProfile);
      
      // 检查并执行触发器
      await this.processTriggers(userId, eventType, eventData, previousStage);
      
      console.log(`✅ 用户 ${userId} 行为得分: ${userProfile.score}, 阶段: ${userProfile.stage}`);
      
      return userProfile;
      
    } catch (error) {
      console.error('记录行为事件失败:', error);
      throw error;
    }
  }

  // 创建用户行为档案
  createUserProfile(userId) {
    return {
      userId,
      score: 0,
      stage: 'cold',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      events: [],
      triggers: [],
      sequences: [],
      preferences: {
        emailFrequency: 'normal',
        contentType: 'mixed',
        timeZone: 'UTC'
      }
    };
  }

  // 计算用户阶段
  calculateUserStage(score) {
    for (const [stage, range] of Object.entries(this.scoringRules)) {
      if (score >= range.min && score <= range.max) {
        return stage;
      }
    }
    return score > 100 ? 'qualified' : 'cold';
  }

  // 处理触发器
  async processTriggers(userId, eventType, eventData, previousStage) {
    try {
      const userProfile = this.behaviorData.get(userId);
      
      // 处理即时触发器
      if (this.triggerConditions.immediate[eventType]) {
        const actions = this.triggerConditions.immediate[eventType];
        for (const action of actions) {
          await this.executeTriggerAction(userId, action, eventData);
        }
      }
      
      // 处理延迟触发器
      if (this.triggerConditions.delayed[eventType]) {
        const trigger = this.triggerConditions.delayed[eventType];
        await this.scheduleDelayedAction(userId, trigger.action, trigger.delay, eventData);
      }
      
      // 处理累积触发器
      await this.checkAccumulatedTriggers(userId, eventType);
      
      // 处理阶段变化触发器
      if (previousStage !== userProfile.stage) {
        await this.handleStageTransition(userId, previousStage, userProfile.stage);
      }
      
    } catch (error) {
      console.error('处理触发器失败:', error);
    }
  }

  // 执行触发器动作
  async executeTriggerAction(userId, action, eventData) {
    console.log(`🎯 执行触发器动作: ${userId} - ${action}`);
    
    const userProfile = this.behaviorData.get(userId);
    if (!userProfile) return;
    
    switch (action) {
      case 'send_thank_you':
        await this.sendThankYouEmail(userId, eventData);
        break;
        
      case 'notify_sales':
        await this.notifySalesTeam(userId, eventData);
        break;
        
      case 'send_demo_offer':
        await this.sendDemoOffer(userId, eventData);
        break;
        
      case 'accelerate_sequence':
        await this.accelerateEmailSequence(userId);
        break;
        
      case 'send_pricing_info':
        await this.sendPricingInformation(userId);
        break;
        
      case 'offer_consultation':
        await this.offerConsultation(userId);
        break;
        
      case 'send_contact_follow_up':
        await this.sendContactFollowUp(userId);
        break;
        
      case 'send_follow_up':
        await this.sendFollowUpEmail(userId, eventData);
        break;
        
      case 'send_targeted_content':
        await this.sendTargetedContent(userId, eventData);
        break;
        
      case 'send_related_content':
        await this.sendRelatedContent(userId, eventData);
        break;
        
      default:
        console.log(`⚠️ 未知触发器动作: ${action}`);
    }
    
    // 记录触发器执行
    userProfile.triggers.push({
      action,
      executedAt: new Date().toISOString(),
      triggerEvent: eventData
    });
  }

  // 发送感谢邮件
  async sendThankYouEmail(userId, eventData) {
    const email = {
      type: 'thank_you',
      subject: 'Thank you for your reply!',
      content: 'Thank you for taking the time to respond. Our team will get back to you shortly.',
      priority: 'high',
      scheduledFor: new Date().toISOString()
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 通知销售团队
  async notifySalesTeam(userId, eventData) {
    console.log(`🔔 通知销售团队: 高意向用户 ${userId}`);
    
    const userProfile = this.behaviorData.get(userId);
    const notification = {
      userId,
      score: userProfile.score,
      stage: userProfile.stage,
      lastActivity: userProfile.lastActivity,
      triggerEvent: eventData,
      priority: userProfile.score > 20 ? 'urgent' : 'high',
      notifiedAt: new Date().toISOString()
    };
    
    // 这里可以集成到CRM或通知系统
    console.log('📢 销售通知:', notification);
  }

  // 发送演示邀请
  async sendDemoOffer(userId, eventData) {
    const email = {
      type: 'demo_offer',
      subject: 'Interested in a quick demo?',
      content: 'I noticed you were looking at our demo page. Would you like to schedule a personalized demo?',
      priority: 'high',
      scheduledFor: new Date(Date.now() + 30 * 60000).toISOString() // 30分钟后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 加速邮件序列
  async accelerateEmailSequence(userId) {
    console.log(`⚡ 加速邮件序列: ${userId}`);
    
    // 这里集成到序列管理器，将下一封邮件提前发送
    try {
      const sequences = await this.sequenceManager.loadAllSequences();
      const userSequence = sequences.find(seq => seq.prospectId === userId);
      
      if (userSequence) {
        const nextEmail = userSequence.emails.find(email => 
          email.status === 'scheduled' && new Date(email.scheduledFor) > new Date()
        );
        
        if (nextEmail) {
          // 提前2小时发送
          const acceleratedTime = new Date(Date.now() + 2 * 60 * 60000);
          nextEmail.scheduledFor = acceleratedTime.toISOString();
          
          await this.sequenceManager.saveAllSequences(sequences);
          console.log(`✅ 序列已加速: 下一封邮件将在 2 小时后发送`);
        }
      }
    } catch (error) {
      console.error('加速序列失败:', error);
    }
  }

  // 发送定价信息
  async sendPricingInformation(userId) {
    const email = {
      type: 'pricing_info',
      subject: 'Pricing information you requested',
      content: 'Here\'s the pricing information for our solutions. I\'d be happy to discuss which plan works best for you.',
      priority: 'high',
      scheduledFor: new Date(Date.now() + 15 * 60000).toISOString() // 15分钟后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 提供咨询服务
  async offerConsultation(userId) {
    const email = {
      type: 'consultation_offer',
      subject: 'Free consultation about our solutions',
      content: 'I noticed you\'re interested in our pricing. Would you like to schedule a free consultation to discuss your specific needs?',
      priority: 'high',
      scheduledFor: new Date(Date.now() + 30 * 60000).toISOString() // 30分钟后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 发送联系跟进邮件
  async sendContactFollowUp(userId) {
    const email = {
      type: 'contact_follow_up',
      subject: 'Thanks for visiting our contact page',
      content: 'I saw that you visited our contact page. Is there anything specific I can help you with?',
      priority: 'high',
      scheduledFor: new Date(Date.now() + 10 * 60000).toISOString() // 10分钟后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 发送跟进邮件
  async sendFollowUpEmail(userId, eventData) {
    const email = {
      type: 'follow_up',
      subject: 'Following up on your interest',
      content: 'I wanted to follow up on your recent activity. Is there anything I can help clarify?',
      priority: 'medium',
      scheduledFor: new Date(Date.now() + 2 * 60 * 60000).toISOString() // 2小时后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 发送针对性内容
  async sendTargetedContent(userId, eventData) {
    const email = {
      type: 'targeted_content',
      subject: 'Content that might interest you',
      content: 'Based on your recent activity, I thought you might find this content helpful.',
      priority: 'medium',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60000).toISOString() // 24小时后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 发送相关内容
  async sendRelatedContent(userId, eventData) {
    const email = {
      type: 'related_content',
      subject: 'More resources for you',
      content: 'Here are some additional resources that complement what you recently downloaded.',
      priority: 'medium',
      scheduledFor: new Date(Date.now() + 48 * 60 * 60000).toISOString() // 48小时后
    };
    
    await this.scheduleTriggeredEmail(userId, email);
  }

  // 安排延迟动作
  async scheduleDelayedAction(userId, action, delayHours, eventData) {
    const executeAt = new Date(Date.now() + delayHours * 60 * 60000);
    
    console.log(`⏰ 安排延迟动作: ${action} for ${userId} at ${executeAt.toISOString()}`);
    
    // 在实际实现中，这应该存储在数据库中，并由调度器处理
    setTimeout(async () => {
      await this.executeTriggerAction(userId, action, eventData);
    }, delayHours * 60 * 60000);
  }

  // 检查累积触发器
  async checkAccumulatedTriggers(userId, eventType) {
    const userProfile = this.behaviorData.get(userId);
    if (!userProfile) return;
    
    // 检查多次邮件打开
    if (eventType === 'email_opened') {
      const openEvents = userProfile.events.filter(e => e.type === 'email_opened');
      if (openEvents.length >= 3) {
        await this.executeTriggerAction(userId, 'increase_engagement_score', {});
      }
    }
    
    // 检查多次页面访问
    const websiteEvents = userProfile.events.filter(e => 
      e.type.includes('_viewed') || e.type === 'website_visited'
    );
    if (websiteEvents.length >= 5) {
      await this.executeTriggerAction(userId, 'mark_as_interested', {});
    }
  }

  // 处理阶段转换
  async handleStageTransition(userId, fromStage, toStage) {
    console.log(`🔄 用户阶段转换: ${userId} from ${fromStage} to ${toStage}`);
    
    // 根据新阶段调整邮件策略
    switch (toStage) {
      case 'warm':
        await this.switchToWarmSequence(userId);
        break;
      case 'hot':
        await this.switchToHotSequence(userId);
        break;
      case 'qualified':
        await this.triggerSalesHandoff(userId);
        break;
    }
  }

  // 切换到温暖用户序列
  async switchToWarmSequence(userId) {
    console.log(`🔥 切换到温暖用户序列: ${userId}`);
    // 这里可以创建专门的温暖用户邮件序列
  }

  // 切换到热门用户序列
  async switchToHotSequence(userId) {
    console.log(`🚀 切换到热门用户序列: ${userId}`);
    // 这里可以创建专门的热门用户邮件序列
  }

  // 触发销售交接
  async triggerSalesHandoff(userId) {
    console.log(`🤝 触发销售交接: ${userId}`);
    await this.notifySalesTeam(userId, { reason: 'qualified_lead' });
  }

  // 调度触发的邮件
  async scheduleTriggeredEmail(userId, emailData) {
    console.log(`📧 调度触发邮件: ${emailData.type} for ${userId}`);
    
    // 这里应该集成到邮件发送系统
    // 暂时记录到用户档案中
    const userProfile = this.behaviorData.get(userId);
    if (userProfile) {
      userProfile.sequences.push({
        type: 'triggered',
        email: emailData,
        scheduledAt: new Date().toISOString()
      });
    }
  }

  // 获取用户行为分析
  getUserAnalysis(userId) {
    const userProfile = this.behaviorData.get(userId);
    if (!userProfile) {
      return null;
    }
    
    // 分析用户行为模式
    const analysis = {
      userId,
      score: userProfile.score,
      stage: userProfile.stage,
      totalEvents: userProfile.events.length,
      lastActivity: userProfile.lastActivity,
      daysSinceFirstActivity: this.calculateDaysSince(userProfile.createdAt),
      eventsByCategory: this.categorizeEvents(userProfile.events),
      engagementTrend: this.calculateEngagementTrend(userProfile.events),
      predictedActions: this.predictNextActions(userProfile),
      recommendations: this.generateRecommendations(userProfile)
    };
    
    return analysis;
  }

  // 计算天数差
  calculateDaysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }

  // 分类事件
  categorizeEvents(events) {
    const categories = {};
    events.forEach(event => {
      const category = event.category;
      if (!categories[category]) {
        categories[category] = { count: 0, latestEvent: null };
      }
      categories[category].count++;
      if (!categories[category].latestEvent || 
          new Date(event.timestamp) > new Date(categories[category].latestEvent)) {
        categories[category].latestEvent = event.timestamp;
      }
    });
    return categories;
  }

  // 计算参与趋势
  calculateEngagementTrend(events) {
    // 简化的趋势计算：过去7天 vs 前7天
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60000);
    
    const recentEvents = events.filter(e => new Date(e.timestamp) >= sevenDaysAgo);
    const previousEvents = events.filter(e => 
      new Date(e.timestamp) >= fourteenDaysAgo && new Date(e.timestamp) < sevenDaysAgo
    );
    
    return {
      recent: recentEvents.length,
      previous: previousEvents.length,
      trend: recentEvents.length > previousEvents.length ? 'increasing' : 
             recentEvents.length < previousEvents.length ? 'decreasing' : 'stable'
    };
  }

  // 预测下一步行为
  predictNextActions(userProfile) {
    const stage = userProfile.stage;
    const recentEvents = userProfile.events.slice(-5); // 最近5个事件
    
    const predictions = [];
    
    if (stage === 'hot' && recentEvents.some(e => e.type === 'pricing_page_viewed')) {
      predictions.push({ action: 'request_demo', probability: 0.7 });
      predictions.push({ action: 'contact_sales', probability: 0.5 });
    }
    
    if (recentEvents.filter(e => e.type === 'email_opened').length >= 2) {
      predictions.push({ action: 'website_visit', probability: 0.6 });
    }
    
    return predictions;
  }

  // 生成推荐动作
  generateRecommendations(userProfile) {
    const recommendations = [];
    const stage = userProfile.stage;
    const recentEvents = userProfile.events.slice(-3);
    
    switch (stage) {
      case 'cold':
        recommendations.push('Send educational content');
        recommendations.push('Increase email frequency slightly');
        break;
      case 'warm':
        recommendations.push('Send case studies');
        recommendations.push('Invite to webinar');
        break;
      case 'hot':
        recommendations.push('Offer demo');
        recommendations.push('Send pricing information');
        break;
      case 'qualified':
        recommendations.push('Schedule sales call');
        recommendations.push('Send personalized proposal');
        break;
    }
    
    return recommendations;
  }

  // 获取所有用户的行为汇总
  getAllUsersSummary() {
    const summary = {
      totalUsers: this.behaviorData.size,
      usersByStage: { cold: 0, warm: 0, hot: 0, qualified: 0 },
      totalEvents: 0,
      avgScore: 0
    };
    
    let totalScore = 0;
    
    for (const [userId, profile] of this.behaviorData) {
      summary.usersByStage[profile.stage]++;
      summary.totalEvents += profile.events.length;
      totalScore += profile.score;
    }
    
    if (this.behaviorData.size > 0) {
      summary.avgScore = (totalScore / this.behaviorData.size).toFixed(2);
    }
    
    return summary;
  }
}

module.exports = BehaviorTriggerEngine;