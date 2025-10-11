const dns = require('dns').promises;
const net = require('net');

class EnhancedEmailValidator {
  constructor() {
    // 扩展的一次性邮箱域名列表
    this.disposableDomains = new Set([
      // 常见一次性邮箱
      'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
      'mailinator.com', 'mailinator.net', 'mailinator2.com',
      '10minutemail.com', '10minutemail.net', '10minutemail.org',
      'temp-mail.org', 'temp-mail.com', 'temp-mail.net',
      'throwaway.email', 'throwawaymail.com',
      'getnada.com', 'getnada.cc', 
      'tempmail.net', 'tempmail.com',
      'trashmail.com', 'trashmail.net', 'trashmail.org',
      'yopmail.com', 'yopmail.net', 'yopmail.fr',
      'maildrop.cc', 'maildrop.ml',
      'mintemail.com', 'mintmail.com',
      'sharklasers.com', 'grr.la',
      'dispostable.com', 'disposemail.com',
      'mailnesia.com', 'mailcatch.com',
      'mytemp.email', 'tempmailaddress.com'
    ]);
    
    // 已知的大型邮件提供商（高可信度）
    this.trustedProviders = new Set([
      // 国际主流
      'gmail.com', 'googlemail.com',
      'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
      'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de',
      'icloud.com', 'me.com', 'mac.com',
      'protonmail.com', 'proton.me', 'pm.me',
      'aol.com', 'aim.com',
      'zoho.com', 'zohomail.com',
      
      // 中国主流
      'qq.com', 'vip.qq.com', 'foxmail.com',
      '163.com', '126.com', '188.com', 'yeah.net',
      'sina.com', 'sina.cn', 'vip.sina.com',
      'sohu.com', 'vip.sohu.com',
      'aliyun.com', 'alibaba.com',
      
      // 企业邮箱
      'microsoft.com', 'apple.com', 'amazon.com',
      'google.com', 'facebook.com', 'meta.com'
    ]);
    
    // 常见的拼写错误映射
    this.typoCorrections = {
      // Gmail错误
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com', 
      'gmil.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      
      // Hotmail错误
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'hotnail.com': 'hotmail.com',
      'hotmal.com': 'hotmail.com',
      'hotmali.com': 'hotmail.com',
      
      // Yahoo错误
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'yahou.com': 'yahoo.com',
      'yhaoo.com': 'yahoo.com',
      
      // Outlook错误
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com',
      'outloook.com': 'outlook.com',
      
      // 163错误
      '136.com': '163.com',
      '162.com': '163.com',
      '164.com': '163.com'
    };
    
    // 验证缓存
    this.cache = new Map();
    this.cacheExpiry = 6 * 60 * 60 * 1000; // 6小时缓存
    
    // 统计信息
    this.stats = {
      totalValidated: 0,
      validEmails: 0,
      invalidEmails: 0,
      disposableDetected: 0,
      typosFixed: 0
    };
  }

  // 主验证方法
  async validateEmail(email, options = {}) {
    this.stats.totalValidated++;
    
    // 标准化邮箱地址
    email = email.toLowerCase().trim();
    
    // 检查缓存
    if (!options.skipCache) {
      const cached = this.getCachedResult(email);
      if (cached) {
        console.log(`📋 使用缓存结果: ${email}`);
        return cached;
      }
    }
    
    // 执行验证步骤
    const result = await this.performValidation(email, options);
    
    // 更新统计
    if (result.valid) {
      this.stats.validEmails++;
    } else {
      this.stats.invalidEmails++;
    }
    
    // 缓存结果
    this.cacheResult(email, result);
    
    return result;
  }

  // 执行完整验证
  async performValidation(email, options = {}) {
    const validationResult = {
      email,
      valid: false,
      score: 0,
      checks: {},
      suggestions: [],
      timestamp: new Date().toISOString()
    };
    
    // 1. 语法检查
    const syntaxCheck = this.checkSyntax(email);
    validationResult.checks.syntax = syntaxCheck;
    if (!syntaxCheck.valid) {
      validationResult.reason = syntaxCheck.reason;
      return validationResult;
    }
    validationResult.score += 20;
    
    // 2. 拆分邮箱地址
    const [localPart, domain] = email.split('@');
    
    // 3. 检查拼写错误
    const typoCheck = this.checkTypo(domain);
    validationResult.checks.typo = typoCheck;
    if (typoCheck.hasTypo) {
      validationResult.suggestions.push({
        type: 'typo',
        suggestion: `${localPart}@${typoCheck.correction}`,
        confidence: 0.95
      });
      this.stats.typosFixed++;
      validationResult.reason = `Possible typo - did you mean ${typoCheck.correction}?`;
      return validationResult;
    }
    validationResult.score += 10;
    
    // 4. 检查一次性邮箱
    const disposableCheck = this.checkDisposable(domain);
    validationResult.checks.disposable = disposableCheck;
    if (disposableCheck.isDisposable) {
      this.stats.disposableDetected++;
      validationResult.reason = 'Disposable email address';
      validationResult.score = 0;
      return validationResult;
    }
    validationResult.score += 20;
    
    // 5. 检查是否为可信提供商
    const trustedCheck = this.checkTrusted(domain);
    validationResult.checks.trusted = trustedCheck;
    if (trustedCheck.isTrusted) {
      validationResult.score += 30;
      
      // 对于可信提供商，进行额外的格式检查
      const formatCheck = this.checkProviderFormat(localPart, domain);
      validationResult.checks.format = formatCheck;
      if (!formatCheck.valid) {
        validationResult.reason = formatCheck.reason;
        validationResult.score -= 20;
        return validationResult;
      }
    }
    
    // 6. DNS和MX记录检查
    if (!options.skipDNS) {
      const dnsCheck = await this.checkDNSRecords(domain);
      validationResult.checks.dns = dnsCheck;
      if (!dnsCheck.valid) {
        validationResult.reason = dnsCheck.reason;
        return validationResult;
      }
      validationResult.score += 20;
    }
    
    // 7. 角色型邮箱检查
    const roleCheck = this.checkRoleEmail(localPart);
    validationResult.checks.role = roleCheck;
    if (roleCheck.isRole) {
      validationResult.score -= 10;
      validationResult.warnings = validationResult.warnings || [];
      validationResult.warnings.push('Role-based email address');
    }
    
    // 最终判定
    validationResult.valid = validationResult.score >= 50;
    validationResult.confidence = Math.min(validationResult.score / 100, 0.95);
    
    if (validationResult.valid) {
      validationResult.reason = 'Email appears valid';
    }
    
    return validationResult;
  }

  // 语法检查
  checkSyntax(email) {
    // 基本格式检查
    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }
    
    // RFC 5322 兼容检查
    const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!rfcRegex.test(email)) {
      return { valid: false, reason: 'Email format not RFC compliant' };
    }
    
    // 长度检查
    if (email.length > 254) {
      return { valid: false, reason: 'Email too long (max 254 characters)' };
    }
    
    const [localPart, domain] = email.split('@');
    
    // 本地部分检查
    if (localPart.length > 64) {
      return { valid: false, reason: 'Local part too long (max 64 characters)' };
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { valid: false, reason: 'Local part cannot start or end with a dot' };
    }
    
    if (localPart.includes('..')) {
      return { valid: false, reason: 'Consecutive dots not allowed' };
    }
    
    // 域名部分检查
    if (domain.length > 253) {
      return { valid: false, reason: 'Domain too long' };
    }
    
    if (domain.startsWith('-') || domain.endsWith('-')) {
      return { valid: false, reason: 'Domain cannot start or end with hyphen' };
    }
    
    return { valid: true };
  }

  // 检查拼写错误
  checkTypo(domain) {
    if (this.typoCorrections[domain]) {
      return {
        hasTypo: true,
        original: domain,
        correction: this.typoCorrections[domain]
      };
    }
    
    // 使用编辑距离检测相似域名
    for (const trustedDomain of this.trustedProviders) {
      const distance = this.levenshteinDistance(domain, trustedDomain);
      if (distance === 1) {
        return {
          hasTypo: true,
          original: domain,
          correction: trustedDomain
        };
      }
    }
    
    return { hasTypo: false };
  }

  // 计算编辑距离
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 检查一次性邮箱
  checkDisposable(domain) {
    return {
      isDisposable: this.disposableDomains.has(domain),
      domain
    };
  }

  // 检查可信提供商
  checkTrusted(domain) {
    return {
      isTrusted: this.trustedProviders.has(domain),
      domain
    };
  }

  // 检查提供商特定格式
  checkProviderFormat(localPart, domain) {
    // Gmail格式检查
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      // Gmail不允许连续的点
      if (localPart.includes('..')) {
        return { valid: false, reason: 'Gmail does not allow consecutive dots' };
      }
      // Gmail最少6个字符
      if (localPart.replace(/\./g, '').length < 6) {
        return { valid: false, reason: 'Gmail username too short (min 6 characters)' };
      }
    }
    
    // QQ邮箱格式检查
    if (domain === 'qq.com') {
      // QQ邮箱通常是数字
      if (!/^\d{5,12}$/.test(localPart)) {
        // 也可能是英文别名
        if (!/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(localPart)) {
          return { valid: false, reason: 'Invalid QQ email format' };
        }
      }
    }
    
    return { valid: true };
  }

  // DNS记录检查
  async checkDNSRecords(domain) {
    try {
      // 检查MX记录
      const mxRecords = await dns.resolveMx(domain);
      
      if (!mxRecords || mxRecords.length === 0) {
        // 尝试A记录
        try {
          await dns.resolve4(domain);
          return {
            valid: true,
            hasMX: false,
            hasA: true,
            reason: 'Domain has A record but no MX record'
          };
        } catch (aError) {
          return {
            valid: false,
            reason: 'No MX or A records found for domain'
          };
        }
      }
      
      return {
        valid: true,
        hasMX: true,
        mxRecords: mxRecords.map(mx => ({
          priority: mx.priority,
          exchange: mx.exchange
        }))
      };
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        return {
          valid: false,
          reason: 'Domain does not exist'
        };
      }
      
      if (error.code === 'ENODATA') {
        return {
          valid: false,
          reason: 'No DNS records found'
        };
      }
      
      // DNS查询失败，但不能确定邮箱无效
      return {
        valid: true,
        warning: 'DNS check failed',
        error: error.message
      };
    }
  }

  // 检查角色型邮箱
  checkRoleEmail(localPart) {
    const roleNames = [
      'admin', 'administrator', 'webmaster', 'postmaster',
      'info', 'contact', 'support', 'help', 'service',
      'sales', 'marketing', 'hello', 'mail', 'email',
      'noreply', 'no-reply', 'donotreply', 'do-not-reply'
    ];
    
    const isRole = roleNames.includes(localPart.toLowerCase());
    
    return {
      isRole,
      type: isRole ? localPart.toLowerCase() : null
    };
  }

  // 批量验证
  async validateBulk(emails, options = {}) {
    console.log(`📧 批量验证 ${emails.length} 个邮件地址...`);
    
    const results = {
      valid: [],
      invalid: [],
      suggestions: [],
      stats: {
        total: emails.length,
        valid: 0,
        invalid: 0,
        disposable: 0,
        typos: 0,
        roles: 0
      }
    };
    
    // 并发控制
    const batchSize = options.batchSize || 5;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.validateEmail(email, options))
      );
      
      for (const result of batchResults) {
        if (result.valid) {
          results.valid.push(result);
          results.stats.valid++;
        } else {
          results.invalid.push(result);
          results.stats.invalid++;
          
          if (result.checks?.disposable?.isDisposable) {
            results.stats.disposable++;
          }
          if (result.checks?.typo?.hasTypo) {
            results.stats.typos++;
          }
        }
        
        if (result.suggestions?.length > 0) {
          results.suggestions.push(...result.suggestions);
        }
        
        if (result.checks?.role?.isRole) {
          results.stats.roles++;
        }
      }
      
      // 显示进度
      const progress = Math.min(i + batchSize, emails.length);
      console.log(`  进度: ${progress}/${emails.length} (${(progress/emails.length*100).toFixed(1)}%)`);
    }
    
    return results;
  }

  // 缓存管理
  getCachedResult(email) {
    const cached = this.cache.get(email);
    if (cached && Date.now() - cached.cachedAt < this.cacheExpiry) {
      return cached.result;
    }
    return null;
  }

  cacheResult(email, result) {
    this.cache.set(email, {
      result,
      cachedAt: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
    console.log('✅ 验证缓存已清空');
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      validRate: this.stats.totalValidated > 0 ? 
        (this.stats.validEmails / this.stats.totalValidated * 100).toFixed(2) + '%' : '0%'
    };
  }

  // 导出验证报告
  exportReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.stats,
      validEmails: results.valid.map(r => r.email),
      invalidDetails: results.invalid.map(r => ({
        email: r.email,
        reason: r.reason,
        suggestions: r.suggestions
      })),
      recommendations: []
    };
    
    if (results.stats.typos > 0) {
      report.recommendations.push('发现拼写错误，建议使用建议的邮箱地址');
    }
    
    if (results.stats.disposable > 0) {
      report.recommendations.push('检测到一次性邮箱，建议排除这些地址');
    }
    
    if (results.stats.roles > 0) {
      report.recommendations.push('发现角色型邮箱，可能回复率较低');
    }
    
    return report;
  }
}

module.exports = EnhancedEmailValidator;