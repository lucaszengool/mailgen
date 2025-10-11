import { useState } from 'react'
import { 
  XMarkIcon,
  PlayIcon,
  SparklesIcon,
  EnvelopeIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import SMTPConfigWizard from './SMTPConfigWizard'

const QuickStartModal = ({ isOpen, onClose, onStartAutomation, onNavigateToMonitoring }) => {
  const [showSMTPWizard, setShowSMTPWizard] = useState(false)
  if (!isOpen) return null

  const steps = [
    {
      icon: SparklesIcon,
      title: '网站分析',
      description: 'AI智能分析目标网站，识别潜在客户和商业机会',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: EnvelopeIcon,
      title: '邮件生成',
      description: '基于分析结果自动生成个性化的营销邮件内容',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: EyeIcon,
      title: '内容预览',
      description: '点击任何邮件查看详细内容，编辑并配置发送设置',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: PaperAirplaneIcon,
      title: '一键发送',
      description: '通过引导式向导配置SMTP，安全快速发送邮件',
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🚀 快速开始</h2>
              <p className="text-gray-600 mt-1">了解AI邮件营销助手的工作流程</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${step.color} flex-shrink-0`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-gray-500">步骤 {index + 1}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 重要提示</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>系统将自动分析目标网站并生成邮件，整个过程可能需要几分钟</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <span>生成的邮件可以自由编辑，确保内容符合您的需求</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>发送前请确保配置正确的SMTP邮箱设置</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>所有邮件发送都会有实时状态跟踪</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center">
          <label className="flex items-center text-sm text-gray-600">
            <input 
              type="checkbox" 
              className="mr-2" 
              onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem('hideQuickStart', 'true')
                } else {
                  localStorage.removeItem('hideQuickStart')
                }
              }}
            />
            不再显示此提示
          </label>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSMTPWizard(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <CogIcon className="h-4 w-4" />
              <span>邮件配置向导</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              我已了解
            </button>
            <button
              onClick={() => {
                onStartAutomation()
                onClose()
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlayIcon className="h-4 w-4" />
              <span>立即开始</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* SMTP Configuration Wizard */}
      <SMTPConfigWizard
        isOpen={showSMTPWizard}
        onClose={() => setShowSMTPWizard(false)}
        onComplete={(config) => {
          setShowSMTPWizard(false)
          console.log('SMTP配置完成:', config)
          
          // 保存SMTP配置到localStorage
          localStorage.setItem('smtpConfig', JSON.stringify(config))
          
          // 关闭快速启动模态框
          onClose()
          
          // 自动跳转到邮件监控面板
          if (onNavigateToMonitoring) {
            console.log('自动跳转到邮件监控面板...')
            onNavigateToMonitoring()
          }
        }}
      />
    </div>
  )
}

export default QuickStartModal