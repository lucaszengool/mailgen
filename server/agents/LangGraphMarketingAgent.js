/**
 * LangGraph Marketing Agent
 * 具备记忆和自我改进能力的营销代理系统
 */

const RedisVectorMemory = require('../services/RedisVectorMemory');
const SmartBusinessAnalyzer = require('./SmartBusinessAnalyzer');
const ProspectSearchAgent = require('./ProspectSearchAgent');
const EmailContentGenerator = require('./EmailContentGenerator');
const SelfHealingLangGraphAgent = require('./SelfHealingLangGraphAgent');
const EmailValidator = require('../services/EmailValidator');
const TemplatePromptService = require('../services/TemplatePromptService');
const UserStorageService = require('../services/UserStorageService');
// const SMTPEmailVerifier = require('../services/SMTPEmailVerifier'); // Disabled - use DNS validation only
const nodemailer = require('nodemailer');

class LangGraphMarketingAgent {
  constructor(options = {}) {
    this.memory = new RedisVectorMemory({
      indexName: 'marketing_agent_memory',
      keyPrefix: 'agent:memory:'
    });

    // 初始化自愈LangGraph Agent
    this.healingAgent = new SelfHealingLangGraphAgent();

    // Marketing Research Agent integration
    this.marketingResearchAgent = options.marketingResearchAgent || null;

    // Ollama configuration with multi-model support
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.models = {
      fast: process.env.OLLAMA_FAST_MODEL || 'qwen2.5:0.5b', // Fastest model (0.5B params, ~400MB)
      general: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b', // General tasks
      email: process.env.OLLAMA_EMAIL_MODEL || 'qwen2.5:0.5b' // Ultra-fast for email generation
    };

    this.businessAnalyzer = new SmartBusinessAnalyzer();
    this.prospectSearchAgent = new ProspectSearchAgent();
    this.emailGenerator = new EmailContentGenerator();
    this.emailValidator = new EmailValidator();
    // this.smtpVerifier = new SMTPEmailVerifier(); // Disabled - use DNS validation only

    // 🔥 FIX: Initialize foundProspects array for persistence
    this.foundProspects = [];

    this.state = {
      currentCampaign: null,
      learningHistory: [],
      optimizationSuggestions: {},
      performanceMetrics: {},
      // 连续运行模式状态
      continuousMode: {
        isRunning: false,
        isPaused: false,
        cycleCount: 0,
        startTime: null,
        pauseTime: null,
        usedEmails: new Set(), // 防重复邮件地址
        campaignHistory: [],
        searchCriteria: null // 存储搜索条件
      },
      // User decision workflow state
      workflowPaused: false,
      userDecision: null,
      pausedCampaignData: null,
      userDecisionPromise: null,
      // SMTP verification cache - avoid re-verifying same config
      smtpVerifiedConfigs: new Map(), // Key: config hash, Value: timestamp
      smtpTransporters: new Map() // Key: config hash, Value: transporter instance
    };

    // WebSocket管理器
    this.wsManager = options.wsManager || null;

    console.log('🤖 LangGraph Marketing Agent initialized');
    console.log(`   📊 Fast Model: ${this.models.fast} (analysis, strategy)`);
    console.log(`   🔧 General Model: ${this.models.general} (general tasks)`);
    console.log(`   📧 Email Model: ${this.models.email} (email generation)`);
  }

  async initialize() {
    const connected = await this.memory.connect();
    if (!connected) {
      console.warn('⚠️ Redis Vector Memory not connected - continuing without learning features');
    } else {
      console.log('✅ Redis Vector Memory connected successfully');
    }
    console.log('✅ Marketing Agent fully initialized');
  }
  
  /**
   * 设置WebSocket管理器用于实时通信
   */
  setWebSocketManager(wsManager) {
    this.wsManager = wsManager;
    
    // 监听用户反馈事件
    if (wsManager) {
      wsManager.on('strategy_updated', (data) => {
        this.handleStrategyFeedback(data);
      });
      
      wsManager.on('analysis_updated', (data) => {
        this.handleAnalysisFeedback(data);
      });
      
      wsManager.on('email_updated', (data) => {
        this.handleEmailFeedback(data);
      });
      
      wsManager.on('user_feedback', (data) => {
        this.handleUserFeedback(data);
      });
    }
    
    console.log('✅ WebSocket manager connected to LangGraph Agent');
  }

  /**
   * 设置Marketing Research Agent集成
   */
  setMarketingResearchAgent(marketingResearchAgent) {
    this.marketingResearchAgent = marketingResearchAgent;
    console.log('✅ Marketing Research Agent integrated');
  }

  /**
   * 获取Marketing Research数据用于营销策略增强
   */
  async getMarketingResearchInsights() {
    if (!this.marketingResearchAgent) {
      return {
        marketTrends: [],
        competitorInsights: [],
        newsAnalysis: [],
        industryReports: [],
        lastUpdate: null
      };
    }

    try {
      const researchData = this.marketingResearchAgent.getResearchDataForIntegration();
      console.log('📊 Marketing research data integrated:', {
        trends: researchData.marketTrends.length,
        competitors: researchData.competitorInsights.length,
        news: researchData.newsAnalysis.length,
        reports: researchData.industryReports.length
      });
      
      return researchData;
    } catch (error) {
      console.error('⚠️ Failed to get marketing research data:', error.message);
      return {
        marketTrends: [],
        competitorInsights: [],
        newsAnalysis: [],
        industryReports: [],
        lastUpdate: null
      };
    }
  }

  /**
   * Check if user has saved template preference and auto-apply it
   * Returns true if template was auto-applied, false if user needs to select
   */
  async checkAndApplySavedTemplate(userId, campaignId) {
    try {
      console.log(`🔍 [Campaign: ${campaignId}] Checking if user ${userId} has saved template...`);

      const userStorage = new UserStorageService(userId);
      const savedTemplate = await userStorage.getSelectedTemplate();

      if (!savedTemplate) {
        console.log(`⏸️ [Campaign: ${campaignId}] No saved template found - showing modal to user`);
        return false;
      }

      console.log(`✅ [Campaign: ${campaignId}] Found saved template: ${savedTemplate.templateName}`);
      console.log(`🚀 [Campaign: ${campaignId}] Auto-applying template ${savedTemplate.templateId}`);

      // Get the actual template from TemplatePromptService
      const template = TemplatePromptService.getTemplateById(savedTemplate.templateId);

      if (!template) {
        console.error(`❌ [Campaign: ${campaignId}] Saved template ${savedTemplate.templateId} not found in TemplatePromptService!`);
        return false;
      }

      // Store template in workflow state (with customizations!)
      const workflowState = this.wsManager?.workflowStates?.get(campaignId);
      if (workflowState) {
        workflowState.data.selectedTemplate = {
          id: savedTemplate.templateId,
          name: template.name,
          autoApplied: true, // Flag to indicate this was auto-applied
          // Include all saved customizations
          subject: savedTemplate.subject,
          greeting: savedTemplate.greeting,
          signature: savedTemplate.signature,
          html: savedTemplate.html,
          customizations: savedTemplate.customizations || {},
          isCustomized: savedTemplate.isCustomized || false,
          components: savedTemplate.components || []
        };
        console.log(`💾 [Campaign: ${campaignId}] Template stored in workflow state${savedTemplate.isCustomized ? ' (with customizations)' : ''}`);
      }

      // Broadcast auto-applied template notification
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'template_auto_applied',
          data: {
            campaignId,
            templateId: savedTemplate.templateId,
            templateName: template.name,
            message: `Using your saved template: ${template.name}`
          }
        });
      }

      return true; // Template auto-applied successfully

    } catch (error) {
      console.error(`❌ [Campaign: ${campaignId}] Error checking saved template:`, error);
      return false; // Fall back to showing modal
    }
  }

  /**
   * 广播工作流状态更新
   */
  broadcastUpdate(workflowId, update) {
    if (this.wsManager) {
      this.wsManager.broadcastWorkflowUpdate(workflowId, update);
    }
  }

  /**
   * 立即基于网站分析生成搜索query - 不等待Ollama
   */
  generateImmediateSearchQuery(businessAnalysis) {
    console.log('⚡ Generating immediate search query for:', businessAnalysis.companyName);
    
    const company = businessAnalysis.companyName || 'company';
    const industry = businessAnalysis.industry || 'technology';
    const valueProposition = businessAnalysis.valueProposition || '';
    
    // 基于行业生成搜索关键词
    let searchQuery = '';
    let searchIndustry = industry.toLowerCase();
    
    if (industry.toLowerCase().includes('food') || industry.toLowerCase().includes('ai')) {
      searchQuery = `${industry} companies executives contact`;
      searchIndustry = industry;
    } else if (industry.toLowerCase().includes('tech')) {
      searchQuery = 'technology companies CEO contact email';  
      searchIndustry = 'technology';
    } else if (industry.toLowerCase().includes('finance')) {
      searchQuery = 'fintech companies executives contact';
      searchIndustry = 'fintech';
    } else {
      searchQuery = `${industry} business executives contact email`;
      searchIndustry = industry;
    }
    
    console.log(`⚡ Generated search query: "${searchQuery}" for industry: ${searchIndustry}`);
    
    return {
      query: searchQuery,
      industry: searchIndustry,
      company: company,
      method: 'immediate_from_business_analysis',
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Alias for callOllama method (for compatibility)
   */
  async callOllamaAPI(prompt, model) {
    // Convert model name to modelType
    const modelType = model && model.includes('0.5b') ? 'fast' : 'email';
    return await this.callOllama(prompt, modelType);
  }

  /**
   * Helper method to call Ollama with specific model
   */
  async callOllama(prompt, modelType = 'fast', options = {}) {
    const model = this.models[modelType] || this.models.fast;
    const defaultOptions = {
      temperature: modelType === 'email' ? 0.8 : 0.3,     // Balanced for quality content
      num_predict: modelType === 'email' ? 500 : 600,     // Increased for complete JSON responses
      top_k: modelType === 'fast' ? 10 : 40,              // More variety to avoid placeholders
      top_p: modelType === 'fast' ? 0.5 : 0.9,            // Better quality outputs
      repeat_penalty: 1.1,                                // Slight penalty to avoid repetition
      num_ctx: modelType === 'fast' ? 1024 : 2048,        // Increased context for fast model
      num_thread: 8,                                    // Maximum CPU threads
      num_gpu: 1,                                        // GPU acceleration
      mirostat: 0                                        // Disable mirostat for speed
      // Removed stop parameter to allow complete JSON generation
    };
    
    console.log(`🧠 Using ${modelType} model (${model}) for generation...`);
    
    try {
      console.log(`🔧 Calling Ollama API: ${this.ollamaUrl}/api/generate`);
      console.log(`📝 Model: ${model}, Prompt length: ${prompt.length} chars`);
      
      // REPLACE FETCH WITH AXIOS - NO TIMEOUT RESTRICTIONS
      // 使用axios替换fetch，完全移除timeout限制
      
      const axios = require('axios');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: { ...defaultOptions, ...options }
      }, {
        timeout: 0  // ⏰ NO TIMEOUT: Wait for Ollama as long as needed
      });
      
      // Timeout was removed - no need to clear
      
      console.log(`📡 Ollama response status: ${response.status} ${response.statusText || 'OK'}`);
      
      // Axios automatically handles status codes and JSON parsing
      const data = response.data;
      console.log(`📊 Ollama response length: ${data.response ? data.response.length : 0} chars`);
      console.log(`🔍 Response preview: ${data.response ? data.response.substring(0, 100) : 'null'}...`);
      
      if (!data.response || data.response.trim() === '') {
        console.error(`❌ Ollama returned empty response: ${JSON.stringify(data)}`);
        return null;
      }
      
      return data.response;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.error(`❌ ${modelType} model (${model}) request timed out after 60 seconds`);
        console.error(`❌ Modal endpoint may be slow or unresponsive`);
        return null;
      }
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        console.error(`❌ ${modelType} model (${model}) request timed out`);
        console.error(`❌ Consider checking your OLLAMA_URL environment variable`);
        return null;
      }
      console.error(`❌ ${modelType} model (${model}) error: ${error.message}`);
      console.error(`❌ Error code: ${error.code}`);
      return null;
    }
  }

  /**
   * 执行完整的营销活动流程
   */
  async executeCampaign(campaignConfig) {
    // 🔥 CRITICAL FIX: Use campaignId from config if provided, otherwise generate new one
    const campaignId = campaignConfig.campaignId || `campaign_${Date.now()}`;
    this.state.currentCampaign = campaignId;
    this.campaignConfig = campaignConfig;  // Store campaign config for later use
    this.userId = campaignConfig.userId || 'anonymous';  // 🎯 CRITICAL: Store userId for workflow results
    this.currentCampaignId = campaignId;  // 🔥 CRITICAL: Store campaignId for database operations

    console.log(`🚀 ============= EXECUTING CAMPAIGN ${campaignId} =============`);
    console.log(`🚀 [RAILWAY DEBUG] executeCampaign() CALLED`);
    console.log(`🔍 [RAILWAY DEBUG] CampaignId: ${campaignId} (${campaignConfig.campaignId ? 'from config' : 'generated'})`);
    console.log(`👤 [RAILWAY DEBUG] User ID: ${this.userId}`);
    console.log(`🚀 [RAILWAY DEBUG] Target Website: ${campaignConfig.targetWebsite}`);
    console.log(`🚀 [RAILWAY DEBUG] Campaign Goal: ${campaignConfig.campaignGoal}`);
    console.log(`🚀 [RAILWAY DEBUG] Has SMTP Config: ${!!campaignConfig.smtpConfig}`);
    console.log(`🚀 [RAILWAY DEBUG] Has WebsiteAnalysis: ${!!campaignConfig.websiteAnalysis}`);
    
    // Initialize workflow state in WebSocket manager
    if (this.wsManager) {
      console.log(`📋 Initializing workflow state: ${campaignId}`);
      this.wsManager.broadcastWorkflowUpdate(campaignId, {
        type: 'stage_start',
        stage: 'campaign_start',
        data: {
          targetWebsite: campaignConfig.targetWebsite,
          campaignGoal: campaignConfig.campaignGoal,
          businessType: campaignConfig.businessType
        }
      });
    }

    try {
      // 阶段1: 业务分析 + 学习优化
      const businessAnalysis = await this.executeBusinessAnalysisWithLearning(campaignConfig);
      
      // 保存业务分析结果供邮件生成使用
      this.businessAnalysisData = businessAnalysis;
      
      // 阶段2: 营销策略生成 + 学习优化
      const marketingStrategy = await this.executeMarketingStrategyWithLearning(businessAnalysis, campaignId, campaignConfig.campaignGoal || 'partnership');

      // Store marketing strategy for later use
      this.marketingStrategyData = marketingStrategy;

      // 🔥 阶段3: 潜在客户搜索 - 直接执行（Railway兼容）
      console.log('🚀 Starting prospect search IMMEDIATELY for Railway deployment...');

      // Execute prospect search and await completion
      // This ensures the search completes before the Railway instance shuts down
      try {
        await this.executeProspectSearchInBackground(
          marketingStrategy,
          campaignId,
          businessAnalysis,
          campaignConfig
        );

        console.log('✅ Prospect search completed');

      } catch (error) {
        console.error('❌ Prospect search failed:', error);
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'prospect_search_error',
            data: {
              campaignId,
              error: error.message,
              status: 'error'
            }
          });
        }
      }

      // Return result with search complete status
      return {
        campaignId,
        businessAnalysis,
        marketingStrategy,
        prospects: this.foundProspects || [], // 🔥 FIX: Include found prospects in return value
        emailCampaign: null,
        status: 'prospect_search_complete',
        message: 'Prospect search completed. Check dashboard for results.',
        timestamp: new Date().toISOString()
      };

      // NOTE: Email generation now happens in executeProspectSearchInBackground()
      // after prospects are found and user selects a template

      // Send final workflow completion signal
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'workflow_completed',
          data: {
            campaignId,
            status: 'completed',
            totalProspects: prospects?.length || 0,
            emailsGenerated: emailCampaign?.emails?.length || 0,
            timestamp: new Date().toISOString()
          }
        });

        console.log(`✅ Workflow ${campaignId} completed successfully!`);
      }

      // 返回完整的活动结果
      return {
        campaignId,
        businessAnalysis,
        marketingStrategy,
        prospects: prospects.slice(0, 20), // 限制返回数量
        emailCampaign,
        learningInsights: this.state.optimizationSuggestions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Campaign execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 业务分析 + 学习优化
   */
  async executeBusinessAnalysisWithLearning(campaignConfig) {
    console.log('📊 [RAILWAY DEBUG] ===== BUSINESS ANALYSIS STARTING =====');
    console.log('📊 [RAILWAY DEBUG] Executing business analysis with self-healing...');
    console.log('📊 [RAILWAY DEBUG] Target website:', campaignConfig.targetWebsite);

    // Send real-time log updates
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('website_analysis', '🔍 Starting website analysis...', 'info');
      this.wsManager.sendLogUpdate('website_analysis', `Target: ${campaignConfig.targetWebsite}`, 'info');
    }
    
    return await this.healingAgent.executeWithSelfHealing(
      async (context) => {
        // 获取历史分析建议
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('website_analysis', '📚 Searching for similar analyses in memory...', 'info');
        }
        
        const suggestions = await this.memory.retrieveSimilarLearning(
          context.targetWebsite, 
          'business_analysis', 
          3
        );
        
        if (this.wsManager && suggestions.length > 0) {
          this.wsManager.sendLogUpdate('website_analysis', `✨ Found ${suggestions.length} similar analyses`, 'success');
        }

        // 执行分析（带自愈能力）
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('website_analysis', '🤖 AI analyzing website content...', 'info');
        }
        
        const analysis = await this.businessAnalyzer.analyzeTargetBusiness(
          context.targetWebsite,
          context.campaignGoal
        );
        
        if (this.wsManager && analysis) {
          this.wsManager.sendLogUpdate('website_analysis', `✅ Analysis complete: ${analysis.companyName}`, 'success');
          this.wsManager.sendLogUpdate('website_analysis', `Industry: ${analysis.industry}`, 'info');
          this.wsManager.sendLogUpdate('website_analysis', `Value: ${analysis.valueProposition?.substring(0, 80)}...`, 'info');
          
          // Send complete results
          this.wsManager.broadcast({
            type: 'workflow_update',
            stepId: 'website_analysis',
            stepData: {
              status: 'completed',
              progress: 100,
              results: analysis
            }
          });
        }

        // 存储学习数据
        await this.memory.storeSearchLearning(
          this.state.currentCampaign,
          `business_analysis:${context.targetWebsite}`,
          [analysis],
          {
            success_rate: analysis ? 1 : 0,
            query_type: 'business_analysis',
            search_terms: [context.targetWebsite],
            healing_applied: context.healing_applied || false
          }
        );

        return analysis;
      },
      campaignConfig, // 初始上下文
      'website_analysis' // 步骤名称
    );
  }

  /**
   * 营销策略生成 + 学习优化
   */
  async executeMarketingStrategyWithLearning(businessAnalysis, campaignId, campaignGoal = 'partnership') {
    console.log('🎯 Executing marketing strategy with learning...');
    
    // Send real-time updates
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('marketing_strategy', '🎯 Starting marketing strategy generation...', 'info');
      this.wsManager.sendLogUpdate('marketing_strategy', `Target: ${businessAnalysis.companyName || 'Company'}`, 'info');
    }
    
    // 获取历史策略优化建议
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('marketing_strategy', '📚 Retrieving optimization insights...', 'info');
    }
    
    const optimizationSuggestions = await this.memory.getMarketingOptimizationSuggestions(
      businessAnalysis,
      campaignId
    );

    console.log('💡 Marketing optimization suggestions:', optimizationSuggestions.optimization_tips);
    
    if (this.wsManager && optimizationSuggestions.optimization_tips.length > 0) {
      this.wsManager.sendLogUpdate('marketing_strategy', `✨ Found ${optimizationSuggestions.optimization_tips.length} optimization tips`, 'success');
    }

    // IMMEDIATE SEARCH QUERY GENERATION - NO WAITING FOR OLLAMA
    console.log('⚡ Generating immediate search query from business analysis...');
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('marketing_strategy', '⚡ Generating immediate search query...', 'info');
    }
    
    // 立即基于网站分析生成搜索query
    const immediateSearchQuery = this.generateImmediateSearchQuery(businessAnalysis);
    console.log('🎯 Immediate search query generated:', immediateSearchQuery);
    
    // 开始异步策略生成（不阻塞流程）
    console.log('🧠 Starting background marketing strategy generation...');
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('marketing_strategy', '🧠 AI generating strategic plan in background...', 'info');
    }
    
    // 异步生成策略，不等待完成
    const strategyPromise = this.generateOptimizedMarketingStrategy(businessAnalysis, optimizationSuggestions, campaignGoal);
    
    // 立即返回搜索query，让prospect搜索开始
    const quickStrategy = {
      company_name: businessAnalysis.companyName || 'Company',
      domain: businessAnalysis.domain || 'example.com', 
      website: businessAnalysis.url || businessAnalysis.website || 'https://example.com',
      industry: businessAnalysis.industry || 'Technology',
      description: businessAnalysis.valueProposition || 'Business solution',
      target_audience: {
        type: 'b2b',
        primary_segments: [`${businessAnalysis.industry || 'tech'} companies`, 'businesses'],
        search_keywords: {
          primary_keywords: [immediateSearchQuery.industry, 'business', 'company'],
          industry_keywords: [businessAnalysis.industry || 'technology', immediateSearchQuery.industry],
          solution_keywords: ['solution', 'service'],
          technology_keywords: ['digital'],
          audience_keywords: ['professional']
        },
        pain_points: ['efficiency', 'growth']
      },
      messaging_framework: {
        value_proposition: businessAnalysis.valueProposition || 'Improve efficiency',
        tone: 'professional',
        key_messages: ['efficiency', 'partnership']
      },
      campaign_objectives: {
        primary_goal: campaignGoal, 
        success_metrics: ['emails']
      },
      // 标记这是快速生成的策略
      generated_method: 'immediate_from_analysis',
      search_query: immediateSearchQuery.query,
      background_strategy_generating: true
    };
    
    // 在后台处理完整策略生成
    strategyPromise.then(fullStrategy => {
      console.log('🧠 Background strategy generation completed');
      if (this.wsManager) {
        this.wsManager.sendLogUpdate('marketing_strategy', '✅ Full AI strategy generated', 'success');
      }
      // 可以选择更新策略或存储到内存中
    }).catch(error => {
      console.log('⚠️ Background strategy generation failed:', error.message);
    });
    
    const strategy = quickStrategy;

    // LOG OLLAMA GENERATED MARKETING STRATEGY
    if (strategy) {
      console.log('\n🧠 OLLAMA MARKETING STRATEGY LOG:');
      console.log('='.repeat(60));
      console.log('🎯 Generated Strategy Details:');
      console.log(`   🏢 Company: ${strategy.company_name}`);
      console.log(`   🌐 Website: ${strategy.website || 'N/A'}`);
      console.log(`   🏭 Industry: ${strategy.industry || 'N/A'}`);
      console.log(`   📝 Description: ${strategy.description}`);
      console.log(`   🎯 Target Audience Type: ${strategy.target_audience?.type || 'N/A'}`);
      
      if (strategy.target_audience?.primary_segments) {
        console.log(`   👥 Primary Segments: ${strategy.target_audience.primary_segments.join(', ')}`);
      }
      
      if (strategy.target_audience?.search_keywords) {
        console.log('   🔍 Search Keywords:');
        const keywords = strategy.target_audience.search_keywords;
        if (keywords.primary_keywords) {
          console.log(`      🎯 Primary: ${keywords.primary_keywords.join(', ')}`);
        }
        if (keywords.industry_keywords) {
          console.log(`      🏭 Industry: ${keywords.industry_keywords.join(', ')}`);
        }
        if (keywords.solution_keywords) {
          console.log(`      💡 Solution: ${keywords.solution_keywords.join(', ')}`);
        }
        if (keywords.technology_keywords) {
          console.log(`      🔧 Technology: ${keywords.technology_keywords.join(', ')}`);
        }
        if (keywords.audience_keywords) {
          console.log(`      👥 Audience: ${keywords.audience_keywords.join(', ')}`);
        }
      }
      
      if (strategy.target_audience?.pain_points) {
        console.log(`   😰 Pain Points: ${strategy.target_audience.pain_points.join(', ')}`);
      }
      
      console.log(`   🧠 Generated by: Ollama AI`);
      console.log(`   ⏰ Generated at: ${new Date().toISOString()}`);
      console.log(`   🎪 Campaign ID: ${campaignId}`);
      
      if (optimizationSuggestions?.optimization_tips) {
        console.log(`   💡 Applied Optimizations: ${optimizationSuggestions.optimization_tips.join(', ')}`);
      }
      
      console.log('='.repeat(60));
      
      // Send completion updates via WebSocket
      if (this.wsManager) {
        this.wsManager.sendLogUpdate('marketing_strategy', `✅ Strategy generated: ${strategy.company_name}`, 'success');
        this.wsManager.sendLogUpdate('marketing_strategy', `🎯 Audience: ${strategy.target_audience?.type} - ${strategy.target_audience?.primary_segments?.join(', ')}`, 'info');
        const keywords = strategy.target_audience?.search_keywords?.primary_keywords || [];
        this.wsManager.sendLogUpdate('marketing_strategy', `🔍 Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'None generated'}`, 'info');
        
        // Send workflow completion update with results
        this.wsManager.broadcast({
          type: 'workflow_update',
          stepId: 'marketing_strategy',
          stepData: {
            status: 'completed',
            progress: 100,
            results: strategy,
            logs: [
              { message: '✅ Strategic targeting plan generated', level: 'success', timestamp: new Date() },
              { message: `🎯 Target audience: ${strategy.target_audience?.type}`, level: 'info', timestamp: new Date() }
            ]
          }
        });
      }
    }

    // 存储学习数据
    await this.memory.storeMarketingLearning(
      campaignId,
      strategy,
      { emails_sent: 0, responses: 0 }, // 初始结果
      { user_rating: 0, effectiveness: 0 } // 初始反馈
    );

    console.log('🎯 Stored marketing learning for campaign:', campaignId);
    
    this.state.optimizationSuggestions.marketing = optimizationSuggestions;
    return strategy;
  }

  /**
   * 🔥 NEW: Execute prospect search in background (non-blocking)
   * This allows the main process to continue while prospects are being found
   */
  async executeProspectSearchInBackground(marketingStrategy, campaignId, businessAnalysis, campaignConfig, userId = 'default') {
    console.log('🔄 Background prospect search started...');
    console.log(`📦 User: ${userId}, Campaign: ${campaignId}`);

    // 🔥 SET WORKFLOW STATUS TO FINDING PROSPECTS (triggers prospectSearchStarting popup)
    console.log('🔥 DEBUG: About to set workflow status to finding_prospects');
    console.log(`🔥 DEBUG: wsManager exists? ${!!this.wsManager}`);
    console.log(`🔥 DEBUG: campaignId = ${campaignId}`);
    if (this.wsManager) {
      console.log('🔥 CALLING updateWorkflowStatus for finding_prospects');
      this.wsManager.updateWorkflowStatus(campaignId, 'finding_prospects', {
        step: 'prospect_search',
        message: 'Finding qualified prospects...'
      });
      console.log('🔥 DONE calling updateWorkflowStatus');
    } else {
      console.log('❌ wsManager is null/undefined - cannot update workflow status!');
    }

    try {
      // Step 1: Find prospects (this may take time)
      console.log('🔍 Starting executeProspectSearchWithLearning...');
      const prospects = await this.executeProspectSearchWithLearning(marketingStrategy, campaignId, userId);

      console.log('📊 CRITICAL DEBUG - Prospect search returned:');
      console.log(`   Type: ${Array.isArray(prospects) ? 'Array' : typeof prospects}`);
      console.log(`   Length: ${prospects?.length || 0}`);
      if (prospects && prospects.length > 0) {
        console.log(`   Sample prospect: ${JSON.stringify(prospects[0], null, 2).substring(0, 200)}...`);
      }

      if (!prospects || prospects.length === 0) {
        console.log('⚠️ No prospects found in background search');
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'prospect_search_complete',
            data: {
              campaignId,
              prospectsCount: 0,
              message: 'No prospects found. Please try different search criteria.',
              status: 'no_results'
            }
          });
        }
        return;
      }

      // Wait briefly for Railway log rate limit to reset
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('\n\n');
      console.log('='.repeat(80));
      console.log(`🎉 PROSPECT SEARCH COMPLETE: Found ${prospects.length} prospects`);
      console.log('='.repeat(80));
      console.log(`📧 Sample emails: ${prospects.slice(0, 3).map(p => p.email).join(', ')}`);

      // 🔥 SET WORKFLOW STATUS TO PAUSED FOR REVIEW (triggers prospectSearchComplete popup)
      console.log(`🔥 DEBUG: About to set workflow status to paused_for_review for ${prospects.length} prospects`);
      if (this.wsManager) {
        console.log('🔥 CALLING updateWorkflowStatus for paused_for_review');
        this.wsManager.updateWorkflowStatus(campaignId, 'paused_for_review', {
          step: 'prospects_found',
          prospectsCount: prospects.length,
          message: `Found ${prospects.length} qualified prospects!`
        });
        console.log('🔥 DONE calling updateWorkflowStatus for paused_for_review');
      } else {
        console.log('❌ wsManager is null - cannot update workflow status to paused_for_review!');
      }

      // Step 2: Check if we need to pause for template selection
      console.log(`🔍 [RAILWAY DEBUG] Checking template selection condition:`);
      console.log(`   - emailTemplate: ${campaignConfig.emailTemplate}`);
      console.log(`   - templateData: ${JSON.stringify(campaignConfig.templateData)}`);
      console.log(`   - Should pause: ${!campaignConfig.emailTemplate && !campaignConfig.templateData}`);

      if (!campaignConfig.emailTemplate && !campaignConfig.templateData) {
        console.log('🎨 No template provided - triggering template selection popup');
        this.state.isWaitingForTemplate = true;

        // Store workflow state for continuation
        this.state.pausedCampaignData = {
          prospects: prospects,
          campaignId: campaignId,
          marketingStrategy: marketingStrategy,
          businessAnalysis: businessAnalysis,
          smtpConfig: campaignConfig.smtpConfig,
          targetAudience: campaignConfig.targetAudience,
          timestamp: new Date().toISOString()
        };

        console.log(`💾 Stored ${prospects.length} prospects in pausedCampaignData`);

        // 🚀 PRODUCTION: Store workflow results with userId AND campaignId
        const workflowRoute = require('../routes/workflow');
        if (workflowRoute.setLastWorkflowResults) {
          const partialResults = {
            campaignId: campaignId,
            prospects: prospects,
            businessAnalysis: businessAnalysis,
            marketingStrategy: marketingStrategy,
            smtpConfig: campaignConfig.smtpConfig,
            status: 'waiting_for_template',
            timestamp: new Date().toISOString()
          };
          const userId = this.userId || 'anonymous';
          await workflowRoute.setLastWorkflowResults(partialResults, userId, campaignId);
          console.log(`📦 [PRODUCTION] Stored results for User: ${userId}, Campaign: ${campaignId}, Prospects: ${prospects.length}`);
        }

        // 🔥 CRITICAL: Also store in WebSocket state so /workflow/results can find them
        if (this.wsManager) {
          console.log(`📡 Storing prospects in WebSocket workflow state: ${campaignId}`);

          // Ensure workflow state exists
          if (!this.wsManager.workflowStates.has(campaignId)) {
            console.log(`⚠️ Creating workflow state for ${campaignId}`);
            this.wsManager.workflowStates.set(campaignId, {
              id: campaignId,
              status: 'running',
              stages: {},
              currentStage: 'template_selection',
              startTime: Date.now(),
              data: {},
              steps: {}
            });
          }

          // Store prospects in workflow state data
          const workflowState = this.wsManager.workflowStates.get(campaignId);
          workflowState.data.prospects = prospects;
          workflowState.data.totalProspects = prospects.length;
          workflowState.data.lastUpdate = new Date().toISOString();

          console.log(`✅ VERIFICATION: Workflow ${campaignId} now has ${workflowState.data.prospects.length} prospects stored`);

          // 🎯 NEW: Check if user has saved template preference first
          const userId = this.userId || 'anonymous';
          const hasAutoAppliedTemplate = await this.checkAndApplySavedTemplate(userId, campaignId);

          if (hasAutoAppliedTemplate) {
            console.log(`✅ [LOCATION 1] Template auto-applied for user ${userId} - continuing workflow`);
            // Don't return - let workflow continue to email generation
          } else {
            // No saved template - show modal to user
            console.log('🎨🎨🎨 BROADCASTING TEMPLATE SELECTION REQUIRED MESSAGE (LOCATION 1) 🎨🎨🎨');
            console.log('🎨 Prospects found:', prospects.length);
            const message = {
              type: 'template_selection_required',
              data: {
                campaignId: campaignId,
                prospectsCount: prospects.length,
                prospectsFound: prospects.length,  // Add this for consistency
                sampleProspects: prospects.slice(0, 5).map(p => ({
                  email: p.email,
                  name: p.name || 'Unknown',
                  company: p.company || 'Unknown'
                })),
                message: `Found ${prospects.length} prospects! Please select an email template to continue.`,
                canProceed: false,
                status: 'waiting_for_template'
              }
            };
            console.log('🎨 Broadcasting message:', JSON.stringify(message, null, 2));
            this.wsManager.broadcast(message);
            console.log('✅ Template selection broadcast completed!');

            // Also broadcast prospects data directly
            this.wsManager.broadcast({
              type: 'prospect_list',
              workflowId: campaignId,
              prospects: prospects,
              total: prospects.length,
              timestamp: new Date().toISOString()
            });

            console.log('🎨 Template selection popup triggered - workflow paused');
            console.log(`📡 Broadcast prospect_list with ${prospects.length} prospects`);
            console.log('⏸️ Waiting for user to select template...');

            // Workflow pauses here - will resume when user selects template via resumeWorkflow()
            return;
          }
        }
      }

      // Step 3: If template is provided, continue with email generation
      console.log('📧 Template provided, continuing with email generation...');
      const emailCampaign = await this.executeEmailCampaignWithLearning(
        prospects,
        marketingStrategy,
        campaignId,
        campaignConfig.smtpConfig,
        campaignConfig.emailTemplate,
        campaignConfig.templateData,
        campaignConfig.targetAudience,
        businessAnalysis
      );

      console.log('✅ Background workflow completed successfully');

      // Broadcast completion
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'workflow_complete',
          data: {
            campaignId,
            prospectsCount: prospects.length,
            emailsGenerated: emailCampaign?.emails?.length || 0,
            status: 'completed'
          }
        });
      }

    } catch (error) {
      console.error('❌ Background prospect search failed:', error);
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'prospect_search_error',
          data: {
            campaignId,
            error: error.message,
            status: 'error'
          }
        });
      }
    }
  }

  /**
   * 潜在客户搜索 - 简化版本，不使用自愈系统
   */
  async executeProspectSearchWithLearning(marketingStrategy, campaignId, userId = 'default') {
    console.log('🔍 Executing prospect search with real-time email generation...');
    console.log(`📦 Using batched search for user: ${userId}, campaign: ${campaignId}`);
    
    // Send real-time updates
    if (this.wsManager) {
      this.wsManager.sendLogUpdate('prospect_search', '🔍 Starting prospect search & email discovery...', 'info');
      this.wsManager.sendLogUpdate('prospect_search', `Target: ${marketingStrategy?.company_name || 'Company'}`, 'info');
    }
    
    try {
      // WAIT FOR MARKETING STRATEGY TO BE READY
      if (!marketingStrategy || !marketingStrategy.target_audience) {
        console.log('⏳ Waiting for marketing strategy to be generated...');
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('prospect_search', '⏳ Waiting for marketing strategy...', 'warning');
        }
        
        throw new Error('Marketing strategy not ready - cannot start email search');
      }
      
      if (this.wsManager) {
        this.wsManager.sendLogUpdate('prospect_search', '✅ Marketing strategy validated, starting search...', 'success');
      }
      
      // LOG STRATEGY VALIDATION SUCCESS
      console.log('\n✅ STRATEGY VALIDATION LOG:');
      console.log('='.repeat(40));
      console.log('✅ Marketing strategy ready, starting email discovery...');
      console.log(`   🏢 Strategy for: ${marketingStrategy.company_name}`);
      console.log(`   🎯 Target Type: ${marketingStrategy.target_audience?.type}`);
      console.log(`   🔍 Keywords Ready: ${marketingStrategy.target_audience?.search_keywords ? 'YES' : 'NO'}`);
      console.log(`   👥 Segments Ready: ${marketingStrategy.target_audience?.primary_segments ? 'YES' : 'NO'}`);
      console.log(`   ⏰ Strategy validated at: ${new Date().toISOString()}`);
      console.log('='.repeat(40));
      
      // Execute SUPER EMAIL SEARCH with completed strategy
      const companyInfo = {
        name: marketingStrategy?.company_name || 'Company',
        domain: marketingStrategy?.domain || 'example.com',
        website: marketingStrategy?.website || 'https://example.com',
        description: marketingStrategy?.description || 'Technology company',
        industry: marketingStrategy?.industry || 'Technology'
      };
      
      if (this.wsManager) {
        this.wsManager.sendLogUpdate('prospect_search', '🚀 Using AI-powered prospect search engine...', 'info');
        this.wsManager.sendLogUpdate('prospect_search', `🎯 Targeting: ${marketingStrategy.target_audience?.type} audience`, 'info');
      }
      
      console.log('🚀 Using ProspectSearchAgent with 超级邮箱搜索引擎!');

      // 📦 Create batch callback for background prospect updates
      const batchCallback = async (batchData) => {
        const { batchNumber, prospects, totalSoFar, targetTotal } = batchData;
        console.log(`📦 [Batch ${batchNumber}] Received ${prospects.length} prospects (${totalSoFar}/${targetTotal} total)`);

        // Save batch to database using db.saveContact
        const db = require('../models/database');
        try {
          console.log(`💾 [Batch ${batchNumber}] Saving ${prospects.length} prospects to database...`);

          let savedCount = 0;
          for (const prospect of prospects) {
            try {
              await db.saveContact({
                email: prospect.email,
                name: prospect.name || 'Unknown',
                company: prospect.company || 'Unknown',
                position: prospect.role || prospect.position || 'Unknown',
                industry: marketingStrategy?.industry || 'Unknown',
                phone: '',
                address: '',
                source: prospect.source || 'background_search',
                tags: '',
                notes: `Batch ${batchNumber}: Found via background search on ${new Date().toLocaleString()}`
              }, userId, campaignId);
              savedCount++;
            } catch (saveError) {
              // Skip if already exists (UNIQUE constraint)
              if (!saveError.message.includes('UNIQUE constraint')) {
                console.error(`⚠️ [Batch ${batchNumber}] Failed to save prospect ${prospect.email}:`, saveError.message);
              }
            }
          }

          console.log(`✅ [Batch ${batchNumber}] Saved ${savedCount}/${prospects.length} prospects to database for user: ${userId}`);
        } catch (error) {
          console.error(`❌ [Batch ${batchNumber}] Failed to save batch:`, error);
        }

        // 🔥 CRITICAL FIX: Update workflow state with new batch prospects
        if (this.wsManager) {
          // Get current workflow state
          const workflowState = this.wsManager.workflowStates.get(campaignId);
          if (workflowState) {
            // Initialize prospects array if it doesn't exist
            if (!workflowState.data) {
              workflowState.data = {};
            }
            if (!workflowState.data.prospects) {
              workflowState.data.prospects = [];
            }

            // Add new batch prospects to the workflow state (avoid duplicates)
            const existingEmails = new Set(workflowState.data.prospects.map(p => p.email));
            const newProspects = prospects.filter(p => !existingEmails.has(p.email));
            workflowState.data.prospects.push(...newProspects);

            console.log(`✅ [Batch ${batchNumber}] Added ${newProspects.length} new prospects to workflow state (total: ${workflowState.data.prospects.length})`);
          } else {
            console.warn(`⚠️ [Batch ${batchNumber}] Workflow state not found for campaign: ${campaignId}`);
          }

          // Notify frontend via WebSocket
          this.wsManager.broadcast({
            type: 'prospect_batch_update',
            data: {
              userId,
              campaignId,
              batchNumber,
              prospects,
              totalSoFar,
              targetTotal,
              status: 'batch_complete'
            }
          });
          console.log(`📡 [Batch ${batchNumber}] WebSocket notification sent`);
        }

        // 🔥 CRITICAL FIX: Update in-memory workflow results so /api/workflow/results returns all batches
        try {
          const workflowRoute = require('../routes/workflow');
          if (workflowRoute.getLastWorkflowResults && workflowRoute.setLastWorkflowResults) {
            // Get current workflow results
            const currentResults = await workflowRoute.getLastWorkflowResults(userId, campaignId);

            if (currentResults) {
              // Add new batch prospects to existing results (avoid duplicates)
              const existingEmails = new Set((currentResults.prospects || []).map(p => p.email));
              const newProspectsForResults = prospects.filter(p => !existingEmails.has(p.email));
              currentResults.prospects = [...(currentResults.prospects || []), ...newProspectsForResults];

              // Update workflow results with merged prospects
              await workflowRoute.setLastWorkflowResults(currentResults, userId, campaignId);
              console.log(`✅ [Batch ${batchNumber}] Updated in-memory workflow results with ${newProspectsForResults.length} new prospects (total: ${currentResults.prospects.length})`);
            } else {
              // No existing results, create new ones with this batch
              const newResults = {
                campaignId: campaignId,
                prospects: prospects,
                status: 'prospect_search_in_progress',
                timestamp: new Date().toISOString()
              };
              await workflowRoute.setLastWorkflowResults(newResults, userId, campaignId);
              console.log(`✅ [Batch ${batchNumber}] Created new workflow results with ${prospects.length} prospects`);
            }
          }
        } catch (error) {
          console.error(`❌ [Batch ${batchNumber}] Failed to update workflow results:`, error);
        }
      };

      // Call searchProspects with batching options
      const searchResult = await this.prospectSearchAgent.searchProspects(
        marketingStrategy,
        marketingStrategy?.industry || 'Technology',
        marketingStrategy?.target_audience?.type || 'all',
        {
          userId,
          campaignId,
          onBatchComplete: batchCallback,
          continuous: true // Enable batched mode
        }
      );

      // Extract prospects from search result - searchResult IS the prospects array directly
      const prospects = Array.isArray(searchResult) ? searchResult : [];
      
      console.log(`📧 超级邮箱搜索引擎搜索结果:`);
      console.log(`   找到邮箱总数: ${prospects.length}`);
      console.log(`   搜索方法: ProspectSearchAgent + 超级邮箱搜索引擎`);
      console.log(`   数据源: 超级邮箱发现引擎`);
      
      // Send prospects update to frontend via WebSocket
      if (this.wsManager && prospects.length > 0) {
        console.log('📡 发送prospects更新到前端...');
        console.log(`📡 Campaign ID: ${campaignId}`);
        console.log(`📡 Prospects count: ${prospects.length}`);

        // 🔥 CRITICAL FIX: Ensure workflow state exists before updating
        if (!this.wsManager.workflowStates.has(campaignId)) {
          console.log(`⚠️ Workflow state ${campaignId} doesn't exist, creating it now...`);
          this.wsManager.workflowStates.set(campaignId, {
            id: campaignId,
            status: 'running',
            stages: {},
            currentStage: 'prospect_search',
            startTime: Date.now(),
            data: {},
            steps: {}
          });
        }

        // Update workflow state with prospect data
        this.wsManager.broadcastWorkflowUpdate(campaignId, {
          type: 'data_update',
          data: {
            prospects: prospects,
            totalProspects: prospects.length,
            prospectSources: prospects.map(p => p.source || 'unknown').filter((v, i, a) => a.indexOf(v) === i),
            lastUpdate: new Date().toISOString()
          }
        });

        // Also send direct client data update
        this.wsManager.updateClientData(prospects);

        // 🔥 VERIFY data was stored
        const state = this.wsManager.workflowStates.get(campaignId);
        console.log(`✅ Verification - Workflow ${campaignId} has ${state?.data?.prospects?.length || 0} prospects stored`);
      }

      // 💾 CRITICAL: Save FIRST BATCH to database immediately
      if (prospects.length > 0) {
        const db = require('../models/database');
        try {
          console.log(`💾 [BATCH 1] Saving ${prospects.length} prospects to database for user: ${userId}`);

          let savedCount = 0;
          for (const prospect of prospects) {
            try {
              await db.saveContact({
                email: prospect.email,
                name: prospect.name || 'Unknown',
                company: prospect.company || 'Unknown',
                position: prospect.role || prospect.position || 'Unknown',
                industry: marketingStrategy?.industry || 'Unknown',
                phone: '',
                address: '',
                source: prospect.source || 'first_batch',
                tags: '',
                notes: `Batch 1: Found via initial search on ${new Date().toLocaleString()}`
              }, userId, campaignId);
              savedCount++;
            } catch (saveError) {
              // Skip if already exists (UNIQUE constraint)
              if (!saveError.message.includes('UNIQUE constraint')) {
                console.error(`⚠️ [BATCH 1] Failed to save prospect ${prospect.email}:`, saveError.message);
              }
            }
          }

          console.log(`✅ [BATCH 1] Saved ${savedCount}/${prospects.length} prospects to database successfully`);
        } catch (error) {
          console.error(`❌ [BATCH 1] Failed to save batch:`, error);
        }
      }

      // Show sample emails if found
      if (prospects.length > 0) {
        console.log(`   样本邮箱: ${prospects.slice(0, 3).map(p => p.email || 'N/A').join(', ')}`);
      }
      
      // Send WebSocket updates about search results
      if (this.wsManager) {
        if (prospects.length === 0) {
          this.wsManager.sendLogUpdate('prospect_search', '⚠️ No prospects found - trying alternative methods...', 'warning');
        } else {
          this.wsManager.sendLogUpdate('prospect_search', `✅ Found ${prospects.length} verified email addresses!`, 'success');
          this.wsManager.sendLogUpdate('prospect_search', `📧 Sample: ${prospects.slice(0,2).map(p => p.email || p.name || 'N/A').join(', ')}`, 'info');
          
          // Complete the step with results  
          this.wsManager.stepCompleted('prospect_search', {
            prospects: prospects,
            totalFound: prospects.length,
            searchEngine: 'SuperPowerEmailSearchEngine',
            timestamp: new Date().toISOString()
          });
          
          // Send workflow completion update with results
          this.wsManager.broadcast({
            type: 'workflow_update',
            stepId: 'prospect_search',
            stepData: {
              status: 'completed',
              progress: 100,
              results: { prospects, total: prospects.length, source: '超级邮箱发现引擎' },
              logs: [
                { message: `✅ Found ${prospects.length} email prospects`, level: 'success', timestamp: new Date() },
                { message: `🔍 Search method: AI-powered discovery`, level: 'info', timestamp: new Date() }
              ]
            }
          });
        }
      }
      
      if (prospects.length === 0) {
        console.warn('⚠️ No prospects found with SuperEmailSearch - this is expected for new/small companies');
      } else {
        console.log(`   First few emails: ${prospects.slice(0,3).map(p => p.email || p.name || 'N/A').join(', ')}`);
      }
      
      // IMMEDIATELY START EMAIL GENERATION when real emails are found
      if (prospects.length > 0) {
        console.log('🚀 Real emails discovered! Starting immediate email generation...');

        // LOG ALL FOUND EMAILS WITH DETAILS
        console.log('\n📧 FOUND EMAILS LOG:');
        console.log('='.repeat(50));
        prospects.forEach((prospect, index) => {
          console.log(`📧 Email ${index + 1}:`);
          console.log(`   📮 Address: ${prospect.email}`);
          console.log(`   👤 Name: ${prospect.name || 'Unknown'}`);
          console.log(`   🏢 Company: ${prospect.company || 'Unknown'}`);
          console.log(`   💼 Role: ${prospect.role || 'Unknown'}`);
          console.log(`   🔗 Source: ${prospect.source || 'Unknown'}`);
          console.log(`   🎯 Confidence: ${prospect.confidence || 'N/A'}`);
          console.log(`   🔍 Method: ${prospect.method || 'Unknown'}`);
          console.log(`   ⏰ Found at: ${new Date().toISOString()}`);
          console.log('   ' + '-'.repeat(40));
        });
        console.log('='.repeat(50));

        // Store prospects for later use
        this.foundProspects = prospects;

        // 🎯 NEW: Check if user has saved template preference first
        const userId = this.userId || 'anonymous';
        // 🔥 CRITICAL FIX: Get campaignId from campaignConfig, not from currentCampaign (which is just a string)
        const campaignId = this.campaignConfig?.campaignId || this.state.currentCampaign;
        console.log(`🔍 DEBUG: Using campaignId: ${campaignId} (from: ${this.campaignConfig?.campaignId ? 'campaignConfig' : 'currentCampaign'})`);

        const hasAutoAppliedTemplate = await this.checkAndApplySavedTemplate(userId, campaignId);

        if (hasAutoAppliedTemplate) {
          console.log(`✅ [LOCATION 2] Template auto-applied for user ${userId} - continuing without pause`);
          // Don't set waitingForTemplate flags - let workflow continue normally
          this.state.isWaitingForTemplate = false;
          return prospects;
        } else {
          // No saved template - show modal and pause workflow
          if (this.wsManager) {
            console.log('🎨🎨🎨 BROADCASTING TEMPLATE SELECTION REQUIRED MESSAGE (LOCATION 2) 🎨🎨🎨');
            console.log('🎨 Prospects found:', prospects.length);
            console.log('🎨 Campaign ID:', campaignId);
            const message = {
              type: 'template_selection_required',
              data: {
                campaignId: campaignId,  // 🔥 FIX: Include campaignId in message
                prospectsFound: prospects.length,
                sampleProspects: prospects.slice(0, 3).map(p => ({
                  name: p.name || 'Unknown',
                  company: p.company || 'Unknown',
                  email: p.email
                })),
                availableTemplates: TemplatePromptService.getAllTemplates(),
                defaultTemplate: null,
                websiteAnalysis: this.campaignConfig?.websiteAnalysis || null,  // Include websiteAnalysis (logo, etc.)
                message: `Found ${prospects.length} prospects! Please select an email template to use for all emails in this campaign.`
              }
            };
            console.log('🎨 Broadcasting message:', JSON.stringify(message, null, 2));
            this.wsManager.broadcast(message);

            console.log('✅ Template selection popup triggered - waiting for user selection');
          }

          // 🛑 CRITICAL PAUSE: Wait for template selection before proceeding
          console.log('🛑 PAUSING WORKFLOW: Waiting for user to select email template...');
          console.log(`🔍 DEBUG: Storing campaignId in waitingForTemplateSelection: ${campaignId}`);

          // Set workflow state to waiting for template selection
          this.state.waitingForTemplateSelection = {
            prospects: prospects,
            campaignId: campaignId,  // 🔥 FIX: Now this will have the correct value
            businessAnalysis: this.businessAnalysisData || this.state.currentCampaign?.businessAnalysis,
            marketingStrategy: this.marketingStrategyData || this.state.currentCampaign?.marketingStrategy,
            smtpConfig: this.campaignConfig?.smtpConfig || null, // 🔥 CRITICAL FIX: Include SMTP config
            timestamp: new Date().toISOString()
          };

          // DO NOT proceed to email generation until template is selected
          console.log('⏸️ Workflow PAUSED - Template selection required before email generation can begin');

          // 🛑 IMPORTANT: Return prospects but mark workflow as waiting
          console.log('✅ Returning prospects but workflow is PAUSED for template selection');
          // Mark workflow as waiting - this will prevent executeEmailCampaignWithLearning from running
          this.state.isWaitingForTemplate = true;
          return prospects;
        }
      } else {
        console.log('⚠️ No real emails found - email generation will not start');

        // 过滤重复的邮件地址（连续运行模式下）
        const filteredProspects = this.filterDuplicateEmails(prospects);

        // Return prospects (limit to 20 for performance)
        return filteredProspects.slice(0, 20);
      }
      
    } catch (error) {
      console.error('❌ Prospect search failed:', error.message);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * 🚀 Continue workflow with selected template after user selection
   */
  async continueWithSelectedTemplate(templateId, waitingState, enhancedTemplate = null) {
    try {
      console.log('🔥🔥🔥 ===============================================');
      console.log('🔥 continueWithSelectedTemplate CALLED!');
      console.log('🔥🔥🔥 ===============================================');
      console.log(`🎨 Continuing workflow with template: ${templateId}`);
      console.log(`📊 Processing ${waitingState.prospects?.length || 0} prospects`);
      console.log(`📧 SMTP Config from waitingState: ${waitingState.smtpConfig ? 'Found ✅' : 'Missing ❌'}`);
      console.log(`🔍 waitingState keys: ${Object.keys(waitingState).join(', ')}`);
      console.log(`🔍 enhancedTemplate provided: ${!!enhancedTemplate}`);

      // Clear the waiting flag
      this.state.isWaitingForTemplate = false;
      this.state.waitingForTemplateSelection = null;
      console.log('✅ Cleared waiting flags');

      // Get campaign information
      const campaignId = waitingState.campaignId || `template_campaign_${Date.now()}`;

      // Get the selected template (use enhanced template if provided, otherwise get from service)
      const selectedTemplate = enhancedTemplate || TemplatePromptService.getTemplate(templateId);
      if (!selectedTemplate) {
        throw new Error(`Template ${templateId} not found`);
      }

      console.log(`✅ Using template: ${selectedTemplate.name} (${selectedTemplate.structure?.paragraphs || 'custom'} paragraphs)`);

      // 🎯 CRITICAL: Use enhanced template data with user edits if provided
      let templateData;
      if (enhancedTemplate && (enhancedTemplate.isCustomized || enhancedTemplate.templateData)) {
        console.log('🎨 Using ENHANCED template with user customizations');

        // 🎯 NEW: Check if templateData is nested in enhancedTemplate
        const userTemplateData = enhancedTemplate.templateData || enhancedTemplate;

        console.log('✨ User customizations:', {
          hasTemplateData: !!enhancedTemplate.templateData,
          hasSubject: !!(userTemplateData.subject),
          hasGreeting: !!(userTemplateData.greeting),
          hasSignature: !!(userTemplateData.signature),
          customizationsKeys: userTemplateData.customizations ? Object.keys(userTemplateData.customizations) : []
        });

        // Use the enhanced template directly - it already contains user edits
        templateData = {
          ...userTemplateData, // Spread the user's template data first
          // Ensure required fields are present
          id: templateId,
          templateId: templateId,
          // 🔥 CRITICAL FIX: Only set isCustomized if actually customized (FIXED: removed || true)
          isCustomized: !!(userTemplateData.isCustomized || enhancedTemplate.isCustomized),
          userSelected: true,
          senderName: enhancedTemplate.senderName || waitingState.senderName || process.env.SENDER_NAME || 'James',
          senderEmail: enhancedTemplate.senderEmail || waitingState.senderEmail || process.env.SMTP_USER || 'fruitaiofficial@gmail.com',
          companyName: enhancedTemplate.companyName || waitingState.companyName || process.env.COMPANY_NAME || 'FruitAI'
        };
      } else {
        console.log('🎨 Using DEFAULT template - no user customizations');
        // Create template data structure for email generation
        templateData = {
          id: templateId,
          name: selectedTemplate.name,
          templateId: templateId,
          html: selectedTemplate.html,
          components: selectedTemplate.components || [],
          structure: selectedTemplate.structure,
          subject: selectedTemplate.subject || `Partnership Opportunity with {company}`,
          customizations: selectedTemplate.customizations || {},
          greeting: selectedTemplate.greeting || 'Hi {name},',
          signature: selectedTemplate.signature || 'Best regards,\\n{senderName}\\n{company}',
          isCustomized: false,
          // Add default sender info
          senderName: waitingState.senderName || process.env.SENDER_NAME || 'James',
          senderEmail: waitingState.senderEmail || process.env.SMTP_USER || 'fruitaiofficial@gmail.com',
          companyName: waitingState.companyName || process.env.COMPANY_NAME || 'FruitAI'
        };
      }

      console.log(`🎨 Template customization status: ${templateData.isCustomized ? 'CUSTOMIZED' : 'DEFAULT'}`);
      if (templateData.isCustomized) {
        console.log(`✨ Custom properties:`, Object.keys(templateData.customizations));
        console.log(`📄 User HTML length: ${templateData.html?.length || 0} characters`);
        console.log(`📄 First 200 chars of user HTML: ${templateData.html?.substring(0, 200) || 'NO HTML'}`);
      }

      // 🎯 CRITICAL FIX: Store the selected template globally for all emails in this campaign
      this.state.selectedCampaignTemplate = {
        templateId: templateId,
        templateData: templateData,
        enhancedTemplate: enhancedTemplate,
        isUserCustomized: templateData.isCustomized || !!enhancedTemplate
      };
      console.log(`📦 Stored selected template globally: ${templateId}`);
      console.log(`   📄 Stored HTML length: ${this.state.selectedCampaignTemplate.templateData.html?.length || 0}`);

      // Resume email generation with the selected template
      console.log('📧 Resuming email generation with selected template...');

      // Send WebSocket updates for UI
      if (this.wsManager) {
        this.wsManager.stepStarted('email_generation', 'Email Generation');
        this.wsManager.sendLogUpdate('email_generation', 'Resuming email generation with selected template...', 'info');
        this.wsManager.sendNotification('正在使用选定的模板生成邮件...', 'info');
      }

      // Retrieve stored business analysis and marketing strategy
      const businessAnalysis = waitingState.businessAnalysis || this.businessAnalysisData || this.state.currentCampaign?.businessAnalysis;
      const marketingStrategy = waitingState.marketingStrategy || this.marketingStrategyData || this.state.currentCampaign?.marketingStrategy;

      console.log('📊 Retrieved context for email generation:');
      console.log(`   📋 Business Analysis: ${businessAnalysis ? 'Found' : 'Missing'}`);
      console.log(`   📈 Marketing Strategy: ${marketingStrategy ? 'Found' : 'Missing'}`);

      // If still missing, create minimal strategy
      const finalMarketingStrategy = marketingStrategy || {
        campaign_objectives: {
          primary_goal: 'partnership',
          success_metrics: ['emails']
        },
        target_audience: {
          primary_segments: ['Business Decision Makers'],
          type: 'B2B'
        },
        messaging_framework: {
          value_proposition: 'Innovative solutions for your business',
          key_messages: ['efficiency', 'partnership', 'innovation']
        }
      };

      // Call the email campaign method with proper template data and context
      // 🎯 CRITICAL FIX: Always use the actual template ID, never 'user_template'
      const emailTemplateType = templateId; // Always use the actual template ID

      console.log(`🎯 Email generation type: ${emailTemplateType}`);
      console.log(`📧 Template data customized: ${templateData.isCustomized}`);
      console.log(`🎨 Template has components: ${templateData.components ? templateData.components.length : 0}`);

      console.log(`🚀🚀🚀 About to call executeEmailCampaignWithLearning...`);
      console.log(`   Prospects: ${waitingState.prospects?.length || 0}`);
      console.log(`   Template: ${emailTemplateType}`);
      console.log(`   Template customized: ${templateData.isCustomized}`);
      console.log(`   Template HTML length: ${templateData.html?.length || 0}`);

      const emailCampaign = await this.executeEmailCampaignWithLearning(
        waitingState.prospects,
        finalMarketingStrategy, // Pass marketing strategy
        campaignId,
        waitingState.smtpConfig || null, // 🔥 CRITICAL FIX: Use SMTP config from waitingState
        emailTemplateType, // Use actual template ID
        templateData, // templateData with selected template and user edits
        null, // targetAudience
        businessAnalysis // Pass business analysis
      );

      console.log(`✅✅✅ executeEmailCampaignWithLearning returned!`);
      console.log(`   Emails generated: ${emailCampaign?.emails?.length || 0}`);

      // 🔥 CRITICAL FIX: Save email campaign results to workflow storage
      console.log('💾 Saving email campaign results to workflow storage...');
      const workflowRoute = require('../routes/workflow');
      if (workflowRoute.setLastWorkflowResults) {
        const completeResults = {
          campaignId: campaignId,
          prospects: waitingState.prospects,
          businessAnalysis: businessAnalysis,
          marketingStrategy: finalMarketingStrategy,
          emailCampaign: emailCampaign, // 🎯 CRITICAL: Include generated emails
          smtpConfig: waitingState.smtpConfig,
          status: 'completed',
          timestamp: new Date().toISOString()
        };
        const userId = this.userId || 'anonymous';
        await workflowRoute.setLastWorkflowResults(completeResults, userId, campaignId);
        console.log(`✅ [PRODUCTION] Saved ${emailCampaign?.emails?.length || 0} emails to workflow results for User: ${userId}, Campaign: ${campaignId}`);
      }

      // Send completion updates
      if (this.wsManager) {
        this.wsManager.stepCompleted('email_generation', emailCampaign);
        this.wsManager.sendLogUpdate('email_generation', `✅ Generated ${emailCampaign?.emails?.length || 0} personalized emails`, 'success');
        this.wsManager.sendNotification(`成功生成 ${emailCampaign?.emails?.length || 0} 封个性化邮件`, 'success');

        // Update workflow status
        this.wsManager.updateWorkflowStatus('completed');
        this.wsManager.sendNotification('🎉 邮件生成完成！', 'success');

        // 🔥 Broadcast complete results with emails to frontend
        this.wsManager.broadcast({
          type: 'workflow_complete',
          data: {
            campaignId,
            prospectsCount: waitingState.prospects.length,
            emailsGenerated: emailCampaign?.emails?.length || 0,
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        });
      }

      console.log('✅ Email generation resumed successfully with selected template');

    } catch (error) {
      console.error('❌❌❌ ===============================================');
      console.error('❌ CRITICAL ERROR in continueWithSelectedTemplate!');
      console.error('❌❌❌ ===============================================');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('❌❌❌ ===============================================');

      // Notify via WebSocket that resume failed
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'workflow_error',
          data: {
            error: 'Failed to resume workflow with selected template',
            details: error.message,
            stack: error.stack
          }
        });
      }
    }
  }

  /**
   * 邮件活动执行 + 学习优化
   */
  async executeEmailCampaignWithLearning(prospects, marketingStrategy, campaignId, smtpConfig = null, emailTemplate = null, templateData = null, targetAudience = null, businessAnalysis = null) {
    console.log('📧 Executing email campaign with learning...');
    console.log(`🔍 DEBUG: Method called with ${prospects?.length || 0} prospects, campaignId: ${campaignId}`);
    console.log(`📧 SMTP Config: ${smtpConfig ? 'Provided from frontend' : 'Not provided - will use environment variables'}`);
    console.log(`📧 Email Template: ${emailTemplate || 'Not specified - will use default'}`);
    console.log(`📧 Template Data:`, templateData ? 'Provided' : 'Not provided');
    console.log(`🎯 Target Audience:`, targetAudience ? 'Provided' : 'Not provided');
    console.log(`📈 Marketing Strategy:`, marketingStrategy ? 'Provided' : 'Not provided');
    
    // 🔧 DEBUG: Log all parameters to debug template selection issue
    console.log(`🔍 DEBUG - Template Selection Debug:`);
    console.log(`   📋 emailTemplate parameter:`, emailTemplate);
    console.log(`   📧 smtpConfig:`, smtpConfig ? Object.keys(smtpConfig) : 'null');
    console.log(`   📝 templateData:`, templateData ? Object.keys(templateData) : 'null');
    console.log(`   🎯 targetAudience:`, targetAudience ? Object.keys(targetAudience) : 'null');
    
    // Create templateData from user-provided SMTP config (NO FALLBACKS - use exact user input)
    // CRITICAL FIX: Merge SMTP config with existing user template instead of overwriting
    if (smtpConfig && (!templateData || !templateData.senderName || !templateData.senderEmail)) {
      // 🔥 USE EXACTLY WHAT USER PROVIDED - no fallbacks or defaults
      let senderEmail = smtpConfig.auth?.user || smtpConfig.username || smtpConfig.email;

      // Fix common frontend mapping errors
      if (senderEmail && senderEmail.startsWith('http')) {
        console.log('🔧 Frontend error detected: Website URL sent as email, using environment fallback');
        senderEmail = process.env.SMTP_USER || 'fruitaiofficial@gmail.com';
      }

      // 🚨 CRITICAL FIX: Preserve existing template data and only add SMTP info
      const smtpData = {
        senderName: smtpConfig.senderName,
        senderEmail: senderEmail,
        companyWebsite: smtpConfig.companyWebsite || this.businessAnalysisData?.website || 'https://fruitai.org',
        companyName: smtpConfig.companyName || smtpConfig.senderName || 'FruitAI',
        ctaUrl: smtpConfig.companyWebsite || this.businessAnalysisData?.website || 'https://fruitai.org',
        ctaText: 'Visit Our Website'
      };

      // If we have existing templateData (like user template), merge SMTP data with it
      if (templateData && (templateData.html || templateData.components || templateData.subject)) {
        console.log('🔧 TEMPLATE FIX: Merging SMTP config with existing user template');
        // 🎯 CRITICAL: Preserve ALL user customizations - only add SMTP fields if missing
        templateData = {
          ...templateData, // Keep ALL user customizations first
          // Only override sender info from SMTP config
          senderName: smtpData.senderName,
          senderEmail: smtpData.senderEmail,
          // Keep company info from template if exists, otherwise use SMTP
          companyWebsite: templateData.companyWebsite || smtpData.companyWebsite,
          companyName: templateData.companyName || smtpData.companyName,
          ctaUrl: templateData.ctaUrl || smtpData.ctaUrl,
          ctaText: templateData.ctaText || smtpData.ctaText
        };
        console.log('🔍 TEMPLATE FIX: Merged template has html:', !!templateData.html);
        console.log('🔍 TEMPLATE FIX: Merged template has subject:', !!templateData.subject);
        console.log('🔍 TEMPLATE FIX: Merged template has greeting:', !!templateData.greeting);
        console.log('🔍 TEMPLATE FIX: Merged template has signature:', !!templateData.signature);
        console.log('🔍 TEMPLATE FIX: Merged template has customizations:', !!templateData.customizations);
        console.log('🔍 TEMPLATE FIX: Merged template has components:', !!templateData.components);
      } else {
        // No existing template, use SMTP data only
        templateData = smtpData;
      }

      console.log(`📧 Using EXACT user SMTP config: ${templateData.senderName} <${templateData.senderEmail}>, Company: ${templateData.companyName}`);
      console.log(`   🌐 Website: ${templateData.companyWebsite}`);
      console.log(`   🔗 CTA: ${templateData.ctaText} -> ${templateData.ctaUrl}`);
    } else if (!templateData || !templateData.senderName || !templateData.senderEmail) {
      console.log(`❌ ERROR: Incomplete template data! Missing sender info.`);
      console.log(`   📧 templateData present: ${!!templateData}`);
      console.log(`   🔍 templateData type: ${typeof templateData}`);
      console.log(`   🔍 templateData structure:`, JSON.stringify(templateData, null, 2));
      console.log(`   👤 senderName: ${templateData?.senderName || 'missing'}`);
      console.log(`   📮 senderEmail: ${templateData?.senderEmail || 'missing'}`);
      console.log(`   🔧 Available keys:`, Object.keys(templateData || {}));
      throw new Error('Complete template data with senderName and senderEmail is required from frontend. Please configure SMTP settings properly.');
    }
    
    if (!prospects || prospects.length === 0) {
      console.log('⚠️ No prospects found, skipping email campaign');
      return { emails: [], campaign_id: campaignId };
    }

    // Additional DNS validation to prevent delivery failures 
    console.log('🔍 进行额外DNS验证防止发送失败...');
    const validatedProspects = [];
    const EnhancedEmailValidator = require('../services/EnhancedEmailValidator');
    const validator = new EnhancedEmailValidator();
    
    for (const prospect of prospects) {
      try {
        const validation = await validator.validateEmail(prospect.email, { skipSMTP: true, skipDNS: false });
        if (validation.valid && validation.score >= 40) {
          validatedProspects.push(prospect);
          console.log(`   ✅ ${prospect.email} - Validation passed (score: ${validation.score})`);
        } else {
          console.log(`   ❌ ${prospect.email} - Validation failed: ${validation.reason} (score: ${validation.score})`);
        }
      } catch (error) {
        console.log(`   ⚠️ ${prospect.email} - validation error: ${error.message}`);
      }
    }
    
    console.log(`📊 DNS验证结果: ${validatedProspects.length}/${prospects.length} 通过`);
    
    if (validatedProspects.length === 0) {
      console.log('❌ 没有通过DNS验证的邮箱地址');
      return { emails: [], campaign_id: campaignId, validation_failed: true };
    }

    // 为每个潜在客户生成个性化邮件
    const emailCampaign = {
      campaign_id: campaignId,
      emails: [],
      total_prospects: validatedProspects.length,
      total_validated: validatedProspects.length,
      total_rejected: prospects.length - validatedProspects.length,
      stage: 'initial_outreach'
    };

    // Debug: Check if we have prospects to process
    console.log(`\n🔍 DEBUG: About to start email generation with ${validatedProspects.length} prospects`);
    if (validatedProspects.length === 0) {
      console.log('❌ No prospects to process - stopping email generation');
      return emailCampaign;
    }

    // Sequential email generation: persona → email → send for each prospect
    console.log(`\n📧 STARTING SEQUENTIAL EMAIL GENERATION WORKFLOW`);
    console.log('='.repeat(60));
    console.log(`📊 Total prospects to process: ${validatedProspects.length}`);
    console.log(`🎯 Processing up to: ${Math.min(validatedProspects.length, 10)} prospects`);
    console.log(`⚡ Workflow: Generate Persona → Create Email → Send → Next Prospect`);
    console.log('='.repeat(60));
    
    for (let i = 0; i < Math.min(validatedProspects.length, 10); i++) {
      const prospect = validatedProspects[i];
      let emailContent = null; // Declare in scope accessible to catch blocks
      let emailStatus = 'awaiting_approval'; // Declare in scope accessible to catch blocks
      let sentAt = null; // Declare in scope accessible to catch blocks
      try {
      
      // 🔥 CRITICAL FIX: Assign templateData to each prospect for sender info
      if (templateData) {
        prospect.templateData = templateData;
        console.log(`   ✅ Assigned templateData: ${templateData.senderName} <${templateData.senderEmail}>`);
      }
      
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📧 PROSPECT ${i + 1}/${Math.min(validatedProspects.length, 10)}`);
      console.log(`${'─'.repeat(50)}`);
      console.log(`   Email: ${prospect.email}`);
      console.log(`   Name: ${prospect.name || 'Unknown'}`);
      console.log(`   Company: ${prospect.company || 'Unknown'}`);
      
      if (this.wsManager) {
        this.wsManager.sendLogUpdate('email_generation', `\n👤 [${i + 1}/${Math.min(validatedProspects.length, 10)}] Starting: ${prospect.email}`, 'info');
      }
      
      try {
        // Step 1: Generate user persona for this specific prospect
        console.log(`\n   🧠 STEP 1: Generating AI User Persona...`);
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('email_generation', `   🧠 Generating persona for ${prospect.name || prospect.email}...`, 'info');
        }
        
        // Ensure we have marketing strategy and business analysis
        const actualMarketingStrategy = marketingStrategy || this.marketingStrategyData || {
          campaign_objectives: {
            primary_goal: 'partnership',
            success_metrics: ['emails']
          },
          target_audience: {
            primary_segments: ['Business Decision Makers'],
            type: 'B2B'
          },
          messaging_framework: {
            value_proposition: 'Innovative solutions for your business',
            key_messages: ['efficiency', 'partnership', 'innovation']
          }
        };

        // Store the marketing strategy and business analysis for subsequent prospects
        if (!this.marketingStrategyData) {
          this.marketingStrategyData = actualMarketingStrategy;
        }

        // Store business analysis if not already stored
        if (!this.businessAnalysisData && businessAnalysis) {
          this.businessAnalysisData = businessAnalysis;
        }

        const userPersona = await this.generateUserPersona(prospect, actualMarketingStrategy, targetAudience);
        
        // 🔥 CRITICAL: Assign persona to prospect object for frontend display
        prospect.persona = userPersona;
        
        console.log(`   ✅ Persona Generated:`);
        console.log(`      Type: ${userPersona.type || 'Standard'}`);
        console.log(`      Style: ${userPersona.communicationStyle || 'Professional'}`);
        console.log(`      Decision Level: ${userPersona.decisionLevel || 'Medium'}`);
        if (userPersona.painPoints) {
          console.log(`      Pain Points: ${userPersona.painPoints.join(', ')}`);
        }
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('email_generation', `   ✅ Persona: ${userPersona.type} (${userPersona.communicationStyle})`, 'success');
          
          // 🚀 Send updated prospect with full persona to frontend immediately
          this.wsManager.broadcast({
            type: 'prospect_updated',
            data: {
              prospect: prospect,
              persona: userPersona,
              step: 'persona_generated',
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Step 2: Generate personalized email based on persona
        console.log(`\n   📝 STEP 2: Creating Personalized Email...`);
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('email_generation', `   📝 Writing personalized email based on persona...`, 'info');
        }
        
        // 获取邮件优化建议
        const emailOptimization = await this.memory.getEmailOptimizationSuggestions(
          { subject: '', body: `Outreach to ${prospect.company || prospect.name}` },
          campaignId
        );

        // 🎯 CRITICAL FIX: Check if we have a selected template from the template selection popup
        let useSelectedTemplate = false;
        let selectedTemplateId = emailTemplate;
        let selectedTemplateData = templateData;

        // CRITICAL: Check for stored campaign template first
        if (this.state.selectedCampaignTemplate) {
          console.log(`🎯 Using campaign-selected template: ${this.state.selectedCampaignTemplate.templateId}`);
          useSelectedTemplate = true;
          selectedTemplateId = this.state.selectedCampaignTemplate.templateId;
          selectedTemplateData = this.state.selectedCampaignTemplate.templateData;
        } else if (templateData && templateData.templateId) {
          console.log(`🎯 Using provided template: ${templateData.templateId}`);
          useSelectedTemplate = true;
          selectedTemplateId = templateData.templateId;
        } else {
          // Fallback to legacy user template logic
          const useUserTemplate = (templateData && (templateData.isCustomized || templateData.components || templateData.html)) ||
                                  this.state.userTemplate;
          if (useUserTemplate) {
            console.log(`🎨 Using legacy user template for email ${i + 1}/${Math.min(validatedProspects.length, 10)}`);
            selectedTemplateData = templateData || this.state.userTemplate;
            selectedTemplateId = 'user_template';
            useSelectedTemplate = true;
          }
        }

        if (useSelectedTemplate) {
          console.log(`🎨 Using selected template for email ${i + 1}/${Math.min(validatedProspects.length, 10)}`);
          console.log(`   📋 Template ID: ${selectedTemplateId}`);
          console.log(`   📋 Template Name: ${selectedTemplateData?.name || 'Unknown'}`);
          console.log(`   🎯 Template components: ${selectedTemplateData?.components?.length || 0}`);
          console.log(`   ✨ Template customized: ${selectedTemplateData?.isCustomized || false}`);
        }

        // Ensure business analysis is available
        const actualBusinessAnalysis = businessAnalysis || this.businessAnalysisData || {};

        // Use the selected template for email generation
        // 🎯 CRITICAL FIX: Always use actual template ID, never fallback to 'user_template'
        const emailTemplateType = useSelectedTemplate ? selectedTemplateId : (emailTemplate || 'professional_partnership');
        const finalTemplateData = selectedTemplateData || templateData;

        console.log(`🎯 Final email template type: ${emailTemplateType}`);
        console.log(`📧 Final template data source: ${finalTemplateData?.name || finalTemplateData?.templateId || 'unknown'}`);

        emailContent = await this.generateOptimizedEmailContentWithPersona(
          prospect,
          userPersona,
          actualMarketingStrategy, // Use the actual marketing strategy
          emailOptimization,
          actualBusinessAnalysis, // Use the actual business analysis
          emailTemplateType,
          finalTemplateData,
          targetAudience,
          i
        );

        // 🛡️ Check if email generation failed
        if (!emailContent || !emailContent.subject) {
          console.error(`   ❌ Email generation failed for ${prospect.email} - emailContent is null or missing subject`);
          throw new Error(`Email generation failed: ${emailContent ? 'Missing subject' : 'No content generated'}`);
        }

        console.log(`   ✅ Email Created:`);
        console.log(`      Subject: "${emailContent.subject || 'No subject'}"`);
        console.log(`      Template: ${emailContent.template || 'custom'}`);
        console.log(`      Length: ${emailContent.body?.length || 0} characters`);
        console.log(`      Personalization Level: ${emailContent.personalizationLevel || 'Standard'}`);

        if (this.wsManager) {
          this.wsManager.sendLogUpdate('email_generation', `   ✅ Email: "${emailContent.subject}"`, 'success');
          this.wsManager.sendLogUpdate('email_generation', `   📊 Template: ${emailContent.template || 'custom'}, ${emailContent.body?.length || 0} chars`, 'info');
        }

        // Step 2.5: Generate Email Preview for Editor
        console.log(`\n   🎨 STEP 2.5: Generating Email Preview for Editor...`);
        let emailPreview = null;
        try {
          const EmailEditorService = require('../services/EmailEditorService');
          const emailEditor = new EmailEditorService();
          
          const previewData = {
            subject: emailContent.subject,
            body: emailContent.body,
            template: emailContent.template || 'default',
            recipientName: prospect.name || prospect.email.split('@')[0],
            recipientCompany: prospect.company || prospect.email.split('@')[1].split('.')[0],
            senderName: templateData?.senderName || 'AI Agent',
            companyName: this.businessAnalysisData?.companyName || 'Your Company',
            // ✨ CRITICAL FIX: Include original template components and data
            originalComponents: templateData?.components || emailContent.templateData?.components || [],
            originalTemplateData: templateData || emailContent.templateData || {},
            preserveOriginalStructure: true
          };
          
          const preview = await emailEditor.generateEmailPreview(previewData);
          emailPreview = preview;
          
          console.log(`   ✅ Email preview generated for editor`);
          console.log(`   🧩 Components: ${preview.preview?.components?.length || 0}`);
          
          // Store preview in email content for frontend access
          emailContent.editorPreview = {
            id: preview.preview.id,
            structure: preview.preview,
            editableHtml: preview.editableHtml,
            components: preview.components,
            canEdit: true,
            previewUrl: `/api/email-editor/preview/${preview.preview.id}`
          };
          
          // Store the email in EmailEditorService for pending approval
          // CRITICAL FIX: Use the actual generated HTML body which includes the Professional Partnership template
          const pendingEmailData = {
            id: `${campaignId}_${prospect.email}`,
            campaignId: campaignId,
            prospectEmail: prospect.email,
            subject: emailContent.subject,
            // CRITICAL: Use the actual HTML body that was generated with the template
            body: emailContent.body, // This contains the full Professional Partnership HTML
            html: emailContent.body, // Same content for HTML view
            template: emailContent.template,
            templateName: templateData?.name || 'Professional Partnership',
            templateId: templateData?.templateId || selectedTemplateId,
            // Include the full template data so editor can use it
            templateData: templateData,
            components: templateData?.components || [],
            recipient_name: prospect.name || prospect.email.split('@')[0],
            recipient_company: prospect.company || prospect.email.split('@')[1].split('.')[0],
            sender_name: templateData?.senderName || 'AI Agent',
            sender_email: templateData?.senderEmail || 'agent@company.com',
            website_url: this.businessAnalysisData?.websiteUrl || '',
            campaign_id: campaignId,
            created_at: new Date().toISOString(),
            editorPreview: emailContent.editorPreview,
            // Mark this as the actual generated content
            isGenerated: true,
            hasTemplate: true
          };
          
          await emailEditor.storePendingApprovalEmail(pendingEmailData);
          console.log(`   💾 Email stored for approval: ${pendingEmailData.id}`);
          
          if (this.wsManager) {
            this.wsManager.sendLogUpdate('email_generation', `   🎨 Preview: ${preview.preview?.components?.length || 0} editable components`, 'info');
            
            // Send preview to frontend for potential editing
            this.wsManager.broadcast({
              type: 'email_preview_generated',
              data: {
                prospectId: prospect.email,
                campaignId: campaignId,
                preview: emailContent.editorPreview,
                canEdit: true,
                timestamp: new Date().toISOString()
              }
            });

            // MOVED: Show popup after email is fully processed (see below around line 1110)
          }

        } catch (previewError) {
          console.log(`   ⚠️ Email preview generation failed: ${previewError.message}`);
          if (this.wsManager) {
            this.wsManager.sendLogUpdate('email_generation', `   ⚠️ Preview failed, proceeding with standard email`, 'warning');
          }
        }

        // Step 3: PAUSE and wait for user approval before sending
        console.log(`\n   ⏸️ STEP 3: Email Ready - Waiting for User Approval...`);
        emailStatus = 'awaiting_approval';
        sentAt = null;

        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'email_awaiting_approval',
            data: {
              prospectId: prospect.email,
              emailContent: {
                subject: emailContent.subject,
                body: emailContent.body,
                html: emailContent.html
              },
              prospect: prospect,
              campaignId: campaignId,
              preview: emailContent.editorPreview
            }
          });
        }

        // 🎯 NEW: Show popup ONLY after first email is fully generated and ready
        if (i === 0) { // First email is completely ready
          console.log('🎉 First email generated! Showing editor popup...');

          // Update workflow state with real email data
          const realEmailData = {
            id: `${campaignId}_${prospect.email}`,
            campaignId: campaignId,
            to: prospect.email,
            recipientName: prospect.name || prospect.email,
            company: prospect.company || 'Unknown Company',
            subject: emailContent.subject,
            body: emailContent.body || emailContent.html,
            quality_score: emailContent.qualityScore || 85,
            timestamp: new Date().toISOString()
          };

          // Set the workflow state firstEmailGenerated
          if (this.workflowState) {
            this.workflowState.firstEmailGenerated = realEmailData;
            this.workflowState.waitingForUserApproval = true;
          }

          // 🎯 CRITICAL FIX: Add first email to workflow results immediately AND set user workflow state
          try {
            const workflowModule = require('../routes/workflow');
            if (workflowModule.addEmailToWorkflowResults) {
              workflowModule.addEmailToWorkflowResults(realEmailData, this.userId);
              console.log(`   ✅ [User: ${this.userId}] First email added to workflow results for frontend polling`);
            }

            // 🎯 CRITICAL: Also update the user-specific workflow state that frontend polls!
            if (workflowModule.setUserWorkflowState) {
              workflowModule.setUserWorkflowState(this.userId, {
                waitingForUserApproval: true,
                firstEmailGenerated: realEmailData
              });
              console.log(`   ✅ [User: ${this.userId}] Workflow state updated for frontend polling`);
            }

            // 🔥 IMMEDIATE BROADCAST: Send state update via WebSocket for instant delivery
            if (this.wsManager) {
              this.wsManager.broadcast({
                type: 'first_email_ready',
                data: {
                  waitingForUserApproval: true,
                  firstEmailGenerated: realEmailData,
                  userId: this.userId
                }
              });
              console.log(`   🔔 [User: ${this.userId}] First email state broadcasted via WebSocket`);
            }
          } catch (error) {
            console.log('⚠️ Could not update workflow results with first email:', error.message);
          }

          // Send email preview to frontend for review
          this.wsManager.broadcast({
            type: 'email_preview_generated',
            data: {
              campaignId: campaignId,
              prospectId: prospect.email,
              preview: {
                subject: emailContent.subject,
                body: emailContent.body || emailContent.html,
                recipientName: prospect.name || prospect.email,
                company: prospect.company || 'Unknown Company',
                quality_score: emailContent.qualityScore || 85
              },
              timestamp: new Date().toISOString()
            }
          });

          // Wait for user decision
          const userDecisionData = await this.waitForUserDecision({
                prospects: validatedProspects,
                currentIndex: i,
                campaignId,
                marketingStrategy,
                targetAudience,
                emailCampaign,
                templateData,  // Add templateData for later use
                smtpConfig     // Add smtpConfig for later use
              });
              
              if (userDecisionData.decision === 'edit') {
                console.log('👤 User chose to edit emails - pausing workflow');

                // Send message indicating workflow is paused for editing
                this.wsManager.broadcast({
                  type: 'workflow_paused_for_editing',
                  data: {
                    message: 'Workflow paused for email editing. You can now go to the Email Editor to review and modify your emails.',
                    campaignId: campaignId,
                    emailsGenerated: 1,
                    totalProspects: Math.min(validatedProspects.length, 10)
                  }
                });

                // Return here and wait for workflow to be resumed via /send-email endpoint
                console.log('⏸️ Workflow paused - will resume after first email is sent');

                return emailCampaign;
              } else {
                console.log('👤 User chose to continue with current content');

                // ✨ CRITICAL FIX: Store user template immediately before continuing
                if (userDecisionData.userTemplate) {
                  console.log('🔄 Storing user template from decision data...');
                  console.log('🔍 DEBUG: userDecisionData.userTemplate keys:', Object.keys(userDecisionData.userTemplate));
                  console.log('🔍 DEBUG: userTemplate.components length:', userDecisionData.userTemplate.components?.length || 0);

                  this.state.userTemplate = userDecisionData.userTemplate;
                  console.log('✅ User template stored in this.state.userTemplate');
                } else {
                  console.log('⚠️ No userTemplate found in userDecisionData');
                }

                // User approved the template immediately, continue with remaining emails
                console.log('✅ Template approved, continuing with remaining prospects...');

                // ✨ NEW: Request complete component structure from email editor
                console.log('📋 Requesting complete component structure from email editor...');
                const componentTemplate = await this.requestComponentTemplate(campaignId);

                if (componentTemplate && componentTemplate.components) {
                  console.log(`🧩 Received component template with ${componentTemplate.components.length} components`);
                  console.log('🎨 Component types:', componentTemplate.components.map(c => c.type).join(', '));

                  // Store the complete component-based template
                  const approvedTemplate = {
                    subject: emailContent.subject,
                    html: emailContent.body || emailContent.html,
                    body: emailContent.body || emailContent.html,
                    senderName: templateData?.senderName || 'AI Agent',
                    senderEmail: templateData?.senderEmail || smtpConfig?.auth?.user,
                    // ✨ NEW: Include component structure
                    components: componentTemplate.components,
                    layout: componentTemplate.layout,
                    styles: componentTemplate.styles,
                    templateType: 'component_based'
                  };

                  // Store the user's decision data for later use
                  if (this.state) {
                    this.state.userTemplate = approvedTemplate;
                  }
                } else {
                  console.log('⚠️ Could not get component structure, using HTML template as fallback');

                  // Fallback to HTML template
                  const approvedTemplate = {
                    subject: emailContent.subject,
                    html: emailContent.body || emailContent.html,
                    body: emailContent.body || emailContent.html,
                    senderName: templateData?.senderName || 'AI Agent',
                    senderEmail: templateData?.senderEmail || smtpConfig?.auth?.user,
                    templateType: 'html_based'
                  };

                  // Store the user's decision data for later use
                  if (this.state) {
                    this.state.userTemplate = approvedTemplate;
                  }
                }

                const approvedTemplate = this.state?.userTemplate || {
                  subject: emailContent.subject,
                  html: emailContent.body || emailContent.html,
                  body: emailContent.body || emailContent.html,
                  senderName: templateData?.senderName || 'AI Agent',
                  senderEmail: templateData?.senderEmail || smtpConfig?.auth?.user,
                  templateType: 'html_based'
                };

                console.log('🔍 DEBUG: Using approved email as template');
                console.log('🔍 DEBUG: Approved template HTML length:', approvedTemplate.html?.length || 0);

                // CRITICAL FIX: Get SMTP config from the stored campaign data
                const storedSmtpConfig = userDecisionData.campaignData?.smtpConfig || smtpConfig;

                console.log('🔧 SMTP Config for batch sending:', {
                  hasStoredConfig: !!userDecisionData.campaignData?.smtpConfig,
                  hasOriginalConfig: !!smtpConfig,
                  usingConfig: !!storedSmtpConfig,
                  host: storedSmtpConfig?.host,
                  user: storedSmtpConfig?.auth?.user || storedSmtpConfig?.username
                });

                // Continue generating and sending emails for remaining prospects
                // ✨ CRITICAL: Pass 'user_template' instead of emailTemplate to ensure user template is used
                const remainingResults = await this.continueGeneratingEmails(
                  campaignId,
                  validatedProspects,
                  1,  // Start from index 1 (second prospect)
                  approvedTemplate,
                  storedSmtpConfig,  // Use the stored SMTP config
                  targetAudience,
                  'user_template'  // 🔥 Force use of user template instead of default emailTemplate
                );

                // Merge results
                emailCampaign.emails = emailCampaign.emails.concat(remainingResults.emails);

                return emailCampaign;
              }
            }

        } catch (previewError) {
          console.log(`   ⚠️ Email preview generation failed: ${previewError.message}`);
          if (this.wsManager) {
            this.wsManager.sendLogUpdate('email_generation', `   ⚠️ Preview failed, proceeding with standard email`, 'warning');
          }
        }

        // Email generation complete, continue with workflow processing
        
        console.log(`   🎨 Email preview sent to frontend for editing`);
        console.log(`   ⏰ Campaign PAUSED - waiting for user to:`);
        console.log(`      1. Review the email preview`);
        console.log(`      2. Edit if needed using the editor`);
        console.log(`      3. Click 'Send' or 'Send All' to continue`);
        
        // CRITICAL: Store email for later sending when user approves
        if (!this.pendingEmails) {
          this.pendingEmails = new Map();
        }
        
        const emailKey = `${campaignId}_${prospect.email}`;
        this.pendingEmails.set(emailKey, {
          prospect,
          emailContent,
          campaignId,
          smtpConfig,
          index: i,
          status: 'awaiting_approval',
          createdAt: new Date().toISOString()
        });
        
        // DO NOT send email automatically - wait for user approval
        emailStatus = 'awaiting_approval';
        
        console.log(`   💾 Email stored for approval: ${emailKey}`);

        // 🔥 CRITICAL FIX: Format email data for frontend display
        const emailRecord = {
          // Frontend expects these direct fields
          id: `email_${campaignId}_${i + 1}`,
          to: prospect.email,
          subject: emailContent.subject,
          body: emailContent.body,
          html: emailContent.body, // CRITICAL FIX: Ensure html field is set for email editor
          status: emailStatus,
          sent: emailStatus === 'sent',
          sent_at: sentAt,
          sentAt: sentAt,
          template_used: emailContent.template_used || emailContent.template || emailTemplate,
          templateUsed: emailContent.template_used || emailContent.template || emailTemplate,

          // Recipient information
          name: prospect.name,
          recipient_name: prospect.name,
          company: prospect.company,
          recipient_company: prospect.company,

          // Campaign metadata
          campaign_id: campaignId,
          generated_at: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
          sequence_position: i + 1,
          sequencePosition: i + 1,

          // Template and customization data
          template: emailContent.template,
          templateData: emailContent.templateData || templateData,

          // Additional data for backend processing
          prospect: prospect,
          userPersona: userPersona,
          email_content: emailContent, // Keep original structure for backend use
          optimization_used: emailOptimization.content_optimizations
        };

        emailCampaign.emails.push(emailRecord);

        // 🎯 CRITICAL FIX: Add email to workflow results so frontend can access it
        try {
          const workflowModule = require('../routes/workflow');
          if (workflowModule.addEmailToWorkflowResults) {
            workflowModule.addEmailToWorkflowResults(emailRecord, this.userId);
            console.log(`   ✅ [User: ${this.userId}] Email added to workflow results for frontend access`);
          }
        } catch (error) {
          console.log('⚠️ Could not update workflow results:', error.message);
        }

        // 🚀 CRITICAL: Send single email immediately to frontend after generation
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'data_update',
            data: {
              emailCampaign: {
                emails: [emailRecord], // Single email
                emailsSent: [emailRecord],
                sent: 1, // Indicates single email
                isSingleUpdate: true, // Flag for frontend
                opened: 0,
                replied: 0
              }
            }
          });
          
          // Also send individual email sent event
          this.wsManager.broadcast({
            type: 'email_sent',
            data: emailRecord
          });
        }

        // 存储邮件学习数据（包含发送状态）
        await this.memory.storeEmailLearning(
          campaignId,
          emailContent,
          { sent: emailStatus === 'sent', opened: false, replied: false },
          { approval: false, rating: 0 }
        );
        
        // Mark this prospect as complete
        console.log(`\n   ✅ PROSPECT ${i + 1} COMPLETE!`);
        console.log(`   ${'─'.repeat(40)}`);
        
        // Longer delay after sending to avoid being flagged as spam
        if (i < Math.min(validatedProspects.length, 10) - 1) {
          console.log(`\n   ⏳ Anti-spam delay before next prospect...`);
          if (this.wsManager) {
            this.wsManager.sendLogUpdate('email_generation', `   ⏳ Waiting 3s before next prospect (anti-spam)...`, 'info');
          }
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between sends
        }
        
      } catch (error) {
        console.error(`❌ Sequential generation failed for ${prospect.name || prospect.email}:`, error.message);
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('email_generation', `❌ Failed for ${prospect.email}: ${error.message}`, 'error');
        }
        
        // 记录失败的邮件生成尝试 - 使用前端兼容格式
        const failedEmailRecord = {
          // Frontend expects these direct fields
          id: `failed_${campaignId}_${i + 1}`,
          to: prospect.email,
          subject: `Failed: ${error.message.substring(0, 50)}...`,
          body: '',
          status: 'failed',
          sent: false,
          sent_at: null,
          sentAt: null,
          template_used: emailTemplate || 'unknown',
          templateUsed: emailTemplate || 'unknown',
          
          // Recipient information
          name: prospect.name,
          recipient_name: prospect.name,
          company: prospect.company,
          recipient_company: prospect.company,
          
          // Campaign metadata
          campaign_id: campaignId,
          generated_at: new Date().toISOString(),
          generatedAt: new Date().toISOString(),
          sequence_position: i + 1,
          sequencePosition: i + 1,
          
          // Error information
          error: error.message,
          reason: 'Sequential generation error',
          
          // Additional data for backend processing
          prospect: prospect,
          userPersona: null,
          email_content: null
        };

        emailCampaign.emails.push(failedEmailRecord);
      }
    }
    
    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 EMAIL GENERATION WORKFLOW COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total Processed: ${emailCampaign.emails.length} prospects`);
    console.log(`   Emails Sent: ${emailCampaign.emails.filter(e => e.status === 'sent').length}`);
    console.log(`   Emails Generated Only: ${emailCampaign.emails.filter(e => e.status === 'generated').length}`);
    console.log(`   Failed: ${emailCampaign.emails.filter(e => e.status === 'failed' || e.status === 'failed_to_send').length}`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (this.wsManager) {
      // CRITICAL: Use stepCompleted FIRST while workflow status is still 'running'
      // This ensures email campaign data gets broadcasted to frontend
      this.wsManager.stepCompleted('email_campaign', {
        emails: emailCampaign.emails,
        totalEmails: emailCampaign.emails.length,
        sent: emailCampaign.emails.filter(e => e.status === 'sent' || e.status === 'generated').length,
        opened: 0,
        replied: 0
      });
      
      this.wsManager.sendLogUpdate('email_generation', `🎉 Workflow complete: ${emailCampaign.emails.filter(e => e.status === 'sent').length} emails sent`, 'success');
      
      // Send workflow completion update with email data
      this.wsManager.broadcast({
        type: 'workflow_update',
        stepId: 'email_generation',
        stepData: {
          status: 'completed',
          progress: 100,
          results: {
            totalEmails: emailCampaign.emails.length,
            successfulEmails: emailCampaign.emails.filter(e => e.status === 'generated').length,
            failedEmails: emailCampaign.emails.filter(e => e.status === 'failed').length
          }
        }
      });
      
      // Broadcast comprehensive data update
      this.wsManager.broadcast({
        type: 'data_update',
        data: {
          emailCampaign: {
            emails: emailCampaign.emails,
            emailsSent: emailCampaign.emails,
            sent: emailCampaign.emails.length,
            opened: 0,
            replied: 0
          },
          prospects: validatedProspects // 🚀 Include all prospects with their personas
        }
      });
      
      // 🔥 CRITICAL: Send all prospects with personas to frontend
      this.wsManager.updateClientData(validatedProspects);
    }

    this.state.optimizationSuggestions.email = emailCampaign.emails[0]?.optimization_used || [];

    // 🚀 Add prospects with personas to return data
    emailCampaign.prospects = validatedProspects;

    // 💾 CRITICAL: Save complete email campaign to database via workflow module
    try {
      const workflowModule = require('../routes/workflow');
      if (workflowModule.setLastWorkflowResults) {
        console.log(`💾 [User: ${this.userId}] Saving ${emailCampaign.emails.length} emails to database via setLastWorkflowResults...`);
        await workflowModule.setLastWorkflowResults({
          prospects: validatedProspects,
          emailCampaign: emailCampaign
        }, this.userId);
        console.log(`✅ [User: ${this.userId}] Email campaign saved to database successfully`);
      }
    } catch (error) {
      console.error(`❌ [User: ${this.userId}] Failed to save email campaign to database:`, error.message);
    }

    return emailCampaign;
  }

  /**
   * 生成优化的营销策略
   */
  async generateOptimizedMarketingStrategy(businessAnalysis, suggestions, campaignGoal = 'partnership') {
    console.log('🧠 USING OLLAMA TO GENERATE REAL MARKETING STRATEGY (WITH MARKET RESEARCH)...');
    console.log('⏳ Integrating latest market intelligence and generating strategy...');
    
    // ULTRA-FAST STRATEGY GENERATION - MINIMAL PROMPT FOR SPEED
    // 超快速策略生成 - 最小化prompt以提升速度
    
    const strategyPrompt = `JSON for ${businessAnalysis.companyName || 'Company'}:
{
  "company_name": "${businessAnalysis.companyName || 'Company'}",
  "domain": "${businessAnalysis.domain || 'example.com'}",
  "website": "${businessAnalysis.url || businessAnalysis.website || 'https://example.com'}",
  "industry": "${businessAnalysis.industry || 'Technology'}",
  "description": "${(businessAnalysis.valueProposition || 'Business solution').substring(0, 40)}",
  "target_audience": {
    "type": "b2b",
    "primary_segments": ["${businessAnalysis.industry || 'tech'} companies", "businesses"],
    "search_keywords": {
      "primary_keywords": ["${businessAnalysis.industry || 'tech'}", "business"],
      "industry_keywords": ["${businessAnalysis.industry || 'technology'}"],
      "solution_keywords": ["solution", "service"],
      "technology_keywords": ["digital"],
      "audience_keywords": ["professional"]
    },
    "pain_points": ["efficiency", "growth"]
  },
  "messaging_framework": {
    "value_proposition": "${(businessAnalysis.valueProposition || 'Improve efficiency').substring(0, 40)}",
    "tone": "professional",
    "key_messages": ["efficiency", "partnership"]
  },
  "campaign_objectives": {
    "primary_goal": "${campaignGoal}",
    "success_metrics": ["emails"]
  }
}`;

    try {
      // LIGHTNING FAST GENERATION - EXTREME SPEED OPTIMIZATION
      console.log('⚡ Calling Ollama for LIGHTNING FAST strategy generation...');
      const aiStrategy = await this.callOllama(strategyPrompt, 'fast', {
        temperature: 0.01,
        keep_alive: "5m",     // Extremely low temperature for maximum speed
        num_predict: 800,      // Increased for complete JSON response
        top_k: 1,             // Single choice for fastest generation
        top_p: 0.01,          // Maximum focus for extreme speed
        repeat_penalty: 1.0,   // No penalty
        num_ctx: 1024,        // Increased context for complete JSON
        num_thread: 8,       // Maximum threads
        num_gpu: 1,           // GPU acceleration
        mirostat: 0,          // Disable mirostat for speed
        // Removed stop parameter to allow complete JSON generation
        mirostat_eta: 0.1,    // Fast eta
        mirostat_tau: 5.0,    // Fast tau
        tfs_z: 1.0            // Simple TFS for speed
      });
      
      if (!aiStrategy) {
        throw new Error('Ollama returned empty response');
      }
      
      // Parse the AI-generated strategy
      const parsedStrategy = this.parseAIResponse(aiStrategy);
      
      if (!parsedStrategy || !parsedStrategy.company_name) {
        throw new Error('Invalid strategy structure from Ollama');
      }
      
      // Apply learning optimizations to the AI strategy
      if (suggestions.suggested_approaches && suggestions.suggested_approaches.length > 0) {
        const bestApproach = suggestions.suggested_approaches[0];
        if (bestApproach.target_audience?.approach) {
          parsedStrategy.target_audience.approach = bestApproach.target_audience.approach;
        }
      }
      
      console.log('✅ OLLAMA MARKETING STRATEGY GENERATED SUCCESSFULLY!');
      console.log(`   🏢 Company: ${parsedStrategy.company_name}`);
      console.log(`   🎯 Target Type: ${parsedStrategy.target_audience?.type}`);
      const keywordsCount = parsedStrategy.target_audience?.search_keywords?.primary_keywords?.length || 0;
      console.log(`   🔍 Keywords: ${keywordsCount}`);
      
      // Add search query generation for web search
      parsedStrategy.web_search_queries = await this.generateWebSearchQueries(parsedStrategy);
      
      return parsedStrategy;
      
    } catch (error) {
      console.error('❌ OLLAMA STRATEGY GENERATION FAILED:', error.message);
      throw new Error(`Marketing strategy generation failed: ${error.message}. No fallback template allowed.`);
    }
  }
  
  /**
   * Generate specific web search queries based on the marketing strategy
   */
  async generateWebSearchQueries(strategy) {
    console.log('🔍 Generating web search queries based on marketing strategy...');
    
    const queryPrompt = `Based on this marketing strategy, generate 5-7 specific web search queries to find business contacts and email addresses.

STRATEGY:
- Company: ${strategy.company_name}
- Industry: ${strategy.industry}
- Target Audience: ${strategy.target_audience.type}
- Primary Segments: ${JSON.stringify(strategy.target_audience.primary_segments)}
- Keywords: ${JSON.stringify(strategy.target_audience.search_keywords.primary_keywords)}

Generate REAL, SPECIFIC search queries that will help find:
1. Business contacts in the target industry
2. Decision makers in companies
3. Email addresses of potential customers
4. Company directories and contact pages

Create actual search queries using the strategy keywords and segments above.
DO NOT return placeholders like "query 1" or "search term X".

Return ONLY a JSON array of REAL search queries, for example:
["CEO email contacts food technology", "startup founders directory AI", "business executives contact list"]`;

    try {
      const queryResponse = await this.callOllama(queryPrompt, 'fast');
      if (queryResponse) {
        const queries = this.parseAIResponse(queryResponse);
        if (Array.isArray(queries)) {
          console.log(`✅ Generated ${queries.length} web search queries`);
          return queries;
        }
      }
    } catch (error) {
      console.warn('⚠️ Query generation failed, using default queries');
    }
    
    // Fallback queries based on strategy
    const fallbackQueries = [
      `${strategy.industry} companies email contact`,
      `${strategy.target_audience.primary_segments[0]} business directory`,
      `${strategy.company_name} ${strategy.industry} partnerships`,
      `contact information ${strategy.target_audience.primary_segments.join(' ')}`
    ];
    
    return fallbackQueries;
  }
  
  /**
   * Parse AI response with enhanced error handling
   */
  parseAIResponse(responseText) {
    let cleanText = null; // Define outside try block
    
    try {
      // Clean the response
      cleanText = responseText.trim();
      
      console.log('🔍 Raw Ollama response length:', cleanText.length);
      console.log('🔍 Raw response preview:', cleanText.substring(0, 200));
      
      // Remove markdown and explanatory text
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      cleanText = cleanText.replace(/.*?(?=\{)/s, ''); // Remove everything before first {
      
      // Find the complete JSON by matching braces
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = 0; i < cleanText.length; i++) {
        if (cleanText[i] === '{') braceCount++;
        else if (cleanText[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonEnd > 0) {
        cleanText = cleanText.substring(0, jsonEnd);
        console.log('🔧 Extracted complete JSON, length:', cleanText.length);
      }
      
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (parseError) {
        console.log(`⚠️ JSON parse error: ${parseError.message}, attempting to fix...`);
        // Fix common JSON issues
        let fixedText = cleanText
          .replace(/:\s*([^",\{\[\]\}]+)(\s*[,\}])/g, ': "$1"$2') // Quote unquoted values
          .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

        try {
          parsed = JSON.parse(fixedText);
          console.log('✅ Fixed and parsed JSON successfully');
        } catch (secondError) {
          console.error('❌ Could not fix JSON:', secondError.message);
          throw new Error(`JSON parsing failed: ${parseError.message}`);
        }
      }

      console.log('✅ AI response parsed successfully');
      console.log('📊 Parsed strategy company:', parsed.company_name);
      return parsed;
      
    } catch (error) {
      console.error('❌ JSON parsing failed:', error.message);
      console.log('❌ Cleaned text that failed to parse:', cleanText?.substring(0, 500) || 'No cleaned text available');
      
      // Try to fix common JSON issues
      if (cleanText && cleanText.includes('{')) {
        try {
          // Attempt to close unclosed objects/arrays
          let fixedText = cleanText;
          
          // Count open braces and brackets
          const openBraces = (fixedText.match(/\{/g) || []).length;
          const closeBraces = (fixedText.match(/\}/g) || []).length;
          const openBrackets = (fixedText.match(/\[/g) || []).length;
          const closeBrackets = (fixedText.match(/\]/g) || []).length;
          
          // Add missing closing brackets and braces
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedText += ']';
          }
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixedText += '}';
          }
          
          // Remove trailing commas
          fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
          
          console.log('🔧 Attempting to fix JSON...');
          const fixedParsed = JSON.parse(fixedText);
          console.log('✅ Fixed JSON parsed successfully!');
          
          // Ensure required structure exists for incomplete JSON
          if (!fixedParsed.target_audience) fixedParsed.target_audience = {};
          if (!fixedParsed.target_audience.search_keywords) {
            fixedParsed.target_audience.search_keywords = {
              primary_keywords: ['business', 'partnership'],
              industry_keywords: ['technology'],
              solution_keywords: ['service', 'solution'],
              technology_keywords: ['digital'],
              audience_keywords: ['professional']
            };
          }
          if (!fixedParsed.target_audience.primary_segments) {
            fixedParsed.target_audience.primary_segments = ['businesses', 'companies'];
          }
          
          return fixedParsed;
          
        } catch (fixError) {
          console.error('❌ JSON fix attempt failed:', fixError.message);
        }
      }
      
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * 生成完全基于真实数据的邮件内容 - 绝对没有占位符！
   */
  async generateOptimizedEmailContent(prospect, strategy, optimization, businessAnalysis, emailTemplateType = null, templateData = null) {
    console.log(`📧 为 ${prospect.company || prospect.name} 生成完全真实数据的邮件...`);
    console.log(`🔧 DEBUG: Entered generateOptimizedEmailContent for ${prospect.email}`);
    console.log(`🎨 DEBUG: Template type: ${emailTemplateType || 'auto-select'}, has templateData: ${!!templateData}`);

    // Initialize variables at the function level to avoid undefined errors
    let subject = '';
    let cleanedBody = '';
    let hasRealSenderData = false;
    let hasRealRecipientData = false;
    let hasRealServiceData = false;

    try {
      // ===== 严格验证所有必需的真实数据 =====
    
    // 1. 验证发送方信息 - 必须来自真实的业务分析
    if (!strategy.company_name && !businessAnalysis?.companyName) {
      throw new Error('❌ 缺少发送方公司名称，无法生成邮件');
    }
    if (!strategy.description && !businessAnalysis?.valueProposition) {
      throw new Error('❌ 缺少发送方业务描述，无法生成邮件');
    }
    
    const senderCompany = strategy.company_name || businessAnalysis.companyName;
    const senderName = businessAnalysis?.senderInfo?.senderName || `${senderCompany} Team` || 'Business Development Team';
    const senderWebsite = strategy.website || businessAnalysis.url;
    const senderService = strategy.description || businessAnalysis.valueProposition;
    const senderIndustry = strategy.industry || businessAnalysis.industry;
    const senderProducts = businessAnalysis?.mainProducts || strategy.target_audience?.search_keywords?.solution_keywords || [];
    const senderKeyFeatures = businessAnalysis?.keyFeatures || [];

    // Initialize these variables outside try-catch so they're accessible everywhere
    let subject = '';
    let cleanedBody = '';
    let htmlBody = '';
    
    // 2. 验证接收方信息 - 必须来自真实搜索结果
    if (!prospect.email) {
      throw new Error('❌ 缺少接收方邮箱地址，无法生成邮件');
    }
    
    const recipientName = prospect.name || this.extractNameFromEmail(prospect.email);
    const recipientCompany = prospect.company || this.extractCompanyFromEmail(prospect.email);
    const recipientEmail = prospect.email;
    const recipientRole = prospect.aiProfile?.estimatedRole || prospect.title;
    const recipientPainPoints = prospect.aiProfile?.painPoints || strategy.target_audience?.pain_points || [];
    const recipientIndustry = prospect.industry || strategy.industry;
    
    // 3. 验证营销策略信息 - 必须来自Ollama生成的策略
    const valueProposition = strategy.messaging_framework?.value_proposition || senderService;
    const keyMessages = strategy.messaging_framework?.key_messages || [];
    const campaignGoal = strategy.campaign_objectives?.primary_goal || 'business collaboration';
    
    console.log('✅ 所有真实数据验证通过:');
    console.log(`   🏢 发送方: ${senderCompany} (${senderIndustry})`);
    console.log(`   💼 接收方: ${recipientName} at ${recipientCompany}`);
    console.log(`   📧 邮箱: ${recipientEmail}`);
    console.log(`   🎯 目标: ${campaignGoal}`);
    console.log(`   💡 价值主张: ${valueProposition}`);
    
    // ===== 使用Ollama生成完全个性化的邮件 - 只用真实数据 =====

    // 🎯 USE TEMPLATE-SPECIFIC OLLAMA PROMPT if template is selected
    let emailPrompt;

    // Load the full template definition to get ollamaPrompt
    let fullTemplateDefinition = null;
    if (emailTemplateType) {
      try {
        const { EMAIL_TEMPLATES } = require('../data/emailTemplates');
        fullTemplateDefinition = EMAIL_TEMPLATES[emailTemplateType];
        console.log(`📚 Loaded template definition for ${emailTemplateType}:`, {
          hasOllamaPrompt: !!fullTemplateDefinition?.ollamaPrompt,
          hasStructure: !!fullTemplateDefinition?.structure,
          templateName: fullTemplateDefinition?.name
        });
      } catch (error) {
        console.log(`⚠️ Could not load template definition for ${emailTemplateType}:`, error.message);
      }
    }

    // Track if we're using a template-specific prompt (which outputs ONLY body content, no subject)
    let usingTemplatePrompt = false;

    if (fullTemplateDefinition && fullTemplateDefinition.ollamaPrompt) {
      console.log(`🎨 Using template-specific Ollama prompt for: ${emailTemplateType}`);
      usingTemplatePrompt = true;

      // 🔥 ENHANCED: Extract website analysis data for template prompts
      const websiteAnalysis = this.businessAnalysisData || {};
      const keyFeatures = websiteAnalysis.keyFeatures || [];
      const uniqueSellingPoints = websiteAnalysis.uniqueSellingPoints || [];
      const targetAudience = websiteAnalysis.targetAudience || '';

      // Build enhanced context for template
      const enhancedContext = `

=== YOUR COMPANY DETAILS (Use these specific features in your email) ===
What ${senderCompany} offers: ${senderService}
${keyFeatures.length > 0 ? `Key Features: ${keyFeatures.slice(0, 3).join(', ')}` : ''}
${uniqueSellingPoints.length > 0 ? `What Makes Us Unique: ${uniqueSellingPoints.slice(0, 2).join('; ')}` : ''}
${targetAudience ? `Who We Help: ${targetAudience}` : ''}
Value Proposition: ${valueProposition}

CRITICAL: Reference these SPECIFIC features and benefits when explaining how ${senderCompany} can help ${recipientCompany}. Don't be generic - use the actual Key Features and Unique Selling Points listed above.
`;

      // Use the template's custom prompt and replace placeholders
      emailPrompt = fullTemplateDefinition.ollamaPrompt
        .replace(/{senderName}/g, senderName || 'Team')
        .replace(/{companyName}/g, senderCompany)
        .replace(/{company}/g, recipientCompany)
        .replace(/{recipientName}/g, recipientName)
        .replace(/{name}/g, recipientName)
        .replace(/{service}/g, senderService)
        .replace(/{valueProposition}/g, valueProposition)
        + enhancedContext; // 🔥 ADD enhanced context to prompt

      console.log(`✨ Template prompt customized with ENHANCED website analysis data`);
      console.log(`   📊 Added ${keyFeatures.length} key features, ${uniqueSellingPoints.length} USPs`);
    } else {
      console.log(`📝 Using default Ollama email prompt`);

      // 🔥 ENHANCED: Extract more website analysis data for better context
      const websiteAnalysis = this.businessAnalysisData || {};
      const keyFeatures = websiteAnalysis.keyFeatures || [];
      const uniqueSellingPoints = websiteAnalysis.uniqueSellingPoints || [];
      const targetAudience = websiteAnalysis.targetAudience || '';
      const businessType = websiteAnalysis.businessType || senderIndustry;

      emailPrompt = `You are writing a highly personalized business email. Write ONLY the email content with natural, conversational language.

=== SENDER (WHO YOU ARE) ===
Company: ${senderCompany}
Industry: ${businessType || senderIndustry}
What you offer: ${senderService}
${senderProducts.length > 0 ? `Products/Services: ${senderProducts.join(', ')}` : ''}
Value Proposition: ${valueProposition}
${keyFeatures.length > 0 ? `Key Features: ${keyFeatures.slice(0, 3).join(', ')}` : ''}
${uniqueSellingPoints.length > 0 ? `What Makes Us Unique: ${uniqueSellingPoints.slice(0, 2).join('; ')}` : ''}
${targetAudience ? `Our Target Customers: ${targetAudience}` : ''}
Campaign Goal: ${campaignGoal}

=== RECIPIENT (WHO YOU'RE WRITING TO) ===
Name: ${recipientName}
${recipientRole ? `Role: ${recipientRole}` : ''}
${recipientCompany ? `Company: ${recipientCompany}` : ''}
${recipientIndustry ? `Industry: ${recipientIndustry}` : ''}

=== YOUR TASK ===
Write an email that demonstrates DEEP UNDERSTANDING of ${senderCompany}'s actual offerings (listed above) and shows HOW these specific features/benefits can help ${recipientCompany}. Use the KEY FEATURES and UNIQUE SELLING POINTS to make the email highly relevant and specific.

=== IMPORTANT WRITING RULES ===
✓ Start with a warm, personal greeting using ${recipientName}
✓ Open with WHY you're reaching out (be specific, not generic)
✓ Connect ${senderCompany}'s solution to ${recipientCompany}'s likely needs
✓ Focus on BENEFITS to ${recipientName}, not features
✓ Be conversational and authentic - write like a real person
✓ Keep it concise: 120-180 words maximum
✓ End with ONE clear, simple call-to-action
✓ Use proper paragraph spacing (blank lines between paragraphs)

✗ NEVER use placeholder text like [Company], [Name], or [INSERT]
✗ NEVER write generic phrases like "I hope this email finds you well"
✗ NEVER use bullet points or section headers
✗ NEVER include multiple signatures or closing lines
✗ NEVER write "Best regards" more than once
✗ NEVER include meta-commentary or instructions
✗ NEVER use markdown formatting (**, __, *, etc.)

=== EMAIL FORMAT ===
Subject: [Write ONE compelling, specific subject line referencing ${recipientCompany}]

Body: [Write a natural, flowing email with proper paragraphs]

Example structure:
Hello ${recipientName},

[Opening: Why you're reaching out - be specific and relevant]

[Middle: One key benefit that solves their problem]

[Closing: Simple call-to-action + signature]

Best regards,
${senderName || senderCompany}

NOW WRITE THE EMAIL:`;
    }

    try {
      console.log('🧠 使用Ollama生成完全真实数据的邮件...');
      const aiContent = await this.callOllama(emailPrompt, 'email', {
        temperature: 0.7,
        num_predict: 400,
        top_p: 0.9
      });
      
      if (!aiContent || aiContent.length < 50) {
        throw new Error('Ollama生成的邮件内容不足，请检查模型状态');
      }
      
      // 解析AI生成的内容 - 支持多种格式
      console.log(`   🔍 Raw Ollama response preview: ${aiContent.substring(0, 200)}...`);

      // 🎯 SPECIAL HANDLING: Template-specific prompts generate ONLY body content (no subject)
      let subjectMatch = null;
      let bodyMatch = null;

      if (usingTemplatePrompt) {
        console.log(`   🎨 Template-specific response: treating entire output as email body`);

        // The entire response is the email body
        // 🔥 STEP 1: Replace placeholders with actual values BEFORE cleaning
        let contentWithReplacements = aiContent
          .replace(/\[Company Name\]/gi, recipientCompany || 'your company')
          .replace(/\[Your Name\]/gi, senderName || 'the team')
          .replace(/\[Your Company\]/gi, senderCompany || 'our company')
          .replace(/\[Recipient Name\]/gi, recipientName || 'there')
          .replace(/\[INSERT[^\]]*\]/gi, '')  // Remove INSERT placeholders
          .replace(/\[WRITE[^\]]*\]/gi, '')   // Remove WRITE placeholders

        // STEP 2: Clean up markdown formatting
        const cleanedContent = contentWithReplacements
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .trim();

        bodyMatch = [null, cleanedContent];

        // Generate a subject line based on the template and recipient
        const templateName = fullTemplateDefinition.name || 'Partnership';
        subjectMatch = [null, `${templateName} Opportunity: ${senderCompany} × ${recipientCompany}`];

        console.log(`   ✅ Subject generated: ${subjectMatch[1]}`);
        console.log(`   ✅ Body extracted: ${cleanedContent.length} characters`);
      } else {
        // Try multiple subject line patterns
        subjectMatch = aiContent.match(/Subject:\s*(.+)/i) ||
                          aiContent.match(/\*\*Subject:\*\*\s*(.+)/i) ||
                          aiContent.match(/Subject Line:\s*(.+)/i) ||
                          aiContent.match(/Email Subject:\s*(.+)/i);

        // Try multiple body patterns
        bodyMatch = aiContent.match(/Body:\s*([\s\S]+)/i) ||
                       aiContent.match(/\*\*Body:\*\*\s*([\s\S]+)/i) ||
                       aiContent.match(/Email Body:\s*([\s\S]+)/i) ||
                       aiContent.match(/Content:\s*([\s\S]+)/i);
      }
      
      // Ultra-flexible parsing: Handle ANY Ollama output format
      if (!subjectMatch || !bodyMatch) {
        console.log('   🔧 启动超级灵活HTML解析器...');
        
        // Stage 1: Maximum content cleaning and normalization
        let cleanContent = aiContent
          // Remove all markdown artifacts
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/---+/g, '') // Remove horizontal rules
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1') // Triple asterisks to plain text
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold to plain text
          .replace(/\*([^*]+)\*/g, '$1') // Italic to plain text
          .replace(/__([^_]+)__/g, '$1') // Underline to plain text
          .replace(/_([^_]+)_/g, '$1') // Single underscore to plain text

          // 🔥 CRITICAL: Replace placeholders with actual values BEFORE removing them
          .replace(/\[Company Name\]/gi, recipientCompany || 'your company')
          .replace(/\[Your Name\]/gi, senderName || 'the team')
          .replace(/\[Your Company\]/gi, senderCompany || 'our company')
          .replace(/\[Recipient Name\]/gi, recipientName || 'there')
          .replace(/\[Sender Name\]/gi, senderName || 'our team')

          // Remove remaining placeholder patterns
          .replace(/\{\{[^}]*\}\}/g, '') // Handlebars {{}}
          .replace(/\[([A-Z_\s]+)\]/g, '') // [PLACEHOLDER]
          .replace(/\[Your[^\]]*\]/g, '') // Any remaining [Your...] placeholders
          .replace(/\[Company[^\]]*\]/g, '') // Any remaining [Company...] placeholders
          .replace(/\[Recipient[^\]]*\]/g, '') // [Recipient], etc.
          .replace(/\[INSERT[^\]]*\]/g, '') // [INSERT...]
          .replace(/\[WRITE[^\]]*\]/g, '') // [WRITE...]
          .replace(/\[write[^\]]*\]/g, '') // [write...]
          .replace(/\[Add[^\]]*\]/g, '') // [Add details]
          .replace(/\[Enter[^\]]*\]/g, '') // [Enter information]
          .replace(/\[Please[^\]]*\]/g, '') // [Please...]

          // Clean up extra whitespace and artifacts
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks to double
          .replace(/^\s*[\-\*\+]\s*/gm, '') // Remove list markers
          .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
          .replace(/^\s*>\s*/gm, '') // Remove quote markers
          .trim();
        
        // Stage 2: Intelligent content segmentation
        const lines = cleanContent.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && 
                 !trimmed.match(/^-+$/) && 
                 !trimmed.match(/^=+$/) && 
                 !trimmed.match(/^\*+$/);
        });
        
        // Stage 3: Ultra-flexible subject extraction
        if (!subjectMatch) {
          let extractedSubject = null;
          let subjectLineIndex = -1;

          // Method 1: Look for explicit subject indicators
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase().trim();
            if (lowerLine.includes('subject:') || lowerLine.includes('re:') || lowerLine.includes('title:')) {
              extractedSubject = line.replace(/^[^:]+:\s*/i, '').trim();
              if (extractedSubject.length > 5) {
                subjectLineIndex = i;
                break;
              }
            }
          }

          // 🔥 CRITICAL FIX: Remove subject line from lines array to prevent it appearing in body
          if (subjectLineIndex !== -1) {
            lines.splice(subjectLineIndex, 1);
            console.log(`   ✅ Removed subject line from body content (was at index ${subjectLineIndex})`);
          }
          
          // Method 2: Smart first line detection
          if (!extractedSubject && lines.length > 0) {
            const firstLine = lines[0].trim();
            const lowerFirst = firstLine.toLowerCase();
            
            // Good subject indicators: not a greeting, reasonable length, looks like a title
            if (!lowerFirst.startsWith('dear') && 
                !lowerFirst.startsWith('hi ') && 
                !lowerFirst.startsWith('hello') && 
                !lowerFirst.startsWith('greetings') &&
                firstLine.length >= 10 && firstLine.length <= 100 &&
                !firstLine.includes('I hope') && !firstLine.includes('I am')) {
              extractedSubject = firstLine;
            }
          }
          
          // Method 3: Content-based subject generation
          if (!extractedSubject || extractedSubject.length < 5) {
            const contentKeywords = [];
            
            // Extract key business terms from content
            const businessTerms = [
              'partnership', 'collaboration', 'opportunity', 'proposal', 'offer',
              'solution', 'service', 'product', 'platform', 'technology',
              'meeting', 'discussion', 'call', 'demo', 'presentation'
            ];
            
            for (const term of businessTerms) {
              if (cleanContent.toLowerCase().includes(term)) {
                contentKeywords.push(term);
              }
            }
            
            if (contentKeywords.length > 0) {
              const primaryKeyword = contentKeywords[0];
              extractedSubject = `${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Opportunity with ${recipientCompany}`;
            } else {
              extractedSubject = `Business Opportunity with ${recipientCompany}`;
            }
          }
          
          subjectMatch = [null, extractedSubject];
          console.log(`   📧 智能主题提取: ${extractedSubject}`);
        }
        
        // Stage 4: Ultra-flexible body extraction and HTML-ready formatting
        if (!bodyMatch) {
          let bodyContent = '';
          let bodyStartIndex = 0;
          
          // Method 1: Find greeting patterns (multiple languages and styles)
          const greetingPatterns = [
            /^(dear|hi|hello|greetings?|good\s+(morning|afternoon|evening))\s+/i,
            /^(您好|亲爱的|尊敬的)/i, // Chinese
            /^(hola|buenos|estimado)/i, // Spanish
            /^(bonjour|cher|chère)/i, // French
            /^(guten|lieber|sehr geehrte)/i, // German
          ];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (greetingPatterns.some(pattern => pattern.test(line))) {
              bodyStartIndex = i;
              break;
            }
          }
          
          // Method 2: If no greeting found, look for content indicators
          if (bodyStartIndex === 0) {
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim().toLowerCase();
              if (line.includes('hope') || line.includes('writing') || line.includes('reaching') || 
                  line.includes('contact') || line.includes('interested') || line.includes('propose')) {
                bodyStartIndex = i;
                break;
              }
            }
          }
          
          // Method 3: Extract and format body content
          if (bodyStartIndex < lines.length) {
            const bodyLines = lines.slice(bodyStartIndex);
            
            // Smart paragraph detection and HTML formatting
            const paragraphs = [];
            let currentParagraph = [];
            
            for (const line of bodyLines) {
              const trimmedLine = line.trim();
              
              if (trimmedLine.length === 0) {
                // Empty line - end current paragraph
                if (currentParagraph.length > 0) {
                  paragraphs.push(currentParagraph.join(' '));
                  currentParagraph = [];
                }
              } else {
                currentParagraph.push(trimmedLine);
              }
            }
            
            // Add final paragraph
            if (currentParagraph.length > 0) {
              paragraphs.push(currentParagraph.join(' '));
            }
            
            // Join paragraphs with HTML line breaks for better email formatting
            bodyContent = paragraphs.filter(p => p.trim().length > 0).join('\n\n');
            
          } else {
            // Fallback: Use all content with smart paragraph breaks
            bodyContent = cleanContent;
          }
          
          // Method 4: Ensure minimum body content quality
          if (bodyContent.length < 50) {
            bodyContent = `Dear ${recipientName || 'Valued Partner'},

I hope this message finds you well. I'm reaching out regarding a potential business opportunity that could benefit ${recipientCompany || 'your organization'}.

${cleanContent.length > 20 ? cleanContent : `Our team at ${senderCompany} specializes in ${senderService || 'innovative solutions'} and we believe there could be significant synergy between our organizations.`}

I would welcome the opportunity to discuss this further at your convenience.

Best regards,
${senderName || 'Business Development Team'}
${senderCompany}`;
            console.log('   🛠️ 使用增强备用模板');
          }
          
          bodyMatch = [null, bodyContent];
          console.log(`   📝 智能正文提取 (${bodyContent.length} 字符)`);
        }
      }
      
      if (!subjectMatch || !bodyMatch) {
        throw new Error('Ollama未能正确生成邮件格式 - 无法提取主题和正文');
      }

      subject = subjectMatch[1].trim();
      let body = bodyMatch[1].trim();

      // 🧹 COMPREHENSIVE MARKDOWN CLEANUP - Remove ALL markdown formatting from Ollama output
      console.log('   🧹 Cleaning markdown formatting from Ollama output...');

      // Clean subject line
      subject = subject
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')  // Remove triple asterisks ***text***
        .replace(/\*\*([^*]+)\*\*/g, '$1')      // Remove bold **text**
        .replace(/\*([^*]+)\*/g, '$1')          // Remove italic *text*
        .replace(/__([^_]+)__/g, '$1')          // Remove underline __text__
        .replace(/_([^_]+)_/g, '$1')            // Remove single underscore _text_
        .replace(/`([^`]+)`/g, '$1')            // Remove inline code `text`
        .replace(/~~([^~]+)~~/g, '$1')          // Remove strikethrough ~~text~~
        .trim();

      // Clean body text
      body = body
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')  // Remove triple asterisks ***text***
        .replace(/\*\*([^*]+)\*\*/g, '$1')      // Remove bold **text**
        .replace(/\*([^*]+)\*/g, '$1')          // Remove italic *text*
        .replace(/__([^_]+)__/g, '$1')          // Remove underline __text__
        .replace(/_([^_]+)_/g, '$1')            // Remove single underscore _text_
        .replace(/`([^`]+)`/g, '$1')            // Remove inline code `text`
        .replace(/~~([^~]+)~~/g, '$1')          // Remove strikethrough ~~text~~
        .replace(/^#+\s+/gm, '')                // Remove markdown headers # ## ###
        .replace(/^\s*[-*+]\s+/gm, '')          // Remove list markers - * +
        .replace(/^\s*\d+\.\s+/gm, '')          // Remove numbered lists 1. 2. 3.
        .replace(/^\s*>\s+/gm, '')              // Remove blockquotes >
        .replace(/```[\s\S]*?```/g, '')         // Remove code blocks ```code```
        .replace(/---+/g, '')                   // Remove horizontal rules ---
        .replace(/^(Subject|Re|Title):\s*.+$/mi, '') // 🔥 Remove any Subject:/Re:/Title: lines from body
        .replace(/^(Body|Email Body|Content):\s*/mi, '') // 🔥 Remove Body:/Email Body:/Content: prefixes
        .trim();

      console.log(`   ✅ Markdown cleaned - Subject: ${subject.length} chars, Body: ${body.length} chars`);

      // 验证生成的内容，但允许缺少某些数据（宽松验证）
      hasRealSenderData = body.includes(senderCompany);
      hasRealRecipientData = body.includes(recipientName) || body.includes(recipientCompany);
      hasRealServiceData = body.includes(senderService) || (senderProducts.length > 0 && senderProducts.some(p => body.includes(p)));
      
      // 只要不是完全空白或只有具体占位符，就接受邮件
      const hasPlaceholders = body.includes('{{') || body.includes('[INSERT') || body.includes('[PLACEHOLDER') || body.includes('[YOUR_') || body.includes('[Recipient') || body.includes('[Company') || subject.includes('{{') || subject.includes('[INSERT') || subject.includes('[PLACEHOLDER') || subject.includes('[YOUR_') || subject.includes('[write a compelling') || subject.includes('[Recipient');
      const isBlank = body.trim().length < 50;
      
      if (isBlank) {
        throw new Error('生成的邮件内容过短或为空');
      }
      
      if (hasPlaceholders) {
        console.log('   🔧 检测到占位符，正在智能替换...');
        
        // 智能替换主题中的占位符
        subject = subject
          .replace(/\[write.*?\]/gi, `Partnership Opportunity with ${recipientCompany}`)
          .replace(/\[.*?subject.*?\]/gi, `Exciting Partnership with ${recipientCompany}`)
          .replace(/\[INSERT.*?\]/gi, `${senderCompany} - ${recipientCompany} Partnership`)
          .replace(/\[PLACEHOLDER.*?\]/gi, `Business Opportunity`)
          .replace(/\[YOUR.*?\]/gi, senderCompany)
          .replace(/\[Recipient.*?\]/gi, recipientCompany)
          .replace(/\[Company.*?\]/gi, recipientCompany)
          .replace(/\{\{.*?\}\}/g, recipientCompany)
          .replace(/\[.*?\]/g, '') // 移除其他未匹配的占位符
          .trim();
        
        // 如果主题仍然为空或太短，使用简单主题生成
        if (!subject || subject.length < 5) {
          // DO NOT use PersonalizedEmailGenerator - it's corrupted!
          subject = `Partnership Opportunity with ${recipientCompany}`;
        }
        
        // 智能替换正文中的占位符
        body = body
          .replace(/\[write.*?\]/gi, `We believe there's a great opportunity for collaboration`)
          .replace(/\[INSERT.*?\]/gi, `our innovative ${senderService}`)
          .replace(/\[PLACEHOLDER.*?\]/gi, `partnership opportunity`)
          .replace(/\[YOUR_NAME.*?\]/gi, senderName)
          .replace(/\[YOUR_COMPANY.*?\]/gi, senderCompany)
          .replace(/\[YOUR.*?\]/gi, senderCompany)
          .replace(/\[Recipient.*?\]/gi, recipientName || recipientCompany)
          .replace(/\[Company.*?\]/gi, recipientCompany)
          .replace(/\{\{company\}\}/gi, recipientCompany)
          .replace(/\{\{name\}\}/gi, recipientName || 'Team')
          .replace(/\{\{product\}\}/gi, senderService)
          .replace(/\{\{.*?\}\}/g, '') // 移除其他未匹配的占位符
          .replace(/\[.*?\]/g, '') // 移除其他未匹配的占位符
          .trim();
        
        // 修复错误的签名 - 确保使用发送方名称而不是接收方名称
        const wrongSignaturePattern = new RegExp(`Best regards,?\\s*\\n?\\s*${recipientCompany}`, 'gi');
        const correctSignature = `Best regards,\n${senderName || senderCompany}`;
        body = body.replace(wrongSignaturePattern, correctSignature);
        
        // 确保邮件总是以正确的签名结尾
        if (!body.includes('Best regards')) {
          body += `\n\nBest regards,\n${senderName || senderCompany}`;
        } else if (body.includes('Best regards') && !body.includes(senderName) && !body.includes(senderCompany)) {
          // 如果有签名但没有发送方名称，修复它
          body = body.replace(/Best regards,?\s*$/gi, `Best regards,\n${senderName || senderCompany}`);
        }
        
        console.log('   ✅ 占位符已成功替换');
      }
      
      // 记录数据完整性但不阻止邮件发送
      console.log(`   📊 数据完整性检查:`);
      console.log(`      发送方数据: ${hasRealSenderData ? '✅' : '⚠️'} ${hasRealSenderData ? '' : '(将跳过相关内容)'}`);
      console.log(`      接收方数据: ${hasRealRecipientData ? '✅' : '⚠️'} ${hasRealRecipientData ? '' : '(将使用通用称呼)'}`);
      console.log(`      服务数据: ${hasRealServiceData ? '✅' : '⚠️'} ${hasRealServiceData ? '' : '(将使用通用描述)'}`);
      console.log(`   ✅ 邮件通过基础验证，可以发送`);
      
      // Final cleanup to ensure no remnant placeholders and markdown
      cleanedBody = body
        .replace(/\[.*?\]/g, '') // Remove ALL bracketed content
        .replace(/\{\{.*?\}\}/g, '') // Remove ALL template variables
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')  // Remove triple asterisks ***text***
        .replace(/\*\*([^*]+)\*\*/g, '$1')      // Remove bold **text**
        .replace(/\*([^*]+)\*/g, '$1')          // Remove italic *text*
        .replace(/__([^_]+)__/g, '$1')          // Remove underline __text__
        .replace(/_([^_]+)_/g, '$1')            // Remove single underscore _text_
        .replace(/`([^`]+)`/g, '$1')            // Remove inline code `text`
        .replace(/~~([^~]+)~~/g, '$1')          // Remove strikethrough ~~text~~
        .trim();

      // 🔥 FIX MALFORMED GREETINGS: "Dear ," -> proper greeting
      cleanedBody = cleanedBody
        .replace(/^(Dear|Hello|Hi)\s*,\s*/mi, `Hello ${recipientName || recipientCompany || 'there'},\n\n`) // Fix "Dear ," at start
        .replace(/\n(Dear|Hello|Hi)\s*,\s*/gi, `\n\nHello ${recipientName || recipientCompany || 'there'},\n\n`) // Fix in middle
        .replace(/^(Dear|Hello|Hi)\s+$/mi, `Hello ${recipientName || recipientCompany || 'there'},\n\n`) // Fix "Dear" alone
        .trim();

      // 🔥 REMOVE DUPLICATE "Best regards" SIGNATURES
      // Count how many times "Best regards" appears
      const bestRegardsMatches = cleanedBody.match(/(Best regards|Sincerely|Kind regards|Warm regards|Regards)/gi);
      if (bestRegardsMatches && bestRegardsMatches.length > 1) {
        console.log(`   🔧 Found ${bestRegardsMatches.length} signatures, removing duplicates...`);

        // Remove all signatures except the last one
        const lines = cleanedBody.split('\n');
        const lastSignatureIndex = cleanedBody.lastIndexOf('Best regards');

        // Keep content before last signature, remove earlier signatures
        const beforeLastSignature = cleanedBody.substring(0, lastSignatureIndex);
        const afterAndIncludingLast = cleanedBody.substring(lastSignatureIndex);

        // Remove any earlier signatures from the first part
        const cleanedBefore = beforeLastSignature
          .replace(/(Best regards|Sincerely|Kind regards|Warm regards|Regards)[,\s]*\n?.*?(Partnership Development Team|Team|FruitAI.*?|Fruitai.*?)?\n*/gi, '')
          .replace(/\n{3,}/g, '\n\n'); // Remove excessive blank lines

        cleanedBody = (cleanedBefore + '\n\n' + afterAndIncludingLast).trim();
      }

      // 确保ALL邮件都有正确的签名（不管是否有占位符）
      const wrongSignaturePattern = new RegExp(`Best regards,?\\s*\\n?\\s*${recipientCompany}`, 'gi');
      const correctSignature = `Best regards,\n${senderName || senderCompany}`;
      cleanedBody = cleanedBody.replace(wrongSignaturePattern, correctSignature);

      // 如果没有签名，添加一个
      if (!cleanedBody.includes('Best regards')) {
        cleanedBody += `\n\nBest regards,\n${senderName || senderCompany}`;
      } else if (cleanedBody.includes('Best regards') && !cleanedBody.includes(senderName) && !cleanedBody.includes(senderCompany)) {
        // 修复现有但不正确的签名 - 处理各种格式
        cleanedBody = cleanedBody.replace(/Best regards,?\s*$/gi, `Best regards,\n${senderName || senderCompany}`);
        cleanedBody = cleanedBody.replace(/Best regards,?\s*\n\s*$/gi, `Best regards,\n${senderName || senderCompany}`);
        cleanedBody = cleanedBody.replace(/Best regards,?\s*\n.*$/gi, `Best regards,\n${senderName || senderCompany}`);
        // 处理悬挂的 "Best regards," 后面没有名字的情况
        cleanedBody = cleanedBody.replace(/Best regards,\s*$/gi, `Best regards,\n${senderName || senderCompany}`);
      }

      // 🔥 FINAL CLEANUP: Remove "Partnership Development Team" duplicates and other generic signatures
      cleanedBody = cleanedBody
        .replace(/Partnership Development Team\s*$/gi, '')
        .replace(/\n{3,}/g, '\n\n') // Clean up excessive blank lines
        .trim();
      
      // Convert text to HTML format with proper structure
      htmlBody = cleanedBody
        .split(/\n\n+/) // Split on multiple line breaks
        .filter(para => para.trim().length > 0) // Remove empty paragraphs
        .map(para => {
          // Convert single line breaks within paragraphs to <br>
          const formatted = para.replace(/\n/g, '<br>');
          return `<p style="margin: 12px 0; line-height: 1.6;">${formatted}</p>`;
        })
        .join('\n');
        
    } catch (ollamaError) {
      console.error('❌ Ollama email generation failed:', ollamaError.message);
      // Use fallback subject and body content
      subject = subject || `Partnership Opportunity with ${recipientCompany || 'Your Company'}`;
      cleanedBody = `Dear ${recipientName || recipientCompany},

I hope this message finds you well. I am reaching out to discuss a potential partnership opportunity with ${senderCompany}.

We specialize in ${senderService} and believe there could be significant value in collaborating with your team at ${recipientCompany}.

I would welcome the opportunity to discuss this further at your convenience.

Best regards,
${senderName || senderCompany}`;
    }
      
      // 🎨 USE USER-SELECTED TEMPLATE
      // DO NOT require StructuredEmailGenerator - it's corrupted!

      // Use user-selected template if provided
      let selectedTemplate;
      if (emailTemplateType && emailTemplateType !== 'auto-select' && emailTemplateType !== 'user_template') {
        // User selected a specific template from the popup
        selectedTemplate = emailTemplateType;
        console.log(`🎯 Using USER-SELECTED template: ${selectedTemplate}`);
      } else if (templateData && templateData.templateId && templateData.templateId !== 'user_template') {
        // Template data contains the selected template ID
        selectedTemplate = templateData.templateId;
        console.log(`🎯 Using template from templateData: ${selectedTemplate}`);
      } else {
        // Simple fallback without requiring corrupted services
        selectedTemplate = 'professional_modern';
        console.log(`🔄 Using default template: ${selectedTemplate}`);
      }
      
      // 🎯 EXTRACT USER CUSTOMIZATIONS from templateData
      const userCustomizations = templateData?.customizations || {};
      const userSubject = templateData?.subject || null;
      const userGreeting = templateData?.greeting || null;
      const userSignature = templateData?.signature || null;

      console.log(`🎨 User customizations found:`, {
        hasSubject: !!userSubject,
        hasGreeting: !!userGreeting,
        hasSignature: !!userSignature,
        hasCustomizations: !!userCustomizations && Object.keys(userCustomizations).length > 0,
        customizationKeys: userCustomizations ? Object.keys(userCustomizations) : []
      });

      // Transform the plain text content into structured sections for the template
      // 🔥 USE USER CUSTOMIZATIONS IF PROVIDED
      const structuredSections = {
        companyName: senderCompany,
        headline: userCustomizations.headerTitle || userCustomizations.mainHeading || (typeof subject !== 'undefined' ? subject : null) || 'Partnership Opportunity',
        description: cleanedBody.substring(0, 200),
        mainContent: cleanedBody,
        ctaText: userCustomizations.buttonText || userCustomizations.ctaText || 'Learn More',
        ctaUrl: userCustomizations.buttonUrl || userCustomizations.ctaUrl || 'https://fruitai.org',  // ✅ Support both buttonUrl and ctaUrl
        senderName: senderName || `${senderCompany} Team`,
        senderTitle: 'Business Development',
        recipientName: recipientName || 'Partner',
        recipientCompany: recipientCompany || 'Your Company',
        features: userCustomizations.features || ['AI-Powered', 'Seamless Integration', 'Expert Support', 'Proven Results'],
        primaryColor: userCustomizations.primaryColor || null,
        accentColor: userCustomizations.accentColor || null,
        textColor: userCustomizations.textColor || null,  // ✅ Add text color customization
        logo: userCustomizations.logo || null,  // ✅ Add logo customization
        greeting: userGreeting || `Hi ${recipientName || 'there'},`,
        signature: userSignature || `Best regards,\n${senderName}\n${senderCompany}`
      };

      // 🎯 REPLACE PLACEHOLDERS in greeting and signature with actual values
      if (structuredSections.greeting) {
        structuredSections.greeting = structuredSections.greeting
          .replace(/{name}/g, recipientName || 'there')
          .replace(/{company}/g, recipientCompany || 'your company')
          .replace(/{senderName}/g, senderName || 'Team')
          .replace(/{senderCompany}/g, senderCompany || 'Our Company');
      }
      if (structuredSections.signature) {
        structuredSections.signature = structuredSections.signature
          .replace(/{name}/g, recipientName || 'there')
          .replace(/{company}/g, recipientCompany || 'your company')
          .replace(/{senderName}/g, senderName || 'Team')
          .replace(/{senderCompany}/g, senderCompany || 'Our Company');
      }

      console.log(`✨ Using structured sections with user customizations:`, {
        ctaText: structuredSections.ctaText,
        features: structuredSections.features,
        hasCustomColors: !!(structuredSections.primaryColor || structuredSections.accentColor),
        greeting: structuredSections.greeting.substring(0, 30) + '...',
        signature: structuredSections.signature.substring(0, 30) + '...'
      });
      
      // Generate HTML with template-specific styling based on user selection
      let finalHtmlBody;
      try {
        console.log(`🎨 User selected template: ${selectedTemplate} (using template's actual HTML structure...)`);

        // 🎯 PRIORITIZE USER'S EDITED HTML over default template HTML
        let templateHtml = null;

        // First, check if user sent edited HTML (from template customization)
        if (templateData && templateData.html) {
          templateHtml = templateData.html;
          console.log(`✅ Using USER'S EDITED template HTML for ${selectedTemplate} (${templateHtml.length} chars)`);
        }
        // Otherwise, load default template HTML from emailTemplates.js
        else if (fullTemplateDefinition && fullTemplateDefinition.html) {
          templateHtml = fullTemplateDefinition.html;
          console.log(`✅ Using DEFAULT template HTML for ${selectedTemplate} (${templateHtml.length} chars)`);
        } else {
          console.log(`⚠️ Template HTML not found for ${selectedTemplate}, using fallback`);
        }

        // Define template-specific color schemes and styles
        const templateStyles = {
          professional_partnership: { primary: '#10b981', secondary: '#047857', name: 'Professional Partnership' },
          modern_tech: { primary: '#3b82f6', secondary: '#1e40af', name: 'Modern Tech' },
          executive_outreach: { primary: '#7c3aed', secondary: '#5b21b6', name: 'Executive Outreach' },
          product_launch: { primary: '#f59e0b', secondary: '#d97706', name: 'Product Launch' },
          consultative_sales: { primary: '#059669', secondary: '#047857', name: 'Consultative Sales' },
          event_invitation: { primary: '#dc2626', secondary: '#991b1b', name: 'Event Invitation' }
        };

        const style = templateStyles[selectedTemplate] || templateStyles.professional_partnership;

        // 🎨 OVERRIDE COLORS WITH USER CUSTOMIZATIONS IF PROVIDED
        // BUT: Only use user color if it's different from default gray (#6b7280)
        const userPrimaryColor = structuredSections.primaryColor;
        const userSecondaryColor = structuredSections.accentColor;

        const finalPrimaryColor = (userPrimaryColor && userPrimaryColor !== '#6b7280') ? userPrimaryColor : style.primary;
        const finalSecondaryColor = (userSecondaryColor && userSecondaryColor !== '#047857') ? userSecondaryColor : style.secondary;

        console.log(`🎨 Color selection:`, {
          templateDefault: { primary: style.primary, secondary: style.secondary },
          userCustom: { primary: userPrimaryColor, secondary: userSecondaryColor },
          final: { primary: finalPrimaryColor, secondary: finalSecondaryColor }
        });

        // 🎯 USE TEMPLATE HTML if available, otherwise use fallback
        if (templateHtml) {
          console.log(`🎨 Using template's actual HTML structure`);

          // 🎯 PROPERLY FORMAT EMAIL BODY INTO PARAGRAPHS
          let emailBodyText = htmlBody || cleanedBody;

          console.log(`🔍 DEBUG: Email body text length: ${emailBodyText.length} chars`);
          console.log(`🔍 DEBUG: Email body preview: ${emailBodyText.substring(0, 150)}...`);
          console.log(`🔍 DEBUG: htmlBody exists: ${!!htmlBody}, cleanedBody exists: ${!!cleanedBody}`);

          // Split into sentences and group into paragraphs (3-4 sentences per paragraph)
          const sentences = emailBodyText
            .split(/(?<=[.!?])\s+/)  // Split on sentence boundaries
            .filter(s => s.trim().length > 10); // Filter out very short fragments

          console.log(`🔍 DEBUG: Split into ${sentences.length} sentences`);

          // Group sentences into paragraphs (3-4 sentences each)
          const contentParagraphs = [];
          for (let i = 0; i < sentences.length; i += 3) {
            const paragraph = sentences.slice(i, i + 3).join(' ').trim();
            if (paragraph) {
              // Wrap each paragraph in proper HTML with spacing
              contentParagraphs.push(`<p style="margin:0 0 16px 0;line-height:1.6;">${paragraph}</p>`);
            }
          }

          console.log(`📝 Formatted email into ${contentParagraphs.length} paragraphs`);
          console.log(`🔍 DEBUG: First paragraph preview: ${contentParagraphs[0] ? contentParagraphs[0].substring(0, 100) : 'EMPTY'}...`);

          // 🎯 GET COMPANY LOGO from business analysis or customizations
          // Priority: 1) User uploaded logo, 2) Web-scraped logo, 3) Placeholder
          let companyLogo = userCustomizations.logo ||  // User's uploaded/entered logo URL
                           structuredSections.logo ||    // Logo from structured sections
                           businessAnalysis?.companyInfo?.logo ||  // Scraped logo from web analysis
                           businessAnalysis?.company_logo ||       // Alternative location
                           `https://via.placeholder.com/180x60/${finalPrimaryColor.replace('#', '')}/ffffff?text=${encodeURIComponent(senderCompany)}`;

          console.log(`🖼️ Company logo source:`,
            userCustomizations.logo ? 'User uploaded' :
            (businessAnalysis?.companyInfo?.logo || businessAnalysis?.company_logo) ? 'Web scraped' :
            'Placeholder');
          console.log(`🖼️ Company logo URL:`, companyLogo);

          // 🔍 DEBUG: Check if template has content placeholders
          const hasContentPlaceholders = templateHtml.includes('[GENERATED CONTENT');
          console.log(`🔍 DEBUG: Template has content placeholders: ${hasContentPlaceholders}`);

          if (!hasContentPlaceholders) {
            console.log(`⚠️ WARNING: Template doesn't have [GENERATED CONTENT] placeholders!`);
            console.log(`🔧 SOLUTION: Will replace entire email body section dynamically`);

            // Strategy: Find and replace the main content area between header and footer
            // Look for common patterns like paragraphs, divs with certain IDs/classes
            const bodyContentHtml = contentParagraphs.join('\n');

            // Try to find the main content section and replace it
            // Pattern 1: Look for existing paragraph content
            if (templateHtml.match(/<p[^>]*>[\s\S]*?<\/p>/)) {
              console.log(`🔧 Found <p> tags - replacing paragraph content`);
              let replacedCount = 0;
              finalHtmlBody = templateHtml.replace(/(<p[^>]*>)[\s\S]*?(<\/p>)/g, (match, opening, closing) => {
                // Skip styling paragraphs (margin:0, etc.)
                if (match.includes('margin:0') || match.includes('font-size:') || replacedCount >= contentParagraphs.length) {
                  return match;
                }
                return contentParagraphs[replacedCount++] || match;
              });
              console.log(`🔧 Replaced ${replacedCount} paragraphs with dynamic content`);
            } else {
              console.log(`🔧 No <p> tags found - inserting content directly`);
              finalHtmlBody = templateHtml + bodyContentHtml;
            }
          } else {
            // Replace template placeholders with actual content
            finalHtmlBody = templateHtml
              // Replace placeholder content with FORMATTED paragraphs
              .replace(/\[GENERATED CONTENT 1:[^\]]+\]/g, contentParagraphs[0] || '')
              .replace(/\[GENERATED CONTENT 2:[^\]]+\]/g, contentParagraphs[1] || '')
              .replace(/\[GENERATED CONTENT 3:[^\]]+\]/g, contentParagraphs[2] || '');
          }

          // Apply common replacements to finalHtmlBody (works for both paths)
          finalHtmlBody = finalHtmlBody
            // Replace variable placeholders with ACTUAL data
            .replace(/{name}/g, recipientName || 'there')
            .replace(/{company}/g, recipientCompany || 'your company')
            .replace(/{senderName}/g, senderName)
            .replace(/{companyName}/g, senderCompany)
            // 🖼️ Replace logo placeholders with actual company logo
            .replace(/https:\/\/via\.placeholder\.com\/180x60\/[^"]+/g, companyLogo)
            .replace(/COMPANY\+LOGO/g, encodeURIComponent(senderCompany))
            // 🎯 Replace button text with user's custom text
            .replace(/Schedule Your Free Demo/g, structuredSections.ctaText)
            .replace(/Learn More/g, structuredSections.ctaText)
            .replace(/Get Started/g, structuredSections.ctaText)
            .replace(/Schedule Partnership Discussion/g, structuredSections.ctaText)
            // 🔗 Replace button URLs with user's custom URL
            .replace(/https:\/\/calendly\.com\/meeting/g, structuredSections.ctaUrl)
            .replace(/https:\/\/fruitai\.org/g, structuredSections.ctaUrl)
            // Apply user's CUSTOM colors from customizations
            .replace(/#28a745/gi, finalPrimaryColor)  // Replace template green
            .replace(/#10b981/gi, finalPrimaryColor)
            .replace(/#3b82f6/gi, finalPrimaryColor)  // Replace blue
            .replace(/#f59e0b/gi, finalPrimaryColor)  // Replace orange
            .replace(/#7c3aed/gi, finalPrimaryColor)  // Replace purple
            .replace(/#dc2626/gi, finalPrimaryColor)  // Replace red
            .replace(/#059669/gi, finalPrimaryColor)  // Replace teal
            .replace(/#343a40/gi, finalPrimaryColor)  // Replace dark gray (Modern Tech header)
            .replace(/#047857/gi, finalSecondaryColor)
            .replace(/#1e40af/gi, finalSecondaryColor)
            .replace(/#d97706/gi, finalSecondaryColor)
            .replace(/#5b21b6/gi, finalSecondaryColor)
            .replace(/#991b1b/gi, finalSecondaryColor);

          // 🎨 APPLY USER'S CUSTOM TEXT COLOR if provided
          const customTextColor = structuredSections.textColor || userCustomizations.textColor;
          if (customTextColor && customTextColor !== '#000000') {
            console.log(`🎨 Applying custom text color: ${customTextColor}`);
            // Replace common text colors in template
            finalHtmlBody = finalHtmlBody
              .replace(/color:\s*#343a40/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#495057/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#212529/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#000000/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#666666/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#555555/gi, `color: ${customTextColor}`)
              .replace(/color:\s*#333333/gi, `color: ${customTextColor}`)
              .replace(/color:\s*black/gi, `color: ${customTextColor}`);
          }

          // 🎯 APPLY USER'S GREETING AND SIGNATURE
          // Replace the greeting section with user's custom greeting
          if (structuredSections.greeting) {
            // Find and replace greeting patterns in template
            finalHtmlBody = finalHtmlBody.replace(
              /Hello \{name\}!|Hi \{name\},?/gi,
              structuredSections.greeting
            );
          }

          // Add user's custom signature at the end (before footer)
          if (structuredSections.signature) {
            const signatureParts = structuredSections.signature.split('\n');
            const signatureHtml = `
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;">
                ${signatureParts.map((line, idx) =>
                  `<p style="margin:${idx === 0 ? '0 0 5px 0' : '2px 0'};${idx === 0 ? 'font-weight:600;' : ''}">${line}</p>`
                ).join('')}
              </div>
            `;
            // Insert before the closing </div> of main content
            finalHtmlBody = finalHtmlBody.replace(/(\s*<\/div>\s*<\/div>\s*$)/i, signatureHtml + '$1');
          }

          // 🎨 APPLY ALL OTHER CUSTOMIZATIONS
          const customizations = userCustomizations || {};

          // 🎯 REPLACE FEATURE GRID - comprehensive for all templates
          if (customizations.features && Array.isArray(customizations.features) && customizations.features.length >= 4) {
            console.log(`🎨 Replacing feature grid with custom features: ${customizations.features.join(', ')}`);
            // Modern Tech 2-column grid -> expand to match user's 4-item grid
            const featureGridPattern = /<div id="component-feature-grid"[^>]*>[\s\S]*?<\/div>\s*<\/div>/;
            if (finalHtmlBody.match(featureGridPattern)) {
              const newFeatureGrid = `
              <div id="component-feature-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 35px 0; padding: 25px; background: ${finalPrimaryColor}; border-radius: 12px; color: white;">
                <div style="text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">$</div>
                  <h3 style="margin: 0 0 8px; font-size: 16px;">${customizations.features[0]}</h3>
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Automate repetitive processes</p>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
                  <h3 style="margin: 0 0 8px; font-size: 16px;">${customizations.features[1]}</h3>
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Real-time insights and reporting</p>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">✓</div>
                  <h3 style="margin: 0 0 8px; font-size: 16px;">${customizations.features[2]}</h3>
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Meet all industry standards</p>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 10px;">24/7</div>
                  <h3 style="margin: 0 0 8px; font-size: 16px;">${customizations.features[3]}</h3>
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Round-the-clock assistance</p>
                </div>
              </div>`;
              finalHtmlBody = finalHtmlBody.replace(featureGridPattern, newFeatureGrid);
              console.log(`✅ Replaced feature grid component with 4-item custom grid`);
            }
          }

          // Apply button text (covers all templates)
          if (customizations.buttonText) {
            finalHtmlBody = finalHtmlBody.replace(/Schedule Partnership Discussion/gi, customizations.buttonText);
            finalHtmlBody = finalHtmlBody.replace(/Schedule Your Free Demo/gi, customizations.buttonText);
            finalHtmlBody = finalHtmlBody.replace(/Explore the Platform/gi, customizations.buttonText);
            finalHtmlBody = finalHtmlBody.replace(/Learn More/gi, customizations.buttonText);
            finalHtmlBody = finalHtmlBody.replace(/Get Started/gi, customizations.buttonText);
            finalHtmlBody = finalHtmlBody.replace(/View Solutions/gi, customizations.buttonText);
            console.log(`🎨 Applied button text: ${customizations.buttonText}`);
          }

          // Apply button URL
          if (customizations.buttonUrl) {
            finalHtmlBody = finalHtmlBody.replace(/href="https:\/\/calendly\.com\/partnership"/gi, `href="${customizations.buttonUrl}"`);
            finalHtmlBody = finalHtmlBody.replace(/href="https:\/\/calendly\.com\/meeting"/gi, `href="${customizations.buttonUrl}"`);
            console.log(`🎨 Applied button URL: ${customizations.buttonUrl}`);
          }

          // Apply header title (comprehensive - covers ALL 6 templates)
          if (customizations.headerTitle) {
            // Professional Partnership template
            finalHtmlBody = finalHtmlBody.replace(/Building Strategic Partnerships/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Partnership Opportunity/gi, customizations.headerTitle);
            // Modern Tech template
            finalHtmlBody = finalHtmlBody.replace(/Innovation Awaits/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Accelerating Tech Excellence for \{company\}/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Transform Your Business with AI/gi, customizations.headerTitle);
            // Other templates
            finalHtmlBody = finalHtmlBody.replace(/Enterprise-Grade Solutions/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Creative Excellence/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Financial Innovation/gi, customizations.headerTitle);
            finalHtmlBody = finalHtmlBody.replace(/Healthcare Innovation/gi, customizations.headerTitle);
            console.log(`🎨 Applied header title: ${customizations.headerTitle}`);
          }

          // Apply main heading (preserving placeholders)
          if (customizations.mainHeading) {
            const mainHeading = customizations.mainHeading
              .replace('{name}', recipientName)
              .replace('{company}', recipientCompany);
            finalHtmlBody = finalHtmlBody.replace(/Hello \{name\}!/gi, mainHeading);
            finalHtmlBody = finalHtmlBody.replace(/Revolutionizing \{company\} with AI-Powered Solutions/gi, mainHeading);
            console.log(`🎨 Applied main heading: ${mainHeading}`);
          }

          // Apply testimonial text
          if (customizations.testimonialText) {
            let testimonialText = customizations.testimonialText.replace(/^["']|["']$/g, '');
            finalHtmlBody = finalHtmlBody.replace(/"This partnership exceeded our expectations[^"]*"/gi, `"${testimonialText}"`);
            finalHtmlBody = finalHtmlBody.replace(/"This solution transformed our operations[^"]*"/gi, `"${testimonialText}"`);
            console.log(`🎨 Applied testimonial text`);
          }

          // Apply testimonial author
          if (customizations.testimonialAuthor) {
            finalHtmlBody = finalHtmlBody.replace(/— Sarah Chen, CEO at GrowthTech/gi, customizations.testimonialAuthor);
            finalHtmlBody = finalHtmlBody.replace(/CEO, Industry Leader/gi, customizations.testimonialAuthor);
            console.log(`🎨 Applied testimonial author: ${customizations.testimonialAuthor}`);
          }

          // Apply text size
          if (customizations.textSize) {
            finalHtmlBody = finalHtmlBody.replace(/font-size:\s*16px/gi, `font-size: ${customizations.textSize}`);
            console.log(`🎨 Applied text size: ${customizations.textSize}`);
          }

          // Apply font weight
          if (customizations.fontWeight === 'bold') {
            finalHtmlBody = finalHtmlBody.replace(/<p style="/gi, '<p style="font-weight: bold; ');
            console.log(`🎨 Applied font weight: bold`);
          }

          // Apply font style
          if (customizations.fontStyle === 'italic') {
            finalHtmlBody = finalHtmlBody.replace(/<p style="/gi, '<p style="font-style: italic; ');
            console.log(`🎨 Applied font style: italic`);
          }

          console.log(`✅ Applied user's custom greeting and signature`);

          console.log(`✅ Template HTML populated with content and ALL customizations`);
        } else {
          // Fallback: Generate our own HTML
          console.log(`📝 Template HTML not available, using fallback generation`);

          // Prepare email content paragraphs
          const bodyParagraphs = (htmlBody || cleanedBody)
            .split('\n')
            .filter(line => line.trim())
            .map(line => `<p style="margin:16px 0;line-height:1.6;color:#555;font-size:16px;">${line}</p>`)
            .join('\n');

          // 🎨 RENDER USER'S CUSTOM FEATURES
          const featuresHtml = structuredSections.features.map(feature =>
            `<div style="text-align:center;">
              <div style="color:${finalPrimaryColor};font-weight:700;font-size:16px;">✓ ${feature}</div>
            </div>`
          ).join('\n          ');

          // 🎨 FORMAT USER'S CUSTOM SIGNATURE (handle multi-line)
          const signatureHtml = structuredSections.signature
            .split('\n')
            .map(line => `<p style="margin:2px 0;color:#666;${line === structuredSections.signature.split('\n')[0] ? 'font-weight:bold;color:#333;font-size:16px;' : ''}">${line}</p>`)
            .join('\n        ');

          // Generate template-specific HTML with proper styling AND USER CUSTOMIZATIONS
          finalHtmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${userSubject || subject || 'Email from ' + senderCompany}</title>
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

    <!-- Header with gradient based on selected template AND user colors -->
    <div style="background:linear-gradient(135deg,${finalPrimaryColor} 0%,${finalSecondaryColor} 100%);padding:40px 30px;text-align:center;color:white;">
      <h1 style="margin:0 0 10px 0;font-size:28px;font-weight:bold;">${senderCompany}</h1>
      <p style="margin:0;opacity:0.9;font-size:16px;">${style.name}</p>
    </div>

    <!-- Main Content -->
    <div style="padding:40px 30px;">
      <!-- User's Custom Greeting -->
      <div style="margin:0 0 20px 0;color:#333;font-size:18px;font-weight:500;">${structuredSections.greeting}</div>

      <!-- Email Body -->
      ${bodyParagraphs}

      <!-- User's Custom Call to Action Button -->
      <div style="text-align:center;margin:40px 0;">
        <a href="${structuredSections.ctaUrl}"
           style="display:inline-block;background:${finalPrimaryColor};color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
          ${structuredSections.ctaText} →
        </a>
      </div>

      <!-- User's Custom Features -->
      <div style="background:#f8f9fa;padding:25px;border-radius:8px;margin:30px 0;border-left:4px solid ${finalPrimaryColor};">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">
          ${featuresHtml}
        </div>
      </div>

      <!-- User's Custom Signature -->
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e9ecef;">
        ${signatureHtml}
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 30px;background:#f8f9fa;text-align:center;border-top:1px solid #e9ecef;">
      <p style="margin:0;color:#6c757d;font-size:12px;">Generated with ${style.name} template • Customized by user</p>
    </div>
  </div>
</body>
</html>`;
        }

        console.log(`✅ HTML email generated with ${selectedTemplate} template (${finalHtmlBody.length} chars)`);
      } catch (htmlError) {
        console.error(`❌ HTML generation error: ${htmlError.message}`);
        console.error(`   Stack: ${htmlError.stack}`);

        // Ultra-simple fallback
        const bodyParagraphs = (htmlBody || cleanedBody)
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p style="margin:12px 0;line-height:1.6;color:#666;">${line}</p>`)
          .join('\n');

        finalHtmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Email from ${senderCompany}</title></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:40px;border-radius:8px;">
    ${bodyParagraphs}
    <p style="margin-top:30px;">Best regards,<br>${senderName}<br>${senderCompany}</p>
  </div>
</body>
</html>`;
        console.log(`⚠️ Using ultra-simple fallback HTML template due to error`);
      }


      // Skip the complex fallback template - it's causing the error
      /*
        // OLD COMPLEX FALLBACK - CAUSING ERRORS
        finalHtmlBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email from ${senderCompany}</title>
          <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .email-container { width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; }
            .email-content { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
            .header-section { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 40px 30px; text-align: center; position: relative; }
            .header-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity: 0.3; }
            .company-logo { position: relative; z-index: 2; display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.15); border-radius: 50px; margin-bottom: 20px; backdrop-filter: blur(10px); }
            .company-name { position: relative; z-index: 2; color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .tagline { position: relative; z-index: 2; color: rgba(255,255,255,0.9); font-size: 16px; margin: 8px 0 0 0; font-weight: 300; }
            .content-section { padding: 50px 40px; }
            .greeting { font-size: 18px; color: #1f2937; margin-bottom: 24px; font-weight: 500; }
            .main-content { font-size: 16px; line-height: 1.7; color: #374151; margin-bottom: 32px; }
            .feature-highlight { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #4f46e5; }
            .cta-section { text-align: center; margin: 40px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3); transition: all 0.3s ease; }
            .cta-button:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4); }
            .signature-section { margin-top: 40px; padding-top: 32px; border-top: 1px solid #e5e7eb; }
            .signature-name { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
            .signature-title { color: #6b7280; font-size: 14px; }
            .footer-section { background: #f8fafc; padding: 30px 40px; text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5; }
            @media only screen and (max-width: 600px) {
              .email-container { padding: 20px 10px; }
              .header-section, .content-section, .footer-section { padding: 30px 20px; }
              .company-name { font-size: 24px; }
              .main-content { font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-content">
              <!-- Header Section -->
              <div class="header-section">
                <div class="company-logo">
                  <span style="color: white; font-weight: 600; font-size: 14px;">🍎</span>
                </div>
                <h1 class="company-name">${senderCompany}</h1>
                <p class="tagline">Innovative AI Solutions for Smarter Business</p>
              </div>
              
              <!-- Content Section -->
              <div class="content-section">
                ${htmlBody.replace(/<p style="margin: 12px 0; line-height: 1.6;">/g, '<div class="main-content">').replace(/<\/p>/g, '</div>')}
                
                <!-- CTA Section -->
                <div class="cta-section">
                  <a href="https://fruitai.org" class="cta-button">Explore Our Solutions</a>
                </div>
                
                <!-- Signature -->
                <div class="signature-section">
                  <div class="signature-name">${senderName || senderCompany + ' Team'}</div>
                  <div class="signature-title">${senderCompany} • AI Technology Solutions</div>
                </div>
              </div>
              
              <!-- Footer Section -->
              <div class="footer-section">
                <p>This email was sent by <strong>${senderCompany}</strong><br>
                Visit us at <a href="https://fruitai.org" style="color: #4f46e5; text-decoration: none;">fruitai.org</a></p>
                <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} ${senderCompany}. Revolutionizing business with AI technology.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `.trim();
      */ // End of commented out complex fallback template

      // Final subject cleanup
      const cleanedSubject = (subject || `Partnership Opportunity with ${recipientCompany}`)
        .replace(/\[.*?\]/g, '') // Remove ALL bracketed content
        .replace(/\{\{.*?\}\}/g, '') // Remove ALL template variables
        .trim() || `Partnership Opportunity with ${recipientCompany}`;
      
      const emailContent = {
        subject: cleanedSubject,
        body: finalHtmlBody,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        recipientCompany: recipientCompany,
        senderCompany: senderCompany,
        senderWebsite: senderWebsite,
        personalizationLevel: 'maximum',
        generatedBy: 'ollama_' + this.models.email,
        generatedAt: new Date().toISOString(),
        aiGenerated: true,
        dataQuality: 'real_data_only',
        qualityChecks: {
          hasRealSenderData,
          hasRealRecipientData,
          hasRealServiceData,
          noPlaceholders: !finalHtmlBody.includes('your') && !finalHtmlBody.includes('our') 
        },
        profileData: {
          industry: recipientIndustry,
          role: recipientRole,
          painPoints: recipientPainPoints.join(', '),
          communicationStyle: prospect.aiProfile?.communicationStyle || 'professional'
        }
      };
      
      // 计算邮件质量分数
      const qualityScore = this.calculateEmailQuality(emailContent, prospect, strategy);
      emailContent.qualityScore = qualityScore;
      
      console.log(`✅ 邮件生成成功 (质量分: ${qualityScore}/10)`);
      console.log(`   📧 主题: ${cleanedSubject}`);
      console.log(`   📝 内容长度: ${finalHtmlBody.length} 字符`);
      console.log(`   📊 数据完整度: 发送方${hasRealSenderData?'✅':'⚠️'} 接收方${hasRealRecipientData?'✅':'⚠️'} 服务${hasRealServiceData?'✅':'⚠️'}`);
      console.log(`   🚀 邮件已准备发送`);
      
      return emailContent;
      
    } catch (error) {
      console.error('❌ 真实数据邮件生成失败:', error.message);
      throw new Error(`邮件生成失败: ${error.message}. 拒绝使用占位符或模板。`);
    }
  }
  
  /**
   * 从邮箱地址提取姓名
   */
  extractNameFromEmail(email) {
    if (!email || !email.includes('@')) return null;
    
    const username = email.split('@')[0];
    if (username.includes('.')) {
      const parts = username.split('.');
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  /**
   * 从邮箱地址提取公司名 - 避免Gmail/Yahoo等个人邮箱
   */
  extractCompanyFromEmail(email) {
    if (!email || !email.includes('@')) return null;
    
    try {
      const domain = email.split('@')[1].toLowerCase();
      const username = email.split('@')[0];
      
      // 🚫 Skip personal email providers
      const personalProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com'];
      if (personalProviders.includes(domain)) {
        // Try to extract company from username
        if (username.includes('tech') || username.includes('corp') || username.includes('inc')) {
          const companyName = username.split(/[0-9_.-]/)[0];
          return companyName.charAt(0).toUpperCase() + companyName.slice(1);
        }
        return 'Unknown Company'; // Will be enriched later
      }
      
      // 🏢 Extract from business domains
      const companyPart = domain.replace(/\.(com|org|net|edu|gov|co\.uk|co|io|ai)$/i, '');
      const parts = companyPart.split('.');
      const mainPart = parts[parts.length - 1];
      
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    } catch (error) {
      return 'Unknown Company';
    }
  }
  
  /**
   * 计算邮件质量分数
   */
  calculateEmailQuality(emailContent, prospect, strategy) {
    let score = 0;
    
    // 个性化检查 (3分)
    if (emailContent.subject.includes(prospect.company)) score += 1;
    if (emailContent.body.includes(prospect.name)) score += 1;
    if (emailContent.body.includes(prospect.company)) score += 1;
    
    // 具体性检查 (3分)
    if (emailContent.body.includes(strategy.industry)) score += 1;
    if (emailContent.body.includes(strategy.company_name)) score += 1;
    if (emailContent.body.includes(prospect.aiProfile?.estimatedRole || prospect.title)) score += 1;
    
    // 价值主张检查 (2分)
    if (emailContent.body.length > 100) score += 1;
    if (emailContent.body.includes('value') || emailContent.body.includes('benefit') || emailContent.body.includes('help')) score += 1;
    
    // AI生成质量 (2分)
    if (emailContent.aiGenerated) score += 1;
    if (emailContent.body.length > 200 && emailContent.body.length < 500) score += 1;
    
    return Math.min(10, score);
  }

  /**
   * 处理用户反馈并学习优化
   */
  async processUserFeedback(campaignId, feedbackType, feedback) {
    console.log(`📝 Processing user feedback for ${campaignId}: ${feedbackType}`);
    
    try {
      switch (feedbackType) {
        case 'email_modification':
          await this.handleEmailModificationFeedback(campaignId, feedback);
          break;
        case 'strategy_rating':
          await this.handleStrategyRatingFeedback(campaignId, feedback);
          break;
        case 'search_improvement':
          await this.handleSearchImprovementFeedback(campaignId, feedback);
          break;
        default:
          console.log(`⚠️ Unknown feedback type: ${feedbackType}`);
      }

      return { success: true, message: 'Feedback processed and learned' };
    } catch (error) {
      console.error('❌ Error processing feedback:', error.message);
      return { success: false, error: error.message };
    }
  }

  async handleEmailModificationFeedback(campaignId, feedback) {
    // 更新邮件学习数据
    await this.memory.storeEmailLearning(
      campaignId,
      feedback.modified_content,
      feedback.results || { sent: false },
      {
        approval: true,
        modifications: feedback.modifications,
        rating: feedback.user_rating || 5
      }
    );
  }

  /**
   * Handle user edits from the email editor and apply learning
   */
  async handleEmailEditorChanges(campaignId, editorData) {
    try {
      console.log('📝 Processing email editor changes...');
      
      const { originalStructure, editedStructure, emailId, prospectId } = editorData;
      
      // Save the edited email using EmailEditorService
      const EmailEditorService = require('../services/EmailEditorService');
      const emailEditor = new EmailEditorService();
      
      const saveResult = await emailEditor.saveUserEdits(
        emailId,
        originalStructure,
        editedStructure,
        'campaign_user'
      );
      
      // Update the learning system
      if (saveResult.success) {
        console.log(`✅ Editor changes saved: ${saveResult.changesDetected} changes detected`);
        
        // Store in memory for future campaigns
        await this.memory.storeEmailLearning(
          campaignId,
          editedStructure,
          { sent: false, edited: true },
          {
            approval: true,
            editor_changes: saveResult.changesDetected,
            modifications: `User edited ${saveResult.changesDetected} components`,
            rating: 5,
            source: 'email_editor'
          }
        );
        
        return {
          success: true,
          changesApplied: saveResult.changesDetected,
          learningUpdated: true,
          finalStructure: editedStructure
        };
      }
      
    } catch (error) {
      console.error('Failed to handle editor changes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply learned email patterns to new emails
   */
  async applyEmailLearning(emailStructure, templateType) {
    try {
      console.log(`🧠 Applying email learning for template: ${templateType}`);
      
      const EmailEditorService = require('../services/EmailEditorService');
      const emailEditor = new EmailEditorService();
      
      const enhancedStructure = await emailEditor.applyLearnedPreferences(
        emailStructure,
        templateType
      );
      
      console.log(`✅ Learning applied to email structure`);
      return enhancedStructure;
      
    } catch (error) {
      console.log(`⚠️ Failed to apply email learning: ${error.message}`);
      return emailStructure; // Return original if learning fails
    }
  }

  /**
   * Handle user approval to send pending email
   */
  async sendApprovedEmail(campaignId, prospectEmail, editedContent = null) {
    try {
      const emailKey = `${campaignId}_${prospectEmail}`;
      console.log(`📤 Processing user approval for: ${emailKey}`);
      
      if (!this.pendingEmails || !this.pendingEmails.has(emailKey)) {
        console.log(`❌ No pending email found for: ${emailKey}`);
        return { success: false, error: 'Pending email not found' };
      }
      
      const pendingEmail = this.pendingEmails.get(emailKey);
      let emailContent = pendingEmail.emailContent;
      
      // Apply user edits if provided
      if (editedContent) {
        console.log(`✏️ Applying user edits to email...`);
        
        // Handle editor changes and learning
        await this.handleEmailEditorChanges(campaignId, {
          emailId: emailKey,
          originalStructure: emailContent.editorPreview?.structure,
          editedStructure: editedContent,
          prospectId: prospectEmail
        });
        
        // Update email content with edited version
        emailContent = {
          ...emailContent,
          subject: editedContent.subject || emailContent.subject,
          body: editedContent.finalHTML || emailContent.body,
          html: editedContent.finalHTML || emailContent.html
        };
      }
      
      console.log(`   📧 Sending approved email to: ${prospectEmail}`);
      
      // Send the email using SMTP service
      const emailSent = await this.sendEmail({
        to: prospectEmail,
        subject: emailContent.subject,
        body: emailContent.body,
        prospect: pendingEmail.prospect,
        campaignId: campaignId,
        smtpConfig: pendingEmail.smtpConfig
      });
      
      if (emailSent.success) {
        console.log(`   ✅ Email sent successfully to ${prospectEmail}`);
        
        // Remove from pending emails
        this.pendingEmails.delete(emailKey);
        
        // Store email learning
        await this.memory.storeEmailLearning(
          campaignId,
          emailContent,
          { sent: true, opened: false, replied: false },
          { 
            approval: true, 
            rating: 5,
            source: 'user_approved'
          }
        );
        
        // Notify frontend
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'email_sent_success',
            data: {
              prospectId: prospectEmail,
              campaignId: campaignId,
              sentAt: new Date().toISOString(),
              status: 'sent'
            }
          });
        }
        
        return { 
          success: true, 
          sent: true,
          sentAt: new Date().toISOString()
        };
        
      } else {
        console.log(`   ❌ Failed to send email to ${prospectEmail}: ${emailSent.error}`);
        return { 
          success: false, 
          error: emailSent.error 
        };
      }
      
    } catch (error) {
      console.error(`❌ Error sending approved email:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Send all pending emails for a campaign
   */
  async sendAllPendingEmails(campaignId) {
    try {
      console.log(`📤 Sending all pending emails for campaign: ${campaignId}`);
      
      if (!this.pendingEmails) {
        return { success: true, sent: 0, errors: [] };
      }
      
      const results = [];
      let sentCount = 0;
      const errors = [];
      
      // Get all pending emails for this campaign
      for (const [emailKey, pendingEmail] of this.pendingEmails.entries()) {
        if (pendingEmail.campaignId === campaignId) {
          console.log(`   📧 Sending: ${pendingEmail.prospect.email}`);
          
          const result = await this.sendApprovedEmail(
            campaignId, 
            pendingEmail.prospect.email
          );
          
          results.push({
            email: pendingEmail.prospect.email,
            result: result
          });
          
          if (result.success) {
            sentCount++;
          } else {
            errors.push(`${pendingEmail.prospect.email}: ${result.error}`);
          }
          
          // Add delay between emails to avoid spam detection
          if (sentCount > 0 && sentCount % 3 === 0) {
            console.log(`   ⏳ Anti-spam delay...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      console.log(`✅ Batch sending completed: ${sentCount} sent, ${errors.length} errors`);
      
      return {
        success: true,
        sent: sentCount,
        errors: errors,
        results: results
      };
      
    } catch (error) {
      console.error(`❌ Error sending all pending emails:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pending emails for frontend display
   */
  getPendingEmails(campaignId) {
    if (!this.pendingEmails) {
      return [];
    }
    
    const pending = [];
    for (const [emailKey, pendingEmail] of this.pendingEmails.entries()) {
      if (pendingEmail.campaignId === campaignId) {
        pending.push({
          emailKey,
          prospect: pendingEmail.prospect,
          emailContent: pendingEmail.emailContent,
          status: pendingEmail.status,
          createdAt: pendingEmail.createdAt,
          canEdit: true,
          preview: pendingEmail.emailContent.editorPreview
        });
      }
    }
    
    return pending;
  }

  /**
   * Wait for user decision after popup
   */
  async waitForUserDecision(campaignData) {
    return new Promise((resolve) => {
      console.log('⏸️ Workflow paused, waiting for user decision...');
      console.log('🔔 NO TIMEOUT - Will wait indefinitely for user approval');

      // Store campaign data and promise resolver
      this.state.workflowPaused = true;
      this.state.pausedCampaignData = campaignData;
      this.state.userDecisionPromise = resolve;

      // 🔥 FIX: REMOVED 15-minute timeout
      // Workflow will wait indefinitely for user to review and approve first email

      // 🔔 Set up reminder popup (every 5 minutes)
      const reminderInterval = setInterval(() => {
        if (this.state.workflowPaused && this.wsManager) {
          console.log('🔔 Sending reminder to user to review first email...');
          this.wsManager.broadcast({
            type: 'reminder_review_email',
            data: {
              message: '⏳ Please review and approve the first email to continue generating emails for remaining prospects',
              campaignId: campaignData.campaignId,
              action: 'review_and_send',
              reminderCount: (this.state.reminderCount || 0) + 1,
              timestamp: new Date().toISOString()
            }
          });
          this.state.reminderCount = (this.state.reminderCount || 0) + 1;
        } else {
          // User made decision, clear interval
          clearInterval(reminderInterval);
        }
      }, 300000); // 5 minutes

      // Store interval ID so we can clear it when decision is made
      this.state.reminderIntervalId = reminderInterval;
    });
  }

  /**
   * Resume workflow after user decision
   */
  resumeWorkflow(decision, userTemplate = null, smtpConfig = null) {
    if (!this.state.workflowPaused || !this.state.userDecisionPromise) {
      console.log('⚠️ No paused workflow found');
      return;
    }

    console.log(`▶️ Resuming workflow with decision: ${decision}`);

    // 🔥 FIX: Clear reminder interval
    if (this.state.reminderIntervalId) {
      clearInterval(this.state.reminderIntervalId);
      this.state.reminderIntervalId = null;
      this.state.reminderCount = 0;
      console.log('✅ Cleared email review reminder interval');
    }

    this.state.workflowPaused = false;
    this.state.userDecision = decision;

    // If user provided template, store it for remaining emails
    if (userTemplate) {
      console.log('🔍 DEBUG: Storing userTemplate with keys:', Object.keys(userTemplate));
      console.log('🔍 DEBUG: userTemplate.components length:', userTemplate.components?.length || 0);
      this.state.userTemplate = userTemplate;
      console.log('🔍 DEBUG: this.state.userTemplate stored successfully');
    } else {
      console.log('🔍 DEBUG: No userTemplate provided to resumeWorkflow');
    }

    // Store SMTP config if provided
    if (smtpConfig) {
      console.log('🔧 Storing SMTP config for batch sending');
      this.state.smtpConfig = smtpConfig;
    }

    // Ensure campaign data includes SMTP config
    if (this.state.pausedCampaignData && smtpConfig) {
      this.state.pausedCampaignData.smtpConfig = smtpConfig;
    }

    // Resolve the promise with decision data
    this.state.userDecisionPromise({
      decision,
      campaignData: this.state.pausedCampaignData,
      userTemplate
    });
    
    // Clear state
    this.state.pausedCampaignData = null;
    this.state.userDecisionPromise = null;
  }

  /**
   * Format plain text content as HTML paragraphs
   */
  formatTextAsHtml(textContent) {
    if (!textContent) return '';

    // Clean the text content first
    let cleanText = textContent.replace(/<[^>]*>/g, ''); // Remove any existing HTML tags

    // Split into paragraphs
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Convert to HTML paragraphs
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
  }

  /**
   * Continue generating emails for remaining prospects after template approval
   */
  async continueGeneratingEmails(campaignId, prospects, startIndex, templateData, smtpConfig, targetAudience, emailTemplate) {
    console.log(`\n📊 Continuing email generation for remaining ${prospects.length - startIndex} prospects...`);

    // Update agent state with the approved template
    if (templateData) {
      this.state.userTemplate = templateData;
      console.log(`📋 Updated agent state with approved template (${templateData.html?.length || 0} chars)`);
    }

    const emailCampaign = {
      campaignId,
      emails: [],
      totalProspects: prospects.length,
      generatedAt: new Date().toISOString()
    };

    // Continue from the next prospect after the one that was just sent
    for (let i = startIndex; i < Math.min(prospects.length, 10); i++) {
      const prospect = prospects[i];

      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📧 PROSPECT ${i + 1}/${Math.min(prospects.length, 10)}`);
      console.log(`${'─'.repeat(50)}`);
      console.log(`   Email: ${prospect.email}`);
      console.log(`   Name: ${prospect.name || 'Unknown'}`);
      console.log(`   Company: ${prospect.company || 'Unknown'}`);

      try {
        // Step 1: Generate user persona for this specific prospect
        console.log(`\n   🧠 STEP 1: Generating AI User Persona...`);
        const userPersona = await this.generateUserPersona(prospect, this.marketingStrategyData, targetAudience);

        prospect.persona = userPersona;

        console.log(`   ✅ Persona Generated:`);
        console.log(`      Type: ${userPersona.type || 'Standard'}`);
        console.log(`      Style: ${userPersona.communicationStyle || 'Professional'}`);

        // Step 2: Generate personalized email based on persona
        console.log(`\n   📝 STEP 2: Creating Personalized Email...`);

        const emailOptimization = await this.memory.getEmailOptimizationSuggestions(
          { subject: '', body: `Outreach to ${prospect.company || prospect.name}` },
          campaignId
        );

        // Use the user template from the first email
        const emailContent = await this.generateOptimizedEmailContentWithPersona(
          prospect,
          userPersona,
          this.marketingStrategyData,
          emailOptimization,
          this.businessAnalysisData,
          'user_template',
          templateData || this.state.userTemplate,
          targetAudience,
          i
        );

        console.log(`   ✅ Email Created:`);
        console.log(`      Subject: "${emailContent.subject || 'No subject'}"`);
        console.log(`      Template: ${emailContent.template || 'custom'}`);

        // Step 3: Send the email automatically using the same template
        console.log(`\n   📤 STEP 3: Sending Email Automatically...`);

        const sendEmailData = {
          to: prospect.email,
          subject: emailContent.subject,
          body: emailContent.body || emailContent.html,
          prospect: prospect,
          campaignId: campaignId,
          smtpConfig: smtpConfig
        };

        const sendResult = await this.sendEmail(sendEmailData);

        if (sendResult.success) {
          console.log(`   ✅ Email sent successfully to ${prospect.email}`);
          emailContent.status = 'sent';
          emailContent.sentAt = new Date().toISOString();
        } else {
          console.log(`   ❌ Failed to send email: ${sendResult.error}`);
          emailContent.status = 'failed';
        }

        // Add to campaign results
        const newEmail = {
          id: `email_${campaignId}_${i + 1}`,
          to: prospect.email,
          subject: emailContent.subject,
          body: emailContent.body,
          html: emailContent.body, // Also include as html for compatibility
          status: emailContent.status,
          sentAt: emailContent.sentAt,
          template: emailContent.template,
          recipient_name: prospect.name,
          recipient_company: prospect.company
        };

        emailCampaign.emails.push(newEmail);

        // Also update workflow results to ensure it's available in email editor
        try {
          const workflowModule = require('../routes/workflow');
          if (workflowModule.addEmailToWorkflowResults) {
            workflowModule.addEmailToWorkflowResults(newEmail, this.userId);
          }
        } catch (error) {
          console.log('⚠️ Could not update workflow results:', error.message);
        }

        // Broadcast progress
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: 'email_sent',
            data: {
              campaignId: campaignId,
              prospect: prospect,
              emailIndex: i + 1,
              totalEmails: Math.min(prospects.length, 10),
              status: emailContent.status
            }
          });
        }

        // Anti-spam delay
        if (i < Math.min(prospects.length, 10) - 1) {
          console.log(`\n   ⏳ Anti-spam delay before next prospect...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Failed to generate/send email for ${prospect.email}:`, error.message);

        const failedEmail = {
          id: `failed_${campaignId}_${i + 1}`,
          to: prospect.email,
          subject: `Failed: ${error.message}`,
          body: '',
          html: '',
          status: 'failed',
          error: error.message,
          recipient_name: prospect.name,
          recipient_company: prospect.company
        };

        emailCampaign.emails.push(failedEmail);

        // Also update workflow results for failed emails
        try {
          const workflowModule = require('../routes/workflow');
          if (workflowModule.addEmailToWorkflowResults) {
            workflowModule.addEmailToWorkflowResults(failedEmail, this.userId);
          }
        } catch (error) {
          console.log('⚠️ Could not update workflow results:', error.message);
        }
      }
    }

    console.log(`\n✅ Completed generating emails for ${emailCampaign.emails.length} prospects`);
    return emailCampaign;
  }

  async handleStrategyRatingFeedback(campaignId, feedback) {
    // 更新营销策略学习数据
    // Handle both direct strategy feedback and step-based feedback
    const strategyData = feedback.strategy || feedback.modified_content || {
      stepId: feedback.stepId,
      user_modifications: feedback.modifications,
      timestamp: feedback.timestamp
    };

    await this.memory.storeMarketingLearning(
      campaignId,
      strategyData,
      feedback.results || {},
      {
        user_rating: feedback.rating || feedback.user_rating || 5,
        user_comments: feedback.comments || feedback.modifications || 'User provided feedback',
        effectiveness: feedback.effectiveness || 0.8,
        step_id: feedback.stepId,
        learning_enabled: feedback.learning_enabled
      }
    );
  }

  async handleSearchImprovementFeedback(campaignId, feedback) {
    // 更新搜索学习数据
    await this.memory.storeSearchLearning(
      campaignId,
      feedback.query,
      feedback.results || [],
      {
        success_rate: feedback.success_rate,
        user_satisfaction: feedback.satisfaction,
        query_type: 'user_optimized'
      }
    );
  }

  /**
   * 获取活动性能分析
   */
  async getCampaignAnalytics(campaignId) {
    try {
      const searchLearning = await this.memory.retrieveSimilarLearning('', 'search_learning', 100);
      const marketingLearning = await this.memory.retrieveSimilarLearning('', 'marketing_learning', 100);
      const emailLearning = await this.memory.retrieveSimilarLearning('', 'email_learning', 100);

      const campaignData = {
        search: searchLearning.filter(item => item.campaign_id === campaignId),
        marketing: marketingLearning.filter(item => item.campaign_id === campaignId),
        emails: emailLearning.filter(item => item.campaign_id === campaignId)
      };

      return {
        campaignId,
        totalSearches: campaignData.search.length,
        averageSearchSuccess: this.calculateAverageMetric(campaignData.search, 'performance.success_rate'),
        totalEmails: campaignData.emails.length,
        averageEmailRating: this.calculateAverageMetric(campaignData.emails, 'user_feedback.rating'),
        marketingEffectiveness: this.calculateAverageMetric(campaignData.marketing, 'results.response_rate'),
        learningInsights: {
          topSearchPatterns: this.getTopPatterns(campaignData.search),
          bestEmailStyles: this.getBestEmailStyles(campaignData.emails),
          preferredStrategies: this.getPreferredStrategies(campaignData.marketing)
        }
      };
    } catch (error) {
      console.error('❌ Error getting campaign analytics:', error.message);
      return null;
    }
  }

  // Helper methods
  calculateRelevanceScore(prospects) {
    return prospects.length > 0 ? Math.min(prospects.length / 10, 1) : 0;
  }

  calculateAverageMetric(data, path) {
    if (!data.length) return 0;
    const values = data.map(item => this.getNestedValue(item, path)).filter(v => v !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getTopPatterns(searchData) {
    return searchData
      .filter(item => item.performance?.success_rate > 0.5)
      .map(item => item.content)
      .slice(0, 5);
  }

  getBestEmailStyles(emailData) {
    return emailData
      .filter(item => item.user_feedback?.rating > 3)
      .map(item => ({ content: item.content, rating: item.user_feedback.rating }))
      .slice(0, 3);
  }

  getPreferredStrategies(marketingData) {
    return marketingData
      .filter(item => item.results?.response_rate > 0.1)
      .map(item => JSON.parse(item.content))
      .slice(0, 3);
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  async shutdown() {
    await this.memory.disconnect();
    console.log('🔌 LangGraph Marketing Agent shutdown');
  }

  /**
   * Generate user persona for a specific prospect using Ollama
   */
  async generateUserPersona(prospect, marketingStrategy, targetAudience = null) {
    console.log(`🧠 Generating enhanced user persona for ${prospect.name || prospect.email}...`);
    
    // First, try to scrape additional info from the source URL if available
    let scrapedInfo = '';
    if (prospect.source_url || prospect.website) {
      const url = prospect.source_url || prospect.website;
      console.log(`   🌐 Scraping additional info from: ${url}`);
      
      try {
        // Simple fetch to get page content
        const fetch = require('node-fetch');
        const response = await fetch(url, { 
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MarketingAgent/1.0)'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          // Extract text content (simple extraction)
          const textContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 1000); // First 1000 chars
          
          scrapedInfo = `\n\nADDITIONAL CONTEXT FROM ${url}:\n${textContent}\n`;
          console.log(`   ✅ Successfully scraped additional context`);
        }
      } catch (scrapeError) {
        console.log(`   ⚠️ Could not scrape URL: ${scrapeError.message}`);
      }
    }
    
    // 🔧 FIX: Include user's target audience settings in persona generation
    const audienceContext = targetAudience ? `
USER'S TARGET AUDIENCE SETTINGS:
- Audience Type: ${targetAudience.audienceType || 'decision_makers'}
- Industries: ${targetAudience.industries?.join(', ') || 'Not specified'}
- Job Roles: ${targetAudience.jobRoles?.join(', ') || 'Not specified'}  
- Company Size: ${targetAudience.companySize || 'Not specified'}
- Geographic Location: ${targetAudience.location || 'Global'}
- Additional Keywords: ${targetAudience.keywords || 'Not specified'}
` : '';

    const personaPrompt = `
You are a marketing AI that creates detailed user personas for B2B email campaigns.
Use the user's specific target audience settings to create accurate personas.

PROSPECT INFORMATION:
- Name: ${prospect.name || 'Unknown'}
- Email: ${prospect.email}
- Company: ${prospect.company || 'Unknown'}
- Role: ${prospect.role || prospect.title || 'Professional'}
- Industry: ${prospect.industry || marketingStrategy.industry || 'Business'}
- Source: ${prospect.source || 'Search'}
- Source URL: ${prospect.source_url || prospect.website || 'Not available'}
${scrapedInfo}
${audienceContext}

MARKETING CONTEXT:
- Campaign Goal: ${marketingStrategy.campaign_objectives?.primary_goal || 'partnership'}
- Target Audience: ${marketingStrategy.target_audience?.primary_segments?.join(', ') || 'Business professionals'}
- Industry Focus: ${marketingStrategy.industry || 'General business'}

Generate a VERY detailed user persona in JSON format with ALL these fields:
{
  "type": "decision_maker|influencer|end_user|technical_buyer|economic_buyer",
  "communicationStyle": "formal|professional|casual|direct|technical|strategic",
  "primaryMotivations": ["3-5 specific motivations based on scraped context"],
  "painPoints": ["3-5 specific pain points relevant to their role"],
  "preferredChannels": ["email", "linkedin", "phone", "in-person", "webinar"],
  "decisionFactors": ["ROI", "ease_of_use", "support", "security", "scalability"],
  "personalityTraits": ["5-7 personality traits"],
  "businessPriorities": ["3-5 current business priorities"],
  "companySize": "startup|small|medium|large|enterprise",
  "decisionTimeframe": "immediate|quarter|year|exploring",
  "budget": "under_10k|10k_50k|50k_100k|100k_plus|enterprise",
  "techStack": ["current technologies they use"],
  "competitors": ["companies they might be evaluating"],
  "interests": ["professional interests and topics"],
  "recentActivity": "recent posts, articles, or company news",
  "linkedinUrl": "estimated LinkedIn profile URL",
  "twitterHandle": "if available",
  "buyingStage": "awareness|consideration|decision|retention",
  "responseRate": "high|medium|low",
  "bestTimeToContact": "morning|afternoon|evening",
  "influencers": ["people or sources that influence their decisions"],
  "successMetrics": ["KPIs they care about"],
  "objections": ["common objections they might have"],
  "contentPreferences": ["whitepapers", "case_studies", "demos", "webinars"],
  "languagePatterns": ["buzzwords or phrases they might use"],
  "sourceUrl": "${prospect.source_url || prospect.website || 'Not available'}",
  "communicationPreferences": {
    "tone": "professional|friendly|direct",
    "detail_level": "high|medium|low",
    "proof_points": "case_studies|testimonials|data"
  }
}

Return ONLY the JSON object, no other text.`;

    try {
      // ⏰ Wait for Ollama response (no timeout)
      const response = await this.callOllama(personaPrompt, 'email', { temperature: 0.7 });

      if (!response) {
        throw new Error('No persona response from Ollama');
      }

      // Parse JSON response
      let persona;
      try {
        // Clean up response to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          persona = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Enhanced fallback persona with all fields
        persona = {
          type: prospect.role?.toLowerCase().includes('manager') || prospect.role?.toLowerCase().includes('director') ? 'decision_maker' : 'influencer',
          communicationStyle: 'professional',
          companySize: 'medium',
          decisionTimeframe: 'quarter',
          budget: '50k_100k',
          techStack: ['Cloud services', 'SaaS tools'],
          competitors: [],
          interests: ['Innovation', 'Growth', 'Efficiency'],
          recentActivity: 'Active in industry',
          linkedinUrl: `https://linkedin.com/in/${(prospect.name || '').toLowerCase().replace(/\s+/g, '-')}`,
          twitterHandle: '',
          buyingStage: 'consideration',
          responseRate: 'medium',
          bestTimeToContact: 'morning',
          influencers: ['Industry leaders', 'Peers'],
          successMetrics: ['ROI', 'Efficiency', 'Growth'],
          objections: ['Cost', 'Implementation time', 'Integration'],
          contentPreferences: ['case_studies', 'demos'],
          languagePatterns: ['ROI', 'scalability', 'innovation'],
          sourceUrl: prospect.source_url || prospect.website || '',
          primaryMotivations: ['efficiency', 'growth'],
          painPoints: ['time management', 'workflow optimization'],
          preferredChannels: ['email', 'linkedin'],
          decisionFactors: ['ROI', 'ease_of_use'],
          personalityTraits: ['analytical', 'results_driven'],
          businessPriorities: ['operational efficiency'],
          communicationPreferences: {
            tone: 'professional',
            detail_level: 'medium',
            proof_points: 'data'
          }
        };
      }

      console.log(`✅ Generated persona: ${persona.type} (${persona.communicationStyle} style)`);
      
      // Send persona update to frontend via WebSocket
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'persona_generated',
          data: {
            prospect: {
              email: prospect.email,
              name: prospect.name || prospect.email.split('@')[0],
              company: prospect.company || 'Unknown',
              source: prospect.source || 'Email Search'
            },
            persona: persona,
            timestamp: new Date().toISOString(),
            generatedBy: 'LangGraph Marketing Agent'
          }
        });
      }
      
      return persona;
    } catch (error) {
      console.error('Error generating persona:', error.message);
      
      // Return default persona
      const defaultPersona = {
        type: 'influencer',
        communicationStyle: 'professional',
        primaryMotivations: ['efficiency'],
        painPoints: ['workflow challenges'],
        preferredChannels: ['email'],
        decisionFactors: ['value'],
        personalityTraits: ['professional'],
        businessPriorities: ['growth'],
        communicationPreferences: {
          tone: 'professional',
          detail_level: 'medium',
          proof_points: 'data'
        }
      };
      
      // Send fallback persona update to frontend via WebSocket
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: 'persona_generated',
          data: {
            prospect: {
              email: prospect.email,
              name: prospect.name || prospect.email.split('@')[0],
              company: prospect.company || 'Unknown',
              source: prospect.source || 'Email Search'
            },
            persona: defaultPersona,
            timestamp: new Date().toISOString(),
            generatedBy: 'LangGraph Marketing Agent (Fallback)'
          }
        });
      }
      
      return defaultPersona;
    }
  }

  /**
   * 🔥 NEW: Remove placeholders from generated email content
   */
  removePlaceholders(text) {
    if (!text) return text;

    // Remove common placeholder patterns
    let cleaned = text
      // Remove [Name], [Company], etc. in brackets
      .replace(/\[Name\]/gi, '')
      .replace(/\[Company\]/gi, '')
      .replace(/\[Position\]/gi, '')
      .replace(/\[Industry\]/gi, '')
      .replace(/\[Title\]/gi, '')
      .replace(/\[Role\]/gi, '')
      .replace(/\[Email\]/gi, '')
      .replace(/\[GENERATED CONTENT[^\]]*\]/gi, '')

      // Remove "Dear [Name]," patterns
      .replace(/Dear\s+\[Name\],?/gi, '')
      .replace(/Hello\s+\[Name\],?/gi, '')
      .replace(/Hi\s+\[Name\],?/gi, '')

      // Remove any remaining bracket placeholders
      .replace(/\[[A-Z][a-zA-Z\s]*\]/g, '')

      // Clean up multiple spaces and line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 line breaks
      .replace(/  +/g, ' ') // Multiple spaces to single
      .trim();

    return cleaned;
  }

  /**
   * Generate optimized email content using persona and PersonalizedEmailGenerator
   */
  async generateOptimizedEmailContentWithPersona(prospect, userPersona, marketingStrategy, emailOptimization, businessAnalysis, emailTemplate = null, templateData = null, targetAudience = null, sequenceIndex = 0) {
    console.log(`📝 Generating personalized email for ${prospect.name || prospect.email} using persona...`);
    if (emailTemplate) {
      console.log(`   📋 Using template: ${emailTemplate}`);
    }
    
    try {
      // Enhanced prospect with persona and template preference
      console.log(`🔍 DEBUG: emailTemplate parameter is: ${emailTemplate}`);

      // 🔍 DEBUG: Log current template state
      console.log(`\n📋 TEMPLATE SELECTION DEBUG for ${prospect.name || prospect.email}:`);
      console.log(`   1. state.selectedCampaignTemplate exists: ${!!this.state.selectedCampaignTemplate}`);
      if (this.state.selectedCampaignTemplate) {
        console.log(`      - templateId: ${this.state.selectedCampaignTemplate.templateId}`);
        console.log(`      - isUserCustomized: ${this.state.selectedCampaignTemplate.isUserCustomized}`);
        console.log(`      - templateData.isCustomized: ${this.state.selectedCampaignTemplate.templateData?.isCustomized}`);
        console.log(`      - templateData.html length: ${this.state.selectedCampaignTemplate.templateData?.html?.length || 0}`);
      }
      console.log(`   2. templateData param exists: ${!!templateData}`);
      if (templateData) {
        console.log(`      - templateId: ${templateData.templateId}`);
        console.log(`      - isCustomized: ${templateData.isCustomized}`);
        console.log(`      - html length: ${templateData.html?.length || 0}`);
      }
      console.log(`   3. emailTemplate param: ${emailTemplate}\n`);

      // 🎯 CRITICAL FIX: Always prefer the actual template ID from selection
      let selectedEmailTemplate = emailTemplate;

      // First priority: Use the campaign-selected template if available
      if (this.state.selectedCampaignTemplate && this.state.selectedCampaignTemplate.templateId) {
        selectedEmailTemplate = this.state.selectedCampaignTemplate.templateId;
        templateData = this.state.selectedCampaignTemplate.templateData;
        console.log(`✅ Using campaign-selected template: ${selectedEmailTemplate}`);
        console.log(`   ✨ Has customizations: ${templateData.isCustomized || false}`);
        console.log(`   🧩 Has components: ${templateData.components ? templateData.components.length : 0}`);
        console.log(`   📄 HTML length: ${templateData.html?.length || 0} chars`);
      }
      // Second priority: Use template from templateData if it has a templateId
      else if (templateData && templateData.templateId) {
        selectedEmailTemplate = templateData.templateId;
        console.log(`🎯 Using template from templateData: ${selectedEmailTemplate}`);
      }
      // Third priority: Use the provided emailTemplate parameter
      else if (emailTemplate && emailTemplate !== 'user_template') {
        selectedEmailTemplate = emailTemplate;
        console.log(`🎯 Using provided template parameter: ${selectedEmailTemplate}`);
      }
      // Last resort: Default to professional_partnership
      else {
        selectedEmailTemplate = 'professional_partnership';
        console.log(`🎯 No template specified, using default: ${selectedEmailTemplate}`);
      }

      // 🎯 CRITICAL: Load actual template content and merge with customizations
      if (selectedEmailTemplate && selectedEmailTemplate !== null) {
        console.log(`🔧 Loading template content for: ${selectedEmailTemplate}`);
        const baseTemplate = TemplatePromptService.getTemplate(selectedEmailTemplate);

        if (baseTemplate) {
          console.log(`✅ Loaded base template: ${baseTemplate.name}`);

          // If we have customizations from template selection, merge them
          if (templateData && (templateData.isCustomized || templateData.components || templateData.html)) {
            console.log(`✨ Merging customizations with base template`);
            console.log(`   🔍 Has user HTML: ${!!templateData.html}, length: ${templateData.html?.length || 0}`);
            console.log(`   🔍 Has customizations: ${!!templateData.customizations}, keys: ${templateData.customizations ? Object.keys(templateData.customizations).join(', ') : 'none'}`);
            console.log(`   🔍 isCustomized flag: ${templateData.isCustomized}`);
            templateData = {
              ...baseTemplate,
              ...templateData, // Keep all customizations - this MUST come after baseTemplate to override
              templateId: selectedEmailTemplate,
              // 🔥 CRITICAL: Explicitly preserve user customization flags (FIXED: only true if actually customized)
              isCustomized: !!templateData.isCustomized,  // Only true if user actually customized it
              userSelected: true,
              baseTemplate: baseTemplate // Keep reference to original
            };
            console.log(`   ✅ Merged template isCustomized: ${templateData.isCustomized}, userSelected: ${templateData.userSelected}`);
          } else {
            // No customizations, use base template
            templateData = {
              ...baseTemplate,
              templateId: selectedEmailTemplate,
              isCustomized: false,
              userSelected: true
            };
          }
        } else {
          const errorMsg = `❌ CRITICAL ERROR: Template '${selectedEmailTemplate}' not found in TemplatePromptService`;
          console.error(errorMsg);
          console.error('🔍 Available templates:', Object.keys(TemplatePromptService.templates || {}));
          throw new Error(errorMsg);
        }
      }

      if (templateData) {
        // 🚨 CRITICAL FIX: Ensure templateData has the correct template ID
        if (!templateData.templateId) {
          templateData.templateId = selectedEmailTemplate;
          console.log(`🔧 Added templateId to templateData: ${selectedEmailTemplate}`);
        }

        // Safely handle template data - check if it has required fields
        console.log(`🔍 DEBUG: templateData keys:`, Object.keys(templateData || {}));
        console.log(`🔍 DEBUG: templateData.html length:`, templateData.html?.length || 0);
        console.log(`🔍 DEBUG: templateData.body length:`, templateData.body?.length || 0);
        console.log(`🔍 DEBUG: templateData.isCustomized:`, templateData.isCustomized);

        // 🔥 FIX: Only require subject if template is CUSTOMIZED
        // For default templates, Ollama will generate the subject/content
        if (templateData.isCustomized && !templateData.subject) {
          const errorMsg = `❌ CRITICAL ERROR: Customized template missing subject`;
          console.error(errorMsg);
          console.error('🔍 Template data:');
          console.error(`   - has subject: ${!!templateData.subject}`);
          console.error(`   - has html: ${!!templateData.html}`);
          console.error(`   - has body: ${!!templateData.body}`);
          throw new Error(errorMsg);
        }

        // For default templates, we just need the HTML structure
        if (!templateData.isCustomized && !templateData.html && !templateData.body) {
          const errorMsg = `❌ ERROR: Template missing HTML structure`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        const subject = templateData.subject;
        const html = templateData.html || templateData.body;

        console.log(`🔍 DEBUG: Using html content length:`, html?.length || 0);
        console.log(`🔍 DEBUG: HTML source: ${templateData.html ? 'templateData.html' : 'templateData.body'}`);
        console.log(`🔍 DEBUG: First 200 chars of HTML: ${html?.substring(0, 200) || 'NO HTML'}`);
        console.log(`🔍 DEBUG: templateData.isCustomized: ${templateData.isCustomized}`);

        // ✨ FIXED: Check if this is a component-based template with user components
        if (templateData.components && templateData.components.length > 0) {
          console.log(`🧩 Using COMPONENT-BASED template with ${templateData.components.length} components`);

          // Apply component template with personalized content
          const personalizedResult = await this.applyComponentTemplate(templateData, prospect, userPersona, businessAnalysis);

          // 🔥 FIX: Remove placeholders from generated content
          const cleanedBody = this.removePlaceholders(personalizedResult.body);
          const cleanedSubject = this.removePlaceholders(personalizedResult.subject);

          console.log(`✅ Generated NEW personalized content for ${prospect.company || 'prospect'} using component template`);
          console.log(`📊 Component template result: ${cleanedBody.length} chars`);

          return {
            subject: cleanedSubject,
            body: cleanedBody,
            template: templateData.id || templateData.templateId || 'professional_partnership',
            templateData: templateData,
            personalizationLevel: 'Component Template',
            confidence: 0.95,
            optimization_applied: 'user_template_applied'
          };
        } else {
          // FALLBACK: Use HTML-based template processing
          console.log(`🎨 Using HTML-BASED template processing as fallback`);

          // 🔥 CRITICAL FIX: Check if template is user-customized
          if (templateData.isCustomized) {
            console.log(`✨ Template is user-customized - USING DIRECTLY without AI generation`);
            console.log(`📋 Template ID: ${templateData.id || templateData.templateId || 'unknown'}`);
            console.log(`📄 User HTML length: ${html?.length || 0} characters`);

            // 🔥 FIX: For customized templates, use HTML directly with simple placeholder replacement
            // DO NOT generate AI content - the user already customized the template!
            let personalizedHtml = html
              .replace(/\{\{companyName\}\}/gi, prospect.company || 'Your Company')
              .replace(/\{\{company\}\}/gi, prospect.company || 'Your Company')
              .replace(/\{companyName\}/gi, prospect.company || 'Your Company')
              .replace(/\{company\}/gi, prospect.company || 'Your Company')
              .replace(/\{\{recipientName\}\}/gi, prospect.name || 'there')
              .replace(/\{\{name\}\}/gi, prospect.name || 'there')
              .replace(/\{recipientName\}/gi, prospect.name || 'there')
              .replace(/\{name\}/gi, prospect.name || 'there')
              .replace(/\{\{senderName\}\}/gi, templateData.senderName || 'AI Marketing')
              .replace(/\{senderName\}/gi, templateData.senderName || 'AI Marketing')
              .replace(/\{\{websiteUrl\}\}/gi, businessAnalysis?.websiteUrl || templateData.companyWebsite || 'https://example.com')
              .replace(/\{websiteUrl\}/gi, businessAnalysis?.websiteUrl || templateData.companyWebsite || 'https://example.com')
              .replace(/\{\{ctaUrl\}\}/gi, templateData.ctaUrl || businessAnalysis?.websiteUrl || 'https://example.com')
              .replace(/\{ctaUrl\}/gi, templateData.ctaUrl || businessAnalysis?.websiteUrl || 'https://example.com')
              .replace(/\{\{ctaText\}\}/gi, templateData.ctaText || 'Learn More')
              .replace(/\{ctaText\}/gi, templateData.ctaText || 'Learn More');

            // Generate personalized subject line
            const personalizedSubject = subject || `${prospect.company || 'Partnership Opportunity'} - ${this.generatePersonalizedSubjectLine(prospect, userPersona)}`;

            // 🔥 CRITICAL FIX: For user-customized templates, DO NOT run removePlaceholders on HTML
            // This function strips whitespace and breaks HTML structure that users carefully designed
            // Only clean the subject line to remove bracketed placeholders like [Name], [Company]
            const cleanedSubject = this.removePlaceholders(personalizedSubject);

            console.log(`✅ User customized template used directly (no AI generation)`);
            console.log(`📊 Preserving user's HTML exactly as customized: ${html.length} chars`);
            console.log(`📧 Subject: ${cleanedSubject}`);

            return {
              subject: cleanedSubject,
              body: personalizedHtml, // Use personalizedHtml directly, NOT cleanedHtml
              template: templateData.id || templateData.templateId || 'user_template',
              templateData: templateData,
              personalizationLevel: 'User Customized (No AI)',
              confidence: 0.95,
              optimization_applied: 'user_customizations_applied'
            };
          }

          // 🎯 FOR NON-CUSTOMIZED TEMPLATES - Generate AI content with Ollama
          // If we reach here, template is NOT customized, so generate AI content
          if (true) {  // 🔥 FIX: Enable AI generation for default templates
            console.log(`🎨 Using DEFAULT template - generating AI content with Ollama`);
            console.log(`📋 Template ID: ${templateData.id || templateData.templateId || 'unknown'}`);

            // Step 1: Get template-specific Ollama prompt
            const TemplatePromptService = require('../services/TemplatePromptService');
            const templateId = templateData.id || templateData.templateId || 'professional_partnership';

            console.log(`🎨 Using template-specific prompt for: ${templateId}`);

            // Get the base template to access its ollamaPrompt
            const baseTemplate = TemplatePromptService.getTemplate(templateId);

            let emailContentPrompt;
            if (baseTemplate && baseTemplate.ollamaPrompt) {
              console.log(`✅ Found template-specific Ollama prompt for ${baseTemplate.name}`);

              // Use the template's custom prompt and replace placeholders
              emailContentPrompt = baseTemplate.ollamaPrompt
                .replace(/\{senderName\}/g, templateData.senderName || businessAnalysis?.companyName || 'Our Company')
                .replace(/\{companyName\}/g, businessAnalysis?.companyName || templateData.companyName || 'Our Company')
                .replace(/\{recipientName\}/g, prospect.name || 'there')
                .replace(/\{company\}/g, prospect.company || 'your company')
                .replace(/\{title\}/g, prospect.role || prospect.position || 'team member')
                .replace(/\{industry\}/g, prospect.industry || businessAnalysis?.industry || 'your industry');

              // Add persona context to the prompt
              emailContentPrompt = `${emailContentPrompt}

PERSONA CONTEXT for ${prospect.name || 'recipient'}:
- Type: ${userPersona?.type || 'Professional'}
- Communication Style: ${userPersona?.communicationStyle || 'Professional'}
- Decision Level: ${userPersona?.decisionLevel || 'Medium'}
${userPersona?.painPoints ? `- Pain Points: ${userPersona.painPoints.join(', ')}` : ''}

BUSINESS CONTEXT:
- Our Company: ${businessAnalysis?.companyName || templateData.companyName || 'Our Company'}
- Industry: ${businessAnalysis?.industry || 'Technology'}
- Value Proposition: ${businessAnalysis?.valueProposition || 'innovative solutions'}
- Website: ${businessAnalysis?.websiteUrl || templateData.companyWebsite || 'https://example.com'}

Remember: Write ONLY the email content. Make it feel like ${templateData.senderName || 'you'} personally wrote it for ${prospect.name || 'them'} at ${prospect.company || 'their company'}.`;

            } else {
              console.log(`⚠️ No template-specific prompt found, using generic prompt`);
              // Fallback to generic prompt if template-specific not found
              emailContentPrompt = `Write a professional, personalized email to ${prospect.name || 'the recipient'} at ${prospect.company || 'their company'}.

Context:
- Recipient: ${prospect.name || 'N/A'}
- Company: ${prospect.company || 'N/A'}
- Role: ${prospect.role || prospect.position || 'N/A'}
- Sender: ${templateData.senderName || 'Our Company'}
- Persona Type: ${userPersona?.type || 'Professional'}
- Communication Style: ${userPersona?.communicationStyle || 'Professional'}

Business Context:
- Company: ${businessAnalysis?.companyName || templateData.companyName || 'Our Company'}
- Industry: ${businessAnalysis?.industry || 'Technology'}
- Value Proposition: ${businessAnalysis?.valueProposition || 'innovative solutions'}

Requirements:
1. Write a warm, personalized greeting
2. Explain why you're reaching out (reference their company/role)
3. Present the value proposition clearly
4. Include a clear call-to-action
5. Professional closing
6. Keep it concise (200-300 words)
7. Make it feel personal, not templated

Generate ONLY the email body text (no subject line, no placeholders). Make it feel like a real person wrote it specifically for ${prospect.name || 'them'}.`;
            }

            // Step 2: Generate personalized email content using Ollama with template-specific prompt
            console.log(`🤖 Generating personalized email content for ${prospect.company || prospect.name}`);

            let generatedContent = '';
            try {
              generatedContent = await this.callOllama(emailContentPrompt, 'email', { temperature: 0.8 });
              console.log(`✅ Generated ${generatedContent.length} characters of personalized content`);
            } catch (error) {
              console.error(`❌ Failed to generate content with Ollama:`, error.message);
              // Fallback to simple content
              generatedContent = `Hi ${prospect.name || 'there'},\n\nI hope this email finds you well. I'm reaching out from ${templateData.companyName || businessAnalysis?.companyName || 'our company'} because I believe we could help ${prospect.company || 'your organization'} achieve its goals.\n\n${businessAnalysis?.valueProposition || 'We provide innovative solutions that drive results.'}\n\nWould you be interested in a brief conversation to explore how we might work together?\n\nBest regards,\n${templateData.senderName || 'The Team'}`;
            }

            // Step 2: Use user's HTML template and insert the generated content
            let personalizedHtml = html;

            // Helper function to convert markdown to HTML
            const markdownToHtml = (text) => {
              return text
                // Bold text: **text** or __text__ -> <strong>text</strong>
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.+?)__/g, '<strong>$1</strong>')
                // Italic text: *text* or _text_ -> <em>text</em>
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/_(.+?)_/g, '<em>$1</em>')
                // Remove stray ** or __ that weren't matched
                .replace(/\*\*/g, '')
                .replace(/__/g, '');
            };

            // First, replace any content generation placeholders with the AI-generated content
            const contentPlaceholders = personalizedHtml.match(/\[GENERATED CONTENT[^\]]*\]/gi);
            if (contentPlaceholders && contentPlaceholders.length > 0) {
              console.log(`📝 Found ${contentPlaceholders.length} content placeholders to replace`);

              // Split the generated content into separate paragraphs
              // Try different splitting strategies
              let contentParagraphs = [];

              // Strategy 1: Split by double newlines
              let rawParagraphs = generatedContent.split(/\n\s*\n/).filter(p => p.trim());

              // Strategy 2: If we got too few paragraphs, try splitting by single newlines
              if (rawParagraphs.length < contentPlaceholders.length) {
                rawParagraphs = generatedContent.split(/\n/).filter(p => p.trim() && p.length > 30);
              }

              // Strategy 3: If still too few, split into roughly equal parts
              if (rawParagraphs.length < contentPlaceholders.length) {
                const sentences = generatedContent.match(/[^.!?]+[.!?]+/g) || [generatedContent];
                const sentencesPerParagraph = Math.ceil(sentences.length / contentPlaceholders.length);
                rawParagraphs = [];
                for (let i = 0; i < contentPlaceholders.length; i++) {
                  const start = i * sentencesPerParagraph;
                  const end = start + sentencesPerParagraph;
                  const para = sentences.slice(start, end).join(' ').trim();
                  if (para) rawParagraphs.push(para);
                }
              }

              // Clean and convert markdown to HTML for each paragraph
              contentParagraphs = rawParagraphs.slice(0, contentPlaceholders.length).map(para => {
                // Remove leading/trailing whitespace and clean up
                let cleaned = para.trim()
                  .replace(/^[-*•]\s+/, '') // Remove bullet points at start
                  .replace(/^\d+\.\s+/, '') // Remove numbered list markers at start
                  .trim();

                // Convert markdown to HTML
                cleaned = markdownToHtml(cleaned);

                return cleaned;
              });

              // Ensure we have enough paragraphs (pad with generic content if needed)
              while (contentParagraphs.length < contentPlaceholders.length) {
                contentParagraphs.push("We believe there's great potential for collaboration between our organizations.");
              }

              console.log(`✅ Split content into ${contentParagraphs.length} paragraphs for ${contentPlaceholders.length} placeholders`);

              // Replace each placeholder with its corresponding paragraph
              contentPlaceholders.forEach((placeholder, index) => {
                const paragraphContent = contentParagraphs[index] || contentParagraphs[0];
                personalizedHtml = personalizedHtml.replace(placeholder, paragraphContent);
                console.log(`   ✅ Replaced placeholder ${index + 1}: ${placeholder.substring(0, 50)}... with ${paragraphContent.substring(0, 50)}...`);
              });
            } else {
              // If no placeholders found, try to insert content into common patterns
              console.log(`📝 No content placeholders found, looking for insertion points`);

              // Try to find and replace common content areas
              const bodyRegex = /<p[^>]*>.*?<\/p>/gi;
              const paragraphs = personalizedHtml.match(bodyRegex);
              if (paragraphs && paragraphs.length > 0) {
                // Convert generated content to HTML paragraphs
                const htmlContent = generatedContent.split('\n\n').map(para =>
                  `<p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 16px 0;">${para.trim()}</p>`
                ).join('\n');

                // Replace the first significant paragraph (usually the main content)
                let replaced = false;
                for (let i = 0; i < paragraphs.length; i++) {
                  if (paragraphs[i].length > 50 && !paragraphs[i].includes('unsubscribe')) {
                    personalizedHtml = personalizedHtml.replace(paragraphs[i], htmlContent);
                    replaced = true;
                    console.log(`   ✅ Inserted AI content into paragraph ${i + 1}`);
                    break;
                  }
                }
                if (!replaced) {
                  console.log(`   ⚠️ Could not find suitable insertion point, appending content`);
                }
              }
            }

            // Step 3: Replace all variable placeholders with actual values
            personalizedHtml = personalizedHtml
              .replace(/\{\{companyName\}\}/gi, prospect.company || 'Your Company')
              .replace(/\{\{company\}\}/gi, prospect.company || 'Your Company')
              .replace(/\{companyName\}/gi, prospect.company || 'Your Company')
              .replace(/\{company\}/gi, prospect.company || 'Your Company')
              .replace(/\{\{recipientName\}\}/gi, prospect.name || 'there')
              .replace(/\{\{name\}\}/gi, prospect.name || 'there')
              .replace(/\{recipientName\}/gi, prospect.name || 'there')
              .replace(/\{name\}/gi, prospect.name || 'there')
              .replace(/\{\{senderName\}\}/gi, templateData.senderName || 'AI Marketing')
              .replace(/\{senderName\}/gi, templateData.senderName || 'AI Marketing')
              .replace(/\{\{websiteUrl\}\}/gi, businessAnalysis?.websiteUrl || templateData.companyWebsite || 'https://example.com')
              .replace(/\{websiteUrl\}/gi, businessAnalysis?.websiteUrl || templateData.companyWebsite || 'https://example.com')
              .replace(/\{\{ctaUrl\}\}/gi, templateData.ctaUrl || businessAnalysis?.websiteUrl || 'https://example.com')
              .replace(/\{ctaUrl\}/gi, templateData.ctaUrl || businessAnalysis?.websiteUrl || 'https://example.com')
              .replace(/\{\{ctaText\}\}/gi, templateData.ctaText || 'Learn More')
              .replace(/\{ctaText\}/gi, templateData.ctaText || 'Learn More');

            // Step 4: Generate personalized subject line
            const personalizedSubject = subject || `${prospect.company || 'Partnership Opportunity'} - ${this.generatePersonalizedSubjectLine(prospect, userPersona)}`;

            // 🔥 FIX: Remove placeholders from generated content
            const cleanedHtml = this.removePlaceholders(personalizedHtml);
            const cleanedSubject = this.removePlaceholders(personalizedSubject);

            console.log(`✅ User template processed with AI-generated content`);
            console.log(`📊 Original HTML: ${html.length} chars → Final HTML: ${cleanedHtml.length} chars`);
            console.log(`📧 Subject: ${cleanedSubject}`);

            return {
              subject: cleanedSubject,
              body: cleanedHtml,
              template: templateData.id || templateData.templateId || 'user_template',
              templateData: templateData,
              personalizationLevel: 'AI + User Template',
              confidence: 0.95,
              optimization_applied: 'ai_content_in_user_template'
            };
          }

          // Generate personalized subject
          const personalizedSubject = `${prospect.company || 'Partnership Opportunity'} - ${this.generatePersonalizedSubjectLine(prospect, userPersona)}`;

          // Extract content blocks from template to understand structure
          const contentBlocks = this.extractContentBlocks(html);
          console.log(`📋 Extracted ${contentBlocks.length} content blocks from template`);

          // Generate NEW personalized content for each block using AI
          const personalizedBlocks = await this.generatePersonalizedBlocks(contentBlocks, prospect, userPersona, businessAnalysis);

          // Reconstruct HTML with same structure but new personalized content
          let personalizedHtml = this.reconstructHTMLWithPersonalizedContent(html, contentBlocks, personalizedBlocks);

          // Final placeholder replacement for any remaining template variables
          personalizedHtml = personalizedHtml
            .replace(/\{+companyName\}+/gi, prospect.company || 'Your Company')
            .replace(/\{+company\}+/gi, prospect.company || 'Your Company')  // 🔥 Add simple {company}
            .replace(/\{+recipientName\}+/gi, prospect.name || 'there')
            .replace(/\{+name\}+/gi, prospect.name || 'there')  // 🔥 Add simple {name}
            .replace(/\{+senderName\}+/gi, templateData.senderName || 'AI Marketing')
            .replace(/\{+websiteUrl\}+/gi, businessAnalysis?.websiteUrl || 'https://example.com');

          // 🔥 FIX: Remove placeholders from generated content
          const cleanedHtml = this.removePlaceholders(personalizedHtml);
          const cleanedSubject = this.removePlaceholders(personalizedSubject);

          console.log(`✅ Generated NEW personalized content for ${prospect.company || 'prospect'} using HTML template structure`);
          console.log(`📊 Template HTML length: ${html.length} → Personalized HTML length: ${cleanedHtml.length}`);

          return {
            subject: cleanedSubject,
            body: cleanedHtml,
            template: 'user_template',
            templateData: templateData,
            personalizationLevel: 'HTML Template',
            confidence: 0.85,
            optimization_applied: 'html_template_applied'
          };
        }
      }
      
      // 🚫 REMOVED: No more automatic template selection - workflow should pause instead
      if (!selectedEmailTemplate || selectedEmailTemplate === 'null') {
        console.log(`❌ No template selected - this should not happen as workflow should pause for template selection`);
        throw new Error('No email template provided - workflow should have paused for template selection');
      }
      
      const enhancedProspect = {
        ...prospect,
        persona: userPersona,
        preferredTemplate: selectedEmailTemplate, // Use selected or random fancy template
        templateData: templateData,
        variationIndex: sequenceIndex, // Use sequence index for variation
        aiProfile: {
          ...prospect.aiProfile,
          communicationStyle: userPersona.communicationStyle,
          painPoints: userPersona.painPoints,
          decisionFactors: userPersona.decisionFactors
        }
      };
      
      // Generate email using PersonalizedEmailGenerator
      const emailResult = await generator.generatePersonalizedEmail(
        {
          ...enhancedProspect,
          sequenceIndex: sequenceIndex  // Pass the sequence index
        },
        businessAnalysis,
        marketingStrategy,
        marketingStrategy.campaign_objectives?.primary_goal || 'partnership',
        templateData  // 🎨 Pass custom template data
      );
      
      if (!emailResult || !emailResult.success || !emailResult.email) {
        throw new Error('PersonalizedEmailGenerator failed: ' + (emailResult?.error || 'No email generated'));
      }
      
      // Extract the actual email content from the result
      const email = emailResult.email;
      
      // 🧹 HTML-compatible email content - PersonalizedEmailGenerator now guarantees HTML compatibility  
      let emailContent = {
        subject: email.subject || `Partnership Opportunity with ${businessAnalysis?.companyName || 'Our Company'}`,
        body: email.body || email.content || 'Personalized email content not generated',
        template: email.template_used || email.templateType || 'custom'
      };
      
      // 🛡️ Final safety check: PersonalizedEmailGenerator should have already cleaned everything
      // But we add one final layer of protection
      if (emailContent.body && (emailContent.body.includes('[') || emailContent.body.includes('{{'))) {
        console.log(`   ⚠️ 检测到残留占位符，进行最终清理...`);
        emailContent.body = emailContent.body
          .replace(/\[Your Name\]/gi, templateData?.senderName || 'Team')
          .replace(/\[.*?\]/g, '') // Remove ALL bracketed placeholders
          .replace(/\{\{.*?\}\}/g, ''); // Remove template literals
      }

      if (emailContent.subject && (emailContent.subject.includes('[') || emailContent.subject.includes('{{'))) {
        console.log(`   ⚠️ 主题行检测到占位符，进行清理...`);
        emailContent.subject = emailContent.subject
          .replace(/\[.*?\]/g, '') // Remove bracketed placeholders
          .replace(/\{\{.*?\}\}/g, '') // Remove template literals
          .trim() || 'Partnership Opportunity'; // Fallback if empty
      }
      
      // 🎨 HTML模板应用 - PersonalizedEmailGenerator应该已经提供HTML，但确保兼容性
      if (emailContent.body && !emailContent.body.includes('<html') && !emailContent.body.includes('<div')) {
        console.log(`   🎨 应用HTML模板包装...`);
        // Apply minimal HTML wrapper for plain text content
        // Convert plain text to HTML
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; }
        .content { padding: 30px; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Partnership Opportunity</h1>
    </div>
    <div class="content">
        ${emailContent.body.replace(/\n/g, '<br>')}
        <p style="margin-top: 30px;">
            <a href="mailto:${templateData?.senderEmail || 'contact@company.com'}" class="button">Get in Touch</a>
        </p>
    </div>
</body>
</html>`;
        
        emailContent.body = htmlBody;
        emailContent.content_type = 'html';
      }
      
      return {
        subject: emailContent.subject,
        body: emailContent.body,
        template: emailContent.template,
        personalization_score: email.personalizationScore || 0.7,
        aiGenerated: true,
        generatedBy: 'PersonalizedEmailGenerator',
        persona: userPersona,
        optimization: emailOptimization
      };
      
    } catch (error) {
      console.error(`Error generating personalized email with persona:`, error.message);

      // 🎯 CRITICAL FIX: Use campaign-selected template in fallback
      let fallbackTemplateData = templateData;
      let fallbackTemplateType = emailTemplate;

      if (this.state.selectedCampaignTemplate && this.state.selectedCampaignTemplate.templateId) {
        console.log(`🎯 [FALLBACK] Using campaign-selected template: ${this.state.selectedCampaignTemplate.templateId}`);
        fallbackTemplateType = this.state.selectedCampaignTemplate.templateId;
        fallbackTemplateData = this.state.selectedCampaignTemplate.templateData;
        console.log(`   ✨ Has customizations: ${fallbackTemplateData?.isCustomized || false}`);
        console.log(`   🧩 Has components: ${fallbackTemplateData?.components ? fallbackTemplateData.components.length : 0}`);
      }

      // Fallback to direct Ollama generation with template parameters
      return await this.generateOptimizedEmailContent(prospect, marketingStrategy, emailOptimization, businessAnalysis, fallbackTemplateType, fallbackTemplateData);
    }
  }

  /**
   * Send email using SMTP configuration
   */
  async sendEmail({ to, subject, body, prospect, campaignId, smtpConfig = null }) {
    try {
      console.log(`📧 Sending email to ${to}: "${subject}"`);

      // 🎯 NEW: Check for Gmail OAuth first
      const userId = this.userId || 'anonymous';
      let emailConfig = null;
      let usingOAuth = false;

      try {
        const GmailOAuthService = require('../services/GmailOAuthService');
        const oauthConfig = await GmailOAuthService.getSMTPConfigWithOAuth(userId);

        if (oauthConfig) {
          console.log('🔐 Using Gmail OAuth for email sending');
          emailConfig = oauthConfig;
          usingOAuth = true;
        }
      } catch (oauthError) {
        console.log(`⚠️ OAuth not available: ${oauthError.message}`);
        // Continue to use password auth
      }

      // Use provided SMTP config or fall back to environment variables (if no OAuth)
      if (!emailConfig) {
        emailConfig = smtpConfig || {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        };
      }

      // Fix common SMTP configuration issues from frontend (only for non-OAuth configs)
      if (!usingOAuth && smtpConfig) {
        console.log('🔧 Processing frontend SMTP config...');
        console.log('   Raw smtpConfig keys:', Object.keys(smtpConfig));
        
        // Transform frontend config to proper nodemailer format
        emailConfig = {
          host: smtpConfig.host || 'smtp.gmail.com',
          port: parseInt(smtpConfig.port || '587'),
          secure: smtpConfig.secure === true,
          connectionTimeout: 90000, // 90 seconds (increased for Railway network latency)
          greetingTimeout: 90000,   // 90 seconds (increased for Railway network latency)
          socketTimeout: 120000,    // 120 seconds (increased for Railway network latency)
          auth: {
            user: smtpConfig.auth?.user || smtpConfig.username || smtpConfig.email,
            pass: smtpConfig.auth?.pass || smtpConfig.password || smtpConfig.pass
          },
          pool: true,               // Enable connection pooling
          maxConnections: 1,        // Limit concurrent connections
          maxMessages: 1            // Limit messages per connection
        };
        
        console.log('   Transformed auth.user:', emailConfig.auth.user);
        console.log('   Transformed auth.pass:', emailConfig.auth.pass ? 'Present' : 'Missing');
      }
      
      if (emailConfig.auth?.user && typeof emailConfig.auth.user === 'string') {
        // Fix case where URL is mistakenly used as username
        if (emailConfig.auth.user.startsWith('http')) {
          console.log('🔧 Fixing SMTP username: URL detected, using environment fallback');
          emailConfig.auth.user = process.env.SMTP_USER || 'fruitaiofficial@gmail.com';
        }
        // Fix case where website domain is used instead of email
        if (emailConfig.auth.user.includes('.') && !emailConfig.auth.user.includes('@')) {
          console.log('🔧 Fixing SMTP username: Domain detected, converting to email');
          const domain = emailConfig.auth.user.replace(/^https?:\/\//, '').replace(/\/$/, '');
          // Use environment variable or construct email from domain
          emailConfig.auth.user = process.env.SMTP_USER || `hello@${domain}`;
        }
      }
      
      console.log(`📧 Using SMTP config: ${usingOAuth ? 'Gmail OAuth' : (smtpConfig ? 'Frontend provided' : 'Environment variables')}`);
      console.log(`📧 SMTP Host: ${emailConfig.host}`);
      console.log(`📧 SMTP User: ${emailConfig.auth?.user || 'Not configured'}`);
      console.log(`📧 Auth Type: ${emailConfig.auth?.type || 'password'}`);

      // Additional validation for common issues (skip for OAuth)
      if (!usingOAuth && emailConfig.auth?.user) {
        if (emailConfig.auth.user.startsWith('http')) {
          console.warn('⚠️  SMTP username looks like a URL - this will cause authentication to fail');
        } else if (!emailConfig.auth.user.includes('@')) {
          console.warn('⚠️  SMTP username should be an email address (e.g., user@gmail.com)');
        } else {
          console.log('✅ SMTP username format looks correct');
        }
      }

      // Validate SMTP configuration (skip password check for OAuth)
      if (!usingOAuth) {
        if (!emailConfig.auth || !emailConfig.auth.user || !emailConfig.auth.pass) {
          console.warn('⚠️ SMTP credentials not configured, email sending disabled');
          console.log('🔑 To fix this:');
          console.log('   1. Enable 2-Factor Authentication on Gmail');
          console.log('   2. Generate App Password: https://myaccount.google.com/apppasswords');
          console.log('   3. Set GMAIL_APP_PASSWORD environment variable with the App Password');
          console.log('   OR: Connect Gmail with OAuth in Settings');
          return {
            success: false,
            error: 'SMTP credentials not configured - Need Gmail App Password or OAuth',
            mode: 'disabled'
          };
        }
      }
      
      // Create a hash of SMTP config to check if we have a cached transporter
      // 🔥 FIX: Include password/token hash in cache key to detect credential changes
      const crypto = require('crypto');
      let configHash;
      if (usingOAuth) {
        // For OAuth, use accessToken hash as cache key
        const tokenHash = emailConfig.auth?.accessToken ?
          crypto.createHash('md5').update(emailConfig.auth.accessToken).digest('hex').substring(0, 8) :
          'notoken';
        configHash = `oauth:${emailConfig.host}:${emailConfig.auth?.user}:${tokenHash}`;
      } else {
        // For password auth, use password hash as cache key
        const passwordHash = emailConfig.auth?.pass ?
          crypto.createHash('md5').update(emailConfig.auth.pass).digest('hex').substring(0, 8) :
          'nopass';
        configHash = `${emailConfig.host}:${emailConfig.port}:${emailConfig.auth?.user}:${passwordHash}`;
      }
      const now = Date.now();

      // Get or create transporter
      let transporter = this.state.smtpTransporters.get(configHash);
      const lastVerified = this.state.smtpVerifiedConfigs.get(configHash);

      // Create new transporter if we don't have one cached or it's been more than 5 minutes
      // 🔥 FIX: Reduced cache time from 1 hour to 5 minutes to catch config updates faster
      if (!transporter || !lastVerified || (now - lastVerified) > 5 * 60 * 1000) {
        console.log('🔧 Creating new SMTP transporter with connection pooling...');

        // Add connection pool configuration to prevent rate limiting
        transporter = nodemailer.createTransport({
          ...emailConfig,
          pool: true, // Use pooled connections
          maxConnections: 1, // Limit concurrent connections to avoid rate limiting
          maxMessages: 100, // Max messages per connection
          rateDelta: 1000, // Wait 1 second between messages
          rateLimit: 1, // Send 1 message per rateDelta
          connectionTimeout: 60000, // 60 second connection timeout (increased from 10s)
          greetingTimeout: 60000, // 60 second greeting timeout (increased from 10s)
          socketTimeout: 120000 // 120 second socket timeout (increased from 30s)
        });

        // Skip verify() - Gmail often blocks it but still allows sending
        // We'll verify the connection works when we actually send
        console.log('✅ SMTP transporter created (skipping verification to avoid timeout)');

        // Cache transporter and timestamp
        this.state.smtpTransporters.set(configHash, transporter);
        this.state.smtpVerifiedConfigs.set(configHash, now);
      } else {
        console.log('✅ Using cached SMTP transporter (created', Math.floor((now - lastVerified) / 1000), 'seconds ago)');
      }
      
      // Email options - Use sender name and email from template data or SMTP config
      const senderName = prospect.templateData?.senderName || smtpConfig?.senderName || process.env.SENDER_NAME || emailConfig.auth.user.split('@')[0];
      const senderEmail = prospect.templateData?.senderEmail || smtpConfig?.auth?.user || emailConfig.auth.user;
      
      console.log(`🔧 DEBUG: Email sender details - Name: "${senderName}", Email: "${senderEmail}"`);
      console.log(`🔧 DEBUG: Email body length: ${body?.length || 0} chars`);
      console.log(`🔧 DEBUG: Email body preview: ${body ? body.substring(0, 200) + '...' : 'No body content'}`);
      console.log(`🔧 DEBUG: Email body contains HTML tags: ${body ? (body.includes('<html>') || body.includes('<div') || body.includes('<table')) : false}`);
      console.log(`🔧 DEBUG: Email body is premium content: ${body && body.length > 1000 ? 'YES' : 'NO'}`);

      // Check if body is undefined or empty
      if (!body || body.length === 0) {
        console.log(`🚨 ERROR: Email body is undefined or empty!`);
        throw new Error('Email body is undefined or empty - cannot send email');
      }

      // Log the complete body for debugging if it's unexpectedly short
      if (body.length < 500) {
        console.log(`🚨 WARNING: Email body is suspiciously short (${body.length} chars):`);
        console.log(body);
      }
      
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: to,
        subject: subject,
        html: body, // Primary content as HTML
        // Remove text version to ensure HTML is displayed
        headers: {
          'X-Campaign-ID': campaignId,
          'X-Prospect-ID': prospect.id || prospect.email,
          'X-Generated-By': 'LangGraph-Marketing-Agent',
          'Content-Type': 'text/html; charset=UTF-8'
        }
      };
      
      // Log what we're sending to nodemailer
      console.log(`🔧 DEBUG: Sending via nodemailer with options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlLength: mailOptions.html?.length || 0,
        htmlPreview: mailOptions.html ? mailOptions.html.substring(0, 150) + '...' : 'No HTML content',
        hasHeaders: !!mailOptions.headers
      });
      
      // Send email with retry logic and exponential backoff
      let sendAttempts = 0;
      const maxSendAttempts = 3;
      let info;

      while (sendAttempts < maxSendAttempts) {
        try {
          console.log(`📤 Sending email attempt ${sendAttempts + 1}/${maxSendAttempts}...`);
          info = await transporter.sendMail(mailOptions);
          console.log(`✅ Email sent successfully on attempt ${sendAttempts + 1}`);
          break;
        } catch (sendError) {
          sendAttempts++;
          console.error(`❌ Email send failed (attempt ${sendAttempts}/${maxSendAttempts}):`, sendError.message);
          console.error(`❌ Error code: ${sendError.code}, Command: ${sendError.command}`);

          if (sendAttempts >= maxSendAttempts) {
            throw sendError; // Final failure
          } else {
            // Exponential backoff: 5s, 15s, 30s
            const backoffDelay = sendAttempts === 1 ? 5000 : sendAttempts === 2 ? 15000 : 30000;
            console.log(`⏳ Retrying email send in ${backoffDelay / 1000} seconds (exponential backoff)...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // Enhanced debugging of SMTP response
      console.log(`🔧 DEBUG: SMTP Response Details:`, {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        pending: info.pending,
        envelope: info.envelope
      });
      
      // Check if email was actually accepted by Gmail
      if (info.accepted && info.accepted.length > 0) {
        console.log(`✅ Email ACTUALLY sent to ${to}:`, info.messageId);
        console.log(`📧 Accepted by Gmail:`, info.accepted);
        console.log(`📧 Response from Gmail:`, info.response);
        console.log(`🔧 DEBUG: Email content successfully delivered - ${mailOptions.html?.length || 0} chars HTML content sent`);

        // Log to database
        try {
          const db = require('../models/database');
          await db.logEmailSent({
            to: to,
            subject: subject,
            campaignId: campaignId || 'unknown',
            messageId: info.messageId,
            status: 'sent',
            error: null,
            recipientIndex: 0,
            sentAt: new Date().toISOString()
          });
          console.log('📊 Email logged to database');
        } catch (dbError) {
          console.error('Database logging error:', dbError.message);
        }
      } else {
        console.warn(`⚠️ Email NOT accepted by Gmail for ${to}`);
        console.log(`📧 Rejected:`, info.rejected);
        console.log(`📧 Response:`, info.response);

        // Log failed email to database
        try {
          const db = require('../models/database');
          await db.logEmailSent({
            to: to,
            subject: subject,
            campaignId: campaignId || 'unknown',
            messageId: info.messageId,
            status: 'failed',
            error: info.rejected ? info.rejected.join(', ') : 'Email rejected',
            recipientIndex: 0,
            sentAt: new Date().toISOString()
          });
          console.log('📊 Failed email logged to database');
        } catch (dbError) {
          console.error('Database logging error:', dbError.message);
        }
      }

      return {
        success: info.accepted && info.accepted.length > 0,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        sentAt: new Date().toISOString()
      };
      
    } catch (error) {
      // Ensure we always have a meaningful error message
      const errorMessage = error.message || error.toString() || 'Unknown email sending error';
      console.error(`❌ Failed to send email to ${to}:`, errorMessage);

      // Log failed email to database
      try {
        const db = require('../models/database');
        await db.logEmailSent({
          to: to,
          subject: subject,
          campaignId: campaignId || 'unknown',
          messageId: null,
          status: 'failed',
          error: errorMessage,
          recipientIndex: 0,
          sentAt: new Date().toISOString()
        });
        console.log('📊 Failed email logged to database');
      } catch (dbError) {
        console.error('Database logging error:', dbError.message);
      }

      // Provide specific guidance for authentication errors
      if (error.code === 'EAUTH') {
        console.log('🔑 GMAIL AUTHENTICATION ERROR DETECTED:');
        console.log('   The current issue is Gmail authentication failure.');
        console.log('   📧 Gmail is rejecting the credentials with error: Username and Password not accepted');
        console.log('   ');
        console.log('   🛠️  TO FIX THIS:');
        console.log('   1. ✅ Enable 2-Factor Authentication on your Gmail account');
        console.log('   2. ✅ Go to: https://myaccount.google.com/apppasswords');
        console.log('   3. ✅ Generate a new App Password (16-character password)');
        console.log('   4. ✅ Set the App Password in your frontend SMTP settings');
        console.log('   5. ✅ Use the App Password (not your regular Gmail password)');
        console.log('   ');
        console.log('   📝 The system is connecting to Gmail SMTP successfully,');
        console.log('      but authentication is failing due to missing App Password.');
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code,
        sentAt: new Date().toISOString(),
        authenticationGuidance: error.code === 'EAUTH' ? 'Gmail App Password required' : null
      };
    }
  }

  /**
   * 🔄 启动连续运行模式
   */
  startContinuousMode(campaignConfig) {
    if (this.state.continuousMode.isRunning) {
      console.log('⚠️ Continuous mode is already running');
      return { success: false, message: 'Already running' };
    }

    this.state.continuousMode.isRunning = true;
    this.state.continuousMode.isPaused = false;
    this.state.continuousMode.startTime = new Date();
    this.state.continuousMode.searchCriteria = campaignConfig;
    
    console.log('🔄 Starting continuous campaign mode...');
    
    // 启动连续执行循环
    this.continuousExecutionLoop();
    
    if (this.wsManager) {
      this.wsManager.sendNotification('🔄 连续运行模式启动', 'info');
    }
    
    return { success: true, message: 'Continuous mode started' };
  }

  /**
   * ⏸️ 暂停连续运行模式
   */
  pauseContinuousMode() {
    if (!this.state.continuousMode.isRunning) {
      return { success: false, message: 'Not running' };
    }

    this.state.continuousMode.isPaused = true;
    this.state.continuousMode.pauseTime = new Date();
    
    console.log('⏸️ Continuous mode paused');
    
    if (this.wsManager) {
      this.wsManager.sendNotification('⏸️ 连续运行模式已暂停', 'warning');
    }
    
    return { success: true, message: 'Continuous mode paused' };
  }

  /**
   * ▶️ 恢复连续运行模式
   */
  resumeContinuousMode() {
    if (!this.state.continuousMode.isRunning || !this.state.continuousMode.isPaused) {
      return { success: false, message: 'Cannot resume - not paused' };
    }

    this.state.continuousMode.isPaused = false;
    this.state.continuousMode.pauseTime = null;
    
    console.log('▶️ Continuous mode resumed');
    
    if (this.wsManager) {
      this.wsManager.sendNotification('▶️ 连续运行模式已恢复', 'success');
    }
    
    // 继续执行循环
    this.continuousExecutionLoop();
    
    return { success: true, message: 'Continuous mode resumed' };
  }

  /**
   * ⏹️ 停止连续运行模式
   */
  stopContinuousMode() {
    this.state.continuousMode.isRunning = false;
    this.state.continuousMode.isPaused = false;
    this.state.continuousMode.pauseTime = null;
    
    console.log('⏹️ Continuous mode stopped');
    
    if (this.wsManager) {
      this.wsManager.sendNotification('⏹️ 连续运行模式已停止', 'info');
    }
    
    return { success: true, message: 'Continuous mode stopped' };
  }

  /**
   * 🔄 连续执行循环
   */
  async continuousExecutionLoop() {
    while (this.state.continuousMode.isRunning && !this.state.continuousMode.isPaused) {
      try {
        this.state.continuousMode.cycleCount++;
        const cycleId = `cycle_${this.state.continuousMode.cycleCount}`;
        
        console.log(`🔄 Starting continuous cycle ${this.state.continuousMode.cycleCount}...`);
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('continuous_mode', `🔄 Starting cycle ${this.state.continuousMode.cycleCount}`, 'info');
        }
        
        // 执行一个完整的营销活动循环
        const result = await this.executeCampaign(this.state.continuousMode.searchCriteria);
        
        // 记录使用过的邮件地址以防重复
        if (result.prospects) {
          result.prospects.forEach(prospect => {
            if (prospect.email) {
              this.state.continuousMode.usedEmails.add(prospect.email.toLowerCase());
            }
          });
        }
        
        // 保存循环历史
        this.state.continuousMode.campaignHistory.push({
          cycleId,
          timestamp: new Date(),
          results: {
            prospectsFound: result.prospects?.length || 0,
            emailsGenerated: result.emailCampaign?.emails?.length || 0,
            success: result.emailCampaign?.success || false
          }
        });
        
        // 限制历史记录数量
        if (this.state.continuousMode.campaignHistory.length > 50) {
          this.state.continuousMode.campaignHistory = this.state.continuousMode.campaignHistory.slice(-50);
        }
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('continuous_mode', `✅ Cycle ${this.state.continuousMode.cycleCount} completed - ${result.prospects?.length || 0} prospects, ${result.emailCampaign?.emails?.length || 0} emails`, 'success');
          
          // 更新连续模式状态到前端
          this.wsManager.broadcast({
            type: 'continuous_mode_update',
            data: {
              isRunning: this.state.continuousMode.isRunning,
              cycleCount: this.state.continuousMode.cycleCount,
              totalEmailsUsed: this.state.continuousMode.usedEmails.size,
              lastCycleResults: result.prospects?.length || 0
            }
          });
        }
        
        // 检查是否需要暂停（等待用户输入或系统优化）
        if (this.state.continuousMode.isRunning && !this.state.continuousMode.isPaused) {
          console.log('⏳ Waiting 30 seconds before next cycle...');
          await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
        }
        
      } catch (error) {
        console.error(`❌ Continuous cycle ${this.state.continuousMode.cycleCount} failed:`, error.message);
        
        if (this.wsManager) {
          this.wsManager.sendLogUpdate('continuous_mode', `❌ Cycle ${this.state.continuousMode.cycleCount} failed: ${error.message}`, 'error');
        }
        
        // 出错后等待更长时间再重试
        await new Promise(resolve => setTimeout(resolve, 60000)); // 等待1分钟
      }
    }
  }

  /**
   * 获取连续模式状态
   */
  getContinuousModeStatus() {
    return {
      isRunning: this.state.continuousMode.isRunning,
      isPaused: this.state.continuousMode.isPaused,
      cycleCount: this.state.continuousMode.cycleCount,
      startTime: this.state.continuousMode.startTime,
      pauseTime: this.state.continuousMode.pauseTime,
      totalEmailsUsed: this.state.continuousMode.usedEmails.size,
      campaignHistory: this.state.continuousMode.campaignHistory.slice(-10) // 返回最近10次历史
    };
  }

  /**
   * 过滤重复邮件地址
   */
  filterDuplicateEmails(prospects) {
    if (!prospects || prospects.length === 0) return [];
    
    const filteredProspects = prospects.filter(prospect => {
      if (!prospect.email) return false;
      return !this.state.continuousMode.usedEmails.has(prospect.email.toLowerCase());
    });
    
    console.log(`🔍 Filtered prospects: ${prospects.length} → ${filteredProspects.length} (removed ${prospects.length - filteredProspects.length} duplicates)`);
    
    return filteredProspects;
  }

  /**
   * 获取最新市场调研洞察并整合到营销策略中
   */
  async getLatestMarketingInsights() {
    if (!this.marketingResearchAgent) {
      console.log('⚠️ Marketing Research Agent not available');
      return {
        trends: [],
        competitors: [],
        insights: [],
        lastUpdate: null
      };
    }

    try {
      const insights = await this.marketingResearchAgent.getLatestInsights();
      const status = this.marketingResearchAgent.getStatus();
      
      return {
        trends: insights.trends || [],
        competitors: insights.competitors || [],
        insights: insights.insights || [],
        news: insights.news || [],
        lastUpdate: status.lastUpdateTime,
        metrics: status.metrics
      };
    } catch (error) {
      console.error('❌ Failed to get marketing insights:', error.message);
      return {
        trends: [],
        competitors: [],
        insights: [],
        lastUpdate: null
      };
    }
  }

  /**
   * 将市场调研数据整合到营销策略提示中
   */
  async enhancePromptWithMarketingResearch(basePrompt, context) {
    const marketingInsights = await this.getLatestMarketingInsights();
    
    if (!marketingInsights.trends.length && !marketingInsights.insights.length) {
      return basePrompt; // No insights available, return original prompt
    }

    let enhancedPrompt = basePrompt + '\n\n=== CURRENT MARKET INTELLIGENCE ===\n';
    
    // Add market trends
    if (marketingInsights.trends.length > 0) {
      enhancedPrompt += '\n🔍 LATEST MARKET TRENDS:\n';
      marketingInsights.trends.slice(0, 3).forEach((trend, i) => {
        enhancedPrompt += `${i + 1}. ${trend.analysis || trend.title}\n`;
      });
    }

    // Add competitor insights
    if (marketingInsights.competitors.length > 0) {
      enhancedPrompt += '\n💼 COMPETITOR INTELLIGENCE:\n';
      marketingInsights.competitors.slice(0, 2).forEach((competitor, i) => {
        enhancedPrompt += `${i + 1}. ${competitor.name}: ${competitor.analysis || competitor.insights}\n`;
      });
    }

    // Add key insights
    if (marketingInsights.insights.length > 0) {
      enhancedPrompt += '\n💡 KEY STRATEGIC INSIGHTS:\n';
      marketingInsights.insights.slice(0, 2).forEach((insight, i) => {
        enhancedPrompt += `${i + 1}. ${insight.summary || insight.analysis}\n`;
      });
    }

    // Add market timing information
    if (marketingInsights.lastUpdate) {
      const updateTime = new Date(marketingInsights.lastUpdate);
      const timeDiff = Date.now() - updateTime.getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      enhancedPrompt += `\n⏱️ Market data freshness: ${minutesAgo} minutes ago\n`;
    }

    enhancedPrompt += '\n=== END MARKET INTELLIGENCE ===\n\n';
    enhancedPrompt += 'Use this current market intelligence to inform your response and make it more relevant and timely.\n';

    return enhancedPrompt;
  }

  /**
   * 增强业务分析提示词
   */
  async enhanceBusinessAnalysisWithResearch(originalPrompt, targetWebsite) {
    return await this.enhancePromptWithMarketingResearch(originalPrompt, {
      type: 'business_analysis',
      targetWebsite
    });
  }

  /**
   * 增强营销策略提示词
   */
  async enhanceMarketingStrategyWithResearch(originalPrompt, businessAnalysis) {
    return await this.enhancePromptWithMarketingResearch(originalPrompt, {
      type: 'marketing_strategy',
      industry: businessAnalysis?.industry
    });
  }

  /**
   * 增强邮件内容提示词
   */
  async enhanceEmailContentWithResearch(originalPrompt, prospectInfo, campaignContext) {
    const marketingInsights = await this.getLatestMarketingInsights();
    
    if (!marketingInsights.trends.length) {
      return originalPrompt;
    }

    // 为邮件内容添加最新市场趋势作为谈话点
    let enhancedPrompt = originalPrompt + '\n\n=== CURRENT CONVERSATION STARTERS ===\n';
    
    // 添加相关的行业趋势作为邮件谈话点
    const relevantTrends = marketingInsights.trends
      .filter(trend => 
        trend.keyword && (
          trend.keyword.toLowerCase().includes(prospectInfo?.industry?.toLowerCase() || '') ||
          trend.keyword.toLowerCase().includes('technology') ||
          trend.keyword.toLowerCase().includes('business')
        )
      )
      .slice(0, 2);

    if (relevantTrends.length > 0) {
      enhancedPrompt += '\n💬 TIMELY CONVERSATION STARTERS:\n';
      relevantTrends.forEach((trend, i) => {
        enhancedPrompt += `${i + 1}. Recent ${trend.keyword} trend: ${trend.analysis?.substring(0, 150)}...\n`;
      });
      
      enhancedPrompt += '\nSubtly reference ONE of these trends to make the email timely and relevant.\n';
    }

    enhancedPrompt += '\n=== END CONVERSATION STARTERS ===\n';

    return enhancedPrompt;
  }

  /**
   * 获取营销调研统计信息供前端显示
   */
  getMarketingResearchStats() {
    if (!this.marketingResearchAgent) {
      return {
        isRunning: false,
        cyclesCompleted: 0,
        trendsFound: 0,
        competitorsTracked: 0,
        lastUpdate: 'Never'
      };
    }

    const status = this.marketingResearchAgent.getStatus();
    const metrics = this.marketingResearchAgent.getMetrics();

    return {
      isRunning: status.isRunning || false,
      isPaused: status.isPaused || false,
      cyclesCompleted: metrics.totalResearchCycles || 0,
      trendsFound: metrics.trendsIdentified || 0,
      competitorsTracked: metrics.competitorsTracked || 0,
      newsAnalyzed: metrics.newsAnalyzed || 0,
      lastUpdate: status.lastUpdateTime ? 
        new Date(status.lastUpdateTime).toLocaleString() : 'Never'
    };
  }

  /**
   * Start preview workflow - generates emails but doesn't send them immediately
   */
  async startPreviewWorkflow(params) {
    try {
      console.log('🔄 Starting preview workflow...');
      
      const {
        campaignId,
        businessName = 'TechCorp Solutions',
        industry = 'Food Technology',
        targetEmails = 5,
        mode = 'preview',
        existingProspects = null, // Accept already-found prospects to avoid duplicate search
        strategy = null // Accept existing strategy
      } = params;

      // Use existing strategy or generate new one
      const marketingStrategy = strategy || await this.generateOptimizedMarketingStrategy(
        { businessName, industry }, 
        [], 
        'partnership'
      );
      
      // Use existing prospects or find new ones (only if no prospects provided)
      let prospects = existingProspects;
      if (!prospects || prospects.length === 0) {
        console.log('⚠️ No existing prospects provided, searching for new ones...');
        prospects = await this.prospectSearchAgent.searchProspects(
          industry, 
          targetEmails,
          { businessName, industry }
        );
      } else {
        console.log(`✅ Using existing prospects: ${prospects.length} prospects provided`);
      }
      
      if (!prospects || prospects.length === 0) {
        throw new Error('No prospects found for the specified criteria');
      }

      console.log(`   📊 Found ${prospects.length} prospects for preview`);

      // 🔥 SET WORKFLOW STATUS TO GENERATING EMAILS (triggers ProcessNotifications)
      if (this.wsManager) {
        this.wsManager.updateWorkflowStatus(campaignId, 'generating_emails', {
          step: 'email_generation',
          total: prospects.length,
          progress: 0
        });
      }

      // Generate emails for each prospect but don't send
      let emailsGenerated = 0;
      for (const prospect of prospects) {
        try {
          console.log(`🔧 DEBUG: Starting email generation for ${prospect.email}`);

          // 🔥 SEND START NOTIFICATION + UPDATE PROGRESS
          if (this.wsManager) {
            const progress = Math.round(((emailsGenerated) / prospects.length) * 100);

            // Update workflow step with current progress
            this.wsManager.updateStepData(
              'email_generation',
              {
                status: 'in_progress',
                progress: progress,
                message: `Generating email ${emailsGenerated + 1}/${prospects.length} for ${prospect.name || prospect.email}`,
                currentProspect: prospect.name || prospect.email,
                current: emailsGenerated + 1,
                total: prospects.length
              },
              `Generating email ${emailsGenerated + 1}/${prospects.length}`
            );

            // Also send a notification for toast/popup
            this.wsManager.sendNotification(
              'info',
              `Start generating email ${emailsGenerated + 1}/${prospects.length} for ${prospect.name || prospect.email}`,
              {
                type: 'email_generation_progress',
                prospectEmail: prospect.email,
                prospectName: prospect.name,
                current: emailsGenerated + 1,
                total: prospects.length
              }
            );
          }

          const emailContent = await this.generateOptimizedEmailContent(
            prospect,
            marketingStrategy,
            { style: 'professional' },
            { businessName: marketingStrategy.company_name, industry: marketingStrategy.industry }
          );
          console.log(`🔧 DEBUG: Email generation completed for ${prospect.email}`);

          // Store in pending emails for preview
          const emailKey = `${campaignId}_${prospect.email}`;
          this.pendingEmails.set(emailKey, {
            prospect,
            emailContent,
            campaignId,
            strategy: marketingStrategy,
            generatedAt: new Date().toISOString(),
            status: 'pending_approval',
            emailKey
          });

          emailsGenerated++;
          console.log(`   📧 Generated preview email ${emailsGenerated}/${prospects.length} for ${prospect.email}`);

          // 🔥 SEND COMPLETION NOTIFICATION
          if (this.wsManager) {
            this.wsManager.sendNotification(
              'success',
              `Finished generating email ${emailsGenerated}/${prospects.length} for ${prospect.name || prospect.email}`,
              {
                type: 'email_generation_complete',
                prospectEmail: prospect.email,
                prospectName: prospect.name,
                current: emailsGenerated,
                total: prospects.length
              }
            );
          }
        } catch (error) {
          console.error(`Failed to generate email for ${prospect.email}:`, error.message);
          console.error('Full error stack:', error.stack);
        }
      }

      console.log(`✅ Preview workflow completed: ${emailsGenerated} emails generated and ready for review`);

      // 🔥 UPDATE WORKFLOW STATUS TO PAUSED FOR EDITING (triggers emailGenerationComplete notification)
      if (this.wsManager) {
        this.wsManager.updateWorkflowStatus(campaignId, 'paused_for_editing', {
          step: 'email_review',
          emailsGenerated: emailsGenerated,
          ready_for_review: true
        });
      }

      return {
        success: true,
        emailsGenerated,
        campaignId,
        mode: 'preview',
        status: 'ready_for_review'
      };

    } catch (error) {
      console.error('❌ Preview workflow failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pending emails for a campaign
   */
  getPendingEmails(campaignId) {
    if (!this.pendingEmails) {
      return new Map();
    }

    const campaignEmails = new Map();
    for (const [key, emailData] of this.pendingEmails.entries()) {
      if (emailData.campaignId === campaignId) {
        campaignEmails.set(key, emailData);
      }
    }

    return campaignEmails;
  }

  /**
   * Send approved emails from the campaign workflow
   */
  async sendApprovedEmails(campaignId, approvedEmailIds) {
    try {
      console.log(`🚀 Starting to send ${approvedEmailIds.length} approved emails...`);
      
      let sentCount = 0;
      const errors = [];

      for (const emailId of approvedEmailIds) {
        try {
          const pendingEmail = this.pendingEmails.get(emailId);
          if (!pendingEmail) {
            console.warn(`⚠️ Pending email not found: ${emailId}`);
            continue;
          }

          // Send the email
          const sendResult = await this.sendApprovedEmail(
            campaignId, 
            pendingEmail.prospect.email,
            null // editedContent - would be provided if user made edits
          );

          if (sendResult.success) {
            sentCount++;
            console.log(`   ✅ Sent email ${sentCount}/${approvedEmailIds.length} to ${pendingEmail.prospect.email}`);
          } else {
            errors.push({
              emailId,
              recipientEmail: pendingEmail.prospect.email,
              error: sendResult.error
            });
          }

        } catch (error) {
          console.error(`Failed to send email ${emailId}:`, error.message);
          errors.push({
            emailId,
            error: error.message
          });
        }
      }

      console.log(`📊 Campaign sending completed: ${sentCount} sent, ${errors.length} failed`);

      return {
        success: sentCount > 0,
        emailsSent: sentCount,
        totalApproved: approvedEmailIds.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Failed to send approved emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply user learning patterns to email generation
   */
  async applyUserLearning(learningPatterns) {
    try {
      console.log('🧠 Applying user learning patterns to email generation...');
      
      // Store learning patterns in memory for future use
      if (this.memory) {
        await this.memory.storeUserLearning('email_editor', learningPatterns);
      }

      // Update internal preferences
      if (learningPatterns.stylePreferences) {
        this.userPreferences = {
          ...this.userPreferences,
          emailStyle: learningPatterns.stylePreferences
        };
      }

      if (learningPatterns.ctaPreferences) {
        this.userPreferences = {
          ...this.userPreferences,
          ctaStyle: learningPatterns.ctaPreferences
        };
      }

      if (learningPatterns.preferredComponents) {
        this.userPreferences = {
          ...this.userPreferences,
          preferredComponents: learningPatterns.preferredComponents
        };
      }

      console.log('✅ User learning patterns applied successfully');
      
    } catch (error) {
      console.error('Failed to apply user learning:', error);
    }
  }

  // Clear all pending emails for reset functionality
  clearPendingEmails() {
    if (this.pendingEmails) {
      const count = this.pendingEmails.size;
      this.pendingEmails.clear();
      console.log(`🗑️ Cleared ${count} pending emails from LangGraphMarketingAgent`);
    } else {
      console.log('🗑️ No pending emails to clear in LangGraphMarketingAgent');
    }
  }

  /**
   * Clear SMTP transporter cache (useful when user updates SMTP config)
   */
  clearSMTPCache() {
    if (this.state.smtpTransporters) {
      const count = this.state.smtpTransporters.size;
      this.state.smtpTransporters.clear();
      this.state.smtpVerifiedConfigs.clear();
      console.log(`🗑️ Cleared ${count} cached SMTP transporters`);
    } else {
      console.log('🗑️ No SMTP cache to clear');
    }
  }

  // Temporary stub method to catch and trace calls to this missing method
  async generatePersonalizedEmail(...args) {
    console.error('🔧 DEBUG: generatePersonalizedEmail was called on LangGraphMarketingAgent with args:', args);
    console.error('🔧 DEBUG: Stack trace:');
    console.error(new Error().stack);
    throw new Error('generatePersonalizedEmail should not be called on LangGraphMarketingAgent - this suggests a context binding issue');
  }

  // Helper: Generate personalized subject line
  generatePersonalizedSubjectLine(prospect, persona) {
    const topics = [
      'Strategic Partnership Opportunity',
      'Collaboration Proposal',
      'Business Growth Initiative',
      'Partnership Discussion',
      'Strategic Alliance'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // Helper: Extract content blocks from HTML
  extractContentBlocks(html) {
    const blocks = [];

    // 🔥 FIX: First, look for [GENERATED CONTENT X: ...] placeholders
    const placeholderMatches = html.matchAll(/\[GENERATED CONTENT \d+:([^\]]+)\]/g);
    for (const match of placeholderMatches) {
      blocks.push({
        type: 'placeholder',
        description: match[1].trim(),
        content: match[0],  // The full placeholder text
        fullMatch: match[0]  // Same as content for placeholders
      });
    }

    // If we found placeholder blocks, return those
    if (blocks.length > 0) {
      console.log(`📋 Extracted ${blocks.length} placeholder content blocks`);
      return blocks;
    }

    // Fallback: Extract header/hero sections
    const headerMatch = html.match(/<div[^>]*class="header"[^>]*>([\s\S]*?)<\/div>/i);
    if (headerMatch) {
      blocks.push({ type: 'header', content: headerMatch[1], fullMatch: headerMatch[0] });
    }

    // Extract main content sections
    const contentMatch = html.match(/<div[^>]*class="content"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      blocks.push({ type: 'content', content: contentMatch[1], fullMatch: contentMatch[0] });
    }

    // If no structured blocks found, treat entire body as one block
    if (blocks.length === 0) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        blocks.push({ type: 'body', content: bodyMatch[1], fullMatch: bodyMatch[0] });
      } else {
        blocks.push({ type: 'full', content: html, fullMatch: html });
      }
    }

    return blocks;
  }

  // Helper: Generate personalized content for each block
  async generatePersonalizedBlocks(contentBlocks, prospect, persona, businessAnalysis) {
    const personalizedBlocks = [];

    for (const block of contentBlocks) {
      let newContent = block.content;

      if (block.type === 'placeholder') {
        // 🔥 NEW: Generate content for [GENERATED CONTENT X: ...] placeholders
        const description = block.description;
        console.log(`🤖 Generating content for placeholder: "${description}"`);

        const prompt = `Write personalized email content for ${prospect.name || 'the recipient'} at ${prospect.company || 'their company'}.

Task: ${description}

Business: ${businessAnalysis?.companyName || 'Our Company'}
Value Proposition: ${businessAnalysis?.valueProposition || 'AI-powered solutions'}
Recipient Role: ${prospect.position || prospect.role || 'business professional'}

Write 1-2 paragraphs that ${description.toLowerCase()}. Be specific, professional, and engaging. Output only the content text, no HTML tags.`;

        try {
          const aiContent = await this.callOllamaAPI(prompt, 'qwen2.5:0.5b');
          if (aiContent && aiContent.trim().length > 20) {
            newContent = aiContent.trim();
            console.log(`✅ Generated ${newContent.length} chars for: "${description.substring(0, 40)}..."`);
          }
        } catch (error) {
          console.error(`❌ Failed to generate content for placeholder "${description}":`, error.message);
        }
      } else if (block.type === 'header') {
        // Generate new header content
        newContent = `<h1>Partnership Opportunity with ${prospect.company || 'Your Company'}</h1>`;
      } else if (block.type === 'content' || block.type === 'body') {
        // Generate NEW personalized main content using AI
        const prompt = `Write a personalized business email body for ${prospect.name || 'the recipient'} at ${prospect.company || 'their company'}.

Persona: ${persona.type || 'business professional'}
Communication style: ${persona.communicationStyle || 'professional'}

Write 2-3 paragraphs that:
1. Address them personally and mention their company
2. Explain how our AI marketing solution can help their specific business
3. Include a clear call to action

Keep the tone ${persona.communicationStyle || 'professional'} and engaging. Output only the email body text, no greetings or signatures.`;

        try {
          const aiContent = await this.callOllamaAPI(prompt, 'qwen2.5:0.5b');
          if (aiContent && aiContent.length > 50) {
            newContent = `<p>Dear ${prospect.name || 'there'},</p>\n\n${aiContent}\n\n<p>Best regards,<br>Your Partnership Team</p>`;
          }
        } catch (error) {
          console.error('❌ Failed to generate AI content for block:', error.message);
          // Fallback to template-based personalization
          newContent = block.content
            .replace(/Dear [^,]+,/gi, `Dear ${prospect.name || 'there'},`)
            .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, (match) => {
              if (match.length > 15) return prospect.company || match;
              return match;
            });
        }
      }

      personalizedBlocks.push({ ...block, newContent });
    }

    return personalizedBlocks;
  }

  // Helper: Reconstruct HTML with personalized content
  reconstructHTMLWithPersonalizedContent(originalHTML, contentBlocks, personalizedBlocks) {
    let result = originalHTML;

    for (let i = 0; i < contentBlocks.length; i++) {
      const original = contentBlocks[i];
      const personalized = personalizedBlocks[i];

      if (original.fullMatch && personalized.newContent) {
        // Replace the entire block with new personalized content while preserving structure
        const newBlock = original.fullMatch.replace(original.content, personalized.newContent);
        result = result.replace(original.fullMatch, newBlock);
      }
    }

    return result;
  }

  // ✨ NEW: Request component template from email editor
  async requestComponentTemplate(campaignId) {
    try {
      console.log('📋 Requesting component template from user template state...');
      console.log('🔍 DEBUG: this.state exists:', !!this.state);
      console.log('🔍 DEBUG: this.state.userTemplate exists:', !!this.state?.userTemplate);
      console.log('🔍 DEBUG: userTemplate keys:', this.state?.userTemplate ? Object.keys(this.state.userTemplate) : 'N/A');
      console.log('🔍 DEBUG: userTemplate.components exists:', !!this.state?.userTemplate?.components);
      console.log('🔍 DEBUG: userTemplate.components length:', this.state?.userTemplate?.components?.length || 0);

      // ✨ PRIORITY 1: Check if we have fresh template data from user approval
      if (this.state?.userTemplate && this.state.userTemplate.components) {
        console.log(`🎯 Found fresh component template from user approval with ${this.state.userTemplate.components.length} components`);
        console.log('🔍 DEBUG: UserTemplate component types:', this.state.userTemplate.components.map(c => c.type).join(', '));

        return {
          components: this.state.userTemplate.components,
          layout: this.state.userTemplate.layout || 'default',
          styles: this.state.userTemplate.styles || {},
          subject: this.state.userTemplate.subject,
          metadata: {
            campaignId: campaignId,
            createdAt: new Date().toISOString(),
            sourceType: 'user_approval'
          }
        };
      }

      // ✨ PRIORITY 2: Check if userTemplate has HTML but no components - extract components from HTML
      if (this.state?.userTemplate && this.state.userTemplate.html && !this.state.userTemplate.components) {
        console.log('🔧 UserTemplate has HTML but no components, attempting to extract...');

        // Try to extract components from the HTML structure
        const extractedComponents = this.extractComponentsFromHTML(this.state.userTemplate.html);
        if (extractedComponents.length > 0) {
          console.log(`🔧 Extracted ${extractedComponents.length} components from HTML`);

          // Store the extracted components back to userTemplate for future use
          this.state.userTemplate.components = extractedComponents;

          return {
            components: extractedComponents,
            layout: 'extracted',
            styles: {},
            subject: this.state.userTemplate.subject,
            metadata: {
              campaignId: campaignId,
              createdAt: new Date().toISOString(),
              sourceType: 'html_extraction'
            }
          };
        }
      }

      // FALLBACK: Try pending emails (legacy approach)
      console.log('📋 Fallback: Checking pending emails...');
      console.log('🔍 DEBUG: Pending emails available:', Object.keys(this.state?.pendingEmails || {}));

      const pendingEmails = this.state?.pendingEmails || {};
      const campaignKey = `${campaignId}_`;

      // Find the first email for this campaign (the template email)
      let templateEmail = null;
      for (const [key, email] of Object.entries(pendingEmails)) {
        console.log(`🔍 DEBUG: Checking pending email key: ${key}`);
        if (key.startsWith(campaignKey)) {
          templateEmail = email;
          console.log(`📧 Found template email: ${key}`);
          console.log(`🔍 DEBUG: Email has editorPreview:`, !!templateEmail.editorPreview);
          console.log(`🔍 DEBUG: EditorPreview has components:`, !!templateEmail.editorPreview?.components);
          console.log(`🔍 DEBUG: Components length:`, templateEmail.editorPreview?.components?.length || 0);
          break;
        }
      }

      // Also check in the current workflow data
      if (!templateEmail && this.state?.workflowData?.approvalPending) {
        const approvalPending = this.state.workflowData.approvalPending;
        for (const [key, email] of Object.entries(approvalPending)) {
          if (key.startsWith(campaignKey)) {
            templateEmail = email;
            console.log(`📧 Found template email in approval pending: ${key}`);
            break;
          }
        }
      }

      if (templateEmail && templateEmail.editorPreview && templateEmail.editorPreview.components) {
        console.log(`🧩 Template has ${templateEmail.editorPreview.components.length} components`);

        return {
          components: templateEmail.editorPreview.components,
          layout: templateEmail.editorPreview.layout || 'default',
          styles: templateEmail.editorPreview.styles || {},
          subject: templateEmail.subject,
          metadata: {
            campaignId: campaignId,
            createdAt: new Date().toISOString(),
            sourceType: 'email_editor'
          }
        };
      } else {
        console.log('⚠️ No component structure found in template email');
        console.log('🔍 DEBUG: Template email object keys:', templateEmail ? Object.keys(templateEmail) : 'null');
        console.log('🔍 DEBUG: UserTemplate available:', !!this.state?.userTemplate);
        console.log('🔍 DEBUG: UserTemplate has components:', !!this.state?.userTemplate?.components);
        return null;
      }

    } catch (error) {
      console.error('❌ Failed to request component template:', error.message);
      return null;
    }
  }

  /**
   * Build coherent email prompt for all sections at once
   */
  buildCoherentEmailPrompt(contentSections, prospect, persona, businessAnalysis, componentTemplate) {
    const prospectName = prospect.name || prospect.email.split('@')[0];
    const prospectCompany = prospect.company || 'your company';
    const senderName = componentTemplate.senderName || 'James';
    const companyName = componentTemplate.companyName || businessAnalysis?.companyName || 'FruitAI';
    const templateName = componentTemplate.name || 'Professional Partnership';
    const templateId = componentTemplate.id || componentTemplate.templateId || 'professional_partnership';

    // 🎯 CRITICAL: Get template-specific Ollama prompt
    const TemplatePromptService = require('../services/TemplatePromptService');
    const baseTemplate = TemplatePromptService.getTemplate(templateId);

    let prompt;
    if (baseTemplate && baseTemplate.ollamaPrompt) {
      console.log(`✅ Using template-specific prompt for ${baseTemplate.name}`);

      // Use the template's custom prompt and replace placeholders
      prompt = baseTemplate.ollamaPrompt
        .replace(/\{senderName\}/g, senderName)
        .replace(/\{companyName\}/g, companyName)
        .replace(/\{recipientName\}/g, prospectName)
        .replace(/\{company\}/g, prospectCompany)
        .replace(/\{title\}/g, prospect.role || prospect.position || 'team member')
        .replace(/\{industry\}/g, prospect.industry || businessAnalysis?.industry || 'your industry');

      // Add persona context if available
      if (persona) {
        prompt += `

PERSONA CONTEXT for ${prospectName}:
- Type: ${persona.type || 'Professional'}
- Communication Style: ${persona.communicationStyle || 'Professional'}
- Decision Level: ${persona.decisionLevel || 'Medium'}
${persona.painPoints ? `- Pain Points: ${persona.painPoints.join(', ')}` : ''}`;
      }

      // Add business context
      prompt += `

BUSINESS CONTEXT:
- Our Company: ${companyName}
- Industry: ${businessAnalysis?.industry || 'Technology'}
- Value Proposition: ${businessAnalysis?.valueProposition || 'innovative solutions'}

CRITICAL REMINDERS:
- DO NOT include subject line or email headers
- DO NOT include any notes like "Note: Make sure to replace..." or placeholder instructions
- DO NOT include subtitles or section headers like "Our partnership offers several benefits:"
- DO NOT include bullet points with colons like "Shared Expertise:" or "Enhanced Collaboration:"
- DO NOT include any meta-commentary or instructions to the reader
- Write as ONE flowing message, NOT separate disconnected sections

Write the complete email now:`;

    } else {
      console.log(`⚠️ No template-specific prompt found for ${templateId}, using generic prompt`);

      // Fallback to generic prompt if template not found
      prompt = `Write a professional partnership email from ${senderName} at ${companyName} to ${prospectName} at ${prospectCompany}.

Write a SINGLE coherent business email that flows naturally from beginning to end.

STRUCTURE:
1. Opening: Brief, warm greeting and introduction (1-2 sentences)
2. Main body: Value proposition and partnership benefits (2-3 sentences)
3. Closing: Clear next steps and call to action (1-2 sentences)

RULES:
- Write as ONE flowing message, NOT separate sections
- Each paragraph should naturally lead to the next
- Use proper paragraph breaks for readability
- Professional yet conversational tone
- Be concise but compelling
- Focus on mutual value and benefits

DO NOT include:
- Multiple greetings or sign-offs
- Disconnected sections
- Repetitive content
- Generic filler text
- Any notes like "Note: Make sure to replace..." or placeholder instructions
- Subtitles or section headers like "Our partnership offers several benefits:"
- Bullet points with colons like "Shared Expertise:" or "Enhanced Collaboration:"
- Any meta-commentary or instructions to the reader

Write the complete email now as a simple, flowing message (without subject line or email headers):`;
    }

    return prompt;
  }

  /**
   * Split generated email into sections for template components
   */
  splitIntoSections(emailContent, numSections) {
    // Clean the content
    const cleanContent = emailContent
      .replace(/^(Dear|Hi|Hello) [^,\.]+[,\.]?\s*/i, '') // Remove greeting
      .replace(/(Best regards|Sincerely|Thanks|Regards)[,\.]?[\s\S]*$/i, '') // Remove closing
      .trim();

    // Split into natural paragraphs
    const paragraphs = cleanContent.split(/\n\n+/).filter(p => p.trim().length > 0);

    console.log(`📝 Splitting ${paragraphs.length} paragraphs into ${numSections} template sections`);

    // Distribute paragraphs across sections
    const sections = [];

    if (numSections === 3 && paragraphs.length >= 3) {
      // Professional Partnership: Split into 3 meaningful sections
      sections.push(paragraphs[0]); // Introduction
      sections.push(paragraphs.slice(1, -1).join('\n\n')); // Main content
      sections.push(paragraphs[paragraphs.length - 1]); // Call to action
    } else {
      // Distribute paragraphs evenly
      const parasPerSection = Math.max(1, Math.floor(paragraphs.length / numSections));

      for (let i = 0; i < numSections; i++) {
        const startIdx = i * parasPerSection;
        const endIdx = (i === numSections - 1) ? paragraphs.length : startIdx + parasPerSection;
        const sectionParas = paragraphs.slice(startIdx, endIdx);
        sections.push(sectionParas.join('\n\n'));
      }
    }

    // Ensure we have enough sections
    while (sections.length < numSections) {
      sections.push('');
    }

    // Log the split for debugging
    sections.forEach((section, i) => {
      console.log(`   Section ${i + 1}: ${section.substring(0, 50)}...`);
    });

    return sections;
  }

  /**
   * Generate template preview with actual content
   */
  async generateTemplatePreview(prospect, templateData) {
    try {
      console.log(`🎨 Generating template preview for ${prospect.company} using ${templateData.name}`);

      // Create a mock persona for preview
      const mockPersona = {
        type: 'business_decision_maker',
        communicationStyle: 'professional',
        interests: ['business growth', 'innovation'],
        painPoints: ['efficiency', 'competitive advantage']
      };

      // Create mock business analysis
      const mockBusinessAnalysis = {
        companyName: 'FruitAI Technologies',
        industry: 'AI Solutions',
        description: 'Leading provider of AI-powered business solutions'
      };

      // Generate the email content using the template
      const emailContent = await this.applyComponentTemplate(templateData, prospect, mockPersona, mockBusinessAnalysis);

      console.log(`✅ Generated template preview: ${emailContent.subject}`);

      return {
        subject: emailContent.subject,
        body: emailContent.body,
        html: emailContent.body,
        template: templateData.templateId || templateData.id,
        templateName: templateData.name,
        prospect: prospect
      };

    } catch (error) {
      console.error('❌ Failed to generate template preview:', error);
      throw error;
    }
  }

  /**
   * Build template-specific content prompt for Ollama generation
   */
  buildTemplateContentPrompt(contentDescription, prospect, persona, businessAnalysis, componentTemplate) {
    const prospectName = prospect.name || prospect.email.split('@')[0];
    const prospectCompany = prospect.company || 'your company';
    const senderName = componentTemplate.senderName || 'James';
    const companyName = componentTemplate.companyName || businessAnalysis?.companyName || 'FruitAI';
    const templateName = componentTemplate.name || 'Professional Partnership';

    // Get template-specific prompt from ollamaPrompt if available
    let basePrompt = componentTemplate.ollamaPrompt || '';

    // Create content-specific prompt based on the description
    let specificPrompt = '';

    if (contentDescription.toLowerCase().includes('introduction')) {
      specificPrompt = `Write a professional introduction paragraph for ${prospectName} at ${prospectCompany}. Explain why ${senderName} from ${companyName} is reaching out and the potential value of the partnership. Keep it engaging and specific to their industry. Write 2-3 sentences only.`;
    } else if (contentDescription.toLowerCase().includes('value proposition') || contentDescription.toLowerCase().includes('mutual benefits')) {
      specificPrompt = `Write a compelling value proposition paragraph explaining the mutual benefits of partnering between ${companyName} and ${prospectCompany}. Focus on specific advantages like market expansion, technology sharing, or operational efficiency. Write 2-3 sentences only.`;
    } else if (contentDescription.toLowerCase().includes('next steps') || contentDescription.toLowerCase().includes('call to action')) {
      specificPrompt = `Write a clear call-to-action paragraph for ${prospectName} suggesting concrete next steps for the partnership discussion. Make it easy to respond with specific actions like scheduling a call or meeting. Write 2-3 sentences only.`;
    } else {
      // Generic content generation
      specificPrompt = `Write professional business content for "${contentDescription}" targeting ${prospectName} at ${prospectCompany}. Make it relevant to their business and the partnership opportunity with ${companyName}. Write 2-3 sentences only.`;
    }

    // Add persona context for better personalization
    const personaContext = persona ? `
RECIPIENT PROFILE:
- Role: ${persona.type || 'Business Professional'}
- Communication Style: ${persona.communicationStyle || 'professional'}
- Key Interests: ${persona.interests?.join(', ') || 'business growth'}
- Pain Points: ${persona.painPoints?.join(', ') || 'efficiency, growth'}` : '';

    return `${specificPrompt}

${personaContext}

BUSINESS CONTEXT:
- Sender: ${senderName} from ${companyName}
- Recipient: ${prospectName} at ${prospectCompany}
- Template: ${templateName}
- Goal: Professional partnership outreach

Write ONLY the content paragraph - no greetings, signatures, or extra formatting. Keep it concise and professional.`;
  }

  /**
   * Extract component structure from HTML template
   */
  extractComponentsFromHTML(html) {
    try {
      const components = [];
      let componentId = 0;

      // Extract text content blocks
      const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/g);
      if (paragraphs) {
        paragraphs.forEach(p => {
          const textContent = p.replace(/<[^>]*>/g, '').trim();
          if (textContent.length > 10) { // Skip very short content
            components.push({
              id: `text_${++componentId}`,
              type: 'freeform_editor',
              content: {
                html: p,
                text: textContent
              }
            });
          }
        });
      }

      // Extract headings
      const headings = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g);
      if (headings) {
        headings.forEach(h => {
          const textContent = h.replace(/<[^>]*>/g, '').trim();
          components.push({
            id: `heading_${++componentId}`,
            type: 'hero',
            content: {
              title: textContent,
              subtitle: ''
            }
          });
        });
      }

      // Extract buttons/links
      const buttons = html.match(/<a[^>]*class="[^"]*button[^"]*"[^>]*>(.*?)<\/a>/g);
      if (buttons) {
        buttons.forEach(b => {
          const textContent = b.replace(/<[^>]*>/g, '').trim();
          const hrefMatch = b.match(/href="([^"]*)"/);
          components.push({
            id: `button_${++componentId}`,
            type: 'button',
            content: {
              text: textContent,
              url: hrefMatch ? hrefMatch[1] : '#'
            }
          });
        });
      }

      console.log(`✨ Extracted ${components.length} components from HTML`);
      return components;

    } catch (error) {
      console.error('❌ Failed to extract components from HTML:', error.message);
      return [];
    }
  }

  // ✨ NEW: Apply component template with personalized content using Template System
  async applyComponentTemplate(componentTemplate, prospect, persona, businessAnalysis) {
    try {
      // ✨ CRITICAL FIX: Check if this is a user-customized template first!
      if (componentTemplate.isCustomized || componentTemplate.userSelected) {
        console.log(`🎯 Using USER-CUSTOMIZED template - preserving user's exact content!`);
        console.log(`🔍 Template marked as customized: ${componentTemplate.isCustomized}, userSelected: ${componentTemplate.userSelected}`);
        console.log(`🔍 Template has HTML: ${!!componentTemplate.html}, HTML length: ${componentTemplate.html?.length || 0}`);

        // Use user's HTML directly - this is their customized template
        // NO FALLBACK: Require template to have html and subject
        if (!componentTemplate.html || !componentTemplate.subject) {
          const errorMsg = `❌ CRITICAL ERROR: User template missing required fields`;
          console.error(errorMsg);
          console.error(`   - has html: ${!!componentTemplate.html}`);
          console.error(`   - has subject: ${!!componentTemplate.subject}`);
          throw new Error(errorMsg);
        }

        const userHTML = componentTemplate.html;
        const userSubject = componentTemplate.subject;

        // Generate personalized content using Ollama for template placeholders
        let personalizedHTML = userHTML
          .replace(/\{name\}/g, prospect.name || 'there')
          .replace(/\{company\}/g, prospect.company || 'your company')
          .replace(/\{recipientName\}/g, prospect.name || 'there')
          .replace(/\{companyName\}/g, prospect.company || 'your company');

        // 🎯 CRITICAL FIX: Generate coherent email content for ALL placeholders at once
        const contentPlaceholders = personalizedHTML.match(/\[GENERATED CONTENT \d+[^\]]*\]/g);
        if (contentPlaceholders && contentPlaceholders.length > 0) {
          console.log(`🤖 Found ${contentPlaceholders.length} content placeholders to generate with Ollama`);

          // Extract all content descriptions
          const contentSections = contentPlaceholders.map(placeholder => {
            return placeholder.replace(/\[GENERATED CONTENT \d+:\s*/, '').replace(/\]$/, '');
          });

          // Generate a SINGLE coherent email body for all sections
          const coherentEmailPrompt = this.buildCoherentEmailPrompt(contentSections, prospect, persona, businessAnalysis, componentTemplate);

          console.log(`🎨 Generating coherent email with ${contentSections.length} sections`);
          const fullEmailContent = await this.callOllama(coherentEmailPrompt, 'email', { temperature: 0.7 });

          if (!fullEmailContent || fullEmailContent.trim().length < 50) {
            const errorMsg = `❌ CRITICAL ERROR: Failed to generate coherent email content`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }

          // Split the generated content into sections
          const sections = this.splitIntoSections(fullEmailContent, contentSections.length);

          // Replace each placeholder with its corresponding section
          for (let i = 0; i < contentPlaceholders.length && i < sections.length; i++) {
            personalizedHTML = personalizedHTML.replace(contentPlaceholders[i], sections[i]);
            console.log(`✅ Replaced section ${i+1}: ${sections[i].substring(0, 50)}...`);
          }
        }

        // 🎨 CRITICAL FIX: Apply user customizations (colors, text, etc.) to the HTML
        if (componentTemplate.customizations) {
          console.log(`🎨 Applying user customizations:`, Object.keys(componentTemplate.customizations));
          console.log(`🎨 HTML preview (first 500 chars):`, personalizedHTML.substring(0, 500));

          const customizations = componentTemplate.customizations;

          // Apply color customizations (comprehensive replacement)
          if (customizations.primaryColor) {
            // Replace all common green shades used as primary color
            personalizedHTML = personalizedHTML.replace(/#28a745/gi, customizations.primaryColor);
            personalizedHTML = personalizedHTML.replace(/#10b981/gi, customizations.primaryColor);
            personalizedHTML = personalizedHTML.replace(/#059669/gi, customizations.primaryColor);
            personalizedHTML = personalizedHTML.replace(/#22c55e/gi, customizations.primaryColor);
            // Also replace RGB equivalents
            personalizedHTML = personalizedHTML.replace(/rgb\(16,\s*185,\s*129\)/gi, customizations.primaryColor);
            console.log(`🎨 Applied primary color: ${customizations.primaryColor}`);
          }

          if (customizations.accentColor) {
            // Replace all common darker green shades used as accent
            personalizedHTML = personalizedHTML.replace(/#047857/gi, customizations.accentColor);
            personalizedHTML = personalizedHTML.replace(/#065f46/gi, customizations.accentColor);
            personalizedHTML = personalizedHTML.replace(/#15803d/gi, customizations.accentColor);
            console.log(`🎨 Applied accent color: ${customizations.accentColor}`);
          }

          // Apply text customizations
          if (customizations.headerTitle) {
            // Replace common header title variations across different templates
            const before = personalizedHTML;
            personalizedHTML = personalizedHTML.replace(/Building Strategic Partnerships/gi, customizations.headerTitle);
            personalizedHTML = personalizedHTML.replace(/Partnership Opportunity/gi, customizations.headerTitle);
            personalizedHTML = personalizedHTML.replace(/Transform Your Business with AI/gi, customizations.headerTitle);
            const changed = before !== personalizedHTML;
            console.log(`🎨 Header title replacement: "${customizations.headerTitle}" - Changed: ${changed}`);
            if (!changed) {
              console.log(`⚠️ WARNING: headerTitle replacement found NO matches in HTML!`);
            }
          }

          if (customizations.mainHeading) {
            // Replace main heading with user's custom text, preserving {name} and {company} placeholders
            const mainHeading = customizations.mainHeading
              .replace('{name}', prospect.name || 'there')
              .replace('{company}', prospect.company || 'your company');

            personalizedHTML = personalizedHTML.replace(/Hello \{name\}!/gi, mainHeading);
            personalizedHTML = personalizedHTML.replace(/Revolutionizing \{company\} with AI-Powered Solutions/gi, mainHeading);
            console.log(`🎨 Applied main heading: ${mainHeading}`);
          }

          if (customizations.buttonText) {
            // Replace all button text variations across templates
            personalizedHTML = personalizedHTML.replace(/Schedule Partnership Discussion/gi, customizations.buttonText);
            personalizedHTML = personalizedHTML.replace(/Schedule Your Free Demo/gi, customizations.buttonText);
            personalizedHTML = personalizedHTML.replace(/Learn More/gi, customizations.buttonText);
            personalizedHTML = personalizedHTML.replace(/Get Started/gi, customizations.buttonText);
            console.log(`🎨 Applied button text: ${customizations.buttonText}`);
          }

          if (customizations.testimonialText) {
            // Remove quotes if user included them, then add them back
            let testimonialText = customizations.testimonialText.replace(/^["']|["']$/g, '');
            personalizedHTML = personalizedHTML.replace(/"This partnership exceeded our expectations[^"]*"/g, `"${testimonialText}"`);
            personalizedHTML = personalizedHTML.replace(/"This solution transformed our operations[^"]*"/g, `"${testimonialText}"`);
            console.log(`🎨 Applied testimonial text: ${testimonialText}`);
          }

          if (customizations.testimonialAuthor) {
            personalizedHTML = personalizedHTML.replace(/— Sarah Chen, CEO at GrowthTech/g, customizations.testimonialAuthor);
            personalizedHTML = personalizedHTML.replace(/CEO, Industry Leader/g, customizations.testimonialAuthor);
            console.log(`🎨 Applied testimonial author: ${customizations.testimonialAuthor}`);
          }

          // Apply signature customization
          if (customizations.signature || componentTemplate.signature) {
            const signatureText = (customizations.signature || componentTemplate.signature)
              .replace('{senderName}', prospect.templateData?.senderName || 'Team')
              .replace('{company}', prospect.company || businessAnalysis?.companyName || 'Our Company')
              .replace(/\\n/g, '<br>');

            // Replace common signature patterns
            personalizedHTML = personalizedHTML.replace(/Best regards,<br>[^<]+<br>[^<]+/g, signatureText);
            console.log(`🎨 Applied custom signature`);
          }

          // Apply text size customization
          if (customizations.textSize) {
            // Replace common text sizes in the template
            personalizedHTML = personalizedHTML.replace(/font-size:\s*16px/g, `font-size: ${customizations.textSize}`);
            console.log(`🎨 Applied text size: ${customizations.textSize}`);
          }

          // Apply text color customization
          if (customizations.textColor) {
            // Replace body text colors
            personalizedHTML = personalizedHTML.replace(/color:\s*#333333/g, `color: ${customizations.textColor}`);
            personalizedHTML = personalizedHTML.replace(/color:\s*#000000/g, `color: ${customizations.textColor}`);
            personalizedHTML = personalizedHTML.replace(/color:\s*#666666/g, `color: ${customizations.textColor}`);
            console.log(`🎨 Applied text color: ${customizations.textColor}`);
          }

          // Apply font weight (bold)
          if (customizations.fontWeight === 'bold') {
            personalizedHTML = personalizedHTML.replace(/<p style="/g, '<p style="font-weight: bold; ');
            personalizedHTML = personalizedHTML.replace(/<div style="/g, '<div style="font-weight: bold; ');
            console.log(`🎨 Applied font weight: bold`);
          }

          // Apply font style (italic)
          if (customizations.fontStyle === 'italic') {
            personalizedHTML = personalizedHTML.replace(/<p style="/g, '<p style="font-style: italic; ');
            personalizedHTML = personalizedHTML.replace(/<div style="/g, '<div style="font-style: italic; ');
            console.log(`🎨 Applied font style: italic`);
          }

          // Apply button URL customization
          if (customizations.buttonUrl) {
            personalizedHTML = personalizedHTML.replace(/href="https:\/\/calendly\.com\/meeting"/g, `href="${customizations.buttonUrl}"`);
            personalizedHTML = personalizedHTML.replace(/href="https:\/\/demo\.ourplatform\.com"/g, `href="${customizations.buttonUrl}"`);
            console.log(`🎨 Applied button URL: ${customizations.buttonUrl}`);
          }

          // Apply greeting customization
          if (customizations.greeting) {
            const greetingText = customizations.greeting.replace('{name}', prospect.name || 'there');
            personalizedHTML = personalizedHTML.replace(/Hi \{name\},/g, greetingText);
            personalizedHTML = personalizedHTML.replace(/Hello \{name\}!/g, greetingText);
            console.log(`🎨 Applied greeting: ${greetingText}`);
          }
        }

        console.log(`✅ Using USER'S customized template with personalization and customizations applied`);
        console.log(`📊 Personalized HTML length: ${personalizedHTML.length} chars`);

        return {
          subject: userSubject.replace(/\{company\}/g, prospect.company || 'your company'),
          body: personalizedHTML,
          components: componentTemplate.components || [],
          template: 'user_customized',
          templateData: componentTemplate,
          preservedUserContent: true
        };
      }

      // Only use template generation for non-customized templates
      const templateId = componentTemplate.templateId;

      if (!templateId) {
        throw new Error('No templateId provided in componentTemplate');
      }

      // 🔥 CRITICAL: Use customized template HTML if provided in componentTemplate
      let templateData;
      if (componentTemplate.html || componentTemplate.templateData?.html) {
        // Use customized HTML from componentTemplate (user edited)
        const baseTemplate = TemplatePromptService.getTemplate(templateId);
        templateData = {
          ...baseTemplate,
          html: componentTemplate.html || componentTemplate.templateData?.html || baseTemplate?.html,
          subject: componentTemplate.subject || componentTemplate.templateData?.subject || baseTemplate?.subject,
          isCustomized: true
        };
        console.log(`✨ Using CUSTOMIZED template with user-edited HTML for ${prospect.company}`);
      } else {
        // Use default template
        templateData = TemplatePromptService.getTemplate(templateId);
      }

      if (templateData && !componentTemplate.isCustomized) {
        console.log(`🎨 Using NEW template system for ${templateData.name} with ${prospect.company}`);
        return await this.generateTemplateBasedEmail(templateId, prospect, persona, businessAnalysis, componentTemplate);
      }

      // Fallback to legacy component processing
      console.log(`🎨 Applying legacy component template to ${prospect.company} with ${componentTemplate.components.length} components`);

      // PRESERVE EXACT USER STRUCTURE: Create personalized components maintaining exact positions and properties
      const personalizedComponents = [];

      // Process components in EXACT same order to preserve positions
      for (let i = 0; i < componentTemplate.components.length; i++) {
        const component = componentTemplate.components[i];

        // Deep clone to preserve ALL properties and positions
        const personalizedComponent = JSON.parse(JSON.stringify(component));

        console.log(`🔍 Processing component ${i}: type=${component.type}, id=${component.id}, position=${component.position || 'auto'}`);

        // ONLY personalize text content, preserve everything else (styling, position, properties)
        if (component.type === 'freeform_editor' || component.type === 'text') {
          // Get original content to understand length and structure
          const originalContent = component.content.html || component.content.text || '';
          const originalLength = originalContent.replace(/<[^>]*>/g, '').length;
          const isLongContent = originalLength > 200;

          // Create comprehensive personalization prompt that preserves structure
          const prompt = `Write personalized email content for ${prospect.name || 'the recipient'} at ${prospect.company}.

Original content (${originalLength} chars): "${originalContent.substring(0, 200)}..."
Persona: ${persona.type || 'business professional'}
Style: ${persona.communicationStyle || 'professional'}

REQUIREMENTS:
- Generate approximately ${Math.max(150, originalLength)} characters
- Match the tone and structure of the original content
- Personalize for ${prospect.company} and ${prospect.name || 'the recipient'}
${isLongContent ?
  '- Write 3-5 detailed, engaging paragraphs\n- Include specific value propositions\n- Make it comprehensive and professional' :
  '- Write 2-3 well-developed sentences\n- Be concise but compelling\n- Focus on partnership benefits'
}
- Output ONLY the content text, no greetings, signatures, notes, or instructions
- DO NOT include subtitles, section headers, or bullet points with colons`;

          try {
            const aiContent = await this.callOllamaAPI(prompt, 'qwen2.5:0.5b');
            if (aiContent && aiContent.length > 20) {
              // Preserve original HTML structure but update content
              if (component.content.html) {
                // Parse original HTML and replace text content while preserving structure
                let updatedHTML = component.content.html;
                const textContent = aiContent.trim();

                // Replace content while preserving HTML tags and structure
                updatedHTML = updatedHTML.replace(/>[^<]*</g, (match) => {
                  const inner = match.slice(1, -1).trim();
                  if (inner.length > 10) { // Only replace substantial content
                    return `>${textContent}<`;
                  }
                  return match;
                });

                personalizedComponent.content = {
                  ...component.content, // Preserve all original properties
                  text: textContent,
                  html: updatedHTML
                };
              } else {
                personalizedComponent.content = {
                  ...component.content, // Preserve all original properties
                  text: aiContent.trim()
                };
              }

              console.log(`✅ Personalized component ${i} with ${aiContent.length} chars content`);
            } else {
              console.log(`⚠️ AI content too short for component ${i}, keeping original`);
            }
          } catch (error) {
            console.error(`❌ Failed to generate AI content for component ${i}:`, error.message);
            console.log(`⚠️ Keeping original content for component ${i}`);
          }

        } else if (component.type === 'button') {
          // For buttons, only personalize text if it's generic, preserve everything else
          if (!component.content.text || component.content.text.includes('Click') || component.content.text.includes('Learn More')) {
            personalizedComponent.content = {
              ...component.content, // Preserve all original properties including styling
              text: `Partnership with ${prospect.company}`
            };
          }
          console.log(`✅ Button component ${i} preserved with styling`);

        } else {
          // For all other components (hero, header, etc.), preserve exactly as user designed
          console.log(`✅ Component ${i} type '${component.type}' preserved exactly as user designed`);
        }

        // Ensure position and all properties are preserved
        personalizedComponents.push(personalizedComponent);
      }

      // CRITICAL FIX: Always use the complete edited HTML template
      // This ensures components are at correct positions as edited by user
      let personalizedHTML;
      if (componentTemplate.html) {
        // Use the complete edited HTML that already has components integrated at correct positions
        console.log(`🎨 Using complete edited HTML with components at correct positions`);
        personalizedHTML = componentTemplate.html;

        // Simple personalization replacements on the complete HTML
        const prospectName = prospect.name || 'there';
        const prospectCompany = prospect.company || 'your company';

        personalizedHTML = personalizedHTML
          .replace(/\[CONTACT_NAME\]/g, prospectName)
          .replace(/\{name\}/gi, prospectName)
          .replace(/\[COMPANY_NAME\]/g, prospectCompany)
          .replace(/\[PROSPECT_COMPANY\]/g, prospectCompany)
          .replace(/\{company\}/gi, prospectCompany);

        console.log(`✅ Personalized complete HTML template preserving component positions`);
      } else {
        // Only generate from components if no complete HTML exists
        console.log(`⚠️ No complete HTML found, generating from components`);
        personalizedHTML = this.generateHTMLFromComponentsPreservingStructure(personalizedComponents, componentTemplate.styles);
        console.log(`✅ Generated HTML from components`);
      }

      console.log(`✅ Applied component template preserving ${personalizedComponents.length} components in exact positions`);

      return {
        subject: componentTemplate.subject ?
          `${componentTemplate.subject} - ${prospect.company}` :
          `Partnership Opportunity with ${prospect.company}`,
        body: personalizedHTML,
        components: personalizedComponents,
        template: componentTemplate.id || componentTemplate.templateId || 'professional_partnership',
        templateData: {
          ...componentTemplate,
          components: personalizedComponents // Update with personalized but position-preserved components
        }
      };

    } catch (error) {
      console.error('❌ Failed to apply component template:', error.message);
      throw error;
    }
  }

  // ✨ NEW: Generate template-based email using TemplatePromptService
  async generateTemplateBasedEmail(templateId, prospect, persona, businessAnalysis, componentTemplate) {
    try {
      console.log(`🎨 Generating ${templateId} template for ${prospect.name} at ${prospect.company}`);

      // Get template data
      const templateData = TemplatePromptService.getTemplate(templateId);
      if (!templateData) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Generate template-specific prompt
      const businessDescription = businessAnalysis?.summary || this.state.currentCampaign?.businessDescription || '';
      const templatePrompt = TemplatePromptService.generateTemplatePrompt(
        templateId,
        prospect,
        businessDescription
      );

      console.log(`📝 Generated template prompt for ${templateData.structure.paragraphs} paragraphs`);

      // Call Ollama with template-specific prompt
      const ollamaResponse = await this.callOllamaAPI(templatePrompt, this.models.email);

      if (!ollamaResponse || ollamaResponse.length < 50) {
        console.error('❌ Ollama response too short for template generation');
        throw new Error('Failed to generate template content');
      }

      // Parse paragraphs from response
      const paragraphs = TemplatePromptService.parseOllamaResponse(
        ollamaResponse,
        templateData.structure.paragraphs
      );

      console.log(`✅ Extracted ${paragraphs.length} paragraphs from Ollama response`);

      // Insert paragraphs into template HTML
      let personalizedHTML = TemplatePromptService.insertParagraphsIntoTemplate(
        templateData.html,
        paragraphs,
        templateId
      );

      // Apply basic personalization
      const prospectName = prospect.name || 'there';
      const prospectCompany = prospect.company || 'your company';

      personalizedHTML = personalizedHTML
        .replace(/\{name\}/g, prospectName)
        .replace(/\{company\}/g, prospectCompany);

      // Generate subject line
      const subject = templateData.subject
        ? templateData.subject.replace(/\{company\}/g, prospectCompany)
        : `${templateData.name} - ${prospectCompany}`;

      console.log(`✅ Generated template-based email for ${prospect.company} using ${templateId}`);

      return {
        subject,
        body: personalizedHTML,
        components: templateData.components || [],
        template: templateId,
        templateData: {
          id: templateId,
          name: templateData.name,
          html: personalizedHTML,
          components: templateData.components || [],
          paragraphs: paragraphs,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Failed to generate template-based email:', error.message);

      // Fallback to basic personalization
      console.log('⚠️ Falling back to basic template personalization');
      const templateData = TemplatePromptService.getTemplate(templateId);
      if (templateData) {
        let fallbackHTML = templateData.html
          .replace(/\{name\}/g, prospect.name || 'there')
          .replace(/\{company\}/g, prospect.company || 'your company');

        return {
          subject: `Partnership Opportunity with ${prospect.company}`,
          body: fallbackHTML,
          components: templateData.components || [],
          template: templateId,
          templateData: {
            id: templateId,
            name: templateData.name,
            html: fallbackHTML,
            components: templateData.components || []
          }
        };
      }

      throw error;
    }
  }

  // ✨ NEW: Personalize HTML template while preserving exact structure
  async personalizeHTMLTemplate(originalHTML, personalizedComponents, prospect) {
    console.log(`🎨 Personalizing HTML template while preserving structure`);

    let personalizedHTML = originalHTML;

    // Map components by their content for intelligent replacement
    for (let i = 0; i < personalizedComponents.length; i++) {
      const component = personalizedComponents[i];

      if (component.content && component.content.html && component.content.text) {
        // Find and replace the original component content in the HTML
        const originalContent = component.content.html;

        // Try to find the original content in the HTML and replace it
        if (personalizedHTML.includes(originalContent)) {
          personalizedHTML = personalizedHTML.replace(originalContent, component.content.html);
          console.log(`✅ Replaced component ${i} content in HTML template`);
        } else {
          console.log(`⚠️ Could not find original content for component ${i} in HTML template`);
        }
      }
    }

    // Also do simple text replacements for common placeholders
    personalizedHTML = personalizedHTML
      .replace(/\[COMPANY_NAME\]/g, prospect.company || 'Your Company')
      .replace(/\[CONTACT_NAME\]/g, prospect.name || 'there')
      .replace(/\[PROSPECT_COMPANY\]/g, prospect.company || 'Your Company');

    console.log(`✅ Personalized HTML template: ${personalizedHTML.length} characters`);
    return personalizedHTML;
  }

  // ✨ NEW: Generate HTML from components while preserving exact user structure and styling
  generateHTMLFromComponentsPreservingStructure(components, styles = {}) {
    console.log(`🎨 Generating HTML preserving structure for ${components.length} components`);

    let html = '';

    // Try to reconstruct the original structure if available
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      console.log(`🔍 Processing component ${i}: type=${component.type}, id=${component.id}`);

      // Use the component's original HTML if available, preserving all styling
      if (component.content && component.content.html) {
        html += component.content.html;
      } else if (component.content && component.content.text) {
        // Wrap plain text in basic structure while preserving positioning
        const wrapperClass = component.className || component.type || 'component';
        const inlineStyle = component.style ? ` style="${component.style}"` : '';
        html += `<div class="${wrapperClass}"${inlineStyle}>${component.content.text}</div>`;
      }

      // Add any component-specific styling or properties
      if (component.customHTML) {
        html += component.customHTML;
      }
    }

    // If we have accumulated HTML content, wrap it properly
    if (html.trim()) {
      // Check if it's already a complete HTML document
      if (!html.includes('<!DOCTYPE') && !html.includes('<html>')) {
        // Wrap in minimal HTML structure while preserving all user styling
        const customCSS = styles.css || styles.custom || '';
        html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${customCSS ? `<style>${customCSS}</style>` : ''}
    ${styles.customHead || ''}
</head>
<body>
${html}
</body>
</html>`;
      }
    } else {
      console.log('⚠️ No HTML content generated, falling back to legacy method');
      return this.generateHTMLFromComponents(components, styles);
    }

    console.log(`✅ Generated HTML preserving user structure: ${html.length} characters`);
    return html;
  }

  // ✨ LEGACY: Generate HTML from component structure (fallback)
  generateHTMLFromComponents(components, styles = {}) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; }
        .content { padding: 30px; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        ${styles.custom || ''}
    </style>
</head>
<body>`;

    for (const component of components) {
      if (component.type === 'hero' || component.type === 'header') {
        html += `
    <div class="header">
        <h1>${component.content.headline || 'Partnership Opportunity'}</h1>
        ${component.content.subheadline ? `<p>${component.content.subheadline}</p>` : ''}
    </div>`;

      } else if (component.type === 'freeform_editor' || component.type === 'text') {
        html += `
    <div class="content">
        ${component.content.html || component.content.text || ''}
    </div>`;

      } else if (component.type === 'button') {
        html += `
    <div class="content">
        <a href="${component.content.url || '#'}" class="button">${component.content.text || 'Click Here'}</a>
    </div>`;
      }
    }

    html += `
</body>
</html>`;

    return html;
  }
}

module.exports = LangGraphMarketingAgent;