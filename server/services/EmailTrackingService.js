const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Email Tracking Service
 * Handles tracking pixels, link tracking, and event storage
 */
class EmailTrackingService {
  constructor() {
    this.trackingDbPath = path.join(__dirname, '../db/tracking_events.json');
    this.baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000';
    this.ensureDbExists();
  }

  /**
   * Ensure tracking database file exists
   */
  async ensureDbExists() {
    try {
      await fs.access(this.trackingDbPath);
    } catch (error) {
      // File doesn't exist, create it
      const dbDir = path.dirname(this.trackingDbPath);
      await fs.mkdir(dbDir, { recursive: true });
      await fs.writeFile(this.trackingDbPath, JSON.stringify({
        events: [],
        emails: {}
      }, null, 2));
    }
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Store email metadata for tracking
   */
  async registerEmail(emailData) {
    const trackingId = this.generateTrackingId();

    const emailRecord = {
      trackingId,
      emailId: emailData.emailId || trackingId,
      recipientEmail: emailData.to,
      recipientName: emailData.recipientName,
      subject: emailData.subject,
      campaignId: emailData.campaignId || 'default',
      sentAt: new Date().toISOString(),
      status: 'sent',
      events: {
        opens: [],
        clicks: [],
        replies: [],
        bounces: []
      }
    };

    // Save to database
    const db = await this.loadDb();
    db.emails[trackingId] = emailRecord;
    await this.saveDb(db);

    return trackingId;
  }

  /**
   * Generate tracking pixel HTML
   */
  getTrackingPixel(trackingId) {
    const pixelUrl = `${this.baseUrl}/api/track/open/${trackingId}`;
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;border:0;" />`;
  }

  /**
   * Wrap links with tracking redirects
   */
  wrapLinksWithTracking(html, trackingId) {
    if (!html) return html;

    // Find all <a href="..."> tags
    const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;

    let linkIndex = 0;
    const wrappedHtml = html.replace(linkRegex, (match, before, url, after) => {
      // Skip if already a tracking link
      if (url.includes('/api/track/click/')) {
        return match;
      }

      // Skip anchor links and mailto links
      if (url.startsWith('#') || url.startsWith('mailto:')) {
        return match;
      }

      linkIndex++;
      const linkTrackingUrl = `${this.baseUrl}/api/track/click/${trackingId}/${linkIndex}?url=${encodeURIComponent(url)}`;

      return `<a ${before}href="${linkTrackingUrl}"${after}>`;
    });

    return wrappedHtml;
  }

  /**
   * Track email open event
   */
  async trackOpen(trackingId, metadata = {}) {
    try {
      const db = await this.loadDb();

      if (!db.emails[trackingId]) {
        console.warn(`[Tracking] Email not found for trackingId: ${trackingId}`);
        return false;
      }

      const openEvent = {
        eventType: 'open',
        timestamp: new Date().toISOString(),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        referer: metadata.referer
      };

      db.emails[trackingId].events.opens.push(openEvent);
      db.emails[trackingId].status = 'opened';
      db.events.push({
        ...openEvent,
        trackingId,
        emailId: db.emails[trackingId].emailId,
        recipientEmail: db.emails[trackingId].recipientEmail
      });

      await this.saveDb(db);

      // Also track in analytics (in-memory - DEPRECATED)
      try {
        const analyticsRoutes = require('../routes/analytics');
        const email = db.emails[trackingId];
        analyticsRoutes.trackEmailOpened(
          email.campaignId || 'unknown',
          email.recipientEmail,
          email.subject
        );
      } catch (analyticsError) {
        console.error('[Tracking] Analytics error:', analyticsError.message);
      }

      // 💾 CRITICAL: Save to SQLite database for analytics dashboard
      try {
        const dbModule = require('../models/database');
        await dbModule.logEmailOpen({
          trackingId: trackingId,
          openedAt: new Date().toISOString(),
          userAgent: metadata.userAgent || 'unknown',
          ip: metadata.ipAddress || 'unknown'
        });
        console.log(`[Tracking] ✅ Email open logged to database: ${trackingId}`);
      } catch (dbError) {
        console.error('[Tracking] Failed to log open to database:', dbError.message);
        // Don't fail the request if DB logging fails
      }

      console.log(`[Tracking] ✅ Email opened: ${trackingId}`);
      return true;
    } catch (error) {
      console.error('[Tracking] Error tracking open:', error);
      return false;
    }
  }

  /**
   * Track link click event
   */
  async trackClick(trackingId, linkIndex, metadata = {}) {
    try {
      const db = await this.loadDb();

      if (!db.emails[trackingId]) {
        console.warn(`[Tracking] Email not found for trackingId: ${trackingId}`);
        return null;
      }

      const clickEvent = {
        eventType: 'click',
        linkIndex,
        targetUrl: metadata.targetUrl,
        timestamp: new Date().toISOString(),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress
      };

      db.emails[trackingId].events.clicks.push(clickEvent);
      db.emails[trackingId].status = 'clicked';
      db.events.push({
        ...clickEvent,
        trackingId,
        emailId: db.emails[trackingId].emailId,
        recipientEmail: db.emails[trackingId].recipientEmail
      });

      await this.saveDb(db);

      // Also track in analytics (in-memory - DEPRECATED)
      try {
        const analyticsRoutes = require('../routes/analytics');
        const email = db.emails[trackingId];
        analyticsRoutes.trackEmailClicked(
          email.campaignId || 'unknown',
          email.recipientEmail,
          metadata.targetUrl
        );
      } catch (analyticsError) {
        console.error('[Tracking] Analytics error:', analyticsError.message);
      }

      // 💾 CRITICAL: Save to SQLite database for analytics dashboard
      try {
        const dbModule = require('../models/database');
        const email = db.emails[trackingId];
        await dbModule.logEmailClick({
          campaignId: email.campaignId || 'unknown',
          linkId: `link_${linkIndex}`,
          targetUrl: metadata.targetUrl,
          clickedAt: new Date().toISOString(),
          userAgent: metadata.userAgent || 'unknown',
          ipAddress: metadata.ipAddress || 'unknown'
        });
        console.log(`[Tracking] ✅ Email click logged to database: ${trackingId}`);
      } catch (dbError) {
        console.error('[Tracking] Failed to log click to database:', dbError.message);
        // Don't fail the request if DB logging fails
      }

      console.log(`[Tracking] ✅ Link clicked: ${trackingId}, link ${linkIndex}`);
      return metadata.targetUrl;
    } catch (error) {
      console.error('[Tracking] Error tracking click:', error);
      return null;
    }
  }

  /**
   * Track reply event
   */
  async trackReply(trackingId, replyData) {
    try {
      const db = await this.loadDb();

      if (!db.emails[trackingId]) {
        console.warn(`[Tracking] Email not found for trackingId: ${trackingId}`);
        return false;
      }

      const replyEvent = {
        eventType: 'reply',
        timestamp: new Date().toISOString(),
        from: replyData.from,
        subject: replyData.subject,
        body: replyData.body,
        messageId: replyData.messageId
      };

      db.emails[trackingId].events.replies.push(replyEvent);
      db.emails[trackingId].status = 'replied';
      db.events.push({
        ...replyEvent,
        trackingId,
        emailId: db.emails[trackingId].emailId,
        recipientEmail: db.emails[trackingId].recipientEmail
      });

      await this.saveDb(db);
      console.log(`[Tracking] ✅ Reply received: ${trackingId}`);
      return true;
    } catch (error) {
      console.error('[Tracking] Error tracking reply:', error);
      return false;
    }
  }

  /**
   * Track bounce event
   */
  async trackBounce(trackingId, bounceData) {
    try {
      const db = await this.loadDb();

      if (!db.emails[trackingId]) {
        console.warn(`[Tracking] Email not found for trackingId: ${trackingId}`);
        return false;
      }

      const bounceEvent = {
        eventType: 'bounce',
        timestamp: new Date().toISOString(),
        bounceType: bounceData.bounceType || 'hard',
        reason: bounceData.reason,
        diagnosticCode: bounceData.diagnosticCode
      };

      db.emails[trackingId].events.bounces.push(bounceEvent);
      db.emails[trackingId].status = 'bounced';
      db.events.push({
        ...bounceEvent,
        trackingId,
        emailId: db.emails[trackingId].emailId,
        recipientEmail: db.emails[trackingId].recipientEmail
      });

      await this.saveDb(db);
      console.log(`[Tracking] ✅ Bounce detected: ${trackingId}`);
      return true;
    } catch (error) {
      console.error('[Tracking] Error tracking bounce:', error);
      return false;
    }
  }

  /**
   * Get all tracking events for analytics
   */
  async getAllEvents(filters = {}) {
    try {
      const db = await this.loadDb();
      let events = db.events;

      // Filter by campaign
      if (filters.campaignId) {
        events = events.filter(e => {
          const email = db.emails[e.trackingId];
          return email && email.campaignId === filters.campaignId;
        });
      }

      // Filter by date range
      if (filters.startDate) {
        events = events.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        events = events.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
      }

      // Filter by event type
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }

      return events;
    } catch (error) {
      console.error('[Tracking] Error getting events:', error);
      return [];
    }
  }

  /**
   * Get email analytics summary
   */
  async getAnalyticsSummary(campaignId = null) {
    try {
      const db = await this.loadDb();
      const emails = Object.values(db.emails);

      // Filter by campaign if specified
      const filteredEmails = campaignId
        ? emails.filter(e => e.campaignId === campaignId)
        : emails;

      const summary = {
        totalSent: filteredEmails.length,
        totalDelivered: filteredEmails.filter(e => e.status !== 'bounced').length,
        totalOpened: filteredEmails.filter(e => e.events.opens.length > 0).length,
        totalClicked: filteredEmails.filter(e => e.events.clicks.length > 0).length,
        totalReplied: filteredEmails.filter(e => e.events.replies.length > 0).length,
        totalBounced: filteredEmails.filter(e => e.events.bounces.length > 0).length,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
        bounceRate: 0
      };

      // Calculate rates
      if (summary.totalDelivered > 0) {
        summary.openRate = (summary.totalOpened / summary.totalDelivered * 100).toFixed(2);
        summary.clickRate = (summary.totalClicked / summary.totalDelivered * 100).toFixed(2);
        summary.replyRate = (summary.totalReplied / summary.totalDelivered * 100).toFixed(2);
      }
      if (summary.totalSent > 0) {
        summary.bounceRate = (summary.totalBounced / summary.totalSent * 100).toFixed(2);
      }

      return summary;
    } catch (error) {
      console.error('[Tracking] Error getting analytics summary:', error);
      return null;
    }
  }

  /**
   * Load database from file
   */
  async loadDb() {
    try {
      const data = await fs.readFile(this.trackingDbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[Tracking] Error loading database:', error);
      return { events: [], emails: {} };
    }
  }

  /**
   * Save database to file
   */
  async saveDb(db) {
    try {
      await fs.writeFile(this.trackingDbPath, JSON.stringify(db, null, 2));
    } catch (error) {
      console.error('[Tracking] Error saving database:', error);
    }
  }
}

module.exports = new EmailTrackingService();
