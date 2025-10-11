/**
 * Ollama SearxNG Integration Route
 * 集成Ollama + SearxNG的邮箱搜索和用户画像生成API
 */

const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

/**
 * 使用Ollama + SearxNG进行智能邮箱发现
 */
router.post('/discover-emails', async (req, res) => {
  try {
    const { industry, maxEmails = 5, targetGoal = 'partnership' } = req.body;

    if (!industry) {
      return res.status(400).json({
        success: false,
        error: '请提供行业名称'
      });
    }

    console.log(`🚀 启动Ollama + SearxNG邮箱发现: ${industry}`);

    // 调用Python脚本
    const python = spawn('python3', [
      '/Users/James/Desktop/agent/OllamaSearxNGEmailAgent.py',
      industry,
      maxEmails.toString()
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
        console.error('❌ Ollama SearxNG Agent 错误:', error);
        return res.status(500).json({
          success: false,
          error: '邮箱发现失败',
          details: error
        });
      }

      try {
        // 提取JSON结果 - 找到最后一个完整的JSON对象
        const lines = output.split('\n');
        let jsonLine = '';
        
        // 从后往前找JSON结果
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].trim().startsWith('{')) {
            jsonLine = lines[i].trim();
            break;
          }
        }
        
        if (!jsonLine) {
          // 如果没找到单行JSON，尝试找多行JSON
          const jsonStart = output.lastIndexOf('{');
          if (jsonStart !== -1) {
            jsonLine = output.substring(jsonStart);
          }
        }
        
        if (jsonLine) {
          const jsonResult = JSON.parse(jsonLine);
          
          console.log(`✅ 发现了${jsonResult.total_emails}个邮箱和${jsonResult.total_profiles}个用户画像`);
          
          return res.json({
            success: true,
            data: {
              emails: jsonResult.emails,
              emailDetails: jsonResult.email_details,
              userProfiles: jsonResult.user_profiles,
              statistics: {
                totalEmails: jsonResult.total_emails,
                totalProfiles: jsonResult.total_profiles,
                executionTime: jsonResult.execution_time,
                searchStrategies: jsonResult.search_strategies.length
              },
              metadata: {
                industry: jsonResult.industry,
                discoveryMethod: jsonResult.discovery_method,
                ollamaEnabled: jsonResult.ollama_enabled,
                searxngEnabled: jsonResult.searxng_enabled,
                profileGeneration: jsonResult.profile_generation,
                timestamp: jsonResult.timestamp
              }
            }
          });
        } else {
          throw new Error('无法解析JSON结果');
        }

      } catch (parseError) {
        console.error('❌ 结果解析错误:', parseError.message);
        return res.status(500).json({
          success: false,
          error: '结果解析失败',
          details: parseError.message,
          rawOutput: output.substring(0, 1000) // 返回部分原始输出用于调试
        });
      }
    });

  } catch (error) {
    console.error('❌ Ollama SearxNG API错误:', error.message);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      details: error.message
    });
  }
});

/**
 * 为特定邮箱生成详细用户画像
 */
