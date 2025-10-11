const axios = require('axios');
const cheerio = require('cheerio');

class AIProspectDiscoveryEngine {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
    this.searchEngines = [];
    this.discoveredProspects = new Map();
  }

  // AI驱动的潜在客户搜索策略生成
  async generateSearchStrategy(businessAnalysis) {
    console.log('🤖 AI生成搜索策略...');
    
    const prompt = `Generate English search strategy for ${businessAnalysis.companyName} (${businessAnalysis.industry}).

Return JSON format:
{"searchQueries": ["english keyword 1", "english keyword 2", "english keyword 3"], "targetIndustries": ["industry1", "industry2"], "prospectValidationCriteria": {"mustHave": ["feature1"], "dealBreakers": ["exclude1"]}}

IMPORTANT: All keywords must be in English for Google Search API compatibility.`;

    try {
      const response = await this.callOllama(prompt);
      const strategy = this.parseOllamaResponse(response);
      console.log('✅ AI搜索策略生成完成');
      return strategy;
    } catch (error) {
      console.error('AI搜索策略生成失败:', error.message);
      return this.getBasicSearchStrategy(businessAnalysis);
    }
  }

  // 执行AI引导的真实搜索
  async executeAIGuidedSearch(searchStrategy, businessAnalysis) {
    console.log('🔍 执行AI引导的真实搜索...');
    
    const allProspects = [];
    
    for (const query of searchStrategy.searchQueries.slice(0, 3)) {
      console.log(`🔎 搜索查询: "${query}"`);
      
      try {
        // 1. 执行网络搜索
        const searchResults = await this.performWebSearch(query);
        console.log(`📊 找到 ${searchResults.length} 个搜索结果`);
        
        // 2. AI验证每个搜索结果
        for (const result of searchResults.slice(0, 10)) {
          try {
            const isValidProspect = await this.validateProspectWithAI(
              result, 
              searchStrategy, 
              businessAnalysis
            );
            
            if (isValidProspect.isValid) {
              console.log(`✅ AI验证通过: ${result.title} - ${isValidProspect.reason}`);
              
              // 3. 提取详细信息
              const detailedProspect = await this.extractProspectDetails(result, isValidProspect);
              if (detailedProspect) {
                allProspects.push(detailedProspect);
                console.log(`📋 添加潜在客户: ${detailedProspect.company} (${detailedProspect.industry})`);
              }
            } else {
              console.log(`❌ AI验证未通过: ${result.title} - ${isValidProspect.reason}`);
            }
            
            // 避免过载
            await this.sleep(500);
          } catch (error) {
            console.log(`⚠️ 验证失败: ${error.message}`);
          }
        }
        
        // 搜索间隔
        await this.sleep(2000);
      } catch (error) {
        console.log(`搜索查询失败: ${error.message}`);
      }
    }
    
    return allProspects;
  }

  // AI验证潜在客户
  async validateProspectWithAI(searchResult, searchStrategy, businessAnalysis) {
    const prompt = `Evaluate if this is a valid prospect for partnership.

Our Company: ${businessAnalysis.companyName} (${businessAnalysis.industry})

Target:
Title: ${searchResult.title}
Description: ${(searchResult.snippet || searchResult.description || '').substring(0, 200)}

JSON response:
{"isValid": true/false, "reason": "brief reason in English", "matchScore": 1-100}`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseOllamaResponse(response);
    } catch (error) {
      console.log('AI验证失败:', error.message);
      return { isValid: false, reason: 'AI validation failed' };
    }
  }

  // 提取潜在客户详细信息
  async extractProspectDetails(searchResult, aiValidation) {
    console.log(`🕷️ 提取真实网站详细信息: ${searchResult.url}`);
    
    try {
      // 只处理真实网站数据，不使用任何fallback
      const response = await axios.get(searchResult.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 提取基础信息
      const websiteContent = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        bodyText: $('body').text().trim().substring(0, 2000),
        headings: [],
        contactInfo: {
          emails: [],
          phones: []
        }
      };
      
      // 提取标题
      $('h1, h2, h3').each((i, elem) => {
        if (i < 10) websiteContent.headings.push($(elem).text().trim());
      });
      
      // 提取联系信息
      websiteContent.contactInfo.emails = this.extractEmails(response.data);
      websiteContent.contactInfo.phones = this.extractPhones(response.data);
      
      // 必须有真实邮箱地址才继续
      if (websiteContent.contactInfo.emails.length === 0) {
        console.log(`❌ 网站 ${searchResult.url} 未找到有效邮箱地址，跳过`);
        return null;
      }
      
      // AI分析网站内容
      const aiAnalysis = await this.analyzeWebsiteWithAI(websiteContent, aiValidation);
      
      if (aiAnalysis) {
        return {
          id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          company: aiAnalysis.companyName || searchResult.title,
          website: searchResult.url,
          industry: aiAnalysis.industry || aiValidation.industry,
          businessType: aiAnalysis.businessType || aiValidation.businessType,
          description: aiAnalysis.description || websiteContent.description,
          contactInfo: websiteContent.contactInfo,
          aiAnalysis: aiAnalysis,
          matchScore: aiValidation.matchScore,
          potentialValue: aiValidation.potentialValue,
          discoveredAt: new Date().toISOString(),
          source: 'real_website_extraction'
        };
      }
      
      console.log(`❌ AI分析失败，跳过网站: ${searchResult.url}`);
      return null;
      
    } catch (error) {
      console.log(`❌ 真实网站访问失败: ${searchResult.url} - ${error.message}`);
      return null; // 不使用任何fallback，直接返回null
    }
  }


  // AI分析网站内容
  async analyzeWebsiteWithAI(websiteContent, validationResult) {
    const prompt = `
分析以下网站内容，提取关键业务信息：

网站标题：${websiteContent.title}
描述：${websiteContent.description}
主要标题：${websiteContent.headings.join(', ')}
内容摘要：${websiteContent.bodyText.substring(0, 500)}...

已知信息：
- 业务类型：${validationResult.businessType}
- 行业：${validationResult.industry}
- 匹配评分：${validationResult.matchScore}

请返回JSON格式的详细分析：
{
  "companyName": "公司名称",
  "industry": "具体行业分类",
  "businessType": "业务类型",
  "description": "公司业务描述",
  "mainProducts": ["主要产品/服务"],
  "targetMarket": ["目标市场"],
  "companySize": "small/medium/large",
  "keyStrengths": ["主要优势"],
  "painPoints": ["可能的痛点"],
  "decisionMakers": ["可能的决策者角色"],
  "contactPreference": "preferred contact method",
  "bestApproach": "建议的接触方式"
}
`;

    try {
      const response = await this.callOllama(prompt);
      return this.parseOllamaResponse(response);
    } catch (error) {
      console.log('AI网站分析失败:', error.message);
      return null;
    }
  }

  // 执行网络搜索
  async performWebSearch(query) {
    const results = [];
    
    // 优先使用免费搜索API
    console.log(`🔍 免费搜索方法1: SerpAPI搜索...`);
    const serpApiResults = await this.searchSerpAPI(query);
    results.push(...serpApiResults);
    
    console.log(`🔍 免费搜索方法2: Bing免费API...`);
    const bingFreeResults = await this.searchBingFree(query);
    results.push(...bingFreeResults);
    
    console.log(`🔍 免费搜索方法3: SearchAPI.io...`);
    const searchApiResults = await this.searchSearchAPI(query);
    results.push(...searchApiResults);
    
    console.log(`🔍 免费搜索方法4: Google Custom Search...`);
    const googleResults = await this.searchGoogle(query);
    results.push(...googleResults);
    
    // 如果免费API结果不够，使用付费中国API
    if (results.length < 3) {
      console.log(`🔍 付费搜索方法5: 企查查API...`);
      const qichachaResults = await this.searchQichacha(query);
      results.push(...qichachaResults);
      
      console.log(`🔍 付费搜索方法6: 百度搜索API...`);
      const baiduResults = await this.searchBaidu(query);
      results.push(...baiduResults);
      
      console.log(`🔍 付费搜索方法7: 脉脉API...`);
      const maimaResults = await this.searchMaima(query);
      results.push(...maimaResults);
    }
    
    // 最后备用：直接网页抓取
    if (results.length < 2) {
      console.log(`🔍 备用搜索方法8: DuckDuckGo直接抓取...`);
      const duckduckgoResults = await this.searchDuckDuckGo(query);
      results.push(...duckduckgoResults);
      
      console.log(`🔍 备用搜索方法9: Bing直接抓取...`);
      const bingResults = await this.searchBing(query);
      results.push(...bingResults);
    }
    
    if (results.length === 0) {
      throw new Error(`真实搜索失败: 查询 "${query}" 未找到任何结果。请检查网络连接或搜索配置。`);
    }
    
    return results.slice(0, 15); // 限制结果数量
  }

  // SerpAPI (免费100次/月)
  async searchSerpAPI(query) {
    const results = [];
    
    try {
      const apiKey = process.env.SERPAPI_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ SerpAPI未配置，跳过`);
        return results;
      }
      
      // SerpAPI Google搜索
      const searchUrl = `https://serpapi.com/search.json`;
      
      const response = await axios.get(searchUrl, {
        params: {
          engine: 'google',
          q: query,
          api_key: apiKey,
          num: 10,
          hl: 'en'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.organic_results) {
        response.data.organic_results.forEach((result, i) => {
          if (i < 10 && this.isValidBusinessUrl(result.link)) {
            results.push({
              title: result.title,
              url: result.link,
              snippet: result.snippet || '',
              source: 'serpapi_free'
            });
          }
        });
      }
      
      console.log(`✅ SerpAPI找到 ${results.length} 个免费结果`);
      
    } catch (error) {
      console.log(`❌ SerpAPI搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // Bing免费API (1000次/月)
  async searchBingFree(query) {
    const results = [];
    
    try {
      const apiKey = process.env.BING_SEARCH_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ Bing免费API未配置，跳过`);
        return results;
      }
      
      // Bing Web Search API
      const searchUrl = `https://api.bing.microsoft.com/v7.0/search`;
      
      const response = await axios.get(searchUrl, {
        params: {
          q: query,
          count: 10,
          offset: 0,
          mkt: 'en-US',
          safesearch: 'moderate'
        },
        timeout: 15000,
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'X-MSEdge-ClientID': 'unique-client-id',
          'User-Agent': 'Mozilla/5.0 (compatible; BingBot/2.0)'
        }
      });
      
      if (response.data && response.data.webPages && response.data.webPages.value) {
        response.data.webPages.value.forEach((result, i) => {
          if (i < 10 && this.isValidBusinessUrl(result.url)) {
            results.push({
              title: result.name,
              url: result.url,
              snippet: result.snippet || '',
              source: 'bing_free_api'
            });
          }
        });
      }
      
      console.log(`✅ Bing免费API找到 ${results.length} 个结果`);
      
    } catch (error) {
      console.log(`❌ Bing免费API搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // SearchAPI.io (免费100次/月)
  async searchSearchAPI(query) {
    const results = [];
    
    try {
      const apiKey = process.env.SEARCHAPI_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ SearchAPI.io未配置，跳过`);
        return results;
      }
      
      // SearchAPI.io Google搜索
      const searchUrl = `https://www.searchapi.io/api/v1/search`;
      
      const response = await axios.get(searchUrl, {
        params: {
          engine: 'google',
          q: query,
          api_key: apiKey,
          num: 10
        },
        timeout: 15000
      });
      
      if (response.data && response.data.organic_results) {
        response.data.organic_results.forEach((result, i) => {
          if (i < 10 && this.isValidBusinessUrl(result.link)) {
            results.push({
              title: result.title,
              url: result.link,
              snippet: result.snippet || '',
              source: 'searchapi_free'
            });
          }
        });
      }
      
      console.log(`✅ SearchAPI.io找到 ${results.length} 个免费结果`);
      
    } catch (error) {
      console.log(`❌ SearchAPI.io搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 真实DuckDuckGo搜索
  async searchDuckDuckGo(query) {
    const results = [];
    
    try {
      // 使用DuckDuckGo的真实搜索
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=us-en`;
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 提取DuckDuckGo搜索结果
      $('.result__a').each((i, elem) => {
        if (i < 10) {
          const href = $(elem).attr('href');
          const title = $(elem).text().trim();
          const snippet = $(elem).closest('.result').find('.result__snippet').text().trim();
          
          if (href && title && this.isValidBusinessUrl(href)) {
            results.push({
              title: title,
              url: href.startsWith('http') ? href : `https://${href}`,
              snippet: snippet,
              source: 'duckduckgo_real'
            });
          }
        }
      });
      
      console.log(`✅ DuckDuckGo找到 ${results.length} 个真实结果`);
      
    } catch (error) {
      console.log(`❌ DuckDuckGo搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 真实Bing搜索
  async searchBing(query) {
    const results = [];
    
    try {
      // 使用Bing的真实搜索
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`;
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 提取Bing搜索结果
      $('.b_algo h2 a').each((i, elem) => {
        if (i < 10) {
          const href = $(elem).attr('href');
          const title = $(elem).text().trim();
          const snippet = $(elem).closest('.b_algo').find('.b_caption p').text().trim();
          
          if (href && title && this.isValidBusinessUrl(href)) {
            results.push({
              title: title,
              url: href,
              snippet: snippet,
              source: 'bing_real'
            });
          }
        }
      });
      
      console.log(`✅ Bing找到 ${results.length} 个真实结果`);
      
    } catch (error) {
      console.log(`❌ Bing搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 百度搜索API (中国企业搜索)
  async searchBaidu(query) {
    const results = [];
    
    try {
      const apiKey = process.env.BAIDU_SEARCH_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ 百度搜索API未配置，跳过`);
        return results;
      }
      
      // 百度自定义搜索API
      const searchUrl = `https://aip.baidubce.com/rest/2.0/knowledge/v1/search?access_token=${apiKey}`;
      
      const response = await axios.post(searchUrl, {
        query: query,
        rn: 10 // 返回结果数量
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.result) {
        response.data.result.forEach((item, i) => {
          if (i < 10 && this.isValidBusinessUrl(item.url)) {
            results.push({
              title: item.title,
              url: item.url,
              snippet: item.summary || '',
              source: 'baidu_real'
            });
          }
        });
      }
      
      console.log(`✅ 百度找到 ${results.length} 个真实结果`);
      
    } catch (error) {
      console.log(`❌ 百度搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 企查查API (中国企业数据库)
  async searchQichacha(query) {
    const results = [];
    
    try {
      const apiKey = process.env.QICHACHA_API_KEY;
      const secretKey = process.env.QICHACHA_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        console.log(`⚠️ 企查查API未配置，跳过`);
        return results;
      }
      
      // 企查查企业搜索API
      const searchUrl = `http://api.qichacha.com/ECIV4/Search`;
      
      const params = {
        key: apiKey,
        keyword: query,
        pageIndex: 1,
        pageSize: 10
      };
      
      const response = await axios.get(searchUrl, {
        params: params,
        timeout: 10000,
        headers: {
          'Token': secretKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.Result) {
        response.data.Result.forEach((company, i) => {
          if (i < 10 && company.Website) {
            results.push({
              title: `${company.Name} - ${company.Industry || ''}`,
              url: company.Website.startsWith('http') ? company.Website : `https://${company.Website}`,
              snippet: `${company.Name} - 注册资本: ${company.RegistCapi || 'N/A'}, 法人: ${company.OperName || 'N/A'}, 状态: ${company.Status || 'N/A'}`,
              source: 'qichacha_real',
              companyInfo: {
                name: company.Name,
                industry: company.Industry,
                registeredCapital: company.RegistCapi,
                legalPerson: company.OperName,
                status: company.Status,
                address: company.Address,
                creditCode: company.CreditCode
              }
            });
          }
        });
      }
      
      console.log(`✅ 企查查找到 ${results.length} 个真实企业`);
      
    } catch (error) {
      console.log(`❌ 企查查搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 真实Google搜索 (保留作为备用)
  async searchGoogle(query) {
    const results = [];
    
    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        console.log(`⚠️ Google搜索API未配置，跳过`);
        return results;
      }
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000
      });
      
      if (response.data && response.data.items) {
        response.data.items.forEach((item, i) => {
          if (i < 10 && this.isValidBusinessUrl(item.link)) {
            results.push({
              title: item.title,
              url: item.link,
              snippet: item.snippet || '',
              source: 'google_real'
            });
          }
        });
      }
      
      console.log(`✅ Google找到 ${results.length} 个真实结果`);
      
    } catch (error) {
      console.log(`❌ Google搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 脉脉API (中国职业社交平台 - 人员联系方式)
  async searchMaima(query) {
    const results = [];
    
    try {
      const apiKey = process.env.MAIMA_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ 脉脉API未配置，跳过`);
        return results;
      }
      
      // 脉脉企业人员搜索API
      const searchUrl = `https://api.maimai.cn/api/v1/contact/search`;
      
      const response = await axios.post(searchUrl, {
        keyword: query,
        type: 'company_people',
        page: 1,
        size: 10
      }, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data && response.data.data.list) {
        response.data.data.list.forEach((person, i) => {
          if (i < 10 && person.company && person.contact_info) {
            results.push({
              title: `${person.name} - ${person.position || ''} at ${person.company}`,
              url: person.company_website || `https://${person.company.toLowerCase().replace(/\s+/g, '')}.com`,
              snippet: `${person.name} (${person.position || '职位未知'}) - ${person.company}, 经验: ${person.experience || 'N/A'}, 教育: ${person.education || 'N/A'}`,
              source: 'maima_people',
              contactInfo: {
                emails: person.contact_info.email ? [person.contact_info.email] : [],
                phones: person.contact_info.phone ? [person.contact_info.phone] : [],
                wechat: person.contact_info.wechat || '',
                linkedin: person.contact_info.linkedin || ''
              },
              personInfo: {
                name: person.name,
                position: person.position,
                company: person.company,
                experience: person.experience,
                education: person.education,
                location: person.location,
                industry: person.industry
              }
            });
          }
        });
      }
      
      console.log(`✅ 脉脉找到 ${results.length} 个人员联系方式`);
      
    } catch (error) {
      console.log(`❌ 脉脉搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // 猎聘API (中国招聘平台 - 人员联系方式)
  async searchLiepin(query) {
    const results = [];
    
    try {
      const apiKey = process.env.LIEPIN_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ 猎聘API未配置，跳过`);
        return results;
      }
      
      // 猎聘企业人员搜索API
      const searchUrl = `https://api.liepin.com/api/com.liepin.searchapi.search-person`;
      
      const response = await axios.post(searchUrl, {
        keyword: query,
        pubTime: '',
        compId: '',
        industry: '',
        dq: '',
        currentPage: 1,
        pageSize: 10
      }, {
        timeout: 10000,
        headers: {
          'X-Client-Type': 'WEB',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data && response.data.data.personList) {
        response.data.data.personList.forEach((person, i) => {
          if (i < 10 && person.companyName) {
            results.push({
              title: `${person.personName} - ${person.positionName || ''} at ${person.companyName}`,
              url: person.companyHomepage || `https://${person.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
              snippet: `${person.personName} (${person.positionName || '职位未知'}) - ${person.companyName}, 薪资: ${person.salary || 'N/A'}, 经验: ${person.workYear || 'N/A'}年`,
              source: 'liepin_people',
              contactInfo: {
                emails: person.email ? [person.email] : [],
                phones: person.mobile ? [person.mobile] : []
              },
              personInfo: {
                name: person.personName,
                position: person.positionName,
                company: person.companyName,
                salary: person.salary,
                workYear: person.workYear,
                degree: person.degree,
                location: person.dq,
                industry: person.industryName
              }
            });
          }
        });
      }
      
      console.log(`✅ 猎聘找到 ${results.length} 个人员联系方式`);
      
    } catch (error) {
      console.log(`❌ 猎聘搜索失败: ${error.message}`);
    }
    
    return results;
  }

  // BOSS直聘API (中国招聘平台 - 人员联系方式)
  async searchBosszhipin(query) {
    const results = [];
    
    try {
      const apiKey = process.env.BOSSZHIPIN_API_KEY;
      
      if (!apiKey) {
        console.log(`⚠️ BOSS直聘API未配置，跳过`);
        return results;
      }
      
      // BOSS直聘企业人员搜索API
      const searchUrl = `https://www.zhipin.com/wapi/zpgeek/search/joblist.json`;
      
      const response = await axios.get(searchUrl, {
        params: {
          scene: 1,
          query: query,
          city: 101010100, // 北京
          experience: '',
          payType: '',
          partTime: '',
          degree: '',
          industry: '',
          scale: '',
          stage: '',
          position: '',
          jobType: '',
          salary: '',
          multiBusinessDistrict: '',
          page: 1,
          pageSize: 10
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Authorization': apiKey,
          'Referer': 'https://www.zhipin.com/'
        }
      });
      
      if (response.data && response.data.zpData && response.data.zpData.jobList) {
        response.data.zpData.jobList.forEach((job, i) => {
          if (i < 10 && job.brandName && job.bossInfo) {
            results.push({
              title: `${job.bossInfo.name} - ${job.jobName} at ${job.brandName}`,
              url: job.brandHomepage || `https://${job.brandName.toLowerCase().replace(/\s+/g, '')}.com`,
              snippet: `${job.bossInfo.name} (${job.bossInfo.title || 'HR'}) - ${job.brandName}, 职位: ${job.jobName}, 薪资: ${job.salaryDesc}`,
              source: 'bosszhipin_people',
              contactInfo: {
                emails: [], // BOSS直聘通常不直接提供邮箱
                phones: []  // 需要通过内部消息系统
              },
              personInfo: {
                name: job.bossInfo.name,
                position: job.bossInfo.title,
                company: job.brandName,
                jobTitle: job.jobName,
                salary: job.salaryDesc,
                location: job.cityName,
                industry: job.brandIndustry
              }
            });
          }
        });
      }
      
      console.log(`✅ BOSS直聘找到 ${results.length} 个人员信息`);
      
    } catch (error) {
      console.log(`❌ BOSS直聘搜索失败: ${error.message}`);
    }
    
    return results;
  }


  // 调用Ollama模型
  async callOllama(prompt) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
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
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果没有找到JSON，尝试解析文本
      console.log('无法解析JSON响应，使用文本解析');
      return { parsed: false, rawResponse: response };
    } catch (error) {
      console.log('响应解析失败:', error.message);
      return { parsed: false, rawResponse: response, error: error.message };
    }
  }

  // 判断有效的业务URL
  isValidBusinessUrl(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // 排除搜索引擎和社交媒体
      const excludeDomains = [
        'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
        'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
        'youtube.com', 'tiktok.com', 'pinterest.com',
        'wikipedia.org', 'reddit.com'
      ];
      
      return !excludeDomains.some(excluded => domain.includes(excluded)) &&
             (domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.net'));
    } catch {
      return false;
    }
  }

  // 提取邮箱
  extractEmails(html) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];
    
    return [...new Set(emails)]
      .filter(email => !email.includes('example.com') && !email.includes('test.com'))
      .slice(0, 3);
  }

  // 提取电话
  extractPhones(html) {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = html.match(phoneRegex) || [];
    return [...new Set(phones)].slice(0, 2);
  }

  // 获取基础搜索策略（降级方案）
  getBasicSearchStrategy(businessAnalysis) {
    return {
      searchQueries: [
        `${businessAnalysis.industry} companies contact`,
        `${businessAnalysis.mainProducts?.[0]} services business directory`,
        `${businessAnalysis.targetMarket?.[0]} companies email`
      ],
      targetIndustries: [businessAnalysis.industry],
      idealCompanyTypes: ['SME', 'Growing companies'],
      searchRegions: ['United States'],
      businessSize: ['medium', 'large'],
      excludeKeywords: ['jobs', 'recruitment', 'personal'],
      prospectValidationCriteria: {
        mustHave: ['business website', 'contact information'],
        niceToHave: ['established company', 'growth potential'],
        dealBreakers: ['competitor', 'inappropriate industry']
      }
    };
  }

  // 工具函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取统计信息
  getDiscoveryStats() {
    return {
      totalProspects: this.discoveredProspects.size,
      searchQueries: this.searchQueries || 0,
      aiValidations: this.validationCount || 0,
      lastDiscovery: new Date().toISOString()
    };
  }
}

module.exports = AIProspectDiscoveryEngine;