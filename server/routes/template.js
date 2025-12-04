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
    // 🔥 CRITICAL FIX: Try user-specific agent first
    const workflowRoute = require('./workflow');
    const userId = req.userId || 'anonymous';
    const campaignId = req.body?.campaignId;

    let agent = null;
    if (workflowRoute.getUserCampaignAgent && userId && campaignId) {
      agent = workflowRoute.getUserCampaignAgent(userId, campaignId);
    }
    if (!agent) {
      agent = req.app.locals.langGraphAgent;
    }

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
    const { templateId, campaignId, workflowId, components, isCustomized, customizations: userCustomizations, subject, greeting, signature, html: userEditedHtml, templateMode, manualContent, ...restCustomizations } = req.body;

    console.log(`🎨 [User: ${userId}] Template selected: ${templateId} for campaign ${campaignId || workflowId}`);
    console.log(`🎨 Template mode: ${templateMode || 'ai'} ${templateMode === 'manual' ? '(MANUAL EMAIL - No AI)' : '(AI-assisted)'}`);
    console.log(`🎨 User customizations received:`, {
      hasCustomizations: !!userCustomizations,
      hasSubject: !!subject,
      hasGreeting: !!greeting,
      hasSignature: !!signature,
      hasEditedHtml: !!userEditedHtml,
      htmlLength: userEditedHtml ? userEditedHtml.length : 0,
      hasManualContent: !!manualContent,
      manualContentLength: manualContent ? manualContent.length : 0,
      templateMode: templateMode || 'ai',
      customizationsKeys: userCustomizations ? Object.keys(userCustomizations) : [],
      restKeys: Object.keys(restCustomizations)
    });

    // Validate template exists OR allow 'custom_template' for fully custom templates
    let template = TemplatePromptService.getTemplate(templateId);

    // 🔥 SPECIAL CASE: Allow 'custom_template' for user-built templates
    if (!template && templateId === 'custom_template') {
      console.log('🎨 [CUSTOM TEMPLATE] User is creating a fully custom template from scratch');
      // Create a minimal template structure for custom templates
      template = {
        id: 'custom_template',
        name: 'Custom Template',
        description: 'Fully customizable template built by user',
        structure: {
          paragraphs: 0, // User defines their own structure
          components: components || []
        },
        html: userEditedHtml || '',
        // Custom templates rely entirely on user customizations
        isCustomBuilt: true
      };
    } else if (!template) {
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
      // FIXED: Respect explicit isCustomized flag from frontend, don't override based on customizations object
      isCustomized: isCustomized !== undefined ? isCustomized : !!(userCustomizations && Object.keys(userCustomizations).length > 0),
      components: components || [],
      // 🎨 CRITICAL: Save template mode and manual content for custom templates
      templateMode: templateMode || 'ai',
      manualContent: manualContent || null
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
        components,
        templateMode,
        manualContent
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

    // 🎯 CRITICAL: Set templateSubmitted flag to prevent popup re-triggering (per campaign)
    const workflowRoute = require('./workflow');
    if (workflowRoute.setTemplateSubmitted) {
      workflowRoute.setTemplateSubmitted(true, userId, campaignId);
      console.log(`🎯 [User: ${userId}] Template submission flag set in workflow module for campaign: ${campaignId}`);
    }

    // 🚀 CRITICAL: Resume workflow with selected template
    console.log('🚀 Resuming workflow with selected template:', templateId);

    // 🔥 CRITICAL FIX: Get the USER-SPECIFIC agent, not the global one
    // (workflowRoute already imported above for setTemplateSubmitted)
    const getUserCampaignAgentFn = workflowRoute.getUserCampaignAgent;

    // Try to get user-specific agent first, then fall back to global
    let agent = null;
    if (getUserCampaignAgentFn && userId && campaignId) {
      agent = getUserCampaignAgentFn(userId, campaignId);
      if (agent) {
        console.log(`✅ Using USER-SPECIFIC agent for ${userId}/${campaignId}`);
      }
    }

    // Fall back to global agent if user-specific not found
    if (!agent && req.app.locals.langGraphAgent) {
      agent = req.app.locals.langGraphAgent;
      console.log('⚠️ Using GLOBAL agent (user-specific not found)')
    }

    if (agent) {

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

      // Check if agent is waiting for template selection - check both flags AND pausedCampaignData
      if (agent.state?.waitingForTemplateSelection || agent.state?.isWaitingForTemplate || agent.state?.pausedCampaignData) {
        // 🔥 CRITICAL FIX: Also use pausedCampaignData as fallback for prospects
        const waitingState = agent.state.waitingForTemplateSelection || agent.state.pausedCampaignData || {
          prospects: agent.state.foundProspects || [],
          campaignId: agent.state.currentCampaign?.id || campaignId,
          smtpConfig: agent.campaignConfig?.smtpConfig || null
        };

        console.log(`🔄 Resuming email generation for ${waitingState.prospects?.length || 0} prospects`);
        const prospectsSource = agent.state.waitingForTemplateSelection ? 'waitingForTemplateSelection' :
                                agent.state.pausedCampaignData ? 'pausedCampaignData' : 'foundProspects';
        console.log(`🔍 Using prospects from: ${prospectsSource}`);

        // Continue with email generation using selected template
        setTimeout(async () => {
          try {
                    // 🔥 FIX: Generate HTML from customizations - ALWAYS if customizations exist
            let finalHtml = userEditedHtml;

            // 🎯 CRITICAL FIX: Only apply customizations if user didn't manually edit HTML
            if (userEditedHtml) {
              console.log(`✨ Using user's manually edited HTML (${userEditedHtml.length} chars) - skipping customization application`);
            } else if (userCustomizations && Object.keys(userCustomizations).length > 0) {
              console.log(`🎨 Applying ${Object.keys(userCustomizations).length} customizations to template HTML`);

              // 🔥 CRITICAL FIX FOR CUSTOM TEMPLATES: Don't use default placeholder HTML
              // For custom_template, if user has customizations but didn't provide HTML,
              // we should NOT use the default placeholder HTML. Leave it null/empty
              // and let the agent handle it (it will use manualContent if provided)
              if (templateId === 'custom_template') {
                console.log(`🎨 [CUSTOM TEMPLATE] Skipping HTML generation from customizations - will use manualContent or AI generation`);
                console.log(`   ℹ️ Custom templates should provide either 'html' or 'manualContent' in the request`);
                finalHtml = null; // Don't use placeholder HTML
              } else {
                // Start with base template HTML ONLY if no manual edits AND not custom_template
                finalHtml = template.html || '';
              }
              const customizations = userCustomizations;

              // Apply ALL customizations comprehensively (only if finalHtml exists)
              // Skip for custom_template since finalHtml is null
              if (finalHtml) {
                if (customizations.logo && customizations.logo.trim() !== '') {
                  console.log(`  ✅ Applying logo: ${customizations.logo.substring(0, 50)}...`);
                  finalHtml = finalHtml.replace(/\{logo\}/g, customizations.logo);
                  finalHtml = finalHtml.replace(/COMPANY/g, `<img src="${customizations.logo}" alt="Logo" style="max-width:160px;height:auto;" />`);
                  // Also replace in style attributes
                  finalHtml = finalHtml.replace(/LOGO_URL_PLACEHOLDER/g, customizations.logo);
                } else {
                  console.log(`  ⏭️ Skipping logo (empty or not provided)`);
                }

                if (customizations.headerTitle) {
                  finalHtml = finalHtml.replace(/\{headerTitle\}/g, customizations.headerTitle);
                  finalHtml = finalHtml.replace(/Building Strategic Partnerships/g, customizations.headerTitle);
                }

                if (customizations.mainHeading) {
                  finalHtml = finalHtml.replace(/\{mainHeading\}/g, customizations.mainHeading);
                }

                if (customizations.primaryColor) {
                  // Replace ALL instances of the default green color
                  finalHtml = finalHtml.replace(/#10b981/gi, customizations.primaryColor);
                  finalHtml = finalHtml.replace(/#00f5a0/gi, customizations.primaryColor);
                  finalHtml = finalHtml.replace(/#00d991/gi, customizations.primaryColor);
                  finalHtml = finalHtml.replace(/rgba\(0,245,160/g, `rgba(${hexToRgb(customizations.primaryColor)}`);
                }

                if (customizations.accentColor) {
                  finalHtml = finalHtml.replace(/#047857/gi, customizations.accentColor);
                }

                if (customizations.buttonText) {
                  finalHtml = finalHtml.replace(/Schedule Meeting/g, customizations.buttonText);
                  finalHtml = finalHtml.replace(/Schedule Your Free Demo/g, customizations.buttonText);
                  finalHtml = finalHtml.replace(/Get Started/g, customizations.buttonText);
                }

                if (customizations.testimonialText) {
                  finalHtml = finalHtml.replace(/"Great results from our partnership exceeded all expectations"/g, customizations.testimonialText);
                  finalHtml = finalHtml.replace(/"This solution transformed our operations[^"]*"/g, customizations.testimonialText);
                }

                if (customizations.testimonialAuthor) {
                  finalHtml = finalHtml.replace(/— CEO, Fortune 500 Company/g, customizations.testimonialAuthor);
                  finalHtml = finalHtml.replace(/CEO, Industry Leader/g, customizations.testimonialAuthor);
                }
              } else {
                console.log(`  ⏭️ Skipping customization application (finalHtml is null - will be handled by agent)`);
              }

              if (finalHtml) {
                console.log(`✅ Generated HTML from customizations: ${finalHtml.length} characters`);
                console.log(`📝 Applied: logo=${!!customizations.logo}, primaryColor=${!!customizations.primaryColor}, buttonText=${!!customizations.buttonText}`);
              } else {
                console.log(`ℹ️ No HTML generated (custom_template will use manualContent or AI generation)`);
              }
            }

            // Helper function to convert hex to RGB
            function hexToRgb(hex) {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result
                ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
                : '0,245,160'; // Default fallback
            }

            // 🎯 RECONSTRUCT templateData with proper structure INCLUDING EDITED HTML AND MANUAL CONTENT
            const templateData = {
              templateId,
              subject: subject || null,
              greeting: greeting || null,
              signature: signature || null,
              html: finalHtml || null,  // 🎯 USER'S EDITED TEMPLATE HTML (or generated from customizations)
              customizations: userCustomizations || {},
              // FIXED: Respect explicit isCustomized flag from frontend
              isCustomized: isCustomized !== undefined ? isCustomized : !!(userCustomizations && Object.keys(userCustomizations).length > 0),
              // 🔥 CRITICAL: Include templateMode and manualContent for custom templates
              templateMode: templateMode || 'ai',
              manualContent: manualContent || null  // User's WYSIWYG editor content for manual mode
            };

            console.log(`✨ Passing templateData to agent:`, {
              templateId: templateData.templateId,
              hasSubject: !!templateData.subject,
              hasGreeting: !!templateData.greeting,
              hasSignature: !!templateData.signature,
              customizationsKeys: Object.keys(templateData.customizations),
              isCustomized: templateData.isCustomized,
              templateMode: templateData.templateMode,
              hasManualContent: !!templateData.manualContent
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

        // 🔥 CRITICAL FIX: Also check WebSocket state for prospects
        let wsProspects = [];
        const wsManager = agent.wsManager || req.app.locals.wsManager;
        if (wsManager && wsManager.workflowStates && campaignId) {
          const wsState = wsManager.workflowStates.get(campaignId);
          if (wsState && wsState.data && wsState.data.prospects) {
            wsProspects = wsState.data.prospects;
            console.log(`📡 [WebSocket Fallback] Found ${wsProspects.length} prospects in WebSocket state for campaign ${campaignId}`);
          }
        }

        if (workflowRoute.getLastWorkflowResults) {
          const storedResults = await workflowRoute.getLastWorkflowResults(userId, campaignId);
          console.log(`🔍 [User: ${userId}] Stored results retrieved:`, {
            found: !!storedResults,
            hasProspects: !!(storedResults && storedResults.prospects),
            prospectsCount: storedResults?.prospects?.length || 0,
            wsProspectsCount: wsProspects.length
          });

          // 🔥 Use WebSocket prospects if stored results have none
          const effectiveProspects = (storedResults?.prospects?.length > 0) ? storedResults.prospects : wsProspects;

          if (effectiveProspects && effectiveProspects.length > 0) {
            const prospectsSource = (storedResults?.prospects?.length > 0) ? 'stored results' : 'WebSocket state';
            console.log(`📦 [User: ${userId}] Found ${effectiveProspects.length} prospects from ${prospectsSource}`);

            // Resume with stored results OR WebSocket prospects
            const waitingState = {
              prospects: effectiveProspects,
              campaignId: campaignId || storedResults?.campaignId,
              businessAnalysis: storedResults?.businessAnalysis,
              marketingStrategy: storedResults?.marketingStrategy,
              smtpConfig: storedResults?.smtpConfig || agent.campaignConfig?.smtpConfig || null // 🔥 CRITICAL FIX: Include SMTP config from stored results
            };

            console.log('🚀 Attempting to resume with stored results...');

            // 🔥 FIX: Generate HTML from customizations - ALWAYS if customizations exist
            let finalHtml = userEditedHtml;

            // 🎯 CRITICAL FIX: Only apply customizations if user didn't manually edit HTML
            if (userEditedHtml) {
              console.log(`✨ [Stored Results] Using user's manually edited HTML (${userEditedHtml.length} chars) - skipping customization application`);
            } else if (userCustomizations && Object.keys(userCustomizations).length > 0) {
              console.log(`🎨 [Stored Results] Applying ${Object.keys(userCustomizations).length} customizations to template HTML`);

              // Start with base template HTML ONLY if no manual edits
              finalHtml = template.html || '';
              const customizations = userCustomizations;

              // Apply ALL customizations comprehensively
              if (customizations.logo) {
                finalHtml = finalHtml.replace(/\{logo\}/g, customizations.logo);
                finalHtml = finalHtml.replace(/COMPANY/g, `<img src="${customizations.logo}" alt="Logo" style="max-width:160px;height:auto;" />`);
                finalHtml = finalHtml.replace(/LOGO_URL_PLACEHOLDER/g, customizations.logo);
              }

              if (customizations.headerTitle) {
                finalHtml = finalHtml.replace(/\{headerTitle\}/g, customizations.headerTitle);
                finalHtml = finalHtml.replace(/Building Strategic Partnerships/g, customizations.headerTitle);
              }

              if (customizations.mainHeading) {
                finalHtml = finalHtml.replace(/\{mainHeading\}/g, customizations.mainHeading);
              }

              if (customizations.primaryColor) {
                finalHtml = finalHtml.replace(/#10b981/gi, customizations.primaryColor);
                finalHtml = finalHtml.replace(/#00f5a0/gi, customizations.primaryColor);
                finalHtml = finalHtml.replace(/#00d991/gi, customizations.primaryColor);
                finalHtml = finalHtml.replace(/rgba\(0,245,160/g, `rgba(${hexToRgb(customizations.primaryColor)}`);
              }

              if (customizations.accentColor) {
                finalHtml = finalHtml.replace(/#047857/gi, customizations.accentColor);
              }

              if (customizations.buttonText) {
                finalHtml = finalHtml.replace(/Schedule Meeting/g, customizations.buttonText);
                finalHtml = finalHtml.replace(/Schedule Your Free Demo/g, customizations.buttonText);
                finalHtml = finalHtml.replace(/Get Started/g, customizations.buttonText);
              }

              if (customizations.testimonialText) {
                finalHtml = finalHtml.replace(/"Great results from our partnership exceeded all expectations"/g, customizations.testimonialText);
                finalHtml = finalHtml.replace(/"This solution transformed our operations[^"]*"/g, customizations.testimonialText);
              }

              if (customizations.testimonialAuthor) {
                finalHtml = finalHtml.replace(/— CEO, Fortune 500 Company/g, customizations.testimonialAuthor);
                finalHtml = finalHtml.replace(/CEO, Industry Leader/g, customizations.testimonialAuthor);
              }

              console.log(`✅ [Stored Results] Generated HTML from customizations: ${finalHtml.length} characters`);
              console.log(`📝 [Stored Results] Applied: logo=${!!customizations.logo}, primaryColor=${!!customizations.primaryColor}, buttonText=${!!customizations.buttonText}`);
            }

            // 🎯 CRITICAL: Create templateData for stored results path too INCLUDING EDITED HTML AND MANUAL CONTENT
            const templateData = {
              templateId,
              subject: subject || null,
              greeting: greeting || null,
              signature: signature || null,
              html: finalHtml || null,  // 🎯 USER'S EDITED TEMPLATE HTML (or generated from customizations)
              customizations: userCustomizations || {},
              // FIXED: Respect explicit isCustomized flag from frontend
              isCustomized: isCustomized !== undefined ? isCustomized : !!(userCustomizations && Object.keys(userCustomizations).length > 0),
              // 🔥 CRITICAL: Include templateMode and manualContent for custom templates
              templateMode: templateMode || 'ai',
              manualContent: manualContent || null  // User's WYSIWYG editor content for manual mode
            };

            console.log(`✨ Passing templateData to agent (stored results path):`, {
              templateId: templateData.templateId,
              hasSubject: !!templateData.subject,
              hasGreeting: !!templateData.greeting,
              hasSignature: !!templateData.signature,
              customizationsKeys: Object.keys(templateData.customizations),
              isCustomized: templateData.isCustomized,
              templateMode: templateData.templateMode,
              hasManualContent: !!templateData.manualContent
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
            console.log(`❌ [User: ${userId}] No prospects found in stored results OR WebSocket state`);
            console.log('🔍 Stored results detail:', {
              hasStoredResults: !!storedResults,
              hasProspects: !!(storedResults && storedResults.prospects),
              prospectsLength: storedResults?.prospects?.length,
              wsProspectsLength: wsProspects.length
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