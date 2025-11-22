const Imap = require('imap');
const { simpleParser } = require('mailparser');
const analyticsRoutes = require('../routes/analytics');

class IMAPEmailTracker {
  constructor() {
    this.imap = null;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.processedMessageIds = new Set();
    console.log('📬 IMAP Email Tracker initialized');
  }

  /**
   * Initialize IMAP connection
   */
  async connect(imapConfig) {
    try {
      this.imap = new Imap({
        user: imapConfig.user || imapConfig.email,
        password: imapConfig.password,
        host: imapConfig.host || 'imap.gmail.com',
        port: imapConfig.port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      return new Promise((resolve, reject) => {
        this.imap.once('ready', () => {
          console.log('✅ IMAP connected successfully');
          resolve(true);
        });

        this.imap.once('error', (err) => {
          console.error('❌ IMAP connection error:', err.message);
          reject(err);
        });

        this.imap.connect();
      });
    } catch (error) {
      console.error('❌ Failed to connect to IMAP:', error.message);
      throw error;
    }
  }

  /**
   * Start monitoring inbox for replies, bounces, and read receipts
   */
  async startMonitoring(checkIntervalMinutes = 5) {
    if (this.isMonitoring) {
      console.log('⚠️ IMAP monitoring already running');
      return;
    }

    console.log(`📬 Starting IMAP monitoring (checking every ${checkIntervalMinutes} minutes)`);
    this.isMonitoring = true;

    // Check immediately
    await this.checkInbox();

    // Then check periodically
    this.monitoringInterval = setInterval(async () => {
      await this.checkInbox();
    }, checkIntervalMinutes * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📬 IMAP monitoring stopped');
  }

  /**
   * Check inbox for new messages
   */
  async checkInbox() {
    if (!this.imap) {
      console.error('❌ IMAP not connected');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Error opening inbox:', err.message);
          reject(err);
          return;
        }

        // Search for unseen messages from today
        const searchCriteria = ['UNSEEN', ['SINCE', new Date()]];

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('❌ Error searching inbox:', err.message);
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log('📬 No new messages to process');
            resolve(0);
            return;
          }

          console.log(`📬 Found ${results.length} new messages to process`);

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true
          });

          let processed = 0;

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('❌ Error parsing message:', err.message);
                  return;
                }

