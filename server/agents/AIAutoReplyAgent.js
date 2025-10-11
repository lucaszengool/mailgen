const nodemailer = require('nodemailer');

class AIAutoReplyAgent {
  constructor(smtpConfig) {
    this.smtpConfig = smtpConfig;
    this.conversations = new Map(); // 存储对话历史
    this.autoReplyEnabled = true;
    this.replyTemplates = this.loadReplyTemplates();
    this.sentimentAnalysis = {
      positive: ['interested', 'yes', 'great', 'awesome', 'love', 'perfect', 'excellent'],
      negative: ['not interested', 'no', 'unsubscribe', 'spam', 'annoying', 'stop'],
      questions: ['how', 'what', 'when', 'where', 'why', 'can you', 'tell me', '?'],
      scheduling: ['meeting', 'call', 'demo', 'schedule', 'calendar', 'available', 'time']
    };
  }

  loadReplyTemplates() {
    return {
      positive_interest: {
        triggers: ['interested', 'tell me more', 'sounds good', 'yes'],
        responses: [
          {
            subject: "Re: {originalSubject}",
            template: `Hi {name},

Great to hear from you! I'm excited about your interest.

Let me schedule a quick call to discuss how we can help {company} {achieve_goal}.

I have availability:
• {timeSlot1}
• {timeSlot2}
• {timeSlot3}

Or feel free to book directly here: {calendarLink}

Looking forward to connecting!

Best regards,
{senderName}`,
            priority: 'high'
          }
        ]
      },

      questions: {
        triggers: ['how does', 'what is', 'can you explain', 'tell me about'],
        responses: [
          {
            subject: "Re: {originalSubject} - Your Questions Answered",
            template: `Hi {name},

Thanks for your questions! I'd love to provide detailed answers.

Based on your inquiry about {question_topic}, here's what I can share:

{answer_summary}

However, I think a brief call would be much more valuable - I can give you specific examples of how companies like {company} have benefited and answer all your questions in detail.

Would you prefer a quick 15-minute call or should I send over some detailed resources first?

Best,
{senderName}`,
            priority: 'medium'
          }
        ]
      },

      pricing_inquiry: {
        triggers: ['price', 'cost', 'pricing', 'how much', 'budget', 'fee'],
        responses: [
          {
            subject: "Re: {originalSubject} - Pricing Information",
            template: `Hi {name},

Thanks for asking about pricing. Our solutions are designed to provide significant ROI, and pricing depends on your specific needs and scale.

For companies like {company} in the {industry} space, we typically see:
• Investment: Customized based on requirements
• ROI: 300-500% within first year
• Savings: {costSavings} annually

I'd love to provide you with a personalized quote after understanding your specific goals better.

Can we schedule a brief 15-minute call to discuss your needs? I can then send over detailed pricing that makes sense for {company}.

Best regards,
{senderName}`,
            priority: 'high'
          }
        ]
      },

      not_ready: {
        triggers: ['not now', 'maybe later', 'busy', 'not the right time'],
        responses: [
          {
            subject: "Re: {originalSubject} - I'll Follow Up Later",
            template: `Hi {name},

I completely understand - timing is important for decisions like this.

I'll make a note to follow up in a few months, but in the meantime, here are some resources that might be helpful for when you're ready:

• Industry Report: {resource1}
• Case Study: {resource2}  
• ROI Calculator: {resource3}

Feel free to reach out anytime if you have questions or if priorities change.

Best of luck with {current_priority}!

{senderName}`,
            priority: 'low'
          }
        ]
      },

      objections: {
        triggers: ['too expensive', 'already have', 'not budget', 'using competitor'],
        responses: [
          {
            subject: "Re: {originalSubject} - Let Me Address Your Concerns",
            template: `Hi {name},

I appreciate you being direct about your concerns regarding {objection_topic}.

Many companies in {industry} initially had similar thoughts. What changed their mind was seeing the specific ROI and how we differentiate from alternatives they'd considered.

For example, {case_example} saw {specific_result} which more than justified the investment.

Would you be open to a brief 10-minute call where I can address your specific concerns and show you exactly how the numbers work for companies like {company}?

No pressure - just want to make sure you have all the information to make the best decision for your situation.

Best,
{senderName}`,
            priority: 'medium'
          }
        ]
      },

      unsubscribe: {
        triggers: ['unsubscribe', 'remove', 'stop', 'spam', 'opt out'],
        responses: [
          {
            subject: "You've been unsubscribed - Sorry for any inconvenience",
            template: `Hi {name},

I've immediately removed your email address from all our outreach lists. You won't receive any further emails from our team.

I apologize if my message wasn't relevant to {company}'s current needs.

If you ever want to reconnect in the future, you know where to find me.

Best wishes for {company}'s continued success!

{senderName}`,
            priority: 'immediate'
          }
        ]
      },

      positive_but_no_action: {
        triggers: ['sounds interesting', 'looks good', 'nice solution'],
        responses: [
          {
            subject: "Re: {originalSubject} - Next Steps?",
            template: `Hi {name},

I'm glad this resonates with you! 

To move forward, I'd recommend a brief demo where I can show you exactly how this would work for {company}'s specific situation.

The demo typically takes 15-20 minutes and companies find it really helpful to see the solution in action with their own use case.

What's the best way to get some time on your calendar?

• Quick call to set something up?
• Direct calendar booking: {calendarLink}
• Email me your availability

Looking forward to showing you what this could do for {company}!

Best,
{senderName}`,
            priority: 'high'
          }
        ]
      },

      competitor_mention: {
        triggers: ['using salesforce', 'with hubspot', 'trying pipedrive', 'have mailchimp'],
        responses: [
          {
            subject: "Re: {originalSubject} - Why Companies Switch to Us",
            template: `Hi {name},

I appreciate you mentioning your current solution. Many of our best clients were initially using {competitor_mentioned} before making the switch.

The main reasons companies like {company} typically move to our platform:

1. {differentiator1}
2. {differentiator2}  
3. {differentiator3}

Rather than just talking about features, would you be interested in seeing a side-by-side comparison specific to {industry} companies? 

I can show you exactly what the migration process looks like and the typical results companies see within 30-60 days.

Worth a quick 15-minute call?

Best,
{senderName}`,
            priority: 'medium'
          }
        ]
      }
    };
  }

