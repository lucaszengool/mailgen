const axios = require('axios');
const RealAIEngine = require('./RealAIEngine');
const AIEnhancedStrategyEngine = require('./AIEnhancedStrategyEngine');
const PersonaStorageService = require('../services/PersonaStorageService');

class AIEmailGenerator {
  constructor() {
    this.templates = this.loadEmailTemplates();
    this.realAI = new RealAIEngine();
    this.aiStrategyEngine = new AIEnhancedStrategyEngine();
    this.personaStorage = new PersonaStorageService();
    this.aiModel = 'claude-3-sonnet'; // 使用Claude模型
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    console.log('📧 AI邮件生成器已增强 - 支持LinkedIn人格化邮件');
  }

  loadEmailTemplates() {
    return {
      product_demo: {
        subject_templates: [
          "Quick demo for {companyName}?",
          "5-minute {productName} walkthrough for {name}?",
          "Exclusive {productName} preview for {industry} companies",
          "Transform {companyName}'s {painPoint} in 15 minutes"
        ],
        body_templates: [
          {
            style: 'professional',
            template: `Hi {name},

I noticed {companyName} is in the {industry} space and likely dealing with {painPoint}.

We've helped similar companies like yours:
• {benefit1}  
• {benefit2}
• {benefit3}

Would you be interested in a quick 15-minute demo to see how {productName} could help {companyName} {opportunity}?

I have slots available {timeSlot1} or {timeSlot2}.

Best regards,
{senderName}`
          },
          {
            style: 'casual',
            template: `Hey {name}!

Saw {companyName}'s work in {industry} - really impressive!

Quick question: how are you currently handling {painPoint}? 

We just launched {productName} and it's been a game-changer for companies like yours. Would love to show you a quick demo if you're interested.

No pressure - just thought it might be relevant given what {companyName} is working on.

Cheers,
{senderName}`
          }
        ]
      },
      
      sales: {
        subject_templates: [
          "Increase {companyName}'s {metric} by 30%?",
          "{name}, reduce your {costArea} costs significantly",
          "ROI opportunity for {companyName}",
          "How {competitorName} improved their {painPoint}"
        ],
        body_templates: [
          {
            style: 'roi_focused',
            template: `Hi {name},

I've been researching {companyName} and noticed you're likely spending significant resources on {painPoint}.

Companies in {industry} typically see:
• {metric1}: 25-40% improvement
• {metric2}: $50K+ annual savings  
• {metric3}: 60% faster {process}

Would you be open to a brief call to discuss how we could deliver similar results for {companyName}?

ROI Calculator: {link}

Best,
{senderName}`
          },
          {
            style: 'case_study',
            template: `Hello {name},

{similarCompany} (also in {industry}) just shared some impressive results:

"{testimonial}"

They were facing similar challenges with {painPoint} and achieved:
✓ {result1}
✓ {result2} 
✓ {result3}

I'd love to share the full case study and discuss how {companyName} could achieve similar outcomes.

When would be a good time for a 15-minute call?

Best regards,
{senderName}`
          }
        ]
      },

      partnership: {
        subject_templates: [
          "Partnership opportunity: {companyName} + {ourCompany}",
          "Mutual growth opportunity in {industry}",
          "{name}, let's explore synergies",
          "Expanding reach in {industry} together?"
        ],
        body_templates: [
          {
            style: 'collaborative',
            template: `Hi {name},

I've been following {companyName}'s growth in {industry} - impressive work on {recentAchievement}!

I think there's a strong synergy opportunity between our companies:

{companyName} strengths: {strength1}, {strength2}
Our strengths: {ourStrength1}, {ourStrength2}

Together we could: {jointOpportunity}

Would you be open to exploring this? Happy to share more details and case studies from similar partnerships.

Looking forward to hearing from you,
{senderName}`
          }
        ]
      },

      general_outreach: {
        subject_templates: [
          "Quick question about {companyName}'s {area}",
          "Impressed by {companyName}'s {achievement}",
          "Thought you'd find this interesting, {name}",
          "Resource for {companyName}'s {challenge}"
        ],
        body_templates: [
          {
            style: 'value_first',
            template: `Hi {name},

Came across {companyName}'s work on {projectOrAchievement} - really innovative approach to {industryChallenge}!

I wanted to share a resource that might be relevant: {resourceLink}

It's a {resourceType} we created specifically for {industry} companies dealing with {painPoint}. No strings attached - just thought it might be useful given {companyName}'s focus on {businessArea}.

If you find it helpful and want to chat about {opportunity}, I'm always happy to connect.

Best,
{senderName}`
          }
        ]
      }
    };
  }

