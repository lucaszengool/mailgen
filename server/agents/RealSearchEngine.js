const axios = require('axios');
const cheerio = require('cheerio');

class RealSearchEngine {
  constructor() {
    // 配置真实搜索API
    this.searchConfigs = {
      // Google Custom Search API (需要API key)
      google: {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY,
        searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
        baseUrl: 'https://www.googleapis.com/customsearch/v1'
      },
      
      // Bing Search API (需要API key) 
      bing: {
        apiKey: process.env.BING_SEARCH_API_KEY,
        baseUrl: 'https://api.bing.microsoft.com/v7.0/search'
      },
      
      // DuckDuckGo (免费但有限制)
      duckduckgo: {
        baseUrl: 'https://api.duckduckgo.com/'
      }
    };
    
    // 商业目录API配置
    this.businessDirectories = {
      // Yelp Fusion API
      yelp: {
        apiKey: process.env.YELP_API_KEY,
        baseUrl: 'https://api.yelp.com/v3'
      },
      
      // Google Places API
      googlePlaces: {
        apiKey: process.env.GOOGLE_PLACES_API_KEY,
        baseUrl: 'https://maps.googleapis.com/maps/api/place'
      }
    };
  }

  // 执行真实的企业搜索
  async searchBusinesses(query, industry, location = 'United States') {
    console.log(`🔍 真实搜索企业: "${query}" (${industry}) in ${location}`);
    
    const allResults = [];
    
    try {
      // 1. 使用Google Custom Search
      if (this.searchConfigs.google.apiKey) {
        console.log('📡 使用Google Custom Search API...');
        const googleResults = await this.searchWithGoogle(query, industry);
        allResults.push(...googleResults);
      }
      
      // 2. 使用Yelp Business Search
      if (this.businessDirectories.yelp.apiKey) {
        console.log('📡 使用Yelp Business API...');
        const yelpResults = await this.searchYelp(query, industry, location);
        allResults.push(...yelpResults);
      }
      
      // 3. 使用Google Places API
      if (this.businessDirectories.googlePlaces.apiKey) {
        console.log('📡 使用Google Places API...');
        const placesResults = await this.searchGooglePlaces(query, industry, location);
        allResults.push(...placesResults);
      }
      
      // 4. 如果没有API key，使用Web Scraping（备用方案）
      if (allResults.length === 0) {
        console.log('⚠️ 无API key，使用网页抓取...');
        const scrapingResults = await this.searchWithScraping(query, industry);
        allResults.push(...scrapingResults);
      }
      
      // 去重和排序
      const uniqueResults = this.deduplicateResults(allResults);
      console.log(`✅ 搜索完成，找到 ${uniqueResults.length} 个结果`);
      
      return uniqueResults;
      
    } catch (error) {
      console.error('企业搜索失败:', error.message);
      return [];
    }
  }

  // Google Custom Search
  async searchWithGoogle(query, industry) {
    try {
      const searchQuery = `${query} ${industry} business contact email`;
      const url = `${this.searchConfigs.google.baseUrl}?key=${this.searchConfigs.google.apiKey}&cx=${this.searchConfigs.google.searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=10`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.items) {
        return response.data.items.map(item => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          source: 'google_search',
          industry: industry,
          relevanceScore: this.calculateRelevanceScore(item.title + ' ' + item.snippet, query, industry)
        }));
      }
      
    } catch (error) {
      console.log('Google搜索失败:', error.message);
    }
    
    return [];
  }

  // Yelp Business Search
  async searchYelp(query, industry, location) {
    try {
      const categories = this.getYelpCategories(industry);
      const url = `${this.businessDirectories.yelp.baseUrl}/businesses/search`;
      
      const params = {
        term: query,
        location: location,
        categories: categories.join(','),
        limit: 20,
        sort_by: 'best_match'
      };
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.businessDirectories.yelp.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params,
        timeout: 10000
      });
      
      if (response.data.businesses) {
        return response.data.businesses.map(business => ({
          title: business.name,
          url: business.url,
          snippet: business.categories.map(c => c.title).join(', '),
          address: business.location.display_address.join(', '),
          phone: business.phone,
          rating: business.rating,
          source: 'yelp',
          industry: industry,
          businessInfo: {
            name: business.name,
            address: business.location.display_address.join(', '),
            phone: business.phone,
            website: business.url,
            rating: business.rating,
            reviewCount: business.review_count
          },
          relevanceScore: this.calculateRelevanceScore(business.name + ' ' + business.categories.map(c => c.title).join(' '), query, industry)
        }));
      }
      
    } catch (error) {
      console.log('Yelp搜索失败:', error.message);
    }
    
    return [];
  }

  // Google Places Search
  async searchGooglePlaces(query, industry, location) {
    try {
      const searchQuery = `${query} ${industry}`;
      const url = `${this.businessDirectories.googlePlaces.baseUrl}/textsearch/json`;
      
      const params = {
        query: searchQuery,
        location: location,
        key: this.businessDirectories.googlePlaces.apiKey,
        type: 'establishment'
      };
      
      const response = await axios.get(url, { 
        params: params,
        timeout: 10000 
      });
      
      if (response.data.results) {
        return response.data.results.map(place => ({
          title: place.name,
          url: `https://maps.google.com/maps?place_id=${place.place_id}`,
          snippet: place.types.join(', '),
          address: place.formatted_address,
          rating: place.rating,
          source: 'google_places',
          industry: industry,
          businessInfo: {
            name: place.name,
            address: place.formatted_address,
            placeId: place.place_id,
            rating: place.rating
          },
          relevanceScore: this.calculateRelevanceScore(place.name + ' ' + place.types.join(' '), query, industry)
        }));
      }
      
    } catch (error) {
      console.log('Google Places搜索失败:', error.message);
    }
    
    return [];
  }

  // 网页抓取备用方案
  async searchWithScraping(query, industry) {
    const results = [];
    
    try {
      // 搜索专业的商业目录网站
      const directories = [
        'https://www.yellowpages.com',
        'https://www.bbb.org',
        'https://www.manta.com'
      ];
      
      for (const directory of directories) {
        try {
          console.log(`🕷️ 抓取 ${directory}...`);
          const directoryResults = await this.scrapeBusinessDirectory(directory, query, industry);
          results.push(...directoryResults);
          
          // 添加延迟避免被封
          await this.sleep(2000);
        } catch (error) {
          console.log(`抓取失败 ${directory}:`, error.message);
        }
      }
      
    } catch (error) {
      console.log('网页抓取失败:', error.message);
    }
    
    return results;
  }

  // 抓取商业目录
  async scrapeBusinessDirectory(baseUrl, query, industry) {
    try {
      // 构建搜索URL（每个目录的URL格式不同）
      let searchUrl;
      if (baseUrl.includes('yellowpages.com')) {
        searchUrl = `${baseUrl}/search?search_terms=${encodeURIComponent(query)}&geo_location_terms=United+States`;
      } else if (baseUrl.includes('bbb.org')) {
        searchUrl = `${baseUrl}/search?find_country=USA&find_text=${encodeURIComponent(query)}`;
      } else if (baseUrl.includes('manta.com')) {
        searchUrl = `${baseUrl}/search?search=${encodeURIComponent(query)}`;
      }
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const businesses = [];
      
      // 解析不同目录的结构
      if (baseUrl.includes('yellowpages.com')) {
        $('.result').each((i, elem) => {
          if (i < 10) {
            const name = $(elem).find('.business-name').text().trim();
            const phone = $(elem).find('.phones').text().trim();
            const address = $(elem).find('.street-address').text().trim();
            const website = $(elem).find('.track-visit-website').attr('href');
            
            if (name) {
              businesses.push({
                title: name,
                url: website || `${baseUrl}${$(elem).find('a').attr('href')}`,
                snippet: address,
                phone: phone,
                source: 'yellowpages_scraping',
                industry: industry,
                businessInfo: { name, phone, address, website },
                relevanceScore: this.calculateRelevanceScore(name, query, industry)
              });
            }
          }
        });
      }
      
      return businesses;
      
    } catch (error) {
      console.log(`目录抓取失败 ${baseUrl}:`, error.message);
      return [];
    }
  }

  // 获取Yelp分类
  getYelpCategories(industry) {
    const categoryMap = {
      'pet-tech': ['pets', 'petservices', 'veterinarians'],
      'pet-care': ['pets', 'petservices', 'veterinarians', 'petstore'],
      'ai-ml': ['technology', 'softwaredevelopment', 'itservices'],
      'technology': ['technology', 'softwaredevelopment', 'itservices', 'webdesign'],
      'healthcare': ['health', 'medical', 'physicians', 'dentists'],
      'retail': ['shopping', 'retail', 'ecommerce'],
      'services': ['professional', 'consulting', 'businessservices'],
      'finance': ['financial', 'accounting', 'banks', 'insurance'],
      'food': ['restaurants', 'food', 'catering'],
      'automotive': ['automotive', 'auto'],
      'real-estate': ['realestate', 'property']
    };
    
    return categoryMap[industry] || ['business', 'professional'];
  }

  // 计算相关性评分
  calculateRelevanceScore(text, query, industry) {
    let score = 0;
    const lowerText = text.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    const industryWords = industry.toLowerCase().split('-');
    
    // 查询词匹配
    queryWords.forEach(word => {
      if (lowerText.includes(word)) score += 10;
    });
    
    // 行业词匹配
    industryWords.forEach(word => {
      if (lowerText.includes(word)) score += 15;
    });
    
    // 商业关键词
    const businessKeywords = ['company', 'business', 'services', 'inc', 'llc', 'corp', 'ltd'];
    businessKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 5;
    });
    
    return Math.min(score, 100);
  }

  // 去重结果
  deduplicateResults(results) {
    const seen = new Set();
    const unique = [];
    
    for (const result of results) {
      const key = this.normalizeUrl(result.url) || result.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }
    
    // 按相关性评分排序
    return unique.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  // 标准化URL
  normalizeUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '') + parsed.pathname;
    } catch {
      return url;
    }
  }

  // 获取企业详细信息
  async getBusinessDetails(business) {
    try {
      console.log(`📋 获取企业详细信息: ${business.title}`);
      
      if (!business.url || business.url.includes('maps.google.com')) {
        return business;
      }
      
      const response = await axios.get(business.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 提取联系信息
      const emails = this.extractEmails($('body').text());
      const phones = this.extractPhones($('body').text());
      const description = $('meta[name="description"]').attr('content') || '';
      
      // 增强业务信息
      business.contactInfo = {
        emails: emails,
        phones: phones,
        website: business.url
      };
      
      business.description = description;
      business.detailsExtracted = true;
      business.extractedAt = new Date().toISOString();
      
      return business;
      
    } catch (error) {
      console.log(`获取详细信息失败 ${business.title}:`, error.message);
      return business;
    }
  }

  // 提取邮箱
  extractEmails(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    
    // 过滤掉常见的非商业邮箱
    return [...new Set(emails)]
      .filter(email => !email.includes('example.com') && !email.includes('test.com'))
      .slice(0, 5);
  }

  // 提取电话号码
  extractPhones(text) {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = text.match(phoneRegex) || [];
    return [...new Set(phones)].slice(0, 3);
  }

  // 工具函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查API可用性
  checkApiAvailability() {
    const status = {
      googleSearch: !!this.searchConfigs.google.apiKey,
      bingSearch: !!this.searchConfigs.bing.apiKey,
      yelpApi: !!this.businessDirectories.yelp.apiKey,
      googlePlaces: !!this.businessDirectories.googlePlaces.apiKey
    };
    
    console.log('🔧 API 可用性检查:', status);
    return status;
  }
}

module.exports = RealSearchEngine;