const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');
const analyticsRoutes = require('./analytics');
const trackEmailSent = analyticsRoutes.trackEmailSent;
const trackEmailDelivered = analyticsRoutes.trackEmailDelivered;
const db = require('../models/database');

// Initialize email service
const emailService = new EmailService();

// Send single email (root route for compatibility)
router.post('/', async (req, res) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      from,
      smtp,
      trackingEnabled = true,
      campaignId = 'manual'
    } = req.body;

    // Validate required parameters
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: to, subject, and content (html or text)'
      });
    }

    // If custom SMTP config provided, create a new EmailService instance with it
    let emailServiceInstance = emailService;
    if (smtp && smtp.host && smtp.auth) {
      const nodemailer = require('nodemailer');
      const customTransporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 587,
        secure: smtp.secure || false,
        auth: smtp.auth,
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Create temporary email service with custom SMTP
      emailServiceInstance = {
        sendEmail: async (options) => {
          const mailOptions = {
            from: options.from || `"${smtp.senderName || 'Email Agent'}" <${smtp.auth.user}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
          };
          
          const info = await customTransporter.sendMail(mailOptions);
          console.log(`✅ Email sent successfully to ${options.to} using custom SMTP`);
          console.log(`📬 Message ID: ${info.messageId}`);
          
          return {
            success: true,
            messageId: info.messageId,
            recipient: options.to,
            sentAt: new Date().toISOString()
          };
        }
      };
    }

    // Generate tracking ID if enabled
    const trackingId = trackingEnabled ? `${campaignId}_${Date.now()}` : null;

    // Send email (pass userId if available from auth middleware)
    const result = await emailServiceInstance.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      trackingId,
      userId: req.userId || 'anonymous' // Include userId for OAuth support
    });

    // Track analytics in memory
    try {
      trackEmailSent(campaignId, { email: to, name: to }, subject, html || text);
      trackEmailDelivered(campaignId, to, result.messageId);
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    // Log to database
    try {
      await db.logEmailSent({
        to,
        subject,
        campaignId,
        messageId: result.messageId,
        status: 'sent',
        error: null,
        recipientIndex: 0,
        sentAt: result.sentAt
      });
      console.log('📊 Email logged to database');
    } catch (dbError) {
      console.error('Database logging error:', dbError);
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    res.status(500).json({
      success: false,
      error: `Email sending failed: ${error.message}`
    });
  }
});

// Send single email (/send route)
router.post('/send', async (req, res) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      from,
      trackingEnabled = true,
      campaignId = 'manual'
    } = req.body;

    // Validate required parameters
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: to, subject, and content (html or text)'
      });
    }

    // Generate tracking ID if enabled
    const trackingId = trackingEnabled ? `${campaignId}_${Date.now()}` : null;

    // Send email (pass userId if available from auth middleware)
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      trackingId,
      userId: req.userId || 'anonymous' // Include userId for OAuth support
    });

    // Track analytics in memory
    try {
      trackEmailSent(campaignId, { email: to, name: to }, subject, html || text);
      trackEmailDelivered(campaignId, to, result.messageId);
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    // Log to database
    try {
      await db.logEmailSent({
        to,
        subject,
        campaignId,
        messageId: result.messageId,
        status: 'sent',
        error: null,
        recipientIndex: 0,
        sentAt: result.sentAt
      });
      console.log('📊 Email logged to database');
    } catch (dbError) {
      console.error('Database logging error:', dbError);
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    res.status(500).json({
      success: false,
      error: `Email sending failed: ${error.message}`
    });
  }
});

// Send bulk emails
router.post('/send-bulk', async (req, res) => {
  try {
    const {
      recipients,
      subject,
      html,
      text,
      delay = 2000,
      campaignId = 'bulk_' + Date.now()
    } = req.body;

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required and cannot be empty'
      });
    }

    // Validate template
    if (!subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Email template requires subject and content (html or text)'
      });
    }

    // Start bulk sending (async)
    res.json({
      success: true,
      message: 'Bulk email sending started',
      campaignId: campaignId,
      totalEmails: recipients.length
    });

    // Process bulk emails in background with analytics tracking
    const emailTemplate = { subject, html, text };
    const options = { delay, campaignId };

    // Custom bulk sending with analytics tracking
    const userId = req.userId || 'anonymous'; // Capture userId for async context
    (async () => {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        try {
          const result = await emailService.sendEmail({
            to: recipient.email || recipient,
            subject,
            html,
            text,
            trackingId: `${campaignId}_${i}`,
            userId // Include userId for OAuth support
          });

          // Track analytics for each email
          try {
            trackEmailSent(campaignId, { email: recipient.email || recipient, name: recipient.name || '' }, subject, html || text);
            trackEmailDelivered(campaignId, recipient.email || recipient, result.messageId);
          } catch (analyticsError) {
            console.error('Analytics tracking error:', analyticsError);
          }

          // Add delay between emails
          if (i < recipients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${recipient.email || recipient}:`, error.message);
        }
      }
      console.log(`✅ Bulk campaign ${campaignId} completed`);
    })();

  } catch (error) {
    console.error('❌ Bulk email initialization failed:', error.message);
    res.status(500).json({
      success: false,
      error: `Bulk email failed: ${error.message}`
    });
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    // Verify SMTP connection
    await emailService.verifyConnection();
    
    // Send test email
    const result = await emailService.sendTestEmail(testEmail);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    res.status(500).json({
      success: false,
      error: `Email test failed: ${error.message}`
    });
  }
});

// Quick send - simplified interface for AI agents
router.post('/quick-send', async (req, res) => {
  try {
    const {
      recipients, // Can be string or array
      subject,
      message, // Plain text or HTML
      campaignName = 'AI Generated'
    } = req.body;

    if (!recipients || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: recipients, subject, message'
      });
    }

    // Normalize recipients to array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    
    // Detect if message is HTML
    const isHtml = message.includes('<') && message.includes('>');
    
    if (recipientList.length === 1) {
      // Single email
      const result = await emailService.sendEmail({
        to: recipientList[0],
        subject: subject,
        html: isHtml ? message : null,
        text: isHtml ? null : message,
        trackingId: `${campaignName}_${Date.now()}`
      });

      // Track analytics
      try {
        trackEmailSent(campaignName, { email: recipientList[0], name: recipientList[0] }, subject, message);
        trackEmailDelivered(campaignName, recipientList[0], result.messageId);
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
      }

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } else {
      // Multiple emails
      const emailTemplate = {
        subject: subject,
        html: isHtml ? message : null,
        text: isHtml ? null : message
      };

      const recipientObjects = recipientList.map(email => ({ email }));
      
      res.json({
        success: true,
        message: 'Bulk email sending started',
        campaignName: campaignName,
        totalEmails: recipientList.length
      });

      // Process in background
      emailService.sendBulkEmails(recipientObjects, emailTemplate, {
        campaignId: campaignName.replace(/\s+/g, '_') + '_' + Date.now()
      });
    }

  } catch (error) {
    console.error('❌ Quick send failed:', error.message);
    res.status(500).json({
      success: false,
      error: `Quick send failed: ${error.message}`
    });
  }
});

module.exports = router;