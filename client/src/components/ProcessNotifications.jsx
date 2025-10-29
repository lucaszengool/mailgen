import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Sparkles, Mail, Users, Zap, AlertCircle } from 'lucide-react';

const ProcessNotifications = ({
  workflowStatus = 'idle',
  onDismiss,
  onAction,
  prospectCount = 0,
  emailCount = 0,
  progress = 0
}) => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Notification configurations for each stage
  const notifications = {
    // Stage 1: Starting Prospect Search
    prospectSearchStarting: {
      icon: <Users className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'AI Agent Starting...',
      message: 'Your AI agent is initializing prospect search',
      details: [
        'Analyzing your target criteria',
        'Accessing 80M+ prospect database',
        'Estimated time: 2-3 minutes'
      ],
      type: 'info',
      actions: [
        { label: 'View Progress', action: 'viewProgress', primary: true }
      ]
    },

    // Stage 2: Finding Prospects (In Progress)
    prospectSearchInProgress: {
      icon: <Sparkles className="w-8 h-8 animate-spin" style={{ color: '#00f0a0' }} />,
      title: 'Finding Perfect Prospects...',
      message: 'AI is actively searching for qualified leads',
      details: [
        '23 prospects found so far',
        'Matching score: 87% average',
        'Estimated completion: ~1 minute'
      ],
      type: 'progress',
      showProgress: true,
      progress: 65,
      actions: [
        { label: 'View Live Results', action: 'viewLive', primary: true }
      ]
    },

    // Stage 3: Prospects Found (Complete)
    prospectSearchComplete: {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: `${prospectCount || 50} Prospects Found!`,
      message: 'Your AI agent has found qualified prospects. Select an email template to continue.',
      details: [
        `${prospectCount || 50} verified prospects ready`,
        'AI will personalize emails for each prospect',
        'Preview before sending'
      ],
      type: 'success',
      actions: [
        { label: 'Select Template', action: 'selectTemplate', primary: true },
        { label: 'View Prospects', action: 'viewProspects', primary: false }
      ]
    },

    // Stage 4: Template Selection Starting
    templateSelectionStarting: {
      icon: <Mail className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Choose Your Email Template',
      message: 'Select a template for your outreach campaign',
      details: [
        '6 professional templates available',
        'AI will customize for each prospect',
        'You can preview before sending'
      ],
      type: 'info',
      actions: [
        { label: 'Browse Templates', action: 'browseTemplates', primary: true }
      ]
    },

    // Stage 5: Email Generation Starting
    emailGenerationStarting: {
      icon: <Zap className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Generating Personalized Emails...',
      message: `AI is creating custom emails for ${prospectCount || 50} prospects`,
      details: [
        'Using selected template',
        'Personalizing with company data',
        `Processing ${prospectCount || 50} prospects`
      ],
      type: 'info',
      showProgress: false,
      actions: [
        { label: 'View Progress', action: 'viewProgress', primary: true }
      ]
    },

    // Stage 6: Email Generation In Progress
    emailGenerationInProgress: {
      icon: <Sparkles className="w-8 h-8 animate-spin" style={{ color: '#00f0a0' }} />,
      title: 'Crafting Your Emails...',
      message: 'AI is generating personalized content',
      details: [
        '32 of 50 emails completed',
        'Average personalization score: 94%',
        'Estimated completion: ~2 minutes'
      ],
      type: 'progress',
      showProgress: true,
      progress: 64,
      actions: [
        { label: 'Preview Generated', action: 'previewEmails', primary: true }
      ]
    },

    // Stage 7: Emails Generated (Ready to Review)
    emailGenerationComplete: {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: `${emailCount || 50} Emails Ready!`,
      message: 'All personalized emails have been generated',
      details: [
        `${emailCount || 50} unique emails created`,
        'Personalized with AI insights',
        'Review and approve before sending'
      ],
      type: 'success',
      actions: [
        { label: 'Review Emails', action: 'reviewEmails', primary: true },
        { label: 'Send All', action: 'sendAll', primary: false }
      ]
    },

    // Stage 8: Sending Emails
    emailSendingInProgress: {
      icon: <Mail className="w-8 h-8 animate-pulse" style={{ color: '#00f0a0' }} />,
      title: 'Sending Emails...',
      message: 'Your personalized emails are being delivered',
      details: [
        '38 of 50 emails sent',
        'Delivery rate: 100%',
        'Estimated completion: ~1 minute'
      ],
      type: 'progress',
      showProgress: true,
      progress: 76,
      actions: [
        { label: 'View Status', action: 'viewStatus', primary: true }
      ]
    },

    // Stage 9: Campaign Complete
    campaignComplete: {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Campaign Launched Successfully!',
      message: 'All 50 emails have been sent to prospects',
      details: [
        '50 emails delivered',
        'Now tracking opens and replies',
        'Check analytics dashboard for results'
      ],
      type: 'success',
      actions: [
        { label: 'View Analytics', action: 'viewAnalytics', primary: true },
        { label: 'Start New Campaign', action: 'newCampaign', primary: false }
      ]
    },

    // Error State
    error: {
      icon: <AlertCircle className="w-8 h-8" style={{ color: '#ff4d4f' }} />,
      title: 'Something Went Wrong',
      message: 'There was an error processing your request',
      details: [
        'Please try again',
        'If issue persists, contact support'
      ],
      type: 'error',
      actions: [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Contact Support', action: 'support', primary: false }
      ]
    }
  };

  // Update notification based on workflow status
  useEffect(() => {
    if (workflowStatus && notifications[workflowStatus]) {
      setCurrentNotification(notifications[workflowStatus]);
      setIsVisible(true);
    }
  }, [workflowStatus]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss && onDismiss();
    }, 300);
  };

  const handleAction = (actionType) => {
    onAction && onAction(actionType);
  };

  if (!isVisible || !currentNotification) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Notification Modal */}
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transition-all duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)'
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative"
             style={{
               border: '1px solid #f0f0f0',
               boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
             }}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                 style={{
                   backgroundColor: currentNotification.type === 'error' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(0, 240, 160, 0.1)'
                 }}>
              {currentNotification.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3"
              style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            {currentNotification.title}
          </h2>

          {/* Message */}
          <p className="text-center mb-6"
             style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '16px', lineHeight: '1.6' }}>
            {currentNotification.message}
          </p>

          {/* Progress Bar (if applicable) */}
          {currentNotification.showProgress && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                  Progress
                </span>
                <span className="text-sm font-semibold" style={{ color: '#00f0a0' }}>
                  {currentNotification.progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${currentNotification.progress}%`,
                    background: 'linear-gradient(90deg, #00f0a0 0%, #00c98d 100%)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Details List */}
          <div className="space-y-2 mb-6">
            {currentNotification.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#00f0a0' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                  {detail}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentNotification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.action)}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: action.primary ? '#00f0a0' : 'white',
                  color: action.primary ? '#001529' : 'rgba(0, 0, 0, 0.65)',
                  border: action.primary ? 'none' : '1px solid #d9d9d9'
                }}
                onMouseEnter={(e) => {
                  if (action.primary) {
                    e.currentTarget.style.backgroundColor = '#28fcaf';
                  } else {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (action.primary) {
                    e.currentTarget.style.backgroundColor = '#00f0a0';
                  } else {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Footer Note */}
          <p className="text-center mt-4 text-xs" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
            This reminder is based on your campaign's current status
          </p>
        </div>
      </div>
    </>
  );
};

export default ProcessNotifications;
