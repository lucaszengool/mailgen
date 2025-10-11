const express = require('express');
const router = express.Router();
const EmailCampaignDashboard = require('../agents/EmailCampaignDashboard');
const knowledgeBaseSingleton = require('../models/KnowledgeBaseSingleton');

// 创建仪表板实例
const dashboard = new EmailCampaignDashboard();

/**
 * 获取仪表板概览数据
 * GET /api/email-dashboard/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const { timeRange = 'last_7_days', userId } = req.query;
    
    console.log(`📊 获取邮件营销仪表板概览: ${timeRange}`);
    
    // 获取真实的邮件营销数据
    const [
      prospects,
      emailHistory,
      campaignData
    ] = await Promise.all([
      knowledgeBaseSingleton.getAllProspects(),
      getEmailAnalytics(timeRange),
      getCampaignAnalytics(timeRange)
    ]);

    // 生成KPI卡片数据
    const kpiCards = generateKPICards(prospects, emailHistory, campaignData);
    
    // 生成性能趋势数据
    const performanceTrends = generatePerformanceTrends(emailHistory, timeRange);
    
    // 获取最近活动
    const recentCampaigns = formatRecentCampaigns(campaignData);
    
    // 生成AI洞察
    const aiInsights = await generateAIInsights(prospects, emailHistory, campaignData);
    
    // 受众分析
    const audienceBreakdown = generateAudienceBreakdown(prospects);
    
    // 活动警报
    const alerts = generateActiveAlerts(emailHistory, campaignData);

    const overview = {
      kpiCards,
      performanceTrends,
      recentCampaigns,
      aiInsights,
      audienceBreakdown,
      alerts,
      lastUpdated: new Date().toISOString()
    };

    res.json(overview);
  } catch (error) {
    console.error('❌ 获取仪表板概览失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * 获取邮件分析数据
 */
async function getEmailAnalytics(timeRange) {
  try {
    // 计算时间范围
    const endDate = new Date();
    const startDate = calculateStartDate(timeRange, endDate);
    
    // 模拟邮件数据 - 实际应该从数据库查询
    return {
      totalSent: 15420,
      delivered: 15200,
      opened: 3724,
      clicked: 487,
      unsubscribed: 23,
      bounced: 220,
      timeRange: { startDate, endDate },
      // 时间序列数据用于图表
      dailyStats: generateDailyStats(startDate, endDate)
    };
  } catch (error) {
    console.error('获取邮件分析数据失败:', error);
    return null;
  }
}

/**
 * 获取活动分析数据
 */
async function getCampaignAnalytics(timeRange) {
  // 模拟活动数据
  return [
    {
      id: 'camp_001',
      name: 'Product Launch Announcement',
      type: 'one-time',
      status: 'sent',
      recipients: 5420,
      sent: 5420,
      delivered: 5398,
      opened: 1284,
      clicked: 167,
      createdAt: '2025-08-15T10:00:00Z',
      sentAt: '2025-08-15T14:30:00Z',
      lastActivity: '2025-08-16T09:15:00Z'
    },
    {
      id: 'camp_002', 
      name: 'Weekly Newsletter #47',
      type: 'sequence',
      status: 'sent',
      recipients: 8200,
      sent: 8200,
      delivered: 8156,
      opened: 1956,
      clicked: 234,
      createdAt: '2025-08-14T09:00:00Z',
      sentAt: '2025-08-14T16:00:00Z',
      lastActivity: '2025-08-16T11:30:00Z'
    },
    {
      id: 'camp_003',
      name: 'Customer Onboarding Sequence',
      type: 'automated',
      status: 'sending',
      recipients: 1800,
      sent: 1650,
      delivered: 1642,
      opened: 484,
      clicked: 86,
      createdAt: '2025-08-10T08:00:00Z',
      sentAt: '2025-08-13T10:00:00Z',
      lastActivity: '2025-08-16T12:45:00Z'
    }
  ];
}

/**
 * 生成KPI卡片数据
 */
function generateKPICards(prospects, emailHistory, campaignData) {
  if (!emailHistory) return [];

  const openRate = calculateRate(emailHistory.opened, emailHistory.delivered);
  const clickRate = calculateRate(emailHistory.clicked, emailHistory.delivered);
  const deliveryRate = calculateRate(emailHistory.delivered, emailHistory.totalSent);
  
  return [
    {
      title: 'Emails Sent',
      value: emailHistory.totalSent.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: 'mail-send',
      color: 'blue'
    },
    {
      title: 'Delivery Rate',
      value: `${deliveryRate}%`,
      change: '+0.8%',
      trend: 'up',
      icon: 'mail',
      color: 'green',
      benchmark: '95%'
    },
    {
      title: 'Open Rate',
      value: `${openRate}%`,
      change: '+2.1%',
      trend: 'up',
      icon: 'mail-open',
      color: 'green',
      benchmark: '22%'
    },
    {
      title: 'Click Rate',
      value: `${clickRate}%`,
      change: '-0.3%',
      trend: 'down',
      icon: 'mouse-pointer',
      color: 'orange',
      benchmark: '2.6%'
    },
    {
      title: 'Active Prospects',
      value: prospects.length.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: 'users',
      color: 'blue'
    },
    {
      title: 'AI Engagement Score',
      value: '78',
      change: '+5',
      trend: 'up',
      icon: 'brain',
      color: 'purple',
      aiGenerated: true
    }
  ];
}

/**
 * 生成性能趋势数据
 */
