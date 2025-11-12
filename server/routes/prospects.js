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
      // Search for real prospects using SuperEmailDiscoveryEngine.py
      console.log(`🚀 Calling SuperEmailDiscoveryEngine.py with industry: "${industry}" and limit: ${limit}`);
      const result = await emailSearchAgent.searchEmails(industry, limit);

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
