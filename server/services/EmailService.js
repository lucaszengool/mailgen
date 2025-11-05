const nodemailer = require('nodemailer');
const KnowledgeBase = require('../models/KnowledgeBase');
const GmailOAuthService = require('./GmailOAuthService');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.knowledgeBase = new KnowledgeBase();
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      throw error;
    }
  }

  async sendEmail(options) {
    try {
      const {
        to,
        subject,
        html,
        text,
        from,
        attachments = [],
        trackingId = null,
        userId = null // Add userId parameter for OAuth support
      } = options;

      if (!to || !subject || (!html && !text)) {
        throw new Error('Missing required email parameters: to, subject, and content');
      }

      // Try to use Gmail OAuth if userId is provided
      let transporter = this.transporter;
      let senderEmail = process.env.SMTP_USERNAME;

      if (userId) {
        try {
          const oauthConfig = await GmailOAuthService.getSMTPConfigWithOAuth(userId);
          if (oauthConfig) {
            console.log('✅ Using Gmail OAuth for email sending');
            transporter = nodemailer.createTransport(oauthConfig);
            senderEmail = oauthConfig.auth.user;
          }
        } catch (error) {
          console.log('⚠️ Gmail OAuth not available, falling back to SMTP:', error.message);
        }
      }

      // Add tracking pixel if trackingId provided
      let finalHtml = html;
      if (trackingId && html) {
        const trackingPixel = `<img src="http://localhost:3333/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;">`;
        finalHtml = `${html}${trackingPixel}`;
      }

      // Get sender info from knowledge base if targetWebsite is provided
      let senderFrom = from;
      if (!senderFrom && options.targetWebsite) {
        try {
          const senderInfo = await this.knowledgeBase.getSenderInfo(options.targetWebsite);
          if (senderInfo && senderInfo.sender_name) {
            senderFrom = `"${senderInfo.sender_name}" <${senderEmail}>`;
          }
        } catch (error) {
          console.log('Using default sender name as knowledge base lookup failed');
        }
      }

      const mailOptions = {
        from: senderFrom || `"${process.env.SENDER_NAME || 'Partnership Team'}" <${senderEmail}>`,
        to: to,
        subject: subject,
        html: finalHtml,
        text: text,
        attachments: attachments
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`📬 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: to,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error.message);
      throw error;
    }
  }

  async sendBulkEmails(recipients, emailTemplate, options = {}) {
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    const delay = options.delay || 2000; // 2 second delay between emails
    const campaignId = options.campaignId || 'bulk_' + Date.now();

    console.log(`🚀 Starting bulk email send: ${recipients.length} emails`);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Personalize content
        let personalizedSubject = emailTemplate.subject;
        let personalizedHtml = emailTemplate.html;
        let personalizedText = emailTemplate.text;

        // Replace placeholders
        const placeholders = {
          name: recipient.name || 'there',
          company: recipient.company || '',
          email: recipient.email,
          ...recipient.customFields
        };

        Object.keys(placeholders).forEach(key => {
          const value = placeholders[key];
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          personalizedSubject = personalizedSubject?.replace(regex, value);
          personalizedHtml = personalizedHtml?.replace(regex, value);
          personalizedText = personalizedText?.replace(regex, value);
        });

        // Send email with tracking
        const trackingId = `${campaignId}_${i}`;
        await this.sendEmail({
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          trackingId: trackingId
        });

        results.sent++;
        console.log(`📧 Progress: ${i + 1}/${recipients.length} - Sent to ${recipient.email}`);

        // Add delay between emails to avoid rate limiting
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message
        });
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
      }
    }

    console.log(`✅ Bulk send completed: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error.message);
      throw error;
    }
  }

  async sendTestEmail(testEmail = null) {
    const testRecipient = testEmail || process.env.SMTP_USERNAME;
    
    try {
      const result = await this.sendEmail({
        to: testRecipient,
        subject: '✅ Email Service Test - Success!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">🎉 Email Service Working!</h2>
            <p>Congratulations! Your email service is properly configured and working.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>Username:</strong> ${process.env.SMTP_USERNAME}</li>
                <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>
            
            <p style="color: #28a745; font-weight: bold;">
              ✅ Ready to send real emails!
            </p>
          </div>
        `,
        text: 'Email service test successful! Your configuration is working properly.'
      });

      return result;
    } catch (error) {
      console.error('❌ Test email failed:', error.message);
      throw error;
    }
  }
}

module.exports = EmailService;