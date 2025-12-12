import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Sparkles, Mail, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import ComprehensiveCompanyDetailPage from './ComprehensiveCompanyDetailPage';

const ProspectsFoundStep = ({ onNext, onBack, initialData }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);

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

    window.dispatchEvent(new CustomEvent('workflow-notification', {
      detail: { stage: 'prospectSearchStarting' }
    }));

    try {
      const websiteAnalysis = initialData?.websiteAnalysis || {};
      const targetAudiences = websiteAnalysis.audiences || websiteAnalysis.targetAudiences || [];
      const audienceDescription = targetAudiences[0]?.title || 'decision makers';
      const searchQuery = audienceDescription.trim();

      console.log('🔍 Searching for prospects:', searchQuery);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch('/api/prospects/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (err) {
      console.error('❌ Prospect search error:', err);
      let errorMessage = err.message;
      if (err.name === 'AbortError') {
        errorMessage = 'Prospect search is taking longer than expected. Please try again.';
      } else if (err.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      }
      setError(errorMessage);
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

  const getCompanyDomain = (email) => {
    if (!email) return '';
    return email.split('@')[1];
  };

  const getFaviconUrl = (email) => {
    const domain = getCompanyDomain(email);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
            <Sparkles className="w-8 h-8 text-black animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-3">Finding Perfect Prospects</h2>
          <p className="text-gray-500 mb-6">
            Our AI is searching for the best potential customers...
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                <CheckCircle className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Found {prospects.length} Perfect Prospects!</h1>
                <p className="text-gray-500 text-sm">High-quality leads matching your ideal customer profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-black">{prospects.length}</span>
                <span className="text-xs text-gray-500">Found</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
                <span className="text-sm font-bold text-black">
                  {Math.round(prospects.reduce((acc, p) => acc + (p.score || 75), 0) / Math.max(prospects.length, 1))}%
                </span>
                <span className="text-xs text-gray-500">Avg Score</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#e8fff5' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#00f5a0' }} />
                <span className="text-xs font-medium text-gray-700">All Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Search Error</h3>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={searchProspects}
                className="px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prospects.map((prospect, index) => (
                <div
                  key={index}
                  onClick={() => handleProspectClick(prospect)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer
                           hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Company Icon */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                        <img
                          src={getFaviconUrl(prospect.email)}
                          alt={prospect.company || 'Company'}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center text-gray-400 text-lg font-bold">
                          {prospect.name?.charAt(0) || prospect.company?.charAt(0) || 'P'}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
                        <CheckCircle className="w-3 h-3 text-black" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-black truncate">
                        {prospect.name || prospect.company || 'Prospect'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{prospect.role || 'Decision Maker'}</p>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1.5 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: '#00f5a0' }}>
                        {prospect.score || 75}%
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 truncate flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {prospect.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-white border border-gray-300 text-black font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Ready to configure email sending</span>
            <button
              onClick={handleContinue}
              disabled={prospects.length === 0}
              className="px-6 py-2.5 text-black font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#00f5a0' }}
            >
              Continue to SMTP Setup
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectsFoundStep;
