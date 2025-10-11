import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Settings, Users, Target, Search, Mail, 
  Eye, ChevronRight, ChevronDown, RefreshCw, Brain,
  Globe, MessageSquare, TrendingUp, Clock, AlertCircle,
  CheckCircle, Loader, FileText, Database, Send, Zap, X,
  Sparkles, BarChart3, UserCheck, Repeat, Home, Activity,
  List, MailCheck, ChevronLeft, Filter, Download, Upload,
  Edit, ThumbsUp, ThumbsDown, Save, RotateCcw, Menu,
  Plus, Minus, Star, Calendar
} from 'lucide-react';

const ComprehensiveDashboard = ({ agentConfig, onReset }) => {
  // 状态管理
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('workflow');
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: 'website_analysis',
      title: '网站分析',
      icon: Globe,
      status: 'pending',
      progress: 0,
      results: null,
      userFeedback: null,
      allowEdit: true
    },
    {
      id: 'search_strategy',
      title: '营销策略',
      icon: Target,
      status: 'pending',
      progress: 0,
      results: null,
      userFeedback: null,
      allowEdit: true
    },
    {
      id: 'prospect_search',
      title: '潜在客户搜索',
      icon: Search,
      status: 'pending',
      progress: 0,
      results: null,
      userFeedback: null,
      allowEdit: false
    },
    {
      id: 'email_generation',
      title: '邮件生成',
      icon: Mail,
      status: 'pending',
      progress: 0,
      results: null,
      userFeedback: null,
      allowEdit: true
    }
  ]);

  const [agentStatus, setAgentStatus] = useState({
    isRunning: false,
    currentTask: '准备启动...',
    lastUpdate: new Date()
  });

  const [dashboardData, setDashboardData] = useState({
    totalProspects: 0,
    emailsSent: 0,
    responseRate: 0,
    activeClients: [],
    recentActivity: []
  });

  const [editingStep, setEditingStep] = useState(null);
  const [editData, setEditData] = useState({});

  // 侧边栏菜单项
  const sidebarItems = [
    { 
      id: 'workflow', 
      icon: Activity, 
      label: '工作流', 
      count: workflowSteps.filter(s => s.status === 'running').length,
      active: activeSection === 'workflow'
    },
    { 
      id: 'prospects', 
      icon: Users, 
      label: '潜在客户', 
      count: dashboardData.totalProspects,
      active: activeSection === 'prospects' 
    },
    { 
      id: 'emails', 
      icon: Mail, 
      label: '邮件队列', 
      count: 0,
      active: activeSection === 'emails'
    },
    { 
      id: 'sent', 
      icon: MailCheck, 
      label: '已发送', 
      count: dashboardData.emailsSent,
      active: activeSection === 'sent'
    },
    { 
      id: 'analytics', 
      icon: BarChart3, 
      label: '数据分析',
      active: activeSection === 'analytics'
    },
    { 
      id: 'learning', 
      icon: Brain, 
      label: 'AI学习',
      active: activeSection === 'learning'
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: '设置',
      active: activeSection === 'settings'
    }
  ];

  // 获取后端数据
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 获取客户数据
      const clientsResponse = await fetch('/api/agent/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setDashboardData(prev => ({
          ...prev,
          activeClients: clientsData.clients || [],
          totalProspects: clientsData.clients?.length || 0
        }));
      }

      // 获取AI Agent性能数据
      const performanceResponse = await fetch('/api/langgraph-agent/performance-monitor');
      if (performanceResponse.ok) {
        const perfData = await performanceResponse.json();
        if (perfData.success) {
          setDashboardData(prev => ({
            ...prev,
            emailsSent: perfData.data.total_emails_sent || 0,
            responseRate: perfData.data.average_response_rate || 0
          }));
        }
      }
    } catch (error) {
      console.error('获取dashboard数据失败:', error);
    }
  };

  // 启动LangGraph工作流
  const startLangGraphWorkflow = async () => {
    setAgentStatus(prev => ({ ...prev, isRunning: true, currentTask: '正在启动工作流...' }));
    
    try {
      // 模拟工作流步骤执行
      for (let i = 0; i < workflowSteps.length; i++) {
        const stepId = workflowSteps[i].id;
        
        // 更新当前步骤为运行中
        setWorkflowSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { ...step, status: 'running', progress: 0 }
            : step
        ));
        
        setAgentStatus(prev => ({ 
          ...prev, 
          currentTask: `正在执行: ${workflowSteps[i].title}...` 
        }));

        // 模拟执行步骤
        await simulateStepExecution(stepId);
      }

      setAgentStatus(prev => ({ 
        ...prev, 
        isRunning: false, 
        currentTask: '工作流完成！',
        lastUpdate: new Date()
      }));

    } catch (error) {
      console.error('工作流执行失败:', error);
      setAgentStatus(prev => ({ 
        ...prev, 
        isRunning: false, 
        currentTask: `错误: ${error.message}`,
        lastUpdate: new Date()
      }));
    }
  };

  // 模拟步骤执行
  const simulateStepExecution = async (stepId) => {
    const stepIndex = workflowSteps.findIndex(s => s.id === stepId);
    
    // 模拟进度更新
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setWorkflowSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, progress }
          : step
      ));
    }

    // 模拟结果生成
    const mockResults = generateMockResults(stepId);
    
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            status: 'completed', 
            progress: 100, 
            results: mockResults,
            timestamp: new Date()
          }
        : step
    ));
  };

  // 生成模拟结果
  const generateMockResults = (stepId) => {
    switch (stepId) {
      case 'website_analysis':
        return {
          companyName: '示例科技公司',
          industry: '人工智能',
          valueProposition: '提供创新的AI解决方案，帮助企业实现数字化转型',
          targetMarket: 'B2B企业客户',
          keyFeatures: ['AI分析', '自动化', '数据洞察']
        };
      case 'search_strategy':
        return {
          targetAudience: 'B2B企业决策者',
          searchKeywords: {
            primary: ['AI', '人工智能', '数字化转型'],
            secondary: ['企业解决方案', '自动化']
          },
          approach: '价值导向营销'
        };
      case 'prospect_search':
        return {
          totalFound: 156,
          prospects: [
            { email: 'ceo@techcorp.com', company: 'TechCorp', name: 'John Smith' },
            { email: 'cto@innovate.com', company: 'Innovate Inc', name: 'Jane Doe' },
            { email: 'vp@futuretech.com', company: 'FutureTech', name: 'Mike Johnson' }
          ]
        };
      case 'email_generation':
        return {
          totalGenerated: 156,
          emails: [
            {
              prospect: { email: 'ceo@techcorp.com', company: 'TechCorp' },
              subject: 'AI解决方案合作机会',
              body: '尊敬的Smith先生，我们想与TechCorp探讨AI解决方案的合作机会...'
            }
          ]
        };
      default:
        return {};
    }
  };

  // 处理用户编辑
  const handleEdit = (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (step?.results) {
      setEditingStep(stepId);
      setEditData({ ...step.results });
    }
  };

  // 保存编辑
  const saveEdit = async (stepId) => {
    try {
      // 发送反馈到后端
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'current',
          feedbackType: 'user_modification',
          feedback: {
            stepId,
            modifiedData: editData,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setWorkflowSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { 
                ...step, 
                results: { ...editData },
                userFeedback: { 
                  modified: true, 
                  timestamp: new Date() 
                }
              }
            : step
        ));
        
        setEditingStep(null);
        setEditData({});
        alert('修改已保存并反馈给AI系统学习！');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 渲染侧边栏
  const renderSidebar = () => (
    <div className={`bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h2 className="text-white font-semibold">LangGraph AI</h2>
              <p className="text-gray-400 text-xs">智能营销系统</p>
            </div>
          )}
        </div>
      </div>

      {/* 菜单项 */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* 切换按钮 */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center px-3 py-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // 渲染顶部控制栏
  const renderTopBar = () => (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">
            {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
          </h1>
          
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full">
            <div className={`w-2 h-2 rounded-full ${
              agentStatus.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-300">{agentStatus.currentTask}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={startLangGraphWorkflow}
            disabled={agentStatus.isRunning}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-white"
          >
            {agentStatus.isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>运行中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>启动工作流</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染工作流内容
  const renderWorkflowContent = () => (
    <div className="space-y-4">
      {workflowSteps.map(step => renderStepCard(step))}
    </div>
  );

  // 渲染步骤卡片
  const renderStepCard = (step) => {
    const Icon = step.icon;
    const isEditing = editingStep === step.id;

    return (
      <div key={step.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        {/* 步骤头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">{step.title}</h3>
              <p className="text-gray-400 text-sm">
                {step.status === 'completed' && '已完成'}
                {step.status === 'running' && '运行中...'}
                {step.status === 'pending' && '等待中'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {step.status === 'running' && <Loader className="w-5 h-5 text-blue-400 animate-spin" />}
            {step.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
          </div>
        </div>

        {/* 进度条 */}
        {step.progress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${step.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{step.progress}% 完成</p>
          </div>
        )}

        {/* 结果显示 */}
        {step.results && (
          <div className="bg-gray-900 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">结果数据</h4>
              {step.allowEdit && !isEditing && (
                <button
                  onClick={() => handleEdit(step.id)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <EditForm 
                stepId={step.id}
                data={editData}
                onChange={setEditData}
                onSave={() => saveEdit(step.id)}
                onCancel={() => setEditingStep(null)}
              />
            ) : (
              <ResultDisplay stepId={step.id} results={step.results} />
            )}
          </div>
        )}
      </div>
    );
  };

  // 渲染主要内容区域
  const renderMainContent = () => {
    switch (activeSection) {
      case 'workflow':
        return renderWorkflowContent();
      case 'prospects':
        return <ProspectsView clients={dashboardData.activeClients} />;
      case 'analytics':
        return <AnalyticsView data={dashboardData} />;
      case 'learning':
        return <LearningView />;
      default:
        return <div className="text-white">功能开发中...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* 侧边栏 */}
      {renderSidebar()}
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部控制栏 */}
        {renderTopBar()}
        
        {/* 主内容 */}
        <div className="flex-1 p-6 overflow-auto">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

// 结果显示组件
const ResultDisplay = ({ stepId, results }) => {
  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-2 text-sm text-gray-300">
        <p><span className="text-gray-400">公司名称:</span> {results.companyName}</p>
        <p><span className="text-gray-400">行业:</span> {results.industry}</p>
        <p><span className="text-gray-400">价值主张:</span> {results.valueProposition}</p>
      </div>
    );
  }

  if (stepId === 'search_strategy') {
    return (
      <div className="space-y-2 text-sm text-gray-300">
        <p><span className="text-gray-400">目标受众:</span> {results.targetAudience}</p>
        <p><span className="text-gray-400">主要关键词:</span> {results.searchKeywords?.primary?.join(', ')}</p>
        <p><span className="text-gray-400">营销方式:</span> {results.approach}</p>
      </div>
    );
  }

  if (stepId === 'prospect_search') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-300">找到潜在客户: <span className="text-white font-semibold">{results.totalFound}</span></p>
        <div className="space-y-2">
          {results.prospects?.slice(0, 3).map((prospect, i) => (
            <div key={i} className="text-xs text-gray-400 border-l-2 border-purple-500 pl-2">
              {prospect.name} - {prospect.company} ({prospect.email})
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="text-sm text-gray-300">处理中...</div>;
};

// 编辑表单组件
const EditForm = ({ stepId, data, onChange, onSave, onCancel }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-3">
      {stepId === 'website_analysis' && (
        <>
          <input
            type="text"
            placeholder="公司名称"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
          />
          <input
            type="text"
            placeholder="行业"
            value={data.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
          />
          <textarea
            placeholder="价值主张"
            value={data.valueProposition || ''}
            onChange={(e) => handleChange('valueProposition', e.target.value)}
            rows={3}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
          />
        </>
      )}
      
      <div className="flex space-x-2">
        <button onClick={onSave} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
          保存
        </button>
        <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">
          取消
        </button>
      </div>
    </div>
  );
};

// 潜在客户视图
const ProspectsView = ({ clients }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white">潜在客户管理</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients?.slice(0, 9).map((client, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium">{client.company || '未知公司'}</h3>
          <p className="text-gray-400 text-sm">{client.email}</p>
          <div className="mt-2 flex space-x-2">
            <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded">
              {client.industry || '未分类'}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 分析视图
const AnalyticsView = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-white">数据分析</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-400" />
          <div>
            <p className="text-gray-400 text-sm">总潜在客户</p>
            <p className="text-2xl font-bold text-white">{data.totalProspects}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Mail className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-gray-400 text-sm">已发送邮件</p>
            <p className="text-2xl font-bold text-white">{data.emailsSent}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-purple-400" />
          <div>
            <p className="text-gray-400 text-sm">回复率</p>
            <p className="text-2xl font-bold text-white">{(data.responseRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Star className="w-8 h-8 text-yellow-400" />
          <div>
            <p className="text-gray-400 text-sm">转化率</p>
            <p className="text-2xl font-bold text-white">12.5%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// AI学习视图
const LearningView = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-white">AI学习与优化</h2>
    
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-4">学习进展</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">搜索优化</span>
            <span className="text-purple-400">85%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">邮件优化</span>
            <span className="text-blue-400">72%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">策略优化</span>
            <span className="text-green-400">91%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ComprehensiveDashboard;