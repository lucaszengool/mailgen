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

      // If we're on the frontend Railway service, use the backend service for WebSocket
      if (window.location.host.includes('honest-hope') || window.location.host.includes('powerful-contentment')) {
        wsHost = 'mailgen-production.up.railway.app'
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

          // Handle prospect-related WebSocket messages
          if (data.type === 'prospect_batch_update' && data.data?.prospects) {
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
            console.log(`📊 ProspectsClean: Received ${data.data.prospects.length} prospects from data_update`)
            setProspects(prev => {
              const existingEmails = new Set(prev.map(p => p.email))
              const newProspects = data.data.prospects.filter(p => !existingEmails.has(p.email))
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

      // 🔥 CRITICAL FIX: Include campaignId in request to get correct prospects
      const currentCampaignId = localStorage.getItem('currentCampaignId')
      const url = currentCampaignId
        ? `/api/workflow/results?campaignId=${currentCampaignId}`
        : '/api/workflow/results'
      console.log(`📊 ProspectsClean: Fetching prospects for campaign: ${currentCampaignId || 'ALL'}`)

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data?.prospects && data.data.prospects.length > 0) {
        console.log(`✅ ProspectsClean: Found ${data.data.prospects.length} prospects from workflow results`)
        setProspects(data.data.prospects)
      } else {
        // 🔥 FIX: Try fetching from contacts database if workflow results are empty
        console.log('⚠️ ProspectsClean: No prospects in workflow results, trying database...')

        if (currentCampaignId) {
          try {
            const dbResponse = await fetch(`/api/contacts?status=active&limit=1000&campaignId=${currentCampaignId}`)
            const dbData = await dbResponse.json()

            if (dbData.success && dbData.data?.contacts && dbData.data.contacts.length > 0) {
              console.log(`✅ ProspectsClean: Found ${dbData.data.contacts.length} prospects from database`)
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
              setProspects(dbProspects)
              return // Found prospects in database, no need for sample data
            }
          } catch (dbError) {
            console.error('⚠️ ProspectsClean: Failed to fetch from database:', dbError)
          }
        }

        // 🔥 CRITICAL FIX: Don't overwrite existing prospects with sample data
        // Only show sample data if we have NO existing data
        setProspects(prev => {
          if (prev.length > 0) {
            console.log('📊 ProspectsClean: Keeping existing prospects (no new data)')
            return prev
          }
          console.log('📊 ProspectsClean: No existing prospects, showing empty state')
          return [] // Return empty instead of sample data
        })
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
      // 🔥 FIX: Don't overwrite existing prospects on error
      setProspects(prev => {
        if (prev.length > 0) {
          console.log('📊 ProspectsClean: Keeping existing prospects after error')
          return prev
        }
        return [] // Return empty on error
      })
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