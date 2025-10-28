import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CogIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon as TargetIcon,
  UsersIcon,
  PresentationChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import WebsiteAnalysisHistory from '../components/WebsiteAnalysisHistory'

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('smtp')
  
  // SMTP Configuration State
  const [smtpConfig, setSmtpConfig] = useState({
    name: '',
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    ctaUrl: '',
    ctaText: 'Schedule a Meeting',
    companyWebsite: '',
    senderName: '',
    companyName: ''
  })
  
  // Campaign Configuration State
  const [campaignConfig, setCampaignConfig] = useState({
    campaignGoal: '',
    goalData: null,
    targetWebsite: '',
    businessType: 'auto'
  })
  
  // Template Configuration State
  const [templateConfig, setTemplateConfig] = useState({
    emailTemplate: '',
    templateData: null,
    preferredTemplates: []
  })

  // Website Analysis Configuration State
  const [websiteAnalysisConfig, setWebsiteAnalysisConfig] = useState({
    targetWebsite: '',
    businessName: '',
    businessLogo: '',
    productServiceType: '',
    businessIntro: '',
    benchmarkBrands: [],
    sellingPoints: [],
    targetAudiences: []
  })
  
  // Targeting Configuration State
  const [targetingConfig, setTargetingConfig] = useState({
    audienceType: '',
    industries: [],
    roles: [],
    companySize: '',
    location: '',
    keywords: []
  })
  
  // AI Configuration State
  const [aiConfig, setAiConfig] = useState({
    model: 'qwen2.5:0.5b',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: ''
  })
  
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkOllamaStatus()
    loadAllConfigurations()
  }, [])

  // 🎯 Track changes to show unsaved indicator
  useEffect(() => {
    // Don't mark as changed on initial load
    if (smtpConfig.host === '' && smtpConfig.username === '' &&
        !campaignConfig.campaignGoal && targetingConfig.industries.length === 0) {
      return
    }
    setHasUnsavedChanges(true)
  }, [smtpConfig, campaignConfig, templateConfig, targetingConfig, aiConfig, websiteAnalysisConfig])

  const loadAllConfigurations = () => {
    try {
      // Load SMTP Config
      const savedSmtpConfig = localStorage.getItem('smtpConfig')
      if (savedSmtpConfig) {
        const parsedConfig = JSON.parse(savedSmtpConfig)
        setSmtpConfig(prev => ({ ...prev, ...parsedConfig }))
      }

      // Load Agent Setup Data (contains campaign, template, targeting data)
      const savedAgentSetup = localStorage.getItem('agentSetupData')
      const parsedSetup = savedAgentSetup ? JSON.parse(savedAgentSetup) : {}

      if (savedAgentSetup) {
        // Load Campaign Config
        if (parsedSetup.campaignGoal || parsedSetup.targetWebsite) {
          setCampaignConfig(prev => ({
            ...prev,
            campaignGoal: parsedSetup.campaignGoal || '',
            goalData: parsedSetup.goalData || null,
            targetWebsite: parsedSetup.targetWebsite || '',
            businessType: parsedSetup.businessType || 'auto'
          }))
        }

        // Load Template Config
        if (parsedSetup.emailTemplate || parsedSetup.templateData) {
          setTemplateConfig(prev => ({
            ...prev,
            emailTemplate: parsedSetup.emailTemplate || '',
            templateData: parsedSetup.templateData || null,
            preferredTemplates: parsedSetup.preferredTemplates || []
          }))
        }

        // Load Targeting Config
        if (parsedSetup.audienceType || parsedSetup.industries) {
          setTargetingConfig(prev => ({
            ...prev,
            audienceType: parsedSetup.audienceType || '',
            industries: parsedSetup.industries || [],
            roles: parsedSetup.roles || [],
            companySize: parsedSetup.companySize || '',
            location: parsedSetup.location || '',
            keywords: parsedSetup.keywords || []
          }))
        }
      }

      // Load AI Config
      const savedAiConfig = localStorage.getItem('aiConfig')
      if (savedAiConfig) {
        const parsedAiConfig = JSON.parse(savedAiConfig)
        setAiConfig(prev => ({ ...prev, ...parsedAiConfig }))
      }

      // Load Website Analysis Config
      const savedWebsiteAnalysis = localStorage.getItem('websiteAnalysisConfig')
      if (savedWebsiteAnalysis) {
        const parsedAnalysis = JSON.parse(savedWebsiteAnalysis)
        setWebsiteAnalysisConfig(prev => ({ ...prev, ...parsedAnalysis }))
      } else if (parsedSetup && parsedSetup.targetWebsite) {
        // Fallback: load from agentSetupData if websiteAnalysisConfig doesn't exist
        setWebsiteAnalysisConfig(prev => ({
          ...prev,
          targetWebsite: parsedSetup.targetWebsite || '',
          businessName: parsedSetup.businessName || '',
          productServiceType: parsedSetup.businessType || '',
          businessIntro: parsedSetup.businessIntro || '',
          benchmarkBrands: parsedSetup.benchmarkBrands || [],
          sellingPoints: parsedSetup.sellingPoints || [],
          targetAudiences: parsedSetup.targetAudiences || []
        }))
      }

    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('/api/ollama/status')
      const data = await response.json()
      setOllamaStatus(data.data)
    } catch (error) {
      setOllamaStatus({ connected: false, qwenAvailable: false })
    }
  }

  const testSmtpConnection = async () => {
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast.error('请填写完整的SMTP配置')
      return
    }

    setTestingConnection(true)
    try {
      const response = await fetch('/api/email/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ smtpConfig }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('SMTP连接测试成功！')
      } else {
        toast.error(data.error || '连接测试失败')
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试')
    } finally {
      setTestingConnection(false)
    }
  }

  // Update functions for each configuration section
  const updateSmtpConfig = async () => {
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast.error('请填写完整的SMTP配置信息')
      return
    }

    setIsSaving(true)
    
    try {
      localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig))
      
      const response = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig, timestamp: new Date().toISOString() }),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetch('/api/workflow/update-config', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configType: 'smtp', config: smtpConfig, action: 'update' }),
        })
        
        toast.success('SMTP配置更新成功！')
      } else {
        throw new Error(data.error || '后端保存失败')
      }
      
    } catch (error) {
      console.error('更新SMTP配置失败:', error)
      toast.error(`配置更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateCampaignConfig = async () => {
    if (!campaignConfig.campaignGoal) {
      toast.error('请选择活动目标')
      return
    }

    setIsSaving(true)
    
    try {
      // Update agentSetupData with campaign config
      const existingSetup = JSON.parse(localStorage.getItem('agentSetupData') || '{}')
      const updatedSetup = { ...existingSetup, ...campaignConfig }
      localStorage.setItem('agentSetupData', JSON.stringify(updatedSetup))
      
      const response = await fetch('/api/settings/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignConfig }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('活动配置更新成功！')
      } else {
        throw new Error(data.error || '后端保存失败')
      }
      
    } catch (error) {
      console.error('更新活动配置失败:', error)
      toast.error(`配置更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateTargetingConfig = async () => {
    if (!targetingConfig.audienceType || targetingConfig.industries.length === 0) {
      toast.error('请完整填写目标受众配置')
      return
    }

    setIsSaving(true)
    
    try {
      // Update agentSetupData with targeting config
      const existingSetup = JSON.parse(localStorage.getItem('agentSetupData') || '{}')
      const updatedSetup = { ...existingSetup, ...targetingConfig }
      localStorage.setItem('agentSetupData', JSON.stringify(updatedSetup))
      
      const response = await fetch('/api/settings/targeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetingConfig }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('目标受众配置更新成功！')
      } else {
        throw new Error(data.error || '后端保存失败')
      }
      
    } catch (error) {
      console.error('更新目标受众配置失败:', error)
      toast.error(`配置更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateTemplateConfig = async () => {
    setIsSaving(true)
    
    try {
      // Update agentSetupData with template config
      const existingSetup = JSON.parse(localStorage.getItem('agentSetupData') || '{}')
      const updatedSetup = { ...existingSetup, ...templateConfig }
      localStorage.setItem('agentSetupData', JSON.stringify(updatedSetup))
      
      const response = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateConfig }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('模板配置更新成功！')
      } else {
        throw new Error(data.error || '后端保存失败')
      }
      
    } catch (error) {
      console.error('更新模板配置失败:', error)
      toast.error(`配置更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateAiConfig = async () => {
    setIsSaving(true)

    try {
      localStorage.setItem('aiConfig', JSON.stringify(aiConfig))

      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('AI配置更新成功！')
      } else {
        throw new Error(data.error || '后端保存失败')
      }

    } catch (error) {
      console.error('更新AI配置失败:', error)
      toast.error(`配置更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const updateWebsiteAnalysisConfig = async () => {
    if (!websiteAnalysisConfig.targetWebsite || !websiteAnalysisConfig.businessName) {
      toast.error('Please fill in Target Website and Business Name')
      return
    }

    setIsSaving(true)

    try {
      // Save to localStorage
      localStorage.setItem('websiteAnalysisConfig', JSON.stringify(websiteAnalysisConfig))

      // Save to history
      const historyEntry = {
        ...websiteAnalysisConfig,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString()
      }

      const existingHistory = JSON.parse(localStorage.getItem('websiteAnalysisHistory') || '[]')
      const updatedHistory = [historyEntry, ...existingHistory]
      localStorage.setItem('websiteAnalysisHistory', JSON.stringify(updatedHistory))

      // Also update agentSetupData for backwards compatibility
      const existingSetup = JSON.parse(localStorage.getItem('agentSetupData') || '{}')
      const updatedSetup = {
        ...existingSetup,
        targetWebsite: websiteAnalysisConfig.targetWebsite,
        businessName: websiteAnalysisConfig.businessName,
        businessType: websiteAnalysisConfig.productServiceType,
        businessIntro: websiteAnalysisConfig.businessIntro,
        benchmarkBrands: websiteAnalysisConfig.benchmarkBrands,
        sellingPoints: websiteAnalysisConfig.sellingPoints,
        targetAudiences: websiteAnalysisConfig.targetAudiences
      }
      localStorage.setItem('agentSetupData', JSON.stringify(updatedSetup))

      const response = await fetch('/api/settings/website-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteAnalysisConfig }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Website Analysis updated and saved to history!')
        // Trigger a refresh of the history component
        window.dispatchEvent(new Event('storage'))
      } else {
        throw new Error(data.error || 'Backend save failed')
      }

    } catch (error) {
      console.error('Update website analysis config failed:', error)
      toast.error(`Update failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Update all configurations at once
  const updateAllConfigurations = async () => {
    setIsSaving(true)
    
    try {
      // Prepare bulk update data
      const allSettings = {
        smtp: smtpConfig,
        campaign: campaignConfig,
        targeting: targetingConfig,
        templates: templateConfig,
        ai: aiConfig,
        websiteAnalysis: websiteAnalysisConfig
      }
      
      // Save to localStorage
      localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig))
      localStorage.setItem('aiConfig', JSON.stringify(aiConfig))
      localStorage.setItem('websiteAnalysisConfig', JSON.stringify(websiteAnalysisConfig))

      // Update agentSetupData with all relevant configs
      const updatedAgentSetup = {
        ...campaignConfig,
        ...templateConfig,
        ...targetingConfig,
        targetWebsite: websiteAnalysisConfig.targetWebsite,
        businessName: websiteAnalysisConfig.businessName,
        businessType: websiteAnalysisConfig.productServiceType,
        businessIntro: websiteAnalysisConfig.businessIntro,
        benchmarkBrands: websiteAnalysisConfig.benchmarkBrands,
        sellingPoints: websiteAnalysisConfig.sellingPoints,
        targetAudiences: websiteAnalysisConfig.targetAudiences,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('agentSetupData', JSON.stringify(updatedAgentSetup))
      
      // Send to backend API
      const response = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: allSettings }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Notify workflows of config update
        await fetch('/api/workflow/update-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            configType: 'all', 
            config: allSettings, 
            action: 'bulk_update' 
          }),
        })
        
        setHasUnsavedChanges(false)
        toast.success('所有配置更新成功！已同步到后端和运行中的工作流程', {
          duration: 4000
        })
        
      } else {
        throw new Error(data.error || '后端保存失败')
      }
      
    } catch (error) {
      console.error('批量更新配置失败:', error)
      toast.error(`批量更新失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'smtp', label: 'SMTP Settings', icon: EnvelopeIcon },
    { id: 'website-analysis', label: 'Website Analysis', icon: PresentationChartBarIcon },
    { id: 'campaign', label: 'Campaign Config', icon: TargetIcon },
    { id: 'targeting', label: '目标受众', icon: UsersIcon },
    { id: 'templates', label: '邮件模板', icon: DocumentTextIcon },
    { id: 'ai', label: 'AI模型', icon: ServerIcon },
    { id: 'analytics', label: '数据分析', icon: PresentationChartBarIcon },
    { id: 'profile', label: '个人资料', icon: UserIcon }
  ]

  const TabButton = ({ tab, isActive, onClick }) => (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex items-center px-4 py-3 text-left w-full rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      <tab.icon className="h-5 w-5 mr-3" />
      {tab.label}
    </button>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">系统设置</h1>
        <p className="mt-2 text-primary-600">配置您的邮件营销系统参数</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={setActiveTab}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* SMTP Settings */}
          {activeTab === 'smtp' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <EnvelopeIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">SMTP邮件服务器设置</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="smtp-name" className="block text-sm font-medium text-primary-700 mb-2">
                    配置名称
                  </label>
                  <input
                    type="text"
                    id="smtp-name"
                    value={smtpConfig.name}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="例如：公司邮箱服务器"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="smtp-host" className="block text-sm font-medium text-primary-700 mb-2">
                      SMTP服务器地址 *
                    </label>
                    <input
                      type="text"
                      id="smtp-host"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                      className="input-field"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="smtp-port" className="block text-sm font-medium text-primary-700 mb-2">
                      端口号 *
                    </label>
                    <input
                      type="number"
                      id="smtp-port"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="input-field"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, secure: e.target.checked }))}
                      className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-primary-700">使用SSL/TLS加密 (端口465)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="smtp-username" className="block text-sm font-medium text-primary-700 mb-2">
                      用户名/邮箱地址 *
                    </label>
                    <input
                      type="email"
                      id="smtp-username"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, username: e.target.value }))}
                      className="input-field"
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="smtp-password" className="block text-sm font-medium text-primary-700 mb-2">
                      密码 *
                    </label>
                    <input
                      type="password"
                      id="smtp-password"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                      className="input-field"
                      placeholder="应用专用密码"
                    />
                  </div>
                </div>

                {/* Marketing Campaign Configuration */}
                <div className="border-t border-primary-200 pt-6">
                  <h4 className="text-lg font-medium text-primary-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    营销活动配置
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sender-name" className="block text-sm font-medium text-primary-700 mb-2">
                        发件人姓名 *
                      </label>
                      <input
                        type="text"
                        id="sender-name"
                        value={smtpConfig.senderName}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, senderName: e.target.value }))}
                        className="input-field"
                        placeholder="James Wilson"
                      />
                    </div>

                    <div>
                      <label htmlFor="company-name" className="block text-sm font-medium text-primary-700 mb-2">
                        公司名称 *
                      </label>
                      <input
                        type="text"
                        id="company-name"
                        value={smtpConfig.companyName}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, companyName: e.target.value }))}
                        className="input-field"
                        placeholder="FruitAI"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company-website" className="block text-sm font-medium text-primary-700 mb-2">
                        公司网站 *
                      </label>
                      <input
                        type="url"
                        id="company-website"
                        value={smtpConfig.companyWebsite}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, companyWebsite: e.target.value }))}
                        className="input-field"
                        placeholder="https://fruitai.org"
                      />
                    </div>

                    <div>
                      <label htmlFor="cta-text" className="block text-sm font-medium text-primary-700 mb-2">
                        CTA按钮文字 *
                      </label>
                      <input
                        type="text"
                        id="cta-text"
                        value={smtpConfig.ctaText}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                        className="input-field"
                        placeholder="Schedule a Meeting"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cta-url" className="block text-sm font-medium text-primary-700 mb-2">
                      CTA链接地址 *
                    </label>
                    <input
                      type="url"
                      id="cta-url"
                      value={smtpConfig.ctaUrl}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, ctaUrl: e.target.value }))}
                      className="input-field w-full"
                      placeholder="https://calendly.com/your-calendar"
                    />
                    <p className="text-xs text-primary-500 mt-1">
                      用于邮件中的预约按钮，例如 Calendly、Acuity 或其他预约系统链接
                    </p>
                  </div>
                </div>

                {/* Email Tracking Configuration */}
                <div className="border-t border-primary-200 pt-6">
                  <h4 className="text-lg font-medium text-primary-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Email Analytics Tracking
                  </h4>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      📊 Enable email tracking to monitor opens, clicks, replies, and bounces.
                      Gmail app passwords work for both SMTP (sending) and IMAP (reading inbox).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="enable-tracking"
                        checked={smtpConfig.enableTracking || false}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, enableTracking: e.target.checked }))}
                        className="mt-1 rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="enable-tracking" className="ml-3">
                        <span className="text-sm font-medium text-primary-900">Enable Email Tracking</span>
                        <p className="text-xs text-primary-600 mt-1">
                          Track email opens (via pixel), link clicks, replies (via IMAP), and bounces for analytics
                        </p>
                      </label>
                    </div>

                    {smtpConfig.enableTracking && (
                      <div className="ml-7 space-y-4 pl-4 border-l-2 border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="imap-host" className="block text-sm font-medium text-primary-700 mb-2">
                              IMAP Server *
                            </label>
                            <input
                              type="text"
                              id="imap-host"
                              value={smtpConfig.imapHost || 'imap.gmail.com'}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, imapHost: e.target.value }))}
                              className="input-field"
                              placeholder="imap.gmail.com"
                            />
                          </div>

                          <div>
                            <label htmlFor="imap-port" className="block text-sm font-medium text-primary-700 mb-2">
                              IMAP Port *
                            </label>
                            <input
                              type="number"
                              id="imap-port"
                              value={smtpConfig.imapPort || 993}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, imapPort: parseInt(e.target.value) }))}
                              className="input-field"
                              placeholder="993"
                            />
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-xs text-green-800">
                            ✅ <strong>Uses same credentials:</strong> IMAP will use your SMTP username and password above
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={smtpConfig.trackOpens !== false}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, trackOpens: e.target.checked }))}
                              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-primary-700">Track email opens (1x1 pixel)</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={smtpConfig.trackClicks !== false}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, trackClicks: e.target.checked }))}
                              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-primary-700">Track link clicks (redirect tracking)</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={smtpConfig.trackReplies !== false}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, trackReplies: e.target.checked }))}
                              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-primary-700">Monitor replies (via IMAP)</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={smtpConfig.trackBounces !== false}
                              onChange={(e) => setSmtpConfig(prev => ({ ...prev, trackBounces: e.target.checked }))}
                              className="rounded border-primary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-primary-700">Detect bounces (via IMAP)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary-50 p-4 rounded-lg">
                  <h4 className="font-medium text-primary-900 mb-2">常用SMTP配置</h4>
                  <div className="text-sm text-primary-700 space-y-2">
                    <div>
                      <strong>Gmail:</strong> smtp.gmail.com, 端口587 (TLS) 或 465 (SSL) | IMAP: imap.gmail.com:993
                    </div>
                    <div>
                      <strong>QQ邮箱:</strong> smtp.qq.com, 端口587 (TLS) 或 465 (SSL) | IMAP: imap.qq.com:993
                    </div>
                    <div>
                      <strong>163邮箱:</strong> smtp.163.com, 端口25 或 465 (SSL) | IMAP: imap.163.com:993
                    </div>
                    <div>
                      <strong>企业邮箱:</strong> 请联系您的IT管理员获取配置信息
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-primary-200">
                  <button
                    onClick={testSmtpConnection}
                    disabled={testingConnection}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    {testingConnection ? (
                      <>
                        <div className="loading-spinner h-4 w-4"></div>
                        <span>测试中...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>测试连接</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={updateSmtpConfig} 
                    disabled={isSaving}
                    className={`btn-primary ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isSaving ? (
                      <>
                        <div className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        更新中...
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <div className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        更新配置
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        已保存
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Website Analysis Settings */}
          {activeTab === 'website-analysis' && (
            <div className="space-y-6">
              {/* Analysis History Section */}
              <div className="card">
                <WebsiteAnalysisHistory />
              </div>

              {/* Configuration Form */}
              <div className="card">
                <div className="flex items-center mb-6">
                  <PresentationChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-primary-900">Website Analysis Configuration</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">Configure and update your website analysis settings</p>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

                  {/* Business Logo */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      {websiteAnalysisConfig.businessLogo ? (
                        <img src={websiteAnalysisConfig.businessLogo} alt="Logo" className="w-16 h-16 object-contain" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                          <span className="text-2xl">🏢</span>
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => {
                            const url = prompt('Enter logo URL (SVG format recommended):')
                            if (url) setWebsiteAnalysisConfig(prev => ({ ...prev, businessLogo: url }))
                          }}
                          className="btn-secondary text-sm"
                        >
                          Upload
                        </button>
                        <p className="text-xs text-gray-500 mt-1">Only support uploading logos in SVG format.</p>
                      </div>
                    </div>
                  </div>

                  {/* Target Website + Business Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="target-website" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Website *
                      </label>
                      <input
                        type="url"
                        id="target-website"
                        value={websiteAnalysisConfig.targetWebsite}
                        onChange={(e) => setWebsiteAnalysisConfig(prev => ({ ...prev, targetWebsite: e.target.value }))}
                        className="input-field"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Business name *
                      </label>
                      <input
                        type="text"
                        id="business-name"
                        value={websiteAnalysisConfig.businessName}
                        onChange={(e) => setWebsiteAnalysisConfig(prev => ({ ...prev, businessName: e.target.value }))}
                        className="input-field"
                        placeholder="Aha"
                      />
                    </div>
                  </div>

                  {/* Product/Service Type */}
                  <div className="mt-4">
                    <label htmlFor="product-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Product / Service type *
                    </label>
                    <input
                      type="text"
                      id="product-type"
                      value={websiteAnalysisConfig.productServiceType}
                      onChange={(e) => setWebsiteAnalysisConfig(prev => ({ ...prev, productServiceType: e.target.value }))}
                      className="input-field"
                      placeholder="Marketing/Digital"
                    />
                  </div>

                  {/* Benchmark Brands */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Benchmark brands *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(websiteAnalysisConfig.benchmarkBrands || []).map((brand, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                          {brand}
                          <button
                            onClick={() => {
                              const newBrands = websiteAnalysisConfig.benchmarkBrands.filter((_, i) => i !== index)
                              setWebsiteAnalysisConfig(prev => ({ ...prev, benchmarkBrands: newBrands }))
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type brand name and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.target.value.trim()
                          if (value && !websiteAnalysisConfig.benchmarkBrands.includes(value)) {
                            setWebsiteAnalysisConfig(prev => ({
                              ...prev,
                              benchmarkBrands: [...prev.benchmarkBrands, value]
                            }))
                            e.target.value = ''
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll recommend influencers who have worked with these brands or reached similar audiences.
                    </p>
                  </div>

                  {/* Business Introduction */}
                  <div className="mt-4">
                    <label htmlFor="business-intro" className="block text-sm font-medium text-gray-700 mb-2">
                      Business introduction *
                    </label>
                    <textarea
                      id="business-intro"
                      rows={3}
                      value={websiteAnalysisConfig.businessIntro}
                      onChange={(e) => setWebsiteAnalysisConfig(prev => ({ ...prev, businessIntro: e.target.value }))}
                      className="input-field resize-none"
                      placeholder="Aha is your influencer marketing AI Agent — matching, pricing, negotiating, and protecting every collaboration, turning it into measurable growth."
                    />
                  </div>
                </div>

                {/* Core Selling Points */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Core Selling Points</h3>
                    <button
                      onClick={() => {
                        setWebsiteAnalysisConfig(prev => ({
                          ...prev,
                          sellingPoints: [...prev.sellingPoints, '']
                        }))
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Point
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(websiteAnalysisConfig.sellingPoints || []).map((point, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-gray-500 mt-3">{index + 1}</span>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => {
                            const newPoints = [...websiteAnalysisConfig.sellingPoints]
                            newPoints[index] = e.target.value
                            setWebsiteAnalysisConfig(prev => ({ ...prev, sellingPoints: newPoints }))
                          }}
                          className="flex-1 input-field"
                          placeholder="Instant fresheness detection via advanced machine learning algorithms"
                        />
                        <button
                          onClick={() => {
                            const newPoints = websiteAnalysisConfig.sellingPoints.filter((_, i) => i !== index)
                            setWebsiteAnalysisConfig(prev => ({ ...prev, sellingPoints: newPoints }))
                          }}
                          className="mt-3 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Audiences */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Target Audiences ({(websiteAnalysisConfig.targetAudiences || []).length} segments)
                    </h3>
                    <button
                      onClick={() => {
                        setWebsiteAnalysisConfig(prev => ({
                          ...prev,
                          targetAudiences: [...prev.targetAudiences, { name: '', description: '' }]
                        }))
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Audience
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(websiteAnalysisConfig.targetAudiences || []).map((audience, index) => (
                      <div key={index} className="p-4 border border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-700">{index + 1}</span>
                          <button
                            onClick={() => {
                              const newAudiences = websiteAnalysisConfig.targetAudiences.filter((_, i) => i !== index)
                              setWebsiteAnalysisConfig(prev => ({ ...prev, targetAudiences: newAudiences }))
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={audience.name || ''}
                          onChange={(e) => {
                            const newAudiences = [...websiteAnalysisConfig.targetAudiences]
                            newAudiences[index] = { ...newAudiences[index], name: e.target.value }
                            setWebsiteAnalysisConfig(prev => ({ ...prev, targetAudiences: newAudiences }))
                          }}
                          className="input-field mb-2"
                          placeholder="baby"
                        />
                        <textarea
                          value={audience.description || ''}
                          onChange={(e) => {
                            const newAudiences = [...websiteAnalysisConfig.targetAudiences]
                            newAudiences[index] = { ...newAudiences[index], description: e.target.value }
                            setWebsiteAnalysisConfig(prev => ({ ...prev, targetAudiences: newAudiences }))
                          }}
                          className="input-field resize-none"
                          rows={2}
                          placeholder="this is a baby"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={updateWebsiteAnalysisConfig}
                    disabled={isSaving || !websiteAnalysisConfig.targetWebsite || !websiteAnalysisConfig.businessName}
                    className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? 'Updating...' : 'Update Website Analysis'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Campaign Goal Settings */}
          {activeTab === 'campaign' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <TargetIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">活动目标设置</h2>
              </div>

              <div className="space-y-6">
                {/* Target Website */}
                <div>
                  <label htmlFor="target-website" className="block text-sm font-medium text-primary-700 mb-2">
                    目标网站 *
                  </label>
                  <input
                    type="url"
                    id="target-website"
                    value={campaignConfig.targetWebsite}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, targetWebsite: e.target.value }))}
                    className="input-field"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Campaign Goals */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    活动目标 *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'lead_generation', title: '潜客开发', desc: '寻找和吸引新的潜在客户' },
                      { id: 'partnership', title: '商业合作', desc: '与公司建立战略合作关系' },
                      { id: 'sales', title: '直接销售', desc: '将潜在客户转化为付费客户' },
                      { id: 'networking', title: '专业社交', desc: '建立关系和扩展您的网络' },
                      { id: 'brand_awareness', title: '品牌推广', desc: '提高品牌知名度和认知度' },
                      { id: 'product_launch', title: '产品发布', desc: '宣布和推广新产品或服务' }
                    ].map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => setCampaignConfig(prev => ({ ...prev, campaignGoal: goal.id }))}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          campaignConfig.campaignGoal === goal.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.desc}</p>
                        {campaignConfig.campaignGoal === goal.id && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label htmlFor="business-type" className="block text-sm font-medium text-primary-700 mb-2">
                    业务类型
                  </label>
                  <select
                    id="business-type"
                    value={campaignConfig.businessType}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, businessType: e.target.value }))}
                    className="input-field"
                  >
                    <option value="auto">自动识别</option>
                    <option value="technology">技术</option>
                    <option value="saas">SaaS</option>
                    <option value="ecommerce">电商</option>
                    <option value="consulting">咨询</option>
                    <option value="finance">金融</option>
                  </select>
                </div>

                {/* Update Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={updateCampaignConfig}
                    disabled={isSaving || !campaignConfig.campaignGoal}
                    className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? '更新中...' : '更新活动配置'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Target Audience Settings */}
          {activeTab === 'targeting' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <UsersIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">目标受众设置</h2>
              </div>

              <div className="space-y-6">
                {/* Audience Type */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    受众类型 *
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { id: 'decision_makers', title: '决策者', desc: 'CEO、创始人、VP等决策人员' },
                      { id: 'influencers', title: '影响者', desc: '团队负责人和经理等影响决策的人员' },
                      { id: 'end_users', title: '最终用户', desc: '会使用您产品的个人贡献者' }
                    ].map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setTargetingConfig(prev => ({ ...prev, audienceType: type.id }))}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          targetingConfig.audienceType === type.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{type.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Industries */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    行业选择 * (可多选)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {[
                      'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
                      'Manufacturing', 'Real Estate', 'Marketing', 'Consulting', 'Non-profit',
                      'Food & Beverage', 'Transportation', 'Energy', 'Media', 'Government'
                    ].map((industry) => (
                      <button
                        key={industry}
                        onClick={() => {
                          setTargetingConfig(prev => ({
                            ...prev,
                            industries: prev.industries.includes(industry)
                              ? prev.industries.filter(i => i !== industry)
                              : [...prev.industries, industry]
                          }))
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          targetingConfig.industries.includes(industry)
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job Roles */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    目标职位 (可选，可多选)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[
                      'CEO', 'CTO', 'CMO', 'VP Sales', 'VP Marketing', 'Founder',
                      'Director', 'Manager', 'Team Lead', 'Product Manager', 
                      'Sales Manager', 'Marketing Manager', 'Operations Manager'
                    ].map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setTargetingConfig(prev => ({
                            ...prev,
                            roles: prev.roles.includes(role)
                              ? prev.roles.filter(r => r !== role)
                              : [...prev.roles, role]
                          }))
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          targetingConfig.roles.includes(role)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    公司规模 *
                  </label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'startup', label: '初创公司 (1-10)', desc: '小团队，快速决策' },
                      { id: 'small', label: '小型企业 (11-50)', desc: '成长型公司' },
                      { id: 'medium', label: '中型企业 (51-200)', desc: '成熟企业' },
                      { id: 'large', label: '大型企业 (201-1000)', desc: '企业级客户' },
                      { id: 'enterprise', label: '跨国企业 (1000+)', desc: '大型企业集团' }
                    ].map((size) => (
                      <div
                        key={size.id}
                        onClick={() => setTargetingConfig(prev => ({ ...prev, companySize: size.id }))}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          targetingConfig.companySize === size.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{size.label}</h3>
                        <p className="text-sm text-gray-600">{size.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location and Keywords */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-primary-700 mb-2">
                      地理位置 (可选)
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={targetingConfig.location}
                      onChange={(e) => setTargetingConfig(prev => ({ ...prev, location: e.target.value }))}
                      className="input-field"
                      placeholder="例如：美国, 欧洲, 全球"
                    />
                  </div>
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-primary-700 mb-2">
                      关键词 (可选，用逗号分隔)
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      value={targetingConfig.keywords.join(', ')}
                      onChange={(e) => setTargetingConfig(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                      }))}
                      className="input-field"
                      placeholder="例如：AI, 自动化, 效率"
                    />
                  </div>
                </div>

                {/* Update Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={updateTargetingConfig}
                    disabled={isSaving || !targetingConfig.audienceType || targetingConfig.industries.length === 0}
                    className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? '更新中...' : '更新目标受众配置'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Template Settings */}
          {activeTab === 'templates' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">邮件模板设置</h2>
              </div>

              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    主要模板类型
                  </label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'initial_contact', title: '初次联系', desc: '第一次接触潜在客户' },
                      { id: 'cold_outreach', title: '冷邮件', desc: '向陌生人发送的邮件' },
                      { id: 'value_demonstration', title: '价值展示', desc: '展示产品价值和优势' },
                      { id: 'follow_up', title: '跟进邮件', desc: '后续跟进和提醒' },
                      { id: 'problem_solution', title: '问题解决', desc: '针对特定问题的解决方案' },
                      { id: 'partnership_outreach', title: '合作邀请', desc: '商业合作和伙伴关系' }
                    ].map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setTemplateConfig(prev => ({ ...prev, emailTemplate: template.id }))}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          templateConfig.emailTemplate === template.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900">{template.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.desc}</p>
                        {templateConfig.emailTemplate === template.id && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Preferences */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-3">
                    模板偏好设置
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">模板轮换</h3>
                        <p className="text-sm text-gray-600">在选中的模板类型中随机轮换</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={templateConfig.templateData?.enableRotation || false}
                        onChange={(e) => setTemplateConfig(prev => ({
                          ...prev,
                          templateData: { ...prev.templateData, enableRotation: e.target.checked }
                        }))}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">HTML格式</h3>
                        <p className="text-sm text-gray-600">使用富文本HTML邮件格式</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={templateConfig.templateData?.useHtmlFormat !== false}
                        onChange={(e) => setTemplateConfig(prev => ({
                          ...prev,
                          templateData: { ...prev.templateData, useHtmlFormat: e.target.checked }
                        }))}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Update Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={updateTemplateConfig}
                    disabled={isSaving}
                    className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? '更新中...' : '更新模板配置'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Model Settings */}
          {activeTab === 'ai' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <ServerIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">AI模型设置</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {ollamaStatus?.connected && ollamaStatus?.qwenAvailable ? (
                        <CheckCircleIcon className="h-8 w-8 text-success-500" />
                      ) : (
                        <XCircleIcon className="h-8 w-8 text-error-500" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-primary-900">Ollama服务状态</h3>
                      <p className="text-sm text-primary-600">
                        {ollamaStatus?.connected && ollamaStatus?.qwenAvailable 
                          ? 'Qwen2.5:7b模型已就绪，可以使用AI功能'
                          : 'Ollama服务未连接或Qwen2.5:7b模型未安装'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkOllamaStatus}
                    className="btn-secondary text-sm"
                  >
                    刷新状态
                  </button>
                </div>

                {/* AI Model Configuration */}
                <div>
                  <label htmlFor="ai-model" className="block text-sm font-medium text-primary-700 mb-2">
                    AI模型选择
                  </label>
                  <select
                    id="ai-model"
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="input-field"
                  >
                    <option value="qwen2.5:0.5b">Qwen2.5:0.5b (快速)</option>
                    <option value="qwen2.5:1.5b">Qwen2.5:1.5b (平衡)</option>
                    <option value="qwen2.5:3b">Qwen2.5:3b (质量)</option>
                    <option value="qwen2.5:7b">Qwen2.5:7b (高质量)</option>
                    <option value="llama3.2">Llama3.2 (通用)</option>
                  </select>
                </div>

                {/* AI Parameters */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-primary-700 mb-2">
                      创造性 (Temperature): {aiConfig.temperature}
                    </label>
                    <input
                      type="range"
                      id="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiConfig.temperature}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>保守</span>
                      <span>创新</span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="max-tokens" className="block text-sm font-medium text-primary-700 mb-2">
                      最大输出长度
                    </label>
                    <select
                      id="max-tokens"
                      value={aiConfig.maxTokens}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="input-field"
                    >
                      <option value="1000">1000 (简短)</option>
                      <option value="2000">2000 (中等)</option>
                      <option value="3000">3000 (详细)</option>
                      <option value="4000">4000 (完整)</option>
                    </select>
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <label htmlFor="system-prompt" className="block text-sm font-medium text-primary-700 mb-2">
                    系统提示词 (可选)
                  </label>
                  <textarea
                    id="system-prompt"
                    value={aiConfig.systemPrompt}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="input-field"
                    placeholder="自定义AI的行为和风格..."
                  />
                </div>

                {/* Available Models */}
                {ollamaStatus?.models && (
                  <div>
                    <h4 className="font-medium text-primary-900 mb-3">已安装的模型</h4>
                    <div className="space-y-2">
                      {ollamaStatus.models.map((model, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-primary-200 rounded-lg">
                          <span className="font-mono text-sm text-primary-700">{model}</span>
                          {aiConfig.model === model && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                              当前使用
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={updateAiConfig}
                    disabled={isSaving}
                    className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {isSaving ? '更新中...' : '更新AI配置'}
                  </button>
                </div>

                <div className="bg-warning-50 p-4 rounded-lg">
                  <h4 className="font-medium text-warning-900 mb-2">配置说明</h4>
                  <div className="text-sm text-warning-700 space-y-2">
                    <p>1. 确保您的系统已安装Ollama服务</p>
                    <p>2. 运行命令下载模型：<code className="bg-warning-100 px-2 py-1 rounded">ollama pull qwen2.5:0.5b</code></p>
                    <p>3. 确保Ollama服务运行在端口11434</p>
                    <p>4. Temperature值越高，AI回复越有创意但可能不够准确</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Settings */}
          {activeTab === 'analytics' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <PresentationChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">数据分析设置</h2>
              </div>

              <div className="space-y-6">
                {/* Analytics Dashboard */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-900">总发送数</p>
                        <p className="text-2xl font-bold text-blue-900">1,234</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-900">成功发送</p>
                        <p className="text-2xl font-bold text-green-900">1,187</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-900">打开率</p>
                        <p className="text-2xl font-bold text-yellow-900">24.3%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TargetIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-900">回复率</p>
                        <p className="text-2xl font-bold text-purple-900">5.8%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">数据收集偏好</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">邮件打开追踪</h4>
                        <p className="text-sm text-gray-600">追踪收件人是否打开邮件</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">链接点击追踪</h4>
                        <p className="text-sm text-gray-600">追踪邮件中链接的点击情况</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">回复分析</h4>
                        <p className="text-sm text-gray-600">自动分析回复内容的情感和意向</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">性能报告</h4>
                        <p className="text-sm text-gray-600">定期生成营销活动效果报告</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">数据导出</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-secondary text-sm">导出CSV</button>
                    <button className="btn-secondary text-sm">导出Excel</button>
                    <button className="btn-secondary text-sm">生成PDF报告</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <BellIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">通知设置</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary-900">邮件活动完成通知</h4>
                      <p className="text-sm text-primary-600">当营销活动发送完成时接收通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary-900">联系人导入完成通知</h4>
                      <p className="text-sm text-primary-600">批量导入联系人完成时接收通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary-900">系统错误提醒</h4>
                      <p className="text-sm text-primary-600">当系统出现错误时立即通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary-900">每日数据摘要</h4>
                      <p className="text-sm text-primary-600">每天发送营销数据摘要邮件</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-primary-200">
                  <button className="btn-primary">保存通知设置</button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">安全设置</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-primary-900 mb-4">数据保护</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-primary-800">自动数据备份</h5>
                        <p className="text-sm text-primary-600">每天自动备份系统数据</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-primary-800">邮件数据加密存储</h5>
                        <p className="text-sm text-primary-600">使用加密方式存储敏感邮件数据</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-primary-900 mb-4">访问控制</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="session-timeout" className="block text-sm font-medium text-primary-700 mb-2">
                        会话超时时间（小时）
                      </label>
                      <select id="session-timeout" className="input-field w-32">
                        <option value="1">1小时</option>
                        <option value="4">4小时</option>
                        <option value="8" selected>8小时</option>
                        <option value="24">24小时</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-warning-50 p-4 rounded-lg">
                  <h4 className="font-medium text-warning-900 mb-2">数据清理</h4>
                  <p className="text-sm text-warning-700 mb-3">
                    定期清理过期的邮件日志和统计数据，释放存储空间
                  </p>
                  <button className="btn-secondary text-sm">
                    立即清理过期数据
                  </button>
                </div>

                <div className="pt-4 border-t border-primary-200">
                  <button className="btn-primary">保存安全设置</button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="flex items-center mb-6">
                <UserIcon className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-primary-900">个人资料</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-10 w-10 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <button className="btn-secondary text-sm">上传头像</button>
                    <p className="text-xs text-primary-500 mt-1">支持JPG, PNG格式，最大2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium text-primary-700 mb-2">
                      姓名
                    </label>
                    <input
                      type="text"
                      id="profile-name"
                      defaultValue="管理员"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="block text-sm font-medium text-primary-700 mb-2">
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      id="profile-email"
                      defaultValue="admin@company.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-phone" className="block text-sm font-medium text-primary-700 mb-2">
                      电话号码
                    </label>
                    <input
                      type="tel"
                      id="profile-phone"
                      className="input-field"
                      placeholder="+86 138-0000-0000"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-company" className="block text-sm font-medium text-primary-700 mb-2">
                      公司名称
                    </label>
                    <input
                      type="text"
                      id="profile-company"
                      className="input-field"
                      placeholder="您的公司名称"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-bio" className="block text-sm font-medium text-primary-700 mb-2">
                    个人简介
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={4}
                    className="input-field resize-none"
                    placeholder="简单介绍一下您自己..."
                  />
                </div>

                <div className="pt-4 border-t border-primary-200">
                  <button className="btn-primary">保存个人资料</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Update Section */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center text-amber-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">您有未保存的配置更改</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    loadAllConfigurations()
                    setHasUnsavedChanges(false)
                  }}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  重置更改
                </button>
                <button
                  onClick={updateAllConfigurations}
                  disabled={isSaving}
                  className={`btn-primary ${isSaving ? 'opacity-50' : ''}`}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      更新中...
                    </div>
                  ) : (
                    '保存所有配置'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}