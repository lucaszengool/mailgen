const WebSocket = require('ws');
const EventEmitter = require('events');
const db = require('../models/database');

class WorkflowWebSocketManager extends EventEmitter {
  constructor(server) {
    super();
    // CRITICAL: Specify path for Railway compatibility
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/workflow',
      // Railway proxy compatibility
      verifyClient: (info) => {
        console.log('🔍 WebSocket verify client request:');
        console.log('   Origin:', info.origin);
        console.log('   Secure:', info.secure);
        console.log('   Request URL:', info.req.url);
        // Accept all origins for now
        return true;
      }
    });
    this.clients = new Map();
    this.workflowStates = new Map();
    // 🔥 NEW: Track clients by userId+campaignId for proper isolation
    this.userCampaignClients = new Map(); // "userId_campaignId" -> Set of clientIds
    this.setupWebSocketServer();
    console.log('🔌 WorkflowWebSocketManager initialized with path /ws/workflow');
  }

  setupWebSocketServer() {
    console.log('🔌 Setting up WebSocket server event handlers...');

    // Log server listening status
    this.wss.on('listening', () => {
      console.log('✅ WebSocket server is listening for connections');
    });

    // Log server errors
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket SERVER error:', error);
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const origin = req.headers.origin || 'unknown';
      console.log(`🔗🔗🔗 NEW WEBSOCKET CLIENT CONNECTED 🔗🔗🔗`);
      console.log(`   Client ID: ${clientId}`);
      console.log(`   Client IP: ${clientIP}`);
      console.log(`   Origin: ${origin}`);
      console.log(`   URL: ${req.url}`);
      console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
      
      // 存储客户端 - 🔥 Enhanced with user tracking
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        userId: null,  // Will be set on authenticate message
        campaignId: null,  // Will be set on subscribe
        lastActivity: Date.now()
      });

      // 发送欢迎消息
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        message: 'Connected to workflow server'
      });

      // 处理客户端消息
      ws.on('message', (message) => {
        this.handleClientMessage(clientId, message);
      });

      // 处理断开连接
      ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
      });
    });

    // WebSocket connections stay permanently - no cleanup per user request
  }

  handleClientMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received from ${clientId}:`, data.type);

      switch (data.type) {
        // 🔥 NEW: Handle authentication message from frontend
        case 'authenticate':
          this.handleAuthentication(clientId, data);
          break;

        // 🔥 NEW: Subscribe with user+campaign for proper isolation
        case 'subscribe_user_campaign':
          this.subscribeUserCampaign(clientId, data.userId, data.campaignId);
          break;

        case 'subscribe_workflow':
          this.subscribeToWorkflow(clientId, data.workflowId);
          break;

        case 'unsubscribe_workflow':
          this.unsubscribeFromWorkflow(clientId, data.workflowId);
          break;

        case 'update_strategy':
          this.handleStrategyUpdate(clientId, data);
          break;

        case 'update_analysis':
          this.handleAnalysisUpdate(clientId, data);
          break;

        case 'update_email':
          this.handleEmailUpdate(clientId, data);
          break;

        case 'request_prospects':
          this.sendProspectList(clientId, data.workflowId, data.userId, data.campaignId);
          break;

        case 'request_emails':
          this.sendEmailList(clientId, data.workflowId, data.userId, data.campaignId);
          break;

        // 🔥 NEW: Request workflow session state on reconnect
        case 'request_session_state':
          this.sendSessionState(clientId, data.userId, data.campaignId);
          break;

        case 'user_feedback':
          this.handleUserFeedback(clientId, data);
          break;

        case 'ping':
          this.sendToClient(clientId, { type: 'pong' });
          break;

        default:
          console.log(`⚠️ Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('❌ Error handling client message:', error);
    }
  }

  // 🔥 NEW: Handle authentication from frontend
  handleAuthentication(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { userId } = data;

    // Reject anonymous/demo users
    if (!userId || userId === 'demo' || userId === 'anonymous') {
      console.log(`❌ WebSocket auth rejected - invalid userId: ${userId}`);
      this.sendToClient(clientId, {
        type: 'auth_error',
        message: 'Authentication required. Please sign in.'
      });
      return;
    }

    client.userId = userId;
    console.log(`✅ WebSocket client ${clientId} authenticated as user: ${userId}`);

    this.sendToClient(clientId, {
      type: 'authenticated',
      userId,
      message: 'Successfully authenticated'
    });
  }

  // 🔥 NEW: Subscribe to specific user+campaign updates
  subscribeUserCampaign(clientId, userId, campaignId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate authentication
    if (!userId || userId === 'demo' || userId === 'anonymous') {
      console.log(`❌ Subscription rejected - invalid userId: ${userId}`);
      this.sendToClient(clientId, {
        type: 'subscription_error',
        message: 'Authentication required'
      });
      return;
    }

    // Store user info on client
    client.userId = userId;
    client.campaignId = campaignId;

    const key = `${userId}_${campaignId}`;

    // Add to user+campaign tracking
    if (!this.userCampaignClients.has(key)) {
      this.userCampaignClients.set(key, new Set());
    }
    this.userCampaignClients.get(key).add(clientId);

    // Also add to workflow subscriptions for backward compatibility
    client.subscriptions.add(campaignId);

    console.log(`👁️ Client ${clientId} subscribed to user ${userId} campaign ${campaignId}`);

    // Send current session state if available
    this.sendSessionState(clientId, userId, campaignId);
  }

  // 🔥 NEW: Send session state to client on connect/reconnect
  async sendSessionState(clientId, userId, campaignId) {
    try {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return;
      }

      // Get session from database
      const session = await db.getWorkflowSession(userId, campaignId);

      // Get prospects from database
      const prospects = await db.getContacts(userId, campaignId);

      // Get emails from database
      const emails = await db.getEmailDrafts(userId, campaignId);

      this.sendToClient(clientId, {
        type: 'session_state',
        userId,
        campaignId,
        session: session || { status: 'idle' },
        prospects: prospects || [],
        emails: emails || [],
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Sent session state to ${clientId}: ${prospects?.length || 0} prospects, ${emails?.length || 0} emails, status: ${session?.status || 'idle'}`);
    } catch (error) {
      console.error('❌ Error sending session state:', error);
    }
  }

  // 订阅工作流更新
  subscribeToWorkflow(clientId, workflowId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(workflowId);
      console.log(`👁️ Client ${clientId} subscribed to workflow ${workflowId}`);

      // 发送当前工作流状态
      const state = this.workflowStates.get(workflowId);
      if (state) {
        this.sendToClient(clientId, {
          type: 'workflow_state',
          workflowId,
          state
        });
      }
    }
  }

  // 🔥 NEW: Unsubscribe from workflow updates
  unsubscribeFromWorkflow(clientId, workflowId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(workflowId);
      console.log(`👋 Client ${clientId} unsubscribed from workflow ${workflowId}`);
      console.log(`   Remaining subscriptions:`, Array.from(client.subscriptions));
    }
  }

  // 广播工作流状态更新
  broadcastWorkflowUpdate(workflowId, update) {
    console.log(`📡 Broadcasting workflow update for ${workflowId}:`, update.type);

    // 更新存储的状态
    if (!this.workflowStates.has(workflowId)) {
      this.workflowStates.set(workflowId, {
        id: workflowId,
        campaignId: workflowId, // 🔥 FIX: Store campaignId (workflowId IS the campaignId)
        status: 'running',
        stages: {},
        currentStage: null,
        startTime: Date.now(),
        data: {} // 🔥 FIX: Initialize data object for storing prospects/emails
      });
    }

    const state = this.workflowStates.get(workflowId);
    
    // 更新状态
    switch (update.type) {
      case 'stage_start':
        state.currentStage = update.stage;
        state.stages[update.stage] = {
          status: 'running',
          startTime: Date.now(),
          data: update.data
        };
        break;
        
      case 'stage_complete':
        if (state.stages[update.stage]) {
          state.stages[update.stage].status = 'completed';
          state.stages[update.stage].endTime = Date.now();
          state.stages[update.stage].result = update.result;
        }
        break;
        
      case 'stage_error':
        if (state.stages[update.stage]) {
          state.stages[update.stage].status = 'error';
          state.stages[update.stage].error = update.error;
        }
        break;
        
      case 'workflow_complete':
        state.status = 'completed';
        state.endTime = Date.now();
        state.result = update.result;
        break;
        
      case 'workflow_error':
        state.status = 'error';
        state.error = update.error;
        break;
        
      case 'data_update':
        if (!state.data) state.data = {};
        Object.assign(state.data, update.data);
        break;
    }
    
    // 广播给所有订阅的客户端
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(workflowId)) {
        this.sendToClient(clientId, {
          type: 'workflow_update',
          workflowId,
          update,
          state
        });
      }
    });
  }

  // 处理策略编辑
  handleStrategyUpdate(clientId, data) {
    console.log(`✏️ Strategy update from ${clientId}`);
    
    // 发送给Agent学习系统
    this.emit('strategy_updated', {
      clientId,
      workflowId: data.workflowId,
      strategy: data.strategy,
      changes: data.changes,
      feedback: data.feedback
    });
    
    // 确认更新
    this.sendToClient(clientId, {
      type: 'strategy_update_confirmed',
      workflowId: data.workflowId
    });
    
    // 通知其他客户端
    this.broadcastWorkflowUpdate(data.workflowId, {
      type: 'data_update',
      data: { strategy: data.strategy }
    });
  }

  // 处理分析编辑
  handleAnalysisUpdate(clientId, data) {
    console.log(`✏️ Analysis update from ${clientId}`);
    
    this.emit('analysis_updated', {
      clientId,
      workflowId: data.workflowId,
      analysis: data.analysis,
      changes: data.changes,
      feedback: data.feedback
    });
    
    this.sendToClient(clientId, {
      type: 'analysis_update_confirmed',
      workflowId: data.workflowId
    });
    
    this.broadcastWorkflowUpdate(data.workflowId, {
      type: 'data_update',
      data: { businessAnalysis: data.analysis }
    });
  }

  // 处理邮件编辑
  handleEmailUpdate(clientId, data) {
    console.log(`✏️ Email update from ${clientId}`);
    
    this.emit('email_updated', {
      clientId,
      workflowId: data.workflowId,
      emailId: data.emailId,
      email: data.email,
      changes: data.changes
    });
    
    this.sendToClient(clientId, {
      type: 'email_update_confirmed',
      emailId: data.emailId
    });
  }

  // 发送潜在客户列表
  sendProspectList(clientId, workflowId) {
    let prospects = [];
    let sourceWorkflowId = workflowId;
    
    if (workflowId) {
      // Get prospects from specific workflow
      const state = this.workflowStates.get(workflowId);
      if (state && state.data && state.data.prospects) {
        prospects = state.data.prospects;
      }
    } else {
      // Find prospects from any workflow if no specific workflow ID
      for (const [id, state] of this.workflowStates) {
        if (state.data && state.data.prospects && state.data.prospects.length > 0) {
          prospects = state.data.prospects;
          sourceWorkflowId = id;
          break;
        }
      }
    }
    
    console.log(`📤 Sending prospect list to client ${clientId}: ${prospects.length} prospects from workflow ${sourceWorkflowId}`);
    
    this.sendToClient(clientId, {
      type: 'prospect_list',
      workflowId: sourceWorkflowId,
      prospects: prospects,
      total: prospects.length,
      timestamp: new Date().toISOString()
    });
  }

  // 发送邮件列表
  sendEmailList(clientId, workflowId) {
    const state = this.workflowStates.get(workflowId);
    if (state && state.data && state.data.emails) {
      this.sendToClient(clientId, {
        type: 'email_list',
        workflowId,
        emails: state.data.emails
      });
    }
  }

  // 处理用户反馈
  handleUserFeedback(clientId, data) {
    console.log(`📝 User feedback from ${clientId}`);
    
    this.emit('user_feedback', {
      clientId,
      workflowId: data.workflowId,
      type: data.feedbackType,
      rating: data.rating,
      comments: data.comments,
      timestamp: Date.now()
    });
    
    this.sendToClient(clientId, {
      type: 'feedback_received',
      message: 'Thank you for your feedback!'
    });
  }

  // 发送消息给客户端
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      client.lastActivity = Date.now();
    }
  }

  // 🔥 NEW: Broadcast to specific user+campaign only (proper isolation)
  broadcastToUserCampaign(userId, campaignId, data) {
    if (!userId || userId === 'demo' || userId === 'anonymous') {
      console.log(`⚠️ [WebSocket] Cannot broadcast to invalid user: ${userId}`);
      return;
    }

    const key = `${userId}_${campaignId}`;
    const clientIds = this.userCampaignClients.get(key);

    if (clientIds && clientIds.size > 0) {
      console.log(`📡 [WebSocket] Broadcasting to ${clientIds.size} clients for user ${userId} campaign ${campaignId}`);
      clientIds.forEach(clientId => {
        this.sendToClient(clientId, {
          ...data,
          userId,
          campaignId
        });
      });
    } else {
      console.log(`⚠️ [WebSocket] No clients subscribed to user ${userId} campaign ${campaignId}`);
    }
  }

  // 🔥 NEW: Broadcast instant prospect update to specific user+campaign
  broadcastProspectUpdate(userId, campaignId, prospect) {
    this.broadcastToUserCampaign(userId, campaignId, {
      type: 'prospect_found',
      prospect,
      timestamp: new Date().toISOString()
    });
  }

  // 🔥 NEW: Broadcast instant email update to specific user+campaign
  broadcastEmailUpdate(userId, campaignId, email) {
    this.broadcastToUserCampaign(userId, campaignId, {
      type: 'email_generated',
      email,
      timestamp: new Date().toISOString()
    });
  }

  // 🔥 NEW: Broadcast workflow status update to specific user+campaign
  broadcastWorkflowStatus(userId, campaignId, status, additionalData = {}) {
    this.broadcastToUserCampaign(userId, campaignId, {
      type: 'workflow_status',
      status,
      ...additionalData,
      timestamp: new Date().toISOString()
    });

    // Also update session in database
    if (userId && userId !== 'demo' && userId !== 'anonymous') {
      db.updateWorkflowSessionStatus(userId, campaignId, status, additionalData).catch(err => {
        console.error('❌ [WebSocket] Failed to update session status:', err);
      });
    }
  }

  // 广播消息给所有客户端 (use sparingly - prefer user-specific broadcast)
  broadcast(data) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, data);
    });

    // 🔥 CRITICAL: Auto-save prospects to database when broadcast contains prospect data
    this.autoSaveProspectsFromBroadcast(data);
  }

  // 🔥 NEW: Auto-save prospects to database to ensure persistence
  async autoSaveProspectsFromBroadcast(data) {
    try {
      let prospects = null;
      let campaignId = null;
      // 🔥 FIX: Extract userId from ALL possible locations in the message
      let userId = data.userId || data.data?.userId || data.user_id || 'anonymous';

      // Extract prospects from various message types
      if (data.type === 'prospect_list' && data.prospects) {
        prospects = data.prospects;
        campaignId = data.campaignId;
        userId = data.userId || userId;  // 🔥 FIX: Also check data.userId
      } else if (data.type === 'prospect_batch_update' && data.data?.prospects) {
        prospects = data.data.prospects;
        campaignId = data.data.campaignId || data.campaignId;
        userId = data.data.userId || data.userId || userId;
      } else if (data.type === 'workflow_update' && data.stepData?.results?.prospects) {
        prospects = data.stepData.results.prospects;
        campaignId = data.campaignId;
        userId = data.userId || data.stepData?.userId || userId;  // 🔥 FIX
      } else if (data.type === 'data_update' && data.data?.prospects) {
        prospects = data.data.prospects;
        campaignId = data.campaignId;
        userId = data.data.userId || data.userId || userId;  // 🔥 FIX
      }

      // 🔥 FIX: Log the userId being used for debugging
      console.log(`💾 [WebSocket] autoSave using userId: ${userId}, campaignId: ${campaignId}`);

      // If we found prospects, save them to database
      if (prospects && prospects.length > 0 && campaignId) {
        console.log(`💾 [WebSocket] Auto-saving ${prospects.length} prospects to database for campaign: ${campaignId}`);

        const db = require('../models/database');
        let savedCount = 0;

        for (const prospect of prospects) {
          if (!prospect.email) continue;

          try {
            await db.saveContact({
              email: prospect.email,
              name: prospect.name || 'Unknown',
              company: prospect.company || 'Unknown',
              position: prospect.role || prospect.position || 'Unknown',
              industry: prospect.industry || 'Unknown',
              phone: prospect.phone || '',
              address: '',
              source: prospect.source || 'websocket_broadcast',
              tags: '',
              notes: `Auto-saved from WebSocket broadcast on ${new Date().toLocaleString()}`
            }, userId, campaignId);
            savedCount++;
          } catch (saveError) {
            // Skip duplicates silently
            if (!saveError.message?.includes('UNIQUE constraint')) {
              console.error(`⚠️ [WebSocket] Failed to save prospect ${prospect.email}:`, saveError.message);
            }
          }
        }

        if (savedCount > 0) {
          console.log(`✅ [WebSocket] Saved ${savedCount}/${prospects.length} prospects to database`);
        }
      }
    } catch (error) {
      console.error('❌ [WebSocket] Error in autoSaveProspectsFromBroadcast:', error);
    }
  }

  // 清理断开的连接 - DISABLED per user request to keep WebSocket always connected
  cleanupDeadConnections() {
    // NO-OP: WebSocket connections are kept permanently alive
    console.log('🔌 WebSocket cleanup disabled - connections stay alive permanently');
  }

  // 生成客户端ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取连接统计
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeWorkflows: this.workflowStates.size,
      clients: Array.from(this.clients.keys())
    };
  }

  // 获取当前状态摘要
  getStatusSummary() {
    return {
      workflowStatus: 'ready',
      currentStep: 'waiting',
      connectedClients: this.clients.size,
      stepsCount: this.workflowStates.size,
      lastActivity: new Date().toISOString()
    };
  }

  // 获取所有步骤状态
  getAllStepsStatus() {
    const steps = [];
    for (const [workflowId, workflowData] of this.workflowStates) {
      if (workflowData.steps) {
        for (const [stepId, stepData] of workflowData.steps) {
          steps.push({
            id: stepId,
            workflowId: workflowId,
            ...stepData
          });
        }
      }
    }
    return steps;
  }

  // 更新工作流状态 (兼容性方法)
  updateWorkflowStatus(workflowId, status, data = {}) {
    console.log(`📊 Updating workflow ${workflowId} status: ${status}`);
    
    // 根据状态类型调用相应的广播方法
    switch (status) {
      case 'running':
        this.broadcastWorkflowUpdate(workflowId, {
          type: 'stage_start',
          stage: data.step || 'unknown',
          data: data
        });
        break;
      case 'completed':
        this.broadcastWorkflowUpdate(workflowId, {
          type: 'workflow_complete',
          result: data
        });
        break;
      case 'error':
        this.broadcastWorkflowUpdate(workflowId, {
          type: 'workflow_error',
          error: data.error || 'Unknown error'
        });
        break;
      default:
        this.broadcastWorkflowUpdate(workflowId, {
          type: 'data_update',
          data: { status, ...data }
        });
    }
  }

  // 发送通知消息
  sendNotification(message, type = 'info', data = {}) {
    console.log(`📢 Sending notification: ${type} - ${message}`);
    
    const notification = {
      type: 'notification',
      notificationType: type,
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(notification);
  }

  // 步骤开始
  stepStarted(stepId, stepName) {
    console.log(`🚀 Step started: ${stepId} - ${stepName}`);
    
    this.broadcast({
      type: 'step_started',
      stepId: stepId,
      stepName: stepName,
      timestamp: new Date().toISOString()
    });
  }

  // 步骤完成
  stepCompleted(stepId, result) {
    console.log(`✅ Step completed: ${stepId}`, result ? 'with results' : 'no results');
    
    // Send workflow_update that frontend expects
    this.broadcast({
      type: 'workflow_update',
      stepId: stepId,
      stepData: {
        status: 'completed',
        progress: 100,
        results: result,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
    // Also send the old format for compatibility
    this.broadcast({
      type: 'step_completed',
      stepId: stepId,
      result: result,
      timestamp: new Date().toISOString()
    });
  }

  // 发送日志更新
  sendLogUpdate(stepId, message, level = 'info') {
    console.log(`📝 Log update [${stepId}]: ${message}`);
    
    this.broadcast({
      type: 'log_update',
      stepId: stepId,
      message: message,
      level: level,
      timestamp: new Date().toISOString()
    });
  }

  // 更新步骤进度
  updateStepProgress(stepId, progress) {
    console.log(`📊 Progress update [${stepId}]: ${progress}%`);
    
    this.broadcast({
      type: 'step_progress',
      stepId: stepId,
      progress: progress,
      timestamp: new Date().toISOString()
    });
  }

  // 更新分析数据
  updateAnalytics(analytics) {
    console.log(`📈 Analytics update:`, analytics);
    
    this.broadcast({
      type: 'analytics_update',
      analytics: analytics,
      timestamp: new Date().toISOString()
    });
  }

  // 发送客户更新
  // 🔥 CRITICAL: Added campaignId parameter to prevent mixing prospects between campaigns
  updateClientData(prospects, campaignId = null) {
    console.log(`📡 Broadcasting prospect data update: ${prospects.length} prospects for campaign: ${campaignId}`);

    // Update all workflow states with prospect data
    this.workflowStates.forEach((state, workflowId) => {
      if (!state.data) state.data = {};
      state.data.prospects = prospects;
      state.data.totalProspects = prospects.length;
      state.data.lastUpdate = new Date().toISOString();
    });

    // Broadcast to all connected clients
    // 🔥 CRITICAL: Include campaignId for proper isolation
    this.broadcast({
      type: 'data_update',
      campaignId: campaignId,  // 🔥 CRITICAL for isolation
      data: {
        campaignId: campaignId,  // 🔥 Also inside data
        prospects: prospects,
        totalProspects: prospects.length
      },
      timestamp: new Date().toISOString()
    });

    // Also send as clients_update for backward compatibility
    this.broadcast({
      type: 'clients_update',
      campaignId: campaignId,  // 🔥 CRITICAL for isolation
      clients: prospects,
      total: prospects.length,
      timestamp: new Date().toISOString()
    });

    // Send prospect list to all clients
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, {
        type: 'prospect_list',
        campaignId: campaignId,  // 🔥 CRITICAL for isolation
        prospects: prospects,
        total: prospects.length,
        timestamp: new Date().toISOString()
      });
    });
  }

  // 发送日志更新
  sendLogUpdate(stepId, message, level = 'info') {
    this.broadcast({
      type: 'log_update',
      stepId,
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  // 步骤开始
  stepStarted(stepId, stepTitle = null) {
    const stepData = {
      status: 'running',
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null
    };

    if (stepTitle) {
      stepData.title = stepTitle;
    }

    this.broadcast({
      type: 'workflow_update',
      stepId,
      stepData: {
        ...stepData,
        lastUpdate: new Date().toISOString()
      }
    });
  }

  // 步骤完成
  // 🔥 CRITICAL: Added campaignId parameter to prevent mixing prospects between campaigns
  stepCompleted(stepId, results = null, progress = 100, campaignId = null) {
    const stepData = {
      status: 'completed',
      progress,
      endTime: new Date().toISOString(),
      ...(results && { results })
    };

    // Store prospects data in workflow state if this is the prospect_search step
    if (stepId === 'prospect_search' && results && results.prospects) {
      console.log(`📊 Storing ${results.prospects.length} prospects in workflow state for campaign: ${campaignId}`);

      // Find the most recent workflow or create one
      let workflowId = campaignId || null;  // 🔥 Use campaignId as workflowId if provided
      if (!workflowId) {
        for (const [id, state] of this.workflowStates) {
          if (state.status === 'running') {
            workflowId = id;
            break;
          }
        }
      }

      if (!workflowId) {
        workflowId = `workflow_${Date.now()}`;
        this.workflowStates.set(workflowId, {
          id: workflowId,
          campaignId: campaignId,  // 🔥 Store campaignId
          status: 'running',
          startTime: new Date().toISOString(),
          data: {}
        });
      }

      // Update the workflow state with prospects
      const state = this.workflowStates.get(workflowId);
      if (state) {
        if (!state.data) state.data = {};
        state.data.prospects = results.prospects;
        state.data.totalProspects = results.prospects.length;
        state.data.lastUpdate = new Date().toISOString();
        console.log(`✅ Prospects stored in workflow ${workflowId}`);
      }

      // Also broadcast a specific prospect_list message
      // 🔥 CRITICAL: Include campaignId for proper isolation
      this.broadcast({
        type: 'prospect_list',
        workflowId: workflowId,
        campaignId: campaignId,  // 🔥 CRITICAL for isolation
        prospects: results.prospects,
        total: results.prospects.length,
        timestamp: new Date().toISOString()
      });
    }

    // 🔥 CRITICAL FIX: Store email campaign data in workflow state if this is the email_generation step
    if (stepId === 'email_generation' && results && results.emails) {
      console.log(`📧 Storing ${results.emails.length} emails in workflow state`);

      // Find the most recent workflow or create one
      let workflowId = null;
      for (const [id, state] of this.workflowStates) {
        if (state.status === 'running') {
          workflowId = id;
          break;
        }
      }

      if (!workflowId) {
        workflowId = `workflow_${Date.now()}`;
        this.workflowStates.set(workflowId, {
          id: workflowId,
          status: 'running',
          startTime: new Date().toISOString(),
          data: {}
        });
      }

      // Update the workflow state with email campaign
      const state = this.workflowStates.get(workflowId);
      if (state) {
        if (!state.data) state.data = {};
        state.data.emailCampaign = results;
        state.data.totalEmails = results.emails.length;
        state.data.lastUpdate = new Date().toISOString();
        console.log(`✅ Email campaign stored in workflow ${workflowId}`);
      }

      // Also broadcast a specific email_list message
      this.broadcast({
        type: 'email_list',
        workflowId: workflowId,
        emails: results.emails,
        total: results.emails.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // Store email campaign data in workflow state if this is the email_campaign or email_generation step
    if ((stepId === 'email_campaign' || stepId === 'email_generation') && results) {
      console.log(`📧 Storing email campaign results in workflow state`);
      
      // Find the most recent workflow
      let workflowId = null;
      for (const [id, state] of this.workflowStates) {
        if (state.status === 'running') {
          workflowId = id;
          break;
        }
      }
      
      if (workflowId) {
        const state = this.workflowStates.get(workflowId);
        if (state) {
          if (!state.data) state.data = {};
          
          // Store email campaign data
          const emailData = {
            emails: results.emails || results.emailsSent || [],
            emailsSent: results.emailsSent || results.emails || [],
            sent: results.totalEmails || results.sent || (results.emailsSent?.length) || (results.emails?.length) || 0,
            opened: results.opened || 0,
            replied: results.replied || 0,
            lastUpdate: new Date().toISOString()
          };
          
          state.data.emailCampaign = emailData;
          console.log(`📧 Email campaign data stored: ${emailData.sent} emails`);
          
          // Broadcast email campaign update (both types for compatibility)
          this.broadcast({
            type: 'email_campaign_update',
            workflowId: workflowId,
            emails: emailData.emails,
            stats: {
              sent: emailData.sent,
              opened: emailData.opened,
              replied: emailData.replied
            },
            timestamp: new Date().toISOString()
          });

          // Also send data_update for consistency
          this.broadcast({
            type: 'data_update',
            data: {
              emailCampaign: emailData
            },
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    this.broadcast({
      type: 'workflow_update',
      stepId,
      stepData: {
        ...stepData,
        lastUpdate: new Date().toISOString()
      }
    });
  }

  // 步骤失败
  stepFailed(stepId, error, progress = 0) {
    const stepData = {
      status: 'error',
      progress,
      error: error.message || error,
      endTime: new Date().toISOString()
    };

    this.broadcast({
      type: 'workflow_update',
      stepId,
      stepData: {
        ...stepData,
        lastUpdate: new Date().toISOString()
      }
    });
  }

  // 清除所有工作流状态和数据
  clearAllWorkflowStates() {
    console.log('🗑️ Clearing all workflow states and campaign data...');
    this.workflowStates.clear();

    // 通知所有客户端数据已清除
    this.broadcast({
      type: 'workflow_data_cleared',
      message: 'All workflow data has been cleared'
    });

    console.log('✅ All workflow states cleared');
  }

  // 关闭连接
  close() {
    console.log('🔌 Closing WebSocket connections...');
    this.clients.forEach((client, clientId) => {
      client.ws.close();
    });
    this.clients.clear();
    this.wss.close();
  }
}

module.exports = WorkflowWebSocketManager;