router.post('/generate-profile', async (req, res) => {
  try {
    const { email, industryContext, sourceInfo } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '请提供邮箱地址'
      });
    }

    console.log(`👤 为 ${email} 生成用户画像...`);

    // 使用内置的用户画像生成逻辑
    const OllamaAgent = require('../agents/OllamaLearningAgent');
    const agent = new OllamaAgent();

    const profilePrompt = `基于以下信息为邮箱用户生成详细的商业用户画像:

邮箱地址: ${email}
行业背景: ${industryContext || 'Technology'}
来源信息: ${sourceInfo || 'Web search'}

请分析并生成包含以下信息的用户画像:

1. 推测的职位角色 (CEO, Sales, Marketing, Support, etc.)
2. 可能的公司规模 (Startup, SME, Enterprise)
3. 决策能力级别 (High, Medium, Low)
4. 沟通偏好 (Formal, Casual, Technical)
5. 主要关注点/痛点
6. 最佳联系时机
7. 推荐的邮件策略
8. 个性化建议

请返回JSON格式的用户画像`;

    const profileResult = await agent.generateWithOllama(profilePrompt, 'profile');

    if (profileResult) {
      try {
        const profile = typeof profileResult === 'string' ? JSON.parse(profileResult) : profileResult;
        
        return res.json({
          success: true,
          data: {
            email: email,
            profile: profile,
            generatedAt: new Date().toISOString(),
            generatedBy: 'ollama_ai',
            context: {
              industry: industryContext,
              source: sourceInfo
            }
          }
        });
      } catch (jsonError) {
        // 如果JSON解析失败，返回文本格式
        return res.json({
          success: true,
          data: {
            email: email,
            profile: {
              rawAnalysis: profileResult,
              estimated_role: 'Business Professional',
              confidence_score: 0.7
            },
            generatedAt: new Date().toISOString(),
            generatedBy: 'ollama_ai_text',
            context: {
              industry: industryContext,
              source: sourceInfo
            }
          }
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        error: '用户画像生成失败'
      });
    }

  } catch (error) {
    console.error('❌ 用户画像生成错误:', error.message);
    res.status(500).json({
      success: false,
      error: '用户画像生成失败',
      details: error.message
    });
  }
});

/**
 * 批量邮箱发现并直接集成到营销工作流程
 */
