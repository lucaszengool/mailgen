import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Power,
  Sliders,
  BarChart3,
  Zap,
  Shield,
  Target
} from 'lucide-react';

const AgentControlPanel = ({ onSettingsClick }) => {
  const [agentStatus, setAgentStatus] = useState({
    isRunning: false,
    isPaused: false,
    currentTask: null,
    uptime: 0,
    lastActivity: null
  });
  const [controls, setControls] = useState({
    autoReply: true,
    manualApproval: false,
    pauseOnError: true,
    maxEmailsPerHour: 10,
    workingHours: { start: 9, end: 18 }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAgentStatus();
    const interval = setInterval(loadAgentStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent/status');
      if (response.ok) {
        const data = await response.json();
        setAgentStatus(data);
      }
    } catch (error) {
      console.error('Failed to load agent status:', error);
      // Mock data for development
      setAgentStatus({
        isRunning: Math.random() > 0.5,
        isPaused: Math.random() > 0.7,
        currentTask: 'Analyzing prospect: Happy Paws Veterinary',
        uptime: Math.floor(Math.random() * 3600),
        lastActivity: new Date(Date.now() - Math.random() * 300000).toISOString()
      });
    }
  };

  const toggleAgent = async () => {
    setIsLoading(true);
    try {
      const action = agentStatus.isRunning ? 'stop' : 'start';
      const response = await fetch(`/api/agent/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controls)
      });

      if (response.ok) {
        await loadAgentStatus();
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      // Simulate toggle for demo
      setAgentStatus(prev => ({
        ...prev,
        isRunning: !prev.isRunning,
        isPaused: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agent/pause', {
        method: 'POST'
      });

      if (response.ok) {
        await loadAgentStatus();
      }
    } catch (error) {
      console.error('Failed to pause agent:', error);
      setAgentStatus(prev => ({
        ...prev,
        isPaused: !prev.isPaused
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const updateControls = async (newControls) => {
    try {
      const response = await fetch('/api/agent/controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControls)
      });

      if (response.ok) {
        setControls(newControls);
      }
    } catch (error) {
      console.error('Failed to update controls:', error);
      setControls(newControls);
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时 ${minutes}分钟`;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '从未';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
  };

  const getStatusColor = () => {
    if (!agentStatus.isRunning) return 'text-red-400 bg-red-900/20 border-red-700';
    if (agentStatus.isPaused) return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
    return 'text-green-400 bg-green-900/20 border-green-700';
  };

  const getStatusIcon = () => {
    if (!agentStatus.isRunning) return <Square className="w-5 h-5" />;
    if (agentStatus.isPaused) return <Pause className="w-5 h-5" />;
    return <Play className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (!agentStatus.isRunning) return '已停止';
    if (agentStatus.isPaused) return '已暂停';
    return '运行中';
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-400/20 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI代理控制面板</h2>
              <p className="text-sm text-gray-400">管理和监控AI邮件营销代理</p>
            </div>
          </div>
          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="p-6 border-b border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Status */}
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <div className="font-semibold">代理状态</div>
                <div className="text-sm opacity-80">{getStatusText()}</div>
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-semibold text-white">运行时间</div>
                <div className="text-sm text-gray-400">{formatUptime(agentStatus.uptime)}</div>
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-semibold text-white">最后活动</div>
                <div className="text-sm text-gray-400">{formatTimeAgo(agentStatus.lastActivity)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Task */}
        {agentStatus.currentTask && agentStatus.isRunning && !agentStatus.isPaused && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-400">当前任务</span>
            </div>
            <p className="text-sm text-yellow-300 mt-1">{agentStatus.currentTask}</p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAgent}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              agentStatus.isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : agentStatus.isRunning ? (
              <Square className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <span>{isLoading ? '处理中...' : agentStatus.isRunning ? '停止代理' : '启动代理'}</span>
          </button>

          {agentStatus.isRunning && (
            <button
              onClick={pauseAgent}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                agentStatus.isPaused
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {agentStatus.isPaused ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
              <span>{agentStatus.isPaused ? '继续' : '暂停'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Settings */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">自动化控制</h3>
        
        <div className="space-y-4">
          {/* Auto Reply */}
          <div className="flex items-center justify-between p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium text-white">自动回复</div>
                <div className="text-sm text-gray-400">自动回复客户邮件</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={controls.autoReply}
                onChange={(e) => updateControls({ ...controls, autoReply: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Manual Approval */}
          <div className="flex items-center justify-between p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="font-medium text-white">手动审批</div>
                <div className="text-sm text-gray-400">发送邮件前需要手动确认</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={controls.manualApproval}
                onChange={(e) => updateControls({ ...controls, manualApproval: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Pause on Error */}
          <div className="flex items-center justify-between p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Power className="w-5 h-5 text-red-400" />
              <div>
                <div className="font-medium text-white">错误时暂停</div>
                <div className="text-sm text-gray-400">遇到错误时自动暂停代理</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={controls.pauseOnError}
                onChange={(e) => updateControls({ ...controls, pauseOnError: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Rate Limiting */}
          <div className="p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="font-medium text-white">发送频率限制</div>
                <div className="text-sm text-gray-400">每小时最多发送邮件数量</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="50"
                value={controls.maxEmailsPerHour}
                onChange={(e) => updateControls({ ...controls, maxEmailsPerHour: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-sm font-medium text-white min-w-0">
                {controls.maxEmailsPerHour} 封/小时
              </span>
            </div>
          </div>

          {/* Working Hours */}
          <div className="p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Target className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium text-white">工作时间</div>
                <div className="text-sm text-gray-400">代理的活跃时间范围</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm text-gray-300">开始</label>
                <select
                  value={controls.workingHours.start}
                  onChange={(e) => updateControls({
                    ...controls,
                    workingHours: { ...controls.workingHours, start: parseInt(e.target.value) }
                  })}
                  className="ml-2 px-3 py-1 border border-gray-600 bg-gray-700 text-white rounded text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300">结束</label>
                <select
                  value={controls.workingHours.end}
                  onChange={(e) => updateControls({
                    ...controls,
                    workingHours: { ...controls.workingHours, end: parseInt(e.target.value) }
                  })}
                  className="ml-2 px-3 py-1 border border-gray-600 bg-gray-700 text-white rounded text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentControlPanel;