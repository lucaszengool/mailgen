import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Mail, Users, DollarSign, 
  Brain, Target, Clock, BarChart3, PieChart, Settings,
  Download, Filter, Search, RefreshCw, Bell, Calendar,
  MousePointer, Eye, UserX, Zap
} from 'lucide-react';

/**
 * AI-Enhanced Email Marketing Dashboard
 * 基于 Mailchimp/HubSpot 最佳实践，集成 AI 增强功能
 */
const EmailDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('last_7_days');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 这里调用我们的 EmailCampaignDashboard API
      const response = await fetch(`/api/email-dashboard/overview?timeRange=${timeRange}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  // KPI卡片组件 (Mailchimp风格)
  const KPICard = ({ title, value, change, trend, icon: Icon, color, benchmark, aiGenerated }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-[#FFD700]/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        {aiGenerated && (
          <div className="flex items-center bg-purple-500/20 px-2 py-1 rounded-full">
            <Brain className="w-3 h-3 text-purple-400 mr-1" />
            <span className="text-xs text-purple-400">AI</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-white">{value}</span>
          {change && (
            <div className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : 
               trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
              {change}
            </div>
          )}
        </div>
        {benchmark && (
          <p className="text-xs text-gray-500">Industry avg: {benchmark}</p>
        )}
      </div>
    </div>
  );

  // 图表组件 (HubSpot风格)
  const TrendChart = ({ title, data, chartType, color, aiGenerated }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {aiGenerated && (
          <div className="flex items-center bg-purple-500/20 px-2 py-1 rounded-full">
            <Brain className="w-3 h-3 text-purple-400 mr-1" />
            <span className="text-xs text-purple-400">AI Predicted</span>
          </div>
        )}
      </div>
      
      {/* 这里应该渲染实际的图表，使用 Chart.js 或 Recharts */}
      <div className="h-40 bg-gray-800/50 rounded-lg flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-gray-600" />
        <span className="ml-2 text-gray-600">Chart: {title}</span>
      </div>
    </div>
  );

  // 活动列表组件 (Mailchimp风格)
  const CampaignList = ({ campaigns }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Campaigns</h3>
        <button className="text-[#FFD700] hover:text-[#FFC107] transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {campaigns?.slice(0, 5).map((campaign, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                campaign.status === 'sent' ? 'bg-green-400' :
                campaign.status === 'sending' ? 'bg-yellow-400' :
                campaign.status === 'scheduled' ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
              <div>
                <h4 className="text-white font-medium">{campaign.name}</h4>
                <p className="text-sm text-gray-400">{campaign.type} • {campaign.recipients} recipients</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="text-white font-medium">{campaign.openRate}%</p>
                <p className="text-gray-400">Open Rate</p>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{campaign.clickRate}%</p>
                <p className="text-gray-400">Click Rate</p>
              </div>
              {campaign.aiScore && (
                <div className="text-center">
                  <div className="flex items-center">
                    <Brain className="w-3 h-3 text-purple-400 mr-1" />
                    <p className="text-white font-medium">{campaign.aiScore}</p>
                  </div>
                  <p className="text-gray-400">AI Score</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // AI洞察面板 (我们的增强功能)
  const AIInsightsPanel = ({ insights }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <Brain className="w-5 h-5 text-purple-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">AI Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights?.optimizationSuggestions?.slice(0, 3).map((suggestion, index) => (
          <div key={index} className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <Target className="w-4 h-4 text-purple-400 mr-2" />
                <span className={`text-xs px-2 py-1 rounded-full ${
                  suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {suggestion.priority.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {Math.round(suggestion.aiConfidence * 100)}% confidence
              </span>
            </div>
            
            <p className="text-white text-sm mb-2">{suggestion.suggestion}</p>
            <p className="text-[#FFD700] text-sm font-medium">{suggestion.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // 受众细分组件 (HubSpot风格)
  const AudienceBreakdown = ({ audience }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Audience Engagement</h3>
      
      <div className="space-y-4">
        {audience?.engagementSegments && Object.entries(audience.engagementSegments).map(([segment, data]) => (
          <div key={segment} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                segment === 'highlyEngaged' ? 'bg-green-400' :
                segment === 'moderatelyEngaged' ? 'bg-yellow-400' :
                segment === 'lowEngaged' ? 'bg-orange-400' : 'bg-red-400'
              }`} />
              <span className="text-white capitalize">{segment.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{data.count}</p>
              <p className="text-sm text-gray-400">{data.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 实时警报组件
  const AlertsPanel = ({ alerts }) => (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-5 h-5 text-orange-400 mr-2" />
        <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
      </div>
      
      <div className="space-y-3">
        {alerts?.slice(0, 3).map((alert, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${
            alert.severity === 'error' ? 'bg-red-500/10 border-red-500' :
            alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
            'bg-blue-500/10 border-blue-500'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {alert.aiGenerated && (
                <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 头部导航 */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Email Marketing Dashboard</h1>
            <p className="text-gray-400">AI-Enhanced Campaign Management</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 时间范围选择器 */}
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
            </select>
            
            <button 
              onClick={fetchDashboardData}
              className="bg-[#FFD700] hover:bg-[#FFC107] text-black px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="p-6 space-y-6">
        {/* KPI卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {dashboardData?.kpiCards?.map((card, index) => (
            <KPICard key={index} {...card} />
          ))}
        </div>

        {/* 图表和洞察区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 性能趋势图表 */}
          {dashboardData?.performanceTrends && Object.entries(dashboardData.performanceTrends).map(([key, trend]) => (
            <TrendChart key={key} {...trend} />
          ))}
        </div>

        {/* 活动和分析区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <CampaignList campaigns={dashboardData?.recentCampaigns} />
            <AudienceBreakdown audience={dashboardData?.audienceBreakdown} />
          </div>
          
          <div className="space-y-6">
            <AIInsightsPanel insights={dashboardData?.aiInsights} />
            <AlertsPanel alerts={dashboardData?.alerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDashboard;