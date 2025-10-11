import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  SparklesIcon, 
  PaperAirplaneIcon, 
  DocumentDuplicateIcon, 
  EyeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import EmailSetupWizard from '../components/EmailSetupWizard'

export default function EmailComposer() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    companyInfo: '',
    target: '',
    emailType: 'outreach',
    tone: 'professional',
    language: 'zh-CN',
    customInstructions: ''
  })
  const [generatedEmail, setGeneratedEmail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [emailDetails, setEmailDetails] = useState(null)
  const [sending, setSending] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: ''
  })

  useEffect(() => {
    // 检查是否有传入的邮件详情
    const savedEmailDetails = sessionStorage.getItem('emailDetails')
    if (savedEmailDetails) {
      const details = JSON.parse(savedEmailDetails)
      setEmailDetails(details)
      setGeneratedEmail({
        subject: details.subject || '',
        body: details.content || details.preview || '',
        generatedAt: details.createdAt || new Date().toISOString()
      })
      setPreviewMode(true)
      // 清理sessionStorage
      sessionStorage.removeItem('emailDetails')
    }
  }, [])

  const emailTypes = [
    { value: 'outreach', label: '商务拓展' },
    { value: 'followup', label: '跟进邮件' },
    { value: 'introduction', label: '公司介绍' },
    { value: 'partnership', label: '合作邀请' },
    { value: 'product_demo', label: '产品演示' }
  ]

  const tones = [
    { value: 'professional', label: '专业正式' },
    { value: 'friendly', label: '友好亲切' },
    { value: 'persuasive', label: '说服性强' },
    { value: 'casual', label: '轻松随意' },
    { value: 'urgent', label: '紧急重要' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateEmail = async () => {
    if (!formData.companyInfo.trim() || !formData.target.trim()) {
      toast.error('请填写公司信息和目标受众')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ollama/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedEmail(data.data)
        toast.success('邮件生成成功！')
      } else {
        toast.error(data.error || '生成失败')
      }
    } catch (error) {
      console.error('生成邮件失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const startSendProcess = () => {
    if (!generatedEmail || !generatedEmail.subject || !generatedEmail.body) {
      toast.error('请先生成邮件内容')
      return
    }

    if (!emailDetails || !emailDetails.recipient) {
      toast.error('缺少收件人信息')
      return
    }

    console.log('Starting send process with email content:', {
      subject: generatedEmail.subject,
      body: generatedEmail.body.substring(0, 100) + '...',
      recipient: emailDetails.recipient
    })

    setShowWizard(true)
  }

  const handleEmailSent = (sentData) => {
    // 更新邮件状态
    if (emailDetails) {
      setEmailDetails(prev => ({
        ...prev,
        status: 'sent',
        sentAt: sentData.sentAt
      }))
    }
  }

  const goBack = () => {
    navigate('/monitoring')
  }

  const getStatusColor = (status) => {
    const colors = {
      ready_to_send: 'text-warning-600 bg-warning-100',
      sent: 'text-success-600 bg-success-100', 
      engaged: 'text-primary-600 bg-primary-100',
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
      pending: ClockIcon
    }
    const Icon = icons[status] || ClockIcon
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

  const FormSection = ({ title, children }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
      {children}
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {emailDetails && (
            <button
              onClick={goBack}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>返回监控</span>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              {emailDetails ? '邮件详情' : 'AI邮件编写'}
            </h1>
            <p className="mt-2 text-primary-600">
              {emailDetails ? '查看和编辑邮件内容，进行发送管理' : '使用AI助手生成个性化的营销邮件，提高outreach效果'}
            </p>
          </div>
        </div>
        
        {emailDetails && (
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium space-x-1 ${getStatusColor(emailDetails.status)}`}>
              {getStatusIcon(emailDetails.status)}
              <span>{getStatusText(emailDetails.status)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Email Details Card */}
      {emailDetails && (
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">邮件信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-primary-700">收件人:</span>
              <div className="mt-1">
                <div className="text-primary-900">{emailDetails.recipientName}</div>
                <div className="text-primary-600">{emailDetails.recipient}</div>
                {emailDetails.company && (
                  <div className="text-primary-500">{emailDetails.company}</div>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-primary-700">创建时间:</span>
              <div className="mt-1 text-primary-900">
                {new Date(emailDetails.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
            {emailDetails.sentAt && (
              <div>
                <span className="font-medium text-primary-700">发送时间:</span>
                <div className="mt-1 text-primary-900">
                  {new Date(emailDetails.sentAt).toLocaleString('zh-CN')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        {!emailDetails && (
        <div className="card space-y-6">
          <FormSection title="基本信息">
            <div>
              <label htmlFor="companyInfo" className="block text-sm font-medium text-primary-700 mb-2">
                您的公司信息 *
              </label>
              <textarea
                id="companyInfo"
                name="companyInfo"
                value={formData.companyInfo}
                onChange={handleInputChange}
                rows={4}
                className="input-field resize-none"
                placeholder="请详细描述您的公司业务、产品服务、优势特点等..."
              />
            </div>

            <div>
              <label htmlFor="target" className="block text-sm font-medium text-primary-700 mb-2">
                目标受众 *
              </label>
              <textarea
                id="target"
                name="target"
                value={formData.target}
                onChange={handleInputChange}
                rows={3}
                className="input-field resize-none"
                placeholder="描述目标客户的行业、规模、职位、需求等特征..."
              />
            </div>
          </FormSection>

          <FormSection title="邮件设置">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emailType" className="block text-sm font-medium text-primary-700 mb-2">
                  邮件类型
                </label>
                <select
                  id="emailType"
                  name="emailType"
                  value={formData.emailType}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {emailTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-primary-700 mb-2">
                  语调风格
                </label>
                <select
                  id="tone"
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {tones.map(tone => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-primary-700 mb-2">
                语言
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="zh-CN">中文</option>
                <option value="en">英文</option>
              </select>
            </div>
          </FormSection>

          <FormSection title="高级选项">
            <div>
              <label htmlFor="customInstructions" className="block text-sm font-medium text-primary-700 mb-2">
                特殊要求 (可选)
              </label>
              <textarea
                id="customInstructions"
                name="customInstructions"
                value={formData.customInstructions}
                onChange={handleInputChange}
                rows={3}
                className="input-field resize-none"
                placeholder="如：突出某个产品特性、提及特定的合作方式、包含特殊的CTA等..."
              />
            </div>
          </FormSection>

          <button
            onClick={generateEmail}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <>
                <div className="loading-spinner h-5 w-5"></div>
                <span>AI正在生成邮件...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>生成邮件</span>
              </>
            )}
          </button>
        </div>
        )}


        {/* Generated Email */}
        <div className="card">
          {generatedEmail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-900">生成的邮件</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>{previewMode ? '编辑' : '预览'}</span>
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="border border-primary-200 rounded-lg p-6 bg-white">
                  <div className="border-b border-primary-100 pb-4 mb-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><span className="font-medium text-primary-600">主题:</span> {generatedEmail.subject}</div>
                      <div><span className="font-medium text-primary-600">收件人:</span> {emailDetails ? emailDetails.recipient : '[目标客户]'}</div>
                      <div><span className="font-medium text-primary-600">发件人:</span> {smtpConfig.username || '[您的邮箱]'}</div>
                    </div>
                  </div>
                  <div 
                    className="prose max-w-none text-primary-800"
                    dangerouslySetInnerHTML={{ 
                      __html: generatedEmail.body.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-primary-700">邮件主题</label>
                      <button
                        onClick={() => copyToClipboard(generatedEmail.subject)}
                        className="text-xs text-primary-500 hover:text-primary-700 flex items-center space-x-1"
                      >
                        <DocumentDuplicateIcon className="h-3 w-3" />
                        <span>复制</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generatedEmail.subject}
                      onChange={(e) => {
                        const newValue = e.target.value
                        console.log('Subject updated to:', newValue)
                        setGeneratedEmail(prev => ({
                          ...prev,
                          subject: newValue
                        }))
                      }}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-primary-700">邮件正文</label>
                      <button
                        onClick={() => copyToClipboard(generatedEmail.body)}
                        className="text-xs text-primary-500 hover:text-primary-700 flex items-center space-x-1"
                      >
                        <DocumentDuplicateIcon className="h-3 w-3" />
                        <span>复制</span>
                      </button>
                    </div>
                    <textarea
                      value={generatedEmail.body}
                      onChange={(e) => {
                        const newValue = e.target.value
                        console.log('Body updated to:', newValue.substring(0, 100) + '...')
                        setGeneratedEmail(prev => ({
                          ...prev,
                          body: newValue
                        }))
                      }}
                      rows={15}
                      className="input-field resize-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-primary-100">
                {emailDetails && emailDetails.status !== 'sent' ? (
                  <button 
                    onClick={startSendProcess}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span>发送邮件</span>
                  </button>
                ) : emailDetails && emailDetails.status === 'sent' ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>邮件已发送</span>
                  </div>
                ) : (
                  <button className="btn-primary flex items-center space-x-2">
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span>创建邮件活动</span>
                  </button>
                )}
                <button className="btn-secondary">
                  保存模板
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => copyToClipboard(`主题: ${generatedEmail.subject}\n\n${generatedEmail.body}`)}
                >
                  复制全部
                </button>
              </div>

              <div className="text-xs text-primary-500 pt-2">
                生成时间: {new Date(generatedEmail.generatedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <SparklesIcon className="h-12 w-12 text-primary-300 mb-4" />
              <p className="text-primary-500">填写左侧信息后，点击"生成邮件"按钮</p>
              <p className="text-sm text-primary-400 mt-2">AI将为您创建个性化的营销邮件</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      {!emailDetails && (
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">💡 使用技巧</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-700">
          <div>
            <h4 className="font-medium mb-2">提供详细的公司信息:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>公司规模和历史</li>
              <li>核心产品或服务</li>
              <li>竞争优势和特色</li>
              <li>成功案例或客户</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">精确描述目标受众:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-600">
              <li>行业和公司规模</li>
              <li>决策者职位</li>
              <li>可能的痛点需求</li>
              <li>联系背景或契机</li>
            </ul>
          </div>
        </div>
      </div>
      )}
      
      {/* Email Setup Wizard */}
      <EmailSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        emailDetails={emailDetails}
        generatedEmail={generatedEmail}
        onEmailSent={handleEmailSent}
      />
    </div>
  )
}