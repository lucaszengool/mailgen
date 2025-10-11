const axios = require('axios');
const dns = require('dns').promises;
const net = require('net');

class FreeEmailValidator {
  constructor() {
    // 使用完全免费的验证服务
    this.freeServices = {
      rapidEmailVerifier: {
        url: 'https://rapid-email-verifier.fly.dev/api/verify',
        enabled: true,
        rateLimit: null // 无限制
      },
      trumail: {
        url: 'https://api.trumail.io/v2/lookups/json',
        enabled: true,
        rateLimit: null // 无限制
      }
    };
    
    // 本地验证缓存
    this.validationCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
    
    // 已知的无效域名和一次性邮箱域名
    this.disposableDomains = new Set([
      'guerrillamail.com', 'mailinator.com', '10minutemail.com',
      'temp-mail.org', 'throwaway.email', 'getnada.com',
      'tempmail.net', 'trashmail.com', 'yopmail.com',
      'maildrop.cc', 'mintemail.com', 'sharklasers.com'
    ]);
    
    // 已知的有效域名（大型邮件提供商）
    this.trustedDomains = new Set([
      'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
      'icloud.com', 'qq.com', '163.com', '126.com',
      'protonmail.com', 'aol.com', 'mail.com', 'yandex.com'
    ]);
  }

  // 主验证方法
  async validateEmail(email) {
    console.log(`🔍 验证邮件: ${email}`);
    
    // 检查缓存
    const cached = this.getCachedResult(email);
    if (cached) {
      console.log('✅ 使用缓存结果');
      return cached;
    }
    
    // 第一步：本地语法验证
    const syntaxCheck = this.validateSyntax(email);
    if (!syntaxCheck.valid) {
      return this.cacheAndReturn(email, {
        email,
        valid: false,
        reason: syntaxCheck.reason,
        confidence: 1.0,
        source: 'syntax_check'
      });
    }
    
    // 第二步：域名检查
    const domainCheck = await this.validateDomain(email);
    if (!domainCheck.valid) {
      return this.cacheAndReturn(email, {
        email,
        valid: false,
        reason: domainCheck.reason,
        confidence: domainCheck.confidence,
        source: 'domain_check'
      });
    }
    
    // 第三步：使用免费API验证
    const apiResult = await this.validateWithFreeAPI(email);
    if (apiResult) {
      return this.cacheAndReturn(email, apiResult);
    }
    
    // 第四步：DNS和MX记录验证
    const dnsResult = await this.validateDNS(email);
    return this.cacheAndReturn(email, dnsResult);
  }

  // 语法验证
  validateSyntax(email) {
    // RFC 5322标准邮件格式
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }
    
    // 检查长度
    if (email.length > 254) {
      return { valid: false, reason: 'Email too long' };
    }
    
    const [localPart, domain] = email.split('@');
    
    // 本地部分检查
    if (localPart.length > 64) {
      return { valid: false, reason: 'Local part too long' };
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { valid: false, reason: 'Invalid local part' };
    }
    
    if (localPart.includes('..')) {
      return { valid: false, reason: 'Consecutive dots not allowed' };
    }
    
