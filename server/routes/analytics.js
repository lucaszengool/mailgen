const express = require('express');
const router = express.Router();
const db = require('../models/database');

// In-memory storage for analytics (DEPRECATED - use database queries)
let emailAnalytics = {
  campaigns: new Map(),
  dailyStats: new Map(),
  providers: new Map(),
  industries: new Map(),
  locations: new Map(),
  subjects: new Map(),
  sendTimes: new Map()
};

// 🔥 NEW: Database query helper
function queryDB(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Function to reset all analytics data
function resetAnalytics() {
  emailAnalytics.campaigns.clear();
  emailAnalytics.dailyStats.clear();
  emailAnalytics.providers.clear();
  emailAnalytics.industries.clear();
  emailAnalytics.locations.clear();
  emailAnalytics.subjects.clear();
  emailAnalytics.sendTimes.clear();
  realtimeData.activeCampaigns = 0;
  realtimeData.sentToday = 0;
  realtimeData.currentOpenRate = 0;
  console.log('📊 Analytics data has been reset');
}

// Real-time analytics data
let realtimeData = {
  activeCampaigns: 0,
  sentToday: 0,
  currentOpenRate: 0,
  lastUpdate: new Date()
};

// Helper function to get time range filter
function getTimeRangeFilter(timeRange) {
  const now = new Date();
  const filters = {
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  };
  return filters[timeRange] || filters['30d'];
}

// Helper function to extract email provider
function getEmailProvider(email) {
  if (!email || !email.includes('@')) return 'Unknown';
  const domain = email.split('@')[1].toLowerCase();

  if (domain.includes('gmail')) return 'Gmail';
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) return 'Outlook';
  if (domain.includes('yahoo')) return 'Yahoo';
  if (domain.includes('.edu')) return 'Educational';
  if (domain.includes('.gov')) return 'Government';
  return 'Corporate';
}

// Track email sent
function trackEmailSent(campaignId, recipient, subject, content, timestamp = new Date()) {
  const provider = getEmailProvider(recipient.email || recipient.to);
  const dateKey = timestamp.toISOString().split('T')[0];

  // Campaign tracking
  if (!emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.set(campaignId, {
      name: campaignId,
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      replies: 0,
      bounces: 0,
      unsubscribes: 0,
      startDate: timestamp,
      recipients: [],
      status: 'active'
    });
  }

  const campaign = emailAnalytics.campaigns.get(campaignId);
  campaign.sent += 1;
  campaign.recipients.push({
    email: recipient.email || recipient.to,
    name: recipient.name || 'Unknown',
    company: recipient.company || 'Unknown',
    industry: recipient.industry || 'Technology',
    location: recipient.location || 'North America',
    timestamp,
    status: 'sent'
  });

  // Daily stats tracking
  if (!emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.set(dateKey, {
      date: dateKey,
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      replies: 0,
      bounces: 0
    });
  }
  emailAnalytics.dailyStats.get(dateKey).sent += 1;

  // Provider tracking
  if (!emailAnalytics.providers.has(provider)) {
    emailAnalytics.providers.set(provider, {
      provider,
      sent: 0,
      delivered: 0,
      bounced: 0,
      blocked: 0
    });
  }
  emailAnalytics.providers.get(provider).sent += 1;

  // Subject line tracking
  const subjectKey = subject.substring(0, 100); // Limit length
  if (!emailAnalytics.subjects.has(subjectKey)) {
    emailAnalytics.subjects.set(subjectKey, {
      subject: subjectKey,
      sent: 0,
      opens: 0,
      clicks: 0
    });
  }
  emailAnalytics.subjects.get(subjectKey).sent += 1;

  // Industry tracking
  const industry = recipient.industry || 'Technology';
  if (!emailAnalytics.industries.has(industry)) {
    emailAnalytics.industries.set(industry, {
      industry,
      count: 0,
      sent: 0,
      opens: 0,
      clicks: 0
    });
  }
  const industryData = emailAnalytics.industries.get(industry);
  industryData.count += 1;
  industryData.sent += 1;

  // Location tracking
  const location = recipient.location || 'North America';
  if (!emailAnalytics.locations.has(location)) {
    emailAnalytics.locations.set(location, {
      location,
      count: 0,
      sent: 0,
      opens: 0,
      clicks: 0
    });
  }
  const locationData = emailAnalytics.locations.get(location);
  locationData.count += 1;
  locationData.sent += 1;

  // Update realtime data
  realtimeData.sentToday += 1;
  realtimeData.activeCampaigns = Array.from(emailAnalytics.campaigns.values())
    .filter(c => c.status === 'active').length;
  realtimeData.lastUpdate = timestamp;

  console.log(`📊 Analytics: Tracked email sent to ${recipient.email || recipient.to} for campaign ${campaignId}`);
}

// Track email delivered
function trackEmailDelivered(campaignId, recipientEmail, messageId, timestamp = new Date()) {
  const provider = getEmailProvider(recipientEmail);
  const dateKey = timestamp.toISOString().split('T')[0];

  // Update campaign
  if (emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.get(campaignId).delivered += 1;
  }

  // Update daily stats
  if (emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.get(dateKey).delivered += 1;
  }

  // Update provider stats
  if (emailAnalytics.providers.has(provider)) {
    emailAnalytics.providers.get(provider).delivered += 1;
  }

  console.log(`📊 Analytics: Tracked email delivered to ${recipientEmail} for campaign ${campaignId}`);
}

// Track email opened
function trackEmailOpened(campaignId, recipientEmail, subject, timestamp = new Date()) {
  const dateKey = timestamp.toISOString().split('T')[0];
  const hour = timestamp.getHours();
  const day = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
  const timeKey = `${day} ${hour}:00`;

  // Update campaign
  if (emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.get(campaignId).opens += 1;
  }

  // Update daily stats
  if (emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.get(dateKey).opens += 1;
  }

  // Update subject stats
  if (subject && emailAnalytics.subjects.has(subject)) {
    emailAnalytics.subjects.get(subject).opens += 1;
  }

  // Track send time performance
  if (!emailAnalytics.sendTimes.has(timeKey)) {
    emailAnalytics.sendTimes.set(timeKey, {
      time: timeKey,
      opens: 0,
      sent: 0
    });
  }
  emailAnalytics.sendTimes.get(timeKey).opens += 1;

  // Update industry stats if we can find the recipient
  const campaign = emailAnalytics.campaigns.get(campaignId);
  if (campaign) {
    const recipient = campaign.recipients.find(r => r.email === recipientEmail);
    if (recipient) {
      const industryData = emailAnalytics.industries.get(recipient.industry);
      if (industryData) industryData.opens += 1;

      const locationData = emailAnalytics.locations.get(recipient.location);
      if (locationData) locationData.opens += 1;
    }
  }

  console.log(`📊 Analytics: Tracked email opened by ${recipientEmail} for campaign ${campaignId}`);
}

// Track email clicked
function trackEmailClicked(campaignId, recipientEmail, linkUrl, timestamp = new Date()) {
  const dateKey = timestamp.toISOString().split('T')[0];

  // Update campaign
  if (emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.get(campaignId).clicks += 1;
  }

  // Update daily stats
  if (emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.get(dateKey).clicks += 1;
  }

  // Update industry/location stats
  const campaign = emailAnalytics.campaigns.get(campaignId);
  if (campaign) {
    const recipient = campaign.recipients.find(r => r.email === recipientEmail);
    if (recipient) {
      const industryData = emailAnalytics.industries.get(recipient.industry);
      if (industryData) industryData.clicks += 1;

      const locationData = emailAnalytics.locations.get(recipient.location);
      if (locationData) locationData.clicks += 1;
    }
  }

  console.log(`📊 Analytics: Tracked email clicked by ${recipientEmail} for campaign ${campaignId}`);
}

// Track email replied
function trackEmailReplied(campaignId, recipientEmail, timestamp = new Date()) {
  const dateKey = timestamp.toISOString().split('T')[0];

  // Update campaign
  if (emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.get(campaignId).replies += 1;
  }

  // Update daily stats
  if (emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.get(dateKey).replies += 1;
  }

  console.log(`📊 Analytics: Tracked email reply from ${recipientEmail} for campaign ${campaignId}`);
}

// Track email bounced
function trackEmailBounced(campaignId, recipientEmail, timestamp = new Date()) {
  const dateKey = timestamp.toISOString().split('T')[0];

  // Update campaign
  if (emailAnalytics.campaigns.has(campaignId)) {
    emailAnalytics.campaigns.get(campaignId).bounces += 1;
  }

  // Update daily stats
  if (emailAnalytics.dailyStats.has(dateKey)) {
    emailAnalytics.dailyStats.get(dateKey).bounces += 1;
  }

  console.log(`📊 Analytics: Tracked email bounce for ${recipientEmail} in campaign ${campaignId}`);
}

// API Routes

// Get email metrics overview
router.get('/email-metrics', async (req, res) => {
  const startTime = Date.now();
  console.log('\n' + '━'.repeat(80));
  console.log('📊 [ANALYTICS] Email Metrics Request');
  console.log('━'.repeat(80));

  try {
    const { timeRange = '30d', campaign = 'all', userId = 'anonymous' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);
    const sinceTimestamp = sinceDate.toISOString();

    console.log('📋 [ANALYTICS] Request Parameters:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Campaign: ${campaign}`);
    console.log(`   Time Range: ${timeRange}`);
    console.log(`   Since Date: ${sinceTimestamp}`);

    // 🔥 CRITICAL FIX: Query database with user_id filter (like prospect pipeline)
    const emailLogsQuery = campaign === 'all'
      ? `SELECT * FROM email_logs WHERE user_id = ? AND sent_at >= ?`
      : `SELECT * FROM email_logs WHERE user_id = ? AND sent_at >= ? AND campaign_id = ?`;

    const emailLogsParams = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];

    console.log('\n💾 [DATABASE] Querying email_logs...');
    console.log(`   SQL: ${emailLogsQuery.replace(/\n/g, ' ').replace(/\s+/g, ' ')}`);
    console.log(`   Params:`, emailLogsParams);

    const dbQueryStart = Date.now();
    const emailLogs = await queryDB(emailLogsQuery, emailLogsParams);
    console.log(`   ⏱️  Query took: ${Date.now() - dbQueryStart}ms`);
    console.log(`   ✅ Found ${emailLogs.length} email logs`);

    if (emailLogs.length > 0) {
      console.log(`   📧 Sample log:`, {
        to: emailLogs[0].recipient_email,
        status: emailLogs[0].status,
        campaignId: emailLogs[0].campaign_id,
        sentAt: emailLogs[0].sent_at
      });
    }

    // Count emails by status
    const totalSent = emailLogs.filter(log => log.status === 'sent').length;
    const totalFailed = emailLogs.filter(log => log.status === 'failed').length;
    const totalDelivered = totalSent; // Assume all sent emails are delivered for now

    console.log('\n📊 [COUNTS] Email status counts:');
    console.log(`   Total Sent: ${totalSent}`);
    console.log(`   Total Failed: ${totalFailed}`);
    console.log(`   Total Delivered: ${totalDelivered}`);

    // 🔥 CRITICAL FIX: Query for opens and clicks WITH user_id filter
    // 📊 FIX: Use e.tracking_id = o.tracking_id instead of LIKE (tracking_id is a hash, not derived from campaign_id)
    const opensQuery = campaign === 'all'
      ? `SELECT COUNT(DISTINCT o.tracking_id) as count FROM email_opens o
         INNER JOIN email_logs e ON o.tracking_id = e.tracking_id
         WHERE e.user_id = ? AND e.sent_at >= ?`
      : `SELECT COUNT(DISTINCT o.tracking_id) as count FROM email_opens o
         INNER JOIN email_logs e ON o.tracking_id = e.tracking_id
         WHERE e.user_id = ? AND e.sent_at >= ? AND e.campaign_id = ?`;

    // 🔥 FIX: Count clicks by joining on tracking_id (which is now stored as link_id)
    const clicksQuery = campaign === 'all'
      ? `SELECT COUNT(DISTINCT c.link_id) as count FROM email_clicks c
         INNER JOIN email_logs e ON c.link_id = e.tracking_id
         WHERE e.user_id = ? AND e.sent_at >= ?`
      : `SELECT COUNT(DISTINCT c.link_id) as count FROM email_clicks c
         INNER JOIN email_logs e ON c.link_id = e.tracking_id
         WHERE e.user_id = ? AND e.sent_at >= ? AND e.campaign_id = ?`;


    const repliesQuery = campaign === 'all'
      ? `SELECT COUNT(DISTINCT r.recipient_email) as count FROM email_replies r
         INNER JOIN email_logs e ON r.campaign_id = e.campaign_id
         WHERE e.user_id = ? AND r.replied_at >= ?`
      : `SELECT COUNT(DISTINCT r.recipient_email) as count FROM email_replies r
         INNER JOIN email_logs e ON r.campaign_id = e.campaign_id
         WHERE e.user_id = ? AND r.replied_at >= ? AND r.campaign_id = ?`;

    const bouncesQuery = campaign === 'all'
      ? `SELECT COUNT(DISTINCT b.recipient_email) as count FROM email_bounces b
         INNER JOIN email_logs e ON b.campaign_id = e.campaign_id
         WHERE e.user_id = ? AND b.bounced_at >= ?`
      : `SELECT COUNT(DISTINCT b.recipient_email) as count FROM email_bounces b
         INNER JOIN email_logs e ON b.campaign_id = e.campaign_id
         WHERE e.user_id = ? AND b.bounced_at >= ? AND b.campaign_id = ?`;

    const opensParams = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];
    const clicksParams = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];
    const repliesParams = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];
    const bouncesParams = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];

    console.log('\n💾 [DATABASE] Querying tracking tables...');
    const trackingStart = Date.now();

    const opensResult = await queryDB(opensQuery, opensParams);
    const clicksResult = await queryDB(clicksQuery, clicksParams);
    const repliesResult = await queryDB(repliesQuery, repliesParams);
    const bouncesResult = await queryDB(bouncesQuery, bouncesParams);

    console.log(`   ⏱️  Tracking queries took: ${Date.now() - trackingStart}ms`);

    const totalOpened = opensResult[0]?.count || 0;
    const totalClicked = clicksResult[0]?.count || 0;
    const totalReplied = repliesResult[0]?.count || 0;
    const totalBounced = bouncesResult[0]?.count || 0;
    const totalUnsubscribed = 0;

    console.log('\n📊 [TRACKING COUNTS]');
    console.log(`   Opens: ${totalOpened}`);
    console.log(`   Clicks: ${totalClicked}`);
    console.log(`   Replies: ${totalReplied}`);
    console.log(`   Bounces: ${totalBounced}`);

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100) : 0;
    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100) : 0;
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;
    const replyRate = totalDelivered > 0 ? ((totalReplied / totalDelivered) * 100) : 0;
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100) : 0;
    const unsubscribeRate = totalDelivered > 0 ? ((totalUnsubscribed / totalDelivered) * 100) : 0;

    console.log('\n📈 [RATES] Calculated metrics:');
    console.log(`   Delivery Rate: ${deliveryRate.toFixed(1)}%`);
    console.log(`   Open Rate: ${openRate.toFixed(1)}%`);
    console.log(`   Click Rate: ${clickRate.toFixed(1)}%`);
    console.log(`   Reply Rate: ${replyRate.toFixed(2)}%`);
    console.log(`   Bounce Rate: ${bounceRate.toFixed(1)}%`);

    const responseData = {
      success: true,
      data: {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalReplied,
        totalBounced,
        totalUnsubscribed,
        deliveryRate: parseFloat(deliveryRate.toFixed(1)),
        openRate: parseFloat(openRate.toFixed(1)),
        clickRate: parseFloat(clickRate.toFixed(1)),
        replyRate: parseFloat(replyRate.toFixed(2)),
        bounceRate: parseFloat(bounceRate.toFixed(1)),
        unsubscribeRate: parseFloat(unsubscribeRate.toFixed(2))
      }
    };

    const totalTime = Date.now() - startTime;
    console.log('\n' + '━'.repeat(80));
    console.log(`✅ [ANALYTICS] Complete! Total time: ${totalTime}ms`);
    console.log('━'.repeat(80) + '\n');

    res.json(responseData);
  } catch (error) {
    console.error('\n' + '━'.repeat(80));
    console.error('❌ [ANALYTICS] ERROR!');
    console.error('━'.repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('━'.repeat(80) + '\n');

    res.status(500).json({ success: false, error: error.message });
  }
});

