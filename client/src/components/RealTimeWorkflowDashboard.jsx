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
  CheckCircle2, XCircle, AlertTriangle, Info
} from 'lucide-react';
import MarketingResearchWindow from './MarketingResearchWindow';

const RealTimeWorkflowDashboard = ({ agentConfig, onReset }) => {
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

  // 工作流步骤状态
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
      editableFields: ['companyName', 'industry', 'valueProposition', 'targetMarket', 'keyFeatures']
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
      editableFields: ['targetAudience', 'searchKeywords', 'approach', 'messaging']
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
      allowEdit: false
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
      editableFields: ['subject', 'body', 'tone', 'callToAction']
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
      allowEdit: false
    }
  ]);

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
            return serverStep ? { ...step, ...serverStep } : step;
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
          
          if (data.type === 'workflow_update') {
            setWorkflowSteps(prev => prev.map(step => 
              step.id === data.stepId ? { ...step, ...data.stepData } : step
            ));
          } else if (data.type === 'analytics_update') {
            setRealTimeData(prev => ({ ...prev, ...data.data, lastUpdate: new Date() }));
          } else if (data.type === 'status_update') {
            setWorkflowStatus(data.status);
            setCurrentStep(data.currentStep);
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
  }, []);

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
          {activeView === 'workflow' && <WorkflowView 
            steps={workflowSteps}
            currentStep={currentStep}
            workflowStatus={workflowStatus}
            onEditStep={handleEditStep}
            editingStep={editingStep}
            editData={editData}
            setEditData={setEditData}
            onSaveEdit={saveStepEdit}
            onCancelEdit={() => setEditingStep(null)}
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

// Workflow view component  
const WorkflowView = ({ 
  steps, 
  currentStep, 
  workflowStatus, 
  onEditStep, 
  editingStep, 
  editData, 
  setEditData, 
  onSaveEdit, 
  onCancelEdit 
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
        <p className="text-gray-600">AI-powered marketing automation pipeline</p>
      </div>

      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isEditing = editingStep === step.id;
        const isExpanded = expandedSteps[step.id];
        const hasResults = step.results && Object.keys(step.results).length > 0;

        return (
          <div key={step.id} className={`bg-white border rounded-xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg ${
            isActive ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200'
          }`}>
            {/* Step header - clickable */}
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => toggleStep(step.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'running' ? 'bg-orange-100 text-orange-600' :
                  step.status === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Status indicators */}
                {step.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {step.status === 'running' && <Loader className="w-6 h-6 text-orange-600 animate-spin" />}
                {step.status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
                {step.status === 'pending' && <Clock className="w-6 h-6 text-gray-500" />}

                {/* Expand indicator */}
                <div className={`transform transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>

                {/* User edit indicator */}
                {step.userEdited && (
                  <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg border border-orange-200">
                    User Edited
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar - only show when expanded or active */}
            {(isExpanded || isActive) && step.progress > 0 && (
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
  );
};

// 步骤结果显示组件
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
        {results.keyFeatures && Array.isArray(results.keyFeatures) && (
          <div>
            <span className="text-gray-600">Key Features:</span>
            <ul className="text-gray-700 mt-1 list-disc list-inside">
              {results.keyFeatures.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
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

  if (stepId === 'prospect_search') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Prospects Found:</span>
          <span className="text-2xl font-bold text-green-600">{results.totalFound || results.length || 0}</span>
        </div>
        {results.prospects?.slice(0, 5).map((prospect, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div>
              <p className="text-gray-900 font-medium">{prospect.company || 'Unknown Company'}</p>
              <p className="text-gray-600 text-sm">{prospect.email}</p>
            </div>
            {prospect.qualityScore && (
              <div className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded">
                Quality: {prospect.qualityScore}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (stepId === 'email_generation') {
    return <EmailGenerationResults results={results} />;
  }

  return <div className="text-gray-600 text-sm">Processing...</div>;
};

// Email generation results display
const EmailGenerationResults = ({ results }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Generated Emails:</span>
        <span className="text-2xl font-bold text-blue-600">{results.emails?.length || 0}</span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.emails?.map((emailData, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div 
              className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedEmail(selectedEmail === i ? null : i)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-sm">
                    {emailData.prospect?.company || 'Unknown Company'}
                  </p>
                  <p className="text-gray-600 text-xs">{emailData.prospect?.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {emailData.email_content?.qualityScore && (
                    <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded">
                      {emailData.email_content.qualityScore}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${
                    selectedEmail === i ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            </div>
            
            {selectedEmail === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Subject:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded p-2">
                    {emailData.email_content?.subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Content:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                    {emailData.email_content?.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Step edit form
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
        <div>
          <label className="block text-xs text-gray-600 mb-1">Industry</label>
          <input
            type="text"
            value={data.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full bg-white text-gray-900 text-sm p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Value Proposition</label>
          <textarea
            value={data.valueProposition || ''}
            onChange={(e) => handleChange('valueProposition', e.target.value)}
            rows={4}
            className="w-full bg-white text-gray-900 text-sm p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onSave} 
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Learn</span>
          </button>
          <button 
            onClick={onCancel} 
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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

// Prospects management view
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
          
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-lg">
              {client.industry || 'Uncategorized'}
            </span>
            {client.qualityScore && (
              <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-1 rounded-lg">
                Quality: {client.qualityScore}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Email management view
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
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {emails.filter(e => e.status === 'sent').length}
            </p>
            <p className="text-sm text-gray-600">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {emails.filter(e => e.status === 'opened').length}
            </p>
            <p className="text-sm text-gray-600">Opened</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {emails.filter(e => e.status === 'replied').length}
            </p>
            <p className="text-sm text-gray-600">Replied</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {emails.map((emailData, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{emailData.prospect?.company}</h4>
                <p className="text-sm text-gray-600">{emailData.prospect?.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                  emailData.status === 'sent' ? 'bg-green-100 text-green-700 border-green-200' :
                  emailData.status === 'opened' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  emailData.status === 'replied' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {emailData.status || 'draft'}
                </span>
                <button
                  onClick={() => onEmailEdit(i, emailData)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600">Subject: <span className="text-gray-900">{emailData.email_content?.subject}</span></p>
              <p className="text-gray-700 mt-1 truncate">{emailData.email_content?.body?.substring(0, 100)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Analytics view
const AnalyticsView = ({ data, steps }) => (
  <div className="space-y-6">
    {/* Overall statistics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={Users} 
        title="Total Prospects" 
        value={data.totalProspects} 
        color="blue"
        change="+12%"
      />
      <StatCard 
        icon={Mail} 
        title="Emails Sent" 
        value={data.emailsSent} 
        color="green"
        change="+8%"
      />
      <StatCard 
        icon={Eye} 
        title="Open Rate" 
        value={`${Math.round((data.emailsOpened / data.emailsSent) * 100) || 0}%`} 
        color="yellow"
        change="+5%"
      />
      <StatCard 
        icon={TrendingUp} 
        title="Reply Rate" 
        value={`${Math.round((data.emailsReplied / data.emailsSent) * 100) || 0}%`} 
        color="purple"
        change="+15%"
      />
    </div>

    {/* Workflow efficiency analysis */}
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Workflow Efficiency Analysis</h3>
      
      <div className="space-y-4">
        {steps.map(step => (
          <div key={step.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                step.status === 'running' ? 'bg-blue-600/20 text-blue-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className="text-gray-900 font-medium">{step.title}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                {step.endTime && step.startTime && (
                  <p className="text-sm text-gray-600">
                    Duration: {Math.round((new Date(step.endTime) - new Date(step.startTime)) / 1000)}s
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {step.status === 'completed' ? 'Completed' :
                   step.status === 'running' ? 'Running' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Learning center view
const LearningCenterView = ({ workflowSteps }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2" />
        AI Learning & Optimization Progress
      </h3>
      
      <div className="space-y-4">
        <LearningProgress title="Search Optimization" progress={85} />
        <LearningProgress title="Email Optimization" progress={72} />
        <LearningProgress title="Strategy Optimization" progress={91} />
        <LearningProgress title="Customer Identification" progress={78} />
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">User Feedback History</h3>
      
      <div className="space-y-3">
        {workflowSteps
          .filter(step => step.userEdited)
          .map(step => (
            <div key={step.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div>
                <p className="text-gray-900 font-medium">{step.title}</p>
                <p className="text-sm text-gray-600">
                  Last edited: {new Date(step.lastModified || Date.now()).toLocaleString()}
                </p>
              </div>
              <div className="text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

// Statistics card component - Hunter.io style
const StatCard = ({ icon: Icon, title, value, color, change }) => {
  const colorClasses = {
    blue: 'border-orange-200 bg-orange-50',
    green: 'border-gray-200 bg-white',
    yellow: 'border-gray-200 bg-white', 
    purple: 'border-gray-200 bg-white'
  };

  const iconColorClasses = {
    blue: 'text-orange-600',
    green: 'text-gray-600',
    yellow: 'text-gray-600',
    purple: 'text-gray-600'
  };

  const textColorClasses = {
    blue: 'text-orange-900',
    green: 'text-gray-900',
    yellow: 'text-gray-900',
    purple: 'text-gray-900'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${textColorClasses[color]} opacity-80`}>{title}</p>
          <p className={`text-2xl font-bold ${textColorClasses[color]}`}>{value}</p>
          {change && (
            <p className={`text-xs ${textColorClasses[color]} opacity-70 mt-1`}>{change}</p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
      </div>
    </div>
  );
};

// Learning progress component
const LearningProgress = ({ title, progress }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-700">{title}</span>
      <span className="text-blue-600 font-semibold">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default RealTimeWorkflowDashboard;