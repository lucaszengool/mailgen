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

// Export basic knowledge base data
router.get('/export', async (req, res) => {
  try {
    const knowledgeBase = new KnowledgeBase();
    const leads = await knowledgeBase.getAllLeads();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLeads: leads.length,
      leads
    };

    res.json(exportData);
  } catch (error) {
    console.error('Failed to export knowledge base:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;