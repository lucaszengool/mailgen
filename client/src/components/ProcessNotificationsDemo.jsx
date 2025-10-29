import React, { useState } from 'react';
import ProcessNotifications from './ProcessNotifications';

const ProcessNotificationsDemo = () => {
  const [currentStage, setCurrentStage] = useState(null);

  const stages = [
    { id: 'prospectSearchStarting', label: '1. Starting Search' },
    { id: 'prospectSearchInProgress', label: '2. Searching...' },
    { id: 'prospectSearchComplete', label: '3. Prospects Found' },
    { id: 'templateSelectionStarting', label: '4. Select Template' },
    { id: 'emailGenerationStarting', label: '5. Starting Generation' },
    { id: 'emailGenerationInProgress', label: '6. Generating...' },
    { id: 'emailGenerationComplete', label: '7. Emails Ready' },
    { id: 'emailSendingInProgress', label: '8. Sending...' },
    { id: 'campaignComplete', label: '9. Complete!' },
    { id: 'error', label: 'Error State' }
  ];

  const handleAction = (actionType) => {
    console.log('Action triggered:', actionType);
    // You can handle different actions here
    if (actionType === 'selectTemplate') {
      setCurrentStage('templateSelectionStarting');
    } else if (actionType === 'reviewEmails') {
      setCurrentStage('emailSendingInProgress');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Process Notifications Demo
          </h1>
          <p className="text-lg" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            Click any stage below to see the notification popup
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setCurrentStage(stage.id)}
              className="p-6 rounded-xl text-left transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'white',
                border: '2px solid',
                borderColor: currentStage === stage.id ? '#00f0a0' : '#f0f0f0'
              }}
            >
              <div className="font-semibold text-lg mb-2"
                   style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                {stage.label}
              </div>
              <div className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                Click to preview
              </div>
            </button>
          ))}
        </div>

        {/* Current Stage Display */}
        {currentStage && (
          <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: 'white', border: '1px solid #f0f0f0' }}>
            <div className="text-center">
              <div className="text-sm font-semibold mb-2" style={{ color: '#00f0a0' }}>
                Currently Showing:
              </div>
              <div className="text-lg font-bold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                {stages.find(s => s.id === currentStage)?.label}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Component */}
      <ProcessNotifications
        workflowStatus={currentStage}
        onDismiss={() => setCurrentStage(null)}
        onAction={handleAction}
      />
    </div>
  );
};

export default ProcessNotificationsDemo;
