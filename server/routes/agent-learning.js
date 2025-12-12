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

module.exports = router;
