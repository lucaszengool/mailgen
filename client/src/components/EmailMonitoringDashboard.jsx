import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Pause,
  Play,
  Settings,
  Filter,
  Search,
  RefreshCw,
  MessageSquare,
  UserCheck,
  UserX,
  Calendar,
  Activity,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

const EmailMonitoringDashboard = ({ agentConfig, onClientClick, onReset }) => {
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [stats, setStats] = useState({
    totalEmailsSent: 0,
    repliesReceived: 0,
    activeClients: 0,
    conversionRate: 0,
    avgResponseTime: 0
  });
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // 新增状态
  const [emailStats, setEmailStats] = useState({
    sentThisHour: 0,
    maxPerHour: 10,
    remaining: 10,
    canSend: true,
    isPaused: false,
    lastEmailTime: null
  });
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [agentMode, setAgentMode] = useState('unified'); // unified LangGraph system

  const clientCategories = [
    { id: 'all', name: '全部客户', icon: Users, color: 'gray' },
    { id: 'discovered', name: '新发现', icon: Eye, color: 'indigo' },
    { id: 'contacted', name: '已联系', icon: Mail, color: 'blue' },
    { id: 'engaged', name: '已回复', icon: MessageSquare, color: 'green' },
    { id: 'interested', name: '有兴趣', icon: UserCheck, color: 'yellow' },
    { id: 'not_interested', name: '无兴趣', icon: UserX, color: 'red' },
    { id: 'converted', name: '已转化', icon: CheckCircle, color: 'purple' }
  ];

  // 实时获取邮件统计
  const fetchEmailStats = async () => {
    try {
      const response = await fetch('/api/automation/email-stats');
      if (response.ok) {
        const data = await response.json();
        setEmailStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    }
  };

  // 控制auto reply
  const toggleAutoReply = async (enabled) => {
    try {
      const response = await fetch('/api/automation/toggle-auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        setAutoReplyEnabled(enabled);
      }
    } catch (error) {
      console.error('Failed to toggle auto reply:', error);
    }
  };

  // 暂停/恢复代理
  const pauseAgent = async () => {
    try {
      await fetch('/api/automation/pause', { method: 'POST' });
      setIsAgentRunning(false);
    } catch (error) {
      console.error('Failed to pause agent:', error);
    }
  };

  const resumeAgent = async () => {
    try {
      await fetch('/api/automation/resume', { method: 'POST' });
      setIsAgentRunning(true);
    } catch (error) {
      console.error('Failed to resume agent:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchEmailStats();
    const interval = setInterval(() => {
      loadDashboardData();
      fetchEmailStats();
    }, 10000); // Refresh every 10 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, filterCategory, searchTerm]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load agent status
      const statusResponse = await fetch('/api/agent/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setIsAgentRunning(statusData.isRunning);
        setStats(statusData.stats || stats);
      }

      // Load clients data
      const clientsResponse = await fetch('/api/agent/clients');
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }

      // Load agent configuration
      const configResponse = await fetch('/api/agent/config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        // Always use unified mode since we have a single unified system
        setAgentMode('unified');
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Mock data for development
      setClients(generateMockClients());
      setStats({
        totalEmailsSent: 156,
        repliesReceived: 23,
        activeClients: 45,
        conversionRate: 14.7,
        avgResponseTime: 4.2
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockClients = () => {
    const mockClients = [
      {
        id: 1,
        name: '宠物天堂诊所',
        email: 'contact@petparadise.com',
        industry: 'veterinary',
        status: 'engaged',
        lastContact: '2025-01-13T10:30:00Z',
        emailsSent: 3,
        repliesReceived: 2,
        lastReply: '我们对AI宠物肖像服务很感兴趣，能否安排一次演示？',
        conversionProbability: 85,
        businessSize: 'medium'
      },
      {
        id: 2,
        name: '快乐爪子宠物店',
        email: 'info@happypaws.com',
        industry: 'pet-retail',
        status: 'prospects',
        lastContact: '2025-01-13T09:15:00Z',
        emailsSent: 1,
        repliesReceived: 0,
        lastReply: null,
        conversionProbability: 45,
        businessSize: 'small'
      },
      {
        id: 3,
        name: '宠物摄影工作室',
        email: 'hello@petstudio.com',
        industry: 'photography',
        status: 'interested',
        lastContact: '2025-01-12T16:45:00Z',
        emailsSent: 2,
        repliesReceived: 1,
        lastReply: '价格如何？我们已有摄影服务，这会是很好的补充。',
        conversionProbability: 72,
        businessSize: 'small'
      },
      {
        id: 4,
        name: '城市动物医院',
        email: 'admin@cityvet.com',
        industry: 'veterinary',
        status: 'converted',
        lastContact: '2025-01-11T14:20:00Z',
        emailsSent: 4,
        repliesReceived: 3,
        lastReply: '我们决定开始合作！请发送合同详情。',
        conversionProbability: 100,
        businessSize: 'large'
      },
      {
        id: 5,
        name: '宠物美容沙龙',
        email: 'contact@petgrooming.com',
        industry: 'grooming',
        status: 'not_interested',
        lastContact: '2025-01-10T11:30:00Z',
        emailsSent: 2,
        repliesReceived: 1,
        lastReply: '谢谢，但我们现在不需要这项服务。',
        conversionProbability: 5,
        businessSize: 'small'
      },
      {
        id: 6,
        name: '宠物用品批发商',
        email: 'sales@petsupplies.com',
        industry: 'pet-retail',
        status: 'prospects',
        lastContact: '2025-01-13T08:00:00Z',
        emailsSent: 1,
        repliesReceived: 0,
        lastReply: null,
        conversionProbability: 35,
        businessSize: 'large'
      }
    ];

    return mockClients;
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(client => client.status === filterCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const toggleAgent = async () => {
    try {
      const action = isAgentRunning ? 'stop' : 'start';
      const response = await fetch(`/api/agent/${action}`, { method: 'POST' });
      
      if (response.ok) {
        setIsAgentRunning(!isAgentRunning);
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      discovered: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      contacted: 'bg-blue-100 text-blue-800 border-blue-200',
      engaged: 'bg-green-100 text-green-800 border-green-200',
      interested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      not_interested: 'bg-red-100 text-red-800 border-red-200',
      converted: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      discovered: '新发现',
      contacted: '已联系',
      engaged: '已回复',
      interested: '有兴趣',
      not_interested: '无兴趣',
      converted: '已转化'
    };
    return labels[status] || status;
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
  };

  const handleReset = async () => {
    try {
      // Stop the agent first
      if (isAgentRunning) {
        await fetch('/api/agent/stop', { method: 'POST' });
      }
      
      // Clear configuration
      await fetch('/api/agent/reset', { method: 'POST' });
      
      // Clear local state
      setClients([]);
      setStats({
        totalEmailsSent: 0,
        repliesReceived: 0,
        activeClients: 0,
        conversionRate: 0,
        avgResponseTime: 0
      });
      
      // Call parent reset handler to show setup wizard
      if (onReset) {
        onReset();
      }
    } catch (error) {
      console.error('Failed to reset:', error);
    }
    setShowResetConfirm(false);
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-400" />
          <span className="text-lg text-gray-300">Loading email monitoring dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">Email Marketing Dashboard</h1>
              <p className="text-gray-300">Real-time monitoring of AI agent email marketing campaigns and client interactions</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Email Rate Limiting Status */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">邮件发送限制</div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${emailStats.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {emailStats.sentThisHour}/{emailStats.maxPerHour}
                  </span>
                  <span className="text-xs text-gray-400">本小时</span>
                  {emailStats.isPaused && (
                    <AlertTriangle className="w-4 h-4 text-red-500" title="因达到限制已暂停" />
                  )}
                </div>
              </div>

              {/* Auto Reply Toggle */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">自动回复</div>
                <button
                  onClick={() => toggleAutoReply(!autoReplyEnabled)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    autoReplyEnabled 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${autoReplyEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{autoReplyEnabled ? '已启用' : '已禁用'}</span>
                </button>
              </div>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-600 hover:bg-gray-700 text-white"
                title="重置系统并重新配置"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置系统</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isAgentRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    代理状态: {isAgentRunning ? '运行中' : '已停止'}
                  </span>
                </div>
                
                {/* Agent Mode Display */}
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="text-lg">🧠</span>
                  <span className="text-sm font-medium">统一AI代理系统</span>
                  <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">
                    LangGraph
                  </span>
                </div>
              </div>
              <button
                onClick={isAgentRunning ? pauseAgent : resumeAgent}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isAgentRunning 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isAgentRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAgentRunning ? '暂停代理' : '启动代理'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Emails Sent</p>
                <p className="text-2xl font-bold text-white">{stats.totalEmailsSent}</p>
              </div>
              <Mail className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-xs text-yellow-400 mt-2">↑ Today +12</p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">收到回复</p>
                <p className="text-2xl font-bold text-white">{stats.repliesReceived}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-xs text-yellow-400 mt-2">↑ 今日 +3</p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">活跃客户</p>
                <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-xs text-yellow-400 mt-2">↑ 本周 +7</p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">转化率</p>
                <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-xs text-yellow-400 mt-2">↑ +2.3%</p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 hover:border-yellow-400 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">平均响应</p>
                <p className="text-2xl font-bold text-white">{stats.avgResponseTime}h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-yellow-400 mt-2">↓ -1.2h</p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {clientCategories.map(category => {
                const Icon = category.icon;
                const isActive = filterCategory === category.id;
                const count = category.id === 'all' ? clients.length : clients.filter(c => c.status === category.id).length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setFilterCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive 
                        ? 'bg-yellow-500 text-black shadow-lg' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20 text-black' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索客户名称、邮箱或行业..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                客户列表 ({filteredClients.length})
              </h2>
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>刷新</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">客户信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">邮件统计</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">最后联系</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">转化概率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-yellow-400">
                              {client.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{client.name}</div>
                          <div className="text-sm text-gray-400">{client.email}</div>
                          <div className="text-xs text-gray-500">
                            {client.industry} • {client.businessSize === 'small' ? '小型' : client.businessSize === 'medium' ? '中型' : '大型'}企业
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(client.status)}`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-white">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-medium">{client.emailsSent}</div>
                          <div className="text-xs text-gray-400">发送</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-400">{client.repliesReceived}</div>
                          <div className="text-xs text-gray-400">回复</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div>{formatTimeAgo(client.lastContact)}</div>
                      {client.lastReply && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          "{client.lastReply}"
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              client.conversionProbability >= 80 ? 'bg-green-400' :
                              client.conversionProbability >= 60 ? 'bg-yellow-400' :
                              client.conversionProbability >= 40 ? 'bg-blue-400' : 'bg-gray-500'
                            }`}
                            style={{ width: `${client.conversionProbability}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getProbabilityColor(client.conversionProbability)}`}>
                          {client.conversionProbability}%
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onClientClick && onClientClick(client)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          查看详情
                        </button>
                        {client.emailsSent > 0 && (
                          <button
                            onClick={() => setSelectedEmail(client)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            邮件历史
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">没有找到客户</h3>
              <p className="text-gray-400">
                {searchTerm || filterCategory !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '代理还没有联系任何客户，请启动代理开始邮件营销活动'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">确认重置系统</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              重置系统将清除所有当前配置和数据，包括：
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>当前的网站和营销目标配置</li>
              <li>SMTP邮箱设置</li>
              <li>所有客户数据和邮件历史</li>
              <li>代理运行状态和统计数据</li>
            </ul>
            
            <p className="text-gray-600 mb-6">
              重置后，您需要重新配置目标网站、营销目标和邮箱设置。
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">邮件历史</h3>
                  <p className="text-gray-600">{selectedEmail.name} ({selectedEmail.email})</p>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Mock email history - replace with real data */}
                {[
                  {
                    id: 1,
                    type: 'sent',
                    subject: 'Introducing FruitAI - Smart Fruit Analysis',
                    content: `Dear ${selectedEmail.name.split(' ')[0]},\n\nI hope this email finds you well. I wanted to introduce you to FruitAI, our revolutionary AI-powered fruit analysis platform...\n\nBest regards,\nFruit AI Team`,
                    timestamp: '2025-01-13T10:30:00Z',
                    status: 'delivered'
                  },
                  {
                    id: 2,
                    type: 'received',
                    subject: 'Re: Introducing FruitAI - Smart Fruit Analysis',
                    content: selectedEmail.lastReply || '这个产品看起来很有趣，能否提供更多详细信息？',
                    timestamp: '2025-01-13T14:20:00Z',
                    status: 'read'
                  }
                ].map((email, index) => (
                  <div key={email.id} className={`p-4 rounded-lg border ${
                    email.type === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className={`w-4 h-4 ${email.type === 'sent' ? 'text-blue-600' : 'text-green-600'}`} />
                        <span className={`text-sm font-medium ${email.type === 'sent' ? 'text-blue-800' : 'text-green-800'}`}>
                          {email.type === 'sent' ? '已发送' : '已接收'}
                        </span>
                        {email.type === 'sent' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {email.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(email.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {email.subject}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {email.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  总计 {selectedEmail.emailsSent} 封已发送，{selectedEmail.repliesReceived} 封回复
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => toggleAutoReply(!autoReplyEnabled)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      autoReplyEnabled 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {autoReplyEnabled ? '禁用自动回复' : '启用自动回复'}
                  </button>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailMonitoringDashboard;