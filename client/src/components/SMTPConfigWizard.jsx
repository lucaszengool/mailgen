import { useState, useEffect } from 'react'
import { 
  CheckIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CogIcon,
  EnvelopeIcon,
  KeyIcon,
  ServerIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { openMailSettings, generateSMTPConfig, validateEmail } from '../utils/systemSettings'

export default function SMTPConfigWizard({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [smtpConfig, setSmtpConfig] = useState({
    provider: '',
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: '',
    fromEmail: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const steps = [
    {
      title: '选择邮件服务商',
      description: '选择您使用的邮件服务提供商',
      component: 'provider'
    },
    {
      title: '获取应用密码',
      description: '获取邮件服务商的应用专用密码',
      component: 'appPassword'
    },
    {
      title: '配置SMTP设置',
      description: '输入SMTP服务器配置信息',
      component: 'smtp'
    },
    {
      title: '测试连接',
      description: '测试SMTP配置是否正确',
      component: 'test'
    }
  ]

  const providers = [
    {
      name: 'Gmail',
      value: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      instructions: [
        '1. 打开Gmail设置',
        '2. 启用两步验证',
        '3. 生成应用专用密码',
        '4. 使用应用密码登录'
      ],
      helpUrl: 'https://support.google.com/accounts/answer/185833'
    },
    {
      name: 'Outlook/Hotmail',
      value: 'outlook',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      instructions: [
        '⚠️ Outlook已禁用基本认证，请使用以下替代方案：',
        '1. 使用Gmail或其他支持SMTP的邮箱',
        '2. 或配置企业版Office 365账户',
        '3. 建议改用Gmail配置'
      ],
      helpUrl: 'https://support.microsoft.com/zh-cn/office/outlook-com-基本身份验证将于-2024-年-9-月-16-日弃用-c3f8feb9-4bb8-4b40-87da-2ee54b5c7df5'
    },
    {
      name: 'QQ邮箱',
      value: 'qq',
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      instructions: [
        '1. 登录QQ邮箱网页版',
        '2. 进入设置 → 账户',
        '3. 开启SMTP服务',
        '4. 获取授权码'
      ],
      helpUrl: 'https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256'
    },
    {
      name: '163邮箱',
      value: '163',
      host: 'smtp.163.com',
      port: 587,
      secure: false,
      instructions: [
        '1. 登录163邮箱',
        '2. 进入设置 → POP3/SMTP/IMAP',
        '3. 开启SMTP服务',
        '4. 设置客户端授权密码'
      ],
      helpUrl: 'http://help.163.com/09/1224/17/5RAJ4LMH00753VB8.html'
    },
    {
      name: '自定义SMTP',
      value: 'custom',
      host: '',
      port: 587,
      secure: false,
      instructions: [
        '1. 联系您的邮件服务提供商',
        '2. 获取SMTP服务器地址',
        '3. 获取端口和加密设置',
        '4. 确认用户名和密码'
      ]
    }
  ]

  const selectedProvider = providers.find(p => p.value === smtpConfig.provider)

  const openSystemSettings = () => {
    openMailSettings()
  }
  
  // 当用户输入邮箱时自动配置SMTP
  const handleEmailChange = (email) => {
    setSmtpConfig(prev => ({ ...prev, user: email, fromEmail: email }))
    
    if (validateEmail(email)) {
      const config = generateSMTPConfig(email)
      if (config.provider !== 'custom') {
        setSmtpConfig(prev => ({
          ...prev,
          provider: config.provider,
          host: config.host,
          port: config.port,
          secure: config.secure
        }))
      }
    }
  }

  const openProviderHelp = (url) => {
    window.open(url, '_blank')
  }

  const handleProviderSelect = (provider) => {
    setSmtpConfig(prev => ({
      ...prev,
      provider: provider.value,
      host: provider.host,
      port: provider.port,
      secure: provider.secure
    }))
  }

  const testSMTPConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/automation/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(smtpConfig)
      })
      
      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        // 保存配置到localStorage
        localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig))
      }
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      })
    } finally {
      setTesting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // 完成配置
      onComplete(smtpConfig)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return smtpConfig.provider !== ''
      case 1: return smtpConfig.user !== '' && smtpConfig.password !== ''
      case 2: return smtpConfig.host !== '' && smtpConfig.port > 0
      case 3: return testResult?.success === true
      default: return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 选择邮件服务商
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.value}
                  onClick={() => handleProviderSelect(provider)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    smtpConfig.provider === provider.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ServerIcon className="h-6 w-6 text-primary-600" />
                      <span className="font-medium text-gray-900">{provider.name}</span>
                    </div>
                    {smtpConfig.provider === provider.value && (
                      <CheckIcon className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 1: // 获取应用密码
        return (
          <div className="space-y-6">
            {selectedProvider && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">
                  📋 {selectedProvider.name} 应用密码获取步骤：
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  {selectedProvider.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
                {selectedProvider.helpUrl && (
                  <div className="mt-4">
                    <button
                      onClick={() => openProviderHelp(selectedProvider.helpUrl)}
                      className="btn-secondary text-sm"
                    >
                      📖 查看详细教程
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址 *
                </label>
                <input
                  type="email"
                  value={smtpConfig.user}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="input-field"
                  placeholder="your-email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  应用专用密码 *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="输入应用专用密码（非登录密码）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ 请使用应用专用密码，不是您的常规登录密码
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发件人名称
                </label>
                <input
                  type="text"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                  className="input-field"
                  placeholder="您的姓名或公司名称"
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">重要提示：</p>
                  <p>现代邮件服务商都要求使用应用专用密码，而不是您的常规登录密码。这样更安全，也避免两步验证的问题。</p>
                  {smtpConfig.provider === 'outlook' && (
                    <p className="mt-2 font-medium text-red-700">
                      ⚠️ 注意：Outlook.com已禁用基本认证，建议使用Gmail或QQ邮箱。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // 配置SMTP设置
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP服务器 *
                </label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                  className="input-field"
                  placeholder="smtp.example.com"
                  disabled={smtpConfig.provider !== 'custom'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  端口 *
                </label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="input-field"
                  disabled={smtpConfig.provider !== 'custom'}
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={smtpConfig.secure}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, secure: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={smtpConfig.provider !== 'custom'}
                />
                <span className="text-sm text-gray-700">使用SSL/TLS加密</span>
              </label>
            </div>
            
            {selectedProvider && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">当前配置预览：</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>服务商：</strong>{selectedProvider.name}</p>
                  <p><strong>SMTP服务器：</strong>{smtpConfig.host}</p>
                  <p><strong>端口：</strong>{smtpConfig.port}</p>
                  <p><strong>加密：</strong>{smtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'}</p>
                  <p><strong>用户名：</strong>{smtpConfig.user || '未设置'}</p>
                </div>
              </div>
            )}
          </div>
        )

      case 3: // 测试连接
        return (
          <div className="space-y-6">
            <div className="text-center">
              <EnvelopeIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">测试SMTP连接</h3>
              <p className="text-gray-600">我们将发送一封测试邮件来验证您的配置</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">配置摘要：</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>邮件服务商：</strong>{selectedProvider?.name}</p>
                <p><strong>发件邮箱：</strong>{smtpConfig.user}</p>
                <p><strong>发件人名称：</strong>{smtpConfig.fromName || '未设置'}</p>
                <p><strong>SMTP服务器：</strong>{smtpConfig.host}:{smtpConfig.port}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={testSMTPConnection}
                disabled={testing}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <>
                    <div className="loading-spinner h-4 w-4"></div>
                    <span>正在测试连接...</span>
                  </>
                ) : (
                  <>
                    <ServerIcon className="h-4 w-4" />
                    <span>测试SMTP连接</span>
                  </>
                )}
              </button>
              
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {testResult.success ? (
                      <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className={`text-sm ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      <p className="font-medium">
                        {testResult.success ? '✅ 连接成功！' : '❌ 连接失败'}
                      </p>
                      <p>{testResult.message || testResult.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">邮件发送配置向导</h2>
              <p className="text-gray-600 mt-1">第 {currentStep + 1} 步，共 {steps.length} 步</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 进度条 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex-1 ${index !== steps.length - 1 ? 'mr-4' : ''}`}
                >
                  <div className={`h-2 rounded-full ${
                    index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}></div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {steps[currentStep].title} - {steps[currentStep].description}
            </div>
          </div>

          {/* 步骤内容 */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>上一步</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {currentStep === 1 && (
                <button
                  onClick={openSystemSettings}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <CogIcon className="h-4 w-4" />
                  <span>打开系统邮件设置</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <span>{currentStep === steps.length - 1 ? '完成配置' : '下一步'}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}