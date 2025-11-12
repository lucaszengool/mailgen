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
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Notification configurations for each stage
  const notifications = {
    // Stage 0A: Website Analysis Starting
    websiteAnalysisStarting: {
      icon: <Sparkles className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Analyzing Your Website...',
      message: 'AI is analyzing your business to understand your offering',
      details: [
        'Scanning website content and structure',
        'Identifying your value proposition',
        'Estimated time: 5-10 seconds'
      ],
      type: 'info',
      actions: [
        { label: 'View Progress', action: 'viewProgress', primary: true }
      ]
    },

    // Stage 0B: Website Analysis Complete
    websiteAnalysisComplete: {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Website Analysis Complete!',
      message: 'AI successfully analyzed your business',
      details: [
        'Business model identified',
        'Target audiences discovered',
        'Ready to find prospects'
      ],
      type: 'success',
      actions: [
        { label: 'View Analysis', action: 'viewAnalysis', primary: true },
        { label: 'Continue', action: 'continue', primary: false }
      ]
    },

    // Stage 0C: Marketing Strategy Starting
    strategyGenerationStarting: {
      icon: <Zap className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Creating Marketing Strategy...',
      message: 'AI is generating a personalized marketing strategy',
      details: [
        'Analyzing your target market',
        'Identifying key pain points',
        'Estimated time: 10-15 seconds'
      ],
      type: 'info',
      actions: [
        { label: 'View Progress', action: 'viewProgress', primary: true }
      ]
    },

    // Stage 0D: Marketing Strategy Complete
    strategyGenerationComplete: {
      icon: <CheckCircle className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Marketing Strategy Ready!',
      message: 'Your personalized marketing strategy has been generated',
      details: [
        'Target personas identified',
        'Messaging framework created',
        'View in Dashboard'
      ],
      type: 'success',
      actions: [
        { label: 'View Strategy', action: 'viewStrategy', primary: true },
        { label: 'Find Prospects', action: 'findProspects', primary: false }
      ]
    },

    // Stage 1: Starting Prospect Search
    prospectSearchStarting: {
      icon: <Users className="w-8 h-8" style={{ color: '#00f0a0' }} />,
      title: 'Finding Prospects...',
      message: 'Your AI agent is searching for qualified leads',
      details: [
        'Searching across multiple sources',
        'Matching your ideal customer profile',
        'Estimated time: Just a few seconds'
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
      title: `${prospectCount || 7} Prospects Found!`,
      message: 'Your AI agent has found qualified prospects',
      details: [
        `${prospectCount || 7} verified prospects ready`,
        'AI will personalize emails for each prospect',
        'Check "Prospects" tab to review'
      ],
      type: 'success',
      actions: [
        { label: 'View Prospects', action: 'viewProspects', primary: true },
        { label: 'Continue to Emails', action: 'continueToEmails', primary: false }
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
      message: `AI is creating custom emails for ${prospectCount || 7} prospects`,
      details: [
        'Personalizing with prospect data',
        'Crafting unique messages',
        `Estimated time: ${Math.ceil((prospectCount || 7) * 2 / 60)} minute${(prospectCount || 7) > 30 ? 's' : ''}`
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
      title: `${emailCount || 7} Emails Ready!`,
      message: 'All personalized emails have been generated',
      details: [
        `${emailCount || 7} unique emails created`,
        'Personalized with AI insights',
        'Check "Email Editor" tab to review and send'
      ],
      type: 'success',
      actions: [
        { label: 'Review Emails', action: 'reviewEmails', primary: true },
        { label: 'View Campaign', action: 'viewCampaign', primary: false }
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
      message: `All ${emailCount || 7} emails have been sent to prospects`,
      details: [
        `${emailCount || 7} emails delivered`,
        'Now tracking opens and replies',
        'Check "Analytics" tab for results'
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
      // Check if user has disabled this notification type
      const disabledNotifications = JSON.parse(localStorage.getItem('disabledNotifications') || '{}');
      if (disabledNotifications[workflowStatus]) {
        console.log(`🔕 Notification "${workflowStatus}" is disabled by user`);
        return; // Don't show if disabled
      }

      setCurrentNotification(notifications[workflowStatus]);
      setIsVisible(true);
    }
  }, [workflowStatus]);

  const handleClose = () => {
    // If "don't show again" is checked, save preference
    if (dontShowAgain && workflowStatus) {
      const disabledNotifications = JSON.parse(localStorage.getItem('disabledNotifications') || '{}');
      disabledNotifications[workflowStatus] = true;
      localStorage.setItem('disabledNotifications', JSON.stringify(disabledNotifications));
      console.log(`🔕 Disabled notification: ${workflowStatus}`);
    }

    setIsVisible(false);
    setTimeout(() => {
      onDismiss && onDismiss();
    }, 300);
  };

  const handleAction = (actionType) => {
    // If "don't show again" is checked, save preference
    if (dontShowAgain && workflowStatus) {
      const disabledNotifications = JSON.parse(localStorage.getItem('disabledNotifications') || '{}');
      disabledNotifications[workflowStatus] = true;
      localStorage.setItem('disabledNotifications', JSON.stringify(disabledNotifications));
      console.log(`🔕 Disabled notification: ${workflowStatus}`);
    }

    onAction && onAction(actionType);
  };

  if (!isVisible || !currentNotification) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
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
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-[#00f5a0] rounded-3xl shadow-2xl shadow-[#00f5a0]/20 p-8 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#00f5a0] rounded-xl flex items-center justify-center animate-pulse">
              {currentNotification.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3 text-white">
            {currentNotification.title}
          </h2>

          {/* Message */}
          <p className="text-center mb-6 text-gray-400 text-base leading-relaxed">
            {currentNotification.message}
          </p>

          {/* Progress Bar (if applicable) */}
          {currentNotification.showProgress && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Progress
                </span>
                <span className="text-sm font-semibold text-[#00f5a0]">
                  {currentNotification.progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 bg-gradient-to-r from-[#00f5a0] to-[#00c98d]"
                  style={{ width: `${currentNotification.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Details List */}
          <div className="space-y-2 mb-6">
            {currentNotification.details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#00f5a0]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">
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
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  action.primary
                    ? 'bg-black hover:bg-gray-900 text-[#00f5a0] border-2 border-[#00f5a0]'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Don't Show Again Checkbox */}
          <div className="flex items-center justify-center mt-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#00f5a0] focus:ring-[#00f5a0]"
              />
              <span className="ml-2 text-sm text-gray-400">
                Don't show this notification again
              </span>
            </label>
          </div>

          {/* Footer Note */}
          <p className="text-center mt-2 text-xs text-gray-500">
            This reminder is based on your campaign's current status
          </p>
        </div>
      </div>
    </>
  );
};

export default ProcessNotifications;