    return { valid: true };
  }

  // 域名验证
  async validateDomain(email) {
    const domain = email.split('@')[1].toLowerCase();
    
    // 检查一次性邮箱域名
    if (this.disposableDomains.has(domain)) {
      return {
        valid: false,
        reason: 'Disposable email domain',
        confidence: 1.0
      };
    }
    
    // 信任的域名直接通过
    if (this.trustedDomains.has(domain)) {
      return {
        valid: true,
        confidence: 0.95
      };
    }
    
    // 检查明显的拼写错误
    const typoCheck = this.checkCommonTypos(domain);
    if (typoCheck.hasTypo) {
      return {
        valid: false,
        reason: `Possible typo: did you mean ${typoCheck.suggestion}?`,
        confidence: 0.9
      };
    }
    
    return { valid: true, confidence: 0.7 };
  }

  // 检查常见拼写错误
  checkCommonTypos(domain) {
    const commonTypos = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'hotnail.com': 'hotmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com'
    };
    
    if (commonTypos[domain]) {
      return {
        hasTypo: true,
        suggestion: commonTypos[domain]
      };
    }
    
    return { hasTypo: false };
  }

  // 使用免费API验证
  async validateWithFreeAPI(email) {
    // 尝试Rapid Email Verifier
    try {
      const response = await axios.post(
        this.freeServices.rapidEmailVerifier.url,
        { email },
        { timeout: 5000 }
      );
      
      if (response.data) {
        return {
          email,
          valid: response.data.valid || false,
          reason: response.data.reason || 'API validation',
          confidence: response.data.valid ? 0.9 : 0.1,
          source: 'rapid_email_verifier'
        };
      }
    } catch (error) {
      console.log('Rapid Email Verifier不可用，尝试其他方法');
    }
    
    // 尝试Trumail
    try {
      const response = await axios.get(
        `${this.freeServices.trumail.url}?email=${encodeURIComponent(email)}`,
        { timeout: 5000 }
      );
      
      if (response.data) {
        return {
          email,
          valid: response.data.deliverable || false,
          reason: response.data.message || 'Trumail validation',
          confidence: response.data.deliverable ? 0.85 : 0.15,
          source: 'trumail'
        };
      }
    } catch (error) {
      console.log('Trumail不可用，使用DNS验证');
    }
    
    return null;
  }

  // DNS和MX记录验证
  async validateDNS(email) {
    const domain = email.split('@')[1];
    
    try {
      // 检查MX记录
      const mxRecords = await dns.resolveMx(domain);
      
      if (!mxRecords || mxRecords.length === 0) {
        return {
          email,
          valid: false,
          reason: 'No MX records found',
          confidence: 0.9,
          source: 'dns_check'
        };
      }
      
      // 检查A记录
      try {
        await dns.resolve4(domain);
      } catch (error) {
        // 没有A记录但有MX记录也是有效的
      }
      
      return {
        email,
        valid: true,
        reason: 'MX records exist',
        confidence: 0.75,
        source: 'dns_check',
        mxRecords: mxRecords.map(mx => ({
          exchange: mx.exchange,
          priority: mx.priority
        }))
      };
      
    } catch (error) {
      return {
        email,
        valid: false,
        reason: 'DNS resolution failed',
        confidence: 0.8,
        source: 'dns_check'
      };
    }
  }

  // SMTP验证（谨慎使用，可能被检测为垃圾邮件）
  async validateSMTP(email, mxHost) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          valid: false,
          reason: 'SMTP timeout',
          confidence: 0.5
        });
      }, 10000);
      
      const client = net.createConnection(25, mxHost);
      
      let stage = 0;
      const commands = [
        `HELO ${mxHost}`,
        `MAIL FROM:<test@example.com>`,
        `RCPT TO:<${email}>`
      ];
      
      client.on('data', (data) => {
        const response = data.toString();
        
        if (stage < commands.length) {
          if (response.startsWith('220') || response.startsWith('250')) {
            client.write(commands[stage] + '\r\n');
            stage++;
          } else if (response.startsWith('550')) {
            // 邮箱不存在
            clearTimeout(timeout);
            client.end();
            resolve({
              valid: false,
              reason: 'Mailbox does not exist',
              confidence: 0.95
            });
          }
        } else {
          // RCPT TO响应
          clearTimeout(timeout);
          client.write('QUIT\r\n');
          client.end();
          
          if (response.startsWith('250')) {
            resolve({
              valid: true,
              reason: 'SMTP verification passed',
              confidence: 0.95
            });
          } else {
            resolve({
              valid: false,
              reason: 'SMTP verification failed',
              confidence: 0.85
            });
          }
        }
      });
      
      client.on('error', () => {
        clearTimeout(timeout);
        resolve({
          valid: false,
          reason: 'SMTP connection failed',
          confidence: 0.6
        });
      });
    });
  }

  // 批量验证
  async validateBulk(emails) {
    console.log(`📧 批量验证 ${emails.length} 个邮件地址...`);
    
    const results = [];
    const batchSize = 10; // 每批处理10个
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.validateEmail(email))
      );
      results.push(...batchResults);
      
      // 显示进度
      console.log(`进度: ${Math.min(i + batchSize, emails.length)}/${emails.length}`);
      
      // 避免过快请求
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  // 缓存管理
  getCachedResult(email) {
    const cached = this.validationCache.get(email.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    return null;
  }

  cacheAndReturn(email, result) {
    this.validationCache.set(email.toLowerCase(), {
      result,
      timestamp: Date.now()
    });
    return result;
  }

  // 获取验证统计
  getStats(results) {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;
    
    const bySource = {};
    results.forEach(r => {
      bySource[r.source] = (bySource[r.source] || 0) + 1;
    });
    
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;
    
    return {
      total,
      valid,
      invalid,
      validationRate: `${(valid / total * 100).toFixed(2)}%`,
      averageConfidence: avgConfidence.toFixed(2),
      bySource
    };
  }

  // 清理缓存
  clearCache() {
    this.validationCache.clear();
    console.log('✅ 缓存已清理');
  }
}

module.exports = FreeEmailValidator;