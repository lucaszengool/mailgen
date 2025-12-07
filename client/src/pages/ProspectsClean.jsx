import { useState, useEffect, useRef } from 'react'
import JobRightLayout from '../components/JobRightLayout'

const ProspectsPage = () => {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchProspects(true)
    connectWebSocket()

    // 🔥 FIX: Poll for new prospects every 5 seconds
    const pollInterval = setInterval(() => {
      fetchProspects(false)
    }, 5000)

    return () => {
      clearInterval(pollInterval)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // 🔥 CRITICAL: WebSocket for real-time prospect updates
  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      let wsHost = window.location.host

      // If we're on the frontend Railway service (or custom domain mailgen.org), use the backend service for WebSocket
      if (window.location.host.includes('honest-hope') ||
          window.location.host.includes('powerful-contentment') ||
          window.location.host.includes('mailgen.org')) {
        wsHost = 'honest-hope-production.up.railway.app'
      }

      const wsUrl = `${protocol}//${wsHost}/ws/workflow`
      console.log('🔌 ProspectsClean: Connecting to WebSocket:', wsUrl)

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ ProspectsClean: WebSocket connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // 🔒 CRITICAL: Get current campaign ID for validation
          const currentCampaignId = localStorage.getItem('currentCampaignId')

          // 🔒 Helper function to check campaign isolation
          const isSameCampaign = (msgCampaignId) => {
            if (!msgCampaignId || !currentCampaignId) return true // Allow if no campaign filter
            return msgCampaignId === currentCampaignId || msgCampaignId === String(currentCampaignId)
          }

          // Handle prospect-related WebSocket messages
          if (data.type === 'prospect_batch_update' && data.data?.prospects) {
            const batchCampaignId = data.data?.campaignId || data.campaignId
            if (!isSameCampaign(batchCampaignId)) {
              console.log(`🚫 ProspectsClean: Skipping batch from different campaign (${batchCampaignId} vs ${currentCampaignId})`)
              return
            }
            console.log(`📦 ProspectsClean: Received ${data.data.prospects.length} prospects from batch update`)
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email))
              const newProspects = data.data.prospects.filter(p => !existingEmails.has(p.email))
              if (newProspects.length > 0) {
                console.log(`➕ ProspectsClean: Adding ${newProspects.length} new prospects`)
                return [...prev, ...newProspects]
              }
              return prev
            })
          } else if (data.type === 'prospect_list' && data.prospects) {
            const listCampaignId = data.campaignId || data.data?.campaignId
            if (!isSameCampaign(listCampaignId)) {
              console.log(`🚫 ProspectsClean: Skipping list from different campaign (${listCampaignId} vs ${currentCampaignId})`)
              return
            }
            console.log(`📋 ProspectsClean: Received ${data.prospects.length} prospects from prospect_list`)
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email))
              const newProspects = data.prospects.filter(p => !existingEmails.has(p.email))
              if (newProspects.length > 0) {
                return [...prev, ...newProspects]
              }
              return prev
            })
          } else if (data.type === 'data_update' && data.data?.prospects) {
            const updateCampaignId = data.campaignId || data.data?.campaignId
            if (!isSameCampaign(updateCampaignId)) {
              console.log(`🚫 ProspectsClean: Skipping data_update from different campaign (${updateCampaignId} vs ${currentCampaignId})`)
              return
            }
            console.log(`📊 ProspectsClean: Received ${data.data.prospects.length} prospects from data_update`)
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email))
              const newProspects = data.data.prospects.filter(p => !existingEmails.has(p.email))
              if (newProspects.length > 0) {
                return [...prev, ...newProspects]
              }
              return prev
            })
          } else if (data.type === 'template_selection_required' && data.data?.sampleProspects) {
            const templateCampaignId = data.data?.campaignId || data.campaignId
            if (!isSameCampaign(templateCampaignId)) {
              console.log(`🚫 ProspectsClean: Skipping template_selection from different campaign`)
              return
            }
            // 🔥 NEW: Also handle template_selection_required which contains prospect samples
            console.log(`🎨 ProspectsClean: Received ${data.data.sampleProspects.length} sample prospects from template_selection_required`)
            console.log(`🎨 ProspectsClean: Total prospects found: ${data.data.prospectsFound || data.data.prospectsCount}`)

            // Trigger a fetch to get all prospects from the database
            fetchProspects(false)
          } else if (data.type === 'workflow_update' && data.stepData?.results?.prospects) {
            const workflowCampaignId = data.campaignId || data.stepData?.campaignId
            if (!isSameCampaign(workflowCampaignId)) {
              console.log(`🚫 ProspectsClean: Skipping workflow_update from different campaign`)
              return
            }
            // 🔥 NEW: Handle workflow_update with prospect results
            console.log(`🔄 ProspectsClean: Received ${data.stepData.results.prospects.length} prospects from workflow_update`)
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email))
              const newProspects = data.stepData.results.prospects.filter(p => !existingEmails.has(p.email))
              if (newProspects.length > 0) {
                return [...prev, ...newProspects]
              }
              return prev
            })
          }
        } catch (error) {
          console.error('❌ ProspectsClean: Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ ProspectsClean: WebSocket error:', error)
      }

      wsRef.current.onclose = () => {
        console.log('⚠️ ProspectsClean: WebSocket closed, reconnecting in 3s...')
        setTimeout(connectWebSocket, 3000)
      }
    } catch (error) {
      console.error('❌ ProspectsClean: Failed to connect WebSocket:', error)
    }
  }

  const fetchProspects = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }

      const currentCampaignId = localStorage.getItem('currentCampaignId')
      console.log(`📊 ProspectsClean: Fetching prospects for campaign: ${currentCampaignId || 'ALL'}`)

      // 🔥 CRITICAL FIX: Fetch from BOTH sources and merge results
      let allProspects = []

      // 1. First, try to get from contacts database (persistent storage)
      if (currentCampaignId) {
        try {
          const dbResponse = await fetch(`/api/contacts?status=active&limit=1000&campaignId=${currentCampaignId}`)
          const dbData = await dbResponse.json()

          if (dbData.success && dbData.data?.contacts && dbData.data.contacts.length > 0) {
            console.log(`✅ ProspectsClean: Found ${dbData.data.contacts.length} prospects from DATABASE`)
            const dbProspects = dbData.data.contacts.map(c => ({
              id: c.id || `contact_${c.email}`,
              email: c.email,
              name: c.name || 'Unknown',
              company: c.company || 'Unknown',
              position: c.position || 'Unknown',
              confidence: c.confidence || 75,
              created_at: c.created_at || new Date().toISOString(),
              source: c.source || 'Database'
            }))
            allProspects = [...dbProspects]
          }
        } catch (dbError) {
          console.error('⚠️ ProspectsClean: Failed to fetch from database:', dbError)
        }
      }

      // 2. Also try workflow results (in-memory/WebSocket state)
      try {
        const url = currentCampaignId
          ? `/api/workflow/results?campaignId=${currentCampaignId}`
          : '/api/workflow/results'

        const response = await fetch(url)
        const data = await response.json()

        if (data.success && data.data?.prospects && data.data.prospects.length > 0) {
          console.log(`✅ ProspectsClean: Found ${data.data.prospects.length} prospects from WORKFLOW`)

          // Merge with database results (avoid duplicates by email)
          const existingEmails = new Set(allProspects.map(p => p.email))
          const newProspects = data.data.prospects.filter(p => !existingEmails.has(p.email))

          if (newProspects.length > 0) {
            console.log(`➕ ProspectsClean: Adding ${newProspects.length} new prospects from workflow`)
            allProspects = [...allProspects, ...newProspects]
          }
        }
      } catch (workflowError) {
        console.error('⚠️ ProspectsClean: Failed to fetch from workflow:', workflowError)
      }

      // 3. Update state with combined results
      if (allProspects.length > 0) {
        console.log(`✅ ProspectsClean: Total ${allProspects.length} prospects loaded`)
        setProspects(allProspects)
      } else {
        // Keep existing prospects if we have them, otherwise show empty
        setProspects(prev => {
          if (prev.length > 0) {
            console.log('📊 ProspectsClean: Keeping existing prospects (no new data)')
            return prev
          }
          console.log('📊 ProspectsClean: No prospects found')
          return []
        })
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
      // Keep existing prospects on error
      setProspects(prev => prev.length > 0 ? prev : [])
    } finally {
      if (isInitialLoad) {
        setLoading(false)
        setInitialLoadComplete(true)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading prospects...</p>
        </div>
      </div>
    )
  }

  return <JobRightLayout prospects={prospects} />
}

export default ProspectsPage