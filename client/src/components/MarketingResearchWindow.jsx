import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Newspaper, FileText, BarChart3, Play, Pause, Square, RefreshCw, 
  Activity, Globe, Brain, Target, Zap, Clock, CheckCircle, Search, Database, 
  Shield, Mail, Server, Gauge, Eye, ChevronRight 
} from 'lucide-react';

const MarketingResearchWindow = () => {
  const [researchStatus, setResearchStatus] = useState({ isRunning: false, isPaused: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationState, setAnimationState] = useState('idle');
  const [showResults, setShowResults] = useState(false);
  
  // Animation data
  const [animatedMetrics, setAnimatedMetrics] = useState({
    websites: 0,
    trends: 0,
    insights: 0
  });

  // Research results data
  const [researchResults, setResearchResults] = useState({
    trends: [
      {
        title: 'AI-Powered Food Technology',
        description: 'Growing demand for automated food processing solutions',
        timestamp: new Date().toISOString(),
        relevance: 'High'
      },
      {
        title: 'Sustainable Agriculture Tech',
        description: 'Focus on eco-friendly farming automation systems',
        timestamp: new Date().toISOString(),
        relevance: 'High'
      }
    ],
    competitors: [
      {
        name: 'AgriTech Solutions',
        industry: 'Food Technology',
        status: 'Active competitor',
        analysisTime: '< 2 seconds'
      }
    ],
    insights: [
      {
        title: 'Market Opportunity Analysis',
        insights: 'B2B Food Technology sector shows 23% growth potential with increasing demand for AI-driven solutions in agricultural processing.',
        timestamp: new Date().toISOString(),
        dataPoints: 156,
        recommendations: ['Focus on mid-market companies', 'Emphasize ROI benefits', 'Target decision makers in operations']
      }
    ]
  });

  // Start research animation
  const startResearch = () => {
    setLoading(true);
    setAnimationState('running');
    setCurrentStep(0);
    setShowResults(false);
    setError(null);
    
    // Start the step animation sequence
    const researchSteps = [
      { title: 'Initializing market analysis...', icon: Database, duration: 1000 },
      { title: 'Scanning industry trends...', icon: TrendingUp, duration: 1500 },
      { title: 'Analyzing competitor landscape...', icon: Users, duration: 1200 },
      { title: 'Generating strategic insights...', icon: Brain, duration: 1800 },
      { title: 'Research complete!', icon: CheckCircle, duration: 800 }
    ];

    let timers = [];
    
    researchSteps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        if (index === researchSteps.length - 1) {
          setAnimationState('completed');
          setShowResults(true);
          // Animate metrics
          animateMetrics();
          // Complete after results show
          setTimeout(() => {
            setLoading(false);
          }, 2000);
        }
      }, researchSteps.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
      timers.push(timer);
    });
  };

  const animateMetrics = () => {
    // Animate numbers incrementally
    let websites = 0;
    let trends = 0; 
    let insights = 0;
    
    const interval = setInterval(() => {
      if (websites < 127) websites += 3;
      if (trends < 45) trends += 1;
      if (insights < 23) insights += 1;
      
      setAnimatedMetrics({ websites, trends, insights });
      
      if (websites >= 127 && trends >= 45 && insights >= 23) {
        clearInterval(interval);
      }
    }, 50);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 bg-gradient-to-br from-white via-gray-50 to-blue-50">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Marketing Research Progress</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              {animationState === 'completed' ? '100%' : `${Math.min((currentStep + 1) * 20, 100)}%`}
            </div>
            <Gauge className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        {/* Research Steps */}
        <div className="space-y-3">
          {[
            { title: 'Initializing market analysis...', icon: Database },
            { title: 'Scanning industry trends...', icon: TrendingUp },
            { title: 'Analyzing competitor landscape...', icon: Users },
            { title: 'Generating strategic insights...', icon: Brain },
            { title: 'Research complete!', icon: CheckCircle }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: currentStep >= index ? 1 : 0.3,
                scale: currentStep === index ? 1.02 : 1
              }}
              className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                currentStep >= index 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentStep >= index ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                <step.icon className={`w-4 h-4 ${currentStep >= index ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <span className={`font-medium ${
                currentStep >= index ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {currentStep === index && (
                <div className="ml-auto">
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
              )}
              {currentStep > index && (
                <div className="ml-auto">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200 mt-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Research Results</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{animatedMetrics.websites}</div>
                <div className="text-sm text-gray-600">Websites Analyzed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">{animatedMetrics.trends}</div>
                <div className="text-sm text-gray-600">Market Trends</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{animatedMetrics.insights}</div>
                <div className="text-sm text-gray-600">Strategic Insights</div>
              </div>
            </div>

            {/* Quick Preview of Results */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Top Market Trend</span>
                </div>
                <p className="text-gray-700">AI-Powered Food Technology - Growing demand for automated solutions</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Key Insight</span>
                </div>
                <p className="text-gray-700">B2B Food Technology sector shows 23% growth potential</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Super Marketing Research Engine</h2>
            <p className="text-gray-600">AI-powered market intelligence and competitive analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Ready</div>
        </div>
      </div>

      {/* Start Research Button */}
      <div className="text-center">
        <button
          onClick={startResearch}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>{loading ? 'Running Analysis...' : 'Start AI Research'}</span>
          </div>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Market Trends</h3>
          </div>
          <p className="text-gray-600 text-sm">Analyze emerging trends and market opportunities</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Competitor Analysis</h3>
          </div>
          <p className="text-gray-600 text-sm">Deep dive into competitive landscape</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <Brain className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Strategic Insights</h3>
          </div>
          <p className="text-gray-600 text-sm">AI-generated actionable recommendations</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingResearchWindow;