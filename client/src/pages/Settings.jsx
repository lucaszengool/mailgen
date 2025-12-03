import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Server,
  Globe,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  RefreshCw
} from 'lucide-react';

// Alias Info as InformationCircleIcon for compatibility
const InformationCircleIcon = Info;
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '../utils/apiClient';

/**
 * System Settings Page - JobRight.ai inspired
 * White background, green/black color scheme, clean and professional
 */
export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('smtp');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    configName: '',
    smtpServer: '',
    port: '587',
    useTLS: true,
    username: '',
    password: ''
  });

  // Campaign Configuration State
  const [campaignConfig, setCampaignConfig] = useState({
    senderName: '',
    companyName: '',
    companyWebsite: '',
    ctaButtonText: 'Schedule a Meeting',
    ctaLink: ''
  });

  // Website Analysis State
  const [websiteAnalysis, setWebsiteAnalysis] = useState({
    targetWebsite: '',
    businessName: '',
    logo: '',
    productType: '',
    benchmarkBrands: [],
    businessIntro: '',
    sellingPoints: [],
    audiences: [],
    social: {},
    techStack: [],
    contactInfo: {}
  });
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load SMTP settings
      const smtpResponse = await apiGet('/api/settings/smtp');
      if (smtpResponse.success && smtpResponse.data) {
        setSmtpConfig(prev => ({ ...prev, ...smtpResponse.data }));
      }

      // Load campaign settings
      const campaignResponse = await apiGet('/api/settings/campaign');
      if (campaignResponse.success && campaignResponse.data) {
        setCampaignConfig(prev => ({ ...prev, ...campaignResponse.data }));
      }

      // Load website analysis settings - try API first, then localStorage
      const websiteResponse = await apiGet('/api/settings/website-analysis');
      let hasApiData = false;

      if (websiteResponse.success && websiteResponse.data) {
        // Check if API data has meaningful content
        const apiData = websiteResponse.data;
        hasApiData = apiData.businessName || apiData.productType || apiData.businessIntro ||
                     (apiData.sellingPoints && apiData.sellingPoints.length > 0) ||
                     (apiData.audiences && apiData.audiences.length > 0);

        if (hasApiData) {
          setWebsiteAnalysis(prev => ({ ...prev, ...apiData }));
        }
      }

      // If no API data, try loading from localStorage (where FirstCampaignSetup saves)
      if (!hasApiData) {
        // Try multiple localStorage keys where analysis might be stored
        const localSources = [
          'websiteAnalysis',
          'agentSetupData',
          'agentConfig'
        ];

        for (const key of localSources) {
          try {
            const localData = localStorage.getItem(key);
            if (localData) {
              const parsed = JSON.parse(localData);
              // Handle nested websiteAnalysis in agentConfig
              const analysisData = parsed.websiteAnalysis || parsed;

              if (analysisData.businessName || analysisData.productType || analysisData.businessIntro) {
                console.log(`📊 Loaded website analysis from localStorage (${key}):`, analysisData);
                setWebsiteAnalysis(prev => ({
                  ...prev,
                  targetWebsite: analysisData.targetWebsite || analysisData.url || prev.targetWebsite,
                  businessName: analysisData.businessName || analysisData.companyName || prev.businessName,
                  logo: analysisData.logo || prev.logo,
                  productType: analysisData.productType || analysisData.industry || prev.productType,
                  benchmarkBrands: analysisData.benchmarkBrands || prev.benchmarkBrands,
                  businessIntro: analysisData.businessIntro || analysisData.valueProposition || analysisData.businessIntroduction || prev.businessIntro,
                  sellingPoints: analysisData.sellingPoints || analysisData.coreSellingPoints || prev.sellingPoints,
                  audiences: analysisData.audiences || analysisData.targetAudiences || prev.audiences,
                  social: analysisData.social || prev.social,
                  techStack: analysisData.techStack || prev.techStack,
                  contactInfo: analysisData.contactInfo || prev.contactInfo
                }));
                break; // Found data, stop searching
              }
            }
          } catch (e) {
            console.warn(`Failed to parse ${key} from localStorage:`, e);
          }
        }

        // Also try loading from current campaign data
        try {
          const currentCampaignId = localStorage.getItem('currentCampaignId');
          if (currentCampaignId) {
            const campaignData = localStorage.getItem(`campaign_${currentCampaignId}_data`);
            if (campaignData) {
              const parsed = JSON.parse(campaignData);
              const analysisData = parsed.websiteAnalysis || parsed;
              if (analysisData.businessName || analysisData.productType) {
                console.log(`📊 Loaded website analysis from campaign data:`, analysisData);
                setWebsiteAnalysis(prev => ({
                  ...prev,
                  targetWebsite: analysisData.targetWebsite || prev.targetWebsite,
                  businessName: analysisData.businessName || prev.businessName,
                  logo: analysisData.logo || prev.logo,
                  productType: analysisData.productType || prev.productType,
                  benchmarkBrands: analysisData.benchmarkBrands || prev.benchmarkBrands,
                  businessIntro: analysisData.businessIntro || prev.businessIntro,
                  sellingPoints: analysisData.sellingPoints || prev.sellingPoints,
                  audiences: analysisData.audiences || prev.audiences,
                  social: analysisData.social || prev.social,
                  techStack: analysisData.techStack || prev.techStack,
                  contactInfo: analysisData.contactInfo || prev.contactInfo
                }));
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load campaign data:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await apiPost('/api/test-smtp', smtpConfig);

      if (response.success) {
        toast.success('SMTP connection successful!');
      } else {
        toast.error(response.message || 'Connection failed');
      }
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUpdateConfiguration = async () => {
    setLoading(true);
    try {
      // Save SMTP settings
      const smtpResponse = await apiPost('/api/settings/smtp', smtpConfig);

      // Save campaign settings
      const campaignResponse = await apiPost('/api/settings/campaign', campaignConfig);

      // Save website analysis settings
      const websiteResponse = await apiPost('/api/settings/website-analysis', websiteAnalysis);

      if (smtpResponse.success && campaignResponse.success && websiteResponse.success) {
        toast.success('Configuration updated successfully!');
      } else {
        toast.error('Failed to update some settings');
      }
    } catch (error) {
      console.error('Failed to update configuration:', error);
      toast.error('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  // Website Analysis Helper Functions
  const updateWebsiteField = (field, value) => {
    setWebsiteAnalysis({ ...websiteAnalysis, [field]: value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setWebsiteAnalysis({ ...websiteAnalysis, logo: event.target.result });
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload an SVG file');
    }
  };

  const addBenchmarkBrand = () => {
    if (newBrand.trim() && !websiteAnalysis.benchmarkBrands.includes(newBrand.trim())) {
      setWebsiteAnalysis({
        ...websiteAnalysis,
        benchmarkBrands: [...websiteAnalysis.benchmarkBrands, newBrand.trim()]
      });
      setNewBrand('');
    }
  };

  const removeBenchmarkBrand = (brandToRemove) => {
    setWebsiteAnalysis({
      ...websiteAnalysis,
      benchmarkBrands: websiteAnalysis.benchmarkBrands.filter(b => b !== brandToRemove)
    });
  };

  const updateSellingPoint = (index, value) => {
    const updatedPoints = [...websiteAnalysis.sellingPoints];
    updatedPoints[index] = value;
    setWebsiteAnalysis({ ...websiteAnalysis, sellingPoints: updatedPoints });
  };

  const addSellingPoint = () => {
    setWebsiteAnalysis({
      ...websiteAnalysis,
      sellingPoints: [...websiteAnalysis.sellingPoints, '']
    });
  };

  const removeSellingPoint = (index) => {
    setWebsiteAnalysis({
      ...websiteAnalysis,
      sellingPoints: websiteAnalysis.sellingPoints.filter((_, i) => i !== index)
    });
  };

  const updateAudience = (index, field, value) => {
    const updatedAudiences = [...websiteAnalysis.audiences];
    updatedAudiences[index] = { ...updatedAudiences[index], [field]: value };
    setWebsiteAnalysis({ ...websiteAnalysis, audiences: updatedAudiences });
  };

  const addAudience = () => {
    setWebsiteAnalysis({
      ...websiteAnalysis,
      audiences: [...websiteAnalysis.audiences, { title: '', description: '' }]
    });
  };

  const removeAudience = (index) => {
    setWebsiteAnalysis({
      ...websiteAnalysis,
      audiences: websiteAnalysis.audiences.filter((_, i) => i !== index)
    });
  };

  // Save website analysis to backend
  const handleSaveWebsiteAnalysis = async () => {
    setLoading(true);
    try {
      toast.loading('Saving website analysis...', { id: 'save-website' });

      const response = await apiPost('/api/settings/website-analysis', websiteAnalysis);

      if (response.success) {
        // Also save to localStorage for campaign use
        localStorage.setItem('websiteAnalysis', JSON.stringify(websiteAnalysis));

        // Update agentConfig with websiteAnalysis
        const existingConfig = localStorage.getItem('agentConfig');
        const agentConfig = existingConfig ? JSON.parse(existingConfig) : {};
        agentConfig.websiteAnalysis = websiteAnalysis;
        localStorage.setItem('agentConfig', JSON.stringify(agentConfig));

        toast.success('Website analysis saved successfully!', { id: 'save-website' });
      } else {
        toast.error(response.error || 'Failed to save website analysis', { id: 'save-website' });
      }
    } catch (error) {
      console.error('Save website analysis error:', error);
      toast.error('Failed to save website analysis', { id: 'save-website' });
    } finally {
      setLoading(false);
    }
  };

  // Re-analyze website to refresh data
  const handleReanalyzeWebsite = async () => {
    if (!websiteAnalysis.targetWebsite) {
      toast.error('Please enter a website URL');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Analyzing website...', { id: 'analyze' });

      const response = await apiPost('/api/agent/analyze-website', {
        url: websiteAnalysis.targetWebsite
      });

      if (response.success && response.analysis) {
        // Update state with new analysis
        setWebsiteAnalysis({
          ...websiteAnalysis,
          businessName: response.analysis.businessName || websiteAnalysis.businessName,
          logo: response.analysis.logo || websiteAnalysis.logo,
          productType: response.analysis.productType || response.analysis.industry || websiteAnalysis.productType,
          benchmarkBrands: response.analysis.benchmarkBrands || websiteAnalysis.benchmarkBrands,
          businessIntro: response.analysis.businessIntro || response.analysis.valueProposition || websiteAnalysis.businessIntro,
          sellingPoints: response.analysis.sellingPoints || websiteAnalysis.sellingPoints,
          audiences: response.analysis.audiences || websiteAnalysis.audiences,
          social: response.analysis.social || websiteAnalysis.social,
          techStack: response.analysis.techStack || websiteAnalysis.techStack,
          contactInfo: response.analysis.contactInfo || websiteAnalysis.contactInfo
        });

        toast.success('Website analyzed successfully!', { id: 'analyze' });
      } else {
        toast.error(response.error || 'Failed to analyze website', { id: 'analyze' });
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      toast.error('Failed to analyze website', { id: 'analyze' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'smtp', label: 'SMTP Settings', icon: Server },
    { id: 'website', label: 'Website Analysis', icon: Globe },
    { id: 'campaign', label: 'Campaign Config', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">Configure your email marketing system parameters</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#00f5a0] text-[#00f5a0]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl">
          {activeTab === 'smtp' && (
            <div className="space-y-8">
              {/* SMTP Email Server Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">SMTP Email Server Settings</h2>

                <div className="space-y-6">
                  {/* Configuration Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Configuration Name
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.configName}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, configName: e.target.value })}
                      placeholder="e.g., Company Email Server"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* SMTP Server */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Server <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtpServer}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpServer: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      placeholder="587"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* SSL/TLS Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="useTLS"
                      checked={smtpConfig.useTLS}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, useTLS: e.target.checked })}
                      className="w-5 h-5 text-[#00f5a0] border-gray-300 rounded focus:ring-[#00f5a0]"
                    />
                    <label htmlFor="useTLS" className="text-sm font-medium text-gray-700">
                      Use SSL/TLS Encryption (Port 465)
                    </label>
                  </div>

                  {/* Username/Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username/Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      placeholder="•••••••••••••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Test Connection Button */}
                  <div>
                    <button
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingConnection ? (
                        <span className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Testing...</span>
                        </span>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Common SMTP Configurations Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">Common SMTP Configurations</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li><strong>Gmail:</strong> smtp.gmail.com, Port 587 (TLS) or 465 (SSL)</li>
                      <li><strong>Outlook:</strong> smtp.office365.com, Port 587 (TLS)</li>
                      <li><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 465 (SSL)</li>
                      <li><strong>Corporate Email:</strong> Contact your IT administrator for configuration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'website' && (
            <div className="space-y-6">
              {/* Website URL Section */}
              <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  Website Analysis
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Website <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={websiteAnalysis.targetWebsite}
                        onChange={(e) => updateWebsiteField('targetWebsite', e.target.value)}
                        placeholder="https://your-company.com"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00f5a0] focus:border-white transition-all font-medium text-gray-900"
                      />
                      <button
                        onClick={handleReanalyzeWebsite}
                        disabled={loading || !websiteAnalysis.targetWebsite}
                        className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Re-analyze
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Enter your website URL to automatically extract business information</p>
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  Basic Information
                </h2>

                {/* Business Logo */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                      {websiteAnalysis.logo ? (
                        <img src={websiteAnalysis.logo} alt="Business Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Globe className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="px-4 py-2 bg-black text-white border border-black rounded-xl text-sm font-semibold hover:bg-gray-900 cursor-pointer transition-all shadow-md">
                      Upload
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Only support uploading logos in SVG format.</p>
                </div>

                {/* Business Name and Product Type */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={websiteAnalysis.businessName}
                      onChange={(e) => updateWebsiteField('businessName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00f5a0] focus:border-white transition-all font-medium text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product / Service type<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={websiteAnalysis.productType}
                      onChange={(e) => updateWebsiteField('productType', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00f5a0] focus:border-white transition-all font-medium text-gray-900"
                    />
                  </div>
                </div>

                {/* Benchmark Brands */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Benchmark brands<span className="text-red-500">*</span>
                  </label>
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl min-h-[48px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[#00f5a0] focus-within:border-white transition-all">
                    {websiteAnalysis.benchmarkBrands && websiteAnalysis.benchmarkBrands.length > 0 ? (
                      websiteAnalysis.benchmarkBrands.map((brand, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium shadow-sm">
                          {brand}
                          <button
                            onClick={() => removeBenchmarkBrand(brand)}
                            className="ml-2 text-white hover:text-white transition-colors"
                          >×</button>
                        </span>
                      ))
                    ) : null}
                    <input
                      type="text"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addBenchmarkBrand()}
                      placeholder="Type brand name and press Enter"
                      className="flex-1 min-w-[200px] outline-none text-sm font-medium text-gray-900"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    We'll recommend influencers who have worked with these brands or reached similar audiences.
                  </p>
                </div>
              </div>

              {/* Business Introduction Section */}
              <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Business Introduction
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business introduction<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={websiteAnalysis.businessIntro}
                    onChange={(e) => updateWebsiteField('businessIntro', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#00f5a0] focus:border-white transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              {/* Core Selling Points */}
              <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Core Selling Points</h3>
                  </div>
                  <button
                    onClick={addSellingPoint}
                    className="px-4 py-2 bg-white hover:bg-[#00e090] text-black font-bold text-sm rounded-xl shadow-md transition-all"
                  >
                    + Add Point
                  </button>
                </div>
                <div className="grid gap-4">
                  {websiteAnalysis.sellingPoints?.map((point, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-white transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <textarea
                          value={point}
                          onChange={(e) => updateSellingPoint(index, e.target.value)}
                          rows={2}
                          className="flex-1 text-gray-900 text-sm leading-relaxed border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00f5a0] focus:border-white resize-none font-medium transition-all"
                        />
                        <button
                          onClick={() => removeSellingPoint(index)}
                          className="text-red-500 hover:text-red-700 text-xl font-bold transition-colors"
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Audiences */}
              <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Target Audiences</h3>
                    <span className="text-sm text-gray-600 font-medium">({websiteAnalysis.audiences?.length || 0} segments)</span>
                  </div>
                  <button
                    onClick={addAudience}
                    className="px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-[#00e090] shadow-md transition-all"
                  >
                    + Add Audience
                  </button>
                </div>
                <div className="grid gap-4">
                  {websiteAnalysis.audiences?.map((audience, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-white transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 bg-black rounded-xl flex-shrink-0 shadow-sm">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="px-2 py-1 bg-black text-white font-bold text-xs rounded-lg">{index + 1}</span>
                            <input
                              type="text"
                              value={audience.title}
                              onChange={(e) => updateAudience(index, 'title', e.target.value)}
                              placeholder="Audience title"
                              className="flex-1 font-bold text-gray-900 text-sm border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#00f5a0] focus:border-white transition-all"
                            />
                          </div>
                          <textarea
                            value={audience.description}
                            onChange={(e) => updateAudience(index, 'description', e.target.value)}
                            rows={2}
                            placeholder="Audience description"
                            className="w-full text-gray-700 text-sm leading-relaxed border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#00f5a0] focus:border-white resize-none font-medium transition-all"
                          />
                        </div>
                        <button
                          onClick={() => removeAudience(index)}
                          className="text-red-500 hover:text-red-700 text-xl font-bold transition-colors"
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technology Stack Section */}
              {websiteAnalysis.techStack && websiteAnalysis.techStack.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Technology Stack</h2>
                  <div className="flex flex-wrap gap-2">
                    {websiteAnalysis.techStack.map((tech, index) => (
                      <span key={index} className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Website Analysis Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveWebsiteAnalysis}
                  disabled={loading}
                  className="px-6 py-3 bg-[#00f5a0] text-black font-bold rounded-xl hover:bg-[#00e090] transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Save Website Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'campaign' && (
            <div className="space-y-8">
              {/* Marketing Campaign Configuration */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Marketing Campaign Configuration</h2>

                <div className="space-y-6">
                  {/* Sender Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignConfig.senderName}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, senderName: e.target.value })}
                      placeholder="Fruit AI"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignConfig.companyName}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, companyName: e.target.value })}
                      placeholder="FruitAI"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Company Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Website <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={campaignConfig.companyWebsite}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, companyWebsite: e.target.value })}
                      placeholder="https://fruitai.org"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* CTA Button Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CTA Button Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignConfig.ctaButtonText}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, ctaButtonText: e.target.value })}
                      placeholder="Schedule a Meeting"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* CTA Link URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CTA Link URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={campaignConfig.ctaLink}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, ctaLink: e.target.value })}
                      placeholder="https://calendly.com/your-calendar"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00f5a0] focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      For booking buttons in emails, e.g., Calendly, Acuity, or other scheduling systems
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Update Configuration Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateConfiguration}
              disabled={loading}
              className="px-5 py-2 bg-[#00f5a0] text-white rounded-lg hover:bg-[#00e594] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </span>
              ) : (
                'Update Configuration'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
