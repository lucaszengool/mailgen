import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, Target, Search, RefreshCw, Globe,
  AlertCircle, CheckCircle, Sparkles, BarChart3, Users,
  Zap, Eye, Play, Pause, Settings, Download, Plus, X
} from 'lucide-react';

const MarketResearch = () => {
  const [researchConfig, setResearchConfig] = useState({
    industry: '',
    competitors: [],
    topics: [],
    geography: 'Global',
    frequency: 'weekly'
  });

  const [researchStatus, setResearchStatus] = useState('idle'); // idle, running, paused, completed
  const [insights, setInsights] = useState([]);
  const [currentResearch, setCurrentResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newTopic, setNewTopic] = useState('');

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('marketResearchConfig');
    if (savedConfig) {
      setResearchConfig(JSON.parse(savedConfig));
    }

    // Load previous insights
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/research/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const startResearch = async () => {
    if (!researchConfig.industry || researchConfig.competitors.length === 0) {
      alert('Please configure industry and at least one competitor');
      return;
    }

    setLoading(true);
    setResearchStatus('running');

    try {
      const response = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchConfig)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentResearch(data.research);
        // Poll for updates
        pollResearchProgress(data.research.id);
      }
    } catch (error) {
      console.error('Failed to start research:', error);
      setResearchStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const pollResearchProgress = async (researchId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/research/status/${researchId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setResearchStatus('completed');
          setInsights(prev => [data.insight, ...prev]);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setResearchStatus('idle');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to poll research status:', error);
      }
    }, 3000);
  };

  const pauseResearch = () => {
    setResearchStatus('paused');
  };

  const resumeResearch = () => {
    setResearchStatus('running');
  };

  const saveConfiguration = async () => {
    localStorage.setItem('marketResearchConfig', JSON.stringify(researchConfig));

    try {
      await fetch('/api/research/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchConfig)
      });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !researchConfig.competitors.includes(newCompetitor.trim())) {
      setResearchConfig(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }));
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor) => {
    setResearchConfig(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }));
  };

  const addTopic = () => {
    if (newTopic.trim() && !researchConfig.topics.includes(newTopic.trim())) {
      setResearchConfig(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (topic) => {
    setResearchConfig(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const InsightCard = ({ insight, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-green-200 transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
            {insight.type === 'trend' && <TrendingUp className="w-5 h-5 text-black" />}
            {insight.type === 'competitor' && <Target className="w-5 h-5 text-black" />}
            {insight.type === 'market' && <Globe className="w-5 h-5 text-black" />}
            {insight.type === 'opportunity' && <Sparkles className="w-5 h-5 text-black" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <p className="text-sm text-gray-500">{new Date(insight.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
          backgroundColor: insight.impact === 'high' ? '#00f5a0' : '#e5e7eb',
          color: insight.impact === 'high' ? '#000' : '#6b7280'
        }}>
          {insight.impact} impact
        </span>
      </div>

      <p className="text-gray-700 mb-4">{insight.summary}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {insight.keywords?.map((keyword, i) => (
          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
            {keyword}
          </span>
        ))}
      </div>

      {insight.actionableInsights && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Zap className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
            How This Feeds Into Your Campaign
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {insight.actionableInsights.map((action, i) => (
              <li key={i} className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#00f5a0' }} />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="w-8 h-8 mr-3" style={{ color: '#00f5a0' }} />
                Market Research & Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                AI-powered market analysis to optimize your campaign strategy
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {researchStatus === 'idle' && (
                <button
                  onClick={startResearch}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-semibold text-black flex items-center space-x-2 transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#00f5a0' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Start Research</span>
                    </>
                  )}
                </button>
              )}

              {researchStatus === 'running' && (
                <button
                  onClick={pauseResearch}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 flex items-center space-x-2 hover:bg-gray-300"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
              )}

              {researchStatus === 'paused' && (
                <button
                  onClick={resumeResearch}
                  className="px-6 py-3 rounded-xl font-semibold text-black flex items-center space-x-2"
                  style={{ backgroundColor: '#00f5a0' }}
                >
                  <Play className="w-5 h-5" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={saveConfiguration}
                className="px-6 py-3 rounded-xl font-semibold bg-white border-2 border-gray-200 text-gray-700 flex items-center space-x-2 hover:border-gray-300"
              >
                <Settings className="w-5 h-5" />
                <span>Save Config</span>
              </button>
            </div>
          </div>

          {/* Status Bar */}
          {researchStatus !== 'idle' && (
            <div className="mt-6 p-4 rounded-xl border-2" style={{
              backgroundColor: researchStatus === 'running' ? '#e8fdf5' : '#f3f4f6',
              borderColor: researchStatus === 'running' ? '#00f5a0' : '#d1d5db'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{
                    backgroundColor: researchStatus === 'running' ? '#00f5a0' : '#6b7280'
                  }} />
                  <span className="font-medium text-gray-900">
                    {researchStatus === 'running' && 'Research in progress...'}
                    {researchStatus === 'paused' && 'Research paused'}
                    {researchStatus === 'completed' && 'Research completed'}
                  </span>
                </div>
                {currentResearch && (
                  <span className="text-sm text-gray-600">
                    {currentResearch.progress}% complete
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2" style={{ color: '#00f5a0' }} />
                Research Configuration
              </h2>

              {/* Industry */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry / Market *
                </label>
                <input
                  type="text"
                  value={researchConfig.industry}
                  onChange={(e) => setResearchConfig(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., SaaS, FinTech, Marketing"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                />
              </div>

              {/* Competitors */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitors to Track *
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                    placeholder="Competitor name"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={addCompetitor}
                    className="px-4 py-2 rounded-lg font-medium text-black"
                    style={{ backgroundColor: '#00f5a0' }}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {researchConfig.competitors.map((competitor, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                    >
                      {competitor}
                      <button
                        onClick={() => removeCompetitor(competitor)}
                        className="ml-2 text-gray-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Research Topics
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                    placeholder="e.g., Pricing strategies"
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={addTopic}
                    className="px-4 py-2 rounded-lg font-medium text-black"
                    style={{ backgroundColor: '#00f5a0' }}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {researchConfig.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm"
                    >
                      {topic}
                      <button
                        onClick={() => removeTopic(topic)}
                        className="ml-2 text-gray-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Geography */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geography
                </label>
                <select
                  value={researchConfig.geography}
                  onChange={(e) => setResearchConfig(prev => ({ ...prev, geography: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                >
                  <option value="Global">Global</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Latin America">Latin America</option>
                </select>
              </div>

              {/* Frequency */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Research Frequency
                </label>
                <select
                  value={researchConfig.frequency}
                  onChange={(e) => setResearchConfig(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">How it works</p>
                    <p>Our AI agent monitors your configured topics using web search and Ollama analysis, then feeds actionable insights directly into prospect discovery and email personalization.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Feed */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Insights</h2>
              <p className="text-gray-600">
                AI-generated insights from {insights.length} research sessions
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6" style={{ color: '#00f5a0' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i.type === 'trend').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Market Trends</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-6 h-6" style={{ color: '#00f5a0' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i.type === 'competitor').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Competitor Insights</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-6 h-6" style={{ color: '#00f5a0' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i.type === 'opportunity').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Opportunities</p>
              </div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No insights yet</h3>
                  <p className="text-gray-600 mb-6">Configure your research parameters and start your first research session</p>
                  <button
                    onClick={startResearch}
                    disabled={!researchConfig.industry || researchConfig.competitors.length === 0}
                    className="px-8 py-3 rounded-xl font-semibold text-black inline-flex items-center space-x-2 disabled:opacity-50"
                    style={{ backgroundColor: '#00f5a0' }}
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Your First Research</span>
                  </button>
                </div>
              ) : (
                insights.map((insight, index) => (
                  <InsightCard key={insight.id || index} insight={insight} index={index} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketResearch;
