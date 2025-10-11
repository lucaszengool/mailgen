import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, Settings, Users, Target, Search, Mail, 
  Eye, ChevronRight, ChevronDown, RefreshCw, Brain,
  Globe, MessageSquare, TrendingUp, Clock, AlertCircle,
  CheckCircle, Loader, FileText, Database, Send, Zap, X,
  Sparkles, BarChart3, UserCheck, Repeat, Home, Activity,
  Terminal, CheckCircle2, XCircle, AlertTriangle, Info,
  Circle, RotateCcw, Download, Maximize2, Minimize2
} from 'lucide-react';

const GitHubStyleWorkflowDashboard = ({ agentConfig, onReset }) => {
  // Core state management
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // idle, running, completed, error
  const [currentStep, setCurrentStep] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [selectedStep, setSelectedStep] = useState(null);
  const [logs, setLogs] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);
  const [fullscreenLog, setFullscreenLog] = useState(false);
  
  // WebSocket connection
  const wsRef = useRef(null);
  const logEndRefs = useRef({});
  const reconnectTimeoutRef = useRef(null);
  
  // Real-time statistics
  const [stats, setStats] = useState({
    totalProspects: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    duration: 0,
    startTime: null
  });
  
  // Timer for duration
  const timerRef = useRef(null);
  
  // Workflow steps with GitHub CI/CD style
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 'website_analysis',
      name: 'Website Analysis',
      description: 'Analyzing target website and business model',
      icon: Globe,
      status: 'pending', // pending, running, completed, failed, skipped
      duration: null,
      startTime: null,
      endTime: null,
      results: null,
      logs: [],
      expandable: true,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: 'marketing_strategy',
      name: 'Marketing Strategy',
      description: 'Generating AI-powered marketing strategy',
      icon: Target,
      status: 'pending',
      duration: null,
      startTime: null,
      endTime: null,
      results: null,
      logs: [],
      expandable: true,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: 'prospect_search',
      name: 'Prospect Discovery',
      description: 'Finding and validating potential leads',
      icon: Search,
      status: 'pending',
      duration: null,
      startTime: null,
      endTime: null,
      results: null,
      logs: [],
      expandable: true,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: 'email_generation',
      name: 'Email Campaign',
      description: 'Generating personalized emails',
      icon: Mail,
      status: 'pending',
      duration: null,
      startTime: null,
      endTime: null,
      results: null,
      logs: [],
      expandable: true,
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: 'email_sending',
      name: 'Send Emails',
      description: 'Sending campaign emails',
      icon: Send,
      status: 'pending',
      duration: null,
      startTime: null,
      endTime: null,
      results: null,
      logs: [],
      expandable: true,
      retryCount: 0,
      maxRetries: 3
    }
  ]);

  // WebSocket connection setup
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(`ws://localhost:3333`);
      
      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected for real-time workflow');
        addSystemLog('Connected to workflow server');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected, attempting reconnect...');
        addSystemLog('Connection lost, reconnecting...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        addSystemLog('Connection error');
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'log_update':
        addStepLog(data.stepId, {
          message: data.message,
          level: data.level || 'info',
          timestamp: data.timestamp || new Date().toISOString()
        });
        break;
        
      case 'workflow_update':
        updateWorkflowStep(data.stepId, data.stepData);
        break;
        
      case 'stage_start':
        handleStageStart(data.stage, data.data);
        break;
        
      case 'stage_complete':
        handleStageComplete(data.stage, data.data);
        break;
        
      case 'analytics_update':
        setStats(prev => ({ ...prev, ...data.data }));
        break;
        
      case 'status_update':
        setWorkflowStatus(data.status);
        setCurrentStep(data.currentStep);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Add log to a specific step
  const addStepLog = (stepId, log) => {
    setWorkflowSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updatedLogs = [...(step.logs || []), log];
        // Keep only last 1000 logs per step
        if (updatedLogs.length > 1000) {
          updatedLogs.shift();
        }
        return { ...step, logs: updatedLogs };
      }
      return step;
    }));
    
    // Auto scroll to bottom if enabled
    if (autoScroll && logEndRefs.current[stepId]) {
      setTimeout(() => {
        logEndRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Add system log
  const addSystemLog = (message) => {
    console.log(`[System] ${message}`);
  };

  // Handle stage start
  const handleStageStart = (stageId, data) => {
    setWorkflowSteps(prev => prev.map(step => {
      if (step.id === stageId) {
        return {
          ...step,
          status: 'running',
          startTime: new Date().toISOString(),
          logs: [{
            message: `Starting ${step.name}...`,
            level: 'info',
            timestamp: new Date().toISOString()
          }]
        };
      }
      return step;
    }));
    
    setCurrentStep(stageId);
    setSelectedStep(stageId);
    setExpandedSteps(prev => ({ ...prev, [stageId]: true }));
  };

  // Handle stage complete
  const handleStageComplete = (stageId, data) => {
    setWorkflowSteps(prev => prev.map(step => {
      if (step.id === stageId) {
        const endTime = new Date();
        const startTime = new Date(step.startTime);
        const duration = Math.round((endTime - startTime) / 1000);
        
        return {
          ...step,
          status: data.success ? 'completed' : 'failed',
          endTime: endTime.toISOString(),
          duration,
          results: data.results,
          logs: [...(step.logs || []), {
            message: data.success ? `✅ ${step.name} completed in ${duration}s` : `❌ ${step.name} failed`,
            level: data.success ? 'success' : 'error',
            timestamp: endTime.toISOString()
          }]
        };
      }
      return step;
    }));
  };

  // Update workflow step
  const updateWorkflowStep = (stepId, updates) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  // Start workflow
  const startWorkflow = async () => {
    try {
      setWorkflowStatus('running');
      setStats(prev => ({ ...prev, startTime: new Date() }));
      
      // Reset all steps
      setWorkflowSteps(prev => prev.map(step => ({
        ...step,
        status: 'pending',
        logs: [],
        duration: null,
        startTime: null,
        endTime: null,
        results: null
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
        console.log('✅ Workflow started successfully');
      } else {
        throw new Error(result.error || 'Workflow start failed');
      }
    } catch (error) {
      console.error('❌ Workflow start error:', error);
      setWorkflowStatus('error');
      addSystemLog(`Error: ${error.message}`);
    }
  };

  // Cancel workflow
  const cancelWorkflow = async () => {
    try {
      const response = await fetch('/api/langgraph-agent/cancel', {
        method: 'POST'
      });
      
      if (response.ok) {
        setWorkflowStatus('cancelled');
        addSystemLog('Workflow cancelled');
      }
    } catch (error) {
      console.error('Error cancelling workflow:', error);
    }
  };

  // Retry failed step
  const retryStep = async (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (!step || step.retryCount >= step.maxRetries) return;
    
    try {
      const response = await fetch('/api/langgraph-agent/retry-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId })
      });
      
      if (response.ok) {
        updateWorkflowStep(stepId, {
          status: 'running',
          retryCount: step.retryCount + 1,
          logs: [...step.logs, {
            message: `Retrying ${step.name} (attempt ${step.retryCount + 2}/${step.maxRetries})`,
            level: 'warning',
            timestamp: new Date().toISOString()
          }]
        });
      }
    } catch (error) {
      console.error('Error retrying step:', error);
    }
  };

  // Download logs
  const downloadLogs = () => {
    const allLogs = workflowSteps.reduce((acc, step) => {
      acc[step.id] = step.logs;
      return acc;
    }, {});
    
    const dataStr = JSON.stringify(allLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workflow-logs-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-400" />;
      case 'skipped':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Initialize WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    
    // Update duration timer
    timerRef.current = setInterval(() => {
      if (workflowStatus === 'running' && stats.startTime) {
        const duration = Math.round((new Date() - new Date(stats.startTime)) / 1000);
        setStats(prev => ({ ...prev, duration }));
      }
    }, 1000);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GitHub-style header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-6 h-6 text-gray-700" />
                <h1 className="text-xl font-semibold text-gray-900">Campaign Workflow</h1>
              </div>
              
              {/* Workflow status badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                workflowStatus === 'running' ? 'bg-blue-100 text-blue-700' :
                workflowStatus === 'completed' ? 'bg-green-100 text-green-700' :
                workflowStatus === 'error' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {workflowStatus === 'running' ? 'In Progress' :
                 workflowStatus === 'completed' ? 'Success' :
                 workflowStatus === 'error' ? 'Failed' : 'Ready'}
              </div>
              
              {/* Duration */}
              {stats.duration > 0 && (
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatDuration(stats.duration)}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              {workflowStatus === 'idle' && (
                <button
                  onClick={startWorkflow}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Workflow</span>
                </button>
              )}
              
              {workflowStatus === 'running' && (
                <button
                  onClick={cancelWorkflow}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
              
              {(workflowStatus === 'completed' || workflowStatus === 'error') && (
                <button
                  onClick={() => {
                    setWorkflowStatus('idle');
                    setStats({ totalProspects: 0, emailsSent: 0, emailsOpened: 0, emailsReplied: 0, duration: 0, startTime: null });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-run</span>
                </button>
              )}
              
              <button
                onClick={downloadLogs}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Logs</span>
              </button>
              
              <button
                onClick={onReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reset Config
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column - Workflow steps */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
              </div>
              
              <div className="p-4 space-y-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isSelected = selectedStep === step.id;
                  const isExpanded = expandedSteps[step.id];
                  
                  return (
                    <div
                      key={step.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedStep(step.id);
                        setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }));
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(step.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <p className="font-medium text-gray-900 truncate">{step.name}</p>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                          
                          {step.duration && (
                            <p className="text-xs text-gray-400 mt-1">
                              Duration: {formatDuration(step.duration)}
                            </p>
                          )}
                          
                          {step.status === 'failed' && step.retryCount < step.maxRetries && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                retryStep(step.id);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                            >
                              Retry ({step.retryCount}/{step.maxRetries})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Statistics */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prospects Found</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalProspects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <span className="text-sm font-medium text-gray-900">{stats.emailsSent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Opens</span>
                  <span className="text-sm font-medium text-gray-900">{stats.emailsOpened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Replies</span>
                  <span className="text-sm font-medium text-gray-900">{stats.emailsReplied}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Logs */}
          <div className="col-span-2">
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
              fullscreenLog ? 'fixed inset-4 z-50' : ''
            }`}>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Terminal className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedStep ? workflowSteps.find(s => s.id === selectedStep)?.name : 'Workflow'} Logs
                  </h2>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-gray-600">Auto-scroll</span>
                  </label>
                  
                  <button
                    onClick={() => setFullscreenLog(!fullscreenLog)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {fullscreenLog ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className={`p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto ${
                fullscreenLog ? 'h-[calc(100vh-8rem)]' : 'h-96'
              }`}>
                {selectedStep && workflowSteps.find(s => s.id === selectedStep)?.logs?.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 mb-1">
                    <span className="text-gray-500 text-xs">{formatTimestamp(log.timestamp)}</span>
                    <span className={`px-1 rounded text-xs font-semibold ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      log.level === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                )) || (
                  <div className="text-gray-500">No logs available. Select a job to view its logs.</div>
                )}
                
                <div ref={el => logEndRefs.current[selectedStep] = el} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubStyleWorkflowDashboard;