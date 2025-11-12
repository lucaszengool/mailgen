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

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-[#00f5a0]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Configure Email Service</h1>
            </div>
            <p className="text-gray-700">
              Set up your SMTP email configuration to start sending automated marketing emails.
              Choose your email provider and follow the guided setup process.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Provider Selection */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5 text-[#00f5a0]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  1. Choose Your Email Provider
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailProviders.map((provider) => {
                  const isSelected = selectedProvider === provider.id;

                  return (
                    <div
                      key={provider.id}
                      className={`
                        relative p-5 rounded-2xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-[#00f5a0] bg-white shadow-lg'
                          : 'border-gray-200 hover:border-[#00f5a0] hover:shadow-md'
                        }
                      `}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="w-5 h-5 text-[#00f5a0]" />
                        </div>
                      )}

                      {/* Provider Info */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{provider.logo}</span>
                          <div>
                            <h3 className="font-semibold text-black">{provider.name}</h3>
                            <p className="text-xs text-black">{provider.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between text-sm mb-3">
                        <div>
                          <span className="text-black">Difficulty:</span>
                          <span className={`ml-1 font-medium ${
                            provider.difficulty === 'Easy' ? 'text-[#00f5a0]' :
                            provider.difficulty === 'Medium' ? 'text-black' : 'text-black'
                          }`}>
                            {provider.difficulty}
                          </span>
                        </div>
                        <div>
                          <span className="text-black">Setup:</span>
                          <span className="ml-1 text-black">{provider.setupTime}</span>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="text-xs text-black mb-3">
                        <span className="font-medium text-black">Requirements:</span>
                        <ul className="mt-1 space-y-1">
                          {provider.requirements.map((req, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* OAuth Login Button (for Gmail, Outlook, Yahoo) */}
                      {['gmail', 'outlook', 'yahoo'].includes(provider.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOAuthLogin(provider.id);
                          }}
                          className="w-full mb-2 py-2 px-4 bg-[#00f5a0] hover:bg-[#00e090] text-black text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Connect with {provider.name}</span>
                        </button>
                      )}

                      {/* Manual Setup Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProviderSelect(provider.id);
                        }}
                        className={`w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                          ['gmail', 'outlook', 'yahoo'].includes(provider.id)
                            ? 'bg-gray-200 hover:bg-gray-300 text-black'
                            : 'bg-[#00f5a0] hover:bg-[#00e090] text-black'
                        }`}
                      >
                        {['gmail', 'outlook', 'yahoo'].includes(provider.id) ? 'Manual Setup' : 'Select Provider'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tutorial Section */}
            {selectedProviderData && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-black">
                    2. Setup Tutorial for {selectedProviderData.name}
                  </h2>
                  <button
                    onClick={startTutorial}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Tutorial</span>
                  </button>
                </div>

                {/* Tutorial Steps Preview */}
                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-black mb-3">Setup Steps:</h3>
                  <div className="space-y-2">
                    {selectedProviderData.tutorial.map((step, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full border-2 border-[#00f5a0] bg-white text-[#00f5a0] flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-black">{step.title}</h4>
                          <p className="text-sm text-black">{step.description}</p>
                        </div>
                        {step.link && (
                          <a
                            href={step.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00f5a0] hover:text-[#00e090]"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SMTP Configuration Form */}
            {selectedProvider && (
              <div>
                <h2 className="text-lg font-semibold text-black mb-4">
                  3. Enter SMTP Configuration
                </h2>

                <div className="bg-white border border-gray-300 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* SMTP Host */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        SMTP Host <span className="text-[#00f5a0]">*</span>
                      </label>
                      <input
                        type="text"
                        value={smtpConfig.host}
                        onChange={(e) => handleConfigChange('host', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    {/* SMTP Port */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Port <span className="text-[#00f5a0]">*</span>
                      </label>
                      <input
                        type="number"
                        value={smtpConfig.port}
                        onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="587"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Email Address <span className="text-[#00f5a0]">*</span>
                      </label>
                      <input
                        type="email"
                        value={smtpConfig.auth.user}
                        onChange={(e) => handleConfigChange('auth.user', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    {/* Sender Name */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Sender Name <span className="text-[#00f5a0]">*</span>
                      </label>
                      <input
                        type="text"
                        value={smtpConfig.senderName}
                        onChange={(e) => handleConfigChange('senderName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Fruit AI"
                      />
                      <p className="mt-1 text-xs text-black">
                        This name will appear as the sender in all outbound emails
                      </p>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Password <span className="text-[#00f5a0]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={smtpConfig.auth.pass}
                          onChange={(e) => handleConfigChange('auth.pass', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="•••••••••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="mt-6">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={smtpConfig.secure}
                        onChange={(e) => handleConfigChange('secure', e.target.checked)}
                        className="w-4 h-4 text-[#00f5a0] bg-gray-100 border-gray-300 rounded focus:ring-[#00f5a0]"
                      />
                      <span className="text-sm text-black">Use secure connection (SSL/TLS)</span>
                    </label>
                  </div>

                  {/* Validation Status */}
                  {isFormValid && (
                    <div className="mt-6 p-4 bg-white border border-[#00f5a0] rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[#00f5a0]" />
                        <span className="text-sm font-medium text-black">
                          Configuration looks good! Ready to test and save.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-300 p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Audience</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!isFormValid}
              className={`
                flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
                ${isFormValid
                  ? 'bg-[#00f5a0] text-black hover:bg-[#00e090] shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              <span>Complete Setup</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && selectedProviderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">
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
              <h4 className="font-medium text-black mb-2">
                {selectedProviderData.tutorial[currentTutorialStep].title}
              </h4>
              <p className="text-black mb-4">
                {selectedProviderData.tutorial[currentTutorialStep].description}
              </p>

              {selectedProviderData.tutorial[currentTutorialStep].link && (
                <a
                  href={selectedProviderData.tutorial[currentTutorialStep].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-colors"
                >
                  <span>{selectedProviderData.tutorial[currentTutorialStep].action}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex justify-between">
              <div className="text-sm text-black">
                Step {currentTutorialStep + 1} of {selectedProviderData.tutorial.length}
              </div>
              <button
                onClick={nextTutorialStep}
                className="flex items-center space-x-2 px-4 py-2 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-colors"
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
                    <div className="w-12 h-12 border-4 border-[#00f5a0] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Testing Connections...</h3>
                  <p className="text-gray-600 mb-4">Verifying SMTP and IMAP connectivity</p>
                  <div className="space-y-2 text-left bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-[#00f5a0] rounded-full mr-2 animate-pulse"></div>
                      Testing SMTP send capability...
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-[#00f5a0] rounded-full mr-2 animate-pulse"></div>
                      Testing IMAP inbox access...
                    </div>
                  </div>
                </div>
              </>
            )}

            {verificationResult?.status === 'success' && (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00f5a0] bg-white flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-[#00f5a0]" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-2">✅ Connection Successful!</h3>
                  <p className="text-black mb-4">SMTP and IMAP are configured correctly</p>
                  <div className="space-y-2 text-left bg-white border border-[#00f5a0] rounded-lg p-4">
                    <div className="flex items-center text-sm text-black">
                      <CheckCircle className="w-4 h-4 mr-2 text-[#00f5a0]" />
                      SMTP: {verificationResult.smtp?.message || 'Connected'}
                    </div>
                    <div className="flex items-center text-sm text-black">
                      <CheckCircle className="w-4 h-4 mr-2 text-[#00f5a0]" />
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

                  <div className="space-y-2 text-left bg-gray-50 rounded-lg p-4 mb-4">
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
                  <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold text-black mb-2 flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2 text-[#00f5a0]" />
                      Need Help? Get App Password:
                    </h4>
                    <div className="space-y-2">
                      {verificationResult.provider === 'gmail' && (
                        <>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-[#00f5a0] hover:text-[#00e090]"
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
                            className="flex items-center text-sm text-[#00f5a0] hover:text-[#00e090]"
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
                            className="flex items-center text-sm text-[#00f5a0] hover:text-[#00e090]"
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
                      className="flex-1 px-4 py-2 bg-[#00f5a0] hover:bg-[#00e090] text-black font-semibold rounded-lg transition-colors flex items-center justify-center"
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