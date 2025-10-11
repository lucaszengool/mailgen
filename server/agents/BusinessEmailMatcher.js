const axios = require('axios');

class BusinessEmailMatcher {
  constructor() {
    // 决策者邮箱前缀（最高优先级）
    this.executivePrefixes = [
      'ceo@', 'founder@', 'cofounder@', 'president@', 'vp@', 'vice.president@',
      'director@', 'manager@', 'head@', 'chief@', 'owner@', 'partner@'
    ];
    
    // 销售和商务邮箱前缀（高优先级）
    this.salesPrefixes = [
      'sales@', 'business@', 'partnerships@', 'partner@', 'bd@', 'bizdev@',
      'enterprise@', 'corporate@', 'wholesale@', 'b2b@', 'commercial@'
    ];
    
    // 营销邮箱前缀（中高优先级）
    this.marketingPrefixes = [
      'marketing@', 'pr@', 'media@', 'press@', 'communications@', 'outreach@',
      'brand@', 'growth@', 'acquisition@', 'digital@', 'social@'
    ];
    
    // 一般联系邮箱前缀（中优先级）
    this.generalPrefixes = [
      'contact@', 'info@', 'hello@', 'hi@', 'general@', 'office@',
      'team@', 'inquiries@', 'connect@', 'reach@'
    ];
    
    // 客服邮箱前缀（低优先级）
    this.supportPrefixes = [
      'support@', 'help@', 'service@', 'customer@', 'care@', 'success@',
      'onboarding@', 'technical@', 'tech@'
    ];
    
    // 应避免的邮箱前缀（零优先级）
    this.avoidPrefixes = [
      'noreply@', 'no-reply@', 'donotreply@', 'admin@', 'webmaster@',
      'postmaster@', 'mailer@', 'daemon@', 'system@', 'automated@'
    ];
    
    // 企业邮箱域名模式
    this.businessDomainPatterns = [
      /\.com$/, /\.co$/, /\.net$/, /\.org$/, /\.io$/, /\.ai$/,
      /\.tech$/, /\.biz$/, /\.inc$/, /\.corp$/, /\.ltd$/, /\.llc$/
    ];
    
    // 个人邮箱域名（ToB中优先级较低）
    this.personalDomains = [
      '@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com',
      '@icloud.com', '@aol.com', '@live.com', '@protonmail.com'
    ];
  }

  // 为B2B邮箱计算综合评分
  calculateBusinessEmailScore(email) {
    const lowerEmail = email.toLowerCase();
    const [username, domain] = lowerEmail.split('@');
    
    if (!username || !domain) return 0;
    
    let score = 0;
    
    // 1. 基于邮箱前缀的评分
    if (this.executivePrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      score += 100; // 决策者邮箱最高分
    } else if (this.salesPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      score += 85; // 销售邮箱高分
    } else if (this.marketingPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      score += 70; // 营销邮箱中高分
    } else if (this.generalPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      score += 60; // 一般联系邮箱中分
    } else if (this.supportPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      score += 30; // 客服邮箱低分
    } else if (this.avoidPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      return 0; // 系统邮箱零分
    }
    
    // 2. 基于域名类型的评分
    const isBusinessDomain = this.businessDomainPatterns.some(pattern => pattern.test(domain));
    const isPersonalDomain = this.personalDomains.some(personalDomain => lowerEmail.includes(personalDomain));
    
    if (isBusinessDomain) {
      score += 40; // 企业域名加分
    } else if (isPersonalDomain) {
      score -= 20; // 个人域名减分（但在特殊情况下仍可能有用）
    }
    
    // 3. 基于用户名特征的评分
    // 包含真实姓名的格式加分
    if (/^[a-z]+\.[a-z]+$/.test(username)) {
      score += 15; // firstname.lastname格式
    } else if (/^[a-z]+_[a-z]+$/.test(username)) {
      score += 10; // firstname_lastname格式
    } else if (/^[a-z]+$/.test(username) && username.length >= 3 && username.length <= 15) {
      score += 5; // 简单名字格式
    }
    
    // 4. 域名长度和复杂性评分
    const domainParts = domain.split('.');
    if (domainParts.length === 2 && domainParts[0].length >= 3 && domainParts[0].length <= 20) {
      score += 10; // 合理的域名长度
    }
    
    // 5. 特殊行业域名识别
    if (this.detectIndustryDomain(domain)) {
      score += 20; // 行业特定域名加分
    }
    
    return Math.max(0, Math.min(150, score));
  }
  
  // 检测行业特定域名
  detectIndustryDomain(domain) {
    const industryIndicators = [
      'tech', 'software', 'app', 'digital', 'ai', 'data', 'cloud',
      'consulting', 'agency', 'studio', 'lab', 'solutions', 'services',
      'media', 'marketing', 'design', 'creative', 'innovation'
    ];
    
    return industryIndicators.some(indicator => domain.includes(indicator));
  }
  
