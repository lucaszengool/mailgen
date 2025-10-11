const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

/**
 * Local AI-Powered Search Engine
 * 基于Ollama的本地化搜索引擎，无需外部API
 * 集成智能爬虫和AI分析功能
 */
class LocalAISearchEngine {
  constructor() {
    this.ollamaBaseUrl = 'http://localhost:11434/api';
    this.searchIndex = new Map(); // 本地搜索索引
    this.targetSources = {
      // B2B潜在客户来源
      businessDirectories: [
        'https://www.crunchbase.com',
        'https://www.apollo.io',
        'https://www.zoominfo.com',
        'https://www.salesforce.com/resources/customer-success-stories/',
        'https://www.hubspot.com/customer-success-stories'
      ],
      
      // 行业特定网站
      industryWebsites: {
        'technology': [
          'https://techcrunch.com/startups/',
          'https://www.producthunt.com',
          'https://angel.co',
          'https://www.ycombinator.com/companies'
        ],
        'healthcare': [
          'https://www.modernhealthcare.com',
          'https://www.healthtechmagazine.net'
        ],
        'finance': [
          'https://www.fintech.finance',
          'https://www.americanbanker.com'
        ]
      },
      
      // 社交媒体和专业网络
      socialPlatforms: [
        'https://www.linkedin.com/company/',
        'https://twitter.com/',
        'https://github.com/'
      ]
    };
    
    // 智能搜索模式
    this.searchModes = {
      'email_hunting': {
        description: '专门搜索邮箱地址和联系方式',
        patterns: [
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          /contact\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
          /email\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
        ]
      },
      'company_discovery': {
        description: '发现新公司和业务机会',
        keywords: ['startup', 'company', 'business', 'enterprise', 'corporation']
      },
      'contact_extraction': {
        description: '提取关键决策者信息',
        roles: ['CEO', 'CTO', 'CMO', 'VP', 'Director', 'Manager', 'Founder']
      }
    };
  }

  /**
   * 主搜索方法：智能潜在客户发现
   */
  async searchProspects(query, options = {}) {
    console.log(`🔍 本地AI搜索引擎启动: ${query}`);
    
    const {
      industry = 'technology',
      targetAudience = 'B2B',
      maxResults = 50,
      searchDepth = 'medium'
    } = options;

    try {
      // 1. 使用Ollama生成智能搜索策略
      const searchStrategy = await this.generateSearchStrategy(query, industry, targetAudience);
      console.log(`🧠 AI生成搜索策略: ${searchStrategy.approach}`);

      // 2. 执行多源并行搜索
      const searchResults = await this.executeMultiSourceSearch(searchStrategy);
      
      // 3. 使用AI分析和过滤结果
      const analyzedResults = await this.analyzeResultsWithAI(searchResults, query);
      
      // 4. 提取联系信息
      const prospects = await this.extractContactInformation(analyzedResults);
      
      // 5. AI增强和验证
      const enhancedProspects = await this.enhanceProspectsWithAI(prospects);
      
      console.log(`✅ 本地AI搜索完成，发现 ${enhancedProspects.length} 个潜在客户`);
      
      return {
        success: true,
        prospects: enhancedProspects,
        searchStrategy,
        totalProcessed: searchResults.length,
        source: 'local_ai_search_engine'
      };

    } catch (error) {
      console.error('❌ 本地AI搜索失败:', error.message);
      return {
        success: false,
        prospects: [],
        error: error.message,
        source: 'local_ai_search_engine'
      };
    }
  }

  /**
   * 使用Ollama生成智能搜索策略
   */
  async generateSearchStrategy(query, industry, targetAudience) {
    // 首先尝试使用AI生成策略，如果失败则使用智能默认策略
    try {
      const prompt = `You are a search strategy expert. Create a JSON strategy for finding business contacts.

Query: ${query}
Industry: ${industry}  
Audience: ${targetAudience}

Return ONLY valid JSON with no extra text:
{
  "keywords": ["business", "company", "contact", "enterprise", "service"],
  "websiteTypes": ["directory", "industry", "professional"],
  "approach": "Strategic search approach description",
  "expectedContacts": ["Business Manager", "Sales Representative"]
}`;

      const response = await this.callOllama(prompt, 'qwen2.5:0.5b');
      return this.parseAIResponse(response.response);
    } catch (error) {
      console.warn('AI策略生成失败，使用智能默认策略');
      return this.getIntelligentDefaultStrategy(query, industry, targetAudience);
    }
  }

  /**
   * 执行多源搜索
   */
  async executeMultiSourceSearch(strategy) {
    console.log(`🌐 执行多源搜索，关键词: ${strategy.keywords.join(', ')}`);
    
    const allResults = [];
    
    // 并行搜索多个来源
    const searchPromises = [];
    
    // 1. 模拟搜索引擎结果（使用预定义的高质量网站）
    for (const keyword of strategy.keywords.slice(0, 3)) { // 限制关键词数量
      searchPromises.push(this.simulateSearchEngineResults(keyword));
    }
    
    // 2. 直接爬取行业相关网站
    if (strategy.websiteTypes.includes('industry')) {
      searchPromises.push(this.scrapeIndustryWebsites(strategy.keywords));
    }
    
    // 3. 爬取商业目录
    if (strategy.websiteTypes.includes('directory')) {
      searchPromises.push(this.scrapeBusinessDirectories(strategy.keywords));
    }

    try {
      const results = await Promise.all(searchPromises);
      return results.flat();
    } catch (error) {
      console.error('多源搜索部分失败:', error.message);
      return allResults; // 返回已有结果
    }
  }

  /**
   * 模拟搜索引擎结果（高质量预定义网站）
   */
  async simulateSearchEngineResults(keyword) {
    console.log(`🎯 模拟搜索: ${keyword}`);
    
    // 基于关键词生成高质量的目标网站
    const targetUrls = this.generateTargetUrls(keyword);
    const results = [];
    
    for (const url of targetUrls.slice(0, 5)) { // 限制每个关键词的结果数量
      try {
        const content = await this.scrapeWebsite(url);
        if (content) {
          results.push({
            url,
            content,
            keyword,
            source: 'simulated_search'
          });
        }
      } catch (error) {
        console.warn(`爬取失败 ${url}:`, error.message);
      }
    }
    
    return results;
  }

  /**
   * 生成目标URL（基于行业和关键词）
   */
  generateTargetUrls(keyword) {
    // 为不同关键词生成相关的高质量网站
    const urlTemplates = {
      'AI': [
        'https://techcrunch.com/category/artificial-intelligence/',
        'https://www.kaggle.com/competitions',
        'https://github.com/trending' // 移除可能403的网站
      ],
      'SaaS': [
        'https://www.producthunt.com',
        'https://techcrunch.com/startups/',
        'https://github.com/topics/saas'
      ],
      'startup': [
        'https://techcrunch.com/startups/',
        'https://www.producthunt.com',
        'https://github.com/trending'
      ],
      'technology': [
        'https://techcrunch.com/startups/',
        'https://www.producthunt.com',
        'https://github.com/trending'
      ],
      'software': [
        'https://github.com/trending',
        'https://www.producthunt.com',
        'https://techcrunch.com/category/apps/'
      ],
      'business': [
        'https://techcrunch.com/startups/',
        'https://www.producthunt.com/topics/productivity',
        'https://github.com/topics/business'
      ]
    };
    
    // 基于关键词匹配URL
    for (const [key, urls] of Object.entries(urlTemplates)) {
      if (keyword.toLowerCase().includes(key.toLowerCase())) {
        return urls;
      }
    }
    
    // 默认返回可访问的通用网站
    return [
      'https://techcrunch.com/startups/',
      'https://www.producthunt.com',
      'https://github.com/trending'
    ];
  }

  /**
   * 爬取网站内容
   */
  async scrapeWebsite(url) {
    try {
      console.log(`🕷️ 爬取网站: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      
      // 提取有用信息
      return {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        headings: $('h1, h2, h3').map((i, el) => $(el).text().trim()).get().slice(0, 10),
        text: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000),
        links: $('a[href]').map((i, el) => $(el).attr('href')).get().slice(0, 20),
        emails: this.extractEmailsFromText($('body').text()),
        rawHtml: response.data.substring(0, 10000) // 限制大小
      };
    } catch (error) {
      console.warn(`网站爬取失败 ${url}:`, error.message);
      return null;
    }
  }

  /**
   * 从文本中提取邮箱
   */
  extractEmailsFromText(text) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailPattern) || [];
    
    // 过滤掉明显的垃圾邮箱，但保留真实的个人邮箱（B2C需要）
    return matches.filter(email => {
      const emailLower = email.toLowerCase();
      // 排除测试邮箱和占位符
      const invalidPatterns = ['example', 'test', 'placeholder', 'dummy', 'noreply', 'no-reply'];
      const hasInvalidPattern = invalidPatterns.some(pattern => emailLower.includes(pattern));
      
      // 排除过短或无效的邮箱
      const isValidFormat = email.length >= 5 && email.includes('.') && !email.startsWith('@') && !email.endsWith('@');
      
      return !hasInvalidPattern && isValidFormat;
    });
  }

  /**
   * 使用AI分析搜索结果
   */
  async analyzeResultsWithAI(results, originalQuery) {
    console.log(`🤖 AI分析 ${results.length} 个搜索结果`);
    
    const relevantResults = [];
    
    for (const result of results) {
      try {
        // 首先尝试AI分析
        const analysisPrompt = `Analyze website relevance for business contacts.

Query: ${originalQuery}
Title: ${result.content?.title || 'Unknown'}
Description: ${result.content?.description || 'None'}  
Content: ${result.content?.text?.substring(0, 500) || 'No content'}

Return ONLY valid JSON:
{
  "relevanceScore": 7,
  "hasBusinessContacts": true,
  "businessValue": "medium",
  "recommendedAction": "extract_contacts",
  "reasoning": "Website shows business activity"
}`;

        const analysis = await this.callOllama(analysisPrompt, 'qwen2.5:0.5b');
        const parsed = this.parseAIResponse(analysis.response);
        
        if (parsed.relevanceScore >= 6 && parsed.businessValue !== 'low') {
          relevantResults.push({
            ...result,
            aiAnalysis: parsed
          });
        }
      } catch (error) {
        // AI分析失败，使用智能基础规则分析
        console.log(`⚠️ AI分析失败，使用智能规则分析: ${error.message}`);
        const ruleBasedAnalysis = this.analyzeWithRules(result, originalQuery);
        if (ruleBasedAnalysis.isRelevant) {
          relevantResults.push({
            ...result,
            aiAnalysis: ruleBasedAnalysis
          });
        }
      }
    }
    
    console.log(`✅ AI分析完成，${relevantResults.length}/${results.length} 个结果通过筛选`);
    return relevantResults;
  }

  /**
   * 基于规则的智能分析（AI后备方案）
   */
  analyzeWithRules(result, originalQuery) {
    const content = result.content;
    if (!content) {
      return { isRelevant: false, relevanceScore: 0 };
    }
    
    const queryKeywords = originalQuery.toLowerCase().split(' ').filter(w => w.length > 2);
    const text = (content.text || '').toLowerCase();
    const title = (content.title || '').toLowerCase();
    const description = (content.description || '').toLowerCase();
    const allText = `${text} ${title} ${description}`;
    
    let relevanceScore = 0;
    
    // 关键词匹配评分
    for (const keyword of queryKeywords) {
      if (title.includes(keyword)) relevanceScore += 3;
      if (description.includes(keyword)) relevanceScore += 2;
      if (text.includes(keyword)) relevanceScore += 1;
    }
    
    // 商业指标评分
    const businessKeywords = [
      'company', 'business', 'enterprise', 'corporation', 'startup',
      'CEO', 'founder', 'contact', 'about us', 'team', 'leadership',
      'services', 'solutions', 'products', 'customers', 'clients'
    ];
    
    const businessScore = businessKeywords.reduce((score, keyword) => {
      return score + (allText.includes(keyword) ? 1 : 0);
    }, 0);
    
    relevanceScore += businessScore;
    
    // 联系信息评分
    const hasEmails = content.emails?.length > 0;
    if (hasEmails) relevanceScore += 5;
    
    // 网站质量评分
    if (result.url) {
      const url = result.url.toLowerCase();
      if (url.includes('github.com') || url.includes('techcrunch.com') || url.includes('producthunt.com')) {
        relevanceScore += 2; // 高质量网站加分
      }
    }
    
    const isRelevant = relevanceScore >= 6;
    const businessValue = relevanceScore >= 10 ? 'high' : relevanceScore >= 6 ? 'medium' : 'low';
    
    return {
      isRelevant,
      relevanceScore: Math.min(10, relevanceScore),
      hasBusinessContacts: hasEmails,
      businessValue,
      recommendedAction: hasEmails ? 'extract_contacts' : 'analyze_deeper',
      reasoning: `基于规则分析: 关键词匹配+商业指标+联系信息，总分${relevanceScore}`
    };
  }

  /**
   * 基础商业指标检测
   */
  hasBusinessIndicators(content) {
    if (!content || !content.text) return false;
    
    const businessKeywords = [
      'company', 'business', 'enterprise', 'corporation', 'startup',
      'CEO', 'founder', 'contact', 'about us', 'team', 'leadership'
    ];
    
    const text = content.text.toLowerCase();
    return businessKeywords.some(keyword => text.includes(keyword)) ||
           content.emails?.length > 0;
  }

  /**
   * 提取联系信息
   */
  async extractContactInformation(results) {
    console.log(`📧 从 ${results.length} 个结果中提取联系信息`);
    
    const prospects = [];
    
    for (const result of results) {
      try {
        // 提取邮箱
        const emails = result.content?.emails || [];
        
        // 为每个邮箱创建潜在客户
        for (const email of emails) {
          const prospect = {
            id: this.generateId(),
            email: email,
            name: this.inferNameFromEmail(email),
            company: this.extractCompanyFromContent(result.content),
            website: result.url,
            source: 'local_ai_search',
            industry: this.inferIndustryFromContent(result.content),
            role: this.inferRoleFromEmail(email),
            confidence: result.aiAnalysis?.relevanceScore || 5,
            rawData: {
              title: result.content?.title,
              description: result.content?.description,
              keyword: result.keyword
            },
            createdAt: new Date().toISOString()
          };
          
          prospects.push(prospect);
        }
        
        // 如果没有邮箱，尝试生成潜在邮箱
        if (emails.length === 0 && result.content?.title) {
          const syntheticProspect = this.generateSyntheticProspect(result);
          if (syntheticProspect) {
            prospects.push(syntheticProspect);
          }
        }
        
      } catch (error) {
        console.warn('联系信息提取失败:', error.message);
      }
    }
    
    return prospects;
  }

  /**
   * 生成合成潜在客户（基于网站分析）
   */
  generateSyntheticProspect(result) {
    const content = result.content;
    if (!content || !content.title) return null;
    
    try {
      const url = new URL(result.url);
      const domain = url.hostname.replace('www.', '');
      const companyName = this.extractCompanyFromContent(content);
      
      // 生成可能的邮箱地址
      const possibleEmails = [
        `info@${domain}`,
        `contact@${domain}`,
        `hello@${domain}`,
        `sales@${domain}`
      ];
      
      return {
        id: this.generateId(),
        email: possibleEmails[0],
        name: 'Business Contact',
        company: companyName,
        website: result.url,
        source: 'local_ai_search_synthetic',
        industry: this.inferIndustryFromContent(content),
        role: 'Contact',
        confidence: 3, // 较低的置信度
        synthetic: true,
        rawData: {
          title: content.title,
          description: content.description,
          keyword: result.keyword,
          possibleEmails: possibleEmails
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * AI增强潜在客户信息
   */
  async enhanceProspectsWithAI(prospects) {
    console.log(`🚀 AI增强 ${prospects.length} 个潜在客户信息`);
    
    const enhanced = [];
    
    for (const prospect of prospects.slice(0, 20)) { // 限制AI处理数量
      try {
        const enhancementPrompt = `Enhance business prospect data.

Email: ${prospect.email}
Company: ${prospect.company || 'Unknown'}
Website: ${prospect.website || 'None'}
Industry: ${prospect.industry || 'general'}

Return ONLY valid JSON:
{
  "enhancedCompany": "Company Name",
  "estimatedRole": "Business Contact",
  "companySize": "small",
  "priority": "medium",
  "marketingAngle": "Business solution approach",
  "painPoints": ["efficiency", "cost control"]
}`;

        const enhancement = await this.callOllama(enhancementPrompt, 'qwen2.5:0.5b');
        const parsed = this.parseAIResponse(enhancement.response);
        
        enhanced.push({
          ...prospect,
          aiEnhancement: parsed,
          company: parsed.enhancedCompany || prospect.company,
          role: parsed.estimatedRole || prospect.role,
          priority: parsed.priority || 'medium',
          companySize: parsed.companySize || 'unknown'
        });
        
      } catch (error) {
        // AI增强失败，使用基于规则的增强
        console.log(`⚠️ AI增强失败，使用规则增强: ${error.message}`);
        const ruleEnhanced = this.enhanceWithRules(prospect);
        enhanced.push(ruleEnhanced);
      }
    }
    
    return enhanced;
  }

  /**
   * 基于规则的潜在客户增强（AI后备方案）
   */
  enhanceWithRules(prospect) {
    // 基于邮箱分析角色
    const email = prospect.email.toLowerCase();
    let estimatedRole = 'Business Contact';
    let priority = 'medium';
    let companySize = 'unknown';
    
    // 角色推断
    if (email.includes('ceo') || email.includes('founder')) {
      estimatedRole = 'CEO/Founder';
      priority = 'high';
    } else if (email.includes('sales') || email.includes('business')) {
      estimatedRole = 'Sales Representative';
      priority = 'high';
    } else if (email.includes('marketing') || email.includes('pr')) {
      estimatedRole = 'Marketing Manager';
      priority = 'medium';
    } else if (email.includes('info') || email.includes('contact')) {
      estimatedRole = 'General Contact';
      priority = 'medium';
    }
    
    // 公司规模推断（基于网站内容）
    const content = prospect.rawData?.title || '';
    if (content.toLowerCase().includes('enterprise') || content.toLowerCase().includes('corporation')) {
      companySize = 'large';
      priority = 'high';
    } else if (content.toLowerCase().includes('startup') || content.toLowerCase().includes('indie')) {
      companySize = 'startup';
    } else {
      companySize = 'small';
    }
    
    // 行业特定优先级调整
    if (prospect.industry === 'technology' || prospect.industry === 'finance') {
      if (priority === 'medium') priority = 'high';
    }
    
    const ruleEnhancement = {
      enhancedCompany: prospect.company,
      estimatedRole,
      companySize,
      priority,
      marketingAngle: `基于${prospect.industry}行业的${estimatedRole}角色定制营销`,
      painPoints: this.generateIndustryPainPoints(prospect.industry)
    };
    
    return {
      ...prospect,
      aiEnhancement: ruleEnhancement,
      role: estimatedRole,
      priority,
      companySize
    };
  }

  /**
   * 生成行业特定痛点
   */
  generateIndustryPainPoints(industry) {
    const painPointsMap = {
      'technology': ['技术债务', '扩展性挑战', '人才短缺'],
      'finance': ['合规要求', '数字化转型', '风险管理'],
      'healthcare': ['患者体验', '数据安全', '成本控制'],
      'education': ['在线学习', '学生参与度', '技术整合'],
      'retail': ['客户体验', '库存管理', '数字营销'],
      'manufacturing': ['供应链优化', '自动化', '质量控制']
    };
    
    return painPointsMap[industry] || ['效率提升', '成本控制', '竞争优势'];
  }

  /**
   * 调用Ollama API
   */
  async callOllama(prompt, model = 'qwen2.5:0.5b') {
    try {
      console.log(`🤖 正在调用Ollama模型 ${model}，请耐心等待...`);
      const response = await axios.post(`${this.ollamaBaseUrl}/generate`, {
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.01,
          num_predict: 80,
          top_k: 1,
          top_p: 0.01,
          num_ctx: 128,
          num_thread: 16,
          num_gpu: 1
        }
      }); // 移除timeout，让AI有足够时间思考
      
      console.log(`✅ Ollama响应完成`);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama服务未运行，请启动Ollama服务');
      } else {
        console.error('Ollama API调用失败:', error.message);
        throw new Error('AI服务暂时不可用');
      }
    }
  }

  // 辅助方法
  generateId() {
    return 'local_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  inferNameFromEmail(email) {
    const username = email.split('@')[0];
    if (username.includes('.')) {
      const parts = username.split('.');
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  extractCompanyFromContent(content) {
    if (!content) return 'Professional Organization';
    
    // 尝试从标题提取
    if (content.title) {
      const titleParts = content.title.split(/[-|–—]|:/);
      if (titleParts.length > 0 && titleParts[0].trim().length > 0) {
        return titleParts[0].trim();
      }
    }
    
    // 从描述中提取
    if (content.description) {
      const descParts = content.description.split(/[-|–—]|:/);
      if (descParts.length > 0 && descParts[0].trim().length > 0) {
        return descParts[0].trim();
      }
    }
    
    return 'Professional Organization';
  }

  inferIndustryFromContent(content) {
    if (!content || !content.text) return 'other';
    
    const text = content.text.toLowerCase();
    const industries = {
      'technology': ['tech', 'software', 'ai', 'saas', 'app'],
      'healthcare': ['health', 'medical', 'pharma'],
      'finance': ['finance', 'fintech', 'bank', 'investment'],
      'education': ['education', 'learning', 'university', 'school']
    };
    
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'other';
  }

  inferRoleFromEmail(email) {
    const username = email.toLowerCase();
    const roleMap = {
      'ceo': 'CEO',
      'founder': 'Founder', 
      'cto': 'CTO',
      'cmo': 'CMO',
      'sales': 'Sales Manager',
      'marketing': 'Marketing Manager',
      'info': 'Information Contact',
      'contact': 'Contact',
      'hello': 'General Contact'
    };
    
    for (const [key, role] of Object.entries(roleMap)) {
      if (username.includes(key)) {
        return role;
      }
    }
    
    return 'Business Contact';
  }

  getDefaultSearchStrategy(query, industry) {
    return {
      keywords: [query, industry, 'company', 'business', 'contact'],
      websiteTypes: ['industry', 'directory'],
      approach: '使用默认搜索策略：结合行业关键词和商业目录',
      expectedContacts: ['Business Manager', 'Contact Person', 'Sales Representative']
    };
  }

  /**
   * 智能默认搜索策略（不依赖AI）
   */
  getIntelligentDefaultStrategy(query, industry, targetAudience) {
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
    const baseKeywords = [...queryWords.slice(0, 3), industry];
    
    if (targetAudience === 'B2B') {
      return {
        keywords: [...baseKeywords, 'company', 'business', 'enterprise', 'corporation'],
        websiteTypes: ['directory', 'industry', 'professional'],
        approach: 'B2B策略：专注商业目录和企业网站，寻找决策者联系方式',
        expectedContacts: ['CEO', 'Sales Manager', 'Business Development', 'Contact Representative']
      };
    } else {
      return {
        keywords: [...baseKeywords, 'customer', 'user', 'community', 'review'],
        websiteTypes: ['social', 'review', 'community'],
        approach: 'B2C策略：专注社交媒体和用户评论网站，寻找个人用户',
        expectedContacts: ['Individual User', 'Customer', 'Community Member', 'Reviewer']
      };
    }
  }

  async scrapeIndustryWebsites(keywords) {
    // 实现行业特定网站爬取
    return [];
  }

  async scrapeBusinessDirectories(keywords) {
    // 实现商业目录爬取
    return [];
  }

  /**
   * 解析AI响应，处理各种格式问题
   */
  parseAIResponse(responseText) {
    try {
      // 清理响应文本
      let cleanText = responseText.trim();
      
      // 移除markdown代码块标记
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 移除任何前导说明文字
      const patterns = [
        /.*?(?=\{)/s, // 移除{之前的所有内容
        /Here\s+is.*?:\s*/gi,
        /Based\s+on.*?:\s*/gi,
        /The\s+following.*?:\s*/gi
      ];
      
      for (const pattern of patterns) {
        cleanText = cleanText.replace(pattern, '');
      }
      
      // 找到JSON对象的开始和结束
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanText = cleanText.substring(jsonStart, jsonEnd);
      } else {
        throw new Error('No valid JSON structure found');
      }
      
      // 更彻底的文本清理
      cleanText = cleanText
        .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除更多控制字符
        .replace(/\u201C|\u201D/g, '"') // 替换智能引号
        .replace(/\u2018|\u2019/g, "'") // 替换智能单引号
        .replace(/\n/g, ' ') // 替换换行为空格
        .replace(/\r/g, ' ') // 替换回车为空格
        .replace(/\t/g, ' ') // 替换制表符为空格
        .replace(/\s+/g, ' ') // 压缩多余空格
        .replace(/,\s*}/g, '}') // 移除末尾多余逗号
        .replace(/,\s*]/g, ']') // 移除数组末尾多余逗号
        .trim();
      
      // 验证并修复常见的JSON格式问题
      if (!cleanText.endsWith('}')) {
        cleanText += '}';
      }
      
      // 尝试解析JSON
      const parsed = JSON.parse(cleanText);
      console.log('✅ JSON解析成功');
      return parsed;
      
    } catch (error) {
      console.log(`⚠️ JSON解析失败，返回默认结构: ${error.message}`);
      console.log(`原始响应: ${responseText.substring(0, 200)}...`);
      
      // 返回默认结构避免程序崩溃
      return {
        keywords: ['business', 'company', 'enterprise', 'corporation'],
        websiteTypes: ['business directory', 'company website', 'industry platform'],
        approach: 'Default search strategy using intelligent fallback',
        expectedContacts: ['Business Decision Maker', 'Contact Person'],
        relevanceScore: 5,
        businessValue: 'medium',
        recommendedAction: 'extract_contacts',
        reasoning: 'Fallback analysis due to parsing error'
      };
    }
  }
}

module.exports = LocalAISearchEngine;