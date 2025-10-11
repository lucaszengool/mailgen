import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Search, Brain, CheckCircle2, Clock, Zap,
  Building2, Target, TrendingUp, Users, Sparkles,
  Eye, FileText, Database, Activity, ArrowRight,
  Loader2, AlertCircle, Info, Award, Star
} from 'lucide-react';

const WebsiteAnalysisVisualizer = ({ 
  logs = [], 
  isStreaming = false,
  className = "" 
}) => {
  const [currentPhase, setCurrentPhase] = useState('idle');
  const [discoveredData, setDiscoveredData] = useState({});
  const [animatedLogs, setAnimatedLogs] = useState([]);
  const [phaseProgress, setPhaseProgress] = useState({});
  
  // Analysis phases with visual representation
  const analysisPhases = [
    {
      id: 'initialization',
      title: 'Initialization',
      subtitle: 'Preparing analysis tools',
      icon: Zap,
      color: 'blue',
      keywords: ['starting', 'target', 'initializing'],
      duration: 2000
    },
    {
      id: 'memory_search',
      title: 'Memory Search',
      subtitle: 'Searching historical data',
      icon: Database,
      color: 'purple',
      keywords: ['memory', 'similar', 'searching'],
      duration: 3000
    },
    {
      id: 'content_analysis',
      title: 'Content Analysis',
      subtitle: 'AI analyzing website',
      icon: Brain,
      color: 'orange',
      keywords: ['analyzing', 'ai', 'content'],
      duration: 8000
    },
    {
      id: 'insights_extraction',
      title: 'Insights Extraction',
      subtitle: 'Extracting key information',
      icon: Award,
      color: 'green',
      keywords: ['complete', 'analysis', 'industry', 'value'],
      duration: 2000
    }
  ];

  // Process logs to determine current phase and extract data
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setCurrentPhase('idle');
      return;
    }

    const latestLog = logs[logs.length - 1];
    const logMessage = latestLog.message?.toLowerCase() || '';

    // Determine current phase based on log content
    let detectedPhase = 'idle';
    for (const phase of analysisPhases) {
      if (phase.keywords.some(keyword => logMessage.includes(keyword))) {
        detectedPhase = phase.id;
        break;
      }
    }
    
    setCurrentPhase(detectedPhase);

    // Extract discovered data from logs
    const extractedData = {};
    logs.forEach(log => {
      const message = log.message || '';
      
      // Extract company name
      if (message.includes('Analysis complete:')) {
        const companyMatch = message.match(/Analysis complete:\s*(.+)$/);
        if (companyMatch) {
          extractedData.companyName = companyMatch[1].trim();
        }
      }
      
      // Extract industry
      if (message.includes('Industry:')) {
        const industryMatch = message.match(/Industry:\s*(.+)$/);
        if (industryMatch) {
          extractedData.industry = industryMatch[1].trim();
        }
      }
      
      // Extract value proposition
      if (message.includes('Value:')) {
        const valueMatch = message.match(/Value:\s*(.+)$/);
        if (valueMatch) {
          extractedData.valueProposition = valueMatch[1].trim();
        }
      }
      
      // Extract memory insights count
      if (message.includes('Found') && message.includes('similar')) {
        const countMatch = message.match(/Found (\d+) similar/);
        if (countMatch) {
          extractedData.similarAnalyses = parseInt(countMatch[1]);
        }
      }
    });
    
    setDiscoveredData(extractedData);

    // Animate logs
    const processedLogs = logs.map((log, index) => ({
      ...log,
      id: `log-${index}`,
      isNew: index === logs.length - 1 && isStreaming
    }));
    setAnimatedLogs(processedLogs);

  }, [logs, isStreaming]);

  // Color schemes for different phases
  const getPhaseColors = (phaseId) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 border-blue-300 bg-blue-50 text-blue-700',
      purple: 'from-purple-500 to-purple-600 border-purple-300 bg-purple-50 text-purple-700', 
      orange: 'from-orange-500 to-orange-600 border-orange-300 bg-orange-50 text-orange-700',
      green: 'from-green-500 to-green-600 border-green-300 bg-green-50 text-green-700',
      gray: 'from-gray-400 to-gray-500 border-gray-300 bg-gray-50 text-gray-600'
    };
    
    const phase = analysisPhases.find(p => p.id === phaseId);
    return colors[phase?.color] || colors.gray;
  };

  // Current active phase
  const activePhase = analysisPhases.find(p => p.id === currentPhase);

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Website Analysis</h3>
              <p className="text-blue-100">AI-powered business intelligence</p>
            </div>
          </div>
          
          {/* Live indicator */}
          {isStreaming && (
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Analysis</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="p-6 space-y-6">
        
        {/* Phase progress visualization */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Analysis Progress</h4>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200"></div>
            <div 
              className={`absolute top-8 left-8 h-0.5 bg-gradient-to-r transition-all duration-1000 ${
                activePhase ? getPhaseColors(activePhase.id).split(' ')[0] + ' ' + getPhaseColors(activePhase.id).split(' ')[1] : 'from-gray-300 to-gray-300'
              }`}
              style={{ 
                width: `${Math.max(0, (analysisPhases.findIndex(p => p.id === currentPhase) + 1) / analysisPhases.length * 100 - 12)}%` 
              }}
            ></div>
            
            {/* Phase nodes */}
            <div className="relative flex justify-between items-start">
              {analysisPhases.map((phase, index) => {
                const Icon = phase.icon;
                const isActive = currentPhase === phase.id;
                const isCompleted = analysisPhases.findIndex(p => p.id === currentPhase) > index;
                const isPending = analysisPhases.findIndex(p => p.id === currentPhase) < index;
                
                return (
                  <div key={phase.id} className="flex flex-col items-center space-y-3 relative">
                    {/* Node circle */}
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500 transform ${
                      isActive ? `scale-110 shadow-lg ${getPhaseColors(phase.id)} animate-pulse` :
                      isCompleted ? 'bg-green-500 border-green-500 text-white scale-105' :
                      'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : isActive ? (
                        <Icon className="w-8 h-8" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Phase info */}
                    <div className="text-center max-w-24">
                      <h5 className={`text-sm font-semibold transition-colors ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {phase.title}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">{phase.subtitle}</p>
                    </div>
                    
                    {/* Active phase indicator */}
                    {isActive && (
                      <div className="absolute -top-2 -left-2 w-20 h-20 border-2 border-blue-300 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Discovered insights */}
        {Object.keys(discoveredData).length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
              Discovered Insights
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {discoveredData.companyName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-blue-900">Company Name</h5>
                      <p className="text-blue-700 mt-1">{discoveredData.companyName}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {discoveredData.industry && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-purple-900">Industry</h5>
                      <p className="text-purple-700 mt-1">{discoveredData.industry}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {discoveredData.valueProposition && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:col-span-2 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-green-900">Value Proposition</h5>
                      <p className="text-green-700 mt-1">{discoveredData.valueProposition}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {discoveredData.similarAnalyses && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <Database className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-orange-900">Memory Insights</h5>
                      <p className="text-orange-700 mt-1">{discoveredData.similarAnalyses} similar analyses found</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent activity log - simplified and clean */}
        {animatedLogs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-600" />
              Recent Activity
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {animatedLogs.slice(-5).map((log, index) => (
                <div 
                  key={log.id} 
                  className={`flex items-start space-x-3 p-2 rounded transition-all duration-300 ${
                    log.isNew ? 'bg-blue-100 border-l-4 border-l-blue-500' : 'hover:bg-white'
                  }`}
                >
                  {/* Activity dot */}
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.level === 'success' ? 'bg-green-500' :
                    log.level === 'error' ? 'bg-red-500' :
                    log.level === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  
                  {/* Log message */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {/* New indicator */}
                  {log.isNew && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idle state */}
        {currentPhase === 'idle' && animatedLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-600 mb-2">Ready for Analysis</h4>
            <p className="text-gray-500">Start a campaign to begin website analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteAnalysisVisualizer;