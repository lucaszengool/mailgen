const RealEmailFinder = require('./RealEmailFinder');
const SmartBusinessAnalyzer = require('./SmartBusinessAnalyzer');
const RealTimeLeadDiscovery = require('./RealTimeLeadDiscovery');
const AIEnhancedStrategyEngine = require('./AIEnhancedStrategyEngine');
const axios = require('axios');
const cheerio = require('cheerio');

class EnhancedLeadDiscovery {
  constructor() {
    this.emailFinder = new RealEmailFinder();
    this.businessAnalyzer = new SmartBusinessAnalyzer();
    this.realTimeDiscovery = new RealTimeLeadDiscovery();
    this.aiStrategyEngine = new AIEnhancedStrategyEngine();
    this.verifiedLeads = [];
    console.log('🤖 AI增强策略引擎已集成');
  }

  // 发现真实的潜在客户
  async discoverRealLeads(targetWebsite) {
    console.log(`🚀 开始智能发现潜在客户: ${targetWebsite}`);
    
    const leads = [];
    
    try {
      // 1. 深度分析目标网站
      console.log('🔍 深度分析目标网站业务模式...');
      let businessAnalysis = await this.businessAnalyzer.analyzeTargetBusiness(targetWebsite);
      
      // 1.5. AI增强业务分析
      console.log('🤖 使用AI增强业务分析...');
      businessAnalysis = await this.aiStrategyEngine.enhanceBusinessAnalysis(businessAnalysis);
      
      // 2. 生成AI增强的匹配策略
      console.log('🎯 生成AI增强潜在客户匹配策略...');
      const matchingStrategy = await this.aiStrategyEngine.generateEnhancedMatchingStrategy(businessAnalysis);
      
      // 3. 基于分析结果查找匹配的潜在客户
      console.log('📧 查找匹配的潜在客户...');
      const matchedLeads = await this.findMatchingLeads(businessAnalysis, matchingStrategy);
      
      leads.push(...matchedLeads);
      
      console.log(`🎯 基于 ${businessAnalysis.companyName} (${businessAnalysis.industry}) 的分析，发现 ${leads.length} 个匹配的潜在客户`);
      
      // 为每个潜在客户添加业务分析上下文
      leads.forEach(lead => {
        lead.sourceBusinessAnalysis = businessAnalysis;
        lead.matchingStrategy = matchingStrategy;
      });
      
      return leads;
      
    } catch (error) {
      console.error('智能潜在客户发现失败:', error.message);
      return leads;
    }
  }

  // 从邮箱创建潜在客户档案
  async createLeadFromEmail(email, website, companyInfo = null) {
    const domain = email.split('@')[1];
    const username = email.split('@')[0];
    
    // 智能推断信息
    const name = this.inferNameFromEmail(username);
    const role = this.inferRoleFromEmail(username);
    const company = companyInfo?.name || this.inferCompanyFromDomain(domain);
    const industry = companyInfo?.industry || await this.inferIndustryFromWebsite(website);
    
    return {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      email: email,
      company: company,
      role: role,
      industry: industry,
      website: website,
      source: 'real_discovery',
      verified: true,
      status: 'ready_to_contact',
      discoveredAt: new Date().toISOString(),
      priority: this.calculatePriority(email, role, industry)
    };
  }

  // 基于业务分析查找匹配的潜在客户
  async findMatchingLeads(businessAnalysis, matchingStrategy) {
    const leads = [];
    
    try {
      console.log('🔍 实时搜索相关公司...');
      
      // 使用实时搜索发现相关公司
      const discoveredCompanies = await this.realTimeDiscovery.searchRelatedCompanies(businessAnalysis);
      
      if (discoveredCompanies.length === 0) {
        console.log('⚠️ 未发现相关公司，返回空结果');
        return leads;
      }
      
      console.log(`✅ 实时发现 ${discoveredCompanies.length} 家相关公司`);
      
      // 为每家公司查找联系信息
      for (const company of discoveredCompanies.slice(0, 10)) { // 限制处理数量
        console.log(`🔍 处理公司: ${company.name} (相关性: ${company.relevanceScore}%)`);
        
        // 检查是否匹配理想客户画像
        if (this.isMatchingCustomer(company, matchingStrategy)) {
          try {
            // 从公司网站提取联系信息
            const contactEmails = company.contactInfo?.emails || [];
            let foundEmails = contactEmails;
            
            // 如果网站没有直接的联系邮箱，尝试深度搜索
            if (foundEmails.length === 0) {
              console.log(`  📧 深度搜索 ${company.name} 的邮箱...`);
              foundEmails = await this.emailFinder.findRealEmails(company.website);
            }
            
            // 为找到的邮箱创建潜在客户
            for (const email of foundEmails.slice(0, 2)) { // 每家公司最多2个联系人
              if (this.emailFinder.isValidEmail(email)) {
                const lead = await this.createSmartLead(email, company, businessAnalysis, matchingStrategy);
                leads.push(lead);
                console.log(`  ✅ 创建潜在客户: ${lead.name} (${email})`);
              }
            }
            
          } catch (error) {
            console.log(`  ⚠️ 处理 ${company.name} 时出错: ${error.message}`);
          }
        } else {
          console.log(`  ❌ ${company.name} 不符合目标客户画像，跳过`);
        }
        
        // 添加延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error('实时查找匹配客户失败:', error.message);
    }
    
    console.log(`🎯 总共创建 ${leads.length} 个匹配的潜在客户`);
    return leads;
  }

  // 动态获取目标公司（已被实时搜索替代）
  async getTargetCompaniesByIndustry(businessAnalysis, matchingStrategy) {
    console.log('⚠️ getTargetCompaniesByIndustry 已被实时搜索替代');
    // 该方法已被 realTimeDiscovery.searchRelatedCompanies() 替代
    // 不再返回硬编码的公司列表
    return [];
  }

  // 检查是否匹配理想客户
  isMatchingCustomer(company, matchingStrategy) {
    const { idealCustomerProfile, avoidIndustries } = matchingStrategy;
    
    // 检查是否在避免列表中
    if (avoidIndustries.includes(company.industry)) {
      return false;
    }
    
    // 检查公司特征是否匹配
    if (idealCustomerProfile.characteristics) {
      const hasMatchingCharacteristics = company.characteristics?.some(char => 
        idealCustomerProfile.characteristics.some(ideal => 
          char.toLowerCase().includes(ideal.toLowerCase()) || 
          ideal.toLowerCase().includes(char.toLowerCase())
        )
      );
      
      if (!hasMatchingCharacteristics) {
        return false;
      }
    }
    
    return true;
  }

  // 创建智能潜在客户
  async createSmartLead(email, company, businessAnalysis, matchingStrategy) {
    const lead = await this.createLeadFromEmail(email, company.website, company);
    
    // 添加智能分析信息
    lead.smartAnalysis = {
      sourceIndustry: businessAnalysis.industry,
      targetIndustry: company.industry,
      matchReason: this.generateMatchReason(company, matchingStrategy),
      synergies: this.identifySynergies(businessAnalysis, company),
      approachStrategy: matchingStrategy.approachStrategy,
      priority: this.calculateSmartPriority(company, matchingStrategy)
    };
    
    return lead;
  }

  // 生成匹配原因
  generateMatchReason(company, matchingStrategy) {
    const reasons = [];
    
    if (matchingStrategy.targetIndustries.includes(company.industry)) {
      reasons.push(`Target industry: ${company.industry}`);
    }
    
    if (company.characteristics) {
      const matchingChars = company.characteristics.filter(char => 
        matchingStrategy.idealCustomerProfile.characteristics?.some(ideal => 
          char.toLowerCase().includes(ideal.toLowerCase())
        )
      );
      
      if (matchingChars.length > 0) {
        reasons.push(`Matching characteristics: ${matchingChars.join(', ')}`);
      }
    }
    
    return reasons.join('; ');
  }

  // 识别协同效应
  identifySynergies(businessAnalysis, company) {
    const synergies = [];
    
    if (businessAnalysis.industry === 'pet-tech' && company.industry.includes('pet')) {
      synergies.push('Both serve pet-loving customers');
      synergies.push('Complementary services in pet ecosystem');
    }
    
    if (businessAnalysis.mainProducts.some(product => 
        product.toLowerCase().includes('ai') || product.toLowerCase().includes('photo')
      ) && company.industry.includes('retail')) {
      synergies.push('AI-powered marketing materials for retail');
      synergies.push('Enhanced customer engagement through visual content');
    }
    
    return synergies;
  }

  // 计算智能优先级
  calculateSmartPriority(company, matchingStrategy) {
    let score = 0;
    
    // 行业匹配度
    if (matchingStrategy.targetIndustries.includes(company.industry)) {
      score += 3;
    }
    
    // 公司特征匹配
    if (company.characteristics) {
      const matchingChars = company.characteristics.filter(char => 
        matchingStrategy.idealCustomerProfile.characteristics?.some(ideal => 
          char.toLowerCase().includes(ideal.toLowerCase())
        )
      );
      score += matchingChars.length;
    }
    
    // 公司规模
    if (company.size === 'medium' || company.size === 'large') {
      score += 2;
    }
    
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  // 获取公开的商业邮箱（真实数据）
  async getPublicBusinessEmails() {
    // 这些是公开的商业联系邮箱
    // 可以从公开数据源获取
    return [
      {
        email: 'press@tesla.com',
        company: 'Tesla',
        website: 'https://www.tesla.com',
        industry: 'automotive'
      },
      {
        email: 'media.help@apple.com',
        company: 'Apple',
        website: 'https://www.apple.com',
        industry: 'technology'
      },
      {
        email: 'press@spotify.com',
        company: 'Spotify',
        website: 'https://www.spotify.com',
        industry: 'entertainment'
      },
      {
        email: 'press@airbnb.com',
        company: 'Airbnb',
        website: 'https://www.airbnb.com',
        industry: 'travel'
      },
      {
        email: 'press@uber.com',
        company: 'Uber',
        website: 'https://www.uber.com',
        industry: 'transportation'
      }
    ];
  }

  // 分析网站行业
  async analyzeIndustry(website) {
    try {
      const response = await axios.get(website, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const content = $('body').text().toLowerCase();
      
      // 简单的行业分类
      if (content.includes('technology') || content.includes('software')) return 'technology';
      if (content.includes('e-commerce') || content.includes('shop')) return 'e-commerce';
      if (content.includes('health') || content.includes('medical')) return 'healthcare';
      if (content.includes('finance') || content.includes('banking')) return 'finance';
      if (content.includes('education') || content.includes('learning')) return 'education';
      
      return 'general';
      
    } catch (error) {
      return 'general';
    }
  }

  // 推断姓名
  inferNameFromEmail(username) {
    const commonPrefixes = ['info', 'contact', 'hello', 'support', 'sales', 'admin', 'team'];
    
    if (commonPrefixes.includes(username.toLowerCase())) {
      return 'Business Team';
    }
    
    if (username.includes('.')) {
      const parts = username.split('.');
      return parts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  // 推断职位
  inferRoleFromEmail(username) {
    const roleMap = {
      'ceo': 'CEO',
      'cto': 'CTO',
      'cmo': 'CMO',
      'sales': 'Sales Manager',
      'marketing': 'Marketing Manager',
      'support': 'Support Manager',
      'info': 'General Contact',
      'contact': 'Business Contact',
      'press': 'Press Contact',
      'media': 'Media Relations',
      'ir': 'Investor Relations'
    };
    
    const lower = username.toLowerCase();
    for (const [key, role] of Object.entries(roleMap)) {
      if (lower.includes(key)) {
        return role;
      }
    }
    
    return 'Business Contact';
  }

  // 推断公司名
  inferCompanyFromDomain(domain) {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // 推断行业
  async inferIndustryFromWebsite(website) {
    try {
      const industry = await this.analyzeIndustry(website);
      return industry;
    } catch {
      return 'general';
    }
  }

  // 计算优先级
  calculatePriority(email, role, industry) {
    let score = 0;
    
    // 角色权重
    if (role.includes('CEO') || role.includes('CTO')) score += 3;
    if (role.includes('Manager')) score += 2;
    if (role.includes('Sales') || role.includes('Marketing')) score += 2;
    
    // 行业权重
    if (industry === 'technology' || industry === 'e-commerce') score += 2;
    
    // 邮箱类型权重
    if (!email.includes('info') && !email.includes('contact')) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  // 验证邮箱是否可达（简单验证）
  async verifyEmailDeliverability(email) {
    // 这里可以集成第三方邮箱验证服务
    // 目前只做基本的MX记录检查
    const domain = email.split('@')[1];
    return await this.emailFinder.checkMXRecord(domain);
  }

  // 批量验证邮箱
  async verifyLeads(leads) {
    const verifiedLeads = [];
    
    for (const lead of leads) {
      const isValid = await this.verifyEmailDeliverability(lead.email);
      if (isValid) {
        lead.emailVerified = true;
        verifiedLeads.push(lead);
      }
    }
    
    return verifiedLeads;
  }
}

module.exports = EnhancedLeadDiscovery;