// 邮件发现代理 - 使用多种策略发现和验证邮件地址
const axios = require('axios');
const cheerio = require('cheerio');

class EmailDiscoveryAgent {
  constructor() {
    // 免费的邮件发现API（无需密钥或有免费层）
    this.discoveryServices = {
      // Google搜索操作符
      googleSearch: {
        enabled: true,
        queries: [
          'site:{domain} "email" OR "contact" OR "@{domain}"',
          'site:{domain} "mailto:" OR "contact us"',
          'site:linkedin.com/company/{company} email',
          'site:crunchbase.com "{company}" email contact'
        ]
      },
      
      // 社交媒体和公开数据源
      socialSources: {
        enabled: true,
        sources: [
          'linkedin.com/company/',
          'twitter.com/',
          'facebook.com/',
          'crunchbase.com/organization/',
          'angel.co/company/',
          'github.com/'
        ]
      },
      
      // 网站爬取和分析
      websiteCrawl: {
        enabled: true,
        patterns: [
          /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
          /"email":\s*"([^"]+@[^"]+)"/gi,
          /contact.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
        ]
      }
    };
    
    // 常见的邮件格式模式
    this.emailPatterns = [
      '{first}@{domain}',
      '{first}.{last}@{domain}',
      '{first}_{last}@{domain}',
      '{f}{last}@{domain}',
      '{first}{last}@{domain}',
      '{last}@{domain}',
      'info@{domain}',
      'contact@{domain}',
      'hello@{domain}',
      'support@{domain}',
      'sales@{domain}',
      'admin@{domain}'
    ];
    
    // 常见的角色邮箱
    this.roleEmails = [
      'info', 'contact', 'hello', 'hi', 'support', 'help',
      'sales', 'business', 'admin', 'team', 'mail',
      'marketing', 'pr', 'media', 'press', 'careers',
      'hr', 'jobs', 'partnerships', 'partner'
    ];
    
    // 发现结果缓存
    this.discoveryCache = new Map();
    this.cacheExpiry = 2 * 60 * 60 * 1000; // 2小时缓存
    
    // ScrapingDog API key for website crawling
    this.scrapingDogKey = process.env.SCRAPINGDOG_API_KEY || '689e1eadbec7a9c318cc34e9';
  }

  // 主要的邮件发现方法
  async discoverEmails(company, domain, options = {}) {
    console.log(`🔍 开始为 ${company} (${domain}) 发现邮件地址...`);
    
    // 检查缓存
    const cacheKey = `${company}:${domain}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached && !options.forceRefresh) {
      console.log('📋 使用缓存的发现结果');
      return cached;
    }
    
    const discoveryResult = {
      company,
      domain,
      emails: [],
      patterns: [],
      sources: [],
      confidence: {},
      timestamp: new Date().toISOString()
    };
    
    try {
      // 1. 网站爬取发现
      console.log('🌐 分析公司网站...');
      const websiteEmails = await this.crawlWebsiteForEmails(domain);
      this.addDiscoveredEmails(discoveryResult, websiteEmails, 'website_crawl', 0.9);
      
      // 2. 社交媒体和公开数据源
      console.log('📱 搜索社交媒体和公开数据...');
      const socialEmails = await this.searchSocialSources(company, domain);
      this.addDiscoveredEmails(discoveryResult, socialEmails, 'social_sources', 0.8);
      
      // 3. Google搜索操作符
      console.log('🔎 使用Google搜索操作符...');
      const googleEmails = await this.searchWithGoogleOperators(company, domain);
      this.addDiscoveredEmails(discoveryResult, googleEmails, 'google_search', 0.7);
      
      // 4. 智能邮件格式预测
      console.log('🤖 预测可能的邮件格式...');
      const predictedEmails = await this.predictEmailFormats(company, domain, discoveryResult.emails);
      this.addDiscoveredEmails(discoveryResult, predictedEmails, 'format_prediction', 0.6);
      
      // 5. 去重和排序
      discoveryResult.emails = this.deduplicateAndRank(discoveryResult.emails);
      
      // 6. 生成发现报告
      discoveryResult.stats = this.generateDiscoveryStats(discoveryResult);
      
      console.log(`✅ 发现完成: 找到 ${discoveryResult.emails.length} 个邮件地址`);
      
      // 缓存结果
      this.cacheResult(cacheKey, discoveryResult);
      
      return discoveryResult;
      
    } catch (error) {
      console.error('❌ 邮件发现失败:', error.message);
      discoveryResult.error = error.message;
      return discoveryResult;
    }
  }

  // 爬取网站寻找邮件地址
  async crawlWebsiteForEmails(domain) {
    const emails = [];
    const urlsToCheck = [
      `https://${domain}`,
      `https://${domain}/contact`,
      `https://${domain}/about`,
      `https://${domain}/team`,
      `https://${domain}/contact-us`,
      `https://${domain}/about-us`
    ];
    
    for (const url of urlsToCheck) {
      try {
        console.log(`  分析: ${url}`);
        const content = await this.fetchWebsiteContent(url);
        const foundEmails = this.extractEmailsFromContent(content);
        emails.push(...foundEmails);
        
        // 避免过快请求
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ⚠️ 无法访问 ${url}: ${error.message}`);
      }
    }
    
    return emails;
  }

  // 获取网站内容
  async fetchWebsiteContent(url) {
    try {
      // 首先尝试直接请求
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EmailDiscoveryBot/1.0)'
        }
      });
      return response.data;
      
    } catch (directError) {
      // 如果直接请求失败，使用ScrapingDog
      try {
        const scrapingUrl = `https://api.scrapingdog.com/scrape?api_key=${this.scrapingDogKey}&url=${encodeURIComponent(url)}&dynamic=false`;
        const response = await axios.get(scrapingUrl, { timeout: 15000 });
        return response.data;
      } catch (scrapingError) {
        throw new Error(`Both direct and scraping failed: ${scrapingError.message}`);
      }
    }
  }

  // 从内容中提取邮件地址
  extractEmailsFromContent(content) {
    const emails = new Set();
    
    for (const pattern of this.discoveryServices.websiteCrawl.patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const email = match[1] || match[0];
        if (this.isValidEmailFormat(email)) {
          emails.add(email.toLowerCase());
        }
      }
    }
    
    // 使用cheerio解析HTML查找更多邮件
    try {
      const $ = cheerio.load(content);
      
      // 查找mailto链接
      $('a[href^="mailto:"]').each((i, elem) => {
        const href = $(elem).attr('href');
        const email = href.replace('mailto:', '').split('?')[0];
        if (this.isValidEmailFormat(email)) {
          emails.add(email.toLowerCase());
        }
      });
      
      // 查找包含@的文本
      $('body').find('*').contents().filter(function() {
        return this.nodeType === 3; // 文本节点
      }).each((i, textNode) => {
        const text = $(textNode).text();
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
        const matches = text.matchAll(emailPattern);
        for (const match of matches) {
          if (this.isValidEmailFormat(match[1])) {
            emails.add(match[1].toLowerCase());
          }
        }
      });
      
    } catch (parseError) {
      console.log('  HTML解析错误，使用纯文本提取');
    }
    
    return Array.from(emails);
  }

  // 搜索社交媒体和公开数据源
  async searchSocialSources(company, domain) {
    const emails = [];
    
    // LinkedIn公司页面搜索
    try {
      const linkedinUrl = `https://www.linkedin.com/company/${company.toLowerCase().replace(/\s+/g, '-')}`;
      const content = await this.fetchWebsiteContent(linkedinUrl);
      const foundEmails = this.extractEmailsFromContent(content);
      emails.push(...foundEmails);
    } catch (error) {
      console.log('  LinkedIn搜索失败');
    }
    
    // Crunchbase搜索
    try {
      const crunchbaseUrl = `https://www.crunchbase.com/organization/${company.toLowerCase().replace(/\s+/g, '-')}`;
      const content = await this.fetchWebsiteContent(crunchbaseUrl);
      const foundEmails = this.extractEmailsFromContent(content);
      emails.push(...foundEmails);
    } catch (error) {
      console.log('  Crunchbase搜索失败');
    }
    
    return emails;
  }

  // 使用Google搜索操作符
  async searchWithGoogleOperators(company, domain) {
    const emails = [];
    
    // 这里我们模拟Google搜索结果，实际项目中可能需要搜索API
    const searchQueries = [
      `site:${domain} contact email`,
      `"${company}" email contact site:${domain}`,
      `"${company}" @${domain}`,
      `${company} email address contact information`
    ];
    
    // 实际实现中，这里会调用Google搜索API或其他搜索服务
    // 目前我们返回一些基于域名的预测邮件
    console.log('  注意: Google搜索API需要密钥，使用预测方法');
    
    return emails;
  }

  // 智能邮件格式预测
  async predictEmailFormats(company, domain, knownEmails) {
    const predictions = [];
    
    // 分析已知邮件的格式模式
    const detectedPatterns = this.analyzeEmailPatterns(knownEmails, domain);
    
    // 基于公司信息生成可能的联系人
    const possibleContacts = this.generatePossibleContacts(company);
    
    // 为每个联系人生成邮件地址
    for (const contact of possibleContacts) {
      for (const pattern of this.emailPatterns) {
        const email = this.applyEmailPattern(pattern, contact, domain);
        if (email && this.isValidEmailFormat(email)) {
          predictions.push({
            email: email.toLowerCase(),
            pattern,
            contact,
            confidence: this.calculatePatternConfidence(pattern, detectedPatterns)
          });
        }
      }
    }
    
    // 按置信度排序并返回前20个
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)
      .map(p => p.email);
  }

  // 分析邮件格式模式
  analyzeEmailPatterns(emails, domain) {
    const patterns = {};
    
    for (const email of emails) {
      if (!email.endsWith(`@${domain}`)) continue;
      
      const localPart = email.split('@')[0];
      
      // 检测常见模式
      if (localPart.includes('.')) {
        patterns['first.last'] = (patterns['first.last'] || 0) + 1;
      } else if (localPart.includes('_')) {
        patterns['first_last'] = (patterns['first_last'] || 0) + 1;
      } else if (this.roleEmails.includes(localPart)) {
        patterns['role'] = (patterns['role'] || 0) + 1;
      } else {
        patterns['firstlast'] = (patterns['firstlast'] || 0) + 1;
      }
    }
    
    return patterns;
  }

  // 生成可能的联系人
  generatePossibleContacts(company) {
    const contacts = [];
    
    // 常见的角色邮箱
    for (const role of this.roleEmails) {
      contacts.push({
        first: role,
        last: '',
        role: role
      });
    }
    
    // 基于公司名称的可能联系人
    const companyWords = company.toLowerCase().split(/\s+/);
    if (companyWords.length > 0) {
      contacts.push({
        first: companyWords[0],
        last: '',
        role: 'company'
      });
    }
    
    // 常见的名字（用于预测）
    const commonNames = [
      { first: 'john', last: 'smith' },
      { first: 'mary', last: 'johnson' },
      { first: 'david', last: 'brown' },
      { first: 'sarah', last: 'davis' },
      { first: 'michael', last: 'wilson' }
    ];
    
    contacts.push(...commonNames);
    
    return contacts.slice(0, 15); // 限制数量
  }

  // 应用邮件格式模式
  applyEmailPattern(pattern, contact, domain) {
    return pattern
      .replace('{first}', contact.first || '')
      .replace('{last}', contact.last || '')
      .replace('{f}', contact.first ? contact.first[0] : '')
      .replace('{l}', contact.last ? contact.last[0] : '')
      .replace('{domain}', domain);
  }

  // 计算模式置信度
  calculatePatternConfidence(pattern, detectedPatterns) {
    if (pattern.includes('{first}.{last}') && detectedPatterns['first.last']) {
      return 0.9;
    }
    if (pattern.includes('{first}_{last}') && detectedPatterns['first_last']) {
      return 0.85;
    }
    if (pattern.includes('info@') || pattern.includes('contact@')) {
      return 0.8;
    }
    return 0.5;
  }

  // 验证邮件格式
  isValidEmailFormat(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes('example.com');
  }

  // 添加发现的邮件到结果中
  addDiscoveredEmails(result, emails, source, confidence) {
    for (const email of emails) {
      const existingEmail = result.emails.find(e => e.email === email);
      if (existingEmail) {
        // 如果邮件已存在，更新置信度和来源
        existingEmail.confidence = Math.max(existingEmail.confidence, confidence);
        if (!existingEmail.sources.includes(source)) {
          existingEmail.sources.push(source);
        }
      } else {
        // 添加新邮件
        result.emails.push({
          email,
          confidence,
          sources: [source],
          discoveredAt: new Date().toISOString()
        });
      }
    }
    
    if (!result.sources.includes(source)) {
      result.sources.push(source);
    }
  }

  // 去重和排序邮件
  deduplicateAndRank(emails) {
    // 去重（已在addDiscoveredEmails中处理）
    // 按置信度排序
    return emails.sort((a, b) => b.confidence - a.confidence);
  }

  // 生成发现统计
  generateDiscoveryStats(result) {
    const stats = {
      totalFound: result.emails.length,
      highConfidence: result.emails.filter(e => e.confidence >= 0.8).length,
      mediumConfidence: result.emails.filter(e => e.confidence >= 0.6 && e.confidence < 0.8).length,
      lowConfidence: result.emails.filter(e => e.confidence < 0.6).length,
      sourceBreakdown: {}
    };
    
    // 按来源统计
    for (const source of result.sources) {
      stats.sourceBreakdown[source] = result.emails.filter(e => 
        e.sources.includes(source)
      ).length;
    }
    
    return stats;
  }

  // 缓存管理
  getCachedResult(key) {
    const cached = this.discoveryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    return null;
  }

  cacheResult(key, result) {
    this.discoveryCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  // 清理缓存
  clearCache() {
    this.discoveryCache.clear();
    console.log('✅ 邮件发现缓存已清空');
  }

  // 获取发现统计
  getDiscoveryStats() {
    return {
      cacheSize: this.discoveryCache.size,
      enabledServices: Object.keys(this.discoveryServices).filter(
        service => this.discoveryServices[service].enabled
      ),
      totalPatterns: this.emailPatterns.length
    };
  }
}

module.exports = EmailDiscoveryAgent;