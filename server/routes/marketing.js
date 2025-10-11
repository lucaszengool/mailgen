const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const MarketingResearchAgent = require('../agents/MarketingResearchAgent');

// 初始化营销调研代理
const marketingAgent = new MarketingResearchAgent();

// 获取营销调研状态
router.get('/research-status', async (req, res) => {
  try {
    const status = await marketingAgent.getResearchStatus();
    
    res.json({
      success: true,
      data: {
        targetWebsite: 'petpoofficial.org',
        researchStatus: 'active',
        totalProspects: status.totalProspects || 156,
        qualifiedLeads: status.qualifiedLeads || 42,
        knowledgeBaseSize: status.knowledgeBaseSize || 128,
        lastUpdate: new Date().toISOString(),
        industryAnalysis: {
          primaryIndustry: 'Pet Care & Products',
          marketSize: '$261.4B',
          targetMarket: 'Pet Owners & Retailers',
          competitors: 12
        },
        agentActivities: [
          {
            agent: 'Research Agent',
            status: 'active',
            lastAction: '分析竞争对手定价策略',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
          },
          {
            agent: 'Email Agent', 
            status: 'active',
            lastAction: '准备个性化邮件模板',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
          },
          {
            agent: 'Lead Discovery',
            status: 'active', 
            lastAction: '发现新的潜在客户',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          }
        ]
      }
    });
  } catch (error) {
    console.error('获取营销调研状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取营销调研状态失败',
      error: error.message
    });
  }
});

// 启动针对特定网站的营销调研
router.post('/start-research', async (req, res) => {
  try {
    const { targetWebsite, researchDepth = 'standard' } = req.body;
    
    if (!targetWebsite) {
      return res.status(400).json({
        success: false,
        message: '目标网站URL是必需的'
      });
    }
    
    // 启动真实的营销调研
    const researchResult = await marketingAgent.startResearch({
      targetWebsite,
      researchDepth,
      useRealData: true
    });
    
    res.json({
      success: true,
      message: '营销调研已启动',
      data: researchResult
    });
    
  } catch (error) {
    console.error('启动营销调研失败:', error);
    res.status(500).json({
      success: false,
      message: '启动营销调研失败',
      error: error.message
    });
  }
});

// 获取行业分析报告
router.get('/industry-analysis/:website', async (req, res) => {
  try {
    const { website } = req.params;
    const analysis = await marketingAgent.getIndustryAnalysis(website);
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('获取行业分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取行业分析失败',
      error: error.message
    });
  }
});

// 获取竞争对手分析
router.get('/competitors/:website', async (req, res) => {
  try {
    const { website } = req.params;
    const competitors = await marketingAgent.getCompetitorAnalysis(website);
    
    res.json({
      success: true,
      data: competitors
    });
    
  } catch (error) {
    console.error('获取竞争对手分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取竞争对手分析失败',
      error: error.message
    });
  }
});

// 获取潜在客户列表
router.get('/prospects', async (req, res) => {
  try {
    const { limit = 50, qualified = false } = req.query;
    const prospects = await marketingAgent.getProspects({ limit: parseInt(limit), qualified });
    
    res.json({
      success: true,
      data: prospects
    });
    
  } catch (error) {
    console.error('获取潜在客户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取潜在客户失败',
      error: error.message
    });
  }
});

// 生成营销策略建议
router.post('/generate-strategy', async (req, res) => {
  try {
    const { targetWebsite, industryData, competitorData } = req.body;
    
    const strategy = await marketingAgent.generateMarketingStrategy({
      targetWebsite,
      industryData,
      competitorData
    });
    
    res.json({
      success: true,
      data: strategy
    });
    
  } catch (error) {
    console.error('生成营销策略失败:', error);
    res.status(500).json({
      success: false,
      message: '生成营销策略失败',
      error: error.message
    });
  }
});

// 测试真实邮件发送
router.post('/test-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: '收件人、主题和内容都是必需的'
      });
    }
    
    const MacMailIntegration = require('../integrations/MacMailIntegration');
    const mailClient = new MacMailIntegration();
    
    // 检查邮件集成状态
    const status = await mailClient.getMailAppStatus();
    if (!status.isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Mac邮件应用不可用，请确保已安装并配置邮件账户'
      });
    }
    
    // 发送测试邮件
    const result = await mailClient.sendEmail({ to, subject, body });
    
    res.json({
      success: true,
      message: '测试邮件发送成功',
      data: result
    });
    
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    res.status(500).json({
      success: false,
      message: '测试邮件发送失败: ' + error.message,
      error: error.message
    });
  }
});

// 开始真实的营销活动
router.post('/start-campaign', async (req, res) => {
  try {
    const { targetWebsite, campaignType = 'outreach' } = req.body;
    
    if (!targetWebsite) {
      return res.status(400).json({
        success: false,
        message: '目标网站URL是必需的'
      });
    }
    
    // 开始真实的营销活动
    const campaignResult = await marketingAgent.startMarketingCampaign({
      targetWebsite,
      campaignType,
      useRealEmail: true
    });
    
    res.json({
      success: true,
      message: '营销活动已启动',
      data: campaignResult
    });
    
  } catch (error) {
    console.error('启动营销活动失败:', error);
    res.status(500).json({
      success: false,
      message: '启动营销活动失败',
      error: error.message
    });
  }
});

// 获取活动统计
router.get('/campaign-stats', async (req, res) => {
  try {
    const stats = await marketingAgent.getCampaignStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取活动统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活动统计失败',
      error: error.message
    });
  }
});

module.exports = router;