const express = require('express');
const router = express.Router();

/**
 * POST /api/prospects/search
 * Fast prospect search endpoint for frontend components
 * Returns mock data immediately for better UX
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

    console.log(`🔍 Fast prospect search for query: "${query}" (limit: ${limit})`);

    // Generate realistic mock prospects based on the query
    const mockProspects = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.com',
        company: 'TechCorp Industries',
        role: 'VP of Operations',
        title: 'VP of Operations',
        location: 'San Francisco, CA',
        score: 95,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'Michael Rodriguez',
        email: 'm.rodriguez@innovateai.com',
        company: 'InnovateAI Solutions',
        role: 'Chief Technology Officer',
        title: 'Chief Technology Officer',
        location: 'Austin, TX',
        score: 92,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'Emily Thompson',
        email: 'emily.t@futuresystems.io',
        company: 'Future Systems Inc',
        role: 'Director of Product',
        title: 'Director of Product',
        location: 'Seattle, WA',
        score: 90,
        source: 'company_website',
        verified: true
      },
      {
        name: 'David Kim',
        email: 'david.kim@cloudscale.com',
        company: 'CloudScale Technologies',
        role: 'VP of Engineering',
        title: 'VP of Engineering',
        location: 'New York, NY',
        score: 88,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'Jennifer Martinez',
        email: 'jen.martinez@datawise.com',
        company: 'DataWise Analytics',
        role: 'Head of Business Development',
        title: 'Head of Business Development',
        location: 'Boston, MA',
        score: 87,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'Robert Lee',
        email: 'r.lee@smartflow.io',
        company: 'SmartFlow Systems',
        role: 'Chief Operating Officer',
        title: 'Chief Operating Officer',
        location: 'Chicago, IL',
        score: 85,
        source: 'company_website',
        verified: true
      },
      {
        name: 'Lisa Anderson',
        email: 'l.anderson@nexustech.com',
        company: 'Nexus Technologies',
        role: 'VP of Sales',
        title: 'VP of Sales',
        location: 'Los Angeles, CA',
        score: 84,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'James Wilson',
        email: 'james.w@alphaventures.com',
        company: 'Alpha Ventures',
        role: 'Managing Director',
        title: 'Managing Director',
        location: 'Miami, FL',
        score: 82,
        source: 'linkedin',
        verified: true
      },
      {
        name: 'Amanda Foster',
        email: 'amanda.foster@brightpath.io',
        company: 'BrightPath Solutions',
        role: 'Head of Strategy',
        title: 'Head of Strategy',
        location: 'Denver, CO',
        score: 80,
        source: 'company_website',
        verified: true
      },
      {
        name: 'Christopher Taylor',
        email: 'c.taylor@visionlabs.com',
        company: 'Vision Labs Inc',
        role: 'VP of Innovation',
        title: 'VP of Innovation',
        location: 'Portland, OR',
        score: 78,
        source: 'linkedin',
        verified: true
      }
    ];

    // Return only the requested number of prospects
    const prospects = mockProspects.slice(0, Math.min(limit, 10));

    console.log(`✅ Returning ${prospects.length} mock prospects`);

    res.json({
      success: true,
      prospects: prospects,
      query: query,
      isMockData: true,
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
