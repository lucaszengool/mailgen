const express = require('express');
const router = express.Router();

/**
 * POST /api/prospects/search
 * Real prospect search endpoint using Ollama SearxNG
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

    // Get the Ollama SearxNG service
    const ollamaSearxngService = req.app.locals.ollamaSearxngEmailDiscovery;

    if (!ollamaSearxngService) {
      console.error('❌ Ollama SearxNG service not available');
      return res.status(503).json({
        success: false,
        error: 'Prospect search service not available',
        prospects: []
      });
    }

    // Extract industry and business info from website analysis
    const industry = websiteAnalysis?.productType || websiteAnalysis?.industry || '';
    const businessName = websiteAnalysis?.businessName || '';
    const targetAudience = websiteAnalysis?.audiences?.[0]?.title || query;
    const businessIntro = websiteAnalysis?.businessIntro || websiteAnalysis?.valueProposition || '';

    console.log(`🎯 Generating AI-powered search keywords for: ${industry} / ${targetAudience}`);

    // 🤖 Use Ollama to generate targeted search keywords based on website analysis
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const prompt = `Based on this business information, generate 3-5 short, specific search keywords to find potential customers/buyers:

Business: ${businessName}
Industry: ${industry}
Target Audience: ${targetAudience}
Value Proposition: ${businessIntro}

Generate ONLY short search keywords (2-4 words each), one per line. Focus on buyer types and decision makers in the ${industry} industry.

Examples for food technology:
- grocery store buyer
- produce manager contact
- food retail decision maker
- supermarket procurement

Generate similar keywords for this business:`;

    let searchKeywords = [];
    try {
      console.log('🤖 Calling Ollama to generate search keywords...');
      const ollamaCommand = `ollama run qwen2.5:0.5b "${prompt.replace(/"/g, '\\"')}"`;
      const { stdout } = await execAsync(ollamaCommand, { timeout: 10000 }); // 10 second timeout for fast response

      // Parse Ollama response to extract keywords
      searchKeywords = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 50 && !line.includes(':') && !line.includes('?'))
        .slice(0, 5); // Take top 5 keywords

      console.log(`✅ Generated ${searchKeywords.length} AI keywords:`, searchKeywords);
    } catch (error) {
      console.error('⚠️ Ollama keyword generation failed, using fallback:', error.message);
      // Fallback keywords if Ollama fails
      searchKeywords = [
        `${industry} buyer`,
        `${targetAudience} contact`,
        `${industry} decision maker`
      ];
    }

    // Use the first generated keyword for search (or combine multiple)
    const enhancedQuery = searchKeywords.length > 0
      ? searchKeywords[0]
      : `${industry} ${targetAudience} buyer`;

    console.log(`🎯 Using AI-generated search query: "${enhancedQuery}"`);

    // Search for REAL prospects using the Ollama SearxNG service
    console.log('🔍 Calling Ollama SearxNG service with AI-generated keywords...');
    const result = await ollamaSearxngService.discoverEmailsWithProfiles(industry || enhancedQuery, limit);

    if (!result.success) {
      throw new Error(result.error || 'Email discovery failed');
    }

    const prospects = result.prospects || [];
    console.log(`✅ Found ${prospects.length} REAL prospects from Ollama SearxNG`);

    res.json({
      success: true,
      prospects: prospects,
      query: query,
      aiGeneratedKeywords: searchKeywords,
      usedKeyword: enhancedQuery,
      industry: industry,
      isRealData: true,
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
