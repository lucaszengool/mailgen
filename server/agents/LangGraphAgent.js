const { StateGraph, END } = require('@langchain/langgraph');
const { SqliteSaver } = require('@langchain/langgraph-checkpoint-sqlite');
const { MemorySaver } = require('@langchain/langgraph-checkpoint');
const Database = require('better-sqlite3');

// Import existing agents
const ProspectSearchAgent = require('./ProspectSearchAgent');
const SmartBusinessAnalyzer = require('./SmartBusinessAnalyzer');
const MarketingStrategyAgent = require('./MarketingStrategyAgent');
const EmailAgent = require('./EmailAgent');
const EnhancedKnowledgeBase = require('../models/EnhancedKnowledgeBase');
const nodemailer = require('nodemailer');
const analyticsRoutes = require('../routes/analytics');
const { trackEmailSent, trackEmailDelivered } = analyticsRoutes;

/**
 * LangGraph-powered Email Marketing Agent System
 * 为现有Agent系统提供状态管理、内存持久化和在线学习能力
 */
class LangGraphAgent {
  constructor(config = {}) {
    this.config = config;
    this.knowledgeBase = new EnhancedKnowledgeBase();
    this.wsManager = config.wsManager || null;
    
    // 初始化现有的Agent实例 - 使用真实的工作流组件
    this.prospectSearchAgent = new ProspectSearchAgent();
    this.businessAnalyzer = new SmartBusinessAnalyzer();
    this.marketingAgent = new MarketingStrategyAgent();
    this.emailGenerator = new EmailAgent();
    
    // 使用超快速营销策略生成器
    const UltraFastMarketingAgent = require('./UltraFastMarketingAgent');
    this.ultraFastStrategy = new UltraFastMarketingAgent();
    
    // SMTP配置和邮件发送器
    this.transporter = null;
    this.smtpWorking = false;
    
    // 初始化LangGraph状态管理
    this.graph = null;
    this.checkpointer = null;
    this.memory = new Map(); // 临时内存存储
    
    // 学习系统状态
    this.learningData = {
      searchPatterns: new Map(),
      emailEffectiveness: new Map(),
      userPreferences: new Map(),
      performanceMetrics: new Map()
    };
    
    this.initializeGraph();
  }

  // 发送实时工作流状态更新到前端
  sendWorkflowUpdate(stepName, status, data = {}) {
    if (this.wsManager) {
      this.wsManager.broadcast({
        type: 'workflow_update',
        step: stepName,
        status: status, // 'started', 'completed', 'failed'
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 初始化LangGraph图结构
  async initializeGraph() {
    console.log('🔧 初始化LangGraph智能Agent系统...');
    
    try {
      // 创建SQLite checkpointer用于持久化
      const db = new Database('./data/langgraph_checkpoints.db');
      this.checkpointer = new SqliteSaver(db);
      
      // 定义状态结构 - 使用正确的LangGraph通道定义
      const AgentState = {
        campaignId: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        targetWebsite: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        campaignGoal: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        businessType: { 
          value: (x, y) => y ?? x ?? 'auto',
          default: () => 'auto' 
        },
        smtpConfig: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        industry: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        businessAnalysis: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        marketingStrategy: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        currentStep: { 
          value: (x, y) => y ?? x ?? 'analyze',
          default: () => 'analyze' 
        },
        prospects: { 
          value: (x, y) => y ?? x ?? [],
          default: () => [] 
        },
        emailQueue: { 
          value: (x, y) => y ?? x ?? [],
          default: () => [] 
        },
        sentEmails: { 
          value: (x, y) => y ?? x ?? [],
          default: () => [] 
        },
        replies: { 
          value: (x, y) => y ?? x ?? [],
          default: () => [] 
        },
        metrics: { 
          value: (x, y) => ({ ...(x || {}), ...(y || {}) }),
          default: () => ({}) 
        },
        learningFeedback: { 
          value: (x, y) => y ?? x ?? [],
          default: () => [] 
        },
        errors: { 
          value: (x, y) => [...(x || []), ...(Array.isArray(y) ? y : y ? [y] : [])],
          default: () => [] 
        },
        retryCount: { 
          value: (x, y) => y ?? x ?? 0,
          default: () => 0 
        },
        searchStrategy: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        },
        lastUpdate: { 
          value: (x, y) => y ?? x ?? new Date().toISOString(),
          default: () => new Date().toISOString() 
        },
        smtpConfig: { 
          value: (x, y) => y ?? x ?? null,
          default: () => null 
        }
      };

      // 创建状态图
      const workflow = new StateGraph({ channels: AgentState });

      // 定义节点
      workflow.addNode('analyze_business', this.analyzeBusinessNode.bind(this));
      workflow.addNode('generate_strategy', this.generateStrategyNode.bind(this));
      workflow.addNode('search_prospects', this.searchProspectsNode.bind(this));
      workflow.addNode('process_prospects', this.processProspectsNode.bind(this));
      workflow.addNode('generate_and_send_emails', this.generateAndSendEmailsNode.bind(this));
      workflow.addNode('monitor_responses', this.monitorResponsesNode.bind(this));
      workflow.addNode('learn_and_optimize', this.learnAndOptimizeNode.bind(this));
      workflow.addNode('error_recovery', this.errorRecoveryNode.bind(this));

      // 定义边和条件路由
      workflow.setEntryPoint('analyze_business');
      
      workflow.addEdge('analyze_business', 'generate_strategy');
      workflow.addEdge('generate_strategy', 'search_prospects');
      workflow.addEdge('search_prospects', 'process_prospects');
      workflow.addEdge('process_prospects', 'generate_and_send_emails');
      workflow.addEdge('generate_and_send_emails', 'monitor_responses');
      
      // 条件路由：基于响应情况决定下一步
      workflow.addConditionalEdges(
        'monitor_responses',
        this.shouldContinueMonitoring.bind(this),
        {
          'continue_monitoring': 'monitor_responses',
          'learn_optimize': 'learn_and_optimize',
          'error_recovery': 'error_recovery'
        }
      );
      
      workflow.addEdge('learn_and_optimize', END);
      workflow.addEdge('error_recovery', 'search_prospects'); // 错误恢复后重试

      // 编译图
      this.graph = workflow.compile({ checkpointer: this.checkpointer });
      
      console.log('✅ LangGraph系统初始化完成');
      
    } catch (error) {
      console.error('❌ LangGraph初始化失败:', error);
      // 回退到内存模式
      this.checkpointer = new MemorySaver();
      console.log('⚠️  回退到内存模式运行');
    }
  }

  // 业务分析节点
  async analyzeBusinessNode(state) {
    console.log('📊 执行业务分析节点...');
    this.sendWorkflowUpdate('business_analysis', 'started', { targetWebsite: state.targetWebsite });
    
    console.log('🔍 调试状态输入:');
    console.log('  targetWebsite:', state.targetWebsite);
    console.log('  campaignGoal:', state.campaignGoal);
    console.log('  businessType:', state.businessType);
    
    try {
      // 连接知识库
      await this.knowledgeBase.connect();
      
      // 使用真实的业务分析器
      const analysis = await this.businessAnalyzer.analyzeTargetBusiness(
        state.targetWebsite,
        state.campaignGoal,
        state.businessType
      );
      
      console.log('✅ 业务分析完成:', {
        companyName: analysis.companyName,
        industry: analysis.industry,
        valueProposition: analysis.valueProposition
      });
      
      this.sendWorkflowUpdate('business_analysis', 'completed', {
        companyName: analysis.companyName,
        industry: analysis.industry,
        valueProposition: analysis.valueProposition
      });
      
      // 确保businessAnalysis数据正确传递
      console.log('🔧 设置businessAnalysis到状态:', !!analysis);
      console.log('🔧 分析对象包含公司名称:', !!analysis.companyName);
      
      const newState = {
        ...state,
        industry: analysis.industry,
        businessType: analysis.businessType || state.businessType,
        businessAnalysis: analysis, // 确保这里正确设置
        currentStep: 'strategy',
        metrics: {
          ...state.metrics,
          analysisCompleted: true,
          analysisTime: new Date().toISOString()
        }
      };
      
      console.log('🔧 返回状态中的businessAnalysis:', !!newState.businessAnalysis);
      return newState;
      
    } catch (error) {
      console.error('❌ 业务分析失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'analyze_business', error: error.message }],
        currentStep: 'strategy' // 继续到策略生成，使用回退分析
      };
    }
  }

  // 营销策略生成节点
  async generateStrategyNode(state) {
    console.log('🎯 执行营销策略生成节点...');
    this.sendWorkflowUpdate('marketing_strategy', 'started', { 
      companyName: state.businessAnalysis?.companyName 
    });
    
    try {
      // 使用真实的营销策略代理生成策略
      const businessAnalysis = state.businessAnalysis;
      
      console.log('🔍 检查业务分析数据:');
      console.log('  state对象键:', Object.keys(state));
      console.log('  businessAnalysis存在:', !!businessAnalysis);
      console.log('  类型:', typeof businessAnalysis);
      if (businessAnalysis) {
        console.log('  分析对象键:', Object.keys(businessAnalysis));
        console.log('  公司名称:', businessAnalysis.companyName);
        console.log('  行业数据类型:', typeof businessAnalysis.industry);
        console.log('  主要产品数量:', businessAnalysis.mainProducts?.length || 0);
      } else {
        console.log('❌ businessAnalysis为null/undefined，当前状态:');
        console.log('   targetWebsite:', state.targetWebsite);
        console.log('   campaignGoal:', state.campaignGoal);
        console.log('   currentStep:', state.currentStep);
      }
      
      // 如果没有业务分析，创建基础分析
      let analysis = businessAnalysis;
      if (!analysis || !analysis.companyName) {
        console.log('⚠️ 没有业务分析或公司名称为空，使用回退分析');
        analysis = {
          companyName: 'Target Business',
          industry: 'technology',
          valueProposition: `Innovative ${state.campaignGoal} solutions`,
          mainProducts: [state.campaignGoal],
          targetCustomers: ['SME']
        };
      } else {
        console.log('✅ 使用真实业务分析数据');
      }
      
      // 使用真实Ollama生成营销策略
      console.log('🔥 使用真实Ollama生成营销策略 (非模板)...');
      const marketingStrategy = await this.marketingAgent.generateMarketingStrategy(
        state.targetWebsite,
        state.campaignGoal,
        analysis,
        state.businessType || 'auto'
      );
      
      // 检查策略是否成功生成
      if (!marketingStrategy) {
        console.log('❌ 营销策略生成失败，使用回退策略');
        const fallbackStrategy = this.createFallbackStrategy(state.businessType, state.campaignGoal);
        
        await this.knowledgeBase.saveMarketingStrategy({
          website: state.targetWebsite,
          goal: state.campaignGoal,
          strategy: fallbackStrategy,
          business_analysis: analysis,
          created_at: new Date().toISOString(),
          fallback_used: true
        });
        
        console.log('✅ 使用回退营销策略:', fallbackStrategy);
        
        return {
          ...state,
          marketingStrategy: fallbackStrategy,
          businessAnalysis: analysis,
          retryCount: (state.retryCount || 0) + 1
        };
      }
      
      // 保存策略到知识库
      await this.knowledgeBase.saveMarketingStrategy({
        website: state.targetWebsite,
        goal: state.campaignGoal,
        strategy: marketingStrategy,
        business_analysis: analysis,
        created_at: new Date().toISOString()
      });

      console.log('✅ 营销策略生成完成:', {
        targetAudience: marketingStrategy.target_audience?.type,
        valueProposition: marketingStrategy.messaging_framework?.value_proposition
      });
      
      this.sendWorkflowUpdate('marketing_strategy', 'completed', {
        targetAudience: marketingStrategy.target_audience?.type,
        primarySegments: marketingStrategy.target_audience?.primary_segments,
        searchKeywords: marketingStrategy.target_audience?.search_keywords
      });
      
      return {
        ...state,
        marketingStrategy: marketingStrategy,
        currentStep: 'search',
        metrics: {
          ...state.metrics,
          strategyGenerated: true,
          strategyTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ 营销策略生成失败:', error);
      
      // 创建回退策略
      const campaignGoal = state.campaignGoal || 'business services';
      const businessType = state.businessType || 'auto';
      const targetType = businessType === 'toc' ? 'toc' : 'tob';
      
      const fallbackStrategy = {
        target_audience: {
          type: targetType,
          primary_segments: targetType === 'toc' ? ['consumers', 'individuals'] : ['SME', 'enterprise'],
          search_keywords: [campaignGoal, 'contact', 'business']
        },
        messaging_framework: {
          value_proposition: `Innovative ${campaignGoal} solutions for ${targetType === 'toc' ? 'consumers' : 'businesses'}`,
          key_messages: ['Innovation', 'Efficiency', 'Quality'],
          tone: 'professional'
        }
      };
      
      console.log('✅ 使用回退营销策略:', {
        type: targetType,
        keywords: fallbackStrategy.target_audience.search_keywords,
        segments: fallbackStrategy.target_audience.primary_segments
      });
      
      return {
        ...state,
        marketingStrategy: fallbackStrategy,
        currentStep: 'search',
        errors: [...state.errors, { step: 'generate_strategy', error: error.message }],
        metrics: {
          ...state.metrics,
          strategyGenerated: true,
          strategyTime: new Date().toISOString()
        }
      };
    }
  }

  // 潜在客户搜索节点
  async searchProspectsNode(state) {
    console.log('🔍 执行潜在客户搜索节点...');
    this.sendWorkflowUpdate('prospect_search', 'started', {
      strategy: state.marketingStrategy?.target_audience?.type
    });
    
    try {
      // 获取营销策略，如果为null则创建基础策略
      let marketingStrategy = state.marketingStrategy;
      
      if (!marketingStrategy || marketingStrategy === null) {
        console.log('⚠️ 营销策略为空，创建基础搜索策略');
        
        // 修复 campaignGoal 为 null 的问题
        const campaignGoal = state.campaignGoal || 'business services';
        const businessType = state.businessType || 'auto';
        const targetType = businessType === 'toc' ? 'toc' : 'tob';
        
        marketingStrategy = {
          target_audience: {
            type: targetType,
            search_keywords: [campaignGoal, 'contact', 'business'],
            primary_segments: targetType === 'toc' ? ['consumers', 'individuals'] : ['business', 'enterprise']
          },
          messaging_framework: {
            value_proposition: `${campaignGoal} solutions for ${targetType === 'toc' ? 'consumers' : 'businesses'}`
          }
        };
        
        console.log('✅ 创建了基础营销策略:', {
          type: targetType,
          keywords: marketingStrategy.target_audience.search_keywords,
          segments: marketingStrategy.target_audience.primary_segments
        });
      }
      
      console.log('🎯 使用营销策略搜索潜在客户:', {
        targetAudience: marketingStrategy?.target_audience?.type,
        searchKeywords: marketingStrategy?.target_audience?.search_keywords,
        retryCount: state.retryCount
      });
      
      // 调用真实的搜索代理，使用完整的营销策略
      // 确保industry是字符串
      let industry = 'technology';
      if (state.industry) {
        if (typeof state.industry === 'string') {
          industry = state.industry;
        } else if (state.industry.contentAnalysis?.title) {
          industry = state.industry.contentAnalysis.title;
        } else if (state.businessAnalysis?.industry) {
          industry = typeof state.businessAnalysis.industry === 'string' ? 
            state.businessAnalysis.industry : 'technology';
        }
      }
      
      // Create enhanced strategy with business analysis data
      const enhancedStrategy = {
        ...marketingStrategy,
        company_name: state.businessAnalysis?.companyName || 'target company',
        domain: this.extractDomain(state.targetWebsite) || 'target.com',
        website: state.targetWebsite || 'https://target.com',
        description: this.extractStringValue(state.businessAnalysis?.valueProposition) || 'business solutions'
      };
      
      const prospects = await this.prospectSearchAgent.searchProspects(
        enhancedStrategy,
        industry,
        state.businessType
      );
      
      console.log(`✅ 找到 ${prospects.length} 个潜在客户`);
      
      this.sendWorkflowUpdate('prospect_search', 'completed', {
        prospectsFound: prospects.length,
        searchMethod: 'enhanced_email_search'
      });
      
      // 如果没有找到客户且重试次数少于3次，返回错误以触发重试
      if (prospects.length === 0 && state.retryCount < 3) {
        console.log(`⚠️ 未找到潜在客户，准备重试 (第${state.retryCount + 1}次)`);
        return {
          ...state,
          errors: [...state.errors, { step: 'search_prospects', error: '未找到潜在客户，继续搜索' }],
          retryCount: state.retryCount + 1,
          currentStep: 'error' // 触发错误恢复
        };
      }
      
      // 如果重试次数已达上限，继续到下一步，即使没有找到客户
      if (prospects.length === 0 && state.retryCount >= 3) {
        console.log('⚠️ 达到最大重试次数，使用空客户列表继续流程');
      }
      
      // 记录搜索模式用于学习
      if (prospects.length > 0) {
        this.recordSearchPattern(state, marketingStrategy, prospects.length);
      }
      
      return {
        ...state,
        prospects: prospects,
        currentStep: 'process',
        metrics: {
          ...state.metrics,
          prospectsFound: prospects.length,
          searchCompleted: true,
          searchTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ 潜在客户搜索失败:', error);
      
      // 如果重试次数超过3次，直接进入下一步
      if (state.retryCount >= 3) {
        console.log('⚠️ 搜索重试次数已达上限，继续流程');
        return {
          ...state,
          prospects: [],
          currentStep: 'process',
          errors: [...state.errors, { step: 'search_prospects', error: error.message }]
        };
      }
      
      return {
        ...state,
        errors: [...state.errors, { step: 'search_prospects', error: error.message }],
        retryCount: state.retryCount + 1,
        currentStep: 'error' // 触发错误恢复重试
      };
    }
  }

  // 潜在客户处理节点
  async processProspectsNode(state) {
    console.log('⚙️ 执行潜在客户处理节点...');
    
    try {
      await this.knowledgeBase.connect();
      
      console.log(`🧠 使用Ollama为潜在客户生成AI用户画像...`);
      
      // 使用增强邮箱搜索代理生成Ollama用户画像
      const EnhancedEmailSearchAgent = require('./EnhancedEmailSearchAgent');
      const emailSearchAgent = new EnhancedEmailSearchAgent();
      
      // 生成Ollama用户画像
      const enrichedProspects = await emailSearchAgent.enrichProspects(state.prospects, state.marketingStrategy);
      console.log(`✅ 完成 ${enrichedProspects.length} 个潜在客户的AI用户画像生成`);
      
      // 保存潜在客户到知识库
      const savedProspects = [];
      for (const prospect of enrichedProspects) {
        const saved = await this.knowledgeBase.saveProspect(prospect);
        savedProspects.push(saved);
      }
      
      console.log(`✅ 成功保存 ${savedProspects.length} 个潜在客户到知识库`);
      
      return {
        ...state,
        prospects: savedProspects,
        processedProspects: savedProspects,
        currentStep: 'generate',
        metrics: {
          ...state.metrics,
          prospectsSaved: savedProspects.length,
          processCompleted: true
        }
      };
      
    } catch (error) {
      console.error('❌ 潜在客户处理失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'process_prospects', error: error.message }],
        processedProspects: state.prospects || [],
        currentStep: 'generate' // 继续到邮件生成
      };
    }
  }

  // 合并的邮件生成和发送节点 - 生成一封立即发送一封
  async generateAndSendEmailsNode(state) {
    console.log('📝📤 执行邮件生成和发送节点（生成一封立即发送）...');
    
    try {
      // 设置SMTP配置
      await this.setupSMTP(state.smtpConfig);
      
      // 如果没有潜在客户，跳过
      if (!state.prospects || state.prospects.length === 0) {
        console.log('⚠️ 没有潜在客户，跳过邮件生成和发送');
        return {
          ...state,
          emailQueue: [],
          sentEmails: [],
          currentStep: 'monitor',
          metrics: {
            ...state.metrics,
            emailsGenerated: 0,
            emailsSent: 0,
            emailsFailed: 0
          }
        };
      }
      
      const sentEmails = [];
      const failedEmails = [];
      const marketingStrategy = state.marketingStrategy;
      let emailsSentThisHour = 0;
      const maxEmailsPerHour = 10;
      
      console.log(`📧 开始为 ${state.prospects.length} 个潜在客户生成并发送邮件...`);
      
      // 遍历每个潜在客户
      for (let i = 0; i < state.prospects.length; i++) {
        const prospect = state.prospects[i];
        
        // 检查小时发送限制
        if (emailsSentThisHour >= maxEmailsPerHour) {
          console.log(`⏰ 达到每小时发送限制 (${maxEmailsPerHour})，暂停发送`);
          break;
        }
        
        console.log(`\n🎯 [${i + 1}/${state.prospects.length}] 为 ${prospect.company || prospect.email} 生成个性化邮件...`);
        
        try {
          // 确保EmailAgent已初始化
          if (!this.emailGenerator.config) {
            await this.emailGenerator.initialize({
              senderInfo: state.businessAnalysis?.senderInfo || {
                companyName: state.businessAnalysis?.companyName || 'AI Solutions',
                senderName: 'Business Development Team',
                senderTitle: 'Partnership Manager'
              },
              campaignGoal: state.campaignGoal,
              smtpConfig: state.smtpConfig || {
                username: process.env.SMTP_USERNAME || 'agent@system.com',
                senderName: 'Business Development Team'
              }
            });
          }
          
          // 1. 生成个性化邮件
          const emailHistory = await this.knowledgeBase.getEmailHistory(prospect.id);
          const emailData = await this.emailGenerator.generatePersonalizedEmail(
            prospect,
            marketingStrategy,
            emailHistory,
            state.targetWebsite
          );
          
          const emailItem = {
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prospect: prospect,
            subject: emailData.subject,
            content: emailData.content,
            personalization_notes: emailData.personalization_notes,
            scheduled: new Date(),
            status: 'sending',
            type: 'outbound'
          };
          
          console.log(`✅ 邮件生成成功: "${emailItem.subject}"`);
          
          // 保存到知识库
          const savedEmail = await this.knowledgeBase.saveEmail({
            prospect_id: prospect.id,
            subject: emailData.subject,
            content: emailData.content,
            type: 'outbound',
            status: 'sending',
            scheduled_at: emailItem.scheduled.toISOString(),
            personalization_notes: emailData.personalization_notes
          });
          
          emailItem.dbId = savedEmail.lastID;
          
          // 2. 立即发送邮件
          console.log(`📤 发送邮件到 ${prospect.email}...`);
          
          try {
            const sendResult = await this.sendEmail(emailItem, state);
            
            // 更新邮件状态为已发送
            await this.knowledgeBase.updateEmailStatus(
              emailItem.dbId, 
              'sent', 
              sendResult.messageId
            );
            
            sentEmails.push({
              ...emailItem,
              status: 'sent',
              messageId: sendResult.messageId,
              sentAt: new Date().toISOString()
            });
            
            emailsSentThisHour++;
            console.log(`✅ 邮件发送成功! Message ID: ${sendResult.messageId}`);
            
            // 添加延迟避免发送过快
            if (i < state.prospects.length - 1) {
              const delay = 3000 + Math.random() * 2000; // 3-5秒随机延迟
              console.log(`⏳ 等待 ${(delay/1000).toFixed(1)} 秒后继续...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
          } catch (sendError) {
            console.error(`❌ 邮件发送失败:`, sendError.message);
            
            // 更新状态为失败
            await this.knowledgeBase.updateEmailStatus(
              emailItem.dbId, 
              'failed', 
              null
            );
            
            failedEmails.push({
              ...emailItem,
              status: 'failed',
              error: sendError.message
            });
          }
          
        } catch (error) {
          console.error(`❌ 为 ${prospect.company} 生成邮件失败:`, error.message);
          
          // 生成并发送回退邮件
          console.log('📝 生成回退邮件...');
          const fallbackEmail = {
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prospect: prospect,
            subject: `${state.campaignGoal} Solution for ${prospect.company || 'Your Business'}`,
            content: this.generateFallbackEmailContent(prospect, state),
            scheduled: new Date(),
            status: 'sending',
            type: 'outbound'
          };
          
          try {
            const sendResult = await this.sendEmail(fallbackEmail, state);
            sentEmails.push({
              ...fallbackEmail,
              status: 'sent',
              messageId: sendResult.messageId,
              sentAt: new Date().toISOString()
            });
            emailsSentThisHour++;
            console.log(`✅ 回退邮件发送成功!`);
          } catch (sendError) {
            console.error(`❌ 回退邮件发送失败:`, sendError.message);
            failedEmails.push({
              ...fallbackEmail,
              status: 'failed',
              error: sendError.message
            });
          }
        }
      }
      
      console.log(`\n📊 邮件发送完成统计:`);
      console.log(`   ✅ 成功发送: ${sentEmails.length} 封`);
      console.log(`   ❌ 发送失败: ${failedEmails.length} 封`);
      console.log(`   ⏰ 待发送: ${state.prospects.length - sentEmails.length - failedEmails.length} 封`);
      
      return {
        ...state,
        sentEmails: sentEmails,
        currentStep: 'monitor',
        metrics: {
          ...state.metrics,
          emailsGenerated: sentEmails.length + failedEmails.length,
          emailsSent: sentEmails.length,
          emailsFailed: failedEmails.length,
          sendCompleted: true
        }
      };
      
    } catch (error) {
      console.error('❌ 邮件生成和发送节点失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'generate_and_send_emails', error: error.message }],
        currentStep: 'monitor'
      };
    }
  }

  // 邮件生成节点（保留作为备用，但不再使用）
  async generateEmailsNode(state) {
    console.log('📝 执行邮件生成节点...');
    this.sendWorkflowUpdate('email_generation', 'started', {
      prospectsCount: state.prospects?.length || 0
    });
    
    try {
      // 如果没有潜在客户，跳过邮件生成
      if (!state.prospects || state.prospects.length === 0) {
        console.log('⚠️ 没有潜在客户，跳过邮件生成');
        return {
          ...state,
          emailQueue: [],
          currentStep: 'send',
          metrics: {
            ...state.metrics,
            emailsGenerated: 0,
            generationCompleted: true
          }
        };
      }
      
      console.log(`📧 为 ${state.prospects.length} 个潜在客户生成个性化邮件...`);
      
      const emailQueue = [];
      const marketingStrategy = state.marketingStrategy;
      
      // 为每个潜在客户生成个性化邮件
      for (const prospect of state.prospects) {
        try {
          // 获取客户的邮件历史
          const emailHistory = await this.knowledgeBase.getEmailHistory(prospect.id);
          
          // 使用真实的MarketingStrategyAgent生成个性化邮件
          const emailData = await this.emailGenerator.generatePersonalizedEmail(
            prospect,
            marketingStrategy,
            emailHistory,
            state.targetWebsite
          );
          
          const emailItem = {
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prospect: prospect,
            subject: emailData.subject,
            content: emailData.content,
            personalization_notes: emailData.personalization_notes,
            scheduled: new Date(),
            status: 'queued',
            type: 'outbound'
          };
          
          emailQueue.push(emailItem);
          
          // 保存到知识库
          await this.knowledgeBase.saveEmail({
            prospect_id: prospect.id,
            subject: emailData.subject,
            content: emailData.content,
            type: 'outbound',
            status: 'queued',
            scheduled_at: emailItem.scheduled.toISOString(),
            personalization_notes: emailData.personalization_notes
          });
          
        } catch (emailError) {
          console.error(`❌ 为 ${prospect.company} 生成邮件失败:`, emailError.message);
          
          // 生成回退邮件
          const fallbackEmail = {
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prospect: prospect,
            subject: `${state.campaignGoal} Solution for ${prospect.company || 'Your Business'}`,
            content: this.generateFallbackEmailContent(prospect, state),
            scheduled: new Date(),
            status: 'queued',
            type: 'outbound'
          };
          
          emailQueue.push(fallbackEmail);
        }
      }
      
      console.log(`✅ 生成 ${emailQueue.length} 封个性化邮件`);
      
      this.sendWorkflowUpdate('email_generation', 'completed', {
        emailsGenerated: emailQueue.length,
        method: 'ollama_personalized'
      });
      
      return {
        ...state,
        emailQueue: emailQueue,
        currentStep: 'send',
        metrics: {
          ...state.metrics,
          emailsGenerated: emailQueue.length,
          generationCompleted: true
        }
      };
      
    } catch (error) {
      console.error('❌ 邮件生成失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'generate_emails', error: error.message }],
        currentStep: 'send' // 继续到发送阶段，即使生成失败
      };
    }
  }

  // 邮件发送节点
  async sendEmailsNode(state) {
    console.log('📤 执行邮件发送节点...');
    
    try {
      // 设置SMTP配置
      await this.setupSMTP(state.smtpConfig);
      
      const sentEmails = [];
      
      if (!state.emailQueue || state.emailQueue.length === 0) {
        console.log('⚠️ 没有邮件需要发送');
        return {
          ...state,
          sentEmails: [],
          currentStep: 'monitor',
          metrics: {
            ...state.metrics,
            emailsSent: 0,
            emailsFailed: 0,
            sendCompleted: true
          }
        };
      }
      
      console.log(`📧 准备发送 ${state.emailQueue.length} 封邮件...`);
      
      // 批量发送邮件（考虑限流）
      for (const emailItem of state.emailQueue) {
        try {
          const result = await this.sendEmail(emailItem, state);
          
          const sentEmail = {
            ...emailItem,
            status: 'sent',
            sentAt: new Date().toISOString(),
            messageId: result.messageId
          };
          
          sentEmails.push(sentEmail);
          
          // 更新知识库中的邮件状态
          await this.knowledgeBase.updateEmailStatus(emailItem.id, 'sent', result.messageId);
          
          // 更新潜在客户状态
          await this.knowledgeBase.updateProspect(emailItem.prospect.id, {
            status: 'contacted',
            last_contact: new Date().toISOString(),
            emails_sent: (emailItem.prospect.emails_sent || 0) + 1
          });
          
          console.log(`✅ 邮件已发送至 ${emailItem.prospect.email}`);
          
          // 发送间隔控制
          await this.delay(1000); // 1秒间隔
          
        } catch (sendError) {
          console.error(`❌ 邮件发送失败 ${emailItem.prospect.email}:`, sendError.message);
          
          const failedEmail = {
            ...emailItem,
            status: 'failed',
            error: sendError.message,
            failedAt: new Date().toISOString()
          };
          
          sentEmails.push(failedEmail);
        }
      }
      
      const successCount = sentEmails.filter(e => e.status === 'sent').length;
      const failCount = sentEmails.filter(e => e.status === 'failed').length;
      
      console.log(`📊 邮件发送完成: ${successCount} 成功, ${failCount} 失败`);
      
      return {
        ...state,
        sentEmails: sentEmails,
        currentStep: 'monitor',
        metrics: {
          ...state.metrics,
          emailsSent: successCount,
          emailsFailed: failCount,
          sendCompleted: true
        }
      };
      
    } catch (error) {
      console.error('❌ 邮件发送失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'send_emails', error: error.message }],
        currentStep: 'monitor' // 继续到监控阶段
      };
    }
  }

  // 响应监控节点
  async monitorResponsesNode(state) {
    console.log('👀 执行响应监控节点...');
    
    try {
      // 简化的回复检查逻辑（避免调用不存在的方法）
      const newReplies = []; // 暂时返回空回复数组
      
      // 直接进入学习阶段，避免无限循环
      return {
        ...state,
        replies: [...state.replies, ...newReplies],
        currentStep: 'learn',
        metrics: {
          ...state.metrics,
          repliesReceived: state.replies.length + newReplies.length,
          lastMonitorTime: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ 响应监控失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'monitor_responses', error: error.message }],
        currentStep: 'learn' // 即使出错也进入学习阶段
      };
    }
  }

  // 学习和优化节点
  async learnAndOptimizeNode(state) {
    console.log('🧠 执行学习和优化节点...');
    
    try {
      // 分析营销活动效果
      const performance = this.analyzePerformance(state);
      
      // 更新学习数据
      this.updateLearningData(state, performance);
      
      // 生成优化建议
      const optimizations = this.generateOptimizations(performance);
      
      return {
        ...state,
        currentStep: 'completed',
        metrics: {
          ...state.metrics,
          conversionRate: performance.conversionRate,
          responseRate: performance.responseRate,
          learningCompleted: true,
          optimizations: optimizations
        },
        learningFeedback: [...state.learningFeedback, {
          timestamp: new Date().toISOString(),
          performance: performance,
          optimizations: optimizations
        }]
      };
      
    } catch (error) {
      console.error('❌ 学习优化失败:', error);
      return {
        ...state,
        errors: [...state.errors, { step: 'learn_and_optimize', error: error.message }],
        currentStep: 'completed' // 即使学习失败也完成流程
      };
    }
  }

  // 错误恢复节点
  async errorRecoveryNode(state) {
    console.log('🔧 执行错误恢复节点...');
    
    try {
      // 检查重试次数限制 - 最多重试3次
      const maxRetries = 3;
      const currentRetryCount = state.retryCount || 0;
      
      if (currentRetryCount >= maxRetries) {
        console.log(`⚠️ 达到最大重试次数 (${maxRetries})，完成流程`);
        return {
          ...state,
          currentStep: 'completed',
          retryCount: currentRetryCount,
          metrics: {
            ...state.metrics,
            maxRetriesReached: true,
            finalProspectCount: state.prospects ? state.prospects.length : 0
          }
        };
      }
      
      // 如果没有找到潜在客户，使用不同策略继续搜索
      if (!state.prospects || state.prospects.length === 0) {
        console.log(`🔍 没有潜在客户，调整搜索策略... (重试 ${currentRetryCount + 1}/${maxRetries})`);
        
        const newRetryCount = currentRetryCount + 1;
        
        // 每次重试使用不同的搜索策略
        const searchStrategies = [
          'technology',
          'business', 
          'enterprise'
        ];
        
        const currentStrategy = searchStrategies[newRetryCount % searchStrategies.length];
        console.log(`🎯 第${newRetryCount}次搜索，使用策略: ${currentStrategy}`);
        
        return {
          ...state,
          currentStep: 'search',
          retryCount: newRetryCount,
          searchStrategy: currentStrategy,
          metrics: {
            ...state.metrics,
            errorRecoveryAttempted: true,
            recoveryAction: 'retry_search',
            currentSearchStrategy: currentStrategy
          }
        };
      }
      
      // 其他错误处理
      const lastError = state.errors[state.errors.length - 1];
      let recoveryAction = 'retry';
      
      if (lastError && lastError.error.includes('API')) {
        recoveryAction = 'fallback';
      } else if (currentRetryCount >= maxRetries) {
        recoveryAction = 'abort';
      }
      
      console.log(`🔄 错误恢复策略: ${recoveryAction}`);
      
      return {
        ...state,
        currentStep: recoveryAction === 'abort' ? 'completed' : 'search',
        retryCount: recoveryAction === 'retry' ? currentRetryCount + 1 : currentRetryCount,
        metrics: {
          ...state.metrics,
          errorRecoveryAttempted: true,
          recoveryAction: recoveryAction
        }
      };
      
    } catch (error) {
      console.error('❌ 错误恢复失败:', error);
      return {
        ...state,
        currentStep: 'search', // 即使恢复失败也继续搜索
        retryCount: state.retryCount + 1
      };
    }
  }

  // 条件路由：决定是否继续监控
  shouldContinueMonitoring(state) {
    const timeSinceStart = Date.now() - new Date(state.metrics?.searchTime || Date.now()).getTime();
    const hoursElapsed = timeSinceStart / (1000 * 60 * 60);
    
    // 检查重试限制
    const maxRetries = 3;
    const currentRetryCount = state.retryCount || 0;
    
    // 如果达到最大重试次数，直接完成
    if (currentRetryCount >= maxRetries) {
      console.log('⚠️ 达到最大重试次数，完成监控');
      return 'learn_optimize'; // 修复：使用正确的键名
    }
    
    // 如果没有找到潜在客户，返回搜索重新搜索
    if (!state.prospects || state.prospects.length === 0) {
      console.log(`🔍 没有找到潜在客户，继续搜索... (${currentRetryCount}/${maxRetries})`);
      return 'error_recovery'; // 通过错误恢复重新搜索
    }
    
    // 如果没有发送邮件，跳转到学习优化
    if (!state.sentEmails || state.sentEmails.length === 0) {
      console.log('📧 没有发送邮件，进入学习优化...');
      return 'learn_optimize'; // 修复：使用正确的键名
    }
    
    // 监控1小时后进入学习阶段（缩短时间便于测试）
    if (hoursElapsed > 1) {
      console.log('⏰ 监控时间已到，进入学习优化...');
      return 'learn_optimize'; // 修复：使用正确的键名
    }
    
    // 如果有错误，进入错误恢复
    if (state.errors && state.errors.length > 0 && state.currentStep === 'error') {
      return 'error_recovery';
    }
    
    // 正常情况下进入学习优化
    return 'learn_optimize'; // 修复：使用正确的键名
  }

  // 获取优化的搜索策略
  getOptimizedSearchStrategy(state) {
    // 使用状态中的搜索策略或默认策略
    const searchStrategy = state.searchStrategy || state.campaignGoal || 'business';
    
    const baseStrategy = {
      target_audience: {
        type: state.businessType === 'toc' ? 'toc' : 'tob',
        search_keywords: [searchStrategy],
        primary_segments: []
      },
      value_proposition: searchStrategy
    };
    
    // 如果有重试次数，添加更多搜索关键词
    if (state.retryCount > 0) {
      const additionalKeywords = [
        'CEO', 'founder', 'director', 'manager', 'business owner',
        'technology', 'innovation', 'startup', 'enterprise', 'company'
      ];
      
      // 根据重试次数添加不同的关键词组合
      const keywordIndex = state.retryCount % additionalKeywords.length;
      baseStrategy.target_audience.search_keywords.push(additionalKeywords[keywordIndex]);
      
      console.log(`🔍 重试搜索 #${state.retryCount}，添加关键词: ${additionalKeywords[keywordIndex]}`);
    }
    
    // 从学习数据中应用优化
    const campaignKey = `${state.industry}_${state.businessType}`;
    const learnedPattern = this.learningData.searchPatterns.get(campaignKey);
    
    if (learnedPattern) {
      baseStrategy.target_audience.search_keywords.push(...learnedPattern.effectiveKeywords);
      console.log('🎯 应用学习到的搜索关键词:', learnedPattern.effectiveKeywords);
    }
    
    return baseStrategy;
  }

  // 获取优化的邮件策略
  getOptimizedEmailStrategy(state) {
    const campaignKey = `${state.industry}_${state.businessType}`;
    const learnedEffectiveness = this.learningData.emailEffectiveness.get(campaignKey);
    
    const strategy = {
      tone: 'professional',
      length: 'medium',
      approach: 'direct'
    };
    
    if (learnedEffectiveness) {
      strategy.tone = learnedEffectiveness.bestTone || strategy.tone;
      strategy.length = learnedEffectiveness.bestLength || strategy.length;
      console.log('📧 应用学习到的邮件策略:', strategy);
    }
    
    return strategy;
  }

  // 记录搜索模式
  recordSearchPattern(state, strategy, resultsCount) {
    const campaignKey = `${state.industry}_${state.businessType}`;
    
    if (!this.learningData.searchPatterns.has(campaignKey)) {
      this.learningData.searchPatterns.set(campaignKey, {
        effectiveKeywords: [],
        averageResults: 0,
        totalAttempts: 0
      });
    }
    
    const pattern = this.learningData.searchPatterns.get(campaignKey);
    pattern.totalAttempts++;
    pattern.averageResults = (pattern.averageResults + resultsCount) / pattern.totalAttempts;
    
    // 如果结果好，记录关键词
    if (resultsCount > pattern.averageResults) {
      const keywords = strategy?.target_audience?.search_keywords || [state.campaignGoal];
      pattern.effectiveKeywords.push(...keywords);
      pattern.effectiveKeywords = [...new Set(pattern.effectiveKeywords)]; // 去重
    }
  }

  // 记录邮件效果
  recordEmailEffectiveness(reply) {
    // 分析回复内容确定邮件效果
    const effectiveness = this.analyzeReplyEffectiveness(reply);
    
    const campaignKey = `${reply.industry || 'general'}_${reply.businessType || 'general'}`;
    
    if (!this.learningData.emailEffectiveness.has(campaignKey)) {
      this.learningData.emailEffectiveness.set(campaignKey, {
        totalReplies: 0,
        positiveReplies: 0,
        bestTone: null,
        bestLength: null
      });
    }
    
    const data = this.learningData.emailEffectiveness.get(campaignKey);
    data.totalReplies++;
    
    if (effectiveness.isPositive) {
      data.positiveReplies++;
      data.bestTone = effectiveness.tone;
      data.bestLength = effectiveness.length;
    }
  }

  // 分析回复效果
  analyzeReplyEffectiveness(reply) {
    const content = reply.content.toLowerCase();
    
    const positiveIndicators = ['interested', 'yes', 'please', 'more info', 'tell me more', '感兴趣', '详细', '了解'];
    const negativeIndicators = ['not interested', 'no thanks', 'remove', 'unsubscribe', '不感兴趣', '不需要'];
    
    const isPositive = positiveIndicators.some(indicator => content.includes(indicator));
    const isNegative = negativeIndicators.some(indicator => content.includes(indicator));
    
    return {
      isPositive: isPositive && !isNegative,
      tone: isPositive ? 'friendly' : 'professional',
      length: content.length > 100 ? 'long' : 'short'
    };
  }

  // 分析营销活动性能
  analyzePerformance(state) {
    const totalSent = state.sentEmails.filter(e => e.status === 'sent').length;
    const totalReplies = state.replies.length;
    
    const responseRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;
    
    const positiveReplies = state.replies.filter(reply => 
      this.analyzeReplyEffectiveness(reply).isPositive
    ).length;
    
    const conversionRate = totalReplies > 0 ? (positiveReplies / totalReplies) * 100 : 0;
    
    return {
      totalSent,
      totalReplies,
      responseRate,
      conversionRate,
      prospectsFound: state.prospects.length,
      emailsGenerated: state.emailQueue.length
    };
  }

  // 更新学习数据
  updateLearningData(state, performance) {
    const campaignKey = `${state.industry}_${state.businessType}`;
    
    this.learningData.performanceMetrics.set(campaignKey, {
      ...performance,
      timestamp: new Date().toISOString(),
      campaignId: state.campaignId
    });
    
    console.log('📊 更新学习数据:', { campaignKey, performance });
  }

  // 生成优化建议
  generateOptimizations(performance) {
    const optimizations = [];
    
    if (performance.responseRate < 5) {
      optimizations.push({
        type: 'search_strategy',
        recommendation: '响应率较低，建议优化目标客户搜索策略',
        priority: 'high'
      });
    }
    
    if (performance.conversionRate < 20) {
      optimizations.push({
        type: 'email_content',
        recommendation: '转化率较低，建议优化邮件内容和调性',
        priority: 'medium'
      });
    }
    
    if (performance.prospectsFound < 10) {
      optimizations.push({
        type: 'search_keywords',
        recommendation: '发现客户数量少，建议扩展搜索关键词',
        priority: 'high'
      });
    }
    
    return optimizations;
  }

  // 公共接口：启动统一营销活动
  async startIntelligentCampaign(config) {
    console.log('🚀 启动LangGraph统一营销活动...');
    console.log('🔧 SMTP配置调试:', { 
      smtpConfigExists: !!config.smtpConfig,
      smtpConfigType: typeof config.smtpConfig,
      smtpHost: config.smtpConfig?.host
    });
    
    const initialState = {
      campaignId: `campaign_${Date.now()}`,
      targetWebsite: config.targetWebsite,
      campaignGoal: config.campaignGoal,
      businessType: config.businessType || 'auto',
      smtpConfig: config.smtpConfig || null,
      industry: null,
      businessAnalysis: null,
      marketingStrategy: null,
      currentStep: 'analyze',
      prospects: [],
      emailQueue: [],
      sentEmails: [],
      replies: [],
      metrics: {},
      learningFeedback: [],
      errors: [],
      retryCount: 0,
      searchStrategy: null,
      lastUpdate: new Date().toISOString()
    };
    
    const threadId = `thread_${initialState.campaignId}`;
    
    try {
      // 运行图流程，设置递归限制
      const result = await this.graph.invoke(initialState, {
        configurable: { 
          thread_id: threadId,
          recursionLimit: 100 // 增加递归限制以处理重试
        }
      });
      
      console.log('✅ 统一营销活动完成');
      return {
        success: true,
        campaignId: initialState.campaignId,
        threadId: threadId,
        result: result,
        metrics: result.metrics,
        optimizations: result.learningFeedback
      };
      
    } catch (error) {
      console.error('❌ 统一营销活动失败:', error);
      return {
        success: false,
        error: error.message,
        campaignId: initialState.campaignId
      };
    }
  }

  // 获取营销活动状态
  async getCampaignStatus(threadId) {
    try {
      const checkpoint = await this.checkpointer.get({ configurable: { thread_id: threadId } });
      return checkpoint ? checkpoint.channel_values : null;
    } catch (error) {
      console.error('获取活动状态失败:', error);
      return null;
    }
  }

  // 获取学习数据统计
  getLearningStats() {
    return {
      searchPatterns: Object.fromEntries(this.learningData.searchPatterns),
      emailEffectiveness: Object.fromEntries(this.learningData.emailEffectiveness),
      performanceMetrics: Object.fromEntries(this.learningData.performanceMetrics),
      totalCampaigns: this.learningData.performanceMetrics.size
    };
  }

  // 设置SMTP配置
  async setupSMTP(smtpConfig) {
    console.log('🔧 setupSMTP调试:', {
      smtpConfigExists: !!smtpConfig,
      smtpConfigType: typeof smtpConfig,
      smtpHost: smtpConfig?.host,
      smtpUsername: smtpConfig?.username
    });
    
    if (!smtpConfig) {
      console.log('📧 无SMTP配置，运行在模拟模式');
      this.smtpWorking = false;
      this.transporter = null;
      return;
    }

    try {
      console.log('📧 设置SMTP配置:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        senderName: smtpConfig.senderName
      });
      
      this.transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password
        }
      });

      await this.transporter.verify();
      this.smtpWorking = true;
      console.log('✅ SMTP连接验证成功 - 将发送真实邮件');
      console.log(`📧 发件人配置: ${smtpConfig.senderName} <${smtpConfig.username}>`);
    } catch (error) {
      console.error('❌ SMTP验证失败:', error.message);
      console.log('📧 运行在模拟模式 - 邮件将被记录但不发送');
      this.smtpWorking = false;
      this.transporter = null;
    }
  }

  // 发送单封邮件
  async sendEmail(emailItem, state) {
    const senderInfo = state.businessAnalysis?.senderInfo || {
      senderName: 'Business Development Team',
      companyName: 'AI Solutions'
    };

    const mailOptions = {
      from: `${senderInfo.senderName} <${state.smtpConfig?.username || 'agent@system.com'}>`,
      to: emailItem.prospect.email,
      subject: emailItem.subject,
      html: emailItem.content,
      headers: {
        'X-Campaign-ID': state.campaignId,
        'X-Prospect-ID': emailItem.prospect.id
      }
    };
    
    console.log('📧 邮件发送配置:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    if (this.smtpWorking && this.transporter) {
      // 发送真实邮件
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 真实邮件已发送至 ${emailItem.prospect.email}`);

      // Track in analytics
      const campaignId = emailItem.campaignId || 'workflow_' + Date.now();
      trackEmailSent(campaignId, emailItem.prospect, emailItem.subject, emailItem.body);
      trackEmailDelivered(campaignId, emailItem.prospect.email, result.messageId);

      return result;
    } else {
      // 模拟邮件发送
      const result = {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        response: '邮件模拟发送 - SMTP未配置'
      };
      
      console.log(`📧 模拟邮件发送至 ${emailItem.prospect.email}`);
      console.log(`   主题: ${emailItem.subject}`);
      return result;
    }
  }

  // 生成回退邮件内容
  generateFallbackEmailContent(prospect, state) {
    const senderInfo = state.businessAnalysis?.senderInfo || {
      senderName: 'Business Development Team'
    };

    return `Dear ${prospect.name || 'Business Owner'},

I hope this message finds you well. I'm reaching out because I believe our ${state.campaignGoal} solutions could benefit ${prospect.company || 'your business'}.

Key benefits include:
• Innovation and efficiency
• Competitive advantage
• Scalable solutions

Would you be interested in a brief discussion about how this could help ${prospect.company || 'your business'}?

Best regards,
${senderInfo.senderName}`;
  }

  // 创建回退营销策略
  createFallbackStrategy(businessType, campaignGoal) {
    const type = businessType === 'toc' ? 'toc' : 'tob';
    
    return {
      target_audience: {
        type: type,
        primary_segments: type === 'tob' ? ['SME', 'enterprise'] : ['individual consumers', 'personal users'],
        search_keywords: [campaignGoal || 'promote product', 'contact', 'business'],
        pain_points: type === 'tob' ? 
          ['Operational inefficiency', 'High costs', 'Scalability challenges'] :
          ['Time constraints', 'Complex solutions', 'Value for money']
      },
      messaging_framework: {
        value_proposition: type === 'tob' ? 
          'Comprehensive business solutions for enterprise efficiency' :
          'User-friendly solutions for everyday needs',
        tone: type === 'tob' ? 'professional' : 'friendly',
        key_messages: [
          'Innovative solutions',
          'Proven results',
          'Expert support'
        ]
      },
      campaign_objectives: {
        primary_goal: campaignGoal || 'promote product',
        success_metrics: type === 'tob' ? 
          ['lead generation', 'meeting bookings'] : 
          ['engagement', 'conversion']
      },
      fallback_strategy: true
    };
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    
    try {
      if (!url.startsWith('http')) url = `https://${url}`;
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  /**
   * Extract string value from potentially complex object
   */
  extractStringValue(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value.toString && value.toString() !== '[object Object]') {
      return value.toString();
    }
    return null;
  }
}

module.exports = LangGraphAgent;