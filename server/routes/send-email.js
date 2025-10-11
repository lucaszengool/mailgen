const express = require('express');
const router = express.Router();
const EmailService = require('../services/EmailService');

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

    // Send email
    const result = await emailServiceInstance.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      trackingId
    });

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

    // Send email
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      trackingId
    });

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

    // Process bulk emails in background
    const emailTemplate = { subject, html, text };
    const options = { delay, campaignId };
    
    emailService.sendBulkEmails(recipients, emailTemplate, options)
      .then(results => {
        console.log(`✅ Bulk campaign ${campaignId} completed:`, results);
      })
      .catch(error => {
        console.error(`❌ Bulk campaign ${campaignId} failed:`, error.message);
      });

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