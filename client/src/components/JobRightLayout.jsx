import React, { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  ChevronDownIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

// 完全模仿JobRight.ai的工作卡片
function JobCard({ prospect, index }) {
  const getMatchScore = (confidence) => Math.round(confidence || 0)
  const getMatchLevel = (confidence) => {
    if (confidence >= 80) return { label: 'GOOD MATCH', color: '#22c55e' }
    if (confidence >= 60) return { label: 'FAIR MATCH', color: '#06b6d4' }
    return { label: 'FAIR MATCH', color: '#06b6d4' }
  }

  const matchInfo = getMatchLevel(prospect.confidence)
  const matchScore = getMatchScore(prospect.confidence)
  
  // 模拟不同的logo背景颜色
  const logoColors = ['#8b5cf6', '#f97316', '#3b82f6', '#10b981']
  const logoColor = logoColors[index % logoColors.length]
  
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
      {/* 顶部时间和菜单 */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span>32 minutes ago</span>
          <span>Be an early applicant</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      
      <div className="flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex items-start space-x-4 flex-1">
          {/* Logo */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
            style={{ backgroundColor: logoColor }}
          >
            {prospect.company ? prospect.company.charAt(0).toUpperCase() : 'S'}
          </div>
          
          <div className="flex-1">
            {/* 职位标题 */}
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {prospect.position || 'Full Stack Engineer, Payments and Risk'}
            </h3>
            
            {/* 公司信息 */}
            <div className="text-gray-600 mb-4">
              <span className="font-medium">{prospect.company || 'Stripe'}</span>
              <span className="text-gray-400 mx-2">/</span>
              <span>Finance • Fintech • Late Stage</span>
            </div>
            
            {/* 工作详情网格 */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>United States</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Full-time</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582z" />
                  <path fillRule="evenodd" d="M11 4a4 4 0 104 4v1a2 2 0 102 2v4a2 2 0 11-2 2h-4a8 8 0 01-8-8 4 4 0 014-4z" clipRule="evenodd" />
                </svg>
                <span>$142K/yr - $212K/yr</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Remote</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2z" clipRule="evenodd" />
                </svg>
                <span>Entry, Mid Level</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>2+ years exp</span>
              </div>
            </div>
            
            {/* 底部信息和按钮 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Less than 25 applicants</span>
              
              <div className="flex items-center space-x-3">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <HeartIcon className="w-5 h-5 text-gray-400" />
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  <span className="text-sm font-medium">ASK ORION</span>
                </button>
                
                <button className="px-6 py-3 bg-green-400 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors">
                  APPLY NOW
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧: 匹配度卡片 */}
        <div className="ml-6">
          <div className="bg-gray-800 text-white p-4 rounded-2xl w-32">
            <div className="text-center">
              {/* 圆形进度条 */}
              <div className="relative w-16 h-16 mx-auto mb-3">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={matchInfo.color}
                    strokeWidth="2"
                    strokeDasharray={`${matchScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{matchScore}%</span>
                </div>
              </div>
              
              <div className="text-sm font-semibold mb-3">
                {matchInfo.label}
              </div>
              
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>Comp. & Benefits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>✓</span>
                  <span>HR Sponsor Likely</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主布局组件
export default function JobRightLayout({ prospects }) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* 左侧深色导航栏 */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Jobs</h2>
            </div>
          </div>
          
          <nav className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-green-400 rounded-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-medium text-white">Resume</span>
              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <UserGroupIcon className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold">AI</span>
              </div>
              <span className="font-medium">Agent</span>
              <div className="ml-auto bg-green-400 text-xs px-2 py-0.5 rounded text-white font-bold">NEW</div>
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6 space-y-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-gray-800 font-medium mb-2">Refer & Earn</h3>
            <p className="text-gray-600 text-sm">Invite friends or share on LinkedIn to earn extra rewards!</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <span className="font-medium">Download App</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <span className="font-medium">Feedback</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-300 hover:bg-gray-700 rounded-lg">
              <span className="font-medium">Settings</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 bg-white">
        {/* 顶部过滤栏 */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Full Stack Engineer</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Within US</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Full-time</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Onsite</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Remote</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Hybrid</span>
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-gray-600 text-sm">Recommended</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Intern/New Grad</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Entry Level</span>
            <button className="px-4 py-2 bg-green-400 text-white rounded-lg font-medium text-sm">
              Edit Filters
            </button>
          </div>
        </div>
        
        {/* 工作列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {prospects.slice(0, 10).map((prospect, index) => (
              <JobCard key={prospect.id || index} prospect={prospect} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}