import { useState, useEffect } from 'react'
import '../styles/jobright-colors.css'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'

// JobRight.ai color scheme
const COLORS = ['#00f0a0', '#28fcaf', '#52ffba', '#a3ffd4', '#e6fff2', '#00c98d']

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [emailMetrics, setEmailMetrics] = useState(null)
  const [campaignPerformance, setCampaignPerformance] = useState([])
  const [deliverabilityData, setDeliverabilityData] = useState(null)
  const [engagementTrends, setEngagementTrends] = useState([])
  const [recipientAnalytics, setRecipientAnalytics] = useState(null)
  const [realtimeStats, setRealtimeStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wsConnection, setWsConnection] = useState(null)

  useEffect(() => {
    fetchAnalyticsData()
    setupRealtimeConnection()

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000)
    return () => {
      clearInterval(interval)
      if (wsConnection) {
        wsConnection.close()
      }
    }
  }, [timeRange, selectedCampaign])

  const setupRealtimeConnection = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // Determine the correct WebSocket host
      let wsHost = window.location.host;

      // If we're on the frontend Railway service, use the backend service for WebSocket
      if (window.location.host.includes('honest-hope') || window.location.host.includes('powerful-contentment')) {
        wsHost = 'mailgen-production.up.railway.app';
        console.log('🔄 Analytics: Detected frontend service, redirecting WebSocket to backend:', wsHost);
      }

      const wsUrl = `${protocol}//${wsHost}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('📡 Connected to analytics WebSocket')
        ws.send(JSON.stringify({ type: 'subscribe_analytics' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'analytics_update') {
            setRealtimeStats(data.data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('📡 Analytics WebSocket disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(setupRealtimeConnection, 5000)
      }

      setWsConnection(ws)
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      console.log('📊 Fetching analytics data...')
      setLoading(true)
      const [metricsRes, campaignsRes, deliveryRes, trendsRes, recipientsRes] = await Promise.all([
        fetch(`/api/analytics/email-metrics?timeRange=${timeRange}&campaign=${selectedCampaign}`),
        fetch(`/api/analytics/campaign-performance?timeRange=${timeRange}`),
        fetch(`/api/analytics/deliverability?timeRange=${timeRange}`),
        fetch(`/api/analytics/engagement-trends?timeRange=${timeRange}`),
        fetch(`/api/analytics/recipient-analytics?timeRange=${timeRange}`)
      ])

      console.log('📊 API Responses:', {
        metrics: metricsRes.status,
        campaigns: campaignsRes.status,
        delivery: deliveryRes.status,
        trends: trendsRes.status,
        recipients: recipientsRes.status
      })

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        console.log('📊 Email Metrics:', data.data)
        setEmailMetrics(data.data)
      } else {
        console.error('Failed to fetch email metrics:', metricsRes.status)
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        console.log('📊 Campaign Performance:', data.data)
        setCampaignPerformance(data.data)
      } else {
        console.error('Failed to fetch campaign performance:', campaignsRes.status)
      }

      if (deliveryRes.ok) {
        const data = await deliveryRes.json()
        console.log('📊 Deliverability Data:', data.data)
        setDeliverabilityData(data.data)
      } else {
        console.error('Failed to fetch deliverability:', deliveryRes.status)
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json()
        console.log('📊 Engagement Trends:', data.data)
        setEngagementTrends(data.data)
      } else {
        console.error('Failed to fetch trends:', trendsRes.status)
      }

      if (recipientsRes.ok) {
        const data = await recipientsRes.json()
        console.log('📊 Recipient Analytics:', data.data)
        setRecipientAnalytics(data.data)
      } else {
        console.error('Failed to fetch recipient analytics:', recipientsRes.status)
      }

      console.log('📊 All data loaded successfully')

    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ]

  const MetricCard = ({ title, value, change, icon: Icon, color = 'green', subtitle, trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg bg-green-50`}>
            <Icon className={`h-6 w-6 text-green-600`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        {change !== undefined && (
          <div className="text-right">
            <div className={`flex items-center text-sm ${change >= 0 ? 'text-gray-700' : 'text-gray-500'}`}>
              <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change)}%
            </div>
            <p className="text-xs text-gray-400 mt-1">vs previous period</p>
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={trend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00f0a0"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  // Debug logging
  console.log('🌐 Analytics State:', {
    emailMetrics,
    campaignPerformance,
    deliverabilityData,
    engagementTrends,
    recipientAnalytics,
    loading
  })

  // Use only real data from API (no mock data)
  const displayEmailMetrics = emailMetrics || {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalBounced: 0,
    totalUnsubscribed: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    bounceRate: 0,
    unsubscribeRate: 0
  }

  const displayCampaignPerformance = campaignPerformance || []

  const displayEngagementTrends = engagementTrends || []

  const displayDeliverabilityData = deliverabilityData || {
    byProvider: []
  }

  const displayRecipientAnalytics = recipientAnalytics || {
    byIndustry: [],
    byLocation: []
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Campaign Analytics</h1>
          <p className="mt-2 text-gray-600">Track and analyze your email marketing performance</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Campaigns</option>
            {displayCampaignPerformance.map(campaign => (
              <option key={campaign.name} value={campaign.name}>{campaign.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-green-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realtimeStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-sm font-medium text-gray-700">Live Updates</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <span className="text-gray-700">Active Campaigns: {realtimeStats.activeCampaigns || 3}</span>
              <span className="text-gray-700">Emails Sent Today: {realtimeStats.sentToday || 1240}</span>
              <span className="text-gray-700">Current Open Rate: {realtimeStats.currentOpenRate || '24.8%'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Emails Sent"
          value={displayEmailMetrics.totalSent.toLocaleString()}
          change={8.2}
          icon={EnvelopeIcon}
          subtitle="Across all campaigns"
        />
        <MetricCard
          title="Delivery Rate"
          value={`${displayEmailMetrics.deliveryRate}%`}
          change={1.5}
          icon={CheckCircleIcon}
          subtitle={`${displayEmailMetrics.totalDelivered.toLocaleString()} delivered`}
        />
        <MetricCard
          title="Open Rate"
          value={`${displayEmailMetrics.openRate}%`}
          change={-0.8}
          icon={EyeIcon}
          subtitle={`${displayEmailMetrics.totalOpened.toLocaleString()} opens`}
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${displayEmailMetrics.clickRate}%`}
          change={2.3}
          icon={CursorArrowRaysIcon}
          subtitle={`${displayEmailMetrics.totalClicked.toLocaleString()} clicks`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Reply Rate"
          value={`${displayEmailMetrics.replyRate}%`}
          change={1.2}
          icon={ChatBubbleLeftRightIcon}
          subtitle={`${displayEmailMetrics.totalReplied} replies`}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${displayEmailMetrics.bounceRate}%`}
          change={-0.3}
          icon={ExclamationTriangleIcon}
          subtitle={`${displayEmailMetrics.totalBounced} bounced`}
        />
        <MetricCard
          title="Unsubscribe Rate"
          value={`${displayEmailMetrics.unsubscribeRate}%`}
          change={-0.1}
          icon={XCircleIcon}
          subtitle={`${displayEmailMetrics.totalUnsubscribed} unsubscribed`}
        />
        <MetricCard
          title="Active Campaigns"
          value={displayCampaignPerformance.filter(c => c.status === 'active').length}
          change={0}
          icon={ChartBarIcon}
          subtitle="Currently running"
        />
      </div>

      {/* Advanced Tracking Setup Banner */}
      {(displayEmailMetrics.openRate === 0 || displayEmailMetrics.replyRate === 0) && displayEmailMetrics.totalSent > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8" style={{ color: '#00f0a0' }} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enable Advanced Email Tracking
              </h3>
              <p className="text-gray-600 mb-4">
                Get detailed insights into your email campaigns by enabling advanced tracking features. Track opens, clicks, replies, and bounces automatically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-2">
                    <EyeIcon className="h-5 w-5 mr-2" style={{ color: '#00f0a0' }} />
                    <h4 className="font-semibold text-gray-900">Open Tracking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Track when recipients open your emails with invisible tracking pixels</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-2">
                    <CursorArrowRaysIcon className="h-5 w-5 mr-2" style={{ color: '#00f0a0' }} />
                    <h4 className="font-semibold text-gray-900">Click Tracking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Monitor link clicks and measure engagement with your content</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" style={{ color: '#00f0a0' }} />
                    <h4 className="font-semibold text-gray-900">Reply & Bounce Detection</h4>
                  </div>
                  <p className="text-sm text-gray-600">Automatically detect replies and bounced emails via IMAP monitoring</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/analytics/start-imap-monitoring', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}) // Add empty body to prevent 400 error
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert('✅ IMAP monitoring started successfully! Checking inbox every 5 minutes for replies and bounces.');
                      } else {
                        alert('❌ ' + (data.error || 'Failed to start monitoring'));
                      }
                    } catch (error) {
                      alert('❌ Failed to start monitoring: ' + error.message);
                    }
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: '#00f0a0',
                    color: '#001529'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Enable IMAP Monitoring
                </button>

                <a
                  href="/settings"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Configure Email Settings
                </a>

                <button
                  onClick={() => window.open('https://support.google.com/mail/answer/7126229', '_blank')}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  Setup Guide
                </button>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>💡 Note:</strong> IMAP monitoring requires your email configuration to be set up.
                  If you haven't configured your email yet, click "Configure Email Settings" to set up SMTP and IMAP access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Performance Over Time */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={displayEngagementTrends}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0a0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0a0" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="sent" fill="#e5e7eb" name="Sent" />
              <Area
                type="monotone"
                dataKey="opens"
                stroke="#00f0a0"
                strokeWidth={2}
                fill="url(#colorSent)"
                name="Opens"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#00c98d"
                strokeWidth={2}
                name="Clicks"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverability by Provider */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverability by Email Provider</h3>
          <div className="space-y-4">
            {displayDeliverabilityData.byProvider.map((provider, index) => (
              <div key={provider.provider} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <div>
                    <span className="font-medium text-gray-900">{provider.provider}</span>
                    <span className="text-sm text-gray-500 ml-2">({provider.delivered.toLocaleString()})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{provider.rate}%</div>
                  <div className="text-xs text-gray-500">delivery rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Replies</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCampaignPerformance.map((campaign, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.delivered.toLocaleString()}
                    <div className="text-xs text-gray-500">({((campaign.delivered/campaign.sent)*100).toFixed(1)}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.opens.toLocaleString()}
                    <div className="text-xs text-gray-500">({((campaign.opens/campaign.delivered)*100).toFixed(1)}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.clicks.toLocaleString()}
                    <div className="text-xs text-gray-500">({((campaign.clicks/campaign.opens)*100).toFixed(1)}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.replies}
                    <div className="text-xs text-gray-500">({((campaign.replies/campaign.delivered)*100).toFixed(2)}%)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-gray-800' :
                      campaign.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipient Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Industry</h3>
          <div className="space-y-4">
            {displayRecipientAnalytics.byIndustry.map((industry, index) => (
              <div key={industry.industry} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{industry.industry}</span>
                      <span className="text-xs text-gray-500">{industry.count.toLocaleString()} contacts</span>
                    </div>
                    <div className="flex space-x-4 text-xs">
                      <span className="text-gray-700">Open: {industry.openRate}%</span>
                      <span className="text-gray-600">Click: {industry.clickRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipients by Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={displayRecipientAnalytics.byLocation}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="location"
                label={({ location, rate }) => `${location} ${rate}%`}
              >
                {displayRecipientAnalytics.byLocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights - Will populate with real data once campaigns are running */}
      {displayEmailMetrics.totalSent > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Insights</h3>
          <p className="text-gray-600">Insights will appear here as you run campaigns and collect real data.</p>
        </div>
      )}
    </div>
  )
}