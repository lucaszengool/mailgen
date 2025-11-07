import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Sparkles, ArrowRight, Globe } from 'lucide-react';

export default function FirstCampaignSetup() {
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!websiteUrl.trim()) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call website analysis API
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim()
        }),
      });

      const result = await response.json();

      if (result.success && result.analysis) {
        // Create first campaign automatically
        const firstCampaign = {
          id: Date.now().toString(),
          name: 'My First Campaign',
          createdAt: new Date().toISOString(),
          status: 'active',
          setupComplete: false,
          websiteAnalysis: result.analysis,
          stats: {
            prospects: 0,
            emails: 0,
            sent: 0
          }
        };

        // Save campaign to localStorage
        const campaigns = [firstCampaign];
        localStorage.setItem('campaigns', JSON.stringify(campaigns));

        // Save campaign config data for setup wizard
        const campaignData = {
          targetWebsite: websiteUrl.trim(),
          businessName: result.analysis.businessName || '',
          businessIntro: result.analysis.businessIntro || '',
          analysisData: result.analysis
        };

        localStorage.setItem(`campaign_${firstCampaign.id}_data`, JSON.stringify(campaignData));
        localStorage.setItem('agentSetupData', JSON.stringify(campaignData));

        // Redirect to dashboard which will show campaign onboarding wizard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error analyzing website:', error);
      // Still proceed to dashboard even if analysis fails
      navigate('/dashboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header with User Button */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">MailGen</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to MailGen!
            </h1>
            <p className="text-xl text-gray-600">
              Let's create your first AI-powered email campaign
            </p>
          </div>

          {/* Website Input Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Enter Your Website URL
              </h2>
            </div>

            <p className="text-gray-600 mb-6">
              Our AI will analyze your website to understand your business and create personalized email campaigns for you.
            </p>

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  required
                  disabled={isAnalyzing}
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !websiteUrl.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-4 px-6 rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing Website...</span>
                  </>
                ) : (
                  <>
                    <span>Start AI Analysis</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">Automatic business understanding</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold text-gray-900 mb-1">Smart Emails</h3>
              <p className="text-sm text-gray-600">Personalized for each prospect</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-1">Auto Campaigns</h3>
              <p className="text-sm text-gray-600">24/7 autonomous operation</p>
            </div>
          </div>

          {/* Skip Option */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium underline"
            >
              Skip for now and explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
