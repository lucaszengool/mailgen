import React, { useState } from 'react';
import { 
  Mail, Settings, CheckCircle, ChevronRight, ChevronLeft, 
  ExternalLink, Eye, EyeOff, AlertCircle, Shield, Zap,
  HelpCircle, Play, Book, ArrowRight
} from 'lucide-react';

const EnhancedSMTPSetup = ({ onNext, onBack, initialData = {} }) => {
  const [selectedProvider, setSelectedProvider] = useState(initialData.provider || '');
  const [smtpConfig, setSMTPConfig] = useState({
    host: initialData.smtpConfig?.host || '',
    port: initialData.smtpConfig?.port || '',
    secure: initialData.smtpConfig?.secure || false,
    senderName: initialData.smtpConfig?.senderName || '',
    auth: {
      user: initialData.smtpConfig?.auth?.user || '',
      pass: initialData.smtpConfig?.auth?.pass || ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const emailProviders = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Most popular and reliable email service',
      logo: '📧',
      difficulty: 'Easy',
      setupTime: '2-3 minutes',
      defaultConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      requirements: ['Gmail account', 'App-specific password'],
      tutorial: [
        {
          title: 'Enable 2-Factor Authentication',
          description: 'You need 2FA enabled to create app passwords',
          action: 'Go to Gmail Settings',
          link: 'https://myaccount.google.com/security'
        },
        {
          title: 'Generate App Password',
          description: 'Create a unique password for this app',
          action: 'Create App Password',
          link: 'https://myaccount.google.com/apppasswords'
        },
        {
          title: 'Copy Credentials',
          description: 'Use your Gmail email and the generated app password',
          action: 'Complete Setup',
          link: null
        }
      ]
    },
    {
      id: 'outlook',
      name: 'Outlook/Hotmail',
      description: 'Microsoft email service with good deliverability',
      logo: '📨',
      difficulty: 'Easy',
      setupTime: '2-3 minutes',
      defaultConfig: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      },
      requirements: ['Outlook account', 'App password'],
      tutorial: [
        {
          title: 'Enable 2-Factor Authentication',
          description: 'Required for app password generation',
          action: 'Security Settings',
          link: 'https://account.microsoft.com/security'
        },
        {
          title: 'Create App Password',
          description: 'Generate password for mail applications',
          action: 'App Passwords',
          link: 'https://account.microsoft.com/security/app-passwords'
        },
        {
          title: 'Configure Email',
          description: 'Use your Outlook email and app password',
          action: 'Complete Setup',
          link: null
        }
      ]
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      description: 'Reliable service with good spam protection',
      logo: '📩',
      difficulty: 'Easy',
      setupTime: '3-4 minutes',
      defaultConfig: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false
      },
      requirements: ['Yahoo account', 'App password'],
      tutorial: [
        {
          title: 'Account Security',
          description: 'Enable 2-step verification',
          action: 'Security Settings',
          link: 'https://login.yahoo.com/account/security'
        },
        {
          title: 'Generate App Password',
          description: 'Create password for mail app',
          action: 'App Passwords',
          link: 'https://login.yahoo.com/account/security/app-passwords'
        },
        {
          title: 'Setup Complete',
          description: 'Use Yahoo email and generated password',
          action: 'Finish',
          link: null
        }
      ]
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Professional email delivery service',
      logo: '⚡',
      difficulty: 'Medium',
      setupTime: '5-7 minutes',
      defaultConfig: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false
      },
      requirements: ['SendGrid account', 'API key'],
      tutorial: [
        {
          title: 'Create SendGrid Account',
          description: 'Sign up for free SendGrid account',
          action: 'Create Account',
          link: 'https://signup.sendgrid.com'
        },
        {
          title: 'Create API Key',
          description: 'Generate API key for SMTP authentication',
          action: 'API Keys',
          link: 'https://app.sendgrid.com/settings/api_keys'
        },
        {
          title: 'Configure SMTP',
          description: 'Use "apikey" as username and API key as password',
          action: 'Complete Setup',
          link: null
        }
      ]
    },
    {
      id: 'custom',
      name: 'Custom SMTP',
      description: 'Use your own SMTP server or provider',
      logo: '⚙️',
      difficulty: 'Advanced',
      setupTime: '10+ minutes',
      defaultConfig: {
        host: '',
        port: 587,
        secure: false
      },
      requirements: ['SMTP server details', 'Authentication credentials'],
      tutorial: [
        {
          title: 'Gather Server Details',
          description: 'Get SMTP host, port, and security settings',
          action: 'Check Documentation',
          link: null
        },
        {
          title: 'Test Credentials',
          description: 'Verify your username and password work',
          action: 'Verify Access',
          link: null
        },
        {
          title: 'Configure Settings',
          description: 'Enter all details in the form below',
          action: 'Complete Setup',
          link: null
        }
      ]
    }
  ];

  const handleProviderSelect = (providerId) => {
    const provider = emailProviders.find(p => p.id === providerId);
    setSelectedProvider(providerId);
    setSMTPConfig(prev => ({
      ...prev,
      host: provider.defaultConfig.host,
      port: provider.defaultConfig.port,
      secure: provider.defaultConfig.secure
    }));
    setShowTutorial(false);
    setCurrentTutorialStep(0);
  };

  const handleOAuthLogin = async (providerId) => {
    // OAuth endpoints for monitoring email activity
    const oauthUrls = {
      gmail: '/api/auth/gmail',
      outlook: '/api/auth/outlook',
      yahoo: '/api/auth/yahoo'
    };

    if (oauthUrls[providerId]) {
      // Redirect to OAuth consent page
      window.location.href = oauthUrls[providerId];
    }
  };

  const handleConfigChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSMTPConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSMTPConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setCurrentTutorialStep(0);
  };

  const nextTutorialStep = () => {
    const provider = emailProviders.find(p => p.id === selectedProvider);
    if (currentTutorialStep < provider.tutorial.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
    } else {
      setShowTutorial(false);
    }
  };

  // Test SMTP + IMAP Connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    setShowVerificationModal(true);
    setVerificationResult({ status: 'testing' });

    try {
      // Test SMTP connection
      const smtpTestResponse = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          username: smtpConfig.auth.user,
          password: smtpConfig.auth.pass
        })
      });

      const smtpResult = await smtpTestResponse.json();

      // Test IMAP connection (same credentials)
      const imapTestResponse = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testImap: true,
          imapHost: selectedProvider === 'gmail' ? 'imap.gmail.com' :
                    selectedProvider === 'outlook' ? 'outlook.office365.com' :
                    selectedProvider === 'yahoo' ? 'imap.mail.yahoo.com' : 'imap.gmail.com',
          imapPort: 993,
          username: smtpConfig.auth.user,
          password: smtpConfig.auth.pass
        })
      });

      const imapResult = await imapTestResponse.json();

      // Show results
      setVerificationResult({
        status: smtpResult.success && imapResult.success ? 'success' : 'error',
        smtp: smtpResult,
        imap: imapResult,
        provider: selectedProvider
      });

      setIsTestingConnection(false);

      // If successful, proceed after 2 seconds
      if (smtpResult.success && imapResult.success) {
        setTimeout(() => {
          proceedToNextStep();
        }, 2000);
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      setVerificationResult({
        status: 'error',
        smtp: { success: false, message: 'Network error: Could not connect to server' },
        imap: { success: false, message: 'Network error: Could not connect to server' },
        provider: selectedProvider
      });
      setIsTestingConnection(false);
    }
  };

  const proceedToNextStep = () => {
    // Save SMTP configuration to localStorage for ProfessionalEmailEditor
    const smtpConfigForStorage = {
      provider: selectedProvider,
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      password: smtpConfig.auth.pass,
      username: smtpConfig.auth.user, // Add username alias
      fromName: smtpConfig.senderName
    };

    localStorage.setItem('smtpConfig', JSON.stringify(smtpConfigForStorage));
    console.log('✅ SMTP Config saved to localStorage:', smtpConfigForStorage);

    setShowVerificationModal(false);

    onNext({
      provider: selectedProvider,
      smtpConfig: smtpConfig
    });
  };

  const handleNext = () => {
    const isValid = smtpConfig.host && smtpConfig.port &&
                    smtpConfig.auth.user && smtpConfig.auth.pass &&
                    smtpConfig.senderName;
    if (!isValid) return;

    // Test connection before proceeding
    testConnection();
  };

  const isFormValid = smtpConfig.host && smtpConfig.port && 
                      smtpConfig.auth.user && smtpConfig.auth.pass && 
                      smtpConfig.senderName;

  const selectedProviderData = emailProviders.find(p => p.id === selectedProvider);

  // Auto-scroll to SMTP form when provider is selected
  const smtpFormRef = React.useRef(null);

  const scrollToForm = () => {
    if (smtpFormRef.current) {
      smtpFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Enhanced provider select with auto-scroll
  const handleProviderSelectWithScroll = (providerId) => {
    handleProviderSelect(providerId);
    setTimeout(scrollToForm, 100);
  };

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Header - Compact */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
              <Settings className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Configure Email Service</h1>
              <p className="text-xs text-gray-500">Set up SMTP to start sending emails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">

            {/* Provider Selection - Compact */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                  <Mail className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-base font-bold text-gray-900">1. Choose Your Email Provider</h2>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {emailProviders.map((provider) => {
                  const isSelected = selectedProvider === provider.id;

                  return (
                    <div
                      key={provider.id}
                      onClick={() => handleProviderSelectWithScroll(provider.id)}
                      className={`
                        relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'border-[#00f5a0] bg-[#f0fdf9]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4" style={{ color: '#00f5a0' }} />
                        </div>
                      )}

                      {/* Provider Info - Compact */}
                      <div className="text-center">
                        <span className="text-2xl block mb-1">{provider.logo}</span>
                        <h3 className="font-semibold text-black text-sm">{provider.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{provider.setupTime}</p>
                        <span className={`text-xs font-medium ${
                          provider.difficulty === 'Easy' ? 'text-green-600' :
                          provider.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {provider.difficulty}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tutorial Section - Compact Inline */}
            {selectedProviderData && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                      <Book className="w-4 h-4 text-black" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">2. Quick Setup Guide</h2>
                  </div>
                </div>
                {/* Tutorial Steps - Horizontal */}
                <div className="flex items-center space-x-4">
                  {selectedProviderData.tutorial.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2 flex-1">
                      <div className="w-5 h-5 rounded-full text-black flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#00f5a0' }}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{step.title}</h4>
                      </div>
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded text-black hover:opacity-80"
                          style={{ backgroundColor: '#00f5a0' }}
                        >
                          Open →
                        </a>
                      )}
                      {index < selectedProviderData.tutorial.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SMTP Configuration Form - Compact */}
            {selectedProvider && (
              <div ref={smtpFormRef} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                    <Shield className="w-4 h-4 text-black" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">3. Enter SMTP Configuration</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* SMTP Host */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      SMTP Host <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => handleConfigChange('host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0]"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  {/* SMTP Port */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0]"
                      placeholder="587"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.auth.user}
                      onChange={(e) => handleConfigChange('auth.user', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0]"
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  {/* Sender Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sender Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.senderName}
                      onChange={(e) => handleConfigChange('senderName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0]"
                      placeholder="Your Company"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      App Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpConfig.auth.pass}
                        onChange={(e) => handleConfigChange('auth.pass', e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#00f5a0] focus:border-[#00f5a0]"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* SSL/TLS Checkbox */}
                  <div className="flex items-end pb-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpConfig.secure}
                        onChange={(e) => handleConfigChange('secure', e.target.checked)}
                        className="w-4 h-4 text-[#00f5a0] bg-gray-100 border-gray-300 rounded focus:ring-[#00f5a0]"
                      />
                      <span className="text-xs text-gray-600">SSL/TLS</span>
                    </label>
                  </div>
                </div>

                {/* Validation Status */}
                {isFormValid && (
                  <div className="mt-3 p-2 rounded-lg flex items-center space-x-2" style={{ backgroundColor: '#e8fff5' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: '#00f5a0' }} />
                    <span className="text-xs font-medium text-gray-700">Ready to test and save</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Navigation Footer - Compact */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!isFormValid}
            className={`
              px-6 py-2 font-semibold rounded-lg transition-all flex items-center space-x-2 text-sm
              ${isFormValid
                ? 'text-black'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            style={isFormValid ? { backgroundColor: '#00f5a0' } : {}}
          >
            <span>Complete Setup</span>
            <span className={isFormValid ? 'text-black' : 'text-gray-600'}>→</span>
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && selectedProviderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedProviderData.name} Setup - Step {currentTutorialStep + 1}
              </h3>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">
                {selectedProviderData.tutorial[currentTutorialStep].title}
              </h4>
              <p className="text-gray-600 mb-4">
                {selectedProviderData.tutorial[currentTutorialStep].description}
              </p>

              {selectedProviderData.tutorial[currentTutorialStep].link && (
                <a
                  href={selectedProviderData.tutorial[currentTutorialStep].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 text-black font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: '#00f5a0' }}
                >
                  <span>{selectedProviderData.tutorial[currentTutorialStep].action}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex justify-between">
              <div className="text-sm text-gray-600">
                Step {currentTutorialStep + 1} of {selectedProviderData.tutorial.length}
              </div>
              <button
                onClick={nextTutorialStep}
                className="flex items-center space-x-2 px-4 py-2 text-black font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: '#00f5a0' }}
              >
                <span>
                  {currentTutorialStep === selectedProviderData.tutorial.length - 1 ? 'Finish' : 'Next'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
            {verificationResult?.status === 'testing' && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Testing Connections...</h3>
                  <p className="text-gray-600 mb-4">Verifying SMTP and IMAP connectivity</p>
                  <div className="space-y-2 text-left bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#00f5a0' }}></div>
                      Testing SMTP send capability...
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#00f5a0' }}></div>
                      Testing IMAP inbox access...
                    </div>
                  </div>
                </div>
              </>
            )}

            {verificationResult?.status === 'success' && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                    <CheckCircle className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Successful!</h3>
                  <p className="text-gray-600 mb-4">SMTP and IMAP are configured correctly</p>
                  <div className="space-y-2 text-left rounded-lg p-4 border border-gray-200" style={{ backgroundColor: '#00f5a0' }}>
                    <div className="flex items-center text-sm text-black">
                      <CheckCircle className="w-4 h-4 mr-2 text-black" />
                      SMTP: {verificationResult.smtp?.message || 'Connected'}
                    </div>
                    <div className="flex items-center text-sm text-black">
                      <CheckCircle className="w-4 h-4 mr-2 text-black" />
                      IMAP: {verificationResult.imap?.message || 'Connected'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">Proceeding to next step...</p>
                </div>
              </>
            )}

            {verificationResult?.status === 'error' && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">⚠️ Connection Failed</h3>
                  <p className="text-gray-600 mb-4">Please check your credentials and try again</p>

                  <div className="space-y-2 text-left bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    {!verificationResult.smtp?.success && (
                      <div className="flex items-start text-sm text-gray-700">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>SMTP Error:</strong> {verificationResult.smtp?.message || 'Connection failed'}
                        </div>
                      </div>
                    )}
                    {!verificationResult.imap?.success && (
                      <div className="flex items-start text-sm text-gray-700">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>IMAP Error:</strong> {verificationResult.imap?.message || 'Connection failed'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Help Links */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" style={{ color: '#00f5a0' }} />
                      Need Help? Get App Password:
                    </h4>
                    <div className="space-y-2">
                      {verificationResult.provider === 'gmail' && (
                        <>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm hover:opacity-80"
                            style={{ color: '#00f5a0' }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Generate Gmail App Password
                          </a>
                          <p className="text-xs text-gray-600">
                            Note: You must enable 2-Factor Authentication first
                          </p>
                        </>
                      )}
                      {verificationResult.provider === 'outlook' && (
                        <>
                          <a
                            href="https://account.microsoft.com/security/app-passwords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm hover:opacity-80"
                            style={{ color: '#00f5a0' }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Generate Outlook App Password
                          </a>
                          <p className="text-xs text-gray-600">
                            Note: You must enable 2-Factor Authentication first
                          </p>
                        </>
                      )}
                      {verificationResult.provider === 'yahoo' && (
                        <>
                          <a
                            href="https://login.yahoo.com/account/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm hover:opacity-80"
                            style={{ color: '#00f5a0' }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Generate Yahoo App Password
                          </a>
                          <p className="text-xs text-gray-600">
                            Go to Security → Generate app password → Select "Other App"
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={testConnection}
                      className="flex-1 px-4 py-2 text-black font-semibold rounded-lg transition-colors flex items-center justify-center"
                      style={{ backgroundColor: '#00f5a0' }}
                    >
                      <span>Retry</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSMTPSetup;