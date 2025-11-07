const express = require('express');
const router = express.Router();
const EnhancedEmailSearchAgent = require('../agents/EnhancedEmailSearchAgent');

/**
 * POST /api/prospects/search
 * Real prospect search endpoint using SuperEmailDiscoveryEngine.py
 *
 * Accepts:
 * - query: search query string
 * - limit: number of prospects to return (default 7)
 * - websiteAnalysis: optional website analysis data
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 7, websiteAnalysis } = req.body;

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

    // Use EnhancedEmailSearchAgent for REAL prospect search
    const emailSearchAgent = new EnhancedEmailSearchAgent();

    // Search for real prospects using SuperEmailDiscoveryEngine.py
    console.log(`🚀 Calling SuperEmailDiscoveryEngine.py with industry: "${industry}" and limit: ${limit}`);
    const result = await emailSearchAgent.searchEmails(industry, limit);

    if (!result.success) {
      throw new Error(result.error || 'Email discovery failed');
    }

    const prospects = result.prospects || [];
    console.log(`✅ Found ${prospects.length} REAL prospects from SuperEmailDiscoveryEngine`);

    // Format prospects for frontend
    const formattedProspects = prospects.map((prospect, index) => ({
      name: prospect.name || `Prospect ${index + 1}`,
      email: prospect.email,
      company: prospect.company || 'Company',
      role: prospect.estimatedRole || prospect.role || 'Decision Maker',
      location: prospect.location || 'Unknown',
      score: Math.round((prospect.confidence || 0.8) * 100),
      source: prospect.source || 'search',
      sourceUrl: prospect.sourceUrl || '',
      verified: prospect.emailVerified || false,
      metadata: prospect.metadata || {}
    }));

    res.json({
      success: true,
      prospects: formattedProspects,
      query: query,
      industry: industry,
      targetAudience: targetAudience,
      isRealData: true,
      searchMethod: 'SuperEmailDiscoveryEngine',
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

module.exports = router;
