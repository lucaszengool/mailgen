const axios = require('axios');

class EmailValidationService {
  constructor() {
    // 支持多种邮件验证服务，防止单点故障
    this.validators = {
      zerobounce: {
        url: 'https://api.zerobounce.net/v2/validate',
        apiKey: process.env.ZEROBOUNCE_API_KEY,
        enabled: !!process.env.ZEROBOUNCE_API_KEY
      },
      abstractapi: {
        url: 'https://emailvalidation.abstractapi.com/v1/',
        apiKey: process.env.ABSTRACTAPI_KEY,
        enabled: !!process.env.ABSTRACTAPI_KEY
      },
      clearout: {
        url: 'https://api.clearout.io/v2/email_verify/instant',
        apiKey: process.env.CLEAROUT_API_KEY,
        enabled: !!process.env.CLEAROUT_API_KEY
      }
    };
    
    this.cache = new Map(); // 缓存验证结果
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存
  }

  async validateEmail(email) {
    console.log(`📧 验证邮件地址: ${email}`);
    
    // 检查缓存
    const cacheKey = email.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('✅ 使用缓存的验证结果');
      return cached.result;
    }

    // 基本格式验证
    const basicValidation = this.basicEmailValidation(email);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // 尝试多个验证服务
    for (const [serviceName, config] of Object.entries(this.validators)) {
      if (!config.enabled) continue;
      
      try {
        const result = await this.validateWithService(email, serviceName, config);
        
        // 缓存结果
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        console.log(`✅ 邮件验证完成 (${serviceName}): ${result.status}`);
        return result;
      } catch (error) {
        console.error(`❌ ${serviceName} 验证失败:`, error.message);
        continue; // 尝试下一个服务
      }
    }

    // 如果所有API都失败，返回基本验证结果
    console.log('⚠️ 所有验证服务失败，使用基本验证');
    return basicValidation;
  }

  basicEmailValidation(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    // 检查常见的无效域名
    const invalidDomains = [
      'example.com', 'test.com', 'invalid.com', 
      'fake.com', 'dummy.com', 'tempmail.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    const isDomainInvalid = invalidDomains.includes(domain);
    
    return {
      email,
      isValid: isValid && !isDomainInvalid,
      status: isValid && !isDomainInvalid ? 'valid' : 'invalid',
      confidence: isValid && !isDomainInvalid ? 0.7 : 0.1,
      reason: isDomainInvalid ? 'Invalid domain' : !isValid ? 'Invalid format' : null,
      service: 'basic_validation'
    };
  }

  async validateWithService(email, serviceName, config) {
    switch (serviceName) {
      case 'zerobounce':
        return await this.validateWithZeroBounce(email, config);
      case 'abstractapi':
        return await this.validateWithAbstractAPI(email, config);
      case 'clearout':
        return await this.validateWithClearout(email, config);
      default:
        throw new Error(`Unsupported validation service: ${serviceName}`);
    }
  }

  async validateWithZeroBounce(email, config) {
    const response = await axios.get(`${config.url}?api_key=${config.apiKey}&email=${encodeURIComponent(email)}`, {
      timeout: 10000
    });

    const data = response.data;
    return {
      email,
      isValid: data.status === 'valid',
      status: data.status, // valid, invalid, catch-all, unknown, spamtrap, abuse, do_not_mail
      confidence: this.mapZeroBounceConfidence(data.status),
      reason: data.sub_status,
      service: 'zerobounce',
      details: {
        account: data.account,
        domain: data.domain,
        disposable: data.disposable,
        toxic: data.toxic,
        firstname: data.firstname,
        lastname: data.lastname,
        gender: data.gender
      }
    };
  }

  async validateWithAbstractAPI(email, config) {
    const response = await axios.get(`${config.url}?api_key=${config.apiKey}&email=${encodeURIComponent(email)}`, {
      timeout: 10000
    });

    const data = response.data;
    return {
      email,
      isValid: data.deliverability === 'DELIVERABLE',
      status: data.deliverability, // DELIVERABLE, UNDELIVERABLE, RISKY, UNKNOWN
      confidence: this.mapAbstractAPIConfidence(data.deliverability, data.quality_score),
      reason: data.is_valid_format.text,
      service: 'abstractapi',
      details: {
        is_disposable_email: data.is_disposable_email.value,
        is_role_email: data.is_role_email.value,
        is_catchall_email: data.is_catchall_email.value,
        is_mx_found: data.is_mx_found.value,
        is_smtp_valid: data.is_smtp_valid.value,
        quality_score: data.quality_score
      }
    };
  }

  async validateWithClearout(email, config) {
    const response = await axios.post(config.url, {
      email: email,
      timeout: 10
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = response.data.data;
    return {
      email,
      isValid: data.status === 'valid',
      status: data.status, // valid, invalid, unknown, disposable, role
      confidence: this.mapClearoutConfidence(data.status, data.risk),
      reason: data.reason,
      service: 'clearout',
      details: {
        risk: data.risk,
        disposable: data.disposable,
        role: data.role,
        free_email: data.free_email,
        mx_records: data.mx_records
      }
    };
  }

  mapZeroBounceConfidence(status) {
    const mapping = {
      'valid': 0.95,
      'catch-all': 0.7,
      'unknown': 0.5,
      'invalid': 0.05,
      'spamtrap': 0.0,
      'abuse': 0.0,
      'do_not_mail': 0.0
    };
    return mapping[status] || 0.3;
  }

  mapAbstractAPIConfidence(deliverability, qualityScore) {
    const baseConfidence = {
      'DELIVERABLE': 0.9,
      'RISKY': 0.6,
      'UNDELIVERABLE': 0.1,
      'UNKNOWN': 0.4
    }[deliverability] || 0.3;
    
    // 调整基于质量分数
    if (qualityScore !== undefined) {
      return Math.min(0.95, baseConfidence + (qualityScore / 100) * 0.3);
    }
    
    return baseConfidence;
  }

  mapClearoutConfidence(status, risk) {
    const baseConfidence = {
      'valid': 0.9,
      'unknown': 0.5,
      'invalid': 0.1,
      'disposable': 0.2,
      'role': 0.6
    }[status] || 0.3;
    
    // 调整基于风险级别
    if (risk === 'high') return Math.max(0.1, baseConfidence - 0.3);
    if (risk === 'medium') return Math.max(0.3, baseConfidence - 0.1);
    
    return baseConfidence;
  }

  async validateBulkEmails(emails) {
    console.log(`📧 批量验证 ${emails.length} 个邮件地址...`);
    const results = [];
    
    // 并发验证，但限制并发数量
    const concurrency = 5;
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(email => this.validateEmail(email))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            email: batch[results.length % batch.length],
            isValid: false,
            status: 'error',
            confidence: 0.0,
            reason: result.reason,
            service: 'bulk_validation'
          });
        }
      }
      
      // 防止API限制
      if (i + concurrency < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // 清理邮件列表，移除无效地址
  filterValidEmails(validationResults, minConfidence = 0.7) {
    return validationResults.filter(result => 
      result.isValid && result.confidence >= minConfidence
    );
  }

  // 获取验证统计
  getValidationStats(validationResults) {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.isValid).length;
    const invalid = total - valid;
    
    const statusCounts = {};
    validationResults.forEach(result => {
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    });
    
    return {
      total,
      valid,
      invalid,
      validRate: total > 0 ? (valid / total * 100).toFixed(2) + '%' : '0%',
      statusBreakdown: statusCounts,
      averageConfidence: total > 0 ? 
        (validationResults.reduce((sum, r) => sum + r.confidence, 0) / total).toFixed(2) : 0
    };
  }

  // 清理缓存
  clearCache() {
    this.cache.clear();
    console.log('🧹 验证缓存已清空');
  }
}

module.exports = EmailValidationService;