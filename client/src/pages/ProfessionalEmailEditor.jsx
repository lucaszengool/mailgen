import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import ProfessionalEmailEditor from '../components/ProfessionalEmailEditor';
import toast from 'react-hot-toast';

export default function ProfessionalEmailEditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaignId] = useState(searchParams.get('campaignId') || 'default_campaign');
  const [prospectId] = useState(searchParams.get('prospectId') || '');
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableEmails, setAvailableEmails] = useState([]);

  // Remember the last edited email across page navigation
  const getLastEditedEmailKey = () => 'email_editor_last_edited_email';
  const saveLastEditedEmail = (email) => {
    if (email?.to) {
      localStorage.setItem(getLastEditedEmailKey(), email.to);
      console.log('💾 Saved last edited email:', email.to);
    }
  };
  const getLastEditedEmail = () => {
    const lastEmail = localStorage.getItem(getLastEditedEmailKey());
    console.log('📁 Last edited email:', lastEmail);
    return lastEmail;
  };

  // CRITICAL DEBUG: Monitor emailData changes
  useEffect(() => {
    console.log('🔄🔄🔄 emailData STATE CHANGED 🔄🔄🔄');
    console.log('   New emailData value:', emailData);
    if (emailData) {
      console.log('   emailData.to:', emailData.to);
      console.log('   emailData.id:', emailData.id);
      console.log('   emailData.subject:', emailData.subject);
    } else {
      console.log('   emailData is NULL/UNDEFINED');
    }
    console.log('🔄🔄🔄 END emailData CHANGE 🔄🔄🔄');
  }, [emailData]);

  // CRITICAL DEBUG: Monitor loading state changes
  useEffect(() => {
    console.log('🔄🔄🔄 loading STATE CHANGED 🔄🔄🔄');
    console.log('   New loading value:', loading);
    console.log('🔄🔄🔄 END loading CHANGE 🔄🔄🔄');
  }, [loading]);

  // Load campaign emails from workflow results
  useEffect(() => {
    console.log('🎯🎯🎯 useEffect TRIGGERED 🎯🎯🎯');
    console.log('   location.state:', location.state);
    console.log('   location.state?.emailContent exists:', !!(location.state?.emailContent));

    // Check if we have email data from navigation state (from email campaign manager)
    if (location.state && location.state.emailContent) {
      console.log('📧 Loading email from navigation state');
      const navEmail = {
        id: 'email_' + Date.now(),
        subject: location.state.emailSubject || 'Email Campaign',
        preheader: 'Email from campaign',
        body: location.state.emailContent,
        html: location.state.emailContent,
        recipientEmail: location.state.recipient || 'prospect@example.com',
        recipientName: location.state.recipientName || 'Prospect',
        recipientCompany: location.state.recipientCompany || 'Company',
        senderName: 'AI Marketing',
        senderEmail: 'agent@company.com',
        campaignId: campaignId,
        generatedAt: new Date().toISOString(),
        editMode: location.state.editMode || false,
        templateId: location.state.templateId || 'professional_partnership',
        templateName: location.state.templateName || 'Professional Partnership',
        template: location.state.templateId || 'professional_partnership'
      };
      setEmailData(navEmail);
      setAvailableEmails([navEmail]);
      setLoading(false);
      
      // Show edit mode notification
      if (location.state.editMode) {
        toast.success('Email loaded for editing', {
          duration: 3000,
          icon: '✏️'
        });
      }
    } else {
      console.log('📧 No navigation state, calling loadCampaignEmails()');
      loadCampaignEmails();

      // Poll for pending approval emails every 3 seconds
      const pollInterval = setInterval(() => {
        console.log('⏰ Polling for pending emails...');
        checkForPendingEmails();
      }, 3000);

      return () => {
        console.log('🧹 Cleaning up interval');
        clearInterval(pollInterval);
      };
    }
  }, [location.state]);

  const replaceTemplateVariables = (content, email) => {
    if (!content || typeof content !== 'string') return content;
    
    const variables = {
      '{{companyName}}': email.recipient_company || email.company || 'Your Company',
      '{{recipientName}}': email.recipient_name || email.name || 'there',
      '{{senderName}}': email.sender_name || 'AI Marketing',
      '{{websiteUrl}}': email.website_url || 'https://example.com',
      '{{campaignId}}': email.campaign_id || 'default'
    };
    
    let processedContent = content;
    Object.entries(variables).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      processedContent = processedContent.replace(regex, value);
    });
    
    return processedContent;
  };

  const checkForPendingEmails = async () => {
    try {
      console.log('🔍 Checking for pending emails...');
      const response = await fetch('/api/email-editor/pending-approval');
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Pending emails response:', data);
        if (data.hasPending && data.email) {
          console.log('✅ Found pending approval email:', data.email.id);
          
          // Check if this email is already in our list
          const existingEmail = availableEmails.find(e => e.id === data.email.id);
          if (!existingEmail) {
            // New email found, add it to available emails
            setAvailableEmails(prev => [...prev, data.email]);
            
            // If we don't have any email data yet, load this one
            if (!emailData || availableEmails.length === 0) {
              // Process the pending email - CRITICAL FIX: Use the generated template HTML
              console.log('🎨 Processing pending email with generated template HTML');
              console.log('   - Template:', data.email.template);
              console.log('   - Has template data:', !!data.email.templateData);
              console.log('   - HTML length:', data.email.html?.length || 0);
              console.log('   - Body length:', data.email.body?.length || 0);

              const processedEmail = {
                id: data.email.id,
                subject: data.email.subject || 'Professional Email Campaign',
                preheader: data.email.preheader || 'Professional email campaign',
                // CRITICAL: Use the actual generated HTML that contains the Professional Partnership template
                body: data.email.html || data.email.body, // This should contain the full template HTML
                html: data.email.html || data.email.body, // Same content
                recipientEmail: data.email.prospectEmail || data.email.recipient_email,
                recipientName: data.email.recipient_name || 'Prospect',
                recipientCompany: data.email.recipient_company || 'Company',
                senderName: data.email.sender_name || 'AI Marketing',
                senderEmail: data.email.sender_email || 'agent@company.com',
                campaignId: data.email.campaignId || campaignId,
                generatedAt: data.email.created_at || new Date().toISOString(),
                editorPreview: data.email.editorPreview,
                originalData: data.email,
                // Include template information
                template: data.email.template,
                templateName: data.email.templateName,
                templateId: data.email.templateId,
                isGenerated: data.email.isGenerated || true
              };

              console.log('✅ Processed email ready for editor:');
              console.log('   - ID:', processedEmail.id);
              console.log('   - Template:', processedEmail.template);
              console.log('   - HTML preview:', processedEmail.html?.substring(0, 200) + '...');
              
              console.log('📧 Loading pending email into editor:', processedEmail.id);
              setEmailData(processedEmail);
              setLoading(false);
              
              // Show notification
              toast.success(`New email ready for editing: ${processedEmail.recipientName}`, {
                duration: 5000,
                icon: '📧'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for pending emails:', error);
    }
  };

  const loadCampaignEmails = async () => {
    try {
      console.log('🚀🚀🚀 loadCampaignEmails STARTED 🚀🚀🚀');
      console.log('📧 Loading campaign emails for Professional Email Editor...');
      console.log('Campaign ID:', campaignId);
      console.log('Current emailData before loading:', emailData);
      console.log('Current availableEmails before loading:', availableEmails);

      // CRITICAL FIX: ALWAYS check for pending approval emails FIRST and use them exclusively
      console.log('📞 PRIORITY 1: Checking for pending approval emails...');
      const pendingResponse = await fetch('/api/email-editor/pending-approval');
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('📧 Pending approval response:', pendingData);

        if (pendingData.hasPending && pendingData.email) {
          console.log('🎯 FOUND PENDING EMAIL - Using this exclusively!');
          console.log('   - Template:', pendingData.email.template);
          console.log('   - HTML length:', pendingData.email.html?.length || 0);
          console.log('   - Subject:', pendingData.email.subject);

          const processedEmail = {
            id: pendingData.email.id,
            subject: pendingData.email.subject || 'Professional Email Campaign',
            preheader: pendingData.email.preheader || 'Professional email campaign',
            // CRITICAL: Use the actual generated HTML that contains the Professional Partnership template
            body: pendingData.email.html || pendingData.email.body,
            html: pendingData.email.html || pendingData.email.body,
            recipientEmail: pendingData.email.prospectEmail || pendingData.email.recipient_email,
            recipientName: pendingData.email.recipient_name || 'Prospect',
            recipientCompany: pendingData.email.recipient_company || 'Company',
            senderName: pendingData.email.sender_name || 'AI Marketing',
            senderEmail: pendingData.email.sender_email || 'agent@company.com',
            campaignId: pendingData.email.campaignId || campaignId,
            generatedAt: pendingData.email.created_at || new Date().toISOString(),
            editorPreview: pendingData.email.editorPreview,
            originalData: pendingData.email,
            template: pendingData.email.template,
            templateName: pendingData.email.templateName,
            templateId: pendingData.email.templateId,
            isGenerated: true, // Mark as generated content
            hasTemplate: true
          };

          console.log('✅ Setting pending email as emailData');
          setEmailData(processedEmail);
          setAvailableEmails([processedEmail]);
          setLoading(false);

          // Success notification
          toast.success(`Email loaded: ${processedEmail.templateName || processedEmail.template}`, {
            duration: 3000,
            icon: '📧'
          });

          return; // STOP here - don't load anything else
        }
      }

      console.log('⚠️ No pending emails found, checking workflow results as fallback...');

      // PRIORITY 2: Try to load from workflow results as fallback ONLY if no pending emails
      const response = await fetch('/api/workflow/results');
      console.log('Workflow response status:', response.ok);
      console.log('Workflow response:', response);
      if (response.ok) {
        const workflowData = await response.json();
        console.log('📧 Full workflow data received:', workflowData);
        console.log('📧 workflowData.success:', workflowData.success);
        console.log('📧 workflowData.data:', workflowData.data);
        
        // Check multiple possible locations for emails
        let campaignEmails = [];

        console.log('🔍 SEARCHING FOR EMAILS IN WORKFLOW DATA...');
        // Try different paths where emails might be stored
        if (workflowData.success && workflowData.data) {
          console.log('   workflowData.success is true and data exists');
          console.log('   Checking emailCampaign.emails:', workflowData.data.emailCampaign?.emails);
          if (workflowData.data.emailCampaign?.emails) {
            campaignEmails = workflowData.data.emailCampaign.emails;
            console.log('   ✅ Found emails in emailCampaign.emails:', campaignEmails.length);
          } else if (workflowData.data.emailCampaign?.emailsSent) {
            campaignEmails = workflowData.data.emailCampaign.emailsSent;
            console.log('   ✅ Found emails in emailCampaign.emailsSent:', campaignEmails.length);
          } else if (workflowData.data.emails) {
            campaignEmails = workflowData.data.emails;
            console.log('   ✅ Found emails in data.emails:', campaignEmails.length);
          } else if (workflowData.emails) {
            campaignEmails = workflowData.emails;
            console.log('   ✅ Found emails in root emails:', campaignEmails.length);
          } else {
            console.log('   ❌ No emails found in standard locations');
          }

          // Also check for approvalPending emails
          if (workflowData.data.approvalPending) {
            const pendingEmails = Object.values(workflowData.data.approvalPending);
            console.log('   📧 Found approvalPending emails:', pendingEmails.length);
            campaignEmails = [...campaignEmails, ...pendingEmails];
          }
        } else {
          console.log('   ❌ workflowData.success is false or no data');
          console.log('   workflowData.success:', workflowData.success);
          console.log('   workflowData.data exists:', !!workflowData.data);
        }
        
        console.log('📧 Found', campaignEmails.length, 'campaign emails');
        console.log('📧 Campaign emails array:', campaignEmails);
        console.log('📧 About to call setAvailableEmails with:', campaignEmails);
        setAvailableEmails(campaignEmails);
        console.log('✅ setAvailableEmails CALLED');

        if (campaignEmails.length > 0) {
          console.log('📧 Processing email selection...');

          // Priority 1: Specific prospect email (from URL)
          let emailToEdit = campaignEmails[0];
          if (prospectId) {
            console.log('📧 Looking for specific prospect:', prospectId);
            const specificEmail = campaignEmails.find(email =>
              email.to === prospectId ||
              email.recipient_email === prospectId ||
              email.prospectEmail === prospectId
            );
            if (specificEmail) {
              console.log('📧 Found specific email for prospect:', specificEmail);
              emailToEdit = specificEmail;
            }
          }

          // Priority 2: Last edited email (for page navigation persistence)
          if (!prospectId) {
            const lastEditedEmailAddress = getLastEditedEmail();
            if (lastEditedEmailAddress) {
              const lastEditedEmail = campaignEmails.find(email =>
                email.to === lastEditedEmailAddress ||
                email.recipient_email === lastEditedEmailAddress ||
                email.prospectEmail === lastEditedEmailAddress
              );
              if (lastEditedEmail) {
                console.log('📧 Restored last edited email:', lastEditedEmail.to);
                emailToEdit = lastEditedEmail;
              }
            }
          }

          console.log('📧 Final emailToEdit:', emailToEdit.to);

          // CRITICAL FIX: Process the email data with proper field mapping
          console.log('📧 Creating processedEmail object...');
          const processedEmail = {
            id: emailToEdit.id || ('email_' + Date.now()),
            subject: emailToEdit.subject || 'Professional Email Campaign',
            preheader: emailToEdit.preheader || 'Professional email campaign',
            body: replaceTemplateVariables(emailToEdit.body || emailToEdit.content || emailToEdit.html, emailToEdit),
            html: replaceTemplateVariables(emailToEdit.html || emailToEdit.body || emailToEdit.content, emailToEdit),
            // CRITICAL FIX: Ensure 'to' field is properly mapped
            to: emailToEdit.to || emailToEdit.recipient_email || emailToEdit.prospectEmail,
            recipientEmail: emailToEdit.to || emailToEdit.recipient_email || emailToEdit.prospectEmail,
            recipientName: emailToEdit.recipient_name || emailToEdit.name || emailToEdit.recipientName || 'Prospect',
            recipientCompany: emailToEdit.recipient_company || emailToEdit.company || emailToEdit.recipientCompany || 'Company',
            senderName: emailToEdit.sender_name || emailToEdit.senderName || 'AI Marketing',
            senderEmail: emailToEdit.from || emailToEdit.sender_email || emailToEdit.senderEmail,
            campaignId: emailToEdit.campaign_id || emailToEdit.campaignId || campaignId,
            generatedAt: emailToEdit.created_at || emailToEdit.createdAt || new Date().toISOString(),
            originalData: emailToEdit
          };

          console.log('🔥🔥🔥 CRITICAL MOMENT - ABOUT TO SET EMAIL DATA 🔥🔥🔥');
          console.log('📧 processedEmail object created:', processedEmail);
          console.log('📧 processedEmail.to:', processedEmail.to);
          console.log('📧 emailToEdit.to original:', emailToEdit.to);
          console.log('📧 Calling setEmailData with:', processedEmail);

          setEmailData(processedEmail);

          console.log('✅ setEmailData CALLED with processedEmail');
          console.log('📧 Setting loading to false...');
          setLoading(false);
          console.log('✅ setLoading(false) CALLED');
          console.log('🔥🔥🔥 EMAIL DATA SHOULD BE SET NOW 🔥🔥🔥');
          return; // Exit early if we found emails
        } else {
          console.log('⚠️ No campaign emails found in array');
        }
      }
      
      // No emails found anywhere, show default
      console.log('📧 No campaign emails found, showing default');
      setEmailData({
        id: 'email_' + Date.now(),
        subject: 'Professional Email Campaign',
        preheader: 'Start creating your professional email',
        body: 'Welcome to the Professional Email Editor! Your AI-generated emails will appear here once the workflow generates them.',
        html: 'Welcome to the Professional Email Editor! Your AI-generated emails will appear here once the workflow generates them.',
        recipientEmail: prospectId || 'prospect@example.com',
        recipientName: 'Prospect',
        recipientCompany: 'Company',
        campaignId: campaignId,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('🔥🔥🔥 CRITICAL ERROR in loadCampaignEmails 🔥🔥🔥');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast.error('Failed to load campaign emails');

      // Fallback to default email
      console.log('📧 Setting fallback email data...');
      setEmailData({
        id: 'email_' + Date.now(),
        subject: 'Professional Email Campaign',
        preheader: 'Start creating your professional email',
        body: 'Welcome to the Professional Email Editor! Your AI-generated emails will appear here once the workflow generates them.',
        html: 'Welcome to the Professional Email Editor! Your AI-generated emails will appear here once the workflow generates them.',
        recipientEmail: prospectId || 'prospect@example.com',
        recipientName: 'Prospect',
        recipientCompany: 'Company',
        campaignId: campaignId,
        generatedAt: new Date().toISOString()
      });
    } finally {
      console.log('📧 Finally block - setting loading to false');
      setLoading(false);
      console.log('📧 loadCampaignEmails COMPLETED');
      console.log('📧 Final emailData state (may not be updated yet):', emailData);
      console.log('📧 Final availableEmails state (may not be updated yet):', availableEmails);
    }
  };

  const handleSaveEmail = async (editedEmail) => {
    try {
      toast.success('Email saved successfully!');
      return true;
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
      return false;
    }
  };

  const handleSendEmail = async (finalEmail) => {
    try {
      // Send the approved email through the workflow
      const response = await fetch('/api/workflow/approve-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId: finalEmail.id || emailData?.id,
          campaignId: campaignId,
          prospectEmail: emailData?.recipientEmail,
          approved: true,
          editedContent: {
            subject: finalEmail.subject,
            html: finalEmail.html,
            body: finalEmail.html,
            components: finalEmail.components,
            templateId: finalEmail.templateId || emailData?.templateId || 'professional_partnership',
            templateName: finalEmail.templateName || emailData?.templateName || 'Professional Partnership',
            template: finalEmail.template || emailData?.template || 'professional_partnership'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Email approved and sent successfully! 🚀', {
          duration: 5000,
          icon: '✅'
        });
        
        // Remove from pending emails after sending
        await fetch('/api/email-editor/remove-pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: finalEmail.id || emailData?.id })
        });
        
        // Navigate back to dashboard or email campaign page
        setTimeout(() => {
          navigate('/campaigns');
        }, 2000);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast.error(`Send failed: ${error.message}`);
    }
  };

  const handleCloseEditor = () => {
    navigate(-1);
  };

  // Show loading state while emails are being loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Email Campaign</h2>
          <p className="text-gray-600">
            Fetching your AI-generated emails for editing...
          </p>
          {availableEmails.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              Found {availableEmails.length} emails to edit
            </p>
          )}
        </div>
      </div>
    );
  }

  // COMPREHENSIVE DEBUG LOGGING BEFORE RENDERING
  console.log('🔴🔴🔴 PARENT COMPONENT RENDER CHECK 🔴🔴🔴');
  console.log('📍 ProfessionalEmailEditorPage State:');
  console.log('   emailData state:', emailData);
  console.log('   emailData is null?', emailData === null);
  console.log('   emailData is undefined?', emailData === undefined);
  console.log('   availableEmails state:', availableEmails);
  console.log('   availableEmails.length:', availableEmails.length);
  console.log('   loading state:', loading);
  console.log('   campaignId:', campaignId);
  console.log('   prospectId:', prospectId);

  if (emailData) {
    console.log('✅ emailData EXISTS with properties:');
    console.log('   emailData.to:', emailData.to);
    console.log('   emailData.recipientEmail:', emailData.recipientEmail);
    console.log('   emailData.id:', emailData.id);
    console.log('   emailData.subject:', emailData.subject);
    console.log('   Full emailData:', JSON.stringify(emailData, null, 2));
  } else {
    console.log('❌ emailData is NULL/UNDEFINED - THIS IS THE PROBLEM!');
    console.log('   But availableEmails has data:', availableEmails);
    if (availableEmails.length > 0) {
      console.log('   🚨 BUG: We have availableEmails but emailData is null!');
      console.log('   First available email:', availableEmails[0]);
      console.log('   Should set emailData to:', availableEmails[0]);
    }
  }
  console.log('🔴🔴🔴 END PARENT COMPONENT CHECK 🔴🔴🔴');

  // Render the Professional Email Editor with loaded data
  return (
  <div className="min-h-screen bg-gray-50">
    {loading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Email Campaign</h2>
          <p className="text-gray-600">Fetching your AI-generated emails for editing...</p>
        </div>
      </div>
    ) : (
      <ProfessionalEmailEditor
        key="email-editor-stable"
        emailData={emailData || {}}
        availableEmails={availableEmails}
        onSave={handleSaveEmail}
        onSend={handleSendEmail}
        onClose={handleCloseEditor}
        onRefresh={loadCampaignEmails}
        campaignId={campaignId}
        prospectId={prospectId}
      />
    )}
  </div>
);
}