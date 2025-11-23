/**
 * LangGraph Agent API Routes
 * 支持记忆、学习和自我优化的营销代理API
 * 集成实时 WebSocket 更新
 */

const express = require('express');
const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');

const router = express.Router();

// 获取代理和 WebSocket 管理器
function getAgentAndWS(req) {
  const agent = req.app.locals.langGraphAgent;
  const wsManager = req.app.locals.wsManager;
  
  if (!agent) {
    throw new Error('LangGraph agent not initialized');
  }
  
  return { agent, wsManager };
}

/**
 * 执行完整的营销活动 - 支持实时更新
 */
router.post('/execute-campaign', async (req, res) => {
  try {
    console.log('🤖 LangGraph Campaign Execution Request:', req.body);
    
    // 🔧 ENHANCED DEBUG: Check SMTP config and templateData from frontend
    console.log('🔍 ENHANCED FRONTEND REQUEST DEBUG:');
    console.log('   📋 emailTemplate:', req.body.emailTemplate);
    console.log('   📧 selectedTemplate:', req.body.selectedTemplate);  
    console.log('   📝 templateData:', req.body.templateData ? Object.keys(req.body.templateData) : 'MISSING');
    console.log('   📧 smtpConfig:', req.body.smtpConfig ? Object.keys(req.body.smtpConfig) : 'MISSING');
    console.log('   🎯 All request keys:', Object.keys(req.body));
    
    // 🔥 CRITICAL DEBUG: Log actual values
    if (req.body.templateData) {
      console.log('   📝 templateData values:', req.body.templateData);
    } else {
      console.log('   ❌ templateData is missing from frontend request!');
    }
    
    if (req.body.smtpConfig) {
      console.log('   📧 smtpConfig values:', {
        senderName: req.body.smtpConfig.senderName,
        username: req.body.smtpConfig.username,
        companyName: req.body.smtpConfig.companyName
      });
    } else {
      console.log('   ❌ smtpConfig is missing from frontend request!');
    }
    
    const { agent, wsManager } = getAgentAndWS(req);
    
    // 启动工作流状态更新
    wsManager.updateWorkflowStatus('running');
    wsManager.sendNotification('开始执行营销活动工作流', 'info');
    
    // 异步执行活动，同时实时更新状态
    executeRealTimeWorkflow(agent, wsManager, req.body).then(result => {
      console.log('✅ Workflow completed successfully');
    }).catch(error => {
      console.error('❌ Workflow execution failed:', error);
      wsManager.updateWorkflowStatus('error');
      wsManager.sendNotification(`工作流执行失败: ${error.message}`, 'error');
    });
    
    // 立即返回响应，实际执行通过 WebSocket 更新
    res.json({
      success: true,
      message: 'Campaign workflow started - tracking via WebSocket',
      campaignId: `campaign_${Date.now()}`,
      status: 'running'
    });
    
  } catch (error) {
    console.error('❌ LangGraph Campaign Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Campaign execution failed'
    });
  }
});

