const axios = require('axios');
const cheerio = require('cheerio');
const KnowledgeBase = require('../models/KnowledgeBase');
const SenderNameGenerator = require('../utils/SenderNameGenerator');

class SmartBusinessAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.knowledgeBase = new KnowledgeBase();
  }

  // ⚡ 超快速目标网站分析 - 优化版本
  async analyzeTargetBusiness(url, campaignGoal = 'partnership', retryCount = 0) {
    console.log(`⚡ 开始超快速网站分析: ${url}`);
    
    // 启用缓存以提升速度
    if (this.analysisCache.has(url)) {
      console.log('⚡ 使用缓存的分析结果（超快模式）');
      return this.analysisCache.get(url);
    }

    try {
      const analysis = await this.performUltraFastAnalysis(url, campaignGoal);
      this.analysisCache.set(url, analysis);
      
      // 异步保存到知识库，不阻塞主流程
      this.saveAnalysisToKnowledgeBase(analysis, campaignGoal).catch(err => 
        console.log('⚠️ 异步保存分析到知识库失败:', err.message)
      );
      
      return analysis;
    } catch (error) {
      console.log(`⚠️ 网站分析失败，使用快速恢复: ${error.message}`);
      
      // 直接返回快速分析，减少重试延迟
      return this.generateUltraFastAnalysis(url, campaignGoal);
    }
  }

  // 执行深度分析
  async performDeepAnalysis(url, campaignGoal = 'partnership') {
    console.log(`🔍 尝试分析网站: ${url}`);
    
    // 尝试多种User-Agent来避开防爬虫
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    ];
    
    let response = null;
    let lastError = null;
    
    // 尝试不同的User-Agent
    for (let i = 0; i < userAgents.length; i++) {
      try {
        console.log(`🔄 尝试User-Agent ${i + 1}/${userAgents.length}`);
        response = await axios.get(url, {
          timeout: 20000,
          headers: {
            'User-Agent': userAgents[i],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        console.log(`✅ 成功获取网站内容，状态码: ${response.status}`);
        break;
      } catch (error) {
        lastError = error;
        console.log(`❌ User-Agent ${i + 1} 失败: ${error.response?.status || error.message}`);
        
        if (i === userAgents.length - 1) {
          throw lastError;
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to fetch website content');
    }

    const $ = cheerio.load(response.data);

    // 🎨 Extract company logo from various sources
    let companyLogo = null;

    // Try different logo extraction methods
    const logoSelectors = [
      'meta[property="og:image"]',
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'img[class*="logo"]',
      'img[id*="logo"]',
      'img[alt*="logo"]',
      'a.logo img',
      '.logo img',
      '#logo img',
      'header img:first',
      'nav img:first'
    ];

    for (const selector of logoSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let logoUrl = element.attr('href') || element.attr('content') || element.attr('src');
        if (logoUrl) {
          // Convert relative URLs to absolute
          if (logoUrl.startsWith('/')) {
            const urlObj = new URL(url);
            logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
          } else if (!logoUrl.startsWith('http')) {
            const urlObj = new URL(url);
            logoUrl = `${urlObj.protocol}//${urlObj.host}/${logoUrl}`;
          }

          // Validate it's an image
          if (logoUrl.match(/\.(png|jpg|jpeg|svg|ico|webp)$/i) || selector.includes('og:image')) {
            companyLogo = logoUrl;
            console.log(`🎨 Logo found via ${selector}: ${logoUrl}`);
            break;
          }
        }
      }
    }

    const content = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      headings: [],
      bodyText: $('body').text().trim(),
      links: [],
      images: [],
      logo: companyLogo
    };
    
    // 从HTML源码中提取更丰富的内容信息
    const htmlContent = response.data.toLowerCase();
    
    // 提取所有文本内容进行分析
    const allTextContent = $('*').contents().map(function() {
      return (this.type === 'text') ? $(this).text() : '';
    }).get().join(' ').toLowerCase();
    
    // 合并所有可用信息
    content.allContent = `${content.title} ${content.description} ${content.bodyText} ${allTextContent}`.toLowerCase();
    
    // 从HTML属性和脚本中提取关键信息
    const metaContent = [];
    $('meta').each((i, elem) => {
      const name = $(elem).attr('name') || $(elem).attr('property');
      const content = $(elem).attr('content');
      if (name && content) {
        metaContent.push(`${name}: ${content}`);
      }
    });
    content.metaInfo = metaContent.join(' ').toLowerCase();
    
    console.log(`🔍 网站内容提取完成 - 标题: "${content.title}", 描述: "${content.description}"`);
    
    // 提取标题层级
    $('h1, h2, h3').each((i, elem) => {
      if (i < 20) {
        content.headings.push($(elem).text().trim());
      }
    });

    // 提取关键链接
    $('a[href]').each((i, elem) => {
      if (i < 50) {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        if (text && href) {
          content.links.push({ text, href });
        }
      }
    });

    // 将URL添加到content中用于产品识别
    content.url = url;
    return await this.generateBusinessAnalysis(url, content, campaignGoal);
  }

  // ⚡ 执行超快速分析（替代原深度分析）
  async performUltraFastAnalysis(url, campaignGoal = 'partnership') {
    console.log(`⚡ 执行超快速分析: ${url}`);
    
    // 先尝试快速网站抓取，如果失败则直接使用URL分析
    let content = null;
    
    try {
      content = await this.quickWebsiteFetch(url);
    } catch (error) {
      console.log(`⚠️ 网站抓取失败，使用URL分析: ${error.message}`);
      return this.generateUltraFastAnalysis(url, campaignGoal);
    }
    
    return await this.generateBusinessAnalysis(url, content, campaignGoal);
  }
  
  // ⚡ 快速网站抓取（替代原performDeepAnalysis）
  async quickWebsiteFetch(url, timeout = 8000) {
    console.log(`⚡ 快速抓取网站: ${url}`);
    
    const response = await axios.get(url, {
      timeout: timeout, // 减少到8秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 2 // 减少重定向次数
    });
    
    const $ = cheerio.load(response.data);

    // 🎨 Quick logo extraction
    let companyLogo = null;
    const quickLogoSelectors = [
      'meta[property="og:image"]',
      'link[rel="icon"]',
      'img[class*="logo"]',
      'img[id*="logo"]',
      'header img:first'
    ];

    for (const selector of quickLogoSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let logoUrl = element.attr('href') || element.attr('content') || element.attr('src');
        if (logoUrl) {
          if (logoUrl.startsWith('/')) {
            const urlObj = new URL(url);
            logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
          } else if (!logoUrl.startsWith('http')) {
            const urlObj = new URL(url);
            logoUrl = `${urlObj.protocol}//${urlObj.host}/${logoUrl}`;
          }
          if (logoUrl.match(/\.(png|jpg|jpeg|svg|ico|webp)$/i) || selector.includes('og:image')) {
            companyLogo = logoUrl;
            console.log(`🎨 Quick logo found: ${logoUrl}`);
            break;
          }
        }
      }
    }

    const content = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      headings: [],
      bodyText: $('body').text().trim().substring(0, 2000), // 限制内容大小
      url: url,
      logo: companyLogo
    };

    // 快速提取标题（限制数量）
    $('h1, h2, h3').each((i, elem) => {
      if (i < 10) { // 减少到10个标题
        content.headings.push($(elem).text().trim());
      }
    });
    
    content.allContent = `${content.title} ${content.description} ${content.bodyText}`.toLowerCase();
    
    console.log(`⚡ 快速抓取完成 - 标题: "${content.title}"`);
    return content;
  }
  
  // ⚡ 生成超快速分析（无需网站抓取）
  generateUltraFastAnalysis(url, campaignGoal = 'partnership') {
    console.log(`⚡ 生成超快速URL分析: ${url}`);
    
    const senderInfo = SenderNameGenerator.generateSenderInfo(url, campaignGoal);
    
    // 从URL推断基本信息
    const domain = url ? new URL(url).hostname.replace('www.', '') : 'example.com';
    const companyName = this.extractCompanyNameFromDomain(domain);
    const industry = this.inferIndustryFromDomain(domain);
    const businessModel = this.inferBusinessModelFromDomain(domain);
    
    return {
      url: url,
      timestamp: new Date().toISOString(),
      companyName: companyName,
      industry: industry,
      businessModel: businessModel,
      targetMarket: businessModel === 'b2c' ? ['Consumers'] : ['Businesses'],

      // 🎨 No logo available in ultra-fast mode (URL-only analysis)
      company_logo: null,
      companyInfo: {
        logo: null
      },

      mainProducts: this.inferProductsFromDomain(domain, campaignGoal),
      keyFeatures: this.inferFeaturesFromIndustry(industry),
      valueProposition: this.generateValuePropositionFromDomain(domain, industry, campaignGoal),
      competitiveAdvantage: ['Innovation', 'Technology Leadership'],
      painPoints: this.inferPainPointsFromIndustry(industry),
      targetCustomers: businessModel === 'b2c' ? ['Individual Users'] : ['SME', 'Enterprise'],
      recommendedApproach: businessModel === 'b2c' ? ['Consumer Marketing'] : ['B2B Outreach'],
      potentialPartners: this.inferPartnersFromIndustry(industry),
      keyMessaging: ['Innovation', 'Quality', 'Efficiency'],
      technologyStack: this.inferTechStackFromDomain(domain, industry),
      integrations: [],
      senderInfo: {
        companyName: senderInfo.companyName,
        senderName: senderInfo.senderName,
        senderTitle: senderInfo.senderTitle,
        campaignGoal: campaignGoal
      },
      businessType: businessModel === 'b2c' ? 'toc' : 'tob',
      analysisMethod: 'ultra_fast',
      confidence: 'medium'
    };
  }
  
  // 辅助方法：从域名提取公司名
  extractCompanyNameFromDomain(domain) {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  // 辅助方法：从域名推断行业
  inferIndustryFromDomain(domain) {
    if (domain.includes('fruit') || domain.includes('food')) return 'Food Technology';
    if (domain.includes('ai') || domain.includes('tech')) return 'AI/Technology';
    if (domain.includes('health')) return 'Healthcare';
    if (domain.includes('finance')) return 'Finance/Fintech';
    return 'Technology/Services';
  }
  
  // 辅助方法：从域名推断商业模式
  inferBusinessModelFromDomain(domain) {
    if (domain.includes('fruit') || domain.includes('app') || domain.includes('game')) return 'b2c';
    return 'b2b';
  }
  
  // 辅助方法：从域名推断产品
  inferProductsFromDomain(domain, campaignGoal) {
    if (domain.includes('fruit')) return ['AI Fruit Quality Scanner', 'Smart Food Assessment'];
    if (domain.includes('ai')) return ['AI Solutions', 'Machine Learning Services'];
    if (domain.includes('health')) return ['Healthcare Technology', 'Medical Solutions'];
    return ['Business Solutions', 'Technology Services'];
  }
  
  // 辅助方法：从行业推断特性
  inferFeaturesFromIndustry(industry) {
    const features = {
      'Food Technology': ['AI-powered scanning', 'Quality assessment', 'Freshness detection'],
      'AI/Technology': ['Machine learning', 'Data analytics', 'Automation'],
      'Healthcare': ['Patient care', 'Medical analytics', 'Health monitoring'],
      'Finance/Fintech': ['Financial analysis', 'Payment processing', 'Risk management']
    };
    return features[industry] || ['Technology solutions', 'Innovation', 'Efficiency'];
  }
  
  // 辅助方法：从域名生成价值主张
  generateValuePropositionFromDomain(domain, industry, campaignGoal) {
    if (domain.includes('fruit')) return 'AI-powered fruit quality assessment for smart grocery shopping';
    if (domain.includes('ai')) return 'Advanced AI solutions that transform business operations';
    if (domain.includes('health')) return 'Healthcare technology that improves patient outcomes';
    return `Innovative ${industry.toLowerCase()} solutions that drive business growth`;
  }
  
  // 辅助方法：从行业推断痛点
  inferPainPointsFromIndustry(industry) {
    const painPoints = {
      'Food Technology': ['Food waste', 'Quality control', 'Supply chain inefficiencies'],
      'AI/Technology': ['Manual processes', 'Data silos', 'Lack of insights'],
      'Healthcare': ['Patient safety', 'Operational inefficiencies', 'Compliance'],
      'Finance/Fintech': ['Security concerns', 'Compliance requirements', 'Cost control']
    };
    return painPoints[industry] || ['Operational inefficiencies', 'Technology gaps'];
  }
  
  // 辅助方法：从行业推断合作伙伴
  inferPartnersFromIndustry(industry) {
    const partners = {
      'Food Technology': ['Grocery retailers', 'Food distributors', 'Agriculture companies'],
      'AI/Technology': ['Technology integrators', 'Cloud providers', 'Data companies'],
      'Healthcare': ['Hospitals', 'Healthcare providers', 'Medical device companies'],
      'Finance/Fintech': ['Financial institutions', 'Payment processors', 'RegTech companies']
    };
    return partners[industry] || ['Technology partners', 'Business partners'];
  }
  
  // 辅助方法：从域名和行业推断技术栈
  inferTechStackFromDomain(domain, industry) {
    const baseTech = ['API', 'Cloud Computing'];
    if (domain.includes('ai') || industry.includes('AI')) {
      return [...baseTech, 'Machine Learning', 'Python', 'TensorFlow'];
    }
    if (industry === 'Food Technology') {
      return [...baseTech, 'Computer Vision', 'Mobile Apps', 'IoT'];
    }
    return baseTech;
  }

  // 生成业务分析
  async generateBusinessAnalysis(url, content, campaignGoal = 'partnership') {
    const analysis = {
      url: url,
      timestamp: new Date().toISOString(),

      // 基础信息
      companyName: this.extractCompanyName(url, content),
      industry: await this.identifyIndustry(content),
      businessModel: this.identifyBusinessModel(content),
      targetMarket: this.identifyTargetMarket(content),

      // 🎨 Company Logo (extracted from website)
      company_logo: content.logo || null,
      companyInfo: {
        logo: content.logo || null
      },

      // 产品/服务分析
      mainProducts: this.extractMainProducts(content),
      keyFeatures: this.extractKeyFeatures(content),
      valueProposition: await this.extractValueProposition(content),

      // 市场定位
      competitiveAdvantage: this.identifyCompetitiveAdvantage(content),
      painPoints: this.identifyPainPoints(content),
      targetCustomers: this.identifyTargetCustomers(content),

      // 营销策略
      recommendedApproach: this.recommendMarketingApproach(content),
      potentialPartners: this.identifyPotentialPartners(content),
      keyMessaging: this.generateKeyMessaging(content),

      // 技术特征
      technologyStack: this.identifyTechnologyStack(content),
      integrations: this.findIntegrations(content)
    };

    // Generate sender information based on company analysis
    const senderInfo = SenderNameGenerator.generateSenderInfo(url, campaignGoal);
    analysis.senderInfo = {
      companyName: senderInfo.companyName,
      senderName: senderInfo.senderName,
      senderTitle: senderInfo.senderTitle,
      campaignGoal: campaignGoal
    };

    console.log(`✅ 深度分析完成: ${analysis.companyName} (${analysis.industry})`);
    console.log(`🎯 主要产品: ${analysis.mainProducts.join(', ')}`);
    console.log(`💡 价值主张: ${analysis.valueProposition}`);
    console.log(`📧 发件人信息: ${analysis.senderInfo.senderName}`);
    
    return analysis;
  }

  // 提取公司名称
  extractCompanyName(url, content) {
    // 从标题提取
    if (content.title) {
      const titleParts = content.title.split(/[-|–—]|:|,/);
      if (titleParts.length > 0) {
        return titleParts[0].trim();
      }
    }
    
    // 从URL提取
    const domain = new URL(url).hostname.replace('www.', '');
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // ⚡ 超快速行业识别 - 基于关键词模式识别（无AI调用）
  async identifyIndustry(content) {
    console.log('⚡ 使用超快速关键词行业识别...');
    
    // 直接使用关键词分析，跳过AI调用
    const title = content.title?.toLowerCase() || '';
    const description = content.description?.toLowerCase() || '';
    const bodyText = content.bodyText?.toLowerCase() || '';
    const url = content.url?.toLowerCase() || '';
    const allContent = `${title} ${description} ${bodyText} ${url}`;
    
    // 扩展关键词匹配规则
    const industryPatterns = {
      'Food Technology': ['fruit', 'food', 'vegetable', 'nutrition', 'fresh', 'grocery', 'agriculture', 'farming', 'organic'],
      'AI/Machine Learning': ['ai', 'artificial intelligence', 'machine learning', 'neural', 'deep learning', 'algorithm', 'automation'],
      'Software/Technology': ['software', 'app', 'platform', 'saas', 'tech', 'digital', 'cloud', 'api', 'development'],
      'Healthcare/Medical': ['health', 'medical', 'healthcare', 'clinic', 'hospital', 'patient', 'medicine', 'therapy'],
      'E-commerce/Retail': ['shop', 'store', 'retail', 'ecommerce', 'marketplace', 'buy', 'sell', 'commerce'],
      'Finance/Fintech': ['finance', 'bank', 'payment', 'money', 'investment', 'fintech', 'crypto', 'trading'],
      'Marketing/Digital': ['marketing', 'advertising', 'brand', 'campaign', 'social media', 'content', 'seo'],
      'Education/Training': ['education', 'learn', 'course', 'training', 'school', 'university', 'student'],
      'Real Estate': ['property', 'real estate', 'home', 'house', 'apartment', 'rent', 'mortgage'],
      'Entertainment': ['game', 'music', 'video', 'entertainment', 'media', 'streaming', 'content']
    };
    
    // 计算每个行业的匹配分数
    let bestMatch = 'Technology/Services';
    let bestScore = 0;
    
    for (const [industry, keywords] of Object.entries(industryPatterns)) {
      const score = keywords.reduce((total, keyword) => {
        const matches = (allContent.match(new RegExp(keyword, 'gi')) || []).length;
        return total + matches;
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = industry;
      }
    }
    
    console.log(`⚡ 快速行业识别完成: ${bestMatch} (匹配分数: ${bestScore})`);
    return bestMatch;
  }

  // 识别商业模式 - 返回结构化内容供AI分析
  identifyBusinessModel(content) {
    // 返回原始内容，让AI自行判断商业模式
    return {
      rawContent: content.allContent,
      structuredInfo: {
        title: content.title,
        description: content.description,
        keyPhrases: content.bodyText ? content.bodyText.split(' ').slice(0, 100).join(' ') : ''
      }
    };
  }

  // 识别目标市场 - 返回结构化内容供AI分析
  identifyTargetMarket(content) {
    // 返回完整的内容结构供AI自行分析目标市场
    return {
      fullContent: {
        title: content.title,
        description: content.description,
        allContent: content.allContent,
        headings: content.headings,
        url: content.url
      }
    };
  }

  // 提取主要产品 - 返回结构化信息供AI分析
  extractMainProducts(content) {
    // 返回原始内容信息供AI分析
    const contentForAnalysis = {
      title: content.title,
      description: content.description,
      headings: content.headings ? content.headings.slice(0, 10) : [], // 前10个标题
      bodySnippets: this.extractKeyContentSnippets(content.bodyText),
      url: content.url
    };
    
    console.log(`🔍 提取产品相关信息结构供AI分析`);
    
    // 不返回预定义产品列表，而是返回结构化的原始信息
    return [contentForAnalysis];
  }
  
  // 提取关键内容片段而非预设关键词
  extractKeyContentSnippets(bodyText) {
    if (!bodyText) return [];
    
    // 按句子分割，取前20个句子作为关键片段
    const sentences = bodyText.split(/[.!?。！？]/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 20).map(s => s.trim());
  }

  // 提取关键特性 - 返回结构化内容供AI分析
  extractKeyFeatures(content) {
    // 不做预设特性识别，返回完整内容供AI分析特性
    return {
      featureAnalysis: {
        contentData: {
          title: content.title,
          description: content.description,
          fullContent: content.allContent,
          keyElements: {
            headings: content.headings,
            contentSnippets: this.extractKeyContentSnippets(content.bodyText),
            metaInfo: content.metaInfo
          }
        }
      }
    };
  }

  // ⚡ 超快速价值主张提取 - 基于内容解析（无AI调用）
  async extractValueProposition(content) {
    console.log('⚡ 使用超快速价值主张提取...');
    
    // 直接使用智能内容分析，跳过AI调用
    
    // 1. 优先使用页面描述
    if (content.description && content.description.length > 10) {
      console.log(`⚡ 从description提取价值主张: ${content.description}`);
      return content.description;
    }
    
    // 2. 从标题中智能提取
    if (content.title && content.title.length > 5) {
      // 清理标题，移除网站名等信息
      const cleanTitle = content.title.replace(/\s*[-|–—]\s*.*$/, '').trim();
      if (cleanTitle.length > 5) {
        console.log(`⚡ 从title提取价值主张: ${cleanTitle}`);
        return cleanTitle;
      }
    }
    
    // 3. 从内容中提取关键句子
    if (content.bodyText && content.bodyText.length > 50) {
      const sentences = content.bodyText.split(/[.!?。！？]/).filter(s => s.trim().length > 20);
      
      // 寻找包含价值词汇的句子
      const valueKeywords = ['solution', 'help', 'provide', 'offer', 'deliver', 'enable', 'improve', 'optimize', 'innovative', 'unique'];
      
      for (const sentence of sentences.slice(0, 10)) { // 检查前10个句子
        const lowerSentence = sentence.toLowerCase();
        if (valueKeywords.some(keyword => lowerSentence.includes(keyword))) {
          const cleanSentence = sentence.trim().substring(0, 150); // 限制长度
          console.log(`⚡ 从内容提取价值主张: ${cleanSentence}`);
          return cleanSentence;
        }
      }
    }
    
    // 4. 基于URL和行业生成模板化价值主张
    const url = content.url || '';
    if (url.includes('fruit') || url.includes('food')) {
      return 'AI-powered solutions for fresh food quality and smart grocery shopping experiences';
    }
    if (url.includes('ai') || url.includes('tech')) {
      return 'Advanced AI technology solutions that transform business operations and drive innovation';
    }
    if (url.includes('health')) {
      return 'Healthcare technology solutions that improve patient outcomes and operational efficiency';
    }
    
    // 5. 通用回退方案
    console.log('⚡ 使用通用价值主张模板');
    return 'Innovative solutions designed to solve modern business challenges and drive growth';
  }

  // 识别目标客户 - 返回结构化内容供AI分析
  identifyTargetCustomers(content) {
    // 不做任何预设客户分析，返回完整结构化内容供AI分析
    return {
      websiteAnalysis: {
        title: content.title,
        description: content.description,
        fullContent: content.allContent,
        contentStructure: {
          headings: content.headings,
          metaInfo: content.metaInfo,
          bodySnippets: this.extractKeyContentSnippets(content.bodyText).slice(0, 15)
        },
        url: content.url
      }
    };
  }

  // 推荐营销策略 - 返回结构化内容供AI分析
  recommendMarketingApproach(content) {
    // 不做任何预设策略推荐，返回完整分析结果供AI制定策略
    return {
      contentAnalysis: this.identifyIndustry(content),
      businessModelAnalysis: this.identifyBusinessModel(content),
      targetMarketAnalysis: this.identifyTargetMarket(content)
    };
  }

  // 识别潜在合作伙伴 - 返回内容结构供AI分析
  identifyPotentialPartners(content) {
    // 不使用预设合作伙伴映射，返回内容分析供AI判断
    return {
      contentForPartnerAnalysis: {
        businessAnalysis: this.identifyIndustry(content),
        fullContent: content.allContent,
        structuredData: {
          title: content.title,
          description: content.description,
          url: content.url
        }
      }
    };
  }

  // 生成关键信息 - 返回内容结构供AI分析
  generateKeyMessaging(content) {
    // 不使用预设消息映射，返回全面的内容分析供AI生成消息
    return {
      messagingAnalysis: {
        businessContext: this.identifyIndustry(content),
        contentData: {
          title: content.title,
          description: content.description,
          allContent: content.allContent,
          keyHeadings: content.headings.slice(0, 8),
          url: content.url
        }
      }
    };
  }

  // 识别技术栈 - 返回原始内容供AI分析
  identifyTechnologyStack(content) {
    // 不做预设技术栈判断，返回原始内容供AI分析
    return {
      technicalContent: {
        fullText: content.allContent,
        metaInfo: content.metaInfo,
        headings: content.headings,
        bodySnippets: this.extractKeyContentSnippets(content.bodyText)
      }
    };
  }

  // 查找集成 - 返回内容供AI分析
  findIntegrations(content) {
    // 不做预设集成检查，返回内容供AI自行发现集成信息
    return {
      integrationAnalysis: {
        fullContent: content.allContent,
        specificSections: this.extractKeyContentSnippets(content.bodyText),
        technicalInfo: content.metaInfo
      }
    };
  }

  // 识别竞争优势 - 返回内容供AI分析
  identifyCompetitiveAdvantage(content) {
    // 不做预设优势判断，返回内容供AI分析竞争优势
    return {
      advantageAnalysis: {
        fullContent: content.allContent,
        keyContent: {
          title: content.title,
          description: content.description,
          headings: content.headings,
          contentSnippets: this.extractKeyContentSnippets(content.bodyText).slice(0, 12)
        }
      }
    };
  }

  // 识别痛点 - 返回内容供AI分析
  identifyPainPoints(content) {
    // 不做预设痛点识别，返回内容供AI分析用户痛点
    return {
      painPointAnalysis: {
        websiteContent: {
          title: content.title,
          description: content.description,
          allContent: content.allContent,
          structuredInfo: {
            headings: content.headings,
            bodySnippets: this.extractKeyContentSnippets(content.bodyText),
            metaData: content.metaInfo
          }
        }
      }
    };
  }

  // 获取基础分析（后备方案）
  getBasicAnalysis(url) {
    const domain = new URL(url).hostname.replace('www.', '');
    
    return {
      url: url,
      timestamp: new Date().toISOString(),
      companyName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      industry: 'technology',
      businessModel: 'b2c',
      targetMarket: ['consumers'],
      mainProducts: ['Digital Services'],
      keyFeatures: ['Online platform'],
      valueProposition: 'Digital solutions for modern needs',
      targetCustomers: [{
        segment: 'General Users',
        characteristics: ['Tech-savvy'],
        painPoints: ['Need efficient solutions']
      }],
      recommendedApproach: {
        primaryApproach: 'Digital Marketing',
        channels: ['Online advertising'],
        messaging: 'Focus on convenience and innovation'
      },
      potentialPartners: ['Technology companies'],
      keyMessaging: {
        primary: 'Innovation that works',
        secondary: 'Modern solutions for digital needs',
        callToAction: 'Learn more about our services'
      },
      technologyStack: ['Web technologies'],
      integrations: []
    };
  }

  // 生成潜在客户匹配策略
  generateLeadMatchingStrategy(businessAnalysis) {
    return {
      targetIndustries: this.getTargetIndustries(businessAnalysis),
      idealCustomerProfile: this.generateIdealCustomerProfile(businessAnalysis),
      avoidIndustries: this.getIndustriesToAvoid(businessAnalysis),
      approachStrategy: this.generateApproachStrategy(businessAnalysis)
    };
  }

  getTargetIndustries(analysis) {
    if (analysis.industry === 'pet-tech') {
      return ['pet-care', 'veterinary', 'pet-retail', 'pet-services', 'photography'];
    }
    if (analysis.industry === 'ai-ml') {
      return ['technology', 'healthcare', 'finance', 'retail', 'manufacturing'];
    }
    return ['technology', 'services', 'retail'];
  }

  generateIdealCustomerProfile(analysis) {
    if (analysis.industry === 'pet-tech') {
      return {
        businessTypes: ['Pet stores', 'Veterinary clinics', 'Pet service providers', 'Pet product retailers'],
        companySize: ['Small to medium businesses', 'Local businesses'],
        characteristics: ['Customer-focused', 'Marketing-oriented', 'Tech-friendly'],
        painPoints: ['Need engaging marketing materials', 'Want to differentiate services', 'Seek customer retention tools']
      };
    }
    
    return {
      businessTypes: ['Technology companies', 'Service providers', 'Growing businesses'],
      companySize: ['SME', 'Startups', 'Scale-ups'],
      characteristics: ['Innovation-focused', 'Growth-oriented', 'Digital-first'],
      painPoints: ['Efficiency challenges', 'Scalability issues', 'Competitive pressure']
    };
  }

  getIndustriesToAvoid(analysis) {
    if (analysis.industry === 'pet-tech') {
      // 宠物AI技术不应该联系汽车、重工业等不相关行业
      return ['automotive', 'heavy-industry', 'oil-gas', 'mining', 'defense'];
    }
    return ['adult-content', 'gambling', 'controversial'];
  }

  generateApproachStrategy(analysis) {
    if (analysis.industry === 'pet-tech') {
      return {
        emailTone: 'friendly and warm',
        keyMessages: ['Pet love', 'Memorable moments', 'Customer engagement'],
        valueProps: ['Unique marketing materials', 'Customer delight', 'Competitive advantage'],
        callToAction: 'See how AI pet portraits can engage your customers'
      };
    }
    
    return {
      emailTone: 'professional and solution-focused',
      keyMessages: ['Innovation', 'Efficiency', 'Growth'],
      valueProps: ['Competitive advantage', 'Cost savings', 'Scalability'],
      callToAction: 'Discover how our solution can help your business'
    };
  }

  // 保存分析到知识库
  async saveAnalysisToKnowledgeBase(analysis, campaignGoal) {
    try {
      const websiteData = {
        url: analysis.url,
        title: analysis.companyName,
        description: analysis.valueProposition,
        keywords: analysis.mainProducts.join(', '),
        industry: analysis.industry,
        businessType: analysis.businessModel,
        companySize: 'unknown',
        technologies: analysis.technologyStack,
        companyName: analysis.senderInfo.companyName,
        senderName: analysis.senderInfo.senderName,
        senderTitle: analysis.senderInfo.senderTitle,
        campaignGoal: campaignGoal,
        branding: {
          industry: analysis.industry,
          mainProducts: analysis.mainProducts,
          valueProposition: analysis.valueProposition
        }
      };

      await this.knowledgeBase.saveWebsiteAnalysis(websiteData);
      console.log(`✅ 分析结果已保存到知识库: ${analysis.companyName}`);
    } catch (error) {
      console.error('❌ 保存分析到知识库失败:', error.message);
    }
  }

  // 从数据库格式化分析结果
  formatAnalysisFromDB(dbRow) {
    const analysisData = dbRow.analysis_data || {};
    
    // Helper function to safely extract string from potentially complex data
    const extractStringValue = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        // If it's literally "[object Object]", return null to use fallback
        return value === '[object Object]' ? null : value;
      }
      if (typeof value === 'number') return String(value);
      if (typeof value === 'object') {
        // Try to extract meaningful text from object
        if (value.description) return value.description;
        if (value.primaryContent && value.primaryContent.description) return value.primaryContent.description;
        if (value.toString && value.toString() !== '[object Object]') return value.toString();
      }
      return null;
    };
    
    return {
      url: dbRow.url,
      companyName: dbRow.company_name || dbRow.title,
      industry: dbRow.industry,
      businessModel: analysisData.businessModel || 'unknown',
      mainProducts: analysisData.mainProducts || [],
      valueProposition: extractStringValue(dbRow.description) || extractStringValue(analysisData.valueProposition) || 'AI-powered business solutions',
      senderInfo: {
        companyName: dbRow.company_name,
        senderName: dbRow.sender_name,
        senderTitle: dbRow.sender_title,
        campaignGoal: dbRow.campaign_goal
      },
      // Populate other fields with defaults or from analysis_data
      targetMarket: analysisData.targetMarket || [],
      keyFeatures: analysisData.keyFeatures || [],
      competitiveAdvantage: analysisData.competitiveAdvantage || [],
      painPoints: analysisData.painPoints || [],
      targetCustomers: analysisData.targetCustomers || [],
      recommendedApproach: analysisData.recommendedApproach || [],
      potentialPartners: analysisData.potentialPartners || [],
      keyMessaging: analysisData.keyMessaging || [],
      technologyStack: analysisData.technologyStack || [],
      integrations: analysisData.integrations || [],
      timestamp: dbRow.updated_at
    };
  }

  // 获取基础分析（错误时的回退）
  getBasicAnalysis(url, campaignGoal = 'partnership') {
    const senderInfo = SenderNameGenerator.generateSenderInfo(url, campaignGoal);
    
    return {
      url: url,
      companyName: senderInfo.companyName,
      industry: 'technology',
      businessModel: 'unknown',
      mainProducts: ['Services'],
      valueProposition: 'Innovative solutions for modern challenges',
      senderInfo: {
        companyName: senderInfo.companyName,
        senderName: senderInfo.senderName,
        senderTitle: senderInfo.senderTitle,
        campaignGoal: campaignGoal
      },
      targetMarket: ['Businesses'],
      keyFeatures: ['Technology solutions'],
      competitiveAdvantage: ['Innovation'],
      painPoints: ['Efficiency challenges'],
      targetCustomers: ['SME'],
      recommendedApproach: ['Professional outreach'],
      potentialPartners: ['Technology partners'],
      keyMessaging: ['Innovation', 'Efficiency'],
      technologyStack: [],
      integrations: [],
      timestamp: new Date().toISOString()
    };
  }

  // 智能错误恢复机制
  async intelligentAnalysisRecovery(url, campaignGoal, error, retryCount = 0) {
    console.log(`🔧 启动智能错误恢复机制 (重试 ${retryCount})`);
    console.log(`🔍 错误类型: ${error.response?.status || error.message}`);
    
    try {
      // 如果URL无效，尝试构建有效URL
      if (url === null || url === undefined || url === '') {
        console.log('⚠️ URL为空，使用默认分析');
        return this.generateFallbackAnalysis('https://example.com', campaignGoal);
      }
      
      // 如果是403/401错误，尝试使用API-based分析
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        console.log('🔐 检测到访问限制，尝试API-based分析...');
        return await this.performAPIBasedAnalysis(url, campaignGoal);
      }
      
      // 如果是无效URL错误，尝试修复URL
      if (error.message.includes('Invalid URL')) {
        let fixedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          fixedUrl = 'https://' + url;
        }
        
        console.log(`🔧 尝试修复URL: ${url} -> ${fixedUrl}`);
        
        // 重试分析
        if (retryCount < 2) {
          return await this.analyzeTargetBusiness(fixedUrl, campaignGoal, 'auto', retryCount + 1);
        }
      }
      
      // 如果重试次数过多，尝试最后一次API-based分析
      if (retryCount >= 2) {
        console.log('⚠️ 重试次数过多，尝试API-based分析作为最后手段');
        try {
          return await this.performAPIBasedAnalysis(url, campaignGoal);
        } catch (apiError) {
          console.log('❌ API-based分析也失败，使用回退分析');
          return this.generateFallbackAnalysis(url, campaignGoal);
        }
      }
      
      // 其他错误，尝试API-based分析
      try {
        console.log('🔄 尝试API-based分析...');
        return await this.performAPIBasedAnalysis(url, campaignGoal);
      } catch (apiError) {
        console.log('❌ API-based分析失败，使用回退分析');
        return this.generateFallbackAnalysis(url, campaignGoal);
      }
      
    } catch (recoveryError) {
      console.error('❌ 错误恢复失败:', recoveryError.message);
      return this.generateFallbackAnalysis(url, campaignGoal);
    }
  }

  // 生成回退分析结果
  generateFallbackAnalysis(url, campaignGoal) {
    console.log('🔄 生成回退分析结果');
    
    const senderInfo = {
      companyName: 'AI Business Solutions',
      senderName: 'AI Agent',
      senderTitle: 'Business Development Manager',
      campaignGoal: campaignGoal
    };
    
    return {
      url: url || 'https://example.com',
      companyName: 'Target Business',
      industry: 'technology',
      businessModel: 'b2b',
      mainProducts: ['Business Solutions'],
      valueProposition: 'Innovative business solutions',
      senderInfo: senderInfo,
      targetMarket: ['Businesses'],
      keyFeatures: ['Technology solutions'],
      competitiveAdvantage: ['Innovation'],
      painPoints: ['Efficiency challenges'],
      targetCustomers: ['SME'],
      recommendedApproach: ['Professional outreach'],
      potentialPartners: ['Technology partners'],
      keyMessaging: ['Innovation', 'Efficiency'],
      technologyStack: [],
      integrations: [],
      timestamp: new Date().toISOString(),
      businessType: 'tob'
    };
  }

  // API-based 分析方法 - 当网站无法直接访问时使用
  async performAPIBasedAnalysis(url, campaignGoal = 'partnership') {
    console.log(`🔍 执行API-based分析: ${url}`);
    
    try {
      // 从 URL 提取域名信息
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const domainParts = domain.split('.');
      
      // 基本公司信息推断
      let companyName = 'Target Company';
      let industry = 'technology';
      let businessModel = 'b2b';
      
      // 从域名推断公司名称 - 通用处理，无特殊化
      if (domainParts.length >= 2) {
        const mainDomain = domainParts[domainParts.length - 2];
        companyName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
        
        // 基于通用关键词推断行业，但不做特殊处理
        if (domain.includes('ai') || domain.includes('tech')) {
          industry = 'artificial_intelligence';
          businessModel = 'b2c';
        } else if (domain.includes('health') || domain.includes('medical')) {
          industry = 'healthcare';
          businessModel = 'b2c';
        } else if (domain.includes('finance') || domain.includes('bank')) {
          industry = 'finance';
          businessModel = 'b2b';
        }
      }
      
      // 基于域名和活动目标生成分析
      const analysis = {
        url: url,
        companyName: companyName,
        industry: industry,
        businessModel: businessModel,
        mainProducts: this.inferProductsFromDomain(domain, campaignGoal),
        valueProposition: this.generateValueProposition(companyName, industry, campaignGoal),
        senderInfo: {
          companyName: 'AI Business Solutions',
          senderName: 'AI Agent',
          senderTitle: 'Business Development Manager',
          campaignGoal: campaignGoal
        },
        targetMarket: businessModel === 'b2c' ? ['Consumers', 'End Users'] : ['Businesses', 'Enterprises'],
        keyFeatures: this.inferFeaturesFromIndustry(industry),
        competitiveAdvantage: ['Innovation', 'Technology Leadership'],
        painPoints: this.inferPainPoints(industry),
        targetCustomers: businessModel === 'b2c' ? ['Individual consumers', 'End users'] : ['SME', 'Enterprise clients'],
        recommendedApproach: businessModel === 'b2c' ? ['Consumer-focused messaging', 'Social media outreach'] : ['Professional outreach', 'B2B partnerships'],
        potentialPartners: this.inferPartners(industry),
        keyMessaging: ['Innovation', 'Quality', 'Efficiency'],
        technologyStack: this.inferTechStack(domain, industry),
        integrations: [],
        timestamp: new Date().toISOString(),
        businessType: businessModel === 'b2c' ? 'toc' : 'tob',
        analysisMethod: 'api_based',
        confidence: 'medium'
      };
      
      console.log(`✅ API-based分析完成:`, {
        company: companyName,
        industry: industry,
        businessModel: businessModel
      });
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ API-based分析失败: ${error.message}`);
      throw error;
    }
  }
  
  // 从域名推断产品
  inferProductsFromDomain(domain, campaignGoal) {
    if (domain.includes('fruit')) {
      return ['AI Fruit Freshness Detection', 'Smart Agriculture Solutions', 'Food Quality Assessment'];
    } else if (domain.includes('ai')) {
      return ['AI Solutions', 'Machine Learning Services', 'Automation Tools'];
    } else if (domain.includes('health')) {
      return ['Healthcare Solutions', 'Medical Technology', 'Health Analytics'];
    } else {
      return [campaignGoal || 'Business Solutions', 'Technology Services'];
    }
  }
  
  // 生成价值主张
  generateValueProposition(companyName, industry, campaignGoal) {
    const industryProps = {
      'food_technology': 'Revolutionary food technology solutions that ensure freshness and quality',
      'artificial_intelligence': 'Cutting-edge AI solutions that transform business operations',
      'healthcare': 'Advanced healthcare technology that improves patient outcomes',
      'technology': 'Innovative technology solutions that drive business growth'
    };
    
    return industryProps[industry] || `Innovative ${campaignGoal} solutions by ${companyName}`;
  }
  
  // 从行业推断功能
  inferFeaturesFromIndustry(industry) {
    const industryFeatures = {
      'food_technology': ['AI-powered freshness detection', 'Real-time quality monitoring', 'Smart packaging integration'],
      'artificial_intelligence': ['Machine learning algorithms', 'Data analytics', 'Process automation'],
      'healthcare': ['Patient data management', 'Clinical decision support', 'Health monitoring'],
      'technology': ['Cloud solutions', 'Data processing', 'Integration capabilities']
    };
    
    return industryFeatures[industry] || ['Technology solutions', 'Innovation', 'Efficiency'];
  }
  
  // 推断痛点
  inferPainPoints(industry) {
    const industryPainPoints = {
      'food_technology': ['Food waste', 'Quality control challenges', 'Supply chain inefficiencies'],
      'artificial_intelligence': ['Manual processes', 'Data silos', 'Lack of insights'],
      'healthcare': ['Patient safety', 'Operational inefficiencies', 'Compliance challenges'],
      'technology': ['System integration', 'Scalability issues', 'Security concerns']
    };
    
    return industryPainPoints[industry] || ['Operational inefficiencies', 'Technology gaps'];
  }
  
  // 推断潜在合作伙伴
  inferPartners(industry) {
    const industryPartners = {
      'food_technology': ['Food retailers', 'Agriculture companies', 'Supply chain providers'],
      'artificial_intelligence': ['Technology integrators', 'Cloud providers', 'Data companies'],
      'healthcare': ['Hospitals', 'Healthcare providers', 'Medical device companies'],
      'technology': ['System integrators', 'Cloud providers', 'Technology vendors']
    };
    
    return industryPartners[industry] || ['Technology partners', 'Business partners'];
  }
  
  // 推断技术栈
  inferTechStack(domain, industry) {
    const baseTech = ['API', 'Cloud Computing', 'Data Analytics'];
    
    if (domain.includes('ai') || industry === 'artificial_intelligence') {
      return [...baseTech, 'Machine Learning', 'Neural Networks', 'Python', 'TensorFlow'];
    } else if (industry === 'food_technology') {
      return [...baseTech, 'IoT Sensors', 'Computer Vision', 'Mobile Apps'];
    } else if (industry === 'healthcare') {
      return [...baseTech, 'FHIR', 'HL7', 'Medical Imaging', 'Security Compliance'];
    }
    
    return baseTech;
  }
}

module.exports = SmartBusinessAnalyzer;