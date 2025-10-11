const axios = require('axios');
const cheerio = require('cheerio');
const RealSearchEngine = require('./RealSearchEngine');

class RealTimeLeadDiscovery {
  constructor() {
    this.realSearchEngine = new RealSearchEngine();
    this.discoveredCompanies = new Map();
    console.log('🔧 初始化真实搜索引擎');
    this.realSearchEngine.checkApiAvailability();
  }

  // 实时搜索相关公司
  async searchRelatedCompanies(businessAnalysis) {
    console.log(`🔍 实时搜索与 ${businessAnalysis.industry} 相关的公司...`);
    
    try {
      // 基于行业和产品动态生成搜索查询
      const searchQueries = this.generateSearchQueries(businessAnalysis);
      const allCompanies = [];
      
      for (const query of searchQueries.slice(0, 3)) {
        console.log(`🔎 搜索查询: "${query}"`);
        
        try {
          // 使用真实搜索引擎进行业务搜索
          const searchResults = await this.realSearchEngine.searchBusinesses(
            query, 
            businessAnalysis.industry, 
            'United States'
          );
          
          console.log(`  📊 找到 ${searchResults.length} 个搜索结果`);
          
          // 增强搜索结果并提取详细信息
          for (const result of searchResults.slice(0, 5)) {
            try {
              const enhancedBusiness = await this.realSearchEngine.getBusinessDetails(result);
              const analyzedCompany = await this.analyzeSearchedCompany(enhancedBusiness, businessAnalysis);
              
              if (analyzedCompany && this.isRelevantCompany(analyzedCompany, businessAnalysis)) {
                allCompanies.push(analyzedCompany);
                console.log(`  ✅ 添加相关公司: ${analyzedCompany.name} (${analyzedCompany.relevanceScore}分)`);
              }
            } catch (error) {
              console.log(`    ⚠️ 分析公司失败: ${error.message}`);
            }
          }
          
          // 添加延迟避免API限制
          await this.sleep(1000);
        } catch (error) {
          console.log(`  ⚠️ 查询搜索失败: ${error.message}`);
        }
      }
      
      // 去重并验证公司
      const uniqueCompanies = await this.validateAndDeduplicateCompanies(allCompanies);
      
      console.log(`✅ 实时发现 ${uniqueCompanies.length} 家相关公司`);
      return uniqueCompanies;
      
    } catch (error) {
      console.error('实时公司搜索失败:', error.message);
      return [];
    }
  }

  // 生成动态搜索查询
  generateSearchQueries(businessAnalysis) {
    const queries = [];
    const industry = businessAnalysis.industry;
    const products = businessAnalysis.mainProducts || [];
    const targetAudience = businessAnalysis.targetCustomers || [];
    
    // 基于行业的搜索
    if (industry === 'pet-tech' || businessAnalysis.mainProducts.some(p => p.toLowerCase().includes('pet'))) {
      queries.push('pet store companies "contact us"');
      queries.push('veterinary clinics email contact');
      queries.push('pet services businesses website');
      queries.push('animal hospital contact information');
      queries.push('pet grooming business directory');
    } else if (industry.includes('tech') || industry.includes('ai')) {
      queries.push('technology companies startup directory');
      queries.push('software companies contact business');
      queries.push('AI companies email directory');
    } else {
      // 通用业务搜索
      queries.push(`${industry} companies directory contact`);
      queries.push(`${industry} business email list`);
      queries.push(`${businessAnalysis.companyName} competitors contact`);
    }
    
    // 基于目标客户的搜索
    targetAudience.forEach(customer => {
      if (customer.segment) {
        queries.push(`"${customer.segment}" companies contact directory`);
      }
    });
    
    return queries.filter(q => q.length > 10); // 过滤太短的查询
  }

  // 分析搜索到的公司
  async analyzeSearchedCompany(searchResult, businessAnalysis) {
    try {
      // 提取基础信息
      const companyInfo = {
        name: searchResult.title,
        website: searchResult.url,
        industry: this.mapSearchIndustry(searchResult.industry || businessAnalysis.industry),
        description: searchResult.snippet || '',
        source: searchResult.source,
        relevanceScore: searchResult.relevanceScore || 0
      };
      
      // 如果有详细的业务信息，使用它
      if (searchResult.businessInfo) {
        companyInfo.businessInfo = searchResult.businessInfo;
        companyInfo.address = searchResult.address;
        companyInfo.phone = searchResult.phone;
        companyInfo.rating = searchResult.rating;
      }
      
      // 提取联系信息
      if (searchResult.contactInfo) {
        companyInfo.contactInfo = searchResult.contactInfo;
      } else {
        // 如果搜索结果没有联系信息，尝试提取
        companyInfo.contactInfo = {
          emails: searchResult.detailsExtracted ? 
            (searchResult.contactInfo?.emails || []) : [],
          phones: searchResult.phone ? [searchResult.phone] : []
        };
      }
      
      // 估算公司特征
      companyInfo.size = this.estimateCompanySize(searchResult);
      companyInfo.characteristics = this.extractBusinessCharacteristics(searchResult);
      
      // 增强相关性评分
      companyInfo.relevanceScore = this.enhanceRelevanceScore(
        companyInfo, 
        businessAnalysis, 
        searchResult.relevanceScore || 0
      );
      
      companyInfo.extractedAt = new Date().toISOString();
      
      return companyInfo;
      
    } catch (error) {
      console.log(`分析搜索公司失败: ${error.message}`);
      return null;
    }
  }

  // 映射搜索行业到标准分类
  mapSearchIndustry(industry) {
    const industryMap = {
      'pets': 'pet-care',
      'petservices': 'pet-services', 
      'veterinarians': 'veterinary',
      'technology': 'tech',
      'softwaredevelopment': 'software',
      'health': 'healthcare',
      'medical': 'healthcare',
      'retail': 'retail',
      'restaurants': 'food-service',
      'automotive': 'automotive'
    };
    
    return industryMap[industry] || industry;
  }

  // 提取业务特征
  extractBusinessCharacteristics(searchResult) {
    const characteristics = [];
    const text = (searchResult.title + ' ' + searchResult.snippet + ' ' + (searchResult.description || '')).toLowerCase();
    
    if (text.includes('customer') || text.includes('client') || text.includes('service')) {
      characteristics.push('customer-focused');
    }
    if (text.includes('local') || text.includes('community') || text.includes('neighborhood')) {
      characteristics.push('local-business');
    }
    if (text.includes('professional') || text.includes('expert') || text.includes('certified')) {
      characteristics.push('professional');
    }
    if (text.includes('family') || text.includes('trusted') || text.includes('established')) {
      characteristics.push('family-oriented');
    }
    if (text.includes('innovative') || text.includes('modern') || text.includes('advanced')) {
      characteristics.push('innovation-focused');
    }
    
    return characteristics;
  }

  // 增强相关性评分
  enhanceRelevanceScore(company, businessAnalysis, baseScore) {
    let score = baseScore;
    
    // 行业匹配加分
    if (businessAnalysis.industry === 'pet-tech') {
      if (company.industry.includes('pet') || company.industry.includes('veterinary')) {
        score += 25;
      }
    }
    
    // 地理位置加分（如果是本地业务）
    if (company.address && company.address.includes('United States')) {
      score += 10;
    }
    
    // 评分加分（高质量业务）
    if (company.rating && company.rating >= 4.0) {
      score += 15;
    }
    
    // 联系信息完整性加分
    if (company.contactInfo?.emails?.length > 0) {
      score += 20;
    }
    if (company.contactInfo?.phones?.length > 0) {
      score += 10;
    }
    
    // 业务特征匹配
    if (company.characteristics?.includes('customer-focused')) {
      score += 12;
    }
    if (company.characteristics?.includes('professional')) {
      score += 8;
    }
    
    return Math.min(score, 100);
  }

  // 估算公司规模（基于搜索结果）
  estimateCompanySize(searchResult) {
    const text = (searchResult.title + ' ' + searchResult.snippet).toLowerCase();
    
    if (text.includes('corporation') || text.includes('enterprise') || text.includes('inc')) {
      return 'large';
    }
    if (text.includes('llc') || text.includes('local') || text.includes('family')) {
      return 'small';
    }
    if (searchResult.businessInfo?.reviewCount > 100) {
      return 'medium';
    }
    if (searchResult.businessInfo?.reviewCount > 20) {
      return 'small';
    }
    
    return 'medium';
  }

  // 解析搜索结果
  parseSearchResults(html) {
    const results = [];
    
    try {
      const $ = cheerio.load(html);
      
      // 提取搜索结果链接
      $('a[href*="http"]').each((i, elem) => {
        if (i < 20) { // 限制数量
          const href = $(elem).attr('href');
          const text = $(elem).text().trim();
          
          if (href && text && this.isBusinessWebsite(href)) {
            results.push({
              url: href,
              title: text,
              source: 'search'
            });
          }
        }
      });
    } catch (error) {
      console.log('解析搜索结果失败:', error.message);
    }
    
    return results;
  }

  // 判断是否为商业网站
  isBusinessWebsite(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // 排除不相关的域名
      const excludeDomains = [
        'google.com', 'facebook.com', 'twitter.com', 'linkedin.com',
        'youtube.com', 'wikipedia.org', 'amazon.com', 'ebay.com'
      ];
      
      return !excludeDomains.some(excluded => domain.includes(excluded));
    } catch {
      return false;
    }
  }

  // 从搜索结果中提取公司信息
  async extractCompaniesFromResults(searchResults, businessAnalysis) {
    const companies = [];
    
    for (const result of searchResults.slice(0, 10)) { // 限制处理数量
      try {
        console.log(`🔍 分析网站: ${result.url}`);
        
        const companyInfo = await this.analyzeCompanyWebsite(result.url, businessAnalysis);
        if (companyInfo && this.isRelevantCompany(companyInfo, businessAnalysis)) {
          companies.push(companyInfo);
        }
        
        await this.sleep(1000); // 避免过于频繁的请求
      } catch (error) {
        console.log(`  ❌ 分析失败: ${error.message}`);
      }
    }
    
    return companies;
  }

  // 分析公司网站
  async analyzeCompanyWebsite(url, businessAnalysis) {
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const content = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        bodyText: $('body').text().trim()
      };
      
      // 使用AI分析公司信息
      return this.performAICompanyAnalysis(url, content, businessAnalysis);
      
    } catch (error) {
      console.log(`网站分析失败 ${url}:`, error.message);
      return null;
    }
  }

  // AI公司分析
  performAICompanyAnalysis(url, content, businessAnalysis) {
    const domain = new URL(url).hostname.replace('www.', '');
    const companyName = this.extractCompanyName(content.title, domain);
    const industry = this.analyzeIndustry(content, businessAnalysis);
    const relevanceScore = this.calculateRelevanceScore(content, businessAnalysis);
    
    return {
      name: companyName,
      website: url,
      industry: industry,
      description: content.description,
      relevanceScore: relevanceScore,
      extractedAt: new Date().toISOString(),
      size: this.estimateCompanySize(content),
      characteristics: this.extractCharacteristics(content),
      contactInfo: this.extractContactInfo(content.bodyText)
    };
  }

  // 提取公司名称
  extractCompanyName(title, domain) {
    if (title && title.length > 0) {
      // 从标题中提取公司名
      const cleanTitle = title.split(/[-|–—]|:|,/)[0].trim();
      return cleanTitle || this.capitalizeFirst(domain.split('.')[0]);
    }
    
    return this.capitalizeFirst(domain.split('.')[0]);
  }

  // 分析行业
  analyzeIndustry(content, businessAnalysis) {
    const text = (content.title + ' ' + content.description + ' ' + content.bodyText).toLowerCase();
    
    // 基于目标业务分析来判断相关性
    if (businessAnalysis.industry === 'pet-tech') {
      if (text.includes('pet') || text.includes('animal') || text.includes('veterinary')) {
        return 'pet-care';
      }
    }
    
    // 通用行业识别
    const industries = {
      'technology': ['tech', 'software', 'app', 'digital', 'platform'],
      'healthcare': ['health', 'medical', 'clinic', 'doctor'],
      'retail': ['store', 'shop', 'retail', 'merchant'],
      'services': ['service', 'consulting', 'agency', 'professional']
    };
    
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'other';
  }

  // 计算相关性评分
  calculateRelevanceScore(content, businessAnalysis) {
    const text = content.bodyText.toLowerCase();
    let score = 0;
    
    // 行业关键词匹配
    if (businessAnalysis.industry === 'pet-tech') {
      const petKeywords = ['pet', 'dog', 'cat', 'animal', 'veterinary'];
      score += petKeywords.reduce((sum, keyword) => 
        sum + (text.includes(keyword) ? 10 : 0), 0);
    }
    
    // 业务模式匹配
    if (businessAnalysis.businessModel) {
      if (text.includes(businessAnalysis.businessModel)) {
        score += 5;
      }
    }
    
    // 目标客户匹配
    businessAnalysis.targetCustomers?.forEach(customer => {
      if (customer.segment && text.includes(customer.segment.toLowerCase())) {
        score += 8;
      }
    });
    
    return Math.min(score, 100); // 限制最高分100
  }

  // 判断公司相关性
  isRelevantCompany(company, businessAnalysis) {
    // 相关性评分阈值
    return company.relevanceScore > 15;
  }

  // 估算公司规模
  estimateCompanySize(content) {
    const text = content.bodyText.toLowerCase();
    
    if (text.includes('enterprise') || text.includes('corporation') || text.includes('fortune')) {
      return 'large';
    }
    if (text.includes('startup') || text.includes('small business')) {
      return 'small';
    }
    return 'medium';
  }

  // 提取特征
  extractCharacteristics(content) {
    const characteristics = [];
    const text = content.bodyText.toLowerCase();
    
    if (text.includes('customer') || text.includes('client')) {
      characteristics.push('customer-focused');
    }
    if (text.includes('innovation') || text.includes('cutting-edge')) {
      characteristics.push('innovation-focused');
    }
    if (text.includes('professional') || text.includes('expert')) {
      characteristics.push('professional');
    }
    if (text.includes('local') || text.includes('community')) {
      characteristics.push('community-focused');
    }
    
    return characteristics;
  }

  // 提取联系信息
  extractContactInfo(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    
    return {
      emails: [...new Set(text.match(emailRegex) || [])].slice(0, 3),
      phones: [...new Set(text.match(phoneRegex) || [])].slice(0, 2)
    };
  }

  // 验证和去重公司
  async validateAndDeduplicateCompanies(companies) {
    const uniqueCompanies = new Map();
    
    for (const company of companies) {
      const key = new URL(company.website).hostname;
      
      if (!uniqueCompanies.has(key) || 
          uniqueCompanies.get(key).relevanceScore < company.relevanceScore) {
        uniqueCompanies.set(key, company);
      }
    }
    
    // 按相关性评分排序
    return Array.from(uniqueCompanies.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // 限制返回数量
  }

  // 工具函数
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RealTimeLeadDiscovery;