  // 高级联系人角色推断
  inferAdvancedContactRole(email, companySize = 'unknown') {
    const lowerEmail = email.toLowerCase();
    
    // CEO/创始人级别
    if (lowerEmail.includes('ceo@') || lowerEmail.includes('founder@')) {
      return { 
        role: 'CEO/Founder', 
        level: 'C-Level', 
        decisionMaker: true,
        priority: 'highest'
      };
    }
    
    // 副总裁/总监级别
    if (lowerEmail.includes('vp@') || lowerEmail.includes('vice') || 
        lowerEmail.includes('director@') || lowerEmail.includes('head@')) {
      return { 
        role: 'VP/Director', 
        level: 'Executive', 
        decisionMaker: true,
        priority: 'high'
      };
    }
    
    // 销售角色
    if (this.salesPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      return { 
        role: 'Sales Professional', 
        level: 'Sales', 
        decisionMaker: companySize === 'small',
        priority: 'high'
      };
    }
    
    // 营销角色
    if (this.marketingPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      return { 
        role: 'Marketing Professional', 
        level: 'Marketing', 
        decisionMaker: false,
        priority: 'medium'
      };
    }
    
    // 一般业务联系
    if (this.generalPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      return { 
        role: 'General Business Contact', 
        level: 'General', 
        decisionMaker: companySize === 'small',
        priority: 'medium'
      };
    }
    
    // 客户服务
    if (this.supportPrefixes.some(prefix => lowerEmail.startsWith(prefix))) {
      return { 
        role: 'Customer Support', 
        level: 'Support', 
        decisionMaker: false,
        priority: 'low'
      };
    }
    
    return { 
      role: 'Business Contact', 
      level: 'Unknown', 
      decisionMaker: false,
      priority: 'medium'
    };
  }
  
  // 生成基于公司名称的邮箱候选
  generateBusinessEmailCandidates(companyName, targetRoles = ['sales', 'contact', 'business']) {
    const cleanCompany = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const candidates = [];
    const commonBusinessDomains = ['.com', '.co', '.io', '.net'];
    
    for (const domain of commonBusinessDomains) {
      const baseDomain = `${cleanCompany}${domain}`;
      
      for (const role of targetRoles) {
        candidates.push({
          email: `${role}@${baseDomain}`,
          confidence: this.calculateBusinessEmailScore(`${role}@${baseDomain}`),
          source: 'company_name_pattern',
          role: this.inferAdvancedContactRole(`${role}@${baseDomain}`)
        });
      }
    }
    
    return candidates
      .filter(c => c.confidence > 40)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }
  
  // B2B平台特定的邮箱发现
  extractBusinessContactsFromLinkedIn(profileContent) {
    const contacts = [];
    
    // LinkedIn特定的模式匹配
    const linkedinPatterns = [
      /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /contact[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /reach out[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];
    
    for (const pattern of linkedinPatterns) {
      let match;
      while ((match = pattern.exec(profileContent)) !== null) {
        const email = match[1];
        if (this.calculateBusinessEmailScore(email) > 40) {
          contacts.push({
            email,
            source: 'linkedin_profile',
            confidence: this.calculateBusinessEmailScore(email),
            role: this.inferAdvancedContactRole(email)
          });
        }
      }
    }
    
    return contacts;
  }
  
  // 行业特定的邮箱模式识别
  getIndustrySpecificPatterns(industry) {
    const patterns = {
      'technology': ['tech@', 'dev@', 'engineering@', 'product@', 'innovation@'],
      'marketing': ['creative@', 'campaigns@', 'brand@', 'digital@', 'growth@'],
      'healthcare': ['medical@', 'clinical@', 'patient@', 'health@', 'care@'],
      'finance': ['finance@', 'accounting@', 'billing@', 'treasury@', 'invest@'],
      'education': ['academic@', 'admissions@', 'student@', 'faculty@', 'research@'],
      'retail': ['store@', 'shop@', 'inventory@', 'merchandise@', 'retail@'],
      'manufacturing': ['production@', 'quality@', 'supply@', 'operations@', 'plant@']
    };
    
    return patterns[industry.toLowerCase()] || [];
  }
  
  // 批量验证和评分B2B邮箱
  async validateBusinessEmailBatch(emailCandidates, industry = 'general') {
    const results = [];
    const industryPatterns = this.getIndustrySpecificPatterns(industry);
    
    for (const candidate of emailCandidates.slice(0, 15)) { // 限制批量处理数量
      const email = typeof candidate === 'string' ? candidate : candidate.email;
      const score = this.calculateBusinessEmailScore(email);
      
      // 行业特定加分
      let industryBonus = 0;
      if (industryPatterns.some(pattern => email.toLowerCase().includes(pattern))) {
        industryBonus = 15;
      }
      
      const finalScore = score + industryBonus;
      
      if (finalScore > 40) { // 只保留中等以上评分的邮箱
        results.push({
          email,
          confidence: finalScore,
          type: 'business',
          role: this.inferAdvancedContactRole(email),
          industryMatch: industryBonus > 0
        });
      }
      
      // 避免过快请求
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}

module.exports = BusinessEmailMatcher;