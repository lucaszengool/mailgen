import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowRight, Sparkles, Users, Mail, BarChart3, Search, Settings } from 'lucide-react';

/**
 * OnboardingTour Component
 * Guided tour with step-by-step instructions
 * UI Style: Light green, grey, white background, black text (matching SimpleWorkflowDashboard)
 */

const OnboardingTour = ({ isOpen, onComplete, startStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 'welcome',
      title: '🎉 Welcome to MailGen!',
      icon: Sparkles,
      description: 'Your AI-powered email marketing automation is ready to launch.',
      content: [
        'Your campaign has been set up successfully',
        'The AI agent will now find prospects for you',
        'All emails will be personalized automatically'
      ],
      action: 'Get Started',
      color: '#22c55e' // Light green
    },
    {
      id: 'ai-agent',
      title: '🤖 AI Agent Workflow',
      icon: Sparkles,
      description: 'Let AI agents handle your entire outreach workflow automatically.',
      content: [
        'AI analyzes your target market and business',
        'Discovers qualified prospects with real email addresses',
        'Generates personalized emails for each prospect',
        'Monitors campaign performance in real-time'
      ],
      action: 'Continue',
      color: '#22c55e'
    },
    {
      id: 'prospect-search',
      title: '🔍 Find Prospects',
      icon: Search,
      description: 'Powerful AI-powered search to find qualified leads.',
      content: [
        'Our AI searches multiple databases for prospects',
        'Verifies email addresses automatically',
        'Finds decision-makers in your target companies',
        'All prospects saved to your database'
      ],
      action: 'Next',
      color: '#22c55e'
    },
    {
      id: 'email-generation',
      title: '✉️ Personalized Emails',
      icon: Mail,
      description: 'AI creates unique, personalized emails for each prospect.',
      content: [
        'Select from 36+ professional email templates',
        'AI personalizes content based on prospect data',
        'Customize greeting, body, and signature',
        'Preview before sending'
      ],
      action: 'Next',
      color: '#22c55e'
    },
    {
      id: 'campaign-launch',
      title: '🚀 Launch Campaign',
      icon: CheckCircle,
      description: 'Your campaign is ready to launch!',
      content: [
        'Agent is searching for prospects now',
        'You\'ll be notified when prospects are found',
        'Select a template to generate emails',
        'Review and send when ready'
      ],
      action: 'Launch Campaign',
      color: '#22c55e',
      isLast: true
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    setCompletedSteps([...completedSteps, currentStepData.id]);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
        {/* Header with colored accent */}
        <div
          className="h-2"
          style={{ backgroundColor: currentStepData.color }}
        />

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${currentStepData.color}20` }}
          >
            <currentStepData.icon
              className="w-8 h-8"
              style={{ color: currentStepData.color }}
            />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-black mb-3">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-6">
            {currentStepData.description}
          </p>

          {/* Content bullets */}
          <div className="space-y-3 mb-8">
            {currentStepData.content.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: currentStepData.color }}
                />
                <span className="text-black">{item}</span>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8'
                    : 'w-2'
                } ${
                  index <= currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg font-semibold text-white flex items-center space-x-2 transition-all hover:scale-105"
              style={{ backgroundColor: currentStepData.color }}
            >
              <span>{currentStepData.action}</span>
              {!currentStepData.isLast && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Step counter */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
