const express = require('express');
const router = express.Router();
const EnhancedEmailSearchAgent = require('../agents/EnhancedEmailSearchAgent');
const db = require('../models/database');
const { optionalAuth } = require('../middleware/userContext');

/**
 * POST /api/prospects/search
 * Real prospect search endpoint using SuperEmailDiscoveryEngine.py (with SearxNG)
 *
 * Accepts:
 * - query: search query string
 * - limit: number of prospects to return (default 7)
 * - websiteAnalysis: optional website analysis data
 */
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const { query, limit = 7, websiteAnalysis, campaignId } = req.body;
    const userId = req.userId || 'anonymous';

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        prospects: []
      });
    }

    console.log(`🔍 REAL prospect search for query: "${query}" (limit: ${limit})`);
    console.log(`📊 Website analysis data:`, websiteAnalysis);

    // Extract industry and business info from website analysis
    const industry = websiteAnalysis?.productType || websiteAnalysis?.industry || query;
    const businessName = websiteAnalysis?.businessName || '';
    const targetAudience = websiteAnalysis?.audiences?.[0]?.title || query;
    const businessIntro = websiteAnalysis?.businessIntro || websiteAnalysis?.valueProposition || '';

    console.log(`🎯 Searching for prospects in: ${industry}`);
    console.log(`🎯 Target audience: ${targetAudience}`);
    console.log(`🌐 SearxNG URL: ${process.env.SEARXNG_URL || 'http://localhost:8080'}`);

    // Use SuperEmailDiscoveryEngine.py (uses SearxNG internally)
    const emailSearchAgent = new EnhancedEmailSearchAgent();

    let formattedProspects = [];
    let isRealData = false;
    let searchMethod = 'mock_fallback';

    try {
      // Search for real prospects using SuperEmailDiscoveryEngine.py with target audience context
      console.log(`🚀 Calling SuperEmailDiscoveryEngine.py with industry: "${industry}", target audience: "${targetAudience}", and limit: ${limit}`);

      // 🧹 SANITIZE search query - remove special characters like (), /, ?, etc.
      // Only keep letters, numbers, spaces, and hyphens for clean search
      const sanitizeQuery = (text) => {
        return text
          .replace(/[()\/\?!@#$%^&*+=\[\]{};:'",.<>\\|`~]/g, ' ') // Remove special chars
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .trim();
      };

      // 🔥 Build simple, clean search query - just use industry for initial quick search
      let enhancedSearchQuery = sanitizeQuery(industry);

      console.log(`✨ Sanitized search query: "${enhancedSearchQuery}"`);

      const result = await emailSearchAgent.searchEmails(enhancedSearchQuery, limit);

      console.log(`📊 Search result:`, { success: result.success, prospectsCount: result.prospects?.length || 0 });

      if (result.success && result.prospects && result.prospects.length > 0) {
        const prospects = result.prospects;
        console.log(`✅ Found ${prospects.length} REAL prospects from SuperEmailDiscoveryEngine`);

        // Format prospects for frontend
        formattedProspects = prospects.map((prospect, index) => ({
          name: prospect.name || `Prospect ${index + 1}`,
          email: prospect.email,
          company: prospect.company || 'Company',
          role: prospect.estimatedRole || prospect.role || 'Decision Maker',
          location: prospect.location || 'Unknown',
          score: Math.round((prospect.confidence || 0.8) * 100),
          source: prospect.source || 'searxng',
          sourceUrl: prospect.sourceUrl || '',
          verified: prospect.emailVerified || false,
          metadata: prospect.metadata || {}
        }));

        isRealData = true;
        searchMethod = 'SuperEmailDiscoveryEngine (SearxNG)';
      } else {
        console.warn(`⚠️ SuperEmailDiscoveryEngine returned no results, using fallback mock data`);
        console.warn(`⚠️ This may be due to SearxNG service issues or no emails found for: ${industry}`);
        formattedProspects = generateMockProspects(industry, targetAudience, businessName, limit);
      }
    } catch (searchError) {
      console.error(`❌ SuperEmailDiscoveryEngine search failed:`, searchError.message);
      console.error(`❌ Stack trace:`, searchError.stack);
      console.log(`🎭 Using fallback mock prospects for testing`);
      formattedProspects = generateMockProspects(industry, targetAudience, businessName, limit);
    }

    // 💾 Save prospects to database for persistence
    if (formattedProspects && formattedProspects.length > 0 && isRealData) {
      try {
        console.log(`💾 [User: ${userId}] Saving ${formattedProspects.length} prospects to database...`);

        let savedCount = 0;
        for (const prospect of formattedProspects) {
          try {
            await db.saveContact({
              email: prospect.email,
              name: prospect.name || 'Unknown',
              company: prospect.company || 'Unknown',
              position: prospect.role || 'Unknown',
              industry: industry,
              phone: '',
              address: prospect.location || '',
              source: prospect.source || searchMethod,
              tags: '',
              notes: `Found via ${searchMethod} on ${new Date().toLocaleString()}. Score: ${prospect.score}`
            }, userId, campaignId || 'default');
            savedCount++;
          } catch (saveError) {
            // Skip if already exists (UNIQUE constraint)
            if (!saveError.message.includes('UNIQUE constraint')) {
              console.error(`⚠️ Failed to save prospect ${prospect.email}:`, saveError.message);
            }
          }
        }

        console.log(`✅ [User: ${userId}] Successfully saved ${savedCount}/${formattedProspects.length} prospects to database`);
      } catch (error) {
        console.error(`❌ [User: ${userId}] Error saving prospects to database:`, error);
        // Don't fail the request if database save fails
      }
    }

    res.json({
      success: true,
      prospects: formattedProspects,
      query: query,
      industry: industry,
      targetAudience: targetAudience,
      isRealData: isRealData,
      searchMethod: searchMethod,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Prospect search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      prospects: []
    });
  }
});

