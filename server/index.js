const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
require('dotenv').config();

// Import AI agents
const MarketingResearchAgent = require('./agents/MarketingResearchAgent');
const EmailAutomationAgent = require('./agents/EmailAutomationAgent');
const LangGraphMarketingAgent = require('./agents/LangGraphMarketingAgent');
const OllamaSearxNGEmailDiscovery = require('./agents/OllamaSearxNGEmailDiscovery');

// Import WebSocket manager
const WorkflowWebSocketManager = require('./websocket/WorkflowWebSocketManager');

const app = express();
const PORT = process.env.PORT || 3333;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket manager first
const wsManager = new WorkflowWebSocketManager(server);

// Initialize AI agents
const marketingAgent = new MarketingResearchAgent();
const emailAgent = new EmailAutomationAgent();
const langGraphAgent = new LangGraphMarketingAgent({ wsManager });
const ollamaSearxngEmailDiscovery = new OllamaSearxNGEmailDiscovery();

// Initialize Marketing Research Agent with WebSocket support
const marketingResearchAgent = marketingAgent.initialize(wsManager);

// Make WebSocket manager and agents available globally
app.locals.wsManager = wsManager;
app.locals.langGraphAgent = langGraphAgent;
app.locals.marketingResearchAgent = marketingResearchAgent;
app.locals.ollamaSearxngEmailDiscovery = ollamaSearxngEmailDiscovery;

// Set up analytics WebSocket integration
const analyticsRoutes = require('./routes/analytics');
analyticsRoutes.setWebSocketManager(wsManager);

// Middleware - Configure helmet to allow iframes from frontend
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow iframe embedding
  frameguard: false // Completely disable X-Frame-Options to allow iframe embedding
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add Clerk authentication middleware with proper configuration
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// Add user context middleware to extract userId from Clerk
const { extractUserContext } = require('./middleware/userContext');
app.use(extractUserContext);

// Serve static files from public directory (for email-editor.html)
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/ollama', require('./routes/ollama'));
app.use('/api/scraper', require('./routes/scraper'));
app.use('/api/email', require('./routes/email'));
app.use('/api/send-email', require('./routes/send-email'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/marketing', require('./routes/marketing'));

// Debug endpoint for client-side logging
app.post('/api/debug-log', (req, res) => {
  const { message, ...data } = req.body;
  console.log('🌐 CLIENT DEBUG:', message, data);
  res.json({ success: true });
});

// WebSocket health check endpoint
app.get('/api/ws-health', (req, res) => {
  const wsStats = wsManager.getStats();
  console.log('🏥 WebSocket health check requested');
  console.log('   Connected clients:', wsStats.connectedClients);
  console.log('   Active workflows:', wsStats.activeWorkflows);
  res.json({
    status: 'ok',
    websocket: {
      enabled: true,
      path: '/ws/workflow',
      ...wsStats
    }
  });
});

// AI agent API routes
app.use('/api/automation', require('./routes/automation')(emailAgent, marketingAgent));

// Intelligent email automation routes
app.use('/api/intelligent', require('./routes/intelligent-automation'));

// AI agent control routes
app.use('/api/agent', require('./routes/agent'));

// Client API routes
app.use('/api/clients', require('./routes/agent'));

// Knowledge base API routes
app.use('/api/knowledge-base', require('./routes/knowledge-base-simple'));

// Email marketing dashboard API routes
app.use('/api/email-dashboard', require('./routes/emailDashboard'));

// Workflow API routes
app.use('/api/workflow', require('./routes/workflow'));

// Professional Email Discovery API routes
app.use('/api/professional-email-discovery', require('./routes/professionalEmailDiscovery'));

// LangGraph Agent API routes
app.use('/api/langgraph-agent', require('./routes/langgraph-agent'));

// Ollama + SearxNG Integration API routes
app.use('/api/ollama-searxng', require('./routes/ollama-searxng'));

// Prospects API routes (simple prospect search)
app.use('/api/prospects', require('./routes/prospects'));

// Marketing Research API routes
app.use('/api/marketing-research', require('./routes/marketing-research')(marketingResearchAgent));

// Research API routes (Market Intelligence)
app.use('/api/research', require('./routes/research'));

// Settings API routes
app.use('/api/settings', require('./routes/settings'));

// OAuth Authentication routes for email monitoring
app.use('/api/auth', require('./routes/oauth'));

// Email Editor API routes
app.use('/api/email-editor', require('./routes/email-editor'));
app.use('/api/campaign-workflow', require('./routes/campaign-workflow'));

// Website Analysis API routes
app.use('/api/website-analysis', require('./routes/website-analysis'));

// Email Tracking API routes (pixel tracking, click tracking, analytics)
app.use('/api/track', require('./routes/tracking'));

// Template Selection API routes (pass wsManager for broadcasting)
const templateRoutes = require('./routes/template');
templateRoutes.wsManager = wsManager; // Attach wsManager
app.use('/api/template', templateRoutes);

// SMTP Test endpoint for Railway diagnostics
app.use('/api/test-smtp', require('./routes/test-smtp'));

// Gmail OAuth endpoints
app.use('/api/gmail-oauth', require('./routes/gmailOAuth'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static assets with cache control
  app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'), {
    maxAge: '1y', // Cache assets for 1 year (they have hashed filenames)
    immutable: true
  }));

  // Serve index.html with no cache
  app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: 0,
    etag: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server immediately - don't wait for agent initialization
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}/ws/workflow (explicit path)`);
  console.log(`🏥 WebSocket Health: http://localhost:${PORT}/api/ws-health`);
  console.log(`🎯 Frontend: http://localhost:3000`);
  console.log(`🤖 LangGraph Agent: Initializing...`);

  // Log WebSocket server status
  console.log(`✅ WebSocket manager initialized and ready`);
});

