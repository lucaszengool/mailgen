import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  ServerIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
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

      if (smtpResponse.success && campaignResponse.success) {
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

  const tabs = [
    { id: 'smtp', label: 'SMTP Settings', icon: ServerIcon },
    { id: 'website', label: 'Website Analysis', icon: GlobeAltIcon },
    { id: 'campaign', label: 'Campaign Config', icon: Cog6ToothIcon }
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
              <ArrowLeftIcon className="w-5 h-5" />
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Website Analysis Settings</h2>
              <p className="text-gray-600">Website analysis configuration coming soon...</p>
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
