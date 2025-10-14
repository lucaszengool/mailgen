const express = require('express');
const router = express.Router();
const path = require('path');
const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
const EmailEditorService = require('../services/EmailEditorService');
const KnowledgeBaseSingleton = require('../models/KnowledgeBaseSingleton');
const db = require('../models/database');

// Store last workflow results globally
let lastWorkflowResults = null;

// Global EmailEditorService instance for clearing email data
const emailEditorService = new EmailEditorService();

// Get the global LangGraphMarketingAgent instance from app.locals
// This ensures we use the SAME instance across all routes
function getMarketingAgent(req) {
  // Use the agent from app.locals (set in server/index.js)
  if (req && req.app && req.app.locals && req.app.locals.langGraphAgent) {
    return req.app.locals.langGraphAgent;
  }

  // Fallback: This shouldn't happen but provides safety
  console.warn('⚠️ Warning: Could not get agent from app.locals, creating fallback instance');
  if (!global.__marketingAgentFallback) {
    const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
    global.__marketingAgentFallback = new LangGraphMarketingAgent();
  }
  return global.__marketingAgentFallback;
}

// Workflow state management
let workflowState = {
  currentStep: 'website_analysis',
  waitingForUserApproval: false,
  firstEmailGenerated: null,
  steps: [
    {
      id: 'website_analysis',
      title: 'Website Analysis',
      status: 'in_progress',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    },
    {
      id: 'search_strategy',
      title: 'Search Strategy',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    },
    {
      id: 'prospect_search',
      title: 'Prospect Search',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    },
    {
      id: 'email_generation',
      title: 'Email Generation',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    },
    {
      id: 'email_review',
      title: 'Email Review & Approval',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    },
    {
      id: 'email_sending',
      title: 'Email Sending',
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      logs: [],
      details: null
    }
  ],
  isRunning: false,
  lastUpdate: new Date().toISOString()
};

// Get current workflow status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: workflowState
  });
});

// Start workflow
router.post('/start', async (req, res) => {
  console.log('🚀 WORKFLOW START ENDPOINT CALLED!');
  console.log('🔍 Request body:', req.body);
  try {
    if (workflowState.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Workflow is already running'
      });
    }

    // Reset all steps
    workflowState.steps.forEach(step => {
      step.status = step.id === 'website_analysis' ? 'in_progress' : 'pending';
      step.progress = 0;
      step.startTime = null;
      step.endTime = null;
      step.logs = [];
      step.details = null;
    });

    workflowState.currentStep = 'website_analysis';
    workflowState.isRunning = true;
    workflowState.lastUpdate = new Date().toISOString();

    // Use global LangGraphMarketingAgent instance to maintain state
    const agent = getMarketingAgent(req);

    // Pass workflow state reference to agent so it can update firstEmailGenerated
    agent.workflowState = workflowState;

    // Set WebSocket manager for real-time logging
    if (req.app.locals.wsManager) {
      agent.wsManager = req.app.locals.wsManager;
      console.log('✅ WebSocket manager attached to LangGraphMarketingAgent');
    } else {
      console.warn('⚠️ No WebSocket manager found in app.locals');
    }

    // Load saved agent config to get websiteAnalysis (Railway-compatible: check app.locals first)
    let savedConfig = null;

    // First check app.locals (Railway-compatible, persists across requests)
    if (req.app && req.app.locals && req.app.locals.agentConfig) {
      savedConfig = req.app.locals.agentConfig;
      console.log('✅ Loaded config from app.locals (Railway-compatible)');
      console.log('🔍 Config has targetWebsite:', !!savedConfig.targetWebsite);
      console.log('🔍 Config has websiteAnalysis:', !!savedConfig.websiteAnalysis);
    }

    // Fallback to file-based config (for local development)
    if (!savedConfig) {
      try {
        const fs = require('fs').promises;
        const configPath = path.join(__dirname, '../data/agent-config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        savedConfig = JSON.parse(configData);
        console.log('✅ Loaded saved agent config from file');
      } catch (error) {
        console.log('⚠️ Could not load saved config from file:', error.message);
      }
    }

    // Log final config status
    console.log('📋 Final savedConfig status:', {
      exists: !!savedConfig,
      hasTargetWebsite: !!savedConfig?.targetWebsite,
      hasWebsiteAnalysis: !!savedConfig?.websiteAnalysis,
      hasSMTPConfig: !!savedConfig?.smtpConfig
    });

    // Execute real campaign in background
    const campaignConfig = {
      targetWebsite: req.body.targetWebsite || savedConfig?.targetWebsite || 'https://example.com',
      campaignGoal: req.body.campaignGoal || savedConfig?.campaignGoal || 'partnership',
      businessType: req.body.businessType || savedConfig?.businessType || 'technology',
      smtpConfig: req.body.smtpConfig || savedConfig?.smtpConfig,
      emailTemplate: req.body.emailTemplate || savedConfig?.emailTemplate,
      templateData: req.body.templateData || savedConfig?.templateData,
      audienceType: req.body.audienceType || savedConfig?.audienceType,
      industries: req.body.industries || savedConfig?.industries,
      roles: req.body.roles || savedConfig?.roles,
      keywords: req.body.keywords || savedConfig?.keywords,
      controls: req.body.controls,
      websiteAnalysis: req.body.websiteAnalysis || savedConfig?.websiteAnalysis  // 🎯 Include websiteAnalysis
    };

    // Start real workflow execution in background
    console.log('🎯 About to execute real workflow...');

    // CRITICAL: Execute workflow WITHOUT await to prevent blocking the response
    // but ensure it actually runs by wrapping in an immediately invoked async function
    (async () => {
      try {
        console.log('🚀 [RAILWAY DEBUG] Executing real workflow in background...');
        await executeRealWorkflow(agent, campaignConfig);
        console.log('✅ [RAILWAY DEBUG] Real workflow execution completed');
      } catch (error) {
        console.error('❌ [RAILWAY DEBUG] Real workflow execution failed:', error);
      }
    })();

    console.log('✅ Workflow start response sent to frontend');
    res.json({
      success: true,
      message: 'Workflow started successfully',
      data: workflowState
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Pause workflow
router.post('/pause', (req, res) => {
  workflowState.isRunning = false;
  workflowState.lastUpdate = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Workflow paused',
    data: workflowState
  });
});

// Resume workflow
router.post('/resume', (req, res) => {
  workflowState.isRunning = true;
  workflowState.lastUpdate = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Workflow resumed',
    data: workflowState
  });
});

// Reset workflow - clear all data
router.post('/reset', async (req, res) => {
  // Completely reset workflow state
  workflowState = {
    currentStep: 'website_analysis',
    waitingForUserApproval: false,
    firstEmailGenerated: null,
    steps: [
      {
        id: 'website_analysis',
        title: 'Website Analysis',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      },
      {
        id: 'search_strategy',
        title: 'Search Strategy',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      },
      {
        id: 'prospect_search',
        title: 'Prospect Search',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      },
      {
        id: 'email_generation',
        title: 'Email Generation',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      },
      {
        id: 'email_review',
        title: 'Email Review & Approval',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      },
      {
        id: 'email_sending',
        title: 'Email Sending',
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        logs: [],
        details: null
      }
    ],
    isRunning: false,
    lastUpdate: new Date().toISOString()
  };

  // Clear all cached workflow results and email data
  lastWorkflowResults = null;

  // Clear EmailEditorService pending emails
  emailEditorService.clearPendingEmails();

  // Clear LangGraphMarketingAgent pending emails
  try {
    const agent = getMarketingAgent(req);
    agent.clearPendingEmails();
    console.log('✅ Cleared LangGraphMarketingAgent pending emails');
  } catch (error) {
    console.log('⚠️ Warning: Could not clear LangGraphMarketingAgent pending emails:', error.message);
  }

  // Clear database stored emails and prospects
  try {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../data/enhanced_knowledge_base.db');

    await new Promise((resolve, reject) => {
      const database = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        database.serialize(() => {
          database.run('DELETE FROM emails', (err) => {
            if (err) console.log('Warning: Could not clear emails table');
          });
          database.run('DELETE FROM prospects', (err) => {
            if (err) console.log('Warning: Could not clear prospects table');
          });
          database.close();
          resolve();
        });
      });
    });

    console.log('✅ Cleared database emails and prospects');
  } catch (error) {
    console.log('⚠️ Warning: Could not clear database:', error.message);
  }

  // Clear traditional database email logs
  try {
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM email_logs', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Cleared email logs database');
  } catch (error) {
    console.log('⚠️ Warning: Could not clear email logs:', error.message);
  }

  // Clear email agent database (campaigns, email_logs, etc.)
  try {
    const sqlite3 = require('sqlite3').verbose();
    const emailAgentDbPath = path.join(__dirname, '../data/email_agent.db');

    await new Promise((resolve, reject) => {
      const emailAgentDb = new sqlite3.Database(emailAgentDbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        emailAgentDb.serialize(() => {
          emailAgentDb.run('DELETE FROM campaigns', (err) => {
            if (err) console.log('Warning: Could not clear campaigns table');
          });
          emailAgentDb.run('DELETE FROM email_logs', (err) => {
            if (err) console.log('Warning: Could not clear email_logs table');
          });
          emailAgentDb.run('DELETE FROM email_opens', (err) => {
            if (err) console.log('Warning: Could not clear email_opens table');
          });
          emailAgentDb.run('DELETE FROM email_clicks', (err) => {
            if (err) console.log('Warning: Could not clear email_clicks table');
          });
          emailAgentDb.run('DELETE FROM contacts', (err) => {
            if (err) console.log('Warning: Could not clear contacts table');
          });
          emailAgentDb.close();
          resolve();
        });
      });
    });

    console.log('✅ Cleared email agent database (campaigns, logs, opens, clicks, contacts)');
  } catch (error) {
    console.log('⚠️ Warning: Could not clear email agent database:', error.message);
  }

  // Clear log files that might contain email data
  try {
    const fs = require('fs');
    const path = require('path');
    const logFiles = [
      path.join(__dirname, '../../super_email_discovery.log'),
      path.join(__dirname, '../super_email_discovery.log'),
      path.join(__dirname, '../../email_finder.log'),
      path.join(__dirname, '../email_finder.log'),
      path.join(__dirname, '../../server.log')
    ];

    logFiles.forEach(logFile => {
      try {
        if (fs.existsSync(logFile)) {
          fs.unlinkSync(logFile);
          console.log(`✅ Deleted log file: ${logFile}`);
        }
      } catch (err) {
        console.log(`⚠️ Could not delete log file ${logFile}:`, err.message);
      }
    });
  } catch (error) {
    console.log('⚠️ Warning: Could not clear log files:', error.message);
  }

  // Clear Redis cache (email learning data, etc.)
  try {
    const redis = require('redis');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redisClient = redis.createClient({ url: redisUrl });
    await redisClient.connect();
    await redisClient.flushAll();
    await redisClient.disconnect();
    console.log('✅ Cleared Redis cache (email learning data)');
  } catch (error) {
    console.log('⚠️ Warning: Could not clear Redis cache:', error.message);
  }

  // Clear WebSocket workflow states and email campaign data
  if (req.app.locals.wsManager) {
    req.app.locals.wsManager.clearAllWorkflowStates();
  }

  res.json({
    success: true,
    message: 'Workflow completely reset - all data cleared',
    data: workflowState
  });
});

// Get detailed information for specific step
router.get('/step/:stepId', (req, res) => {
  const step = workflowState.steps.find(s => s.id === req.params.stepId);
  
  if (!step) {
    return res.status(404).json({
      success: false,
      message: 'Step not found'
    });
  }
  
  res.json({
    success: true,
    data: step
  });
});

// Get campaign results including prospects
router.get('/results', async (req, res) => {
  try {
    // console.log('🔍 Fetching campaign results...'); // Commented to reduce Railway log spam
    
    // First check if we have stored results from the last campaign
    if (lastWorkflowResults && lastWorkflowResults.prospects && lastWorkflowResults.prospects.length > 0) {
      console.log(`✅ Found stored workflow results with ${lastWorkflowResults.prospects.length} prospects`);
      console.log('🔧 DEBUG: Starting template replacement process...');
      
      // CRITICAL FIX: Replace template variables in email campaign data before returning
      const processedResults = JSON.parse(JSON.stringify(lastWorkflowResults)); // Deep clone
      console.log('🔧 DEBUG: Email campaign exists:', !!processedResults.emailCampaign);
      console.log('🔧 DEBUG: Emails exist:', !!processedResults.emailCampaign?.emails);
      console.log('🔧 DEBUG: Emails count:', processedResults.emailCampaign?.emails?.length || 0);
      
      if (processedResults.emailCampaign && processedResults.emailCampaign.emails) {
        processedResults.emailCampaign.emails = processedResults.emailCampaign.emails.map(email => {
          // Helper function to replace template variables
          const replaceTemplateVariables = (content, emailData) => {
            if (!content || typeof content !== 'string') return content;
            
            const variables = {
              '{{companyName}}': emailData.recipient_company || 'Your Company',
              '{{recipientName}}': emailData.recipient_name || 'there',
              '{{senderName}}': emailData.sender_name || 'AI Marketing',
              '{{websiteUrl}}': emailData.website_url || 'https://example.com',
              '{{campaignId}}': emailData.campaign_id || 'default'
            };
            
            let processedContent = content;
            Object.entries(variables).forEach(([placeholder, value]) => {
              const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
              processedContent = processedContent.replace(regex, value);
            });
            
            return processedContent;
          };
          
          // Replace template variables in subject and body
          return {
            ...email,
            subject: replaceTemplateVariables(email.subject, email),
            body: replaceTemplateVariables(email.body, email),
            _raw_subject: email.subject, // Keep original for reference
            _raw_body: email.body
          };
        });
      }
      
      console.log('🔧 Template variables replaced in stored results');
      return res.json({
        success: true,
        data: processedResults,
        source: 'stored'
      });
    }
    
    let prospects = [];
    let campaignData = {};
    let hasRealResults = false;
    
    // Check WebSocket manager for real prospect data
    const wsManager = req.app.locals.wsManager;
    
    if (wsManager && wsManager.workflowStates.size > 0) {
      // console.log('🔄 Checking WebSocket workflow states for real prospect data...'); // Commented to reduce Railway log spam

      // Look for prospect data in any workflow state
      for (const [workflowId, state] of wsManager.workflowStates) {
        // console.log(`📊 Checking workflow ${workflowId}, data keys:`, Object.keys(state.data || {})); // Commented to reduce Railway log spam
        // console.log(`📊 Steps available:`, Object.keys(state.steps || {})); // Commented to reduce Railway log spam
        
        // Check for prospects in direct data object
        if (state.data && state.data.prospects && state.data.prospects.length > 0) {
          // Only log once when first found, not on every poll
          if (prospects.length === 0) {
            console.log(`✅ Found ${state.data.prospects.length} real prospects in workflow ${workflowId} (direct data)`);
          }
          prospects = state.data.prospects;
          hasRealResults = true;
        }
        // Also check for prospects in the prospect_search step result
        else if (state.steps && state.steps.prospect_search && state.steps.prospect_search.result && state.steps.prospect_search.result.prospects) {
          if (prospects.length === 0) {
            console.log(`✅ Found ${state.steps.prospect_search.result.prospects.length} real prospects in workflow ${workflowId} (step result)`);
          }
          prospects = state.steps.prospect_search.result.prospects;
          hasRealResults = true;
        }
        
        // If we found prospects, extract other campaign data from the state and break
        if (hasRealResults) {
          // Extract other campaign data from the state
          campaignData = {
            businessAnalysis: state.data?.businessAnalysis || state.steps?.website_analysis?.result || {
              websiteUrl: 'https://fruitai.org',
              industry: 'AI Technology', 
              targetAudience: 'B2B Professionals',
              companyName: 'FruitAI'
            },
            marketingStrategy: state.data?.marketingStrategy || state.steps?.marketing_strategy?.result || {
              primaryKeywords: ['AI', 'technology', 'automation'],
              targetTitles: ['CEO', 'CTO', 'Marketing Director']
            },
            prospectSearch: state.data?.prospectSearch || state.steps?.prospect_search?.result || null,
            emailCampaign: state.data?.emailCampaign || state.steps?.email_generation?.result || null,
            sendingResults: state.data?.sendingResults || null
          };
          break;
        }
      }
    }
    
    // If no real data found, return empty data (no demo data)
    if (!hasRealResults) {
      console.log('🎯 No real prospect data found, returning empty data...');
      prospects = [];
      
      campaignData = {
        businessAnalysis: workflowState.steps.find(s => s.id === 'website_analysis')?.details || {
          websiteUrl: 'https://fruitai.org',
          industry: 'AI Technology',
          targetAudience: 'B2B Professionals', 
          companyName: 'FruitAI'
        },
        marketingStrategy: workflowState.steps.find(s => s.id === 'search_strategy')?.details || {
          primaryKeywords: ['AI', 'technology', 'automation'],
          targetTitles: ['CEO', 'CTO', 'Marketing Director']
        },
        prospectSearch: workflowState.steps.find(s => s.id === 'prospect_search')?.details || null,
        emailCampaign: workflowState.steps.find(s => s.id === 'email_generation')?.details || {
          emails: [],
          totalEmails: 0,
          success: false
        },
        sendingResults: workflowState.steps.find(s => s.id === 'email_sending')?.details || null
      };
    }

    // Only log when data actually changes
    // console.log(`📊 Returning ${prospects.length} prospects (real: ${hasRealResults})`); // Commented to reduce Railway log spam
    
    // Get current email index from marketing agent if available
    let currentEmailIndex = 0;
    try {
      const marketingAgent = getMarketingAgent(req);
      if (marketingAgent.state && marketingAgent.state.pausedCampaignData &&
          marketingAgent.state.pausedCampaignData.currentIndex !== undefined) {
        currentEmailIndex = marketingAgent.state.pausedCampaignData.currentIndex;
        console.log(`📧 Current email index from paused campaign: ${currentEmailIndex}`);
      }
    } catch (error) {
      console.log('⚠️ Could not get current email index:', error.message);
    }

    // Check if agent is waiting for template selection
    // Simple logic: If we have prospects but no email campaign, template selection is needed
    let templateSelectionRequired = false;
    let templateSelectionStatus = null;

    if (prospects.length > 0 &&
        (!campaignData.emailCampaign ||
         !campaignData.emailCampaign.emails ||
         campaignData.emailCampaign.emails.length === 0)) {
      // We have prospects but no emails = template selection required
      templateSelectionRequired = true;
      templateSelectionStatus = 'waiting_for_template';
      console.log('🎨 HTTP POLLING: Template selection required - have prospects but no emails yet');
      console.log('   Prospects:', prospects.length);
      console.log('   Email campaign:', campaignData.emailCampaign ? 'exists' : 'null');
      console.log('   Emails:', campaignData.emailCampaign?.emails?.length || 0);
    }

    res.json({
      success: true,
      data: {
        prospects,
        campaignData,
        workflowState: workflowState.currentStep,
        lastUpdate: workflowState.lastUpdate,
        totalProspects: prospects.length,
        isRealData: hasRealResults,
        demoMode: !hasRealResults,
        waitingForUserApproval: workflowState.waitingForUserApproval,
        firstEmailGenerated: workflowState.firstEmailGenerated,
        currentEmailIndex: currentEmailIndex, // Add current email index for display
        templateSelectionRequired: templateSelectionRequired,
        status: templateSelectionStatus,
        canProceed: !templateSelectionRequired
      }
    });
    
  } catch (error) {
    console.error('❌ 获取campaign results失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign results',
      error: error.message
    });
  }
});

// Helper function to generate realistic mock prospects
function generateMockProspects() {
  const companies = [
    'Adobe', 'Canva', 'Figma', 'Shopify', 'HubSpot', 'Mailchimp', 'Notion', 'Slack',
    'Microsoft', 'Google', 'Meta', 'Netflix', 'Spotify', 'Airbnb', 'Uber', 'Tesla'
  ];
  
  const positions = [
    'Marketing Director', 'Creative Director', 'Head of Design', 'Marketing Manager',
    'Brand Manager', 'Content Manager', 'Digital Marketing Lead', 'Growth Manager',
    'VP Marketing', 'Chief Marketing Officer', 'Creative Lead', 'Art Director'
  ];
  
  const industries = [
    'Technology', 'Software', 'Design', 'Marketing', 'E-commerce', 'SaaS',
    'Media', 'Entertainment', 'Fintech', 'Healthcare'
  ];
  
  const techStacks = [
    ['React', 'Node.js', 'AWS'], 
    ['Python', 'Django', 'PostgreSQL'],
    ['JavaScript', 'Vue.js', 'Firebase'],
    ['TypeScript', 'Next.js', 'Vercel'],
    ['PHP', 'Laravel', 'MySQL'],
    ['Java', 'Spring', 'Docker']
  ];
  
  const prospects = [];
  
  for (let i = 0; i < 24; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const techStack = techStacks[Math.floor(Math.random() * techStacks.length)];
    
    const firstName = ['Alex', 'Sarah', 'John', 'Emma', 'Michael', 'Lisa', 'David', 'Jessica'][Math.floor(Math.random() * 8)];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`;
    
    prospects.push({
      id: `prospect_${i + 1}`,
      name,
      email,
      company,
      position,
      industry,
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      responseRate: Math.floor(Math.random() * 50) + 20, // 20-70%
      companySize: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)],
      location: ['San Francisco', 'New York', 'London', 'Toronto', 'Berlin', 'Sydney'][Math.floor(Math.random() * 6)],
      source: ['AI Campaign', 'LinkedIn Search', 'Company Website', 'Industry Directory'][Math.floor(Math.random() * 4)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      sourceUrl: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/team`,
      techStack,
      persona: {
        communicationStyle: ['direct', 'analytical', 'friendly', 'formal'][Math.floor(Math.random() * 4)],
        primaryPainPoints: [
          ['efficiency', 'cost optimization'], 
          ['scalability', 'performance'],
          ['user experience', 'conversion'],
          ['brand awareness', 'lead generation']
        ][Math.floor(Math.random() * 4)],
        estimatedRole: position,
        buyingStage: ['awareness', 'consideration', 'decision'][Math.floor(Math.random() * 3)],
        budget: ['< $10k', '$10k-50k', '$50k-100k', '$100k+'][Math.floor(Math.random() * 4)]
      }
    });
  }
  
  return prospects;
}

// Workflow step execution functions
async function startWebsiteAnalysis() {
  const step = workflowState.steps.find(s => s.id === 'website_analysis');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  addLog(step, '🌐 Starting target website analysis...', 'info');

  // Simulate analysis process
  const analysisSteps = [
    { delay: 1000, progress: 20, message: '📊 Extracting website metadata and keywords', level: 'success' },
    { delay: 2000, progress: 40, message: '🔍 Identifying industry type and characteristics', level: 'success' },
    { delay: 1500, progress: 60, message: '👥 Analyzing target audience characteristics', level: 'info' },
    { delay: 2000, progress: 80, message: '🏢 Identifying competitors and market position', level: 'success' },
    { delay: 1000, progress: 100, message: '✅ Website analysis completed', level: 'success' }
  ];

  for (const analysisStep of analysisSteps) {
    if (!workflowState.isRunning) break;
    
    await new Promise(resolve => setTimeout(resolve, analysisStep.delay));
    
    step.progress = analysisStep.progress;
    addLog(step, analysisStep.message, analysisStep.level);
    workflowState.lastUpdate = new Date().toISOString();

    if (analysisStep.progress === 100) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.details = {
        websiteUrl: 'https://headai.io',
        industry: 'AI/Technology',
        targetAudience: 'B2B Professionals',
        competitors: ['OpenAI', 'Anthropic', 'Midjourney'],
        keyInsights: [
          'AI image generation service',
          'Targeting creative professionals',
          'Subscription-based business model',
          'API integration capabilities',
          'High-quality output'
        ],
        marketSize: '$2.1B',
        competitiveAdvantage: 'Ease of use and API integration'
      };

      // Start next step
      setTimeout(() => {
        if (workflowState.isRunning) {
          startSearchStrategy();
        }
      }, 500);
    }
  }
}

async function startSearchStrategy() {
  const step = workflowState.steps.find(s => s.id === 'search_strategy');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  workflowState.currentStep = 'search_strategy';
  addLog(step, '🎯 Starting search strategy generation...', 'info');

  const strategySteps = [
    { delay: 1500, progress: 25, message: '🤖 AI analyzing target market characteristics', level: 'info' },
    { delay: 2000, progress: 50, message: '📋 Generating keywords and search queries', level: 'success' },
    { delay: 1800, progress: 75, message: '🔍 Optimizing search parameters and filters', level: 'success' },
    { delay: 1200, progress: 100, message: '✅ Search strategy generation completed', level: 'success' }
  ];

  for (const strategyStep of strategySteps) {
    if (!workflowState.isRunning) break;
    
    await new Promise(resolve => setTimeout(resolve, strategyStep.delay));
    
    step.progress = strategyStep.progress;
    addLog(step, strategyStep.message, strategyStep.level);
    workflowState.lastUpdate = new Date().toISOString();

    if (strategyStep.progress === 100) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.details = {
        primaryKeywords: ['AI image generation', 'creative professionals', 'digital art', 'API integration'],
        targetTitles: ['Creative Director', 'Marketing Manager', 'Content Creator', 'Digital Artist'],
        searchQueries: [
          'AI image generation for marketing teams',
          'creative professionals digital tools',
          'API image generation business'
        ],
        targetSources: ['LinkedIn Sales Navigator', 'Industry Websites', 'Company Directories'],
        estimatedReach: '25,000+ prospects'
      };

      // Start next step
      setTimeout(() => {
        if (workflowState.isRunning) {
          startProspectSearch();
        }
      }, 500);
    }
  }
}

async function startProspectSearch() {
  const step = workflowState.steps.find(s => s.id === 'prospect_search');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  workflowState.currentStep = 'prospect_search';
  addLog(step, '🔍 Starting prospect search...', 'info');

  const searchSteps = [
    { delay: 2000, progress: 15, message: '🎯 Using professional email search engines...', level: 'info' },
    { delay: 3000, progress: 30, message: '📊 Hunter.io domain email search', level: 'success' },
    { delay: 2500, progress: 45, message: '💼 LinkedIn Sales Navigator simulation search', level: 'success' },
    { delay: 2000, progress: 60, message: '🏢 Industry-specific website data mining', level: 'info' },
    { delay: 3000, progress: 75, message: '🔗 Company website contact information extraction', level: 'success' },
    { delay: 1500, progress: 90, message: '✨ Email verification and quality scoring', level: 'success' },
    { delay: 1000, progress: 100, message: '✅ Prospect search completed', level: 'success' }
  ];

  for (const searchStep of searchSteps) {
    if (!workflowState.isRunning) break;
    
    await new Promise(resolve => setTimeout(resolve, searchStep.delay));
    
    step.progress = searchStep.progress;
    addLog(step, searchStep.message, searchStep.level);
    workflowState.lastUpdate = new Date().toISOString();

    if (searchStep.progress === 100) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.details = {
        totalFound: 156,
        verified: 89,
        qualityScore: 'High (85+)',
        sources: {
          'hunter.io': 45,
          'linkedin_simulation': 67,
          'company_websites': 44
        },
        topCompanies: [
          'Adobe Creative Suite',
          'Canva Pro Team', 
          'Figma Enterprise',
          'Shopify Marketing',
          'HubSpot Design Team'
        ],
        averageQualityScore: 82
      };

      // Start next step
      setTimeout(() => {
        if (workflowState.isRunning) {
          startEmailGeneration();
        }
      }, 500);
    }
  }
}

async function startEmailGeneration() {
  const step = workflowState.steps.find(s => s.id === 'email_generation');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  workflowState.currentStep = 'email_generation';
  addLog(step, '📝 Starting personalized email generation...', 'info');

  const generationSteps = [
    { delay: 2000, progress: 20, message: '🤖 AI analyzing first contact background', level: 'info' },
    { delay: 2500, progress: 40, message: '✍️ Generating personalized email subject', level: 'success' },
    { delay: 3000, progress: 60, message: '📄 Creating email content and CTA', level: 'success' },
    { delay: 2000, progress: 80, message: '🎨 Applying brand templates and formatting', level: 'success' },
    { delay: 1500, progress: 100, message: '✅ First email generated successfully', level: 'success' }
  ];

  for (const generationStep of generationSteps) {
    if (!workflowState.isRunning) break;
    
    await new Promise(resolve => setTimeout(resolve, generationStep.delay));
    
    step.progress = generationStep.progress;
    addLog(step, generationStep.message, generationStep.level);
    workflowState.lastUpdate = new Date().toISOString();

    if (generationStep.progress === 100) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      
      // Generate a sample first email for review
      workflowState.firstEmailGenerated = {
        id: 'sample-email-001',
        to: 'john@example.com',
        recipientName: 'John Smith',
        company: 'TechCorp',
        subject: 'Partnership Opportunity - AI Solutions for TechCorp',
        body: `Hi John,

I hope this email finds you well. I came across TechCorp and was impressed by your company's innovative approach to technology solutions.

我們是一家專注於人工智能和自動化的公司，我們相信我們的解決方案可以幫助TechCorp進一步提升效率和競爭力。

I would love to schedule a brief 15-minute call to discuss how we can potentially collaborate and bring value to your current projects.

Would you be available for a quick conversation this week or next?

Best regards,
[Your Name]`,
        createdAt: new Date().toISOString(),
        quality_score: 87
      };
      
      step.details = {
        firstEmailGenerated: true,
        sampleEmail: workflowState.firstEmailGenerated,
        waitingForApproval: true,
        message: 'First email has been generated. Please review and approve before continuing.'
      };

      // Start email review step instead of going directly to sending
      setTimeout(() => {
        if (workflowState.isRunning) {
          startEmailReview();
        }
      }, 500);
    }
  }
}

