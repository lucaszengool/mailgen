const express = require('express');
const router = express.Router();
const trackingService = require('../services/EmailTrackingService');
const AgentLearningService = require('../services/AgentLearningService');
const db = require('../models/database');

/**
 * Track email open (1x1 pixel)
 * GET /api/track/open/:trackingId
 */
router.get('/open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  try {
    // Extract metadata from request
    const metadata = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      referer: req.get('referer')
    };

    // Track the open event
    await trackingService.trackOpen(trackingId, metadata);

    // 🧠 AGENT LEARNING: Learn from email open
    try {
      // Get email details from tracking ID to find campaign/user
      const emailLogs = await db.getEmailLogs('anonymous', { trackingId }, 1).catch(() => []);
      if (emailLogs.length > 0) {
        const email = emailLogs[0];
        await AgentLearningService.learnFromEmailResults(
          email.user_id || 'anonymous',
          email.campaign_id,
          email.id,
          { opened: true, clicked: false, replied: false, bounced: false }
        );
      }
    } catch (learningError) {
      console.error('⚠️ Agent learning error (non-blocking):', learningError.message);
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(pixel);
  } catch (error) {
    console.error('[Tracking] Error tracking open:', error);

    // Still return pixel even if tracking fails
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

/**
 * Track link click and redirect
 * GET /api/track/click/:trackingId/:linkIndex?url=...
 */
router.get('/click/:trackingId/:linkIndex', async (req, res) => {
  const { trackingId, linkIndex } = req.params;
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  try {
    // Extract metadata from request
    const metadata = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      targetUrl: decodeURIComponent(targetUrl)
    };

    // Track the click event
    await trackingService.trackClick(trackingId, parseInt(linkIndex), metadata);

    // 🧠 AGENT LEARNING: Learn from email click
    try {
      const emailLogs = await db.getEmailLogs('anonymous', { trackingId }, 1).catch(() => []);
      if (emailLogs.length > 0) {
        const email = emailLogs[0];
        await AgentLearningService.learnFromEmailResults(
          email.user_id || 'anonymous',
          email.campaign_id,
          email.id,
          { opened: true, clicked: true, replied: false, bounced: false }
        );
      }
    } catch (learningError) {
      console.error('⚠️ Agent learning error (non-blocking):', learningError.message);
    }

    // Redirect to the original URL
    res.redirect(302, decodeURIComponent(targetUrl));
  } catch (error) {
    console.error('[Tracking] Error tracking click:', error);

    // Still redirect even if tracking fails
    res.redirect(302, decodeURIComponent(targetUrl));
  }
});

/**
 * Get tracking events
 * GET /api/track/events?campaignId=xxx&startDate=...&endDate=...
 */
router.get('/events', async (req, res) => {
  try {
    const filters = {
      campaignId: req.query.campaignId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      eventType: req.query.eventType
    };

    const events = await trackingService.getAllEvents(filters);

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('[Tracking] Error getting events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tracking events'
    });
  }
});

/**
 * Get analytics summary
 * GET /api/track/analytics?campaignId=xxx
 */
router.get('/analytics', async (req, res) => {
  try {
    const campaignId = req.query.campaignId || null;
    const summary = await trackingService.getAnalyticsSummary(campaignId);

    res.json({
      success: true,
      analytics: summary
    });
  } catch (error) {
    console.error('[Tracking] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * Manually register an email for tracking
 * POST /api/track/register
 */
router.post('/register', async (req, res) => {
  try {
    const emailData = req.body;

    if (!emailData.to || !emailData.subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject'
      });
    }

    const trackingId = await trackingService.registerEmail(emailData);

    res.json({
      success: true,
      trackingId,
      message: 'Email registered for tracking'
    });
  } catch (error) {
    console.error('[Tracking] Error registering email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register email'
    });
  }
});

module.exports = router;