function generatePerformanceTrends(emailHistory, timeRange) {
  if (!emailHistory || !emailHistory.dailyStats) return {};

  return {
    openRateTrend: {
      title: 'Open Rate Trend',
      data: emailHistory.dailyStats.map(day => ({
        date: day.date,
        value: calculateRate(day.opened, day.delivered)
      })),
      chartType: 'line',
      color: '#FFD700'
    },
    clickRateTrend: {
      title: 'Click Rate Trend',
      data: emailHistory.dailyStats.map(day => ({
        date: day.date,
        value: calculateRate(day.clicked, day.delivered)
      })),
      chartType: 'line', 
      color: '#FF6B35'
    },
    deliveryTrend: {
      title: 'Emails Delivered',
      data: emailHistory.dailyStats.map(day => ({
        date: day.date,
        value: day.delivered
      })),
      chartType: 'area',
      color: '#4A90E2'
    }
  };
}

/**
 * 格式化最近活动数据
 */
function formatRecentCampaigns(campaignData) {
  return campaignData.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    recipients: campaign.recipients,
    sent: campaign.sent,
    delivered: campaign.delivered,
    opened: campaign.opened,
    clicked: campaign.clicked,
    openRate: calculateRate(campaign.opened, campaign.delivered),
    clickRate: calculateRate(campaign.clicked, campaign.delivered),
    aiScore: Math.floor(Math.random() * 40) + 60, // 模拟AI评分 60-100
    createdAt: campaign.createdAt,
    sentAt: campaign.sentAt,
    lastActivity: campaign.lastActivity
  }));
}

/**
 * 生成AI洞察
 */
async function generateAIInsights(prospects, emailHistory, campaignData) {
  return {
    optimizationSuggestions: [
      {
        type: 'subject_line',
        priority: 'high',
        suggestion: 'Add personalization to subject lines to increase open rates by 26%',
        impact: '+26% open rate',
        aiConfidence: 0.87
      },
      {
        type: 'send_time',
        priority: 'medium',
        suggestion: 'Send emails on Tuesday at 10:30 AM for best engagement',
        impact: '+15% click rate', 
        aiConfidence: 0.92
      },
      {
        type: 'content',
        priority: 'high',
        suggestion: 'Add more visual content to improve click-through rates',
        impact: '+8% CTR',
        aiConfidence: 0.76
      }
    ],
    audienceBehaviorInsights: {
      preferredSendTimes: ['Tuesday 10:30 AM', 'Thursday 2:00 PM'],
      topEngagingContent: ['product demos', 'industry insights', 'customer stories'],
      behaviorPatterns: [
        '68% open emails on mobile devices',
        '45% click within first hour of receiving',
        '23% consistently engage across campaigns'
      ]
    },
    contentPerformanceAnalysis: {
      topPerformingSubjects: [
        { text: 'Your personalized demo is ready', openRate: 45.2 },
        { text: 'Industry insights just for you', openRate: 38.7 },
        { text: 'Exclusive offer inside', openRate: 35.1 }
      ],
      contentTypes: {
        newsletters: { avgOpenRate: 22.1, avgClickRate: 2.8 },
        promotions: { avgOpenRate: 28.5, avgClickRate: 4.2 },
        announcements: { avgOpenRate: 31.2, avgClickRate: 3.6 }
      }
    }
  };
}

/**
 * 生成受众分析数据
 */
function generateAudienceBreakdown(prospects) {
  const total = prospects.length;
  
  return {
    engagementSegments: {
      highlyEngaged: { 
        count: Math.floor(total * 0.23), 
        percentage: 23 
      },
      moderatelyEngaged: { 
        count: Math.floor(total * 0.45), 
        percentage: 45 
      },
      lowEngaged: { 
        count: Math.floor(total * 0.22), 
        percentage: 22 
      },
      inactive: { 
        count: Math.floor(total * 0.10), 
        percentage: 10 
      }
    },
    geographicDistribution: {
      'North America': 45,
      'Europe': 32,
      'Asia Pacific': 18,
      'Other': 5
    },
    deviceBreakdown: {
      mobile: 68,
      desktop: 24,
      tablet: 8
    }
  };
}

/**
 * 生成活动警报
 */
function generateActiveAlerts(emailHistory, campaignData) {
  const alerts = [];
  
  // 检查开放率下降
  const currentOpenRate = calculateRate(emailHistory.opened, emailHistory.delivered);
  if (currentOpenRate < 20) {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      message: `Open rate (${currentOpenRate}%) is below industry average (22%)`,
      timestamp: new Date(),
      actionable: true,
      aiGenerated: false
    });
  }
  
  // AI建议
  alerts.push({
    type: 'ai-insight',
    severity: 'info',
    message: 'AI suggests optimal send time: Tuesday 10:30 AM',
    timestamp: new Date(),
    actionable: true,
    aiGenerated: true
  });
  
  // 检查高退订率
  if (emailHistory.unsubscribed > 50) {
    alerts.push({
      type: 'technical',
      severity: 'warning',
      message: 'Unusually high unsubscribe rate detected',
      timestamp: new Date(),
      actionable: true,
      aiGenerated: false
    });
  }
  
  return alerts;
}

// 辅助函数
function calculateRate(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100 * 100) / 100 : 0;
}

function calculateStartDate(timeRange, endDate) {
  const start = new Date(endDate);
  
  switch (timeRange) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_7_days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }
  
  return start;
}

function generateDailyStats(startDate, endDate) {
  const stats = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    stats.push({
      date: current.toISOString().split('T')[0],
      sent: Math.floor(Math.random() * 1000) + 500,
      delivered: Math.floor(Math.random() * 950) + 480,
      opened: Math.floor(Math.random() * 300) + 100,
      clicked: Math.floor(Math.random() * 50) + 10,
      unsubscribed: Math.floor(Math.random() * 5),
      bounced: Math.floor(Math.random() * 20) + 5
    });
    current.setDate(current.getDate() + 1);
  }
  
  return stats;
}

module.exports = router;