async function startEmailReview() {
  const step = workflowState.steps.find(s => s.id === 'email_review');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  workflowState.currentStep = 'email_review';
  workflowState.waitingForUserApproval = true;
  
  addLog(step, '👀 First email generated - awaiting user review...', 'info');
  addLog(step, '✋ Workflow paused for user approval', 'warning');
  
  step.progress = 50;
  step.details = {
    sampleEmail: workflowState.firstEmailGenerated,
    status: 'awaiting_approval',
    message: 'Please review the sample email and click approve to continue generating remaining emails.'
  };
  
  workflowState.lastUpdate = new Date().toISOString();
  
  // Don't automatically continue - wait for user approval
}

async function startEmailSending() {
  const step = workflowState.steps.find(s => s.id === 'email_sending');
  if (!step) return;

  step.startTime = new Date().toISOString();
  step.status = 'in_progress';
  workflowState.currentStep = 'email_sending';
  addLog(step, '📤 Starting email sending...', 'info');

  const sendingSteps = [
    { delay: 1000, progress: 10, message: '🔧 Configuring SMTP connection', level: 'info' },
    { delay: 2000, progress: 25, message: '📋 Loading send queue (156 emails)', level: 'success' },
    { delay: 3000, progress: 40, message: '📤 Batch sending in progress (1-50)', level: 'info' },
    { delay: 2500, progress: 60, message: '📤 Batch sending in progress (51-100)', level: 'info' },
    { delay: 2000, progress: 80, message: '📤 Batch sending in progress (101-156)', level: 'info' },
    { delay: 1500, progress: 100, message: '✅ All emails sent successfully', level: 'success' }
  ];

  for (const sendingStep of sendingSteps) {
    if (!workflowState.isRunning) break;
    
    await new Promise(resolve => setTimeout(resolve, sendingStep.delay));
    
    step.progress = sendingStep.progress;
    addLog(step, sendingStep.message, sendingStep.level);
    workflowState.lastUpdate = new Date().toISOString();

    if (sendingStep.progress === 100) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();
      step.details = {
        totalSent: 156,
        successful: 152,
        failed: 4,
        deliveryRate: '97.4%',
        avgSendTime: '0.8s',
        nextFollowUp: '3 days',
        trackingEnabled: true,
        bounceRate: '2.6%'
      };

      // Workflow completed
      workflowState.isRunning = false;
      workflowState.currentStep = 'completed';
      addLog(step, '🎉 Complete marketing workflow execution finished!', 'success');
    }
  }
}

// Helper function: Add log
function addLog(step, message, level = 'info') {
  const log = {
    time: new Date().toLocaleTimeString(),
    message: message,
    level: level,
    timestamp: new Date().toISOString()
  };
  
  step.logs.push(log);
  
  // 限制日志数量
  if (step.logs.length > 20) {
    step.logs.shift();
  }
}

// Real workflow execution function
async function executeRealWorkflow(agent, campaignConfig) {
  try {
    console.log('🚀 ======================== REAL WORKFLOW EXECUTION START ========================');
    console.log('🚀 [RAILWAY DEBUG] Starting REAL LangGraphMarketingAgent workflow execution');
    console.log('🚀 [RAILWAY DEBUG] Campaign config:', {
      targetWebsite: campaignConfig.targetWebsite,
      campaignGoal: campaignConfig.campaignGoal,
      hasSmtpConfig: !!campaignConfig.smtpConfig,
      hasWebsiteAnalysis: !!campaignConfig.websiteAnalysis
    });

    // Update workflow state to reflect real execution start
    workflowState.steps[0].status = 'in_progress';
    workflowState.steps[0].startTime = new Date().toISOString();
    workflowState.lastUpdate = new Date().toISOString();

    console.log('📊 [RAILWAY DEBUG] About to call agent.executeCampaign()...');

    // Execute the real marketing campaign
    const results = await agent.executeCampaign(campaignConfig);

    console.log('✅ [RAILWAY DEBUG] Real workflow execution completed');
    console.log('📊 [RAILWAY DEBUG] Results:', {
      businessAnalysis: !!results.businessAnalysis,
      marketingStrategy: !!results.marketingStrategy,
      prospects: results.prospects?.length || 0,
      emailCampaign: !!results.emailCampaign
    });
    
    // CRITICAL FIX: Store results in both locations for frontend access
    setLastWorkflowResults(results);
    
    // CRITICAL FIX: Store results in WebSocket manager's workflow states
    if (agent.wsManager && results.prospects && results.prospects.length > 0) {
      console.log(`📡 Storing ${results.prospects.length} prospects in WebSocket workflow states`);
      
      // Update the current workflow state with prospect data
      const workflowId = results.campaignId || `workflow_${Date.now()}`;
      agent.wsManager.broadcastWorkflowUpdate(workflowId, {
        type: 'data_update',
        data: {
          prospects: results.prospects,
          businessAnalysis: results.businessAnalysis,
          marketingStrategy: results.marketingStrategy,
          emailCampaign: results.emailCampaign,
          totalProspects: results.prospects.length,
          lastUpdate: new Date().toISOString()
        }
      });
      
      // Also call updateClientData for direct prospect transmission
      agent.wsManager.updateClientData(results.prospects);
    }
    
    // Update final state
    workflowState.isRunning = false;
    workflowState.currentStep = 'completed';
    workflowState.lastUpdate = new Date().toISOString();
    
    // Mark all steps as completed if successful
    if (results.emailCampaign) {
      workflowState.steps.forEach((step, index) => {
        step.status = 'completed';
        step.progress = 100;
        step.endTime = new Date().toISOString();
      });
    }
    
  } catch (error) {
    console.error('❌ ======================== REAL WORKFLOW EXECUTION FAILED ========================');
    console.error('❌ [RAILWAY DEBUG] Real workflow execution failed:', error.message);
    console.error('❌ [RAILWAY DEBUG] Error stack:', error.stack);

    // Update error state
    workflowState.isRunning = false;
    workflowState.lastUpdate = new Date().toISOString();

    // Mark current step as failed
    const currentStepIndex = workflowState.steps.findIndex(s => s.status === 'in_progress');
    if (currentStepIndex >= 0) {
      workflowState.steps[currentStepIndex].status = 'error';
      workflowState.steps[currentStepIndex].logs.push({
        time: new Date().toLocaleTimeString(),
        message: `Error: ${error.message}`,
        level: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Function to set workflow results from other modules
function setLastWorkflowResults(results) {
  // 🔥 FIX: Don't overwrite if we already have emails and the new results don't
  if (lastWorkflowResults &&
      lastWorkflowResults.emailCampaign &&
      lastWorkflowResults.emailCampaign.emails &&
      lastWorkflowResults.emailCampaign.emails.length > 0 &&
      (!results.emailCampaign || !results.emailCampaign.emails || results.emailCampaign.emails.length === 0)) {
    console.log(`⚠️ Preserving existing ${lastWorkflowResults.emailCampaign.emails.length} emails - not overwriting with empty campaign`);
    // Merge: keep existing emails but update other fields
    lastWorkflowResults = {
      ...results,
      emailCampaign: lastWorkflowResults.emailCampaign  // Keep existing emails
    };
  } else {
    lastWorkflowResults = results;
  }
  console.log(`📦 Stored workflow results with ${results.prospects?.length || 0} prospects and ${lastWorkflowResults.emailCampaign?.emails?.length || 0} emails`);
}

// Function to get workflow results from other modules
function getLastWorkflowResults() {
  return lastWorkflowResults;
}

// Function to add a new email to the workflow results
function addEmailToWorkflowResults(email) {
  if (!lastWorkflowResults) {
    lastWorkflowResults = { emailCampaign: { emails: [] } };
  }
  if (!lastWorkflowResults.emailCampaign) {
    lastWorkflowResults.emailCampaign = { emails: [] };
  }
  if (!lastWorkflowResults.emailCampaign.emails) {
    lastWorkflowResults.emailCampaign.emails = [];
  }

  // Add the new email to the campaign
  lastWorkflowResults.emailCampaign.emails.push(email);
  console.log(`📧 Added email ${email.to} to workflow results. Total emails: ${lastWorkflowResults.emailCampaign.emails.length}`);
}

// Get generated email for professional editor
router.get('/generated-email', async (req, res) => {
  try {
    const { campaignId, prospectId } = req.query;
    console.log(`📧 Looking for generated email - Campaign: ${campaignId}, Prospect: ${prospectId}`);
    
    // Check if we have generated emails from the last workflow
    if (lastWorkflowResults && lastWorkflowResults.emailCampaign && lastWorkflowResults.emailCampaign.emails) {
      let targetEmail = null;
      
      // If prospectId is provided, find email for that specific prospect
      if (prospectId) {
        targetEmail = lastWorkflowResults.emailCampaign.emails.find(email => 
          email.to === prospectId || email.recipient === prospectId
        );
      } else {
        // Otherwise, get the first available email
        targetEmail = lastWorkflowResults.emailCampaign.emails[0];
      }
      
      if (targetEmail) {
        console.log(`✅ Found generated email for editing:`, targetEmail.subject);
        
        // Format email data for the Professional Email Editor
        const emailData = {
          id: targetEmail.id || `email_${Date.now()}`,
          subject: targetEmail.subject || 'Generated Email',
          preheader: targetEmail.preheader || '',
          body: targetEmail.body || targetEmail.content || '',
          html: targetEmail.body || targetEmail.content || '',
          recipientEmail: targetEmail.to || targetEmail.recipient || prospectId,
          recipientName: targetEmail.recipient_name || targetEmail.recipientName || 'Prospect',
          recipientCompany: targetEmail.recipient_company || targetEmail.recipientCompany || 'Company',
          campaignId: campaignId || targetEmail.campaign_id || 'default',
          templateUsed: targetEmail.template_used || 'default',
          generatedAt: targetEmail.created_at || new Date().toISOString(),
          metadata: {
            senderName: targetEmail.sender_name || 'AI Marketing Assistant',
            senderEmail: targetEmail.sender_email || 'marketing@example.com',
            websiteUrl: targetEmail.website_url || 'https://example.com'
          }
        };
        
        return res.json({
          success: true,
          emailData,
          message: 'Generated email ready for editing'
        });
      }
    }
    
    // Check WebSocket states for recent email generation
    const wsManager = req.app.locals.wsManager;
    if (wsManager && wsManager.workflowStates.size > 0) {
      for (const [workflowId, state] of wsManager.workflowStates) {
        if (state.steps?.email_generation?.result?.emails) {
          const emails = state.steps.email_generation.result.emails;
          let targetEmail = emails.find(email => email.to === prospectId) || emails[0];
          
          if (targetEmail) {
            console.log(`✅ Found generated email in workflow ${workflowId}:`, targetEmail.subject);
            
            const emailData = {
              id: targetEmail.id || `email_${Date.now()}`,
              subject: targetEmail.subject || 'Generated Email',
              preheader: targetEmail.preheader || '',
              body: targetEmail.body || targetEmail.content || '',
              html: targetEmail.body || targetEmail.content || '',
              recipientEmail: targetEmail.to || prospectId,
              recipientName: targetEmail.recipient_name || 'Prospect',
              recipientCompany: targetEmail.recipient_company || 'Company',
              campaignId: campaignId || 'default',
              generatedAt: new Date().toISOString()
            };
            
            return res.json({
              success: true,
              emailData,
              message: 'Generated email ready for editing'
            });
          }
        }
      }
    }
    
    console.log('❌ No generated emails found for editing');
    return res.json({
      success: false,
      message: 'No generated emails available for editing',
      emailData: null
    });
    
  } catch (error) {
    console.error('❌ Error retrieving generated email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve generated email',
      details: error.message
    });
  }
});

// REMOVED DUPLICATE ROUTE - using the real implementation below

// Test endpoint to inject mock email data with template variables
router.post('/inject-test-emails', (req, res) => {
  console.log('🧪 Injecting test emails with template variables for testing...');
  
  const testEmails = [
    {
      id: "test_1",
      to: "maria@deeplearning.ai",
      subject: "Strategic Collaboration with {{companyName}}",
      body: `<div style="padding: 20px; font-family: Arial, sans-serif;">
        <p>Dear {{recipientName}},</p>
        <p>I hope this email finds you well. I am reaching out from {{companyName}} to discuss a potential strategic partnership.</p>
        <p>Our company specializes in AI/Machine Learning solutions and we believe there could be valuable synergies with your organization.</p>
        <p>Would you be available for a brief call to explore collaboration opportunities?</p>
        <p>Best regards,<br>{{senderName}}</p>
        <a href="{{websiteUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; display: inline-block;">Schedule Meeting</a>
      </div>`,
      recipient_name: "Maria",
      recipient_company: "Deeplearning",
      sender_name: "John Smith", 
      sender_email: "john@example.com",
      campaign_id: "test_campaign_123",
      template_used: "partnership_outreach",
      status: "sent",
      sent_at: new Date().toISOString(),
      opens: 0,
      clicks: 0,
      replies: 0
    },
    {
      id: "test_2",
      to: "contact@basis.ai", 
      subject: "{{companyName}} - Partnership Opportunity",
      body: `<div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Hello {{recipientName}},</h2>
        <p>{{companyName}} is excited to connect with innovative companies like Basis.</p>
        <p>We have developed cutting-edge solutions that could complement your AI platform perfectly.</p>
        <p>Let me know if you would be interested in a quick 15-minute call to discuss potential collaboration.</p>
        <p>Tagline here</p>
        <p>Looking forward to hearing from you!</p>
        <p>Best,<br>{{senderName}}</p>
      </div>`,
      recipient_name: "Contact",
      recipient_company: "Basis",
      sender_name: "AI Marketing Team",
      sender_email: "ai@company.com", 
      campaign_id: "test_campaign_123",
      template_used: "partnership_outreach",
      status: "sent",
      sent_at: new Date().toISOString(),
      opens: 1,
      clicks: 0,
      replies: 0
    },
    {
      id: "test_3",
      to: "sales@mailytica.com", 
      subject: "Partnership with {{companyName}} - Skyswancocoa",
      body: `<div style="padding: 20px; font-family: Arial, sans-serif;">
        <p>Hi {{recipientName}},</p>
        <p>I wanted to reach out from {{companyName}} regarding a potential partnership opportunity.</p>
        <p>We specialize in email analytics and believe there could be synergies with Mailytica's platform.</p>
        <p>{{companyName}}</p>
        <p>Tagline here</p>
        <p>Would you be open to a brief conversation about collaboration possibilities?</p>
        <p>Best regards,<br>{{senderName}}</p>
        <a href="{{websiteUrl}}" style="background: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 8px; display: inline-block;">Schedule Meeting</a>
      </div>`,
      recipient_name: "Sales Team",
      recipient_company: "Mailytica", 
      sender_name: "AI Marketing",
      sender_email: "ai@company.com",
      campaign_id: "campaign_1756834677473",
      template_used: "custom",
      status: "sent",
      sent_at: new Date().toISOString(),
      opens: 0,
      clicks: 0,
      replies: 0
    }
  ];

  // Store test emails in workflow results
  const mockResults = {
    emailCampaign: {
      emails: testEmails,
      emailsSent: testEmails,
      sent: testEmails.length,
      campaignId: 'test_campaign_123'
    },
    prospects: testEmails.map(email => ({
      email: email.to,
      name: email.recipient_name,
      company: email.recipient_company
    })),
    businessAnalysis: {
      websiteUrl: 'https://example.com',
      industry: 'AI/Machine Learning',
      companyName: 'Skyswancocoa'
    }
  };

  // Store results globally
  setLastWorkflowResults(mockResults);

  // Also broadcast via WebSocket if available
  const wsManager = req.app.locals.wsManager;
  if (wsManager) {
    wsManager.broadcastWorkflowUpdate('test_campaign_123', {
      type: 'data_update',
      data: mockResults
    });
  }

  console.log('✅ Test emails injected successfully');
  res.json({
    success: true,
    message: 'Test emails with template variables injected successfully',
    emailCount: testEmails.length,
    emails: testEmails.map(e => ({ to: e.to, subject: e.subject }))
  });
});

// Export both router and setter function
// Send email endpoint (used by ProfessionalEmailEditor)
router.post('/send-email', async (req, res) => {
  try {
    const { emailData, campaignId, prospectId, action, userTemplate, smtpConfig } = req.body;

    console.log('✅ [WORKFLOW] /send-email endpoint called');
    console.log('📧 Action:', action);
    console.log('📧 Email data keys:', Object.keys(emailData || {}));
    console.log('📧 SMTP Config provided:', !!smtpConfig);
    console.log('📧 User template provided:', !!userTemplate);
    if (userTemplate) {
      console.log('🔍 [WORKFLOW] UserTemplate keys:', Object.keys(userTemplate));
      console.log('🔍 [WORKFLOW] UserTemplate components length:', userTemplate.components?.length || 0);
      console.log('🔍 [WORKFLOW] UserTemplate type:', userTemplate.templateType);
    }

    // Get the recipient email from emailData
    const recipientEmail = emailData?.to || emailData?.recipientEmail;
    const emailSubject = emailData?.subject || userTemplate?.subject || 'Professional Email';
    const emailBody = emailData?.html || emailData?.body || userTemplate?.html || 'Email content';

    // Use global LangGraph agent to maintain workflow state
    const agent = getMarketingAgent(req);

    console.log('📧 Recipient:', recipientEmail);
    console.log('📧 Subject:', emailSubject);
    console.log('📧 Body length:', emailBody.length);
    console.log('📊 Agent workflow state:', agent.state?.workflowPaused ? 'PAUSED' : 'NOT PAUSED');
    console.log('📊 Campaign ID from request:', campaignId);

    if (!recipientEmail) {
      console.log('❌ No recipient email found');
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    // Extract SMTP config from userTemplate or use provided smtpConfig
    let finalSmtpConfig = smtpConfig;
    if (!finalSmtpConfig && userTemplate?.smtpConfig) {
      finalSmtpConfig = userTemplate.smtpConfig;
    }

    console.log('📧 Using SMTP config:', finalSmtpConfig ? 'YES' : 'NO (will use env vars)');

    // Prepare email data for sending
    const sendEmailData = {
      to: recipientEmail,
      subject: emailSubject,
      body: emailBody,
      prospect: {
        email: recipientEmail,
        name: emailData?.recipient_name || 'Prospect',
        company: emailData?.recipient_company || 'Company'
      },
      campaignId: campaignId,
      smtpConfig: finalSmtpConfig
    };

    console.log('📤 [WORKFLOW] Attempting to send email via LangGraphMarketingAgent...');
    console.log('📤 [WORKFLOW] SMTP Host:', finalSmtpConfig?.host || 'using env vars');
    console.log('📤 [WORKFLOW] SMTP User:', finalSmtpConfig?.auth?.user || finalSmtpConfig?.user || 'using env vars');

    try {
      // Actually send the email
      const sendResult = await agent.sendEmail(sendEmailData);

      console.log('📧 [WORKFLOW] Send result:', JSON.stringify(sendResult, null, 2));

      if (sendResult.success) {
        console.log('✅ [WORKFLOW] Email ACTUALLY sent successfully to', recipientEmail);
        console.log('✅ [WORKFLOW] Message ID:', sendResult.messageId);

        // Check if this is the first email in a workflow that needs to continue
        // Note: action might be undefined from frontend, so we check for campaignId and workflowPaused state
        if (campaignId && agent.state?.workflowPaused) {
          console.log('📊 First email sent, checking if workflow should continue...');
          console.log('📊 Campaign ID:', campaignId);
          console.log('📊 Workflow paused state:', agent.state.workflowPaused);
          console.log('✅ Resuming workflow after first email sent...');

          // Resume the workflow with user template approval and SMTP config
          agent.resumeWorkflow('continue', userTemplate, smtpConfig);

          // Continue generating emails for remaining prospects
          setTimeout(async () => {
            try {
              console.log('🔄 Continuing email generation for remaining prospects...');

              // Get the stored campaign data
              const campaignData = agent.state?.pausedCampaignData;

              if (campaignData && campaignData.prospects && campaignData.prospects.length > 1) {
                // Get the first email content to use as template for remaining emails
                // IMPORTANT: Use the actual edited HTML that was sent (emailBody), not the original template
                const firstEmailData = {
                  subject: emailSubject,
                  html: emailBody,  // This is the actual edited HTML from the email editor
                  body: emailBody,  // Same content for consistency
                  senderName: smtpConfig?.fromName || 'AI Agent',
                  senderEmail: smtpConfig?.username || smtpConfig?.user,
                  isEditedTemplate: true  // Flag to indicate this is the edited version
                };

                console.log('📝 Using edited email as template for remaining emails');
                console.log('📝 Template HTML length from editor:', emailBody?.length || 0);

                const templateToUse = firstEmailData;

                console.log('🔍 Template to use keys:', Object.keys(templateToUse || {}));
                console.log('🔍 Template HTML length:', templateToUse?.html?.length || 0);

                // Continue from prospect index 1 (second prospect)
                const remainingResults = await agent.continueGeneratingEmails(
                  campaignId,
                  campaignData.prospects,
                  1,  // Start from index 1
                  templateToUse,
                  smtpConfig,
                  campaignData.targetAudience,
                  'user_template'
                );

                console.log(`✅ Generated and sent ${remainingResults.emails.length} additional emails`);
              }
            } catch (error) {
              console.error('❌ Error continuing workflow:', error);
            }
          }, 1000);  // Small delay to ensure first email is processed
        }

        res.json({
          success: true,
          message: 'Email sent successfully',
          sendResult: sendResult,
          recipient: recipientEmail,
          subject: emailSubject,
          messageId: sendResult.messageId
        });
      } else {
        console.log('❌ [WORKFLOW] Email send failed:', sendResult.error);

        res.json({
          success: false,
          message: 'Email sending failed',
          sendError: sendResult.error,
          sendingFailed: true
        });
      }
    } catch (sendError) {
      console.error('❌ [WORKFLOW] Email sending error:', sendError);

      res.json({
        success: false,
        message: 'Email sending encountered an error',
        sendError: sendError.message,
        sendingFailed: true
      });
    }

  } catch (error) {
    console.error('❌ [WORKFLOW] /send-email endpoint failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve an email for sending
router.post('/approve-email', async (req, res) => {
  try {
    const { emailId, campaignId, prospectEmail, editedContent, emailData } = req.body;
    
    console.log('✅ [WORKFLOW] Approving and sending email:', emailId, 'for campaign:', campaignId);
    console.log('📧 Recipient:', prospectEmail || emailData?.to);
    console.log('📝 Subject:', editedContent?.subject || emailData?.subject);
    
    // Get the recipient email from various possible sources
    const recipientEmail = prospectEmail || emailData?.to || emailData?.recipientEmail;
    const emailSubject = editedContent?.subject || emailData?.subject || 'Professional Email';
    const emailBody = editedContent?.html || editedContent?.body || emailData?.html || emailData?.body || 'Email content';
    
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }
    
    // Use global LangGraph agent to maintain workflow state
    const agent = getMarketingAgent(req);
    
    // Prepare email data for sending
    const sendEmailData = {
      to: recipientEmail,
      subject: emailSubject,
      body: emailBody,
      prospect: {
        email: recipientEmail,
        name: emailData?.recipient_name || 'Prospect',
        company: emailData?.recipient_company || 'Company'
      },
      campaignId: campaignId
    };
    
    console.log('📤 [WORKFLOW] Attempting to send email via LangGraphMarketingAgent...');
    console.log('📤 Send data:', { to: sendEmailData.to, subject: sendEmailData.subject });
    
    try {
      // Actually send the email
      const sendResult = await agent.sendEmail(sendEmailData);
      
      console.log('📧 [WORKFLOW] Send result:', sendResult);
      
      if (sendResult.success) {
        console.log('✅ [WORKFLOW] Email sent successfully');
        
        res.json({
          success: true,
          message: 'Email approved and sent successfully',
          emailId,
          sendResult: sendResult,
          recipient: recipientEmail,
          subject: emailSubject
        });
      } else {
        console.log('❌ [WORKFLOW] Email send failed:', sendResult.error);
        
        res.json({
          success: false,
          message: 'Email sending failed',
          sendError: sendResult.error,
          sendingFailed: true
        });
      }
    } catch (sendError) {
      console.error('❌ [WORKFLOW] Email sending error:', sendError);
      
      res.json({
        success: false,
        message: 'Email sending encountered an error',
        sendError: sendError.message,
        sendingFailed: true
      });
    }
    
  } catch (error) {
    console.error('❌ [WORKFLOW] Failed to approve email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle user decision from popup
router.post('/user-decision', async (req, res) => {
  try {
    const { decision, campaignId, userTemplate, smtpConfig } = req.body;
    console.log(`👤 User decision received: ${decision} for campaign: ${campaignId}`);
    console.log('🔍 DEBUG: userTemplate received:', !!userTemplate);
    console.log('🔧 DEBUG: smtpConfig received:', !!smtpConfig);
    if (userTemplate) {
      console.log('🔍 DEBUG: userTemplate keys:', Object.keys(userTemplate));
      console.log('🔍 DEBUG: userTemplate.components length:', userTemplate.components?.length || 0);
    }
    
    // Get the LangGraph agent instance
    const agent = req.app.locals.langGraphAgent;
    if (!agent) {
      return res.status(500).json({
        success: false,
        error: 'LangGraph agent not available'
      });
    }
    
    // Resume the workflow with user decision and SMTP config
    agent.resumeWorkflow(decision, userTemplate, smtpConfig);
    
    res.json({
      success: true,
      message: `User decision processed: ${decision}`,
      decision,
      campaignId
    });
    
  } catch (error) {
    console.error('❌ Error processing user decision:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve email and continue workflow
router.post('/approve-email', (req, res) => {
  const { emailEdits } = req.body;
  
  if (!workflowState.waitingForUserApproval) {
    return res.status(400).json({
      success: false,
      error: 'Workflow is not waiting for approval'
    });
  }
  
  const reviewStep = workflowState.steps.find(s => s.id === 'email_review');
  if (!reviewStep) {
    return res.status(400).json({
      success: false,
      error: 'Email review step not found'
    });
  }
  
  // Apply any edits from the user
  if (emailEdits && workflowState.firstEmailGenerated) {
    if (emailEdits.subject) {
      workflowState.firstEmailGenerated.subject = emailEdits.subject;
    }
    if (emailEdits.body) {
      workflowState.firstEmailGenerated.body = emailEdits.body;
    }
    addLog(reviewStep, '✏️ User edits applied to sample email', 'success');
  }
  
  // Complete the review step
  reviewStep.status = 'completed';
  reviewStep.progress = 100;
  reviewStep.endTime = new Date().toISOString();
  addLog(reviewStep, '✅ Email approved by user - continuing workflow', 'success');
  
  // Clear waiting state
  workflowState.waitingForUserApproval = false;
  
  // Continue with generating remaining emails
  setTimeout(() => {
    if (workflowState.isRunning) {
      continueEmailGeneration();
    }
  }, 1000);
  
  res.json({
    success: true,
    message: 'Email approved, continuing workflow',
    data: workflowState
  });
});

async function continueEmailGeneration() {
  // This function continues generating the rest of the emails after approval
  const sendingStep = workflowState.steps.find(s => s.id === 'email_sending');
  if (!sendingStep) return;
  
  // Add a brief generation step for remaining emails
  const reviewStep = workflowState.steps.find(s => s.id === 'email_review');
  addLog(reviewStep, '🚀 Generating remaining 155 emails based on approved template...', 'info');
  
  // Simulate generating the rest of the emails quickly
  await new Promise(resolve => setTimeout(resolve, 2000));
  addLog(reviewStep, '✅ All 156 emails generated successfully', 'success');
  
  // Now start email sending
  setTimeout(() => {
    if (workflowState.isRunning) {
      startEmailSending();
    }
  }, 500);
}

module.exports = router;
module.exports.setLastWorkflowResults = setLastWorkflowResults;
module.exports.getLastWorkflowResults = getLastWorkflowResults;
module.exports.addEmailToWorkflowResults = addEmailToWorkflowResults;