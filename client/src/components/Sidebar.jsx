import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  HomeIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PencilSquareIcon,
  GlobeAltIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  PresentationChartBarIcon,
  CpuChipIcon,
  IdentificationIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, highlight: true, badge: 'START' },
  { name: 'AI Agent', href: '/langgraph-agent', icon: CpuChipIcon },
  { name: 'Smart Workflow Platform', href: '/dashboard', icon: PresentationChartBarIcon },
  { name: 'Prospects', href: '/prospects', icon: IdentificationIcon },
  { name: 'Email Campaign', href: '/campaigns', icon: EnvelopeIcon },
  { name: 'Email Editor', href: '/professional-email-editor', icon: PencilSquareIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Research', href: '/website-analyzer', icon: GlobeAltIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

export default function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div className="w-64 bg-white border-r border-primary-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-primary-200">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">WorkflowAI</h1>
            <p className="text-sm text-gray-500">Smart Email Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer relative ${
                isActive ? 'text-black font-medium bg-orange-50' : 'text-black hover:bg-gray-50'
              } ${item.highlight ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400 shadow-sm' : ''}`
            }
            onMouseEnter={() => setHoveredItem(item.name)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${item.highlight ? 'text-orange-600' : 'text-gray-700'}`} />
                <span className={`truncate ${item.highlight ? 'text-orange-800 font-semibold' : 'text-gray-900'}`}>
                  {item.name}
                  {item.highlight && <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">{item.badge || 'NEW'}</span>}
                </span>
                {/* Active indicator - small orange circle on the right */}
                {isActive && !item.highlight && (
                  <div className="absolute right-4 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-primary-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-orange-600">AI</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Qwen2.5 Model</p>
            <p className="text-xs text-gray-500">Local Deployment</p>
          </div>
          <div className="ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}