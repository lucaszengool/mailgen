const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const GmailEmailVerifier = require('../services/GmailEmailVerifier');

class EnhancedEmailSearchAgent {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../SuperEmailDiscoveryEngine.py');
    this.searchCache = new Map();
    this.apiKey = process.env.SCRAPINGDOG_API_KEY || '689e1eadbec7a9c318cc34e9';
    this.emailVerifier = new GmailEmailVerifier();
  }

  async searchEmails(industry, targetCount = 5) {
    console.log(`🚀 使用超级邮箱搜索引擎搜索: ${industry}`);
    
    // 检查缓存
    const cacheKey = `${industry}_${targetCount}`;
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 1800000) { // 30分钟缓存
        console.log('📦 使用缓存的搜索结果');
        return cached.data;
      }
    }

    try {
      // 调用Python超级搜索引擎 - 无超时限制
      const command = `SCRAPINGDOG_API_KEY=${this.apiKey} python3 "${this.pythonScriptPath}" "${industry}" ${targetCount}`;
      console.log(`🔍 执行命令: ${command}`);
      
      // 不设置超时，让搜索有充足时间
      const { stdout, stderr } = await execPromise(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        encoding: 'utf8'
      });

      if (stderr) {
        console.warn(`⚠️ Python警告: ${stderr}`);
      }

      // 解析JSON结果
      const lines = stdout.split('\n');
      let jsonResult = null;
      
      // 从输出中找到JSON结果
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('{') && line.includes('"success"')) {
          try {
            jsonResult = JSON.parse(line);
            break;
          } catch (e) {
            continue;
          }
        }
      }

      if (!jsonResult) {
        // 尝试解析整个输出中的JSON部分
        const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonResult = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('❌ JSON解析失败:', e);
          }
        }
      }

      if (jsonResult && jsonResult.success) {
        console.log(`✅ 超级搜索成功: 找到 ${jsonResult.total_emails} 个邮箱`);
        
        // 转换为前端期望的格式 - 增强公司和用户画像信息
        const prospects = await Promise.all(jsonResult.email_details.map(async detail => {
          const domain = detail.email.split('@')[1];
          const prospectName = this.extractNameFromEmail(detail.email);
          
          // 基础prospect数据
          const baseProspect = {
            email: detail.email,
            name: prospectName,
            source: detail.source,
            sourceUrl: detail.source_url,
            confidence: detail.confidence,
            discoveryMethod: detail.discovery_method,
            domain: domain,
            metadata: {
              round: detail.round,
              strategy: detail.strategy,
              sourceTitle: detail.source_title
            }
          };
          
          // 增强公司信息
          const companyInfo = await this.enrichCompanyInfo(domain, detail.source_url);
          
          // 生成用户画像
          const userPersona = this.generateUserPersona(prospectName, domain, companyInfo, detail);
          
          return {
            ...baseProspect,
            company: companyInfo.name || this.extractCompanyFromDomain(domain),
            companySize: companyInfo.size || this.estimateCompanySize(domain),
            industry: companyInfo.industry || this.estimateIndustry(domain),
            location: companyInfo.location || 'Unknown',
            // 用户画像数据
            persona: userPersona,
            // 额外的营销相关数据
            estimatedRole: this.estimateRole(prospectName, domain),
            communicationStyle: this.estimateCommunicationStyle(userPersona),
            primaryPainPoints: this.identifyPainPoints(companyInfo.industry || domain),
            bestContactTime: this.suggestBestContactTime(companyInfo.location),
            responseRate: this.estimateResponseRate(companyInfo.size, userPersona.seniority),
            // 技术栈和兴趣估计
            techStack: this.estimateTechStack(domain, companyInfo.industry),
            interests: this.estimateInterests(userPersona.role, companyInfo.industry),
            linkedinUrl: this.constructLinkedInUrl(prospectName, companyInfo.name),
            // 验证状态
            verificationStatus: 'pending',
            lastUpdated: new Date().toISOString()
          };
        }));

        // 验证所有搜索到的邮箱地址
        console.log(`📧 开始验证 ${jsonResult.emails.length} 个邮箱地址...`);
        const verificationResult = await this.verifyAllEmails(jsonResult.emails);
        
        // 过滤出已验证的邮箱 - verificationResult.validEmails是对象数组，需要提取email字段
        const verifiedEmailStrings = verificationResult.validEmails.map(v => v.email);
        const verifiedProspects = prospects.filter(prospect => 
          verifiedEmailStrings.includes(prospect.email)
        );

        // 添加验证信息到prospects
        const enrichedProspects = verifiedProspects.map(prospect => {
          const verificationInfo = verificationResult.results.find(r => r.email === prospect.email);
          return {
            ...prospect,
            emailVerified: true,
            verificationMethod: verificationInfo?.method,
            verificationReason: verificationInfo?.reason,
            verifiedAt: verificationInfo?.verifiedAt
          };
        });

        const result = {
          success: true,
          emails: verifiedEmailStrings,
          prospects: enrichedProspects,
          totalFound: jsonResult.total_emails,
          verifiedCount: verifiedEmailStrings.length,
          searchRounds: jsonResult.search_rounds,
          executionTime: jsonResult.execution_time,
          stats: jsonResult.search_stats,
          verification: {
            total: jsonResult.emails.length,
            valid: verificationResult.summary.valid,
            invalid: verificationResult.summary.invalid,
            successRate: verificationResult.summary.successRate
          },
          industry: industry,
          method: 'super_email_discovery_engine_with_verification'
        };

        // 缓存结果
        this.searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      } else {
        console.warn('⚠️ 超级搜索未找到邮箱');
        return {
          success: false,
          emails: [],
          prospects: [],
          totalFound: 0,
          error: '未找到邮箱'
        };
      }
    } catch (error) {
      console.error('❌ 超级邮箱搜索失败:', error);
      return {
        success: false,
        emails: [],
        prospects: [],
        totalFound: 0,
        error: error.message
      };
    }
  }

  extractNameFromEmail(email) {
    const localPart = email.split('@')[0];
    // 尝试从邮箱地址提取名字
    const cleanName = localPart
      .replace(/[0-9]+/g, '')
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
    
    return cleanName || 'Contact';
  }

  async searchWithIndustryContext(strategy, industry = 'technology') {
    console.log(`🎯 基于策略搜索邮箱 - 行业: ${industry}`);
    
    // 从策略中提取行业信息
    if (strategy && strategy.target_audience) {
      const keywords = [];
      
      // 收集所有关键词
      if (strategy.target_audience.search_keywords) {
        const sk = strategy.target_audience.search_keywords;
        keywords.push(...(sk.primary_keywords || []));
        keywords.push(...(sk.industry_keywords || []));
        keywords.push(...(sk.solution_keywords || []));
      }
      
      // 使用关键词作为行业上下文
      const searchContext = keywords.length > 0 
        ? keywords.slice(0, 3).join(' ')
        : industry;
      
      return await this.searchEmails(searchContext, 10);
    }
    
    // 默认搜索
    return await this.searchEmails(industry, 10);
  }

  async enrichProspects(prospects, strategy) {
    console.log(`📊 使用Ollama为 ${prospects.length} 个潜在客户生成AI用户画像...`);
    
    const enrichedProspects = [];
    
    for (const prospect of prospects) {
      console.log(`🧠 为 ${prospect.email} 生成Ollama用户画像...`);
      
      // 使用Ollama生成用户画像
      const persona = await this.generateOllamaPersona(prospect, strategy);
      
      const enriched = {
        ...prospect,
        persona: persona,
        score: this.calculateProspectScore(prospect),
        tags: this.generateTags(prospect, strategy),
        priority: this.calculatePriority(prospect)
      };
      
      enrichedProspects.push(enriched);
    }
    
    return enrichedProspects;
  }

  /**
   * 使用Ollama生成深度用户画像
   */
  async generateOllamaPersona(prospect, strategy) {
    try {
      const axios = require('axios');
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      
      const domain = prospect.domain || prospect.email.split('@')[1];
      const basicRole = this.inferRole(prospect.email, prospect.name);
      const companySize = this.inferCompanySize(domain);
      
      const prompt = `作为营销心理学专家，为以下邮箱联系人生成详细的用户画像：

邮箱: ${prospect.email}
域名: ${domain}
推测角色: ${basicRole}
公司规模: ${companySize}
来源: ${prospect.source}
发现方法: ${prospect.discoveryMethod}
置信度: ${prospect.confidence}

营销策略背景:
- 目标受众: ${strategy?.target_audience?.primary_segments?.join(', ') || 'business professionals'}
- 行业关键词: ${strategy?.target_audience?.search_keywords?.industry_keywords?.join(', ') || 'business'}
- 痛点: ${strategy?.target_audience?.pain_points?.join(', ') || 'efficiency, cost, growth'}

请生成JSON格式的用户画像，包含：
- estimatedRole: 预估职业角色
- seniority: 资历级别 (junior/mid/senior/executive)
- decisionMaking: 决策影响力 (low/medium/high/final)
- communicationStyle: 沟通风格
- primaryPainPoints: 主要痛点 (数组)
- motivations: 动机因素 (数组)
- preferredChannels: 偏好沟通渠道 (数组)
- bestContactTime: 最佳联系时间
- personalizationTips: 个性化建议 (数组)
- industryContext: 行业背景
- buyingSignals: 购买信号 (数组)

只返回JSON格式，不要其他文字。`;

      const response = await axios.post(`${ollamaUrl}/generate`, {
        model: 'qwen2.5:0.5b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      });

      let ollamaPersona;
      try {
        // 尝试解析Ollama的JSON响应
        const responseText = response.data.response;
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          ollamaPersona = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('⚠️ Ollama响应解析失败，使用基础画像');
      }

      // 如果Ollama生成成功，使用AI画像
      if (ollamaPersona && ollamaPersona.estimatedRole) {
        console.log('✅ Ollama用户画像生成成功');
        return {
          method: 'ollama_ai_generated',
          ...ollamaPersona,
          confidence: prospect.confidence,
          generatedAt: new Date().toISOString()
        };
      } else {
        // 回退到基础画像
        return this.generateBasicPersona(prospect, strategy);
      }
    } catch (error) {
      console.log('⚠️ Ollama画像生成失败:', error.message, '- 使用基础画像');
      return this.generateBasicPersona(prospect, strategy);
    }
  }

  generateBasicPersona(prospect, strategy) {
    const domain = prospect.domain || prospect.email.split('@')[1];
    const role = this.inferRole(prospect.email, prospect.name);
    
    return {
      method: 'rule_based_fallback',
      estimatedRole: role,
      companySize: this.inferCompanySize(domain),
      decisionLevel: this.inferDecisionLevel(role),
      communicationStyle: 'Professional',
      primaryPainPoints: strategy?.target_audience?.pain_points || ['Efficiency', 'Cost', 'Growth'],
      bestContactTime: 'Business hours (9 AM - 5 PM)',
      personalizationTips: [
        'Mention specific industry challenges',
        'Focus on ROI and value proposition'
      ]
    };
  }

  inferRole(email, name) {
    const emailLower = email.toLowerCase();
    const nameLower = (name || '').toLowerCase();
    
    if (emailLower.includes('ceo') || nameLower.includes('ceo')) return 'CEO/Founder';
    if (emailLower.includes('cto') || nameLower.includes('cto')) return 'CTO/Technical Lead';
    if (emailLower.includes('sales')) return 'Sales';
    if (emailLower.includes('marketing')) return 'Marketing';
    if (emailLower.includes('support')) return 'Support';
    
    return 'Business Professional';
  }

  inferCompanySize(domain) {
    if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      return 'Startup/Small';
    }
    return 'SME/Enterprise';
  }

  inferDecisionLevel(role) {
    if (['CEO/Founder', 'CTO/Technical Lead'].includes(role)) return 'High';
    if (['Sales', 'Marketing'].includes(role)) return 'Medium';
    return 'Low';
  }

  calculateProspectScore(prospect) {
    let score = 50; // Base score
    
    // Confidence bonus
    score += (prospect.confidence || 0.5) * 30;
    
    // Source bonus
    if (prospect.source === 'website_scraping') score += 10;
    if (prospect.discoveryMethod === 'deep_scraping') score += 10;
    
    // Domain penalty for generic emails
    const domain = prospect.email.split('@')[1];
    if (['gmail.com', 'yahoo.com'].includes(domain)) score -= 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  generateTags(prospect, strategy) {
    const tags = [];
    
    // Source tags
    if (prospect.source) tags.push(prospect.source);
    
    // Industry tags
    if (strategy?.target_audience?.primary_segments) {
      tags.push(...strategy.target_audience.primary_segments.slice(0, 2));
    }
    
    // Priority tags
    const score = prospect.score || this.calculateProspectScore(prospect);
    if (score >= 80) tags.push('high-priority');
    else if (score >= 60) tags.push('medium-priority');
    
    return tags;
  }

  calculatePriority(prospect) {
    const score = prospect.score || this.calculateProspectScore(prospect);
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * 验证所有搜索到的邮箱地址
   */
  async verifyAllEmails(emails) {
    console.log(`🔍 使用简单格式验证 ${emails.length} 个邮箱地址 (不发送测试邮件)`);
    
    try {
      // 使用简单的邮箱格式验证，避免复杂的DNS检查
      const verificationResults = [];
      
      for (const email of emails) {
        // 基本格式验证
        const isValidFormat = this.isValidEmailFormat(email);
        const isDomainBlacklisted = this.isBlacklistedDomain(email);
        
        verificationResults.push({
          email: email,
          isValid: isValidFormat && !isDomainBlacklisted,
          reason: !isValidFormat ? 'Invalid email format' : 
                 isDomainBlacklisted ? 'Domain blacklisted' : 'Email format valid',
          score: isValidFormat && !isDomainBlacklisted ? 85 : 0
        });
      }
      
      const validEmails = verificationResults.filter(r => r.isValid);
      const invalidEmails = verificationResults.filter(r => !r.isValid);
      
      const verificationResult = {
        validEmails: validEmails,
        invalidEmails: invalidEmails,
        results: verificationResults,
        summary: {
          total: emails.length,
          valid: validEmails.length,
          invalid: invalidEmails.length,
          successRate: `${Math.round((validEmails.length / emails.length) * 100)}%`
        }
      };
      
      console.log(`✅ 邮箱验证完成: ${verificationResult.summary.valid}/${verificationResult.summary.total} 有效`);
      console.log(`📊 成功率: ${verificationResult.summary.successRate}`);
      
      // 记录验证详情
      if (verificationResult.results.length > 0) {
        console.log('📧 验证详情:');
        verificationResult.results.forEach(result => {
          const status = result.isValid ? '✅' : '❌';
          console.log(`   ${status} ${result.email} - ${result.reason}`);
        });
      }
      
      return verificationResult;
      
    } catch (error) {
      console.error('❌ 邮箱验证失败:', error.message);
      
      // 验证失败时，假设所有邮箱都有效（保持原有功能）
      return {
        success: false,
        validEmails: emails,
        invalidEmails: [],
        results: emails.map(email => ({
          email,
          isValid: true,
          reason: 'Verification failed, assuming valid',
          method: 'fallback'
        })),
        summary: {
          total: emails.length,
          valid: emails.length,
          invalid: 0,
          successRate: '100% (fallback)'
        },
        error: error.message
      };
    }
  }

  /**
   * 测试Gmail验证器连接
   */
  async testEmailVerifier() {
    console.log('🧪 测试Gmail邮箱验证器连接...');
    return await this.emailVerifier.testConnection();
  }

  /**
   * 简单邮箱格式验证
   */
  isValidEmailFormat(email) {
    // 基本格式检查
    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicRegex.test(email)) return false;
    
    // 检查长度
    if (email.length > 254) return false;
    
    // 检查是否包含明显错误的字符
    if (email.includes('..') || email.includes('@@') || email.endsWith('.')) return false;
    
    // 检查域名部分
    const domain = email.split('@')[1];
    if (!domain || domain.length < 3 || domain.startsWith('.') || domain.endsWith('.')) return false;
    
    return true;
  }

  /**
   * 检查是否为黑名单域名
   */
  isBlacklistedDomain(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    
    // 常见的垃圾/测试域名
    const blacklistedDomains = [
      'example.com', 'test.com', 'localhost', 'invalid.com',
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email'
    ];
    
    // 检查格式错误的域名 (如 ahrojournals@outlook.comDOI)
    if (domain.includes('DOI') || domain.includes('..') || domain.endsWith('comDOI')) {
      return true;
    }
    
    return blacklistedDomains.includes(domain);
  }

  /**
   * 增强公司信息
   */
  async enrichCompanyInfo(domain, sourceUrl) {
    try {
      // 从域名提取公司名称
      const companyName = this.extractCompanyFromDomain(domain);
      
      // 基础公司信息
      const companyInfo = {
        name: companyName,
        domain: domain,
        website: `https://${domain}`,
        size: this.estimateCompanySize(domain),
        industry: this.estimateIndustry(domain),
        location: this.estimateLocation(domain)
      };
      
      return companyInfo;
    } catch (error) {
      console.log(`⚠️ 公司信息增强失败 ${domain}:`, error.message);
      return {
        name: this.extractCompanyFromDomain(domain),
        domain: domain,
        size: 'Unknown',
        industry: 'Unknown',
        location: 'Unknown'
      };
    }
  }

  /**
   * 从域名提取公司名称
   */
  extractCompanyFromDomain(domain) {
    if (!domain) return 'Unknown Company';
    
    // 移除常见的前缀
    let company = domain.replace(/^(www\.|mail\.|email\.|contact\.)/, '');
    
    // 移除顶级域名
    company = company.split('.')[0];
    
    // 首字母大写
    company = company.charAt(0).toUpperCase() + company.slice(1);
    
    return company;
  }

  /**
   * 估计公司规模
   */
  estimateCompanySize(domain) {
    if (!domain) return 'Unknown';
    
    // 基于域名特征估计公司规模
    if (domain.includes('startup') || domain.includes('small')) return 'Small (1-50)';
    if (domain.includes('corp') || domain.includes('inc') || domain.includes('group')) return 'Large (500+)';
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) return 'Government/Educational';
    
    // 默认为中等规模
    return 'Medium (50-500)';
  }

  /**
   * 估计行业
   */
  estimateIndustry(domain) {
    if (!domain) return 'Unknown';
    
    const domainLower = domain.toLowerCase();
    
    // 行业关键词映射
    if (domainLower.includes('tech') || domainLower.includes('soft') || domainLower.includes('ai')) return 'Technology';
    if (domainLower.includes('health') || domainLower.includes('med')) return 'Healthcare';
    if (domainLower.includes('finance') || domainLower.includes('bank')) return 'Finance';
    if (domainLower.includes('retail') || domainLower.includes('shop')) return 'Retail';
    if (domainLower.includes('edu')) return 'Education';
    if (domainLower.includes('consulting')) return 'Consulting';
    
    return 'Business Services';
  }

  /**
   * 估计位置
   */
  estimateLocation(domain) {
    if (!domain) return 'Unknown';
    
    // 基于顶级域名估计位置
    if (domain.endsWith('.co.uk')) return 'United Kingdom';
    if (domain.endsWith('.de')) return 'Germany';
    if (domain.endsWith('.fr')) return 'France';
    if (domain.endsWith('.ca')) return 'Canada';
    if (domain.endsWith('.au')) return 'Australia';
    
    // 默认为美国
    return 'United States';
  }

  /**
   * 生成用户画像
   */
  generateUserPersona(name, domain, companyInfo, details) {
    return {
      name: name,
      role: this.estimateRole(name, domain),
      seniority: this.estimateSeniority(name, domain),
      department: this.estimateDepartment(name, domain),
      communicationStyle: 'professional',
      interests: this.estimateInterests(null, companyInfo.industry),
      painPoints: this.identifyPainPoints(companyInfo.industry),
      decisionMaking: this.estimateDecisionMaking(name, domain),
      budget: this.estimateBudget(companyInfo.size),
      timeline: 'Medium-term (3-6 months)',
      confidence: details.confidence || 70
    };
  }

  /**
   * 估计角色
   */
  estimateRole(name, domain) {
    if (!name && !domain) return 'Contact';
    
    const nameLower = (name || '').toLowerCase();
    const domainLower = (domain || '').toLowerCase();
    
    // 基于邮箱前缀估计角色
    if (nameLower.includes('ceo') || nameLower.includes('founder')) return 'CEO/Founder';
    if (nameLower.includes('cto') || nameLower.includes('tech')) return 'CTO/Tech Lead';
    if (nameLower.includes('marketing') || nameLower.includes('sales')) return 'Marketing/Sales';
    if (nameLower.includes('hr') || nameLower.includes('people')) return 'HR/People';
    if (nameLower.includes('finance') || nameLower.includes('accounting')) return 'Finance';
    
    return 'Business Professional';
  }

  /**
   * 估计资历级别
   */
  estimateSeniority(name, domain) {
    const nameLower = (name || '').toLowerCase();
    
    if (nameLower.includes('ceo') || nameLower.includes('founder') || nameLower.includes('president')) return 'Executive';
    if (nameLower.includes('director') || nameLower.includes('vp') || nameLower.includes('head')) return 'Senior';
    if (nameLower.includes('manager') || nameLower.includes('lead')) return 'Mid-level';
    
    return 'Professional';
  }

  /**
   * 估计部门
   */
  estimateDepartment(name, domain) {
    const nameLower = (name || '').toLowerCase();
    
    if (nameLower.includes('tech') || nameLower.includes('dev') || nameLower.includes('it')) return 'Technology';
    if (nameLower.includes('marketing') || nameLower.includes('growth')) return 'Marketing';
    if (nameLower.includes('sales') || nameLower.includes('business')) return 'Sales';
    if (nameLower.includes('hr') || nameLower.includes('people')) return 'Human Resources';
    if (nameLower.includes('finance') || nameLower.includes('accounting')) return 'Finance';
    
    return 'Operations';
  }

  /**
   * 估计沟通风格
   */
  estimateCommunicationStyle(persona) {
    if (persona.seniority === 'Executive') return 'direct';
    if (persona.department === 'Technology') return 'analytical';
    if (persona.department === 'Marketing') return 'creative';
    
    return 'professional';
  }

  /**
   * 识别痛点
   */
  identifyPainPoints(industry) {
    const painPointMap = {
      'Technology': ['scalability', 'security', 'technical debt'],
      'Healthcare': ['compliance', 'patient care', 'cost management'],
      'Finance': ['regulation', 'security', 'customer acquisition'],
      'Retail': ['inventory management', 'customer experience', 'competition'],
      'Education': ['budget constraints', 'technology adoption', 'student engagement']
    };
    
    return painPointMap[industry] || ['efficiency', 'cost reduction', 'growth'];
  }

  /**
   * 估计决策过程
   */
  estimateDecisionMaking(name, domain) {
    const nameLower = (name || '').toLowerCase();
    
    if (nameLower.includes('ceo') || nameLower.includes('founder')) return 'decision-maker';
    if (nameLower.includes('director') || nameLower.includes('vp')) return 'influencer';
    
    return 'user';
  }

  /**
   * 估计预算范围
   */
  estimateBudget(companySize) {
    const budgetMap = {
      'Small (1-50)': '$1K-$10K',
      'Medium (50-500)': '$10K-$100K',
      'Large (500+)': '$100K+',
      'Government/Educational': '$5K-$50K'
    };
    
    return budgetMap[companySize] || '$5K-$50K';
  }

  /**
   * 建议最佳联系时间
   */
  suggestBestContactTime(location) {
    // 基于时区建议联系时间
    const timeZoneMap = {
      'United States': '10:00 AM - 4:00 PM EST',
      'United Kingdom': '9:00 AM - 5:00 PM GMT',
      'Germany': '9:00 AM - 5:00 PM CET',
      'Australia': '9:00 AM - 5:00 PM AEST'
    };
    
    return timeZoneMap[location] || '9:00 AM - 5:00 PM Local Time';
  }

  /**
   * 估计回复率
   */
  estimateResponseRate(companySize, seniority) {
    let baseRate = 20; // 基础20%
    
    // 公司规模调整
    if (companySize === 'Small (1-50)') baseRate += 10;
    if (companySize === 'Large (500+)') baseRate -= 5;
    
    // 资历调整
    if (seniority === 'Executive') baseRate -= 5;
    if (seniority === 'Mid-level') baseRate += 5;
    
    return Math.min(Math.max(baseRate, 5), 40) + '%';
  }

  /**
   * 估计技术栈
   */
  estimateTechStack(domain, industry) {
    const techStacks = {
      'Technology': ['JavaScript', 'Python', 'AWS', 'Docker'],
      'Healthcare': ['HIPAA', 'EMR', 'HL7', 'Cloud'],
      'Finance': ['Security', 'Compliance', 'API', 'Mobile'],
      'Retail': ['E-commerce', 'POS', 'Inventory', 'Analytics']
    };
    
    return techStacks[industry] || ['CRM', 'Email', 'Analytics'];
  }

  /**
   * 估计兴趣点
   */
  estimateInterests(role, industry) {
    const interests = ['efficiency', 'cost reduction', 'growth', 'innovation'];
    
    if (industry === 'Technology') interests.push('AI', 'automation');
    if (role && role.includes('Marketing')) interests.push('lead generation', 'analytics');
    
    return interests;
  }

  /**
   * 构建LinkedIn URL
   */
  constructLinkedInUrl(name, companyName) {
    if (!name) return null;
    
    const nameSlug = name.toLowerCase().replace(/\s+/g, '-');
    return `https://linkedin.com/in/${nameSlug}`;
  }
}

module.exports = EnhancedEmailSearchAgent;