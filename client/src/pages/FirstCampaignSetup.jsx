import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Sparkles, ArrowRight, Globe, Target, Mail, Zap, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Header with User Button */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 backdrop-blur-lg bg-opacity-90 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MailGen</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Message with Animation */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="relative inline-block mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 animate-ping opacity-20">
                <div className="w-24 h-24 bg-green-500 rounded-full"></div>
              </div>
              <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-xl">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">MailGen</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's create your first AI-powered email campaign in minutes
            </p>
          </div>

          {/* Website Input Card - Premium Design */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 mb-10 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Enter Your Website URL
                </h2>
                <p className="text-sm text-gray-500">Step 1 of 3 • Takes 30 seconds</p>
              </div>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Our AI will instantly analyze your website to understand your business value proposition and create personalized email campaigns that convert.
            </p>

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Website URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg transition-all duration-200 hover:border-gray-300"
                    required
                    disabled={isAnalyzing}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !websiteUrl.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-5 px-8 rounded-xl hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

          {/* Features Preview - Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Feature 1 */}
            <div className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-default">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">AI Analysis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Automatic business understanding and competitor insights</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-default">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Smart Emails</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Personalized content for each prospect automatically</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-default">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Auto Campaigns</h3>
              <p className="text-sm text-gray-600 leading-relaxed">24/7 autonomous operation while you focus on closing deals</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 mb-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Setup in 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
            >
              Skip for now and explore →
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