  // 真实AI驱动的个性化邮件生成
  async generatePersonalizedEmail(lead, campaignGoal, productInfo = {}) {
    console.log(`🤖 智能生成个性化邮件: ${lead.email} (${campaignGoal})`);
    
    try {
      // 优先使用AI增强策略生成
      console.log(`🤖 使用AI增强策略生成个性化邮件...`);
      
      // 检查是否有业务分析数据
      if (lead.sourceBusinessAnalysis && lead.smartAnalysis) {
        console.log(`📊 基于业务分析: ${lead.sourceBusinessAnalysis.industry} -> ${lead.smartAnalysis.targetIndustry}`);
        
        // 生成AI增强的邮件策略
        const emailStrategy = await this.aiStrategyEngine.generatePersonalizedEmailStrategy(
          lead, 
          lead.sourceBusinessAnalysis, 
          campaignGoal
        );
        
        // 基于AI策略生成邮件
        const enhancedEmail = await this.generateFromAIStrategy(lead, emailStrategy, productInfo);
        return enhancedEmail;
      }

      // 降级到真实AI引擎
      console.log(`🔥 调用真实AI引擎生成邮件...`);
      const aiGeneratedEmail = await this.realAI.generatePersonalizedEmail(lead, campaignGoal, productInfo);
      
      return {
        subject: aiGeneratedEmail.subject,
        body: aiGeneratedEmail.body,
        campaignGoal: campaignGoal,
        personalizationLevel: aiGeneratedEmail.personalizationLevel,
        aiInsights: aiGeneratedEmail.aiInsights,
        generatedAt: new Date().toISOString(),
        realAI: true,
        aiEnhanced: false // 标记为基础AI生成
      };

    } catch (error) {
      console.error('AI邮件生成失败:', error.message);
      // 最终降级到模板生成
      console.log('🔄 降级到模板生成模式');
      return this.generateFromTemplate(lead, campaignGoal, productInfo);
    }
  }

  // 获取最适合的模板
  getTemplate(campaignGoal, lead) {
    const templates = this.templates[campaignGoal] || this.templates['general_outreach'];
    
    // 基于lead信息选择最适合的模板风格
    let selectedStyle = 'professional'; // 默认
    
    if (lead.businessType === 'startup') selectedStyle = 'casual';
    if (lead.role && lead.role.includes('CEO')) selectedStyle = 'professional';
    if (campaignGoal === 'sales') selectedStyle = 'roi_focused';
    
    const bodyTemplate = templates.body_templates.find(t => t.style === selectedStyle) || 
                        templates.body_templates[0];
    
    return {
      subject_templates: templates.subject_templates,
      body_template: bodyTemplate.template,
      style: selectedStyle
    };
  }

  // 准备AI上下文
  prepareAIContext(lead, campaignGoal, productInfo) {
    return {
      lead: {
        name: lead.name,
        company: lead.company,
        role: lead.role,
        industry: lead.industry,
        businessType: lead.businessType,
        personalizedInsights: lead.personalizedInsights
      },
      campaign: {
        goal: campaignGoal,
        product: productInfo,
        ourCompany: productInfo.companyName || 'Our Company'
      },
      context: {
        painPoints: lead.personalizedInsights?.painPoints || ['运营效率', '成本控制'],
        opportunities: lead.personalizedInsights?.opportunities || ['业务增长', '技术升级'],
        approach: lead.personalizedInsights?.approach || '提供专业解决方案'
      }
    };
  }

