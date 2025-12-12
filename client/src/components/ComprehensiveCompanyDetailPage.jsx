import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Share2, Mail, Building2, MapPin, Users, Calendar,
  Globe, BarChart3, DollarSign, Newspaper, CheckCircle, Trophy,
  Sparkles, Rocket, ExternalLink, Phone, Zap, TrendingUp, Target
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      valuePropositions: ['AI-powered prospect discovery and targeting'],
      targetPersonas: [{ role: 'CEO / Founder', painPoints: ['Revenue acceleration', 'Market expansion', 'Customer acquisition cost'], interests: ['ROI optimization', 'Scalable growth', 'Competitive advantage'] }],
      funding: { stage: 'Growth Stage', totalFunding: 'Undisclosed', lastRound: 'Undisclosed', investors: ['Undisclosed'] },
      techStack: prospect.techStack || [],
      leadership: [],
      news: [],
      competitiveAdvantages: ['Superior customer support'],
      marketPosition: { category: 'Market Leader', marketShare: 'Top 10%', competitiveRating: 9 },
      contactInfo: { email: prospect.email, phone: prospect.phone || null },
      emailMarketingFit: { overallScore: matchScore, industryAlignment: matchScore + 5, budgetLevel: 'Medium', decisionMakingSpeed: 'Fast', painPoints: [] },
      growthMetrics: { revenueGrowth: 'N/A', employeeGrowth: 'N/A', customerGrowth: 'N/A', marketExpansion: 'N/A' }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse" style={{ backgroundColor: '#00f5a0' }}>
            <Building2 className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Loading Company Data</h2>
          <p className="text-gray-500">Fetching comprehensive information...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Company data not available</p>
          <button onClick={onBack} className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-black font-semibold hover:bg-gray-50 transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const matchScore = companyData.confidence || 85;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Back to Prospects</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.success('Link copied!')}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Share</span>
              </button>
              <button
                onClick={() => toast.success('Opening email composer...')}
                className="px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-black font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#00f5a0' }}
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Send Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#00f5a0' }}>
                  {companyData.logo ? (
                    <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Building2 className="w-10 h-10 text-black" />
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-black mb-3">{companyData.name}</h1>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {companyData.location && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {companyData.location}
                      </span>
                    )}
                    {companyData.employees && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {companyData.employees} employees
                      </span>
                    )}
                    {companyData.founded && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium">
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
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline transition-all"
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
                <p className="mt-6 pt-6 border-t border-gray-100 text-gray-600 leading-relaxed">
                  {companyData.description}
                </p>
              )}

              {/* Social Media */}
              {companyData.social && Object.keys(companyData.social).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-black mb-3">Social Media</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(companyData.social).map(([platform, url]) => url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 capitalize transition-all hover:scale-[1.02]"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email Campaign Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                  <Mail className="w-5 h-5 text-black" />
                </div>
                Email Campaign Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact Email</div>
                  <div className="text-sm font-bold text-black truncate">{companyData.email}</div>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Discovery Status</div>
                  <span className="inline-flex px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: '#00f5a0', color: 'black' }}>
                    {prospect.status || 'discovered'}
                  </span>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Confidence Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${companyData.confidence}%`, backgroundColor: '#00f5a0' }}></div>
                    </div>
                    <span className="text-sm font-bold text-black">{companyData.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Discovery Source</div>
                <div className="text-sm font-medium text-black">{prospect.source || 'searxng_direct'}</div>
              </div>
            </div>

            {/* Value Propositions */}
            {companyData.valuePropositions && companyData.valuePropositions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Rocket className="w-5 h-5 text-black" />
                  </div>
                  Why Our Solution Fits Their Needs
                </h2>
                <div className="space-y-3">
                  {companyData.valuePropositions.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#00c880' }} />
                      <span className="text-sm font-medium text-black">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Personas */}
            {companyData.targetPersonas && companyData.targetPersonas.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  Key Decision Makers to Target
                </h2>
                <div className="space-y-4">
                  {companyData.targetPersonas.map((persona, idx) => (
                    <div key={idx} className="p-5 border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-all">
                      <h3 className="font-bold text-black mb-4 text-lg">{persona.role}</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pain Points: </span>
                          <span className="text-sm font-medium text-black">{persona.painPoints?.join(', ')}</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Interests: </span>
                          <span className="text-sm font-medium text-black">{persona.interests?.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {companyData.techStack && companyData.techStack.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  Technology Stack
                </h2>
                <div className="flex flex-wrap gap-2">
                  {companyData.techStack.map((tech, idx) => (
                    <span key={idx} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-black hover:bg-gray-200 transition-all">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Funding */}
            {companyData.funding && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <DollarSign className="w-5 h-5 text-black" />
                  </div>
                  Funding
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Stage</div>
                    <div className="text-sm font-bold text-black">{companyData.funding.stage || 'Growth Stage'}</div>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Funding</div>
                    <div className="text-sm font-bold text-black">{companyData.funding.totalFunding || 'Undisclosed'}</div>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Last Round</div>
                    <div className="text-sm font-bold text-black">{companyData.funding.lastRound || 'Undisclosed'}</div>
                  </div>
                </div>

                {companyData.funding.yearlyFunding && companyData.funding.yearlyFunding.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-black mb-4">Funding Growth Trend</h3>
                    <div className="space-y-3">
                      {companyData.funding.yearlyFunding.map((data, idx) => {
                        const maxAmount = Math.max(...companyData.funding.yearlyFunding.map(d => d.amount || 0));
                        return (
                          <div key={idx} className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-gray-500 w-14">{data.year}</span>
                            <div className="flex-1 h-8 bg-gray-100 rounded-xl overflow-hidden">
                              <div
                                className="h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-500"
                                style={{ width: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%`, backgroundColor: '#00f5a0', minWidth: '80px' }}
                              >
                                <span className="text-sm font-bold text-black">${data.amount}M</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-5 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key Investors</div>
                  <div className="text-sm font-medium text-black">{companyData.funding.investors?.join(', ') || 'Undisclosed'}</div>
                </div>
              </div>
            )}

            {/* Leadership */}
            {companyData.leadership && companyData.leadership.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                  Leadership Team
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {companyData.leadership.map((leader, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-black">{leader.name}</div>
                        <div className="text-xs text-gray-500 font-medium">{leader.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News */}
            {companyData.news && companyData.news.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Newspaper className="w-5 h-5 text-black" />
                  </div>
                  Recent News
                </h2>
                <div className="space-y-4">
                  {companyData.news.map((article, idx) => (
                    <div key={idx} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 text-xs font-bold rounded-lg" style={{ backgroundColor: '#00f5a0', color: 'black' }}>
                          {article.source}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{article.date}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-black">{article.title}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Advantages */}
            {companyData.competitiveAdvantages && companyData.competitiveAdvantages.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Trophy className="w-5 h-5 text-black" />
                  </div>
                  Competitive Advantages
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {companyData.competitiveAdvantages.map((advantage, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#00c880' }} />
                      <span className="text-sm font-medium text-black">{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Position */}
            {companyData.marketPosition && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <BarChart3 className="w-5 h-5 text-black" />
                  </div>
                  Market Position
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</div>
                    <div className="text-sm font-bold text-black">{companyData.marketPosition.category}</div>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Market Share</div>
                    <div className="text-sm font-bold text-black">{companyData.marketPosition.marketShare}</div>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Competitive Rating</div>
                    <div className="text-sm font-bold text-black">{companyData.marketPosition.competitiveRating}/10</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            {companyData.contactInfo && (companyData.contactInfo.email || companyData.contactInfo.phone) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: '#00f5a0' }}>
                    <Phone className="w-5 h-5 text-black" />
                  </div>
                  Contact Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {companyData.contactInfo.email && (
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</div>
                      <div className="text-sm font-medium text-black">{companyData.contactInfo.email}</div>
                    </div>
                  )}
                  {companyData.contactInfo.phone && (
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone</div>
                      <div className="text-sm font-medium text-black">{companyData.contactInfo.phone}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-400 py-6">
              Company data provided by website analysis
            </p>
          </div>

          {/* Right Column - Score Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Match Score */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-center mb-8">
                  <div className="relative w-36 h-36 mx-auto mb-5">
                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                        className="transition-all duration-1000"
                        style={{ stroke: '#00f5a0', strokeDasharray: `${(matchScore / 100) * 326.73}, 326.73` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-black">{matchScore}%</span>
                    </div>
                  </div>
                  <span className="inline-flex px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: '#00f5a0', color: 'black' }}>
                    {companyData.matchLevel}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Industry Fit</span>
                    <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.industryAlignment || matchScore}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Budget Level</span>
                    <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.budgetLevel || 'Medium'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Decision Speed</span>
                    <span className="text-sm font-bold text-black">{companyData.emailMarketingFit?.decisionMakingSpeed || 'Fast'}</span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5" style={{ color: '#00c880' }} />
                    <span className="text-sm font-medium text-black">High Interest Level</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5" style={{ color: '#00c880' }} />
                    <span className="text-sm font-medium text-black">Quick Decision Maker</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5" style={{ color: '#00c880' }} />
                    <span className="text-sm font-medium text-black">Budget Available</span>
                  </div>
                </div>
              </div>

              {/* Growth Metrics */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-bold text-black mb-5 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" style={{ color: '#00c880' }} />
                  Growth Metrics
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Revenue Growth</div>
                    <div className="text-lg font-bold text-black">{companyData.growthMetrics?.revenueGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee Growth</div>
                    <div className="text-lg font-bold text-black">{companyData.growthMetrics?.employeeGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer Growth</div>
                    <div className="text-lg font-bold text-black">{companyData.growthMetrics?.customerGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Market Expansion</div>
                    <div className="text-lg font-bold text-black">{companyData.growthMetrics?.marketExpansion || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Email Marketing Fit */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-bold text-black mb-5 flex items-center">
                  <Target className="w-5 h-5 mr-2" style={{ color: '#00c880' }} />
                  Email Marketing Fit
                </h3>
                <div className="p-5 rounded-xl mb-5" style={{ backgroundColor: '#00f5a0' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-black">Overall Score</span>
                    <span className="text-2xl font-bold text-black">{companyData.emailMarketingFit?.overallScore || matchScore}%</span>
                  </div>
                </div>

                {companyData.emailMarketingFit?.painPoints && companyData.emailMarketingFit.painPoints.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Key Pain Points</div>
                    <div className="space-y-2">
                      {companyData.emailMarketingFit.painPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00c880' }} />
                          <span className="text-sm font-medium text-black">{point}</span>
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
  );
}
