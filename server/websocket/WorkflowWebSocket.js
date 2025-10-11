/**
 * WebSocket 处理程序 - 提供实时工作流更新
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WorkflowWebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.workflowStatus = 'idle'; // idle, running, completed, error
    this.currentStep = null;
    this.stepProgress = new Map();
    
    console.log('🔌 WorkflowWebSocketManager initialized');
  }

  setupWebSocketServer(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/workflow'
    });

    this.wss.on('connection', (ws, request) => {
      console.log('🔗 New WebSocket client connected');
      this.clients.add(ws);
      
      // 发送当前状态给新连接的客户端
      this.sendToClient(ws, {
        type: 'status_update',
        status: this.workflowStatus,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString()
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ WebSocket server setup complete');
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'request_status':
        this.sendToClient(ws, {
          type: 'status_update',
          status: this.workflowStatus,
          currentStep: this.currentStep,
          steps: this.getAllStepsStatus(),
          timestamp: new Date().toISOString()
        });
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  sendToClient(client, message) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to WebSocket client:', error);
      }
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting to WebSocket client:', error);
        }
      }
    });
  }

  // 更新工作流状态
  updateWorkflowStatus(status, currentStep = null) {
    this.workflowStatus = status;
    this.currentStep = currentStep;
    
    console.log(`🔄 Workflow status updated: ${status} (step: ${currentStep})`);
    
    this.broadcast({
      type: 'status_update',
      status: this.workflowStatus,
      currentStep: this.currentStep
    });
  }

  // 更新步骤状态
  updateStepStatus(stepId, stepData) {
    this.stepProgress.set(stepId, {
      ...this.stepProgress.get(stepId),
      ...stepData,
      lastUpdate: new Date().toISOString()
    });

    console.log(`📋 Step ${stepId} updated:`, stepData);

    this.broadcast({
      type: 'workflow_update',
      stepId,
      stepData: {
        ...stepData,
        lastUpdate: new Date().toISOString()
      }
    });
  }

  // 更新步骤进度
  updateStepProgress(stepId, progress, status = null) {
    const stepData = {
      progress: Math.min(100, Math.max(0, progress)),
      ...(status && { status }),
      lastUpdate: new Date().toISOString()
    };

    this.updateStepStatus(stepId, stepData);
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

    this.updateStepStatus(stepId, stepData);
    this.updateWorkflowStatus('running', stepId);
  }

  // 步骤完成
  stepCompleted(stepId, results = null, progress = 100) {
    const stepData = {
      status: 'completed',
      progress,
      endTime: new Date().toISOString(),
      ...(results && { results })
    };

    this.updateStepStatus(stepId, stepData);
  }

  // 步骤失败
  stepFailed(stepId, error, progress = 0) {
    const stepData = {
      status: 'error',
      progress,
      error: error.message || error,
      endTime: new Date().toISOString()
    };

    this.updateStepStatus(stepId, stepData);
  }

  // 发送分析数据更新
  updateAnalytics(analyticsData) {
    this.broadcast({
      type: 'analytics_update',
      data: analyticsData
    });
  }

  // 获取所有步骤状态
  getAllStepsStatus() {
    const steps = [];
    for (const [stepId, stepData] of this.stepProgress) {
      steps.push({
        id: stepId,
        ...stepData
      });
    }
    return steps;
  }

  // 发送用户通知
  sendNotification(message, type = 'info') {
    this.broadcast({
      type: 'notification',
      message,
      notificationType: type, // info, success, warning, error
      timestamp: new Date().toISOString()
    });
  }

  // 发送实时日志到特定步骤
  sendLogUpdate(stepId, message, level = 'info') {
    this.broadcast({
      type: 'log_update',
      stepId,
      message,
      level, // info, success, warning, error
      timestamp: new Date().toISOString()
    });
  }

  // 发送邮件更新
  updateEmailStatus(emailId, status, metadata = {}) {
    this.broadcast({
      type: 'email_update',
      emailId,
      status, // sent, opened, replied, bounced
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // 发送客户更新
  updateClientData(clients) {
    this.broadcast({
      type: 'clients_update',
      clients,
      total: clients.length,
      timestamp: new Date().toISOString()
    });
  }

  // 关闭 WebSocket 服务器
  close() {
    if (this.wss) {
      this.wss.close(() => {
        console.log('🔌 WebSocket server closed');
      });
    }
  }

  // 获取连接的客户端数量
  getClientCount() {
    return this.clients.size;
  }

  // 获取当前状态摘要
  getStatusSummary() {
    return {
      workflowStatus: this.workflowStatus,
      currentStep: this.currentStep,
      connectedClients: this.getClientCount(),
      stepsCount: this.stepProgress.size,
      lastActivity: new Date().toISOString()
    };
  }
}

module.exports = WorkflowWebSocketManager;