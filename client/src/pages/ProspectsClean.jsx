import { useState, useEffect } from 'react'
import JobRightLayout from '../components/JobRightLayout'

const ProspectsPage = () => {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    fetchProspects(true)

    // 🔥 FIX: Poll for new prospects every 5 seconds
    const pollInterval = setInterval(() => {
      fetchProspects(false)
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [])

  const fetchProspects = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      const response = await fetch('/api/workflow/results')
      const data = await response.json()
      
      if (data.success && data.data?.prospects) {
        setProspects(data.data.prospects)
      } else {
        // 生成示例数据
        const sampleProspects = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@stripe.com',
            company: 'Stripe',
            position: 'Full Stack Engineer, Payments and Risk',
            confidence: 47,
            created_at: new Date().toISOString(),
            source: 'website_scraping'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@ringcentral.com',
            company: 'RingCentral',
            position: 'Solutions Software Developer',
            confidence: 49,
            created_at: new Date().toISOString(),
            source: 'search_preview'
          },
          {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike@epsilon.com',
            company: 'Epsilon',
            position: 'New Grad Program - Associate, Software',
            confidence: 80,
            created_at: new Date().toISOString(),
            source: 'ai_found'
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            email: 'sarah@techcorp.com',
            company: 'TechCorp',
            position: 'Senior Backend Engineer',
            confidence: 75,
            created_at: new Date().toISOString(),
            source: 'website_scraping'
          },
          {
            id: 5,
            name: 'David Brown',
            email: 'david@startup.com',
            company: 'StartupCo',
            position: 'Frontend Developer',
            confidence: 60,
            created_at: new Date().toISOString(),
            source: 'search_preview'
          },
          {
            id: 6,
            name: 'Lisa Chen',
            email: 'lisa@bigtech.com',
            company: 'BigTech',
            position: 'Product Manager',
            confidence: 85,
            created_at: new Date().toISOString(),
            source: 'ai_found'
          }
        ]
        setProspects(sampleProspects)
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
      // 设置示例数据作为后备
      const sampleProspects = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@stripe.com',
          company: 'Stripe',
          position: 'Full Stack Engineer, Payments and Risk',
          confidence: 47,
          created_at: new Date().toISOString(),
          source: 'website_scraping'
        }
      ]
      setProspects(sampleProspects)
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