import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Maximize2, Minimize2, Copy, Download, Play, 
  Pause, RotateCcw, Search, Filter, ChevronDown, ChevronRight,
  Clock, Zap, Activity, AlertCircle, CheckCircle2, XCircle,
  Loader2, Circle
} from 'lucide-react';

const AnimatedLogViewer = ({ 
  logs = [], 
  title = "Workflow Logs",
  isStreaming = false,
  onClear,
  onDownload,
  className = ""
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [typewriterMode, setTypewriterMode] = useState(false);
  
  const logContainerRef = useRef(null);
  const logEndRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const animationTimeoutRef = useRef(null);

  // Filter logs based on search and level
  const filteredLogs = logs.filter(log => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Typewriter effect for logs
  useEffect(() => {
    // Calculate filtered logs inside useEffect to avoid dependency issues
    const currentFilteredLogs = logs.filter(log => {
      if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    if (!typewriterMode) {
      setDisplayedLogs(currentFilteredLogs);
      return;
    }

    setDisplayedLogs([]);
    let currentIndex = 0;

    const addNextLog = () => {
      if (currentIndex < currentFilteredLogs.length && isPlaying) {
        setDisplayedLogs(prev => [...prev, currentFilteredLogs[currentIndex]]);
        currentIndex++;
        
        animationTimeoutRef.current = setTimeout(
          addNextLog, 
          500 / animationSpeed // Adjust speed
        );
      }
    };

    addNextLog();

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [logs, selectedLevel, searchTerm, typewriterMode, isPlaying, animationSpeed]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs, autoScroll]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Get log level styling
  const getLogLevelStyle = (level) => {
    const styles = {
      error: 'text-red-400 bg-red-400/10 border-red-400/20',
      warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      success: 'text-green-400 bg-green-400/10 border-green-400/20',
      info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      debug: 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    };
    return styles[level] || styles.info;
  };

  // Get log level icon
  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-3 h-3" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3" />;
      case 'success':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'info':
        return <Circle className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  // Copy logs to clipboard
  const handleCopy = () => {
    const logText = displayedLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      // Could add a toast notification here
    });
  };

  // Download logs as file
  const handleDownload = () => {
    const logText = displayedLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${
      fullscreen ? 'fixed inset-4 z-50' : ''
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Streaming</span>
            </div>
          )}
          
          {/* Log count */}
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            {displayedLogs.length} logs
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Controls */}
          <div className="flex items-center space-x-1 bg-white rounded-md border border-gray-200 p-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setDisplayedLogs([])}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Clear logs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Download logs"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-2">
            {/* Auto-scroll toggle */}
            <label className="flex items-center space-x-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Auto-scroll</span>
            </label>

            {/* Typewriter mode */}
            <label className="flex items-center space-x-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={typewriterMode}
                onChange={(e) => setTypewriterMode(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Typewriter</span>
            </label>

            {/* Timestamps toggle */}
            <label className="flex items-center space-x-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Timestamps</span>
            </label>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 border-b border-gray-200 bg-gray-50">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Level filter */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>

        {/* Animation speed */}
        {typewriterMode && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-8">{animationSpeed}x</span>
          </div>
        )}
      </div>

      {/* Log content */}
      <div 
        ref={logContainerRef}
        className={`bg-gray-900 text-gray-100 font-mono text-sm overflow-auto ${
          fullscreen ? 'h-[calc(100vh-12rem)]' : 'h-[500px]'
        }`}
      >
        <div className="p-4 space-y-1">
          {displayedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs available</p>
                {isStreaming && (
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm">Waiting for logs...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            displayedLogs.map((log, index) => (
              <LogEntry
                key={`${log.timestamp}-${index}`}
                log={log}
                showTimestamps={showTimestamps}
                formatTimestamp={formatTimestamp}
                getLogLevelStyle={getLogLevelStyle}
                getLogLevelIcon={getLogLevelIcon}
                isNew={index === displayedLogs.length - 1 && isStreaming}
              />
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{displayedLogs.length} of {filteredLogs.length} logs shown</span>
          {searchTerm && (
            <span>• Filtered by "{searchTerm}"</span>
          )}
          {selectedLevel !== 'all' && (
            <span>• Level: {selectedLevel}</span>
          )}
        </div>
        
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-blue-400 animate-pulse"></div>
              <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-4 bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>Live streaming</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual log entry component with animations
const LogEntry = ({ 
  log, 
  showTimestamps, 
  formatTimestamp, 
  getLogLevelStyle, 
  getLogLevelIcon, 
  isNew = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const entryRef = useRef(null);

  useEffect(() => {
    // Animate entry appearance
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Highlight effect for new logs
  const [isHighlighted, setIsHighlighted] = useState(isNew);
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div 
      ref={entryRef}
      className={`flex items-start space-x-3 py-1 px-2 rounded transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      } ${
        isHighlighted ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-gray-800/50'
      }`}
    >
      {/* Timestamp */}
      {showTimestamps && (
        <span className="text-gray-500 text-xs font-mono whitespace-nowrap">
          {formatTimestamp(log.timestamp)}
        </span>
      )}

      {/* Level badge */}
      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium border ${
        getLogLevelStyle(log.level)
      }`}>
        {getLogLevelIcon(log.level)}
        <span>{log.level?.toUpperCase() || 'INFO'}</span>
      </div>

      {/* Message */}
      <span className="flex-1 text-gray-300 break-words">
        {log.message}
      </span>

      {/* Progress indicator for certain messages */}
      {log.message?.includes('...') && (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogViewer;