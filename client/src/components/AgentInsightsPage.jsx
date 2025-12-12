import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, CheckCircle, AlertTriangle, Clock, BarChart3, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';

const AgentInsightsPage = ({ campaignId, onBack }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchInsights();
  }, [campaignId]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const response = await fetch(`/api/agent-learning/insights/${campaignId}`, {
        headers: {
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'prospect_quality': Target,
      'email_performance': BarChart3,
      'search_optimization': Sparkles,
      'timing': Clock,
      'industry_insights': Lightbulb,
      'personalization': Brain,
      'subject_lines': Lightbulb,
      'call_to_action': Target
    };
    return icons[category] || Lightbulb;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'observation': return Lightbulb;
      case 'pattern': return TrendingUp;
      case 'correlation': return BarChart3;
      case 'improvement': return CheckCircle;
      case 'warning': return AlertTriangle;
      default: return Lightbulb;
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
            <Brain className="w-8 h-8 text-black animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Loading Agent Insights</h2>
          <p className="text-gray-500 text-sm">Analyzing learning patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Error Loading Insights</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchInsights}
            className="px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasLearnings = insights && insights.totalLearnings > 0;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - Same style as SimpleWorkflowDashboard */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
              <Brain className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Agent Insights</h1>
              <p className="text-gray-500 text-sm">What your AI agent has learned</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Stats badges */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
              <Lightbulb className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-bold text-black">{insights?.totalLearnings || 0}</span>
              <span className="text-xs text-gray-500">Learnings</span>
            </div>
            {insights?.decisionAccuracy !== null && insights?.decisionAccuracy !== undefined && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-black">{(insights.decisionAccuracy * 100).toFixed(0)}%</span>
                <span className="text-xs text-gray-500">Accuracy</span>
              </div>
            )}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#e8fff5' }}>
              <CheckCircle className="w-4 h-4" style={{ color: '#00f5a0' }} />
              <span className="text-xs font-medium text-gray-700">Self-Improving</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {hasLearnings && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: '#00f5a0' } : {}}
            >
              All
            </button>
            {Object.entries(insights.learningsByCategory || {}).map(([category, count]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === category
                    ? 'text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={selectedCategory === category ? { backgroundColor: '#00f5a0' } : {}}
              >
                {category.replace(/_/g, ' ')} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {hasLearnings ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Learning Cards */}
            <div className="space-y-3">
              {(insights.topLearnings || [])
                .filter(l => selectedCategory === 'all' || l.category === selectedCategory)
                .map((learning, index) => {
                  const CategoryIcon = getCategoryIcon(learning.category);
                  const TypeIcon = getTypeIcon(learning.type);

                  return (
                    <div
                      key={learning.id || index}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#e8fff5' }}
                        >
                          <CategoryIcon className="w-6 h-6" style={{ color: '#00c880' }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 uppercase">
                              {learning.category.replace(/_/g, ' ')}
                            </span>
                            <TypeIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {learning.type}
                            </span>
                          </div>
                          <p className="text-sm text-black leading-relaxed">
                            {learning.insight}
                          </p>

                          {/* Confidence bar */}
                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs text-gray-500">Confidence</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${learning.confidence * 100}%`,
                                  backgroundColor: '#00f5a0'
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-black">
                              {(learning.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Performance Metrics Section */}
            {insights.recentMetrics && insights.recentMetrics.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-black mb-4">Performance Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.recentMetrics.slice(0, 6).map((metric, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {metric.improvementPct > 0 ? (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                            <TrendingUp className="w-4 h-4" style={{ color: '#00c880' }} />
                          </div>
                        ) : metric.improvementPct < 0 ? (
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-black capitalize">
                          {metric.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black">
                          {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                        </span>
                        {metric.improvementPct !== null && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                            metric.improvementPct > 0
                              ? 'text-green-700'
                              : metric.improvementPct < 0
                                ? 'bg-red-50 text-red-600'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                          style={metric.improvementPct > 0 ? { backgroundColor: '#e8fff5' } : {}}
                          >
                            {metric.improvementPct > 0 ? '+' : ''}{metric.improvementPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Decisions Section */}
            {insights.recentDecisions && insights.recentDecisions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-black mb-4">Recent Decisions</h3>
                <div className="space-y-3">
                  {insights.recentDecisions.map((decision, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{decision.decision}</p>
                          {decision.reasoning && (
                            <p className="text-xs text-gray-500 mt-1">{decision.reasoning}</p>
                          )}
                        </div>
                        {decision.wasCorrect !== null && (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            decision.wasCorrect ? '' : 'bg-red-100'
                          }`}
                          style={decision.wasCorrect ? { backgroundColor: '#e8fff5' } : {}}
                          >
                            {decision.wasCorrect ? (
                              <CheckCircle className="w-4 h-4" style={{ color: '#00c880' }} />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">No Learnings Yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Your AI agent will start learning as you run campaigns. Check back after your first prospect search or email send.
            </p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">Prospect Search</span>
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">Email Patterns</span>
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">Performance</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Same style as SimpleWorkflowDashboard */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-white border border-gray-300 text-black font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">AI learns continuously from your campaigns</span>
            <button
              onClick={fetchInsights}
              className="px-6 py-2.5 text-black font-semibold rounded-xl transition-all flex items-center gap-2"
              style={{ backgroundColor: '#00f5a0' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentInsightsPage;
