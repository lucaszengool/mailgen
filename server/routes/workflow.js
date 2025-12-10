const express = require('express');
const router = express.Router();
const path = require('path');
const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
const EmailEditorService = require('../services/EmailEditorService');
const KnowledgeBaseSingleton = require('../models/KnowledgeBaseSingleton');
const db = require('../models/database');
const UserStorageService = require('../services/UserStorageService');
const { optionalAuth, strictAuth } = require('../middleware/userContext');
const { enhanceProspect, GENERIC_PREFIXES } = require('../utils/emailEnrichment');

// 🔥 PRODUCTION FIX: Store last workflow results per user AND per campaign
// Structure: userId -> Map(campaignId -> workflowResults)
// ⚠️ NOTE: This is in-memory storage. On Railway/production, database is source of truth
const userCampaignWorkflowResults = new Map(); // userId -> Map(campaignId -> workflowResults)

console.log(`🚀 [PRODUCTION] Workflow storage initialized - ENV: ${process.env.NODE_ENV || 'development'}`);

// 🎯 FIX: Track if template has been submitted to prevent popup re-triggering (per user AND per campaign)
const userCampaignTemplateSubmitted = new Map(); // "userId_campaignId" -> boolean

// Global EmailEditorService instance for clearing email data
const emailEditorService = new EmailEditorService();

// User-specific workflow states (multi-tenant support)
const userWorkflowStates = new Map(); // userId -> workflowState

// 🔥 MULTI-USER FIX: Store paused campaign data per user for workflow continuation
const userPausedCampaignData = new Map(); // "userId_campaignId" -> pausedCampaignData

// 🔥 MULTI-PROCESS: Store separate agent instances per user AND per campaign
// This ensures complete isolation between different users and campaigns
const userCampaignAgents = new Map(); // "userId_campaignId" -> LangGraphMarketingAgent instance

/**
 * 🔥 MULTI-PROCESS: Get or create a dedicated agent for a specific user+campaign
 * Each user's campaign gets its own isolated agent instance
 */
function getOrCreateUserCampaignAgent(userId, campaignId, wsManager = null) {
  const key = `${userId}_${campaignId}`;

  if (!userCampaignAgents.has(key)) {
    console.log(`\n${'🚀'.repeat(20)}`);
    console.log(`🔥 [MULTI-PROCESS] Creating NEW agent instance`);
    console.log(`   👤 User: ${userId}`);
    console.log(`   📋 Campaign: ${campaignId}`);
    console.log(`   🔑 Key: ${key}`);
    console.log(`${'🚀'.repeat(20)}\n`);

    const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
    const agent = new LangGraphMarketingAgent();
    agent.userId = userId;
    agent.campaignId = campaignId;

    // Attach WebSocket manager if provided
    if (wsManager) {
      agent.wsManager = wsManager;
    }

    userCampaignAgents.set(key, agent);
    console.log(`   ✅ Agent created and stored. Total active agents: ${userCampaignAgents.size}`);
  } else {
    console.log(`📦 [MULTI-PROCESS] Reusing existing agent for ${key}`);
  }

  return userCampaignAgents.get(key);
}

/**
 * Get existing agent for user+campaign (without creating new one)
 */
function getUserCampaignAgent(userId, campaignId) {
  const key = `${userId}_${campaignId}`;
  const agent = userCampaignAgents.get(key);
  if (agent) {
    console.log(`📦 [MULTI-PROCESS] Found existing agent for ${key}`);
  } else {
    console.log(`⚠️ [MULTI-PROCESS] No agent found for ${key}`);
  }
  return agent;
}

/**
 * Remove agent when campaign is completed or reset
 */
function removeUserCampaignAgent(userId, campaignId) {
  const key = `${userId}_${campaignId}`;
  if (userCampaignAgents.has(key)) {
    const agent = userCampaignAgents.get(key);
    // Clean up agent resources if needed
    if (agent.cleanup) {
      try {
        agent.cleanup();
      } catch (e) {
        console.warn(`⚠️ Error cleaning up agent: ${e.message}`);
      }
    }
    userCampaignAgents.delete(key);
    console.log(`🗑️ [MULTI-PROCESS] Removed agent for ${key}. Remaining agents: ${userCampaignAgents.size}`);
  }
}

/**
 * List all active agents (for debugging)
 */
function listActiveAgents() {
  console.log(`\n📊 [MULTI-PROCESS] Active agents: ${userCampaignAgents.size}`);
  for (const [key, agent] of userCampaignAgents.entries()) {
    console.log(`   - ${key}: paused=${agent.state?.workflowPaused || false}`);
  }
  return Array.from(userCampaignAgents.keys());
}

// 🔥 CRITICAL FIX: Updated to prefer user-specific agents over global
function getMarketingAgent(req, userId = null, campaignId = null) {
  // Extract userId and campaignId from request if not provided
  const reqUserId = userId || req?.userId || req?.body?.userId || 'anonymous';
  const reqCampaignId = campaignId || req?.body?.campaignId || req?.query?.campaignId;

  // 1. Try user-specific agent first
  if (reqUserId && reqCampaignId) {
    const userAgent = getUserCampaignAgent(reqUserId, reqCampaignId);
    if (userAgent) {
      console.log(`✅ [getMarketingAgent] Using USER-SPECIFIC agent for ${reqUserId}/${reqCampaignId}`);
      return userAgent;
    }
  }

  // 2. Fall back to global agent from app.locals
  if (req && req.app && req.app.locals && req.app.locals.langGraphAgent) {
    console.log(`⚠️ [getMarketingAgent] Using GLOBAL agent (user-specific not found)`);
    return req.app.locals.langGraphAgent;
  }

  // 3. Last resort fallback
  console.warn('⚠️ Warning: Could not get agent from app.locals, creating fallback instance');
  if (!global.__marketingAgentFallback) {
    const LangGraphMarketingAgent = require('../agents/LangGraphMarketingAgent');
    global.__marketingAgentFallback = new LangGraphMarketingAgent();
  }
  return global.__marketingAgentFallback;
}

// Helper function to get or create user-specific workflow state
function getUserWorkflowState(userId = 'anonymous') {
  if (!userWorkflowStates.has(userId)) {
    userWorkflowStates.set(userId, createDefaultWorkflowState());
  }
  return userWorkflowStates.get(userId);
}

// Helper function to create default workflow state
function createDefaultWorkflowState() {
  return {
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
}

// Backward compatibility: Default workflow state for anonymous users
let workflowState = getUserWorkflowState('anonymous');

// Get current workflow status
router.get('/status', optionalAuth, (req, res) => {
  // Get user-specific workflow state
  const userWorkflowState = getUserWorkflowState(req.userId);
  res.json({
    success: true,
    data: userWorkflowState
  });
});

// 🔥 NEW: Get workflow session for reconnection/resume
// Returns the persisted session state from database
router.get('/session/:campaignId', strictAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.userId;

    console.log(`📋 Getting workflow session for ${userId}/${campaignId}`);

    // Get session from database
    const session = await db.getWorkflowSession(userId, campaignId);

    // Get prospects from database
    const prospects = await db.getContacts(userId, campaignId);

    // Get emails from database
    const emails = await db.getEmailDrafts(userId, campaignId);

    if (!session) {
      return res.json({
        success: true,
        data: {
          session: { status: 'idle', currentStep: null },
          prospects: prospects || [],
          emails: emails || [],
          isNew: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          ...session,
          status: session.status,
          currentStep: session.current_step,
          prospectsFound: session.prospects_found,
          emailsGenerated: session.emails_generated,
          startedAt: session.started_at,
          lastActivity: session.last_activity
        },
        prospects: prospects || [],
        emails: emails || [],
        isNew: false
      }
    });
  } catch (error) {
    console.error('❌ Error getting workflow session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow session',
      message: error.message
    });
  }
});

// 🔥 NEW: Get all active workflow sessions for a user
router.get('/sessions', strictAuth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`📋 Getting all active workflow sessions for ${userId}`);

    const sessions = await db.getActiveWorkflowSessions(userId);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('❌ Error getting workflow sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow sessions',
      message: error.message
    });
  }
});

// NOTE: Main /stats endpoint is defined later in this file (line ~2526)
// It properly checks getUserLimit for isUnlimited status

// Start workflow - 🔥 REQUIRES AUTHENTICATION (no demo users)
router.post('/start', strictAuth, async (req, res) => {
  console.log('🚀 WORKFLOW START ENDPOINT CALLED!');
  console.log('🔍 Request body:', req.body);
  console.log('👤 User ID:', req.userId);
  console.log('📁 Campaign ID:', req.body.campaignId);

  // 🔥 CRITICAL: Validate authentication
  if (!req.userId || req.userId === 'demo' || req.userId === 'anonymous') {
    console.log('❌ Workflow start rejected - authentication required');
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please sign in to start a workflow.',
      requiresAuth: true
    });
  }

  try {
    // 🎯 Ensure user is tracked in database with default limits
    if (req.userId && req.userEmail) {
      try {
        await db.ensureUserTracked(req.userId, req.userEmail);
      } catch (trackError) {
        console.error('❌ Failed to track user:', trackError);
        // Don't fail the request, just log the error
      }
    }

    // 🔥 NEW: Create/update workflow session in database
    const campaignId = req.body.campaignId;
    if (campaignId) {
      try {
        await db.saveWorkflowSession(req.userId, campaignId, {
          status: 'running',
          currentStep: 'website_analysis',
          startedAt: new Date().toISOString()
        });
        console.log(`✅ [DATABASE] Workflow session created for ${req.userId}/${campaignId}`);
      } catch (sessionError) {
        console.error('❌ Failed to create workflow session:', sessionError);
        // Don't fail - session tracking is best-effort
      }
    }

    // Get user-specific workflow state
    const workflowState = getUserWorkflowState(req.userId);

    // Store campaign ID in workflow state
    if (req.body.campaignId) {
      workflowState.campaignId = req.body.campaignId;
      workflowState.campaignName = req.body.campaignName;
      console.log(`📁 Workflow associated with campaign: ${req.body.campaignName} (${req.body.campaignId})`);
    }

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

    // 🎯 FIX: Reset template submission flag when workflow starts (per user AND campaign)
    // Note: campaignId already declared above on line 251
    const templateCampaignId = campaignId || 'default';
    const templateKey = `${req.userId}_${templateCampaignId}`;
    userCampaignTemplateSubmitted.set(templateKey, false);
    console.log(`🎯 [RESET] Template submitted flag cleared for: ${templateKey}`);

    // 🔥 RAILWAY FIX: Also clear from Redis
    try {
      const redisCache = require('../utils/RedisUserCache');
      await redisCache.delete(req.userId, `templateSubmitted_${templateCampaignId}`);
      console.log(`🎯 [RESET] Template submitted flag cleared from Redis for: ${templateKey}`);
    } catch (redisErr) {
      console.log('⚠️ Could not clear Redis template submission:', redisErr.message);
    }

    workflowState.currentStep = 'website_analysis';
    workflowState.isRunning = true;
    workflowState.lastUpdate = new Date().toISOString();
    workflowState.userId = req.userId; // Track which user owns this workflow

    // 🔥 MULTI-PROCESS: Create dedicated agent for this user+campaign
    // Each user's campaign gets its own isolated agent instance
    const agent = getOrCreateUserCampaignAgent(
      req.userId,
      campaignId || 'default',
      req.app.locals.wsManager
    );

    // Pass workflow state reference to agent so it can update firstEmailGenerated
    agent.workflowState = workflowState;
    agent.userId = req.userId;
    agent.campaignId = campaignId;

    // Set WebSocket manager for real-time logging
    if (req.app.locals.wsManager) {
      agent.wsManager = req.app.locals.wsManager;
      console.log('✅ WebSocket manager attached to user-specific agent');
    } else {
      console.warn('⚠️ No WebSocket manager found in app.locals');
    }

    // Log multi-process status
    console.log(`🔥 [MULTI-PROCESS] Started workflow with dedicated agent`);
    console.log(`   👤 User: ${req.userId}`);
    console.log(`   📋 Campaign: ${campaignId}`);
    console.log(`   📊 Total active agents: ${listActiveAgents().length}`);
    listActiveAgents();

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

    // 💾 CRITICAL: Load SMTP config from database for user persistence
    let smtpConfigFromDB = null;
    try {
      smtpConfigFromDB = await db.getSMTPConfig(req.userId);
      if (smtpConfigFromDB) {
        console.log(`✅ [User: ${req.userId}] Loaded SMTP config from database`);
      } else {
        console.log(`⚠️ [User: ${req.userId}] No SMTP config found in database, will use savedConfig or request body`);
      }
    } catch (dbError) {
      console.error(`❌ [User: ${req.userId}] Failed to load SMTP config from database:`, dbError);
    }

    // Log final config status
    console.log('📋 Final savedConfig status:', {
      exists: !!savedConfig,
      hasTargetWebsite: !!savedConfig?.targetWebsite,
      hasWebsiteAnalysis: !!savedConfig?.websiteAnalysis,
      hasSMTPConfig: !!savedConfig?.smtpConfig,
      hasSMTPConfigFromDB: !!smtpConfigFromDB
    });

    // Execute real campaign in background
    const campaignConfig = {
      campaignId: req.body.campaignId || null,  // 📁 Include campaign ID
      campaignName: req.body.campaignName || 'Default Campaign',  // 📁 Include campaign name
      targetWebsite: req.body.targetWebsite || savedConfig?.targetWebsite || 'https://example.com',
      campaignGoal: req.body.campaignGoal || savedConfig?.campaignGoal || 'partnership',
      businessType: req.body.businessType || savedConfig?.businessType || 'technology',
      smtpConfig: req.body.smtpConfig || smtpConfigFromDB || savedConfig?.smtpConfig, // 💾 Prioritize DB config
      emailTemplate: req.body.emailTemplate || savedConfig?.emailTemplate,
      templateData: req.body.templateData || savedConfig?.templateData,
      audienceType: req.body.audienceType || savedConfig?.audienceType,
      industries: req.body.industries || savedConfig?.industries,
      roles: req.body.roles || savedConfig?.roles,
      keywords: req.body.keywords || savedConfig?.keywords,
      controls: req.body.controls,
      websiteAnalysis: req.body.websiteAnalysis || savedConfig?.websiteAnalysis,  // 🎯 Include websiteAnalysis
      userId: req.userId  // 🎯 CRITICAL: Pass userId to agent so it can store results correctly
    };

    // Start real workflow execution in background
    console.log('🎯 About to execute real workflow...');

    // CRITICAL: Execute workflow WITHOUT await to prevent blocking the response
    // but ensure it actually runs by wrapping in an immediately invoked async function
    (async () => {
      try {
        console.log('🚀 [RAILWAY DEBUG] Executing real workflow in background...');
        console.log(`👤 [RAILWAY DEBUG] User ID: ${req.userId}`);
        await executeRealWorkflow(agent, campaignConfig, req.userId);
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
router.post('/pause', optionalAuth, (req, res) => {
  const workflowState = getUserWorkflowState(req.userId);
  workflowState.isRunning = false;
  workflowState.lastUpdate = new Date().toISOString();

  res.json({
    success: true,
    message: 'Workflow paused',
    data: workflowState
  });
});

// Resume workflow
router.post('/resume', optionalAuth, (req, res) => {
  const workflowState = getUserWorkflowState(req.userId);
  workflowState.isRunning = true;
  workflowState.lastUpdate = new Date().toISOString();

  res.json({
    success: true,
    message: 'Workflow resumed',
    data: workflowState
  });
});

// Reset workflow - clear all data
router.post('/reset', optionalAuth, async (req, res) => {
  const userId = req.userId;
  console.log(`🗑️ Resetting workflow for user: ${userId}`);

  // Completely reset user-specific workflow state
  userWorkflowStates.set(userId, {
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
  });

  // Clear all cached workflow results and email data for this user
  userWorkflowResults.delete(userId);

  // 🎯 FIX: Reset ALL template submission flags for this user (all campaigns)
  for (const key of userCampaignTemplateSubmitted.keys()) {
    if (key.startsWith(`${userId}_`)) {
      userCampaignTemplateSubmitted.delete(key);
    }
  }
  console.log(`🎯 [CLEAR] All template submitted flags cleared for user: ${userId}`);

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

  // Get the updated workflow state
  const workflowState = getUserWorkflowState(userId);

  res.json({
    success: true,
    message: 'Workflow completely reset - all data cleared',
    data: workflowState
  });
});

// Get detailed information for specific step
router.get('/step/:stepId', optionalAuth, (req, res) => {
  const workflowState = getUserWorkflowState(req.userId);
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
router.get('/results', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const campaignId = req.query.campaignId || null;  // 🔥 PRODUCTION: Campaign filter
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 [WORKFLOW RESULTS] Fetching results for User: ${userId}`);
    console.log(`📋 Campaign ID requested: ${campaignId || 'LATEST (most recent)'}`);
    console.log(`🌐 Request URL: ${req.url}`);
    console.log(`📦 Query params:`, req.query);
    console.log(`${'='.repeat(80)}`);

    // Get user-specific workflow state and results
    const workflowState = getUserWorkflowState(userId);
    const lastWorkflowResults = await getLastWorkflowResults(userId, campaignId);

    // First check if we have stored results from the last campaign
    // 🎯 FIX: Also check for emails, not just prospects
    if (lastWorkflowResults &&
        (lastWorkflowResults.prospects?.length > 0 || lastWorkflowResults.emailCampaign?.emails?.length > 0)) {
      console.log(`\n✅ [RESULTS FOUND] Stored workflow results located:`);
      console.log(`   📊 Prospects: ${lastWorkflowResults.prospects?.length || 0}`);
      console.log(`   📧 Emails: ${lastWorkflowResults.emailCampaign?.emails?.length || 0}`);
      console.log(`   🆔 Campaign ID in results: ${lastWorkflowResults.campaignId || 'NOT SET'}`);
      console.log(`   🆔 Campaign ID requested: ${campaignId || 'LATEST'}`);
      console.log(`   ✅ Campaign ID match: ${lastWorkflowResults.campaignId === campaignId ? 'YES' : 'NO'}`);
      console.log(`   📅 Last update: ${lastWorkflowResults.timestamp || 'unknown'}`);
      console.log('\n🔧 [TEMPLATE PROCESSING] Starting template variable replacement...');
      
      // CRITICAL FIX: Replace template variables in email campaign data before returning
      const processedResults = JSON.parse(JSON.stringify(lastWorkflowResults)); // Deep clone
      console.log('🔧 DEBUG: Email campaign exists:', !!processedResults.emailCampaign);
      console.log('🔧 DEBUG: Emails exist:', !!processedResults.emailCampaign?.emails);
      console.log('🔧 DEBUG: Emails count:', processedResults.emailCampaign?.emails?.length || 0);
      
      if (processedResults.emailCampaign && processedResults.emailCampaign.emails) {
        console.log(`\n🔍 =====================================================`);
        console.log(`🔍 EMAIL CAMPAIGN DATA - CAMPAIGN ISOLATION CHECK`);
        console.log(`🔍 =====================================================`);
        console.log(`   🆔 Campaign ID: ${processedResults.campaignId}`);
        console.log(`   📧 Total Emails BEFORE filtering: ${processedResults.emailCampaign.emails.length}`);
        console.log(`   👤 User ID: ${userId}`);

        // 🔒 CRITICAL: Filter emails by campaignId to ensure campaign isolation
        const emailsBeforeFilter = processedResults.emailCampaign.emails.length;
        processedResults.emailCampaign.emails = processedResults.emailCampaign.emails.filter(email => {
          // Check all possible campaign ID fields
          const emailCampaignId = email.campaignId || email.campaign_id || email.campaign;

          // 🔒 STRICT MATCHING: Email MUST have a campaignId AND it MUST match requested campaign
          if (!emailCampaignId) {
            console.log(`   ⚠️  Filtering out email WITHOUT campaignId: ${email.to} (will cause mixing!)`);
            return false; // Reject emails without campaignId
          }

          const matches = emailCampaignId === campaignId || emailCampaignId === String(campaignId);

          if (!matches) {
            console.log(`   🗑️  Filtering out email from campaign ${emailCampaignId}: ${email.to} (requested: ${campaignId})`);
          }

          return matches;
        });

        console.log(`   🔒 Campaign isolation: ${emailsBeforeFilter} total → ${processedResults.emailCampaign.emails.length} for campaign ${campaignId}`);

        if (processedResults.emailCampaign.emails.length === 0 && emailsBeforeFilter > 0) {
          console.warn(`   ⚠️  WARNING: All ${emailsBeforeFilter} emails were filtered out! Campaign ID mismatch!`);
        }

        console.log(`   📧 Total Emails AFTER filtering: ${processedResults.emailCampaign.emails.length}`);

        console.log(`\n   📋 Email Recipients in this campaign:`);
        processedResults.emailCampaign.emails.forEach((email, i) => {
          console.log(`      ${i + 1}. ${email.to} (${email.recipientName || 'No Name'} @ ${email.recipientCompany || email.company || 'No Company'})`);
        });
        console.log(`🔍 =====================================================\n`);

        console.log(`🔍 Processing ${processedResults.emailCampaign.emails.length} emails for template variable replacement`);

        processedResults.emailCampaign.emails = processedResults.emailCampaign.emails.map((email, index) => {
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

          // Log email structure for debugging
          if (index === 0) {
            console.log(`📧 Email ${index + 1} structure:`, {
              to: email.to || email.recipient_email,
              subject: email.subject?.substring(0, 50) + '...',
              hasBody: !!email.body,
              bodyLength: email.body?.length || 0,
              hasHTML: !!email.html,
              htmlLength: email.html?.length || 0,
              template: email.template
            });
          }

          // CRITICAL FIX: Ensure both html and body fields are set
          const processedEmail = {
            ...email,
            subject: replaceTemplateVariables(email.subject, email),
            body: replaceTemplateVariables(email.body || email.html, email),
            html: replaceTemplateVariables(email.html || email.body, email), // Ensure HTML field is set
            _raw_subject: email.subject, // Keep original for reference
            _raw_body: email.body
          };

          if (index === 0) {
            console.log(`✅ Email ${index + 1} after processing:`, {
              bodyLength: processedEmail.body?.length || 0,
              htmlLength: processedEmail.html?.length || 0
            });
          }

          return processedEmail;
        });

        console.log(`✅ Processed ${processedResults.emailCampaign.emails.length} emails with template variables replaced`);
      }
      
      console.log('🔧 Template variables replaced in stored results');

      // 🔥 NEW: Enrich and filter prospects before returning
      console.log('\n📊 [PROSPECT ENRICHMENT] Processing prospects...');
      let enrichedProspects = processedResults.prospects || [];

      if (enrichedProspects.length > 0) {
        // 🔒 CRITICAL: Filter prospects by campaignId FIRST to prevent mixing
        const prospectsBeforeCampaignFilter = enrichedProspects.length;
        if (campaignId) {
          enrichedProspects = enrichedProspects.filter(p => {
            const prospectCampaignId = p.campaignId || p.campaign_id || p.campaign;

            // 🔥 FIX: STRICT MATCHING - Always reject prospects without campaignId
            // This prevents mixing from old prospects that didn't have campaignId set
            if (!prospectCampaignId) {
              console.log(`   🗑️  [CAMPAIGN ISOLATION] Filtering out prospect WITHOUT campaignId: ${p.email} (STRICT: must have campaignId)`);
              return false;
            }

            const matches = prospectCampaignId === campaignId || prospectCampaignId === String(campaignId);
            if (!matches) {
              console.log(`   🗑️  [CAMPAIGN ISOLATION] Filtering out prospect from campaign ${prospectCampaignId}: ${p.email} (requested: ${campaignId})`);
            }
            return matches;
          });
          console.log(`   🔒 Campaign prospect isolation: ${prospectsBeforeCampaignFilter} total → ${enrichedProspects.length} for campaign ${campaignId}`);
        }

        // Filter out fake/example emails
        const fakeEmails = ['example@gmail.com', 'youremail@yourbusinessname.com', 'test@test.com', 'demo@demo.com'];
        enrichedProspects = enrichedProspects.filter(p => {
          const email = (p.email || '').toLowerCase();
          const localPart = email.split('@')[0];

          // Filter out exact fake emails
          if (fakeEmails.includes(email)) {
            console.log(`   🗑️  Filtered fake email: ${email}`);
            return false;
          }

          // Filter out generic example patterns
          if (localPart === 'example' || localPart === 'youremail' || localPart === 'yourname') {
            console.log(`   🗑️  Filtered generic email: ${email}`);
            return false;
          }

          return true;
        });

        // Enrich all prospects with extracted data
        enrichedProspects = enrichedProspects.map((prospect, index) => {
          const enhanced = enhanceProspect(prospect);

          if (index === 0) {
            console.log(`   ✅ Enhanced prospect example:`, {
              email: enhanced.email,
              name: enhanced.name,
              title: enhanced.title,
              department: enhanced.department,
              seniority: enhanced.seniority,
              qualityScore: enhanced.qualityScore
            });
          }

          return enhanced;
        });

        console.log(`   📊 Enriched ${enrichedProspects.length} prospects (filtered from ${processedResults.prospects.length})`);
      }

      // 🎯 FIX: Add workflowState fields directly to processedResults at the correct level
      // The frontend expects these fields alongside prospects and campaignData

      // 🔥 DATABASE FALLBACK: If in-memory doesn't have waitingForUserApproval, check database
      let effectiveWorkflowState = workflowState;
      if (!workflowState.waitingForUserApproval && campaignId) {
        try {
          const dbSession = await db.getWorkflowSession(userId, campaignId);
          if (dbSession && dbSession.workflowState) {
            console.log(`💾 [DB FALLBACK] Found workflow state in database for campaign ${campaignId}`);
            console.log(`   waitingForUserApproval: ${dbSession.workflowState.waitingForUserApproval}`);
            console.log(`   firstEmailGenerated: ${!!dbSession.workflowState.firstEmailGenerated}`);

            // Merge database state with in-memory state
            if (dbSession.workflowState.waitingForUserApproval || dbSession.workflowState.firstEmailGenerated) {
              effectiveWorkflowState = {
                ...workflowState,
                waitingForUserApproval: dbSession.workflowState.waitingForUserApproval || workflowState.waitingForUserApproval,
                firstEmailGenerated: dbSession.workflowState.firstEmailGenerated || workflowState.firstEmailGenerated
              };

              // Also update in-memory for future requests
              Object.assign(workflowState, effectiveWorkflowState);
            }
          }
        } catch (dbErr) {
          console.error(`⚠️ [DB FALLBACK] Failed to read workflow state from DB:`, dbErr.message);
        }
      }

      // 🔥 CRITICAL FIX: Only include firstEmailGenerated if it belongs to THIS campaign
      // 🔒 STRICT: Both campaignId must exist AND match - never show if either is null
      const firstEmailCampaignId = effectiveWorkflowState.firstEmailGenerated?.campaignId;
      const firstEmailBelongsToThisCampaign = campaignId &&
                                                firstEmailCampaignId &&
                                                String(firstEmailCampaignId) === String(campaignId);

      console.log(`\n🔍 [FIRST EMAIL FILTER - STORED] Checking if first email belongs to this campaign:`);
      console.log(`   📧 firstEmailGenerated exists: ${!!effectiveWorkflowState.firstEmailGenerated}`);
      console.log(`   🆔 firstEmailGenerated.campaignId: ${firstEmailCampaignId || 'NOT SET'}`);
      console.log(`   🆔 Requested campaignId: ${campaignId || 'NOT SET'}`);
      console.log(`   ✅ Match: ${firstEmailBelongsToThisCampaign ? 'YES' : 'NO'}`);

      const responseData = {
        prospects: enrichedProspects,
        campaignData: processedResults.emailCampaign ? {
          ...processedResults.campaignData,
          emailCampaign: processedResults.emailCampaign
        } : (processedResults.campaignData || {}),
        // Include workflow state fields that the frontend needs
        workflowState: effectiveWorkflowState.currentStep,
        lastUpdate: effectiveWorkflowState.lastUpdate,
        totalProspects: processedResults.prospects?.length || 0,
        isRealData: true,
        demoMode: false,
        // 🔥 CRITICAL FIX: Only show first email popup if it belongs to THIS campaign
        waitingForUserApproval: firstEmailBelongsToThisCampaign ? effectiveWorkflowState.waitingForUserApproval : false,
        firstEmailGenerated: firstEmailBelongsToThisCampaign ? effectiveWorkflowState.firstEmailGenerated : null,
        currentEmailIndex: 0,
        templateSelectionRequired: false,  // We already have emails
        status: 'emails_generated',
        canProceed: true
      };

      return res.json({
        success: true,
        data: responseData,
        source: 'stored'
      });
    }
    
    let prospects = [];
    let campaignData = {};
    let hasRealResults = false;

    // 🔥 FIX: Check WebSocket manager for real prospect data, but ONLY for this campaign
    const wsManager = req.app.locals.wsManager;

    if (wsManager && wsManager.workflowStates.size > 0) {
      console.log(`🔄 Checking WebSocket workflow states for campaign: ${campaignId || 'LATEST'}...`);

      // Look for prospect data in workflow states that match this campaign
      for (const [workflowId, state] of wsManager.workflowStates) {
        // 🔥 CRITICAL: Only process this state if it belongs to this campaign or if no campaign filter
        // The workflowId IS the campaignId (set in LangGraphMarketingAgent.js line 863)
        // Also check state.id, state.data?.campaignId, or state.campaignId for backwards compatibility
        const stateCampaignId = workflowId || state.id || state.data?.campaignId || state.campaignId;

        if (campaignId && stateCampaignId && String(stateCampaignId) !== String(campaignId)) {
          console.log(`⏭️  Skipping workflow ${workflowId} (campaign: ${stateCampaignId}, looking for: ${campaignId})`);
          continue; // Skip states from other campaigns
        }

        console.log(`📊 Checking workflow ${workflowId} for campaign ${stateCampaignId || 'LATEST'}`);

        // Check for prospects in direct data object
        if (state.data && state.data.prospects && state.data.prospects.length > 0) {
          if (prospects.length === 0) {
            console.log(`✅ Found ${state.data.prospects.length} prospects in workflow ${workflowId} for campaign ${stateCampaignId || 'LATEST'}`);
          }
          prospects = state.data.prospects;
          hasRealResults = true;
        }
        // Also check for prospects in the prospect_search step result
        else if (state.steps && state.steps.prospect_search && state.steps.prospect_search.result && state.steps.prospect_search.result.prospects) {
          if (prospects.length === 0) {
            console.log(`✅ Found ${state.steps.prospect_search.result.prospects.length} prospects in workflow ${workflowId} (step result) for campaign ${stateCampaignId || 'LATEST'}`);
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

      if (!hasRealResults && campaignId) {
        console.log(`⚠️  No WebSocket data found for campaign: ${campaignId}`);
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
    // 🎯 FIX: Also check if template has already been submitted to prevent popup re-triggering (per campaign)
    let templateSelectionRequired = false;
    let templateSelectionStatus = null;
    const templateKey = `${userId}_${campaignId || 'default'}`;
    let templateSubmitted = userCampaignTemplateSubmitted.get(templateKey) || false;

    // 🔥 RAILWAY FIX: Also check Redis for persisted template submission status
    // 🔥 FIX: Check multiple possible keys since campaignId might be null/undefined/LATEST
    if (!templateSubmitted) {
      try {
        const redisCache = require('../utils/RedisUserCache');

        // List of possible keys to check (in order of priority)
        const possibleKeys = [
          `templateSubmitted_${campaignId}`,  // Exact match
          `templateSubmitted_default`,        // Default fallback
          `templateSubmitted_null`,           // Null campaign
          `templateSubmitted_undefined`,      // Undefined campaign
          `templateSubmitted_LATEST`,         // LATEST campaign
        ];

        // Also check any key that starts with templateSubmitted_ for this user
        for (const key of possibleKeys) {
          const redisSubmission = await redisCache.get(userId, key);
          if (redisSubmission && redisSubmission.submitted) {
            templateSubmitted = true;
            // Restore to in-memory cache
            userCampaignTemplateSubmitted.set(templateKey, true);
            console.log(`🎯 [Template Check] Restored from Redis key "${key}": ${templateKey} = true`);
            break;
          }
        }

        // 🔥 FINAL FALLBACK: Check if ANY template submission exists for this user (scan pattern)
        if (!templateSubmitted) {
          try {
            // Get all keys for this user that start with templateSubmitted_
            const allKeys = await redisCache.getAll(userId);
            if (allKeys && typeof allKeys === 'object') {
              for (const [key, value] of Object.entries(allKeys)) {
                if (key.startsWith('templateSubmitted_') && value && value.submitted) {
                  templateSubmitted = true;
                  userCampaignTemplateSubmitted.set(templateKey, true);
                  console.log(`🎯 [Template Check] Found via scan "${key}": ${templateKey} = true`);
                  break;
                }
              }
            }
          } catch (scanErr) {
            console.log('⚠️ Redis scan failed:', scanErr.message);
          }
        }
      } catch (redisErr) {
        console.log('⚠️ Could not check Redis for template submission:', redisErr.message);
      }
    }

    console.log(`🎯 [Template Check] Key: ${templateKey}, Submitted: ${templateSubmitted}`);

    if (prospects.length > 0 &&
        (!campaignData.emailCampaign ||
         !campaignData.emailCampaign.emails ||
         campaignData.emailCampaign.emails.length === 0) &&
        !templateSubmitted) {  // 🎯 FIX: Only show popup if template hasn't been submitted yet for THIS campaign
      // We have prospects but no emails = template selection required
      templateSelectionRequired = true;
      templateSelectionStatus = 'waiting_for_template';
      console.log(`🎨 [User: ${userId}] HTTP POLLING: Template selection required - have prospects but no emails yet`);
      console.log('   Prospects:', prospects.length);
      console.log('   Email campaign:', campaignData.emailCampaign ? 'exists' : 'null');
      console.log('   Emails:', campaignData.emailCampaign?.emails?.length || 0);
    } else if (templateSubmitted && (!campaignData.emailCampaign?.emails || campaignData.emailCampaign.emails.length === 0)) {
      // Template has been submitted but emails aren't generated yet
      console.log(`🎨 [User: ${userId}] Template already submitted for campaign ${campaignId} - waiting for email generation to complete...`);
      templateSelectionStatus = 'generating_emails';
    }

    // 💾 If no in-memory results, fetch from database
    if (!hasRealResults || prospects.length === 0) {
      try {
        console.log(`💾 [User: ${userId}] No in-memory results, fetching from database...`);

        // 🔥 FIX: Handle "LATEST" campaign - convert to null to get all campaigns
        let dbCampaignFilter = campaignId;
        if (campaignId === 'LATEST' || campaignId === 'latest' || campaignId === 'current') {
          console.log(`🔄 Converting "${campaignId}" to null - will fetch all campaigns and sort by date`);
          dbCampaignFilter = null;
        }

        // Fetch prospects from database with campaign filter
        const dbFilter = dbCampaignFilter ? { status: 'active', campaignId: dbCampaignFilter } : { status: 'active' };
        const dbProspects = await db.getContacts(userId, dbFilter, 1000);
        if (dbProspects && dbProspects.length > 0) {
          prospects = dbProspects.map(c => ({
            id: c.id || `contact_${c.email}`,
            email: c.email,
            name: c.name || 'Unknown',
            company: c.company || 'Unknown',
            position: c.position || 'Unknown',
            industry: c.industry || 'Unknown',
            source: c.source || 'Database'
          }));
          hasRealResults = true;
          console.log(`💾 [User: ${userId}] Loaded ${prospects.length} prospects from database (Campaign: ${campaignId || 'ALL'})`);
        }

        // Fetch email drafts from database with campaign filter
        const dbDrafts = await db.getEmailDrafts(userId, campaignId);
        if (dbDrafts && dbDrafts.length > 0) {
          const emails = dbDrafts.map(draft => ({
            id: draft.id,
            to: draft.metadata.recipient || '',
            subject: draft.subject,
            body: draft.html,
            recipientName: draft.metadata.recipientName || '',
            recipientCompany: draft.metadata.recipientCompany || '',
            senderName: draft.metadata.senderName || '',
            companyName: draft.metadata.companyName || '',
            template: draft.metadata.template || 'default',
            createdAt: draft.metadata.createdAt || draft.createdAt,
            status: draft.metadata.status || 'generated'
          }));

          campaignData.emailCampaign = {
            emails: emails,
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0
          };

          hasRealResults = true;
          console.log(`💾 [User: ${userId}] Loaded ${emails.length} email drafts from database`);
        }
      } catch (dbError) {
        console.error(`❌ [User: ${userId}] Error fetching from database:`, dbError);
      }
    }

    // 🔥 DATABASE FALLBACK: If in-memory doesn't have waitingForUserApproval, check database
    let effectiveWorkflowState2 = workflowState;
    if (!workflowState.waitingForUserApproval && campaignId) {
      try {
        const dbSession = await db.getWorkflowSession(userId, campaignId);
        if (dbSession && dbSession.workflowState) {
          console.log(`💾 [DB FALLBACK-2] Found workflow state in database for campaign ${campaignId}`);

          if (dbSession.workflowState.waitingForUserApproval || dbSession.workflowState.firstEmailGenerated) {
            effectiveWorkflowState2 = {
              ...workflowState,
              waitingForUserApproval: dbSession.workflowState.waitingForUserApproval || workflowState.waitingForUserApproval,
              firstEmailGenerated: dbSession.workflowState.firstEmailGenerated || workflowState.firstEmailGenerated
            };
            Object.assign(workflowState, effectiveWorkflowState2);
          }
        }
      } catch (dbErr) {
        console.error(`⚠️ [DB FALLBACK-2] Failed to read workflow state from DB:`, dbErr.message);
      }
    }

    // 🔥 CRITICAL FIX: Only include firstEmailGenerated if it belongs to THIS campaign
    // 🔒 STRICT: Both campaignId must exist AND match - never show if either is null
    const firstEmail2CampaignId = effectiveWorkflowState2.firstEmailGenerated?.campaignId;
    const firstEmailBelongsToThisCampaign = campaignId &&
                                              firstEmail2CampaignId &&
                                              String(firstEmail2CampaignId) === String(campaignId);

    console.log(`\n🔍 [FIRST EMAIL FILTER] Checking if first email belongs to this campaign:`);
    console.log(`   📧 firstEmailGenerated exists: ${!!effectiveWorkflowState2.firstEmailGenerated}`);
    console.log(`   🆔 firstEmailGenerated.campaignId: ${firstEmail2CampaignId || 'NOT SET'}`);
    console.log(`   🆔 Requested campaignId: ${campaignId || 'NOT SET'}`);
    console.log(`   ✅ Match: ${firstEmailBelongsToThisCampaign ? 'YES' : 'NO'}`);

    res.json({
      success: true,
      data: {
        prospects,
        campaignData,
        workflowState: effectiveWorkflowState2.currentStep,
        lastUpdate: effectiveWorkflowState2.lastUpdate,
        totalProspects: prospects.length,
        isRealData: hasRealResults,
        demoMode: !hasRealResults,
        // 🔥 CRITICAL FIX: Only show first email popup if it belongs to THIS campaign
        waitingForUserApproval: firstEmailBelongsToThisCampaign ? effectiveWorkflowState2.waitingForUserApproval : false,
        firstEmailGenerated: firstEmailBelongsToThisCampaign ? effectiveWorkflowState2.firstEmailGenerated : null,
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
      // 🔥 FIX: Include campaignId to prevent cross-campaign mixing
      const currentCampaignId = workflowState.campaignId || campaignId || `campaign_${Date.now()}`;
      workflowState.firstEmailGenerated = {
        id: 'sample-email-001',
        campaignId: currentCampaignId, // 🔒 CRITICAL: Always include campaignId
        campaign_id: currentCampaignId, // Also snake_case version
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
async function executeRealWorkflow(agent, campaignConfig, userId = 'anonymous') {
  try {
    console.log('🚀 ======================== REAL WORKFLOW EXECUTION START ========================');
    console.log('🚀 [RAILWAY DEBUG] Starting REAL LangGraphMarketingAgent workflow execution');
    console.log(`👤 [RAILWAY DEBUG] User ID: ${userId}`);
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

    // 🔥 PRODUCTION: Store results with userId AND campaignId
    // 🔥 CRITICAL FIX: Use campaignId from campaignConfig to ensure correct campaign association
    const campaignId = campaignConfig.campaignId || results.campaignId || `workflow_${Date.now()}`;
    console.log(`📦 [PRODUCTION] Storing results for user: ${userId}, campaign: ${campaignId}`);
    console.log(`🔍 [PRODUCTION] CampaignId source: ${campaignConfig.campaignId ? 'campaignConfig' : results.campaignId ? 'results' : 'generated'}`);

    // Add campaignId to results
    results.campaignId = campaignId;

    await setLastWorkflowResults(results, userId, campaignId);

    // CRITICAL FIX: Store results in WebSocket manager's workflow states WITH campaignId
    if (agent.wsManager && results.prospects && results.prospects.length > 0) {
      console.log(`📡 Storing ${results.prospects.length} prospects in WebSocket workflow states for campaign ${campaignId}`);

      // Update the current workflow state with prospect data
      agent.wsManager.broadcastWorkflowUpdate(campaignId, {
        type: 'data_update',
        data: {
          campaignId: campaignId, // 🔥 CRITICAL: Include campaignId in data
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

// 🚀 PRODUCTION: Function to set workflow results per user AND per campaign
async function setLastWorkflowResults(results, userId = 'anonymous', campaignId = null) {
  // Extract campaignId from results if not provided
  const finalCampaignId = campaignId || results.campaignId || 'default';

  console.log(`📦 [PRODUCTION] Storing results for User: ${userId}, Campaign: ${finalCampaignId}`);

  // Ensure user map exists
  if (!userCampaignWorkflowResults.has(userId)) {
    userCampaignWorkflowResults.set(userId, new Map());
  }

  const userCampaigns = userCampaignWorkflowResults.get(userId);
  const lastWorkflowResults = userCampaigns.get(finalCampaignId);

  // 🔒 CRITICAL: Ensure EVERY prospect has campaignId before storing
  const prospectsWithCampaignId = (results.prospects || []).map(p => ({
    ...p,
    campaignId: p.campaignId || p.campaign_id || finalCampaignId,
    campaign_id: p.campaign_id || p.campaignId || finalCampaignId
  }));

  // 🔥 FIX: Don't overwrite if we already have emails and the new results don't
  if (lastWorkflowResults &&
      lastWorkflowResults.emailCampaign &&
      lastWorkflowResults.emailCampaign.emails &&
      lastWorkflowResults.emailCampaign.emails.length > 0 &&
      (!results.emailCampaign || !results.emailCampaign.emails || results.emailCampaign.emails.length === 0)) {
    console.log(`⚠️ [User: ${userId}, Campaign: ${finalCampaignId}] Preserving existing ${lastWorkflowResults.emailCampaign.emails.length} emails`);
    // Merge: keep existing emails but update other fields
    userCampaigns.set(finalCampaignId, {
      ...results,
      prospects: prospectsWithCampaignId,  // 🔒 Use prospects with campaignId
      campaignId: finalCampaignId,
      emailCampaign: lastWorkflowResults.emailCampaign  // Keep existing emails
    });
  } else {
    userCampaigns.set(finalCampaignId, {
      ...results,
      prospects: prospectsWithCampaignId,  // 🔒 Use prospects with campaignId
      campaignId: finalCampaignId
    });
  }

  const updatedResults = userCampaigns.get(finalCampaignId);
  console.log(`✅ [User: ${userId}, Campaign: ${finalCampaignId}] Stored ${results.prospects?.length || 0} prospects, ${updatedResults.emailCampaign?.emails?.length || 0} emails`);

  // 💾 Save prospects to database for persistence
  if (results.prospects && results.prospects.length > 0) {
    try {
      console.log(`💾 [User: ${userId}] Saving ${results.prospects.length} prospects to database...`);

      for (const prospect of results.prospects) {
        try {
          await db.saveContact({
            email: prospect.email,
            name: prospect.name || 'Unknown',
            company: prospect.company || 'Unknown',
            position: prospect.position || 'Unknown',
            industry: prospect.industry || 'Unknown',
            phone: prospect.phone || '',
            address: prospect.address || '',
            source: prospect.source || 'AI Workflow',
            tags: prospect.tags || '',
            notes: prospect.notes || `Found via AI workflow on ${new Date().toLocaleString()}`
          }, userId, finalCampaignId);  // 🔥 PRODUCTION: Associate with campaign
        } catch (saveError) {
          // Skip if already exists (UNIQUE constraint)
          if (!saveError.message.includes('UNIQUE constraint')) {
            console.error(`⚠️ Failed to save prospect ${prospect.email}:`, saveError.message);
          }
        }
      }

      console.log(`✅ [User: ${userId}] Prospects saved to database successfully`);
    } catch (error) {
      console.error(`❌ [User: ${userId}] Error saving prospects to database:`, error);
    }
  }

  // 💾 Save generated emails to database for persistence
  if (results.emailCampaign && results.emailCampaign.emails && results.emailCampaign.emails.length > 0) {
    try {
      console.log(`💾 [User: ${userId}] Saving ${results.emailCampaign.emails.length} email drafts to database...`);

      for (const email of results.emailCampaign.emails) {
        try {
          // Generate a unique email key for this draft
          const emailKey = `email_${email.to}_${Date.now()}`;

          await db.saveEmailDraft({
            emailKey: emailKey,
            subject: email.subject || 'No Subject',
            preheader: email.preheader || '',
            components: email.components || [],
            html: email.body || email.html || '',
            metadata: {
              recipient: email.to,
              recipientName: email.recipientName || '',
              recipientCompany: email.recipientCompany || '',
              senderName: email.senderName || '',
              companyName: email.companyName || '',
              template: email.template || 'default',
              createdAt: email.createdAt || new Date().toISOString(),
              status: email.status || 'generated'
            }
          }, userId, finalCampaignId);  // 🔥 PRODUCTION: Associate with campaign
        } catch (saveError) {
          // Skip if already exists (UNIQUE constraint)
          if (!saveError.message.includes('UNIQUE constraint')) {
            console.error(`⚠️ Failed to save email draft for ${email.to}:`, saveError.message);
          }
        }
      }

      console.log(`✅ [User: ${userId}] Email drafts saved to database successfully`);
    } catch (error) {
      console.error(`❌ [User: ${userId}] Error saving email drafts to database:`, error);
    }
  }
}

// 🚀 PRODUCTION: Function to get workflow results per user AND per campaign
// Includes database fallback for Railway/production restarts
async function getLastWorkflowResults(userId = 'anonymous', campaignId = null) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📂 [GET RESULTS] Retrieving workflow results`);
  console.log(`   👤 User: ${userId}`);
  console.log(`   🎯 Campaign ID: ${campaignId || 'LATEST (most recent)'}`);

  const userCampaigns = userCampaignWorkflowResults.get(userId);

  // Try in-memory first
  if (userCampaigns) {
    console.log(`   💾 In-memory campaigns found: ${userCampaigns.size}`);
    console.log(`   📋 Campaign IDs in memory: [${Array.from(userCampaigns.keys()).join(', ')}]`);

    // If campaignId specified, return that campaign's results
    if (campaignId) {
      const result = userCampaigns.get(campaignId) || userCampaigns.get(String(campaignId));
      if (result) {
        console.log(`   ✅ [MEMORY HIT] Found results for Campaign: ${campaignId}`);
        console.log(`   📊 Prospects: ${result.prospects?.length || 0}, Emails: ${result.emailCampaign?.emails?.length || 0}`);
        console.log(`${'─'.repeat(80)}\n`);
        return result;
      } else {
        console.log(`   ⚠️  [MEMORY MISS] Campaign ${campaignId} not found in memory`);
        // 🔒 CRITICAL: Don't fall through to "most recent" - go to database fallback instead
        console.log(`${'─'.repeat(80)}\n`);
        // Continue to database fallback below, don't return wrong campaign data
      }
    } else if (!campaignId) {
      // Otherwise return most recent campaign
      const campaigns = Array.from(userCampaigns.values());
      if (campaigns.length > 0) {
        const mostRecent = campaigns[campaigns.length - 1];
        console.log(`   ✅ [MEMORY HIT] Returning most recent of ${campaigns.length} campaigns`);
        console.log(`   🆔 Most recent Campaign ID: ${mostRecent.campaignId}`);
        console.log(`   📊 Prospects: ${mostRecent.prospects?.length || 0}, Emails: ${mostRecent.emailCampaign?.emails?.length || 0}`);
        console.log(`${'─'.repeat(80)}\n`);
        return mostRecent;
      }
    }
  } else {
    console.log(`   ⚠️  No in-memory campaigns found for user: ${userId}`);
  }

  console.log(`${'─'.repeat(80)}\n`);

  // 🔥 RAILWAY FIX: If not in memory, reconstruct from database
  console.log(`💾 [DATABASE FALLBACK] Reconstructing from DB - User: ${userId}, Campaign: ${campaignId || 'LATEST'}`);

  try {
    // 🔥 FIX: Handle "LATEST", "latest", "current" as special values - don't pass to database filter
    const isLatestRequest = !campaignId ||
                            campaignId === 'LATEST' ||
                            campaignId === 'latest' ||
                            campaignId === 'current' ||
                            campaignId === 'null' ||
                            campaignId === 'undefined';

    // If requesting "LATEST", first get the most recent campaign ID from the database
    let effectiveDbCampaignId = null;
    if (isLatestRequest) {
      // Query for the most recent campaign ID
      const recentCampaignQuery = await new Promise((resolve, reject) => {
        db.db.get(
          `SELECT DISTINCT campaign_id FROM contacts WHERE user_id = ? AND campaign_id IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (recentCampaignQuery && recentCampaignQuery.campaign_id) {
        effectiveDbCampaignId = recentCampaignQuery.campaign_id;
        console.log(`🎯 [DB FALLBACK] Resolved LATEST to actual campaign: ${effectiveDbCampaignId}`);
      } else {
        console.log(`⚠️  [DB FALLBACK] No campaigns found in database for user ${userId}`);
      }
    } else {
      effectiveDbCampaignId = campaignId;
    }

    // Get prospects from database with actual campaign ID (not "LATEST")
    const dbFilter = effectiveDbCampaignId ? { campaignId: effectiveDbCampaignId } : {};
    const prospects = await db.getContacts(userId, dbFilter, 10000);

    // Get emails from database with actual campaign ID
    const emails = await db.getEmailDrafts(userId, effectiveDbCampaignId);

    if (prospects.length > 0 || emails.length > 0) {
      // Reconstruct workflow results from database
      // 🔥 FIX: Use the actual resolved campaignId, not the "LATEST" request value
      const effectiveCampaignId = effectiveDbCampaignId || prospects[0]?.campaign_id || prospects[0]?.campaignId || 'reconstructed';
      const reconstructed = {
        campaignId: effectiveCampaignId,
        prospects: prospects.map(p => ({
          email: p.email,
          name: p.name,
          company: p.company,
          position: p.position,
          industry: p.industry,
          source: p.source,
          // 🔒 CRITICAL: Include campaignId on EVERY prospect for frontend filtering
          campaignId: p.campaign_id || p.campaignId || effectiveCampaignId,
          campaign_id: p.campaign_id || p.campaignId || effectiveCampaignId
        })),
        emailCampaign: {
          emails: emails.map(e => {
            // 🔒 CRITICAL: Only use email's campaignId if it exists, otherwise use the ACTUAL resolved campaignId
            const emailCampaignId = e.campaignId || effectiveDbCampaignId || effectiveCampaignId;

            return {
              to: e.metadata?.recipient || '',
              subject: e.subject,
              body: e.html,
              html: e.html,
              recipientName: e.metadata?.recipientName,
              recipientCompany: e.metadata?.recipientCompany,
              status: e.status || 'generated',
              campaignId: emailCampaignId // 🔒 Always has a valid campaignId (never "LATEST")
            };
          }).filter(e => {
            // 🔒 CRITICAL: Only include emails that match the ACTUAL resolved campaignId (not "LATEST")
            if (effectiveDbCampaignId && e.campaignId !== effectiveDbCampaignId && e.campaignId !== String(effectiveDbCampaignId)) {
              console.log(`   🗑️  [DB RECONSTRUCTION] Filtering out email from campaign ${e.campaignId} (resolved: ${effectiveDbCampaignId})`);
              return false;
            }
            return true;
          })
        },
        status: 'reconstructed_from_db',
        timestamp: new Date().toISOString()
      };

      // Store in memory for future access
      if (!userCampaignWorkflowResults.has(userId)) {
        userCampaignWorkflowResults.set(userId, new Map());
      }
      userCampaignWorkflowResults.get(userId).set(reconstructed.campaignId, reconstructed);

      console.log(`✅ [DATABASE] Reconstructed: ${prospects.length} prospects, ${emails.length} emails`);
      return reconstructed;
    }
  } catch (error) {
    console.error(`❌ [DATABASE FALLBACK] Failed to reconstruct:`, error.message);
  }

  return null;
}

// Function to add a new email to the workflow results (user-specific, campaign-specific)
async function addEmailToWorkflowResults(email, userId = 'anonymous', campaignId = null) {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`📧 [ADD EMAIL] Adding email to workflow results`);
  console.log(`   👤 User: ${userId}`);
  console.log(`   🆔 Campaign ID: ${campaignId || 'NOT PROVIDED'}`);
  console.log(`   📬 Email to: ${email.to}`);
  console.log(`   📋 Email subject: ${email.subject?.substring(0, 50)}...`);
  console.log(`${'━'.repeat(80)}`);

  let lastWorkflowResults = await getLastWorkflowResults(userId, campaignId);

  if (!lastWorkflowResults) {
    console.log(`⚠️  No existing workflow results found, creating new structure`);
    lastWorkflowResults = { emailCampaign: { emails: [] } };
  }
  if (!lastWorkflowResults.emailCampaign) {
    lastWorkflowResults.emailCampaign = { emails: [] };
  }
  if (!lastWorkflowResults.emailCampaign.emails) {
    lastWorkflowResults.emailCampaign.emails = [];
  }

  // 🔒 CRITICAL: Ensure email has BOTH campaignId and campaign_id BEFORE adding to array
  if (campaignId) {
    if (!email.campaignId) {
      email.campaignId = campaignId;
      console.log(`   ✅ Added missing campaignId (camelCase) to email: ${campaignId}`);
    }
    if (!email.campaign_id) {
      email.campaign_id = campaignId;
      console.log(`   ✅ Added missing campaign_id (snake_case) to email: ${campaignId}`);
    }
  }

  // Verify email has campaignId
  const hasCampaignId = email.campaignId || email.campaign_id;
  console.log(`   🔍 Email campaignId check: ${hasCampaignId || 'MISSING!'}`);
  if (!hasCampaignId) {
    console.warn(`   ⚠️  WARNING: Email being stored WITHOUT campaignId! This will cause isolation issues.`);
  }

  // Add the new email to the campaign
  lastWorkflowResults.emailCampaign.emails.push(email);

  // Store back with campaign ID
  const finalCampaignId = campaignId || lastWorkflowResults.campaignId || 'default';
  console.log(`📦 [STORAGE] Storing email with final Campaign ID: ${finalCampaignId}`);

  if (!userCampaignWorkflowResults.has(userId)) {
    userCampaignWorkflowResults.set(userId, new Map());
    console.log(`   ✨ Created new campaign map for user: ${userId}`);
  }

  // Ensure campaignId is stored in the results object
  lastWorkflowResults.campaignId = finalCampaignId;

  userCampaignWorkflowResults.get(userId).set(finalCampaignId, lastWorkflowResults);

  console.log(`✅ [EMAIL ADDED] Campaign: ${finalCampaignId} | Total emails: ${lastWorkflowResults.emailCampaign.emails.length}`);
  console.log(`📊 [STORAGE STATUS] User has ${userCampaignWorkflowResults.get(userId).size} campaign(s) in memory`);
  console.log(`${'━'.repeat(80)}\n`);
}

// Get generated email for professional editor
router.get('/generated-email', optionalAuth, async (req, res) => {
  try {
    const { campaignId, prospectId } = req.query;
    const userId = req.userId;
    console.log(`📧 [User: ${userId}] Looking for generated email - Campaign: ${campaignId}, Prospect: ${prospectId}`);

    // 🔥 FIX: Get campaign-specific workflow results
    const lastWorkflowResults = await getLastWorkflowResults(userId, campaignId);

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
          error: sendResult.error || 'Unknown error occurred',
          sendingFailed: true
        });
      }
    } catch (sendError) {
      console.error('❌ [WORKFLOW] Email sending error:', sendError);

      res.json({
        success: false,
        message: 'Email sending encountered an error',
        error: sendError.message || sendError.toString() || 'Unknown error occurred',
        sendingFailed: true
      });
    }

  } catch (error) {
    console.error('❌ [WORKFLOW] /send-email endpoint failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || error.toString() || 'Internal server error'
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
          error: sendResult.error || 'Unknown error occurred',
          sendingFailed: true
        });
      }
    } catch (sendError) {
      console.error('❌ [WORKFLOW] Email sending error:', sendError);

      res.json({
        success: false,
        message: 'Email sending encountered an error',
        error: sendError.message || sendError.toString() || 'Unknown error occurred',
        sendingFailed: true
      });
    }

  } catch (error) {
    console.error('❌ [WORKFLOW] Failed to approve email:', error);
    res.status(500).json({
      success: false,
      error: error.message || error.toString() || 'Internal server error'
    });
  }
});

// Handle user decision from popup
router.post('/user-decision', optionalAuth, async (req, res) => {
  try {
    const { decision, campaignId, userTemplate, smtpConfig } = req.body;
    const userId = req.userId || 'anonymous';

    console.log(`\n${'='.repeat(80)}`);
    console.log(`👤 [MULTI-PROCESS] User decision received`);
    console.log(`   User: ${userId}`);
    console.log(`   Campaign: ${campaignId}`);
    console.log(`   Decision: ${decision}`);
    console.log(`   Template provided: ${!!userTemplate}`);
    console.log(`   SMTP config provided: ${!!smtpConfig}`);
    console.log(`${'='.repeat(80)}`);

    // 🔥 MULTI-PROCESS: Get the user's dedicated agent instance
    let agent = getUserCampaignAgent(userId, campaignId);

    // If no dedicated agent exists, try to create one or use fallback
    if (!agent) {
      console.log(`⚠️ [MULTI-PROCESS] No dedicated agent found for ${userId}_${campaignId}, creating new one...`);
      agent = getOrCreateUserCampaignAgent(userId, campaignId, req.app.locals.wsManager);
    }

    if (!agent) {
      return res.status(500).json({
        success: false,
        error: 'Could not get or create agent for this user/campaign'
      });
    }

    // 🔥 MULTI-PROCESS: Check BOTH agent state AND stored paused data
    const pausedData = getPausedCampaignData(userId, campaignId);
    const agentPausedData = agent.state?.pausedCampaignData;

    // Also check the workflow state for waitingForUserApproval
    const workflowState = getUserWorkflowState(userId);

    console.log(`📊 [MULTI-PROCESS] Checking data sources:`);
    console.log(`   Agent paused: ${agent.state?.workflowPaused || false}`);
    console.log(`   Agent prospects: ${agentPausedData?.prospects?.length || 0}`);
    console.log(`   Stored paused data: ${!!pausedData}`);
    console.log(`   Stored prospects: ${pausedData?.prospects?.length || 0}`);
    console.log(`   Workflow state waitingForUserApproval: ${workflowState.waitingForUserApproval}`);

    // Clear the waiting state
    if (workflowState.waitingForUserApproval) {
      workflowState.waitingForUserApproval = false;
      console.log(`   ✅ Cleared waitingForUserApproval for user ${userId}`);
    }

    // 🔥 MULTI-PROCESS: Prefer agent's live state, fallback to stored data
    const effectivePausedData = agentPausedData || pausedData;

    // 🎯 CRITICAL: Use the correct data source
    if (decision === 'continue' && effectivePausedData && effectivePausedData.prospects && effectivePausedData.prospects.length > 0) {
      console.log('✅ [MULTI-PROCESS] User approved, continuing email generation for remaining prospects...');

      const actualCampaignId = effectivePausedData.campaignId || campaignId;

      console.log('📊 Campaign data:', {
        campaignId: actualCampaignId,
        prospectsCount: effectivePausedData.prospects.length,
        currentIndex: effectivePausedData.currentIndex || 1,
        dataSource: agentPausedData ? 'agent_state' : 'stored_data'
      });

      // Get starting index (skip first email which was already generated)
      const startIndex = effectivePausedData.currentIndex || 1;
      const remainingProspects = effectivePausedData.prospects.length - startIndex;

      // 🔥 MULTI-PROCESS: Resume the agent's workflow if it was paused
      if (agent.state?.workflowPaused && agent.state?.userDecisionPromise) {
        console.log(`🔄 [MULTI-PROCESS] Resuming paused agent workflow...`);
        agent.resumeWorkflow(decision, userTemplate, smtpConfig);
      }

      if (remainingProspects > 0) {
        console.log(`🔄 Will generate emails for ${remainingProspects} remaining prospects (starting from index ${startIndex})`);

        // Start email generation in background - runs concurrently for each user/campaign
        setTimeout(async () => {
          try {
            console.log(`🔄 [BACKGROUND ${userId}_${campaignId}] Starting email generation...`);

            const templateToUse = {
              subject: userTemplate?.subject || effectivePausedData.userTemplate?.subject || 'Professional Email',
              html: userTemplate?.html || effectivePausedData.userTemplate?.html || '',
              body: userTemplate?.html || effectivePausedData.userTemplate?.html || '',
              components: userTemplate?.components || effectivePausedData.userTemplate?.components || []
            };

            // Set agent userId for proper storage
            agent.userId = userId;

            await agent.continueGeneratingEmails(
              actualCampaignId,
              effectivePausedData.prospects,
              startIndex,  // Start from stored index (usually 1)
              templateToUse,
              smtpConfig || effectivePausedData.smtpConfig,
              effectivePausedData.targetAudience || effectivePausedData.marketingStrategy,
              'user_template'
            );

            console.log(`✅ [BACKGROUND ${userId}_${campaignId}] Email generation completed`);

            // Clear paused data after successful completion
            clearPausedCampaignData(userId, actualCampaignId);

          } catch (error) {
            console.error('❌ [BACKGROUND] Error generating remaining emails:', error);
          }
        }, 100);
      } else {
        console.log('ℹ️ No remaining prospects to generate emails for');
      }
    } else if (decision === 'continue') {
      // No paused data found - try to get prospects from workflow results
      console.log('⚠️ No paused campaign data found, trying to get prospects from workflow results...');

      const workflowResults = await getLastWorkflowResults(userId, campaignId);
      if (workflowResults && workflowResults.prospects && workflowResults.prospects.length > 0) {
        const existingEmailCount = workflowResults.emailCampaign?.emails?.length || 0;
        const prospectsWithoutEmails = workflowResults.prospects.length - existingEmailCount;

        console.log(`📊 Found ${workflowResults.prospects.length} prospects, ${existingEmailCount} emails already generated`);

        if (prospectsWithoutEmails > 0) {
          console.log(`🔄 Will generate emails for ${prospectsWithoutEmails} remaining prospects`);

          setTimeout(async () => {
            try {
              agent.userId = userId;

              const templateToUse = {
                subject: userTemplate?.subject || 'Professional Email',
                html: userTemplate?.html || '',
                body: userTemplate?.html || '',
                components: userTemplate?.components || []
              };

              await agent.continueGeneratingEmails(
                campaignId,
                workflowResults.prospects,
                existingEmailCount,  // Start from where we left off
                templateToUse,
                smtpConfig,
                workflowResults.marketingStrategy,
                'user_template'
              );

              console.log('✅ Email generation completed for remaining prospects (from workflow results)');
            } catch (error) {
              console.error('❌ Error generating remaining emails:', error);
            }
          }, 100);
        }
      }
    }

    res.json({
      success: true,
      message: `User decision processed: ${decision}`,
      decision,
      campaignId,
      userId
    });

  } catch (error) {
    console.error('❌ Error processing user decision:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// REMOVED: Duplicate /approve-email route (was using old global workflowState)
// The correct user-aware /approve-email route is defined at line 1715

// 🎯 FIX: Add setter function for template submission flag (per user AND campaign)
function setTemplateSubmitted(value, userId = 'anonymous', campaignId = 'default') {
  const templateKey = `${userId}_${campaignId}`;
  userCampaignTemplateSubmitted.set(templateKey, value);
  console.log(`🎯 [User: ${userId}] Template submitted flag set to: ${value} for campaign: ${campaignId}`);
}

// 🎯 CRITICAL: Update user workflow state (for first email popup)
// 🔥 FIX: Also persist to database so state survives frontend refresh
function setUserWorkflowState(userId, updates) {
  const userWorkflowState = getUserWorkflowState(userId);
  Object.assign(userWorkflowState, updates);
  console.log(`🎯 [User: ${userId}] Workflow state updated:`, Object.keys(updates));

  // 🔥 PERSIST: Save waitingForUserApproval and firstEmailGenerated to database
  if (updates.campaignId && (updates.waitingForUserApproval !== undefined || updates.firstEmailGenerated)) {
    const campaignId = updates.campaignId;
    const workflowStateJson = JSON.stringify({
      waitingForUserApproval: updates.waitingForUserApproval ?? userWorkflowState.waitingForUserApproval,
      firstEmailGenerated: updates.firstEmailGenerated ?? userWorkflowState.firstEmailGenerated,
      currentStep: userWorkflowState.currentStep
    });

    // Update workflow_sessions table with the state
    db.updateWorkflowSessionState(userId, campaignId, workflowStateJson).catch(err => {
      console.error(`⚠️ [User: ${userId}] Failed to persist workflow state to DB:`, err.message);
    });
    console.log(`💾 [User: ${userId}] Workflow state persisted to database for campaign ${campaignId}`);
  }
}

// 🔥 MULTI-USER FIX: Store paused campaign data for workflow continuation
function setPausedCampaignData(userId, campaignId, data) {
  const key = `${userId}_${campaignId}`;
  userPausedCampaignData.set(key, {
    ...data,
    timestamp: new Date().toISOString()
  });
  console.log(`💾 [User: ${userId}] Paused campaign data stored for campaign: ${campaignId}`);
  console.log(`   Prospects: ${data.prospects?.length || 0}, Template: ${!!data.userTemplate}`);
}

// 🔥 MULTI-USER FIX: Get paused campaign data for workflow continuation
function getPausedCampaignData(userId, campaignId) {
  const key = `${userId}_${campaignId}`;
  const data = userPausedCampaignData.get(key);
  if (data) {
    console.log(`📦 [User: ${userId}] Retrieved paused campaign data for campaign: ${campaignId}`);
    console.log(`   Prospects: ${data.prospects?.length || 0}, Stored at: ${data.timestamp}`);
  }
  return data;
}

// 🔥 MULTI-USER FIX: Clear paused campaign data after workflow completion
function clearPausedCampaignData(userId, campaignId) {
  const key = `${userId}_${campaignId}`;
  if (userPausedCampaignData.has(key)) {
    userPausedCampaignData.delete(key);
    console.log(`🗑️ [User: ${userId}] Cleared paused campaign data for campaign: ${campaignId}`);
  }
}

// 📊 Get workflow statistics for quota bar
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || 'anonymous';
    const campaignId = req.query.campaignId || null;  // 🔥 PRODUCTION: Accept campaign filter

    console.log(`📊 ========================================`);
    console.log(`📊 [PRODUCTION] User: ${userId}, Campaign: ${campaignId || 'ALL'}`);

    // Get workflow results for this user and campaign
    const workflowResults = await getLastWorkflowResults(userId, campaignId);
    console.log(`📊 Workflow results: ${!!workflowResults}, prospects: ${workflowResults?.prospects?.length || 0}`);

    // Count prospects from database (filtered by campaign if specified)
    const dbFilter = campaignId ? { campaignId } : {};
    const contacts = await db.getContacts(userId, dbFilter, 10000);
    console.log(`📊 Database contacts: ${contacts.length}`);
    const prospectsCount = contacts.filter(c => c.status === 'active').length;
    console.log(`📊 Active prospects: ${prospectsCount}`);

    // 🔥 FIX: If we have prospects in workflow results but not in DB, count from workflow results
    let finalProspectsCount = prospectsCount;
    if (workflowResults && workflowResults.prospects && workflowResults.prospects.length > 0) {
      // If database has fewer prospects than workflow results, use workflow results count
      if (workflowResults.prospects.length > prospectsCount) {
        finalProspectsCount = workflowResults.prospects.length;
        console.log(`📊 Using workflow results count: ${finalProspectsCount} (DB only has ${prospectsCount})`);
      }
    }

    // Count generated emails from workflow results
    let generatedEmailsCount = 0;
    if (workflowResults && workflowResults.emailCampaign && workflowResults.emailCampaign.emails) {
      generatedEmailsCount = workflowResults.emailCampaign.emails.length;
    }
    console.log(`📊 Generated emails: ${generatedEmailsCount}`);

    // 🔥 FIX: Count sent emails from database WITH campaign filter
    const emailDrafts = await db.getEmailDrafts(userId, campaignId);
    const sentEmailsCount = emailDrafts.filter(e => e.status === 'sent').length;
    console.log(`📊 [Campaign: ${campaignId || 'ALL'}] Sent emails: ${sentEmailsCount}`);

    // Calculate time until reset (1 hour from now)
    const now = Date.now();
    const oneHourInMs = 3600000;
    const resetTime = now + oneHourInMs;
    const timeUntilReset = oneHourInMs;

    // 🎯 Get user's actual limit from database (default: 50/hour)
    let maxProspectsPerHour = 50;
    let maxEmailsPerHour = 100;
    let isUnlimited = false;

    try {
      const userLimit = await db.getUserLimit(userId);
      if (userLimit.isUnlimited) {
        maxProspectsPerHour = 999999;
        maxEmailsPerHour = 999999;
        isUnlimited = true;
        console.log(`📊 User ${userId} has UNLIMITED quota`);
      } else if (userLimit.prospectsPerHour) {
        maxProspectsPerHour = userLimit.prospectsPerHour;
        maxEmailsPerHour = userLimit.prospectsPerHour; // Same limit for both
        console.log(`📊 User ${userId} limit: ${maxProspectsPerHour}/hour`);
      }
    } catch (limitError) {
      console.error('❌ Failed to get user limit, using default:', limitError.message);
    }

    // Rate limit based on GENERATED EMAILS, not prospects
    const isLimited = !isUnlimited && (generatedEmailsCount >= maxEmailsPerHour || finalProspectsCount >= maxProspectsPerHour);

    const stats = {
      rateLimit: {
        current: generatedEmailsCount,  // 🔥 FIX: Count generated emails, NOT prospects
        max: maxEmailsPerHour,
        resetTime: resetTime,
        timeUntilReset: timeUntilReset,
        isLimited: isLimited
      },
      prospects: {
        total: finalProspectsCount,  // 🔥 FIX: Use finalProspectsCount from workflow or DB
        new: 0,  // TODO: Track new prospects added in last hour
        quota: {
          current: finalProspectsCount,
          max: maxProspectsPerHour
        }
      },
      emails: {
        generated: generatedEmailsCount,
        sent: sentEmailsCount,
        quota: {
          current: generatedEmailsCount,
          max: maxEmailsPerHour
        }
      },
      isUnlimited: isUnlimited  // 🆕 Add unlimited flag for frontend
    };

    console.log(`📊 [User: ${userId}] Stats:`, {
      prospects: finalProspectsCount,
      generated: generatedEmailsCount,
      sent: sentEmailsCount
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('📊 Error fetching workflow stats:', error);
    // Return default stats on error
    res.json({
      success: true,
      data: {
        rateLimit: {
          current: 0,
          max: 100,
          resetTime: Date.now() + 3600000,
          timeUntilReset: 3600000,
          isLimited: false
        },
        prospects: {
          total: 0,
          new: 0,
          quota: {
            current: 0,
            max: 100
          }
        },
        emails: {
          generated: 0,
          sent: 0,
          quota: {
            current: 0,
            max: 100
          }
        }
      }
    });
  }
});

module.exports = router;
module.exports.setLastWorkflowResults = setLastWorkflowResults;
module.exports.getLastWorkflowResults = getLastWorkflowResults;
module.exports.addEmailToWorkflowResults = addEmailToWorkflowResults;
module.exports.setTemplateSubmitted = setTemplateSubmitted;
module.exports.setUserWorkflowState = setUserWorkflowState;
// 🔥 MULTI-USER: Export paused campaign data functions for agent to use
module.exports.setPausedCampaignData = setPausedCampaignData;
module.exports.getPausedCampaignData = getPausedCampaignData;
module.exports.clearPausedCampaignData = clearPausedCampaignData;
// 🔥 MULTI-PROCESS: Export agent management functions
module.exports.getOrCreateUserCampaignAgent = getOrCreateUserCampaignAgent;
module.exports.getUserCampaignAgent = getUserCampaignAgent;
module.exports.removeUserCampaignAgent = removeUserCampaignAgent;
module.exports.listActiveAgents = listActiveAgents;