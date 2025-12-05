import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, FileText, Sparkles, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import WebsiteAnalysisStep from './WebsiteAnalysisStep';
import ProspectsFoundStep from './ProspectsFoundStep';
import EnhancedSMTPSetup from './EnhancedSMTPSetup';
import { apiPost } from '../utils/apiClient';

const CampaignOnboardingWizard = ({ campaign, onComplete, onCancel }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    campaignId: campaign.id,
    campaignName: campaign.name
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      id: 'website-input',
      title: 'Website & Business Info',
      icon: Globe
    },
    {
      id: 'analysis',
      title: 'Website Analysis',
      icon: Sparkles
    },
    {
      id: 'prospects',
      title: 'Review Prospects',
      icon: FileText
    },
    {
      id: 'smtp',
      title: 'Email Configuration',
      icon: CheckCircle
    }
  ];

  // Step 0: Website Input
  const WebsiteInputStep = ({ onNext, initialData }) => {
    const [inputType, setInputType] = useState('url'); // 'url' or 'manual'
    const [websiteUrl, setWebsiteUrl] = useState(initialData?.targetWebsite || '');
    const [businessDescription, setBusinessDescription] = useState(initialData?.businessDescription || '');
    const [keywords, setKeywords] = useState(initialData?.keywords || '');

    const handleNext = () => {
      if (inputType === 'url' && !websiteUrl.trim()) {
        toast.error('Please enter a website URL');
        return;
      }

      if (inputType === 'manual' && !businessDescription.trim()) {
        toast.error('Please provide a business description');
        return;
      }

      const stepData = {
        inputType,
        targetWebsite: websiteUrl.trim(),
        businessDescription: businessDescription.trim(),
        keywords: keywords.trim(),
        businessType: 'auto' // Will be analyzed
      };

      // Save to localStorage for the next step
      localStorage.setItem('agentSetupData', JSON.stringify(stepData));

      onNext(stepData);
    };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f0a0' }}>
              <Globe className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Set up "{campaign.name}"
            </h1>
            <p className="text-gray-600">
              Let's start by understanding your business
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Input Type Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setInputType('url')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all bg-white ${
                  inputType === 'url'
                    ? 'border-green-500 ring-2 ring-green-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className="w-6 h-6 mx-auto mb-2" style={{ color: inputType === 'url' ? '#00f0a0' : '#6b7280' }} />
                <div className="font-semibold text-gray-900">Website URL</div>
                <div className="text-sm text-gray-600">Analyze your website</div>
              </button>

              <button
                onClick={() => setInputType('manual')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all bg-white ${
                  inputType === 'manual'
                    ? 'border-green-500 ring-2 ring-green-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: inputType === 'manual' ? '#00f0a0' : '#6b7280' }} />
                <div className="font-semibold text-gray-900">Manual Input</div>
                <div className="text-sm text-gray-600">Describe your business</div>
              </button>
            </div>

            {/* URL Input */}
            {inputType === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}

            {/* Manual Input */}
            {inputType === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Describe your business, products/services, and target market..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Business Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., SaaS, B2B, AI, Marketing Automation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#00f0a0', color: '#000' }}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === 0 ? 'w-8' : 'w-2'
                } ${idx === 0 ? 'bg-black' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

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
      console.log('💾 Saving campaign-specific configuration:', finalData);

      // Get initial setup data including targetWebsite
      const initialSetupData = localStorage.getItem('agentSetupData');
      const setupData = initialSetupData ? JSON.parse(initialSetupData) : {};

      // Prepare campaign configuration
      const campaignConfig = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
        businessType: setupData.businessType || 'auto',
        businessDescription: setupData.businessDescription,
        keywords: setupData.keywords,
        campaignGoal: finalData.campaignGoal,
        goalData: finalData.goalData,
        emailTemplate: finalData.emailTemplate,
        templateData: finalData.templateData,
        audienceType: finalData.audienceType,
        industries: finalData.industries,
        roles: finalData.roles,
        companySize: finalData.companySize,
        location: finalData.location,
        smtpConfig: finalData.smtpConfig,
        provider: finalData.provider,
        websiteAnalysis: finalData.websiteAnalysis,
        setupComplete: true,
        createdAt: new Date().toISOString()
      };

      // Save to backend
      const configResponse = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...campaignConfig,
          status: 'active'
        })
      });

      if (!configResponse.ok) {
        throw new Error('Failed to save campaign configuration');
      }

      const configResult = await configResponse.json();
      console.log('✅ Campaign configuration saved:', configResult);

      // Save to localStorage for this specific campaign
      const campaignStorageKey = `campaign_${campaign.id}_config`;
      localStorage.setItem(campaignStorageKey, JSON.stringify(campaignConfig));
      console.log('✅ Campaign config saved to localStorage:', campaignStorageKey);

      // Update the current campaign in the campaigns list
      const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
      const updatedCampaigns = campaigns.map(c =>
        c.id === campaign.id
          ? { ...c, setupComplete: true, config: campaignConfig }
          : c
      );
      localStorage.setItem('campaigns', JSON.stringify(updatedCampaigns));

      // Save website analysis to history
      if (finalData.websiteAnalysis || setupData.websiteAnalysis) {
        const websiteAnalysisData = finalData.websiteAnalysis || setupData.websiteAnalysis || {};
        const historyEntry = {
          campaignId: campaign.id,
          campaignName: campaign.name,
          targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
          businessName: websiteAnalysisData.businessName,
          businessLogo: websiteAnalysisData.businessLogo,
          productServiceType: websiteAnalysisData.productServiceType,
          businessIntro: websiteAnalysisData.businessIntro,
          benchmarkBrands: websiteAnalysisData.benchmarkBrands || [],
          sellingPoints: websiteAnalysisData.sellingPoints || [],
          targetAudiences: websiteAnalysisData.targetAudiences || [],
          id: Date.now(),
          createdAt: new Date().toISOString()
        };

        const existingHistory = JSON.parse(localStorage.getItem('websiteAnalysisHistory') || '[]');
        const updatedHistory = [historyEntry, ...existingHistory];
        localStorage.setItem('websiteAnalysisHistory', JSON.stringify(updatedHistory));
        console.log('✅ Website analysis saved to history for campaign');
      }

      // 🚀 CRITICAL: Start the AI agent workflow after campaign setup
      console.log('🚀 Starting AI agent workflow for campaign:', campaign.name);
      console.log('👤 User ID from Clerk:', user?.id);
      try {
        // 🔥 FIX: Use apiPost instead of raw fetch to include auth headers
        // 🔥 ALSO include userId in body as fallback
        const startResult = await apiPost('/api/workflow/start', {
          // Include campaign ID for tracking
          campaignId: campaign.id,
          campaignName: campaign.name,
          // 🔥 FIX: Include userId as fallback in case headers don't work
          userId: user?.id,
          // Include all configuration data
          targetWebsite: setupData.targetWebsite || finalData.targetWebsite,
          businessType: setupData.businessType || 'auto',
          businessDescription: setupData.businessDescription,
          keywords: setupData.keywords,
          campaignGoal: finalData.campaignGoal,
          smtpConfig: finalData.smtpConfig,
          emailTemplate: finalData.emailTemplate,
          templateData: finalData.templateData,
          websiteAnalysis: finalData.websiteAnalysis || setupData.websiteAnalysis,
          audienceType: finalData.audienceType,
          industries: finalData.industries,
          roles: finalData.roles,
          companySize: finalData.companySize,
          location: finalData.location,
          controls: {
            autoReply: true,
            manualApproval: false,
            pauseOnError: true,
            maxEmailsPerHour: 10,
            workingHours: { start: 9, end: 18 }
          }
        });

        console.log('✅ Agent workflow started successfully:', startResult);
        toast.success('Campaign setup complete! AI agent is now finding prospects...');
      } catch (error) {
        console.error('❌ Error starting workflow:', error);
        toast.error('Configuration saved, but workflow failed to start. You can start it manually from the dashboard.');
      }

      // Call the completion callback with flag to indicate workflow was just started
      onComplete({
        ...campaignConfig,
        campaign: { ...campaign, setupComplete: true },
        workflowJustStarted: true  // 🚀 Flag to trigger popup on dashboard load
      });

    } catch (error) {
      console.error('Error saving campaign configuration:', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f0a0' }}>
            <Sparkles className="w-8 h-8 text-black animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your campaign...</h2>
          <p className="text-gray-600">
            Configuring "{campaign.name}" with your preferences
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {currentStep === 0 && (
        <WebsiteInputStep
          key="website-input"
          onNext={handleStepNext}
          initialData={formData}
          onCancel={onCancel}
        />
      )}
      {currentStep === 1 && (
        <WebsiteAnalysisStep
          key="analysis"
          onNext={handleStepNext}
          onBack={handleStepBack}
          targetWebsite={formData.targetWebsite}
          initialData={formData}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      )}
      {currentStep === 2 && (
        <ProspectsFoundStep
          key="prospects"
          onNext={handleStepNext}
          onBack={handleStepBack}
          initialData={formData}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      )}
      {currentStep === 3 && (
        <EnhancedSMTPSetup
          key="smtp"
          onNext={handleStepNext}
          onBack={handleStepBack}
          initialData={formData}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      )}
    </AnimatePresence>
  );
};

export default CampaignOnboardingWizard;
