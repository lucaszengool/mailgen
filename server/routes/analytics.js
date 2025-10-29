const express = require('express');
const router = express.Router();

// In-memory storage for analytics (replace with database in production)
let emailAnalytics = {
  campaigns: new Map(),
  dailyStats: new Map(),
  providers: new Map(),
  industries: new Map(),
  locations: new Map(),
  subjects: new Map(),
  sendTimes: new Map()
};

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
router.get('/email-metrics', (req, res) => {
  try {
    const { timeRange = '30d', campaign = 'all' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);

    let totalSent = 0, totalDelivered = 0, totalOpened = 0, totalClicked = 0;
    let totalReplied = 0, totalBounced = 0, totalUnsubscribed = 0;

    // Aggregate data from campaigns
    for (const [campaignId, campaignData] of emailAnalytics.campaigns) {
      if (campaign === 'all' || campaignId === campaign) {
        if (campaignData.startDate >= sinceDate) {
          totalSent += campaignData.sent;
          totalDelivered += campaignData.delivered;
          totalOpened += campaignData.opens;
          totalClicked += campaignData.clicks;
          totalReplied += campaignData.replies;
          totalBounced += campaignData.bounces;
          totalUnsubscribed += campaignData.unsubscribes;
        }
      }
    }

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100) : 0;
    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100) : 0;
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100) : 0;
    const replyRate = totalDelivered > 0 ? ((totalReplied / totalDelivered) * 100) : 0;
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100) : 0;
    const unsubscribeRate = totalDelivered > 0 ? ((totalUnsubscribed / totalDelivered) * 100) : 0;

    res.json({
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
    });
  } catch (error) {
    console.error('Error getting email metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get campaign performance data
router.get('/campaign-performance', (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);

    const campaigns = Array.from(emailAnalytics.campaigns.values())
      .filter(campaign => campaign.startDate >= sinceDate)
      .map(campaign => ({
        name: campaign.name,
        sent: campaign.sent,
        delivered: campaign.delivered,
        opens: campaign.opens,
        clicks: campaign.clicks,
        replies: campaign.replies,
        status: campaign.status
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
router.get('/engagement-trends', (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const sinceDate = getTimeRangeFilter(timeRange);

    const trends = Array.from(emailAnalytics.dailyStats.values())
      .filter(stat => new Date(stat.date) >= sinceDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

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
router.get('/realtime', (req, res) => {
  try {
    // Calculate current open rate
    let totalSentToday = 0;
    let totalOpensToday = 0;
    const today = new Date().toISOString().split('T')[0];

    if (emailAnalytics.dailyStats.has(today)) {
      const todayStats = emailAnalytics.dailyStats.get(today);
      totalSentToday = todayStats.sent;
      totalOpensToday = todayStats.opens;
    }

    const currentOpenRate = totalSentToday > 0 ?
      parseFloat(((totalOpensToday / totalSentToday) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        activeCampaigns: realtimeData.activeCampaigns,
        sentToday: totalSentToday,
        currentOpenRate: `${currentOpenRate}%`,
        lastUpdate: realtimeData.lastUpdate
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
    const db = require('../models/database');

    // Get all email logs from database
    db.db.all('SELECT * FROM email_logs WHERE status = "sent" ORDER BY sent_at ASC', (err, rows) => {
      if (err) {
        console.error('Error reading email logs:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      console.log(`📊 Backfilling analytics with ${rows.length} emails from database`);

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

    // Get IMAP config from database
    const imapConfig = await db.getSMTPConfig('anonymous'); // Use same config for IMAP

    if (!imapConfig) {
      return res.status(400).json({
        success: false,
        error: 'No email configuration found. Please configure SMTP/IMAP first.'
      });
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

    await imapTracker.connect(imapConnection);
    await imapTracker.startMonitoring(5); // Check every 5 minutes

    res.json({
      success: true,
      message: 'IMAP monitoring started successfully',
      checkInterval: '5 minutes'
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