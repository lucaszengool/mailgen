const axios = require('axios');
const ContentStateManager = require('../services/ContentStateManager');

class ImprovedMarketingStrategy {
  constructor() {
    this.contentStateManager = new ContentStateManager();
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    
    // 搜索引擎模拟 - 用于生成准确的搜索关键词
    this.searchPatterns = {
      tob: {
        prefixes: ['best', 'top', 'enterprise', 'business', 'commercial', 'professional'],
        suffixes: ['software', 'solutions', 'platform', 'system', 'service', 'provider'],
        intents: ['for business', 'for companies', 'for enterprise', 'B2B']
      },
      toc: {
        prefixes: ['best', 'top', 'free', 'cheap', 'easy', 'simple'],
        suffixes: ['app', 'tool', 'online', 'website', 'service'],
        intents: ['for me', 'personal use', 'reviews', 'how to use']
      }
    };
  }

  // 改进的网站分析方法
  async analyzeWebsiteContent(website) {
    console.log(`🔍 深度分析网站: ${website}`);
    
    // 初始化网站会话，防止内容混淆
    const sessionId = this.contentStateManager.initializeWebsiteSession(website, {});
    
    try {
      // 使用ScrapingDog API获取网站内容
      const scrapingDogKey = process.env.SCRAPINGDOG_API_KEY || '689e1eadbec7a9c318cc34e9';
      const apiUrl = `https://api.scrapingdog.com/scrape?api_key=${scrapingDogKey}&url=${encodeURIComponent(website)}&dynamic=false`;
      
      const response = await axios.get(apiUrl, { timeout: 15000 });
      const htmlContent = response.data;
      
      // 提取关键信息
      const analysis = this.extractWebsiteInfo(htmlContent, website);
      
      // 保存分析结果到状态管理器
      this.contentStateManager.saveGeneratedContent('website_analysis', analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('网站分析失败:', error.message);
      return this.getFallbackAnalysis(website);
    }
  }

  // 从HTML中提取关键信息
  extractWebsiteInfo(html, website) {
    const info = {
      website,
      title: '',
      description: '',
      keywords: [],
      headings: [],
      productFeatures: [],
      targetAudience: null,
      businessType: null
    };
    
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      info.title = titleMatch[1].trim();
    }
    
    // 提取meta描述
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (metaDescMatch) {
      info.description = metaDescMatch[1].trim();
    }
    
    // 提取meta关键词
    const metaKeywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    if (metaKeywordsMatch) {
      info.keywords = metaKeywordsMatch[1].split(',').map(k => k.trim());
    }
    
    // 提取所有标题
    const headingMatches = html.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
    for (const match of headingMatches) {
      const heading = match[1].replace(/<[^>]+>/g, '').trim();
      if (heading && heading.length > 3) {
        info.headings.push(heading);
      }
    }
    
    // 智能判断业务类型
    const contentLower = html.toLowerCase();
    info.businessType = this.detectBusinessType(contentLower, info);
    
    // 提取产品特性
    info.productFeatures = this.extractProductFeatures(html, info.headings);
    
    // 确定目标受众
    info.targetAudience = this.identifyTargetAudience(contentLower, info.businessType);
    
    return info;
  }

  // 检测业务类型
  detectBusinessType(content, info) {
    const b2bSignals = [
      'enterprise', 'business', 'corporate', 'b2b', 'saas',
      'api', 'integration', 'workflow', 'team', 'organization',
      'pricing plan', 'contact sales', 'request demo', 'white paper'
    ];
    
    const b2cSignals = [
      'download app', 'free trial', 'personal', 'individual',
      'consumer', 'user-friendly', 'easy to use', 'for everyone',
      'app store', 'google play', 'sign up free', 'start for free'
    ];
    
    let b2bScore = 0;
    let b2cScore = 0;
    
    for (const signal of b2bSignals) {
      if (content.includes(signal)) b2bScore++;
    }
    
    for (const signal of b2cSignals) {
      if (content.includes(signal)) b2cScore++;
    }
    
    // 检查标题和描述
    const titleAndDesc = (info.title + ' ' + info.description).toLowerCase();
    if (titleAndDesc.includes('ai') && titleAndDesc.includes('app')) {
      b2cScore += 2; // AI应用通常面向消费者
    }
    
    return b2bScore > b2cScore ? 'tob' : 'toc';
  }

  // 提取产品特性
  extractProductFeatures(html, headings) {
    const features = [];
    
    // 查找特性列表
    const listMatches = html.matchAll(/<li[^>]*>([^<]+)<\/li>/gi);
    for (const match of listMatches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 10 && text.length < 100) {
        // 检查是否包含特性相关词汇
        const featureKeywords = ['feature', 'benefit', 'advantage', 'capability', 'function'];
        const textLower = text.toLowerCase();
        
        for (const keyword of featureKeywords) {
          if (textLower.includes(keyword) || headings.some(h => h.toLowerCase().includes(keyword))) {
            features.push(text);
            break;
          }
        }
      }
    }
    
    // 限制特性数量
    return features.slice(0, 10);
  }

  // 识别目标受众
  identifyTargetAudience(content, businessType) {
    if (businessType === 'tob') {
      return {
        primary: ['business owners', 'managers', 'decision makers'],
        secondary: ['IT professionals', 'operations teams', 'executives']
      };
    } else {
      // 基于内容细分B2C受众
      const audiences = [];
      
      if (content.includes('student') || content.includes('education')) {
        audiences.push('students');
      }
      if (content.includes('professional') || content.includes('career')) {
        audiences.push('professionals');
      }
      if (content.includes('family') || content.includes('parent')) {
        audiences.push('families');
      }
      if (content.includes('health') || content.includes('fitness')) {
        audiences.push('health-conscious individuals');
      }
      
      // 默认受众
      if (audiences.length === 0) {
        audiences.push('general consumers', 'everyday users');
      }
      
      return {
        primary: audiences.slice(0, 3),
        secondary: ['tech-savvy users', 'early adopters']
      };
    }
  }

  // 生成准确的搜索关键词
  generateAccurateKeywords(websiteAnalysis, businessType) {
    console.log('🔍 生成精准搜索关键词...');
    
    const keywords = new Set();
    const { title, description, keywords: metaKeywords, productFeatures } = websiteAnalysis;
    
    // 1. 基于产品名称生成关键词
    if (title) {
      // 提取产品名称
      const productName = title.split('-')[0].trim();
      keywords.add(productName.toLowerCase());
      
      // 添加产品类型组合
      if (businessType === 'toc') {
        keywords.add(`${productName} app`);
        keywords.add(`${productName} review`);
        keywords.add(`${productName} alternative`);
      } else {
        keywords.add(`${productName} software`);
        keywords.add(`${productName} platform`);
        keywords.add(`${productName} solution`);
      }
    }
    
    // 2. 基于功能生成关键词
    const coreFunction = this.extractCoreFunction(description, productFeatures);
    if (coreFunction) {
      keywords.add(coreFunction);
      
      // 添加搜索意图
      const patterns = this.searchPatterns[businessType];
      patterns.prefixes.forEach(prefix => {
        keywords.add(`${prefix} ${coreFunction}`);
      });
    }
    
    // 3. 基于行业生成关键词
    const industry = this.detectIndustry(websiteAnalysis);
    if (industry) {
      keywords.add(industry);
      keywords.add(`${industry} software`);
      keywords.add(`${industry} tools`);
    }
    
    // 4. 添加长尾关键词
    this.addLongTailKeywords(keywords, websiteAnalysis, businessType);
    
    // 转换为数组并限制数量
    return Array.from(keywords).slice(0, 15);
  }

  // 提取核心功能
  extractCoreFunction(description, features) {
    // 常见功能词汇映射
    const functionMap = {
      'ai': 'artificial intelligence',
      'ml': 'machine learning',
      'crm': 'customer relationship',
      'erp': 'enterprise resource',
      'analytics': 'data analysis',
      'automation': 'process automation',
      'payment': 'payment processing',
      'email': 'email marketing',
      'social': 'social media',
      'inventory': 'inventory management'
    };
    
    const text = (description + ' ' + features.join(' ')).toLowerCase();
    
    for (const [key, value] of Object.entries(functionMap)) {
      if (text.includes(key)) {
        return value;
      }
    }
    
    // 提取动词短语作为功能
    const actionWords = text.match(/\b(manage|track|analyze|optimize|automate|monitor|create|build|design)\s+\w+/gi);
    if (actionWords && actionWords.length > 0) {
      return actionWords[0].toLowerCase();
    }
    
    return null;
  }

  // 检测行业
  detectIndustry(analysis) {
    const industries = {
      'ecommerce': ['shop', 'store', 'product', 'cart', 'checkout'],
      'healthcare': ['health', 'medical', 'patient', 'clinic', 'doctor'],
      'finance': ['payment', 'banking', 'investment', 'financial', 'money'],
      'education': ['learn', 'course', 'student', 'teacher', 'education'],
      'marketing': ['marketing', 'campaign', 'advertising', 'promotion', 'seo'],
      'technology': ['software', 'app', 'platform', 'digital', 'tech'],
      'food': ['food', 'restaurant', 'recipe', 'meal', 'dining'],
      'travel': ['travel', 'hotel', 'flight', 'booking', 'vacation']
    };
    
    const content = JSON.stringify(analysis).toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industries)) {
      const matchCount = keywords.filter(kw => content.includes(kw)).length;
      if (matchCount >= 2) {
        return industry;
      }
    }
    
    return 'general';
  }

  // 添加长尾关键词
  addLongTailKeywords(keywords, analysis, businessType) {
    const { title, targetAudience } = analysis;
    
    if (businessType === 'toc') {
      // B2C长尾关键词
      keywords.add('how to use ' + title.toLowerCase());
      keywords.add(title.toLowerCase() + ' vs competitors');
      keywords.add('is ' + title.toLowerCase() + ' worth it');
      
      if (targetAudience && targetAudience.primary) {
        targetAudience.primary.forEach(audience => {
          keywords.add(title.toLowerCase() + ' for ' + audience);
        });
      }
    } else {
      // B2B长尾关键词
      keywords.add(title.toLowerCase() + ' pricing');
      keywords.add(title.toLowerCase() + ' features');
      keywords.add(title.toLowerCase() + ' integration');
      keywords.add('implement ' + title.toLowerCase());
    }
  }

  // 生成改进的营销策略
  async generateImprovedStrategy(website, campaignGoal, businessType = 'auto') {
    console.log('🚀 生成改进的营销策略...');
    
    // 分析网站
    const websiteAnalysis = await this.analyzeWebsiteContent(website);
    
    // 确定实际业务类型
    const actualBusinessType = businessType === 'auto' ? 
      websiteAnalysis.businessType : businessType;
    
    // 生成准确的关键词
    const accurateKeywords = this.generateAccurateKeywords(websiteAnalysis, actualBusinessType);
    
    // 构建策略
    const strategy = {
      website,
      sessionId: this.contentStateManager.sessionId,
      businessUnderstanding: {
        coreProduct: websiteAnalysis.title,
        description: websiteAnalysis.description,
        features: websiteAnalysis.productFeatures,
        industry: this.detectIndustry(websiteAnalysis)
      },
      targetAudience: {
        type: actualBusinessType,
        primarySegments: websiteAnalysis.targetAudience?.primary || [],
        secondarySegments: websiteAnalysis.targetAudience?.secondary || [],
        searchKeywords: accurateKeywords,
        painPoints: this.generatePainPoints(websiteAnalysis, actualBusinessType)
      },
      messagingFramework: {
        valueProposition: this.generateValueProposition(websiteAnalysis),
        tone: actualBusinessType === 'tob' ? 'professional' : 'friendly',
        keyMessages: this.generateKeyMessages(websiteAnalysis, campaignGoal)
      },
      campaignObjective: campaignGoal,
      timestamp: new Date().toISOString()
    };
    
    // 保存策略到状态管理器
    this.contentStateManager.saveGeneratedContent('marketing_strategy', strategy);
    
    return strategy;
  }

  // 生成痛点
  generatePainPoints(analysis, businessType) {
    const painPoints = [];
    
    if (businessType === 'tob') {
      painPoints.push(
        'Inefficient manual processes',
        'Lack of data visibility',
        'High operational costs',
        'Difficulty scaling operations'
      );
    } else {
      painPoints.push(
        'Time-consuming tasks',
        'Complexity of existing solutions',
        'High costs of alternatives',
        'Lack of user-friendly options'
      );
    }
    
    // 基于产品特性添加特定痛点
    if (analysis.productFeatures.some(f => f.toLowerCase().includes('automat'))) {
      painPoints.push('Manual repetitive tasks');
    }
    if (analysis.productFeatures.some(f => f.toLowerCase().includes('analyz'))) {
      painPoints.push('Lack of insights from data');
    }
    
    return painPoints.slice(0, 4);
  }

  // 生成价值主张
  generateValueProposition(analysis) {
    const { title, description, productFeatures } = analysis;
    
    // 提取关键价值点
    const values = [];
    
    if (productFeatures.length > 0) {
      values.push(`${title} offers ${productFeatures[0].toLowerCase()}`);
    }
    
    if (description) {
      values.push(description.substring(0, 100));
    }
    
    return values.join('. ') || `${title} - Innovative solution for modern challenges`;
  }

  // 生成关键信息
  generateKeyMessages(analysis, campaignGoal) {
    const messages = [];
    
    switch (campaignGoal.toLowerCase()) {
      case 'promote product':
        messages.push('Discover the benefits of ' + analysis.title);
        messages.push('Transform your workflow with our solution');
        break;
      case 'generate leads':
        messages.push('Join thousands of satisfied users');
        messages.push('Start your free trial today');
        break;
      case 'increase awareness':
        messages.push('Learn about ' + analysis.title);
        messages.push('See why we\'re the preferred choice');
        break;
      default:
        messages.push('Experience the difference');
        messages.push('Achieve more with less effort');
    }
    
    return messages;
  }

  // 获取备用分析（当API失败时）
  getFallbackAnalysis(website) {
    return {
      website,
      title: 'Unknown Product',
      description: 'Product information unavailable',
      keywords: [],
      headings: [],
      productFeatures: [],
      targetAudience: {
        primary: ['general users'],
        secondary: []
      },
      businessType: 'toc'
    };
  }
}

module.exports = ImprovedMarketingStrategy;