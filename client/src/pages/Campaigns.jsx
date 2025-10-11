import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  EnvelopeIcon, 
  PlayIcon, 
  PauseIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      const data = await response.json()
      if (data.success) {
        setCampaigns(data.data)
      }
    } catch (error) {
      console.error('获取营销活动失败:', error)
      toast.error('加载活动失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="h-4 w-4 text-success-600" />
      case 'draft':
        return <ClockIcon className="h-4 w-4 text-warning-600" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-primary-600" />
      case 'stopped':
        return <PauseIcon className="h-4 w-4 text-error-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-primary-400" />
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'running': '运行中',
      'draft': '草稿',
      'completed': '已完成',
      'stopped': '已停止'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'running': 'bg-success-100 text-success-700',
      'draft': 'bg-warning-100 text-warning-700',
      'completed': 'bg-primary-100 text-primary-700',
      'stopped': 'bg-error-100 text-error-700'
    }
    return colorMap[status] || 'bg-primary-100 text-primary-700'
  }

  const duplicateCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        toast.success('活动复制成功')
        fetchCampaigns()
      } else {
        toast.error(data.error || '复制失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  const deleteCampaign = async (campaignId) => {
    if (!confirm('确定要删除这个营销活动吗？')) return
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        toast.success('活动删除成功')
        fetchCampaigns()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      toast.error('网络错误')
    }
  }

  const CampaignCard = ({ campaign }) => (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-primary-900">{campaign.name}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
              {getStatusIcon(campaign.status)}
              <span className="ml-1">{getStatusText(campaign.status)}</span>
            </span>
          </div>
          <p className="text-primary-600 text-sm mb-3">{campaign.description}</p>
          <div className="text-xs text-primary-500">
            创建时间: {new Date(campaign.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedCampaign(campaign)}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => duplicateCampaign(campaign.id)}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="复制活动"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteCampaign(campaign.id)}
            className="p-2 text-error-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="删除活动"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-900">{campaign.stats?.totalSent || 0}</div>
          <div className="text-xs text-primary-500">已发送</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">{campaign.stats?.totalOpens || 0}</div>
          <div className="text-xs text-primary-500">打开数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600">{campaign.stats?.totalClicks || 0}</div>
          <div className="text-xs text-primary-500">点击数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {campaign.stats?.totalSent > 0 ? 
              ((campaign.stats.totalOpens / campaign.stats.totalSent) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs text-primary-500">打开率</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {campaign.status === 'draft' && (
            <button className="btn-primary text-sm px-3 py-1.5">
              <PlayIcon className="h-3 w-3 mr-1" />
              启动活动
            </button>
          )}
          {campaign.status === 'running' && (
            <button className="btn-secondary text-sm px-3 py-1.5">
              <PauseIcon className="h-3 w-3 mr-1" />
              暂停活动
            </button>
          )}
        </div>
        <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
          <ChartBarIcon className="h-4 w-4 mr-1" />
          查看分析
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-primary-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">营销活动</h1>
          <p className="mt-2 text-primary-600">管理和监控您的邮件营销活动</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>创建活动</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <EnvelopeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">总活动数</p>
              <p className="text-2xl font-bold text-primary-900">{campaigns.length}</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success-100">
              <PlayIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">运行中</p>
              <p className="text-2xl font-bold text-success-600">
                {campaigns.filter(c => c.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning-100">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">草稿</p>
              <p className="text-2xl font-bold text-warning-600">
                {campaigns.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <CheckCircleIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-primary-600">已完成</p>
              <p className="text-2xl font-bold text-primary-600">
                {campaigns.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-primary-300" />
          <h3 className="mt-4 text-lg font-medium text-primary-900">还没有营销活动</h3>
          <p className="mt-2 text-primary-600">创建您的第一个邮件营销活动开始吧</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>创建活动</span>
            </button>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary-900">{selectedCampaign.name}</h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-primary-400 hover:text-primary-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">活动描述</h3>
                  <p className="text-primary-700">{selectedCampaign.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">目标受众</h3>
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <pre className="text-sm text-primary-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedCampaign.targetAudience, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">邮件模板</h3>
                  <div className="bg-primary-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium text-primary-600">主题:</label>
                      <p className="text-primary-900">{selectedCampaign.emailTemplate?.subject || '未设置'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-primary-600">正文:</label>
                      <p className="text-primary-900 whitespace-pre-wrap">
                        {selectedCampaign.emailTemplate?.body || '未设置'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}