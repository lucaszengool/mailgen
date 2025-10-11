import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader, CheckCircle, XCircle, 
  ChevronDown, ChevronRight, Search, Mail, Building2,
  TrendingUp, MessageSquare, Brain, Globe, Database,
  FileText, Sparkles, ArrowRight, Clock, Activity,
  Target, Users, BarChart3, Link, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatGPTWorkflowInterface = ({ agentConfig, onReset }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ws, setWs] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const messagesEndRef = useRef(null);
  const [typingMessage, setTypingMessage] = useState('');
  const [showTyping, setShowTyping] = useState(false);

  // Step icons mapping
  const stepIcons = {
    'prospect_discovery': Search,
    'email_generation': Mail,
    'persona_analysis': Brain,
    'company_research': Building2,
    'market_analysis': TrendingUp,
    'content_optimization': Sparkles,
    'quality_check': Shield,
    'sending_emails': Send,
    'data_enrichment': Database,
    'web_search': Globe,
    'lead_scoring': Target,
    'segmentation': Users,
    'analytics': BarChart3,
    'integration': Link,
    'processing': Activity
  };

  // Connect to WebSocket
  useEffect(() => {
    console.log('Connecting to workflow WebSocket...');
    const wsInstance = new WebSocket('ws://localhost:3333/ws/workflow');
    setWs(wsInstance);
    
    wsInstance.onopen = () => {
      console.log('WebSocket connected!');
      addMessage('assistant', 'Hello! I\'m your AI Marketing Agent. I can help you discover prospects, research companies, and create personalized email campaigns. How can I assist you today?', null, 'ready');
    };

    wsInstance.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      handleWorkflowUpdate(data);
    };

    wsInstance.onerror = (error) => {
      console.error('WebSocket error:', error);
      addMessage('system', 'Connection error. Please refresh to reconnect.', null, 'error');
    };

    wsInstance.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsInstance) {
        wsInstance.close();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWorkflowUpdate = (data) => {
    if (data.type === 'workflow_update') {
      if (data.stepId && data.stepData) {
        const step = {
          id: data.stepId,
          title: data.stepData.title || data.stepId,
          description: data.stepData.description || '',
          status: data.stepData.status || 'running',
          details: data.stepData.details || {},
          metrics: data.stepData.metrics || {},
          timestamp: new Date().toISOString()
        };
        
        setCurrentStep(step);
        
        // Add or update step message
        if (data.stepData.status === 'running') {
          addStepMessage(step, 'running');
        } else if (data.stepData.status === 'completed') {
          updateStepStatus(step.id, 'completed', step.details);
        } else if (data.stepData.status === 'error') {
          updateStepStatus(step.id, 'error', step.details);
        }
      }
      
      // Handle prospects data
      if (data.prospects) {
        handleProspectsUpdate(data.prospects);
      }
      
      // Handle email campaign data
      if (data.emailCampaign) {
        handleEmailCampaignUpdate(data.emailCampaign);
      }
    }
  };

  const addMessage = (role, content, steps = null, status = 'active') => {
    const newMessage = {
      id: Date.now(),
      role,
      content,
      steps,
      status,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addStepMessage = (step, status) => {
    setMessages(prev => {
      const existingIndex = prev.findIndex(m => m.stepId === step.id);
      
      if (existingIndex !== -1) {
        // Update existing step
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          step: { ...step, status },
          status
        };
        return updated;
      } else {
        // Add new step
        return [...prev, {
          id: Date.now(),
          role: 'assistant',
          stepId: step.id,
          step: { ...step, status },
          status,
          timestamp: new Date().toISOString()
        }];
      }
    });
  };

  const updateStepStatus = (stepId, status, details) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.stepId === stepId 
          ? { ...msg, status, step: { ...msg.step, status, details } }
          : msg
      )
    );
  };

  const handleProspectsUpdate = (prospects) => {
    const summary = {
      total: prospects.length,
      byIndustry: {},
      bySize: {},
      topProspects: prospects.slice(0, 3)
    };
    
    prospects.forEach(p => {
      summary.byIndustry[p.industry] = (summary.byIndustry[p.industry] || 0) + 1;
      summary.bySize[p.company_size] = (summary.bySize[p.company_size] || 0) + 1;
    });
    
    addMessage('assistant', `🎯 **Prospect Discovery Complete!**

I found **${prospects.length} qualified prospects** matching your criteria:

**📊 Industry Breakdown:**
${Object.entries(summary.byIndustry).map(([industry, count]) => `• ${industry}: ${count} prospects`).join('\n')}

**🏢 Company Size Distribution:**
${Object.entries(summary.bySize).map(([size, count]) => `• ${size}: ${count} companies`).join('\n')}

**⭐ Top Prospects:**
${summary.topProspects.map((p, i) => `${i + 1}. **${p.name}** at ${p.company} (${p.industry})`).join('\n')}

Ready to create personalized email campaigns for these prospects!`, [{
      id: 'prospects_summary',
      title: `Found ${prospects.length} Qualified Prospects`,
      type: 'prospects',
      data: summary,
      status: 'completed'
    }], 'completed');
  };

  const handleEmailCampaignUpdate = (campaign) => {
    addMessage('assistant', null, [{
      id: 'email_campaign',
      title: 'Email Campaign Ready',
      type: 'campaign',
      data: {
        totalEmails: campaign.emails?.length || 0,
        templates: campaign.templates || [],
        performance: campaign.metrics || {}
      },
      status: 'completed'
    }], 'completed');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;
    
    // Add user message
    addMessage('user', inputValue);
    const userInput = inputValue;
    setInputValue('');
    setIsProcessing(true);
    
    // Simulate typing indicator
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      
      // Process the request
      if (userInput.toLowerCase().includes('find') || userInput.toLowerCase().includes('prospect')) {
        startProspectDiscovery(userInput);
      } else if (userInput.toLowerCase().includes('email') || userInput.toLowerCase().includes('campaign')) {
        startEmailCampaign(userInput);
      } else if (userInput.toLowerCase().includes('analyze') || userInput.toLowerCase().includes('research')) {
        startResearch(userInput);
      } else {
        addMessage('assistant', 'I can help you with:\n• Finding qualified prospects\n• Creating email campaigns\n• Researching companies\n• Analyzing market data\n\nWhat would you like to do?');
        setIsProcessing(false);
      }
    }, 1500);
  };

  const startProspectDiscovery = (query) => {
    addMessage('assistant', 'Starting prospect discovery process. I\'ll search for qualified leads based on your criteria.');
    
    // Send to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'start_workflow',
        workflow: 'prospect_discovery',
        query: query,
        config: agentConfig
      }));
    }
    
    // Simulate steps
    setTimeout(() => {
      addStepMessage({
        id: 'search_1',
        title: 'Searching LinkedIn & Professional Networks',
        description: 'Scanning 10,000+ profiles for matching criteria',
        status: 'running',
        details: {
          sources: ['LinkedIn', 'AngelList', 'Crunchbase'],
          filters: ['Industry: Technology', 'Role: Decision Maker', 'Company Size: 50-500']
        }
      }, 'running');
    }, 500);
    
    setTimeout(() => {
      updateStepStatus('search_1', 'completed', {
        found: 247,
        qualified: 89,
        highQuality: 34
      });
      
      addStepMessage({
        id: 'enrich_1',
        title: 'Enriching Prospect Data',
        description: 'Gathering contact information and company details',
        status: 'running',
        details: {
          dataPoints: ['Email', 'Phone', 'Social Profiles', 'Company Info']
        }
      }, 'running');
    }, 3000);
    
    setTimeout(() => {
      updateStepStatus('enrich_1', 'completed', {
        enriched: 89,
        emailsFound: 76,
        accuracy: '98%'
      });
      setIsProcessing(false);
    }, 5000);
  };

  const startEmailCampaign = (query) => {
    addMessage('assistant', 'Creating personalized email campaign. I\'ll craft compelling messages for each prospect.');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'start_workflow',
        workflow: 'email_campaign',
        query: query,
        config: agentConfig
      }));
    }
    
    setTimeout(() => {
      addStepMessage({
        id: 'analyze_1',
        title: 'Analyzing Target Audience',
        description: 'Understanding prospect needs and pain points',
        status: 'running',
        details: {
          segments: 3,
          personas: ['Technical Decision Maker', 'Business Executive', 'Department Head']
        }
      }, 'running');
    }, 500);
    
    setTimeout(() => {
      updateStepStatus('analyze_1', 'completed');
      
      addStepMessage({
        id: 'generate_1',
        title: 'Generating Personalized Content',
        description: 'Creating unique email copy for each prospect',
        status: 'running',
        details: {
          templates: 5,
          variations: 15,
          personalizationLevel: 'High'
        }
      }, 'running');
    }, 2500);
    
    setTimeout(() => {
      updateStepStatus('generate_1', 'completed', {
        emailsGenerated: 76,
        averageScore: 92,
        readyToSend: true
      });
      setIsProcessing(false);
    }, 4500);
  };

  const startResearch = (query) => {
    addMessage('assistant', 'Conducting comprehensive research and analysis.');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'start_workflow',
        workflow: 'research',
        query: query,
        config: agentConfig
      }));
    }
    
    setIsProcessing(false);
  };

  const toggleStepExpansion = (stepId) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const renderStepDetail = (step) => {
    const Icon = stepIcons[step.id?.split('_')[0]] || Activity;
    const isExpanded = expandedSteps.has(step.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => toggleStepExpansion(step.id)}
        >
          <div className="flex items-start space-x-3">
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${step.status === 'completed' ? 'bg-green-100' : 
                step.status === 'error' ? 'bg-red-100' : 
                'bg-blue-100 animate-pulse'}
            `}>
              <Icon className={`
                w-5 h-5
                ${step.status === 'completed' ? 'text-green-600' : 
                  step.status === 'error' ? 'text-red-600' : 
                  'text-blue-600'}
              `} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <div className="flex items-center space-x-2">
                  {step.status === 'running' && (
                    <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {step.status === 'error' && (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              
              {/* Quick metrics */}
              {step.details && Object.keys(step.details).length > 0 && (
                <div className="flex items-center space-x-4 mt-2">
                  {Object.entries(step.details).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">{key}:</span>
                      <span className="text-xs font-medium text-gray-700">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && step.details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100"
            >
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {/* Metrics Display */}
                  {step.details.found && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{step.details.found}</div>
                        <div className="text-xs text-blue-500 uppercase">Found</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{step.details.qualified || step.details.found}</div>
                        <div className="text-xs text-green-500 uppercase">Qualified</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{step.details.highQuality || step.details.qualified || Math.round((step.details.found || 0) * 0.3)}</div>
                        <div className="text-xs text-purple-500 uppercase">High Quality</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Visualization */}
                  {step.details.accuracy && (
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Data Accuracy</span>
                        <span className="text-sm font-bold text-green-600">{step.details.accuracy}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                          style={{ width: step.details.accuracy }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Sources/Filters */}
                  {(step.details.sources || step.details.filters) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {step.details.sources && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                            Data Sources
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {step.details.sources.map((source, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {step.details.filters && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                            Active Filters
                          </span>
                          <div className="space-y-1">
                            {step.details.filters.map((filter, idx) => (
                              <div key={idx} className="flex items-center text-xs text-gray-600">
                                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                {filter}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Other details */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(step.details).filter(([key]) => 
                      !['found', 'qualified', 'highQuality', 'accuracy', 'sources', 'filters'].includes(key)
                    ).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="mt-1">
                          {typeof value === 'object' ? (
                            <div className="text-sm text-gray-700">
                              {Array.isArray(value) ? (
                                <ul className="list-disc list-inside">
                                  {value.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <pre className="text-xs bg-white p-2 rounded">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Progress bar for running steps */}
                {step.status === 'running' && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderMessage = (message) => {
    if (message.role === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="flex items-start space-x-2 max-w-2xl">
            <div className="bg-gray-900 text-white rounded-lg px-4 py-2">
              <p className="text-sm">{message.content}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (message.role === 'assistant') {
      return (
        <div className="flex justify-start mb-4">
          <div className="flex items-start space-x-2 max-w-3xl">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              {message.content && (
                <div className="bg-gray-100 rounded-lg px-4 py-2 mb-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                </div>
              )}
              
              {message.step && (
                <div className="mt-2">
                  {renderStepDetail(message.step)}
                </div>
              )}
              
              {message.steps && message.steps.map((step, idx) => (
                <div key={step.id} className="mt-2">
                  {renderStepDetail(step)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Marketing Agent</h1>
              <p className="text-sm text-gray-500">Powered by Advanced AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${isProcessing ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
            `}>
              {isProcessing ? 'Processing' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id}>
              {renderMessage(message)}
            </div>
          ))}
          
          {/* Typing indicator */}
          {showTyping && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me to find prospects, create campaigns, or analyze companies..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className={`
                p-3 rounded-lg transition-all duration-200
                ${!inputValue.trim() || isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                }
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center space-x-2 mt-3">
            <span className="text-xs text-gray-500">Try:</span>
            <button
              onClick={() => setInputValue('Find tech startup CEOs in San Francisco')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              Find Prospects
            </button>
            <button
              onClick={() => setInputValue('Create email campaign for B2B software leads')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              Create Campaign
            </button>
            <button
              onClick={() => setInputValue('Analyze competitors in the AI space')}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              Market Research
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTWorkflowInterface;