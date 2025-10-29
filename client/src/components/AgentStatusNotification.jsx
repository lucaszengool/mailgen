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
      iconClass: 'animate-spin',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Agent Working...',
      progressColor: '#00f5a0',
      estimatedTime: '2-3 minutes',
      nextAction: 'Please wait while the agent completes the task'
    },
    searching: {
      icon: Search,
      iconClass: 'animate-pulse',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Searching Prospects...',
      progressColor: '#00f5a0',
      estimatedTime: '1-2 minutes',
      nextAction: 'Results will appear in the Prospects tab'
    },
    analyzing_website: {
      icon: Search,
      iconClass: 'animate-pulse',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Analyzing Website...',
      progressColor: '#00f5a0',
      estimatedTime: '30-45 seconds',
      nextAction: 'AI is extracting company information and insights'
    },
    testing_smtp: {
      icon: Mail,
      iconClass: 'animate-pulse',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Testing SMTP Connection...',
      progressColor: '#00f5a0',
      estimatedTime: '10-15 seconds',
      nextAction: 'Verifying email server credentials'
    },
    generating: {
      icon: Mail,
      iconClass: 'animate-pulse',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Generating Emails...',
      progressColor: '#00f5a0',
      estimatedTime: '2-4 minutes',
      nextAction: 'Check Email Campaign tab when complete'
    },
    sending_emails: {
      icon: Mail,
      iconClass: 'animate-spin',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Sending Emails...',
      progressColor: '#00f5a0',
      estimatedTime: '1-3 minutes',
      nextAction: 'Monitor progress in Analytics tab'
    },
    prospects_found: {
      icon: CheckCircle,
      iconClass: '',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Prospects Found!',
      progressColor: '#00f5a0',
      estimatedTime: null,
      nextAction: 'View results in the Prospects tab'
    },
    emails_generated: {
      icon: CheckCircle,
      iconClass: '',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Emails Generated!',
      progressColor: '#00f5a0',
      estimatedTime: null,
      nextAction: 'Review and send from Email Campaign tab'
    },
    smtp_configured: {
      icon: CheckCircle,
      iconClass: '',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'SMTP Configured!',
      progressColor: '#00f5a0',
      estimatedTime: null,
      nextAction: 'You can now send emails from the Email Campaign tab'
    },
    success: {
      icon: CheckCircle,
      iconClass: '',
      iconColor: '#00f5a0',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Success!',
      progressColor: '#00f5a0',
      estimatedTime: null,
      nextAction: null
    },
    error: {
      icon: AlertCircle,
      iconClass: '',
      iconColor: '#ef4444',
      bgClass: 'bg-white',
      borderClass: 'border-gray-200',
      title: 'Error',
      progressColor: '#ef4444',
      estimatedTime: null,
      nextAction: 'Please check the error details and try again'
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
                <Icon className={`w-6 h-6 ${config.iconClass}`} style={{ color: config.iconColor }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">{config.title}</h3>
                <p className="text-sm text-black">{message}</p>
                {config.estimatedTime && (
                  <p className="text-xs text-gray-600 mt-1">
                    ⏱ Estimated time: {config.estimatedTime}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Next Action */}
          {config.nextAction && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-2">
                <span className="text-xs font-semibold text-black">→ Next:</span>
                <span className="text-xs text-black">{config.nextAction}</span>
              </div>
            </div>
          )}

          {/* Details */}
          {details && details.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
              {details.map((detail, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: config.progressColor }}
                  />
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
        <div className="p-6 border-b-2 border-gray-200" style={{ backgroundColor: '#00f5a0' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-bold text-black">Agent Activity</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div className="p-6 max-h-96 overflow-y-auto bg-white">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#00f5a0' }} />
              <p className="text-black">Waiting for agent to start...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex-shrink-0">
                    {activity.completed ? (
                      <CheckCircle className="w-6 h-6" style={{ color: '#00f5a0' }} />
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00f5a0' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{activity.title}</h4>
                    <p className="text-sm text-black mt-1">{activity.description}</p>
                    {activity.result && (
                      <p className="text-sm mt-2 font-medium" style={{ color: '#00f5a0' }}>{activity.result}</p>
                    )}
                  </div>
                  {activity.time && (
                    <span className="text-xs text-black">{activity.time}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 font-semibold text-black rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#00f5a0' }}
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
