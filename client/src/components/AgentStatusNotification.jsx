import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Search, Mail, BarChart3, Sparkles } from 'lucide-react';

/**
 * AgentStatusNotification Component
 * Shows current agent activity with beautiful animations
 * UI Style: Light green, grey, white background, black text
 */

const AgentStatusNotification = ({ status, message, details = [], onClose, autoClose = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  // Animate progress bar
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 500);
      return () => clearInterval(interval);
    } else if (status === 'success') {
      setProgress(100);
    }
  }, [status]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const statusConfig = {
    loading: {
      icon: Loader2,
      iconClass: 'animate-spin text-green-500',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      title: 'Agent Working...',
      progressColor: '#22c55e'
    },
    searching: {
      icon: Search,
      iconClass: 'animate-pulse text-green-500',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      title: 'Searching Prospects...',
      progressColor: '#22c55e'
    },
    generating: {
      icon: Mail,
      iconClass: 'animate-pulse text-green-500',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      title: 'Generating Emails...',
      progressColor: '#22c55e'
    },
    success: {
      icon: CheckCircle,
      iconClass: 'text-green-500',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      title: 'Success!',
      progressColor: '#22c55e'
    },
    error: {
      icon: AlertCircle,
      iconClass: 'text-red-500',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      title: 'Error',
      progressColor: '#ef4444'
    }
  };

  const config = statusConfig[status] || statusConfig.loading;
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`w-96 bg-white rounded-xl shadow-2xl border-2 ${config.borderClass} overflow-hidden`}>
        {/* Progress bar */}
        {(status === 'loading' || status === 'searching' || status === 'generating') && (
          <div className="h-1 bg-gray-200">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: config.progressColor
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className={`p-6 ${config.bgClass}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Icon className={`w-6 h-6 ${config.iconClass}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">{config.title}</h3>
                <p className="text-sm text-gray-700">{message}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Details */}
          {details && details.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
              {details.map((detail, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-black">{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * AgentActivityPanel - Shows detailed agent progress
 */
export const AgentActivityPanel = ({ activities = [], isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Agent Activity</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Waiting for agent to start...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className={`flex-shrink-0 ${activity.completed ? 'text-green-500' : 'text-gray-400'}`}>
                    {activity.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{activity.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                    {activity.result && (
                      <p className="text-sm text-green-600 mt-2 font-medium">{activity.result}</p>
                    )}
                  </div>
                  {activity.time && (
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default AgentStatusNotification;
