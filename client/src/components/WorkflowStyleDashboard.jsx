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
  CheckCircle2, XCircle, AlertTriangle, Info, Monitor,
  Building, Package, Lightbulb
} from 'lucide-react';

const WorkflowStyleDashboard = ({ agentConfig, onReset }) => {
  // 
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [realTimeData, setRealTimeData] = useState({
    totalProspects: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    campaignActive: false,
    lastUpdate: null,
    activeClients: [],
    personas: []
  });

  // Persona cards state management
  const [personaCards, setPersonaCards] = useState([]);
  const [showPersonaCards, setShowPersonaCards] = useState(false);

  //  - 
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 'website_analysis',
      title: 'Web Analysis',
      subtitle: 'AI-Powered Business Intelligence',
      status: 'pending',
      progress: 0,
      results: null,
      allowEdit: true,
      expanded: false,
      logs: []
    },
    {
      id: 'marketing_strategy', 
      title: 'Marketing Strategy',
      subtitle: 'Strategic Planning & Targeting',
      status: 'pending',
      progress: 0,
      results: null,
      allowEdit: true,
      expanded: false,
      logs: []
    },
    {
      id: 'prospect_search',
      title: 'Prospect Search',
      subtitle: 'Lead Generation & Validation',
      status: 'pending',
      progress: 0,
      results: null,
      allowEdit: false,
      expanded: false,
      logs: []
    },
    {
      id: 'email_generation',
      title: 'Email Generation',
      subtitle: 'Personalized Content Creation',
      status: 'pending',
      progress: 0,
      results: null,
      allowEdit: true,
      expanded: false,
      logs: []
    },
    {
      id: 'email_sending',
      title: 'Campaign Execution',
      subtitle: 'Email Delivery & Tracking',
      status: 'pending',
      progress: 0,
      results: null,
      allowEdit: false,
      expanded: false,
      logs: []
    }
  ]);

  const [editingStep, setEditingStep] = useState(null);
  const [editData, setEditData] = useState({});
  const [currentStep, setCurrentStep] = useState(null);

  // WebSocket 
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 
  const checkBackendConnectivity = useCallback(async () => {
    try {
      const response = await fetch('/api/langgraph-agent/status', { 
        timeout: 3000 // 3
      });
      const isConnected = response.ok;
      setBackendConnected(isConnected);
      setLastBackendCheck(new Date());
      
      if (!isConnected) {
        // 
        setContinuousMode({
          marketing_strategy: false,
          prospect_search: false,
          email_generation: false
        });
        console.log(' Backend disconnected - stopping continuous workflows to prevent fake data generation');
      }
      
      return isConnected;
    } catch (error) {
      console.log(' Backend connection check failed:', error.message);
      setBackendConnected(false);
      setLastBackendCheck(new Date());
      // 
      setContinuousMode({
        marketing_strategy: false,
        prospect_search: false,
        email_generation: false
      });
      return false;
    }
  }, []);

  // 
  const fetchRealTimeData = useCallback(async () => {
    try {
      // 
      const isBackendAvailable = await checkBackendConnectivity();
      if (!isBackendAvailable) {
        console.log(' Skipping real-time data fetch - backend unavailable');
        return;
      }

      // 
      const statusResponse = await fetch('/api/langgraph-agent/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success) {
          setWorkflowStatus(statusData.status || 'idle');
          setCurrentStep(statusData.currentStep);
          
          if (statusData.steps) {
            setWorkflowSteps(prev => prev.map(step => {
              const serverStep = statusData.steps.find(s => s.id === step.id);
              return serverStep ? { ...step, ...serverStep } : step;
            }));
          }
        }
      }

      // 
      const analyticsResponse = await fetch('/api/langgraph-agent/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setRealTimeData(prev => ({
            ...prev,
            ...analyticsData.data,
            lastUpdate: new Date()
          }));
        }
      }

      // 
      const clientsResponse = await fetch('/api/agent/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setRealTimeData(prev => ({
          ...prev,
          activeClients: clientsData || [],
          totalProspects: clientsData?.length || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }, []);

  // WebSocket 
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(' WebSocket already connected');
      return;
    }

    try {
      console.log(' Attempting WebSocket connection to ws://localhost:3333...');
      wsRef.current = new WebSocket(`ws://localhost:3333`);
      
      wsRef.current.onopen = () => {
        console.log(' WebSocket connected successfully!');
        // Send a test message to verify connection
        wsRef.current.send(JSON.stringify({ type: 'ping', message: 'Frontend connected' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(' WebSocket message:', data);
          
          if (data.type === 'workflow_update') {
            setWorkflowSteps(prev => prev.map(step => 
              step.id === data.stepId ? { ...step, ...data.stepData } : step
            ));
          } else if (data.type === 'analytics_update') {
            setRealTimeData(prev => ({ ...prev, ...data.data, lastUpdate: new Date() }));
          } else if (data.type === 'status_update') {
            setWorkflowStatus(data.status);
            setCurrentStep(data.currentStep);
          } else if (data.type === 'log_update') {
            // Real-time log streaming to specific workflow step
            setWorkflowSteps(prev => prev.map(step => 
              step.id === data.stepId ? {
                ...step,
                logs: [...(step.logs || []).slice(-19), {
                  message: data.message,
                  timestamp: new Date(),
                  level: data.level || 'info'
                }]
              } : step
            ));
          } else if (data.type === 'notification') {
            // Show notification in current step
            if (currentStep) {
              setWorkflowSteps(prev => prev.map(step => 
                step.id === currentStep ? {
                  ...step,
                  logs: [...(step.logs || []).slice(-19), {
                    message: data.message,
                    timestamp: new Date(),
                    level: data.notificationType || 'info'
                  }]
                } : step
              ));
            }
          } else if (data.type === 'persona_generated') {
            // Handle persona generation updates
            console.log(' Persona generated:', data.data);
            setPersonaCards(prev => {
              // Check if persona already exists for this email
              const existingIndex = prev.findIndex(card => card.prospect.email === data.data.prospect.email);
              if (existingIndex !== -1) {
                // Update existing card
                const updated = [...prev];
                updated[existingIndex] = data.data;
                return updated;
              } else {
                // Add new card
                return [...prev, data.data];
              }
            });
            setShowPersonaCards(true); // Auto-show persona cards when first persona is generated
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log(' WebSocket disconnected, retrying...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    }
  }, []);

  // 
  useEffect(() => {
    fetchRealTimeData();
    connectWebSocket();
    
    const dataInterval = setInterval(fetchRealTimeData, 5000);

    return () => {
      clearInterval(dataInterval);
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchRealTimeData, connectWebSocket]);

  // 
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
          smtpConfig: agentConfig.smtpConfig,
          emailTemplate: agentConfig.emailTemplate,
          templateData: agentConfig.templateData
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(' Workflow started successfully');
      } else {
        throw new Error(result.error || 'Failed to start workflow');
      }
    } catch (error) {
      console.error(' Workflow start error:', error);
      setWorkflowStatus('error');
    }
  };

  // 
  const handleStepEdit = (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (step?.results) {
      setEditingStep(stepId);
      setEditData({ ...step.results });
    }
  };

  // 
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
            modifications: 'User edited workflow results',
            timestamp: new Date().toISOString(),
            learning_enabled: true
          }
        })
      });

      if (response.ok) {
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
        console.log(' Feedback sent to LangGraph for learning');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const getStepFeedbackType = (stepId) => {
    const types = {
      'website_analysis': 'strategy_rating',
      'marketing_strategy': 'strategy_rating',
      'email_generation': 'email_modification',
      'prospect_search': 'search_improvement'
    };
    return types[stepId] || 'strategy_rating';
  };

  // 
  const toggleStepExpansion = (stepId) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, expanded: !step.expanded }
        : step
    ));
  };

  // 
  const [continuousMode, setContinuousMode] = useState({
    marketing_strategy: false,  // backend
    prospect_search: false,
    email_generation: false
  });

  // 
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastBackendCheck, setLastBackendCheck] = useState(null);

  const [taskQueue, setTaskQueue] = useState([
    { id: 'resolve_ollama_data', priority: 'high', step: 'website_analysis', description: 'Handle Ollama structured response data (Objects and Promises)' },
    { id: 'optimize_marketing_query', priority: 'medium', step: 'marketing_strategy', description: 'Optimize marketing strategy queries based on web analysis' },
    { id: 'enhance_prospect_search', priority: 'medium', step: 'prospect_search', description: 'Enhance prospect search algorithms' },
    { id: 'improve_email_templates', priority: 'low', step: 'email_generation', description: 'Improve email template personalization' }
  ]);

  // 
  const executeContinuousWorkflow = useCallback(async () => {
    // 
    if (!backendConnected) {
      console.log(' Skipping continuous workflow execution - backend disconnected');
      return;
    }

    // 
    const highPriorityTasks = taskQueue.filter(task => task.priority === 'high');
    if (highPriorityTasks.length > 0) {
      const task = highPriorityTasks[0];
      await executeTask(task);
      setTaskQueue(prev => prev.filter(t => t.id !== task.id));
    }

    // 
    Object.entries(continuousMode).forEach(([stepId, isActive]) => {
      if (isActive && backendConnected) {
        runContinuousWorkflow(stepId);
      }
    });
  }, [taskQueue, continuousMode, backendConnected]);

  // 
  const executeTask = async (task) => {
    addWorkLog(task.step, `Starting task: ${task.description}`, 'analysis');
    
    try {
      switch (task.id) {
        case 'resolve_ollama_data':
          await resolveOllamaStructuredData(task.step);
          break;
        case 'optimize_marketing_query':
          await optimizeMarketingStrategy();
          break;
        case 'enhance_prospect_search':
          await enhanceProspectSearch();
          break;
        case 'improve_email_templates':
          await improveEmailTemplates();
          break;
      }
      addWorkLog(task.step, `Completed task: ${task.description}`, 'success');
    } catch (error) {
      addWorkLog(task.step, `Task failed: ${error.message}`, 'error');
    }
  };

  // 
  const runContinuousWorkflow = async (stepId) => {
    switch (stepId) {
      case 'marketing_strategy':
        await runMarketingStrategyLoop();
        break;
      case 'prospect_search':
        await runProspectSearchLoop();
        break;
      case 'email_generation':
        await runEmailGenerationLoop();
        break;
    }
  };

  // 
  const runMarketingStrategyLoop = async () => {
    // 
    if (!backendConnected || !continuousMode.marketing_strategy) {
      console.log(' Skipping marketing strategy loop - backend disconnected or continuous mode disabled');
      return;
    }

    addWorkLog('marketing_strategy', 'Monitoring market signals and web analysis updates...', 'analysis');
    
    try {
      // 
      const marketSignals = await fetchMarketSignals();
      
      // 
      if (marketSignals && marketSignals.length > 0) {
        addWorkLog('marketing_strategy', `Found ${marketSignals.length} new market signals`, 'search');
      } else if (backendConnected) {
        addWorkLog('marketing_strategy', 'No new market signals available', 'info');
      }
      
      // Ollama
      const optimizedStrategy = await sendToOllama('optimize_strategy', {
        currentStrategy: workflowSteps.find(s => s.id === 'marketing_strategy')?.results,
        marketSignals,
        webAnalysis: workflowSteps.find(s => s.id === 'website_analysis')?.results
      });
      
      addWorkLog('marketing_strategy', 'Strategy optimized by Ollama AI', 'ollama');
      
      // 
      updateWorkflowResults('marketing_strategy', optimizedStrategy);
      
    } catch (error) {
      addWorkLog('marketing_strategy', `Strategy optimization error: ${error.message}`, 'error');
    }
    
    // 
    if (backendConnected && continuousMode.marketing_strategy) {
      setTimeout(() => runMarketingStrategyLoop(), 30000); // 30
    }
  };

  //   
  const runProspectSearchLoop = async () => {
    // 
    if (!backendConnected || !continuousMode.prospect_search) {
      console.log(' Skipping prospect search loop - backend disconnected or continuous mode disabled');
      return;
    }

    addWorkLog('prospect_search', 'Continuous prospect search running...', 'search');
    
    try {
      // 
      const strategy = workflowSteps.find(s => s.id === 'marketing_strategy')?.results;
      const newProspects = await searchProspects(strategy);
      
      // 
      if (newProspects && newProspects.length > 0) {
        addWorkLog('prospect_search', `Found ${newProspects.length} new prospects`, 'success');
      } else if (backendConnected) {
        addWorkLog('prospect_search', 'No new prospects found in this search cycle', 'info');
      }
      
      // 
      updateWorkflowResults('prospect_search', { 
        prospects: [...(workflowSteps.find(s => s.id === 'prospect_search')?.results?.prospects || []), ...newProspects]
      });
      
    } catch (error) {
      addWorkLog('prospect_search', `Prospect search error: ${error.message}`, 'error');
    }
    
    // 
    if (backendConnected && continuousMode.prospect_search) {
      setTimeout(() => runProspectSearchLoop(), 45000); // 45
    }
  };

  // 
  const runEmailGenerationLoop = async () => {
    // 
    if (!backendConnected || !continuousMode.email_generation) {
      console.log(' Skipping email generation loop - backend disconnected or continuous mode disabled');
      return;
    }

    addWorkLog('email_generation', 'Continuous email generation running...', 'ollama');
    
    try {
      const prospects = workflowSteps.find(s => s.id === 'prospect_search')?.results?.prospects || [];
      const strategy = workflowSteps.find(s => s.id === 'marketing_strategy')?.results;
      
      if (prospects.length > 0) {
        // 
        const newEmails = await generateEmailsForProspects(prospects.slice(-5), strategy);
        
        // 
        if (newEmails && newEmails.length > 0) {
          addWorkLog('email_generation', `Generated ${newEmails.length} new personalized emails`, 'success');
        } else if (backendConnected) {
          addWorkLog('email_generation', 'No new emails generated in this cycle', 'info');
        }
        
        // 
        updateWorkflowResults('email_generation', {
          emails: [...(workflowSteps.find(s => s.id === 'email_generation')?.results?.emails || []), ...newEmails]
        });
      }
      
    } catch (error) {
      addWorkLog('email_generation', `Email generation error: ${error.message}`, 'error');
    }
    
    // 
    if (backendConnected && continuousMode.email_generation) {
      setTimeout(() => runEmailGenerationLoop(), 60000); // 60
    }
  };

  // 
  const addWorkLog = (stepId, message, type = 'info', status = null) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            workLogs: [
              ...(step.workLogs || []).slice(-20), // 20
              {
                timestamp: new Date().toISOString(),
                message,
                type,
                status
              }
            ]
          }
        : step
    ));
  };

  // 
  const updateWorkflowResults = (stepId, newResults) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            results: { ...step.results, ...newResults },
            lastUpdated: new Date().toISOString()
          }
        : step
    ));
  };

  // Ollama
  const resolveOllamaStructuredData = async (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (!step?.results) return;

    // Promise
    for (const [key, value] of Object.entries(step.results)) {
      if (value && typeof value === 'object') {
        if (value.constructor.name === 'Promise') {
          addWorkLog(stepId, `Resolving Promise for ${key}...`, 'analysis');
          try {
            const resolved = await value;
            step.results[key] = resolved;
            addWorkLog(stepId, `Resolved Promise for ${key}`, 'success');
          } catch (error) {
            addWorkLog(stepId, `Promise resolution failed for ${key}: ${error.message}`, 'error');
          }
        } else if (value.fullContent || value.structuredInfo || value.contentAnalysis) {
          // 
          addWorkLog(stepId, `Extracting structured data for ${key}...`, 'analysis');
          step.results[key] = extractUsefulData(value);
          addWorkLog(stepId, `Extracted structured data for ${key}`, 'success');
        }
      }
    }

    updateWorkflowResults(stepId, step.results);
  };

  // 
  const extractUsefulData = (dataObject) => {
    if (typeof dataObject === 'string') return dataObject;
    if (dataObject.fullContent) return dataObject.fullContent;
    if (dataObject.structuredInfo) return dataObject.structuredInfo;
    if (dataObject.contentAnalysis) return dataObject.contentAnalysis;
    return JSON.stringify(dataObject);
  };

  // 
  useEffect(() => {
    checkBackendConnectivity();
    
    // 
    const connectivityInterval = setInterval(checkBackendConnectivity, 5000); // 5
    
    return () => clearInterval(connectivityInterval);
  }, [checkBackendConnectivity]);

  // 
  useEffect(() => {
    const interval = setInterval(executeContinuousWorkflow, 10000); // 10
    return () => clearInterval(interval);
  }, [executeContinuousWorkflow]);

  // LangGraph
  const handleFieldUpdate = async (stepId, fieldName, value) => {
    try {
      addWorkLog(stepId, `User updated field: ${fieldName}`, 'analysis');
      
      // UI
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              results: { ...step.results, [fieldName]: value },
              userEdited: true,
              lastModified: new Date().toISOString()
            }
          : step
      ));

      // LangGraph
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'current',
          feedbackType: getStepFeedbackType(stepId),
          feedback: {
            stepId,
            fieldName,
            newValue: value,
            user_rating: 5,
            modifications: `User updated ${fieldName}`,
            timestamp: new Date().toISOString(),
            learning_enabled: true,
            field_improvement: true
          }
        })
      });

      if (response.ok) {
        addWorkLog(stepId, `Field update sent to LangGraph for learning`, 'success');
        console.log(` Field update sent to LangGraph for learning: ${fieldName} = ${value}`);
        
        // 
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // WebSocket
          wsRef.current.send(JSON.stringify({
            type: 'user_feedback',
            stepId,
            fieldName,
            value,
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        addWorkLog(stepId, 'Failed to send feedback to LangGraph agent', 'error');
      }
    } catch (error) {
      addWorkLog(stepId, `Error updating field: ${error.message}`, 'error');
      console.error('Error updating field:', error);
      // UI
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, results: { ...step.results, [fieldName]: step.results[fieldName] } }
          : step
      ));
    }
  };

  // 
  const fetchMarketSignals = async () => {
    // 
    try {
      const response = await fetch('/api/langgraph-agent/market-signals');
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error(':', error);
      return [];
    }
  };

  const sendToOllama = async (action, data) => {
    try {
      const response = await fetch('/api/ollama/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
      return response.ok ? await response.json() : {};
    } catch (error) {
      console.error('Ollama request failed:', error);
      return {};
    }
  };

  const searchProspects = async (strategy) => {
    //  - 
    try {
      // Ensure strategy is not undefined
      const validStrategy = strategy || {
        company_name: 'AI Business',
        target_audience: {
          type: 'B2B',
          primary_segments: ['technology companies'],
          search_keywords: ['business', 'technology', 'AI'],
          pain_points: ['efficiency', 'automation']
        }
      };
      
      console.log(' Frontend prospect search request:', validStrategy?.company_name);
      
      const response = await fetch('/api/langgraph-agent/search-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: validStrategy })
      });
      const result = await response.json();
      return result.prospects || [];
    } catch (error) {
      console.error(':', error);
      return [];
    }
  };

  const generateEmailsForProspects = async (prospects, strategy) => {
    //  - 
    try {
      const response = await fetch('/api/langgraph-agent/generate-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects, strategy })
      });
      const result = await response.json();
      return result.emails || [];
    } catch (error) {
      console.error(':', error);
      return [];
    }
  };

  const optimizeMarketingStrategy = async () => {
    addWorkLog('marketing_strategy', 'Optimizing marketing strategy with latest data...', 'ollama');
  };

  const enhanceProspectSearch = async () => {
    addWorkLog('prospect_search', 'Enhancing prospect search algorithms...', 'analysis');
  };

  const improveEmailTemplates = async () => {
    addWorkLog('email_generation', 'Improving email template personalization...', 'ollama');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Continuous Workflow Control Panel - Left Side - Larger */}
      <div className="fixed top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 w-72 z-50 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            Continuous Workflows
          </h3>
        </div>
        
        {/* Backend Connection Status */}
        <div className="mb-4 p-3 rounded-lg bg-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-medium">Backend Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`font-medium ${backendConnected ? 'text-green-300' : 'text-red-300'}`}>
                {backendConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {lastBackendCheck && (
            <div className="text-sm text-gray-400 mt-2">
              Last check: {lastBackendCheck.toLocaleTimeString()}
            </div>
          )}
          {!backendConnected && (
            <div className="text-sm text-orange-300 mt-2">
               Continuous workflows disabled to prevent fake data
            </div>
          )}
        </div>
        
        <div className="space-y-3 text-sm">
          {Object.entries(continuousMode).map(([stepId, isActive]) => (
            <div key={stepId} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-gray-300 capitalize font-medium">{stepId.replace('_', ' ')}</span>
              </div>
              <button
                onClick={() => {
                  if (backendConnected) {
                    setContinuousMode(prev => ({ ...prev, [stepId]: !prev[stepId] }));
                  }
                }}
                disabled={!backendConnected}
                className={`px-2 py-1 rounded text-sm transition-colors font-medium ${
                  !backendConnected 
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed' 
                    : isActive 
                      ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50' 
                      : 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/50'
                }`}
                title={!backendConnected ? 'Backend must be connected to enable continuous workflows' : ''}
              >
                {!backendConnected ? 'Disabled' : isActive ? 'Running' : 'Stopped'}
              </button>
            </div>
          ))}
        </div>
        
        {/*  */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 font-medium">Task Queue ({taskQueue.length})</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {taskQueue.slice(0, 3).map((task) => (
              <div key={task.id} className={`p-2 rounded text-sm ${
                task.priority === 'high' ? 'bg-red-600/20 border border-red-600/30' :
                task.priority === 'medium' ? 'bg-yellow-600/20 border border-yellow-600/30' :
                'bg-gray-600/20 border border-gray-600/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{task.description}</span>
                  <span className={`px-1 py-0 rounded text-sm ${
                    task.priority === 'high' ? 'bg-red-600/30 text-red-300' :
                    task.priority === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                    'bg-gray-600/30 text-gray-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Container - Adjusted for larger panels */}
      <div className="container mx-auto px-8 py-8 ml-80 mr-84">
        {/*  -  */}
        <div className="flex items-center justify-between mb-12 px-8 pt-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">LangGraph Marketing Agent</h1>
              <p className="text-2xl font-medium text-gray-300">AI-Powered Marketing Workflow System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/*  -  */}
            <div className="flex items-center space-x-8 bg-gray-800/70 rounded-lg px-6 py-4 border border-gray-700">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-400" />
                <span className="text-base font-medium text-gray-200">Prospects: <span className="text-blue-400">{realTimeData.totalProspects}</span></span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-green-400" />
                <span className="text-base font-medium text-gray-200">Emails: <span className="text-green-400">{realTimeData.emailsSent}</span></span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <span className="text-base font-medium text-gray-200">Replies: <span className="text-purple-400">{realTimeData.emailsReplied}</span></span>
              </div>
            </div>
            
            {/*  */}
            <button
              onClick={startWorkflow}
              disabled={workflowStatus === 'running'}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors"
            >
              {workflowStatus === 'running' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Workflow</span>
                </>
              )}
            </button>
            
            <button
              onClick={onReset}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/*  -  */}
        <div className="flex justify-center px-8 py-8">
          <div className="max-w-5xl w-full mx-auto">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="relative mb-8">
                {/*  */}
                <WorkflowStepCard
                  step={step}
                  index={index}
                  isActive={currentStep === step.id}
                  isEditing={editingStep === step.id}
                  editData={editData}
                  onEdit={() => handleStepEdit(step.id)}
                  onSave={() => saveStepEdit(step.id)}
                  onCancel={() => setEditingStep(null)}
                  onToggleExpansion={() => toggleStepExpansion(step.id)}
                  onEditDataChange={setEditData}
                />
                
                {/*  -  */}
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center my-6">
                    <div className="w-1 h-12 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/*  -  */}
        <div className="fixed right-4 top-24 w-80 bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Activity className="w-6 h-6 mr-2 text-green-400" />
              System Status
            </h2>
          </div>
          
          {/*  */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                workflowStatus === 'running' ? 'bg-green-400 animate-pulse' :
                workflowStatus === 'completed' ? 'bg-blue-400' :
                workflowStatus === 'error' ? 'bg-red-400' : 'bg-gray-500'
              }`} />
              <span className="text-lg font-bold text-gray-300">
                {workflowStatus === 'running' ? 'Workflow Running' :
                 workflowStatus === 'completed' ? 'Workflow Complete' :
                 workflowStatus === 'error' ? 'Error Occurred' : 'Ready'}
              </span>
            </div>
            {realTimeData.lastUpdate && (
              <p className="text-sm text-gray-400">
                Last updated: {realTimeData.lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/*  */}
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-base font-medium text-white mb-3">Campaign Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 font-medium">Prospects:</span>
                  <div className="text-blue-400 font-bold text-lg">{realTimeData.totalProspects || 0}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Emails Sent:</span>
                  <div className="text-green-400 font-bold text-lg">{realTimeData.emailsSent || 0}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Opened:</span>
                  <div className="text-yellow-400 font-bold text-lg">{realTimeData.emailsOpened || 0}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Replied:</span>
                  <div className="text-purple-400 font-bold text-lg">{realTimeData.emailsReplied || 0}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-base font-medium text-white mb-3">Personas Database</h3>
              <div className="text-sm text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Profiles:</span>
                  <span className="text-cyan-400 font-bold text-lg">{realTimeData.personas?.length || 0}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Access detailed persona search in Marketing Strategy section
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">Backend Connection</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-base font-bold ${backendConnected ? 'text-green-300' : 'text-red-300'}`}>
                    {backendConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

//  - 
const WorkflowStepCard = ({ 
  step, 
  index, 
  isActive, 
  isEditing, 
  editData, 
  onEdit, 
  onSave, 
  onCancel, 
  onToggleExpansion,
  onEditDataChange 
}) => {
  // 
  const getStepIcon = () => {
    const iconMap = {
      'website_analysis': <Globe className="w-8 h-8" />,
      'marketing_strategy': <Target className="w-8 h-8" />,
      'prospect_search': <Search className="w-8 h-8" />,
      'email_generation': <Mail className="w-8 h-8" />,
      'email_sending': <Send className="w-8 h-8" />
    };
    return iconMap[step.id] || <Activity className="w-8 h-8" />;
  };

  return (
    <div 
      className={`bg-gray-800 rounded-2xl border-2 transition-all duration-200 mb-6 ${
        isActive ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 transform scale-102' : 
        step.status === 'completed' ? 'border-green-500/50' :
        step.status === 'running' ? 'border-blue-500/50' : 
        step.status === 'error' ? 'border-red-500/50' : 'border-gray-700'
      }`}
      style={{ minHeight: '120px' }}
    >
      {/*  - padding */}
      <div 
        className="p-8 cursor-pointer hover:bg-gray-750 rounded-t-2xl transition-colors"
        onClick={step.results ? onToggleExpansion : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/*  -  */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white ${
              step.status === 'completed' ? 'bg-green-600' :
              step.status === 'running' ? 'bg-blue-600' :
              step.status === 'error' ? 'bg-red-600' : 'bg-gray-600'
            }`}>
              {step.status === 'running' ? (
                <Loader className="w-8 h-8 animate-spin" />
              ) : (
                getStepIcon()
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-base text-gray-300">{step.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/*  */}
            <div className={`w-3 h-3 rounded-full ${
              step.status === 'completed' ? 'bg-green-400' :
              step.status === 'running' ? 'bg-blue-400 animate-pulse' :
              step.status === 'error' ? 'bg-red-400' : 'bg-gray-500'
            }`} />
            
            {step.results && (
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                step.expanded ? 'rotate-180' : ''
              }`} />
            )}
          </div>
        </div>

        {/*  */}
        {step.progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{step.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'running' ? 'bg-blue-500' :
                  step.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        )}

        {/*  -  */}
        <div className="mt-4 bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-700">
          <div className="text-sm text-gray-400 mb-2 flex items-center justify-between font-medium">
            <span>Real-time Work Logs</span>
            <div className={`w-2 h-2 rounded-full ${
              step.status === 'running' ? 'bg-green-400 animate-pulse' :
              step.status === 'completed' ? 'bg-blue-400' : 'bg-gray-500'
            }`} />
          </div>
          <div className="space-y-1 text-xs">
            {/*  */}
            {Array.isArray(step.logs) && step.logs.length > 0 ? 
              step.logs.slice(-8).map((log, i) => (
                <div key={i} className={`text-opacity-90 animate-fadeIn flex ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'success' ? 'text-green-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  log.level === 'info' ? 'text-gray-300' : 'text-gray-300'
                }`}>
                  <span className="text-gray-500 mr-2 font-mono text-xs">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-US', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    }) : ''}
                  </span>
                  <span className="flex-1">{log.message}</span>
                  {log.status && (
                    <span className={`ml-2 px-1 py-0 rounded text-xs ${
                      log.status === 'completed' ? 'bg-green-600/30 text-green-300' :
                      log.status === 'running' ? 'bg-blue-600/30 text-blue-300' :
                      log.status === 'error' ? 'bg-red-600/30 text-red-300' :
                      'bg-gray-600/30 text-gray-300'
                    }`}>
                      {log.status}
                    </span>
                  )}
                </div>
              )) : 
              // 
              <div className="text-gray-400 text-center py-2">
                {step.status === 'running' ? 'Continuous workflow running...' : 'Waiting for next task...'}
              </div>
            }
          </div>
        </div>
      </div>

      {/*  */}
      {step.expanded && step.results && (
        <div className="border-t border-gray-700 p-6 bg-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">Results</h4>
            {step.allowEdit && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit & Learn</span>
              </button>
            )}
          </div>
          
          {isEditing ? (
            <StepEditForm 
              stepId={step.id}
              data={editData}
              onChange={onEditDataChange}
              onSave={onSave}
              onCancel={onCancel}
            />
          ) : (
            <StepResultDisplay 
              stepId={step.id} 
              results={step.results} 
              onFieldUpdate={(fieldName, value) => handleFieldUpdate(step.id, fieldName, value)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// 
const EditableField = ({ label, value, onSave, multiline = false, placeholder = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  if (isEditing) {
    return (
      <div>
        <label className="text-gray-400 text-xs">{label}</label>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
        ) : (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
            placeholder={placeholder}
            autoFocus
          />
        )}
        <div className="mt-2 flex space-x-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-gray-400 text-xs">{label}</label>
      <div className="group relative">
        <p className="text-white font-medium mt-1 min-h-[20px] break-words">
          {String(value || 'N/A')}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs"
        >
          <Edit className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// 
const EditableTagList = ({ label, tags, onSave, placeholder = "Add tags..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState([]);

  useEffect(() => {
    setEditTags(Array.isArray(tags) ? [...tags] : []);
  }, [tags]);

  const handleSave = () => {
    const cleanTags = editTags.filter(tag => tag.trim() !== '');
    if (JSON.stringify(cleanTags) !== JSON.stringify(tags)) {
      onSave(cleanTags);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTags(Array.isArray(tags) ? [...tags] : []);
    setIsEditing(false);
  };

  const addTag = () => {
    setEditTags([...editTags, ""]);
  };

  const updateTag = (index, value) => {
    const newTags = [...editTags];
    newTags[index] = value;
    setEditTags(newTags);
  };

  const removeTag = (index) => {
    const newTags = editTags.filter((_, i) => i !== index);
    setEditTags(newTags);
  };

  if (isEditing) {
    return (
      <div>
        <label className="text-gray-400 text-xs">{label}</label>
        <div className="mt-2 space-y-2">
          {editTags.map((tag, index) => (
            <div key={index} className="flex space-x-2">
              <input
                value={tag}
                onChange={(e) => updateTag(index, e.target.value)}
                className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder={placeholder}
              />
              <button
                onClick={() => removeTag(index)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={addTag}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-gray-400 text-xs">{label}</label>
      <div className="group relative">
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.isArray(tags) && tags.length > 0 ? tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded-md text-xs">
              {String(tag)}
            </span>
          )) : (
            <span className="text-gray-500 text-xs">No items</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs"
        >
          <Edit className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

//  -  ()
const StepResultDisplay = ({ stepId, results, onFieldUpdate }) => {
  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-6 text-sm">
        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-indigo-400 font-semibold mb-3 flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Company Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Company Name"
              value={results.companyName || results.company_name}
              onSave={(value) => onFieldUpdate('companyName', value)}
              placeholder="Enter company name"
            />
            <EditableField
              label="Industry"
              value={results.industry}
              onSave={(value) => onFieldUpdate('industry', value)}
              placeholder="Enter industry"
            />
            <EditableField
              label="Website"
              value={results.website || results.domain}
              onSave={(value) => onFieldUpdate('website', value)}
              placeholder="Enter website URL"
            />
            <EditableField
              label="Business Type"
              value={results.businessType || results.business_type}
              onSave={(value) => onFieldUpdate('businessType', value)}
              placeholder="e.g., B2B, B2C"
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-green-400 font-semibold mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Value Proposition
          </h4>
          <EditableField
            label=""
            value={results.valueProposition || results.value_proposition}
            onSave={(value) => onFieldUpdate('valueProposition', value)}
            placeholder="Describe the company's value proposition"
            multiline={true}
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-purple-400 font-semibold mb-3 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Products & Services
          </h4>
          <EditableTagList
            label=""
            tags={Array.isArray(results.mainProducts) 
              ? results.mainProducts 
              : Array.isArray(results.products) 
              ? results.products 
              : Array.isArray(results.services) 
              ? results.services 
              : []
            }
            onSave={(tags) => onFieldUpdate('mainProducts', tags)}
            placeholder="Add product or service"
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-yellow-400 font-semibold mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Target Audience
          </h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <EditableField
              label="Audience Type"
              value={results.targetAudience?.type || results.target_audience?.type}
              onSave={(value) => onFieldUpdate('targetAudience.type', value)}
              placeholder="e.g., B2B, B2C"
            />
            <EditableField
              label="Business Size"
              value={results.targetAudience?.businessSize || results.target_audience?.businessSize}
              onSave={(value) => onFieldUpdate('targetAudience.businessSize', value)}
              placeholder="e.g., SME & Enterprise"
            />
          </div>
          <EditableTagList
            label="Primary Segments"
            tags={results.targetAudience?.segments || results.target_audience?.primary_segments || []}
            onSave={(tags) => onFieldUpdate('targetAudience.segments', tags)}
            placeholder="Add audience segment"
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-red-400 font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Competitive Landscape
          </h4>
          <EditableTagList
            label=""
            tags={Array.isArray(results.competitors) ? results.competitors.map(comp => 
              typeof comp === 'string' ? comp : comp.name || comp.company || 'Competitor'
            ) : []}
            onSave={(tags) => onFieldUpdate('competitors', tags)}
            placeholder="Add competitor"
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-cyan-400 font-semibold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Market Intelligence
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <EditableField
              label="Market Size"
              value={results.marketSize || results.market_size}
              onSave={(value) => onFieldUpdate('marketSize', value)}
              placeholder="e.g., $1B, Large, Growing"
            />
            <EditableField
              label="Growth Rate"
              value={results.growthRate || results.growth_rate}
              onSave={(value) => onFieldUpdate('growthRate', value)}
              placeholder="e.g., 15% YoY, High"
            />
            <EditableField
              label="Market Trend"
              value={results.marketTrend || results.market_trend}
              onSave={(value) => onFieldUpdate('marketTrend', value)}
              placeholder="e.g., Growing, Stable"
            />
            <EditableField
              label="Employee Count"
              value={results.employeeCount || results.company_size}
              onSave={(value) => onFieldUpdate('employeeCount', value)}
              placeholder="e.g., 10-50, 100+"
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-orange-400 font-bold mb-3 flex items-center text-base">
            <Lightbulb className="w-5 h-5 mr-2" />
            Business Opportunities
          </h4>
          <EditableTagList
            label=""
            tags={(Array.isArray(results.opportunities) 
              ? results.opportunities 
              : Array.isArray(results.business_opportunities) 
              ? results.business_opportunities 
              : []
            ).map(opp => typeof opp === 'string' ? opp : opp.description || opp.title || 'Business opportunity')}
            onSave={(tags) => onFieldUpdate('opportunities', tags)}
            placeholder="Add business opportunity"
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-pink-400 font-bold mb-3 flex items-center text-base">
            <Mail className="w-5 h-5 mr-2" />
            Contact & Social Presence
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <EditableField
              label="Email Domain"
              value={results.emailDomain || results.domain}
              onSave={(value) => onFieldUpdate('emailDomain', value)}
              placeholder="e.g., company.com"
            />
            <EditableField
              label="Founded"
              value={results.founded || results.founding_year}
              onSave={(value) => onFieldUpdate('founded', value)}
              placeholder="e.g., 2020, 2020+"
            />
            <div className="col-span-2">
              <EditableTagList
                label="Social Media Platforms"
                tags={results.socialMedia ? Object.keys(results.socialMedia) : []}
                onSave={(tags) => onFieldUpdate('socialMedia', tags.reduce((obj, platform) => ({...obj, [platform]: true}), {}))}
                placeholder="Add social platform (e.g., LinkedIn, Twitter)"
              />
            </div>
          </div>
        </div>

        {/* AI  */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">Analysis Confidence</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{width: `${results.confidence || 85}%`}}></div>
              </div>
              <span className="text-white text-base font-bold">{results.confidence || 85}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === 'marketing_strategy') {
    return (
      <div className="space-y-6 text-sm">
        {/*  */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg p-4 border border-purple-500/30">
          <h4 className="text-purple-300 font-bold mb-3 flex items-center text-base">
            <Activity className="w-5 h-5 mr-2" />
            Real-Time Strategy Execution
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">Active</div>
              <div className="text-xs text-gray-400">Strategy Status</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">
                {results.target_audience?.primary_segments?.length || 0}
              </div>
              <div className="text-xs text-gray-400">Target Segments</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">
                {Object.keys(results.target_audience?.search_keywords || {}).length || 0}
              </div>
              <div className="text-xs text-gray-400">Keywords Groups</div>
            </div>
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-purple-400 font-bold mb-3 flex items-center text-base">
            <Target className="w-5 h-5 mr-2" />
            Marketing Strategy Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Campaign Type"
              value={results.campaignType || results.campaign_type}
              onSave={(value) => onFieldUpdate('campaignType', value)}
              placeholder="e.g., B2B Outreach, Lead Generation"
            />
            <EditableField
              label="Strategy Focus"
              value={results.strategyFocus || results.strategy_focus}
              onSave={(value) => onFieldUpdate('strategyFocus', value)}
              placeholder="e.g., Lead Generation, Brand Awareness"
            />
            <EditableField
              label="Estimated Reach"
              value={results.estimatedReach || results.estimated_reach}
              onSave={(value) => onFieldUpdate('estimatedReach', value)}
              placeholder="e.g., 1,000+ prospects"
            />
            <EditableField
              label="Success Metrics"
              value={results.successMetrics || results.success_metrics}
              onSave={(value) => onFieldUpdate('successMetrics', value)}
              placeholder="e.g., Response Rate, Conversion"
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-blue-400 font-semibold mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Target Audience Analysis
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Audience Type"
                value={results.target_audience?.type || results.targetAudience?.type}
                onSave={(value) => onFieldUpdate('audienceType', value)}
                placeholder="e.g., B2B, B2C, Enterprise"
              />
              <EditableField
                label="Business Size"
                value={results.target_audience?.businessSize || results.targetAudience?.businessSize}
                onSave={(value) => onFieldUpdate('businessSize', value)}
                placeholder="e.g., SME & Enterprise, Startup"
              />
            </div>
            
            <EditableTagList
              label="Primary Segments"
              tags={Array.isArray(results.target_audience?.primary_segments) 
                ? results.target_audience.primary_segments 
                : Array.isArray(results.targetAudience?.segments) 
                ? results.targetAudience.segments 
                : []
              }
              onSave={(tags) => onFieldUpdate('primarySegments', tags)}
              placeholder="Add target segments..."
            />
            
            <EditableTagList
              label="Key Pain Points"
              tags={Array.isArray(results.target_audience?.pain_points) 
                ? results.target_audience.pain_points 
                : Array.isArray(results.targetAudience?.painPoints) 
                ? results.targetAudience.painPoints 
                : []
              }
              onSave={(tags) => onFieldUpdate('painPoints', tags)}
              placeholder="Add pain points..."
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-green-400 font-semibold mb-3 flex items-center">
            <Search className="w-4 h-4 mr-2" />
            Keyword Strategy
          </h4>
          <div className="space-y-3">
            <EditableTagList
              label="Primary Keywords"
              tags={Array.isArray(results.target_audience?.search_keywords?.primary_keywords) 
                ? results.target_audience.search_keywords.primary_keywords 
                : Array.isArray(results.primaryKeywords) 
                ? results.primaryKeywords 
                : []
              }
              onSave={(tags) => onFieldUpdate('primaryKeywords', tags)}
              placeholder="Add primary keywords..."
            />
            
            <EditableTagList
              label="Industry Keywords"
              tags={Array.isArray(results.target_audience?.search_keywords?.industry_keywords) 
                ? results.target_audience.search_keywords.industry_keywords 
                : Array.isArray(results.industryKeywords) 
                ? results.industryKeywords 
                : []
              }
              onSave={(tags) => onFieldUpdate('industryKeywords', tags)}
              placeholder="Add industry keywords..."
            />
            
            <EditableTagList
              label="Solution Keywords"
              tags={Array.isArray(results.target_audience?.search_keywords?.solution_keywords) 
                ? results.target_audience.search_keywords.solution_keywords 
                : Array.isArray(results.solutionKeywords) 
                ? results.solutionKeywords 
                : []
              }
              onSave={(tags) => onFieldUpdate('solutionKeywords', tags)}
              placeholder="Add solution keywords..."
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-orange-400 font-semibold mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Channel Strategy
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Primary Channels"
              value={Array.isArray(results.primaryChannels) ? results.primaryChannels.join(', ') : Array.isArray(results.primary_channels) ? results.primary_channels.join(', ') : 'Email, LinkedIn, Search'}
              onSave={(value) => onFieldUpdate('primaryChannels', value)}
              placeholder="e.g., Email, LinkedIn, Search"
            />
            <EditableField
              label="Content Strategy"
              value={results.contentStrategy || results.content_strategy}
              onSave={(value) => onFieldUpdate('contentStrategy', value)}
              placeholder="e.g., Personalized Outreach"
            />
            <EditableField
              label="Timing Strategy"
              value={results.timingStrategy || results.timing_strategy}
              onSave={(value) => onFieldUpdate('timingStrategy', value)}
              placeholder="e.g., Business Hours"
            />
            <EditableField
              label="Follow-up Cadence"
              value={results.followupCadence || results.followup_cadence}
              onSave={(value) => onFieldUpdate('followupCadence', value)}
              placeholder="e.g., 3-touch sequence"
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-cyan-400 font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Competitive Advantage
          </h4>
          <EditableField
            label=""
            value={results.competitiveAdvantage || results.competitive_advantage}
            onSave={(value) => onFieldUpdate('competitiveAdvantage', value)}
            multiline={true}
            placeholder="Describe your competitive advantages..."
          />
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-pink-400 font-semibold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Expected Results
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Response Rate"
              value={results.expectedResponseRate || results.expected_response_rate}
              onSave={(value) => onFieldUpdate('expectedResponseRate', value)}
              placeholder="e.g., 5-15%"
            />
            <EditableField
              label="Conversion Rate"
              value={results.expectedConversionRate || results.expected_conversion_rate}
              onSave={(value) => onFieldUpdate('expectedConversionRate', value)}
              placeholder="e.g., 2-8%"
            />
            <EditableField
              label="Timeline"
              value={results.campaignTimeline || results.campaign_timeline}
              onSave={(value) => onFieldUpdate('campaignTimeline', value)}
              placeholder="e.g., 2-4 weeks"
            />
            <EditableField
              label="ROI Estimate"
              value={results.roiEstimate || results.roi_estimate}
              onSave={(value) => onFieldUpdate('roiEstimate', value)}
              placeholder="e.g., 300-500%"
            />
          </div>
        </div>

        {/*  */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Strategy Confidence</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{width: `${results.confidence || 90}%`}}></div>
              </div>
              <span className="text-white text-base font-bold">{results.confidence || 90}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === 'prospect_search') {
    return <ProspectSearchDisplay results={results} onFieldUpdate={onFieldUpdate} />;
  }

  if (stepId === 'email_generation') {
    return <EmailGenerationDisplay results={results} onFieldUpdate={onFieldUpdate} />;
  }

  return <div className="text-gray-400">Processing...</div>;
};

//  - 
const ProspectSearchDisplay = ({ results, onFieldUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showPersonas, setShowPersonas] = useState(true);
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    jobTitle: '',
    companySize: '',
    dateRange: 'all',
    confidence: 'all',
    country: ''
  });

  const prospects = Array.isArray(results.prospects) ? results.prospects : 
                   Array.isArray(results) ? results : [];

  // 
  const categorizeProspects = () => {
    const categories = {
      'High Priority': [],
      'Medium Priority': [],
      'Low Priority': [],
      'Uncategorized': []
    };

    prospects.forEach(prospect => {
      // 
      let score = 0;
      if (prospect.email && prospect.email.includes('@')) score += 3;
      if (prospect.company) score += 2;
      if (prospect.title && (prospect.title.toLowerCase().includes('ceo') || 
          prospect.title.toLowerCase().includes('founder') || 
          prospect.title.toLowerCase().includes('director'))) score += 3;
      if (prospect.industry) score += 1;
      if (prospect.location) score += 1;

      if (score >= 7) {
        categories['High Priority'].push({ ...prospect, score, category: 'High Priority' });
      } else if (score >= 4) {
        categories['Medium Priority'].push({ ...prospect, score, category: 'Medium Priority' });
      } else if (score >= 1) {
        categories['Low Priority'].push({ ...prospect, score, category: 'Low Priority' });
      } else {
        categories['Uncategorized'].push({ ...prospect, score, category: 'Uncategorized' });
      }
    });

    return categories;
  };

  const categorizedProspects = categorizeProspects();
  
  // 
  const getAllTags = () => {
    const tags = new Set();
    prospects.forEach(prospect => {
      if (prospect.industry) tags.add(prospect.industry);
      if (prospect.tags) {
        (Array.isArray(prospect.tags) ? prospect.tags : [prospect.tags]).forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  const allTags = getAllTags();

  // 
  const getFilteredProspects = () => {
    let filtered = selectedCategory === 'all' 
      ? prospects 
      : categorizedProspects[selectedCategory] || [];

    // 
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => {
        const prospectTags = [
          p.industry,
          ...(Array.isArray(p.tags) ? p.tags : [p.tags])
        ].filter(Boolean);
        return selectedTags.some(tag => prospectTags.includes(tag));
      });
    }

    // 
    if (sortBy === 'company') {
      filtered.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    } else if (sortBy === 'email') {
      filtered.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    } else if (sortBy === 'priority') {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return filtered;
  };

  const filteredProspects = getFilteredProspects();

  return (
    <div className="space-y-4">
      {/* CRM */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setShowPersonas(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showPersonas 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Prospects ({prospects.length})
          </button>
          <button
            onClick={() => setShowPersonas(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showPersonas 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            User Personas ({filteredProspects.length})
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
            <Upload className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/*  */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{prospects.length}</div>
          <div className="text-xs text-gray-400">Total Prospects</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">{categorizedProspects['High Priority'].length}</div>
          <div className="text-xs text-gray-400">High Priority</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{categorizedProspects['Medium Priority'].length}</div>
          <div className="text-xs text-gray-400">Medium Priority</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="text-2xl font-bold text-gray-400">{categorizedProspects['Low Priority'].length}</div>
          <div className="text-xs text-gray-400">Low Priority</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="text-2xl font-bold text-purple-400">{filteredProspects.length}</div>
          <div className="text-xs text-gray-400">Filtered Results</div>
        </div>
      </div>

      {/* CRM */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        {/*  */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 text-lg"
            placeholder="Search by name, company, email, or industry..."
          />
        </div>

        {/*  */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/*  */}
          <select
            value={filters.industry}
            onChange={(e) => setFilters({...filters, industry: e.target.value})}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>

          {/*  */}
          <select
            value={filters.country}
            onChange={(e) => setFilters({...filters, country: e.target.value})}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Countries</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="Australia">Australia</option>
          </select>

          {/*  */}
          <select
            value={filters.jobTitle}
            onChange={(e) => setFilters({...filters, jobTitle: e.target.value})}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Job Titles</option>
            <option value="CEO">CEO</option>
            <option value="VP">VP Level</option>
            <option value="Director">Director</option>
            <option value="Manager">Manager</option>
            <option value="Founder">Founder</option>
          </select>

          {/*  */}
          <select
            value={filters.companySize}
            onChange={(e) => setFilters({...filters, companySize: e.target.value})}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Sizes</option>
            <option value="1-50">1-50 employees</option>
            <option value="50-250">50-250 employees</option>
            <option value="250-1000">250-1K employees</option>
            <option value="1000+">1000+ employees</option>
          </select>

          {/*  */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>

          {/*  */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="High Priority">High Priority</option>
            <option value="Medium Priority">Medium Priority</option>
            <option value="Low Priority">Low Priority</option>
          </select>

          {/*  */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="relevance">Relevance</option>
            <option value="company">Company A-Z</option>
            <option value="email">Email A-Z</option>
            <option value="priority">Priority</option>
            <option value="date">Date Added</option>
          </select>
        </div>

        {/*  */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CRMProfile */}
      {showPersonas ? (
        <PersonaSearchInterface 
          personas={results.prospects || []}
          onPersonaSelect={(persona) => console.log('Selected persona:', persona)}
          realTimeUpdates={results}
        />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredProspects.map((prospect, i) => (
          <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-5 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-gray-600 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/*  - CRM */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(prospect.company || prospect.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">
                      {prospect.company || prospect.name || 'Unknown Company'}
                    </h4>
                    {prospect.name && prospect.company && (
                      <p className="text-gray-300 text-sm">{prospect.name}</p>
                    )}
                  </div>
                  {/*  */}
                  <div className="flex flex-col space-y-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prospect.category === 'High Priority' ? 'bg-green-600/30 text-green-300 border border-green-500/30' :
                      prospect.category === 'Medium Priority' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/30' :
                      prospect.category === 'Low Priority' ? 'bg-gray-600/30 text-gray-300 border border-gray-500/30' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {prospect.category || 'Uncategorized'}
                    </span>
                    {prospect.score && (
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Score: </span>
                        <span className="text-xs font-bold text-blue-300">{prospect.score}/10</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/*  - CRM */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {prospect.email && (
                    <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-300 truncate">{prospect.email}</span>
                    </div>
                  )}
                  {prospect.title && (
                    <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                      <UserCheck className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-300 truncate">{prospect.title}</span>
                    </div>
                  )}
                  {prospect.industry && (
                    <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                      <Building className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">{prospect.industry}</span>
                    </div>
                  )}
                  {prospect.location && (
                    <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                      <Globe className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-300">{prospect.location}</span>
                    </div>
                  )}
                </div>

                {/* Persona */}
                {(prospect.companySize || prospect.budget || prospect.buyingStage || prospect.techStack) && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {prospect.companySize && (
                      <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                        <div className="text-xs text-blue-400 font-medium">Company Size</div>
                        <div className="text-sm text-white">{prospect.companySize}</div>
                      </div>
                    )}
                    {prospect.budget && (
                      <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/20">
                        <div className="text-xs text-green-400 font-medium">Budget</div>
                        <div className="text-sm text-white">{prospect.budget}</div>
                      </div>
                    )}
                    {prospect.buyingStage && (
                      <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                        <div className="text-xs text-purple-400 font-medium">Buying Stage</div>
                        <div className="text-sm text-white">{prospect.buyingStage}</div>
                      </div>
                    )}
                    {prospect.responseRate && (
                      <div className="bg-orange-900/20 rounded-lg p-2 border border-orange-500/20">
                        <div className="text-xs text-orange-400 font-medium">Response Rate</div>
                        <div className="text-sm text-white">{Math.round(prospect.responseRate * 100)}%</div>
                      </div>
                    )}
                  </div>
                )}

                {/*  */}
                {prospect.techStack && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 font-medium mb-1">Tech Stack</div>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(prospect.techStack) ? prospect.techStack : [prospect.techStack])
                        .slice(0, 4)
                        .map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded text-xs border border-cyan-500/30">
                            {tech}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/*  */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {prospect.interests && prospect.interests.length > 0 && (
                    <div>
                      <div className="text-xs text-green-400 font-medium mb-1">Interests</div>
                      <div className="text-xs text-gray-300">
                        {prospect.interests.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                  {prospect.painPoints && prospect.painPoints.length > 0 && (
                    <div>
                      <div className="text-xs text-red-400 font-medium mb-1">Pain Points</div>
                      <div className="text-xs text-gray-300">
                        {prospect.painPoints.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Source URL */}
                {prospect.sourceUrl && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 font-medium mb-1">Source</div>
                    <a 
                      href={prospect.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                    >
                      {prospect.sourceUrl}
                    </a>
                  </div>
                )}
                
                {/* AI Generated User Persona */}
                {prospect.userPersona && (
                  <div className="mt-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-base font-bold text-purple-300">AI Generated Persona</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{prospect.userPersona.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Style:</span>
                        <span className="text-white">{prospect.userPersona.communicationStyle}</span>
                      </div>
                      {prospect.userPersona.primaryMotivations && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Motivations:</span>
                          <span className="text-white">{prospect.userPersona.primaryMotivations.slice(0,2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/*  */}
                {(prospect.tags || prospect.keywords) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Array.isArray(prospect.tags) ? prospect.tags : [prospect.tags])
                      .concat(Array.isArray(prospect.keywords) ? prospect.keywords : [prospect.keywords])
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/*  */}
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // 
                    onFieldUpdate(`prospect_${i}`, prospect);
                  }}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // 
                    if (prospect.email) {
                      navigator.clipboard.writeText(prospect.email);
                    }
                  }}
                  className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          ))}
          
          {filteredProspects.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No prospects found matching your criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
};

//  - Prospect Search
const PersonaSearchInterface = ({ personas, onPersonaSelect, realTimeUpdates }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    jobTitle: '',
    companySize: '',
    dateRange: 'all',
    confidence: 'all'
  });
  const [filteredPersonas, setFilteredPersonas] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Convert real prospects to enhanced personas format
  const convertProspectsToPersonas = (prospects) => {
    return prospects
      .filter(prospect => prospect.email && prospect.name) // Filter valid prospects
      .map((prospect, index) => ({
        id: index + 1,
        name: prospect.name || prospect.email.split('@')[0],
        email: prospect.email,
        jobTitle: prospect.persona?.estimatedRole || prospect.title || 'Business Professional',
        company: prospect.company || prospect.domain?.split('.')[0] || 'Unknown Company',
        companySize: prospect.companySize || prospect.persona?.companySize || '1-50',
        industry: prospect.industry || 'Technology',
        location: prospect.location || 'Unknown',
        country: 'Unknown',
        sourceWebsite: prospect.sourceUrl || prospect.source || 'website_scraping',
        confidence: prospect.confidence || 0.75,
        lastUpdated: new Date().toISOString().split('T')[0],
        linkedinUrl: prospect.linkedinUrl || prospect.persona?.linkedinUrl || '#',
        personalityTraits: prospect.persona?.personalityTraits || prospect.persona?.personalizationTips || ['Professional', 'Business-focused'],
        painPoints: prospect.persona?.primaryPainPoints || prospect.painPoints || ['Efficiency', 'Growth', 'Cost optimization'],
        interests: prospect.interests || prospect.persona?.interests || ['Business growth', 'Technology'],
        recentActivity: ['Email discovered via AI search'],
        companyInfo: {
          revenue: 'Unknown',
          employees: prospect.companySize || '1-50',
          techStack: prospect.techStack || prospect.persona?.techStack || ['Unknown'],
          recentFunding: 'Unknown'
        },
        verificationStatus: prospect.confidence > 0.8 ? 'verified' : 'pending',
        responseRate: prospect.responseRate || Math.round((prospect.confidence || 0.75) * 100) / 100,
        department: prospect.persona?.department || 'Business'
      }));
  };

  // Use real prospects as personas
  const realPersonas = convertProspectsToPersonas(personas);
  
  // No fallback personas - show "generating..." if no real data
  const displayPersonas = realPersonas.length > 0 ? realPersonas : [];

  // Filter personas based on search and filters
  useEffect(() => {
    let filtered = displayPersonas;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(persona =>
        persona.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.industry) {
      filtered = filtered.filter(persona => 
        persona.industry?.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }
    if (filters.location) {
      filtered = filtered.filter(persona => 
        persona.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
        persona.country?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.jobTitle) {
      filtered = filtered.filter(persona => 
        persona.jobTitle?.toLowerCase().includes(filters.jobTitle.toLowerCase()) ||
        persona.department?.toLowerCase().includes(filters.jobTitle.toLowerCase())
      );
    }
    if (filters.companySize && filters.companySize !== 'all') {
      filtered = filtered.filter(persona => persona.companySize === filters.companySize);
    }
    if (filters.confidence && filters.confidence !== 'all') {
      const minConfidence = parseFloat(filters.confidence);
      filtered = filtered.filter(persona => persona.confidence >= minConfidence);
    }
    if (filters.dateRange !== 'all') {
      const daysAgo = {
        '1': 1,
        '7': 7,
        '30': 30
      }[filters.dateRange] || 365;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      filtered = filtered.filter(persona => {
        const personaDate = new Date(persona.lastUpdated);
        return personaDate >= cutoffDate;
      });
    }

    setFilteredPersonas(filtered);
  }, [searchQuery, filters, displayPersonas]);

  const clearFilters = () => {
    setFilters({
      industry: '',
      location: '',
      jobTitle: '',
      companySize: '',
      dateRange: 'all',
      confidence: 'all'
    });
    setSearchQuery('');
  };

  const getVerificationIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.8) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-4">
      {/* CRM-Style Persona Search Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-cyan-400 font-semibold text-lg flex items-center">
          <Users className="w-5 h-5 mr-3" />
          Persona Database
          <div className="ml-3 px-3 py-1 bg-cyan-500/20 rounded-full">
            <span className="text-sm text-cyan-300">{filteredPersonas.length} profiles</span>
          </div>
        </h4>
        {realTimeUpdates?.lastUpdate && (
          <span className="text-sm text-gray-400">
            Updated {realTimeUpdates.lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search personas by name, company, job title, email, or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-lg"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Filters</span>
          {showAdvancedFilters ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Clear All Filters
        </button>
      </div>

      {/* Advanced Filters Grid */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Industry</label>
            <select
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Industries</option>
              <option value="Software Development">Software Development</option>
              <option value="Marketing Technology">Marketing Technology</option>
              <option value="Financial Technology">Financial Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="E-commerce">E-commerce</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Location</label>
            <input
              type="text"
              placeholder="City, Country"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Job Title/Department</label>
            <input
              type="text"
              placeholder="Title or Department"
              value={filters.jobTitle}
              onChange={(e) => setFilters({...filters, jobTitle: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Company Size</label>
            <select
              value={filters.companySize}
              onChange={(e) => setFilters({...filters, companySize: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Sizes</option>
              <option value="1-50">1-50 employees</option>
              <option value="50-100">50-100 employees</option>
              <option value="100-250">100-250 employees</option>
              <option value="250-500">250-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Confidence Level</label>
            <select
              value={filters.confidence}
              onChange={(e) => setFilters({...filters, confidence: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Levels</option>
              <option value="0.9">90%+ High</option>
              <option value="0.8">80%+ Good</option>
              <option value="0.7">70%+ Fair</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block font-medium">Date Added</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>
      )}

      {/* Enhanced Persona Cards */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredPersonas.length > 0 ? (
          filteredPersonas.map((persona) => (
            <div
              key={persona.id}
              onClick={() => onPersonaSelect(persona)}
              className="p-5 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-xl cursor-pointer transition-all duration-300 border border-gray-600 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {/* Profile Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {persona.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Basic Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-bold text-white text-lg">{persona.name}</h5>
                      {getVerificationIcon(persona.verificationStatus)}
                      <span className={`text-sm font-bold ${getConfidenceColor(persona.confidence)}`}>
                        {Math.round(persona.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-cyan-400 font-medium">{persona.jobTitle} at {persona.company}</p>
                    <p className="text-xs text-gray-400">{persona.location} • {persona.industry}</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {persona.lastUpdated}
                </div>
              </div>

              {/* Contact & Company Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 truncate">{persona.email}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{persona.companySize} employees</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">{Math.round(persona.responseRate * 100)}% response rate</span>
                </div>
                {persona.sourceWebsite && (
                  <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-2">
                    <ExternalLink className="w-4 h-4 text-orange-400" />
                    <a href={persona.sourceWebsite} target="_blank" rel="noopener noreferrer" 
                       className="text-sm text-orange-300 hover:text-orange-200 truncate">
                      Source
                    </a>
                  </div>
                )}
              </div>

              {/* Enhanced Details Grid */}
              <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                <div>
                  <span className="text-gray-400 font-medium">Pain Points:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.painPoints?.slice(0, 2).map((pain, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full text-xs">
                        {pain}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Interests:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.interests?.slice(0, 2).map((interest, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Traits:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.personalityTraits?.slice(0, 2).map((trait, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tech Stack & Recent Activity */}
              {persona.companyInfo?.techStack && (
                <div className="mb-3">
                  <span className="text-xs text-gray-400 font-medium">Tech Stack:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.companyInfo.techStack.slice(0, 4).map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            {displayPersonas.length === 0 && realPersonas.length === 0 ? (
              // Show "generating..." when no real prospects found yet
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                <p className="text-cyan-400 mb-2 text-lg">Generating personas...</p>
                <p className="text-sm text-gray-500">Finding and analyzing prospects from your marketing campaign</p>
              </>
            ) : (
              // Show no match message when there are personas but none match filters
              <>
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2 text-lg">No personas match your search criteria</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Results Summary & Actions */}
      {filteredPersonas.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-600">
          <span className="text-sm text-gray-400 font-medium">
            Showing {filteredPersonas.length} of {displayPersonas.length} personas
          </span>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-medium transition-colors">
              Export Results
            </button>
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium transition-colors">
              Save Query
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

//  - 
const EmailGenerationDisplay = ({ results, onFieldUpdate }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingEmail, setEditingEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('customers'); // 'customers' or 'timeline'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  //  
  useEffect(() => {
    return () => {
      // 
      setIsGenerating(false);
      setGenerationProgress(0);
      console.log(' EmailGenerationDisplay ');
    };
  }, []);

  const emails = Array.isArray(results.emails) ? results.emails : [];

  // Email Template Type Definitions
  const emailTemplates = {
    'initial_outreach': {
      name: 'Initial Contact',
      timing: 'Immediate',
      color: 'bg-blue-600/30 text-blue-300',
      description: 'Establish initial contact, introduce value proposition'
    },
    'follow_up_1': {
      name: 'First Follow-up', 
      timing: '3 days later',
      color: 'bg-green-600/30 text-green-300',
      description: 'Provide additional value information, build trust'
    },
    'value_proposition': {
      name: 'Value Demonstration',
      timing: '7 days later', 
      color: 'bg-purple-600/30 text-purple-300',
      description: 'Detailed showcase of product value and case studies'
    },
    'social_proof': {
      name: 'Social Proof',
      timing: '10 days later',
      color: 'bg-yellow-600/30 text-yellow-300', 
      description: 'Share customer success stories and testimonials'
    },
    'urgency_scarcity': {
      name: 'Urgency Driver',
      timing: '14 days later',
      color: 'bg-orange-600/30 text-orange-300',
      description: 'Create urgency and drive decision-making'
    },
    'final_attempt': {
      name: 'Final Attempt',
      timing: '21 days later',
      color: 'bg-red-600/30 text-red-300',
      description: 'Last professional follow-up attempt'
    },
    're_engagement': {
      name: 'Re-engagement',
      timing: '3 months later',
      color: 'bg-indigo-600/30 text-indigo-300',
      description: 'Re-activate silent prospects'
    },
    'seasonal_campaign': {
      name: 'Seasonal Marketing',
      timing: 'Specific periods',
      color: 'bg-pink-600/30 text-pink-300',
      description: 'Season or holiday-based marketing campaigns'
    }
  };

  // 
  const organizeEmailsByCustomer = () => {
    const customerMap = new Map();
    
    emails.forEach((email, index) => {
      const customerId = email.prospect?.email || email.prospect?.company || `customer_${index}`;
      const customerName = email.prospect?.company || email.prospect?.name || 'Unknown Company';
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: customerName,
          email: email.prospect?.email,
          industry: email.prospect?.industry,
          priority: calculateCustomerPriority(email.prospect),
          emails: [],
          lastContact: null,
          nextAction: null
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.emails.push({
        ...email,
        originalIndex: index,
        template_type: email.template_type || 'initial_outreach',
        scheduled_date: email.scheduled_date || new Date(),
        status: email.status || 'draft'
      });
      
      // 
      const emailDate = new Date(email.scheduled_date || email.created_at || Date.now());
      if (!customer.lastContact || emailDate > customer.lastContact) {
        customer.lastContact = emailDate;
        customer.nextAction = getNextEmailAction(customer.emails);
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.priority - a.priority);
  };

  // 
  const calculateCustomerPriority = (prospect) => {
    let score = 0;
    if (prospect?.email && prospect.email.includes('@')) score += 3;
    if (prospect?.company) score += 2;
    if (prospect?.industry) score += 1;
    if (prospect?.title && (prospect.title.toLowerCase().includes('ceo') || 
        prospect.title.toLowerCase().includes('founder'))) score += 3;
    return score;
  };

  // 
  const getNextEmailAction = (emails) => {
    const templateSequence = ['initial_outreach', 'follow_up_1', 'value_proposition', 'social_proof', 'urgency_scarcity', 'final_attempt'];
    const usedTemplates = emails.map(e => e.template_type);
    const nextTemplate = templateSequence.find(t => !usedTemplates.includes(t));
    return nextTemplate ? emailTemplates[nextTemplate] : emailTemplates['re_engagement'];
  };

  const customerData = organizeEmailsByCustomer();

  //   - 
  const generateEmailsForCustomer = async (customer, templateType) => {
    // 
    if (isGenerating) {
      console.log(' ...');
      return;
    }

    let isCancelled = false; // 
    
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      // 
      const updateProgress = async (targetProgress) => {
        if (isCancelled) return;
        const currentProgress = generationProgress;
        const steps = Math.max(1, Math.abs(targetProgress - currentProgress) / 5);
        
        for (let i = 0; i < steps && !isCancelled; i++) {
          const progress = currentProgress + ((targetProgress - currentProgress) * (i + 1) / steps);
          setGenerationProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };

      // 
      await updateProgress(30);
      
      if (isCancelled) return;

      // API
      console.log(' ...', { customer: customer.name, templateType });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30
      
      await updateProgress(60);
      
      const response = await fetch('/api/ollama/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer,
          template_type: templateType,
          marketing_strategy: results.marketing_strategy || {},
          previous_emails: customer.emails || []
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (isCancelled) return;
      
      await updateProgress(90);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newEmail = await response.json();
      
      if (isCancelled) return;
      
      // 
      if (onFieldUpdate && typeof onFieldUpdate === 'function') {
        onFieldUpdate(`new_email_${Date.now()}`, {
          prospect: customer,
          template_type: templateType,
          email_content: newEmail,
          status: 'draft',
          created_at: new Date().toISOString()
        });
      }
      
      await updateProgress(100);
      console.log(' ');
      
    } catch (error) {
      if (isCancelled) return;
      
      console.error(' :', error);
      
      // 
      let errorMessage = '';
      if (error.name === 'AbortError') {
        errorMessage = '';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '';
      } else if (error.message.includes('HTTP')) {
        errorMessage = '';
      }
      
      // toast
      if (window.toast) {
        window.toast.error(errorMessage);
      } else {
        alert(errorMessage);
      }
      
    } finally {
      // 
      if (!isCancelled) {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
        }, 500); // 
      }
    }

    // 
    return () => {
      isCancelled = true;
    };
  };

  //   - 
  const generateBulkEmails = async () => {
    // 
    if (isGenerating) {
      console.log(' ...');
      return;
    }

    let isCancelled = false;
    
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      const totalCustomers = customerData.length;
      
      if (totalCustomers === 0) {
        console.log(' ');
        return;
      }
      
      console.log(` ${totalCustomers}`);
      
      for (let i = 0; i < totalCustomers && !isCancelled; i++) {
        const customer = customerData[i];
        
        try {
          const nextTemplate = getNextEmailAction(customer.emails);
          
          // 
          const progress = ((i + 1) / totalCustomers) * 100;
          setGenerationProgress(progress);
          
          console.log(`  ${customer.name}  (${i + 1}/${totalCustomers})`);
          
          // 
          await generateEmailsForCustomer(customer, nextTemplate.name);
          
          // 
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (customerError) {
          console.error(`  ${customer.name} :`, customerError);
          // 
        }
      }
      
      if (!isCancelled) {
        setGenerationProgress(100);
        console.log(' ');
        
        // 
        if (window.toast) {
          window.toast.success(`${totalCustomers}`);
        }
      }
      
    } catch (error) {
      if (!isCancelled) {
        console.error(' :', error);
        
        // 
        if (window.toast) {
          window.toast.error('');
        } else {
          alert('');
        }
      }
    } finally {
      if (!isCancelled) {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress(0);
        }, 1000);
      }
    }

    // 
    return () => {
      isCancelled = true;
    };
  };

  return (
    <div className="space-y-4">
      {/*  */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
            
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'customers' ? 'timeline' : 'customers')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center space-x-1"
            >
              {viewMode === 'customers' ? <Calendar className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              <span>{viewMode === 'customers' ? '' : ''}</span>
            </button>
          </div>
        </div>

        {/*  */}
        <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-4 border border-green-500/30 mb-4">
          <h4 className="text-green-300 font-bold mb-3 flex items-center text-base">
            <Mail className="w-5 h-5 mr-2" />
            Real-Time Email Generation Status
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{emails.length}</div>
              <div className="text-xs text-gray-400">Generated Emails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{customerData.length}</div>
              <div className="text-xs text-gray-400">Active Prospects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{Object.keys(emailTemplates).length}</div>
              <div className="text-xs text-gray-400">Template Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {isGenerating ? `${Math.round(generationProgress)}%` : 'Ready'}
              </div>
              <div className="text-xs text-gray-400">Generation Status</div>
            </div>
          </div>
        </div>

        {/*  */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-400">{customerData.length}</div>
            <div className="text-xs text-gray-400"></div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-green-400">{emails.length}</div>
            <div className="text-xs text-gray-400"></div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-400">{Object.keys(emailTemplates).length}</div>
            <div className="text-xs text-gray-400"></div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-xl font-bold text-orange-400">
              {isGenerating ? `${Math.round(generationProgress)}%` : ''}
            </div>
            <div className="text-xs text-gray-400"></div>
          </div>
        </div>

        {/*  */}
        <div className="flex space-x-3">
          <button
            onClick={generateBulkEmails}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isGenerating 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? '...' : ''}</span>
          </button>
          
          {isGenerating && (
            <div className="flex-1 bg-gray-700 rounded-full h-8 flex items-center px-3">
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm text-gray-300">{Math.round(generationProgress)}%</span>
            </div>
          )}
        </div>
      </div>

      {/*  */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            placeholder="..."
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all"></option>
          <option value="high_priority"></option>
          <option value="active"></option>
          <option value="needs_follow_up"></option>
        </select>
      </div>

      {/*  */}
      {viewMode === 'customers' && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {customerData
            .filter(customer => {
              if (!searchTerm) return true;
              return (
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
              );
            })
            .map((customer) => (
            <div key={customer.id} className="bg-gray-700 rounded-lg border border-gray-600">
              {/*  */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedCustomer(selectedCustomer === customer.id ? null : customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-white">{customer.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.priority >= 7 ? 'bg-green-600/30 text-green-300' :
                        customer.priority >= 4 ? 'bg-yellow-600/30 text-yellow-300' :
                        'bg-gray-600/30 text-gray-300'
                      }`}>
                         {customer.priority}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{customer.email}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>: {customer.emails.length}</span>
                      <span>: {customer.lastContact ? new Date(customer.lastContact).toLocaleDateString('zh-CN') : ''}</span>
                      {customer.nextAction && (
                        <span className={`px-2 py-1 rounded ${customer.nextAction.color}`}>
                          : {customer.nextAction.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateEmailsForCustomer(customer, customer.nextAction?.name || 'initial_outreach');
                      }}
                      disabled={isGenerating}
                      className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                      selectedCustomer === customer.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
              </div>

              {/*  */}
              {selectedCustomer === customer.id && (
                <div className="border-t border-gray-600 bg-gray-800/50">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-300"></h5>
                      <div className="flex space-x-2">
                        {Object.entries(emailTemplates).map(([key, template]) => (
                          <button
                            key={key}
                            onClick={() => generateEmailsForCustomer(customer, key)}
                            disabled={isGenerating}
                            className={`px-2 py-1 rounded text-sm transition-colors font-medium ${template.color} hover:opacity-80 disabled:opacity-50`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {customer.emails.length > 0 ? (
                      <div className="space-y-2">
                        {customer.emails
                          .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
                          .map((email, index) => {
                            const emailId = `${customer.id}_${index}`;
                            const isExpanded = editingEmail === emailId;
                            return (
                          <div key={index} className="bg-gray-700 rounded border border-gray-600 overflow-hidden">
                            {/*  */}
                            <div 
                              className="p-3 cursor-pointer hover:bg-gray-600 transition-colors"
                              onClick={() => setEditingEmail(isExpanded ? null : emailId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${emailTemplates[email.template_type]?.color || 'bg-gray-600/30 text-gray-300'}`}>
                                      {emailTemplates[email.template_type]?.name || email.template_type}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      email.status === 'sent' ? 'bg-green-600/30 text-green-300' :
                                      email.status === 'scheduled' ? 'bg-blue-600/30 text-blue-300' :
                                      'bg-gray-600/30 text-gray-300'
                                    }`}>
                                      {email.status || 'draft'}
                                    </span>
                                    {email.email_content?.template_used && (
                                      <span className="px-2 py-1 rounded text-xs bg-purple-600/30 text-purple-300 font-medium">
                                        {email.email_content.template_used}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-200 mt-2 font-medium">
                                     {email.email_content?.subject || ''}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    {email.email_content?.body ? 
                                      email.email_content.body.substring(0, 120) + '...' : 
                                      ''}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    <span> : {new Date(email.scheduled_date).toLocaleString('zh-CN')}</span>
                                    {email.email_content?.body && (
                                      <span> : {email.email_content.body.length} </span>
                                    )}
                                    {email.sent_at && (
                                      <span className="text-green-400"> : {new Date(email.sent_at).toLocaleString('zh-CN')}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onFieldUpdate(`email_send_${customer.id}_${index}`, { 
                                        ...email, 
                                        status: 'sent',
                                        sent_at: new Date().toISOString()
                                      });
                                    }}
                                    disabled={email.status === 'sent'}
                                    className="p-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded text-xs transition-colors"
                                    title={email.status === 'sent' ? '' : ''}
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} />
                                </div>
                              </div>
                            </div>

                            {/*  */}
                            {isExpanded && (
                              <div className="border-t border-gray-600 bg-gray-800/50 p-4">
                                <div className="space-y-4">
                                  {/*  */}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <h6 className="text-gray-400 font-medium mb-2"> </h6>
                                      <div className="space-y-1">
                                        <p><span className="text-gray-500">:</span> <span className="text-blue-400">{customer.email}</span></p>
                                        <p><span className="text-gray-500">:</span> <span className="text-gray-300">{customer.name}</span></p>
                                        <p><span className="text-gray-500">:</span> <span className="text-purple-400">{emailTemplates[email.template_type]?.name || email.template_type}</span></p>
                                        <p><span className="text-gray-500">:</span> 
                                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                            email.status === 'sent' ? 'bg-green-600/30 text-green-300' :
                                            email.status === 'scheduled' ? 'bg-blue-600/30 text-blue-300' :
                                            'bg-gray-600/30 text-gray-300'
                                          }`}>
                                            {email.status || 'draft'}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <h6 className="text-gray-400 font-medium mb-2">⏰ </h6>
                                      <div className="space-y-1">
                                        <p><span className="text-gray-500">:</span> <span className="text-gray-300">{email.created_at ? new Date(email.created_at).toLocaleString('zh-CN') : ''}</span></p>
                                        <p><span className="text-gray-500">:</span> <span className="text-blue-400">{new Date(email.scheduled_date).toLocaleString('zh-CN')}</span></p>
                                        {email.sent_at && (
                                          <p><span className="text-gray-500">:</span> <span className="text-green-400">{new Date(email.sent_at).toLocaleString('zh-CN')}</span></p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/*  */}
                                  {email.email_content && (
                                    <div>
                                      <h6 className="text-gray-400 font-medium mb-3"> </h6>
                                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                        <div className="mb-3">
                                          <label className="text-xs text-gray-500 uppercase tracking-wide"></label>
                                          <p className="text-sm text-white font-medium mt-1 p-2 bg-gray-700 rounded">
                                            {email.email_content.subject || ''}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-500 uppercase tracking-wide"></label>
                                          <div className="text-sm text-gray-200 mt-1 p-3 bg-gray-700 rounded whitespace-pre-wrap">
                                            {email.email_content.body || ''}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/*  */}
                                  <div className="flex space-x-2 pt-2 border-t border-gray-700">
                                    <button
                                      onClick={() => {
                                        // Copy email content to clipboard
                                        navigator.clipboard.writeText(`Subject: ${email.email_content?.subject}\n\n${email.email_content?.body}`);
                                      }}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                    >
                                       
                                    </button>
                                    <button
                                      onClick={() => setEditingEmail(`edit_${emailId}`)}
                                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
                                    >
                                       
                                    </button>
                                    <button
                                      onClick={() => {
                                        onFieldUpdate(`email_send_${customer.id}_${index}`, { 
                                          ...email, 
                                          status: 'sent',
                                          sent_at: new Date().toISOString()
                                        });
                                      }}
                                      disabled={email.status === 'sent'}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded text-sm transition-colors"
                                    >
                                      {email.status === 'sent' ? ' ' : ' '}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/*  */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3"></h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(emailTemplates).map(([key, template]) => (
                <div key={key} className={`p-3 rounded border border-gray-600 ${template.color.replace('/30', '/10')}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-white">{template.name}</h5>
                      <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                      <p className="text-xs text-gray-500 mt-1">: {template.timing}</p>
                    </div>
                    <button
                      onClick={() => {
                        // 
                        customerData.forEach(customer => {
                          generateEmailsForCustomer(customer, key);
                        });
                      }}
                      disabled={isGenerating}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  */}
      {editingEmail !== null && (
        <EmailEditModal
          email={(() => {
            if (typeof editingEmail === 'string' && editingEmail.includes('_')) {
              const [customerId, emailIndex] = editingEmail.split('_');
              const customer = customerData.find(c => c.id === customerId);
              return customer?.emails[parseInt(emailIndex)];
            }
            return emails[editingEmail];
          })()}
          onSave={(updatedEmail) => {
            onFieldUpdate(`email_updated_${editingEmail}`, updatedEmail);
            setEditingEmail(null);
          }}
          onClose={() => setEditingEmail(null)}
        />
      )}
    </div>
  );
};

// 
const EmailEditModal = ({ email, onSave, onClose }) => {
  const [editedEmail, setEditedEmail] = useState({
    ...email,
    email_content: {
      subject: email?.email_content?.subject || '',
      body: email?.email_content?.body || ''
    }
  });

  const handleSave = () => {
    onSave(editedEmail);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Edit Email</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/*  */}
          <div>
            <label className="block text-base font-bold text-gray-300 mb-2">To</label>
            <input
              type="email"
              value={editedEmail.prospect?.email || ''}
              onChange={(e) => setEditedEmail({
                ...editedEmail,
                prospect: { ...editedEmail.prospect, email: e.target.value }
              })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              placeholder="recipient@example.com"
            />
          </div>

          {/*  */}
          <div>
            <label className="block text-base font-bold text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              value={editedEmail.email_content.subject}
              onChange={(e) => setEditedEmail({
                ...editedEmail,
                email_content: { ...editedEmail.email_content, subject: e.target.value }
              })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              placeholder="Email subject..."
            />
          </div>

          {/*  */}
          <div>
            <label className="block text-base font-bold text-gray-300 mb-2">Content</label>
            <textarea
              value={editedEmail.email_content.body}
              onChange={(e) => setEditedEmail({
                ...editedEmail,
                email_content: { ...editedEmail.email_content, body: e.target.value }
              })}
              rows={12}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Email content..."
            />
          </div>

          {/*  */}
          <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
            <p className="text-xs text-gray-400 mb-2">Available Variables (click to insert)</p>
            <div className="flex flex-wrap gap-2">
              {['{{company}}', '{{name}}', '{{title}}', '{{industry}}'].map(variable => (
                <button
                  key={variable}
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = editedEmail.email_content.body;
                    const newText = text.substring(0, start) + variable + text.substring(end);
                    setEditedEmail({
                      ...editedEmail,
                      email_content: { ...editedEmail.email_content, body: newText }
                    });
                  }}
                  className="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded text-xs hover:bg-indigo-600/50"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          {/*  */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save & Learn</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

//  - 
const StepEditForm = ({ stepId, data, onChange, onSave, onCancel }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-base font-bold text-gray-300 mb-2">Company Name</label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            placeholder="Enter company name..."
          />
        </div>
        <div>
          <label className="block text-base font-bold text-gray-300 mb-2">Industry</label>
          <input
            type="text"
            value={data.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            placeholder="Enter industry..."
          />
        </div>
        <div>
          <label className="block text-base font-bold text-gray-300 mb-2">Value Proposition</label>
          <textarea
            value={data.valueProposition || ''}
            onChange={(e) => handleChange('valueProposition', e.target.value)}
            rows={4}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-colors"
            placeholder="Describe the value proposition..."
          />
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onSave} 
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Learn</span>
          </button>
          <button 
            onClick={onCancel} 
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return <div className="text-gray-400">Edit form not implemented for this step</div>;
};


export default WorkflowStyleDashboard;