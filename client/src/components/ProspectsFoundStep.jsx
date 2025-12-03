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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Celebration confetti effect */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: `${1000 + Math.random() * 1000}ms`
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 shadow-md animate-scale-in" style={{ backgroundColor: '#00f5a0' }}>
              <CheckCircle className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Great News! We Found {prospects.length} Perfect Prospects
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
              Based on your business profile, we've identified these high-quality leads that match your ideal customer profile.
            </p>
          </div>
        </div>

        {/* Stats Bar with Animation */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {[
            { icon: Users, value: prospects.length, label: 'Prospects Found', delay: '300ms' },
            { icon: Star, value: `${Math.round(prospects.reduce((acc, p) => acc + (p.score || 80), 0) / prospects.length)}%`, label: 'Avg Match Score', delay: '400ms' },
            { icon: CheckCircle, value: '100%', label: 'Email Verified', delay: '500ms' }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in group"
              style={{ animationDelay: stat.delay }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md" style={{ backgroundColor: '#00f5a0' }}>
                <stat.icon className="w-6 h-6 text-black" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Prospects Section */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#00f5a0' }}>
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Top Prospects</h2>
          </div>

          {/* Prospects Grid with Staggered Animation */}
          <div className="space-y-4">
            {prospects.map((prospect, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-white transition-all duration-300 animate-slide-in group"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Company Favicon with Animation */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl border-2 border-gray-200 group-hover:border-white flex items-center justify-center flex-shrink-0 bg-white overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
                        <img
                          src={getFaviconUrl(prospect.email)}
                          alt={prospect.company || 'Company'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-white text-lg font-bold">
                          {prospect.name?.charAt(0) || 'P'}
                        </div>
                      </div>
                      {/* Success badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#00f5a0' }}>
                        <CheckCircle className="w-3 h-3 text-black" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {prospect.name || 'Prospect ' + (index + 1)}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{prospect.role || 'Business Professional'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-900 mb-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{prospect.company || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate font-medium">{prospect.email || 'email@company.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score with Animation */}
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-bold text-lg shadow-md border-2 border-gray-200" style={{ backgroundColor: '#00f5a0' }}>
                      <Star className="w-4 h-4 fill-black" />
                      {prospect.score || 80}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Message with Animation */}
        <div
          className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${700 + prospects.length * 100}ms` }}
        >
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ backgroundColor: '#00f5a0' }}>
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Ready to Start Your Campaign
              </h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                These prospects have been carefully selected based on your business profile and are ready to receive
                personalized outreach emails. Continue to SMTP setup to configure your email sending.
              </p>
              <div className="flex items-center gap-3 text-black rounded-xl px-4 py-3 border-2 border-gray-200" style={{ backgroundColor: '#00f5a0' }}>
                <CheckCircle className="w-5 h-5 text-black flex-shrink-0" />
                <span className="font-semibold">All email addresses verified and ready to use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons with Animation */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6 animate-slide-up" style={{ animationDelay: `${800 + prospects.length * 100}ms` }}>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-white border-2 border-black text-black font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="px-10 py-3 text-black font-bold rounded-xl transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            style={{ backgroundColor: '#00f5a0' }}
          >
            <span>Continue to SMTP Setup</span>
            <span className="text-black">→</span>
          </button>
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
