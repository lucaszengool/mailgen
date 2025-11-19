import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Settings, Users, Target, Search, Mail, 
  Eye, ChevronRight, ChevronDown, RefreshCw, Brain,
  Globe, MessageSquare, TrendingUp, Clock, AlertCircle,
  CheckCircle, Loader, FileText, Database, Send, Zap, X,
  Sparkles, BarChart3, UserCheck, Repeat, Home, Activity,
  List, MailCheck, ChevronLeft, Filter, Download, Upload
} from 'lucide-react';

const WorkflowDashboard = ({ agentConfig, onReset }) => {
  const [currentWorkflow, setCurrentWorkflow] = useState('website_analysis');
  const [wsConnection, setWsConnection] = useState(null);
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 'website_analysis',
      title: 'AI Agent',
      subtitle: 'Website Analysis',
      icon: Sparkles,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      status: 'pending',
      description: 'Analyze target website and identify opportunities',
      progress: 0,
      details: null,
      startTime: null,
      logs: [],
      results: null
    },
    {
      id: 'search_strategy',
      title: 'Strategy',
      subtitle: 'Marketing Strategy Generation',
      icon: Target,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      status: 'pending',
      description: 'Generate targeted search strategies',
      progress: 0,
      details: null,
      startTime: null,
      logs: [],
      results: null
    },
    {
      id: 'prospect_search',
      title: 'Prospect',
      subtitle: 'Prospect for new People',
      icon: Search,
      iconBg: 'bg-gray-500/20',
      iconColor: 'text-gray-400',
      status: 'pending', 
      description: 'Search and verify prospect emails',
      progress: 0,
      details: null,
      startTime: null,
      logs: [],
      results: null,
      stats: {
        maxPerCompany: 5,
        found: 0,
        targetRole: 'Marketers'
      }
    },
    {
      id: 'email_generation',
      title: 'Email Generation',
      subtitle: 'Creating Personalized Emails',
      icon: Send,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      status: 'pending',
      description: 'Generate personalized emails for prospects',
      progress: 0,
      results: null,
      logs: []
    },
    {
      id: 'email_sending',
      title: 'Email Sending',
      subtitle: 'Sending Email Campaign',
      icon: Mail,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      status: 'pending',
      description: 'Send emails to prospects',
      progress: 0,
      results: null,
      logs: []
    }
  ]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [realtimeActivities, setRealtimeActivities] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    isRunning: false,
    isPaused: false,
    currentTask: 'Ready to start...',
    lastUpdate: new Date(),
    performance: {
      tasksCompleted: 0,
      tasksTotal: 0,
      successRate: 0,
      avgTime: '0min'
    }
  });

  // Sidebar menu items
  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', active: false },
    { id: 'workflow', icon: Activity, label: 'Workflow', active: true },
    { id: 'prospects', icon: Users, label: 'Prospects', count: 0 },
    { id: 'emails', icon: Mail, label: 'Email Queue', count: 0 },
    { id: 'sent', icon: MailCheck, label: 'Sent Emails', count: 0 },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  // Fetch prospect count from knowledge base
  const fetchProspectCount = async () => {
    try {
      const response = await fetch('/api/knowledge-base/prospects/count');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSidebarItems(prev => prev.map(item => 
            item.id === 'prospects' ? { ...item, count: data.count } : item
          ));
        }
      }
    } catch (error) {
      console.error('Failed to fetch prospect count:', error);
    }
  };

  // Get real workflow status
  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch('/api/workflow/status');
      if (response.ok) {
        const workflowData = await response.json();
        
        if (workflowData.success && workflowData.data) {
          const { currentStep, steps, isRunning, lastUpdate } = workflowData.data;
          
          // Merge API data with local steps that have icons
          setWorkflowSteps(prevSteps => 
            prevSteps.map(prevStep => {
              const apiStep = steps.find(step => step.id === prevStep.id);
              if (apiStep) {
                // Use real backend data
                const updatedStep = { 
                  ...prevStep, 
                  ...apiStep, 
                  icon: prevStep.icon,
                  iconBg: prevStep.iconBg,
                  iconColor: prevStep.iconColor,
                  subtitle: prevStep.subtitle,
                  isLoop: prevStep.isLoop,
                  loopSteps: prevStep.loopSteps,
                  stats: prevStep.stats
                };

                // Use real results from backend
                if (apiStep.details) {
                  updatedStep.results = apiStep.details;
                  
                  // Update stats for prospect search if available
                  if (apiStep.id === 'prospect_search' && apiStep.details.totalFound) {
                    updatedStep.stats = {
                      ...prevStep.stats,
                      found: apiStep.details.totalFound
                    };
                  }
                }

                return updatedStep;
              }
              return prevStep;
            })
          );
          
          setCurrentWorkflow(currentStep);
          setAgentStatus(prev => ({
            ...prev,
            isRunning: isRunning,
            currentTask: getCurrentTaskFromWorkflow(steps, currentStep),
            lastUpdate: new Date(lastUpdate || Date.now()),
            performance: {
              tasksCompleted: steps.filter(s => s.status === 'completed').length,
              tasksTotal: steps.length,
              successRate: steps.length > 0 ? (steps.filter(s => s.status === 'completed').length / steps.length * 100) : 0,
              avgTime: calculateAverageTime(steps)
            }
          }));

          // Update real-time activities from backend logs
          const allLogs = steps.flatMap(step => 
            (step.logs || []).map(log => ({
              id: `${step.id}-${log.timestamp}`,
              timestamp: new Date(log.timestamp).toLocaleTimeString(),
              message: log.message,
              type: log.level === 'success' ? 'success' : log.level === 'error' ? 'error' : 'info',
              stepId: step.id
            }))
          );
          
          // Sort by timestamp and keep latest 10
          const sortedLogs = allLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
          
          setRealtimeActivities(sortedLogs);

          // Update sidebar counts
          const prospectStep = steps.find(s => s.id === 'prospect_search');
          if (prospectStep?.details?.totalFound) {
            setSidebarItems(prev => prev.map(item => 
              item.id === 'prospects' ? { ...item, count: prospectStep.details.totalFound } : item
            ));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
    }
  };

  // Real-time activities are now pulled from backend logs in fetchWorkflowStatus

  // Helper function to get current task description from workflow
  const getCurrentTaskFromWorkflow = (steps, currentStep) => {
    const step = steps.find(s => s.id === currentStep);
    if (!step) return 'Ready to start...';
    
    if (step.status === 'completed') return `${step.title} completed`;
    if (step.status === 'in_progress') return `${step.title} in progress...`;
    if (step.status === 'error') return `${step.title} encountered an error`;
    return `Ready to start ${step.title}`;
  };

  // Helper function to calculate average time from completed steps
  const calculateAverageTime = (steps) => {
    const completedSteps = steps.filter(s => s.status === 'completed' && s.startTime && s.endTime);
    if (completedSteps.length === 0) return '0min';
    
    const totalTime = completedSteps.reduce((total, step) => {
      return total + (new Date(step.endTime) - new Date(step.startTime));
    }, 0);
    
    const avgMs = totalTime / completedSteps.length;
    const avgMin = Math.round(avgMs / (1000 * 60) * 10) / 10;
    return `${avgMin}min`;
  };

  // Start workflow - connect to real workflow system
  const startWorkflow = async () => {
    try {
      // 🔥 FIX: Generate campaign ID to ensure proper email isolation
      const campaignId = `campaign_${Date.now()}`;
      const campaignName = 'Workflow Campaign';

      // Store campaign ID for later reference
      localStorage.setItem('currentCampaignId', campaignId);

      const response = await fetch('/api/workflow/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          campaignName: campaignName
        })
      });
      
      if (response.ok) {
        await fetchWorkflowStatus();
        setRealtimeActivities([{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: '🚀 Workflow started successfully',
          type: 'success'
        }]);
      }
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  // Toggle workflow (pause/resume)
  const toggleWorkflow = async () => {
    try {
      const action = agentStatus.isRunning ? 'pause' : 'resume';
      const response = await fetch(`/api/workflow/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchWorkflowStatus();
        setRealtimeActivities(prev => [{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          message: agentStatus.isRunning ? '⏸️ Workflow paused' : '▶️ Workflow resumed',
          type: 'warning'
        }, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  // Reset workflow
  const resetWorkflow = async () => {
    try {
      const response = await fetch('/api/workflow/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchWorkflowStatus();
        setRealtimeActivities([]);
        setSelectedStep(null);
      }
    } catch (error) {
      console.error('Failed to reset workflow:', error);
    }
  };

  // Poll for workflow updates
  useEffect(() => {
    fetchWorkflowStatus();
    fetchProspectCount();
    const interval = setInterval(fetchWorkflowStatus, 2000);
    const prospectInterval = setInterval(fetchProspectCount, 5000);
    
    // REAL-TIME WEBSOCKET CONNECTION FOR LIVE LOGS
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3333');
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected for real-time logs');
        setWsConnection(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'log_update') {
            // Add new log entry with timestamp
            const newLog = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              message: data.message,
              level: data.level || 'info',
              stepId: data.stepId,
              type: data.level === 'success' ? 'success' : data.level === 'error' ? 'error' : 'info'
            };
            
            // Add to real-time logs (keep last 50 entries)
            setRealtimeLogs(prev => [newLog, ...prev].slice(0, 50));
            
            // Also update the realtime activities
            setRealtimeActivities(prev => [newLog, ...prev].slice(0, 15));
            
            // CRITICAL: Update the specific workflow step with the new log
            if (data.stepId) {
              setWorkflowSteps(prevSteps => 
                prevSteps.map(step => 
                  step.id === data.stepId 
                    ? {
                        ...step,
                        logs: [
                          ...(step.logs || []),
                          {
                            time: newLog.timestamp,
                            message: data.message,
                            level: data.level || 'info',
                            timestamp: data.timestamp || new Date().toISOString()
                          }
                        ],
                        status: data.level === 'success' && data.message.includes('completed') ? 'completed' : 
                               step.logs?.length === 0 ? 'in_progress' : step.status,
                        progress: data.level === 'success' && data.message.includes('completed') ? 100 : 
                                 step.status === 'in_progress' ? Math.min((step.logs?.length || 0) * 20 + 20, 90) : step.progress
                      }
                    : step
                )
              );
            }
            
            console.log('📡 New real-time log:', newLog);
          } else if (data.type === 'workflow_update') {
            // Trigger workflow status update
            fetchWorkflowStatus();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, attempting to reconnect...');
        setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    
    connectWebSocket();
    
    return () => {
      clearInterval(interval);
      clearInterval(prospectInterval);
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const getStatusDot = (status) => {
    switch(status) {
      case 'in_progress':
        return 'bg-yellow-400 animate-pulse';
      case 'completed':
        return 'bg-cyan-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-600';
    }
  };

  const WorkflowNode = ({ step }) => {
    const isActive = step.status === 'in_progress';
    const isCompleted = step.status === 'completed';
    const isSelected = selectedStep?.id === step.id;
    
    return (
      <div 
        className={`
          relative bg-gray-900/50 border rounded-xl p-5 cursor-pointer
          transition-all duration-200 
          ${isActive ? 'ring-2 ring-yellow-400/30 border-yellow-400/50' : 'border-gray-700'}
          ${isSelected ? 'ring-2 ring-blue-400/50 border-blue-400/50' : ''}
          hover:bg-gray-900/70 hover:border-gray-600
        `}
        onClick={() => {
          setSelectedStep(step);
          setShowDetailModal(true);
        }}
      >
        {/* Status Dot */}
        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${getStatusDot(step.status)}`} />
        
        {/* Content */}
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`p-3 rounded-lg ${step.iconBg} ${step.iconColor}`}>
            <step.icon className="w-6 h-6" />
          </div>
          
          {/* Text Content */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">{step.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{step.subtitle}</p>
            
            {/* Real-time Activity */}
            {isActive && (
              <div className="mt-2 text-xs text-yellow-400 flex items-center space-x-2">
                <Loader className="w-3 h-3 animate-spin" />
                <span>Processing... {step.progress}% complete</span>
              </div>
            )}
            
            {/* Results Preview */}
            {step.results && (
              <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-300">
                  {step.id === 'website_analysis' && (
                    <>
                      <div>Industry: {step.results.industry || 'Unknown'}</div>
                      <div>Target Audience: {step.results.targetAudience || 'N/A'}</div>
                      <div>Market Size: {step.results.marketSize || 'N/A'}</div>
                      <div>Competitors: {step.results.competitors?.length || 0}</div>
                    </>
                  )}
                  {step.id === 'search_strategy' && (
                    <>
                      <div>Keywords: {step.results.primaryKeywords?.length || step.results.keywords?.length || 0}</div>
                      <div>Reach: {step.results.estimatedReach || 'N/A'}</div>
                      <div>Queries: {step.results.searchQueries?.length || 0}</div>
                    </>
                  )}
                  {step.id === 'prospect_search' && (
                    <>
                      <div>Found: {step.results.totalFound || 0}</div>
                      <div>Verified: {step.results.verified || 0}</div>
                      <div>Quality: {step.results.qualityScore || 'N/A'}</div>
                    </>
                  )}
                  {step.id === 'email_generation' && step.results && (
                    <>
                      <div>Generated: {step.results.generated || 0}</div>
                      <div>Personalized: {step.results.personalized || 0}</div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Stats */}
            {step.stats && (
              <div className="flex items-center space-x-4 mt-3">
                {step.stats.maxPerCompany && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-sm">Max. {step.stats.maxPerCompany} per Co.</span>
                  </div>
                )}
                {step.stats.targetRole && (
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-sm">{step.stats.targetRole}</span>
                  </div>
                )}
                {step.stats.found > 0 && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-400 text-sm">{step.stats.found} found</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Real-time Logs (GitHub Actions Style) */}
            {(isActive || (step.logs && step.logs.length > 0)) && (
              <div className="mt-3">
                <div className="bg-black/50 rounded-lg border border-gray-700 font-mono text-xs">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">Live Logs</span>
                    </div>
                    {isActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs">Running</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 max-h-24 overflow-y-auto">
                    {(!step.logs || step.logs.length === 0) ? (
                      <div className="text-gray-500 text-center py-2">
                        {isActive ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader className="w-3 h-3 animate-spin" />
                            <span>Waiting for logs...</span>
                          </div>
                        ) : (
                          <span>No logs available</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {step.logs.slice(-3).map((log, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs">
                            <span className="text-gray-500 whitespace-nowrap">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                            </span>
                            <div className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${
                              log.level === 'success' ? 'bg-green-400' :
                              log.level === 'error' ? 'bg-red-400' :
                              log.level === 'warning' ? 'bg-yellow-400' :
                              'bg-blue-400'
                            }`} />
                            <span className={`flex-1 ${
                              log.level === 'success' ? 'text-green-300' :
                              log.level === 'error' ? 'text-red-300' :
                              log.level === 'warning' ? 'text-yellow-300' :
                              'text-gray-300'
                            }`}>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            {isActive && (
              <div className="mt-3">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-500"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ConnectionLine = ({ type = 'solid', color = 'yellow' }) => {
    const lineColor = color === 'yellow' ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const dotColor = color === 'yellow' ? 'bg-yellow-400' : 'bg-cyan-400';
    
    return (
      <div className="relative flex items-center justify-center h-16">
        <div className={`absolute w-0.5 h-full border-l-2 ${type === 'dotted' ? 'border-dashed' : ''} ${lineColor}`} />
        {type === 'solid' && (
          <>
            <div className={`absolute top-0 w-2 h-2 rounded-full ${dotColor} -ml-1`} />
            <div className={`absolute bottom-0 w-2 h-2 rounded-full ${dotColor} -ml-1`} />
          </>
        )}
      </div>
    );
  };

  const DetailModal = () => {
    if (!selectedStep || !showDetailModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
          {/* Modal Header */}
          <div className="border-b border-gray-700 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${selectedStep.iconBg} ${selectedStep.iconColor}`}>
                <selectedStep.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedStep.title}</h2>
                <p className="text-sm text-gray-400">{selectedStep.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Status */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusDot(selectedStep.status)}`} />
                <span className="text-white capitalize">{selectedStep.status.replace('_', ' ')}</span>
                {selectedStep.progress > 0 && (
                  <span className="text-gray-400">({selectedStep.progress}%)</span>
                )}
              </div>
            </div>
            
            {/* Results */}
            {selectedStep.results && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Results</h3>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedStep.results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* REAL-TIME LOGS - GITHUB ACTIONS STYLE */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400">Real-Time Workflow Logs</h3>
                <div className="flex items-center space-x-2">
                  {wsConnection && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Live</span>
                    </div>
                  )}
                  <button 
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                    onClick={() => setRealtimeLogs([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Terminal-style log container */}
              <div className="bg-black/80 rounded-lg border border-gray-700 overflow-hidden">
                <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-400 ml-2">Campaign Workflow Terminal</span>
                  </div>
                </div>
                
                <div className="p-4 max-h-80 overflow-y-auto font-mono text-sm">
                  {realtimeLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Waiting for workflow logs...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {realtimeLogs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-3 group hover:bg-gray-800/30 px-2 py-1 rounded">
                          <span className="text-gray-500 text-xs whitespace-nowrap mt-0.5">
                            {log.timestamp}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                            log.type === 'success' ? 'bg-green-400' :
                            log.type === 'error' ? 'bg-red-400' :
                            log.type === 'warning' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`} />
                          <span className={`flex-1 break-words ${
                            log.type === 'success' ? 'text-green-300' :
                            log.type === 'error' ? 'text-red-300' :
                            log.type === 'warning' ? 'text-yellow-300' :
                            'text-gray-300'
                          }`}>
                            {log.message}
                          </span>
                          {log.stepId && (
                            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {log.stepId}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Auto-scroll indicator */}
                {realtimeLogs.length > 0 && (
                  <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{realtimeLogs.length} log entries</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                        <span>Auto-scrolling enabled</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step-specific logs (if available) */}
            {selectedStep.logs && selectedStep.logs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Step Activity History</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  {selectedStep.logs.map((log, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      <span className="text-gray-500">{log.time}</span>
                      <span className="ml-2">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Export Results
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Retry Step
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden flex">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 border-r border-gray-700 transition-all duration-300`}>
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center space-x-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg">
                <Zap className="w-6 h-6 text-gray-900" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  AI Agent
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Menu Items */}
          <nav className="space-y-2">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  item.active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">AI Marketing Workflow</h1>
                <p className="text-gray-400 text-sm">Automated Email Campaign Pipeline</p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  agentStatus.isRunning ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {agentStatus.isRunning ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Running</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Idle</span>
                    </>
                  )}
                </div>
                
                {/* Control Buttons */}
                <button
                  onClick={agentStatus.isRunning ? toggleWorkflow : startWorkflow}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                    agentStatus.isRunning 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {agentStatus.isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetWorkflow}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center space-x-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
                
                <button
                  onClick={onReset}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Workflow Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              {/* Workflow Steps */}
              <div className="space-y-0">
                {/* Step 1: AI Agent */}
                <WorkflowNode step={workflowSteps[0]} />
                
                <ConnectionLine 
                  type="solid" 
                  color={workflowSteps[0].status === 'completed' ? 'cyan' : 'yellow'} 
                />
                
                {/* Step 2: Strategy */}
                <WorkflowNode step={workflowSteps[1]} />
                
                <ConnectionLine 
                  type="solid" 
                  color={workflowSteps[1].status === 'completed' ? 'cyan' : 'yellow'} 
                />
                
                {/* Step 3: Prospect */}
                <WorkflowNode step={workflowSteps[2]} />
                
                <ConnectionLine 
                  type="solid" 
                  color={workflowSteps[2].status === 'completed' ? 'cyan' : 'yellow'} 
                />
                
                {/* Step 4: Email Generation */}
                <WorkflowNode step={workflowSteps[3]} />
                
                <ConnectionLine 
                  type="solid" 
                  color={workflowSteps[3].status === 'completed' ? 'cyan' : 'yellow'} 
                />
                
                {/* Step 5: Email Sending */}
                <WorkflowNode step={workflowSteps[4]} />
              </div>
            </div>
          </div>
          
          {/* Right Panel - Real-time Activity */}
          <div className="w-96 border-l border-gray-700 bg-gray-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Real-time Activity
            </h3>
            
            {/* Activity Feed */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {realtimeActivities.length > 0 ? (
                realtimeActivities.map(activity => (
                  <div key={activity.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                      {activity.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 ml-2" />}
                      {activity.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-400 ml-2" />}
                      {activity.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 ml-2" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs mt-1">Start the workflow to see real-time updates</p>
                </div>
              )}
            </div>
            
            {/* Performance Metrics */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Completed</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {agentStatus.performance.tasksCompleted}/{agentStatus.performance.tasksTotal}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className="text-xl font-bold text-green-400 mt-1">
                    {agentStatus.performance.successRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Avg Time</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">
                    {agentStatus.performance.avgTime}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-sm font-medium text-yellow-400 mt-1 truncate">
                    {agentStatus.currentTask}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      <DetailModal />
    </div>
  );
};

export default WorkflowDashboard;