/**
 * Template Selection API Routes
 */

const express = require('express');
const router = express.Router();
const TemplatePromptService = require('../services/TemplatePromptService');
const { optionalAuth } = require('../middleware/userContext');

// Get all available templates
router.get('/templates', (req, res) => {
  try {
    const templates = TemplatePromptService.getAllTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('❌ Failed to get templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific template by ID
router.get('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = TemplatePromptService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('❌ Failed to get template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate template preview with actual content
router.post('/preview', async (req, res) => {
  try {
    const { templateId, prospect, customizations } = req.body;

    console.log(`🎨 Generating template preview for: ${templateId}`);

    const template = TemplatePromptService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Use sample prospect data if none provided
    const sampleProspect = prospect || {
      name: 'Sarah Johnson',
      company: 'TechCorp Industries',
      email: 'sarah@techcorp.com'
    };

    // Generate preview content using Ollama
    const agent = req.app.locals.langGraphAgent;
    if (agent) {
      try {
        // Create enhanced template with customizations
        const enhancedTemplate = {
          ...template,
          ...customizations,
          templateId,
          isCustomized: !!customizations,
          userSelected: true
        };

        // Generate actual content for preview
        const previewContent = await agent.generateTemplatePreview(sampleProspect, enhancedTemplate);

        res.json({
          success: true,
          preview: previewContent,
          templateId,
          prospect: sampleProspect
        });
      } catch (error) {
        console.error('❌ Failed to generate preview content:', error);
        // Fallback to template with placeholder text
        res.json({
          success: true,
          preview: {
            subject: template.subject || `Partnership Opportunity with ${sampleProspect.company}`,
            html: template.html,
            template: templateId
          },
          templateId,
          prospect: sampleProspect
        });
      }
    } else {
      // No agent available, return template with placeholder
      res.json({
        success: true,
        preview: {
          subject: template.subject || `Partnership Opportunity with ${sampleProspect.company}`,
          html: template.html,
          template: templateId
        },
        templateId,
        prospect: sampleProspect
      });
    }
  } catch (error) {
    console.error('❌ Failed to generate template preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle template selection for campaign
router.post('/select', optionalAuth, async (req, res) => {
  try {
    console.log('🔥🔥🔥 ===============================================');
    console.log('🔥 POST /api/template/select ENDPOINT HIT!');
    console.log('🔥🔥🔥 ===============================================');

    const userId = req.userId || 'anonymous';
    const { templateId, campaignId, workflowId, components, isCustomized, customizations: userCustomizations, subject, greeting, signature, html: userEditedHtml, ...restCustomizations } = req.body;

    console.log(`🎨 [User: ${userId}] Template selected: ${templateId} for campaign ${campaignId || workflowId}`);
    console.log(`🎨 User customizations received:`, {
      hasCustomizations: !!userCustomizations,
      hasSubject: !!subject,
      hasGreeting: !!greeting,
      hasSignature: !!signature,
      hasEditedHtml: !!userEditedHtml,
      htmlLength: userEditedHtml ? userEditedHtml.length : 0,
      customizationsKeys: userCustomizations ? Object.keys(userCustomizations) : [],
      restKeys: Object.keys(restCustomizations)
    });

    // Validate template exists
    const template = TemplatePromptService.getTemplate(templateId);
    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template ID'
      });
    }

    // Store template selection for this campaign/workflow
    const key = campaignId || workflowId || 'default';

    // For now, store in memory - in production this would be in database
    if (!global.templateSelections) {
      global.templateSelections = {};
    }

    // 🔥 CRITICAL FIX: Save ALL user customizations for email generation
    global.templateSelections[key] = {
      templateId,
      templateName: template.name,
      selectedAt: new Date().toISOString(),
      campaignId: campaignId,
      workflowId: workflowId,
      // 🎯 Save user customizations
      subject: subject || null,
      greeting: greeting || null,
      signature: signature || null,
      html: userEditedHtml || null,  // USER'S EDITED HTML
      customizations: userCustomizations || {},
      isCustomized: isCustomized || !!(userCustomizations && Object.keys(userCustomizations).length > 0),
      components: components || []
    };

    console.log(`✅ Template ${template.name} selected for ${key}${isCustomized ? ' (CUSTOMIZED)' : ''}`);

    // 💾 Save user's template selection to persist across sessions (with customizations!)
    const UserStorageService = require('../services/UserStorageService');
    const userStorage = new UserStorageService(userId);
    try {
      await userStorage.saveSelectedTemplate(templateId, template.name, {
        subject,
        greeting,
        signature,
        html: userEditedHtml,
        customizations: userCustomizations,
        isCustomized,
        components
      });
      console.log(`💾 [User: ${userId}] Template preference saved: ${template.name}${isCustomized ? ' (with customizations)' : ''}`);
    } catch (error) {
      console.error(`❌ Failed to save template preference for user ${userId}:`, error);
      // Don't fail the request if storage fails
    }

    // Broadcast template selection to continue workflow
    if (router.wsManager) {
      router.wsManager.broadcast({
        type: 'template_selected',
        data: {
          templateId,
          templateName: template.name,
          campaignId,
          workflowId,
          canProceed: true
        }
      });
    }

    // 🎯 CRITICAL: Set templateSubmitted flag to prevent popup re-triggering
    const workflowRoute = require('./workflow');
    if (workflowRoute.setTemplateSubmitted) {
      workflowRoute.setTemplateSubmitted(true, userId);
      console.log(`🎯 [User: ${userId}] Template submission flag set in workflow module`);
    }

    // 🚀 CRITICAL: Resume workflow with selected template
    console.log('🚀 Resuming workflow with selected template:', templateId);

    // Get the LangGraph agent and resume email generation
    if (req.app.locals.langGraphAgent) {
      const agent = req.app.locals.langGraphAgent;

      // 🔍 DEBUG: Check agent state
      console.log('🔍 DEBUG: Agent exists:', !!agent);
      console.log('🔍 DEBUG: Agent state exists:', !!agent.state);
      console.log('🔍 DEBUG: Agent state keys:', agent.state ? Object.keys(agent.state) : 'N/A');
      console.log('🔍 DEBUG: waitingForTemplateSelection exists:', !!agent.state?.waitingForTemplateSelection);
      console.log('🔍 DEBUG: isWaitingForTemplate flag:', agent.state?.isWaitingForTemplate);

      if (agent.state?.waitingForTemplateSelection) {
        console.log('🔍 DEBUG: waitingForTemplateSelection details:', {
          prospectsCount: agent.state.waitingForTemplateSelection.prospects?.length,
          campaignId: agent.state.waitingForTemplateSelection.campaignId,
          timestamp: agent.state.waitingForTemplateSelection.timestamp
        });
      }

      // Check if agent is waiting for template selection - check both flags
      if (agent.state?.waitingForTemplateSelection || agent.state?.isWaitingForTemplate) {
        const waitingState = agent.state.waitingForTemplateSelection || {
          prospects: agent.state.foundProspects || [],
          campaignId: agent.state.currentCampaign?.id || campaignId,
          smtpConfig: agent.campaignConfig?.smtpConfig || agent.state.pausedCampaignData?.smtpConfig || null // 🔥 CRITICAL FIX: Include SMTP config in fallback
        };

        console.log(`🔄 Resuming email generation for ${waitingState.prospects?.length || 0} prospects`);
        console.log(`🔍 Using prospects from: ${agent.state.waitingForTemplateSelection ? 'waitingForTemplateSelection' : 'foundProspects'}`);

        // Continue with email generation using selected template
        setTimeout(async () => {
          try {
                    // 🔥 FIX: Generate HTML from customizations if no HTML provided
            let finalHtml = userEditedHtml;

            if (!finalHtml && userCustomizations && Object.keys(userCustomizations).length > 0) {
              // Apply customizations to base template HTML
              console.log(`🎨 Applying ${Object.keys(userCustomizations).length} customizations to template HTML`);
              finalHtml = template.html || '';

              // Apply customization replacements
              const customizations = userCustomizations;
              if (customizations.logo) {
                finalHtml = finalHtml.replace(/\{logo\}/g, customizations.logo);
                finalHtml = finalHtml.replace(/COMPANY/g, `<img src="${customizations.logo}" alt="Logo" style="max-width:160px;height:auto;" />`);
              }
              if (customizations.headerTitle) {
                finalHtml = finalHtml.replace(/\{headerTitle\}/g, customizations.headerTitle);
              }
              if (customizations.primaryColor) {
                finalHtml = finalHtml.replace(/#10b981/g, customizations.primaryColor);
                finalHtml = finalHtml.replace(/#00f5a0/g, customizations.primaryColor);
              }
              if (customizations.buttonText) {
                finalHtml = finalHtml.replace(/Schedule Meeting/g, customizations.buttonText);
                finalHtml = finalHtml.replace(/Schedule Your Free Demo/g, customizations.buttonText);
              }

              console.log(`✅ Generated HTML from customizations: ${finalHtml.length} characters`);
            }

            // 🎯 RECONSTRUCT templateData with proper structure INCLUDING EDITED HTML
            const templateData = {
              templateId,
              subject: subject || null,
              greeting: greeting || null,
              signature: signature || null,
              html: finalHtml || null,  // 🎯 USER'S EDITED TEMPLATE HTML (or generated from customizations)
              customizations: userCustomizations || {},
              isCustomized: isCustomized || !!(userCustomizations && Object.keys(userCustomizations).length > 0)
            };

            console.log(`✨ Passing templateData to agent:`, {
              templateId: templateData.templateId,
              hasSubject: !!templateData.subject,
              hasGreeting: !!templateData.greeting,
              hasSignature: !!templateData.signature,
              customizationsKeys: Object.keys(templateData.customizations),
              isCustomized: templateData.isCustomized
            });

            const enhancedTemplate = {
              ...template,
              templateData, // 🎯 Pass the complete templateData object
              customizations: templateData.customizations,
              isCustomized: templateData.isCustomized,
              components: components || template.components || [],
              userSelected: true // Flag to indicate this was user-selected
            };

            console.log(`🎨 Resuming with ${enhancedTemplate.isCustomized ? 'CUSTOMIZED' : 'DEFAULT'} template`);
            if (enhancedTemplate.isCustomized) {
              console.log('✨ Custom properties:', Object.keys(templateData.customizations));
            }

            await agent.continueWithSelectedTemplate(templateId, waitingState, enhancedTemplate);
          } catch (error) {
            console.error('❌ Failed to resume workflow:', error);
          }
        }, 100);
      } else {
        console.log('⚠️ Agent is not waiting for template selection - workflow may have already completed');
        console.log('🔍 Current agent state keys:', agent.state ? Object.keys(agent.state) : 'No state');

        // Try to retrieve stored workflow results if available
        console.log(`🔍 [User: ${userId}] Attempting to retrieve stored workflow results for campaign: ${campaignId || 'default'}...`);
        const workflowRoute = require('./workflow');
        if (workflowRoute.getLastWorkflowResults) {
          const storedResults = await workflowRoute.getLastWorkflowResults(userId, campaignId);
          console.log(`🔍 [User: ${userId}] Stored results retrieved:`, {
            found: !!storedResults,
            hasProspects: !!(storedResults && storedResults.prospects),
            prospectsCount: storedResults?.prospects?.length || 0
          });
          if (storedResults && storedResults.prospects && storedResults.prospects.length > 0) {
            console.log(`📦 [User: ${userId}] Found stored workflow results with ${storedResults.prospects.length} prospects`);

            // Resume with stored results
            const waitingState = {
              prospects: storedResults.prospects,
              campaignId: campaignId || storedResults.campaignId,
              businessAnalysis: storedResults.businessAnalysis,
              marketingStrategy: storedResults.marketingStrategy,
              smtpConfig: storedResults.smtpConfig || agent.campaignConfig?.smtpConfig || null // 🔥 CRITICAL FIX: Include SMTP config from stored results
            };

            console.log('🚀 Attempting to resume with stored results...');

            // 🔥 FIX: Generate HTML from customizations if no HTML provided
            let finalHtml = userEditedHtml;

            if (!finalHtml && userCustomizations && Object.keys(userCustomizations).length > 0) {
              // Apply customizations to base template HTML
              console.log(`🎨 [Stored Results] Applying ${Object.keys(userCustomizations).length} customizations to template HTML`);
              finalHtml = template.html || '';

              // Apply customization replacements
              const customizations = userCustomizations;
              if (customizations.logo) {
                finalHtml = finalHtml.replace(/\{logo\}/g, customizations.logo);
                finalHtml = finalHtml.replace(/COMPANY/g, `<img src="${customizations.logo}" alt="Logo" style="max-width:160px;height:auto;" />`);
              }
              if (customizations.headerTitle) {
                finalHtml = finalHtml.replace(/\{headerTitle\}/g, customizations.headerTitle);
              }
              if (customizations.primaryColor) {
                finalHtml = finalHtml.replace(/#10b981/g, customizations.primaryColor);
                finalHtml = finalHtml.replace(/#00f5a0/g, customizations.primaryColor);
              }
              if (customizations.buttonText) {
                finalHtml = finalHtml.replace(/Schedule Meeting/g, customizations.buttonText);
                finalHtml = finalHtml.replace(/Schedule Your Free Demo/g, customizations.buttonText);
              }

              console.log(`✅ [Stored Results] Generated HTML from customizations: ${finalHtml.length} characters`);
            }

            // 🎯 CRITICAL: Create templateData for stored results path too INCLUDING EDITED HTML
            const templateData = {
              templateId,
              subject: subject || null,
              greeting: greeting || null,
              signature: signature || null,
              html: finalHtml || null,  // 🎯 USER'S EDITED TEMPLATE HTML (or generated from customizations)
              customizations: userCustomizations || {},
              isCustomized: isCustomized || !!(userCustomizations && Object.keys(userCustomizations).length > 0)
            };

            console.log(`✨ Passing templateData to agent (stored results path):`, {
              templateId: templateData.templateId,
              hasSubject: !!templateData.subject,
              hasGreeting: !!templateData.greeting,
              hasSignature: !!templateData.signature,
              customizationsKeys: Object.keys(templateData.customizations),
              isCustomized: templateData.isCustomized
            });

            const enhancedTemplate = {
              ...template,
              templateData, // 🎯 Pass the complete templateData object
              customizations: templateData.customizations,
              isCustomized: templateData.isCustomized,
              components: components || template.components || [],
              userSelected: true // Flag to indicate this was user-selected
            };

            console.log(`🎨 Enhanced template for stored results: ${enhancedTemplate.isCustomized ? 'CUSTOMIZED' : 'DEFAULT'}`);
            if (enhancedTemplate.isCustomized) {
              console.log('✨ Custom properties (stored path):', Object.keys(templateData.customizations));
            }

            console.log('🚀🚀🚀 CALLING continueWithSelectedTemplate (stored results path)...');
            console.log(`   📊 Prospects: ${waitingState.prospects.length}`);
            console.log(`   📧 Template: ${templateId}`);
            console.log(`   🎨 Customized: ${enhancedTemplate.isCustomized}`);

            setTimeout(async () => {
              try {
                console.log('🚀 Executing continueWithSelectedTemplate NOW...');
                await agent.continueWithSelectedTemplate(templateId, waitingState, enhancedTemplate);
                console.log('✅ continueWithSelectedTemplate completed successfully');
              } catch (error) {
                console.error('❌ Failed to resume with stored results:', error);
                console.error('❌ Error stack:', error.stack);
              }
            }, 100);
          } else {
            console.log(`❌ [User: ${userId}] No stored workflow results found or no prospects available`);
            console.log('🔍 Stored results detail:', {
              hasStoredResults: !!storedResults,
              hasProspects: !!(storedResults && storedResults.prospects),
              prospectsLength: storedResults?.prospects?.length
            });
          }
        } else {
          console.log('❌ getLastWorkflowResults function not available');
        }
      }
    } else {
      console.log('❌ LangGraph agent not available');
    }

    res.json({
      success: true,
      message: `Template "${template.name}" selected successfully`,
      templateId,
      templateName: template.name
    });

  } catch (error) {
    console.error('❌ Failed to select template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current template selection for campaign
router.get('/selection/:campaignId', optionalAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.userId || 'anonymous';

    // 🔥 FIX: First check memory, then fallback to database
    let selection = global.templateSelections?.[campaignId] || null;

    // 💾 If not in memory (after restart), load from database
    if (!selection) {
      console.log(`📂 Template not in memory, loading from database for campaign: ${campaignId}`);
      const UserStorageService = require('../services/UserStorageService');
      const userStorage = new UserStorageService(userId);

      try {
        const savedTemplate = await userStorage.getSelectedTemplate();
        if (savedTemplate && savedTemplate.customizations) {
          // Reconstruct selection from database
          selection = {
            templateId: savedTemplate.templateId,
            templateName: savedTemplate.templateName,
            selectedAt: savedTemplate.selectedAt,
            campaignId: campaignId,
            subject: savedTemplate.customizations.subject,
            greeting: savedTemplate.customizations.greeting,
            signature: savedTemplate.customizations.signature,
            html: savedTemplate.customizations.html,
            customizations: savedTemplate.customizations.customizations || {},
            isCustomized: savedTemplate.customizations.isCustomized || false,
            components: savedTemplate.customizations.components || []
          };

          // Restore to memory for faster access
          if (!global.templateSelections) {
            global.templateSelections = {};
          }
          global.templateSelections[campaignId] = selection;

          console.log(`✅ Template customizations restored from database for campaign: ${campaignId}`);
        }
      } catch (dbError) {
        console.error(`⚠️ Failed to load template from database:`, dbError.message);
      }
    }

    if (!selection) {
      return res.status(404).json({
        success: false,
        error: 'No template selected for this campaign'
      });
    }

    res.json({
      success: true,
      selection
    });

  } catch (error) {
    console.error('❌ Failed to get template selection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's selected template preference
router.get('/user-selected', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    console.log(`🔍 [User: ${userId}] Checking for saved template preference...`);

    const UserStorageService = require('../services/UserStorageService');
    const userStorage = new UserStorageService(userId);

    const selectedTemplate = await userStorage.getSelectedTemplate();

    if (!selectedTemplate) {
      return res.json({
        success: true,
        hasTemplate: false,
        template: null
      });
    }

    console.log(`✅ [User: ${userId}] Found saved template: ${selectedTemplate.templateName}`);

    res.json({
      success: true,
      hasTemplate: true,
      template: selectedTemplate
    });

  } catch (error) {
    console.error('❌ Failed to get user template preference:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;