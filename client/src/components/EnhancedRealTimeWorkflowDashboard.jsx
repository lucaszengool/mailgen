import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, Settings, Users, Target, Search, Mail, 
  Eye, ChevronRight, ChevronDown, RefreshCw, Brain,
  Globe, MessageSquare, TrendingUp, Clock, AlertCircle,
  CheckCircle, Loader, FileText, Database, Send, Zap, X,
  Sparkles, BarChart3, UserCheck, Repeat, Home, Activity,
  List, MailCheck, ChevronLeft, Filter, Download, Upload,
  Edit, ThumbsUp, ThumbsDown, Save, RotateCcw, Menu,
  Plus, Minus, Star, Calendar, ExternalLink, Copy,
  CheckCircle2, XCircle, AlertTriangle, Info, Terminal,
  Circle, Maximize2, Minimize2
} from 'lucide-react';
import MarketingResearchWindow from './MarketingResearchWindow';
import AnimatedLogViewer from './AnimatedLogViewer';
import WebsiteAnalysisVisualizer from './WebsiteAnalysisVisualizer';
import './animations.css';

const EnhancedRealTimeWorkflowDashboard = ({ agentConfig, onReset }) => {
  // 核心状态管理
  const [activeView, setActiveView] = useState('workflow');
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // idle, running, completed, error
  const [currentStep, setCurrentStep] = useState(null);
  const [realTimeData, setRealTimeData] = useState({
    totalProspects: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    campaignActive: false,
    lastUpdate: null,
    activeClients: []
  });

  // 工作流步骤状态 - Enhanced with logs
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 'website_analysis',
      title: 'Website Analysis',
      subtitle: 'AI-Powered Website Analysis',
      icon: Globe,
      status: 'pending', // pending, running, completed, error
      progress: 0,
      startTime: null,
      endTime: null,
      results: null,
      userEdited: false,
      allowEdit: true,
      editableFields: ['companyName', 'industry', 'valueProposition', 'targetMarket', 'keyFeatures'],
      logs: [] // Real-time logs for this step
    },
    {
      id: 'marketing_strategy',
      title: 'Marketing Strategy',
      subtitle: 'Strategic Marketing Plan',
      icon: Target,
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      results: null,
      userEdited: false,
      allowEdit: true,
      editableFields: ['targetAudience', 'searchKeywords', 'approach', 'messaging'],
      logs: []
    },
    {
      id: 'prospect_search',
      title: 'Prospect Search',
      subtitle: 'AI Prospect Discovery',
      icon: Search,
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      results: null,
      userEdited: false,
      allowEdit: false,
      logs: []
    },
    {
      id: 'email_generation',
      title: 'Email Generation',
      subtitle: 'Personalized Email Campaign',
      icon: Mail,
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      results: null,
      userEdited: false,
      allowEdit: true,
      editableFields: ['subject', 'body', 'tone', 'callToAction'],
      logs: []
    },
    {
      id: 'email_sending',
      title: 'Email Sending',
      subtitle: 'Campaign Execution',
      icon: Send,
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      results: null,
      userEdited: false,
      allowEdit: false,
      logs: []
    }
  ]);

  // Log viewing states
  const [selectedLogStep, setSelectedLogStep] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fullscreenLog, setFullscreenLog] = useState(false);
  const logEndRef = useRef(null);

  // 用户编辑状态
  const [editingStep, setEditingStep] = useState(null);
  const [editData, setEditData] = useState({});

  // WebSocket 连接用于实时更新
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 实时数据更新
  const fetchRealTimeData = useCallback(async () => {
    try {
      // 获取活动状态
      const statusResponse = await fetch('/api/langgraph-agent/status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        setWorkflowStatus(statusData.status);
        setCurrentStep(statusData.currentStep);
        
        // 更新工作流步骤状态
        if (statusData.steps) {
          setWorkflowSteps(prev => prev.map(step => {
            const serverStep = statusData.steps.find(s => s.id === step.id);
            return serverStep ? { ...step, ...serverStep, logs: step.logs } : step;
          }));
        }
      }

      // 获取实时数据统计
      const dataResponse = await fetch('/api/langgraph-agent/analytics');
      const analyticsData = await dataResponse.json();
      
      if (analyticsData.success) {
        setRealTimeData(prev => ({
          ...prev,
          ...analyticsData.data,
          lastUpdate: new Date()
        }));
      }

      // 获取客户列表
      const clientsResponse = await fetch('/api/agent/clients');
      const clientsData = await clientsResponse.json();
      
      if (clientsData.success) {
        setRealTimeData(prev => ({
          ...prev,
          activeClients: clientsData.clients || [],
          totalProspects: clientsData.clients?.length || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }, []);

  // Handle WebSocket log messages
  const handleLogUpdate = (data) => {
    setWorkflowSteps(prev => prev.map(step => {
      if (step.id === data.stepId) {
        const newLog = {
          timestamp: data.timestamp || new Date().toISOString(),
          level: data.level || 'info',
          message: data.message
        };
        
        const updatedLogs = [...(step.logs || []), newLog];
        // Keep only last 500 logs per step
        if (updatedLogs.length > 500) {
          updatedLogs.shift();
        }
        
        return { ...step, logs: updatedLogs };
      }
      return step;
    }));

    // Auto-scroll to bottom if enabled
    if (autoScroll && logEndRef.current) {
      setTimeout(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // WebSocket 连接管理
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(`ws://localhost:3333`);
      
      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected for real-time updates');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'log_update') {
            handleLogUpdate(data);
          } else if (data.type === 'workflow_update') {
            setWorkflowSteps(prev => prev.map(step => 
              step.id === data.stepId ? { ...step, ...data.stepData, logs: step.logs } : step
            ));
          } else if (data.type === 'analytics_update') {
            setRealTimeData(prev => ({ ...prev, ...data.data, lastUpdate: new Date() }));
          } else if (data.type === 'status_update') {
            setWorkflowStatus(data.status);
            setCurrentStep(data.currentStep);
          } else if (data.type === 'stage_start') {
            setWorkflowSteps(prev => prev.map(step => {
              if (step.id === data.stage) {
                return {
                  ...step,
                  status: 'running',
                  startTime: new Date().toISOString(),
                  logs: [...(step.logs || []), {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: `Starting ${step.title}...`
                  }]
                };
              }
              return step;
            }));
            setCurrentStep(data.stage);
            setSelectedLogStep(data.stage);
          } else if (data.type === 'stage_complete') {
            setWorkflowSteps(prev => prev.map(step => {
              if (step.id === data.stage) {
                const endTime = new Date();
                const duration = step.startTime ? 
                  Math.round((endTime - new Date(step.startTime)) / 1000) : 0;
                
                return {
                  ...step,
                  status: data.success ? 'completed' : 'error',
                  endTime: endTime.toISOString(),
                  progress: 100,
                  logs: [...(step.logs || []), {
                    timestamp: endTime.toISOString(),
                    level: data.success ? 'success' : 'error',
                    message: data.success ? 
                      `✅ ${step.title} completed in ${duration}s` : 
                      `❌ ${step.title} failed: ${data.error}`
                  }]
                };
              }
              return step;
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected, attempting reconnect...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  }, [autoScroll]);

  // 组件挂载时初始化
  useEffect(() => {
    fetchRealTimeData();
    connectWebSocket();
    
    // 定时刷新数据作为 WebSocket 的备选方案
    const dataInterval = setInterval(fetchRealTimeData, 10000);

    return () => {
      clearInterval(dataInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchRealTimeData, connectWebSocket]);

  // 启动工作流
  const startWorkflow = async () => {
    try {
      setWorkflowStatus('running');
      
      // Reset all steps
      setWorkflowSteps(prev => prev.map(step => ({
        ...step,
        status: 'pending',
        progress: 0,
        startTime: null,
        endTime: null,
        results: null,
        logs: []
      })));
      
      const response = await fetch('/api/langgraph-agent/execute-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWebsite: agentConfig.targetWebsite,
          campaignGoal: agentConfig.campaignGoal,
          businessType: agentConfig.businessType,
          smtpConfig: agentConfig.smtpConfig
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 实时更新将通过 WebSocket 处理
        console.log('✅ Workflow started successfully');
      } else {
        throw new Error(result.error || 'Workflow start failed');
      }
    } catch (error) {
      console.error('❌ Workflow start error:', error);
      setWorkflowStatus('error');
    }
  };

  // 编辑工作流步骤结果
  const handleEditStep = (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (step?.results) {
      setEditingStep(stepId);
      setEditData({ ...step.results });
    }
  };

  // 保存编辑并发送反馈给 LangGraph
  const saveStepEdit = async (stepId) => {
    try {
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'current',
          feedbackType: getStepFeedbackType(stepId),
          feedback: {
            stepId,
            modified_content: editData,
            user_rating: 5,
            modifications: 'User edited workflow step results',
            timestamp: new Date().toISOString(),
            learning_enabled: true
          }
        })
      });

      if (response.ok) {
        // 更新本地状态
        setWorkflowSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { 
                ...step, 
                results: { ...editData },
                userEdited: true,
                lastModified: new Date().toISOString()
              }
            : step
        ));
        
        setEditingStep(null);
        setEditData({});
        
        console.log('✅ Step edit saved and sent to LangGraph for learning');
      }
    } catch (error) {
      console.error('Error saving step edit:', error);
    }
  };

  // 获取步骤反馈类型
  const getStepFeedbackType = (stepId) => {
    const feedbackTypes = {
      'website_analysis': 'strategy_rating',
      'marketing_strategy': 'strategy_rating',
      'email_generation': 'email_modification',
      'prospect_search': 'search_improvement'
    };
    return feedbackTypes[stepId] || 'strategy_rating';
  };

  // Format timestamp for logs
  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  // Sidebar navigation
  const sidebarItems = [
    { id: 'workflow', icon: Activity, label: 'Real-time Workflow', active: activeView === 'workflow' },
    { id: 'research', icon: TrendingUp, label: 'Market Research', active: activeView === 'research' },
    { id: 'prospects', icon: Users, label: 'Prospect Management', count: realTimeData.totalProspects, active: activeView === 'prospects' },
    { id: 'emails', icon: Mail, label: 'Email Management', count: realTimeData.emailsSent, active: activeView === 'emails' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', active: activeView === 'analytics' },
    { id: 'learning', icon: Brain, label: 'AI Learning Center', active: activeView === 'learning' },
    { id: 'settings', icon: Settings, label: 'System Settings', active: activeView === 'settings' }
  ];

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex overflow-hidden">
      {/* Left sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Email Agent</h1>
              <p className="text-sm text-gray-500">AI Marketing System</p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  item.active 
                    ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.active ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* System status */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              workflowStatus === 'running' ? 'bg-orange-500 animate-pulse' :
              workflowStatus === 'completed' ? 'bg-green-500' :
              workflowStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {workflowStatus === 'running' ? 'Workflow Running' :
                 workflowStatus === 'completed' ? 'Workflow Completed' :
                 workflowStatus === 'error' ? 'Workflow Error' : 'System Ready'}
              </p>
              {realTimeData.lastUpdate && (
                <p className="text-xs text-gray-500">
                  Updated {realTimeData.lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find(item => item.id === activeView)?.label}
              </h2>
              
              {/* Real-time stats cards */}
              <div className="flex items-center space-x-4">
                <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-900">{realTimeData.totalProspects} Prospects</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">{realTimeData.emailsSent} Sent</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">{realTimeData.emailsReplied} Replies</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={startWorkflow}
                disabled={workflowStatus === 'running'}
                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all duration-200 font-semibold text-white text-sm"
              >
                {workflowStatus === 'running' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Running Campaign...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Campaign</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onReset}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-all duration-200 font-medium text-sm border border-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-gray-50">
          {activeView === 'workflow' && <EnhancedWorkflowView 
            steps={workflowSteps}
            currentStep={currentStep}
            workflowStatus={workflowStatus}
            onEditStep={handleEditStep}
            editingStep={editingStep}
            editData={editData}
            setEditData={setEditData}
            onSaveEdit={saveStepEdit}
            onCancelEdit={() => setEditingStep(null)}
            selectedLogStep={selectedLogStep}
            setSelectedLogStep={setSelectedLogStep}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
            fullscreenLog={fullscreenLog}
            setFullscreenLog={setFullscreenLog}
            logEndRef={logEndRef}
            formatLogTimestamp={formatLogTimestamp}
            getLogLevelColor={getLogLevelColor}
          />}

          {activeView === 'research' && <MarketingResearchWindow />}
          
          {activeView === 'prospects' && <ProspectsView 
            clients={realTimeData.activeClients}
            onClientEdit={(client) => {/* Implement client editing */}}
          />}
          
          {activeView === 'emails' && <EmailManagementView 
            workflowSteps={workflowSteps}
            onEmailEdit={(emailId, emailData) => {/* Implement email editing feedback */}}
          />}
          
          {activeView === 'analytics' && <AnalyticsView 
            data={realTimeData}
            steps={workflowSteps}
          />}
          
          {activeView === 'learning' && <LearningCenterView 
            workflowSteps={workflowSteps}
          />}
        </div>
      </div>
    </div>
  );
};

// Enhanced Workflow view component with GitHub CI/CD-style logs
const EnhancedWorkflowView = ({ 
  steps, 
  currentStep, 
  workflowStatus, 
  onEditStep, 
  editingStep, 
  editData, 
  setEditData, 
  onSaveEdit, 
  onCancelEdit,
  selectedLogStep,
  setSelectedLogStep,
  autoScroll,
  setAutoScroll,
  fullscreenLog,
  setFullscreenLog,
  logEndRef,
  formatLogTimestamp,
  getLogLevelColor
}) => {
  const [expandedSteps, setExpandedSteps] = useState({});

  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Hunter.io style header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Workflow</h1>
        <p className="text-gray-600">AI-powered marketing automation pipeline based on real-time workflow log in the backend</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <>
        <div className="relative space-y-4">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isEditing = editingStep === step.id;
            const isExpanded = expandedSteps[step.id];
            const hasResults = step.results && Object.keys(step.results).length > 0;
            const isSelected = selectedLogStep === step.id;
            const isCompleted = step.status === 'completed';
            const isRunning = step.status === 'running';
            const hasLogs = step.logs && step.logs.length > 0;

            return (
              <div key={step.id} className={`relative bg-white border rounded-xl transition-all duration-500 shadow-sm hover:shadow-lg ${
                isActive ? 'border-orange-300 ring-2 ring-orange-100 transform scale-102' : 
                isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
              } ${isRunning ? 'animate-pulse' : ''}`}>
                
                {/* Connection node */}
                <div className={`absolute -left-3 top-6 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                  isCompleted ? 'border-green-500 bg-green-500' :
                  isRunning ? 'border-orange-500 bg-orange-500 animate-pulse' :
                  step.status === 'error' ? 'border-red-500 bg-red-500' :
                  'border-gray-300'
                }`}>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                  {isRunning && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                  {step.status === 'error' && <XCircle className="w-3 h-3 text-white" />}
                  {step.status === 'pending' && <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                </div>

                {/* Activity indicator for logs */}
                {hasLogs && isRunning && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-bounce">
                    <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                )}

                <div className="p-6">
                  {/* Step header - clickable */}
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer group"
                    onClick={() => {
                      toggleStep(step.id);
                      setSelectedLogStep(step.id);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'running' ? 'bg-orange-100 text-orange-600 animate-pulse' :
                        step.status === 'error' ? 'bg-red-100 text-red-600 animate-shake' :
                        'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600">{step.subtitle}</p>
                        
                        {/* Real-time status message */}
                        {isRunning && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="text-xs text-orange-600 font-medium">Processing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Status indicators with animations */}
                      {step.status === 'completed' && (
                        <div className="flex items-center space-x-1 animate-fadeIn">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Done</span>
                        </div>
                      )}
                      {step.status === 'running' && (
                        <div className="flex items-center space-x-1">
                          <Loader className="w-6 h-6 text-orange-600 animate-spin" />
                          <span className="text-xs text-orange-600 font-medium">Running</span>
                        </div>
                      )}
                      {step.status === 'error' && (
                        <div className="flex items-center space-x-1 animate-shake">
                          <XCircle className="w-6 h-6 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">Failed</span>
                        </div>
                      )}
                      {step.status === 'pending' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-6 h-6 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">Waiting</span>
                        </div>
                      )}

                      {/* Live log indicator */}
                      {hasLogs && (
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                          isRunning ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <div className="flex items-center space-x-1">
                            {isRunning && <Activity className="w-3 h-3" />}
                            <span>{step.logs.length} logs</span>
                          </div>
                        </div>
                      )}

                      {/* User edit indicator */}
                      {step.userEdited && (
                        <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg border border-orange-200 animate-fadeIn">
                          User Edited
                        </div>
                      )}
                    </div>
                  </div>

                {/* Progress bar */}
                {step.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{step.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results display and editing - only show when expanded */}
                {isExpanded && hasResults && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Execution Results
                      </h4>
                      {step.allowEdit && !isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditStep(step.id);
                          }}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <StepEditForm 
                        stepId={step.id}
                        data={editData}
                        onChange={setEditData}
                        onSave={() => onSaveEdit(step.id)}
                        onCancel={onCancelEdit}
                      />
                    ) : (
                      <StepResultDisplay 
                        stepId={step.id}
                        results={step.results}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-full">
          {selectedLogStep === 'website_analysis' ? (
            <WebsiteAnalysisVisualizer
              logs={steps.find(s => s.id === 'website_analysis')?.logs || []}
              isStreaming={workflowStatus === 'running' && currentStep === 'website_analysis'}
              className="h-full"
            />
          ) : (
            <AnimatedLogViewer
              logs={selectedLogStep ? steps.find(s => s.id === selectedLogStep)?.logs || [] : []}
              title={`${selectedLogStep ? steps.find(s => s.id === selectedLogStep)?.title : 'Workflow'} Logs`}
              isStreaming={workflowStatus === 'running' && currentStep === selectedLogStep}
              className="h-full"
            />
          )}
        </div>
        </>
      </div>
    </div>
  );
};

// 步骤结果显示组件 (unchanged)
const StepResultDisplay = ({ stepId, results }) => {
  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Company Name:</span>
            <p className="text-gray-900 font-medium">{results.companyName}</p>
          </div>
          <div>
            <span className="text-gray-600">Industry:</span>
            <p className="text-gray-900 font-medium">{results.industry}</p>
          </div>
        </div>
        <div>
          <span className="text-gray-600">Value Proposition:</span>
          <p className="text-gray-700 mt-1">{results.valueProposition}</p>
        </div>
      </div>
    );
  }

  if (stepId === 'marketing_strategy') {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-600">Target Audience:</span>
          <p className="text-gray-900 font-medium">{results.target_audience?.type}</p>
        </div>
        {results.target_audience?.search_keywords && (
          <div>
            <span className="text-gray-600">Search Keywords:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {results.target_audience.search_keywords.primary_keywords?.map((keyword, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-gray-600 text-sm">Processing...</div>;
};

// Step edit form (unchanged)
const StepEditForm = ({ stepId, data, onChange, onSave, onCancel }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Company Name</label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full bg-white text-gray-900 text-sm p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onSave} 
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Learn</span>
          </button>
          <button 
            onClick={onCancel} 
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return <div className="text-gray-600">Edit functionality under development...</div>;
};

// Other views (unchanged)
const ProspectsView = ({ clients, onClientEdit }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients?.map((client, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{client.company || 'Unknown Company'}</h3>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
            <button
              onClick={() => onClientEdit(client)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmailManagementView = ({ workflowSteps, onEmailEdit }) => {
  const emailStep = workflowSteps.find(step => step.id === 'email_generation');
  const emails = emailStep?.results?.emails || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Email Campaign Overview</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{emails.length}</p>
            <p className="text-sm text-gray-600">Generated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsView = ({ data, steps }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Workflow Analytics</h3>
    </div>
  </div>
);

const LearningCenterView = ({ workflowSteps }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2" />
        AI Learning & Optimization Progress
      </h3>
    </div>
  </div>
);

export default EnhancedRealTimeWorkflowDashboard;