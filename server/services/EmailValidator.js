/**
 * Email Validator Service
 * Node.js wrapper for Python EmailVerificationService
 * 使用SMTP验证邮箱地址的有效性
 */

const { spawn } = require('child_process');
const path = require('path');

class EmailValidator {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../EmailVerificationService.py');
    this.smtp_email = 'luzgool001@gmail.com';
    this.validationCache = new Map(); // 缓存验证结果避免重复验证
    
    console.log('📧 Email Validator Service initialized');
    console.log(`   📤 SMTP验证邮箱: ${this.smtp_email}`);
    console.log('   🎯 用于过滤无效邮箱地址');
  }

  /**
   * 验证邮箱列表
   */
  async validateEmails(emailList) {
    if (!emailList || emailList.length === 0) {
      return {
        success: true,
        valid_emails: [],
        invalid_emails: [],
        message: 'No emails to validate'
      };
    }

    console.log(`🔍 开始验证 ${emailList.length} 个邮箱地址...`);
    
    // 过滤已缓存的结果
    const newEmails = [];
    const cachedResults = {
      valid: [],
      invalid: []
    };
    
    for (const email of emailList) {
      if (this.validationCache.has(email)) {
        const cached = this.validationCache.get(email);
        if (cached.valid) {
          cachedResults.valid.push(email);
        } else {
          cachedResults.invalid.push(email);
        }
      } else {
        newEmails.push(email);
      }
    }
    
    if (cachedResults.valid.length > 0 || cachedResults.invalid.length > 0) {
      console.log(`   📦 使用缓存结果: ${cachedResults.valid.length} 有效, ${cachedResults.invalid.length} 无效`);
    }
    
    // 如果没有新邮箱需要验证
    if (newEmails.length === 0) {
      return {
        success: true,
        valid_emails: cachedResults.valid.map(email => ({ email, cached: true })),
        invalid_emails: cachedResults.invalid.map(email => ({ email, cached: true })),
        message: 'All results from cache'
      };
    }
    
    // 调用Python验证服务
    return new Promise((resolve) => {
      const python = spawn('python3', [
        this.pythonScriptPath,
        JSON.stringify(newEmails)
      ]);
      
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          console.error('   ❌ Python验证服务执行失败:', error);
          // 返回原始列表，不过滤
          resolve({
            success: false,
            valid_emails: emailList.map(email => ({ email, validated: false })),
            invalid_emails: [],
            error: 'Validation service failed',
            message: 'Using unvalidated emails due to service failure'
          });
          return;
        }
        
        try {
          // 解析Python输出
          const lines = output.split('\n');
          let jsonResult = null;
          
          // 查找JSON结果（最后一个有效的JSON对象）
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              try {
                jsonResult = JSON.parse(line);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          
          if (!jsonResult) {
            console.error('   ❌ 无法解析验证结果');
            resolve({
              success: false,
              valid_emails: emailList.map(email => ({ email, validated: false })),
              invalid_emails: [],
              error: 'Failed to parse validation results'
            });
            return;
          }
          
          // 更新缓存
          if (jsonResult.valid_emails) {
            jsonResult.valid_emails.forEach(result => {
              this.validationCache.set(result.email, { valid: true, ...result });
            });
          }
          if (jsonResult.invalid_emails) {
            jsonResult.invalid_emails.forEach(result => {
              this.validationCache.set(result.email, { valid: false, ...result });
            });
          }
          
          // 合并缓存结果和新验证结果
          const allValidEmails = [
            ...cachedResults.valid.map(email => ({ email, cached: true })),
            ...(jsonResult.valid_emails || [])
          ];
          
          const allInvalidEmails = [
            ...cachedResults.invalid.map(email => ({ email, cached: true })),
            ...(jsonResult.invalid_emails || [])
          ];
          
          console.log(`   ✅ 验证完成: ${allValidEmails.length} 有效, ${allInvalidEmails.length} 无效`);
          
          resolve({
            success: true,
            valid_emails: allValidEmails,
            invalid_emails: allInvalidEmails,
            verification_stats: jsonResult.verification_stats,
            message: 'Email validation completed'
          });
          
        } catch (parseError) {
          console.error('   ❌ 结果解析错误:', parseError.message);
          resolve({
            success: false,
            valid_emails: emailList.map(email => ({ email, validated: false })),
            invalid_emails: [],
            error: parseError.message
          });
        }
      });
      
      // 设置超时（5分钟）
      setTimeout(() => {
        python.kill();
        console.log('   ⏱️ 验证超时，使用未验证的邮箱');
        resolve({
          success: false,
          valid_emails: emailList.map(email => ({ email, validated: false })),
          invalid_emails: [],
          error: 'Validation timeout',
          message: 'Using unvalidated emails due to timeout'
        });
      }, 300000); // 5分钟超时
    });
  }
  
  /**
   * 快速验证单个邮箱（基于格式）
   */
  quickValidateEmail(email) {
    // 基本格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid format' };
    }
    
    // 检查常见的无效模式
    const invalidPatterns = [
      'noreply@',
      'no-reply@',
      'donotreply@',
      'mailer-daemon@',
      'postmaster@',
      'example.com',
      'test.com',
      'localhost'
    ];
    
    for (const pattern of invalidPatterns) {
      if (email.toLowerCase().includes(pattern)) {
        return { valid: false, reason: `Invalid pattern: ${pattern}` };
      }
    }
    
    return { valid: true, reason: 'Format valid' };
  }
  
  /**
   * 过滤邮箱列表（移除明显无效的）
   */
  filterEmails(emails) {
    const filtered = [];
    const rejected = [];
    
    for (const emailObj of emails) {
      const email = typeof emailObj === 'string' ? emailObj : emailObj.email;
      const quickCheck = this.quickValidateEmail(email);
      
      if (quickCheck.valid) {
        filtered.push(emailObj);
      } else {
        rejected.push({
          ...emailObj,
          rejected: true,
          reason: quickCheck.reason
        });
      }
    }
    
    console.log(`   🔍 快速过滤: ${filtered.length} 通过, ${rejected.length} 拒绝`);
    
    return {
      valid: filtered,
      invalid: rejected
    };
  }
  
  /**
   * 清空缓存
   */
  clearCache() {
    this.validationCache.clear();
    console.log('   🧹 验证缓存已清空');
  }
}

module.exports = EmailValidator;