/**
 * POST /api/prospects/batch-search
 * Start a background batch search for prospects
 */
router.post('/batch-search', optionalAuth, async (req, res) => {
  try {
    const { industry, region, keywords, campaignId } = req.body;
    const userId = req.userId || 'anonymous';

    if (!industry && !keywords) {
      return res.status(400).json({
        success: false,
        error: 'Industry or keywords required'
      });
    }

    console.log(`🚀 Starting batch prospect search for user: ${userId}, campaign: ${campaignId}`);
    console.log(`   Industry: ${industry}`);
    console.log(`   Region: ${region}`);
    console.log(`   Keywords: ${keywords}`);

    // Generate unique search ID
    const searchId = `batch_${Date.now()}_${userId}_${campaignId || 'default'}`;

    // Start background search (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`📦 [${searchId}] Starting background batch search...`);

        // Construct search query combining industry, region, and keywords
        let searchQuery = industry || keywords;
        if (region) {
          searchQuery += ` ${region}`;
        }
        if (keywords && industry !== keywords) {
          searchQuery += ` ${keywords}`;
        }

        console.log(`🔍 [${searchId}] Search query: "${searchQuery}"`);

        // Use EnhancedEmailSearchAgent to search for prospects
        const emailSearchAgent = new EnhancedEmailSearchAgent();
        const result = await emailSearchAgent.searchEmails(searchQuery, 50, campaignId);

        if (result.success && result.prospects && result.prospects.length > 0) {
          console.log(`✅ [${searchId}] Found ${result.prospects.length} prospects`);

          // Save prospects to database
          let savedCount = 0;
          for (const prospect of result.prospects) {
            try {
              await db.saveContact({
                email: prospect.email,
                name: prospect.name || 'Unknown',
                company: prospect.company || 'Unknown',
                position: prospect.role || prospect.estimatedRole || 'Unknown',
                industry: industry || 'Unknown',
                phone: '',
                address: region || prospect.location || '',
                source: `Batch Search: ${searchQuery}`,
                tags: keywords || '',
                notes: `Batch search on ${new Date().toLocaleString()}. Region: ${region || 'N/A'}`
              }, userId, campaignId || 'default');
              savedCount++;
            } catch (saveError) {
              // Skip if already exists
              if (!saveError.message.includes('UNIQUE constraint')) {
                console.error(`⚠️ [${searchId}] Failed to save prospect ${prospect.email}:`, saveError.message);
              }
            }
          }

          console.log(`✅ [${searchId}] Saved ${savedCount}/${result.prospects.length} prospects to database`);

          // Send WebSocket notification about completion
          const wsManager = require('../websocket/WorkflowWebSocketManager');
          wsManager.broadcastToWorkflow(campaignId || 'default', {
            type: 'batch_search_complete',
            data: {
              searchId,
              totalFound: savedCount,
              industry,
              region,
              keywords
            }
          });

          console.log(`🎉 [${searchId}] Batch search complete!`);
        } else {
          console.warn(`⚠️ [${searchId}] No prospects found`);

          // Send notification even if no results
          const wsManager = require('../websocket/WorkflowWebSocketManager');
          wsManager.broadcastToWorkflow(campaignId || 'default', {
            type: 'batch_search_complete',
            data: {
              searchId,
              totalFound: 0,
              industry,
              region,
              keywords
            }
          });
        }
      } catch (error) {
        console.error(`❌ [${searchId}] Background batch search failed:`, error);
      }
    });

    // Return immediately with searchId
    res.json({
      success: true,
      searchId,
      message: 'Batch search started in background'
    });

  } catch (error) {
    console.error('❌ Batch search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate mock prospects as fallback when real search fails
 */
function generateMockProspects(industry, targetAudience, businessName, limit = 7) {
  const mockCompanies = [
    { name: 'Tech Innovations Inc', domain: 'techinnovations.com', role: 'CEO' },
    { name: 'Digital Solutions Corp', domain: 'digitalsolutions.com', role: 'VP Marketing' },
    { name: 'Smart Systems LLC', domain: 'smartsystems.com', role: 'Director of Sales' },
    { name: 'Future Tech Group', domain: 'futuretech.com', role: 'Business Development Manager' },
    { name: 'Innovation Partners', domain: 'innovationpartners.com', role: 'Chief Technology Officer' },
    { name: 'Enterprise Solutions', domain: 'enterprisesolutions.com', role: 'Marketing Director' },
    { name: 'Growth Dynamics', domain: 'growthdynamics.com', role: 'VP of Operations' },
    { name: 'Strategic Ventures', domain: 'strategicventures.com', role: 'Founder' },
    { name: 'Market Leaders Co', domain: 'marketleaders.com', role: 'Head of Partnerships' },
    { name: 'Success Strategies', domain: 'successstrategies.com', role: 'Senior Manager' }
  ];

  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const mockProspects = [];

  for (let i = 0; i < Math.min(limit, mockCompanies.length); i++) {
    const company = mockCompanies[i];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];

    mockProspects.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`,
      company: company.name,
      role: company.role,
      location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Boston, MA', 'Seattle, WA'][i % 5],
      score: 75 + Math.floor(Math.random() * 20),
      source: 'mock_data',
      sourceUrl: `https://${company.domain}`,
      verified: true,
      metadata: {
        industry: industry,
        targetAudience: targetAudience,
        businessName: businessName,
        mockData: true
      }
    });
  }

  return mockProspects;
}

module.exports = router;
