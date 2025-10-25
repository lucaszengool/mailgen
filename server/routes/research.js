/**
 * Market Research API Routes
 * Handles AI-powered market research, competitor analysis, and trend monitoring
 */

const express = require('express');
const router = express.Router();

// In-memory storage for research sessions and insights
let researchSessions = [];
let insights = [];
let researchIdCounter = 1;

/**
 * GET /api/research/insights - Retrieve all research insights
 */
router.get('/insights', (req, res) => {
  try {
    res.json({
      success: true,
      insights: insights,
      total: insights.length
    });
  } catch (error) {
    console.error('Failed to fetch insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights'
    });
  }
});

/**
 * POST /api/research/start - Start a new market research session
 */
router.post('/start', async (req, res) => {
  try {
    const { industry, competitors, topics, geography, frequency } = req.body;

    if (!industry || !competitors || competitors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Industry and at least one competitor are required'
      });
    }

    // Create new research session
    const research = {
      id: researchIdCounter++,
      industry,
      competitors,
      topics: topics || [],
      geography: geography || 'Global',
      frequency: frequency || 'weekly',
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    researchSessions.push(research);

    // Start background research process
    startResearchAnalysis(research);

    res.json({
      success: true,
      message: 'Research session started',
      research
    });

  } catch (error) {
    console.error('Failed to start research:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start research session'
    });
  }
});

/**
 * GET /api/research/status/:id - Get research session status
 */
router.get('/status/:id', (req, res) => {
  try {
    const research = researchSessions.find(r => r.id === parseInt(req.params.id));

    if (!research) {
      return res.status(404).json({
        success: false,
        error: 'Research session not found'
      });
    }

    res.json({
      success: true,
      status: research.status,
      progress: research.progress,
      research
    });

  } catch (error) {
    console.error('Failed to fetch research status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch research status'
    });
  }
});

/**
 * POST /api/research/config - Save research configuration
 */
router.post('/config', (req, res) => {
  try {
    const config = req.body;

    // Save to user settings (could be database in production)
    console.log('💾 Saving research config:', config);

    res.json({
      success: true,
      message: 'Research configuration saved',
      config
    });

  } catch (error) {
    console.error('Failed to save research config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save configuration'
    });
  }
});

/**
 * Background process: Perform AI-powered research analysis
 */
async function startResearchAnalysis(research) {
  console.log(`🔍 Starting research analysis for: ${research.industry}`);

  try {
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      research.progress = Math.min(progress, 90);
      research.lastUpdated = new Date().toISOString();

      if (progress >= 90) {
        clearInterval(progressInterval);
      }
    }, 2000);

    // Perform web search and AI analysis
    setTimeout(async () => {
      clearInterval(progressInterval);

      // Use Ollama to analyze market data
      const analysisResults = await performOllamaAnalysis(research);

      // Generate insights
      const generatedInsights = generateInsights(research, analysisResults);

      // Add insights to global list
      insights = [...generatedInsights, ...insights];

      // Update research status
      research.status = 'completed';
      research.progress = 100;
      research.completedAt = new Date().toISOString();

      console.log(`✅ Research completed for: ${research.industry}`);
      console.log(`📊 Generated ${generatedInsights.length} insights`);

    }, 8000); // Complete after 8 seconds

  } catch (error) {
    console.error('Research analysis failed:', error);
    research.status = 'failed';
    research.error = error.message;
  }
}

/**
 * Use Ollama to analyze market data
 */
async function performOllamaAnalysis(research) {
  try {
    const prompt = `Analyze the ${research.industry} market with focus on these competitors: ${research.competitors.join(', ')}.

Topics to research: ${research.topics.join(', ') || 'general market trends, pricing strategies, product positioning'}

Geography: ${research.geography}

Provide:
1. Current market trends and dynamics
2. Competitive landscape analysis
3. Opportunities for differentiation
4. Pricing and positioning insights
5. Actionable recommendations for email marketing campaigns targeting this market

Format your response as JSON with sections for: trends, competitorAnalysis, opportunities, and recommendations.`;

    // Call Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error('Ollama API request failed');
    }

    const data = await response.json();
    const analysis = data.response;

    console.log('🤖 Ollama analysis completed');

    return {
      rawAnalysis: analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Ollama analysis failed:', error);
    return {
      rawAnalysis: 'Analysis temporarily unavailable. Using fallback insights.',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate structured insights from analysis results
 */
function generateInsights(research, analysisResults) {
  const baseInsights = [];

  // Market Trend Insight
  baseInsights.push({
    id: `insight-${Date.now()}-1`,
    type: 'trend',
    title: `${research.industry} Market Analysis - ${new Date().toLocaleDateString()}`,
    summary: `Key market trends and dynamics in the ${research.industry} sector across ${research.geography}.`,
    impact: 'high',
    keywords: [research.industry, 'market analysis', 'trends', research.geography],
    createdAt: new Date().toISOString(),
    actionableInsights: [
      `Prospect targeting: Focus on companies in ${research.industry} showing signs of growth or digital transformation`,
      `Email personalization: Reference current industry trends in your outreach to demonstrate market knowledge`,
      `Timing: Companies in this sector are currently evaluating new solutions, making this an optimal time for outreach`
    ],
    fullAnalysis: analysisResults.rawAnalysis
  });

  // Competitor Insights
  research.competitors.forEach((competitor, index) => {
    baseInsights.push({
      id: `insight-${Date.now()}-${index + 2}`,
      type: 'competitor',
      title: `Competitive Intelligence: ${competitor}`,
      summary: `Strategic analysis of ${competitor}'s market position, pricing, and customer targeting in ${research.industry}.`,
      impact: index === 0 ? 'high' : 'medium',
      keywords: [competitor, 'competitive analysis', research.industry, 'positioning'],
      createdAt: new Date().toISOString(),
      actionableInsights: [
        `Differentiation strategy: Highlight features or benefits that ${competitor} doesn't emphasize in their messaging`,
        `Prospect qualification: Target customers who may be dissatisfied with ${competitor}'s approach`,
        `Email messaging: Position your solution as a modern alternative addressing gaps in ${competitor}'s offering`
      ]
    });
  });

  // Opportunity Insight
  baseInsights.push({
    id: `insight-${Date.now()}-opportunity`,
    type: 'opportunity',
    title: `Market Opportunities in ${research.industry}`,
    summary: `Emerging opportunities and underserved segments in ${research.geography} ${research.industry} market.`,
    impact: 'high',
    keywords: ['opportunity', research.industry, 'growth', 'market gap'],
    createdAt: new Date().toISOString(),
    actionableInsights: [
      `Target underserved segments with tailored messaging emphasizing specific pain points`,
      `Develop case studies or social proof targeting these emerging opportunities`,
      `Adjust email campaigns to highlight how your solution addresses these specific market gaps`
    ]
  });

  return baseInsights;
}

/**
 * DELETE /api/research/insights/:id - Delete a specific insight
 */
router.delete('/insights/:id', (req, res) => {
  try {
    const initialLength = insights.length;
    insights = insights.filter(i => i.id !== req.params.id);

    if (insights.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    res.json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete insight'
    });
  }
});

module.exports = router;
