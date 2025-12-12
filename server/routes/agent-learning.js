/**
 * Agent Learning API Routes
 * Endpoints for accessing agent learning data and insights
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

/**
 * GET /api/agent-learning/insights/:campaignId
 * Get comprehensive agent insights for a campaign
 */
router.get('/insights/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';

    const insights = await db.getAgentInsightsSummary(userId, campaignId);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('❌ Failed to get agent insights:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-learning/learnings/:campaignId
 * Get all learnings for a campaign
 */
router.get('/learnings/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { category, type, limit } = req.query;

    const learnings = await db.getAgentLearnings(userId, campaignId, {
      category,
      type,
      limit: limit ? parseInt(limit) : 100
    });

    res.json({ success: true, learnings });
  } catch (error) {
    console.error('❌ Failed to get agent learnings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-learning/metrics/:campaignId
 * Get performance metrics for a campaign
 */
router.get('/metrics/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { type, name, limit } = req.query;

    const metrics = await db.getAgentMetrics(userId, campaignId, {
      type,
      name,
      limit: limit ? parseInt(limit) : 50
    });

    res.json({ success: true, metrics });
  } catch (error) {
    console.error('❌ Failed to get agent metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-learning/decisions/:campaignId
 * Get decision log for a campaign
 */
router.get('/decisions/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { limit } = req.query;

    const decisions = await db.getAgentDecisions(
      userId,
      campaignId,
      limit ? parseInt(limit) : 50
    );

    res.json({ success: true, decisions });
  } catch (error) {
    console.error('❌ Failed to get agent decisions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agent-learning/all
 * Get all learnings across all campaigns for a user
 */
router.get('/all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { limit } = req.query;

    const learnings = await db.getAgentLearnings(userId, null, {
      limit: limit ? parseInt(limit) : 100
    });

    // Group by campaign
    const byCampaign = {};
    learnings.forEach(l => {
      if (!byCampaign[l.campaignId]) {
        byCampaign[l.campaignId] = [];
      }
      byCampaign[l.campaignId].push(l);
    });

    res.json({ success: true, learnings, byCampaign });
  } catch (error) {
    console.error('❌ Failed to get all agent learnings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-learning/feedback
 * Submit feedback on a learning (was it helpful?)
 */
router.post('/feedback', async (req, res) => {
  try {
    const { learningId, wasSuccessful } = req.body;

    if (!learningId) {
      return res.status(400).json({ success: false, error: 'learningId is required' });
    }

    const result = await db.updateLearningApplication(learningId, wasSuccessful);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Failed to update learning feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-learning/test
 * Test endpoint to manually create a learning entry
 */
router.post('/test', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'campaignId is required' });
    }

    // Create a test learning
    const result = await db.saveAgentLearning(userId, campaignId, {
      type: 'observation',
      category: 'search_optimization',
      insight: 'Test learning created to verify system is working',
      confidence: 0.9,
      impactScore: 0.5
    });

    console.log(`🧠 [TEST] Created test learning for campaign ${campaignId}`);
    res.json({ success: true, message: 'Test learning created', result });
  } catch (error) {
    console.error('❌ Failed to create test learning:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agent-learning/analyze-existing
 * Analyze existing campaign data and generate learnings retroactively
 */
router.post('/analyze-existing', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'campaignId is required' });
    }

    // Get existing contacts for this campaign
    const contacts = await db.getContacts(userId, { campaignId }, 1000);

    if (contacts.length === 0) {
      return res.json({ success: true, message: 'No contacts found for this campaign', learningsCreated: 0 });
    }

    // Create learnings based on existing data
    const AgentLearningService = require('../services/AgentLearningService');

    // Analyze prospect patterns
    const industries = [...new Set(contacts.map(c => c.industry).filter(Boolean))];
    const sources = [...new Set(contacts.map(c => c.source).filter(Boolean))];

    let learningsCreated = 0;

    // Learning: Total prospects found
    await db.saveAgentLearning(userId, campaignId, {
      type: 'observation',
      category: 'search_optimization',
      insight: `Campaign has ${contacts.length} verified prospects from sources: ${sources.join(', ')}`,
      evidence: { totalContacts: contacts.length, sources, industries },
      confidence: 0.95,
      impactScore: contacts.length > 10 ? 0.8 : 0.5
    });
    learningsCreated++;

    // Learning: Industry distribution
    if (industries.length > 0) {
      await db.saveAgentLearning(userId, campaignId, {
        type: 'pattern',
        category: 'industry_insights',
        insight: `Prospects span ${industries.length} industries: ${industries.slice(0, 5).join(', ')}${industries.length > 5 ? '...' : ''}`,
        evidence: { industries },
        confidence: 0.85,
        impactScore: 0.6
      });
      learningsCreated++;
    }

    // Get email stats
    const emailLogs = await db.getEmailLogs(userId, { campaignId }, 100);
    if (emailLogs.length > 0) {
      const sent = emailLogs.filter(e => e.status === 'sent').length;
      const opened = emailLogs.filter(e => e.opened_at).length;
      const clicked = emailLogs.filter(e => e.clicked_at).length;

      if (sent > 0) {
        const openRate = (opened / sent * 100).toFixed(1);
        const clickRate = (clicked / sent * 100).toFixed(1);

        await db.saveAgentLearning(userId, campaignId, {
          type: 'correlation',
          category: 'email_performance',
          insight: `Email performance: ${openRate}% open rate, ${clickRate}% click rate from ${sent} emails sent`,
          evidence: { sent, opened, clicked, openRate, clickRate },
          confidence: 0.9,
          impactScore: parseFloat(openRate) > 20 ? 0.8 : 0.4
        });
        learningsCreated++;
      }
    }

    // Save metrics
    await db.saveAgentMetric(userId, campaignId, {
      type: 'campaign',
      name: 'total_prospects',
      value: contacts.length
    });

    console.log(`🧠 [ANALYZE] Created ${learningsCreated} learnings for campaign ${campaignId}`);
    res.json({
      success: true,
      message: `Analyzed existing data and created ${learningsCreated} learnings`,
      learningsCreated,
      contactsAnalyzed: contacts.length
    });
  } catch (error) {
    console.error('❌ Failed to analyze existing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