// Get campaign performance data
router.get('/campaign-performance', async (req, res) => {
  try {
    const { timeRange = '30d', userId = 'anonymous' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);
    const sinceTimestamp = sinceDate.toISOString();

    console.log(`📊 [CAMPAIGN-PERFORMANCE] User: ${userId}, TimeRange: ${timeRange}`);

    // 🔥 CRITICAL FIX: Get campaigns from database WITH user_id filter
    const emailLogs = await queryDB(
      `SELECT campaign_id, COUNT(*) as sent,
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as delivered
       FROM email_logs
       WHERE user_id = ? AND sent_at >= ?
       GROUP BY campaign_id`,
      [userId, sinceTimestamp]
    );

    console.log(`📊 [CAMPAIGN-PERFORMANCE] Found ${emailLogs.length} campaigns for user=${userId}`);

    // Get opens and clicks for each campaign
    const campaigns = await Promise.all(emailLogs.map(async (log) => {
      const opensResult = await queryDB(
        `SELECT COUNT(DISTINCT tracking_id) as opens FROM email_opens
         WHERE tracking_id LIKE ?`,
        [`${log.campaign_id}%`]
      );

      const clicksResult = await queryDB(
        `SELECT COUNT(*) as clicks FROM email_clicks
         WHERE campaign_id = ?`,
        [log.campaign_id]
      );

      return {
        name: log.campaign_id,
        sent: log.sent,
        delivered: log.delivered,
        opens: opensResult[0]?.opens || 0,
        clicks: clicksResult[0]?.clicks || 0,
        replies: 0,
        status: 'active'
      };
    }));

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error getting campaign performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get deliverability data
router.get('/deliverability', (req, res) => {
  try {
    const providers = Array.from(emailAnalytics.providers.values())
      .map(provider => ({
        provider: provider.provider,
        delivered: provider.delivered,
        bounced: provider.bounced,
        blocked: provider.blocked,
        rate: provider.sent > 0 ? parseFloat(((provider.delivered / provider.sent) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.delivered - a.delivered);

    res.json({
      success: true,
      data: {
        byProvider: providers
      }
    });
  } catch (error) {
    console.error('Error getting deliverability data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get engagement trends
router.get('/engagement-trends', async (req, res) => {
  try {
    const { timeRange = '30d', userId = 'anonymous' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);
    const sinceTimestamp = sinceDate.toISOString();

    console.log(`📊 [ENGAGEMENT-TRENDS] User: ${userId}, TimeRange: ${timeRange}`);

    // 🔥 CRITICAL FIX: Get daily stats from database WITH user_id filter
    const dailyStats = await queryDB(
      `SELECT
        DATE(sent_at) as date,
        COUNT(*) as sent,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as delivered
       FROM email_logs
       WHERE user_id = ? AND sent_at >= ?
       GROUP BY DATE(sent_at)
       ORDER BY date ASC`,
      [userId, sinceTimestamp]
    );

    console.log(`📊 [ENGAGEMENT-TRENDS] Found ${dailyStats.length} days of data for user=${userId}`);

    // Get opens and clicks for each day
    const trends = await Promise.all(dailyStats.map(async (stat) => {
      const opensResult = await queryDB(
        `SELECT COUNT(DISTINCT o.tracking_id) as opens
         FROM email_opens o
         INNER JOIN email_logs e ON o.tracking_id LIKE e.campaign_id || '%'
         WHERE e.user_id = ? AND DATE(e.sent_at) = ?`,
        [userId, stat.date]
      );

      const clicksResult = await queryDB(
        `SELECT COUNT(*) as clicks
         FROM email_clicks c
         INNER JOIN email_logs e ON c.campaign_id = e.campaign_id
         WHERE e.user_id = ? AND DATE(e.sent_at) = ?`,
        [userId, stat.date]
      );

      return {
        date: stat.date,
        sent: stat.sent,
        delivered: stat.delivered,
        opens: opensResult[0]?.opens || 0,
        clicks: clicksResult[0]?.clicks || 0,
        replies: 0,
        bounces: 0
      };
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting engagement trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recipient analytics
router.get('/recipient-analytics', (req, res) => {
  try {
    const industries = Array.from(emailAnalytics.industries.values())
      .map(industry => ({
        industry: industry.industry,
        count: industry.count,
        openRate: industry.sent > 0 ? parseFloat(((industry.opens / industry.sent) * 100).toFixed(1)) : 0,
        clickRate: industry.opens > 0 ? parseFloat(((industry.clicks / industry.opens) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const totalContacts = industries.reduce((sum, industry) => sum + industry.count, 0);
    const locations = Array.from(emailAnalytics.locations.values())
      .map(location => ({
        location: location.location,
        count: location.count,
        rate: totalContacts > 0 ? parseFloat(((location.count / totalContacts) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        byIndustry: industries,
        byLocation: locations
      }
    });
  } catch (error) {
    console.error('Error getting recipient analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get realtime stats
router.get('/realtime', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.query;
    const today = new Date().toISOString().split('T')[0];

    console.log(`📊 [REALTIME] User: ${userId}, Date: ${today}`);

    // 🔥 CRITICAL FIX: Get today's stats from database WITH user_id filter
    const todayStats = await queryDB(
      `SELECT COUNT(*) as sent FROM email_logs WHERE user_id = ? AND DATE(sent_at) = ?`,
      [userId, today]
    );

    const todayOpens = await queryDB(
      `SELECT COUNT(DISTINCT o.tracking_id) as opens
       FROM email_opens o
       INNER JOIN email_logs e ON o.tracking_id LIKE e.campaign_id || '%'
       WHERE e.user_id = ? AND DATE(e.sent_at) = ?`,
      [userId, today]
    );

    // 🔥 CRITICAL FIX: Count active campaigns WITH user_id filter
    const activeCampaigns = await queryDB(
      `SELECT COUNT(DISTINCT campaign_id) as count
       FROM email_logs
       WHERE user_id = ? AND sent_at >= datetime('now', '-7 days')`,
      [userId]
    );

    console.log(`📊 [REALTIME] Sent today: ${todayStats[0]?.sent || 0}, Active campaigns: ${activeCampaigns[0]?.count || 0}`);

    const totalSentToday = todayStats[0]?.sent || 0;
    const totalOpensToday = todayOpens[0]?.opens || 0;

    const currentOpenRate = totalSentToday > 0 ?
      parseFloat(((totalOpensToday / totalSentToday) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        activeCampaigns: activeCampaigns[0]?.count || 0,
        sentToday: totalSentToday,
        currentOpenRate: `${currentOpenRate}%`,
        lastUpdate: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting realtime data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to manually track events (for testing)
router.post('/track/sent', (req, res) => {
  try {
    const { campaignId, recipient, subject, content } = req.body;
    trackEmailSent(campaignId, recipient, subject, content);
    res.json({ success: true, message: 'Email sent tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/track/delivered', (req, res) => {
  try {
    const { campaignId, recipientEmail, messageId } = req.body;
    trackEmailDelivered(campaignId, recipientEmail, messageId);
    res.json({ success: true, message: 'Email delivered tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/track/opened', (req, res) => {
  try {
    const { campaignId, recipientEmail, subject } = req.body;
    trackEmailOpened(campaignId, recipientEmail, subject);
    res.json({ success: true, message: 'Email opened tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/track/clicked', (req, res) => {
  try {
    const { campaignId, recipientEmail, linkUrl } = req.body;
    trackEmailClicked(campaignId, recipientEmail, linkUrl);
    res.json({ success: true, message: 'Email clicked tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset analytics data
router.post('/reset', (req, res) => {
  try {
    resetAnalytics();
    res.json({
      success: true,
      message: 'Analytics data has been reset'
    });
  } catch (error) {
    console.error('Error resetting analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate sample data for testing (DISABLED - using real data only)
router.post('/generate-sample-data-disabled', (req, res) => {
  try {
    const campaigns = [
      'Product Launch Q4',
      'Customer Onboarding',
      'Feature Announcement',
      'Holiday Promotion',
      'Newsletter Dec'
    ];

    const recipients = [
      { email: 'john@techcorp.com', name: 'John Doe', company: 'TechCorp', industry: 'Technology', location: 'North America' },
      { email: 'sarah@healthco.com', name: 'Sarah Smith', company: 'HealthCo', industry: 'Healthcare', location: 'Europe' },
      { email: 'mike@finbank.com', name: 'Mike Johnson', company: 'FinBank', industry: 'Finance', location: 'North America' },
      { email: 'lisa@manufac.com', name: 'Lisa Wong', company: 'ManufaCorp', industry: 'Manufacturing', location: 'Asia Pacific' },
      { email: 'david@edutech.com', name: 'David Brown', company: 'EduTech', industry: 'Education', location: 'Europe' },
      { email: 'emma@retailco.com', name: 'Emma Davis', company: 'RetailCo', industry: 'Retail', location: 'North America' }
    ];

    const subjects = [
      'Quick question about {company}',
      'Partnership opportunity with {company}',
      'Following up on our conversation',
      'New solution for {industry} companies',
      'Special offer for {company}'
    ];

    // Generate data for the last 7 days
    for (let day = 6; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);

      // Generate 20-50 emails per day
      const emailsToday = Math.floor(Math.random() * 30) + 20;

      for (let i = 0; i < emailsToday; i++) {
        const campaignId = campaigns[Math.floor(Math.random() * campaigns.length)];
        const recipient = recipients[Math.floor(Math.random() * recipients.length)];
        const subject = subjects[Math.floor(Math.random() * subjects.length)]
          .replace('{company}', recipient.company)
          .replace('{industry}', recipient.industry);

        // Track sent email
        trackEmailSent(campaignId, recipient, subject, 'Sample email content', date);

        // 95% delivery rate
        if (Math.random() > 0.05) {
          trackEmailDelivered(campaignId, recipient.email, `msg_${Date.now()}_${i}`, date);

          // 25% open rate
          if (Math.random() < 0.25) {
            const openTime = new Date(date.getTime() + Math.random() * 86400000); // Random time within the day
            trackEmailOpened(campaignId, recipient.email, subject, openTime);

            // 6% click rate (of opens)
            if (Math.random() < 0.06) {
              const clickTime = new Date(openTime.getTime() + Math.random() * 3600000); // Within an hour of opening
              trackEmailClicked(campaignId, recipient.email, 'https://example.com', clickTime);
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Sample data generated successfully',
      stats: {
        campaigns: emailAnalytics.campaigns.size,
        dailyStats: emailAnalytics.dailyStats.size,
        providers: emailAnalytics.providers.size
      }
    });
  } catch (error) {
    console.error('Error generating sample data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket manager for real-time updates
let wsManager = null;

function setWebSocketManager(manager) {
  wsManager = manager;
}

function broadcastAnalyticsUpdate() {
  if (wsManager) {
    wsManager.broadcast({
      type: 'analytics_update',
      data: {
        activeCampaigns: realtimeData.activeCampaigns,
        sentToday: realtimeData.sentToday,
        currentOpenRate: realtimeData.currentOpenRate,
        lastUpdate: realtimeData.lastUpdate
      }
    });
  }
}

// Modified tracking functions to include WebSocket updates
function trackEmailSentWithWS(campaignId, recipient, subject, content, timestamp = new Date()) {
  trackEmailSent(campaignId, recipient, subject, content, timestamp);
  broadcastAnalyticsUpdate();
}

function trackEmailDeliveredWithWS(campaignId, recipientEmail, messageId, timestamp = new Date()) {
  trackEmailDelivered(campaignId, recipientEmail, messageId, timestamp);
  broadcastAnalyticsUpdate();
}

function trackEmailOpenedWithWS(campaignId, recipientEmail, subject, timestamp = new Date()) {
  trackEmailOpened(campaignId, recipientEmail, subject, timestamp);
  broadcastAnalyticsUpdate();
}

function trackEmailClickedWithWS(campaignId, recipientEmail, linkUrl, timestamp = new Date()) {
  trackEmailClicked(campaignId, recipientEmail, linkUrl, timestamp);
  broadcastAnalyticsUpdate();
}

function trackEmailRepliedWithWS(campaignId, recipientEmail, timestamp = new Date()) {
  trackEmailReplied(campaignId, recipientEmail, timestamp);
  broadcastAnalyticsUpdate();
}

function trackEmailBouncedWithWS(campaignId, recipientEmail, timestamp = new Date()) {
  trackEmailBounced(campaignId, recipientEmail, timestamp);
  broadcastAnalyticsUpdate();
}

// Backfill analytics from database
router.post('/backfill-from-database', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;
    const db = require('../models/database');

    console.log(`📊 [BACKFILL] User: ${userId}`);

    // 🔥 CRITICAL FIX: Get email logs filtered by user_id
    db.db.all('SELECT * FROM email_logs WHERE user_id = ? AND status = "sent" ORDER BY sent_at ASC', [userId], (err, rows) => {
      if (err) {
        console.error('Error reading email logs:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      console.log(`📊 Backfilling analytics with ${rows.length} emails from database for user=${userId}`);

      // Track each email in analytics
      rows.forEach(row => {
        const campaignId = row.campaign_id || 'historical';
        const recipient = { email: row.to_email, name: row.to_email };
        const subject = row.subject || 'Email Campaign';
        const timestamp = new Date(row.sent_at);

        trackEmailSent(campaignId, recipient, subject, '', timestamp);
        if (row.message_id) {
          trackEmailDelivered(campaignId, row.to_email, row.message_id, timestamp);
        }
      });

      res.json({
        success: true,
        message: `Backfilled ${rows.length} emails into analytics`,
        totalEmails: rows.length
      });
    });
  } catch (error) {
    console.error('Error backfilling analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 NEW: Backfill email body content from workflow results
router.post('/backfill-email-bodies', async (req, res) => {
  try {
    const { userId = 'demo', campaignId } = req.body;
    const workflowRoutes = require('./workflow');
    const getLastWorkflowResults = workflowRoutes.getLastWorkflowResults;

    console.log(`📧 [BACKFILL BODIES] Starting for user: ${userId}, campaign: ${campaignId || 'ALL'}`);

    // Get workflow results which have the email bodies
    const workflowResults = await getLastWorkflowResults(userId, campaignId);

    if (!workflowResults || !workflowResults.emailCampaign?.emails) {
      return res.json({ success: true, message: 'No workflow emails found', updated: 0 });
    }

    const workflowEmails = workflowResults.emailCampaign.emails;
    console.log(`📧 [BACKFILL BODIES] Found ${workflowEmails.length} emails in workflow results`);

    let updatedCount = 0;

    // Update each email in email_logs with body from workflow
    for (const email of workflowEmails) {
      const body = email.body || email.html;
      const toEmail = email.to;
      const subject = email.subject;

      if (!body || !toEmail) continue;

      // Update email_logs where body is null
      await new Promise((resolve, reject) => {
        db.db.run(
          `UPDATE email_logs SET body = ? WHERE to_email = ? AND subject = ? AND (body IS NULL OR body = '')`,
          [body, toEmail, subject],
          function(err) {
            if (err) {
              console.error(`❌ Error updating ${toEmail}:`, err.message);
              reject(err);
            } else {
              if (this.changes > 0) {
                console.log(`✅ Updated body for ${toEmail} - ${subject.substring(0, 30)}...`);
                updatedCount += this.changes;
              }
              resolve();
            }
          }
        );
      });
    }

    console.log(`📧 [BACKFILL BODIES] Completed - Updated ${updatedCount} emails`);
    res.json({ success: true, message: `Updated ${updatedCount} email bodies`, updated: updatedCount });

  } catch (error) {
    console.error('❌ [BACKFILL BODIES] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual tracking endpoint for historical emails
router.post('/track-manual-emails', (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ success: false, error: 'emails array is required' });
    }

    console.log(`📊 Manually tracking ${emails.length} emails`);

    emails.forEach(email => {
      const campaignId = email.campaignId || 'manual';
      const recipient = { email: email.to, name: email.to, company: email.company || '' };
      const subject = email.subject;
      const timestamp = email.sentAt ? new Date(email.sentAt) : new Date();

      trackEmailSent(campaignId, recipient, subject, email.body || '', timestamp);
      trackEmailDelivered(campaignId, email.to, email.messageId || `manual_${Date.now()}`, timestamp);
    });

    res.json({
      success: true,
      message: `Manually tracked ${emails.length} emails`,
      totalEmails: emails.length
    });
  } catch (error) {
    console.error('Error manually tracking emails:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// IMAP monitoring endpoints
let imapTracker = null;

router.post('/start-imap-monitoring', async (req, res) => {
  try {
    const db = require('../models/database');
    const IMAPEmailTracker = require('../services/IMAPEmailTracker');

    // 🔥 FIX: Get userId from request body or use 'anonymous'
    const userId = req.body.userId || 'anonymous';
    console.log(`📬 Starting IMAP monitoring for user: ${userId}`);

    let imapConfig = null;

    // 1️⃣ Try Gmail OAuth first (best option)
    try {
      const GmailOAuthService = require('../services/GmailOAuthService');
      const oauthConfig = await GmailOAuthService.getSMTPConfigWithOAuth(userId);
      if (oauthConfig && oauthConfig.auth) {
        console.log('✅ Using Gmail OAuth for IMAP monitoring');
        imapConfig = {
          username: oauthConfig.auth.user,
          password: oauthConfig.auth.accessToken, // OAuth uses accessToken as password
          host: oauthConfig.host,
          isOAuth: true
        };
      }
    } catch (oauthError) {
      console.log(`⚠️ OAuth not available: ${oauthError.message}`);
    }

    // 2️⃣ Try database SMTP config
    if (!imapConfig) {
      console.log('⚠️ No OAuth config, trying database SMTP config...');
      const dbConfig = await db.getSMTPConfig(userId);
      if (dbConfig) {
        imapConfig = {
          username: dbConfig.username,
          password: dbConfig.password,
          host: dbConfig.host
        };
        console.log(`✅ Using SMTP config from database: ${imapConfig.username}@${imapConfig.host}`);
      }
    }

    // 3️⃣ Try environment variables as last resort
    if (!imapConfig) {
      console.log('⚠️ No database config, trying environment variables...');

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(400).json({
          success: false,
          error: 'No email configuration found. Please configure your SMTP credentials in Settings → Email Configuration.'
        });
      }

      // Build config from environment variables
      imapConfig = {
        username: process.env.SMTP_USER,
        password: process.env.SMTP_PASS,
        host: process.env.SMTP_HOST || 'smtp.gmail.com'
      };

      console.log(`✅ Using SMTP config from environment: ${imapConfig.username}@${imapConfig.host}`);
    }

    // Stop existing monitoring if any
    if (imapTracker) {
      imapTracker.disconnect();
    }

    // Create new IMAP tracker
    imapTracker = new IMAPEmailTracker();

    // Convert SMTP config to IMAP config
    const imapConnection = {
      user: imapConfig.username,
      password: imapConfig.password,
      host: imapConfig.host.replace('smtp', 'imap'),
      port: 993
    };

    console.log(`📬 Starting IMAP monitoring for: ${imapConnection.user}@${imapConnection.host}`);

    await imapTracker.connect(imapConnection);
    await imapTracker.startMonitoring(5); // Check every 5 minutes

    res.json({
      success: true,
      message: 'IMAP monitoring started successfully',
      checkInterval: '5 minutes',
      email: imapConnection.user
    });
  } catch (error) {
    console.error('Error starting IMAP monitoring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stop-imap-monitoring', (req, res) => {
  try {
    if (imapTracker) {
      imapTracker.disconnect();
      imapTracker = null;
    }

    res.json({
      success: true,
      message: 'IMAP monitoring stopped'
    });
  } catch (error) {
    console.error('Error stopping IMAP monitoring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/imap-monitoring-status', (req, res) => {
  res.json({
    success: true,
    monitoring: imapTracker !== null && imapTracker.isMonitoring,
    lastCheck: imapTracker?.lastCheckTime || null
  });
});

// Get individual email performance
router.get('/individual-emails', async (req, res) => {
  try {
    const { timeRange = '30d', campaign = 'all', userId = 'anonymous' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);
    const sinceTimestamp = sinceDate.toISOString();

    console.log(`📊 [INDIVIDUAL-EMAILS] User: ${userId}, Campaign: ${campaign}, TimeRange: ${timeRange}`);

    // Get all sent emails with their metrics
    const emailsQuery = campaign === 'all'
      ? `SELECT
           e.id,
           e.to_email,
           e.subject,
           e.campaign_id,
           e.sent_at,
           e.status,
           e.tracking_id,
           (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as opens,
           (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clicks,
           (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email AND r.campaign_id = e.campaign_id) as replies,
           (SELECT COUNT(*) FROM email_bounces b WHERE b.recipient_email = e.to_email AND b.campaign_id = e.campaign_id) as bounces
         FROM email_logs e
         WHERE e.user_id = ? AND e.sent_at >= ? AND e.status = 'sent'
         ORDER BY e.sent_at DESC`
      : `SELECT
           e.id,
           e.to_email,
           e.subject,
           e.campaign_id,
           e.sent_at,
           e.status,
           e.tracking_id,
           (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as opens,
           (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clicks,
           (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email AND r.campaign_id = e.campaign_id) as replies,
           (SELECT COUNT(*) FROM email_bounces b WHERE b.recipient_email = e.to_email AND b.campaign_id = e.campaign_id) as bounces
         FROM email_logs e
         WHERE e.user_id = ? AND e.sent_at >= ? AND e.campaign_id = ? AND e.status = 'sent'
         ORDER BY e.sent_at DESC`;

    const params = campaign === 'all' ? [userId, sinceTimestamp] : [userId, sinceTimestamp, campaign];
    const emails = await queryDB(emailsQuery, params);

    console.log(`📧 Found ${emails.length} individual emails`);

    // Calculate metrics for each email
    const emailsWithMetrics = emails.map(email => ({
      id: email.id,
      to: email.to_email,
      subject: email.subject,
      campaignId: email.campaign_id,
      sentAt: email.sent_at,
      status: email.status,
      trackingId: email.tracking_id,
      opened: email.opens > 0,
      clicked: email.clicks > 0,
      replied: email.replies > 0,
      bounced: email.bounces > 0,
      openCount: email.opens,
      clickCount: email.clicks,
      replyCount: email.replies,
      bounceCount: email.bounces
    }));

    res.json({
      success: true,
      data: emailsWithMetrics
    });
  } catch (error) {
    console.error('❌ [INDIVIDUAL-EMAILS] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email detail by ID
router.get('/email-detail/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId = 'anonymous' } = req.query;

    console.log(`📧 [EMAIL-DETAIL] Fetching email ${emailId} for user ${userId}`);

    // 🔥 FIX: First try to find by exact user_id match
    // NOTE: email_logs now has body column
    const emailQueryByUser = `
      SELECT
        e.id,
        e.to_email as recipientEmail,
        e.subject,
        e.campaign_id as campaignId,
        e.sent_at as sentAt,
        e.status,
        e.tracking_id as trackingId,
        e.message_id as messageId,
        e.user_id as odUserId,
        e.body,
        (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as openCount,
        (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clickCount,
        (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email AND r.campaign_id = e.campaign_id) as replyCount
      FROM email_logs e
      WHERE e.id = ? AND e.user_id = ?
    `;

    let email = await new Promise((resolve, reject) => {
      db.db.get(emailQueryByUser, [emailId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // 🔥 FALLBACK: If not found by user_id, try searching by just id
    // This handles cases where emails were saved with a different or anonymous user_id
    if (!email) {
      console.log(`📧 [EMAIL-DETAIL] Not found for user ${userId}, trying fallback search...`);

      const emailQueryFallback = `
        SELECT
          e.id,
          e.to_email as recipientEmail,
          e.subject,
          e.campaign_id as campaignId,
          e.sent_at as sentAt,
          e.status,
          e.tracking_id as trackingId,
          e.message_id as messageId,
          e.user_id as odUserId,
          e.body,
          (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as openCount,
          (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clickCount,
          (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email AND r.campaign_id = e.campaign_id) as replyCount
        FROM email_logs e
        WHERE e.id = ?
      `;

      email = await new Promise((resolve, reject) => {
        db.db.get(emailQueryFallback, [emailId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (email) {
        console.log(`📧 [EMAIL-DETAIL] Found email via fallback (saved user: ${email.userId})`);
      }
    }

    if (!email) {
      console.log(`📧 [EMAIL-DETAIL] Email ${emailId} not found in database`);
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    console.error('❌ [EMAIL-DETAIL] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email thread history for a recipient
router.get('/email-thread/:recipientEmail', async (req, res) => {
  try {
    const { recipientEmail } = req.params;
    const { userId = 'anonymous' } = req.query;

    console.log(`📧 [EMAIL-THREAD] Fetching thread for ${recipientEmail}, user ${userId}`);

    // 🔥 FIX: First try with user_id, then fallback to all emails for this recipient
    // NOTE: email_logs now has body column
    let sentEmailsQuery = `
      SELECT
        e.id,
        e.to_email as recipientEmail,
        e.subject,
        e.campaign_id as campaignId,
        e.sent_at as sentAt,
        e.tracking_id as trackingId,
        'sent' as type,
        e.body,
        (SELECT COUNT(*) > 0 FROM email_opens WHERE tracking_id = e.tracking_id) as opened,
        (SELECT COUNT(*) FROM email_opens WHERE tracking_id = e.tracking_id) as openCount
      FROM email_logs e
      WHERE e.to_email = ? AND e.user_id = ?
      ORDER BY e.sent_at DESC
    `;

    let sentEmails = await queryDB(sentEmailsQuery, [recipientEmail, userId]);

    // 🔥 FALLBACK: If no emails found for user, search without user_id filter
    if (sentEmails.length === 0) {
      console.log(`📧 [EMAIL-THREAD] No emails for user ${userId}, trying fallback...`);
      sentEmailsQuery = `
        SELECT
          e.id,
          e.to_email as recipientEmail,
          e.subject,
          e.campaign_id as campaignId,
          e.sent_at as sentAt,
          e.tracking_id as trackingId,
          'sent' as type,
          e.body,
          (SELECT COUNT(*) > 0 FROM email_opens WHERE tracking_id = e.tracking_id) as opened,
          (SELECT COUNT(*) FROM email_opens WHERE tracking_id = e.tracking_id) as openCount
        FROM email_logs e
        WHERE e.to_email = ?
        ORDER BY e.sent_at DESC
      `;
      sentEmails = await queryDB(sentEmailsQuery, [recipientEmail]);
      console.log(`📧 [EMAIL-THREAD] Fallback found ${sentEmails.length} emails`);
    }

    // Get all replies from this recipient
    const repliesQuery = `
      SELECT
        id,
        recipient_email as recipientEmail,
        subject,
        campaign_id as campaignId,
        replied_at as sentAt,
        'reply' as type,
        '' as body
      FROM email_replies
      WHERE recipient_email = ?
      ORDER BY replied_at DESC
    `;

    const replies = await queryDB(repliesQuery, [recipientEmail]);

    // Combine and sort by date (oldest first for chronological thread view)
    const allEmails = [...sentEmails, ...replies].sort((a, b) =>
      new Date(a.sentAt) - new Date(b.sentAt)
    );

    res.json({
      success: true,
      data: allEmails
    });
  } catch (error) {
    console.error('❌ [EMAIL-THREAD] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🆕 Get complete email thread by email ID (for EmailThreadView component)
router.get('/email-thread/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId = 'anonymous' } = req.query;

    console.log(`📧 [EMAIL-THREAD-BY-ID] Fetching thread for email ${emailId}, user ${userId}`);

    // Get the original email
    const emailQuery = `
      SELECT
        e.id,
        e.to_email,
        e.subject,
        e.body,
        e.campaign_id,
        e.sent_at,
        e.tracking_id,
        e.message_id,
        (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as openCount,
        (SELECT MAX(o.opened_at) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as lastOpenedAt,
        (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clickCount,
        (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email AND r.campaign_id = e.campaign_id) as replyCount,
        (SELECT COUNT(*) FROM email_bounces b WHERE b.recipient_email = e.to_email AND b.campaign_id = e.campaign_id) as bounced
      FROM email_logs e
      WHERE e.id = ? AND e.user_id = ?
    `;

    const originalEmail = await new Promise((resolve, reject) => {
      db.db.get(emailQuery, [emailId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!originalEmail) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    // Get prospect info from contacts table (not prospects)
    const contactQuery = `
      SELECT name, email, company, position, industry, address as location
      FROM contacts
      WHERE email = ? AND user_id = ?
      LIMIT 1
    `;

    const prospect = await new Promise((resolve, reject) => {
      db.db.get(contactQuery, [originalEmail.to_email, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          name: originalEmail.to_email.split('@')[0],
          email: originalEmail.to_email,
          company: null,
          position: null
        });
      });
    });

    // Get all emails in this thread (sent emails to this prospect)
    const threadEmailsQuery = `
      SELECT
        e.id,
        e.to_email as "to",
        e.subject,
        e.body as content,
        e.sent_at as timestamp,
        e.tracking_id,
        'sent' as type,
        e.status = 'delivered' as delivered,
        (SELECT COUNT(*) > 0 FROM email_bounces WHERE recipient_email = e.to_email) as bounced,
        (SELECT COUNT(*) > 0 FROM email_opens WHERE tracking_id = e.tracking_id) as opened,
        (SELECT COUNT(*) FROM email_opens WHERE tracking_id = e.tracking_id) as openCount,
        (SELECT MAX(opened_at) FROM email_opens WHERE tracking_id = e.tracking_id) as lastOpenedAt,
        (SELECT COUNT(*) > 0 FROM email_clicks WHERE link_id = e.tracking_id) as clicked,
        (SELECT COUNT(*) FROM email_clicks WHERE link_id = e.tracking_id) as clickCount
      FROM email_logs e
      WHERE e.to_email = ? AND e.user_id = ? AND e.campaign_id = ?
      ORDER BY e.sent_at ASC
    `;

    const sentEmails = await queryDB(threadEmailsQuery, [originalEmail.to_email, userId, originalEmail.campaign_id]);

    // Get all replies from this prospect
    // 🔥 FIX: Skip reply_body entirely since column doesn't exist in production
    let replies = [];
    try {
      const repliesQuery = `
        SELECT
          r.id,
          r.recipient_email as "from",
          r.subject,
          COALESCE(r.subject, 'Reply received') as content,
          r.replied_at as timestamp,
          'received' as type
        FROM email_replies r
        WHERE r.recipient_email = ? AND r.campaign_id = ?
        ORDER BY r.replied_at ASC
      `;
      replies = await queryDB(repliesQuery, [originalEmail.to_email, originalEmail.campaign_id]);
    } catch (replyError) {
      console.log('⚠️ Error querying replies:', replyError.message);
      replies = [];
    }

    // Combine and sort all emails chronologically
    const allEmails = [...sentEmails, ...replies].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Build response
    const threadData = {
      prospect: {
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        position: prospect.position,
        industry: prospect.industry,
        location: prospect.location
      },
      originalEmail: {
        id: originalEmail.id,
        subject: originalEmail.subject,
        content: originalEmail.body,
        sentAt: originalEmail.sent_at,
        campaignId: originalEmail.campaign_id
      },
      stats: {
        opened: originalEmail.openCount > 0,
        openCount: originalEmail.openCount,
        lastOpenedAt: originalEmail.lastOpenedAt,
        clicked: originalEmail.clickCount > 0,
        clickCount: originalEmail.clickCount,
        replied: originalEmail.replyCount > 0,
        replyCount: originalEmail.replyCount,
        bounced: originalEmail.bounced > 0
      },
      emails: allEmails
    };

    res.json({
      success: true,
      data: threadData
    });
  } catch (error) {
    console.error('❌ [EMAIL-THREAD-BY-ID] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🆕 Get COMPLETE email thread with sent emails + replies (for EmailThreadPanel)
router.get('/complete-thread/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { userId = 'anonymous' } = req.query;

    console.log(`📧 [COMPLETE-THREAD] Fetching complete thread for email ${emailId}, user ${userId}`);

    // Step 1: Get the original email
    const emailQuery = `
      SELECT
        e.id,
        e.to_email,
        e.subject,
        e.body,
        e.campaign_id,
        e.sent_at,
        e.tracking_id,
        e.message_id,
        e.user_id,
        (SELECT COUNT(*) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as openCount,
        (SELECT MAX(o.opened_at) FROM email_opens o WHERE o.tracking_id = e.tracking_id) as lastOpenedAt,
        (SELECT COUNT(*) FROM email_clicks c WHERE c.link_id = e.tracking_id) as clickCount,
        (SELECT COUNT(*) FROM email_replies r WHERE r.recipient_email = e.to_email) as replyCount
      FROM email_logs e
      WHERE e.id = ?
    `;

    let originalEmail = await new Promise((resolve, reject) => {
      db.db.get(emailQuery, [emailId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // If not found, try without user filter (for backward compatibility)
    if (!originalEmail) {
      console.log(`📧 [COMPLETE-THREAD] Email ${emailId} not found, trying fallback...`);
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const recipientEmail = originalEmail.to_email;
    const campaignId = originalEmail.campaign_id;

    console.log(`📧 [COMPLETE-THREAD] Found email to ${recipientEmail}, campaign ${campaignId}`);

    // Step 2: Get prospect/contact info (using contacts table, not prospects)
    const contactQuery = `
      SELECT name, email, company, position, industry, address as location
      FROM contacts
      WHERE email = ?
      LIMIT 1
    `;

    const prospect = await new Promise((resolve, reject) => {
      db.db.get(contactQuery, [recipientEmail], (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          name: recipientEmail.split('@')[0],
          email: recipientEmail,
          company: recipientEmail.split('@')[1]?.split('.')[0] || null
        });
      });
    });

    // Step 3: Get ALL sent emails to this prospect (across all campaigns)
    // 🔥 FIX: Also try to get content from email_drafts as fallback for old emails
    const sentEmailsQuery = `
      SELECT
        e.id,
        'You' as "from",
        e.to_email as "to",
        e.subject,
        COALESCE(e.body, d.html, 'Email content was not stored for this message.') as content,
        e.sent_at as timestamp,
        'sent' as type,
        e.tracking_id,
        (SELECT COUNT(*) > 0 FROM email_opens WHERE tracking_id = e.tracking_id) as opened,
        (SELECT COUNT(*) FROM email_opens WHERE tracking_id = e.tracking_id) as openCount,
        (SELECT MAX(opened_at) FROM email_opens WHERE tracking_id = e.tracking_id) as lastOpenedAt,
        (SELECT COUNT(*) > 0 FROM email_clicks WHERE link_id = e.tracking_id) as clicked
      FROM email_logs e
      LEFT JOIN email_drafts d ON d.metadata LIKE '%' || e.to_email || '%' AND d.subject = e.subject
      WHERE e.to_email = ?
      ORDER BY e.sent_at ASC
    `;

    const sentEmails = await queryDB(sentEmailsQuery, [recipientEmail]);
    console.log(`📧 [COMPLETE-THREAD] Found ${sentEmails.length} sent emails`);

    // Step 4: Get ALL replies from this prospect
    // 🔥 FIX: Skip reply_body entirely since column doesn't exist in production
    // This avoids the SQLITE_ERROR: no such column error
    let replies = [];
    try {
      console.log('📧 [COMPLETE-THREAD] Querying replies (without reply_body)...');
      const repliesQuery = `
        SELECT
          r.id,
          r.recipient_email as "from",
          'You' as "to",
          r.subject,
          COALESCE(r.subject, 'Reply received') as content,
          r.replied_at as timestamp,
          'received' as type,
          0 as opened,
          0 as openCount,
          NULL as lastOpenedAt,
          0 as clicked
        FROM email_replies r
        WHERE r.recipient_email = ?
        ORDER BY r.replied_at ASC
      `;
      replies = await queryDB(repliesQuery, [recipientEmail]);
    } catch (replyError) {
      console.log('⚠️ [COMPLETE-THREAD] Error querying replies:', replyError.message);
      replies = []; // Return empty array on error
    }
    console.log(`📧 [COMPLETE-THREAD] Found ${replies.length} replies`);

    // Step 5: Combine and sort all emails chronologically
    const allEmails = [...sentEmails, ...replies].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Step 6: Build response with complete thread data
    const threadData = {
      prospect: {
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        position: prospect.position,
        industry: prospect.industry,
        location: prospect.location
      },
      originalEmail: {
        id: originalEmail.id,
        subject: originalEmail.subject,
        content: originalEmail.body,
        sentAt: originalEmail.sent_at,
        campaignId: originalEmail.campaign_id,
        trackingId: originalEmail.tracking_id
      },
      stats: {
        opened: originalEmail.openCount > 0,
        openCount: originalEmail.openCount || 0,
        lastOpenedAt: originalEmail.lastOpenedAt,
        clicked: originalEmail.clickCount > 0,
        clickCount: originalEmail.clickCount || 0,
        replied: originalEmail.replyCount > 0,
        replyCount: originalEmail.replyCount || 0,
        totalEmails: allEmails.length
      },
      emails: allEmails
    };

    console.log(`📧 [COMPLETE-THREAD] Returning thread with ${allEmails.length} total emails`);

    res.json({
      success: true,
      data: threadData
    });
  } catch (error) {
    console.error('❌ [COMPLETE-THREAD] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🆕 Get email thread by recipient email (alternative endpoint)
router.get('/email-thread-by-recipient/:recipientEmail', async (req, res) => {
  try {
    const { recipientEmail } = req.params;
    const { userId = 'anonymous' } = req.query;

    console.log(`📧 [THREAD-BY-RECIPIENT] Fetching thread for ${recipientEmail}, user ${userId}`);

    // Get all sent emails to this recipient
    // 🔥 FIX: Also try to get content from email_drafts as fallback for old emails
    const sentEmailsQuery = `
      SELECT
        e.id,
        'You' as "from",
        e.to_email as "to",
        e.subject,
        COALESCE(e.body, d.html) as content,
        e.sent_at as timestamp,
        'sent' as type,
        e.tracking_id,
        (SELECT COUNT(*) > 0 FROM email_opens WHERE tracking_id = e.tracking_id) as opened
      FROM email_logs e
      LEFT JOIN email_drafts d ON d.metadata LIKE '%' || e.to_email || '%' AND d.subject = e.subject
      WHERE e.to_email = ?
      ORDER BY e.sent_at ASC
    `;

    const sentEmails = await queryDB(sentEmailsQuery, [decodeURIComponent(recipientEmail)]);

    // Get all replies from this recipient
    // 🔥 FIX: Skip reply_body entirely since column doesn't exist in production
    let replies = [];
    try {
      const repliesQuery = `
        SELECT
          r.id,
          r.recipient_email as "from",
          'You' as "to",
          r.subject,
          COALESCE(r.subject, 'Reply received') as content,
          r.replied_at as timestamp,
          'received' as type,
          0 as opened
        FROM email_replies r
        WHERE r.recipient_email = ?
        ORDER BY r.replied_at ASC
      `;
      replies = await queryDB(repliesQuery, [decodeURIComponent(recipientEmail)]);
    } catch (replyError) {
      console.log('⚠️ Error querying replies:', replyError.message);
      replies = [];
    }

    // Combine and sort chronologically
    const allEmails = [...sentEmails, ...replies].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    console.log(`📧 [THREAD-BY-RECIPIENT] Found ${sentEmails.length} sent, ${replies.length} replies`);

    res.json({
      success: true,
      data: allEmails
    });
  } catch (error) {
    console.error('❌ [THREAD-BY-RECIPIENT] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 NEW: Fetch email thread from Gmail via IMAP
router.get('/fetch-gmail-thread/:recipientEmail', async (req, res) => {
  try {
    const { recipientEmail } = req.params;
    const { userId = 'demo' } = req.query;

    console.log(`📧 [GMAIL THREAD] Fetching thread for ${recipientEmail}, user: ${userId}`);

    // Get IMAP credentials from user_configs
    const userConfigQuery = `SELECT smtp_config FROM user_configs WHERE user_id = ? LIMIT 1`;
    const userConfig = await new Promise((resolve, reject) => {
      db.db.get(userConfigQuery, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userConfig || !userConfig.smtp_config) {
      return res.status(400).json({
        success: false,
        error: 'IMAP not configured. Please configure your email settings.'
      });
    }

    const smtpJson = JSON.parse(userConfig.smtp_config);

    // For Gmail, IMAP uses same credentials as SMTP
    const imapConfig = {
      user: smtpJson.username,
      password: smtpJson.password,
      host: 'imap.gmail.com',
      port: 993
    };

    // Fetch emails from Gmail
    const IMAPEmailTracker = require('../services/IMAPEmailTracker');
    const imapTracker = new IMAPEmailTracker();

    const emails = await imapTracker.fetchEmailThread(decodeURIComponent(recipientEmail), imapConfig);

    console.log(`📧 [GMAIL THREAD] Found ${emails.length} emails in thread`);

    res.json({
      success: true,
      data: emails.map(e => ({
        id: e.id,
        from: e.from,
        to: e.to,
        subject: e.subject,
        content: e.content || e.htmlContent || e.textContent,
        timestamp: e.timestamp,
        type: e.type
      }))
    });

  } catch (error) {
    console.error('❌ [GMAIL THREAD] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🆕 Send reply from thread view
router.post('/send-reply', async (req, res) => {
  try {
    const { userId, emailId, recipientEmail, replyContent, originalSubject } = req.body;

    console.log(`📧 [SEND-REPLY] Sending reply to ${recipientEmail} from user ${userId}`);

    if (!replyContent || !recipientEmail) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get SMTP credentials from smtp_configs table
    const smtpQuery = `
      SELECT host, port, username, password, secure
      FROM smtp_configs
      WHERE is_default = 1 OR id = 1
      LIMIT 1
    `;

    let smtpCreds = await new Promise((resolve, reject) => {
      db.db.get(smtpQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Fallback to user_configs if smtp_configs not found (stores SMTP as JSON)
    if (!smtpCreds) {
      const userConfigQuery = `
        SELECT smtp_config
        FROM user_configs
        WHERE user_id = ?
        LIMIT 1
      `;
      const userConfigRow = await new Promise((resolve, reject) => {
        db.db.get(userConfigQuery, [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (userConfigRow && userConfigRow.smtp_config) {
        try {
          const smtpJson = JSON.parse(userConfigRow.smtp_config);
          if (smtpJson && smtpJson.username && smtpJson.password) {
            smtpCreds = {
              host: smtpJson.host,
              port: smtpJson.port,
              username: smtpJson.username,
              password: smtpJson.password,
              secure: smtpJson.secure
            };
            console.log(`📧 [SEND-REPLY] Found SMTP config in user_configs JSON for user: ${userId}`);
          }
        } catch (parseErr) {
          console.log('⚠️ [SEND-REPLY] Failed to parse smtp_config JSON:', parseErr.message);
        }
      }
    }

    if (!smtpCreds || !smtpCreds.username || !smtpCreds.password) {
      return res.status(400).json({ success: false, error: 'SMTP not configured. Please configure your email settings in Settings → SMTP Settings.' });
    }

    // Send the email using nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpCreds.host || 'smtp.gmail.com',
      port: parseInt(smtpCreds.port) || 587,
      secure: smtpCreds.secure || smtpCreds.port === 465,
      auth: {
        user: smtpCreds.username,
        pass: smtpCreds.password
      },
      tls: { rejectUnauthorized: false }
    });

    // Prepare subject with Re: prefix if not already present
    const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;

    const mailOptions = {
      from: smtpCreds.username,
      to: recipientEmail,
      subject: replySubject,
      html: replyContent
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [SEND-REPLY] Reply sent successfully. MessageId: ${info.messageId}`);

    // Log the sent reply in email_logs
    const insertQuery = `
      INSERT INTO email_logs (user_id, to_email, subject, body, sent_at, status, message_id)
      VALUES (?, ?, ?, ?, datetime('now'), 'sent', ?)
    `;

    await new Promise((resolve, reject) => {
      db.db.run(insertQuery, [userId, recipientEmail, replySubject, replyContent, info.messageId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ [SEND-REPLY] ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the router as default and tracking functions as named exports
module.exports = router;
module.exports.trackEmailSent = trackEmailSentWithWS;
module.exports.trackEmailDelivered = trackEmailDeliveredWithWS;
module.exports.trackEmailOpened = trackEmailOpenedWithWS;
module.exports.trackEmailClicked = trackEmailClickedWithWS;
module.exports.trackEmailReplied = trackEmailRepliedWithWS;
module.exports.trackEmailBounced = trackEmailBouncedWithWS;
module.exports.realtimeData = realtimeData;
module.exports.setWebSocketManager = setWebSocketManager;