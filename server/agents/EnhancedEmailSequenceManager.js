// 增强的邮件序列管理器 - 集成传统EDM最佳实践
const fs = require('fs').promises;
const path = require('path');

class EnhancedEmailSequenceManager {
  constructor() {
    this.sequenceTemplates = this.initializeSequenceTemplates();
    this.sequenceDatabase = path.join(__dirname, '../data/email_sequences.json');
    this.performanceDatabase = path.join(__dirname, '../data/sequence_performance.json');
    
    // 邮件时间间隔配置 (基于研究的最佳实践)
    this.cadenceSettings = {
      b2b: {
        initial: 0,           // 立即发送
        followUp1: 3,         // 3天后
        followUp2: 7,         // 1周后  
        followUp3: 14,        // 2周后
        followUp4: 21,        // 3周后
        followUp5: 35,        // 5周后
        nurturing: 60,        // 长期培养
        reEngagement: 90      // 重新激活
      },
      b2c: {
        initial: 0,
        followUp1: 1,         // 1天后
        followUp2: 3,         // 3天后
        followUp3: 7,         // 1周后
        followUp4: 14,        // 2周后
        nurturing: 30,        // 长期培养
        reEngagement: 60      // 重新激活
      }
    };
    
    // 行为触发器配置
    this.behaviorTriggers = {
      email_opened: { priority: 'high', nextAction: 'send_follow_up' },
      email_clicked: { priority: 'very_high', nextAction: 'send_interest_content' },
      website_visited: { priority: 'high', nextAction: 'send_targeted_content' },
      no_response: { priority: 'medium', nextAction: 'send_value_content' },
      unsubscribed: { priority: 'low', nextAction: 'stop_sequence' },
      bounced: { priority: 'urgent', nextAction: 'verify_email' }
    };
  }

