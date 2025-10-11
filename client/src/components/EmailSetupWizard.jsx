import { useState, useEffect } from 'react'
import { 
  CheckIcon, 
  XMarkIcon,
  EnvelopeIcon,
  CogIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const EmailSetupWizard = ({ 
  isOpen, 
  onClose, 
  emailDetails, 
  generatedEmail, 
  onEmailSent 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: ''
  })
  const [sending, setSending] = useState(false)
  const [smtpTested, setSmtpTested] = useState(false)
  const [smtpValid, setSmtpValid] = useState(false)

  // Debug effect to log prop changes
  useEffect(() => {
    console.log('EmailSetupWizard received props:', {
      isOpen,
      emailDetails: emailDetails ? { recipient: emailDetails.recipient } : null,
      generatedEmail: generatedEmail ? {
        subject: generatedEmail.subject,
        body: generatedEmail.body ? generatedEmail.body.substring(0, 100) + '...' : null
      } : null
    })
  }, [isOpen, emailDetails, generatedEmail])

  const steps = [
    {
      id: 1,
      title: 'SMTP邮箱配置',
      description: '配置您的邮箱发送设置',
      icon: CogIcon
    },
    {
      id: 2,
      title: '测试连接',
      description: '验证邮箱配置是否正确',
      icon: CheckIcon
    },
    {
      id: 3,
      title: '邮件预览',
      description: '预览要发送的邮件内容',
      icon: EyeIcon
    },
    {
      id: 4,
      title: '发送确认',
      description: '确认发送邮件',
      icon: PaperAirplaneIcon
    }
  ]

  const emailProviders = [
    {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      helpText: '需要开启两步验证并生成应用密码'
    },
    {
      name: 'Outlook/Hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      helpText: '使用您的Microsoft账户密码'
    },
    {
      name: 'QQ邮箱',
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      helpText: '需要在QQ邮箱设置中开启SMTP服务'
    },
    {
      name: '163邮箱',
      host: 'smtp.163.com',
      port: 25,
      secure: false,
      helpText: '需要在163邮箱设置中开启SMTP服务'
    }
  ]

  const testSmtpConnection = async () => {
    if (!smtpConfig.username || !smtpConfig.password) {
      toast.error('请填写完整的邮箱信息')
      return
    }

    setSmtpTested(false)
    try {
      const response = await fetch('/api/email/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ smtpConfig }),
      })

      const data = await response.json()
      setSmtpTested(true)
      
      if (data.success) {
        setSmtpValid(true)
        toast.success('SMTP配置测试成功！')
      } else {
        setSmtpValid(false)
        toast.error('SMTP配置测试失败: ' + data.error)
      }
    } catch (error) {
      setSmtpTested(true)
      setSmtpValid(false)
      toast.error('网络错误，请稍后重试')
    }
  }

  const sendEmail = async () => {
    setSending(true)
    console.log('Sending email with content:', {
      subject: generatedEmail.subject,
      body: generatedEmail.body,
      to: emailDetails.recipient
    })
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailDetails.recipient,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          smtpConfig: smtpConfig,
          trackingEnabled: true,
          campaignId: emailDetails.campaignId || 'manual-' + Date.now()
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('邮件发送成功！')
        onEmailSent && onEmailSent(data.data)
        onClose()
      } else {
        toast.error('发送失败: ' + data.error)
      }
    } catch (error) {
      console.error('发送邮件失败:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setSending(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      if (currentStep === 1 && (!smtpConfig.username || !smtpConfig.password)) {
        toast.error('请先完成SMTP配置')
        return
      }
      if (currentStep === 2 && !smtpValid) {
        toast.error('请先通过SMTP连接测试')
        return
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const selectProvider = (provider) => {
    setSmtpConfig(prev => ({
      ...prev,
      host: provider.host,
      port: provider.port,
      secure: provider.secure
    }))
    setSmtpTested(false)
    setSmtpValid(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">邮件发送设置向导</h2>
              <p className="text-gray-600 mt-1">按步骤完成邮件发送配置</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep > step.id 
                      ? 'bg-green-100 border-green-500 text-green-600'
                      : currentStep === step.id
                      ? 'bg-primary-100 border-primary-500 text-primary-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckIcon className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold text-gray-900">{steps[currentStep - 1].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: SMTP Configuration */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">配置说明</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      选择您的邮箱服务商并填写邮箱账户信息。建议使用应用密码而非登录密码以确保安全。
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Provider Selection */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">选择邮箱服务商</h4>
                <div className="grid grid-cols-2 gap-4">
                  {emailProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => selectProvider(provider)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        smtpConfig.host === provider.host
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{provider.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{provider.helpText}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SMTP Configuration Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP服务器
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig(prev => ({...prev, host: e.target.value}))}
                    className="input-field"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    端口
                  </label>
                  <input
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig(prev => ({...prev, port: parseInt(e.target.value)}))}
                    className="input-field"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig(prev => ({...prev, username: e.target.value}))}
                    className="input-field"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码/应用密码
                  </label>
                  <input
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig(prev => ({...prev, password: e.target.value}))}
                    className="input-field"
                    placeholder="您的邮箱应用密码"
                  />
                </div>
              </div>

              {smtpConfig.host === 'smtp.gmail.com' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-900">Gmail配置提示</h4>
                      <div className="text-sm text-yellow-700 mt-1">
                        <p className="mb-2">使用Gmail需要以下步骤：</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>在Google账户中开启两步验证</li>
                          <li>生成应用密码（不是登录密码）</li>
                          <li>使用应用密码而非账户密码</li>
                        </ol>
                        <a 
                          href="https://support.google.com/accounts/answer/185833" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                        >
                          查看详细配置指南 →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Test Connection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <CogIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">测试SMTP连接</h3>
                <p className="text-gray-600">
                  验证您的邮箱配置是否正确，确保能够正常发送邮件
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">当前配置：</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>邮箱服务器: {smtpConfig.host}:{smtpConfig.port}</div>
                  <div>发送邮箱: {smtpConfig.username}</div>
                  <div>安全连接: {smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}</div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={testSmtpConnection}
                  disabled={!smtpConfig.username || !smtpConfig.password}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <CogIcon className="h-5 w-5" />
                  <span>测试连接</span>
                </button>
              </div>

              {smtpTested && (
                <div className={`border rounded-lg p-4 ${
                  smtpValid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center">
                    {smtpValid ? (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`ml-2 font-medium ${
                      smtpValid ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {smtpValid ? '连接测试成功！' : '连接测试失败'}
                    </span>
                  </div>
                  {smtpValid && (
                    <p className="text-sm text-green-700 mt-1">
                      您的SMTP配置正确，可以继续下一步
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Email Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <EyeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">邮件预览</h3>
                <p className="text-gray-600">
                  确认邮件内容无误后即可发送
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <div className="border-b border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="font-medium text-gray-700">收件人:</span> {emailDetails.recipient}</div>
                    <div><span className="font-medium text-gray-700">发件人:</span> {smtpConfig.username}</div>
                    <div><span className="font-medium text-gray-700">主题:</span> {generatedEmail.subject}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div 
                    className="prose max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ 
                      __html: generatedEmail.body.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">发送提醒</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      邮件发送后将无法撤回，请仔细检查收件人和邮件内容是否正确。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Send Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <PaperAirplaneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">确认发送</h3>
                <p className="text-gray-600">
                  一切准备就绪，点击下方按钮发送邮件
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">发送摘要：</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>收件人:</span>
                    <span className="font-medium">{emailDetails.recipientName} ({emailDetails.recipient})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>发件人:</span>
                    <span className="font-medium">{smtpConfig.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>邮件主题:</span>
                    <span className="font-medium">{generatedEmail.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>发送时间:</span>
                    <span className="font-medium">立即发送</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={sendEmail}
                  disabled={sending}
                  className="btn-primary flex items-center space-x-2 mx-auto text-lg px-8 py-3"
                >
                  {sending ? (
                    <>
                      <div className="loading-spinner h-5 w-5"></div>
                      <span>发送中...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      <span>发送邮件</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>上一步</span>
          </button>

          <div className="text-sm text-gray-500">
            第 {currentStep} 步，共 {steps.length} 步
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>下一步</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailSetupWizard