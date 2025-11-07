/**
 * Ollama SearxNG Email Discovery Integration
 * 集成Ollama + SearxNG的邮箱发现系统到后端
 */

const { spawn } = require('child_process');
const path = require('path');

class OllamaSearxNGEmailDiscovery {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../OllamaSearxNGEmailAgent.py');
    
    console.log('🤖 Ollama SearxNG Email Discovery 初始化');
    console.log('   🧠 AI引擎: Ollama (多模型)');
    console.log('   🌐 搜索引擎: SearxNG (JSON格式)');
    console.log('   👤 用户画像: AI生成');
    console.log('   ⚡ 特色: 完全本地化智能邮箱发现');
  }

  /**
   * 使用Ollama + SearxNG发现邮箱并生成用户画像
   */
  async discoverEmailsWithProfiles(industry, maxEmails = 5) {
    try {
      console.log(`🔍 开始Ollama + SearxNG邮箱发现: ${industry}`);

      // Execute Python Agent for REAL search
      console.log('🚀 Calling Python Agent for REAL prospect search...');
      const result = await this.executePythonAgent(industry, maxEmails);
      
      if (result.success) {
        console.log(`✅ 发现完成: ${result.total_emails}个邮箱, ${result.total_profiles}个画像`);
        
        // 转换为标准格式
        const prospects = result.email_details.map((emailData, index) => {
          const profile = result.user_profiles[index] || this.createBasicProfile(emailData.email, industry);
          
          return {
            email: emailData.email,
            name: this.extractNameFromProfile(profile),
            company: this.extractCompanyFromProfile(profile, emailData),
            role: profile.estimated_role || 'Business Professional',
            source: emailData.source || 'ollama_searxng',
            sourceUrl: emailData.source_url || '',
            sourceTitle: emailData.source_title || '',
            confidence: emailData.confidence || profile.confidence_score || 0.8,
            method: emailData.method || 'ollama_searxng_integration',
            
            // 用户画像数据
            profile: {
              estimatedRole: profile.estimated_role,
              companySize: profile.company_size,
              decisionLevel: profile.decision_level,
              communicationStyle: profile.communication_style,
              painPoints: profile.pain_points || [],
              bestContactTime: profile.best_contact_time,
              emailStrategy: profile.email_strategy,
              personalizationTips: profile.personalization_tips || [],
              confidenceScore: profile.confidence_score,
              generatedBy: profile.profile_generated_by || 'ollama_ai',
              generatedAt: profile.generated_at || new Date().toISOString()
            },
            
            // 搜索元数据
            searchMetadata: {
              industry: industry,
              searchStrategies: result.search_strategies,
              discoveryMethod: result.discovery_method,
              executionTime: result.execution_time,
              timestamp: result.timestamp
            }
          };
        });
        
        return {
          success: true,
          prospects: prospects,
          totalFound: result.total_emails,
          totalProfiles: result.total_profiles,
          searchStrategies: result.search_strategies,
          executionTime: result.execution_time,
          method: 'ollama_searxng_integration'
        };
      } else {
        console.log(`⚠️ 邮箱发现失败: ${result.error || 'Unknown error'}`);
        return {
          success: false,
          prospects: [],
          error: result.error || 'Email discovery failed'
        };
      }
      
    } catch (error) {
      console.error('❌ Ollama SearxNG邮箱发现错误:', error.message);
      return {
        success: false,
        prospects: [],
        error: error.message
      };
    }
  }

  /**
   * 执行Python Agent脚本
   */
  async executePythonAgent(industry, maxEmails) {
    return new Promise((resolve, reject) => {
      console.log(`   🐍 执行Python Agent: ${industry}, ${maxEmails}个邮箱`);
      
      const python = spawn('python3', [
        this.pythonScriptPath,
        industry,
        maxEmails.toString(),
        'api'  // API模式：只输出JSON，无其他文本
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
          console.error('   ❌ Python脚本执行失败:', error);
          resolve({
            success: false,
            error: `Python agent failed: ${error}`,
            code: code
          });
          return;
        }

        try {
          // API模式下应该只有纯JSON输出
          console.log('   📋 Python Agent API模式输出长度:', output.length, '字符');
          console.log('   📋 Python Agent 错误输出:', error || 'None');
          
          // 直接解析JSON（API模式下应该是纯JSON）
          const cleanOutput = output.trim();
          console.log('   🔍 解析纯JSON输出...');
          
          let jsonResult;
          try {
            jsonResult = JSON.parse(cleanOutput);
            console.log('   ✅ API模式JSON解析成功!');
          } catch (e) {
            console.error('   ❌ API模式JSON解析失败:', e.message);
            console.log('   📋 原始输出用于调试:');
            console.log('=== RAW OUTPUT START ===');
            console.log(cleanOutput);
            console.log('=== RAW OUTPUT END ===');
            
            // 尝试从输出中找到JSON部分
            const jsonStart = cleanOutput.indexOf('{');
            const jsonEnd = cleanOutput.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              const jsonString = cleanOutput.substring(jsonStart, jsonEnd);
              console.log('   🔄 尝试提取JSON部分:', jsonString.substring(0, 100) + '...');
              try {
                jsonResult = JSON.parse(jsonString);
                console.log('   ✅ 提取的JSON解析成功!');
              } catch (e2) {
                resolve({
                  success: false,
                  error: 'Failed to parse JSON result',
                  rawOutput: cleanOutput.substring(0, 2000),
                  jsonParseError: e.message
                });
                return;
              }
            } else {
              resolve({
                success: false,
                error: 'No JSON found in output',
                rawOutput: cleanOutput.substring(0, 2000),
                jsonParseError: e.message
              });
              return;
            }
          }

          if (jsonResult) {
            console.log(`   ✅ Python Agent执行成功`);
            resolve(jsonResult);
          } else {
            console.error('   ❌ 未找到有效的JSON结果');
            resolve({
              success: false,
              error: 'No valid JSON result found',
              rawOutput: output.substring(0, 1000)
            });
          }

        } catch (parseError) {
          console.error('   ❌ 结果解析错误:', parseError.message);
          resolve({
            success: false,
            error: `Result parsing failed: ${parseError.message}`,
            rawOutput: output.substring(0, 1000)
          });
        }
      });

      // 移除超时限制 - 让Ollama + SearxNG有足够时间完成搜索
      // No timeout - allow full execution time for Ollama + SearxNG discovery
    });
  }

  /**
   * 从用户画像中提取姓名
   */
  extractNameFromProfile(profile) {
    if (profile.email) {
      const emailParts = profile.email.split('@')[0];
      return emailParts.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Professional';
    }
    return 'Business Professional';
  }

  /**
   * 从用户画像中提取公司名
   */
  extractCompanyFromProfile(profile, emailData) {
    if (emailData.email) {
      const domain = emailData.email.split('@')[1];
      if (domain) {
        return domain.split('.')[0].replace(/\b\w/g, l => l.toUpperCase()) || 'Company';
      }
    }
    return profile.company_size || `${emailData?.industry || 'Professional'} Organization`;
  }

  /**
   * 创建基础用户画像
   */
  createBasicProfile(email, industry) {
    const domain = email.split('@')[1] || 'unknown.com';
    
    return {
      email: email,
      estimated_role: 'Business Professional',
      company_size: 'Unknown',
      decision_level: 'Medium',
      communication_style: 'Professional',
      pain_points: [`${industry} industry challenges`, 'Business efficiency'],
      best_contact_time: 'Business hours',
      email_strategy: 'Professional outreach with clear value proposition',
      personalization_tips: ['Mention industry relevance', 'Focus on business benefits'],
      confidence_score: 0.6,
      profile_generated_by: 'basic_template',
      generated_at: new Date().toISOString(),
      domain: domain
    };
  }

  /**
   * 为特定搜索策略生成邮箱
   */
  async searchWithStrategy(strategy, maxEmails = 3) {
    try {
      console.log(`🎯 执行特定搜索策略: ${strategy.target_audience?.type || 'general'}`);
      
      const industry = strategy.industry || 'Technology';
      const result = await this.discoverEmailsWithProfiles(industry, maxEmails);
      
      if (result.success) {
        // 为每个prospect添加策略相关信息
        const enhancedProspects = result.prospects.map(prospect => ({
          ...prospect,
          strategy: {
            companyName: strategy.company_name,
            targetAudience: strategy.target_audience,
            searchKeywords: strategy.target_audience?.search_keywords,
            industryContext: strategy.description
          }
        }));
        
        return {
          success: true,
          prospects: enhancedProspects,
          strategy: strategy,
          searchMethod: 'ollama_searxng_strategy'
        };
      } else {
        return result;
      }
      
    } catch (error) {
      console.error('❌ 策略搜索错误:', error.message);
      return {
        success: false,
        prospects: [],
        error: error.message
      };
    }
  }

  /**
   * 生成快速邮箱发现结果（绕过Python Agent挂起）
   */
  async generateQuickEmailDiscovery(industry, maxEmails = 5) {
    console.log(`⚡ 使用快速模板生成 ${industry} 行业的邮箱发现结果...`);
    
    // 生成模拟但合理的邮箱发现结果
    const mockEmails = this.generateMockEmailsForIndustry(industry, maxEmails);
    const mockProfiles = mockEmails.map(emailData => this.generateMockProfile(emailData, industry));
    
    return {
      success: true,
      total_emails: mockEmails.length,
      total_profiles: mockProfiles.length,
      emails: mockEmails.map(e => e.email),
      email_details: mockEmails,
      user_profiles: mockProfiles,
      search_strategies: [
        `${industry} company contact email`,
        `${industry} business email address`,
        `${industry} startup founder email`
      ],
      discovery_method: 'quick_template_bypass',
      execution_time: 1.5,
      timestamp: new Date().toISOString(),
      ollama_enabled: false,
      searxng_enabled: false,
      profile_generation: 'template_based'
    };
  }

  generateMockEmailsForIndustry(industry, maxEmails) {
    // DISABLED - No more mock emails, only real search
    console.log('⚠️ Mock email generation disabled - use real search only');
    return [];
  }

  generateMockProfile(emailData, industry) {
    const email = emailData.email;
    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];
    
    let role = 'Business Professional';
    let decisionLevel = 'Medium';
    
    if (localPart.includes('ceo') || localPart.includes('founder')) {
      role = 'CEO/Founder';
      decisionLevel = 'High';
    } else if (localPart.includes('sales') || localPart.includes('business')) {
      role = 'Sales/Business Development';
    } else if (localPart.includes('marketing')) {
      role = 'Marketing Manager';
    } else if (localPart.includes('tech')) {
      role = 'Technical Lead';
      decisionLevel = 'High';
    }
    
    return {
      email: email,
      estimated_role: role,
      company_size: 'Startup',
      decision_level: decisionLevel,
      communication_style: 'Professional',
      pain_points: [`${industry} industry challenges`, 'Business growth', 'Technology adoption'],
      best_contact_time: 'Business hours',
      email_strategy: 'Professional outreach with clear value proposition',
      personalization_tips: ['Mention industry relevance', 'Focus on business benefits'],
      confidence_score: 0.8,
      profile_generated_by: 'quick_template',
      generated_at: new Date().toISOString(),
      domain: domain
    };
  }

  /**
   * 检查系统状态
   */
  async checkSystemStatus() {
    try {
      const axios = require('axios');
      
      // 检查Ollama
      let ollamaStatus = false;
      try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const ollamaResponse = await axios.get(`${ollamaUrl}/api/tags`); // No timeout
        ollamaStatus = ollamaResponse.status === 200;
      } catch (e) {
        ollamaStatus = false;
      }

      // 检查SearxNG
      let searxngStatus = false;
      try {
        const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
        const searxngResponse = await axios.get(`${searxngUrl}/search`, {
          params: { q: 'test', format: 'json' }
        }); // No timeout
        searxngStatus = searxngResponse.status === 200;
      } catch (e) {
        searxngStatus = false;
      }

      return {
        ready: ollamaStatus && searxngStatus,
        ollama: ollamaStatus,
        searxng: searxngStatus,
        pythonScript: require('fs').existsSync(this.pythonScriptPath)
      };
    } catch (error) {
      return {
        ready: false,
        error: error.message
      };
    }
  }
}

module.exports = OllamaSearxNGEmailDiscovery;