  // 初始化邮件序列模板 (基于研究的最佳实践)
  initializeSequenceTemplates() {
    return {
      b2b_lead_nurturing: {
        name: "B2B Lead Nurturing Sequence",
        description: "8-touch B2B sequence for lead conversion",
        totalEmails: 8,
        expectedConversionRate: 15,
        emails: [
          {
            sequence: 1,
            type: "introduction",
            subject_template: "Quick question about {{company_name}}'s {{pain_point}}",
            timing: "immediate",
            purpose: "Initial value proposition",
            cta: "Schedule brief call",
            expectedOpenRate: 25,
            expectedClickRate: 5
          },
          {
            sequence: 2,
            type: "value_content",
            subject_template: "{{resource_type}} for {{company_name}} - {{benefit}}",
            timing: "3_days",
            purpose: "Share valuable resource",
            cta: "Download resource",
            expectedOpenRate: 22,
            expectedClickRate: 8
          },
          {
            sequence: 3,
            type: "social_proof",
            subject_template: "How {{similar_company}} achieved {{result}} with {{solution}}",
            timing: "7_days",
            purpose: "Build credibility with case study",
            cta: "See full case study",
            expectedOpenRate: 20,
            expectedClickRate: 6
          },
          {
            sequence: 4,
            type: "objection_handling",
            subject_template: "Common concern: {{objection}} - here's how we address it",
            timing: "14_days",
            purpose: "Address common objections",
            cta: "Learn more",
            expectedOpenRate: 18,
            expectedClickRate: 7
          },
          {
            sequence: 5,
            type: "demo_offer",
            subject_template: "15-minute demo for {{company_name}}?",
            timing: "21_days",
            purpose: "Direct demo invitation",
            cta: "Book demo",
            expectedOpenRate: 16,
            expectedClickRate: 12
          },
          {
            sequence: 6,
            type: "scarcity",
            subject_template: "Last chance: {{offer}} expires {{date}}",
            timing: "35_days",
            purpose: "Create urgency",
            cta: "Claim offer",
            expectedOpenRate: 24,
            expectedClickRate: 15
          },
          {
            sequence: 7,
            type: "break_up",
            subject_template: "Should I stop reaching out, {{first_name}}?",
            timing: "50_days",
            purpose: "Re-engagement attempt",
            cta: "Let me know",
            expectedOpenRate: 28,
            expectedClickRate: 18
          },
          {
            sequence: 8,
            type: "long_term_value",
            subject_template: "{{industry_insight}} - thought you'd find this interesting",
            timing: "90_days",
            purpose: "Long-term relationship building",
            cta: "Share thoughts",
            expectedOpenRate: 15,
            expectedClickRate: 5
          }
        ]
      },
      
      b2c_conversion: {
        name: "B2C Conversion Sequence",
        description: "6-touch B2C sequence for product conversion",
        totalEmails: 6,
        expectedConversionRate: 25,
        emails: [
          {
            sequence: 1,
            type: "welcome",
            subject_template: "Welcome to {{brand_name}}, {{first_name}}! 🎉",
            timing: "immediate",
            purpose: "Welcome and set expectations",
            cta: "Explore features",
            expectedOpenRate: 45,
            expectedClickRate: 15
          },
          {
            sequence: 2,
            type: "tutorial",
            subject_template: "Get started with {{product_name}} in 3 easy steps",
            timing: "1_day",
            purpose: "Onboarding and education",
            cta: "Start tutorial",
            expectedOpenRate: 35,
            expectedClickRate: 20
          },
          {
            sequence: 3,
            type: "social_proof",
            subject_template: "{{number}} people love {{product_name}} - here's why",
            timing: "3_days",
            purpose: "Build trust with testimonials",
            cta: "Read reviews",
            expectedOpenRate: 30,
            expectedClickRate: 12
          },
          {
            sequence: 4,
            type: "special_offer",
            subject_template: "Exclusive {{discount}}% off for {{first_name}} ✨",
            timing: "7_days",
            purpose: "Incentivize purchase",
            cta: "Get discount",
            expectedOpenRate: 40,
            expectedClickRate: 25
          },
          {
            sequence: 5,
            type: "urgency",
            subject_template: "{{first_name}}, your {{discount}}% discount expires tomorrow",
            timing: "14_days",
            purpose: "Create urgency",
            cta: "Use discount now",
            expectedOpenRate: 50,
            expectedClickRate: 35
          },
          {
            sequence: 6,
            type: "retention",
            subject_template: "Miss us? Here's what's new at {{brand_name}}",
            timing: "30_days",
            purpose: "Re-engagement and retention",
            cta: "See what's new",
            expectedOpenRate: 25,
            expectedClickRate: 10
          }
        ]
      },
      
      abandoned_cart: {
        name: "Abandoned Cart Recovery",
        description: "4-email cart recovery sequence",
        totalEmails: 4,
        expectedConversionRate: 35,
        emails: [
          {
            sequence: 1,
            type: "reminder",
            subject_template: "You left something in your cart, {{first_name}}",
            timing: "1_hour",
            purpose: "Gentle reminder",
            cta: "Complete purchase",
            expectedOpenRate: 55,
            expectedClickRate: 30
          },
          {
            sequence: 2,
            type: "incentive",
            subject_template: "{{discount}}% off your cart - limited time!",
            timing: "24_hours",
            purpose: "Offer discount incentive",
            cta: "Use discount",
            expectedOpenRate: 45,
            expectedClickRate: 40
          },
          {
            sequence: 3,
            type: "scarcity",
            subject_template: "Almost gone: {{product_name}} selling fast",
            timing: "72_hours",
            purpose: "Create scarcity",
            cta: "Secure yours now",
            expectedOpenRate: 40,
            expectedClickRate: 35
          },
          {
            sequence: 4,
            type: "final_chance",
            subject_template: "Last chance to complete your order",
            timing: "7_days",
            purpose: "Final recovery attempt",
            cta: "Complete order",
            expectedOpenRate: 35,
            expectedClickRate: 25
          }
        ]
      }
    };
  }

  // 创建个性化邮件序列
  async createPersonalizedSequence(prospect, businessAnalysis, campaignGoal, businessType) {
    console.log(`📧 为 ${prospect.company || prospect.email} 创建个性化邮件序列...`);
    
    // 选择合适的序列模板
    const sequenceType = this.selectOptimalSequence(businessType, campaignGoal, prospect);
    const template = this.sequenceTemplates[sequenceType];
    
    // 生成个性化变量
    const personalizationVars = await this.generatePersonalizationVariables(
      prospect, businessAnalysis, campaignGoal
    );
    
    // 创建完整序列
    const emailSequence = {
      sequenceId: this.generateSequenceId(),
      prospectId: prospect.email,
      sequenceType,
      businessType,
      campaignGoal,
      status: 'active',
      createdAt: new Date().toISOString(),
      personalizationVars,
      emails: template.emails.map(emailTemplate => ({
        ...emailTemplate,
        sequenceId: this.generateSequenceId(),
        prospectEmail: prospect.email,
        scheduledFor: this.calculateSendTime(emailTemplate.timing, businessType),
        status: 'scheduled',
        personalizedSubject: this.personalizeSubject(emailTemplate.subject_template, personalizationVars),
        personalizedContent: null, // 将通过AI生成
        createdAt: new Date().toISOString()
      })),
      performance: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        conversionStatus: 'pending'
      }
    };
    
    // 保存序列到数据库
    await this.saveSequence(emailSequence);
    
    console.log(`✅ 创建了 ${template.totalEmails} 封邮件的序列 (${sequenceType})`);
    return emailSequence;
  }

  // 选择最优序列类型
  selectOptimalSequence(businessType, campaignGoal, prospect) {
    // 基于业务类型和目标选择序列
    if (businessType === 'tob' || businessType === 'b2b') {
      return 'b2b_lead_nurturing';
    } else if (businessType === 'toc' || businessType === 'b2c') {
      if (campaignGoal.includes('convert') || campaignGoal.includes('purchase')) {
        return 'b2c_conversion';
      }
      return 'b2c_conversion';
    }
    
    // 默认返回B2B序列
    return 'b2b_lead_nurturing';
  }

  // 生成个性化变量
  async generatePersonalizationVariables(prospect, businessAnalysis, campaignGoal) {
    const websiteName = businessAnalysis.companyName || 'Our Platform';
    const industry = businessAnalysis.industry || 'technology';
    const valueProposition = businessAnalysis.valueProposition?.primaryContent?.description || 'AI solutions';
    
    return {
      first_name: this.extractFirstName(prospect.name || prospect.email),
      company_name: prospect.company || 'your company',
      brand_name: websiteName,
      product_name: websiteName,
      industry: industry,
      pain_point: this.generatePainPoint(industry),
      benefit: this.generateBenefit(valueProposition),
      solution: websiteName,
      resource_type: this.selectResourceType(campaignGoal),
      similar_company: this.generateSimilarCompany(industry),
      result: this.generateResult(campaignGoal),
      objection: this.generateCommonObjection(industry),
      offer: this.generateOffer(campaignGoal),
      discount: '20', // 可配置
      number: Math.floor(Math.random() * 1000) + 500, // 动态生成
      industry_insight: this.generateIndustryInsight(industry),
      date: this.generateOfferExpiryDate()
    };
  }

  // 计算发送时间
  calculateSendTime(timing, businessType) {
    const now = new Date();
    const cadence = this.cadenceSettings[businessType] || this.cadenceSettings.b2b;
    
    let daysToAdd = 0;
    
    switch(timing) {
      case 'immediate': daysToAdd = cadence.initial; break;
      case '1_hour': daysToAdd = 0; break; // 1小时后
      case '1_day': daysToAdd = cadence.followUp1; break;
      case '3_days': daysToAdd = cadence.followUp1; break;
      case '7_days': daysToAdd = cadence.followUp2; break;
      case '14_days': daysToAdd = cadence.followUp3; break;
      case '21_days': daysToAdd = cadence.followUp4; break;
      case '35_days': daysToAdd = cadence.followUp5; break;
      case '50_days': daysToAdd = 50; break;
      case '90_days': daysToAdd = cadence.reEngagement; break;
      case '24_hours': daysToAdd = 1; break;
      case '72_hours': daysToAdd = 3; break;
      default: daysToAdd = 1;
    }
    
    const scheduledTime = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    
    // 确保在工作时间发送 (上午9点-下午5点)
    scheduledTime.setHours(Math.floor(Math.random() * 8) + 9); // 9-17点
    scheduledTime.setMinutes(Math.floor(Math.random() * 60));
    
    return scheduledTime.toISOString();
  }

  // 个性化主题行
  personalizeSubject(template, vars) {
    let subject = template;
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, vars[key]);
    });
    return subject;
  }

  // 获取下一封待发送的邮件
  async getNextScheduledEmails() {
    try {
      const sequences = await this.loadAllSequences();
      const now = new Date();
      const nextEmails = [];

      sequences.forEach(sequence => {
        if (sequence.status !== 'active') return;
        
        sequence.emails.forEach(email => {
          if (email.status === 'scheduled' && new Date(email.scheduledFor) <= now) {
            nextEmails.push({
              ...email,
              sequenceType: sequence.sequenceType,
              personalizationVars: sequence.personalizationVars
            });
          }
        });
      });

      // 按优先级和时间排序
      return nextEmails.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    } catch (error) {
      console.error('获取待发送邮件失败:', error);
      return [];
    }
  }

  // 标记邮件为已发送
  async markEmailAsSent(emailId, messageId) {
    try {
      const sequences = await this.loadAllSequences();
      
      sequences.forEach(sequence => {
        sequence.emails.forEach(email => {
          if (email.sequenceId === emailId) {
            email.status = 'sent';
            email.sentAt = new Date().toISOString();
            email.messageId = messageId;
            sequence.performance.totalSent++;
          }
        });
      });
      
      await this.saveAllSequences(sequences);
      console.log(`✅ 邮件 ${emailId} 标记为已发送`);
    } catch (error) {
      console.error('标记邮件发送状态失败:', error);
    }
  }

  // 处理邮件行为事件 (打开、点击等)
  async handleEmailEvent(emailId, eventType, eventData = {}) {
    try {
      const sequences = await this.loadAllSequences();
      let foundEmail = null;
      let parentSequence = null;

      // 查找邮件
      sequences.forEach(sequence => {
        sequence.emails.forEach(email => {
          if (email.messageId === emailId || email.sequenceId === emailId) {
            foundEmail = email;
            parentSequence = sequence;
          }
        });
      });

      if (!foundEmail || !parentSequence) {
        console.log(`⚠️ 未找到邮件 ${emailId}`);
        return;
      }

      // 更新性能数据
      switch(eventType) {
        case 'opened':
          if (!foundEmail.openedAt) {
            foundEmail.openedAt = new Date().toISOString();
            parentSequence.performance.totalOpened++;
          }
          break;
        case 'clicked':
          if (!foundEmail.clickedAt) {
            foundEmail.clickedAt = new Date().toISOString();
            parentSequence.performance.totalClicked++;
          }
          break;
        case 'replied':
          foundEmail.repliedAt = new Date().toISOString();
          foundEmail.replyContent = eventData.replyContent;
          parentSequence.performance.totalReplied++;
          // 暂停序列，等待人工处理
          parentSequence.status = 'paused';
          break;
        case 'unsubscribed':
          foundEmail.unsubscribedAt = new Date().toISOString();
          parentSequence.status = 'unsubscribed';
          break;
        case 'bounced':
          foundEmail.bouncedAt = new Date().toISOString();
          foundEmail.bounceReason = eventData.reason;
          parentSequence.status = 'bounced';
          break;
      }

      // 触发行为响应
      await this.triggerBehaviorResponse(foundEmail, parentSequence, eventType);
      
      await this.saveAllSequences(sequences);
      console.log(`📊 处理邮件事件: ${eventType} for ${emailId}`);
      
    } catch (error) {
      console.error('处理邮件事件失败:', error);
    }
  }

  // 触发基于行为的响应
  async triggerBehaviorResponse(email, sequence, eventType) {
    const trigger = this.behaviorTriggers[eventType];
    if (!trigger) return;

    console.log(`🎯 触发行为响应: ${trigger.nextAction} (优先级: ${trigger.priority})`);
    
    switch(trigger.nextAction) {
      case 'send_follow_up':
        // 加速下一封邮件的发送
        await this.accelerateNextEmail(sequence, email);
        break;
      case 'send_interest_content':
        // 发送高意向内容
        await this.scheduleHighInterestEmail(sequence, email);
        break;
      case 'send_targeted_content':
        // 发送针对性内容
        await this.scheduleTargetedEmail(sequence, email);
        break;
      case 'stop_sequence':
        sequence.status = 'stopped';
        break;
    }
  }

  // 获取序列性能统计
  async getSequencePerformance(sequenceId = null) {
    try {
      const sequences = await this.loadAllSequences();
      
      if (sequenceId) {
        const sequence = sequences.find(s => s.sequenceId === sequenceId);
        return sequence ? this.calculateSequenceMetrics(sequence) : null;
      }
      
      // 返回所有序列的汇总统计
      const totalStats = {
        totalSequences: sequences.length,
        activeSequences: sequences.filter(s => s.status === 'active').length,
        totalEmailsSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgReplyRate: 0,
        conversionRate: 0
      };

      sequences.forEach(sequence => {
        totalStats.totalEmailsSent += sequence.performance.totalSent;
        totalStats.totalOpened += sequence.performance.totalOpened;
        totalStats.totalClicked += sequence.performance.totalClicked;
        totalStats.totalReplied += sequence.performance.totalReplied;
      });

      if (totalStats.totalEmailsSent > 0) {
        totalStats.avgOpenRate = (totalStats.totalOpened / totalStats.totalEmailsSent * 100).toFixed(2);
        totalStats.avgClickRate = (totalStats.totalClicked / totalStats.totalEmailsSent * 100).toFixed(2);
        totalStats.avgReplyRate = (totalStats.totalReplied / totalStats.totalEmailsSent * 100).toFixed(2);
      }

      return totalStats;
    } catch (error) {
      console.error('获取性能统计失败:', error);
      return null;
    }
  }

  // 计算单个序列指标
  calculateSequenceMetrics(sequence) {
    const metrics = {
      sequenceId: sequence.sequenceId,
      sequenceType: sequence.sequenceType,
      status: sequence.status,
      totalEmails: sequence.emails.length,
      sentEmails: sequence.performance.totalSent,
      openRate: sequence.performance.totalSent > 0 ? 
        (sequence.performance.totalOpened / sequence.performance.totalSent * 100).toFixed(2) : 0,
      clickRate: sequence.performance.totalSent > 0 ? 
        (sequence.performance.totalClicked / sequence.performance.totalSent * 100).toFixed(2) : 0,
      replyRate: sequence.performance.totalSent > 0 ? 
        (sequence.performance.totalReplied / sequence.performance.totalSent * 100).toFixed(2) : 0,
      conversionStatus: sequence.performance.conversionStatus,
      createdAt: sequence.createdAt,
      prospectEmail: sequence.prospectId
    };

    return metrics;
  }

  // 辅助方法
  generateSequenceId() {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractFirstName(nameOrEmail) {
    if (!nameOrEmail) return 'there';
    if (nameOrEmail.includes('@')) {
      return nameOrEmail.split('@')[0].split('.')[0];
    }
    return nameOrEmail.split(' ')[0];
  }

  generatePainPoint(industry) {
    const painPoints = {
      technology: 'scaling challenges',
      healthcare: 'operational efficiency',
      finance: 'compliance requirements',
      default: 'growth obstacles'
    };
    return painPoints[industry] || painPoints.default;
  }

  generateBenefit(valueProposition) {
    if (valueProposition.includes('automat')) return 'automation';
    if (valueProposition.includes('efficien')) return 'efficiency gains';
    if (valueProposition.includes('cost')) return 'cost savings';
    return 'improved performance';
  }

  selectResourceType(campaignGoal) {
    if (campaignGoal.includes('lead')) return 'Guide';
    if (campaignGoal.includes('demo')) return 'Demo';
    return 'Whitepaper';
  }

  generateSimilarCompany(industry) {
    const companies = {
      technology: 'TechCorp Inc',
      healthcare: 'HealthSystem Pro',
      finance: 'FinanceFirst Ltd',
      default: 'InnovateCorp'
    };
    return companies[industry] || companies.default;
  }

  generateResult(campaignGoal) {
    if (campaignGoal.includes('lead')) return '40% more qualified leads';
    if (campaignGoal.includes('revenue')) return '25% revenue increase';
    return '30% efficiency improvement';
  }

  generateCommonObjection(industry) {
    const objections = {
      technology: 'integration complexity',
      healthcare: 'compliance concerns',
      finance: 'security requirements',
      default: 'implementation time'
    };
    return objections[industry] || objections.default;
  }

  generateOffer(campaignGoal) {
    if (campaignGoal.includes('demo')) return 'free consultation';
    if (campaignGoal.includes('trial')) return 'extended trial';
    return 'special discount';
  }

  generateIndustryInsight(industry) {
    const insights = {
      technology: 'AI adoption accelerating in enterprise',
      healthcare: 'Digital transformation in healthcare',
      finance: 'Fintech innovation trends',
      default: 'Industry digital transformation'
    };
    return insights[industry] || insights.default;
  }

  generateOfferExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 一周后过期
    return date.toLocaleDateString();
  }

  // 数据库操作方法
  async saveSequence(sequence) {
    try {
      const sequences = await this.loadAllSequences();
      sequences.push(sequence);
      await this.saveAllSequences(sequences);
    } catch (error) {
      console.error('保存序列失败:', error);
    }
  }

  async loadAllSequences() {
    try {
      const data = await fs.readFile(this.sequenceDatabase, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // 如果文件不存在，返回空数组
      return [];
    }
  }

  async saveAllSequences(sequences) {
    try {
      await fs.mkdir(path.dirname(this.sequenceDatabase), { recursive: true });
      await fs.writeFile(this.sequenceDatabase, JSON.stringify(sequences, null, 2));
    } catch (error) {
      console.error('保存序列数据失败:', error);
    }
  }

  // 加速下一封邮件 (基于用户行为)
  async accelerateNextEmail(sequence, currentEmail) {
    const nextEmail = sequence.emails.find(email => 
      email.sequence === currentEmail.sequence + 1 && email.status === 'scheduled'
    );
    
    if (nextEmail) {
      const now = new Date();
      now.setHours(now.getHours() + 2); // 2小时后发送
      nextEmail.scheduledFor = now.toISOString();
      console.log(`⚡ 加速下一封邮件发送: ${nextEmail.sequence}`);
    }
  }

  // 调度高意向邮件
  async scheduleHighInterestEmail(sequence, currentEmail) {
    // 可以插入额外的高意向邮件到序列中
    console.log(`🎯 调度高意向内容邮件`);
  }

  // 调度针对性邮件
  async scheduleTargetedEmail(sequence, currentEmail) {
    // 基于访问页面发送针对性内容
    console.log(`🎯 调度针对性内容邮件`);
  }
}

module.exports = EnhancedEmailSequenceManager;