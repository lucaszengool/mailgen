const express = require('express');
const router = express.Router();

/**
 * POST /api/prospects/search
 * Simple prospect search endpoint for frontend components
 *
 * Accepts:
 * - query: search query string
 * - limit: number of prospects to return (default 10)
 * - websiteAnalysis: optional website analysis data
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10, websiteAnalysis } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        prospects: []
      });
    }

    console.log(`🔍 Searching for prospects with query: "${query}"`);

    // Get the LangGraph agent
    const agent = req.app.locals.langGraphAgent;

    if (!agent) {
      console.error('❌ LangGraph agent not available');
      return res.status(503).json({
        success: false,
        error: 'Prospect search service not available',
        prospects: []
      });
    }

    // Build a simple strategy object from the query
    const strategy = {
      company_name: websiteAnalysis?.business_name || 'User Business',
      target_audience: {
        description: query,
        search_keywords: [query],
        personas: [{
          type: query,
          characteristics: []
        }]
      },
      pain_points: [],
      value_proposition: ''
    };

    // Search for prospects using the LangGraph agent
    const prospects = await agent.executeProspectSearchWithLearning(strategy, 'simple_frontend_search');

    console.log(`✅ Found ${prospects?.length || 0} prospects`);

    res.json({
      success: true,
      prospects: Array.isArray(prospects) ? prospects.slice(0, limit) : [],
      query: query,
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
