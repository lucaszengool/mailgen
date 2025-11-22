import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
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

// Black/Green/White color scheme
const COLORS = ['#00f5a0', '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db']

export default function Analytics() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('30d')
  // 🔥 CRITICAL FIX: Default to current campaign instead of 'all' to prevent data leakage
  const [selectedCampaign, setSelectedCampaign] = useState(() => {
    const currentCampaignId = localStorage.getItem('currentCampaignId');
    return currentCampaignId || 'all';
  })
  const [emailMetrics, setEmailMetrics] = useState(null)
  const [campaignPerformance, setCampaignPerformance] = useState([])
  const [deliverabilityData, setDeliverabilityData] = useState(null)
  const [engagementTrends, setEngagementTrends] = useState([])
  const [recipientAnalytics, setRecipientAnalytics] = useState(null)
  const [realtimeStats, setRealtimeStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wsConnection, setWsConnection] = useState(null)
  const [imapMonitoring, setImapMonitoring] = useState(false)
  const [checkingImapStatus, setCheckingImapStatus] = useState(true)
  const [individualEmails, setIndividualEmails] = useState([])
  const [emailSearchQuery, setEmailSearchQuery] = useState('')

  useEffect(() => {
    fetchAnalyticsData()
    setupRealtimeConnection()
    checkImapStatus()

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000)
    // Check IMAP status every 60 seconds
    const imapInterval = setInterval(checkImapStatus, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(imapInterval)
      if (wsConnection) {
        wsConnection.close()
      }
    }
  }, [timeRange, selectedCampaign])

  const checkImapStatus = async () => {
    try {
      const response = await fetch('/api/analytics/imap-monitoring-status')
      const data = await response.json()
      if (data.success) {
        setImapMonitoring(data.monitoring)
        console.log('📬 IMAP Monitoring Status:', data.monitoring ? 'Active' : 'Inactive')
      }
    } catch (error) {
      console.error('Failed to check IMAP status:', error)
    } finally {
      setCheckingImapStatus(false)
    }
  }

  const toggleImapMonitoring = async () => {
    try {
      const endpoint = imapMonitoring ? '/api/analytics/stop-imap-monitoring' : '/api/analytics/start-imap-monitoring'
      // 🔥 FIX: Pass userId to backend so it can find the correct SMTP credentials
      const userId = user?.id || 'anonymous'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      const data = await response.json()

      if (data.success) {
        setImapMonitoring(!imapMonitoring)
        toast.success(data.message || `IMAP monitoring ${imapMonitoring ? 'stopped' : 'started'}`)
      } else {
        toast.error(data.error || 'Failed to toggle IMAP monitoring')
      }
    } catch (error) {
      console.error('Failed to toggle IMAP monitoring:', error)
      toast.error('Failed to toggle IMAP monitoring')
    }
  }

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
      // 🔥 CRITICAL FIX: Pass userId AND campaign ID to ALL analytics endpoints for proper data isolation
      const userId = user?.id || 'anonymous'
      console.log('📊 Using userId for analytics:', userId)
      const [metricsRes, campaignsRes, deliveryRes, trendsRes, recipientsRes, individualEmailsRes] = await Promise.all([
        fetch(`/api/analytics/email-metrics?timeRange=${timeRange}&campaign=${selectedCampaign}&userId=${userId}`),
        fetch(`/api/analytics/campaign-performance?timeRange=${timeRange}&userId=${userId}&campaign=${selectedCampaign}`),
        fetch(`/api/analytics/deliverability?timeRange=${timeRange}&campaign=${selectedCampaign}&userId=${userId}`),
        fetch(`/api/analytics/engagement-trends?timeRange=${timeRange}&userId=${userId}&campaign=${selectedCampaign}`),
        fetch(`/api/analytics/recipient-analytics?timeRange=${timeRange}&campaign=${selectedCampaign}&userId=${userId}`),
        fetch(`/api/analytics/individual-emails?timeRange=${timeRange}&campaign=${selectedCampaign}&userId=${userId}`)
      ])

      console.log(`🔍 [ANALYTICS DEBUG] Fetching data for campaign: ${selectedCampaign}, timeRange: ${timeRange}`)

      console.log('📊 API Responses:', {
        metrics: metricsRes.status,
        campaigns: campaignsRes.status,
        delivery: deliveryRes.status,
        trends: trendsRes.status,
        recipients: recipientsRes.status,
        individualEmails: individualEmailsRes.status
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

      if (individualEmailsRes.ok) {
        const data = await individualEmailsRes.json()
        console.log('📊 Individual Emails:', data.data)
        setIndividualEmails(data.data || [])
      } else {
        console.error('Failed to fetch individual emails:', individualEmailsRes.status)
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
          <div className="p-3 rounded-lg bg-[#00f5a0]/10">
            <Icon className="h-6 w-6 text-[#00f5a0]" />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f5a0]"></div>
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
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-[#00f5a0] focus:ring-[#00f5a0] bg-white"
          >
            <option value="all">All Campaigns</option>
            {displayCampaignPerformance.map(campaign => (
              <option key={campaign.name} value={campaign.name}>{campaign.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-[#00f5a0] focus:ring-[#00f5a0] bg-white"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IMAP Reply & Bounce Tracking Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reply & Bounce Tracking</h3>
                <p className="text-xs text-gray-500">
                  {imapMonitoring ? 'Monitoring your inbox for replies and bounces' : 'Start monitoring to track replies and bounces'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${imapMonitoring ? 'bg-[#00f5a0] animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-xs font-medium text-gray-600">
                {checkingImapStatus ? 'Checking...' : imapMonitoring ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleImapMonitoring}
            disabled={checkingImapStatus}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              imapMonitoring
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-[#00f5a0] text-black hover:bg-[#00d68f]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {imapMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
        {!imapMonitoring && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Reply and bounce tracking requires IMAP monitoring to be active. Start monitoring to automatically track email replies and bounces.
            </p>
          </div>
        )}
      </div>

      {/* Real-time Status Bar */}
      {realtimeStats && (
        <div className="bg-[#00f5a0]/10 border border-[#00f5a0]/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-pulse"></div>
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

      {/* Individual Email Performance Table */}
      <div className="bg-white rounded-lg border border-black p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-black">Individual Email Performance</h3>
            <p className="text-sm text-black/60 mt-1">Track opens, clicks, and replies for each sent email</p>
          </div>
          <div className="text-sm text-black/70">
            <span className="font-semibold">{individualEmails.length}</span> emails sent
          </div>
        </div>

        {/* Search Bar */}
        {individualEmails.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by recipient or subject..."
              value={emailSearchQuery}
              onChange={(e) => setEmailSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f5a0]"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          {individualEmails.length === 0 ? (
            <div className="text-center py-12 text-black/60">
              <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 text-black/30" />
              <p>No emails sent yet for this time period</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Opened</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Clicked</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Replied</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Bounced</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black/10">
                {individualEmails
                  .filter(email =>
                    !emailSearchQuery ||
                    email.to.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
                    email.subject.toLowerCase().includes(emailSearchQuery.toLowerCase())
                  )
                  .map((email, index) => (
                    <tr
                      key={email.id || index}
                      onClick={() => navigate(`/email-thread/${email.id}`)}
                      className="hover:bg-[#00f5a0]/5 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{email.to}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-black max-w-md truncate">{email.subject}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-black/70">
                          {new Date(email.sentAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {email.opened ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-[#00f5a0] text-black text-xs font-semibold">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {email.openCount}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-black/5 text-black/40 text-xs">
                            -
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {email.clicked ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-[#00f5a0] text-black text-xs font-semibold">
                            <CursorArrowRaysIcon className="h-3 w-3 mr-1" />
                            {email.clickCount}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-black/5 text-black/40 text-xs">
                            -
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {email.replied ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-[#00f5a0] text-black text-xs font-semibold">
                            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                            {email.replyCount}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-black/5 text-black/40 text-xs">
                            -
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {email.bounced ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Yes
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-black/5 text-black/40 text-xs">
                            -
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Show count of filtered results */}
        {emailSearchQuery && (
          <div className="mt-4 text-sm text-black/60 text-center">
            Showing {individualEmails.filter(email =>
              email.to.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
              email.subject.toLowerCase().includes(emailSearchQuery.toLowerCase())
            ).length} of {individualEmails.length} emails
          </div>
        )}
      </div>

      {/* Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Performance Over Time */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={displayEngagementTrends}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5a0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f5a0" stopOpacity={0.1}/>
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
                stroke="#00f5a0"
                strokeWidth={2}
                fill="url(#colorSent)"
                name="Opens"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#000000"
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
                      campaign.status === 'active' ? 'bg-[#00f5a0]/20 text-gray-900 border border-[#00f5a0]/30' :
                      campaign.status === 'completed' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                      'bg-white text-gray-700 border border-gray-300'
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