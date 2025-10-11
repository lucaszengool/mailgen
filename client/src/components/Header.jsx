import { useState, useEffect } from 'react'
import { BellIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

export default function Header() {
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // 检查Ollama状态
    checkOllamaStatus()
    
    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('/api/ollama/status')
      const data = await response.json()
      setOllamaStatus(data.data)
    } catch (error) {
      setOllamaStatus({ connected: false, qwenAvailable: false })
    }
  }

  const formatTime = (date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <header className="bg-white border-b border-primary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-primary-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-primary-300 rounded-lg leading-5 bg-white placeholder-primary-500 focus:outline-none focus:placeholder-primary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="搜索营销活动、联系人..."
            />
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-6">
          {/* Ollama Status */}
          <div className="flex items-center space-x-2">
            {ollamaStatus?.connected && ollamaStatus?.qwenAvailable ? (
              <>
                <CheckCircleIcon className="h-5 w-5 text-success-500" />
                <span className="text-sm text-primary-600">AI模型已连接</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 text-error-500" />
                <span className="text-sm text-primary-600">AI模型未连接</span>
              </>
            )}
          </div>

          {/* Current Time */}
          <div className="text-sm text-primary-500">
            {formatTime(currentTime)}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-primary-400 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 ring-2 ring-white" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center space-x-3 text-sm rounded-lg p-2 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-primary-900">管理员</div>
                <div className="text-xs text-primary-500">admin@company.com</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}