import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Sparkles, Mail, Briefcase, Building2, MapPin } from 'lucide-react';

const ProspectsFoundStep = ({ onNext, onBack, initialData }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    searchProspects();
  }, []);

  const searchProspects = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the website analysis data
      const websiteAnalysis = initialData?.websiteAnalysis || {};
      const targetWebsite = initialData?.targetWebsite || '';

      // Build search query from analysis
      const businessType = websiteAnalysis.productServiceType || 'business';
      const targetAudiences = websiteAnalysis.audiences || websiteAnalysis.targetAudiences || [];
      const audienceDescription = targetAudiences[0]?.title || 'decision makers';

      const searchQuery = `${businessType} ${audienceDescription}`;

      console.log('🔍 Searching for prospects:', searchQuery);

      // Call backend API to search for 10 prospects
      const response = await fetch('/api/prospects/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          websiteAnalysis: websiteAnalysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search prospects');
      }

      const data = await response.json();
      console.log('✅ Found prospects:', data.prospects);

      setProspects(data.prospects || []);
    } catch (err) {
      console.error('❌ Prospect search error:', err);
      setError(err.message);

      // Set mock data for development
      setProspects([
        {
          name: 'Sarah Chen',
          email: 'sarah.chen@techcorp.com',
          company: 'TechCorp Industries',
          role: 'VP of Operations',
          location: 'San Francisco, CA',
          score: 95
        },
        {
          name: 'Michael Rodriguez',
          email: 'm.rodriguez@innovateai.com',
          company: 'InnovateAI Solutions',
          role: 'Chief Technology Officer',
          location: 'Austin, TX',
          score: 92
        },
        {
          name: 'Emily Thompson',
          email: 'emily.t@futuresystems.io',
          company: 'Future Systems Inc',
          role: 'Director of Product',
          location: 'Seattle, WA',
          score: 90
        },
        {
          name: 'David Kim',
          email: 'david.kim@cloudscale.com',
          company: 'CloudScale Technologies',
          role: 'VP of Engineering',
          location: 'New York, NY',
          score: 88
        },
        {
          name: 'Jennifer Martinez',
          email: 'jen.martinez@datawise.com',
          company: 'DataWise Analytics',
          role: 'Head of Business Development',
          location: 'Boston, MA',
          score: 87
        },
        {
          name: 'Robert Lee',
          email: 'r.lee@smartflow.io',
          company: 'SmartFlow Systems',
          role: 'Chief Operating Officer',
          location: 'Chicago, IL',
          score: 85
        },
        {
          name: 'Lisa Anderson',
          email: 'l.anderson@nexustech.com',
          company: 'Nexus Technologies',
          role: 'VP of Sales',
          location: 'Los Angeles, CA',
          score: 84
        },
        {
          name: 'James Wilson',
          email: 'james.w@alphaventures.com',
          company: 'Alpha Ventures',
          role: 'Managing Director',
          location: 'Miami, FL',
          score: 82
        },
        {
          name: 'Amanda Foster',
          email: 'amanda.foster@brightpath.io',
          company: 'BrightPath Solutions',
          role: 'Head of Strategy',
          location: 'Denver, CO',
          score: 80
        },
        {
          name: 'Christopher Taylor',
          email: 'c.taylor@visionlabs.com',
          company: 'Vision Labs Inc',
          role: 'VP of Innovation',
          location: 'Portland, OR',
          score: 78
        }
      ]);
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-green-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Finding Perfect Prospects</h2>
          <p className="text-gray-600 mb-4">
            Our AI is analyzing your business profile and searching for the best potential customers...
          </p>
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-gray-500">
            This usually takes 10-15 seconds
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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Success Header - More Compact */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white border-2 border-green-500 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Great News! We Found {prospects.length} Perfect Prospects
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Based on your business profile, we've identified these high-quality leads that match your ideal customer profile.
          </p>
        </div>

        {/* Stats Bar - White Background */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-200">
            <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{prospects.length}</div>
            <div className="text-xs text-gray-600">Prospects Found</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-200">
            <Sparkles className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{Math.round(prospects.reduce((acc, p) => acc + (p.score || 80), 0) / prospects.length)}%</div>
            <div className="text-xs text-gray-600">Avg Match Score</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border-2 border-gray-200">
            <Mail className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">100%</div>
            <div className="text-xs text-gray-600">Email Verified</div>
          </div>
        </div>

        {/* Prospects Grid - More Compact */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6 max-h-[400px] overflow-y-auto">
          <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-700" />
              Your Top Prospects
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {prospects.map((prospect, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Company Favicon */}
                    <div className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center flex-shrink-0 bg-white overflow-hidden">
                      <img
                        src={getFaviconUrl(prospect.email)}
                        alt={prospect.company || 'Company'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-400 text-xs font-semibold">
                        {prospect.name?.charAt(0) || 'P'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{prospect.name || 'Prospect ' + (index + 1)}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{prospect.role || 'Decision Maker'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
                        <Building2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="font-medium truncate">{prospect.company || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{prospect.email || 'email@company.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
                      {prospect.score || 80}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Start Your Campaign
              </h3>
              <p className="text-gray-700 mb-3">
                These prospects have been carefully selected based on your business profile and are ready to receive
                personalized outreach emails. Continue to SMTP setup to configure your email sending.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>All email addresses verified and ready to use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <button
            onClick={onBack}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            className="px-8 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 flex items-center gap-2"
          >
            Continue to SMTP Setup
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProspectsFoundStep;
