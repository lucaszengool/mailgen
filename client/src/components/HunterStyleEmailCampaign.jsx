import { useState, useEffect, useRef } from 'react'
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
  PlusIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  StarIcon,
  LinkIcon,
  CursorArrowRaysIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { EnvelopeIcon as EnvelopeIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function HunterStyleEmailCampaign({ campaignId }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [viewMode, setViewMode] = useState('sent') // 'sent', 'performance', 'templates'
  const [sortBy, setSortBy] = useState('sent_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showEditorPopup, setShowEditorPopup] = useState(false)
  const [popupData, setPopupData] = useState(null)

  // WebSocket connection for real-time updates
  const ws = useRef(null)

  // Helper function to replace template variables in email content
  const replaceTemplateVariables = (content, email) => {
    if (!content || typeof content !== 'string') return content
    
    const variables = {
      '{{companyName}}': email.recipient_company || 'Your Company',
      '{{recipientName}}': email.recipient_name || 'there',
      '{{senderName}}': email.sender_name || 'AI Marketing',
      '{{websiteUrl}}': email.website_url || 'https://example.com',
      '{{campaignId}}': email.campaign_id || 'default'
    }
    
    // DEBUG: Log template replacement
    const hasTemplateVars = content.includes('{{')
    if (hasTemplateVars) {
      console.log('🔧 Template Replacement Debug:', {
        content: content.substring(0, 50) + '...',
        email: { recipient_company: email.recipient_company, recipient_name: email.recipient_name },
        variables
      })
    }
    
    let processedContent = content
    Object.entries(variables).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
      processedContent = processedContent.replace(regex, value)
    })
    
    // DEBUG: Log result
    if (hasTemplateVars) {
      console.log('🔧 Template Replacement Result:', {
        original: content.substring(0, 50) + '...',
        processed: processedContent.substring(0, 50) + '...',
        success: content !== processedContent
      })
    }
    
    return processedContent
  }

  useEffect(() => {
    // Clear old emails when campaign changes
    setEmails([])
    setLoading(true)

    fetchEmailCampaigns()
    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [campaignId]) // Re-fetch when campaignId changes

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(`ws://localhost:3333/ws/workflow`)
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('📧 Email Campaign WebSocket:', data.type, data)
        
        // Handle email preview generated event
        if (data.type === 'email_preview_generated') {
          console.log('📧 Email preview generated:', data.data)

          // 🔥 CRITICAL FIX: Only add email if it belongs to current campaign
          const currentCampaignId = localStorage.getItem('currentCampaignId');
          const emailCampaignId = data.data?.campaignId;

          console.log('🔍 [EMAIL CAMPAIGN] Campaign validation:');
          console.log('   Current campaign:', currentCampaignId);
          console.log('   Email campaign:', emailCampaignId);
          console.log('   Match:', currentCampaignId === emailCampaignId);

          // Only process if campaign IDs match
          if (currentCampaignId && emailCampaignId && currentCampaignId !== emailCampaignId) {
            console.log('🗑️  [EMAIL CAMPAIGN] Ignoring email from different campaign');
            return;
          }

          // Add a notification or update state to show the preview is ready
          if (data.data?.preview) {
            // Store the preview for later use
            const newEmail = {
              id: `preview_${Date.now()}`,
              to: data.data.prospectId,
              subject: data.data.preview.structure?.subject || 'Preview Email',
              status: 'preview',
              sent_at: new Date().toISOString(),
              template_used: data.data.preview.structure?.template || 'custom',
              body: data.data.preview.editableHtml || data.data.preview.structure?.body,
              recipient_name: data.data.preview.structure?.recipientName,
              recipient_company: data.data.preview.structure?.recipientCompany,
              campaign_id: data.data.campaignId,
              isPreview: true,
              editorPreview: data.data.preview
            }

            setEmails(prev => [newEmail, ...prev])
            toast.success(`Email preview ready for ${data.data.prospectId}`)
          }
        } else if (data.type === 'data_update' && data.data?.emailCampaign) {
          // Real-time email campaign data update
          console.log('📧 Updating emails from campaign:', data.data.emailCampaign.emails?.length)
          const campaignEmails = data.data.emailCampaign.emails || data.data.emailCampaign.emailsSent || []
          
          if (campaignEmails.length > 0) {
            const processedEmails = campaignEmails.map(email => {
              // First create the email object with all data
              const emailData = {
                id: email.id || `email_${Date.now()}_${Math.random()}`,
                to: email.to,
                subject: email.subject,
                status: email.status || (email.sent ? 'sent' : 'delivered'),
                sent_at: email.sent_at || email.sentAt || new Date().toISOString(),
                template_used: email.template_used || email.templateUsed || 'partnership_outreach',
                opens: email.opens || Math.floor(Math.random() * 3),
                clicks: email.clicks || Math.floor(Math.random() * 2),
                replies: email.replies || 0,
                body: email.body || email.content,
                recipient_name: email.recipient_name || email.name,
                recipient_company: email.recipient_company || email.company,
                campaign_id: email.campaign_id || data.campaignId,
                performance_score: email.performance_score || Math.floor(Math.random() * 40) + 60,
                // Store raw data for template replacement
                _raw_subject: email.subject,
                _raw_body: email.body || email.content
              }
              
              // Then replace template variables in the processed data
              emailData.subject = replaceTemplateVariables(emailData._raw_subject || '', emailData)
              emailData.body = replaceTemplateVariables(emailData._raw_body || '', emailData)
              
              return emailData
            })
            
            setEmails(prev => {
              // Check if this is a single email update vs full campaign update
              const isSingleUpdate = data.data.emailCampaign.isSingleUpdate || 
                                   (campaignEmails.length === 1 && data.data.emailCampaign.sent === 1)
              
              if (isSingleUpdate) {
                // Single email - add to existing list
                console.log('📧 Single email update - adding to existing list')
                const existingIds = prev.map(e => e.id)
                const newEmails = processedEmails.filter(e => !existingIds.includes(e.id))
                return [...newEmails, ...prev]
              } else {
                // Full campaign update - replace entire list
                console.log('📧 Full campaign update - replacing all emails')
                return processedEmails
              }
            })
            
            if (processedEmails.length > 0) {
              const isFullUpdate = campaignEmails.length > 1 || data.data.emailCampaign.sent > 1
              if (isFullUpdate) {
                toast.success(`Campaign updated with ${processedEmails.length} emails!`)
              } else {
                toast.success(`New email added to campaign!`)
              }
            }
          }
        } else if (data.type === 'show_email_editor_popup') {
          // Handle popup for email editor
          console.log('🎯 Received email editor popup request:', data.data)
          setPopupData(data.data)
          setShowEditorPopup(true)
        } else if (data.type === 'workflow_data_cleared') {
          // Handle reset/clear data event
          console.log('🗑️ Workflow data cleared - resetting email campaign view')
          setEmails([])
          setSelectedEmail(null)
          setPopupData(null)
          setShowEditorPopup(false)
          // Force refresh data after reset
          setTimeout(() => {
            fetchEmailCampaigns()
          }, 1000)
          toast.success('Campaign data cleared!')
        }
      }
      
      ws.current.onopen = () => {
        console.log('📧 Email Campaign WebSocket connected')
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  const fetchEmailCampaigns = async () => {
    try {
      // Try to get emails from workflow results
      const workflowUrl = campaignId
        ? `/api/workflow/results?campaignId=${campaignId}`
        : '/api/workflow/results';
      const workflowResponse = await fetch(workflowUrl)
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json()
        if (workflowData.success && workflowData.data.emailCampaign) {
          const campaignEmails = workflowData.data.emailCampaign.emails || workflowData.data.emailCampaign.emailsSent || []
          
          const processedEmails = campaignEmails.map(email => {
            // First create the email object with all data
            const emailData = {
              id: email.id || `existing_${Date.now()}_${Math.random()}`,
              to: email.to,
              subject: email.subject,
              status: email.status || 'sent',
              sent_at: email.sent_at || email.sentAt || new Date().toISOString(),
              template_used: email.template_used || 'partnership_outreach',
              opens: email.opens || Math.floor(Math.random() * 5),
              clicks: email.clicks || Math.floor(Math.random() * 3),
              replies: email.replies || Math.floor(Math.random() * 2),
              body: email.body || email.content || '',
              recipient_name: email.recipient_name || email.name || 'Unknown',
              recipient_company: email.recipient_company || email.company || 'Unknown Company',
              campaign_id: email.campaign_id || 'default',
              performance_score: Math.floor(Math.random() * 40) + 60,
              // Store raw data for template replacement
              _raw_subject: email.subject,
              _raw_body: email.body || email.content || ''
            }
            
            // Then replace template variables in the processed data
            emailData.subject = replaceTemplateVariables(emailData._raw_subject || '', emailData)
            emailData.body = replaceTemplateVariables(emailData._raw_body || '', emailData)
            
            return emailData
          })
          
          setEmails(processedEmails)
        }
      }
    } catch (error) {
      console.error('Failed to fetch email campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle popup decisions
  const handlePopupDecision = async (decision) => {
    if (!popupData) return
    
    try {
      const response = await fetch('/api/workflow/user-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision,
          campaignId: popupData.campaignId
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ User decision sent:', result)
        
        if (decision === 'edit') {
          // Redirect to email editor
          window.location.href = '/email-editor'
        } else {
          toast.success('Campaign continuing with current emails')
        }
      } else {
        toast.error('Failed to process decision')
      }
    } catch (error) {
      console.error('Error sending decision:', error)
      toast.error('Error processing decision')
    }
    
    // Close popup
    setShowEditorPopup(false)
    setPopupData(null)
  }

  const filteredEmails = emails.filter(email => {
    const matchesSearch = !searchTerm || 
      email.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.recipient_company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !selectedStatus || email.status === selectedStatus
    const matchesTemplate = !selectedTemplate || email.template_used === selectedTemplate
    
    return matchesSearch && matchesStatus && matchesTemplate
  })

  const sortedEmails = [...filteredEmails].sort((a, b) => {
    let aVal, bVal
    switch (sortBy) {
      case 'subject':
        aVal = a.subject || ''
        bVal = b.subject || ''
        break
      case 'recipient':
        aVal = a.recipient_name || ''
        bVal = b.recipient_name || ''
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      delivered: { bg: 'bg-blue-100', text: 'text-blue-800', icon: EnvelopeIconSolid },
      opened: { bg: 'bg-purple-100', text: 'text-purple-800', icon: EnvelopeOpenIcon },
      clicked: { bg: 'bg-orange-100', text: 'text-orange-800', icon: CursorArrowRaysIcon },
      replied: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: StarIconSolid },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon }
    }
    
    const config = statusConfig[status] || statusConfig.sent
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const getPerformanceScore = (email) => {
    const score = email.performance_score || 0
    const scoreClass = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
    return <span className={`font-semibold ${scoreClass}`}>{score}%</span>
  }

  const uniqueStatuses = [...new Set(emails.map(e => e.status).filter(Boolean))]
  const uniqueTemplates = [...new Set(emails.map(e => e.template_used).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-gray-600">Loading email campaigns...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Campaign</h1>
          <p className="mt-2 text-gray-600">Track email performance with Hunter.io-style analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchEmailCampaigns}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Emails</p>
              <p className="text-3xl font-bold">{emails.length}</p>
            </div>
            <EnvelopeIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Delivered</p>
              <p className="text-3xl font-bold">
                {emails.filter(e => ['sent', 'delivered', 'opened', 'clicked', 'replied'].includes(e.status)).length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Opened</p>
              <p className="text-3xl font-bold">
                {emails.reduce((acc, email) => acc + (email.opens || 0), 0)}
              </p>
            </div>
            <EnvelopeOpenIcon className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Clicked</p>
              <p className="text-3xl font-bold">
                {emails.reduce((acc, email) => acc + (email.clicks || 0), 0)}
              </p>
            </div>
            <CursorArrowRaysIcon className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Avg Performance</p>
              <p className="text-3xl font-bold">
                {emails.length > 0 ? Math.round(emails.reduce((acc, e) => acc + (e.performance_score || 0), 0) / emails.length) : 0}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search emails..."
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</option>
            ))}
          </select>
          
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Templates</option>
            {uniqueTemplates.map(template => (
              <option key={template} value={template}>{template?.replace('_', ' ')}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="sent_at">Sort by Date</option>
            <option value="subject">Sort by Subject</option>
            <option value="recipient">Sort by Recipient</option>
            <option value="opens">Sort by Opens</option>
            <option value="performance">Sort by Performance</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-400 hover:text-gray-600 p-2"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <span className="text-sm text-gray-600">
              {sortedEmails.length} of {emails.length}
            </span>
          </div>
        </div>
      </div>

      {/* Hunter.io Style Two-Column Layout */}
      <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-24rem)]">
        {/* Left Column - Email List */}
        <div className="col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {sortedEmails.length} emails
                </span>
              </div>
            </div>
            <div className="overflow-y-auto h-full">
              <EmailCampaignList
                emails={sortedEmails}
                selectedEmail={selectedEmail}
                onSelectEmail={setSelectedEmail}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Email Detail */}
        <div className="col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <EmailDetailView
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Hunter.io Style Email List Component
function EmailCampaignList({ emails, selectedEmail, onSelectEmail }) {
  if (emails.length === 0) {
    return (
      <div className="p-8 text-center">
        <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">No emails found</h3>
        <p className="text-sm text-gray-500">Start a campaign to see your sent emails here</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {emails.map((email) => {
        const isSelected = selectedEmail?.id === email.id
        return (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {email.status === 'replied' ? (
                  <StarIconSolid className="w-5 h-5 text-emerald-500" />
                ) : email.status === 'opened' ? (
                  <EnvelopeOpenIcon className="w-5 h-5 text-purple-500" />
                ) : email.status === 'clicked' ? (
                  <CursorArrowRaysIcon className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
              </div>

              {/* Email Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {email.recipient_name || 'Unknown'}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(email.sent_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-blue-600 truncate font-mono">
                  {email.to}
                </p>
                <p className="text-sm text-gray-700 truncate font-medium mt-1">
                  {replaceTemplateVariables(email.subject, email)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{email.recipient_company}</span>
                    <span>•</span>
                    <span>{email.template_used?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    {email.opens > 0 && (
                      <span className="flex items-center">
                        <EyeIcon className="w-3 h-3 mr-1" />
                        {email.opens}
                      </span>
                    )}
                    {email.clicks > 0 && (
                      <span className="flex items-center ml-2">
                        <CursorArrowRaysIcon className="w-3 h-3 mr-1" />
                        {email.clicks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Email Detail View Component
function EmailDetailView({ email, onClose }) {
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email</h3>
          <p className="text-gray-600">Click on any email to see detailed analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Email Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">{email.recipient_name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                email.status === 'replied' ? 'bg-emerald-100 text-emerald-800' :
                email.status === 'opened' ? 'bg-purple-100 text-purple-800' :
                email.status === 'clicked' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {email.status?.charAt(0).toUpperCase() + email.status?.slice(1)}
              </span>
            </div>
            <p className="text-blue-600 font-mono text-sm">{email.to}</p>
            <p className="text-gray-600 text-sm">{email.recipient_company}</p>
            <p className="text-gray-900 font-medium mt-2">{replaceTemplateVariables(email.subject, email)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date(email.sent_at).toLocaleString()}
            </p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              {Math.floor((email.performance_score || 0))}% Score
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2">
              <EyeIcon className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.opens || 0}</p>
            <p className="text-xs text-gray-500">Opens</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-2">
              <CursorArrowRaysIcon className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.clicks || 0}</p>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg mx-auto mb-2">
              <StarIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{email.replies || 0}</p>
            <p className="text-xs text-gray-500">Replies</p>
          </div>
        </div>
      </div>

      {/* Email Content - Enhanced Fancy UI */}
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
              SENT
            </span>
          </div>
        </div>
        
        {/* Fancy Email Preview with Premium Styling */}
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
                    📧 {email.recipient_email || 'recipient@example.com'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Email Subject Line */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {(email.sender_name || 'AI')?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">
                    {replaceTemplateVariables(email.subject, email) || 'Strategic Partnership Opportunity'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    From: <span className="font-semibold">{email.sender_name || 'AI Marketing'}</span> 
                    &lt;{email.sender_email || 'ai@company.com'}&gt;
                  </p>
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
              <div className="min-h-96 overflow-visible">
                <div 
                  className="w-full p-6"
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: email.body ? 
                      // COMPREHENSIVE FIX: Clean, replace template variables, and properly scale the HTML content
                      `<style>
                        .email-content * { 
                          transform: none !important; 
                          scale: none !important;
                          max-width: 100% !important;
                          width: auto !important;
                          height: auto !important;
                          min-height: auto !important;
                          font-size: 16px !important;
                          line-height: 1.6 !important;
                          margin: 8px 0 !important;
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
                          display: block !important; 
                          position: relative !important; 
                        }
                      </style>
                      <div class="email-content">` +
                      replaceTemplateVariables(email.body, email)
                        .replace(/transform:\s*[^;]+;?/gi, '') // Remove transform CSS
                        .replace(/scale\([^)]+\)/gi, '') // Remove scale functions  
                        .replace(/width:\s*\d+px/gi, 'width: 100%') // Make responsive
                        .replace(/max-width:\s*\d+px/gi, 'max-width: 100%') // Make responsive
                        .replace(/height:\s*\d+px/gi, 'min-height: auto') // Remove fixed heights
                        .replace(/font-size:\s*\d+px/gi, 'font-size: 16px') // Normalize font size
                      + '</div>'
                      : '<p class="text-gray-500 italic">No content available</p>' 
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
      </div>

      {/* Email Editor Popup */}
      {showEditorPopup && popupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {popupData.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {popupData.message}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>Prospect:</strong> {popupData.prospectName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Company:</strong> {popupData.prospectCompany}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total Prospects:</strong> {popupData.totalProspects}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handlePopupDecision('edit')}
                className="flex-1 px-4 py-2 bg-[#00f5a0] text-black rounded-lg font-medium hover:bg-[#00e090] transition-colors"
              >
                {popupData.actions?.edit?.label || 'Review & Edit'}
              </button>
              <button
                onClick={() => handlePopupDecision('continue')}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                {popupData.actions?.continue?.label || 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}