import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ArrowRight, Mail, Users, CheckCircle } from 'lucide-react';
import { apiGet } from '../utils/apiClient';

/**
 * UserActionReminder Component
 * Checks backend state and reminds user of pending actions
 * UI Style: Light green, grey, white background, black text
 */

const UserActionReminder = ({ userId, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [reminderData, setReminderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedReminders, setDismissedReminders] = useState(new Set());

  useEffect(() => {
    // Check backend state every 10 seconds
    const checkBackendState = async () => {
      try {
        setIsLoading(true);

        // Fetch workflow results to check current state
        const result = await apiGet('/api/workflow/results');

        if (result.success && result.data) {
          const { prospects = [], emailCampaign = null } = result.data;

          console.log('🔍 Checking user action state:', {
            prospects: prospects.length,
            emails: emailCampaign?.emails?.length || 0,
            userId
          });

          // Determine what action is needed
          let actionNeeded = null;

          // Case 1: Prospects found but no template selected
          // Only show if: prospects exist, no emails generated, AND user hasn't dismissed this specific reminder
          const selectTemplateKey = `select_template_${prospects.length}`;

          // 🔥 FIX: Don't show if this is onboarding prospects (check if campaign is recent)
          // If workflow status is still "starting" or "idle", these are onboarding prospects
          const workflowStatus = result.data.status || 'idle';
          const isOnboarding = workflowStatus === 'starting' || workflowStatus === 'idle' ||
                              workflowStatus === 'websiteAnalysisStarting' ||
                              workflowStatus === 'prospectSearchStarting';

          if (prospects.length > 0 &&
              (!emailCampaign || !emailCampaign.emails || emailCampaign.emails.length === 0) &&
              !dismissedReminders.has(selectTemplateKey) &&
              !isOnboarding) {  // 🔥 Don't show during onboarding
            actionNeeded = {
              type: 'select_template',
              dismissKey: selectTemplateKey,
              icon: Mail,
              title: `${prospects.length} Prospects Found!`,
              message: 'Your AI agent has found qualified prospects. Select an email template to continue.',
              buttonText: 'Select Template',
              buttonAction: 'template-selection',
              color: '#00f5a0',
              details: [
                `${prospects.length} verified prospects ready`,
                'AI will personalize emails for each prospect',
                'Preview before sending'
              ]
            };
          }

          // Case 2: Emails generated but not sent
          // Only show if there are unsent emails AND user hasn't dismissed this specific reminder
          else if (emailCampaign && emailCampaign.emails && emailCampaign.emails.length > 0) {
            const unsent = emailCampaign.emails.filter(e => e.status === 'generated' || e.status === 'pending');
            const sendEmailsKey = `send_emails_${unsent.length}`;
            if (unsent.length > 0 && !dismissedReminders.has(sendEmailsKey)) {
              actionNeeded = {
                type: 'send_emails',
                dismissKey: sendEmailsKey,
                icon: CheckCircle,
                title: `${unsent.length} Emails Ready to Send!`,
                message: 'Your personalized emails are generated and ready. Review and send them now.',
                buttonText: 'Review & Send',
                buttonAction: 'email-campaign',
                color: '#00f5a0',
                details: [
                  `${unsent.length} personalized emails ready`,
                  'Preview each email before sending',
                  'Track opens, clicks, and replies'
                ]
              };
            }
          }

          if (actionNeeded) {
            setReminderData(actionNeeded);
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking backend state:', error);
        setIsLoading(false);
      }
    };

    // Initial check
    checkBackendState();

    // Check every 10 seconds
    const interval = setInterval(checkBackendState, 10000);

    return () => clearInterval(interval);
  }, [userId, dismissedReminders]);

  const handleAction = () => {
    if (reminderData && onNavigate) {
      // Mark as dismissed when user takes action
      if (reminderData.dismissKey) {
        setDismissedReminders(prev => new Set([...prev, reminderData.dismissKey]));
      }
      onNavigate(reminderData.buttonAction);
    }
  };

  const handleDismiss = () => {
    // Mark as dismissed when user closes the reminder
    if (reminderData && reminderData.dismissKey) {
      setDismissedReminders(prev => new Set([...prev, reminderData.dismissKey]));
    }
    setIsVisible(false);
  };

  if (!isVisible || !reminderData) return null;

  const Icon = reminderData.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className="w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Colored accent bar */}
        <div
          className="h-2"
          style={{ backgroundColor: reminderData.color }}
        />

        {/* Content */}
        <div className="p-6 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${reminderData.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: reminderData.color }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">{reminderData.title}</h3>
                <p className="text-sm text-black mt-1">{reminderData.message}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Details */}
          {reminderData.details && reminderData.details.length > 0 && (
            <div className="space-y-2 mb-4 p-3 bg-white rounded-lg border border-gray-200">
              {reminderData.details.map((detail, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: reminderData.color }}
                  />
                  <span className="text-sm text-black">{detail}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleAction}
            className="w-full py-3 rounded-lg font-semibold text-black flex items-center justify-center space-x-2 transition-all hover:scale-105"
            style={{ backgroundColor: reminderData.color }}
          >
            <span>{reminderData.buttonText}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Footer note */}
          <p className="text-xs text-black mt-3 text-center">
            This reminder is based on your campaign's current status
          </p>
        </div>
      </div>
    </div>
  );
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
`;
if (!document.getElementById('user-action-reminder-styles')) {
  style.id = 'user-action-reminder-styles';
  document.head.appendChild(style);
}

export default UserActionReminder;
