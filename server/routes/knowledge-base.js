const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const SmartBusinessAnalyzer = require('../agents/SmartBusinessAnalyzer');

// Get all knowledge base entries
router.get('/', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const entries = await knowledgeBase.getAllLeads();
    
    res.json(entries);
  } catch (error) {
    console.error('Failed to get knowledge base entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get knowledge base statistics
router.get('/stats', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    
    // Get simple statistics using available methods
    try {
      const leads = await knowledgeBase.getAllLeads();
      const stats = {
        totalLeads: leads.length,
        totalProspects: leads.length, // Alias for frontend compatibility
        leadsByStatus: leads.reduce((acc, lead) => {
          const status = lead.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        recentLeads: leads.slice(0, 5)
      };
      res.json(stats);
    } catch (dbError) {
      // Fallback to basic stats if database operations fail
      res.json({
        totalLeads: 0,
        totalProspects: 0,
        leadsByStatus: {},
        recentLeads: [],
        message: 'Knowledge base is initializing'
      });
    }
  } catch (error) {
    console.error('Failed to get knowledge base stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get prospect count specifically for dashboard
router.get('/prospects/count', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const leads = await knowledgeBase.getAllLeads();
    
    res.json({
      success: true,
      count: leads.length,
      message: `Found ${leads.length} prospects in knowledge base`
    });
  } catch (error) {
    console.error('Failed to get prospect count:', error);
    res.json({
      success: false,
      count: 0,
      error: error.message
    });
  }
});

// Get analysis for a specific website
router.get('/websites/:url/analysis', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const url = decodeURIComponent(req.params.url);
    
    const analysis = await knowledgeBase.getWebsiteAnalysis(url);
    
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Failed to get website analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sender information for a website
router.get('/websites/:url/sender-info', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const url = decodeURIComponent(req.params.url);
    
    const senderInfo = await knowledgeBase.getSenderInfo(url);
    
    if (!senderInfo) {
      return res.status(404).json({ success: false, error: 'Sender info not found' });
    }

    res.json(senderInfo);
  } catch (error) {
    console.error('Failed to get sender info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Force re-analyze a website
router.post('/websites/reanalyze', async (req, res) => {
  try {
    const { url, campaignGoal } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const analyzer = new SmartBusinessAnalyzer();
    const knowledgeBase = new KnowledgeBase();
    
    // Delete existing analysis
    await knowledgeBase.deleteWebsiteAnalysis(url);
    
    // Perform new analysis
    const analysis = await analyzer.analyzeTargetBusiness(url, campaignGoal || 'partnership');
    
    res.json({
      success: true,
      message: 'Website re-analyzed successfully',
      analysis: analysis
    });
  } catch (error) {
    console.error('Failed to re-analyze website:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update knowledge base entry
router.put('/websites/:id', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    await knowledgeBase.updateWebsite(req.params.id, req.body);
    
    res.json({ success: true, message: 'Website updated successfully' });
  } catch (error) {
    console.error('Failed to update website:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete knowledge base entry
router.delete('/websites/:id', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    await knowledgeBase.deleteWebsite(req.params.id);
    
    res.json({ success: true, message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Failed to delete website:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get learning insights
router.get('/insights', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    
    // Get websites and prospects for insights
    const websites = await knowledgeBase.getAllWebsites();
    const prospects = await knowledgeBase.getProspects();
    
    // Generate insights
    const insights = {
      industryPerformance: analyzeIndustryPerformance(websites, prospects),
      senderNameEffectiveness: analyzeSenderNames(websites, prospects),
      campaignGoalSuccess: analyzeCampaignGoals(websites, prospects),
      bestPractices: generateBestPractices(websites, prospects),
      recommendations: generateRecommendations(websites, prospects)
    };

    res.json(insights);
  } catch (error) {
    console.error('Failed to get insights:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export knowledge base
router.get('/export', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const websites = await knowledgeBase.getAllWebsites();
    const prospects = await knowledgeBase.getProspects();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalWebsites: websites.length,
      totalProspects: prospects.length,
      websites,
      prospects
    };

    res.json(exportData);
  } catch (error) {
    console.error('Failed to export knowledge base:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function getTopIndustries(websites) {
  const industryCount = websites.reduce((acc, website) => {
    const industry = website.industry || 'unknown';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(industryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([industry, count]) => ({ industry, count }));
}

function getRecentActivity(websites, prospects) {
  const recentWebsites = websites
    .filter(w => w.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);
  
  const recentProspects = prospects
    .filter(p => p.last_contact)
    .sort((a, b) => new Date(b.last_contact) - new Date(a.last_contact))
    .slice(0, 5);

  return {
    recentAnalyzes: recentWebsites.map(w => ({
      company: w.company_name || w.title,
      industry: w.industry,
      date: w.updated_at
    })),
    recentContacts: recentProspects.map(p => ({
      company: p.company,
      email: p.email,
      date: p.last_contact
    }))
  };
}

function analyzeIndustryPerformance(websites, prospects) {
  // Analyze which industries perform best
  const industryPerformance = {};
  
  prospects.forEach(prospect => {
    const industry = prospect.industry || 'unknown';
    if (!industryPerformance[industry]) {
      industryPerformance[industry] = {
        total: 0,
        converted: 0,
        avgConversion: 0,
        avgResponseRate: 0
      };
    }
    
    industryPerformance[industry].total++;
    if (prospect.status === 'converted') {
      industryPerformance[industry].converted++;
    }
  });

  // Calculate averages
  Object.keys(industryPerformance).forEach(industry => {
    const data = industryPerformance[industry];
    data.avgConversion = data.total > 0 ? (data.converted / data.total) * 100 : 0;
  });

  return industryPerformance;
}

function analyzeSenderNames(websites, prospects) {
  // Analyze effectiveness of different sender names
  const senderPerformance = {};
  
  websites.forEach(website => {
    if (website.sender_name) {
      const relatedProspects = prospects.filter(p => p.campaign_goal === website.campaign_goal);
      const converted = relatedProspects.filter(p => p.status === 'converted').length;
      
      senderPerformance[website.sender_name] = {
        campaigns: (senderPerformance[website.sender_name]?.campaigns || 0) + 1,
        conversions: converted,
        industry: website.industry
      };
    }
  });

  return senderPerformance;
}

function analyzeCampaignGoals(websites, prospects) {
  // Analyze which campaign goals work best
  const goalPerformance = {};
  
  websites.forEach(website => {
    const goal = website.campaign_goal || 'unknown';
    const relatedProspects = prospects.filter(p => p.campaign_goal === goal);
    
    goalPerformance[goal] = {
      websites: (goalPerformance[goal]?.websites || 0) + 1,
      prospects: relatedProspects.length,
      converted: relatedProspects.filter(p => p.status === 'converted').length
    };
  });

  return goalPerformance;
}

function generateBestPractices(websites, prospects) {
  const practices = [];
  
  // Find highest performing sender names
  const topSenders = analyzeSenderNames(websites, prospects);
  const bestSender = Object.entries(topSenders)
    .sort(([,a], [,b]) => b.conversions - a.conversions)[0];
  
  if (bestSender) {
    practices.push({
      type: 'sender_name',
      recommendation: `Use sender names like "${bestSender[0]}" which showed highest conversion`,
      impact: 'High'
    });
  }

  // Find best performing industries
  const industryPerf = analyzeIndustryPerformance(websites, prospects);
  const bestIndustry = Object.entries(industryPerf)
    .sort(([,a], [,b]) => b.avgConversion - a.avgConversion)[0];
  
  if (bestIndustry) {
    practices.push({
      type: 'industry_focus',
      recommendation: `Focus more on ${bestIndustry[0]} industry (${bestIndustry[1].avgConversion.toFixed(1)}% conversion rate)`,
      impact: 'Medium'
    });
  }

  return practices;
}

function generateRecommendations(websites, prospects) {
  const recommendations = [];
  
  // Recommendation based on data volume
  if (websites.length < 10) {
    recommendations.push({
      type: 'data_collection',
      message: 'Analyze more websites to improve AI insights',
      priority: 'High'
    });
  }

  // Recommendation based on conversion rates
  const avgConversion = prospects.length > 0 
    ? prospects.filter(p => p.status === 'converted').length / prospects.length * 100
    : 0;
  
  if (avgConversion < 10) {
    recommendations.push({
      type: 'strategy_optimization',
      message: 'Consider refining email templates and targeting strategy',
      priority: 'High'
    });
  }

  return recommendations;
}

module.exports = router;