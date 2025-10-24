/**
 * Unified Email Service
 * Automatically uses the best available email sending method:
 * 1. Try SMTP (Gmail, etc.) if configured
 * 2. Fall back to SendGrid API if SMTP fails or is blocked
 */

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class UnifiedEmailService {
  constructor() {
    this.smtpCache = new Map(); // Cache SMTP transporters
    this.sendGridConfigured = false;

    // Initialize SendGrid if API key is available
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.sendGridConfigured = true;
      console.log('✅ SendGrid API configured');
    } else {
      console.log('⚠️  SendGrid API key not found - only SMTP will be available');
    }
  }

  /**
   * Send email using best available method
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result with method used
   */
  async sendEmail(options) {
    const {
      from,
      to,
      subject,
      html,
      text,
      smtpConfig
    } = options;

    console.log(`📧 Sending email to ${to}...`);

    // Try SMTP first if configured
    if (smtpConfig && smtpConfig.host) {
      try {
        console.log('🔄 Attempting SMTP send...');
        const result = await this.sendViaSMTP({
          from,
          to,
          subject,
          html,
          text
        }, smtpConfig);

        console.log('✅ Email sent via SMTP');
        return {
          success: true,
          method: 'smtp',
          messageId: result.messageId,
          response: result.response
        };
      } catch (smtpError) {
        console.error(`❌ SMTP failed: ${smtpError.message}`);
        console.log('🔄 Falling back to SendGrid API...');

        // Fall back to SendGrid
        if (this.sendGridConfigured) {
          return await this.sendViaSendGrid({ from, to, subject, html, text });
        } else {
          throw new Error(`SMTP failed and SendGrid not configured: ${smtpError.message}`);
        }
      }
    }

    // No SMTP config - try SendGrid directly
    if (this.sendGridConfigured) {
      console.log('📧 Using SendGrid API (no SMTP config)');
      return await this.sendViaSendGrid({ from, to, subject, html, text });
    }

    throw new Error('No email service available - configure SMTP or SendGrid API key');
  }

  /**
   * Send via SMTP (Gmail, etc.)
   */
  async sendViaSMTP(emailData, smtpConfig) {
    const configHash = `${smtpConfig.host}:${smtpConfig.port || 587}:${smtpConfig.user || smtpConfig.username}`;

    // Get or create transporter
    let transporter = this.smtpCache.get(configHash);

    if (!transporter) {
      console.log('🔧 Creating SMTP transporter...');
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: parseInt(smtpConfig.port || '587'),
        secure: smtpConfig.secure === true,
        auth: {
          user: smtpConfig.user || smtpConfig.username || smtpConfig.auth?.user,
          pass: smtpConfig.password || smtpConfig.pass || smtpConfig.auth?.pass
        },
        connectionTimeout: 15000, // 15 seconds for Railway
        greetingTimeout: 15000,
        socketTimeout: 30000
      });

      this.smtpCache.set(configHash, transporter);
    }

    return await transporter.sendMail({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });
  }

  /**
   * Send via SendGrid API
   */
  async sendViaSendGrid(emailData) {
    if (!this.sendGridConfigured) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to: emailData.to,
      from: emailData.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@fruitai.org',
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.subject
    };

    const result = await sgMail.send(msg);

    console.log('✅ Email sent via SendGrid API');
    return {
      success: true,
      method: 'sendgrid',
      messageId: result[0].headers['x-message-id'],
      statusCode: result[0].statusCode
    };
  }

  /**
   * Clear SMTP cache
   */
  clearSMTPCache() {
    const count = this.smtpCache.size;
    this.smtpCache.clear();
    console.log(`🗑️  Cleared ${count} SMTP transporters`);
  }

  /**
   * Test connectivity (for Railway diagnostics)
   */
  async testConnectivity() {
    const results = {
      smtp: false,
      sendgrid: this.sendGridConfigured
    };

    // Test SMTP if configured
    if (process.env.SMTP_HOST) {
      try {
        const testConfig = {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASS
        };

        await this.sendViaSMTP({
          from: process.env.SMTP_USER,
          to: process.env.SMTP_USER,
          subject: 'Test',
          html: 'Test'
        }, testConfig);

        results.smtp = true;
      } catch (error) {
        console.error('SMTP test failed:', error.message);
      }
    }

    return results;
  }
}

// Singleton instance
const unifiedEmailService = new UnifiedEmailService();

module.exports = unifiedEmailService;
