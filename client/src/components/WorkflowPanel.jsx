import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Activity, Edit2, Save, X, Check, AlertCircle, 
  User, Mail, Target, TrendingUp, Eye, Send
} from 'lucide-react';

const WorkflowPanel = ({ workflowId, targetWebsite }) => {
  const [workflowState, setWorkflowState] = useState(null);
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(false);
  const [editedStrategy, setEditedStrategy] = useState(null);
  const [editedAnalysis, setEditedAnalysis] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const wsRef = useRef(null);

  useEffect(() => {
    // 连接WebSocket - 修正URL路径
    const wsUrl = `ws://localhost:3333`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // 订阅工作流
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_workflow',
        workflowId
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    // 定期ping保持连接
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      wsRef.current?.close();
    };
  }, [workflowId]);

  const handleWebSocketMessage = (data) => {
    console.log('WebSocket message received:', data); // Debug log
    
    switch (data.type) {
      case 'connected':
        console.log('Connected to server:', data.clientId);
        break;
        
      case 'workflow_state':
        setWorkflowState(data.state);
        updateStageData(data.state);
        break;
        
      case 'workflow_update':
        handleWorkflowStepUpdate(data);
        break;

      // 新增：处理后端发送的实时更新消息
      case 'step_started':
        console.log(`🚀 Step started: ${data.stepId} - ${data.stepName}`);
        setWorkflowState(prev => ({
          ...prev,
          currentStep: data.stepId,
          steps: {
            ...prev?.steps,
            [data.stepId]: {
              status: 'running',
              name: data.stepName,
              startTime: data.timestamp
            }
          }
        }));
        break;

      case 'step_completed':
        console.log(`✅ Step completed: ${data.stepId}`);
        setWorkflowState(prev => ({
          ...prev,
          steps: {
            ...prev?.steps,
            [data.stepId]: {
              ...prev?.steps?.[data.stepId],
              status: 'completed',
              result: data.result,
              endTime: data.timestamp
            }
          }
        }));
        break;

      case 'log_update':
        console.log(`📝 Log update [${data.stepId}]: ${data.message}`);
        // 可以添加日志显示逻辑
        break;

      case 'step_progress':
        console.log(`📊 Progress update [${data.stepId}]: ${data.progress}%`);
        setWorkflowState(prev => ({
          ...prev,
          steps: {
            ...prev?.steps,
            [data.stepId]: {
              ...prev?.steps?.[data.stepId],
              progress: data.progress
            }
          }
        }));
        break;

      case 'notification':
        console.log(`📢 Notification [${data.notificationType}]: ${data.message}`);
        // 可以添加通知显示逻辑
        break;

      case 'analytics_update':
        console.log(`📈 Analytics update:`, data.analytics);
        // 可以添加分析数据更新逻辑
        break;
        
      case 'prospect_list':
        setProspects(data.prospects);
        break;
        
      case 'email_list':
        setEmails(data.emails);
        break;
        
      case 'strategy_update_confirmed':
        setEditingStrategy(false);
        break;
        
      case 'analysis_update_confirmed':
        setEditingAnalysis(false);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const updateStageData = (state) => {
    if (state?.data) {
      if (state.data.strategy) {
        setEditedStrategy(state.data.strategy);
      }
      if (state.data.businessAnalysis) {
        setEditedAnalysis(state.data.businessAnalysis);
      }
      if (state.data.prospects) {
        setProspects(state.data.prospects);
      }
      if (state.data.emails) {
        setEmails(state.data.emails);
      }
    }
  };

  // 处理实时工作流步骤更新
  const handleWorkflowStepUpdate = (data) => {
    console.log(`Workflow step update: ${data.step} - ${data.status}`, data);
    
    // 更新对应步骤的状态和数据
    setWorkflowState(prev => {
      const newState = { ...prev };
      
      // 更新步骤状态
      if (!newState.steps) newState.steps = {};
      newState.steps[data.step] = {
        status: data.status,
        data: data.data,
        timestamp: data.timestamp
      };
      
      // 根据步骤更新相关数据
      if (data.step === 'business_analysis' && data.status === 'completed' && data.data) {
        setEditedAnalysis(data.data);
      }
      
      if (data.step === 'marketing_strategy' && data.status === 'completed' && data.data) {
        setEditedStrategy(data.data);
      }
      
      if (data.step === 'prospect_search' && data.status === 'completed' && data.data) {
        if (data.data.prospects) {
          setProspects(data.data.prospects);
        }
      }
      
      if (data.step === 'email_generation' && data.status === 'completed' && data.data) {
        if (data.data.emails) {
          setEmails(data.data.emails);
        }
      }
      
      return newState;
    });
  };

  const saveStrategy = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_strategy',
        workflowId,
        strategy: editedStrategy,
        feedback: 'User manually edited strategy'
      }));
    }
  };

  const saveAnalysis = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_analysis',
        workflowId,
        analysis: editedAnalysis,
        feedback: 'User manually edited analysis'
      }));
    }
  };

  const requestProspects = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request_prospects',
        workflowId
      }));
    }
  };

  const requestEmails = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request_emails',
        workflowId
      }));
    }
  };

  const getStageStatus = (stageName) => {
    if (!workflowState?.stages?.[stageName]) return 'pending';
    return workflowState.stages[stageName].status;
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">AI Marketing Workflow</h2>
        <Badge variant={connected ? 'success' : 'destructive'}>
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Workflow Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { id: 'web_analysis', name: 'Web Analysis', icon: <Target /> },
              { id: 'strategy_generation', name: 'Strategy Generation', icon: <TrendingUp /> },
              { id: 'prospect_search', name: 'Prospect Search', icon: <User /> },
              { id: 'email_generation', name: 'Email Generation', icon: <Mail /> },
              { id: 'email_sending', name: 'Email Sending', icon: <Send /> }
            ].map((stage) => (
              <div key={stage.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                {getStageIcon(getStageStatus(stage.id))}
                <span className="flex-1">{stage.name}</span>
                {stage.icon}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="strategy" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>

        {/* Strategy Tab */}
        <TabsContent value="strategy">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Marketing Strategy</CardTitle>
              <Button
                size="sm"
                variant={editingStrategy ? "destructive" : "outline"}
                onClick={() => setEditingStrategy(!editingStrategy)}
              >
                {editingStrategy ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              {editingStrategy ? (
                <div className="space-y-4">
                  <Textarea
                    value={JSON.stringify(editedStrategy, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditedStrategy(JSON.parse(e.target.value));
                      } catch (err) {
                        // Invalid JSON, keep as is
                      }
                    }}
                    className="font-mono text-sm h-96"
                  />
                  <Button onClick={saveStrategy} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Strategy
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {editedStrategy && (
                    <>
                      <div>
                        <strong>Target Audience:</strong> {editedStrategy.target_audience?.type}
                      </div>
                      <div>
                        <strong>Primary Segments:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {editedStrategy.target_audience?.primary_segments?.map((seg, i) => (
                            <Badge key={i} variant="secondary">{seg}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>Pain Points:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {editedStrategy.target_audience?.pain_points?.map((point, i) => (
                            <li key={i} className="text-sm">{point}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Business Analysis</CardTitle>
              <Button
                size="sm"
                variant={editingAnalysis ? "destructive" : "outline"}
                onClick={() => setEditingAnalysis(!editingAnalysis)}
              >
                {editingAnalysis ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              {editingAnalysis ? (
                <div className="space-y-4">
                  <Input
                    placeholder="Company Name"
                    value={editedAnalysis?.companyName || ''}
                    onChange={(e) => setEditedAnalysis({
                      ...editedAnalysis,
                      companyName: e.target.value
                    })}
                  />
                  <Input
                    placeholder="Industry"
                    value={editedAnalysis?.industry || ''}
                    onChange={(e) => setEditedAnalysis({
                      ...editedAnalysis,
                      industry: e.target.value
                    })}
                  />
                  <Textarea
                    placeholder="Value Proposition"
                    value={editedAnalysis?.valueProposition || ''}
                    onChange={(e) => setEditedAnalysis({
                      ...editedAnalysis,
                      valueProposition: e.target.value
                    })}
                  />
                  <Button onClick={saveAnalysis} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {editedAnalysis && (
                    <>
                      <div><strong>Company:</strong> {editedAnalysis.companyName}</div>
                      <div><strong>Industry:</strong> {editedAnalysis.industry}</div>
                      <div><strong>Value Proposition:</strong> {editedAnalysis.valueProposition}</div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prospects Tab */}
        <TabsContent value="prospects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Discovered Prospects ({prospects.length})</CardTitle>
              <Button size="sm" onClick={requestProspects}>
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {prospects.map((prospect, i) => (
                    <Card key={i} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold">{prospect.email}</div>
                          <div className="text-sm text-gray-600">{prospect.name}</div>
                          {prospect.persona && (
                            <div className="text-xs">
                              <Badge variant="outline">{prospect.persona.estimatedRole}</Badge>
                              <Badge variant="outline" className="ml-1">{prospect.persona.companySize}</Badge>
                            </div>
                          )}
                        </div>
                        <Badge variant={prospect.verified ? 'success' : 'secondary'}>
                          {prospect.confidence ? `${Math.round(prospect.confidence * 100)}%` : 'Unverified'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Email Campaign ({emails.length})</CardTitle>
              <Button size="sm" onClick={requestEmails}>
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {emails.map((email, i) => (
                    <Card 
                      key={i} 
                      className="p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold">{email.subject}</div>
                        <div className="text-sm text-gray-600">To: {email.to}</div>
                        <div className="text-xs text-gray-500">
                          {email.status === 'sent' ? '✅ Sent' : '📝 Draft'}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Editor Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Email</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedEmail(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={selectedEmail.subject}
                onChange={(e) => setSelectedEmail({
                  ...selectedEmail,
                  subject: e.target.value
                })}
                placeholder="Subject"
              />
              <Textarea
                value={selectedEmail.body}
                onChange={(e) => setSelectedEmail({
                  ...selectedEmail,
                  body: e.target.value
                })}
                placeholder="Email body"
                className="h-64"
              />
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Save email
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'update_email',
                        workflowId,
                        emailId: selectedEmail.id,
                        email: selectedEmail
                      }));
                    }
                    setSelectedEmail(null);
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedEmail(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkflowPanel;