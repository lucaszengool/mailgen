/**
 * Email Sequence Manager
 * 基于HubSpot、Mailchimp等传统平台的最佳实践
 * 实现完整的drip campaign邮件序列管理
 */
class EmailSequenceManager {
  constructor() {
    // 经典B2B邮件营销序列模板
    this.sequenceTemplates = {
      'cold_outreach': this.createColdOutreachSequence(),
      'product_demo': this.createProductDemoSequence(),
      'nurturing': this.createNurturingSequence(),
      'follow_up': this.createFollowUpSequence(),
      'reactivation': this.createReactivationSequence()
    };
    
    // 行为触发器
    this.triggers = {
      'email_opened': { delay: 2, action: 'send_follow_up' },
      'link_clicked': { delay: 1, action: 'send_interested' },
      'reply_received': { delay: 0, action: 'pause_sequence' },
      'no_response': { delay: 7, action: 'send_final' },
      'unsubscribe': { delay: 0, action: 'stop_sequence' }
    };
    
    // 个性化变量
    this.personalizationTokens = [
      '{{prospect_name}}',
      '{{company_name}}',
      '{{industry}}',
      '{{pain_point}}',
      '{{solution_benefit}}',
      '{{sender_name}}',
      '{{sender_company}}',
      '{{demo_link}}',
      '{{calendar_link}}',
      '{{case_study_link}}'
    ];
  }

  /**
   * 创建冷开发邮件序列（7封邮件，21天周期）
   */
  createColdOutreachSequence() {
    return {
      name: 'Cold Outreach B2B',
      duration: 21, // 天
      totalEmails: 7,
      description: '基于HubSpot最佳实践的冷开发序列',
      emails: [
        {
          day: 0,
          subject: 'Quick question about {{company_name}}\'s {{pain_point}}',
          template: 'cold_intro',
          purpose: 'initial_contact',
          cta: 'reply',
          personalization: 'high',
          content: {
            opening: 'value_proposition',
            body: 'pain_point_identification',
            closing: 'soft_ask'
          }
        },
        {
          day: 3,
          subject: 'Following up on my previous email',
          template: 'follow_up_1',
          purpose: 'gentle_reminder',
          cta: 'meeting_request',
          personalization: 'medium',
          content: {
            opening: 'reference_previous',
            body: 'case_study_or_proof',
            closing: 'specific_ask'
          }
        },
        {
          day: 7,
          subject: 'Thought you might find this interesting',
          template: 'value_add',
          purpose: 'provide_value',
          cta: 'resource_download',
          personalization: 'high',
          content: {
            opening: 'industry_insight',
            body: 'valuable_resource',
            closing: 'soft_pitch'
          }
        },
        {
          day: 10,
          subject: 'Last follow-up from me',
          template: 'final_attempt',
          purpose: 'urgency_scarcity',
          cta: 'demo_booking',
          personalization: 'medium',
          content: {
            opening: 'acknowledge_silence',
            body: 'final_value_prop',
            closing: 'breakup_email'
          }
        },
        {
          day: 14,
          subject: 'One more thing about {{solution_benefit}}',
          template: 'breakup_email',
          purpose: 'last_chance',
          cta: 'reply_or_unsubscribe',
          personalization: 'low',
          content: {
            opening: 'respect_time',
            body: 'final_offer',
            closing: 'clear_unsubscribe'
          }
        },
        {
          day: 18,
          subject: 'Quick industry update for {{company_name}}',
          template: 'stay_top_of_mind',
          purpose: 'relationship_building',
          cta: 'social_connect',
          personalization: 'high',
          content: {
            opening: 'industry_news',
            body: 'thought_leadership',
            closing: 'connect_linkedin'
          }
        },
        {
          day: 21,
          subject: 'Moving you to our newsletter',
          template: 'nurture_transition',
          purpose: 'long_term_nurturing',
          cta: 'newsletter_signup',
          personalization: 'low',
          content: {
            opening: 'end_outreach',
            body: 'newsletter_value',
            closing: 'future_connect'
          }
        }
      ]
    };
  }

  /**
   * 创建产品演示序列
   */
  createProductDemoSequence() {
    return {
      name: 'Product Demo Interest',
      duration: 14,
      totalEmails: 5,
      description: '当潜在客户表现出产品兴趣时的培育序列',
      emails: [
        {
          day: 0,
          subject: 'Thanks for your interest in {{product_name}}',
          template: 'demo_welcome',
          purpose: 'confirm_interest',
          cta: 'schedule_demo'
        },
        {
          day: 2,
          subject: 'See how {{company_name}} can benefit from {{solution}}',
          template: 'demo_case_study',
          purpose: 'provide_proof',
          cta: 'view_case_study'
        },
        {
          day: 5,
          subject: 'Ready for a quick 15-min demo?',
          template: 'demo_soft_push',
          purpose: 'overcome_hesitation',
          cta: 'book_demo'
        },
        {
          day: 9,
          subject: 'Last chance to see {{product_name}} in action',
          template: 'demo_urgency',
          purpose: 'create_urgency',
          cta: 'immediate_demo'
        },
        {
          day: 14,
          subject: 'Moving you to our newsletter for updates',
          template: 'demo_to_nurture',
          purpose: 'transition_to_nurturing',
          cta: 'stay_updated'
        }
      ]
    };
  }

  /**
   * 创建培育序列
   */
  createNurturingSequence() {
    return {
      name: 'Long-term Nurturing',
      duration: 90,
      totalEmails: 12,
      description: '长期培育潜在客户的价值导向序列',
      frequency: 'weekly',
      emails: [
        // 每周发送一封有价值的内容邮件
        {
          week: 1,
          subject: 'Industry insights for {{industry}} leaders',
          template: 'nurture_insights',
          purpose: 'provide_value'
        },
        {
          week: 2,
          subject: 'Case study: How {{similar_company}} increased ROI by 40%',
          template: 'nurture_case_study',
          purpose: 'social_proof'
        },
        // ... 继续其他周的内容
      ]
    };
  }

  /**
   * 创建跟进序列
   */
  createFollowUpSequence() {
    return {
      name: 'Post-Meeting Follow-up',
      duration: 7,
      totalEmails: 3,
      description: '会议或通话后的跟进序列',
      emails: [
        {
          day: 0,
          subject: 'Thanks for our call today',
          template: 'meeting_recap',
          purpose: 'recap_and_next_steps'
        },
        {
          day: 3,
          subject: 'Following up on our discussion',
          template: 'follow_up_resources',
          purpose: 'provide_promised_resources'
        },
        {
          day: 7,
          subject: 'What are your thoughts?',
          template: 'decision_follow_up',
          purpose: 'check_decision_status'
        }
      ]
    };
  }

  /**
   * 创建重新激活序列
   */
  createReactivationSequence() {
    return {
      name: 'Re-engagement Campaign',
      duration: 14,
      totalEmails: 4,
      description: '重新激活沉睡的潜在客户',
      emails: [
        {
          day: 0,
          subject: 'We miss you at {{company_name}}',
          template: 'reactivation_miss_you',
          purpose: 'acknowledge_absence'
        },
        {
          day: 4,
          subject: 'What\'s changed in {{industry}}?',
          template: 'reactivation_industry_update',
          purpose: 'provide_relevant_updates'
        },
        {
          day: 8,
          subject: 'One last check-in',
          template: 'reactivation_final',
          purpose: 'final_attempt'
        },
        {
          day: 14,
          subject: 'Goodbye for now',
          template: 'reactivation_goodbye',
          purpose: 'clean_list'
        }
      ]
    };
  }

  /**
   * 基于潜在客户行为选择合适的序列
   */
  selectSequenceForProspect(prospect, interaction) {
    const { behaviorHistory, engagement, industry, companySize } = prospect;
    
    // 行为驱动的序列选择逻辑
    if (interaction.type === 'cold_contact') {
      return this.sequenceTemplates.cold_outreach;
    }
    
    if (interaction.type === 'demo_interest') {
      return this.sequenceTemplates.product_demo;
    }
    
    if (interaction.type === 'post_meeting') {
      return this.sequenceTemplates.follow_up;
    }
    
    if (behaviorHistory.lastEngagement > 30) { // 30天无互动
      return this.sequenceTemplates.reactivation;
    }
    
    // 默认使用培育序列
    return this.sequenceTemplates.nurturing;
  }

  /**
   * 个性化邮件内容
   */
  personalizeEmail(emailTemplate, prospect, senderInfo) {
    let content = emailTemplate.content;
    
    // 替换个性化标记
    const replacements = {
      '{{prospect_name}}': prospect.name || 'there',
      '{{company_name}}': prospect.company || 'your company',
      '{{industry}}': prospect.industry || 'your industry',
      '{{pain_point}}': this.identifyPainPoint(prospect),
      '{{solution_benefit}}': this.identifySolutionBenefit(prospect),
      '{{sender_name}}': senderInfo.name,
      '{{sender_company}}': senderInfo.company,
      '{{demo_link}}': senderInfo.demoLink,
      '{{calendar_link}}': senderInfo.calendarLink,
      '{{case_study_link}}': this.selectRelevantCaseStudy(prospect)
    };
    
    for (const [token, replacement] of Object.entries(replacements)) {
      content = content.replace(new RegExp(token, 'g'), replacement);
    }
    
    return content;
  }

