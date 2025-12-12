import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Sparkles, Mail, Briefcase, Building2, MapPin, Star, TrendingUp, ArrowLeft } from 'lucide-react';
import ComprehensiveCompanyDetailPage from './ComprehensiveCompanyDetailPage';

const ProspectsFoundStep = ({ onNext, onBack, initialData }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  // 🔥 NEW: State for company detail view
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);

  // Handle prospect card click to show company details
  const handleProspectClick = (prospect) => {
    console.log('🏢 Opening company details for:', prospect.company || prospect.name);
    setSelectedProspect(prospect);
    setShowCompanyDetail(true);
  };

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

  // 🔥 Show company detail view if a prospect is selected
  if (showCompanyDetail && selectedProspect) {
    return (
      <div className="h-screen bg-white overflow-y-auto">
        <ComprehensiveCompanyDetailPage
          prospect={selectedProspect}
          onBack={() => {
            setShowCompanyDetail(false);
            setSelectedProspect(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
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

      {/* Linktree-style centered content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-md mx-auto w-full">

        {/* Profile Header - Linktree style */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%)' }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Found {prospects.length} Perfect Prospects!
          </h1>
          <p className="text-gray-500 text-sm">
            High-quality leads matching your profile
          </p>

          {/* Stats Pills - Linktree style */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              {prospects.length} Found
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              {Math.round(prospects.reduce((acc, p) => acc + (p.score || 75), 0) / Math.max(prospects.length, 1))}% Avg
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(0, 245, 160, 0.15)', color: '#00c880' }}>
              ✓ Verified
            </span>
          </div>
        </div>

        {/* Prospect Cards - Linktree style stacked */}
        <div className="w-full space-y-3">
          {prospects.map((prospect, index) => (
            <div
              key={index}
              onClick={() => handleProspectClick(prospect)}
              className="linktree-card group"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="w-full bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 ease-out
                           border border-gray-100 hover:border-transparent
                           shadow-sm hover:shadow-xl hover:shadow-gray-200/50
                           hover:-translate-y-1 hover:scale-[1.02]
                           active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar/Favicon - Clean circular */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white overflow-hidden shadow-inner">
                      <img
                        src={getFaviconUrl(prospect.email)}
                        alt={prospect.company || 'Company'}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-400 text-base font-semibold bg-gradient-to-br from-gray-100 to-gray-50">
                        {prospect.name?.charAt(0) || prospect.company?.charAt(0) || 'P'}
                      </div>
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  {/* Info - Clean typography */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
                      {prospect.name || prospect.company || 'Prospect'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate leading-tight mt-0.5">
                      {prospect.role || 'Decision Maker'}
                    </p>
                  </div>

                  {/* Score Badge - Pill style */}
                  <div className="flex-shrink-0">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                                  group-hover:scale-110"
                         style={{
                           backgroundColor: 'rgba(0, 245, 160, 0.15)',
                           color: '#00c880'
                         }}>
                      {prospect.score || 75}%
                    </div>
                  </div>
                </div>

                {/* Email - Subtle, appears on hover feel */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {prospect.email}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons - Linktree style */}
        <div className="w-full mt-8 space-y-3">
          <button
            onClick={handleContinue}
            className="w-full py-4 text-white font-semibold rounded-full transition-all duration-300
                     hover:shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5 hover:scale-[1.02]
                     active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%)' }}
          >
            <span>Continue to SMTP Setup</span>
            <span className="text-lg">→</span>
          </button>

          <button
            onClick={onBack}
            className="w-full py-3 bg-transparent text-gray-500 font-medium rounded-full transition-all duration-300
                     hover:bg-gray-100 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-xs text-gray-400 text-center">
          Ready to configure email sending
        </p>
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

        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 245, 160, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 5px rgba(0, 245, 160, 0.2);
          }
        }

        .linktree-card {
          animation: card-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-fill-mode: both;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default ProspectsFoundStep;
