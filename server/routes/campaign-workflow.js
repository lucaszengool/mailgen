/**
 * Campaign Workflow Routes
 * Handles preview-before-send workflow and user learning system
 */

const express = require('express');
const router = express.Router();
const EmailEditorService = require('../services/EmailEditorService');
const EmailTemplateService = require('../services/EmailTemplateService');
const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
const fs = require('fs').promises;
const path = require('path');

const emailEditor = new EmailEditorService();
const templateService = new EmailTemplateService();

// Start preview workflow - generates emails but doesn't send them
router.post('/preview-workflow', async (req, res) => {
  try {
    const { campaignId, mode = 'preview', requireApproval = true } = req.body;
    
    console.log('🔄 Starting preview workflow for campaign:', campaignId);
    
    // Get LangGraph agent instance
    const agent = new LangGraphMarketingAgent();
    
    // Start workflow in preview mode
    const result = await agent.startPreviewWorkflow({
      campaignId,
      mode,
      requireApproval,
      businessName: 'TechCorp Solutions',
      industry: 'Food Technology',
      targetEmails: 5, // Start with fewer emails for preview
      testMode: false
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Preview workflow started successfully',
        campaignId,
        emailsGenerated: result.emailsGenerated || 0
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to start preview workflow'
      });
    }
    
  } catch (error) {
    console.error('Preview workflow failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pending emails for a campaign (emails generated but not sent)
router.get('/:campaignId/pending-emails', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    console.log('📧 Fetching pending emails for campaign:', campaignId);
    
    // Get LangGraph agent to access pending emails
    const agent = new LangGraphMarketingAgent();
    const pendingEmails = agent.getPendingEmails(campaignId);
    
    if (pendingEmails && pendingEmails.size > 0) {
      const emails = Array.from(pendingEmails.values()).map(emailData => ({
        id: emailData.emailKey || `${campaignId}_${Date.now()}`,
        subject: emailData.emailContent?.subject || 'Generated Email',
        body: emailData.emailContent?.body || emailData.emailContent?.html || '',
        html: emailData.emailContent?.html || emailData.emailContent?.body || '',
        recipient_name: emailData.prospect?.name || 'Prospect',
        recipient_email: emailData.prospect?.email || 'prospect@example.com',
        recipient_company: emailData.prospect?.company || 'Company',
        template_used: emailData.emailContent?.template_used || 'default',
        performance_score: emailData.emailContent?.performance_score || 85,
        isApproved: false,
        isEdited: false
      }));
      
      res.json({
        success: true,
        emails,
        total: emails.length
      });
    } else {
      res.json({
        success: true,
        emails: [],
        total: 0
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch pending emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve an email for sending
router.post('/approve-email', async (req, res) => {
  try {
    const { emailId, campaignId, prospectEmail, editedContent } = req.body;
    
    console.log('✅ Approving and sending email:', emailId, 'for campaign:', campaignId);
    console.log('📧 Recipient:', prospectEmail);
    console.log('📝 Subject:', editedContent?.subject);
    
    // Store approval in campaign data
    const approvalData = {
      emailId,
      campaignId,
      approvedAt: new Date().toISOString(),
      status: 'approved',
      editedContent,
      prospectEmail
    };
    
    // Save approval to file system
    const approvalsPath = path.join(__dirname, '../data/campaign-approvals');
    await fs.mkdir(approvalsPath, { recursive: true });
    await fs.writeFile(
      path.join(approvalsPath, `${emailId}_approval.json`),
      JSON.stringify(approvalData, null, 2)
    );
    
    // Get LangGraph agent and actually send the email
    const agent = new LangGraphMarketingAgent();
    
    // Prepare email data for sending
    const emailData = {
      to: prospectEmail,
      subject: editedContent?.subject || 'Professional Email',
      body: editedContent?.body || 'Email content',
      prospect: {
        email: prospectEmail,
        name: 'Prospect',
        company: 'Company'
      },
      campaignId: campaignId
    };
    
    console.log('📤 Attempting to send email via LangGraphMarketingAgent...');
    
    try {
      // Actually send the email
      const sendResult = await agent.sendEmail(emailData);
      
      if (sendResult.success) {
        console.log('✅ Email sent successfully:', sendResult);
        
        res.json({
          success: true,
          message: 'Email approved and sent successfully',
          emailId,
          approvedAt: approvalData.approvedAt,
          sendResult: sendResult,
          recipient: prospectEmail,
          subject: editedContent?.subject
        });
      } else {
        console.log('❌ Email send failed:', sendResult.error);
        
        res.json({
          success: true,  // Approval succeeded, but send failed
          message: 'Email approved but sending failed',
          emailId,
          approvedAt: approvalData.approvedAt,
          sendError: sendResult.error,
          sendingFailed: true
        });
      }
    } catch (sendError) {
      console.error('❌ Email sending error:', sendError);
      
      res.json({
        success: true,  // Approval succeeded, but send failed
        message: 'Email approved but sending encountered an error',
        emailId,
        approvedAt: approvalData.approvedAt,
        sendError: sendError.message,
        sendingFailed: true
      });
    }
    
  } catch (error) {
    console.error('Failed to approve email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start sending approved emails
router.post('/start-sending', async (req, res) => {
  try {
    const { campaignId, approvedEmailIds, userLearning } = req.body;
    
    console.log('🚀 Starting campaign with approved emails:', approvedEmailIds.length);
    console.log('🧠 Applying user learning from', userLearning?.length || 0, 'edit sessions');
    
    // Apply user learning to email generator
    if (userLearning && userLearning.length > 0) {
      await applyUserLearning(userLearning, campaignId);
    }
    
    // Get LangGraph agent and start sending approved emails
    const agent = new LangGraphMarketingAgent();
    const result = await agent.sendApprovedEmails(campaignId, approvedEmailIds);
    
    if (result.success) {
      // Log campaign completion
      const completionData = {
        campaignId,
        completedAt: new Date().toISOString(),
        emailsSent: approvedEmailIds.length,
        userLearningApplied: userLearning?.length || 0,
        status: 'completed'
      };
      
      const campaignDataPath = path.join(__dirname, '../data/completed-campaigns');
      await fs.mkdir(campaignDataPath, { recursive: true });
      await fs.writeFile(
        path.join(campaignDataPath, `${campaignId}_completed.json`),
        JSON.stringify(completionData, null, 2)
      );
      
      res.json({
        success: true,
        message: 'Campaign started successfully',
        emailsSent: approvedEmailIds.length,
        learningApplied: userLearning?.length || 0
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to start sending campaign'
      });
    }
    
  } catch (error) {
    console.error('Failed to start sending campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply user learning to improve future email generation
async function applyUserLearning(userChanges, campaignId) {
  try {
    console.log('🧠 Processing user learning from', userChanges.length, 'edit sessions');
    
    // Analyze user changes to extract patterns
    const learningPatterns = analyzeLearningPatterns(userChanges);
    
    // Save learning patterns
    const learningData = {
      campaignId,
      timestamp: new Date().toISOString(),
      patterns: learningPatterns,
      userChanges: userChanges,
      totalEdits: userChanges.reduce((sum, session) => sum + (session.changes?.length || 0), 0)
    };
    
    const learningPath = path.join(__dirname, '../data/user-learning');
    await fs.mkdir(learningPath, { recursive: true });
    await fs.writeFile(
      path.join(learningPath, `${campaignId}_learning.json`),
      JSON.stringify(learningData, null, 2)
    );
    
    // Apply learning to EmailEditorService for immediate use
    await emailEditor.applyUserLearning(learningPatterns);
    
    console.log('✅ User learning applied successfully');
    
  } catch (error) {
    console.error('Failed to apply user learning:', error);
    throw error;
  }
}

// Analyze user changes to extract learning patterns
function analyzeLearningPatterns(userChanges) {
  const patterns = {
    commonSubjectChanges: [],
    frequentTextEdits: [],
    preferredComponents: [],
    stylePreferences: {},
    ctaPreferences: {},
    layoutPreferences: {}
  };
  
  userChanges.forEach(session => {
    if (!session.changes) return;
    
    session.changes.forEach(change => {
      switch (change.action) {
        case 'update_component':
          if (change.data?.updates) {
            // Track text style preferences
            if (change.data.updates.fontSize) {
              patterns.stylePreferences.fontSize = change.data.updates.fontSize;
            }
            if (change.data.updates.textColor) {
              patterns.stylePreferences.textColor = change.data.updates.textColor;
            }
            if (change.data.updates.alignment) {
              patterns.stylePreferences.alignment = change.data.updates.alignment;
            }
            
            // Track CTA button preferences
            if (change.data.updates.backgroundColor || change.data.updates.url) {
              patterns.ctaPreferences = {
                ...patterns.ctaPreferences,
                ...change.data.updates
              };
            }
          }
          break;
          
        case 'add_component':
          // Track preferred components
          if (change.data?.componentType) {
            const existing = patterns.preferredComponents.find(p => p.type === change.data.componentType);
            if (existing) {
              existing.count++;
            } else {
              patterns.preferredComponents.push({
                type: change.data.componentType,
                count: 1
              });
            }
          }
          break;
          
        case 'reorder_components':
          // Track layout preferences
          patterns.layoutPreferences.reordersCount = (patterns.layoutPreferences.reordersCount || 0) + 1;
          break;
      }
    });
  });
  
  // Sort preferred components by usage
  patterns.preferredComponents.sort((a, b) => b.count - a.count);

  return patterns;
}

// Learn template from user's first email edit
router.post('/:campaignId/learn-template', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { originalEmail, editedEmail } = req.body;

    console.log('🎓 Learning template from first email edit for campaign:', campaignId);

    if (!originalEmail || !editedEmail) {
      return res.status(400).json({
        success: false,
        error: 'Both originalEmail and editedEmail are required'
      });
    }

    // Learn template from user edits
    const learnedTemplate = templateService.learnFromUserEdits(campaignId, originalEmail, editedEmail);

    console.log('✅ Template learned successfully:', learnedTemplate.id);

    res.json({
      success: true,
      template: {
        id: learnedTemplate.id,
        campaignId: learnedTemplate.campaignId,
        createdAt: learnedTemplate.createdAt,
        hasSubjectTemplate: !!learnedTemplate.subject.template,
        bodyParagraphs: learnedTemplate.body.paragraphTemplates.length,
        userPreferences: learnedTemplate.userPreferences
      },
      message: 'Template learned from user edits successfully'
    });

  } catch (error) {
    console.error('❌ Error learning template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply learned template to a new email
router.post('/:campaignId/apply-template', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { emailData, recipientInfo } = req.body;

    console.log('🎨 Applying learned template for campaign:', campaignId);

    if (!emailData || !recipientInfo) {
      return res.status(400).json({
        success: false,
        error: 'Both emailData and recipientInfo are required'
      });
    }

    // Check if template exists
    if (!templateService.hasTemplate(campaignId)) {
      return res.status(404).json({
        success: false,
        error: 'No learned template found for this campaign'
      });
    }

    // Apply template to new email
    const processedEmail = templateService.applyTemplate(campaignId, emailData, recipientInfo);

    console.log('✅ Template applied successfully to email for:', recipientInfo.email);

    res.json({
      success: true,
      processedEmail,
      appliedTemplate: true,
      message: 'Template applied successfully'
    });

  } catch (error) {
    console.error('❌ Error applying template:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      appliedTemplate: false
    });
  }
});

// Get learned template for a campaign
router.get('/:campaignId/template', async (req, res) => {
  try {
    const { campaignId } = req.params;

    console.log('📋 Fetching learned template for campaign:', campaignId);

    const template = templateService.getTemplate(campaignId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'No template found for this campaign'
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        campaignId: template.campaignId,
        createdAt: template.createdAt,
        hasSubjectTemplate: !!template.subject.template,
        bodyParagraphs: template.body.paragraphTemplates.length,
        userPreferences: template.userPreferences,
        formatting: template.formatting
      }
    });

  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resume email generation with learned template
router.post('/:campaignId/resume-with-template', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { useTemplate = true } = req.body;

    console.log('🔄 Resuming email generation with template for campaign:', campaignId);

    // Check if template exists
    if (useTemplate && !templateService.hasTemplate(campaignId)) {
      console.warn('⚠️ No template found, continuing without template');
    }

    // Get LangGraph agent and resume workflow
    const agent = new LangGraphMarketingAgent();

    // Resume the workflow with template application
    const result = await agent.resumeWorkflowWithTemplate(campaignId, {
      useTemplate,
      templateService: useTemplate ? templateService : null
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email generation resumed with template',
        campaignId,
        useTemplate,
        emailsToGenerate: result.emailsToGenerate || 0
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to resume workflow'
      });
    }

  } catch (error) {
    console.error('❌ Error resuming workflow with template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pause email generation after first email
router.post('/:campaignId/pause-after-first', async (req, res) => {
  try {
    const { campaignId } = req.params;

    console.log('⏸️ Pausing email generation after first email for campaign:', campaignId);

    // Get LangGraph agent and pause workflow
    const agent = new LangGraphMarketingAgent();

    const result = await agent.pauseAfterFirstEmail(campaignId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email generation paused after first email',
        campaignId,
        pausedAt: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to pause workflow'
      });
    }

  } catch (error) {
    console.error('❌ Error pausing workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all learned templates (for debugging)
router.get('/templates/all', async (req, res) => {
  try {
    console.log('📋 Fetching all learned templates');

    const templates = templateService.getAllTemplates();

    res.json({
      success: true,
      templates,
      total: templates.length
    });

  } catch (error) {
    console.error('❌ Error fetching all templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;