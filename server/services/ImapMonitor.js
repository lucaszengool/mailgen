const Imap = require('imap');
const { simpleParser } = require('mailparser');
const EventEmitter = require('events');

/**
 * IMAP Monitor Service
 * Monitors inbox for replies and bounces using IMAP
 */
class ImapMonitor extends EventEmitter {
  constructor() {
    super();
    this.imap = null;
    this.isConnected = false;
    this.isMonitoring = false;
    this.config = null;
    this.checkInterval = null;
  }

  /**
   * Initialize IMAP connection
   */
  async connect(config) {
    if (this.isConnected) {
      console.log('[IMAP] Already connected');
      return;
    }

    this.config = {
      user: config.username || config.user,
      password: config.password,
      host: config.imapHost || 'imap.gmail.com',
      port: config.imapPort || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.config);

      this.imap.once('ready', () => {
        console.log('[IMAP] ✅ Connected successfully');
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('[IMAP] ❌ Connection error:', err.message);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('[IMAP] Connection ended');
        this.isConnected = false;
      });

      this.imap.connect();
    });
  }

  /**
   * Disconnect from IMAP
   */
  disconnect() {
    if (this.imap && this.isConnected) {
      this.imap.end();
      this.isConnected = false;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Start monitoring inbox for new emails
   */
  async startMonitoring(intervalMinutes = 5) {
    if (this.isMonitoring) {
      console.log('[IMAP] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log(`[IMAP] 📧 Starting email monitoring (checking every ${intervalMinutes} minutes)`);

    // Initial check
    await this.checkForNewEmails();

    // Set up periodic checking
    this.checkInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.checkForNewEmails();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('[IMAP] Monitoring stopped');
  }

  /**
   * Check for new emails in inbox
   */
  async checkForNewEmails() {
    if (!this.isConnected) {
      console.warn('[IMAP] Not connected, cannot check emails');
      return;
    }

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('[IMAP] Error opening inbox:', err.message);
          reject(err);
          return;
        }

        // Search for unread emails from the last 7 days
        const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('[IMAP] Search error:', err.message);
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('[IMAP] No new emails');
            resolve([]);
            return;
          }

          console.log(`[IMAP] Found ${results.length} new email(s)`);

          const fetch = this.imap.fetch(results, { bodies: '' });
          const emails = [];

          fetch.on('message', (msg) => {
            msg.on('body', async (stream) => {
              try {
                const parsed = await simpleParser(stream);
                const emailData = {
                  from: parsed.from?.text || parsed.from?.value[0]?.address,
                  to: parsed.to?.text || parsed.to?.value[0]?.address,
                  subject: parsed.subject,
                  date: parsed.date,
                  messageId: parsed.messageId,
                  inReplyTo: parsed.inReplyTo,
                  references: parsed.references,
                  text: parsed.text,
                  html: parsed.html
                };

                emails.push(emailData);

                // Detect if this is a reply to our sent email
                if (this.isReply(emailData)) {
                  console.log('[IMAP] 📩 Reply detected from:', emailData.from);
                  this.emit('reply', emailData);
                }

                // Detect if this is a bounce notification
                if (this.isBounce(emailData)) {
                  console.log('[IMAP] ⚠️ Bounce detected for:', emailData.subject);
                  this.emit('bounce', emailData);
                }
              } catch (parseError) {
                console.error('[IMAP] Error parsing email:', parseError.message);
              }
            });
          });

          fetch.once('error', (fetchErr) => {
            console.error('[IMAP] Fetch error:', fetchErr.message);
            reject(fetchErr);
          });

          fetch.once('end', () => {
            console.log('[IMAP] ✅ Email fetch complete');
            resolve(emails);
          });
        });
      });
    });
  }

  /**
   * Detect if email is a reply
   */
  isReply(emailData) {
    // Check for In-Reply-To or References headers
    if (emailData.inReplyTo || (emailData.references && emailData.references.length > 0)) {
      return true;
    }

    // Check subject line for Re: prefix
    if (emailData.subject && emailData.subject.toLowerCase().startsWith('re:')) {
      return true;
    }

    return false;
  }

  /**
   * Detect if email is a bounce notification
   */
  isBounce(emailData) {
    const from = emailData.from?.toLowerCase() || '';
    const subject = emailData.subject?.toLowerCase() || '';
    const body = emailData.text?.toLowerCase() || '';

    // Common bounce indicators
    const bounceIndicators = [
      'mailer-daemon',
      'postmaster',
      'mail delivery',
      'delivery status notification',
      'undeliverable',
      'returned mail',
      'failure notice',
      'delivery failed',
      'bounce',
      'mail delivery failed',
      'user unknown',
      'mailbox full',
      'message not delivered'
    ];

    // Check from address
    if (bounceIndicators.some(indicator => from.includes(indicator))) {
      return true;
    }

    // Check subject
    if (bounceIndicators.some(indicator => subject.includes(indicator))) {
      return true;
    }

    // Check body (first 500 chars)
    const bodySnippet = body.substring(0, 500);
    if (bounceIndicators.some(indicator => bodySnippet.includes(indicator))) {
      return true;
    }

    return false;
  }

  /**
   * Extract bounce details
   */
  extractBounceDetails(emailData) {
    const body = emailData.text || '';

    let bounceType = 'hard'; // hard or soft
    let reason = 'Unknown';
    let diagnosticCode = '';

    // Try to extract diagnostic code
    const diagnosticMatch = body.match(/diagnostic[- ]code:?\s*(.+)/i);
    if (diagnosticMatch) {
      diagnosticCode = diagnosticMatch[1].trim();
    }

    // Determine bounce type based on error message
    const softBounceIndicators = [
      'mailbox full',
      'quota exceeded',
      'mailbox is full',
      'message too large',
      'try again later',
      'temporary failure'
    ];

    const bodyLower = body.toLowerCase();
    if (softBounceIndicators.some(indicator => bodyLower.includes(indicator))) {
      bounceType = 'soft';
    }

    // Extract reason
    if (bodyLower.includes('user unknown') || bodyLower.includes('no such user')) {
      reason = 'User unknown';
    } else if (bodyLower.includes('mailbox full') || bodyLower.includes('quota')) {
      reason = 'Mailbox full';
    } else if (bodyLower.includes('message too large')) {
      reason = 'Message too large';
    } else if (bodyLower.includes('relay') || bodyLower.includes('relaying')) {
      reason = 'Relay access denied';
    } else if (bodyLower.includes('spam') || bodyLower.includes('blocked')) {
      reason = 'Spam or blocked';
    }

    return {
      bounceType,
      reason,
      diagnosticCode,
      originalMessage: emailData.subject
    };
  }

  /**
   * Test IMAP connection
   */
  async testConnection(config) {
    try {
      await this.connect(config);
      this.disconnect();
      return { success: true, message: 'IMAP connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new ImapMonitor();
