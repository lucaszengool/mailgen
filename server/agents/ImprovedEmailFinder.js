/**
 * 改进的邮箱查找器 - 专注于找到真实有效的邮箱地址
 */
class ImprovedEmailFinder {
  constructor() {
    // 常见的个人邮箱域名
    this.personalDomains = [
      'gmail.com',
      'outlook.com', 
      'yahoo.com',
      'hotmail.com',
      'icloud.com',
      'protonmail.com',
      'aol.com',
      'mail.com'
    ];
    
    // 无效的邮箱前缀标识
    this.invalidPrefixes = [
      'noreply',
      'no-reply',
      'donotreply',
      'mailer-daemon',
      'postmaster',
      'abuse',
      'admin',
      'webmaster',
      'hostmaster',
      'info',
      'support',
      'sales',
      'contact',
      'help',
      'service'
    ];
    
    // 明显的测试/示例邮箱
    this.testEmails = [
      'test@',
      'example@',
      'demo@',
      'sample@',
      'user@',
      'email@',
      'name@',
      'your@',
      'my@'
    ];
  }

  /**
   * 验证邮箱是否可能真实存在
   */
  isLikelyRealEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // 基础格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    const [username, domain] = email.toLowerCase().split('@');
    
    // 检查是否是无效前缀
    if (this.invalidPrefixes.some(prefix => username.startsWith(prefix))) {
      return false;
    }
    
    // 检查是否是测试邮箱
    if (this.testEmails.some(test => email.toLowerCase().startsWith(test))) {
      return false;
    }
    
    // 检查用户名长度和合理性
    if (username.length < 3 || username.length > 30) return false;
    
    // 检查是否包含过多特殊字符
    const specialCharCount = (username.match(/[._-]/g) || []).length;
    if (specialCharCount > 2) return false;
    
    // 检查是否是编程相关的假邮箱（如 .php, .html, .js）
    if (/\.(php|html|js|css|json|xml|py|java|cpp)$/i.test(username)) {
      return false;
    }
    
    // 检查是否包含URL路径标识
    if (username.includes('/') || username.includes('\\')) {
      return false;
    }
    
    // 验证域名是否是常见个人邮箱域名
    if (this.personalDomains.includes(domain)) {
      // 对于Gmail等，用户名应该看起来更自然
      return this.isNaturalUsername(username);
    }
    
    // 对于企业域名，放宽一些限制
    return true;
  }

  /**
   * 检查用户名是否自然
   */
  isNaturalUsername(username) {
    // 常见的自然用户名模式
    const naturalPatterns = [
      /^[a-z]+[a-z0-9]*$/i,                    // john123
      /^[a-z]+\.[a-z]+$/i,                     // john.doe
      /^[a-z]+_[a-z]+$/i,                      // john_doe
      /^[a-z]+\.[a-z]+[0-9]{1,4}$/i,          // john.doe99
      /^[a-z]{2,}[0-9]{2,4}$/i,               // john1990
      /^[a-z]+[a-z]*[0-9]{1,4}$/i             // johndoe123
    ];
    
    return naturalPatterns.some(pattern => pattern.test(username));
  }

  /**
   * 从网页内容提取真实邮箱
   */
  extractRealEmailsFromContent(content) {
    const emails = new Set();
    
    // 改进的邮箱正则 - 更严格
    const emailRegex = /\b[a-zA-Z][a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}\b/g;
    
    const matches = content.match(emailRegex) || [];
    
    for (const email of matches) {
      if (this.isLikelyRealEmail(email)) {
        emails.add(email.toLowerCase());
      }
    }
    
    return Array.from(emails);
  }

  /**
   * 从社交媒体链接推断可能的邮箱
   * 但只生成最可能存在的几个
   */
  inferEmailFromSocialMedia(socialHandle, platform) {
    const emails = [];
    const cleanHandle = socialHandle.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // 只为最流行的邮箱服务生成
    const topDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];
    
    for (const domain of topDomains) {
      // 只生成最可能的格式
      if (cleanHandle.length >= 4 && cleanHandle.length <= 20) {
        emails.push({
          email: `${cleanHandle}@${domain}`,
          confidence: 30, // 低置信度，因为是推断的
          source: `inferred_from_${platform}`
        });
      }
    }
    
    return emails;
  }

  /**
   * 计算邮箱可信度分数
   */
  calculateEmailConfidence(email, source = 'unknown') {
    let score = 0;
    
    // 如果是直接从网页提取的，基础分更高
    if (source === 'extracted') {
      score = 70;
    } else if (source === 'inferred') {
      score = 30;
    }
    
    const [username, domain] = email.split('@');
    
    // 域名评分
    if (this.personalDomains.includes(domain)) {
      score += 10;
    }
    
    // 用户名自然度评分
    if (this.isNaturalUsername(username)) {
      score += 20;
    }
    
    // 长度合理性
    if (username.length >= 5 && username.length <= 15) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * 批量验证邮箱地址（简单验证）
   */
  async validateEmails(emails) {
    const validated = [];
    
    for (const email of emails) {
      if (this.isLikelyRealEmail(email)) {
        const confidence = this.calculateEmailConfidence(email, 'extracted');
        validated.push({
          email,
          valid: confidence > 50,
          confidence,
          reason: confidence > 50 ? 'likely_real' : 'uncertain'
        });
      }
    }
    
    // 按置信度排序
    return validated.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 主要的邮箱查找方法
   */
  async findEmails(content, url = '') {
    const results = {
      extracted: [],
      inferred: [],
      total: 0
    };
    
    // 1. 直接提取邮箱
    const extractedEmails = this.extractRealEmailsFromContent(content);
    for (const email of extractedEmails) {
      results.extracted.push({
        email,
        confidence: this.calculateEmailConfidence(email, 'extracted'),
        source: 'direct_extraction'
      });
    }
    
    // 2. 从社交媒体链接推断（但要谨慎）
    const socialRegex = /@([a-zA-Z0-9_]{3,15})\b/g;
    const socialMatches = content.match(socialRegex) || [];
    
    for (const match of socialMatches.slice(0, 3)) { // 只处理前3个
      const handle = match.substring(1);
      const inferred = this.inferEmailFromSocialMedia(handle, 'twitter');
      results.inferred.push(...inferred);
    }
    
    // 去重和排序
    const allEmails = [...results.extracted, ...results.inferred];
    const uniqueEmails = Array.from(
      new Map(allEmails.map(item => [item.email, item])).values()
    );
    
    // 只返回置信度大于40的邮箱
    const filtered = uniqueEmails.filter(e => e.confidence > 40);
    
    results.total = filtered.length;
    
    return {
      emails: filtered.sort((a, b) => b.confidence - a.confidence),
      total: filtered.length
    };
  }
}

module.exports = ImprovedEmailFinder;