// Initialize LangGraph agent in background (don't block server startup)
langGraphAgent.initialize().then(async () => {
  // Set WebSocket manager after initialization
  langGraphAgent.setWebSocketManager(wsManager);

  // Integrate Marketing Research Agent with LangGraph Agent
  langGraphAgent.setMarketingResearchAgent(marketingResearchAgent);

  console.log('✅ LangGraph Marketing Agent initialized with WebSocket and Marketing Research integration');

  // Auto-start continuous marketing research - DISABLED TO FREE UP OLLAMA
  /*
  try {
    const researchConfig = {
      industries: ['technology', 'AI', 'fintech', 'startups', 'automation'],
      keywords: ['market trends', 'industry news', 'competitive analysis', 'funding news', 'AI automation', 'email marketing trends'],
      competitors: ['HubSpot', 'Salesforce', 'Mailchimp', 'ActiveCampaign'],
      cycleInterval: 45000 // 45 seconds between cycles
    };

    const researchStarted = await marketingAgent.startContinuousResearch(researchConfig);
    if (researchStarted.success) {
      console.log('🔍 Continuous Marketing Research started automatically');
      console.log('   📊 Researching: technology, AI, fintech, startups, automation');
      console.log('   🔄 Cycle interval: 45 seconds');
      console.log('   💼 Competitor tracking: HubSpot, Salesforce, Mailchimp, ActiveCampaign');
    } else {
      console.log('⚠️ Marketing Research auto-start failed:', researchStarted.message);
    }
  } catch (error) {
    console.error('❌ Marketing Research auto-start error:', error.message);
  }
  */
  console.log('⚠️ Marketing Research auto-start DISABLED to free up Ollama for workflow');
}).catch(error => {
  console.error('❌ LangGraph initialization failed:', error.message);
  console.error('⚠️ Server will continue running without full agent functionality');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down server...');
  
  // Close WebSocket connections
  wsManager.close();
  
  // Shutdown LangGraph agent
  await langGraphAgent.shutdown();
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

module.exports = { app, server, wsManager, langGraphAgent };