router.post('/integrate-with-marketing', async (req, res) => {
  try {
    const { 
      targetWebsite, 
      campaignGoal, 
      businessType, 
      maxEmails = 10,
      generateProfiles = true 
    } = req.body;

    if (!targetWebsite) {
      return res.status(400).json({
        success: false,
        error: '请提供目标网站'
      });
    }

    console.log(`🎯 集成邮箱发现到营销工作流程: ${targetWebsite}`);

    // 1. 首先分析业务
    const SmartBusinessAnalyzer = require('../agents/SmartBusinessAnalyzer');
    const analyzer = new SmartBusinessAnalyzer();
    
    const businessAnalysis = await analyzer.analyzeTargetBusiness(targetWebsite, campaignGoal);
    
    if (!businessAnalysis) {
      return res.status(500).json({
        success: false,
        error: '业务分析失败'
      });
    }

    // 2. 使用分析结果进行邮箱发现
    const industry = businessAnalysis.industry || businessType || 'Technology';
    
    console.log(`🔍 基于分析结果搜索 ${industry} 行业邮箱...`);

    // 调用邮箱发现
    const python = spawn('python3', [
      '/Users/James/Desktop/agent/OllamaSearxNGEmailAgent.py',
      industry,
      maxEmails.toString()
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
        console.error('❌ 邮箱发现失败:', error);
        return res.status(500).json({
          success: false,
          error: '邮箱发现失败',
          businessAnalysis: businessAnalysis,
          details: error
        });
      }

      try {
        // 解析邮箱发现结果
        const jsonStart = output.lastIndexOf('{');
        if (jsonStart !== -1) {
          const discoveryResult = JSON.parse(output.substring(jsonStart));
          
          console.log(`✅ 营销工作流程集成完成: ${discoveryResult.total_emails}个邮箱, ${discoveryResult.total_profiles}个画像`);
          
          return res.json({
            success: true,
            data: {
              // 业务分析结果
              businessAnalysis: {
                companyName: businessAnalysis.companyName,
                industry: businessAnalysis.industry,
                valueProposition: businessAnalysis.valueProposition,
                targetCustomers: businessAnalysis.targetCustomers,
                keyFeatures: businessAnalysis.keyFeatures,
                url: targetWebsite
              },
              
              // 邮箱发现结果
              emailDiscovery: {
                emails: discoveryResult.emails,
                emailDetails: discoveryResult.email_details,
                userProfiles: discoveryResult.user_profiles,
                totalEmails: discoveryResult.total_emails,
                totalProfiles: discoveryResult.total_profiles
              },
              
              // 营销策略建议
              marketingStrategy: {
                targetAudience: {
                  type: 'b2b',
                  primarySegments: businessAnalysis.targetCustomers || [industry],
                  searchKeywords: {
                    primaryKeywords: [businessAnalysis.companyName],
                    industryKeywords: [businessAnalysis.industry],
                    solutionKeywords: businessAnalysis.keyFeatures || [],
                    audienceKeywords: businessAnalysis.targetCustomers || []
                  },
                  painPoints: businessAnalysis.painPoints || []
                },
                companyName: businessAnalysis.companyName,
                description: businessAnalysis.valueProposition,
                website: targetWebsite
              },
              
              // 执行统计
              executionStats: {
                totalExecutionTime: discoveryResult.execution_time,
                searchStrategiesUsed: discoveryResult.search_strategies.length,
                discoveryMethod: discoveryResult.discovery_method,
                integratedWorkflow: true,
                timestamp: discoveryResult.timestamp
              },
              
              // 下一步建议
              nextSteps: [
                '开始个性化邮件内容生成',
                '执行A/B测试不同的邮件策略',
                '设置自动化跟进序列',
                '监控邮件打开率和回复率'
              ]
            }
          });
        } else {
          throw new Error('无法解析邮箱发现结果');
        }

      } catch (parseError) {
        console.error('❌ 集成结果解析错误:', parseError.message);
        return res.status(500).json({
          success: false,
          error: '集成结果解析失败',
          businessAnalysis: businessAnalysis,
          details: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('❌ 营销工作流程集成错误:', error.message);
    res.status(500).json({
      success: false,
      error: '营销工作流程集成失败',
      details: error.message
    });
  }
});

/**
 * 检查Ollama + SearxNG系统状态
 */
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 检查Ollama + SearxNG系统状态...');

    const axios = require('axios');
    
    // 检查Ollama状态
    let ollamaStatus = false;
    let ollamaModels = [];
    
    try {
      const ollamaResponse = await axios.get('http://localhost:11434/api/tags'); // No timeout
      ollamaStatus = true;
      ollamaModels = ollamaResponse.data.models?.map(m => m.name) || [];
    } catch (ollamaError) {
      console.log('⚠️ Ollama连接失败:', ollamaError.message);
    }

    // 检查SearxNG状态
    let searxngStatus = false;
    let searxngSupportsJson = false;
    
    try {
      const searxngResponse = await axios.get('http://localhost:8080/search', {
        params: { q: 'test', format: 'json' }
      }); // No timeout
      searxngStatus = true;
      searxngSupportsJson = searxngResponse.data && typeof searxngResponse.data === 'object';
    } catch (searxngError) {
      console.log('⚠️ SearxNG连接失败:', searxngError.message);
    }

    const systemReady = ollamaStatus && searxngStatus && searxngSupportsJson;

    res.json({
      success: true,
      data: {
        systemReady: systemReady,
        ollama: {
          connected: ollamaStatus,
          availableModels: ollamaModels,
          requiredModels: ['qwen2.5:0.5b', 'llama3.2'],
          modelsReady: ollamaModels.includes('qwen2.5:0.5b') && ollamaModels.includes('llama3.2')
        },
        searxng: {
          connected: searxngStatus,
          jsonSupported: searxngSupportsJson,
          url: 'http://localhost:8080'
        },
        integration: {
          ready: systemReady,
          features: [
            'Intelligent email discovery',
            'User profile generation',
            'Marketing workflow integration',
            'Real-time web search',
            'Local AI processing'
          ]
        },
        recommendations: systemReady ? [
          '系统就绪，可以开始邮箱发现',
          '建议先进行小批量测试',
          '监控搜索结果质量'
        ] : [
          ollamaStatus ? '✅ Ollama已就绪' : '❌ 请启动Ollama服务',
          searxngStatus ? '✅ SearxNG已连接' : '❌ 请启动SearxNG服务',
          searxngSupportsJson ? '✅ SearxNG JSON支持已启用' : '❌ 请启用SearxNG JSON格式支持'
        ]
      }
    });

  } catch (error) {
    console.error('❌ 系统状态检查错误:', error.message);
    res.status(500).json({
      success: false,
      error: '系统状态检查失败',
      details: error.message
    });
  }
});

module.exports = router;