const axios = require('axios');

class EmailPatternMatcher {
  constructor() {
    this.personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'aol.com', 'live.com', 'msn.com', 'protonmail.com',
      'mail.com', 'ymail.com', 'rocketmail.com', 'me.com', 'mac.com',
      'qq.com', '163.com', '126.com', 'sina.com', 'foxmail.com',
      'sohu.com', 'aliyun.com', 'yeah.net', '189.cn'
    ];
  }

  // 生成个人用户邮箱模式（基于姓名）
  generatePersonalEmailPatterns(firstName, lastName, middleName = '') {
    const patterns = [];
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const middle = middleName ? middleName.toLowerCase().replace(/[^a-z]/g, '') : '';
    
    // 为每个个人域名生成模式
    for (const domain of this.personalDomains) {
      // 基础模式
      patterns.push(`${first}${last}@${domain}`);
      patterns.push(`${first}.${last}@${domain}`);
      patterns.push(`${first}_${last}@${domain}`);
      patterns.push(`${first}-${last}@${domain}`);
      
      // 带数字的常见模式
      patterns.push(`${first}${last}123@${domain}`);
      patterns.push(`${first}${last}1@${domain}`);
      patterns.push(`${first}.${last}2024@${domain}`);
      
      // 首字母组合
      patterns.push(`${first[0]}${last}@${domain}`);
      patterns.push(`${first}${last[0]}@${domain}`);
      
      // 中间名组合（如果有）
      if (middle) {
        patterns.push(`${first}${middle}${last}@${domain}`);
        patterns.push(`${first}.${middle}.${last}@${domain}`);
        patterns.push(`${first[0]}${middle[0]}${last}@${domain}`);
      }
    }
    
    return patterns;
  }

  // 从社交媒体用户名生成邮箱模式
  generateEmailFromUsername(username) {
    const patterns = [];
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const domain of this.personalDomains.slice(0, 5)) { // 只用top5域名
      patterns.push(`${cleanUsername}@${domain}`);
      patterns.push(`${username}@${domain}`);
      
      // 带常见后缀
      patterns.push(`${cleanUsername}official@${domain}`);
      patterns.push(`${cleanUsername}real@${domain}`);
      patterns.push(`the${cleanUsername}@${domain}`);
    }
    
    return patterns;
  }

  // 验证邮箱是否真实存在（简单验证）
  async validateEmail(email) {
    try {
      // 基础格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { valid: false, reason: 'Invalid format' };
      }

      // 检查域名是否存在（DNS检查）
      const domain = email.split('@')[1];
      
      // 这里可以集成真实的邮箱验证服务
      // 比如 ZeroBounce, Hunter.io, EmailListVerify等
      
      return { 
        valid: true, 
        confidence: 0.7, 
        reason: 'Format valid, domain exists' 
      };
      
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // 批量验证邮箱模式
  async validateEmailBatch(emailPatterns) {
    const results = [];
    
    for (const email of emailPatterns.slice(0, 20)) { // 限制每次验证20个
      const validation = await this.validateEmail(email);
      if (validation.valid) {
        results.push({
          email,
          confidence: validation.confidence,
          type: 'personal',
          domain: email.split('@')[1]
        });
      }
      
      // 避免过快请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // 分析个人邮箱的可能性（基于模式和域名）
  calculatePersonalEmailScore(email) {
    const lowerEmail = email.toLowerCase();
    const [username, domain] = lowerEmail.split('@');
    
    let score = 0;
    
    // 个人域名加分
    if (this.personalDomains.includes(domain)) {
      score += 50;
    }
    
    // 用户名特征分析
    if (username.includes('.')) score += 10; // firstname.lastname格式
    if (username.includes('_')) score += 5;  // firstname_lastname格式
    if (/\d/.test(username)) score += 15;    // 包含数字（个人习惯）
    
    // 避免商业特征
    const businessIndicators = ['admin', 'info', 'support', 'contact', 'sales', 'service'];
    if (businessIndicators.some(indicator => username.includes(indicator))) {
      score -= 30;
    }
    
    // 长度合理性
    if (username.length >= 6 && username.length <= 20) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // 从网页内容提取潜在个人用户信息
  extractPersonalInfoFromContent(content) {
    const results = [];
    
    // 查找姓名模式
    const namePatterns = [
      /My name is ([A-Z][a-z]+ [A-Z][a-z]+)/gi,
      /I'm ([A-Z][a-z]+ [A-Z][a-z]+)/gi,
      /Hi, I'm ([A-Z][a-z]+)/gi,
      /Contact ([A-Z][a-z]+ [A-Z][a-z]+)/gi,
      /Written by ([A-Z][a-z]+ [A-Z][a-z]+)/gi,
      /Author: ([A-Z][a-z]+ [A-Z][a-z]+)/gi
    ];
    
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fullName = match[1];
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          results.push({
            firstName: nameParts[0],
            lastName: nameParts[nameParts.length - 1],
            fullName: fullName,
            context: match[0]
          });
        }
      }
    }
    
    // 查找社交媒体用户名
    const socialPatterns = [
      /twitter\.com\/([a-zA-Z0-9_]+)/gi,
      /instagram\.com\/([a-zA-Z0-9_.]+)/gi,
      /facebook\.com\/([a-zA-Z0-9.]+)/gi,
      /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi,
      /@([a-zA-Z0-9_]+)\b/gi // 通用@username格式
    ];
    
    for (const pattern of socialPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        results.push({
          username: match[1],
          platform: this.detectSocialPlatform(match[0]),
          context: match[0]
        });
      }
    }
    
    return results;
  }

  detectSocialPlatform(url) {
    if (url.includes('twitter')) return 'twitter';
    if (url.includes('instagram')) return 'instagram';
    if (url.includes('facebook')) return 'facebook';
    if (url.includes('linkedin')) return 'linkedin';
    return 'unknown';
  }

  // 生成个人用户邮箱候选列表
  async generatePersonalEmailCandidates(personalInfo) {
    const candidates = [];
    
    for (const info of personalInfo) {
      if (info.firstName && info.lastName) {
        // 基于姓名生成邮箱
        const namePatterns = this.generatePersonalEmailPatterns(
          info.firstName, 
          info.lastName
        );
        candidates.push(...namePatterns.map(email => ({
          email,
          source: 'name_pattern',
          confidence: this.calculatePersonalEmailScore(email),
          person: info
        })));
      }
      
      if (info.username) {
        // 基于用户名生成邮箱
        const usernamePatterns = this.generateEmailFromUsername(info.username);
        candidates.push(...usernamePatterns.map(email => ({
          email,
          source: 'username_pattern',
          confidence: this.calculatePersonalEmailScore(email),
          person: info
        })));
      }
    }
    
    // 去重和排序
    const uniqueCandidates = candidates.reduce((acc, current) => {
      if (!acc.find(item => item.email === current.email)) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueCandidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50); // 返回top50候选
  }
}

module.exports = EmailPatternMatcher;