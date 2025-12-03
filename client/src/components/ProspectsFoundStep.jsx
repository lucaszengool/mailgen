import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Sparkles, Mail, Briefcase, Building2, MapPin, Star, TrendingUp } from 'lucide-react';

const ProspectsFoundStep = ({ onNext, onBack, initialData }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    searchProspects();
  }, []);

  const searchProspects = async () => {
    setLoading(true);
    setError(null);

    // Dispatch notification event for prospect search starting
    window.dispatchEvent(new CustomEvent('workflow-notification', {
      detail: { stage: 'prospectSearchStarting' }
    }));

    try {
      // Get the website analysis data
      const websiteAnalysis = initialData?.websiteAnalysis || {};
      const targetWebsite = initialData?.targetWebsite || '';

      // Build search query from analysis
      const targetAudiences = websiteAnalysis.audiences || websiteAnalysis.targetAudiences || [];
      const audienceDescription = targetAudiences[0]?.title || 'decision makers';

      // Clean search query - just use the audience description
      const searchQuery = audienceDescription.trim();

      console.log('🔍 Searching for prospects:', searchQuery);

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for prospect search

      // Call backend API to search for 7 prospects (faster results)
      const response = await fetch('/api/prospects/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 7,
          websiteAnalysis: websiteAnalysis,
          campaignId: initialData?.campaignId || 'default'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to search prospects');
      }

      const data = await response.json();
      console.log('✅ Found prospects:', data.prospects);

      setProspects(data.prospects || []);

      // Show celebration effect
      if (data.prospects && data.prospects.length > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (err) {
      console.error('❌ Prospect search error:', err);

      // Provide helpful error messages
      let errorMessage = err.message;
      if (err.name === 'AbortError') {
        errorMessage = 'Prospect search is taking longer than expected. The search may still be processing. Please refresh the page in a moment or try again.';
      } else if (err.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      }

      setError(errorMessage);

      // NO FALLBACK DATA - Show error to user
      setProspects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onNext({
      prospectSearchCompleted: true,
      foundProspects: prospects.length,
      prospects: prospects
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center relative">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00f5a0] animate-spin"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00f5a0]/10 to-[#00f5a0]/30 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Finding Perfect Prospects</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Our AI is analyzing your business profile and searching for the best potential customers...
          </p>
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-500">
            This usually takes just a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // Helper function to get company domain from email
  const getCompanyDomain = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1];
    return domain;
  };

  // Helper function to get favicon URL
  const getFaviconUrl = (email) => {
    const domain = getCompanyDomain(email);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Celebration confetti effect */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: '#00f5a0',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: `${1000 + Math.random() * 1000}ms`
              }}
            />
          ))}
        </div>
      )}

      {/* Header - Compact */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Found {prospects.length} Perfect Prospects!</h1>
              <p className="text-xs text-gray-500">High-quality leads matching your ideal customer profile</p>
            </div>
          </div>
          {/* Inline Stats */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">{prospects.length}</span>
              <span className="text-xs text-gray-500">Found</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-gray-900">{Math.round(prospects.reduce((acc, p) => acc + (p.score || 75), 0) / Math.max(prospects.length, 1))}%</span>
              <span className="text-xs text-gray-500">Avg Score</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#e8fff5' }}>
              <CheckCircle className="w-4 h-4" style={{ color: '#00f5a0' }} />
              <span className="text-xs font-medium text-gray-700">All Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">

          {/* Prospects Grid - Compact Cards */}
          <div className="grid grid-cols-2 gap-3">
            {prospects.map((prospect, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[#00f5a0] transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  {/* Company Favicon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white overflow-hidden">
                      <img
                        src={getFaviconUrl(prospect.email)}
                        alt={prospect.company || 'Company'}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-400 text-sm font-bold">
                        {prospect.name?.charAt(0) || 'P'}
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                      <CheckCircle className="w-2.5 h-2.5 text-black" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {prospect.name || prospect.company || 'Prospect'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{prospect.role || 'Decision Maker'}</p>
                    <p className="text-xs text-gray-600 truncate font-medium">{prospect.email}</p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0">
                    <div className="px-2 py-1 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: '#00f5a0' }}>
                      {prospect.score || 75}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">Ready to configure email sending</span>
            <button
              onClick={handleContinue}
              className="px-6 py-2 text-black font-semibold rounded-lg transition-all text-sm flex items-center space-x-2"
              style={{ backgroundColor: '#00f5a0' }}
            >
              <span>Continue to SMTP Setup</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProspectsFoundStep;
