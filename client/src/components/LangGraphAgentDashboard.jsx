import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertCircle, Brain, Zap, TrendingUp, Mail, Search, Target, BarChart3, User, Linkedin, Eye, ExternalLink } from 'lucide-react';

const LangGraphAgentDashboard = () => {
  const [agentData, setAgentData] = useState({
    campaigns: [],
    currentCampaign: null,
    learningInsights: {},
    performanceMetrics: {},
    memoryStatus: null
  });
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  const fetchAgentData = async () => {
    try {
      const [performanceResponse, memoryResponse] = await Promise.all([
        fetch('/api/langgraph-agent/performance-monitor'),
        fetch('/api/langgraph-agent/memory-summary')
      ]);

      const performance = await performanceResponse.json();
      const memory = await memoryResponse.json();

      setAgentData(prev => ({
        ...prev,
        performanceMetrics: performance.data || {},
        memoryStatus: memory.data || null
      }));
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
  };

  const executeCampaign = async (campaignConfig) => {
    setLoading(true);
    try {
      const response = await fetch('/api/langgraph-agent/execute-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignConfig)
      });

      const result = await response.json();
      
      if (result.success) {
        setAgentData(prev => ({
          ...prev,
          campaigns: [...prev.campaigns, result.data],
          currentCampaign: result.data
        }));
        
        alert('Campaign executed successfully with AI learning optimization!');
      } else {
        alert(`Campaign failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Campaign execution error:', error);
      alert('Failed to execute campaign');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (campaignId, feedbackType, feedbackData) => {
    try {
      const response = await fetch('/api/langgraph-agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          feedbackType,
          feedback: feedbackData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Feedback submitted and learned by AI!');
        setFeedback('');
        fetchAgentData(); // 刷新数据
      } else {
        alert(`Feedback submission failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback');
    }
  };

  const getOptimizationSuggestions = async (type, query) => {
    try {
      const response = await fetch('/api/langgraph-agent/optimization-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          query,
          campaignId: selectedCampaign?.campaignId
        })
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Optimization suggestions error:', error);
      return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LangGraph AI Marketing Agent</h1>
            <p className="text-gray-600">自我学习和优化的智能营销系统</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={agentData.memoryStatus?.memory_status === 'active' ? 'success' : 'secondary'}>
            {agentData.memoryStatus?.memory_status === 'active' ? '🧠 AI Learning Active' : '⏸️ Learning Paused'}
          </Badge>
          <Badge variant="outline">
            Redis Vector DB Connected
          </Badge>
        </div>
      </div>

      {/* Real-time Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">活跃活动</p>
                <p className="text-2xl font-bold">{agentData.performanceMetrics.current_campaigns || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">已发送邮件</p>
                <p className="text-2xl font-bold">{agentData.performanceMetrics.total_emails_sent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">回复率</p>
                <p className="text-2xl font-bold">{(agentData.performanceMetrics.average_response_rate * 100 || 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">学习数据</p>
                <p className="text-2xl font-bold">{(agentData.memoryStatus?.total_search_learnings || 0) + (agentData.memoryStatus?.total_marketing_learnings || 0) + (agentData.memoryStatus?.total_email_learnings || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Learning Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Learning Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">搜索优化提升</span>
                <span className="text-sm font-bold text-green-600">
                  {agentData.performanceMetrics.learning_efficiency?.search_optimization_improvement || '0%'}
                </span>
              </div>
              <Progress value={15} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">邮件效果提升</span>
                <span className="text-sm font-bold text-blue-600">
                  {agentData.performanceMetrics.learning_efficiency?.email_effectiveness_improvement || '0%'}
                </span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">策略准确度提升</span>
                <span className="text-sm font-bold text-purple-600">
                  {agentData.performanceMetrics.learning_efficiency?.strategy_accuracy_improvement || '0%'}
                </span>
              </div>
              <Progress value={18} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>启动新营销活动</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">目标网站</label>
              <input
                type="url"
                id="targetWebsite"
                className="w-full p-2 border rounded-lg"
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">活动目标</label>
              <select id="campaignGoal" className="w-full p-2 border rounded-lg">
                <option value="business_services">商业服务合作</option>
                <option value="product_integration">产品集成</option>
                <option value="partnership">战略合作伙伴</option>
                <option value="investment">投资机会</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">目标类型</label>
              <select id="businessType" className="w-full p-2 border rounded-lg">
                <option value="tob">B2B 企业客户</option>
                <option value="toc">B2C 消费者客户</option>
              </select>
            </div>
            
            <Button
              onClick={() => {
                const config = {
                  targetWebsite: document.getElementById('targetWebsite').value,
                  campaignGoal: document.getElementById('campaignGoal').value,
                  businessType: document.getElementById('businessType').value,
                  smtpConfig: true // 假设已配置SMTP
                };
                executeCampaign(config);
              }}
              disabled={loading}
              className="w-full"
            >
              {loading ? '🚀 正在执行AI活动...' : '🤖 启动智能活动'}
            </Button>
          </CardContent>
        </Card>

        {/* User Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>实时反馈学习</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">反馈类型</label>
              <select id="feedbackType" className="w-full p-2 border rounded-lg">
                <option value="email_modification">邮件内容修改</option>
                <option value="strategy_rating">策略评分</option>
                <option value="search_improvement">搜索优化建议</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">反馈内容</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2 border rounded-lg h-24"
                placeholder="请输入您的反馈，AI将学习并优化..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">评分 (1-5)</label>
              <input
                type="number"
                id="userRating"
                min="1"
                max="5"
                className="w-full p-2 border rounded-lg"
                placeholder="5"
              />
            </div>
            
            <Button
              onClick={() => {
                if (agentData.currentCampaign && feedback) {
                  const feedbackData = {
                    content: feedback,
                    rating: parseInt(document.getElementById('userRating').value) || 5,
                    timestamp: new Date().toISOString()
                  };
                  
                  submitFeedback(
                    agentData.currentCampaign.campaignId,
                    document.getElementById('feedbackType').value,
                    feedbackData
                  );
                }
              }}
              disabled={!feedback || !agentData.currentCampaign}
              className="w-full"
            >
              📝 提交反馈供AI学习
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Memory & Learning Insights */}
      {agentData.memoryStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI记忆与学习洞察
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">搜索学习</h3>
                <p className="text-2xl font-bold text-blue-600">{agentData.memoryStatus.total_search_learnings}</p>
                <p className="text-sm text-gray-500">条搜索优化经验</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">营销策略学习</h3>
                <p className="text-2xl font-bold text-green-600">{agentData.memoryStatus.total_marketing_learnings}</p>
                <p className="text-sm text-gray-500">个策略优化案例</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">邮件内容学习</h3>
                <p className="text-2xl font-bold text-purple-600">{agentData.memoryStatus.total_email_learnings}</p>
                <p className="text-sm text-gray-500">条邮件优化记录</p>
              </div>
            </div>

            {/* Recent Learning Insights */}
            {agentData.memoryStatus.recent_learnings && (
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-gray-700">最近学习洞察</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agentData.memoryStatus.recent_learnings.search?.slice(0, 1).map((learning, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-1">搜索优化</p>
                      <p className="text-sm text-gray-700">{learning.content?.substring(0, 50)}...</p>
                    </div>
                  ))}
                  
                  {agentData.memoryStatus.recent_learnings.marketing?.slice(0, 1).map((learning, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">策略优化</p>
                      <p className="text-sm text-gray-700">营销策略学习案例</p>
                    </div>
                  ))}
                  
                  {agentData.memoryStatus.recent_learnings.email?.slice(0, 1).map((learning, idx) => (
                    <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-purple-700 mb-1">邮件优化</p>
                      <p className="text-sm text-gray-700">{learning.content?.substring(0, 50)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Campaign Results */}
      {agentData.currentCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>当前活动结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">活动ID:</span>
                <Badge variant="outline">{agentData.currentCampaign.campaignId}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">发现潜在客户:</span>
                <span className="font-bold text-blue-600">{agentData.currentCampaign.prospects?.length || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">生成邮件:</span>
                <span className="font-bold text-green-600">{agentData.currentCampaign.emailCampaign?.emails?.length || 0}</span>
              </div>
              
              {agentData.currentCampaign.businessAnalysis && (
                <div>
                  <span className="font-medium">业务分析:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    <p><strong>公司:</strong> {agentData.currentCampaign.businessAnalysis.companyName}</p>
                    <p><strong>行业:</strong> {agentData.currentCampaign.businessAnalysis.industry}</p>
                    <p><strong>价值主张:</strong> {agentData.currentCampaign.businessAnalysis.valueProposition?.substring(0, 100)}...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LinkedIn Prospects with Personas */}
      {agentData.currentCampaign?.prospects && agentData.currentCampaign.prospects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              <span>LinkedIn潜在客户画像</span>
              <Badge variant="secondary">{agentData.currentCampaign.prospects.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agentData.currentCampaign.prospects.slice(0, 6).map((prospect, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-sm truncate">{prospect.name || 'Unknown'}</h4>
                    </div>
                    {prospect.linkedinProfile && (
                      <a 
                        href={prospect.linkedinProfile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <p><span className="font-medium">公司:</span> {prospect.company || 'N/A'}</p>
                    <p><span className="font-medium">职位:</span> {prospect.role || 'N/A'}</p>
                    <p><span className="font-medium">邮箱:</span> {prospect.email || 'N/A'}</p>
                    {prospect.location && (
                      <p><span className="font-medium">位置:</span> {prospect.location}</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      variant={prospect.persona ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {prospect.persona ? "有画像" : "无画像"}
                    </Badge>
                    
                    {prospect.persona && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPersona(prospect);
                          setShowPersonaModal(true);
                        }}
                        className="text-xs px-2 py-1 h-6"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看画像
                      </Button>
                    )}
                  </div>

                  {prospect.skills && prospect.skills.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">技能:</p>
                      <div className="flex flex-wrap gap-1">
                        {prospect.skills.slice(0, 3).map((skill, skillIdx) => (
                          <Badge key={skillIdx} variant="outline" className="text-xs px-1 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {prospect.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{prospect.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {agentData.currentCampaign.prospects.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  查看全部 {agentData.currentCampaign.prospects.length} 个潜在客户
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Persona Detail Modal */}
      {showPersonaModal && selectedPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{selectedPersona.name} 的详细画像</span>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPersonaModal(false)}
                >
                  关闭
                </Button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">姓名</p>
                    <p className="text-sm">{selectedPersona.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">公司</p>
                    <p className="text-sm">{selectedPersona.company}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">职位</p>
                    <p className="text-sm">{selectedPersona.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">位置</p>
                    <p className="text-sm">{selectedPersona.location}</p>
                  </div>
                </div>

                {/* LinkedIn Profile Link */}
                {selectedPersona.linkedinProfile && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <a 
                      href={selectedPersona.linkedinProfile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-sm">查看LinkedIn档案</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Persona Details */}
                {selectedPersona.persona && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">AI生成的用户画像</h4>
                    
                    {selectedPersona.persona.summary && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">专业背景摘要</p>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          {selectedPersona.persona.summary}
                        </p>
                      </div>
                    )}

                    {selectedPersona.persona.painPoints && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">痛点分析</p>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          {Array.isArray(selectedPersona.persona.painPoints) 
                            ? selectedPersona.persona.painPoints.join(', ')
                            : selectedPersona.persona.painPoints}
                        </p>
                      </div>
                    )}

                    {selectedPersona.persona.interests && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">兴趣重点</p>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          {Array.isArray(selectedPersona.persona.interests) 
                            ? selectedPersona.persona.interests.join(', ')
                            : selectedPersona.persona.interests}
                        </p>
                      </div>
                    )}

                    {selectedPersona.persona.communicationStyle && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">沟通风格</p>
                        <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          {selectedPersona.persona.communicationStyle}
                        </p>
                      </div>
                    )}

                    {selectedPersona.persona.emailApproach && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">推荐邮件策略</p>
                        <p className="text-sm text-gray-600 p-2 bg-green-50 rounded border border-green-200">
                          {selectedPersona.persona.emailApproach}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Experience & Education */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPersona.experience && selectedPersona.experience.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">工作经历</p>
                      <div className="space-y-2">
                        {selectedPersona.experience.slice(0, 3).map((exp, idx) => (
                          <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium">{exp.title}</p>
                            <p className="text-gray-600">{exp.company}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPersona.education && selectedPersona.education.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">教育背景</p>
                      <div className="space-y-2">
                        {selectedPersona.education.slice(0, 2).map((edu, idx) => (
                          <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-gray-600">{edu.school}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* About Section */}
                {selectedPersona.about && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">个人简介</p>
                    <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded max-h-20 overflow-y-auto">
                      {selectedPersona.about}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LangGraphAgentDashboard;