const axios = require('axios');

class AIEmailContentGenerator {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
    this.generationCache = new Map();
    this.generatedCount = 0;
  }

  // 基于AI的完全定制化邮件生成
  async generateFullyCustomizedEmail(prospect, sourceBusinessAnalysis, campaignObjective) {
    console.log(`📧 AI生成完全定制化邮件: ${prospect.company}`);
    this.generatedCount++;

    try {
      // 1. AI分析潜在客户和源业务的关系
      const relationshipAnalysis = await this.analyzeBusinessRelationship(
        sourceBusinessAnalysis, 
        prospect
      );

      // 2. AI生成邮件策略
      const emailStrategy = await this.generateEmailStrategy(
        prospect, 
        sourceBusinessAnalysis, 
        relationshipAnalysis,
        campaignObjective
      );

      // 3. AI生成完整邮件内容
      const emailContent = await this.generateEmailContent(
        prospect,
        sourceBusinessAnalysis,
        relationshipAnalysis,
        emailStrategy
      );

      // 4. AI优化和个性化
      const finalEmail = await this.optimizeEmailContent(
        emailContent,
        prospect,
        relationshipAnalysis
      );

      return {
        ...finalEmail,
        aiGenerated: true,
        fullyCustomized: true,
        relationshipAnalysis: relationshipAnalysis,
        emailStrategy: emailStrategy,
        generatedAt: new Date().toISOString(),
        personalizationLevel: finalEmail.personalizationScore || 90
      };

    } catch (error) {
      console.error('AI邮件生成失败:', error.message);
      throw error;
    }
  }

  // AI分析业务关系
  async analyzeBusinessRelationship(sourceAnalysis, prospect) {
    console.log('🤖 AI分析业务关系...');

    const prompt = `
作为商业关系分析专家，深度分析以下两个业务之间的关系和合作机会：

源业务（我们）：
公司：${sourceAnalysis.companyName}
行业：${sourceAnalysis.industry}
产品：${sourceAnalysis.mainProducts?.join(', ')}
价值主张：${sourceAnalysis.valueProposition}
目标客户：${JSON.stringify(sourceAnalysis.targetCustomers)}

目标潜在客户：
公司：${prospect.company}
行业：${prospect.industry}
业务类型：${prospect.businessType}
描述：${prospect.description}
主要产品：${prospect.aiAnalysis?.mainProducts?.join(', ')}
痛点：${prospect.aiAnalysis?.painPoints?.join(', ')}
优势：${prospect.aiAnalysis?.keyStrengths?.join(', ')}

请返回JSON格式的深度关系分析：
{
  "relationshipType": "partnership/supplier/customer/complementary",
  "synergies": [
    {
      "type": "协同类型",
      "description": "详细描述",
      "benefit": "具体利益",
      "priority": "high/medium/low"
    }
  ],
  "valueProposition": "针对这个客户的特定价值主张",
  "painPointsWeCanSolve": [
    {
      "painPoint": "具体痛点",
      "ourSolution": "我们的解决方案",
      "impact": "预期影响"
    }
  ],
  "collaborationOpportunities": [
    {
      "opportunity": "合作机会",
      "description": "详细描述",
      "mutualBenefit": "双方利益"
    }
  ],
  "competitiveAdvantages": ["我们相对于竞争对手的优势"],
  "riskFactors": ["潜在风险或挑战"],
  "successProbability": 1-100,
  "recommendedApproach": "建议的接触方式",
  "keyDecisionFactors": ["影响决策的关键因素"]
}
`;

    try {
      const response = await this.callOllama(prompt);
      const analysis = this.parseOllamaResponse(response);
      console.log('✅ 业务关系分析完成');
      return analysis;
    } catch (error) {
      console.error('业务关系分析失败:', error.message);
      return this.getBasicRelationshipAnalysis(sourceAnalysis, prospect);
    }
  }

  // AI生成邮件策略
  async generateEmailStrategy(prospect, sourceAnalysis, relationshipAnalysis, campaignObjective) {
    console.log('🎯 AI生成邮件策略...');

    const prompt = `
基于业务关系分析，为以下邮件营销制定详细策略：

活动目标：${campaignObjective}
成功概率：${relationshipAnalysis.successProbability}%
推荐方法：${relationshipAnalysis.recommendedApproach}

目标公司：${prospect.company}
联系偏好：${prospect.aiAnalysis?.contactPreference}
最佳方法：${prospect.aiAnalysis?.bestApproach}
决策者：${prospect.aiAnalysis?.decisionMakers?.join(', ')}

请返回JSON格式的邮件策略：
{
  "emailObjective": "这封邮件的具体目标",
  "tone": "邮件语调（professional/friendly/consultative/etc）",
  "structure": {
    "opening": "开头策略",
    "body": "正文策略",
    "closing": "结尾策略"
  },
  "keyMessages": [
    {
      "message": "关键信息",
      "purpose": "目的",
      "placement": "放置位置"
    }
  ],
  "personalizationElements": [
    {
      "element": "个性化元素",
      "source": "信息来源",
      "impact": "预期影响"
    }
  ],
  "callToAction": {
    "type": "CTA类型",
    "text": "具体CTA文本",
    "urgency": "紧迫性级别"
  },
  "followUpStrategy": "后续跟进策略",
  "successMetrics": ["成功指标"],
  "riskMitigation": ["风险缓解措施"]
}
`;

    try {
      const response = await this.callOllama(prompt);
      const strategy = this.parseOllamaResponse(response);
      console.log('✅ 邮件策略生成完成');
      return strategy;
    } catch (error) {
      console.error('邮件策略生成失败:', error.message);
      return this.getBasicEmailStrategy(campaignObjective);
    }
  }

  // AI生成邮件内容
  async generateEmailContent(prospect, sourceAnalysis, relationshipAnalysis, emailStrategy) {
    console.log('✍️ AI生成邮件内容...');

    const prompt = `
根据分析和策略，撰写一封完全定制化的商务邮件：

收件人信息：
公司：${prospect.company}
行业：${prospect.industry}
描述：${prospect.description}

发件人信息：
公司：${sourceAnalysis.companyName}
产品：${sourceAnalysis.mainProducts?.join(', ')}

关系分析：
价值主张：${relationshipAnalysis.valueProposition}
主要协同效应：${relationshipAnalysis.synergies?.map(s => s.description).join('; ')}
可解决的痛点：${relationshipAnalysis.painPointsWeCanSolve?.map(p => p.painPoint).join('; ')}

邮件策略：
目标：${emailStrategy.emailObjective}
语调：${emailStrategy.tone}
关键信息：${emailStrategy.keyMessages?.map(m => m.message).join('; ')}
CTA：${emailStrategy.callToAction?.text}

请生成完整的邮件内容（JSON格式）：
{
  "subject": "个性化主题行",
  "greeting": "个性化问候语",
  "opening": "引人注目的开头段落",
  "bodyParagraphs": [
    "正文段落1 - 建立联系和信任",
    "正文段落2 - 价值主张和解决方案",
    "正文段落3 - 具体利益和证明"
  ],
  "callToAction": "明确的行动号召",
  "closing": "专业的结尾",
  "signature": "签名建议",
  "personalTouches": [
    {
      "element": "个性化元素",
      "location": "位置",
      "reason": "原因"
    }
  ],
  "businessRelevance": "与对方业务的相关性说明"
}

要求：
1. 完全原创，不使用任何模板
2. 高度个性化，体现对对方业务的深度理解
3. 专业但不死板，有人情味
4. 明确价值主张，不空洞
5. 长度适中，重点突出
`;

    try {
      const response = await this.callOllama(prompt);
      const content = this.parseOllamaResponse(response);
      console.log('✅ 邮件内容生成完成');
      return content;
    } catch (error) {
      console.error('邮件内容生成失败:', error.message);
      throw error;
    }
  }

  // AI优化邮件内容
  async optimizeEmailContent(emailContent, prospect, relationshipAnalysis) {
    console.log('⚡ AI优化邮件内容...');

    const prompt = `
优化以下邮件内容，提高个性化程度和转化率：

现有邮件内容：
主题：${emailContent.subject}
开头：${emailContent.opening}
正文：${emailContent.bodyParagraphs?.join(' ')}
CTA：${emailContent.callToAction}

目标公司：${prospect.company}
成功概率：${relationshipAnalysis.successProbability}%
关键决策因素：${relationshipAnalysis.keyDecisionFactors?.join(', ')}

请返回优化后的完整邮件（JSON格式）：
{
  "subject": "优化的主题行",
  "body": "完整的邮件正文（HTML格式）",
  "plainTextBody": "纯文本版本",
  "personalizationScore": 1-100,
  "optimizationChanges": [
    {
      "change": "修改内容",
      "reason": "修改原因",
      "expectedImpact": "预期影响"
    }
  ],
  "keyStrengths": ["邮件的主要优势"],
  "potentialConcerns": ["潜在的担忧"],
  "followUpSuggestions": ["后续跟进建议"]
}

优化要求：
1. 提高个性化程度
2. 增强说服力
3. 优化可读性
4. 强化价值主张
5. 确保专业性
`;

    try {
      const response = await this.callOllama(prompt);
      const optimized = this.parseOllamaResponse(response);
      console.log(`✅ 邮件优化完成 (个性化评分: ${optimized.personalizationScore || 'N/A'})`);
      return optimized;
    } catch (error) {
      console.error('邮件优化失败:', error.message);
      return this.formatBasicEmail(emailContent);
    }
  }

  // 调用Ollama模型
  async callOllama(prompt) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.4, // 稍微降低创造性，提高一致性
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      }, {
        timeout: 0 // No timeout - let AI take its time
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Ollama调用失败:', error.message);
      throw new Error(`Ollama模型调用失败: ${error.message}`);
    }
  }

  // 解析Ollama响应
  parseOllamaResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.log('无法解析JSON响应，尝试文本解析');
      return this.parseTextResponse(response);
    } catch (error) {
      console.log('响应解析失败:', error.message);
      throw new Error(`AI响应解析失败: ${error.message}`);
    }
  }

  // 解析文本响应
  parseTextResponse(text) {
    return {
      parsed: false,
      rawText: text,
      fallbackUsed: true
    };
  }

  // 基础关系分析（降级方案）
  getBasicRelationshipAnalysis(sourceAnalysis, prospect) {
    return {
      relationshipType: 'complementary',
      valueProposition: `${sourceAnalysis.companyName} can enhance ${prospect.company}'s operations`,
      successProbability: 60,
      recommendedApproach: 'professional business development',
      keyDecisionFactors: ['ROI', 'implementation ease', 'support quality']
    };
  }

  // 基础邮件策略（降级方案）
  getBasicEmailStrategy(campaignObjective) {
    return {
      emailObjective: campaignObjective,
      tone: 'professional',
      callToAction: {
        type: 'meeting',
        text: 'Schedule a brief discussion',
        urgency: 'medium'
      }
    };
  }

  // 格式化基础邮件
  formatBasicEmail(content) {
    return {
      subject: content.subject || 'Business Partnership Opportunity',
      body: this.buildEmailHTML(content),
      plainTextBody: this.buildPlainText(content),
      personalizationScore: 70
    };
  }

  // 构建HTML邮件
  buildEmailHTML(content) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        ${content.greeting ? `<p>${content.greeting}</p>` : ''}
        ${content.opening ? `<p>${content.opening}</p>` : ''}
        ${content.bodyParagraphs ? content.bodyParagraphs.map(p => `<p>${p}</p>`).join('') : ''}
        ${content.callToAction ? `<p><strong>${content.callToAction}</strong></p>` : ''}
        ${content.closing ? `<p>${content.closing}</p>` : ''}
      </div>
    `;
  }

  // 构建纯文本
  buildPlainText(content) {
    const parts = [];
    if (content.greeting) parts.push(content.greeting);
    if (content.opening) parts.push(content.opening);
    if (content.bodyParagraphs) parts.push(...content.bodyParagraphs);
    if (content.callToAction) parts.push(content.callToAction);
    if (content.closing) parts.push(content.closing);
    return parts.join('\n\n');
  }

  // 获取生成统计
  getGenerationStats() {
    return {
      totalGenerated: this.generatedCount,
      cacheSize: this.generationCache.size,
      lastGenerated: new Date().toISOString()
    };
  }
}

module.exports = AIEmailContentGenerator;