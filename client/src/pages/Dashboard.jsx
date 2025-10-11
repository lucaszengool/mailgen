import { useState, useEffect } from 'react'
import { 
  EnvelopeIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fed7aa', '#9ca3af']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [realtimeData, setRealtimeData] = useState(null)
  const [marketingData, setMarketingData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    // 每30秒刷新一次实时数据
    const interval = setInterval(fetchRealtimeData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [overviewRes, realtimeRes, marketingRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/realtime'),
        fetch('/api/marketing/research-status')
      ])
      
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        setStats(overviewData.data)
      }
      
      if (realtimeRes.ok) {
        const realtimeResult = await realtimeRes.json()
        setRealtimeData(realtimeResult.data)
      }

      if (marketingRes.ok) {
        const marketingResult = await marketingRes.json()
        setMarketingData(marketingResult.data)
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime')
      if (response.ok) {
        const data = await response.json()
        setRealtimeData(data.data)
      }
    } catch (error) {
      console.error('获取实时数据失败:', error)
    }
  }

  const MetricCard = ({ title, value, change, icon: Icon, color = 'primary' }) => (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-yellow-400 transition-all duration-200">
      <div className="flex items-center">
        <div className="p-3 rounded-lg bg-yellow-400 bg-opacity-20">
          <Icon className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <span className="mt-4 text-gray-300">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  // 模拟数据（如果API没有返回数据）
  const displayStats = stats || {
    totalSent: 1250,
    successfulSent: 1180,
    totalOpens: 295,
    totalClicks: 89,
    deliveryRate: 94.4,
    openRate: 25.0,
    clickRate: 7.1,
    trendData: [
      { date: '2024-01-01', sent: 120, successful: 115 },
      { date: '2024-01-02', sent: 150, successful: 142 },
      { date: '2024-01-03', sent: 180, successful: 168 },
      { date: '2024-01-04', sent: 200, successful: 185 },
      { date: '2024-01-05', sent: 170, successful: 160 },
      { date: '2024-01-06', sent: 220, successful: 205 },
      { date: '2024-01-07', sent: 210, successful: 200 }
    ]
  }

  const displayRealtimeData = realtimeData || {
    todaySent: 45,
    todayOpened: 12,
    todayClicked: 3,
    activeCampaigns: 2,
    recentActivity: [
      {
        type: 'email_opened',
        email: 'zhang@example.com',
        campaign: '产品推广活动',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        type: 'email_sent',
        count: 25,
        campaign: '客户关怀邮件',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  }

  // 营销调研数据
  const displayMarketingData = marketingData || {
    targetWebsite: 'petpoofficial.org',
    researchStatus: 'active',
    totalProspects: 156,
    qualifiedLeads: 42,
    knowledgeBaseSize: 128,
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

  const pieData = [
    { name: 'Delivered', value: displayStats.successfulSent, color: '#FCD34D' },
    { name: 'Failed', value: displayStats.totalSent - displayStats.successfulSent, color: '#EF4444' }
  ]

  return (
    <div className="min-h-screen bg-black text-white space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-bold text-yellow-400">Email Marketing Dashboard</h1>
        <p className="mt-2 text-gray-300">Professional email campaign analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="今日发送"
          value={displayRealtimeData.todaySent}
          change={12.5}
          icon={EnvelopeIcon}
          color="primary"
        />
        <MetricCard
          title="今日打开"
          value={displayRealtimeData.todayOpened}
          change={8.3}
          icon={EyeIcon}
          color="success"
        />
        <MetricCard
          title="今日点击"
          value={displayRealtimeData.todayClicked}
          change={-2.1}
          icon={CursorArrowRaysIcon}
          color="warning"
        />
        <MetricCard
          title="活跃活动"
          value={displayRealtimeData.activeCampaigns}
          icon={ChartBarIcon}
          color="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Trend Chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Email Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayStats.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  color: '#FFFFFF'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="#FCD34D" 
                strokeWidth={2}
                dot={{ fill: '#FCD34D', strokeWidth: 2, r: 4 }}
                name="Total Sent"
              />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#FFFFFF" 
                strokeWidth={2}
                dot={{ fill: '#FFFFFF', strokeWidth: 2, r: 4 }}
                name="Delivered"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Rate Pie Chart */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Delivery Statistics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">送达率</span>
              <span className="font-semibold text-white">{displayStats.deliveryRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">打开率</span>
              <span className="font-semibold text-white">{displayStats.openRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">点击率</span>
              <span className="font-semibold text-white">{displayStats.clickRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">最近活动</h3>
          <div className="space-y-4">
            {displayRealtimeData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'email_opened' ? 'bg-orange-500/20' : 'bg-yellow-400/20'
                }`}>
                  {activity.type === 'email_opened' ? (
                    <EyeIcon className="h-4 w-4 text-orange-400" />
                  ) : (
                    <EnvelopeIcon className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {activity.type === 'email_opened' 
                      ? `${activity.email} 打开了邮件`
                      : `批量发送了 ${activity.count} 封邮件`
                    }
                  </p>
                  <p className="text-xs text-gray-300">{activity.campaign}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">快捷操作</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-yellow-400 hover:bg-gray-800 transition-colors duration-200 group">
              <EnvelopeIcon className="h-8 w-8 text-gray-400 group-hover:text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">创建活动</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-yellow-400 hover:bg-gray-800 transition-colors duration-200 group">
              <UserGroupIcon className="h-8 w-8 text-gray-400 group-hover:text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">导入联系人</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-yellow-400 hover:bg-gray-800 transition-colors duration-200 group">
              <ChartBarIcon className="h-8 w-8 text-gray-400 group-hover:text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">查看分析</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-yellow-400 hover:bg-gray-800 transition-colors duration-200 group">
              <CursorArrowRaysIcon className="h-8 w-8 text-gray-400 group-hover:text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">AI写邮件</p>
            </button>
          </div>
        </div>
      </div>

      {/* Marketing Research Section */}
      <div className="bg-gray-900 border border-gray-700 border-l-4 border-l-purple-500 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-gray-500/20">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">营销调研中心</h3>
              <p className="text-sm text-gray-400">AI驱动的市场分析与潜客发现</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-orange-400 font-medium">运行中</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Research Overview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg">
              <GlobeAltIcon className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">目标网站</p>
                <p className="text-lg font-bold text-white">{displayMarketingData.targetWebsite}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-orange-500/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">{displayMarketingData.totalProspects}</p>
                <p className="text-xs text-gray-300 mt-1">总潜客</p>
              </div>
              <div className="text-center p-3 bg-orange-500/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">{displayMarketingData.qualifiedLeads}</p>
                <p className="text-xs text-gray-300 mt-1">优质线索</p>
              </div>
            </div>

            <div className="p-4 bg-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">知识库大小</span>
                <span className="text-lg font-bold text-orange-400">{displayMarketingData.knowledgeBaseSize}</span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-400 h-2 rounded-full" style={{width: '68%'}}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">持续学习优化中</p>
            </div>
          </div>

          {/* Industry Analysis */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white mb-3">行业分析</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-300">主要行业</p>
                <p className="text-lg text-white">{displayMarketingData.industryAnalysis.primaryIndustry}</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-300">市场规模</p>
                <p className="text-lg font-bold text-orange-400">{displayMarketingData.industryAnalysis.marketSize}</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-300">目标市场</p>
                <p className="text-sm text-white">{displayMarketingData.industryAnalysis.targetMarket}</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-300">竞争对手</p>
                <p className="text-lg font-semibold text-yellow-400">{displayMarketingData.industryAnalysis.competitors} 家</p>
              </div>
            </div>
          </div>

          {/* Agent Activities */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white mb-3">Agent活动状态</h4>
            <div className="space-y-3">
              {displayMarketingData.agentActivities.map((activity, index) => (
                <div key={index} className="p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CpuChipIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">{activity.agent}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-orange-400">运行中</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mb-1">{activity.lastAction}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
            
            <button className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-400 hover:bg-gray-800 transition-colors duration-200 group">
              <ChartBarIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">查看详细分析</p>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">最后更新</span>
            <span className="text-gray-300">{new Date(displayMarketingData.lastUpdate).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}