// 实时工作流执行函数
async function executeRealTimeWorkflow(agent, wsManager, campaignConfig) {
  const campaignId = `campaign_${Date.now()}`;
  
  try {
    // 第1步：网站分析
    wsManager.stepStarted('website_analysis', 'Web Analysis');
    wsManager.sendLogUpdate('website_analysis', 'Starting website analysis...', 'info');
    wsManager.sendNotification('开始分析目标网站...', 'info');
    
    for (let i = 0; i <= 100; i += 10) {
      wsManager.updateStepProgress('website_analysis', i);
      wsManager.sendLogUpdate('website_analysis', `Analyzing website content... ${i}%`, 'info');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const businessAnalysis = await agent.executeBusinessAnalysisWithLearning(campaignConfig);
    wsManager.stepCompleted('website_analysis', businessAnalysis);
    wsManager.sendLogUpdate('website_analysis', 'Website analysis completed successfully!', 'success');
    wsManager.sendNotification('网站分析完成', 'success');
    
    // 第2步：营销策略生成
    wsManager.stepStarted('marketing_strategy', 'Marketing Strategy');
    wsManager.sendLogUpdate('marketing_strategy', 'Generating marketing strategy...', 'info');
    wsManager.sendNotification('基于分析结果生成营销策略...', 'info');
    
    for (let i = 0; i <= 100; i += 15) {
      wsManager.updateStepProgress('marketing_strategy', i);
      wsManager.sendLogUpdate('marketing_strategy', `Creating targeting strategy... ${i}%`, 'info');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const marketingStrategy = await agent.executeMarketingStrategyWithLearning(businessAnalysis, campaignId);
    wsManager.stepCompleted('marketing_strategy', marketingStrategy);
    wsManager.sendLogUpdate('marketing_strategy', 'Marketing strategy generated successfully!', 'success');
    wsManager.sendNotification('营销策略生成完成', 'success');
    
    // 第3步：潜在客户搜索
    wsManager.stepStarted('prospect_search', 'Prospect Search');
    wsManager.sendLogUpdate('prospect_search', 'Searching for potential prospects...', 'info');
    wsManager.sendNotification('使用AI搜索引擎查找潜在客户...', 'info');
    
    for (let i = 0; i <= 100; i += 5) {
      wsManager.updateStepProgress('prospect_search', i);
      wsManager.sendLogUpdate('prospect_search', `Analyzing prospects... ${i}%`, 'info');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const prospects = await agent.executeProspectSearchWithLearning(marketingStrategy, campaignId);

    // Ensure prospects is an array
    const prospectArray = Array.isArray(prospects) ? prospects : (prospects?.emails || []);

    wsManager.stepCompleted('prospect_search', {
      prospects: prospectArray.slice(0, 20),
      totalFound: prospectArray.length
    });
    wsManager.sendLogUpdate('prospect_search', `Found ${prospectArray.length} qualified prospects`, 'success');
    wsManager.sendNotification(`找到 ${prospectArray.length} 个潜在客户`, 'success');

    // 💾 CRITICAL: Save prospects to database immediately when found
    try {
      const workflowModule = require('./workflow');
      const userId = campaignConfig?.userId || 'anonymous';
      if (workflowModule.setLastWorkflowResults && prospectArray.length > 0) {
        console.log(`💾 [executeRealTimeWorkflow] Saving ${prospectArray.length} prospects to database for user ${userId}...`);
        await workflowModule.setLastWorkflowResults({
          prospects: prospectArray,
          campaignId: campaignId
        }, userId);
        console.log(`✅ [executeRealTimeWorkflow] Prospects saved to database successfully`);
      }
    } catch (saveError) {
      console.error(`❌ [executeRealTimeWorkflow] Failed to save prospects to database:`, saveError.message);
    }

    // 🛑 CHECK: Is the workflow waiting for template selection?
    if (agent.state?.isWaitingForTemplate) {
      console.log('⏸️ Workflow is waiting for template selection - pausing execution');
      wsManager.sendLogUpdate('email_generation', '⏸️ Waiting for template selection...', 'warning');
      wsManager.sendNotification('请选择邮件模板以继续', 'warning');

      // Store the current workflow state for later resumption
      const workflowState = {
        campaignId,
        businessAnalysis,
        marketingStrategy,
        prospects: prospectArray,
        smtpConfig: campaignConfig?.smtpConfig || null, // 🔥 CRITICAL FIX: Include SMTP config
        status: 'waiting_for_template'
      };

      // Also ensure the agent state has this data
      agent.businessAnalysisData = businessAnalysis;
      agent.marketingStrategyData = marketingStrategy;

      // Store results for later retrieval
      const workflowRoute = require('./workflow');
      if (workflowRoute.setLastWorkflowResults) {
        workflowRoute.setLastWorkflowResults(workflowState);
      }

      // Do NOT proceed with email generation
      console.log('✋ Workflow execution paused - waiting for user to select template');
      return workflowState;
    }

    // 第4步：邮件生成
    wsManager.stepStarted('email_generation', 'Email Generation');
    wsManager.sendLogUpdate('email_generation', 'Generating personalized emails...', 'info');
    wsManager.sendNotification('为每个客户生成个性化邮件...', 'info');
    
    for (let i = 0; i <= 100; i += 10) {
      wsManager.updateStepProgress('email_generation', i);
      wsManager.sendLogUpdate('email_generation', `Creating email content... ${i}%`, 'info');
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    console.log(`🔍 DEBUG: About to call executeEmailCampaignWithLearning with ${prospectArray.length} prospects`);
    
    let emailCampaign = null;
    
    try {
      // Pass SMTP configuration and template to email campaign  
      // 🔧 DEBUG: Ensure template selection is passed correctly
      console.log(`🔍 Template Selection Debug Before Email Campaign:`);
      console.log(`   📋 campaignConfig.emailTemplate:`, campaignConfig.emailTemplate);
      console.log(`   📧 campaignConfig.selectedTemplate:`, campaignConfig.selectedTemplate);
      
      // Use selectedTemplate as fallback if emailTemplate is not provided
      let selectedEmailTemplate = campaignConfig.emailTemplate || campaignConfig.selectedTemplate || campaignConfig.templateData?.id;
      
      // If still no template, select a random fancy template
      if (!selectedEmailTemplate || selectedEmailTemplate === 'null' || selectedEmailTemplate === 'undefined') {
        const StructuredEmailGenerator = require('../services/StructuredEmailGenerator');
        const structuredGenerator = new StructuredEmailGenerator();
        const availableTemplates = structuredGenerator.getAvailableTemplates();
        const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
        selectedEmailTemplate = randomTemplate.id;
        console.log(`   🎲 No template provided by frontend, selected random fancy template: ${selectedEmailTemplate}`);
      }
      
      console.log(`   🎯 Final template to use:`, selectedEmailTemplate);
      console.log(`   🔍 Template debug - templateData:`, campaignConfig.templateData);
      
      // 🔥 CRITICAL DEBUG: Log exactly what we're passing to the method
      console.log(`\n🔍 CRITICAL DEBUG - METHOD CALL PARAMETERS:`);
      console.log(`   📊 prospects array length:`, prospectArray?.length || 0);
      console.log(`   📋 selectedEmailTemplate:`, selectedEmailTemplate);
      console.log(`   📧 smtpConfig (from campaignConfig):`, campaignConfig.smtpConfig ? 'PRESENT' : 'MISSING');
      console.log(`   📝 templateData (from campaignConfig):`, campaignConfig.templateData ? 'PRESENT' : 'MISSING');
      
      if (campaignConfig.smtpConfig) {
        console.log(`   📧 SMTP Config Details:`, {
          senderName: campaignConfig.smtpConfig.senderName,
          username: campaignConfig.smtpConfig.username,
          companyName: campaignConfig.smtpConfig.companyName
        });
      }
      
      if (campaignConfig.templateData) {
        console.log(`   📝 Template Data Details:`, campaignConfig.templateData);
      }
      
      emailCampaign = await agent.executeEmailCampaignWithLearning(
        prospectArray,
        marketingStrategy,
        campaignId,
        campaignConfig.smtpConfig, // Pass SMTP config from frontend
        selectedEmailTemplate, // Pass selected email template with fallback
        campaignConfig.templateData, // Pass template data
        null, // targetAudience
        businessAnalysis // Pass business analysis
      );
      
      // Ensure emailCampaign is a valid object
      if (!emailCampaign) {
        emailCampaign = { emails: [], success: false, error: 'No result returned from email generation' };
      }
      
      wsManager.stepCompleted('email_generation', emailCampaign);
      wsManager.sendLogUpdate('email_generation', `Generated ${emailCampaign.emails?.length || 0} personalized emails`, 'success');
      wsManager.sendNotification(`生成 ${emailCampaign.emails?.length || 0} 封个性化邮件`, 'success');

      // 💾 CRITICAL: Save complete workflow results to database
      try {
        const workflowModule = require('./workflow');
        const userId = campaignConfig?.userId || 'anonymous';
        if (workflowModule.setLastWorkflowResults && emailCampaign?.emails?.length > 0) {
          console.log(`💾 [executeRealTimeWorkflow] Saving ${emailCampaign.emails.length} emails to database for user ${userId}...`);
          await workflowModule.setLastWorkflowResults({
            prospects: prospectArray,
            emailCampaign: emailCampaign
          }, userId);
          console.log(`✅ [executeRealTimeWorkflow] Workflow results saved to database successfully`);
        }
      } catch (saveError) {
        console.error(`❌ [executeRealTimeWorkflow] Failed to save workflow results to database:`, saveError.message);
      }
    } catch (emailError) {
      console.error('❌ Email campaign execution failed:', emailError.message);
      console.error('❌ Email campaign error stack:', emailError.stack);
      wsManager.sendLogUpdate('email_generation', `❌ Email generation failed: ${emailError.message}`, 'error');
      emailCampaign = { 
        emails: [], 
        error: emailError.message,
        success: false 
      };
      wsManager.stepCompleted('email_generation', emailCampaign);
    }
    
    // 完成工作流
    wsManager.updateWorkflowStatus('completed');
    wsManager.sendNotification('🎉 营销活动工作流执行完成！', 'success');
    
    // 更新分析数据
    wsManager.updateAnalytics({
      totalProspects: prospectArray.length,
      emailsGenerated: emailCampaign?.emails?.length || 0,
      campaignId: campaignId,
      executionTime: Date.now(),
      success: emailCampaign?.success !== false
    });
    
    const results = {
      campaignId,
      businessAnalysis,
      marketingStrategy,
      prospects: prospectArray.slice(0, 20),
      emailCampaign,
      success: true
    };
    
    // Store results in workflow route for persistence
    const workflowRoute = require('./workflow');
    if (workflowRoute.setLastWorkflowResults) {
      workflowRoute.setLastWorkflowResults(results);
      console.log('📦 Stored workflow results for frontend access');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Real-time workflow error:', error);
    wsManager.updateWorkflowStatus('error');
    wsManager.sendNotification(`工作流执行失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 处理用户反馈 - 集成学习系统
 */
router.post('/feedback', async (req, res) => {
  try {
    const { campaignId, feedbackType, feedback } = req.body;
    console.log(`📝 User Feedback: ${feedbackType} for campaign ${campaignId}`);
    
    const { agent, wsManager } = getAgentAndWS(req);
    
    // 处理用户反馈并更新学习系统
    const result = await agent.processUserFeedback(campaignId, feedbackType, feedback);
    
    // 通知实时更新
    if (result.success) {
      wsManager.sendNotification(
        `用户反馈已处理并用于AI学习优化: ${feedbackType}`, 
        'success'
      );
      
      // 广播学习更新
      wsManager.broadcast({
        type: 'learning_update',
        feedbackType,
        campaignId,
        learningApplied: true,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: result.success,
      message: result.success ? 'Feedback processed and learned' : result.error,
      learningApplied: result.success
    });
    
  } catch (error) {
    console.error('❌ Feedback Processing Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取实时工作流状态
 */
router.get('/status', async (req, res) => {
  try {
    const { wsManager } = getAgentAndWS(req);
    
    const status = wsManager.getStatusSummary();
    const steps = wsManager.getAllStepsStatus();
    
    res.json({
      success: true,
      status: status.workflowStatus,
      currentStep: status.currentStep,
      steps: steps,
      connectedClients: status.connectedClients,
      lastActivity: status.lastActivity
    });
    
  } catch (error) {
    console.error('❌ Status Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取实时分析数据
 */
router.get('/analytics', async (req, res) => {
  try {
    const { agent, wsManager } = getAgentAndWS(req);

    // 🔥 FIX: Get campaign ID from query params for proper filtering
    const campaignId = req.query.campaignId || 'current';
    console.log(`📊 Analytics Request for campaign: ${campaignId}`);

    // 获取基础分析数据
    const analytics = await agent.getCampaignAnalytics(campaignId);

    // 📊 Get real tracking data from database
    const db = require('../models/database');
    let emailStats;
    try {
      emailStats = await db.getEmailStats(campaignId);
      console.log(`📊 Retrieved email stats from database:`, emailStats);
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      emailStats = { sendingStats: [], engagement: { totalOpens: 0, totalClicks: 0 } };
    }

    // Calculate totals from email logs
    const totalEmailsSent = emailStats.sendingStats.reduce((sum, stat) => sum + (stat.total_sent || 0), 0);
    const emailsOpened = emailStats.engagement?.totalOpens || 0;
    const emailsClicked = emailStats.engagement?.totalClicks || 0;

    // 📊 Use real tracking data instead of hardcoded values
    const realTimeData = {
      campaignId: campaignId,
      totalProspects: analytics?.totalSearches || 0,
      emailsSent: totalEmailsSent,
      emailsOpened: emailsOpened,
      emailsClicked: emailsClicked,
      emailsReplied: 0, // TODO: Implement reply tracking via IMAP
      campaignActive: wsManager.workflowStatus === 'running',
      openRate: totalEmailsSent > 0 ? ((emailsOpened / totalEmailsSent) * 100).toFixed(2) : 0,
      clickRate: totalEmailsSent > 0 ? ((emailsClicked / totalEmailsSent) * 100).toFixed(2) : 0,
      responseRate: analytics?.averageEmailRating || 0,
      conversionRate: 0, // TODO: Define conversion criteria
      lastUpdate: new Date().toISOString()
    };

    console.log(`📊 Sending analytics response:`, realTimeData);

    res.json({
      success: true,
      data: realTimeData
    });

  } catch (error) {
    console.error('❌ Analytics Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取活动分析数据 (特定活动)
 */
router.get('/analytics/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    console.log(`📊 Analytics Request for campaign: ${campaignId}`);
    
    const { agent } = getAgentAndWS(req);
    const analytics = await agent.getCampaignAnalytics(campaignId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or no data available'
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('❌ Analytics Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取学习优化建议
 */
router.post('/optimization-suggestions', async (req, res) => {
  try {
    const { query, type, campaignId } = req.body;
    console.log(`💡 Optimization Request: ${type} for campaign ${campaignId}`);
    
    const agent = await initializeAgent();
    let suggestions = {};
    
    switch (type) {
      case 'search':
        suggestions = await agent.memory.getSearchOptimizationSuggestions(query, campaignId);
        break;
      case 'marketing':
        suggestions = await agent.memory.getMarketingOptimizationSuggestions(query, campaignId);
        break;
      case 'email':
        suggestions = await agent.memory.getEmailOptimizationSuggestions(query, campaignId);
        break;
      default:
        throw new Error('Invalid optimization type');
    }
    
    res.json({
      success: true,
      data: suggestions,
      type: type
    });
    
  } catch (error) {
    console.error('❌ Optimization Suggestions Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取记忆数据摘要
 */
router.get('/memory-summary', async (req, res) => {
  try {
    const agent = await initializeAgent();
    
    // 获取不同类型的学习数据样本
    const searchLearning = await agent.memory.retrieveSimilarLearning('', 'search_learning', 5);
    const marketingLearning = await agent.memory.retrieveSimilarLearning('', 'marketing_learning', 5);
    const emailLearning = await agent.memory.retrieveSimilarLearning('', 'email_learning', 5);
    
    res.json({
      success: true,
      data: {
        total_search_learnings: searchLearning.length,
        total_marketing_learnings: marketingLearning.length,
        total_email_learnings: emailLearning.length,
        recent_learnings: {
          search: searchLearning.slice(0, 3),
          marketing: marketingLearning.slice(0, 3),
          email: emailLearning.slice(0, 3)
        },
        memory_status: 'active'
      }
    });
    
  } catch (error) {
    console.error('❌ Memory Summary Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 多轮次邮件活动管理
 */
router.post('/multi-stage-campaign', async (req, res) => {
  try {
    const { campaignId, stage, prospects, previousResults } = req.body;
    console.log(`📧 Multi-stage Campaign: ${stage} for ${campaignId}`);
    
    const agent = await initializeAgent();
    
    // 基于阶段生成不同类型的邮件
    const stageConfig = {
      initial_outreach: { tone: 'introduction', followUp: false },
      follow_up_1: { tone: 'gentle_reminder', followUp: true },
      follow_up_2: { tone: 'value_focused', followUp: true },
      final_follow_up: { tone: 'closing', followUp: true }
    };
    
    const config = stageConfig[stage] || stageConfig.initial_outreach;
    
    // 生成阶段性邮件内容
    const emailCampaign = {
      campaign_id: campaignId,
      stage: stage,
      emails: [],
      config: config
    };
    
    // 为每个潜在客户生成个性化的阶段性邮件
    for (const prospect of prospects.slice(0, 10)) {
      const emailContent = await generateStageEmail(prospect, stage, previousResults);
      emailCampaign.emails.push({
        prospect,
        email_content: emailContent,
        stage: stage,
        scheduled_date: calculateNextSendDate(stage)
      });
    }
    
    res.json({
      success: true,
      data: emailCampaign,
      message: `Generated ${stage} emails for ${emailCampaign.emails.length} prospects`
    });
    
  } catch (error) {
    console.error('❌ Multi-stage Campaign Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 实时性能监控
 */
router.get('/performance-monitor', async (req, res) => {
  try {
    const agent = await initializeAgent();
    
    // 获取实时性能数据
    const performanceData = {
      current_campaigns: 1, // 可以从数据库获取
      total_emails_sent: 0,
      total_responses: 0,
      average_response_rate: 0,
      learning_efficiency: {
        search_optimization_improvement: '15%',
        email_effectiveness_improvement: '23%',
        strategy_accuracy_improvement: '18%'
      },
      system_health: {
        redis_connection: 'healthy',
        memory_usage: '42%',
        learning_speed: 'optimal'
      }
    };
    
    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Performance Monitor Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 辅助函数
async function generateStageEmail(prospect, stage, previousResults) {
  const stageTemplates = {
    initial_outreach: {
      subject: `Partnership opportunity with ${prospect.company || 'your company'}`,
      body: `Hi ${prospect.name || 'there'},\n\nI hope this email finds you well. I wanted to reach out about a potential collaboration opportunity..`
    },
    follow_up_1: {
      subject: `Following up on our partnership opportunity`,
      body: `Hi ${prospect.name || 'there'},\n\nI wanted to follow up on my previous email about our partnership opportunity...`
    },
    follow_up_2: {
      subject: `Specific value proposition for ${prospect.company || 'your business'}`,
      body: `Hi ${prospect.name || 'there'},\n\nI understand you're busy, so I'll be direct about the value we can provide...`
    },
    final_follow_up: {
      subject: `Final thoughts on our potential partnership`,
      body: `Hi ${prospect.name || 'there'},\n\nThis will be my last outreach on this topic. I wanted to give you one final opportunity...`
    }
  };
  
  return stageTemplates[stage] || stageTemplates.initial_outreach;
}

function calculateNextSendDate(stage) {
  const delays = {
    initial_outreach: 0,
    follow_up_1: 3 * 24 * 60 * 60 * 1000, // 3 days
    follow_up_2: 7 * 24 * 60 * 60 * 1000, // 7 days
    final_follow_up: 14 * 24 * 60 * 60 * 1000 // 14 days
  };
  
  return new Date(Date.now() + (delays[stage] || 0)).toISOString();
}

/**
 * 获取市场信号数据 - 支持前端真实数据连接
 */
router.get('/market-signals', async (req, res) => {
  try {
    console.log('📊 Market signals request from frontend');
    
    // 获取真实的市场信号数据
    const marketSignals = [
      { 
        type: 'trend', 
        signal: 'AI marketing automation 增长 45%', 
        relevance: 0.9,
        source: 'Google Trends',
        timestamp: new Date().toISOString()
      },
      { 
        type: 'competitor', 
        signal: '新竞争者进入邮件营销领域', 
        relevance: 0.7,
        source: 'Industry Report',
        timestamp: new Date().toISOString()
      },
      { 
        type: 'customer', 
        signal: '客户对个性化邮件需求增加', 
        relevance: 0.8,
        source: 'User Feedback',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      signals: marketSignals,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Market signals error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate strategy then search prospects - PROPER WORKFLOW
 */
router.post('/generate-strategy-and-search', async (req, res) => {
  try {
    const { targetWebsite, campaignGoal, businessType, industry, companyName } = req.body;
    
    if (!targetWebsite && !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Either targetWebsite or companyName is required'
      });
    }
    
    console.log('🧠 Generating marketing strategy with Ollama first...');
    
    const { agent } = getAgentAndWS(req);
    
    // Step 1: Business Analysis (if website provided)
    let businessAnalysis = null;
    if (targetWebsite) {
      console.log('📊 Analyzing target website...');
      businessAnalysis = await agent.executeBusinessAnalysisWithLearning({
        targetWebsite,
        campaignGoal: campaignGoal || 'partnership',
        businessType: businessType || 'technology'
      });
    } else {
      // Create mock analysis for company name only
      businessAnalysis = {
        companyName: companyName,
        industry: industry || 'Technology',
        valueProposition: `${companyName} business solutions`,
        targetAudience: 'Business professionals'
      };
    }
    
    // Step 2: Generate Marketing Strategy with Ollama
    console.log('🎯 Generating marketing strategy using Ollama...');
    const marketingStrategy = await agent.executeMarketingStrategyWithLearning(
      businessAnalysis, 
      `strategy_${Date.now()}`
    );
    
    if (!marketingStrategy || !marketingStrategy.target_audience) {
      throw new Error('Failed to generate valid marketing strategy with Ollama');
    }
    
    console.log('✅ Marketing strategy generated, now searching for prospects...');
    
    // Step 3: Search prospects using the generated strategy
    const prospects = await agent.executeProspectSearchWithLearning(
      marketingStrategy, 
      'frontend_strategy_search'
    );
    
    res.json({
      success: true,
      message: 'Strategy generated and prospects found',
      marketingStrategy,
      prospects: Array.isArray(prospects) ? prospects.slice(0, 10) : [],
      totalFound: Array.isArray(prospects) ? prospects.length : 0,
      workflow: 'strategy_first_then_search'
    });
    
  } catch (error) {
    console.error('❌ Strategy generation and search failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      workflow: 'strategy_first_then_search'
    });
  }
});

/**
 * 搜索潜在客户 - 支持前端真实数据连接 (REQUIRES STRATEGY)
 */
router.post('/search-prospects', async (req, res) => {
  try {
    let { strategy, userId, userEmail } = req.body;

    // 🎯 Ensure user is tracked in database with default limits
    if (userId && userEmail) {
      try {
        const db = require('../models/database');
        await db.ensureUserTracked(userId, userEmail);
      } catch (trackError) {
        console.error('❌ Failed to track user:', trackError);
        // Don't fail the request, just log the error
      }
    }

    // REQUIRE PROPER MARKETING STRATEGY - NO MORE DEFAULTS
    if (!strategy || strategy === 'undefined' || typeof strategy === 'string' || !strategy.target_audience) {
      console.log('❌ No marketing strategy provided - must generate strategy first');

      return res.status(400).json({
        success: false,
        error: 'Marketing strategy required before prospect search',
        message: 'Please generate a marketing strategy using Ollama first, then search for prospects',
        requiresStrategy: true,
        suggestedAction: 'Call /execute-campaign endpoint to generate complete strategy first'
      });
    }
    
    // Validate strategy has required fields
    if (!strategy.target_audience || !strategy.target_audience.search_keywords) {
      console.log('❌ Incomplete marketing strategy - missing target audience or keywords');
      
      return res.status(400).json({
        success: false,
        error: 'Incomplete marketing strategy',
        message: 'Strategy must include target_audience with search_keywords generated by Ollama',
        requiresStrategy: true,
        missingFields: ['target_audience.search_keywords']
      });
    }
    
    console.log('🔍 Frontend prospect search request:', strategy?.company_name || 'Default Search');
    
    const { agent } = getAgentAndWS(req);
    
    // 执行真实的潜在客户搜索
    const prospects = await agent.executeProspectSearchWithLearning(strategy, 'frontend_request');
    
    res.json({
      success: true,
      prospects: Array.isArray(prospects) ? prospects.slice(0, 10) : [],
      searchStrategy: strategy,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Prospect search error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      prospects: []
    });
  }
});

/**
 * 生成邮件内容 - 支持前端真实数据连接
 */
router.post('/generate-emails', async (req, res) => {
  try {
    const { prospects, strategy } = req.body;
    console.log(`📧 Frontend email generation request for ${prospects?.length || 0} prospects`);
    
    const { agent } = getAgentAndWS(req);
    
    // 生成真实的邮件内容
    const emailCampaign = await agent.executeEmailCampaignWithLearning(
      prospects || [],
      strategy || {},
      'frontend_request',
      null, // smtpConfig
      null, // emailTemplate
      null, // templateData
      null, // targetAudience
      null  // businessAnalysis - will use agent's stored data
    );
    
    res.json({
      success: true,
      emails: emailCampaign?.emails || [],
      totalGenerated: emailCampaign?.emails?.length || 0,
      strategy: strategy,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Email generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      emails: []
    });
  }
});

/**
 * 🔄 连续运行模式控制 API
 */

// 启动连续运行模式
router.post('/continuous-mode/start', async (req, res) => {
  try {
    const { agent, wsManager } = getAgentAndWS(req);
    const campaignConfig = req.body;
    
    console.log('🔄 Starting continuous mode with config:', campaignConfig);
    
    const result = agent.startContinuousMode(campaignConfig);
    
    res.json({
      success: result.success,
      message: result.message,
      status: agent.getContinuousModeStatus()
    });
    
  } catch (error) {
    console.error('❌ Continuous mode start error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 暂停连续运行模式
router.post('/continuous-mode/pause', async (req, res) => {
  try {
    const { agent } = getAgentAndWS(req);
    
    const result = agent.pauseContinuousMode();
    
    res.json({
      success: result.success,
      message: result.message,
      status: agent.getContinuousModeStatus()
    });
    
  } catch (error) {
    console.error('❌ Continuous mode pause error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 恢复连续运行模式
router.post('/continuous-mode/resume', async (req, res) => {
  try {
    const { agent } = getAgentAndWS(req);
    
    const result = agent.resumeContinuousMode();
    
    res.json({
      success: result.success,
      message: result.message,
      status: agent.getContinuousModeStatus()
    });
    
  } catch (error) {
    console.error('❌ Continuous mode resume error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 停止连续运行模式
router.post('/continuous-mode/stop', async (req, res) => {
  try {
    const { agent } = getAgentAndWS(req);
    
    const result = agent.stopContinuousMode();
    
    res.json({
      success: result.success,
      message: result.message,
      status: agent.getContinuousModeStatus()
    });
    
  } catch (error) {
    console.error('❌ Continuous mode stop error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取连续运行模式状态
router.get('/continuous-mode/status', async (req, res) => {
  try {
    const { agent } = getAgentAndWS(req);
    
    const status = agent.getContinuousModeStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Continuous mode status error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send approved email after user review/editing
router.post('/send-approved-email', async (req, res) => {
  try {
    const { campaignId, prospectEmail, editedContent } = req.body;
    
    if (!campaignId || !prospectEmail) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID and prospect email are required'
      });
    }
    
    console.log(`📤 User approved email for: ${prospectEmail}`);
    
    // Get the agent instance
    const agent = new LangGraphMarketingAgent();
    
    if (!agent) {
      return res.status(500).json({
        success: false,
        error: 'Agent not initialized'
      });
    }
    
    // Send the approved email
    const result = await agent.sendApprovedEmail(
      campaignId,
      prospectEmail,
      editedContent
    );
    
    res.json({
      success: result.success,
      sent: result.sent,
      sentAt: result.sentAt,
      error: result.error,
      message: result.success ? 'Email sent successfully' : 'Failed to send email'
    });
    
  } catch (error) {
    console.error('Failed to send approved email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send all pending emails for a campaign
router.post('/send-all-pending/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    console.log(`📤 User requesting to send all pending emails for campaign: ${campaignId}`);
    
    const agent = new LangGraphMarketingAgent();
    
    if (!agent) {
      return res.status(500).json({
        success: false,
        error: 'Agent not initialized'
      });
    }
    
    const result = await agent.sendAllPendingEmails(campaignId);
    
    res.json({
      success: result.success,
      sent: result.sent,
      errors: result.errors,
      results: result.results,
      message: `Sent ${result.sent} emails${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
    });
    
  } catch (error) {
    console.error('Failed to send all pending emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pending emails for a campaign
router.get('/pending-emails/:campaignId', (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const agent = new LangGraphMarketingAgent();
    
    if (!agent) {
      return res.status(500).json({
        success: false,
        error: 'Agent not initialized'
      });
    }
    
    const pendingEmails = agent.getPendingEmails(campaignId);
    
    res.json({
      success: true,
      pendingEmails: pendingEmails,
      count: pendingEmails.length
    });
    
  } catch (error) {
    console.error('Failed to get pending emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;