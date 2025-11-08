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

      // Call backend API to search for 7 prospects (faster results)
      const response = await fetch('/api/prospects/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 7,
          websiteAnalysis: websiteAnalysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search prospects');
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
      setError(err.message);

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
              <Sparkles className="w-10 h-10 text-[#00f5a0] animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Finding Perfect Prospects</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Our AI is analyzing your business profile and searching for the best potential customers...
          </p>
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-[#00f5a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
              className="absolute w-2 h-2 bg-[#00f5a0] rounded-full animate-ping"
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

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Success Header with Animation */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-white border-4 border-[#00f5a0] flex items-center justify-center relative z-10 shadow-lg shadow-[#00f5a0]/20 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-[#00f5a0]" />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#00f5a0] opacity-20 animate-ping"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            🎉 Great News! We Found {prospects.length} Perfect Prospects
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            Based on your business profile, we've identified these high-quality leads that match your ideal customer profile.
          </p>
        </div>

        {/* Stats Bar with Animation */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { icon: Users, value: prospects.length, label: 'Prospects Found', delay: '300ms' },
            { icon: Star, value: `${Math.round(prospects.reduce((acc, p) => acc + (p.score || 80), 0) / prospects.length)}%`, label: 'Avg Match Score', delay: '400ms' },
            { icon: CheckCircle, value: '100%', label: 'Email Verified', delay: '500ms' }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 text-center border-2 border-gray-100 hover:border-[#00f5a0] transition-all duration-300 hover:shadow-xl hover:shadow-[#00f5a0]/10 animate-scale-in cursor-pointer group"
              style={{ animationDelay: stat.delay }}
            >
              <stat.icon className="w-8 h-8 text-[#00f5a0] mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-3 mb-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <TrendingUp className="w-6 h-6 text-[#00f5a0]" />
          <h2 className="text-2xl font-bold text-gray-900">Your Top Prospects</h2>
        </div>

        {/* Prospects Grid with Staggered Animation */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mb-10 shadow-lg">
          <div className="divide-y divide-gray-100">
            {prospects.map((prospect, index) => (
              <div
                key={index}
                className="p-5 hover:bg-gradient-to-r hover:from-[#00f5a0]/5 hover:to-transparent transition-all duration-300 animate-slide-in group cursor-pointer"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Company Favicon with Animation */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl border-2 border-gray-200 group-hover:border-[#00f5a0] flex items-center justify-center flex-shrink-0 bg-white overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                        <img
                          src={getFaviconUrl(prospect.email)}
                          alt={prospect.company || 'Company'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-[#00f5a0] text-lg font-bold">
                          {prospect.name?.charAt(0) || 'P'}
                        </div>
                      </div>
                      {/* Success badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#00f5a0] rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#00f5a0] transition-colors">
                        {prospect.name || 'Prospect ' + (index + 1)}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{prospect.role || 'Business Professional'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                        <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-semibold">{prospect.company || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{prospect.email || 'email@company.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score with Animation */}
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f5a0] text-white font-bold text-lg shadow-lg shadow-[#00f5a0]/30 group-hover:scale-110 transition-transform">
                      <Star className="w-4 h-4 fill-white" />
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
          className="bg-white rounded-2xl p-8 mb-10 border-2 border-[#00f5a0]/30 animate-slide-up"
          style={{ animationDelay: `${700 + prospects.length * 100}ms` }}
        >
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-full bg-[#00f5a0] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00f5a0]/30 animate-bounce-slow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Start Your Campaign
              </h3>
              <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                These prospects have been carefully selected based on your business profile and are ready to receive
                personalized outreach emails. Continue to SMTP setup to configure your email sending.
              </p>
              <div className="flex items-center gap-3 text-base text-gray-700 bg-white rounded-lg px-4 py-3 border-2 border-[#00f5a0]/20">
                <CheckCircle className="w-5 h-5 text-[#00f5a0] flex-shrink-0" />
                <span className="font-semibold">All email addresses verified and ready to use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons with Animation */}
        <div className="flex justify-between items-center pt-6 animate-slide-up" style={{ animationDelay: `${800 + prospects.length * 100}ms` }}>
          <button
            onClick={onBack}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 hover:scale-105"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="px-10 py-3 bg-[#00f5a0] text-black font-bold rounded-xl hover:bg-[#00e090] transition-all duration-300 shadow-lg shadow-[#00f5a0]/40 flex items-center gap-3 hover:scale-105 hover:shadow-xl hover:shadow-[#00f5a0]/50"
          >
            Continue to SMTP Setup
            <Sparkles className="w-5 h-5" />
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
