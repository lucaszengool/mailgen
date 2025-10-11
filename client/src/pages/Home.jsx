import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CpuChipIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function Home({ onNavigate }) {
  // Function to handle navigation without router
  const handleNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (window.location.pathname !== path) {
      window.location.href = path;
    }
  };

  const ActionCard = ({ icon: Icon, title, description, buttonText, onClick, color = 'green' }) => {
    const colorClasses = {
      green: 'hover:border-green-500 group-hover:text-green-500',
      orange: 'hover:border-green-500 group-hover:text-green-500',
      blue: 'hover:border-green-500 group-hover:text-green-500',
      purple: 'hover:border-green-500 group-hover:text-green-500'
    }

    return (
      <div className={`bg-white border-2 border-gray-200 rounded-2xl p-5 transition-all duration-200 ${colorClasses[color]} group`}>
        <div className="flex items-start space-x-4 mb-3">
          <div className={`p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors duration-200`}>
            <Icon className={`h-6 w-6 text-green-600`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
          </div>
        </div>
        <button
          onClick={onClick}
          className="px-6 py-2.5 border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 font-semibold rounded-lg transition-all duration-200"
        >
          {buttonText}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-br from-green-50 via-white to-gray-50 overflow-auto">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-1 bg-green-200 rounded-full opacity-60"></div>
        <div className="absolute top-32 left-32 w-48 h-1 bg-gray-200 rounded-full opacity-40"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-green-300 rounded-full opacity-60"></div>
        <div className="absolute top-60 left-1/4 w-20 h-1 bg-green-300 rounded-full opacity-50"></div>
        <div className="absolute top-72 right-1/3 w-40 h-1 bg-gray-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-40 left-20 w-24 h-1 bg-green-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-32 right-40 w-3 h-3 bg-gray-400 rounded-full opacity-40"></div>
        <div className="absolute top-1/2 right-20 w-36 h-1 bg-green-200 rounded-full opacity-60 transform rotate-45"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Hero Section */}
        <div className="text-center mb-5 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-green-500 text-white px-6 py-2 rounded-full mb-3 shadow-lg">
            <SparklesIcon className="h-5 w-5" />
            <span className="font-semibold">Welcome</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Get started with <span className="text-green-600">EmailAgent</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            AI-powered email outreach platform for modern marketing teams
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-3 animate-slide-up mb-4">
          {/* AI Agent Workflow */}
          <ActionCard
            icon={CpuChipIcon}
            title="AI Agent Workflow"
            description="Let AI agents handle your entire outreach workflow - from research and lead discovery to personalized email generation and campaign management."
            buttonText="Launch"
            onClick={() => handleNavigation('workflow')}
          />

          {/* Find Prospects */}
          <ActionCard
            icon={MagnifyingGlassIcon}
            title="Find leads and email addresses"
            description="Use our powerful lead database and AI-powered search to quickly find qualified prospects with verified email addresses."
            buttonText="Start"
            onClick={() => handleNavigation('prospects')}
          />

          {/* Email Campaign */}
          <ActionCard
            icon={EnvelopeIcon}
            title="Send cold email campaigns"
            description="Connect your email account to create, personalize, schedule, and send targeted campaigns at scale with smart automation."
            buttonText="Start"
            onClick={() => handleNavigation('emails')}
          />

          {/* Email Editor */}
          <ActionCard
            icon={PencilSquareIcon}
            title="Design and personalize emails"
            description="Create stunning email templates with our drag-and-drop editor. Use AI to generate personalized content that resonates with your audience."
            buttonText="Open"
            onClick={() => handleNavigation('email_editor')}
          />

          {/* Analytics */}
          <ActionCard
            icon={ChartBarIcon}
            title="Track performance and analytics"
            description="Monitor email opens, clicks, replies, and conversions with real-time analytics. Get insights to optimize your campaigns."
            buttonText="View"
            onClick={() => handleNavigation('analytics')}
          />

          {/* Research */}
          <ActionCard
            icon={DocumentMagnifyingGlassIcon}
            title="Market research and insights"
            description="AI-powered market research to understand your target audience, analyze competitors, and discover new opportunities."
            buttonText="Start"
            onClick={() => handleNavigation('research')}
          />
        </div>

        {/* Quick Links */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleNavigation('settings')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-all duration-200"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => handleNavigation('prospects')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-all duration-200"
            >
              <UserGroupIcon className="h-4 w-4" />
              <span>Import Contacts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
