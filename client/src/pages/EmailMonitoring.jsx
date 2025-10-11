import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  EnvelopeIcon, 
  EyeIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  PowerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import QuickStartModal from '../components/QuickStartModal'

export default function EmailMonitoring() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [targetWebsite, setTargetWebsite] = useState(localStorage.getItem('targetWebsite') || 'https://petpoofficial.org/')
  const [companyInfo, setCompanyInfo] = useState({
    name: localStorage.getItem('companyName') || '智能营销助手',
    industry: '营销科技',
    description: '专注于帮助企业提升邮件营销效果的AI解决方案'
  })
  const [showQuickStart, setShowQuickStart] = useState(false)
  const [quickStartChecked, setQuickStartChecked] = useState(false)

  useEffect(() => {
    fetchData()
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // 单独的效果来处理快速启动模态
  useEffect(() => {
    if (systemStatus && !loading && !quickStartChecked) {
      const currentlyRunning = systemStatus?.emailAutomation?.isRunning || false
      const hideQuickStart = localStorage.getItem('hideQuickStart')
      const totalProspects = systemStatus?.emailAutomation?.totalProspects || 0
      const hasSmtpConfig = localStorage.getItem('smtpConfig')
      
      console.log('检查快速启动条件:', {
        hideQuickStart,
        currentlyRunning,
        totalProspects,
        hasSmtpConfig,
        showQuickStart,
        quickStartChecked
      })
      
      // 显示快速启动模态的条件：
      // 1. 没有被手动隐藏
      // 2. 系统未运行
      // 3. 没有潜在客户数据
      // 4. 或者没有SMTP配置
      if (!hideQuickStart && !currentlyRunning && (totalProspects === 0 || !hasSmtpConfig)) {
        console.log('触发快速启动模态显示')
        setTimeout(() => {
          setShowQuickStart(true)
          setQuickStartChecked(true)
        }, 1000) // 延迟1秒显示
      } else {
        setQuickStartChecked(true)
      }
    }
  }, [systemStatus, loading, quickStartChecked])

  const fetchData = async () => {
    try {
      // 添加时间戳防止缓存
      const timestamp = new Date().getTime()
      const [dashboardRes, statusRes] = await Promise.all([
        fetch(`/api/automation/emails/dashboard?_t=${timestamp}`),
        fetch(`/api/automation/status?_t=${timestamp}`)
      ])

      if (dashboardRes.ok) {
        const dashboardResult = await dashboardRes.json()
        console.log('📊 Dashboard data received:', dashboardResult.data)
        setDashboardData(dashboardResult.data)
      }

      if (statusRes.ok) {
        const statusResult = await statusRes.json()
        console.log('📊 System status received:', statusResult.data)
        setSystemStatus(statusResult.data)
      }

    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const startAutomation = async () => {
    try {
      setIsStarting(true)
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetWebsite,
          companyInfo
        })
      })

      const result = await response.json()
      if (result.success) {
        await fetchData()
        alert('自动化系统启动成功！')
      } else {
        alert('启动失败: ' + result.error)
      }

    } catch (error) {
      console.error('启动自动化失败:', error)
      alert('启动失败: ' + error.message)
    } finally {
      setIsStarting(false)
    }
  }

  const stopAutomation = async () => {
    try {
      const response = await fetch('/api/automation/stop', {
        method: 'POST'
      })

      const result = await response.json()
      if (result.success) {
        await fetchData()
        alert('自动化系统已停止！')
      } else {
        alert('停止失败: ' + result.error)
      }

    } catch (error) {
      console.error('停止自动化失败:', error)
      alert('停止失败: ' + error.message)
    }
  }

  const resetSystem = async () => {
    if (confirm('确定要重置系统吗？这将清空所有数据并返回初始页面。')) {
      try {
        setLoading(true)
        
        // 调用后端重置 API
        const response = await fetch('/api/automation/reset', { method: 'POST' })
        const result = await response.json()
        
        if (result.success) {
          // 清空本地数据，但保留一些基本配置
          const itemsToPreserve = ['targetWebsite', 'companyName']
          const preservedData = {}
          itemsToPreserve.forEach(key => {
            const value = localStorage.getItem(key)
            if (value) preservedData[key] = value
          })
          
          localStorage.clear()
          sessionStorage.clear()
          
          // 恢复保留的数据
          Object.entries(preservedData).forEach(([key, value]) => {
            localStorage.setItem(key, value)
          })
          
          // 重置所有组件状态
          setDashboardData(null)
          setSystemStatus(null)
          setShowQuickStart(false)
          setQuickStartChecked(false)
          
          console.log('系统重置完成，保留了基本配置')
          
          // 强制刷新页面数据
          await fetchData()
          
          alert('系统已成功重置！将显示配置向导。')
        } else {
          alert('重置失败: ' + result.error)
        }
      } catch (error) {
        console.error('重置系统失败:', error)
        alert('重置失败: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const viewEmailDetails = (email) => {
    // 将邮件数据保存到sessionStorage以便在编辑器中访问
    sessionStorage.setItem('emailDetails', JSON.stringify(email))
    navigate('/compose')
  }

  const testWebsiteAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/automation/test/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ website: targetWebsite })
      })

      const result = await response.json()
      if (result.success) {
        alert('网站分析测试完成！请查看控制台查看详细结果。')
        console.log('网站分析结果:', result.data)
      } else {
        alert('测试失败: ' + result.error)
      }

    } catch (error) {
      console.error('测试失败:', error)
      alert('测试失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      ready_to_send: 'text-warning-600 bg-warning-100',
      sent: 'text-primary-600 bg-primary-100', 
      engaged: 'text-success-600 bg-success-100',
      failed: 'text-error-600 bg-error-100',
      pending: 'text-gray-600 bg-gray-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  const getStatusIcon = (status) => {
    const icons = {
      ready_to_send: ClockIcon,
      sent: CheckCircleIcon,
      engaged: EyeIcon,
      failed: XCircleIcon,
      pending: ExclamationTriangleIcon
    }
    const Icon = icons[status] || ExclamationTriangleIcon
    return <Icon className="h-4 w-4" />
  }

  const getStatusText = (status) => {
    const texts = {
      ready_to_send: '待发送',
      sent: '已发送',
      engaged: '已互动',
      failed: '发送失败',
      pending: '等待中'
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-primary-600">加载中...</span>
      </div>
    )
  }

  const stats = dashboardData?.statistics || {}
  const recentEmails = dashboardData?.recentEmails || []
  const isRunning = systemStatus?.emailAutomation?.isRunning || false

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">邮件监控中心</h1>
          <p className="mt-2 text-primary-600">实时监控邮件营销活动和AI代理状态</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isRunning ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isRunning ? '● 运行中' : '● 已停止'}
          </div>
          
          <button
            onClick={resetSystem}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <PowerIcon className="h-4 w-4" />
            <span>{loading ? '重置中...' : '重置系统'}</span>
          </button>
          
          {!isRunning ? (
            <button
              onClick={startAutomation}
              disabled={isStarting}
              className="btn-primary flex items-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>{isStarting ? '启动中...' : '启动自动化'}</span>
            </button>
          ) : (
            <button
              onClick={stopAutomation}
              className="btn-danger flex items-center space-x-2"
            >
              <StopIcon className="h-4 w-4" />
              <span>停止自动化</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {!isRunning && (
        <div className="card">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">系统配置</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                目标网站
              </label>
              <input
                type="url"
                value={targetWebsite}
                onChange={(e) => setTargetWebsite(e.target.value)}
                className="input-field"
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                公司名称
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                className="input-field"
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                公司描述
              </label>
              <textarea
                value={companyInfo.description}
                onChange={(e) => setCompanyInfo({...companyInfo, description: e.target.value})}
                className="input-field h-20 resize-none"
                placeholder="简要描述您的公司和服务..."
              />
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={testWebsiteAnalysis}
              className="btn-secondary flex items-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>测试网站分析</span>
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <EnvelopeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">总潜客</p>
              <p className="text-2xl font-bold text-primary-900">{dashboardData?.totalProspects || 0}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-100">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">待发送</p>
              <p className="text-2xl font-bold text-primary-900">{stats.ready_to_send || 0}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-100">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">已发送</p>
              <p className="text-2xl font-bold text-primary-900">{stats.sent || 0}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <EyeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">已互动</p>
              <p className="text-2xl font-bold text-primary-900">{stats.engaged || 0}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-error-100">
              <XCircleIcon className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">失败</p>
              <p className="text-2xl font-bold text-primary-900">{stats.failed || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Rate */}
      {dashboardData && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-900">转化率</h3>
            <div className="text-2xl font-bold text-success-600">{dashboardData.conversionRate}%</div>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div 
              className="bg-success-600 h-2 rounded-full transition-all duration-300" 
              style={{width: `${Math.min(dashboardData.conversionRate, 100)}%`}}
            ></div>
          </div>
          <p className="text-sm text-primary-600 mt-2">
            基于已互动客户数量计算的转化率
          </p>
        </div>
      )}

      {/* Recent Emails */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">最近邮件</h3>
          <div className="flex items-center space-x-4">
            {recentEmails.length > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                📝 点击邮件可查看详情和发送
              </span>
            )}
            <span className="text-sm text-primary-600">显示最新 {recentEmails.length} 封邮件</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  收件人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  主题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  内容预览
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {recentEmails.map((email, index) => (
                <tr 
                  key={email.id || index} 
                  className="table-row cursor-pointer hover:bg-primary-50" 
                  onClick={() => viewEmailDetails(email)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-primary-900">
                        {email.recipientName}
                      </div>
                      <div className="text-sm text-primary-500">{email.recipient}</div>
                      {email.company && (
                        <div className="text-xs text-primary-400">{email.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-primary-900 max-w-xs truncate">
                      {email.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-primary-600 max-w-md truncate">
                      {email.preview}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium space-x-1 ${getStatusColor(email.status)}`}>
                      {getStatusIcon(email.status)}
                      <span>{getStatusText(email.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                    {email.sentAt ? 
                      new Date(email.sentAt).toLocaleString('zh-CN') :
                      new Date(email.createdAt).toLocaleString('zh-CN')
                    }
                  </td>
                </tr>
              ))}
              
              {recentEmails.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-primary-500">
                    <EnvelopeIcon className="h-12 w-12 text-primary-300 mx-auto mb-2" />
                    <p>暂无邮件数据</p>
                    <p className="text-sm">启动自动化系统后将显示邮件活动</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">邮件自动化状态</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-600">运行状态</span>
                <span className={`font-medium ${
                  systemStatus.emailAutomation.isRunning ? 'text-success-600' : 'text-gray-600'
                }`}>
                  {systemStatus.emailAutomation.isRunning ? '运行中' : '已停止'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-600">目标网站</span>
                <span className="text-primary-900 font-medium">
                  {systemStatus.emailAutomation.targetWebsite || '未设置'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-600">总潜客数</span>
                <span className="text-primary-900 font-medium">
                  {systemStatus.emailAutomation.totalProspects || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">市场调研状态</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-600">调研状态</span>
                <span className={`font-medium ${
                  systemStatus.marketingResearch.isRunning ? 'text-success-600' : 'text-gray-600'
                }`}>
                  {systemStatus.marketingResearch.status === 'active' ? '活跃中' : '已停止'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-600">调研会话</span>
                <span className="text-primary-900 font-medium">
                  {systemStatus.marketingResearch.totalResearchSessions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-600">知识库大小</span>
                <span className="text-primary-900 font-medium">
                  {systemStatus.marketingResearch.knowledgeBaseSize || 0} 条记录
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Start Modal */}
      <QuickStartModal
        isOpen={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        onStartAutomation={startAutomation}
        onNavigateToMonitoring={() => {
          // 已经在监控页面了，刷新数据
          console.log('已在监控页面，刷新数据...')
          fetchData()
        }}
      />
    </div>
  )
}