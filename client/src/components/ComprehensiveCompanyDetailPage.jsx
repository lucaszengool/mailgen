import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Share2, Mail, Building2, MapPin, Users, Calendar,
  Globe, BarChart3, DollarSign, Briefcase, Newspaper, Star,
  CheckCircle, Trophy, Sparkles, Rocket, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Comprehensive Company Detail Page
 * Clean white background, green/black color scheme
 */
export default function ComprehensiveCompanyDetailPage({ prospect, onBack }) {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (prospect) {
      fetchCompanyData();
    }
  }, [prospect]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const domain = prospect.source_url || prospect.website || extractDomainFromEmail(prospect.email);
      const response = await fetch(`/api/company/info?domain=${encodeURIComponent(domain)}`);
      const data = await response.json();

      if (data.success) {
        setCompanyData(data.data);
      } else {
        setCompanyData(createFallbackData(prospect));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      setCompanyData(createFallbackData(prospect));
    } finally {
      setLoading(false);
    }
  };

  const extractDomainFromEmail = (email) => {
    if (!email) return '';
    return email.split('@')[1] || '';
  };

  const createFallbackData = (prospect) => {
    const domain = prospect.email ? prospect.email.split('@')[1] : '';
    const matchScore = prospect.confidence || 85;

    return {
      name: prospect.company || domain,
      description: prospect.description || null,
      logo: null,
      website: prospect.source_url || prospect.website || `https://${domain}`,
      industry: prospect.industry || null,
      founded: prospect.founded || null,
      employees: prospect.companySize || null,
      location: prospect.location || null,
      email: prospect.email,
      confidence: matchScore,
      matchLevel: matchScore >= 80 ? 'EXCELLENT MATCH' : matchScore >= 60 ? 'GOOD MATCH' : 'FAIR MATCH',
      social: prospect.social || {},
      valuePropositions: null,
      targetPersonas: null,
      funding: null,
      techStack: prospect.techStack || null,
      leadership: null,
      news: null,
      competitiveAdvantages: null,
      marketPosition: null,
      contactInfo: null,
      emailMarketingFit: null,
      growthMetrics: null
    };
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00f5a0' }}>
            <Building2 className="w-8 h-8 text-black animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Loading Company Data</h2>
          <p className="text-gray-500 text-sm">Fetching comprehensive information...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Company data not available</p>
          <button onClick={onBack} className="mt-4 px-6 py-2 bg-gray-100 rounded-xl text-black font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const matchScore = companyData.confidence || 85;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Shared!')}
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Share</span>
            </button>
            <button
              onClick={() => toast.success('Opening email composer...')}
              className="px-5 py-2 rounded-xl transition-colors flex items-center gap-2 text-black font-semibold"
              style={{ backgroundColor: '#00f5a0' }}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">Send Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Header Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00f5a0' }}>
                    {companyData.logo ? (
                      <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-8 h-8 text-black" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-black mb-2">{companyData.name}</h1>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {companyData.location && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                          <MapPin className="w-3.5 h-3.5" />
                          {companyData.location}
                        </span>
                      )}
                      {companyData.employees && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                          <Users className="w-3.5 h-3.5" />
                          {companyData.employees} employees
                        </span>
                      )}
                      {companyData.founded && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5" />
                          Founded {companyData.founded}
                        </span>
                      )}
                    </div>

                    {companyData.website && (
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                        style={{ color: '#00c880' }}
                      >
                        <Globe className="w-4 h-4" />
                        {companyData.website.replace(/^https?:\/\//, '').split('/')[0]}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {companyData.description && (
                  <p className="mt-4 pt-4 border-t border-gray-100 text-gray-600 text-sm leading-relaxed">
                    {companyData.description}
                  </p>
                )}

                {/* Social Media */}
                {companyData.social && Object.keys(companyData.social).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-black mb-3">Social Media</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(companyData.social).map(([platform, url]) => url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 capitalize transition-colors"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Campaign Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                    <Mail className="w-4 h-4" style={{ color: '#00c880' }} />
                  </div>
                  Email Campaign Information
                </h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Contact Email</div>
                    <div className="text-sm font-semibold text-black truncate">{companyData.email}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Discovery Status</div>
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#e8fff5', color: '#00c880' }}>
                      {prospect.status || 'discovered'}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Confidence Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${companyData.confidence}%`, backgroundColor: '#00f5a0' }}></div>
                      </div>
                      <span className="text-sm font-bold text-black">{companyData.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Discovery Source</div>
                  <div className="text-sm text-black">{prospect.source || 'searxng_direct'}</div>
                </div>
              </div>

              {/* Value Propositions */}
              {companyData.valuePropositions && companyData.valuePropositions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Rocket className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Why Our Solution Fits Their Needs
                  </h2>
                  <div className="space-y-2">
                    {companyData.valuePropositions.map((value, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00c880' }} />
                        <span className="text-sm text-black">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Personas */}
              {companyData.targetPersonas && companyData.targetPersonas.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Users className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Key Decision Makers to Target
                  </h2>
                  <div className="space-y-4">
                    {companyData.targetPersonas.map((persona, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                        <h3 className="font-semibold text-black mb-3">{persona.role}</h3>
                        <div className="space-y-2">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs font-semibold text-gray-500">Pain Points: </span>
                            <span className="text-sm text-black">{persona.painPoints?.join(', ')}</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs font-semibold text-gray-500">Interests: </span>
                            <span className="text-sm text-black">{persona.interests?.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {companyData.techStack && companyData.techStack.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Sparkles className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Technology Stack
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {companyData.techStack.map((tech, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-black">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Funding */}
              {companyData.funding && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <DollarSign className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Funding
                  </h2>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Current Stage</div>
                      <div className="text-sm font-semibold text-black">{companyData.funding.stage || 'Growth Stage'}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Total Funding</div>
                      <div className="text-sm font-semibold text-black">{companyData.funding.totalFunding || 'Undisclosed'}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Last Round</div>
                      <div className="text-sm font-semibold text-black">{companyData.funding.lastRound || 'Undisclosed'}</div>
                    </div>
                  </div>

                  {companyData.funding.yearlyFunding && companyData.funding.yearlyFunding.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-black mb-3">Funding Growth Trend</h3>
                      <div className="space-y-2">
                        {companyData.funding.yearlyFunding.map((data, idx) => {
                          const maxAmount = Math.max(...companyData.funding.yearlyFunding.map(d => d.amount || 0));
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-500 w-12">{data.year}</span>
                              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                                <div
                                  className="h-full rounded-lg flex items-center justify-end pr-2"
                                  style={{ width: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%`, backgroundColor: '#00f5a0', minWidth: '60px' }}
                                >
                                  <span className="text-xs font-bold text-black">${data.amount}M</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Key Investors</div>
                    <div className="text-sm text-black">{companyData.funding.investors?.join(', ') || 'Undisclosed'}</div>
                  </div>
                </div>
              )}

              {/* Leadership */}
              {companyData.leadership && companyData.leadership.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Trophy className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Leadership Team
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {companyData.leadership.map((leader, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-black">{leader.name}</div>
                          <div className="text-xs text-gray-500">{leader.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News */}
              {companyData.news && companyData.news.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Newspaper className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Recent News
                  </h2>
                  <div className="space-y-3">
                    {companyData.news.map((article, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: '#e8fff5', color: '#00c880' }}>
                            {article.source}
                          </span>
                          <span className="text-xs text-gray-400">{article.date}</span>
                        </div>
                        <h3 className="text-sm font-medium text-black">{article.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Advantages */}
              {companyData.competitiveAdvantages && companyData.competitiveAdvantages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Trophy className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Competitive Advantages
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {companyData.competitiveAdvantages.map((advantage, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00c880' }} />
                        <span className="text-sm text-black">{advantage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Position */}
              {companyData.marketPosition && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <BarChart3 className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Market Position
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-xs text-gray-500 mb-1">Category</div>
                      <div className="text-sm font-semibold text-black">{companyData.marketPosition.category}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-xs text-gray-500 mb-1">Market Share</div>
                      <div className="text-sm font-semibold text-black">{companyData.marketPosition.marketShare}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-xs text-gray-500 mb-1">Competitive Rating</div>
                      <div className="text-sm font-semibold text-black">{companyData.marketPosition.competitiveRating}/10</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {companyData.contactInfo && Object.keys(companyData.contactInfo).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8fff5' }}>
                      <Mail className="w-4 h-4" style={{ color: '#00c880' }} />
                    </div>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {companyData.contactInfo.email && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Email</div>
                        <div className="text-sm text-black">{companyData.contactInfo.email}</div>
                      </div>
                    )}
                    {companyData.contactInfo.phone && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">Phone</div>
                        <div className="text-sm text-black">{companyData.contactInfo.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 py-4">
                Company data provided by website analysis
              </p>
            </div>

            {/* Right Column - Score Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Match Score */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        <circle
                          cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
                          style={{ stroke: '#00f5a0', strokeDasharray: `${(matchScore / 100) * 339.292}, 339.292` }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-black">{matchScore}%</span>
                      </div>
                    </div>
                    <span className="inline-flex px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#e8fff5', color: '#00c880' }}>
                      {companyData.matchLevel}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Industry Fit</span>
                      <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.industryAlignment || matchScore}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Budget Level</span>
                      <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.budgetLevel || 'Medium'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Decision Speed</span>
                      <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.decisionMakingSpeed || 'Fast'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4" style={{ color: '#00c880' }} />
                      <span className="text-sm text-black">High Interest Level</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4" style={{ color: '#00c880' }} />
                      <span className="text-sm text-black">Quick Decision Maker</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4" style={{ color: '#00c880' }} />
                      <span className="text-sm text-black">Budget Available</span>
                    </div>
                  </div>
                </div>

                {/* Growth Metrics */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" style={{ color: '#00c880' }} />
                    Growth Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Revenue Growth</div>
                      <div className="text-lg font-bold text-black">{companyData.growthMetrics?.revenueGrowth || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Employee Growth</div>
                      <div className="text-lg font-bold text-black">{companyData.growthMetrics?.employeeGrowth || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Customer Growth</div>
                      <div className="text-lg font-bold text-black">{companyData.growthMetrics?.customerGrowth || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Market Expansion</div>
                      <div className="text-lg font-bold text-black">{companyData.growthMetrics?.marketExpansion || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Email Marketing Fit */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: '#00c880' }} />
                    Email Marketing Fit
                  </h3>
                  <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: '#e8fff5' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#00c880' }}>Overall Score</span>
                      <span className="text-xl font-bold text-black">{companyData.emailMarketingFit?.overallScore || matchScore}%</span>
                    </div>
                  </div>

                  {companyData.emailMarketingFit?.painPoints && companyData.emailMarketingFit.painPoints.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2">Key Pain Points</div>
                      <div className="space-y-2">
                        {companyData.emailMarketingFit.painPoints.map((point, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00c880' }} />
                            <span className="text-xs text-black">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