  // 使用AI生成内容（模拟AI调用）
  async generateWithAI(template, context, lead) {
    // 在真实环境中，这里会调用OpenAI API或本地LLM
    // 这里我们使用规则式AI模拟生成
    
    const aiGeneratedContent = this.simulateAIGeneration(template, context, lead);
    
    return aiGeneratedContent;
  }

  // 模拟AI生成（规则式AI）
  simulateAIGeneration(template, context, lead) {
    const { painPoints, opportunities, approach } = context.context;
    const campaignGoal = context.campaign.goal;
    
    // AI分析选择最佳主题行
    let subject = this.selectBestSubjectLine(template.subject_templates, context, lead);
    
    // AI生成个性化开场
    let personalizedOpening = this.generatePersonalizedOpening(lead, context);
    
    // AI生成价值主张
    let valueProposition = this.generateValueProposition(campaignGoal, context, lead);
    
    // AI生成号召性用语
    let callToAction = this.generateCallToAction(campaignGoal, context);
    
    // 组合完整邮件
    let body = template.body_template;
    
    // AI智能替换占位符
    body = this.intelligentPlaceholderReplacement(body, {
      personalizedOpening,
      valueProposition,
      callToAction,
      ...context,
      lead
    });

    return {
      subject,
      body,
      personalizationLevel: this.calculatePersonalizationLevel(context, lead),
      aiInsights: {
        selectedStrategy: this.getSelectedStrategy(campaignGoal, lead),
        keyPersonalizations: this.getKeyPersonalizations(context, lead),
        expectedResponse: this.predictResponseLikelihood(context, lead)
      }
    };
  }

  // AI选择最佳主题行
  selectBestSubjectLine(subjectTemplates, context, lead) {
    // AI分析lead特征选择最佳主题行
    let bestSubject = subjectTemplates[0];
    
    // 基于角色优化
    if (lead.role && lead.role.includes('CEO')) {
      bestSubject = subjectTemplates.find(s => s.includes('ROI') || s.includes('opportunity')) || bestSubject;
    }
    
    // 基于行业优化
    if (lead.industry === 'technology') {
      bestSubject = subjectTemplates.find(s => s.includes('demo') || s.includes('transform')) || bestSubject;
    }
    
    return bestSubject;
  }

  // AI生成个性化开场
  generatePersonalizedOpening(lead, context) {
    const openings = [
      `I noticed ${lead.company} is doing impressive work in ${lead.industry}`,
      `Came across ${lead.company}'s innovative approach to ${lead.businessType}`,
      `Following ${lead.company}'s growth in the ${lead.industry} space`,
      `Impressed by ${lead.company}'s focus on ${context.context.opportunities[0]}`
    ];
    
    return openings[Math.floor(Math.random() * openings.length)];
  }

  // AI生成价值主张
  generateValueProposition(campaignGoal, context, lead) {
    const valueProps = {
      product_demo: `Our solution specifically helps ${lead.industry} companies ${context.context.opportunities[0]} while reducing ${context.context.painPoints[0]}`,
      sales: `Companies like ${lead.company} typically see 30-40% improvement in ${context.context.opportunities[0]} within 90 days`,
      partnership: `Together, ${lead.company} and ${context.campaign.ourCompany} could ${context.context.opportunities[0]} for both our customer bases`,
      general_outreach: `I thought you'd find our recent ${lead.industry} insights valuable for ${lead.company}'s ${context.context.opportunities[0]} initiatives`
    };
    
    return valueProps[campaignGoal] || valueProps['general_outreach'];
  }