                await this.processMessage(parsed);
                processed++;
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err.message);
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ Processed ${processed} messages`);
            resolve(processed);
          });
        });
      });
    });
  }

  /**
   * Process individual message
   */
  async processMessage(parsed) {
    try {
      const messageId = parsed.messageId;

      // Skip if already processed
      if (this.processedMessageIds.has(messageId)) {
        return;
      }
      this.processedMessageIds.add(messageId);

      const from = parsed.from?.text || '';
      const to = parsed.to?.text || '';
      const subject = parsed.subject || '';
      const text = parsed.text || '';
      const inReplyTo = parsed.inReplyTo;
      const references = parsed.references || [];

      console.log(`📧 Processing: ${subject} from ${from}`);

      // Check if it's a bounce message
      if (this.isBounceMessage(from, subject, text)) {
        await this.handleBounce(parsed);
        return;
      }

      // Check if it's a reply to our sent email
      if (this.isReplyMessage(inReplyTo, references)) {
        await this.handleReply(parsed);
        return;
      }

      // Check if it's a read receipt
      if (this.isReadReceipt(subject, text)) {
        await this.handleReadReceipt(parsed);
        return;
      }

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
    }
  }

  /**
   * Check if message is a bounce
   */
  isBounceMessage(from, subject, text) {
    const bounceIndicators = [
      'mailer-daemon',
      'postmaster',
      'delivery status notification',
      'undelivered mail',
      'delivery failed',
      'returned mail',
      'mail delivery failed',
      'undeliverable',
      'bounce'
    ];

    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();
    const textLower = text.toLowerCase();

    return bounceIndicators.some(indicator =>
      fromLower.includes(indicator) ||
      subjectLower.includes(indicator) ||
      textLower.includes(indicator)
    );
  }

  /**
   * Check if message is a reply
   */
  isReplyMessage(inReplyTo, references) {
    // If it has In-Reply-To or References header, it's a reply
    return !!(inReplyTo || (references && references.length > 0));
  }

  /**
   * Check if message is a read receipt
   */
  isReadReceipt(subject, text) {
    const receiptIndicators = [
      'read:',
      'read receipt',
      'return receipt',
      'message read',
      'opened:'
    ];

    const subjectLower = subject.toLowerCase();
    const textLower = text.toLowerCase();

    return receiptIndicators.some(indicator =>
      subjectLower.includes(indicator) ||
      textLower.includes(indicator)
    );
  }

  /**
   * Handle bounce message
   */
  async handleBounce(parsed) {
    try {
      const recipientEmail = this.extractRecipientFromBounce(parsed);
      const campaignId = this.extractCampaignIdFromMessage(parsed);

      if (recipientEmail) {
        console.log(`📮 Bounce detected for: ${recipientEmail}`);

        // Track bounce in analytics (in-memory)
        if (analyticsRoutes.trackEmailBounced) {
          analyticsRoutes.trackEmailBounced(campaignId || 'unknown', recipientEmail);
        }

        // 💾 Log to database for persistent tracking
        try {
          const db = require('../models/database');
          await db.logEmailBounce({
            campaignId: campaignId || 'unknown',
            recipientEmail: recipientEmail,
            bouncedAt: new Date().toISOString(),
            bounceType: 'hard', // Could be improved with bounce type detection
            reason: parsed.subject || 'Email bounced'
          });
          console.log(`[IMAP] ✅ Bounce logged to database: ${recipientEmail}`);
        } catch (dbError) {
          console.error('[IMAP] Failed to log bounce to database:', dbError.message);
        }
      }
    } catch (error) {
      console.error('❌ Error handling bounce:', error.message);
    }
  }

  /**
   * Handle reply message
   */
  async handleReply(parsed) {
    try {
      const from = parsed.from?.value?.[0]?.address || parsed.from?.text;
      const campaignId = this.extractCampaignIdFromMessage(parsed);

      console.log(`💬 Reply detected from: ${from}`);

      // 🔥 FIX: Look up the original sent email to get the correct campaign ID
      let actualCampaignId = campaignId;
      try {
        const db = require('../models/database');
        // Find the original email sent to this recipient
        const originalEmail = await new Promise((resolve, reject) => {
          db.db.get(
            'SELECT campaign_id FROM email_logs WHERE to_email = ? ORDER BY sent_at DESC LIMIT 1',
            [from],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (originalEmail && originalEmail.campaign_id) {
          actualCampaignId = originalEmail.campaign_id;
          console.log(`[IMAP] 🔍 Found original campaign ID: ${actualCampaignId} for reply from ${from}`);
        }
      } catch (lookupError) {
        console.error('[IMAP] Error looking up original email:', lookupError.message);
      }

      // Track reply in analytics (in-memory)
      if (analyticsRoutes.trackEmailReplied) {
        analyticsRoutes.trackEmailReplied(actualCampaignId || 'unknown', from);
      }

      // 💾 Log to database for persistent tracking
      try {
        const db = require('../models/database');
        await db.logEmailReply({
          campaignId: actualCampaignId || 'unknown',
          recipientEmail: from,
          repliedAt: new Date().toISOString(),
          subject: parsed.subject || '',
          messageId: parsed.messageId || ''
        });
        console.log(`[IMAP] ✅ Reply logged to database: ${from} (campaign: ${actualCampaignId})`);
      } catch (dbError) {
        console.error('[IMAP] Failed to log reply to database:', dbError.message);
      }
    } catch (error) {
      console.error('❌ Error handling reply:', error.message);
    }
  }

  /**
   * Handle read receipt
   */
  async handleReadReceipt(parsed) {
    try {
      const recipientEmail = this.extractRecipientFromReceipt(parsed);
      const subject = parsed.subject || '';
      const campaignId = this.extractCampaignIdFromMessage(parsed);

      console.log(`👁️ Read receipt from: ${recipientEmail}`);

      // Track open in analytics
      analyticsRoutes.trackEmailOpened(campaignId || 'unknown', recipientEmail, subject);
    } catch (error) {
      console.error('❌ Error handling read receipt:', error.message);
    }
  }

  /**
   * Extract recipient email from bounce message
   */
  extractRecipientFromBounce(parsed) {
    const text = parsed.text || '';

    // Try to find email in common bounce patterns
    const emailMatch = text.match(/(?:to|recipient|address)[:.\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

    if (emailMatch) {
      return emailMatch[1];
    }

    // Try to extract from original recipient
    if (parsed.to?.value?.[0]?.address) {
      return parsed.to.value[0].address;
    }

    return null;
  }

  /**
   * Extract recipient email from read receipt
   */
  extractRecipientFromReceipt(parsed) {
    const from = parsed.from?.value?.[0]?.address || parsed.from?.text;
    return from;
  }

  /**
   * Extract campaign ID from message headers or subject
   */
  extractCampaignIdFromMessage(parsed) {
    // Try to find campaign ID in custom headers
    if (parsed.headers && parsed.headers.get('x-campaign-id')) {
      return parsed.headers.get('x-campaign-id');
    }

    // Try to extract from subject
    const subject = parsed.subject || '';
    const match = subject.match(/\[Campaign:([^\]]+)\]/);
    if (match) {
      return match[1];
    }

    return 'unknown';
  }

  /**
   * Disconnect from IMAP
   */
  disconnect() {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
    this.stopMonitoring();
    console.log('📬 IMAP disconnected');
  }
}

module.exports = IMAPEmailTracker;
