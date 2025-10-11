import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  StarIcon,
  LinkIcon,
  CursorArrowRaysIcon,
  BanknotesIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { 
  EnvelopeIcon as EnvelopeIconSolid, 
  StarIcon as StarIconSolid,
  EyeIcon as EyeIconSolid
} from '@heroicons/react/24/solid'

// Import fancy email templates
import { 
  ExecutiveSummitTemplate, TechStartupVibrantTemplate, LuxuryBrandTemplate,
  SaaSModernTemplate, EcommerceFlashSaleTemplate, MinimalistCreativeTemplate,
  CyberpunkNeonTemplate, WellnessHealthTemplate, FinancialDashboardTemplate,
  GamingTournamentTemplate, renderStructuredTemplate
} from './EmailTemplates36';

export default function HunterStyleEmailCampaignManager({ emails = [], stats = {}, prospects = [], viewMode = 'emails' }) {
  // 调试信息
  console.log('🔍 HunterStyleEmailCampaignManager props:', {
    emailsLength: emails?.length || 0,
    statsKeys: Object.keys(stats),
    prospectsLength: prospects?.length || 0,
    viewMode,
    emailsSample: emails?.slice(0, 2).map(e => ({ to: e.to, subject: e.subject }))
  });
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sortBy, setSortBy] = useState('sent_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [generatingProfiles, setGeneratingProfiles] = useState(new Set()) // Track which profiles are being generated
  
  // WebSocket connection for real-time updates
  const ws = useRef(null)

  // Function to render structured templates based on type
  const renderStructuredTemplate = (templateType, sections) => {
    const templateComponents = {
      'executive_summit': ExecutiveSummitTemplate,
      'tech_startup_vibrant': TechStartupVibrantTemplate,
      'luxury_brand': LuxuryBrandTemplate,
      'saas_modern': SaaSModernTemplate,
      'ecommerce_flash': EcommerceFlashSaleTemplate,
      'minimalist_creative': MinimalistCreativeTemplate,
      'cyberpunk_neon': CyberpunkNeonTemplate,
      'wellness_health': WellnessHealthTemplate,
      'financial_dashboard': FinancialDashboardTemplate,
      'gaming_tournament': GamingTournamentTemplate
    };

    const TemplateComponent = templateComponents[templateType];
    
    if (TemplateComponent) {
      return <TemplateComponent sections={sections} />;
    }
    
    // Fallback to default fancy display
    return (
      <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {sections.headline || sections.companyName || 'Business Communication'}
        </h3>
        <p className="text-gray-700 mb-6">
          {sections.description || sections.mainDescription || 'We have an exciting opportunity to share with you.'}
        </p>
        {sections.features && Array.isArray(sections.features) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {sections.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        )}
        <div className="text-center">
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
            {sections.ctaText || sections.primaryCta || 'Learn More'}
          </button>
        </div>
      </div>
    );
  }

  // WebSocket setup for real-time persona updates
  useEffect(() => {
    if (viewMode === 'prospects') {
      const connectWebSocket = () => {
        const wsUrl = `ws://localhost:3333/ws/workflow`
        ws.current = new WebSocket(wsUrl)
        
        ws.current.onopen = () => {
          console.log('🔗 WebSocket connected for prospect profiles')
        }
        
        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'persona_generated') {
              console.log('🎭 Persona generated for:', data.data.prospect.email)
              const updatedEmail = data.data.prospect.email
              
              // Remove from generating set
              setGeneratingProfiles(prev => {
                const newSet = new Set(prev)
                newSet.delete(updatedEmail)
                return newSet
              })
              
              // Force component re-render if this is the selected prospect
              if (selectedProspect && selectedProspect.email === updatedEmail) {
                setSelectedProspect(prev => ({
                  ...prev,
                  persona: data.data.persona
                }))
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error)
          }
        }
        
        ws.current.onclose = () => {
          console.log('🔌 WebSocket disconnected, attempting to reconnect...')
          setTimeout(connectWebSocket, 3000)
        }
      }
      
      connectWebSocket()
    }
    
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [viewMode, selectedProspect])

  // Generate prospect profile function
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
      } else {
        throw new Error(result.error || 'Failed to generate profile')
      }
      
    } catch (error) {
      console.error('Profile generation failed:', error)
      
      // Remove from generating set on error
      setGeneratingProfiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(prospect.email)
        return newSet
      })
    }
  }

  // Find associated prospect for an email
  const findProspectForEmail = (email) => {
    return prospects.find(p => 
      p.email === email.to || 
      p.email === email.recipient ||
      (email.to && p.email && p.email.toLowerCase() === email.to.toLowerCase())
    )
  }

  // Filter and sort emails
  const filteredEmails = useMemo(() => {
    let filtered = emails.filter(email => {
      const matchesSearch = !searchTerm || 
        email.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.recipient_company?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !selectedStatus || email.status === selectedStatus
      const matchesTemplate = !selectedTemplate || email.template_used === selectedTemplate
      
      return matchesSearch && matchesStatus && matchesTemplate
    })

    // Sort emails
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'subject':
          aVal = a.subject || ''
          bVal = b.subject || ''
          break
        case 'recipient':
          aVal = a.recipient_name || a.to || ''
          bVal = b.recipient_name || b.to || ''
          break
        case 'opens':
          aVal = a.opens || 0
          bVal = b.opens || 0
          break
        case 'performance':
          aVal = a.performance_score || 0
          bVal = b.performance_score || 0
          break
        default:
          aVal = new Date(a.sent_at || 0)
          bVal = new Date(b.sent_at || 0)
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [emails, searchTerm, selectedStatus, selectedTemplate, sortBy, sortOrder])

  const uniqueStatuses = [...new Set(emails.map(e => e.status).filter(Boolean))]
  const uniqueTemplates = [...new Set(emails.map(e => e.template_used).filter(Boolean))]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'replied':
        return <StarIconSolid className="w-4 h-4 text-orange-500" />
      case 'opened':
        return <EyeIconSolid className="w-4 h-4 text-gray-500" />
      case 'clicked':
        return <CursorArrowRaysIcon className="w-4 h-4 text-orange-500" />
      case 'delivered':
      case 'sent':
        return <CheckCircleIcon className="w-4 h-4 text-orange-500" />
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-yellow-500" />
    }
  }

  // Handle prospects-only view mode FIRST (before checking emails)
  if (viewMode === 'prospects') {

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header with prospect stats - Hunter.io Clean Style */}
        <div className="border-b border-gray-100 p-8 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Prospects</h2>
              <p className="text-gray-500 mt-1 text-base">AI-powered prospect discovery with detailed persona insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium border border-orange-100">
                {prospects.length} prospects
              </span>
            </div>
          </div>

          {/* Prospect stats - Hunter.io Style Metrics */}
          {prospects.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600 text-sm">With personas</span>
                <span className="text-gray-800 font-medium text-sm">{prospects.filter(p => p.persona).length}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600 text-sm">High confidence</span>
                <span className="text-gray-800 font-medium text-sm">{prospects.filter(p => parseFloat(p.confidence) > 70).length}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-600 text-sm">Verified</span>
                <span className="text-gray-800 font-medium text-sm">{prospects.filter(p => p.verified).length || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hunter.io Clean Two-Column Layout for Prospects */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Prospect List */}
          <div className="w-1/2 border-r border-gray-100 flex flex-col bg-gray-50">
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prospects by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-gray-50 text-sm placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {console.log('🔍 Rendering prospect list:', { 
                totalProspects: prospects.length, 
                searchTerm, 
                prospectsToRender: prospects.length > 0 ? prospects.slice(0, 2) : 'No prospects'
              })}
              {prospects.length > 0 ? prospects.map((prospect, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedProspect(prospect)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedProspect?.email === prospect.email ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {(prospect.name || prospect.email.charAt(0)).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {prospect.name || prospect.email.split('@')[0]}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          <div className={`w-2 h-2 rounded-full ${
                            parseFloat(prospect.confidence) > 80 ? 'bg-orange-500' : 
                            parseFloat(prospect.confidence) > 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                      </div>
                      
                      <p className="text-orange-600 text-sm truncate font-mono">
                        {prospect.email}
                      </p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 text-xs truncate">
                            {prospect.company || 'Company Unknown'}
                          </span>
                        </div>
                        {prospect.sourceUrl && (
                          <a 
                            href={prospect.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-800 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkIcon className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      
                      {(prospect.persona || generatingProfiles.has(prospect.email)) && (
                        <div className="mt-2">
                          {generatingProfiles.has(prospect.email) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              AI Analyzing...
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              <UserCircleIcon className="w-3 h-3 mr-1" />
                              AI Persona Ready
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No prospects found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Prospect Detail */}
          <div className="w-1/2 flex flex-col">
            {selectedProspect ? (
              <ProspectDetailView 
                prospect={selectedProspect} 
                generatingProfiles={generatingProfiles}
                generateProspectProfile={generateProspectProfile}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <UserCircleIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a prospect</h3>
                  <p className="text-gray-600">Click on any prospect to see detailed persona insights</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // For email campaign view, show empty state only when we're certain there are no emails
  // But allow the list to render if we have prospects (emails might be loading)
  if (viewMode === 'emails' && (!emails || emails.length === 0) && (!prospects || prospects.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.95a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
          <p className="text-gray-500">Start a campaign to see email activity here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header with stats - Hunter.io Clean Design */}
      <div className="border-b border-gray-100 p-8 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Email Campaign</h2>
            <p className="text-gray-500 mt-1 text-base">Track email performance and engagement analytics</p>
          </div>
          <button
            className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            onClick={() => window.location.reload()}
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Performance Stats - Hunter.io Clean Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Sent</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.sent || emails.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Opened</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.opened || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <EnvelopeOpenIcon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Clicks</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {emails.reduce((acc, email) => acc + (email.clicks || 0), 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <CursorArrowRaysIcon className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Replied</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.replied || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <StarIcon className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Hunter.io Clean Style */}
        <div className="mt-8 flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-gray-50 placeholder-gray-500"
              placeholder="Search emails by recipient, subject, or content..."
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-700 min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-gray-700 min-w-[140px]"
          >
            <option value="">All Templates</option>
            {uniqueTemplates.map(template => (
              <option key={template} value={template}>
                {template?.replace('_', ' ')}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="sent_at">Sort by Date</option>
            <option value="subject">Sort by Subject</option>
            <option value="recipient">Sort by Recipient</option>
            <option value="opens">Sort by Opens</option>
            <option value="performance">Sort by Performance</option>
          </select>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-400 hover:text-gray-600 p-2 rounded"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <span className="text-sm text-gray-600">
              {filteredEmails.length} emails
            </span>
          </div>
        </div>
      </div>

      {/* Hunter.io Style Two-Column Layout */}
      <div className="flex-1 flex overflow-visible">
        {/* Left Column - Email List */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Email List</h3>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                {filteredEmails.length} emails
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email, index) => {
                const isSelected = selectedEmail?.to === email.to && selectedEmail?.subject === email.subject
                const prospect = findProspectForEmail(email)
                
                return (
                  <div
                    key={`${email.to}-${index}`}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(email.status || 'sent')}
                      </div>

                      {/* Email Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.recipient_name || prospect?.name || email.to?.split('@')[0] || 'Unknown'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {email.sent_at ? new Date(email.sent_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-orange-600 truncate font-mono mb-1">
                          {email.to}
                        </p>
                        
                        <p className="text-sm text-gray-700 truncate font-medium mb-2">
                          {email.subject}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{email.recipient_company || prospect?.company || 'Unknown Company'}</span>
                            <span>•</span>
                            <span>{email.template_used?.replace('_', ' ') || 'Standard'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {prospect?.persona && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Persona
                              </span>
                            )}
                            {(email.opens > 0 || email.clicked || email.replied) && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                {email.opens > 0 && (
                                  <span className="flex items-center">
                                    <EyeIcon className="w-3 h-3 mr-1" />
                                    {email.opens}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Email Detail & Persona Profile */}
        <div className="w-1/2 flex flex-col overflow-visible">
          <EmailDetailAndPersonaView 
            email={selectedEmail}
            prospect={selectedEmail ? findProspectForEmail(selectedEmail) : null}
            generatingProfiles={generatingProfiles}
            generateProspectProfile={generateProspectProfile}
          />
        </div>
      </div>
    </div>
  )
}

// Email Detail and Persona Profile Component
function EmailDetailAndPersonaView({ email, prospect, generatingProfiles, generateProspectProfile }) {
  const [activeTab, setActiveTab] = useState('email');

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8 bg-gray-50">
        <div>
          <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email</h3>
          <p className="text-gray-600 mb-4">Click on any email to see detailed content and prospect insights</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• View full email content</p>
            <p>• Access AI-generated persona profiles</p>
            <p>• See performance analytics</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-visible">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 px-6 pt-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('email')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Email Content
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'persona'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {generatingProfiles?.has(prospect?.email) ? 'Generating Profile...' :
             prospect?.persona ? 'Prospect Profile' : 'Generate Profile'}
          </button>
        </nav>
      </div>

      {activeTab === 'email' && (
        <EmailContentTab email={email} prospect={prospect} />
      )}

      {activeTab === 'persona' && (
        <PersonaProfileTab 
          email={email} 
          prospect={prospect} 
          generatingProfiles={generatingProfiles}
          generateProspectProfile={generateProspectProfile}
        />
      )}
    </div>
  )
}

// Email Content Tab
function EmailContentTab({ email, prospect }) {
  return (
    <div className="h-full overflow-visible">
      {/* Email Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {email.recipient_name || prospect?.name || email.to?.split('@')[0] || 'Recipient'}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                email.status === 'replied' ? 'bg-orange-100 text-orange-800' :
                email.status === 'opened' ? 'bg-orange-200 text-orange-900' :
                email.status === 'clicked' ? 'bg-orange-300 text-orange-900' :
                'bg-orange-400 text-white'
              }`}>
                {email.status?.charAt(0).toUpperCase() + email.status?.slice(1) || 'Sent'}
              </span>
            </div>
            <p className="text-orange-600 font-mono text-sm">{email.to}</p>
            <p className="text-gray-600 text-sm">{email.recipient_company || prospect?.company || 'Unknown Company'}</p>
            <p className="text-gray-900 font-medium mt-2">{email.subject}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {email.sent_at ? new Date(email.sent_at).toLocaleString() : 'Recently sent'}
            </p>
            <p className="text-lg font-semibold text-orange-600 mt-1">
              {Math.floor((email.performance_score || Math.random() * 40 + 60))}% Score
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-2">
              <EyeIcon className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.opens || 0}</p>
            <p className="text-xs text-gray-500">Opens</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-200 rounded-lg mx-auto mb-2">
              <CursorArrowRaysIcon className="w-5 h-5 text-orange-700" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.clicks || 0}</p>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-300 rounded-lg mx-auto mb-2">
              <StarIcon className="w-5 h-5 text-orange-800" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.replies || 0}</p>
            <p className="text-xs text-gray-500">Replies</p>
          </div>
        </div>
      </div>

      {/* Email Content - Enhanced Fancy UI with 36 Templates */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Email Content
          </h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full border border-indigo-200">
              {email.template_used?.replace('_', ' ').toUpperCase() || 'CUSTOM'}
            </span>
            <span className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
              {email.template_type === 'structured_fancy' ? 'FANCY' : 'SENT'}
            </span>
          </div>
        </div>

        {/* Check if this is a structured fancy email with sections */}
        {email.template_type === 'structured_fancy' && email.sections ? (
          <div className="structured-email-display">
            {renderStructuredTemplate(email.template_used, email.sections)}
          </div>
        ) : (
          
        /* Fancy Email Preview with Premium Styling */
        <div className="relative">
          {/* Email Browser Mock */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Mock Browser Header */}
            <div className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 px-4 py-3 border-b border-gray-300">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-600 border border-gray-300">
                    📧 {email.recipient_email || email.to || 'recipient@example.com'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Email Subject Line */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {(email.sender_name || email.from || 'AI')?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg leading-tight">
                        {email.subject || 'Strategic Partnership Opportunity'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        From: <span className="font-semibold">{email.sender_name || email.from || 'AI Marketing'}</span> 
                        &lt;{email.sender_email || email.from_email || 'ai@company.com'}&gt;
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Navigate to email editor with the email content
                        navigate('/email-editor', {
                          state: {
                            emailContent: email.body || email.html || '',
                            emailSubject: email.subject || '',
                            recipient: email.to || '',
                            recipientName: email.recipient_name || '',
                            recipientCompany: email.recipient_company || '',
                            templateId: email.templateId || email.template || 'professional_partnership',
                            templateName: email.templateName || 'Professional Partnership',
                            editMode: true
                          }
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Email</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(email.sent_at || Date.now()).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Email Body with Enhanced Styling - FIXED COMPRESSED VIEW */}
            <div className="bg-white">
              <div className="w-full overflow-visible">
                <div 
                  className="w-full p-6"
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    overflow: 'visible'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: email.body || email.html ? 
                      // COMPREHENSIVE FIX: Clean and properly scale the HTML content without aggressive overrides
                      `<style>
                        .email-content { 
                          width: 100% !important;
                          height: auto !important;
                          overflow: visible !important;
                          position: relative !important;
                        }
                        .email-content * { 
                          transform: none !important; 
                          scale: none !important;
                          zoom: 1 !important;
                          box-sizing: border-box !important;
                        }
                        .email-content img { 
                          max-width: 100% !important; 
                          height: auto !important; 
                        }
                        .email-content table { 
                          width: 100% !important; 
                          border-collapse: collapse !important; 
                        }
                        .email-content div { 
                          position: relative !important; 
                        }
                        .email-content p {
                          margin: 12px 0 !important;
                          line-height: 1.6 !important;
                        }
                      </style>
                      <div class="email-content" style="width: 100%; height: auto; overflow: visible;">` +
                      (email.body || email.html)
                        .replace(/transform:\s*scale\([^)]+\)[^;]*;?/gi, '') // Remove transform scale specifically
                        .replace(/transform:\s*[^;]*scale[^;]*;?/gi, '') // Remove any transform with scale
                        .replace(/scale\([^)]+\)/gi, '') // Remove standalone scale functions  
                        .replace(/zoom:\s*[^;]+;?/gi, 'zoom: 1;') // Reset zoom
                        .replace(/style\s*=\s*["'][^"']*transform[^"']*["']/gi, '') // Remove inline transform styles
                      + '</div>'
                      : '<p class="text-gray-500 italic">Email content not available</p>' 
                  }}
                />
              </div>
              
              {/* Email Footer */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Campaign: {email.campaign_id || 'Default'}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Template: {email.template_used?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Custom'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                      AI Generated
                    </div>
                    <div className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      Personalized
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fancy Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 rounded-xl opacity-20 blur-lg animate-pulse"></div>
        </div>
        )}
      </div>
    </div>
  )
}

// Persona Profile Tab
function PersonaProfileTab({ email, prospect, generatingProfiles, generateProspectProfile }) {
  if (!prospect) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <UserCircleIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prospect data found</h3>
          <p className="text-gray-600 mb-4">This email recipient is not in the prospect database</p>
          <p className="text-sm text-gray-500">Prospect profiles are generated during the campaign workflow</p>
        </div>
      </div>
    )
  }

  const isGenerating = generatingProfiles?.has(prospect.email)

  if (!prospect.persona && !isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Analysis Pending</h3>
          <p className="text-gray-600 mb-6">Our AI agent can analyze this prospect's profile</p>
          <button 
            onClick={() => generateProspectProfile(prospect)}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Generate AI Profile
          </button>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating AI profile...</h3>
          <p className="text-gray-600 mb-4">Analyzing prospect data and generating detailed persona</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Analyzing communication style</p>
            <p>• Identifying pain points</p>
            <p>• Researching company context</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Prospect Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {(prospect.name || prospect.email.charAt(0)).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {prospect.name || prospect.email.split('@')[0]}
            </h2>
            <p className="text-orange-600 font-mono text-sm">{prospect.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{prospect.company || 'Unknown Company'}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                parseFloat(prospect.confidence) >= 80 ? 'bg-orange-100 text-orange-800' :
                parseFloat(prospect.confidence) >= 60 ? 'bg-orange-200 text-orange-800' :
                'bg-orange-300 text-orange-900'
              }`}>
                {prospect.confidence || 'N/A'}% confidence
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Details */}
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          {prospect.persona.estimatedRole && (
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-gray-900">{prospect.persona.estimatedRole}</p>
            </div>
          )}
          {prospect.persona.communicationStyle && (
            <div>
              <label className="text-sm font-medium text-gray-500">Communication Style</label>
              <p className="text-gray-900 capitalize">{prospect.persona.communicationStyle}</p>
            </div>
          )}
          {prospect.persona.companySize && (
            <div>
              <label className="text-sm font-medium text-gray-500">Company Size</label>
              <p className="text-gray-900">{prospect.persona.companySize}</p>
            </div>
          )}
          {prospect.persona.industryContext && (
            <div>
              <label className="text-sm font-medium text-gray-500">Industry</label>
              <p className="text-gray-900">{prospect.persona.industryContext}</p>
            </div>
          )}
        </div>

        {/* Pain Points */}
        {prospect.persona.primaryPainPoints && prospect.persona.primaryPainPoints.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Pain Points</label>
            <div className="flex flex-wrap gap-2">
              {prospect.persona.primaryPainPoints.map((pain, idx) => (
                <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                  {pain}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {prospect.persona.interests && prospect.persona.interests.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Interests</label>
            <div className="flex flex-wrap gap-2">
              {prospect.persona.interests.map((interest, idx) => (
                <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {prospect.persona.techStack && prospect.persona.techStack.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Tech Stack</label>
            <div className="flex flex-wrap gap-2">
              {prospect.persona.techStack.map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source Information */}
        {(prospect.sourceUrl || prospect.persona.sourceUrl) && (
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Source Information</label>
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-orange-600" />
              <a 
                href={prospect.sourceUrl || prospect.persona.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-700 hover:text-orange-800 text-sm underline font-medium"
              >
                Company URL
              </a>
            </div>
            <p className="text-xs text-orange-600 mt-1">Visit company website</p>
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4">
          {prospect.persona.responseRate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Response Rate</label>
              <p className="text-orange-600 font-semibold">{prospect.persona.responseRate}</p>
            </div>
          )}
          {prospect.persona.bestContactTime && (
            <div>
              <label className="text-sm font-medium text-gray-500">Best Contact Time</label>
              <p className="text-gray-900">{prospect.persona.bestContactTime}</p>
            </div>
          )}
          {prospect.persona.location && (
            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <p className="text-gray-900">{prospect.persona.location}</p>
            </div>
          )}
          {prospect.persona.buyingStage && (
            <div>
              <label className="text-sm font-medium text-gray-500">Buying Stage</label>
              <p className="text-gray-900">{prospect.persona.buyingStage}</p>
            </div>
          )}
        </div>

        {/* Contact Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              Send Follow-up
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Add to CRM
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Prospect Detail Component
function ProspectDetailView({ prospect, generatingProfiles, generateProspectProfile }) {
  if (!prospect) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <UserCircleIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a prospect</h3>
          <p className="text-gray-600">Click on any prospect to see detailed persona insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Prospect Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {(prospect.name || prospect.email.charAt(0)).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {prospect.name || prospect.email.split('@')[0]}
            </h2>
            <p className="text-orange-600 font-mono text-sm">{prospect.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{prospect.company || 'Unknown Company'}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                parseFloat(prospect.confidence) >= 80 ? 'bg-orange-100 text-orange-800' :
                parseFloat(prospect.confidence) >= 60 ? 'bg-orange-200 text-orange-800' :
                'bg-orange-300 text-orange-900'
              }`}>
                {prospect.confidence || 'N/A'}% confidence
              </span>
              {prospect.sourceUrl && (
                <a 
                  href={prospect.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs hover:bg-orange-100 transition-colors"
                >
                  <LinkIcon className="w-3 h-3 mr-1" />
                  View Source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prospect Details */}
      <div className="p-6 space-y-6">
        {generatingProfiles?.has(prospect.email) ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI正在分析中...</h3>
              <p className="text-gray-600">正在为 {prospect.name || prospect.email.split('@')[0]} 生成详细的用户画像</p>
              <div className="mt-4 bg-orange-50 rounded-lg p-3">
                <p className="text-orange-700 text-sm">分析内容包括：角色推断、沟通风格、痛点分析、兴趣偏好等</p>
              </div>
            </div>
          </div>
        ) : prospect.persona ? (
          <>
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              {prospect.persona.estimatedRole && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900">{prospect.persona.estimatedRole}</p>
                </div>
              )}
              {prospect.persona.communicationStyle && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Communication Style</label>
                  <p className="text-gray-900 capitalize">{prospect.persona.communicationStyle}</p>
                </div>
              )}
              {prospect.persona.companySize && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Size</label>
                  <p className="text-gray-900">{prospect.persona.companySize}</p>
                </div>
              )}
              {prospect.persona.industryContext && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Industry</label>
                  <p className="text-gray-900">{prospect.persona.industryContext}</p>
                </div>
              )}
            </div>

            {/* Pain Points */}
            {prospect.persona.primaryPainPoints && prospect.persona.primaryPainPoints.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Pain Points</label>
                <div className="flex flex-wrap gap-2">
                  {prospect.persona.primaryPainPoints.map((pain, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      {pain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {prospect.persona.interests && prospect.persona.interests.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {prospect.persona.interests.map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {prospect.persona.techStack && prospect.persona.techStack.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Tech Stack</label>
                <div className="flex flex-wrap gap-2">
                  {prospect.persona.techStack.map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Information */}
            {(prospect.sourceUrl || prospect.persona?.sourceUrl) && (
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Source Information</label>
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-orange-600" />
                  <a 
                    href={prospect.sourceUrl || prospect.persona.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-700 hover:text-orange-800 text-sm underline font-medium"
                  >
                    Company URL
                  </a>
                </div>
                <p className="text-xs text-orange-600 mt-1">Visit company website</p>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              {prospect.persona.responseRate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Response Rate</label>
                  <p className="text-orange-600 font-semibold">{prospect.persona.responseRate}</p>
                </div>
              )}
              {prospect.persona.bestContactTime && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Best Contact Time</label>
                  <p className="text-gray-900">{prospect.persona.bestContactTime}</p>
                </div>
              )}
              {prospect.persona.location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{prospect.persona.location}</p>
                </div>
              )}
              {prospect.persona.buyingStage && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Buying Stage</label>
                  <p className="text-gray-900">{prospect.persona.buyingStage}</p>
                </div>
              )}
            </div>

            {/* Contact Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  Generate Email
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Export Data
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Analysis Pending</h3>
            <p className="text-gray-600 mb-6">Our AI agent can analyze this prospect's profile to generate detailed persona insights</p>
            <button 
              onClick={() => generateProspectProfile && generateProspectProfile(prospect)}
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