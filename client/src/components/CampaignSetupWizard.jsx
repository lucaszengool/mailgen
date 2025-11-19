import React, { useState } from 'react';
import WebsiteAnalysisStep from './WebsiteAnalysisStep';
import ProspectsFoundStep from './ProspectsFoundStep';
import EnhancedSMTPSetup from './EnhancedSMTPSetup';
import { CheckCircle, Sparkles } from 'lucide-react';

const CampaignSetupWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(() => {
    // Load initial data from localStorage if available
    const savedData = localStorage.getItem('agentSetupData');
    return savedData ? JSON.parse(savedData) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      id: 'analysis',
      title: 'Website Analysis',
      component: WebsiteAnalysisStep
    },
    {
      id: 'prospects',
      title: 'Prospects Found',
      component: ProspectsFoundStep
    },
    {
      id: 'smtp',
      title: 'SMTP Setup',
      component: EnhancedSMTPSetup
    }
  ];

  const handleStepNext = (stepData) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);

    if (currentStep === steps.length - 1) {
      // Last step - complete the setup
      handleComplete(updatedFormData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async (finalData) => {
    setIsSubmitting(true);
    
    try {
      // Get initial setup data including targetWebsite
      const initialSetupData = localStorage.getItem('agentSetupData');
      const setupData = initialSetupData ? JSON.parse(initialSetupData) : {};
      
      // Save campaign configuration to backend
      const configResponse = await fetch('/api/agent/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Include website and business type from initial setup
          targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
          businessType: setupData.businessType || 'auto',
          campaignGoal: finalData.campaignGoal,
          goalData: finalData.goalData,
          emailTemplate: finalData.emailTemplate,
          templateData: finalData.templateData,
          audienceType: finalData.audienceType,
          industries: finalData.industries,
          roles: finalData.roles,
          companySize: finalData.companySize,
          location: finalData.location,
          keywords: finalData.keywords,
          smtpConfig: finalData.smtpConfig,
          provider: finalData.provider,
          websiteAnalysis: finalData.websiteAnalysis,  // Include websiteAnalysis (logo, businessName, etc.)
          setupComplete: true,
          createdAt: new Date().toISOString()
        })
      });

      if (!configResponse.ok) {
        throw new Error('Failed to save configuration');
      }

      const configResult = await configResponse.json();
      console.log('✅ Configuration saved:', configResult);

      // Save configuration to localStorage for SimpleWorkflowDashboard
      const configForWorkflow = {
        targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
        businessType: setupData.businessType || 'auto',
        campaignGoal: finalData.campaignGoal,
        goalData: finalData.goalData,
        emailTemplate: finalData.emailTemplate,
        templateData: finalData.templateData,
        audienceType: finalData.audienceType,
        industries: finalData.industries,
        roles: finalData.roles,
        companySize: finalData.companySize,
        location: finalData.location,
        keywords: finalData.keywords,
        smtpConfig: finalData.smtpConfig,
        provider: finalData.provider,
        websiteAnalysis: finalData.websiteAnalysis,  // Include websiteAnalysis
        setupComplete: true
      };
      localStorage.setItem('agentConfig', JSON.stringify(configForWorkflow));
      console.log('✅ Configuration saved to localStorage for workflow:', configForWorkflow);

      // Save website analysis to history and config
      if (finalData.websiteAnalysis || setupData.websiteAnalysis) {
        const websiteAnalysisData = finalData.websiteAnalysis || setupData.websiteAnalysis || {};

        // Save to websiteAnalysisConfig for Settings page
        const websiteAnalysisConfig = {
          targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
          businessName: websiteAnalysisData.businessName || setupData.businessName,
          businessLogo: websiteAnalysisData.businessLogo,
          productServiceType: websiteAnalysisData.productServiceType || setupData.businessType,
          businessIntro: websiteAnalysisData.businessIntro || setupData.businessIntro,
          benchmarkBrands: websiteAnalysisData.benchmarkBrands || setupData.benchmarkBrands || [],
          sellingPoints: websiteAnalysisData.sellingPoints || setupData.sellingPoints || [],
          targetAudiences: websiteAnalysisData.targetAudiences || setupData.targetAudiences || []
        };
        localStorage.setItem('websiteAnalysisConfig', JSON.stringify(websiteAnalysisConfig));

        // Save to history
        const historyEntry = {
          ...websiteAnalysisConfig,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          analyzedAt: new Date().toISOString()
        };

        const existingHistory = JSON.parse(localStorage.getItem('websiteAnalysisHistory') || '[]');
        const updatedHistory = [historyEntry, ...existingHistory];
        localStorage.setItem('websiteAnalysisHistory', JSON.stringify(updatedHistory));
        console.log('✅ Website analysis saved to history:', historyEntry);
      }

      // 🔥 FIX: Generate campaign ID to ensure proper email isolation
      const campaignId = `campaign_${Date.now()}`;
      const campaignName = `Campaign - ${setupData.targetWebsite || finalData.targetWebsite}`;

      // Store campaign ID for later reference
      localStorage.setItem('currentCampaignId', campaignId);

      // Now start the agent with the complete configuration
      console.log('🚀 Starting AI agent workflow...');
      console.log('📁 Campaign ID:', campaignId);
      const startResponse = await fetch('/api/workflow/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // 🔥 FIX: Include campaign ID for proper email isolation
          campaignId: campaignId,
          campaignName: campaignName,
          // Include the SMTP configuration and all setup data
          targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
          businessType: setupData.businessType || 'auto',
          campaignGoal: finalData.campaignGoal,
          smtpConfig: finalData.smtpConfig,
          emailTemplate: finalData.emailTemplate,
          templateData: finalData.templateData,
          websiteAnalysis: finalData.websiteAnalysis,  // CRITICAL: Include websiteAnalysis for Railway
          controls: {
            autoReply: true,
            manualApproval: false,
            pauseOnError: true,
            maxEmailsPerHour: 10,
            workingHours: { start: 9, end: 18 }
          }
        })
      });

      if (!startResponse.ok) {
        console.error('Failed to start agent, but configuration was saved');
      } else {
        const startResult = await startResponse.json();
        console.log('✅ Agent started successfully:', startResult);
      }
      
      // Call the completion callback with the saved configuration
      onComplete({
        ...finalData,
        targetWebsite: setupData.targetWebsite,
        businessType: setupData.businessType,
        nextStep: 'dashboard'
      });

    } catch (error) {
      console.error('Error saving campaign configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-green-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your campaign...</h2>
          <p className="text-gray-600">
            We're configuring your AI email marketing system based on your preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CurrentStepComponent
      onNext={handleStepNext}
      onBack={currentStep > 0 ? handleStepBack : null}
      targetWebsite={formData.targetWebsite}
      initialData={formData}
      currentStep={currentStep}
      totalSteps={steps.length}
    />
  );
};

export default CampaignSetupWizard;