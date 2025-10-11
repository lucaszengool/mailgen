const axios = require('axios');

class UltraFastMarketingAgent {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    // 使用最快的模型
    this.model = 'qwen2.5:0.5b'; // 超小模型，极速响应
    this.fallbackStrategies = this.loadFallbackStrategies();
  }

  async generateMarketingStrategy(targetWebsite, campaignGoal, businessAnalysis, businessType = 'auto') {
    console.log('⚡ 使用超快速Ollama生成营销策略');
    
    // 立即返回一个基础策略，同时异步优化
    const quickStrategy = this.generateInstantStrategy(businessAnalysis, businessType);
    
    // 异步尝试Ollama优化（不等待）
    this.tryOllamaOptimization(quickStrategy, businessAnalysis, targetWebsite, campaignGoal).catch(err => {
      console.log('⚠️ Ollama优化失败，使用快速策略:', err.message);
    });
    
    return quickStrategy;
  }

  generateInstantStrategy(businessAnalysis, businessType) {
    console.log('⚡ 生成即时策略（0延迟）');
    
    const industry = businessAnalysis?.industry || 'technology';
    const companyName = businessAnalysis?.companyName || 'Company';
    const domain = businessAnalysis?.domain || 'example.com';
    
    // 基于行业的即时策略
    const strategyTemplates = {
      'AI': {
        keywords: ['AI startup', 'machine learning', 'artificial intelligence', 'deep learning'],
        segments: ['tech companies', 'startups', 'enterprises'],
        painPoints: ['automation needs', 'data insights', 'efficiency']
      },
      'fintech': {
        keywords: ['fintech', 'financial services', 'banking', 'payments'],
        segments: ['financial institutions', 'banks', 'payment companies'],
        painPoints: ['compliance', 'security', 'transaction speed']
      },
      'marketing': {
        keywords: ['marketing', 'advertising', 'digital marketing', 'growth'],
        segments: ['businesses', 'agencies', 'brands'],
        painPoints: ['customer acquisition', 'ROI', 'campaign management']
      },
      'default': {
        keywords: [industry, 'business', 'company', 'startup'],
        segments: ['businesses', 'companies', 'organizations'],
        painPoints: ['efficiency', 'growth', 'cost reduction']
      }
    };

    // 选择模板
    let template = strategyTemplates.default;
    for (const [key, value] of Object.entries(strategyTemplates)) {
      if (industry.toLowerCase().includes(key.toLowerCase())) {
        template = value;
        break;
      }
    }

    return {
      company_name: companyName,
      domain: domain,
      website: businessAnalysis?.website || `https://${domain}`,
      description: businessAnalysis?.valueProposition || businessAnalysis?.description || 'Business solution',
      target_audience: {
        type: businessType === 'tob' ? 'tob' : 'toc',
        primary_segments: template.segments,
        search_keywords: {
          primary_keywords: template.keywords.slice(0, 2),
          industry_keywords: [industry, `${industry} companies`],
          solution_keywords: [`${industry} solutions`, `${industry} services`],
          technology_keywords: ['technology', 'software'],
          audience_keywords: ['email', 'contact', 'CEO', 'founder']
        },
        pain_points: template.painPoints
      },
      web_search_queries: this.generateQuickSearchQueries(industry, template.keywords),
      generation_method: 'ultra_fast_template',
      generated_at: new Date().toISOString()
    };
  }

  generateQuickSearchQueries(industry, keywords) {
    return [
      `site:linkedin.com "${industry}" email "@gmail.com" OR "@hotmail.com"`,
      `"${keywords[0]}" contact email "@"`,
      `"${industry}" founder CEO email`,
      `site:crunchbase.com "${industry}" email`,
      `"${keywords[1]}" business email contact`
    ];
  }

  async tryOllamaOptimization(baseStrategy, businessAnalysis, targetWebsite, campaignGoal) {
    try {
      console.log('🔄 异步尝试Ollama优化策略...');
      
      const prompt = `优化营销策略(快速JSON):
公司:${businessAnalysis.companyName}
行业:${businessAnalysis.industry}
返回JSON:
{
  "search_keywords": ["keyword1", "keyword2", "keyword3"],
  "pain_points": ["pain1", "pain2"]
}`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.3, // 低温度，更确定性
          num_predict: 100, // 极少的token，超快速
          num_ctx: 512, // 小上下文
          top_k: 10,
          top_p: 0.5,
          repeat_penalty: 1.0
        }
      }, {
        timeout: 5000, // 5秒快速超时
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.response) {
        console.log('✅ Ollama优化完成');
        // 可以存储优化结果供下次使用
        this.cacheOptimization(businessAnalysis.companyName, response.data.response);
      }
    } catch (error) {
      // 静默失败，不影响主流程
      console.log('⚠️ Ollama优化跳过:', error.message.substring(0, 50));
    }
  }

  cacheOptimization(companyName, optimization) {
    // 简单的内存缓存
    if (!this.optimizationCache) {
      this.optimizationCache = new Map();
    }
    this.optimizationCache.set(companyName, {
      data: optimization,
      timestamp: Date.now()
    });
  }

  loadFallbackStrategies() {
    return {
      'technology': {
        keywords: ['tech startup', 'software company', 'technology firm'],
        segments: ['enterprises', 'startups', 'SMBs']
      },
      'finance': {
        keywords: ['fintech', 'financial services', 'banking'],
        segments: ['banks', 'financial institutions', 'investment firms']
      },
      'healthcare': {
        keywords: ['healthtech', 'medical', 'healthcare'],
        segments: ['hospitals', 'clinics', 'health organizations']
      }
    };
  }

  // 极速版本 - 直接返回预定义策略
  getInstantStrategy(industry = 'technology') {
    console.log('⚡⚡ 返回预定义极速策略（0ms）');
    
    return {
      company_name: 'Target Company',
      domain: 'target.com',
      website: 'https://target.com',
      description: 'Business solution',
      target_audience: {
        type: 'toc',
        primary_segments: ['businesses', 'consumers', 'professionals'],
        search_keywords: {
          primary_keywords: [industry, 'email', 'contact'],
          industry_keywords: [`${industry} companies`, `${industry} startups`],
          solution_keywords: ['solutions', 'services'],
          technology_keywords: ['technology', 'software'],
          audience_keywords: ['CEO', 'founder', 'manager']
        },
        pain_points: ['efficiency', 'cost', 'growth']
      },
      web_search_queries: [
        `"${industry}" email contact`,
        `site:linkedin.com "${industry}" "@gmail.com"`,
        `"${industry}" founder email`
      ],
      generation_method: 'instant_predefined'
    };
  }
}

module.exports = UltraFastMarketingAgent;