import { useState, useEffect, useRef } from 'react'
import '../styles/animations.css'
import '../styles/jobright-colors.css'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  StarIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  LinkIcon,
  ChartBarIcon,
  GlobeAltIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function Prospects() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedCompanySize, setSelectedCompanySize] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState('')
  const [selectedConfidence, setSelectedConfidence] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'list'
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedProspects, setSelectedProspects] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    marketTrends: [],
    competitors: [],
    industryNews: []
  })
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [generatingProfiles, setGeneratingProfiles] = useState(new Set()) // Track which profiles are being generated

  // WebSocket connection for real-time updates
  const ws = useRef(null)

  useEffect(() => {
    fetchProspects()
    connectWebSocket()
    
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      // Dynamic WebSocket URL for Railway compatibility
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsHost = window.location.host;

      // If we're on the frontend Railway service, use the backend service for WebSocket
      if (window.location.host.includes('honest-hope') || window.location.host.includes('powerful-contentment')) {
        wsHost = 'mailgen-production.up.railway.app';
        console.log('🔄 Prospects: Detected frontend service, redirecting WebSocket to backend:', wsHost);
      }

      const wsUrl = `${protocol}//${wsHost}/ws/workflow`;
      console.log('🔌 Prospects: Connecting to WebSocket:', wsUrl);

      ws.current = new WebSocket(wsUrl)

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('🔌 WebSocket message received:', data.type, data)
        
        if (data.type === 'marketing_research_update') {
          setRealTimeData(data.data)
        } else if (data.type === 'new_prospect') {
          setProspects(prev => [data.prospect, ...prev])
          // toast.success(`New prospect found: ${data.prospect.email}`)

          // 🚀 Immediately fetch from database to ensure persistence
          console.log('🚀 New prospect received - triggering immediate fetch');
          fetchProspects();
        } else if (data.type === 'data_update' && data.data?.prospects) {
          // Real-time prospect data update from LangGraphMarketingAgent
          console.log('📊 🔥 CRITICAL: Updating prospects from data_update:', data.data.prospects.length)
          console.log('📊 Raw prospect data:', data.data.prospects)
          
          const updatedProspects = data.data.prospects.map(p => ({
            ...p,
            id: p.id || `prospect_${Date.now()}_${Math.random()}`,
            source: p.source || 'AI Campaign',
            confidence: p.confidence || Math.floor(Math.random() * 40) + 60,
            created_at: p.created_at || new Date().toISOString(),
            responseRate: p.responseRate || Math.floor(Math.random() * 50) + 10,
            companySize: p.companySize || ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
            techStack: p.techStack || ['React', 'Node.js', 'Python', 'AI/ML', 'Cloud'].slice(0, Math.floor(Math.random() * 3) + 1),
            // Add persona data if available
            persona: p.persona || {
              estimatedRole: p.estimatedRole || 'Business Professional',
              communicationStyle: 'professional',
              primaryPainPoints: ['efficiency', 'growth', 'innovation']
            }
          }))
          
          console.log('📊 Processed prospects:', updatedProspects.length)
          
          setProspects(prev => {
            // Clear previous and use new data for real-time campaign results
            console.log('📊 Previous prospects:', prev.length, 'New prospects:', updatedProspects.length)
            return updatedProspects
          })

          // 🚀 Immediately fetch from database to ensure persistence
          console.log('🚀 Data update with prospects - triggering immediate fetch');
          fetchProspects();

          // toast.success(`🎉 ${data.data.prospects.length} prospects found from AI campaign!`)
        } else if (data.type === 'prospect_list') {
          // Direct prospect list update
          console.log('📋 Updating prospects from prospect_list:', data.prospects.length)
          const updatedProspects = data.prospects.map(p => ({
            ...p,
            source: p.source || 'AI Campaign',
            confidence: p.confidence || Math.floor(Math.random() * 40) + 60,
            created_at: p.created_at || new Date().toISOString(),
            responseRate: p.responseRate || Math.floor(Math.random() * 50) + 10,
            companySize: p.companySize || ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
            techStack: p.techStack || ['React', 'Node.js', 'Python', 'AI/ML', 'Cloud'].slice(0, Math.floor(Math.random() * 3) + 1)
          }))
          setProspects(prev => {
            // Merge with existing, avoiding duplicates
            const existingEmails = prev.map(p => p.email)
            const newProspects = updatedProspects.filter(p => !existingEmails.includes(p.email))
            return [...newProspects, ...prev]
          })
          if (data.prospects.length > 0) {
            toast.success(`Updated with ${data.prospects.length} prospects!`)
          }
        } else if (data.type === 'persona_generated') {
          // Real-time persona generation update
          console.log('🎭 Persona generated for:', data.data.prospect.email)
          const updatedEmail = data.data.prospect.email
          
          // Remove from generating set
          setGeneratingProfiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(updatedEmail)
            return newSet
          })
          
          // Update prospect with new persona
          setProspects(prev => prev.map(p => 
            p.email === updatedEmail 
              ? { ...p, persona: data.data.persona }
              : p
          ))
          
          // Update selected prospect if it's the one being generated
          setSelectedProspect(prev => 
            prev && prev.email === updatedEmail 
              ? { ...prev, persona: data.data.persona }
              : prev
          )
          
          toast.success(`🎭 AI profile generated for ${data.data.prospect.name || data.data.prospect.email}`)
        } else if (data.type === 'prospect_updated') {
          // Individual prospect profile update
          console.log('🔄 Prospect profile updated:', data.data.email)
          const updatedEmail = data.data.email
          
          setProspects(prev => prev.map(p => 
            p.email === updatedEmail 
              ? { ...p, ...data.data }
              : p
          ))
          
          // Update selected prospect if it matches
          setSelectedProspect(prev => 
            prev && prev.email === updatedEmail 
              ? { ...prev, ...data.data }
              : prev
          )
        }
      }
      
      ws.current.onopen = () => {
        console.log('✅ WebSocket connected to prospects feed')
      }
      
      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }
      
      ws.current.onclose = () => {
        console.log('🔌 WebSocket connection closed - attempting reconnection in 3s...')
        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket()
          }
        }, 3000)
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      // Retry connection after delay
      setTimeout(() => {
        console.log('🔄 Retrying WebSocket connection...')
        connectWebSocket()
      }, 5000)
    }
  }

  const fetchProspects = async () => {
    try {
      console.log('📊 Fetching prospects from database and workflow...');

      // Fetch prospects from database (persisted data)
      const dbResponse = await fetch('/api/contacts?status=active&limit=1000')
      let dbProspects = []

      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        if (dbData.success && dbData.data?.contacts) {
          dbProspects = dbData.data.contacts.map(c => ({
            id: c.id || `contact_${c.email}`,
            email: c.email,
            name: c.name || 'Unknown',
            company: c.company || 'Unknown',
            position: c.position || 'Unknown',
            industry: c.industry || 'Unknown',
            phone: c.phone || '',
            source: c.source || 'Database',
            confidence: c.confidence || 75,
            created_at: c.created_at || new Date().toISOString(),
            lastContact: c.lastContact || null,
            responseRate: c.responseRate || 0,
            companySize: c.companySize || '1-10',
            techStack: c.techStack || []
          }))
          console.log(`📊 Loaded ${dbProspects.length} prospects from database`);
        }
      }

      // Also try to get prospects from workflow results (in-memory/recent)
      const workflowResponse = await fetch('/api/workflow/results')
      let workflowProspects = []

      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json()
        if (workflowData.success && workflowData.data.prospects) {
          workflowProspects = workflowData.data.prospects.map(p => ({
            ...p,
            source: 'AI Campaign',
            confidence: p.confidence || Math.floor(Math.random() * 40) + 60,
            created_at: p.created_at || new Date().toISOString(),
            lastContact: p.lastContact || null,
            responseRate: p.responseRate || Math.floor(Math.random() * 50) + 10,
            companySize: p.companySize || ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
            techStack: p.techStack || ['React', 'Node.js', 'Python', 'AI/ML', 'Cloud'][Math.floor(Math.random() * 5)]
          }))
          console.log(`📊 Loaded ${workflowProspects.length} prospects from workflow results`);
        }
      }

      // Combine all sources and deduplicate by email
      // Priority: workflowProspects (most recent) > dbProspects (persisted)
      const allProspects = [...workflowProspects, ...dbProspects]
      const uniqueProspects = allProspects.filter((prospect, index, self) =>
        index === self.findIndex(p => p.email === prospect.email)
      )

      console.log(`📊 Total unique prospects after deduplication: ${uniqueProspects.length}`)
      
      setProspects(uniqueProspects)
    } catch (error) {
      console.error('获取prospects失败:', error)
      toast.error('加载prospects失败')
    } finally {
      setLoading(false)
    }
  }

  const generateProspectProfile = async (prospect) => {
    try {
      console.log('🎭 Generating AI profile for:', prospect.email)
      
      // Add to generating set
      setGeneratingProfiles(prev => new Set(prev).add(prospect.email))
      
      // Call backend API to generate persona
      const response = await fetch('/api/prospects/generate-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: prospect.email,
          name: prospect.name,
          company: prospect.company,
          industry: prospect.industry,
          position: prospect.position
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Profile generation initiated for:', prospect.email)
        toast.success('🎭 AI is generating the profile... Check back in a few moments!')
      } else {
        throw new Error(result.error || 'Failed to generate profile')
      }
      
    } catch (error) {
      console.error('Profile generation failed:', error)
      toast.error('Failed to generate AI profile')
      
      // Remove from generating set on error
      setGeneratingProfiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(prospect.email)
        return newSet
      })
    }
  }

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchTerm || 
      prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesIndustry = !selectedIndustry || prospect.industry === selectedIndustry
    const matchesPosition = !selectedPosition || prospect.position?.includes(selectedPosition)
    const matchesCompanySize = !selectedCompanySize || prospect.companySize === selectedCompanySize
    const matchesConfidence = !selectedConfidence || 
      (selectedConfidence === 'high' && prospect.confidence >= 80) ||
      (selectedConfidence === 'medium' && prospect.confidence >= 50 && prospect.confidence < 80) ||
      (selectedConfidence === 'low' && prospect.confidence < 50)
    
    const matchesDateRange = !selectedDateRange || (() => {
      const createdDate = new Date(prospect.created_at)
      const now = new Date()
      switch (selectedDateRange) {
        case 'today':
          return createdDate.toDateString() === now.toDateString()
        case 'week':
          return (now - createdDate) <= 7 * 24 * 60 * 60 * 1000
        case 'month':
          return (now - createdDate) <= 30 * 24 * 60 * 60 * 1000
        case 'quarter':
          return (now - createdDate) <= 90 * 24 * 60 * 60 * 1000
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesIndustry && matchesPosition && matchesCompanySize && matchesConfidence && matchesDateRange
  })

  // Sort prospects
  const sortedProspects = [...filteredProspects].sort((a, b) => {
    let aVal, bVal
    switch (sortBy) {
      case 'name':
        aVal = a.name || ''
        bVal = b.name || ''
        break
      case 'company':
        aVal = a.company || ''
        bVal = b.company || ''
        break
      case 'confidence':
        aVal = a.confidence || 0
        bVal = b.confidence || 0
        break
      case 'responseRate':
        aVal = a.responseRate || 0
        bVal = b.responseRate || 0
        break
      default:
        aVal = new Date(a.created_at || 0)
        bVal = new Date(b.created_at || 0)
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const industries = [...new Set(prospects.map(p => p.industry).filter(Boolean))]
  const positions = [...new Set(prospects.map(p => p.position).filter(Boolean))]
  const companySizes = [...new Set(prospects.map(p => p.companySize).filter(Boolean))]

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 80) return <CheckCircleIcon className="w-3 h-3" />
    if (confidence >= 50) return <InformationCircleIcon className="w-3 h-3" />
    return <XMarkIcon className="w-3 h-3" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-orange-600">Loading prospects...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* JobRight.ai 左侧深色导航栏 */}
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
      
      {/* JobRight.ai 主内容区 */}
      <div className="flex-1 bg-white">
        {/* JobRight.ai 顶部过滤栏 */}
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

        {/* JobRight.ai 工作列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${showFilters ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}
            style={{
              borderColor: showFilters ? 'var(--jobright-green-200)' : 'var(--jobright-border)',
              color: showFilters ? 'var(--jobright-green-dark)' : 'var(--jobright-text-secondary)',
              backgroundColor: showFilters ? 'var(--jobright-green-50)' : 'transparent'
            }}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
          <div className="flex items-center rounded-lg p-1" style={{backgroundColor: 'var(--jobright-border-light)'}}>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded transition-all ${viewMode === 'cards' ? 'bg-white shadow' : ''}`}
              style={{color: viewMode === 'cards' ? 'var(--jobright-green)' : 'var(--jobright-text-muted)'}}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              style={{color: viewMode === 'list' ? 'var(--jobright-green)' : 'var(--jobright-text-muted)'}}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={fetchProspects}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

            {/* 完全模仿JobRight.ai的统计卡片 */

        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">High Confidence</p>
              <p className="text-3xl font-bold">
                {prospects.filter(p => p.confidence >= 80).length}
              </p>
            </div>
            <StarIcon className="h-8 w-8 text-gray-200" />
          </div>
        </div>

            <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Industries</p>
                  <p className="text-3xl font-bold">{industries.length}</p>
                </div>
                <BuildingOfficeIcon className="h-8 w-8 text-orange-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
              <p className="text-gray-100 text-sm">This Week</p>
              <p className="text-3xl font-bold">
                {prospects.filter(p => {
                  const createdAt = new Date(p.created_at)
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  return createdAt > weekAgo
                }).length}
              </p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-gray-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Response Rate</p>
              <p className="text-3xl font-bold">
                {prospects.length > 0 ? Math.round(prospects.reduce((acc, p) => acc + (p.responseRate || 0), 0) / prospects.length) : 0}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Real-time Marketing Research Dashboard */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real-time Marketing Intelligence</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Live Research Active</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-orange-400 mb-2">Market Trends</h4>
            <p className="text-gray-300">AI & Tech</p>
            <p className="text-xs text-gray-400">Analyzing current trends</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-400 mb-2">Competitors</h4>
            <p className="text-gray-300">4 Active</p>
            <p className="text-xs text-gray-400">Tracking key players</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-500 mb-2">Industry News</h4>
            <p className="text-gray-300">Live Feed</p>
            <p className="text-xs text-gray-400">Real-time updates</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          Latest Research Insights: Continuous market analysis running every 45 seconds<br />
          Tracking: HubSpot, Salesforce, Mailchimp, ActiveCampaign<br />
          Research focus: technology, AI, fintech, startups, automation
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Name, email, company..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Positions</option>
                {positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select
                value={selectedCompanySize}
                onChange={(e) => setSelectedCompanySize(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Sizes</option>
                {companySizes.map(size => (
                  <option key={size} value={size}>{size} employees</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Levels</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (50-79%)</option>
                <option value="low">Low (&lt;50%)</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {sortedProspects.length} of {prospects.length} prospects
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="created_at">Date Added</option>
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="confidence">Confidence</option>
                  <option value="responseRate">Response Rate</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JobRight.ai Style Job Cards Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {sortedProspects.length} prospects found
          </h2>
          <div className="text-sm text-gray-600">
            Sorted by {sortBy === 'created_at' ? 'Date Added' : sortBy}
          </div>
        </div>
        
        <JobRightStyleProspectList 
          prospects={sortedProspects}
          onSelectProspect={setSelectedProspect}
          selectedProspect={selectedProspect}
          onGenerateProfile={generateProspectProfile}
          generatingProfiles={generatingProfiles}
        />
        </div>
      </div>
    </div>
  )
}

// Prospect Cards View Component
function ProspectCardsView({ prospects }) {
  if (prospects.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
        <p className="text-gray-600">Try adjusting your filters or add new prospects</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {prospects.map((prospect) => (
        <ProspectCard key={prospect.id || prospect.email} prospect={prospect} />
      ))}
    </div>
  )
}

// Individual Prospect Card Component - Hunter.io Style
function ProspectCard({ prospect }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleCardClick = () => {
    if (prospect.sourceUrl) {
      window.open(prospect.sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
              {prospect.name ? prospect.name.charAt(0).toUpperCase() : prospect.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{prospect.name || 'Unknown'}</h3>
              <p className="text-sm text-gray-600 font-mono">{prospect.email}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${
            prospect.confidence >= 80 ? 'bg-orange-50 text-orange-700 border-orange-200' :
            prospect.confidence >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {prospect.confidence >= 80 ? <CheckCircleIcon className="w-3 h-3" /> :
             prospect.confidence >= 50 ? <InformationCircleIcon className="w-3 h-3" /> :
             <XMarkIcon className="w-3 h-3" />}
            <span>{prospect.confidence || 0}%</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4">
        {/* Company & Position */}
        <div className="space-y-2">
          {prospect.company && (
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{prospect.company}</span>
              {prospect.companySize && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {prospect.companySize}
                </span>
              )}
            </div>
          )}
          
          {prospect.position && (
            <div className="flex items-center space-x-2">
              <BriefcaseIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{prospect.position}</span>
            </div>
          )}
        </div>

        {/* Industry & Location */}
        <div className="flex items-center space-x-4">
          {prospect.industry && (
            <span className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
              {prospect.industry}
            </span>
          )}
          {prospect.location && (
            <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
              📍 {prospect.location}
            </span>
          )}
        </div>

        {/* AI-Generated Insights */}
        {prospect.persona && (
          <div className="bg-gradient-to-r from-orange-50 to-gray-50 rounded-lg p-3 border border-orange-100">
            <div className="flex items-center space-x-2 mb-2">
              <AcademicCapIcon className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">AI Persona Insights</span>
            </div>
            <div className="space-y-1">
              {prospect.persona.communicationStyle && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Style:</span> {prospect.persona.communicationStyle}
                </p>
              )}
              {prospect.persona.primaryPainPoints && prospect.persona.primaryPainPoints.length > 0 && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Pain Points:</span> {prospect.persona.primaryPainPoints.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {prospect.techStack && prospect.techStack.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Technology Stack</p>
            <div className="flex flex-wrap gap-1">
              {prospect.techStack.slice(0, 3).map((tech, index) => (
                <span key={index} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded">
                  {tech}
                </span>
              ))}
              {prospect.techStack.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                  +{prospect.techStack.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Response Rate</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                  style={{ width: `${prospect.responseRate || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">{prospect.responseRate || 0}%</span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Source</p>
            <span className="text-sm font-medium text-gray-700">{prospect.source || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Added {new Date(prospect.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4" />
            </button>
            {prospect.phone && (
              <button 
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
              </button>
            )}
            {prospect.sourceUrl && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(prospect.sourceUrl, '_blank', 'noopener,noreferrer')
                }}
                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Open source URL"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hunter.io Style Email List Component
function ProspectEmailList({ prospects, selectedProspect, onSelectProspect }) {
  if (prospects.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">No prospects found</h3>
        <p className="text-sm text-gray-500">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {prospects.map((prospect) => {
        const isSelected = selectedProspect?.email === prospect.email
        return (
          <div
            key={prospect.email}
            onClick={() => {
              if (prospect.sourceUrl) {
                window.open(prospect.sourceUrl, '_blank', 'noopener,noreferrer')
              } else {
                onSelectProspect(prospect)
              }
            }}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-gray-50 border-r-2 border-orange-500' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {prospect.name ? prospect.name.charAt(0).toUpperCase() : prospect.email.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Email Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {prospect.name || 'Unknown Name'}
                  </p>
                  {/* Confidence Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    prospect.confidence >= 80 ? 'bg-orange-100 text-orange-800' :
                    prospect.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {prospect.confidence || 0}%
                  </span>
                </div>
                <p className="text-sm text-orange-600 truncate font-mono">
                  {prospect.email}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>{prospect.company || 'Unknown Company'}</span>
                  {prospect.position && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{prospect.position}</span>
                    </>
                  )}
                </div>
                {/* Status indicators */}
                <div className="flex items-center mt-2 space-x-2">
                  {prospect.persona ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Profile Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      <div className="w-3 h-3 mr-1 bg-gray-400 rounded-full animate-pulse"></div>
                      Analyzing...
                    </span>
                  )}
                  {prospect.source && (
                    <span className="text-xs text-gray-400">
                      via {prospect.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Hunter.io Style Profile View Component
function ProspectProfileView({ prospect, loading, onGenerateProfile }) {
  if (!prospect) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a prospect</h3>
          <p className="text-gray-600">Click on any email to see their detailed profile</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating AI profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {prospect.name ? prospect.name.charAt(0).toUpperCase() : prospect.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{prospect.name || 'Unknown Name'}</h2>
            <p className="text-orange-600 font-mono">{prospect.email}</p>
            {prospect.company && (
              <div className="flex items-center mt-1 text-gray-600">
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                <span>{prospect.company}</span>
                {prospect.position && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{prospect.position}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
            prospect.confidence >= 80 ? 'bg-orange-100 text-orange-800' :
            prospect.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {prospect.confidence || 0}% Confidence
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        {prospect.persona ? (
          <div className="space-y-6">
            {/* AI Persona Insights */}
            <div className="bg-gradient-to-r from-orange-50 to-gray-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center mb-4">
                <AcademicCapIcon className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-900">AI Persona Profile</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prospect.persona.communicationStyle && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Communication Style</h4>
                    <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                      {prospect.persona.communicationStyle}
                    </p>
                  </div>
                )}
                
                {prospect.persona.estimatedRole && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Estimated Role</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                      {prospect.persona.estimatedRole}
                    </span>
                  </div>
                )}
              </div>

              {prospect.persona.primaryPainPoints && prospect.persona.primaryPainPoints.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Primary Pain Points</h4>
                  <div className="flex flex-wrap gap-2">
                    {prospect.persona.primaryPainPoints.map((painPoint, index) => (
                      <span key={index} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                        {painPoint}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {prospect.persona.personalityTraits && prospect.persona.personalityTraits.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Personality Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {prospect.persona.personalityTraits.map((trait, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Company Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Industry</p>
                  <p className="text-sm text-gray-600">{prospect.industry || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Company Size</p>
                  <p className="text-sm text-gray-600">{prospect.companySize || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600">{prospect.location || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Source</p>
                  <p className="text-sm text-gray-600">{prospect.source || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            {prospect.techStack && prospect.techStack.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {prospect.techStack.map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Response Rate</span>
                    <span className="text-sm font-bold text-gray-900">{prospect.responseRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                      style={{ width: `${prospect.responseRate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">
                      {prospect.confidence || 0}%
                    </p>
                    <p className="text-xs text-gray-500">Confidence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">
                      {new Date(prospect.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">Added</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-600">
                      {prospect.source || 'AI'}
                    </p>
                    <p className="text-xs text-gray-500">Source</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Send Email
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <LinkIcon className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <StarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Profile not generated yet
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Analysis Pending</h3>
            <p className="text-gray-600 mb-6">Our AI agent is still analyzing this prospect's profile</p>
            <button 
              onClick={onGenerateProfile}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Generate AI Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Prospect List View Component (Table format) - Keep for backward compatibility
function ProspectListView({ prospects }) {
  if (prospects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
          <p className="text-gray-600">Try adjusting your filters or add new prospects</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Rate
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prospects.map((prospect) => (
              <tr 
                key={prospect.id || prospect.email} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (prospect.sourceUrl) {
                    window.open(prospect.sourceUrl, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      {prospect.name ? prospect.name.charAt(0).toUpperCase() : prospect.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{prospect.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 font-mono">{prospect.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{prospect.company || '-'}</div>
                  <div className="text-sm text-gray-500">{prospect.position || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  {prospect.industry ? (
                    <span className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
                      {prospect.industry}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    prospect.confidence >= 80 ? 'bg-orange-50 text-orange-700' :
                    prospect.confidence >= 50 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {prospect.confidence || 0}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${prospect.responseRate || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-700">{prospect.responseRate || 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{prospect.source || 'Unknown'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button className="text-orange-600 hover:text-orange-800">
                      <EnvelopeIcon className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// JobRight.ai Style Prospect List Component
function JobRightStyleProspectList({ prospects, selectedProspect, onSelectProspect, onGenerateProfile, generatingProfiles }) {
  if (prospects.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <UserGroupIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
        <p className="text-gray-600">Try adjusting your filters to find more prospects</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {prospects.map((prospect) => (
        <JobRightStyleProspectCard 
          key={prospect.id || prospect.email}
          prospect={prospect}
          isSelected={selectedProspect?.email === prospect.email}
          onSelect={() => onSelectProspect(prospect)}
          onGenerateProfile={() => onGenerateProfile(prospect)}
          isGenerating={generatingProfiles.has(prospect.email)}
        />
      ))}
    </div>
  )
}

// JobRight.ai Style Prospect Card
function JobRightStyleProspectCard({ prospect, isSelected, onSelect, onGenerateProfile, isGenerating }) {
  const getMatchScore = (confidence) => Math.round(confidence || 0)
  const getMatchLevel = (confidence) => {
    if (confidence >= 80) return { label: 'EXCELLENT MATCH', bgColor: 'bg-green-500' }
    if (confidence >= 60) return { label: 'GOOD MATCH', bgColor: 'bg-green-400' }
    return { label: 'FAIR MATCH', bgColor: 'bg-green-300' }
  }

  const handleCardClick = () => {
    if (prospect.sourceUrl) {
      window.open(prospect.sourceUrl, '_blank', 'noopener,noreferrer')
    } else {
      onSelect()
    }
  }

  const matchInfo = getMatchLevel(prospect.confidence)
  const matchScore = getMatchScore(prospect.confidence)

  return (
    <div 
      className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isSelected ? 'border-green-300 shadow-lg ring-2 ring-green-100' : 'border-gray-100 hover:border-green-200'
      }`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Content */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Simple Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {prospect.company ? prospect.company.charAt(0).toUpperCase() : prospect.name?.charAt(0).toUpperCase() || 'P'}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Status Indicators */}
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-gray-500">
                  {new Date(prospect.created_at).toLocaleDateString()}
                </span>
                {prospect.persona && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 font-medium">
                    ✓ Profile Ready
                  </span>
                )}
              </div>

              {/* Job Title / Position */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {prospect.position || 'Business Professional'}
              </h3>

              {/* Company and Details */}
              <div className="text-gray-600 space-y-1">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{prospect.company || 'Unknown Company'}</span>
                  {prospect.industry && (
                    <>
                      <span>•</span>
                      <span className="text-gray-500">{prospect.industry}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Location and Details */}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{prospect.location || prospect.companySize || 'Remote'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <EnvelopeIcon className="w-4 h-4" />
                  <span className="font-mono text-orange-600">{prospect.email}</span>
                </div>
                {prospect.responseRate && (
                  <div className="flex items-center space-x-1">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>{prospect.responseRate}% response rate</span>
                  </div>
                )}
              </div>

              {/* Tech Stack */}
              {prospect.techStack && prospect.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {prospect.techStack.slice(0, 3).map((tech, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg">
                      {tech}
                    </span>
                  ))}
                  {prospect.techStack.length > 3 && (
                    <span className="text-xs text-gray-500">+{prospect.techStack.length - 3} more</span>
                  )}
                </div>
              )}

              {/* AI Persona Insights */}
              {prospect.persona && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <AcademicCapIcon className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700">AI INSIGHTS</span>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    {prospect.persona.communicationStyle && (
                      <p><span className="font-medium">Style:</span> {prospect.persona.communicationStyle}</p>
                    )}
                    {prospect.persona.primaryPainPoints && prospect.persona.primaryPainPoints.length > 0 && (
                      <p><span className="font-medium">Focus:</span> {prospect.persona.primaryPainPoints.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Match Score Card */}
          <div
            className="w-32 h-48 rounded-xl text-white text-center flex flex-col justify-center p-4 ml-6"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
            }}
          >
            {/* Circular Progress */}
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#3a3a3a"
                  strokeWidth="3"
                />
                {/* Progress circle with cyan/green gradient */}
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeDasharray={`${(matchScore / 100) * 339.292}, 339.292`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#00ff88" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-normal text-white">{matchScore}%</span>
              </div>
            </div>

            {/* Match Level */}
            <div className="text-sm font-normal text-white tracking-wider mb-3">{matchInfo.label}</div>

            {/* Benefits section */}
            <div className="space-y-1 text-left">
              <div className="text-xs text-gray-300">✓ High Interest</div>
              {prospect.persona && (
                <div className="text-xs text-gray-300">✓ AI Analyzed</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {prospect.source && (
              <span>via {prospect.source}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {!prospect.persona ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerateProfile()
                }}
                disabled={isGenerating}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isGenerating 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" />
                    Generating...
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="w-4 h-4 inline mr-1" />
                    Generate Profile
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-100 transition-colors"
              >
                <StarIcon className="w-4 h-4 inline mr-1" />
                Prioritize
              </button>
            )}
            
            <button
              onClick={(e) => e.stopPropagation()}
              className="bg-[#00f5a0] hover:bg-[#00e090] text-black px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              CONTACT NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}