  // 基于AI策略生成邮件
  async generateFromAIStrategy(lead, emailStrategy, productInfo) {
    console.log(`🎯 基于AI策略生成邮件 (个性化评分: ${emailStrategy.personalizationScore || 0})`);
    
    try {
      // 选择最佳主题行
      const subject = emailStrategy.subjectLineOptions ? 
        emailStrategy.subjectLineOptions[0] : 
        `Partnership opportunity with ${lead.company}`;
      
      // 构建邮件内容
      const body = this.buildAIEnhancedEmailBody(lead, emailStrategy, productInfo);
      
      return {
        subject: subject,
        body: body,
        campaignGoal: 'ai_enhanced',
        personalizationLevel: emailStrategy.personalizationScore || 85,
        aiInsights: {
          strategy: emailStrategy,
          personalizationElements: emailStrategy.personalizationElements || [],
          industrySpecific: emailStrategy.industrySpecificLanguage || []
        },
        generatedAt: new Date().toISOString(),
        realAI: true,
        aiEnhanced: true,
        businessAware: true
      };
      
    } catch (error) {
      console.error('AI策略邮件生成失败:', error.message);
      // 降级处理
      return this.generateFromTemplate(lead, 'partnership', productInfo);
    }
  }
  
  // 构建AI增强邮件正文
  buildAIEnhancedEmailBody(lead, strategy, productInfo) {
    const parts = [];

    // 1. 个性化开场
    parts.push(strategy.openingLine || `Hi ${lead.name || 'there'},`);

    // 2. 业务连接
    if (strategy.businessConnection) {
      parts.push(strategy.businessConnection);
    }

    // 3. 价值主张
    if (strategy.valueProposition) {
      parts.push(strategy.valueProposition);
    }

    // 4. 具体利益
    if (strategy.specificBenefits && strategy.specificBenefits.length > 0) {
      parts.push('Specifically for businesses like yours, this could mean:');
      strategy.specificBenefits.forEach(benefit => {
        parts.push(`• ${benefit}`);
      });
    }

    // 5. 号召性用语
    if (strategy.callToAction) {
      parts.push(strategy.callToAction);
    }

    // 6. 签名
    parts.push('Best regards,');
    parts.push(productInfo.senderName || 'The Team');

    // Join with double newlines for proper paragraph spacing
    return parts.join('\n\n');
  }

  // AI生成号召性用语
  generateCallToAction(campaignGoal, context) {
    const ctas = {
      product_demo: "Would you be interested in a quick 15-minute demo to see how this could benefit your team?",
      sales: "I'd love to share a case study and discuss how we could deliver similar results for your company.",
      partnership: "Would you be open to exploring this opportunity? I can share more details and success stories.",
      general_outreach: "If you find this valuable and want to explore how it applies to your situation, I'm happy to chat."
    };
    
    return ctas[campaignGoal] || ctas['general_outreach'];
  }

  // 智能占位符替换
  intelligentPlaceholderReplacement(template, data) {
    let result = template;
    
    // 基本信息替换
    result = result.replace(/\{name\}/g, data.lead.name || 'there');
    result = result.replace(/\{companyName\}/g, data.lead.company || 'your company');
    result = result.replace(/\{industry\}/g, data.lead.industry || 'your industry');
    result = result.replace(/\{role\}/g, data.lead.role || 'your role');
    
    // AI智能填充痛点和机会
    result = result.replace(/\{painPoint\}/g, data.context.painPoints[0] || '运营挑战');
    result = result.replace(/\{opportunity\}/g, data.context.opportunities[0] || '业务增长');
    result = result.replace(/\{approach\}/g, data.context.approach || '优化流程');
    
    // 产品信息
    result = result.replace(/\{productName\}/g, data.campaign.product.name || 'our solution');
    result = result.replace(/\{senderName\}/g, data.campaign.product.senderName || 'Team');
    
    // AI生成时间段
    result = result.replace(/\{timeSlot1\}/g, this.generateTimeSlot(1));
    result = result.replace(/\{timeSlot2\}/g, this.generateTimeSlot(2));
    
    // AI生成指标
    result = result.replace(/\{metric1\}/g, this.generateMetric(data.lead.industry));
    result = result.replace(/\{metric2\}/g, this.generateCostSaving());
    result = result.replace(/\{metric3\}/g, this.generateEfficiencyMetric());
    
    return result;
  }

