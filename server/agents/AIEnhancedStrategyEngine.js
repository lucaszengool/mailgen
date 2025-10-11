const axios = require('axios');

class AIEnhancedStrategyEngine {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.enhancementCache = new Map();
  }

  // 使用AI增强业务分析和匹配策略
  async enhanceBusinessAnalysis(basicAnalysis) {
    console.log(`🤖 使用${this.provider}增强业务分析...`);
    
    const cacheKey = `analysis_${this.hashObject(basicAnalysis)}`;
    if (this.enhancementCache.has(cacheKey)) {
      console.log('📋 使用缓存的AI增强分析');
      return this.enhancementCache.get(cacheKey);
    }

    try {
      const prompt = this.generateAnalysisPrompt(basicAnalysis);
      const aiResponse = await this.callAIModel(prompt);
      
      const enhancedAnalysis = {
        ...basicAnalysis,
        aiEnhanced: true,
        aiInsights: this.parseAIAnalysisResponse(aiResponse),
        enhancedAt: new Date().toISOString()
      };

      this.enhancementCache.set(cacheKey, enhancedAnalysis);
      console.log('✅ AI增强分析完成');
      
      return enhancedAnalysis;
      
    } catch (error) {
      console.log('⚠️ AI增强失败，使用基础分析:', error.message);
      return basicAnalysis;
    }
  }

  // 生成AI增强的匹配策略
  async generateEnhancedMatchingStrategy(businessAnalysis) {
    console.log('🎯 生成AI增强匹配策略...');
    
    try {
      const prompt = this.generateStrategyPrompt(businessAnalysis);
      const aiResponse = await this.callAIModel(prompt);
      
      const strategy = this.parseStrategyResponse(aiResponse);
      
      // 融合AI策略和基础策略
      const enhancedStrategy = {
        ...strategy,
        aiGenerated: true,
        specificity: 'high',
        personalizationLevel: 'advanced',
        generatedAt: new Date().toISOString()
      };

      console.log('✅ AI增强策略生成完成');
      console.log(`   目标行业: ${enhancedStrategy.targetIndustries?.join(', ')}`);
      console.log(`   个性化级别: ${enhancedStrategy.personalizationLevel}`);
      
      return enhancedStrategy;
      
    } catch (error) {
      console.log('⚠️ AI策略生成失败，使用基础策略:', error.message);
      return this.getFallbackStrategy(businessAnalysis);
    }
  }

  // 生成个性化邮件建议
  async generatePersonalizedEmailStrategy(lead, businessAnalysis, campaignGoal) {
    console.log(`✉️ 为 ${lead.company} 生成个性化邮件策略...`);
    
    try {
      const prompt = this.generateEmailStrategyPrompt(lead, businessAnalysis, campaignGoal);
      const aiResponse = await this.callAIModel(prompt);
      
      const emailStrategy = this.parseEmailStrategyResponse(aiResponse);
      
      return {
        ...emailStrategy,
        aiOptimized: true,
        personalizationScore: this.calculatePersonalizationScore(emailStrategy),
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.log('⚠️ 个性化邮件策略生成失败:', error.message);
      return this.getBasicEmailStrategy(lead, campaignGoal);
    }
  }

  // 调用AI模型
  async callAIModel(prompt, maxTokens = 1000) {
    if (!this.apiKey) {
      throw new Error('AI API密钥未配置');
    }

    if (this.provider === 'openai') {
      return await this.callOpenAI(prompt, maxTokens);
    } else if (this.provider === 'anthropic') {
      return await this.callClaude(prompt, maxTokens);
    } else {
      throw new Error('不支持的AI提供商');
    }
  }

  // 调用OpenAI API
  async callOpenAI(prompt, maxTokens) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI marketing strategist specializing in B2B email outreach and business analysis. Provide detailed, actionable insights in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
      // No timeout - allow infinite time
    });

    return response.data.choices[0].message.content;
  }

  // 调用Claude API
  async callClaude(prompt, maxTokens) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease respond in valid JSON format.`
        }
      ]
    }, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
      // No timeout - allow infinite time
    });

    return response.data.content[0].text;
  }

  // 生成业务分析提示
  generateAnalysisPrompt(analysis) {
    return `
Analyze this business and provide enhanced insights:

Business Information:
- Company: ${analysis.companyName}
- Industry: ${analysis.industry}  
- Products: ${analysis.mainProducts?.join(', ')}
- Value Proposition: ${analysis.valueProposition}
- Target Market: ${analysis.targetMarket?.join(', ')}

Please provide enhanced analysis in JSON format with:
{
  "refinedIndustryClassification": "more specific industry category",
  "competitiveAdvantages": ["list of unique advantages"],
  "marketOpportunities": ["potential market opportunities"],
  "idealCustomerSegments": [
    {
      "segment": "segment name",
      "characteristics": ["key characteristics"],
      "painPoints": ["specific pain points"],
      "approachRecommendation": "how to approach this segment"
    }
  ],
  "keyDifferentiators": ["what makes this business unique"],
  "growthPotential": "assessment of growth potential",
  "recommendedPositioning": "how to position in market",
  "partnershipOpportunities": ["potential partnership types"]
}
`;
  }

  // 生成策略提示
  generateStrategyPrompt(businessAnalysis) {
    return `
Based on this business analysis, create a highly specific customer targeting strategy:

Business: ${businessAnalysis.companyName}
Industry: ${businessAnalysis.industry}
Products: ${businessAnalysis.mainProducts?.join(', ')}
Value Proposition: ${businessAnalysis.valueProposition}

Create a precise targeting strategy in JSON format:
{
  "targetIndustries": ["very specific industry categories"],
  "idealCustomerProfile": {
    "businessTypes": ["specific business types that would benefit"],
    "companySize": ["preferred company sizes"],
    "characteristics": ["must-have characteristics"],
    "technographics": ["technology they likely use"],
    "demographics": ["geographic/demographic filters"],
    "behavioralTraits": ["how they behave/operate"],
    "painPoints": ["specific problems they face"],
    "budgetRange": "estimated budget range",
    "decisionMakers": ["who makes purchasing decisions"]
  },
  "avoidIndustries": ["industries to avoid"],
  "prioritySegments": [
    {
      "segment": "highest priority segment",
      "score": 100,
      "reason": "why this is priority"
    }
  ],
  "approachStrategy": {
    "emailTone": "optimal tone for outreach",
    "keyMessages": ["specific messages that resonate"],
    "valueProps": ["tailored value propositions"],
    "socialProof": ["types of proof to include"],
    "callToAction": "specific CTA",
    "followUpSequence": ["follow-up strategy"]
  },
  "personalizationRules": [
    {
      "if": "condition",
      "then": "personalization approach"
    }
  ]
}
`;
  }

  // 生成邮件策略提示
  generateEmailStrategyPrompt(lead, businessAnalysis, campaignGoal) {
    return `
Create a personalized email strategy for this lead:

LEAD INFORMATION:
- Company: ${lead.company}
- Industry: ${lead.industry}
- Contact: ${lead.name} (${lead.role || 'Contact'})
- Website: ${lead.website}
${lead.smartAnalysis ? `- Match Reason: ${lead.smartAnalysis.matchReason}` : ''}
${lead.smartAnalysis ? `- Synergies: ${lead.smartAnalysis.synergies?.join(', ')}` : ''}

SOURCE BUSINESS:
- Company: ${businessAnalysis.companyName}
- Industry: ${businessAnalysis.industry}
- Products: ${businessAnalysis.mainProducts?.join(', ')}
- Value Prop: ${businessAnalysis.valueProposition}

CAMPAIGN GOAL: ${campaignGoal}

