import { useState } from 'react'
import { GlobeAltIcon, MagnifyingGlassIcon, SparklesIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function WebsiteAnalyzer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const analyzeWebsite = async () => {
    if (!url.trim()) {
      toast.error('请输入网站URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/scraper/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.data)
        toast.success('网站分析完成！')
      } else {
        toast.error(data.error || '分析失败')
      }
    } catch (error) {
      console.error('分析网站失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeWebsite()
    }
  }

  const InfoCard = ({ title, children, icon: Icon }) => (
    <div className="card">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">网站分析器</h1>
        <p className="mt-2 text-primary-600">输入企业网站URL，AI将为您分析公司信息并生成个性化营销策略</p>
      </div>

      {/* URL Input */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="website-url" className="block text-sm font-medium text-primary-700 mb-2">
              企业网站URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GlobeAltIcon className="h-5 w-5 text-primary-400" />
              </div>
              <input
                type="url"
                id="website-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field pl-10"
                placeholder="https://www.example.com"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">&nbsp;</label>
            <button
              onClick={analyzeWebsite}
              disabled={loading}
              className="btn-primary flex items-center space-x-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="loading-spinner h-4 w-4"></div>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>开始分析</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-slide-up">
          {/* Basic Info */}
          <InfoCard title="基本信息" icon={BuildingOfficeIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-primary-600 mb-1">公司名称</p>
                <p className="font-semibold text-primary-900">{analysis.companyName || '未识别'}</p>
              </div>
              <div>
                <p className="text-sm text-primary-600 mb-1">行业</p>
                <p className="font-semibold text-primary-900">{analysis.industry || '未分类'}</p>
              </div>
              <div>
                <p className="text-sm text-primary-600 mb-1">网站标题</p>
                <p className="font-semibold text-primary-900">{analysis.title}</p>
              </div>
              <div>
                <p className="text-sm text-primary-600 mb-1">语言</p>
                <p className="font-semibold text-primary-900">{analysis.lang === 'zh-CN' ? '中文' : analysis.lang}</p>
              </div>
              {analysis.description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-primary-600 mb-1">网站描述</p>
                  <p className="text-primary-900">{analysis.description}</p>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Contact Information */}
          <InfoCard title="联系方式" icon={EnvelopeIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.email && analysis.email.length > 0 && (
                <div>
                  <p className="text-sm text-primary-600 mb-2">邮箱地址</p>
                  <div className="space-y-1">
                    {analysis.email.slice(0, 5).map((email, index) => (
                      <p key={index} className="text-sm font-mono text-primary-800 bg-primary-50 px-2 py-1 rounded">
                        {email}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {analysis.phone && analysis.phone.length > 0 && (
                <div>
                  <p className="text-sm text-primary-600 mb-2">电话号码</p>
                  <div className="space-y-1">
                    {analysis.phone.slice(0, 3).map((phone, index) => (
                      <p key={index} className="text-sm font-mono text-primary-800 bg-primary-50 px-2 py-1 rounded">
                        {phone}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {analysis.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-primary-600 mb-1">地址</p>
                  <p className="text-primary-900">{analysis.address}</p>
                </div>
              )}
            </div>
          </InfoCard>

          {/* Business Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services/Products */}
            {(analysis.services.length > 0 || analysis.products.length > 0) && (
              <InfoCard title="业务范围" icon={GlobeAltIcon}>
                {analysis.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-primary-600 mb-2">服务</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.services.slice(0, 10).map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.products.length > 0 && (
                  <div>
                    <p className="text-sm text-primary-600 mb-2">产品</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.products.slice(0, 10).map((product, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm"
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </InfoCard>
            )}

            {/* Technologies */}
            {analysis.technologies.length > 0 && (
              <InfoCard title="技术栈" icon={GlobeAltIcon}>
                <div className="flex flex-wrap gap-2">
                  {analysis.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          {/* AI Analysis */}
          {analysis.aiAnalysis && (
            <InfoCard title="AI营销分析" icon={SparklesIcon}>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-primary-700 leading-relaxed">
                  {analysis.aiAnalysis}
                </div>
              </div>
            </InfoCard>
          )}

          {/* Social Media */}
          {Object.values(analysis.social).some(url => url) && (
            <InfoCard title="社交媒体" icon={GlobeAltIcon}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.social).map(([platform, url]) => 
                  url && (
                    <div key={platform}>
                      <p className="text-sm text-primary-600 mb-1 capitalize">{platform}</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-500 hover:text-primary-700 underline break-all"
                      >
                        {url}
                      </a>
                    </div>
                  )
                )}
              </div>
            </InfoCard>
          )}

          {/* Navigation Menu */}
          {analysis.navigationMenu.length > 0 && (
            <InfoCard title="网站导航" icon={GlobeAltIcon}>
              <div className="flex flex-wrap gap-2">
                {analysis.navigationMenu.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm border border-primary-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="btn-primary">
              基于分析创建邮件活动
            </button>
            <button className="btn-secondary">
              导入联系信息
            </button>
            <button className="btn-secondary">
              生成营销策略报告
            </button>
          </div>
        </div>
      )}
    </div>
  )
}