  // 辅助函数：生成时间段
  generateTimeSlot(offset) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + offset);
    const timeSlots = ['10:00 AM', '2:00 PM', '4:00 PM'];
    const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    return `${tomorrow.toLocaleDateString()} at ${slot}`;
  }

  // 辅助函数：生成行业指标
  generateMetric(industry) {
    const metrics = {
      'technology': '开发效率',
      'retail': '转化率',
      'healthcare': '患者满意度',
      'finance': '交易处理速度',
      'default': '运营效率'
    };
    return metrics[industry] || metrics['default'];
  }

  generateCostSaving() {
    const savings = ['$25K', '$50K', '$75K', '$100K'];
    return savings[Math.floor(Math.random() * savings.length)];
  }

  generateEfficiencyMetric() {
    const metrics = ['处理时间', '响应速度', '自动化率', '准确率'];
    return metrics[Math.floor(Math.random() * metrics.length)];
  }

  // 应用最终个性化
  applyPersonalization(aiContent, lead, productInfo) {
    return {
      subject: aiContent.subject,
      body: aiContent.body,
      personalizationLevel: aiContent.personalizationLevel,
      aiInsights: aiContent.aiInsights
    };
  }

  // 计算个性化程度
  calculatePersonalizationLevel(context, lead) {
    let level = 0;
    
    if (lead.personalizedInsights) level += 3;
    if (lead.industry && lead.industry !== 'other') level += 2;
    if (lead.businessType && lead.businessType !== 'unknown') level += 2;
    if (lead.role) level += 1;
    if (context.context.painPoints.length > 1) level += 1;
    if (context.context.opportunities.length > 1) level += 1;
    
    if (level >= 8) return 'high';
    if (level >= 5) return 'medium';
    return 'low';
  }

  // 获取选择的策略
  getSelectedStrategy(campaignGoal, lead) {
    const strategies = {
      'product_demo': 'Value demonstration approach',
      'sales': 'ROI-focused sales pitch',
      'partnership': 'Collaborative growth strategy',
      'general_outreach': 'Value-first relationship building'
    };
    return strategies[campaignGoal] || strategies['general_outreach'];
  }

  // 获取关键个性化点
  getKeyPersonalizations(context, lead) {
    return [
      `Industry-specific: ${lead.industry}`,
      `Business type: ${lead.businessType}`,
      `Pain point: ${context.context.painPoints[0]}`,
      `Opportunity: ${context.context.opportunities[0]}`
    ];
  }

  // 预测响应可能性
  predictResponseLikelihood(context, lead) {
    let score = 5; // 基准50%
    
    if (lead.personalizedInsights) score += 2;
    if (lead.role && (lead.role.includes('CEO') || lead.role.includes('Manager'))) score += 1;
    if (context.campaign.goal === 'product_demo') score += 1;
    if (lead.businessType === 'startup') score += 1;
    
    return Math.min(score * 10, 85) + '%'; // 最高85%
  }

  // 模板降级生成
  generateFromTemplate(lead, campaignGoal, productInfo) {
    console.log('🔄 降级到模板生成模式');
    
    const template = this.getTemplate(campaignGoal, lead);
    const subject = template.subject_templates[0];
    let body = template.body_template;
    
    // 简单替换
    body = body.replace(/\{name\}/g, lead.name || 'there');
    body = body.replace(/\{companyName\}/g, lead.company || 'your company');
    body = body.replace(/\{industry\}/g, lead.industry || 'your industry');
    body = body.replace(/\{senderName\}/g, productInfo.senderName || 'Team');
    
    return {
      subject: subject,
      body: body,
      campaignGoal: campaignGoal,
      personalizationLevel: 'template',
      aiInsights: {
        selectedStrategy: 'Template fallback',
        keyPersonalizations: ['Basic template substitution'],
        expectedResponse: '30%'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 基于业务分析生成邮件
  async generateBusinessAwareEmail(lead, campaignGoal, productInfo) {
    try {
      const { sourceBusinessAnalysis, smartAnalysis } = lead;
      
      console.log(`🎯 生成业务感知邮件:`);
      console.log(`   源业务: ${sourceBusinessAnalysis.companyName} (${sourceBusinessAnalysis.industry})`);
      console.log(`   目标: ${lead.company} (${smartAnalysis.targetIndustry})`);
      console.log(`   协同效应: ${smartAnalysis.synergies.join(', ')}`);
      
      // 生成针对性的主题行
      const subject = this.generateContextualSubject(lead, sourceBusinessAnalysis, smartAnalysis);
      
      // 生成针对性的邮件正文
      const body = this.generateContextualBody(lead, sourceBusinessAnalysis, smartAnalysis, productInfo);
      
      return {
        subject: subject,
        body: body,
        campaignGoal: campaignGoal,
        personalizationLevel: 'business-aware',
        aiInsights: {
          sourceIndustry: sourceBusinessAnalysis.industry,
          targetIndustry: smartAnalysis.targetIndustry,
          matchReason: smartAnalysis.matchReason,
          synergies: smartAnalysis.synergies,
          approachStrategy: smartAnalysis.approachStrategy
        },
        generatedAt: new Date().toISOString(),
        businessAware: true
      };
      
    } catch (error) {
      console.error('业务感知邮件生成失败:', error.message);
      // 降级到普通生成
      return this.generateFromTemplate(lead, campaignGoal, productInfo);
    }
  }

  // 生成上下文相关的主题行
  generateContextualSubject(lead, sourceAnalysis, smartAnalysis) {
    const subjects = [];
    
    if (sourceAnalysis.industry === 'pet-tech' && smartAnalysis.targetIndustry.includes('pet')) {
      subjects.push(`AI Pet Portraits for ${lead.company} Customers`);
      subjects.push(`Boost ${lead.company} Customer Engagement with AI Pet Art`);
      subjects.push(`${lead.name}, Create Memorable Pet Experiences for Your Customers`);
      subjects.push(`Transform Pet Photos into Art - Perfect for ${lead.company}`);
    } else if (sourceAnalysis.industry === 'ai-ml') {
      subjects.push(`AI Solutions Tailored for ${smartAnalysis.targetIndustry} Industry`);
      subjects.push(`${lead.name}, Revolutionize ${lead.company} with Custom AI`);
      subjects.push(`Proven AI Success Stories in ${smartAnalysis.targetIndustry}`);
    } else {
      subjects.push(`${sourceAnalysis.valueProposition} for ${lead.company}`);
      subjects.push(`${lead.name}, ${sourceAnalysis.keyMessaging.primary}`);
    }
    
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  // 生成上下文相关的邮件正文
  generateContextualBody(lead, sourceAnalysis, smartAnalysis, productInfo) {
    const companyName = productInfo.companyName || sourceAnalysis.companyName || 'Our Company';
    const synergies = smartAnalysis.synergies || [];
    const approach = smartAnalysis.approachStrategy || {};
    
    // 根据行业匹配生成不同的邮件模板
    if (sourceAnalysis.industry === 'pet-tech' && smartAnalysis.targetIndustry.includes('pet')) {
      return this.generatePetTechEmail(lead, sourceAnalysis, smartAnalysis, companyName);
    }
    
    return this.generateGeneralBusinessEmail(lead, sourceAnalysis, smartAnalysis, companyName);
  }

  // 生成宠物科技行业邮件
  generatePetTechEmail(lead, sourceAnalysis, smartAnalysis, companyName) {
    const synergies = smartAnalysis.synergies.join(' and ');
    const matchReason = smartAnalysis.matchReason;
    
    return `Hello ${lead.name},

I hope this message finds you well at ${lead.company}.

I'm reaching out because ${companyName} has developed an innovative AI pet portrait service that could be perfect for ${lead.company}'s customers. ${synergies ? `Since ${synergies.toLowerCase()}, ` : ''}I believe there's a natural partnership opportunity here.

**What makes this relevant for ${lead.company}:**
• Enhance customer experience with unique, personalized pet portraits
• Create additional revenue streams through premium services
• Strengthen customer loyalty with memorable pet art
• Stand out from competitors with cutting-edge AI technology

**Results we've seen with similar ${smartAnalysis.targetIndustry} businesses:**
• 40% increase in customer engagement
• 25% boost in repeat visits
• New revenue stream averaging $15,000/month
• Enhanced brand differentiation

${lead.company} clearly values ${smartAnalysis.targetIndustry === 'pet-retail' ? 'customer satisfaction and innovative pet products' : 'professional pet care and customer relationships'}. Our AI pet portrait service could help you deliver even more value to your pet-loving customers.

Would you be interested in a 15-minute call to explore how this could work for ${lead.company}? I can show you some examples of portraits we've created and discuss a pilot program.

I have availability this week if you'd like to learn more.

Best regards,
${companyName} Team

P.S. I'd be happy to create a sample AI portrait of your own pet to demonstrate the quality - no strings attached!`;
  }

  // 生成通用商业邮件
  generateGeneralBusinessEmail(lead, sourceAnalysis, smartAnalysis, companyName) {
    const valueProps = sourceAnalysis.valueProposition;
    const keyMessage = sourceAnalysis.keyMessaging?.primary || 'innovative solutions';
    
    return `Hello ${lead.name},

I'm reaching out from ${companyName} because I noticed ${lead.company}'s work in the ${smartAnalysis.targetIndustry} industry.

${sourceAnalysis.mainProducts.length > 0 ? `We specialize in ${sourceAnalysis.mainProducts.join(' and ')} ` : ''}${valueProps}, and I believe this could be valuable for ${lead.company}.

**Why this matters for ${lead.company}:**
${smartAnalysis.synergies.map(synergy => `• ${synergy}`).join('\n')}

**What we've achieved for similar ${smartAnalysis.targetIndustry} companies:**
• Increased operational efficiency by 30-40%
• Reduced costs by an average of $50,000 annually
• Enhanced customer satisfaction scores
• Streamlined key business processes

Given ${lead.company}'s focus on ${smartAnalysis.targetIndustry}, I'd love to share how ${keyMessage} could specifically benefit your operations.

Would you be open to a brief 15-minute conversation? I can share some relevant case studies and discuss how this might apply to your situation.

Best regards,
${companyName} Team`;
  }

  // 批量生成邮件
  async generateBulkEmails(leads, campaignGoal, productInfo) {
    console.log(`🚀 批量生成 ${leads.length} 封个性化邮件`);
    
    const results = [];
    
    for (const lead of leads) {
      try {
        const email = await this.generatePersonalizedEmail(lead, campaignGoal, productInfo);
        results.push({
          leadId: lead.id,
          email: email,
          status: 'generated'
        });
        
        // 添加延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`邮件生成失败 ${lead.email}:`, error.message);
        results.push({
          leadId: lead.id,
          email: null,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log(`✅ 批量生成完成: ${results.filter(r => r.status === 'generated').length} 成功, ${results.filter(r => r.status === 'failed').length} 失败`);
    return results;
  }

  /**
   * Generate personalized email using LinkedIn persona data
   */
  async generatePersonalizedEmailWithPersona(prospect, campaignGoal, productInfo) {
    try {
      console.log(`🎯 Generating personalized email for ${prospect.email} using LinkedIn persona`);
      
      // Get persona data
      const persona = prospect.persona || (await this.personaStorage.getPersona(prospect.email));
      
      if (!persona) {
        console.log('⚠️ No persona found, using standard email generation');
        return await this.generateEmail(prospect, campaignGoal, productInfo);
      }

      // Generate persona-driven email using Ollama
      const prompt = `Create a highly personalized cold email using this LinkedIn persona data:

PROSPECT INFORMATION:
Name: ${prospect.name}
Email: ${prospect.email}
Company: ${prospect.company}
Role: ${prospect.role}
LinkedIn: ${prospect.linkedinProfile}
Location: ${prospect.location}

PERSONA DATA:
${JSON.stringify(persona, null, 2)}

CAMPAIGN CONTEXT:
Goal: ${campaignGoal}
Our Company: ${productInfo.companyName}
Our Product: ${productInfo.productName}
Our Value Prop: ${productInfo.valueProposition}

REQUIREMENTS:
1. Reference specific details from their LinkedIn profile
2. Address their professional challenges mentioned in persona
3. Use their preferred communication style
4. Connect our solution to their pain points
5. Include a relevant value proposition
6. Keep tone professional but personalized
7. Maximum 150 words

Return JSON format:
{
  "subject": "...",
  "body": "...",
  "personalizationNotes": "...",
  "confidenceScore": 0.8
}`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_ctx: 4096
        }
      });

      let emailContent;
      try {
        emailContent = JSON.parse(response.data.response);
      } catch (parseError) {
        // If JSON parsing fails, create structured response from text
        emailContent = this.parseEmailFromText(response.data.response, prospect, persona);
      }

      console.log(`✅ Generated persona-based email for ${prospect.name}`);
      return {
        subject: emailContent.subject,
        body: emailContent.body,
        personalizationLevel: 'high_persona_based',
        personaUsed: true,
        confidenceScore: emailContent.confidenceScore || 0.8,
        personalizationNotes: emailContent.personalizationNotes,
        linkedinProfile: prospect.linkedinProfile
      };

    } catch (error) {
      console.error('❌ Persona-based email generation failed:', error.message);
      
      // Fallback to standard email generation
      return await this.generateEmail(prospect, campaignGoal, productInfo);
    }
  }

  /**
   * Parse email content from text when JSON parsing fails
   */
  parseEmailFromText(text, prospect, persona) {
    const lines = text.split('\n');
    let subject = '';
    let body = '';
    let inBody = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('subject:')) {
        subject = line.replace(/subject:/i, '').trim().replace(/"/g, '');
      } else if (line.toLowerCase().includes('body:') || inBody) {
        inBody = true;
        if (!line.toLowerCase().includes('body:')) {
          body += line + '\n';
        }
      }
    }

    // If parsing failed, create a basic personalized email
    if (!subject || !body) {
      subject = `Quick question about ${prospect.company}'s ${persona.summary?.split(' ')[0] || 'goals'}`;
      body = `Hi ${prospect.name},

I noticed your work as ${prospect.role} at ${prospect.company}. Given your background in ${persona.summary || 'your field'}, I thought you might be interested in how we're helping similar professionals overcome challenges.

Would you be open to a brief conversation about your current priorities?

Best regards,
${productInfo.senderName || 'The Team'}`;
    }

    return {
      subject: subject.trim(),
      body: body.trim(),
      personalizationNotes: 'Parsed from AI text response',
      confidenceScore: 0.6
    };
  }

  // 获取生成统计
  getGenerationStats() {
    return {
      availableTemplates: Object.keys(this.templates),
      supportedCampaigns: ['product_demo', 'sales', 'partnership', 'general_outreach'],
      personalizationFeatures: [
        'AI-driven content generation',
        'LinkedIn persona-based emails',
        'Industry-specific templates',
        'Role-based personalization',
        'Pain point analysis',
        'Opportunity identification',
        'Response likelihood prediction'
      ]
    };
  }
}

module.exports = AIEmailGenerator;