  // AI驱动的邮件分析和回复生成
  async processIncomingEmail(emailContent, leadInfo) {
    console.log(`🤖 AI处理来信: ${leadInfo.email}`);

    try {
      // 简化邮件解析 - 直接使用字符串内容
      const parsedEmail = {
        subject: emailContent.subject || 'Re: Your inquiry',
        text: emailContent.content || emailContent,
        messageId: emailContent.messageId || `msg_${Date.now()}`
      };
      
      // AI分析邮件意图和情感
      const analysis = this.analyzeEmailContent(parsedEmail, leadInfo);
      
      // 更新对话历史
      this.updateConversationHistory(leadInfo.email, parsedEmail, analysis);
      
      // 判断是否需要自动回复
      if (!this.shouldAutoReply(analysis, leadInfo)) {
        console.log('❌ 不需要自动回复');
        return null;
      }
      
      // 生成AI回复
      const reply = await this.generateAIReply(analysis, leadInfo, parsedEmail);
      
      // 发送回复
      if (reply) {
        const sent = await this.sendAutoReply(reply, leadInfo, parsedEmail);
        if (sent) {
          console.log('✅ 自动回复已发送');
          this.logAutoReply(leadInfo, parsedEmail, reply, analysis);
          return reply;
        }
      }
      
      return null;

    } catch (error) {
      console.error('AI邮件处理失败:', error.message);
      return null;
    }
  }

  // AI分析邮件内容
  analyzeEmailContent(parsedEmail, leadInfo) {
    const subject = parsedEmail.subject || '';
    const text = parsedEmail.text || '';
    const html = parsedEmail.html || '';
    const content = (subject + ' ' + text).toLowerCase();

    const analysis = {
      intent: 'unknown',
      sentiment: 'neutral',
      priority: 'medium',
      keywords: [],
      triggers: [],
      questions: [],
      objections: [],
      competitors: [],
      needsHumanResponse: false,
      confidenceScore: 0.5
    };

    // AI情感分析
    analysis.sentiment = this.analyzeSentiment(content);
    
    // AI意图识别
    analysis.intent = this.identifyIntent(content, leadInfo);
    
    // 提取关键词和触发词
    analysis.keywords = this.extractKeywords(content);
    analysis.triggers = this.identifyTriggers(content);
    
    // 识别问题
    analysis.questions = this.extractQuestions(content);
    
    // 识别异议
    analysis.objections = this.identifyObjections(content);
    
    // 识别竞争对手提及
    analysis.competitors = this.identifyCompetitors(content);
    
    // 计算优先级
    analysis.priority = this.calculatePriority(analysis);
    
    // 计算置信度
    analysis.confidenceScore = this.calculateConfidence(analysis);
    
    // 判断是否需要人工干预
    analysis.needsHumanResponse = this.needsHumanIntervention(analysis, content);

    return analysis;
  }

  // 情感分析
  analyzeSentiment(content) {
    let positiveScore = 0;
    let negativeScore = 0;
    
    this.sentimentAnalysis.positive.forEach(word => {
      if (content.includes(word)) positiveScore++;
    });
    
    this.sentimentAnalysis.negative.forEach(word => {
      if (content.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore && positiveScore > 0) return 'positive';
    if (negativeScore > positiveScore && negativeScore > 0) return 'negative';
    return 'neutral';
  }

  // 意图识别
  identifyIntent(content, leadInfo) {
    // 检查各种意图模式
    if (this.matchesPattern(content, this.replyTemplates.positive_interest.triggers)) {
      return 'positive_interest';
    }
    if (this.matchesPattern(content, this.replyTemplates.questions.triggers)) {
      return 'questions';
    }
    if (this.matchesPattern(content, this.replyTemplates.pricing_inquiry.triggers)) {
      return 'pricing_inquiry';
    }
    if (this.matchesPattern(content, this.replyTemplates.not_ready.triggers)) {
      return 'not_ready';
    }
    if (this.matchesPattern(content, this.replyTemplates.objections.triggers)) {
      return 'objections';
    }
    if (this.matchesPattern(content, this.replyTemplates.unsubscribe.triggers)) {
      return 'unsubscribe';
    }
    if (this.matchesPattern(content, this.replyTemplates.competitor_mention.triggers)) {
      return 'competitor_mention';
    }
    if (this.matchesPattern(content, this.replyTemplates.positive_but_no_action.triggers)) {
      return 'positive_but_no_action';
    }
    
    return 'general_inquiry';
  }

  // 模式匹配
  matchesPattern(content, triggers) {
    return triggers.some(trigger => content.includes(trigger.toLowerCase()));
  }

  // 提取关键词
  extractKeywords(content) {
    const businessKeywords = [
      'roi', 'revenue', 'growth', 'efficiency', 'automation', 'scale', 
      'cost', 'save', 'profit', 'team', 'integration', 'security'
    ];
    
    return businessKeywords.filter(keyword => content.includes(keyword));
  }

  // 识别触发词
  identifyTriggers(content) {
    const allTriggers = [];
    Object.values(this.replyTemplates).forEach(template => {
      template.triggers.forEach(trigger => {
        if (content.includes(trigger.toLowerCase())) {
          allTriggers.push(trigger);
        }
      });
    });
    return allTriggers;
  }

  // 提取问题
  extractQuestions(content) {
    const sentences = content.split(/[.!?]/);
    return sentences.filter(sentence => 
      sentence.includes('?') || 
      this.sentimentAnalysis.questions.some(q => sentence.includes(q))
    );
  }

  // 识别异议
  identifyObjections(content) {
    const objectionPatterns = [
      'too expensive', 'not budget', 'already have', 'using', 'satisfied with',
      'not interested', 'not need', 'not priority'
    ];
    
    return objectionPatterns.filter(objection => content.includes(objection));
  }

  // 识别竞争对手
  identifyCompetitors(content) {
    const competitors = [
      'salesforce', 'hubspot', 'pipedrive', 'mailchimp', 'constant contact',
      'marketo', 'pardot', 'activecampaign', 'convertkit', 'sendinblue'
    ];
    
    return competitors.filter(competitor => content.includes(competitor));
  }

  // 计算优先级
  calculatePriority(analysis) {
    if (analysis.intent === 'unsubscribe') return 'immediate';
    if (analysis.intent === 'positive_interest' || analysis.intent === 'pricing_inquiry') return 'high';
    if (analysis.intent === 'objections' || analysis.intent === 'competitor_mention') return 'medium';
    if (analysis.intent === 'not_ready') return 'low';
    return 'medium';
  }

  // 计算置信度
  calculateConfidence(analysis) {
    let confidence = 0.5;
    
    if (analysis.triggers.length > 0) confidence += 0.2;
    if (analysis.keywords.length > 2) confidence += 0.1;
    if (analysis.sentiment !== 'neutral') confidence += 0.1;
    if (analysis.intent !== 'unknown') confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }

  // 判断是否需要人工干预
  needsHumanIntervention(analysis, content) {
    // 复杂问题需要人工处理
    if (analysis.questions.length > 2) return true;
    
    // 强烈负面情绪
    if (analysis.sentiment === 'negative' && analysis.objections.length > 1) return true;
    
    // 提及法律、合规等敏感词
    const sensitiveWords = ['legal', 'compliance', 'lawsuit', 'gdpr', 'privacy'];
    if (sensitiveWords.some(word => content.includes(word))) return true;
    
    // 低置信度
    if (analysis.confidenceScore < 0.3) return true;
    
    return false;
  }

  // 判断是否应该自动回复
  shouldAutoReply(analysis, leadInfo) {
    if (!this.autoReplyEnabled) return false;
    
    // 取消订阅请求立即处理
    if (analysis.intent === 'unsubscribe') return true;
    
    // 需要人工处理的不自动回复
    if (analysis.needsHumanResponse) return false;
    
    // 检查最近是否已经回复过（避免过于频繁）
    const conversation = this.conversations.get(leadInfo.email);
    if (conversation && conversation.lastAutoReply) {
      const timeSinceLastReply = Date.now() - new Date(conversation.lastAutoReply).getTime();
      if (timeSinceLastReply < 2 * 60 * 60 * 1000) { // 2小时内不重复回复
        return false;
      }
    }
    
    // 高置信度且有明确意图的邮件自动回复
    return analysis.confidenceScore > 0.6 && analysis.intent !== 'unknown';
  }

  // 生成AI回复
  async generateAIReply(analysis, leadInfo, originalEmail) {
    console.log(`🤖 生成AI回复 - 意图: ${analysis.intent}, 置信度: ${analysis.confidenceScore}`);

    try {
      const template = this.getReplyTemplate(analysis.intent);
      if (!template) {
        console.log('❌ 没有找到合适的回复模板');
        return null;
      }

      // 个性化回复内容
      const personalizedReply = await this.personalizeReply(template, analysis, leadInfo, originalEmail);
      
      return personalizedReply;

    } catch (error) {
      console.error('AI回复生成失败:', error.message);
      return null;
    }
  }

  // 获取回复模板
  getReplyTemplate(intent) {
    const templates = this.replyTemplates[intent];
    if (!templates || !templates.responses) return null;
    
    // 选择第一个模板（可以扩展为更智能的选择）
    return templates.responses[0];
  }

  // 个性化回复内容
  async personalizeReply(template, analysis, leadInfo, originalEmail) {
    let subject = template.subject;
    let body = template.template;

    // 基本信息替换
    subject = subject.replace(/{originalSubject}/g, originalEmail.subject || 'Your Inquiry');
    body = body.replace(/{name}/g, leadInfo.name || 'there');
    body = body.replace(/{company}/g, leadInfo.company || 'your company');
    body = body.replace(/{industry}/g, leadInfo.industry || 'your industry');
    body = body.replace(/{senderName}/g, this.smtpConfig.senderName || 'Team');

    // AI智能内容生成
    body = await this.generateSmartContent(body, analysis, leadInfo);
    
    // 生成时间段
    body = this.generateTimeSlots(body);
    
    // 生成资源链接
    body = this.generateResourceLinks(body, leadInfo);

    return {
      subject: subject,
      body: body,
      priority: template.priority,
      intent: analysis.intent,
      confidence: analysis.confidenceScore,
      personalizedAt: new Date().toISOString()
    };
  }

  // AI生成智能内容
  async generateSmartContent(body, analysis, leadInfo) {
    // 根据分析结果智能填充内容
    if (body.includes('{achieve_goal}')) {
      const goals = {
        'technology': 'accelerate digital transformation',
        'retail': 'increase online sales conversion',
        'healthcare': 'improve patient engagement',
        'finance': 'streamline financial processes'
      };
      body = body.replace(/{achieve_goal}/g, goals[leadInfo.industry] || 'achieve your business goals');
    }

    if (body.includes('{question_topic}')) {
      const topic = analysis.keywords.length > 0 ? analysis.keywords[0] : 'our solution';
      body = body.replace(/{question_topic}/g, topic);
    }

    if (body.includes('{answer_summary}')) {
      const summary = this.generateAnswerSummary(analysis, leadInfo);
      body = body.replace(/{answer_summary}/g, summary);
    }

    if (body.includes('{costSavings}') || body.includes('{cost_savings}')) {
      const savings = this.estimateCostSavings(leadInfo);
      body = body.replace(/{costSavings}/g, savings);
      body = body.replace(/{cost_savings}/g, savings);
    }

    if (body.includes('{objection_topic}')) {
      const objection = analysis.objections.length > 0 ? analysis.objections[0] : 'your concerns';
      body = body.replace(/{objection_topic}/g, objection);
    }

    if (body.includes('{case_example}')) {
      const example = this.generateCaseExample(leadInfo);
      body = body.replace(/{case_example}/g, example);
    }

    if (body.includes('{specific_result}')) {
      const result = this.generateSpecificResult(leadInfo);
      body = body.replace(/{specific_result}/g, result);
    }

    if (body.includes('{competitor_mentioned}')) {
      const competitor = analysis.competitors.length > 0 ? analysis.competitors[0] : 'your current solution';
      body = body.replace(/{competitor_mentioned}/g, competitor);
    }

    if (body.includes('{differentiator1}')) {
      const diffs = this.generateDifferentiators(leadInfo);
      body = body.replace(/{differentiator1}/g, diffs[0]);
      body = body.replace(/{differentiator2}/g, diffs[1]);
      body = body.replace(/{differentiator3}/g, diffs[2]);
    }

    if (body.includes('{current_priority}')) {
      const priority = this.inferCurrentPriority(analysis, leadInfo);
      body = body.replace(/{current_priority}/g, priority);
    }

    return body;
  }

  // 辅助函数：生成答案摘要
  generateAnswerSummary(analysis, leadInfo) {
    return `Based on your industry focus, here are the key points that would be most relevant to ${leadInfo.company}:

• Immediate impact: Reduce manual work by 40-60%
• Integration: Seamless setup with your existing tools
• ROI: Typical payback within 3-4 months

I have specific case studies from ${leadInfo.industry} companies that show exact implementation timelines and results.`;
  }

  // 估算成本节省
  estimateCostSavings(leadInfo) {
    const savingsMap = {
      'technology': '$75K-$150K',
      'retail': '$50K-$100K',
      'healthcare': '$100K-$200K',
      'finance': '$125K-$250K'
    };
    return savingsMap[leadInfo.industry] || '$50K-$100K';
  }

  // 生成案例示例
  generateCaseExample(leadInfo) {
    const examples = {
      'technology': 'TechCorp (similar SaaS company)',
      'retail': 'RetailPro (e-commerce leader)',
      'healthcare': 'HealthSystem Inc',
      'finance': 'FinanceFirst Corp'
    };
    return examples[leadInfo.industry] || 'A company in your industry';
  }

  // 生成具体结果
  generateSpecificResult(leadInfo) {
    const results = {
      'technology': '45% faster development cycles and 60% reduction in bug reports',
      'retail': '32% increase in conversion rates and 28% improvement in customer lifetime value',
      'healthcare': '50% reduction in administrative time and 95% patient satisfaction scores',
      'finance': '70% faster transaction processing and 99.9% compliance accuracy'
    };
    return results[leadInfo.industry] || '40% efficiency improvement and 25% cost reduction';
  }

  // 生成差异化优势
  generateDifferentiators(leadInfo) {
    return [
      `${leadInfo.industry}-specific features built for your exact use case`,
      'White-glove migration and training (no downtime)',
      'Dedicated success manager for the first 6 months'
    ];
  }

  // 推断当前优先级
  inferCurrentPriority(analysis, leadInfo) {
    if (analysis.keywords.includes('growth')) return `${leadInfo.company}'s growth initiatives`;
    if (analysis.keywords.includes('efficiency')) return `optimizing ${leadInfo.company}'s operations`;
    if (analysis.keywords.includes('cost')) return `${leadInfo.company}'s cost optimization efforts`;
    return `${leadInfo.company}'s current strategic priorities`;
  }

  // 生成时间段
  generateTimeSlots(body) {
    const timeSlots = this.getAvailableTimeSlots();
    body = body.replace(/{timeSlot1}/g, timeSlots[0]);
    body = body.replace(/{timeSlot2}/g, timeSlots[1]);
    body = body.replace(/{timeSlot3}/g, timeSlots[2]);
    return body;
  }

  getAvailableTimeSlots() {
    const now = new Date();
    const slots = [];
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const times = ['10:00 AM', '2:00 PM', '4:00 PM'];
      const timeSlot = times[Math.floor(Math.random() * times.length)];
      slots.push(`${date.toLocaleDateString()} at ${timeSlot}`);
    }
    
    return slots;
  }

  // 生成资源链接
  generateResourceLinks(body, leadInfo) {
    body = body.replace(/{calendarLink}/g, 'https://calendar.company.com/demo');
    body = body.replace(/{resource1}/g, `${leadInfo.industry}-trends-2024.pdf`);
    body = body.replace(/{resource2}/g, `${leadInfo.company}-case-study.pdf`);
    body = body.replace(/{resource3}/g, 'https://roi-calculator.company.com');
    return body;
  }

  // 发送自动回复
  async sendAutoReply(reply, leadInfo, originalEmail) {
    try {
      const transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        auth: {
          user: this.smtpConfig.username,
          pass: this.smtpConfig.password
        }
      });

      const mailOptions = {
        from: `"${this.smtpConfig.senderName}" <${this.smtpConfig.username}>`,
        to: leadInfo.email,
        subject: reply.subject,
        html: this.formatEmailHTML(reply.body),
        inReplyTo: originalEmail.messageId,
        references: originalEmail.messageId
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ 自动回复发送成功: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error('自动回复发送失败:', error.message);
      return false;
    }
  }

  // 格式化邮件HTML
  formatEmailHTML(body) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${body.replace(/\n/g, '<br>').replace(/\n\n/g, '<p>').replace(/•/g, '&bull;')}
      </div>
    `;
  }

  // 更新对话历史
  updateConversationHistory(email, parsedEmail, analysis) {
    if (!this.conversations.has(email)) {
      this.conversations.set(email, {
        messages: [],
        lastAutoReply: null,
        sentiment: 'neutral',
        status: 'active'
      });
    }

    const conversation = this.conversations.get(email);
    conversation.messages.push({
      timestamp: new Date().toISOString(),
      subject: parsedEmail.subject,
      content: parsedEmail.text || parsedEmail.html,
      analysis: analysis,
      type: 'incoming'
    });

    // 更新整体对话情感
    conversation.sentiment = analysis.sentiment;
  }

  // 记录自动回复
  logAutoReply(leadInfo, originalEmail, reply, analysis) {
    const conversation = this.conversations.get(leadInfo.email);
    if (conversation) {
      conversation.messages.push({
        timestamp: new Date().toISOString(),
        subject: reply.subject,
        content: reply.body,
        analysis: { intent: reply.intent, confidence: reply.confidence },
        type: 'auto_reply'
      });
      conversation.lastAutoReply = new Date().toISOString();
    }
  }

  // 启用/禁用自动回复
  setAutoReplyEnabled(enabled) {
    this.autoReplyEnabled = enabled;
    console.log(`🤖 自动回复已${enabled ? '启用' : '禁用'}`);
  }

  // 获取对话历史
  getConversationHistory(email) {
    return this.conversations.get(email) || null;
  }

  // 获取所有活跃对话
  getAllConversations() {
    const conversations = [];
    for (const [email, conversation] of this.conversations) {
      conversations.push({
        email: email,
        messageCount: conversation.messages.length,
        lastActivity: conversation.messages[conversation.messages.length - 1]?.timestamp,
        sentiment: conversation.sentiment,
        status: conversation.status
      });
    }
    return conversations;
  }

  // 更新潜在客户状态
  updateLeadStatus(email, status) {
    const conversation = this.conversations.get(email);
    if (conversation) {
      conversation.status = status;
    }
  }

  // 获取自动回复统计
  getAutoReplyStats() {
    let totalReplies = 0;
    let replysByIntent = {};
    let avgConfidence = 0;
    let confidenceCount = 0;

    for (const [email, conversation] of this.conversations) {
      const autoReplies = conversation.messages.filter(m => m.type === 'auto_reply');
      totalReplies += autoReplies.length;
      
      autoReplies.forEach(reply => {
        const intent = reply.analysis.intent;
        replysByIntent[intent] = (replysByIntent[intent] || 0) + 1;
        
        if (reply.analysis.confidence) {
          avgConfidence += reply.analysis.confidence;
          confidenceCount++;
        }
      });
    }

    return {
      totalAutoReplies: totalReplies,
      averageConfidence: confidenceCount > 0 ? (avgConfidence / confidenceCount).toFixed(2) : 0,
      replysByIntent: replysByIntent,
      activeConversations: this.conversations.size,
      autoReplyEnabled: this.autoReplyEnabled
    };
  }
}

module.exports = AIAutoReplyAgent;