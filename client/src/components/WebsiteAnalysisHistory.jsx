import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Target, TrendingUp, Users, Sparkles, CheckCircle,
  BarChart3, PieChart, Activity, DollarSign, FileText,
  Layers, Award, Lightbulb, ArrowRight, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WebsiteAnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();

    // Listen for storage events to refresh when new analyses are saved
    const handleStorageChange = () => {
      fetchAnalyses();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchAnalyses = async () => {
    try {
      // Try to fetch from API
      const response = await fetch('/api/website-analysis/history');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch analyses from API:', error);
    }

    // Fallback: load from localStorage
    try {
      const savedAnalyses = localStorage.getItem('websiteAnalysisHistory');
      if (savedAnalyses) {
        const parsedAnalyses = JSON.parse(savedAnalyses);
        setAnalyses(parsedAnalyses);
      } else {
        // Also check agentSetupData as a fallback
        const agentSetupData = localStorage.getItem('agentSetupData');
        const websiteAnalysisConfig = localStorage.getItem('websiteAnalysisConfig');

        if (websiteAnalysisConfig) {
          const config = JSON.parse(websiteAnalysisConfig);
          // Create a history entry from config if it doesn't exist yet
          if (config.targetWebsite || config.businessName) {
            const historyEntry = {
              ...config,
              id: Date.now(),
              createdAt: new Date().toISOString(),
              analyzedAt: new Date().toISOString()
            };
            setAnalyses([historyEntry]);
            // Save to history for next time
            localStorage.setItem('websiteAnalysisHistory', JSON.stringify([historyEntry]));
          }
        } else if (agentSetupData) {
          const setupData = JSON.parse(agentSetupData);
          if (setupData.targetWebsite || setupData.businessName) {
            const historyEntry = {
              targetWebsite: setupData.targetWebsite,
              businessName: setupData.businessName,
              businessLogo: setupData.businessLogo,
              productServiceType: setupData.businessType,
              businessIntro: setupData.businessIntro,
              benchmarkBrands: setupData.benchmarkBrands || [],
              sellingPoints: setupData.sellingPoints || [],
              targetAudiences: setupData.targetAudiences || [],
              id: Date.now(),
              createdAt: new Date().toISOString(),
              analyzedAt: new Date().toISOString()
            };
            setAnalyses([historyEntry]);
            // Save to history for next time
            localStorage.setItem('websiteAnalysisHistory', JSON.stringify([historyEntry]));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load analyses from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const audienceGrowthData = [
    { month: 'Jan', users: 1200, engagement: 45 },
    { month: 'Feb', users: 1890, engagement: 52 },
    { month: 'Mar', users: 2390, engagement: 61 },
    { month: 'Apr', users: 3490, engagement: 68 },
    { month: 'May', users: 4200, engagement: 75 },
    { month: 'Jun', users: 5300, engagement: 84 }
  ];

  const competitiveStrength = [
    { subject: 'Product', A: 85, B: 65, fullMark: 100 },
    { subject: 'Pricing', A: 72, B: 80, fullMark: 100 },
    { subject: 'Marketing', A: 90, B: 70, fullMark: 100 },
    { subject: 'UX/UI', A: 88, B: 75, fullMark: 100 },
    { subject: 'Support', A: 78, B: 85, fullMark: 100 }
  ];

  const AnalysisCard = ({ analysis, index }) => {
    const [expanded, setExpanded] = useState(false);

    // Calculate audience segment distribution
    const audienceData = (analysis.targetAudiences || []).map((aud, i) => ({
      name: aud.name || `Segment ${i + 1}`,
      value: 100 / (analysis.targetAudiences.length || 1),
      color: ['#00f5a0', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5]
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {analysis.businessLogo ? (
                <img src={analysis.businessLogo} alt={analysis.businessName} className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl" style={{ backgroundColor: '#00f5a0' }}>
                  🏢
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{analysis.businessName || 'Business Analysis'}</h3>
                <p className="text-sm text-gray-600 mt-1">{analysis.productServiceType}</p>
                {analysis.targetWebsite && (
                  <a
                    href={analysis.targetWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {analysis.targetWebsite}
                  </a>
                )}
              </div>
            </div>
            <span className="px-4 py-2 rounded-full text-xs font-semibold shadow-sm" style={{
              backgroundColor: '#00f5a0',
              color: '#000'
            }}>
              ANALYZED
            </span>
          </div>

          {/* Benchmark Brands */}
          {analysis.benchmarkBrands && analysis.benchmarkBrands.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">BENCHMARK COMPETITORS</p>
              <div className="flex flex-wrap gap-2">
                {analysis.benchmarkBrands.map((brand, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Business Overview
            </h4>
            <p className="text-gray-800 leading-relaxed">{analysis.businessIntro || 'No description provided'}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Selling Points</span>
                <Lightbulb className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{(analysis.sellingPoints || []).length}</p>
              <p className="text-xs text-green-600 mt-1">Core features</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Audiences</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{(analysis.targetAudiences || []).length}</p>
              <p className="text-xs text-blue-600 mt-1">Segments</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Competitors</span>
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{(analysis.benchmarkBrands || []).length}</p>
              <p className="text-xs text-purple-600 mt-1">Tracked</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Score</span>
                <Award className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">8.5/10</p>
              <p className="text-xs text-orange-600 mt-1">Overall</p>
            </div>
          </div>

          {/* Core Selling Points */}
          {analysis.sellingPoints && analysis.sellingPoints.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Core Selling Points
              </h4>
              <div className="space-y-3">
                {analysis.sellingPoints.filter(sp => sp).map((point, i) => (
                  <div key={i} className="flex items-start p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3" style={{ backgroundColor: '#00f5a0' }}>
                      <span className="text-sm font-bold text-black">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed pt-1">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Audience Segmentation */}
          {analysis.targetAudiences && analysis.targetAudiences.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Target Audience Segments ({analysis.targetAudiences.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  {analysis.targetAudiences.map((audience, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border-2 border-gray-200">
                      <h5 className="font-bold text-gray-900 mb-2 flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: audienceData[i]?.color || '#00f5a0' }} />
                        {audience.name || `Segment ${i + 1}`}
                      </h5>
                      <p className="text-sm text-gray-700">{audience.description || 'No description'}</p>
                    </div>
                  ))}
                </div>

                {/* Audience Distribution Chart */}
                {audienceData.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="text-sm font-bold text-gray-700 mb-3">Audience Distribution</h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPie>
                        <Pie
                          data={audienceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {audienceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Competitive Analysis */}
          {analysis.benchmarkBrands && analysis.benchmarkBrands.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <Target className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                Competitive Strength Analysis
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={competitiveStrength}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis stroke="#6b7280" />
                  <Radar name="Your Business" dataKey="A" stroke="#00f5a0" fill="#00f5a0" fillOpacity={0.3} />
                  <Radar name="Competition Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Audience Growth Projection */}
          <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
              Projected Audience Growth
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={audienceGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f5a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f5a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#00f5a0" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign Recommendations */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border-2 border-green-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
              <ArrowRight className="w-5 h-5 mr-2" style={{ color: '#00f5a0' }} />
              Campaign Recommendations
            </h4>
            <div className="space-y-3">
              <div className="flex items-start bg-white rounded-lg p-4 border border-green-200">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#00f5a0' }} />
                <div>
                  <p className="font-medium text-gray-900">Target {analysis.targetAudiences?.[0]?.name || 'primary segment'} first</p>
                  <p className="text-sm text-gray-700 mt-1">
                    This segment shows highest engagement potential based on your selling points
                  </p>
                </div>
              </div>
              <div className="flex items-start bg-white rounded-lg p-4 border border-green-200">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#00f5a0' }} />
                <div>
                  <p className="font-medium text-gray-900">Emphasize unique differentiators</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Highlight features that set you apart from {analysis.benchmarkBrands?.[0] || 'competitors'}
                  </p>
                </div>
              </div>
              <div className="flex items-start bg-white rounded-lg p-4 border border-green-200">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: '#00f5a0' }} />
                <div>
                  <p className="font-medium text-gray-900">Personalize messaging by segment</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Create segment-specific email variants to maximize relevance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis history...</p>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis History</h3>
        <p className="text-gray-600 mb-4">Complete the website analysis configuration and save to create your first analysis report</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Analysis History</h3>
        <p className="text-sm text-gray-600">Comprehensive reports from {analyses.length} website {analyses.length === 1 ? 'analysis' : 'analyses'}</p>
      </div>

      {analyses.map((analysis, index) => (
        <AnalysisCard key={analysis.id || index} analysis={analysis} index={index} />
      ))}
    </div>
  );
};

export default WebsiteAnalysisHistory;
