import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Play,
  Loader,
  Eye,
  EyeOff
} from 'lucide-react';

const AgentSetupWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1); // 直接从SMTP配置开始
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState({
    targetWebsite: '',
    campaignGoal: '',
    businessType: 'auto', // 'tob', 'toc', 'auto'
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      senderName: ''
    }
  });

  // 从localStorage获取主页传来的数据
  useEffect(() => {
    const savedData = localStorage.getItem('agentConfigData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setConfig(prev => ({
        ...prev,
        targetWebsite: data.targetWebsite,
        campaignGoal: data.campaignGoal,
        businessType: data.businessType
      }));
    }
  }, []);

  const [testResults, setTestResults] = useState({
    websiteAnalysis: null,
    smtpTest: null
  });

  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep === 1) {
      await testSMTP(); // 第1步直接是SMTP测试
    } else if (currentStep === 2) {
      await completeSetup(); // 第2步完成设置
    }
  };

  const testSMTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: config.smtpConfig })
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, smtpTest: result }));
      
      if (result.success) {
        setCurrentStep(2); // 跳转到第2步（完成设置）
        
        // Start website analysis in background after SMTP test succeeds
        startWebsiteAnalysis();
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        smtpTest: { success: false, error: error.message } 
      }));
    }
    setIsLoading(false);
  };

  const startWebsiteAnalysis = async () => {
    if (!config.targetWebsite) return;
    
    setAnalysisLoading(true);
    console.log('🔍 Starting website analysis for:', config.targetWebsite);
    
    try {
      const response = await fetch('/api/langgraph-agent/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetWebsite: config.targetWebsite,
          campaignGoal: config.campaignGoal,
          businessType: config.businessType
        })
      });
      
      const result = await response.json();
      console.log('✅ Website analysis completed:', result);
      
      setTestResults(prev => ({ 
        ...prev, 
        websiteAnalysis: result 
      }));
    } catch (error) {
      console.error('❌ Website analysis failed:', error);
      setTestResults(prev => ({ 
        ...prev, 
        websiteAnalysis: { success: false, error: error.message } 
      }));
    }
    
    setAnalysisLoading(false);
  };

  const completeSetup = async () => {
    setIsLoading(true);
    
    try {
      // Save configuration and proceed to website analysis step
      const response = await fetch('/api/agent/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API call failed: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Configuration saved, navigating to website analysis');
      
      // Navigate to website analysis review instead of starting agent
      onComplete({ ...config, nextStep: 'website-analysis' });
    } catch (error) {
      console.error('❌ Setup completion failed:', error);
      alert(`Setup failed: ${error.message}. Please try again.`);
    }
    
    setIsLoading(false);
  };

  // 自定义图标组件
  const MailIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 6 10-6"/>
    </svg>
  );

  const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2].map((step, index) => (
        <React.Fragment key={step}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            currentStep >= step ? 'bg-[#FFD700] text-white' : 'bg-gray-800 text-gray-400'
          } border-2 ${currentStep >= step ? 'border-[#FFD700]' : 'border-gray-600'}`}>
            {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
          </div>
          {index < 1 && (
            <div className={`w-20 h-1 ${
              currentStep > step + 1 ? 'bg-[#FFD700]' : 'bg-gray-600'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailIcon />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Configure Email Service</h2>
        <p className="text-white/80">Set up your SMTP email configuration to start automated marketing</p>
      </div>

      {/* Display configuration info from home page */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Configuration Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/60">Target Website:</span>
            <p className="text-white font-medium">{config.targetWebsite}</p>
          </div>
          <div>
            <span className="text-white/60">Campaign Goal:</span>
            <p className="text-white font-medium">{config.campaignGoal}</p>
          </div>
          <div>
            <span className="text-white/60">Business Type:</span>
            <p className="text-white font-medium">
              {config.businessType === 'auto' ? 'Auto-detect' : 
               config.businessType === 'tob' ? 'B2B Business' : 'B2C Consumer'}
            </p>
          </div>
        </div>
      </div>

      {/* SMTP Configuration Form */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">SMTP Email Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              SMTP Server *
            </label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              value={config.smtpConfig.host}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                smtpConfig: { ...prev.smtpConfig, host: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Port *
            </label>
            <input
              type="number"
              placeholder="587"
              value={config.smtpConfig.port}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                smtpConfig: { ...prev.smtpConfig, port: parseInt(e.target.value) }
              }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Email Account *
            </label>
            <input
              type="email"
              placeholder="your-email@gmail.com"
              value={config.smtpConfig.username}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                smtpConfig: { ...prev.smtpConfig, username: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Password/App Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="App specific password"
                value={config.smtpConfig.password}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  smtpConfig: { ...prev.smtpConfig, password: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-white mb-3">
              Sender Name *
            </label>
            <input
              type="text"
              placeholder="Your company name or personal name"
              value={config.smtpConfig.senderName}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                smtpConfig: { ...prev.smtpConfig, senderName: e.target.value }
              }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlayIcon />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Ready to Launch AI Agent</h2>
        <p className="text-white/80">All configurations completed, ready to launch your intelligent email marketing agent</p>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Configuration Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div>
              <span className="text-white/60">Target Website:</span>
              <p className="text-white font-medium">{config.targetWebsite}</p>
            </div>
            <div>
              <span className="text-white/60">Campaign Goal:</span>
              <p className="text-white font-medium">{config.campaignGoal}</p>
            </div>
            <div>
              <span className="text-white/60">Business Type:</span>
              <p className="text-white font-medium">
                {config.businessType === 'auto' ? 'Auto-detect' : 
                 config.businessType === 'tob' ? 'B2B Business' : 'B2C Consumer'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-white/60">SMTP Server:</span>
              <p className="text-white font-medium">{config.smtpConfig.host}:{config.smtpConfig.port}</p>
            </div>
            <div>
              <span className="text-white/60">Sender Email:</span>
              <p className="text-white font-medium">{config.smtpConfig.username}</p>
            </div>
            <div>
              <span className="text-white/60">Sender Name:</span>
              <p className="text-white font-medium">{config.smtpConfig.senderName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agent Features */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">AI Agent Will Provide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Automatically analyze prospects</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Personalized email generation</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Real-time email monitoring</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Intelligent auto-reply</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Continuous learning optimization</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Performance analysis reports</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>Adaptive search strategies</span>
            </div>
            <div className="flex items-center text-white/90">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full mr-3"></div>
              <span>LangGraph workflows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    if (currentStep === 1) {
      // 第1步：检查SMTP配置是否完整
      return config.smtpConfig.host && config.smtpConfig.username && 
             config.smtpConfig.password && config.smtpConfig.senderName;
    } else if (currentStep === 2) {
      // 第2步：等待网站分析完成
      return testResults.websiteAnalysis && !analysisLoading;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Email Marketing Agent Setup
          </h1>
          <p className="text-xl text-white/80">
            Simple steps to launch your intelligent email marketing system
          </p>
        </div>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}

        <div className="flex justify-center mt-12">
          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="bg-[#FFD700] hover:bg-[#FFC107] disabled:bg-gray-700 text-black font-semibold py-4 px-8 rounded-lg flex items-center space-x-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : currentStep === 2 ? (
              <>
                {analysisLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing Website...</span>
                  </>
                ) : testResults.websiteAnalysis ? (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    <span>Next: Website Analysis</span>
                  </>
                ) : (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Preparing Analysis...</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span>Test and Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSetupWizard;