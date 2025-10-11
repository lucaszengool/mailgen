import React, { useState, useEffect } from 'react';
import {
  Play, Pause, Settings, Users, Target, Search, Mail, 
  Eye, ChevronRight, ChevronDown, RefreshCw, Brain,
  Globe, MessageSquare, TrendingUp, Clock, AlertCircle,
  CheckCircle, Loader, FileText, Database, Send, Zap, X,
  Sparkles, BarChart3, UserCheck, Repeat, Home, Activity,
  List, MailCheck, ChevronLeft, Filter, Download, Upload,
  Edit, ThumbsUp, ThumbsDown, Save, RotateCcw
} from 'lucide-react';

const EnhancedWorkflowDashboard = ({ agentConfig, onReset }) => {
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
      results: null,
      userFeedback: null,
      allowEdit: true,
      editableFields: ['companyName', 'industry', 'valueProposition']
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
      results: null,
      userFeedback: null,
      allowEdit: true,
      editableFields: ['searchKeywords', 'targetAudience', 'approach']
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
      results: null,
      userFeedback: null,
      allowEdit: false
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
      userFeedback: null,
      allowEdit: true,
      editableFields: ['subject', 'body', 'tone']
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
      userFeedback: null,
      allowEdit: false
    }
  ]);

  const [selectedStep, setSelectedStep] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [editData, setEditData] = useState({});
  const [agentStatus, setAgentStatus] = useState({
    isRunning: false,
    currentTask: 'Ready to start...',
    lastUpdate: new Date()
  });

  // 启动LangGraph Agent工作流
  const startLangGraphWorkflow = async () => {
    console.log('🚀 Starting LangGraph Agent workflow...');
    setAgentStatus(prev => ({ ...prev, isRunning: true, currentTask: 'Starting workflow...' }));

    try {
      // 首先更新第一步状态
      setWorkflowSteps(prev => prev.map(step => 
        step.id === 'website_analysis' 
          ? { ...step, status: 'running', progress: 0 }
          : step
      ));

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
        console.log('✅ LangGraph workflow completed:', result.data);
        
        // 更新所有步骤结果
        updateWorkflowWithResults(result.data);
        
        setAgentStatus(prev => ({ 
          ...prev, 
          isRunning: false, 
          currentTask: 'Workflow completed successfully',
          lastUpdate: new Date()
        }));
      } else {
        throw new Error(result.error || 'Workflow failed');
      }
    } catch (error) {
      console.error('❌ LangGraph workflow error:', error);
      setAgentStatus(prev => ({ 
        ...prev, 
        isRunning: false, 
        currentTask: `Error: ${error.message}`,
        lastUpdate: new Date()
      }));
      
      // 更新失败状态
      setWorkflowSteps(prev => prev.map(step => 
        step.status === 'running' 
          ? { ...step, status: 'error', progress: 0 }
          : step
      ));
    }
  };

  // 更新工作流结果
  const updateWorkflowWithResults = (campaignData) => {
    setWorkflowSteps(prev => prev.map(step => {
      switch (step.id) {
        case 'website_analysis':
          return {
            ...step,
            status: 'completed',
            progress: 100,
            results: campaignData.businessAnalysis,
            userFeedback: null
          };
        case 'search_strategy':
          return {
            ...step,
            status: 'completed',
            progress: 100,
            results: campaignData.marketingStrategy,
            userFeedback: null
          };
        case 'prospect_search':
          return {
            ...step,
            status: 'completed',
            progress: 100,
            results: {
              prospects: campaignData.prospects || [],
              totalFound: campaignData.prospects?.length || 0
            },
            userFeedback: null
          };
        case 'email_generation':
          return {
            ...step,
            status: 'completed',
            progress: 100,
            results: campaignData.emailCampaign,
            userFeedback: null
          };
        case 'email_sending':
          return {
            ...step,
            status: 'pending',
            progress: 0,
            results: null,
            userFeedback: null
          };
        default:
          return step;
      }
    }));
  };

  // 处理用户编辑
  const handleEdit = (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (step && step.results) {
      setEditingStep(stepId);
      setEditData({ ...step.results });
    }
  };

  // 保存用户修改
  const saveEdit = async (stepId) => {
    try {
      console.log(`💾 Saving edits for step: ${stepId}`, editData);

      // 发送反馈到LangGraph Agent
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'current', // 使用当前活动ID
          feedbackType: getStepFeedbackType(stepId),
          feedback: {
            modified_content: editData,
            user_rating: 5,
            modifications: 'User edited content',
            timestamp: new Date().toISOString()
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
                userFeedback: { 
                  modified: true, 
                  timestamp: new Date().toISOString(),
                  rating: 5 
                }
              }
            : step
        ));
        
        setEditingStep(null);
        setEditData({});
        alert('修改已保存并发送给AI学习！');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('保存失败，请重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingStep(null);
    setEditData({});
  };

  // 提交反馈
  const submitFeedback = async (stepId, rating, comments) => {
    try {
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'current',
          feedbackType: getStepFeedbackType(stepId),
          feedback: {
            rating,
            comments,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setWorkflowSteps(prev => prev.map(step => 
          step.id === stepId 
            ? { 
                ...step,
                userFeedback: { 
                  rating, 
                  comments, 
                  timestamp: new Date().toISOString() 
                }
              }
            : step
        ));
        alert('反馈已提交给AI学习！');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('反馈提交失败');
    }
  };

  // 获取步骤对应的反馈类型
  const getStepFeedbackType = (stepId) => {
    const feedbackTypes = {
      'website_analysis': 'strategy_rating',
      'search_strategy': 'strategy_rating', 
      'email_generation': 'email_modification'
    };
    return feedbackTypes[stepId] || 'strategy_rating';
  };

  // 渲染步骤卡片
  const renderStepCard = (step) => {
    const Icon = step.icon;
    const isActive = selectedStep === step.id;
    const isEditing = editingStep === step.id;

    return (
      <div 
        key={step.id}
        className={`bg-gray-900/50 border ${isActive ? 'border-blue-400' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-gray-600`}
        onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
      >
        {/* 步骤头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${step.iconBg}`}>
              <Icon className={`w-5 h-5 ${step.iconColor}`} />
            </div>
            <div>
              <h3 className="text-white font-medium">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 状态指示器 */}
            {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {step.status === 'running' && <Loader className="w-5 h-5 text-blue-400 animate-spin" />}
            {step.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {step.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
            
            {/* 用户反馈指示器 */}
            {step.userFeedback && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full" title="用户已提供反馈" />
            )}
          </div>
        </div>

        {/* 进度条 */}
        {step.progress > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${step.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{step.progress}% 完成</p>
          </div>
        )}

        {/* 展开的详细内容 */}
        {isActive && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-300 text-sm mb-4">{step.description}</p>
            
            {/* 显示结果 */}
            {step.results && (
              <div className="bg-gray-800 rounded p-3 mb-4">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  结果数据
                </h4>
                
                {isEditing ? (
                  <EditResultsForm 
                    stepId={step.id}
                    data={editData}
                    onChange={setEditData}
                    onSave={() => saveEdit(step.id)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <ResultDisplay 
                    stepId={step.id}
                    results={step.results}
                    onEdit={step.allowEdit ? () => handleEdit(step.id) : null}
                  />
                )}
              </div>
            )}

            {/* 用户反馈区域 */}
            {step.results && !isEditing && (
              <UserFeedbackSection 
                stepId={step.id}
                feedback={step.userFeedback}
                onSubmitFeedback={(rating, comments) => submitFeedback(step.id, rating, comments)}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* 顶部控制栏 */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold">LangGraph AI 工作流</h1>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-full">
              <div className={`w-2 h-2 rounded-full ${agentStatus.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm">{agentStatus.currentTask}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={startLangGraphWorkflow}
              disabled={agentStatus.isRunning}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
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
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {workflowSteps.map(step => renderStepCard(step))}
        </div>
      </div>
    </div>
  );
};

// 结果显示组件
const ResultDisplay = ({ stepId, results, onEdit }) => {
  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p><span className="text-gray-400">公司名称:</span> <span className="text-white">{results?.companyName}</span></p>
            <p><span className="text-gray-400">行业:</span> <span className="text-white">{results?.industry}</span></p>
            <p className="mt-2"><span className="text-gray-400">价值主张:</span></p>
            <p className="text-gray-300 text-xs mt-1">{results?.valueProposition}</p>
          </div>
          {onEdit && (
            <button onClick={onEdit} className="ml-4 text-blue-400 hover:text-blue-300">
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stepId === 'search_strategy') {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p><span className="text-gray-400">目标受众:</span> <span className="text-white">{results?.target_audience?.type}</span></p>
            <p><span className="text-gray-400">关键词:</span></p>
            <div className="text-xs text-gray-300 mt-1">
              {results?.target_audience?.search_keywords?.primary_keywords?.join(', ')}
            </div>
          </div>
          {onEdit && (
            <button onClick={onEdit} className="ml-4 text-blue-400 hover:text-blue-300">
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stepId === 'prospect_search') {
    return (
      <div className="space-y-2 text-sm">
        <p><span className="text-gray-400">找到潜在客户:</span> <span className="text-white">{results?.totalFound || 0}</span></p>
        {results?.prospects?.slice(0, 3).map((prospect, i) => (
          <div key={i} className="text-xs text-gray-300 border-l-2 border-gray-600 pl-2">
            {prospect.email} - {prospect.company || 'Unknown Company'}
          </div>
        ))}
      </div>
    );
  }

  if (stepId === 'email_generation') {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm"><span className="text-gray-400">生成邮件:</span> <span className="text-white">{results?.emails?.length || 0}</span></p>
          {onEdit && (
            <button onClick={onEdit} className="text-blue-400 hover:text-blue-300">
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
        <EmailList emails={results?.emails || []} />
      </div>
    );
  }

  return <div className="text-sm text-gray-300">数据处理中...</div>;
};

// 邮件列表组件
const EmailList = ({ emails }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);

  return (
    <div className="space-y-2">
      {emails.slice(0, 5).map((emailData, i) => (
        <div key={i} className="border border-gray-600 rounded p-2">
          <div 
            className="cursor-pointer"
            onClick={() => setSelectedEmail(selectedEmail === i ? null : i)}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">
                {emailData.prospect?.company || 'Unknown'} - {emailData.prospect?.email}
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${selectedEmail === i ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          {selectedEmail === i && (
            <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
              <div>
                <p className="text-xs text-gray-400">主题:</p>
                <p className="text-xs text-white">{emailData.email_content?.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">内容:</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{emailData.email_content?.body?.substring(0, 200)}...</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 编辑表单组件
const EditResultsForm = ({ stepId, data, onChange, onSave, onCancel }) => {
  const handleChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  if (stepId === 'website_analysis') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">公司名称</label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">行业</label>
          <input
            type="text"
            value={data.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">价值主张</label>
          <textarea
            value={data.valueProposition || ''}
            onChange={(e) => handleChange('valueProposition', e.target.value)}
            rows={3}
            className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600 focus:border-blue-400"
          />
        </div>
        <div className="flex space-x-2">
          <button onClick={onSave} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs">
            <Save className="w-3 h-3 mr-1 inline" />
            保存
          </button>
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs">
            <X className="w-3 h-3 mr-1 inline" />
            取消
          </button>
        </div>
      </div>
    );
  }

  return <div>编辑功能开发中...</div>;
};

// 用户反馈组件
const UserFeedbackSection = ({ stepId, feedback, onSubmitFeedback }) => {
  const [rating, setRating] = useState(feedback?.rating || 0);
  const [comments, setComments] = useState(feedback?.comments || '');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmitFeedback(rating, comments);
    }
  };

  return (
    <div className="bg-gray-800 rounded p-3">
      <h4 className="text-white font-medium mb-2 flex items-center">
        <MessageSquare className="w-4 h-4 mr-2" />
        用户反馈
      </h4>
      
      {feedback ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">评分:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <ThumbsUp 
                  key={star} 
                  className={`w-3 h-3 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">{feedback.timestamp && new Date(feedback.timestamp).toLocaleString()}</span>
          </div>
          {feedback.comments && (
            <p className="text-xs text-gray-300">{feedback.comments}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">评分:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300`}
                >
                  <ThumbsUp className="w-full h-full fill-current" />
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="请输入反馈意见..."
            rows={2}
            className="w-full bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:border-blue-400"
          />
          
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1 rounded text-xs"
          >
            提交反馈
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedWorkflowDashboard;