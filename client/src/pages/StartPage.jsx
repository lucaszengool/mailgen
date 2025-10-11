import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  SparklesIcon, 
  RocketLaunchIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function StartPage() {
  const navigate = useNavigate()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!websiteUrl.trim()) {
      toast.error('请输入企业网站URL')
      return
    }

    if (!companyName.trim()) {
      toast.error('请输入公司名称')
      return
    }

    // 验证URL格式
    try {
      new URL(websiteUrl)
    } catch {
      toast.error('请输入有效的网站URL')
      return
    }

    setLoading(true)
    try {
      // 保存配置到localStorage
      localStorage.setItem('targetWebsite', websiteUrl)
      localStorage.setItem('companyName', companyName)
      
      // 可选：测试网站分析
      const response = await fetch('/api/automation/test/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ website: websiteUrl })
      })

      if (response.ok) {
        toast.success('网站分析成功，正在初始化系统...')
        // 延迟跳转以显示成功消息
        setTimeout(() => {
          navigate('/monitoring')
        }, 1500)
      } else {
        // 即使分析失败也跳转，只是提示用户
        toast.error('网站分析失败，但您仍可以继续使用系统')
        setTimeout(() => {
          navigate('/monitoring')
        }, 1500)
      }

    } catch (error) {
      console.error('初始化失败:', error)
      toast.error('初始化失败，但您仍可以继续使用系统')
      setTimeout(() => {
        navigate('/monitoring')
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: GlobeAltIcon,
      title: '智能网站分析',
      description: '自动分析目标网站，识别潜在客户和商业机会'
    },
    {
      icon: EnvelopeIcon,
      title: 'AI邮件生成',
      description: '基于分析结果生成个性化的营销邮件内容'
    },
    {
      icon: ChartBarIcon,
      title: '实时数据监控',
      description: '实时跟踪邮件发送状态和客户互动情况'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary-600 rounded-full">
              <SparklesIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            AI邮件营销助手
          </h1>
          <p className="text-xl text-primary-600 max-w-2xl mx-auto">
            智能分析目标网站，自动生成个性化邮件，提升营销效果
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 输入表单 */}
          <div className="card space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-900 mb-2">开始您的营销之旅</h2>
              <p className="text-primary-600">输入目标企业信息，让AI为您分析商机</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-primary-700 mb-2">
                  您的公司名称 *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder="例：智能营销科技有限公司"
                />
              </div>

              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-primary-700 mb-2">
                  目标企业网站 *
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com"
                />
                <p className="text-xs text-primary-500 mt-1">
                  请输入您想要分析和开发的目标企业网站
                </p>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg"
            >
              {loading ? (
                <>
                  <div className="loading-spinner h-5 w-5"></div>
                  <span>正在分析网站...</span>
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="h-6 w-6" />
                  <span>开始分析</span>
                </>
              )}
            </button>

            <div className="text-xs text-primary-500 bg-primary-50 p-3 rounded-lg">
              <p>🔒 您的数据将被安全处理，我们不会存储任何敏感信息</p>
            </div>
          </div>

          {/* 功能特色 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-primary-900 mb-4">核心功能</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border border-primary-100">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-primary-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-primary-600 text-white">
              <h3 className="text-lg font-bold mb-3">使用流程</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>输入目标企业网站URL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>AI自动分析网站内容和商业信息</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>生成个性化营销邮件</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>发送邮件并实时跟踪效果</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}