/**
 * Email Editor Routes
 * Professional CRM-like email editing and preview functionality
 */

const express = require('express');
const router = express.Router();
const EmailEditorService = require('../services/EmailEditorService');
const emailEditor = new EmailEditorService();

// Get email preview with editable components
router.post('/preview', async (req, res) => {
  try {
    const { emailData } = req.body;
    
    if (!emailData) {
      return res.status(400).json({
        success: false,
        error: 'Email data is required'
      });
    }

    console.log('📧 Generating email preview for editing...');
    
    const preview = await emailEditor.generateEmailPreview(emailData);
    
    res.json({
      success: true,
      preview: preview.preview,
      editableHtml: preview.editableHtml,
      availableComponents: preview.components,
      message: 'Email preview generated successfully'
    });

  } catch (error) {
    console.error('Failed to generate email preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save edited email and track changes
router.post('/save', async (req, res) => {
  try {
    const { emailId, originalStructure, editedStructure, userId } = req.body;
    
    if (!emailId || !editedStructure) {
      return res.status(400).json({
        success: false,
        error: 'Email ID and edited structure are required'
      });
    }

    console.log('💾 Saving email edits and learning from changes...');
    
    const result = await emailEditor.saveUserEdits(
      emailId,
      originalStructure,
      editedStructure,
      userId || 'default'
    );
    
    res.json({
      success: true,
      ...result,
      message: 'Email saved and learning applied'
    });

  } catch (error) {
    console.error('Failed to save email edits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available email components
router.get('/components', (req, res) => {
  try {
    const components = Object.values(emailEditor.components).map(component => ({
      id: component.id,
      name: component.name,
      icon: component.icon,
      defaultContent: component.defaultContent
    }));
    
    res.json({
      success: true,
      components: components
    });

  } catch (error) {
    console.error('Failed to get components:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add component to email
router.post('/add-component', (req, res) => {
  try {
    const { componentId, position } = req.body;
    
    const component = emailEditor.components[componentId];
    if (!component) {
      return res.status(404).json({
        success: false,
        error: 'Component not found'
      });
    }
    
    res.json({
      success: true,
      component: component.defaultContent,
      message: 'Component added successfully'
    });

  } catch (error) {
    console.error('Failed to add component:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update component content
router.post('/update-component', (req, res) => {
  try {
    const { componentIndex, updates } = req.body;
    
    console.log(`✏️ Updating component ${componentIndex}...`);
    
    res.json({
      success: true,
      message: 'Component updated successfully'
    });

  } catch (error) {
    console.error('Failed to update component:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export final HTML
router.post('/export', (req, res) => {
  try {
    const { emailStructure } = req.body;
    
    if (!emailStructure) {
      return res.status(400).json({
        success: false,
        error: 'Email structure is required'
      });
    }
    
    const finalHtml = emailEditor.exportFinalHTML(emailStructure);
    
    res.json({
      success: true,
      html: finalHtml,
      message: 'Email exported successfully'
    });

  } catch (error) {
    console.error('Failed to export email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply learned preferences
router.post('/apply-learning', async (req, res) => {
  try {
    const { emailStructure, templateType } = req.body;
    
    const enhancedStructure = await emailEditor.applyLearnedPreferences(
      emailStructure,
      templateType || 'default'
    );
    
    res.json({
      success: true,
      structure: enhancedStructure,
      message: 'Learning applied successfully'
    });

  } catch (error) {
    console.error('Failed to apply learning:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get learning statistics
router.get('/learning-stats', async (req, res) => {
  try {
    const stats = await emailEditor.getLearningStats();
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Failed to get learning stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save email as template
router.post('/save-template', async (req, res) => {
  try {
    const { name, structure, category } = req.body;
    
    if (!name || !structure) {
      return res.status(400).json({
        success: false,
        error: 'Template name and structure are required'
      });
    }
    
    const template = {
      id: `template_${Date.now()}`,
      name,
      category: category || 'custom',
      structure,
      createdAt: new Date().toISOString()
    };
    
    // Save template to file
    const fs = require('fs').promises;
    const path = require('path');
    const templatesPath = path.join(__dirname, '../data/email-templates');
    await fs.mkdir(templatesPath, { recursive: true });
    await fs.writeFile(
      path.join(templatesPath, `${template.id}.json`),
      JSON.stringify(template, null, 2)
    );
    
    res.json({
      success: true,
      template: template,
      message: 'Template saved successfully'
    });

  } catch (error) {
    console.error('Failed to save template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load saved templates
router.get('/templates', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const templatesPath = path.join(__dirname, '../data/email-templates');
    
    const templates = [];
    
    try {
      const files = await fs.readdir(templatesPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(templatesPath, file), 'utf8');
          templates.push(JSON.parse(content));
        }
      }
    } catch (error) {
      // Templates directory doesn't exist yet
    }
    
    res.json({
      success: true,
      templates: templates
    });

  } catch (error) {
    console.error('Failed to load templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle editor changes and apply to campaign
router.post('/apply-campaign-changes', async (req, res) => {
  try {
    const { campaignId, editorData } = req.body;
    
    if (!campaignId || !editorData) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID and editor data are required'
      });
    }
    
    console.log('📝 Applying editor changes to campaign...');
    
    // Get LangGraph agent instance
    const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
    const agent = new LangGraphMarketingAgent();
    
    // Apply the changes
    const result = await agent.handleEmailEditorChanges(campaignId, editorData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Editor changes applied successfully',
        changesApplied: result.changesApplied,
        learningUpdated: result.learningUpdated,
        finalStructure: result.finalStructure
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Failed to apply campaign changes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get campaign email with editor data
router.get('/campaign/:campaignId/email/:prospectId', async (req, res) => {
  try {
    const { campaignId, prospectId } = req.params;
    
    console.log(`📧 Getting email editor data for campaign ${campaignId}, prospect ${prospectId}`);
    
    // This would typically fetch from database
    // For now, return a placeholder response
    res.json({
      success: true,
      emailId: `${campaignId}_${prospectId}`,
      canEdit: true,
      message: 'Email data retrieved successfully'
    });
    
  } catch (error) {
    console.error('Failed to get campaign email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove email from pending after approval
router.post('/remove-pending', (req, res) => {
  try {
    const { emailId } = req.body;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        error: 'Email ID is required'
      });
    }
    
    const removed = emailEditor.removePendingEmail(emailId);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Email removed from pending list'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Email not found in pending list'
      });
    }
  } catch (error) {
    console.error('Failed to remove pending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get latest generated email waiting for approval
router.get('/pending-approval', async (req, res) => {
  try {
    console.log('📧 Getting pending approval emails for editor...');

    // CRITICAL FIX: Use async method to check both Redis and memory
    const pendingEmails = await emailEditor.getPendingApprovalEmails();

    console.log(`📧 Found ${pendingEmails ? pendingEmails.length : 0} pending emails`);

    if (pendingEmails && pendingEmails.length > 0) {
      // Return the most recent email
      const latestEmail = pendingEmails[pendingEmails.length - 1];

      console.log(`✅ Returning latest pending email:`);
      console.log(`   - ID: ${latestEmail.id}`);
      console.log(`   - Template: ${latestEmail.template}`);
      console.log(`   - Subject: ${latestEmail.subject}`);
      console.log(`   - HTML length: ${latestEmail.html?.length || 0}`);

      res.json({
        success: true,
        hasPending: true,
        email: latestEmail,
        totalPending: pendingEmails.length,
        message: 'Pending email found for approval'
      });
    } else {
      console.log('⚠️ No pending emails found');
      res.json({
        success: true,
        hasPending: false,
        email: null,
        totalPending: 0,
        message: 'No pending emails for approval'
      });
    }
    
  } catch (error) {
    console.error('Failed to get pending emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;