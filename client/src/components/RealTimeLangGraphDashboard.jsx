import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Brain, Zap, TrendingUp, Mail, Search, Target, BarChart3, User, 
  Linkedin, Eye, ExternalLink, CheckCircle, Clock, AlertCircle, 
  Activity, MessageSquare, RefreshCw, PlayCircle, StopCircle,
  Globe, Users, Send, BarChart, Lightbulb, Settings
} from 'lucide-react';

const RealTimeLangGraphDashboard = () => {
  // WebSocket connection and state
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [workflowState, setWorkflowState] = useState({
    status: 'idle', // idle, running, completed, error
    currentStep: null,
    steps: {},
    analytics: {},
    notifications: [],
    logs: {}
  });
  
  // Campaign execution state  
  const [campaignForm, setCampaignForm] = useState({
    targetWebsite: 'https://fruitai.org',
    campaignGoal: 'partnership',
    businessType: 'technology'
  });
  
  // Results state
  const [campaignResults, setCampaignResults] = useState({
    businessAnalysis: null,
    marketingStrategy: null,
    prospects: [],
    emailCampaign: null
  });
  
  // UI state
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // workflow, results, analytics
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [selectedStepLogs, setSelectedStepLogs] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket connection management
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      setWsStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/workflow`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setWsStatus('connected');
        
        // Request current status
        sendMessage({ type: 'request_status' });
        
        // Send periodic pings
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            sendMessage({ type: 'ping' });
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setWsStatus('disconnected');
        
        // Attempt reconnection after 3 seconds
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsStatus('disconnected');
      };
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      setWsStatus('disconnected');
      
      // Retry connection
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket message:', data.type, data);
    
    switch (data.type) {
      case 'status_update':
        setWorkflowState(prev => ({
          ...prev,
          status: data.status,
          currentStep: data.currentStep,
          steps: data.steps ? Object.fromEntries(data.steps.map(s => [s.id, s])) : prev.steps
        }));
        break;
        
      case 'workflow_update':
        setWorkflowState(prev => ({
          ...prev,
          steps: {
            ...prev.steps,
            [data.stepId]: {
              ...prev.steps[data.stepId],
              ...data.stepData
            }
          }
        }));
        break;
        
      case 'notification':
        setWorkflowState(prev => ({
          ...prev,
          notifications: [
            { 
              id: Date.now(), 
              message: data.message, 
              type: data.notificationType,
              timestamp: data.timestamp 
            },
            ...prev.notifications.slice(0, 4) // Keep only 5 most recent
          ]
        }));
        break;
        
      case 'log_update':
        setWorkflowState(prev => ({
          ...prev,
          logs: {
            ...prev.logs,
            [data.stepId]: [
              ...(prev.logs[data.stepId] || []),
              {
                message: data.message,
                level: data.level,
                timestamp: data.timestamp
              }
            ].slice(-50) // Keep only last 50 logs per step for detailed view
          }
        }));
        break;
        
      case 'analytics_update':
        setWorkflowState(prev => ({
          ...prev,
          analytics: { ...prev.analytics, ...data.data }
        }));
        break;
        
      case 'clients_update':
        setCampaignResults(prev => ({
          ...prev,
          prospects: data.clients || []
        }));
        break;
        
      case 'pong':
        // Handle ping response
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Execute campaign with real-time updates
  const executeCampaign = async () => {
    try {
      console.log('🚀 Starting campaign execution with real-time tracking...');
      
      const response = await fetch('/api/langgraph-agent/execute-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Campaign started, tracking via WebSocket');
        // Real-time updates will come through WebSocket
      } else {
        console.error('❌ Campaign execution failed:', result.error);
        alert(`Campaign failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Campaign execution error:', error);
      alert('Failed to start campaign');
    }
  };

  // Get step status icon
  const getStepIcon = (step) => {
    if (!step) return <Clock className="w-4 h-4 text-gray-400" />;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get step color
  const getStepColor = (step) => {
    if (!step) return 'bg-gray-100';
    
    switch (step.status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'running':
        return 'bg-blue-100 border-blue-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  // Define workflow steps
  const workflowSteps = [
    { id: 'website_analysis', title: 'Website Analysis', icon: <Globe className="w-5 h-5" /> },
    { id: 'marketing_strategy', title: 'Marketing Strategy', icon: <Target className="w-5 h-5" /> },
    { id: 'prospect_search', title: 'Prospect Search', icon: <Users className="w-5 h-5" /> },
    { id: 'email_generation', title: 'Email Generation', icon: <Mail className="w-5 h-5" /> }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with WebSocket Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LangGraph AI Marketing Agent</h1>
            <p className="text-gray-600">实时工作流执行与监控</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={wsStatus === 'connected' ? 'default' : 'destructive'}>
            <Activity className="w-3 h-3 mr-1" />
            {wsStatus === 'connected' ? '实时连接' : '连接断开'}
          </Badge>
          
          {/* Real-time log stream button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedLogs(!showDetailedLogs)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            实时日志流
            {Object.values(workflowState.logs).flat().length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(workflowState.logs).flat().length}
              </Badge>
            )}
          </Button>
          
          <Badge variant={workflowState.status === 'running' ? 'default' : 'secondary'}>
            {workflowState.status === 'running' ? '工作流运行中' : '工作流空闲'}
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        {[
          { id: 'workflow', label: '实时工作流', icon: <Activity className="w-4 h-4" /> },
          { id: 'results', label: '执行结果', icon: <BarChart className="w-4 h-4" /> },
          { id: 'analytics', label: '分析数据', icon: <BarChart3 className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workflow Tab */}
      {activeTab === 'workflow' && (
        <>
          {/* Campaign Form & Execution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign Configuration */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  活动配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">目标网站</label>
                  <input
                    type="url"
                    value={campaignForm.targetWebsite}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, targetWebsite: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">活动目标</label>
                  <select 
                    value={campaignForm.campaignGoal}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, campaignGoal: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="partnership">战略合作伙伴</option>
                    <option value="business_services">商业服务合作</option>
                    <option value="product_integration">产品集成</option>
                    <option value="investment">投资机会</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">目标类型</label>
                  <select 
                    value={campaignForm.businessType}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="technology">技术公司</option>
                    <option value="tob">B2B 企业客户</option>
                    <option value="toc">B2C 消费者客户</option>
                  </select>
                </div>
                
                <Button
                  onClick={executeCampaign}
                  disabled={workflowState.status === 'running' || wsStatus !== 'connected'}
                  className="w-full"
                >
                  {workflowState.status === 'running' ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      工作流执行中...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      启动营销活动
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Real-time Notifications */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  实时通知
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {workflowState.notifications.length > 0 ? (
                    workflowState.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : notification.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : notification.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <span className="text-xs opacity-75">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">暂无通知</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Steps Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                工作流执行进度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {workflowSteps.map((stepDef, index) => {
                  const step = workflowState.steps[stepDef.id];
                  const isActive = workflowState.currentStep === stepDef.id;
                  
                  return (
                    <div
                      key={stepDef.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isActive ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                      } ${getStepColor(step)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {stepDef.icon}
                          <h3 className="font-medium text-sm">{stepDef.title}</h3>
                        </div>
                        {getStepIcon(step)}
                      </div>
                      
                      <div className="mb-2">
                        <Progress 
                          value={step?.progress || 0} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs mt-1 text-gray-600">
                          <span>{step?.status || 'pending'}</span>
                          <span>{step?.progress || 0}%</span>
                        </div>
                      </div>
                      
                      {/* Step Logs - Show more logs and add click to expand */}
                      {workflowState.logs[stepDef.id] && (
                        <div className="mt-2 space-y-1">
                          {workflowState.logs[stepDef.id].slice(-5).map((log, idx) => (
                            <div key={idx} className="text-xs p-1 bg-white rounded hover:bg-gray-50">
                              <span className={`mr-1 ${
                                log.level === 'success' ? 'text-green-600' :
                                log.level === 'error' ? 'text-red-600' :
                                log.level === 'warning' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>●</span>
                              <span className="text-gray-500 text-xs mr-1">
                                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                              </span>
                              {log.message}
                            </div>
                          ))}
                          {workflowState.logs[stepDef.id].length > 5 && (
                            <button 
                              onClick={() => {
                                setSelectedStepLogs(stepDef.id);
                                setShowDetailedLogs(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            >
                              查看全部 {workflowState.logs[stepDef.id].length} 条日志 →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Results Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>网站分析结果</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowState.steps.website_analysis?.results ? (
                  <div className="space-y-2">
                    <p><strong>公司:</strong> {workflowState.steps.website_analysis.results.companyName}</p>
                    <p><strong>行业:</strong> {workflowState.steps.website_analysis.results.industry}</p>
                    <p><strong>价值主张:</strong> {workflowState.steps.website_analysis.results.valueProposition?.substring(0, 100)}...</p>
                  </div>
                ) : (
                  <p className="text-gray-500">等待分析结果...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>营销策略</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowState.steps.marketing_strategy?.results ? (
                  <div className="space-y-2">
                    <p><strong>目标受众:</strong> {workflowState.steps.marketing_strategy.results.target_audience?.type}</p>
                    <p><strong>主要细分:</strong> {workflowState.steps.marketing_strategy.results.target_audience?.primary_segments?.join(', ')}</p>
                    <p><strong>关键词:</strong> {workflowState.steps.marketing_strategy.results.target_audience?.search_keywords?.primary_keywords?.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">等待策略生成...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prospects Display */}
          {campaignResults.prospects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  发现的潜在客户
                  <Badge variant="secondary">{campaignResults.prospects.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {campaignResults.prospects.slice(0, 6).map((prospect, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{prospect.name || prospect.email || 'Unknown'}</h4>
                        {prospect.linkedinProfile && (
                          <a href={prospect.linkedinProfile} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>邮箱:</strong> {prospect.email || 'N/A'}</p>
                        <p><strong>公司:</strong> {prospect.company || 'N/A'}</p>
                        <p><strong>职位:</strong> {prospect.role || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Emails */}
          {workflowState.steps.email_generation?.results?.emails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  生成的邮件
                  <Badge variant="secondary">{workflowState.steps.email_generation.results.emails.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowState.steps.email_generation.results.emails.slice(0, 3).map((email, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">收件人: {email.recipient || 'Unknown'}</h4>
                        <Badge variant="outline">
                          {email.status || 'generated'}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p><strong>主题:</strong> {email.subject}</p>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto">
                          {email.body?.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">总潜在客户</p>
                  <p className="text-2xl font-bold">{workflowState.analytics.totalProspects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">生成邮件</p>
                  <p className="text-2xl font-bold">{workflowState.analytics.emailsGenerated || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">成功执行</p>
                  <p className="text-2xl font-bold">{workflowState.analytics.success ? '✅' : '⏳'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">连接状态</p>
                  <p className="text-2xl font-bold">{wsStatus === 'connected' ? '🟢' : '🔴'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 实时日志流模态框 */}
      {showDetailedLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                AI Agent 实时执行日志流
                {workflowState.status === 'running' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">运行中</span>
                  </div>
                )}
              </h3>
              <button 
                onClick={() => setShowDetailedLogs(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-3">
                {/* 按时间顺序显示所有步骤的日志 */}
                {Object.entries(workflowState.logs)
                  .flatMap(([stepId, logs]) => 
                    logs.map(log => ({ ...log, stepId, stepTitle: workflowSteps.find(s => s.id === stepId)?.title || stepId }))
                  )
                  .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
                  .map((log, idx) => (
                    <div 
                      key={`${log.stepId}-${idx}`} 
                      className={`p-4 rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md ${
                        log.level === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                        log.level === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                        log.level === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                        'bg-white border-blue-500 text-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-3 h-3 rounded-full mt-1 ${
                          log.level === 'success' ? 'bg-green-500' :
                          log.level === 'error' ? 'bg-red-500' :
                          log.level === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {log.stepTitle}
                            </Badge>
                            <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                              {log.level || 'info'}
                            </span>
                            <span className="text-xs opacity-70">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {log.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {Object.values(workflowState.logs).flat().length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">等待 AI Agent 开始工作...</p>
                    <p className="text-sm">启动营销活动后，这里将显示详细的执行日志</p>
                  </div>
                ) : null}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>共 {Object.values(workflowState.logs).flat().length} 条日志记录</span>
                <div className="flex items-center gap-4">
                  <span>实时更新中</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeLangGraphDashboard;