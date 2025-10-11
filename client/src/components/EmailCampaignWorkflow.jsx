import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  EyeIcon, 
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProfessionalEmailEditor from './ProfessionalEmailEditor';

export default function EmailCampaignWorkflow({ campaignId, onComplete }) {
  const [currentStep, setCurrentStep] = useState('generating'); // generating, preview, editing, sending, completed
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [selectedEmailForEdit, setSelectedEmailForEdit] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({
    total: 0,
    generated: 0,
    approved: 0,
    sent: 0
  });
  const [userChanges, setUserChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaignId) {
      startEmailGeneration();
    }
  }, [campaignId]);

  const startEmailGeneration = async () => {
    setCurrentStep('generating');
    setLoading(true);
    
    try {
      console.log('🚀 Starting email generation workflow...');
      
      // Start the intelligent automation workflow but with preview mode
      const response = await fetch('/api/campaign-workflow/preview-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          mode: 'preview', // This will generate emails but not send them
          requireApproval: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Fetch the generated emails
        await fetchGeneratedEmails();
        setCurrentStep('preview');
        toast.success('Emails generated! Ready for preview and editing.');
      } else {
        throw new Error(result.error || 'Failed to generate emails');
      }
    } catch (error) {
      console.error('Email generation failed:', error);
      toast.error(`Generation failed: ${error.message}`);
    }
    
    setLoading(false);
  };

  const fetchGeneratedEmails = async () => {
    try {
      const response = await fetch(`/api/campaign-workflow/${campaignId}/pending-emails`);
      const result = await response.json();
      
      if (result.success) {
        setGeneratedEmails(result.emails || []);
        setCampaignProgress({
          total: result.emails?.length || 0,
          generated: result.emails?.length || 0,
          approved: 0,
          sent: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch generated emails:', error);
    }
  };

  const openEmailEditor = (email) => {
    setSelectedEmailForEdit(email);
    setShowEditor(true);
  };

  const handleEmailSave = async (editedEmail) => {
    try {
      // Save the edited email
      const response = await fetch('/api/email-editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: editedEmail.id,
          editedStructure: editedEmail,
          campaignId,
          userId: 'current_user'
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update the email in our local state
        setGeneratedEmails(prev => 
          prev.map(email => 
            email.id === editedEmail.id 
              ? { ...email, ...editedEmail, isEdited: true }
              : email
          )
        );

        // Track the user's changes for learning
        if (result.changesDetected > 0) {
          setUserChanges(prev => [...prev, {
            emailId: editedEmail.id,
            changes: editedEmail.changes || [],
            timestamp: new Date().toISOString()
          }]);
        }

        toast.success('Email saved successfully!');
      }
    } catch (error) {
      toast.error(`Failed to save email: ${error.message}`);
    }
  };

  const handleEmailSend = async (editedEmail) => {
    await handleEmailSave(editedEmail);
    setShowEditor(false);
    
    // Mark this email as approved
    const updatedEmails = generatedEmails.map(email => 
      email.id === editedEmail.id 
        ? { ...email, ...editedEmail, isApproved: true, isEdited: true }
        : email
    );
    setGeneratedEmails(updatedEmails);
    
    setCampaignProgress(prev => ({
      ...prev,
      approved: prev.approved + 1
    }));

    toast.success('Email approved and ready to send!');
  };

  const approveEmail = async (emailId) => {
    try {
      const response = await fetch('/api/campaign-workflow/approve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, campaignId })
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedEmails(prev => 
          prev.map(email => 
            email.id === emailId 
              ? { ...email, isApproved: true }
              : email
          )
        );

        setCampaignProgress(prev => ({
          ...prev,
          approved: prev.approved + 1
        }));

        toast.success('Email approved!');
      }
    } catch (error) {
      toast.error(`Failed to approve email: ${error.message}`);
    }
  };

  const startCampaignSending = async () => {
    const approvedEmails = generatedEmails.filter(email => email.isApproved);
    
    if (approvedEmails.length === 0) {
      toast.error('Please approve at least one email before starting the campaign');
      return;
    }

    setCurrentStep('sending');
    setLoading(true);

    try {
      // Apply learned changes to all emails before sending
      if (userChanges.length > 0) {
        await applyLearningToEmails();
      }

      // Start sending approved emails
      const response = await fetch('/api/campaign-workflow/start-sending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          approvedEmailIds: approvedEmails.map(e => e.id),
          userLearning: userChanges
        })
      });

      const result = await response.json();
      if (result.success) {
        setCurrentStep('completed');
        toast.success('Campaign started successfully!');
        onComplete?.(result);
      } else {
        throw new Error(result.error || 'Failed to start campaign');
      }
    } catch (error) {
      toast.error(`Failed to start campaign: ${error.message}`);
      setCurrentStep('preview');
    }

    setLoading(false);
  };

  const applyLearningToEmails = async () => {
    try {
      const response = await fetch('/api/email-editor/apply-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          userChanges,
          unapprovedEmails: generatedEmails.filter(e => !e.isApproved)
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Learning applied to remaining emails');
        // Refresh emails with applied learning
        await fetchGeneratedEmails();
      }
    } catch (error) {
      console.error('Failed to apply learning:', error);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'generating', label: 'Generating Emails', icon: ClockIcon },
      { id: 'preview', label: 'Preview & Edit', icon: EyeIcon },
      { id: 'sending', label: 'Sending Campaign', icon: PlayIcon },
      { id: 'completed', label: 'Completed', icon: CheckCircleIcon }
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                isActive ? 'bg-blue-600 text-white' :
                isCompleted ? 'bg-green-600 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                <StepIcon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-blue-600' :
                isCompleted ? 'text-green-600' :
                'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderEmailPreview = (email, index) => {
    const isApproved = email.isApproved;
    const isEdited = email.isEdited;

    return (
      <div key={email.id || index} className={`bg-white rounded-lg shadow-sm border-2 ${
        isApproved ? 'border-green-200 bg-green-50' : 'border-gray-200'
      } p-4`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {email.recipient_name || email.name || 'Prospect'}
              </h3>
              {isEdited && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Edited
                </span>
              )}
              {isApproved && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Approved
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {email.recipient_email || email.email}
            </p>
            <div className="bg-gray-50 rounded-md p-3">
              <div className="font-medium text-sm text-gray-900 mb-1">
                📧 {email.subject || 'No Subject'}
              </div>
              <div className="text-sm text-gray-600 max-h-20 overflow-hidden">
                {email.body ? 
                  email.body.replace(/<[^>]*>/g, '').substring(0, 150) + '...' :
                  'No content available'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => openEmailEditor(email)}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 text-sm"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          
          {!isApproved && (
            <button
              onClick={() => approveEmail(email.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
          )}
          
          {isApproved && (
            <div className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Ready to Send
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'generating':
        // Skip the generating state and go directly to preview
        return (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Email Editor</h2>
              <p className="text-gray-600 mb-6">
                Ready to create and customize your professional emails.
              </p>
              <button
                onClick={() => setCurrentStep('preview')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Composing
              </button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review Generated Emails</h2>
                <p className="text-gray-600 mt-1">
                  Preview, edit, and approve emails before sending. Your changes will be learned for future emails.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {campaignProgress.approved}/{campaignProgress.total}
                </div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${campaignProgress.total > 0 ? (campaignProgress.approved / campaignProgress.total) * 100 : 0}%` 
                }}
              ></div>
            </div>

            {/* Email Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {generatedEmails.map((email, index) => renderEmailPreview(email, index))}
            </div>

            {generatedEmails.length === 0 && (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Emails Generated</h3>
                <p className="text-gray-500 mt-1">There was an issue generating emails. Please try again.</p>
                <button
                  onClick={startEmailGeneration}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry Generation
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {campaignProgress.approved > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={startCampaignSending}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Start Sending Campaign ({campaignProgress.approved} emails)
                </button>
              </div>
            )}
          </div>
        );

      case 'sending':
        return (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <PlayIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sending Campaign</h2>
            <p className="text-gray-600 mb-4">
              Your approved emails are being sent with learned personalization...
            </p>
            <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-green-800 text-sm">
                📧 Sending {campaignProgress.approved} personalized emails with your edits applied
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Started Successfully!</h2>
            <p className="text-gray-600 mb-6">
              All approved emails have been sent with your personalized edits. The AI has learned from your changes for future campaigns.
            </p>
            
            {userChanges.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Learning Applied</h3>
                <p className="text-sm text-blue-800">
                  🧠 {userChanges.length} sets of changes have been learned and will improve future email generation
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{campaignProgress.approved}</div>
                  <div className="text-sm text-gray-500">Emails Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userChanges.length}</div>
                  <div className="text-sm text-gray-500">Edits Made</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((campaignProgress.approved / campaignProgress.total) * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Approval Rate</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </div>

      {/* Professional Email Editor Modal */}
      {showEditor && selectedEmailForEdit && (
        <ProfessionalEmailEditor
          emailData={selectedEmailForEdit}
          campaignId={campaignId}
          onSave={handleEmailSave}
          onSend={handleEmailSend}
          onClose={() => {
            setShowEditor(false);
            setSelectedEmailForEdit(null);
          }}
        />
      )}
    </div>
  );
}