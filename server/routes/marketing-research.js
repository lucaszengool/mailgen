const express = require('express');
const router = express.Router();

// Marketing Research Routes
module.exports = (marketingResearchAgent) => {
  
  // Start continuous marketing research
  router.post('/start', async (req, res) => {
    try {
      const { industries, keywords, competitors, cycleInterval } = req.body;
      
      const researchConfig = {
        industries: industries || ['technology', 'AI', 'fintech'],
        keywords: keywords || ['market trends', 'industry news', 'competitive analysis'],
        competitors: competitors || [],
        cycleInterval: cycleInterval || 30000
      };

      const result = await marketingResearchAgent.startContinuousResearch(researchConfig);
      
      res.json({
        success: result.success,
        message: result.message,
        config: researchConfig,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Start marketing research error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  });

  // Pause marketing research
  router.post('/pause', async (req, res) => {
    try {
      const result = await marketingResearchAgent.pauseResearch();
      
      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Pause marketing research error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Resume marketing research
  router.post('/resume', async (req, res) => {
    try {
      const result = await marketingResearchAgent.resumeResearch();
      
      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Resume marketing research error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Stop marketing research
  router.post('/stop', async (req, res) => {
    try {
      const result = await marketingResearchAgent.stopResearch();
      
      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Stop marketing research error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get research status
  router.get('/status', async (req, res) => {
    try {
      const status = marketingResearchAgent.getStatus();
      
      res.json({
        success: true,
        status,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get research status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get latest insights
  router.get('/insights', async (req, res) => {
    try {
      const insights = marketingResearchAgent.getLatestInsights();
      
      res.json({
        success: true,
        insights,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get research data for integration with other processes
  router.get('/data', async (req, res) => {
    try {
      const data = marketingResearchAgent.getResearchDataForIntegration();
      
      res.json({
        success: true,
        data,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get research data error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get market trends
  router.get('/trends', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const allTrends = Array.from(marketingResearchAgent.state.marketTrends.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        trends: allTrends,
        total: marketingResearchAgent.state.marketTrends.size,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get market trends error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get competitor insights
  router.get('/competitors', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const allCompetitors = Array.from(marketingResearchAgent.state.competitorInsights.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        competitors: allCompetitors,
        total: marketingResearchAgent.state.competitorInsights.size,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get competitor insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get industry news analysis
  router.get('/news', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const allNews = Array.from(marketingResearchAgent.state.newsAnalysis.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        news: allNews,
        total: marketingResearchAgent.state.newsAnalysis.size,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get industry news error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get industry reports
  router.get('/reports', async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const allReports = Array.from(marketingResearchAgent.state.industryReports.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));
      
      res.json({
        success: true,
        reports: allReports,
        total: marketingResearchAgent.state.industryReports.size,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get industry reports error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Clean up old data
  router.post('/cleanup', async (req, res) => {
    try {
      marketingResearchAgent.cleanupOldData();
      
      res.json({
        success: true,
        message: 'Old data cleaned up successfully',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get research metrics
  router.get('/metrics', async (req, res) => {
    try {
      const status = marketingResearchAgent.getStatus();
      
      res.json({
        success: true,
        metrics: {
          ...status.metrics,
          dataPoints: status.dataPoints,
          isRunning: status.isRunning,
          isPaused: status.isPaused,
          lastUpdate: status.lastUpdate
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Get metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};