Generate personalized email strategy in JSON format:
{
  "subjectLineOptions": ["3 personalized subject line options"],
  "openingLine": "personalized opening based on their business",
  "valueProposition": "specific value prop for their industry/needs", 
  "businessConnection": "how your businesses connect/complement",
  "specificBenefits": ["benefits specific to their business type"],
  "socialProofType": "most relevant social proof to include",
  "callToAction": "specific CTA for their situation",
  "followUpStrategy": "when and how to follow up",
  "personalizationElements": [
    {
      "element": "what to personalize",
      "approach": "how to personalize it",
      "example": "example of personalization"
    }
  ],
  "toneAdjustments": "how to adjust tone for this lead",
  "industrySpecificLanguage": ["terminology/language to use"],
  "potentialObjections": ["likely objections and responses"],
  "meetingProposal": "specific meeting/demo proposal"
}
`;
  }

  // 解析AI分析响应
  parseAIAnalysisResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.log('AI响应解析失败，使用基础解析');
      return {
        refinedIndustryClassification: 'technology',
        competitiveAdvantages: ['Innovation', 'Customer focus'],
        marketOpportunities: ['Digital transformation', 'Automation'],
        idealCustomerSegments: [{
          segment: 'Growing businesses',
          characteristics: ['Tech-savvy', 'Growth-oriented'],
          painPoints: ['Efficiency challenges', 'Scalability issues'],
          approachRecommendation: 'Focus on ROI and efficiency gains'
        }]
      };
    }
  }

  // 解析策略响应
  parseStrategyResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.log('策略响应解析失败，使用基础策略');
      return this.getFallbackStrategy();
    }
  }

  // 解析邮件策略响应
  parseEmailStrategyResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.log('邮件策略响应解析失败');
      return {
        subjectLineOptions: ['Partnership Opportunity', 'Quick Question', 'Mutual Benefit'],
        openingLine: 'Hope this message finds you well',
        valueProposition: 'Our solution can help improve your business efficiency',
        callToAction: 'Would you be interested in a brief call to discuss?'
      };
    }
  }

  // 获取后备策略
  getFallbackStrategy(businessAnalysis) {
    return {
      targetIndustries: ['technology', 'services', 'retail'],
      idealCustomerProfile: {
        businessTypes: ['SME', 'Growing companies'],
        characteristics: ['Digital-forward', 'Growth-oriented'],
        painPoints: ['Efficiency', 'Scalability', 'Competition']
      },
      approachStrategy: {
        emailTone: 'professional and friendly',
        keyMessages: ['Innovation', 'Efficiency', 'Growth'],
        callToAction: 'Schedule a brief discussion'
      }
    };
  }

  // 获取基础邮件策略
  getBasicEmailStrategy(lead, campaignGoal) {
    return {
      subjectLineOptions: ['Partnership Opportunity', 'Quick Question about ' + lead.company],
      openingLine: `Hi ${lead.name || 'there'},`,
      valueProposition: 'Our solution can help enhance your business operations',
      callToAction: 'Would you be open to a brief conversation?',
      personalizationScore: 60
    };
  }

  // 计算个性化评分
  calculatePersonalizationScore(strategy) {
    let score = 50; // 基础分
    
    if (strategy.personalizationElements?.length > 0) score += 20;
    if (strategy.industrySpecificLanguage?.length > 0) score += 15;
    if (strategy.businessConnection) score += 10;
    if (strategy.specificBenefits?.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  // 生成对象哈希
  hashObject(obj) {
    return JSON.stringify(obj).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }

  // 获取AI使用统计
  getAIStats() {
    return {
      provider: this.provider,
      model: this.model,
      cacheSize: this.enhancementCache.size,
      isConfigured: !!this.apiKey,
      lastUsed: new Date().toISOString()
    };
  }

  // 清理缓存
  clearCache() {
    this.enhancementCache.clear();
    console.log('AI增强缓存已清理');
  }
}

module.exports = AIEnhancedStrategyEngine;