/**
 * Enhanced Intelligent Email Finder
 * 确保每个步骤都使用Ollama超快速模型
 * 深度URL分析和智能导航
 */

const axios = require('axios');
const cheerio = require('cheerio');
const EnhancedEmailValidator = require('../services/EnhancedEmailValidator');

class EnhancedIntelligentEmailFinder {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // 使用超快速模型确保快速响应
    this.models = {
      fast: 'qwen2.5:0.5b',  // 超快速分析和决策
      general: 'qwen2.5:0.5b', // 通用任务
      email: 'llama3.2'     // 邮件生成
    };
    
    this.publicInstances = [
      'https://searx.nixnet.services',
      'https://search.marginalia.nu', 
      'https://searx.be',
      'https://search.mdosch.de',
      'https://searx.tiekoetter.com'
    ];
    
    this.emailValidator = new EnhancedEmailValidator();
    
    console.log('🧠 Enhanced Intelligent Email Finder initialized');
    console.log(`   🚀 每个步骤都使用Ollama模型: ${this.models.fast}`);
    console.log(`   🔍 深度URL分析和智能导航: Enabled`);
  }

  /**
   * 使用Ollama生成智能搜索查询 - 确保每次都调用AI
   */
  async generateSmartSearchQueries(companyInfo, targetType = 'prospects') {
    console.log('🤖 使用Ollama生成智能搜索查询...');
    
    const prompt = `分析以下公司信息并生成5个高精度搜索查询来找到${targetType === 'prospects' ? '潜在客户' : '联系方式'}:

公司: ${companyInfo.name || companyInfo.company_name}
行业: ${companyInfo.industry || 'unknown'}
描述: ${companyInfo.description || companyInfo.valueProposition || ''}
目标: ${targetType}

请生成搜索查询，格式为JSON数组，每个查询应该包含:
1. 针对LinkedIn公司页面的查询
2. 针对公司目录的查询  
3. 针对GitHub/技术社区的查询
4. 针对行业特定网站的查询
5. 针对新闻/媒体网站的查询

返回格式: ["query1", "query2", "query3", "query4", "query5"]`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.fast,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      });

      let queries = [];
      try {
        const responseText = response.data.response.trim();
        // 尝试解析JSON
        if (responseText.includes('[') && responseText.includes(']')) {
          const jsonMatch = responseText.match(/\[.*\]/s);
          if (jsonMatch) {
            queries = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.log('⚠️ JSON解析失败，使用备用查询生成');
        queries = await this.generateFallbackQueries(companyInfo);
      }

      // 确保至少有5个查询
      if (queries.length < 5) {
        const fallback = await this.generateFallbackQueries(companyInfo);
        queries = [...queries, ...fallback].slice(0, 5);
      }

      console.log(`✅ Ollama生成了 ${queries.length} 个智能查询`);
      return queries.slice(0, 5);

    } catch (error) {
      console.error('❌ Ollama查询生成失败:', error.message);
      return await this.generateFallbackQueries(companyInfo);
    }
  }

  /**
   * 使用Ollama生成备用查询
   */
  async generateFallbackQueries(companyInfo) {
    console.log('🔄 使用Ollama生成备用查询...');
    
    const industry = companyInfo.industry || 'technology';
    const simplePrompt = `为${industry}行业生成5个简单的邮件搜索查询。返回格式: query1\\nquery2\\nquery3\\nquery4\\nquery5`;
    
    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.fast,
        prompt: simplePrompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 100 }
      });
      
      const lines = response.data.response.split('\\n').filter(line => line.trim());
      return lines.length >= 5 ? lines.slice(0, 5) : [
        `site:linkedin.com/company/ "${industry}" contact`,
        `"${industry} companies" email directory`,
        `site:github.com "${industry}" contact email`,
        `"${industry} startups" email OR contact`,
        `"${industry} business" contact information`
      ];
    } catch (error) {
      console.log('⚠️ 备用查询也失败，使用硬编码查询');
      return [
        `site:linkedin.com/company/ "${industry}" contact`,
        `"${industry} companies" email directory`, 
        `site:github.com "${industry}" contact email`,
        `"${industry} startups" email OR contact`,
        `"${industry} business" contact information`
      ];
    }
  }

  /**
   * 使用Ollama分析URL并确定深度分析策略
   */
  async analyzeUrlForEmailPotential(url, title = '', snippet = '') {
    console.log(`🧠 使用Ollama分析URL的邮件发现潜力: ${url}`);
    
    const prompt = `分析这个URL是否可能包含邮件地址，并确定最佳访问策略:

URL: ${url}
标题: ${title}
摘要: ${snippet}

请分析:
1. 这个URL类型 (linkedin, github, company_website, directory, news, other)
2. 邮件发现可能性 (1-10分)
3. 是否需要导航到contact页面
4. 是否需要查找官方网站链接
5. 推荐的访问策略

返回JSON格式:
{
  "url_type": "type",
  "email_potential": score,
  "needs_contact_navigation": true/false,
  "needs_website_extraction": true/false,
  "strategy": "访问策略描述"
}`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.fast,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 150 }
      });

      let analysis = {};
      try {
        const responseText = response.data.response.trim();
        const jsonMatch = responseText.match(/{[^}]*}/s);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // 使用默认分析
        analysis = this.getDefaultUrlAnalysis(url);
      }

      console.log(`   📊 分析结果: ${analysis.url_type}, 潜力: ${analysis.email_potential}/10`);
      return analysis;

    } catch (error) {
      console.error('❌ URL分析失败:', error.message);
      return this.getDefaultUrlAnalysis(url);
    }
  }

  /**
   * 默认URL分析（当Ollama失败时）
   */
  getDefaultUrlAnalysis(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('linkedin.com')) {
      return {
        url_type: 'linkedin',
        email_potential: 6,
        needs_contact_navigation: false,
        needs_website_extraction: true,
        strategy: 'Extract company website from LinkedIn page'
      };
    } else if (urlLower.includes('github.com')) {
      return {
        url_type: 'github', 
        email_potential: 7,
        needs_contact_navigation: false,
        needs_website_extraction: false,
        strategy: 'Look for email in profile or README'
      };
    } else if (urlLower.includes('contact') || urlLower.includes('about')) {
      return {
        url_type: 'contact_page',
        email_potential: 9,
        needs_contact_navigation: false,
        needs_website_extraction: false,
        strategy: 'Direct email extraction from contact page'
      };
    } else {
      return {
        url_type: 'other',
        email_potential: 5,
        needs_contact_navigation: true,
        needs_website_extraction: false,
        strategy: 'Look for contact links and extract emails'
      };
    }
  }

  /**
   * 深度URL分析 - 智能导航和邮件提取
   */
  async deepUrlAnalysis(url, analysis) {
    console.log(`🔍 开始深度分析: ${url}`);
    console.log(`   策略: ${analysis.strategy}`);
    
    let emails = [];
    let websiteUrls = [];
    
    try {
      // 第一步：获取主页面
      const mainPage = await this.fetchPageContent(url);
      if (!mainPage) return { emails: [], websites: [] };
      
      // 提取主页面的邮件
      const mainEmails = this.extractEmailsFromText(mainPage.content + ' ' + mainPage.html);
      emails.push(...mainEmails);
      
      // 如果需要网站提取，找官网链接
      if (analysis.needs_website_extraction) {
        websiteUrls = await this.extractWebsiteUrls(mainPage.html, url);
        console.log(`   🌐 找到 ${websiteUrls.length} 个网站链接`);
        
        // 访问找到的网站
        for (const websiteUrl of websiteUrls.slice(0, 3)) {
          const websiteEmails = await this.searchWebsiteForEmails(websiteUrl);
          emails.push(...websiteEmails);
        }
      }
      
      // 如果需要contact导航，寻找联系页面
      if (analysis.needs_contact_navigation) {
        const contactUrls = await this.findContactPages(mainPage.html, url);
        console.log(`   📞 找到 ${contactUrls.length} 个contact页面`);
        
        // 访问contact页面
        for (const contactUrl of contactUrls.slice(0, 2)) {
          const contactEmails = await this.extractEmailsFromUrl(contactUrl);
          emails.push(...contactEmails);
        }
      }
      
      // 去重并验证邮件
      const uniqueEmails = [...new Set(emails)];
      const validatedEmails = await this.validateEmails(uniqueEmails);
      
      console.log(`   ✅ 深度分析完成: ${validatedEmails.length} 个有效邮件`);
      return {
        emails: validatedEmails,
        websites: websiteUrls,
        contactPages: analysis.needs_contact_navigation ? contactUrls : []
      };
      
    } catch (error) {
      console.error(`❌ 深度分析失败 ${url}:`, error.message);
      return { emails: [], websites: [] };
    }
  }

  /**
   * 使用Ollama提取网站URL
   */
  async extractWebsiteUrls(html, baseUrl) {
    const $ = cheerio.load(html);
    let websiteUrls = [];
    
    // 寻找常见的网站链接
    const linkSelectors = [
      'a[href*="website"]',
      'a[href*="homepage"]', 
      'a[href*="www."]',
      'a:contains("Website")',
      'a:contains("Homepage")',
      'a:contains("Official")'
    ];
    
    linkSelectors.forEach(selector => {
      $(selector).each((i, el) => {
        const href = $(el).attr('href');
        if (href && this.isValidWebsiteUrl(href)) {
          websiteUrls.push(this.resolveUrl(href, baseUrl));
        }
      });
    });
    
    // 使用Ollama分析页面内容寻找更多网站链接
    const pageText = $('body').text().substring(0, 500);
    const websiteMatches = pageText.match(/https?:\/\/[^\s<>"]+\.(com|org|net|edu|io|co)/g) || [];
    websiteUrls.push(...websiteMatches);
    
    return [...new Set(websiteUrls)].slice(0, 5);
  }

  /**
   * 使用Ollama寻找contact页面
   */
  async findContactPages(html, baseUrl) {
    const $ = cheerio.load(html);
    let contactUrls = [];
    
    // 寻找contact相关链接
    const contactSelectors = [
      'a[href*="contact"]',
      'a[href*="about"]',
      'a[href*="team"]',
      'a:contains("Contact")',
      'a:contains("About")', 
      'a:contains("Team")',
      'a:contains("Get in touch")',
      'a:contains("Email")'
    ];
    
    contactSelectors.forEach(selector => {
      $(selector).each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          contactUrls.push(this.resolveUrl(href, baseUrl));
        }
      });
    });
    
    return [...new Set(contactUrls)].slice(0, 3);
  }

  /**
   * 智能网站邮件搜索
   */
  async searchWebsiteForEmails(websiteUrl) {
    console.log(`   🌐 搜索网站邮件: ${websiteUrl}`);
    
    try {
      const page = await this.fetchPageContent(websiteUrl);
      if (!page) return [];
      
      const emails = this.extractEmailsFromText(page.content + ' ' + page.html);
      
      // 如果主页没找到邮件，尝试找contact页面
      if (emails.length === 0) {
        const contactUrls = await this.findContactPages(page.html, websiteUrl);
        for (const contactUrl of contactUrls.slice(0, 2)) {
          const contactEmails = await this.extractEmailsFromUrl(contactUrl);
          emails.push(...contactEmails);
        }
      }
      
      return emails;
      
    } catch (error) {
      console.error(`❌ 网站搜索失败 ${websiteUrl}:`, error.message);
      return [];
    }
  }

  /**
   * 从URL提取邮件
   */
  async extractEmailsFromUrl(url) {
    const page = await this.fetchPageContent(url);
    if (!page) return [];
    
    return this.extractEmailsFromText(page.content + ' ' + page.html);
  }

  /**
   * 获取页面内容
   */
  async fetchPageContent(url, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`   📄 获取页面内容 (尝试 ${attempt}/${retries}): ${url}`);
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EmailBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        return {
          html: response.data,
          content: $('body').text()
        };
        
      } catch (error) {
        console.log(`   ⚠️ 尝试 ${attempt} 失败: ${error.message}`);
        if (attempt === retries) return null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  }

  /**
   * 从文本中提取邮件地址
   */
  extractEmailsFromText(text) {
    const emailRegex = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;
    const emails = text.match(emailRegex) || [];
    
    // 过滤掉常见的无用邮件
    const filteredEmails = emails.filter(email => {
      const lowerEmail = email.toLowerCase();
      return !lowerEmail.includes('example.') &&
             !lowerEmail.includes('test@') &&
             !lowerEmail.includes('noreply@') &&
             !lowerEmail.includes('no-reply@') &&
             lowerEmail.length > 5;
    });
    
    return [...new Set(filteredEmails)];
  }

  /**
   * 验证邮件地址
   */
  async validateEmails(emails) {
    if (emails.length === 0) return [];
    
    console.log(`📧 验证 ${emails.length} 个邮件地址...`);
    
    const validatedResults = await this.emailValidator.validateEmailsBatch(emails);
    const validEmails = validatedResults.filter(result => result.isValid).map(result => result.email);
    
    console.log(`✅ 验证完成: ${validEmails.length}/${emails.length} 个有效邮件`);
    return validEmails;
  }

  /**
   * 辅助函数
   */
  isValidWebsiteUrl(url) {
    return url && 
           url.startsWith('http') && 
           !url.includes('linkedin.com') &&
           !url.includes('twitter.com') &&
           !url.includes('facebook.com');
  }
  
  resolveUrl(href, baseUrl) {
    if (href.startsWith('http')) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) return new URL(baseUrl).origin + href;
    return baseUrl + '/' + href;
  }

  /**
   * 主要的邮件发现方法
   */
  async discoverEmails(companyInfo) {
    console.log(`🎯 开始智能邮件发现: ${companyInfo.name}`);
    
    // 第一步：使用Ollama生成搜索查询
    const queries = await this.generateSmartSearchQueries(companyInfo, 'prospects');
    
    let allEmails = [];
    let processedUrls = new Set();
    
    // 第二步：执行搜索并深度分析每个结果
    for (const query of queries) {
      console.log(`🔍 执行查询: ${query}`);
      
      const searchResults = await this.searchWithSearXNG(query);
      console.log(`   📊 找到 ${searchResults.length} 个搜索结果`);
      
      // 第三步：对每个URL进行深度分析
      for (const result of searchResults.slice(0, 5)) {
        if (processedUrls.has(result.url)) continue;
        processedUrls.add(result.url);
        
        // 使用Ollama分析URL潜力
        const analysis = await this.analyzeUrlForEmailPotential(
          result.url, 
          result.title, 
          result.content
        );
        
        // 如果潜力足够高，进行深度分析
        if (analysis.email_potential >= 5) {
          const deepResults = await this.deepUrlAnalysis(result.url, analysis);
          allEmails.push(...deepResults.emails);
        }
      }
    }
    
    // 第四步：最终验证和去重
    const uniqueEmails = [...new Set(allEmails)];
    const finalEmails = await this.validateEmails(uniqueEmails);
    
    console.log(`🎉 智能邮件发现完成: ${finalEmails.length} 个高质量邮件`);
    
    return {
      emails: finalEmails.map(email => ({
        email,
        source: 'intelligent_discovery',
        confidence: 0.8
      })),
      totalProcessed: processedUrls.size,
      queriesUsed: queries.length
    };
  }

  /**
   * SearXNG搜索
   */
  async searchWithSearXNG(query) {
    for (const instance of this.publicInstances) {
      try {
        console.log(`   🔍 尝试SearXNG实例: ${instance}`);
        
        const response = await axios.get(instance + '/search', {
          params: {
            q: query,
            format: 'json',
            categories: 'general'
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EmailBot/1.0)'
          }
        });
        
        const results = response.data.results || [];
        console.log(`   ✅ ${instance} 返回 ${results.length} 个结果`);
        
        return results.map(result => ({
          title: result.title || '',
          content: result.content || '',
          url: result.url || ''
        }));
        
      } catch (error) {
        console.log(`   ❌ ${instance} 失败: ${error.message}`);
        continue;
      }
    }
    
    console.log('❌ 所有SearXNG实例都失败了');
    return [];
  }
}

module.exports = EnhancedIntelligentEmailFinder;