  /**
   * 识别潜在客户的痛点
   */
  identifyPainPoint(prospect) {
    const industryPainPoints = {
      'technology': 'scaling development processes',
      'retail': 'customer acquisition costs',
      'healthcare': 'compliance and efficiency',
      'finance': 'regulatory compliance and security',
      'education': 'student engagement and outcomes'
    };
    
    return industryPainPoints[prospect.industry] || 'operational efficiency';
  }

  /**
   * 识别解决方案的最大收益
   */
  identifySolutionBenefit(prospect) {
    const industryBenefits = {
      'technology': 'accelerate time to market',
      'retail': 'increase conversion rates',
      'healthcare': 'improve patient outcomes',
      'finance': 'reduce compliance risks',
      'education': 'enhance learning experience'
    };
    
    return industryBenefits[prospect.industry] || 'streamline operations';
  }

  /**
   * 选择相关案例研究
   */
  selectRelevantCaseStudy(prospect) {
    // 基于行业和公司规模选择最相关的案例研究
    const caseStudies = {
      'technology_small': 'https://example.com/case-study-tech-startup',
      'technology_medium': 'https://example.com/case-study-tech-scale',
      'retail_small': 'https://example.com/case-study-retail-small',
      'default': 'https://example.com/case-study-general'
    };
    
    const key = `${prospect.industry}_${prospect.companySize}`;
    return caseStudies[key] || caseStudies.default;
  }

  /**
   * 计算下一封邮件的发送时间
   */
  calculateNextEmailTime(sequence, currentEmailIndex, prospectTimezone = 'UTC') {
    const currentEmail = sequence.emails[currentEmailIndex];
    const nextEmail = sequence.emails[currentEmailIndex + 1];
    
    if (!nextEmail) return null; // 序列结束
    
    const delayDays = nextEmail.day - currentEmail.day;
    const sendTime = new Date();
    sendTime.setDate(sendTime.getDate() + delayDays);
    
    // 设置为工作时间发送（上午9-11点或下午2-4点）
    const optimalHours = [9, 10, 11, 14, 15, 16];
    const randomHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
    sendTime.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
    
    return sendTime;
  }

  /**
   * 处理邮件互动事件
   */
  handleInteraction(prospectId, interactionType, sequenceId, emailIndex) {
    const trigger = this.triggers[interactionType];
    
    if (!trigger) return;
    
    switch (trigger.action) {
      case 'pause_sequence':
        // 暂停当前序列，等待人工跟进
        return { action: 'pause', reason: 'prospect_replied' };
        
      case 'send_follow_up':
        // 立即发送跟进邮件
        return { action: 'immediate_follow_up', delay: trigger.delay };
        
      case 'send_interested':
        // 切换到产品演示序列
        return { action: 'switch_sequence', newSequence: 'product_demo' };
        
      case 'stop_sequence':
        // 完全停止序列
        return { action: 'stop', reason: 'unsubscribe' };
        
      case 'send_final':
        // 发送最后一封邮件
        return { action: 'final_email', delay: trigger.delay };
    }
  }

  /**
   * A/B测试邮件变体
   */
  createEmailVariants(baseEmail) {
    return {
      variant_a: {
        ...baseEmail,
        subject: baseEmail.subject,
        approach: 'direct'
      },
      variant_b: {
        ...baseEmail,
        subject: this.generateAlternativeSubject(baseEmail.subject),
        approach: 'curious'
      }
    };
  }

  /**
   * 生成替代主题行
   */
  generateAlternativeSubject(originalSubject) {
    const alternatives = {
      'Quick question about': 'Thoughts on',
      'Following up': 'Checking in about',
      'Last follow-up': 'Final note from me',
      'Thought you might': 'You might be interested in'
    };
    
    for (const [original, alternative] of Object.entries(alternatives)) {
      if (originalSubject.includes(original)) {
        return originalSubject.replace(original, alternative);
      }
    }
    
    return originalSubject;
  }

  /**
   * 分析序列性能
   */
  analyzeSequencePerformance(sequenceResults) {
    const metrics = {
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      unsubscribeRate: 0,
      conversionRate: 0,
      bestPerformingEmail: null,
      worstPerformingEmail: null,
      optimalSendTimes: []
    };
    
    // 计算各种指标
    // 这里应该实现详细的分析逻辑
    
    return metrics;
  }
}

module.exports = EmailSequenceManager;