import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, Target, Search, RefreshCw, Globe,
  AlertCircle, CheckCircle, Sparkles, BarChart3, Users,
  Zap, Eye, Play, Pause, Settings, Download, Plus, X,
  DollarSign, Shield, AlertTriangle, PieChart as PieChartIcon, Activity,
  TrendingDown, Minus, FileText, Layers, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MarketResearch = () => {
  const [researchConfig, setResearchConfig] = useState({
    industry: '',
    competitors: [],
    topics: [],
    geography: 'Global',
    frequency: 'weekly'
  });

  const [researchStatus, setResearchStatus] = useState('idle');
  const [insights, setInsights] = useState([]);
  const [currentResearch, setCurrentResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    executive: true,
    market: true,
    competitive: true,
    swot: true,
    trends: true,
    segments: false,
    forecast: false,
    recommendations: true
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('marketResearchConfig');
    if (savedConfig) {
      setResearchConfig(JSON.parse(savedConfig));
    }
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/research/insights');
      if (response.ok) {
        const data = await response.json();
        const validInsights = (data.insights || []).filter(insight => insight != null);
        setInsights(validInsights);
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
          if (data.insight) {
            setInsights(prev => [data.insight, ...prev]);
          }
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  // Sample data for charts (to be replaced with real API data)
  const marketGrowthData = [
    { year: '2020', value: 245, growth: 12 },
    { year: '2021', value: 289, growth: 18 },
    { year: '2022', value: 356, growth: 23 },
    { year: '2023', value: 445, growth: 25 },
    { year: '2024', value: 568, growth: 28 },
    { year: '2025', value: 712, growth: 25 }
  ];

  const marketShareData = researchConfig.competitors.slice(0, 5).map((comp, i) => ({
    name: comp,
    value: [35, 25, 18, 12, 10][i] || 5,
    color: ['#00f5a0', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i]
  }));

  const competitorPositioning = researchConfig.competitors.slice(0, 6).map((comp, i) => ({
    name: comp,
    quality: 50 + Math.random() * 40,
    price: 50 + Math.random() * 40,
    marketShare: [35, 25, 18, 12, 10, 5][i] || 3
  }));

  const trendData = [
    { month: 'Jan', aiAdoption: 45, automation: 62, cloudMigration: 78 },
    { month: 'Feb', aiAdoption: 52, automation: 68, cloudMigration: 82 },
    { month: 'Mar', aiAdoption: 61, automation: 73, cloudMigration: 85 },
    { month: 'Apr', aiAdoption: 68, automation: 79, cloudMigration: 88 },
    { month: 'May', aiAdoption: 75, automation: 84, cloudMigration: 90 },
    { month: 'Jun', aiAdoption: 84, automation: 88, cloudMigration: 92 }
  ];

  const segmentData = [
    { segment: 'Enterprise', value: 45, color: '#00f5a0' },
    { segment: 'Mid-Market', value: 30, color: '#3b82f6' },
    { segment: 'Small Business', value: 20, color: '#8b5cf6' },
    { segment: 'Startups', value: 5, color: '#f59e0b' }
  ];

  const swotData = {
    strengths: [
      { label: 'Innovation', value: 9 },
      { label: 'Brand Recognition', value: 8 },
      { label: 'Customer Loyalty', value: 7 },
      { label: 'Technology', value: 8 },
      { label: 'Market Position', value: 7 }
    ],
    weaknesses: [
      { label: 'Innovation', value: 3 },
      { label: 'Brand Recognition', value: 4 },
      { label: 'Customer Loyalty', value: 5 },
      { label: 'Technology', value: 4 },
      { label: 'Market Position', value: 5 }
    ]
  };

  const ComprehensiveInsightCard = ({ insight, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b-2 border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#00f5a0' }}>
                {insight.type === 'market' && <Globe className="w-6 h-6 text-black" />}
                {insight.type === 'competitor' && <Target className="w-6 h-6 text-black" />}
                {insight.type === 'opportunity' && <Sparkles className="w-6 h-6 text-black" />}
                {insight.type === 'trend' && <TrendingUp className="w-6 h-6 text-black" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(insight.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-semibold shadow-sm" style={{
              backgroundColor: insight.impact === 'high' ? '#00f5a0' : '#e5e7eb',
              color: insight.impact === 'high' ? '#000' : '#6b7280'
            }}>
              {insight.impact?.toUpperCase()} IMPACT
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {insight.keywords?.map((keyword, i) => (
              <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Executive Summary
            </h4>
            <p className="text-gray-800 leading-relaxed">{insight.summary}</p>
          </div>

          {/* Key Metrics */}
          {insight.metrics && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Market Size</span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">${insight.metrics?.marketSize || '2.4B'}</p>
                <p className="text-xs text-green-600 mt-1">+{insight.metrics?.growth || '24'}% YoY</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Growth Rate</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{insight.metrics?.growthRate || '28'}%</p>
                <p className="text-xs text-blue-600 mt-1">Annual CAGR</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Opportunity</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{insight.metrics?.opportunityScore || '8.5'}/10</p>
                <p className="text-xs text-purple-600 mt-1">High potential</p>
              </div>
            </div>
          )}

          {/* Market Analysis Chart */}
          {(insight.type === 'market' || insight.type === 'trend') && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Market Growth Trajectory
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={marketGrowthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5a0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f5a0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00f5a0" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Competitive Positioning */}
          {insight.type === 'competitor' && competitorPositioning.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Target className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Competitive Positioning Matrix
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" dataKey="price" name="Price Point" stroke="#6b7280" fontSize={12} />
                  <YAxis type="number" dataKey="quality" name="Quality Score" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Scatter name="Competitors" data={competitorPositioning} fill="#00f5a0">
                    {competitorPositioning.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#00f5a0', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'][index % 6]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Industry Trends */}
          {insight.type === 'trend' && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Key Industry Trends
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="aiAdoption" stroke="#00f5a0" strokeWidth={2} name="AI Adoption" />
                  <Line type="monotone" dataKey="automation" stroke="#3b82f6" strokeWidth={2} name="Automation" />
                  <Line type="monotone" dataKey="cloudMigration" stroke="#8b5cf6" strokeWidth={2} name="Cloud Migration" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Market Segments */}
          {insight.type === 'opportunity' && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <PieChartIcon className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Market Segmentation
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* SWOT Analysis */}
          {insight.swot && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Layers className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                SWOT Analysis
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border-2 border-green-200">
                  <h5 className="font-bold text-green-800 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Strengths
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(insight.swot?.strengths || ['Strong brand recognition', 'Advanced technology stack', 'Large customer base']).map((s, i) => (
                      <li key={i} className="flex items-start">
                        <Plus className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-green-600" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl border-2 border-red-200">
                  <h5 className="font-bold text-red-800 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Weaknesses
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(insight.swot?.weaknesses || ['High pricing', 'Limited market presence', 'Complex onboarding']).map((w, i) => (
                      <li key={i} className="flex items-start">
                        <Minus className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-red-600" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border-2 border-blue-200">
                  <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Opportunities
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(insight.swot?.opportunities || ['Emerging markets', 'AI integration', 'Strategic partnerships']).map((o, i) => (
                      <li key={i} className="flex items-start">
                        <Plus className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-blue-600" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl border-2 border-yellow-200">
                  <h5 className="font-bold text-yellow-800 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Threats
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {(insight.swot?.threats || ['Increasing competition', 'Market saturation', 'Economic downturn']).map((t, i) => (
                      <li key={i} className="flex items-start">
                        <AlertCircle className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-yellow-600" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Key Findings */}
          {insight.findings && insight.findings.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Key Findings
              </h4>
              <div className="space-y-2">
                {insight.findings.map((finding, i) => (
                  <div key={i} className="flex items-start p-3 bg-white rounded-lg border border-gray-200">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-3" style={{ backgroundColor: '#00f5a0' }}>
                      <span className="text-xs font-bold text-black">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Integration */}
          {insight.actionableInsights && insight.actionableInsights.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border-2 border-green-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2" style={{ color: '#00f5a0' }} />
                How This Feeds Into Your Campaign
              </h4>
              <div className="space-y-3">
                {insight.actionableInsights.map((action, i) => (
                  <div key={i} className="flex items-start bg-white rounded-lg p-3 border border-green-200">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#00f5a0' }} />
                    <p className="text-sm text-gray-800 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="w-8 h-8 mr-3" style={{ color: '#00f5a0' }} />
                Market Research & Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive AI-powered market analysis to optimize your campaign strategy
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
                  onClick={() => setResearchStatus('paused')}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 flex items-center space-x-2 hover:bg-gray-300"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
              )}

              {researchStatus === 'paused' && (
                <button
                  onClick={() => setResearchStatus('running')}
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

              <button
                className="px-6 py-3 rounded-xl font-semibold bg-white border-2 border-gray-200 text-gray-700 flex items-center space-x-2 hover:border-gray-300"
              >
                <Download className="w-5 h-5" />
                <span>Export PDF</span>
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
                    <p className="font-medium mb-1">Powered by AI</p>
                    <p>Our AI agent conducts comprehensive market analysis using web search and Ollama, generating professional reports with actionable insights for your campaigns.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Research Reports */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Intelligence Reports</h2>
              <p className="text-gray-600">
                Comprehensive analysis from {insights.length} research {insights.length === 1 ? 'session' : 'sessions'}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-6 h-6" style={{ color: '#00f5a0' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i && i.type === 'market').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Market Analysis</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-6 h-6" style={{ color: '#3b82f6' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i && i.type === 'competitor').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Competitor Intel</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6" style={{ color: '#8b5cf6' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i && i.type === 'trend').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Industry Trends</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-6 h-6" style={{ color: '#f59e0b' }} />
                  <span className="text-2xl font-bold text-gray-900">
                    {insights.filter(i => i && i.type === 'opportunity').length}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Opportunities</p>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-6">
              {insights.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No research reports yet</h3>
                  <p className="text-gray-600 mb-6">Configure your research parameters and start your first analysis</p>
                  <button
                    onClick={startResearch}
                    disabled={!researchConfig.industry || researchConfig.competitors.length === 0}
                    className="px-8 py-3 rounded-xl font-semibold text-black inline-flex items-center space-x-2 disabled:opacity-50"
                    style={{ backgroundColor: '#00f5a0' }}
                  >
                    <Play className="w-5 h-5" />
                    <span>Generate First Report</span>
                  </button>
                </div>
              ) : (
                insights
                  .filter(insight => insight != null)
                  .map((insight, index) => (
                    <ComprehensiveInsightCard key={insight.id || index} insight={insight} index={index} />
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
