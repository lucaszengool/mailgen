const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Professional Email List Builder
 * 学习传统邮件营销平台（如HubSpot、Mailchimp）的最佳实践
 * 实现真实、准确的邮箱获取策略
 */
class ProfessionalEmailListBuilder {
  constructor() {
    this.sources = {
      // 1. 网站深度爬取
      websiteScraping: {
        patterns: [
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // 基础邮箱模式
          /mailto:([^"'>\s]+)/gi, // mailto链接
          /contact.*?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi, // 联系页面邮箱
        ],
        pages: [
          '/contact', '/about', '/team', '/support', '/privacy', 
          '/terms', '/impressum', '/legal', '/help', '/careers'
        ]
      },
      
      // 2. LinkedIn数据提取（模拟Chrome扩展功能）
      linkedIn: {
        searchPatterns: [
          'site:linkedin.com/in/ "{company}" email',
          'site:linkedin.com/company/{company} contact',
        ]
      },
      
      // 3. 公司数据库API（模拟Cognism、ZoomInfo等）
      dataProviders: [
        {
          name: 'Hunter.io',
          endpoint: 'https://api.hunter.io/v2/domain-search',
          method: 'domain'
        },
        {
          name: 'Clearbit',
          endpoint: 'https://company.clearbit.com/v2/companies/find',
          method: 'company'
        }
      ],
      
      // 4. WHOIS查询
      whois: {
        enabled: true,
        extractPatterns: ['registrant email', 'admin email', 'tech email']
      },
      
      // 5. 社交媒体足迹
      socialMedia: {
        twitter: 'site:twitter.com "{company}" email',
        facebook: 'site:facebook.com/pg/{company} contact',
      }
    };
    
    this.verificationMethods = {
      mxRecord: true,      // 检查MX记录
      syntaxCheck: true,   // 语法验证
      roleAccount: false,  // 排除角色账户（info@, admin@等）
      disposable: false    // 排除一次性邮箱
    };
  }

  /**
   * 深度分析网站，提取所有可能的联系信息
   */
  async deepWebsiteAnalysis(url) {
    console.log(`🔍 深度分析网站: ${url}`);
    const contacts = new Set();
    const websiteData = {
      url,
      companyName: '',
      industry: '',
      size: '',
      location: '',
      socialLinks: {},
      keyPeople: [],
      technologies: [],
      emails: [],
      phones: [],
      addresses: []
    };

    try {
      // 1. 爬取主页
      const mainPage = await this.scrapePage(url);
      websiteData.companyName = this.extractCompanyName(mainPage);
      
      // 2. 爬取所有重要子页面
      for (const page of this.sources.websiteScraping.pages) {
        try {
          const pageUrl = new URL(page, url).href;
          const content = await this.scrapePage(pageUrl);
          const pageEmails = this.extractEmailsFromContent(content);
          pageEmails.forEach(email => contacts.add(email));
          
          // 提取其他信息
          if (page === '/about' || page === '/team') {
            const people = this.extractKeyPeople(content);
            websiteData.keyPeople.push(...people);
          }
        } catch (err) {
          // 页面可能不存在，继续
        }
      }
      
      // 3. 提取社交媒体链接
      websiteData.socialLinks = this.extractSocialLinks(mainPage);
      
      // 4. 提取技术栈（用于个性化营销）
      websiteData.technologies = this.detectTechnologies(mainPage);
      
      // 5. 验证所有找到的邮箱
      const validEmails = await this.verifyEmails(Array.from(contacts));
      websiteData.emails = validEmails;
      
      return websiteData;
    } catch (error) {
      console.error(`网站分析失败: ${error.message}`);
      return websiteData;
    }
  }

  /**
   * 爬取单个页面
   */
  async scrapePage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`无法访问页面 ${url}: ${error.message}`);
    }
  }

  /**
   * 从内容中提取邮箱
   */
  extractEmailsFromContent(html) {
    const emails = new Set();
    const $ = cheerio.load(html);
    
    // 1. 从文本内容提取
    const text = $('body').text();
    this.sources.websiteScraping.patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const email = match.replace('mailto:', '').trim();
        if (this.isValidBusinessEmail(email)) {
          emails.add(email.toLowerCase());
        }
      });
    });
    
    // 2. 从mailto链接提取
    $('a[href^="mailto:"]').each((i, elem) => {
      const email = $(elem).attr('href').replace('mailto:', '').split('?')[0];
      if (this.isValidBusinessEmail(email)) {
        emails.add(email.toLowerCase());
      }
    });
    
    // 3. 从JavaScript中提取（有些网站用JS隐藏邮箱）
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent) {
        const emailPattern = /['"]([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})['"]/g;
        const matches = scriptContent.match(emailPattern) || [];
        matches.forEach(match => {
          const email = match.replace(/['"]/g, '');
          if (this.isValidBusinessEmail(email)) {
            emails.add(email.toLowerCase());
          }
        });
      }
    });
    
    return Array.from(emails);
  }

  /**
   * 提取公司名称
   */
  extractCompanyName(html) {
    const $ = cheerio.load(html);
    
    // 多种方式尝试提取公司名
    const possibleNames = [
      $('meta[property="og:site_name"]').attr('content'),
      $('meta[name="author"]').attr('content'),
      $('title').text().split('|')[0],
      $('h1').first().text(),
      $('.company-name').text(),
      $('.brand').text()
    ];
    
    for (const name of possibleNames) {
      if (name && name.trim().length > 0) {
        return name.trim();
      }
    }
    
    return 'Professional Organization';
  }

  /**
   * 提取关键人物信息
   */
  extractKeyPeople(html) {
    const $ = cheerio.load(html);
    const people = [];
    
    // 查找团队成员信息
    $('.team-member, .staff, .person, [class*="team"], [class*="people"]').each((i, elem) => {
      const name = $(elem).find('h3, h4, .name, .title').first().text().trim();
      const role = $(elem).find('.role, .position, .job-title').first().text().trim();
      const email = $(elem).find('a[href^="mailto:"]').attr('href')?.replace('mailto:', '');
      
      if (name) {
        people.push({
          name,
          role: role || 'Team Member',
          email: email || null
        });
      }
    });
    
    return people;
  }

  /**
   * 提取社交媒体链接
   */
  extractSocialLinks(html) {
    const $ = cheerio.load(html);
    const links = {};
    
    const socialPatterns = {
      linkedin: /linkedin\.com\/company\/([^\/\?"]+)/,
      twitter: /twitter\.com\/([^\/\?"]+)/,
      facebook: /facebook\.com\/([^\/\?"]+)/,
      instagram: /instagram\.com\/([^\/\?"]+)/,
      youtube: /youtube\.com\/(c|channel|user)\/([^\/\?"]+)/
    };
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      for (const [platform, pattern] of Object.entries(socialPatterns)) {
        if (pattern.test(href)) {
          links[platform] = href;
        }
      }
    });
    
    return links;
  }

  /**
   * 检测网站使用的技术
   */
  detectTechnologies(html) {
    const technologies = [];
    const $ = cheerio.load(html);
    
    // 检测常见技术标志
    const techSignatures = {
      'WordPress': /wp-content|wordpress/i,
      'Shopify': /shopify|myshopify/i,
      'React': /react|jsx/i,
      'Vue.js': /vue\.js|v-if|v-for/i,
      'Angular': /ng-app|angular/i,
      'Bootstrap': /bootstrap/i,
      'jQuery': /jquery/i,
      'Google Analytics': /google-analytics|gtag|ga\(/i,
      'HubSpot': /hubspot/i,
      'Salesforce': /salesforce/i
    };
    
    const fullHtml = html.toLowerCase();
    for (const [tech, pattern] of Object.entries(techSignatures)) {
      if (pattern.test(fullHtml)) {
        technologies.push(tech);
      }
    }
    
    return technologies;
  }

  /**
   * 验证邮箱有效性
   */
  async verifyEmails(emails) {
    const validEmails = [];
    
    for (const email of emails) {
      if (await this.verifyEmail(email)) {
        validEmails.push(email);
      }
    }
    
    return validEmails;
  }

  /**
   * 验证单个邮箱
   */
  async verifyEmail(email) {
    // 1. 语法检查
    if (!this.isValidBusinessEmail(email)) {
      return false;
    }
    
    // 2. 排除角色账户（如果配置）
    if (!this.verificationMethods.roleAccount) {
      const rolePatterns = ['info@', 'admin@', 'support@', 'noreply@', 'no-reply@'];
      if (rolePatterns.some(pattern => email.startsWith(pattern))) {
        return false;
      }
    }
    
    // 3. MX记录检查（简化版）
    // 实际生产环境应该使用专门的邮箱验证服务
    const domain = email.split('@')[1];
    if (domain && this.verificationMethods.mxRecord) {
      // 这里应该检查MX记录，但需要DNS查询库
      // 暂时返回true
      return true;
    }
    
    return true;
  }

  /**
   * 验证是否为商业邮箱
   */
  isValidBusinessEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // 基本格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    // 排除个人邮箱
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'aol.com', '163.com', 'qq.com', '126.com',
      'mail.com', 'protonmail.com', 'yandex.com'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    return !personalDomains.includes(domain);
  }

  /**
   * 使用搜索引擎查找邮箱（模拟）
   */
  async searchEngineEmailDiscovery(companyName, domain) {
    console.log(`🔎 搜索引擎查找 ${companyName} 的邮箱`);
    
    // 构建搜索查询
    const queries = [
      `"${companyName}" email contact`,
      `site:${domain} email`,
      `"${companyName}" "contact us" email`,
      `inurl:${domain} email`,
      `"${companyName}" CEO OR CTO OR CMO email`
    ];
    
    // 这里应该使用真实的搜索API
    // 现在返回模拟数据
    return [];
  }

  /**
   * 生成潜在邮箱模式（基于已知信息）
   */
  generateEmailPatterns(people, domain) {
    const patterns = [];
    
    for (const person of people) {
      if (person.name) {
        const nameParts = person.name.toLowerCase().split(' ');
        if (nameParts.length >= 2) {
          const first = nameParts[0];
          const last = nameParts[nameParts.length - 1];
          
          // 常见企业邮箱格式
          patterns.push(
            `${first}.${last}@${domain}`,
            `${first}${last}@${domain}`,
            `${first.charAt(0)}${last}@${domain}`,
            `${first}@${domain}`,
            `${last}@${domain}`
          );
        }
      }
    }
    
    return patterns;
  }
}

module.exports = ProfessionalEmailListBuilder;