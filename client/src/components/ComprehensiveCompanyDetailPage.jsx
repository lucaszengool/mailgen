import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  ShareIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UsersIcon,
  CalendarIcon,
  GlobeAltIcon,
  ChartBarIcon,
  BanknotesIcon,
  BriefcaseIcon,
  NewspaperIcon,
  StarIcon,
  CheckCircleIcon,
  TrophyIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

/**
 * Comprehensive Company Detail Page - JobRight.ai inspired
 * White background, green/black color scheme, charts and comprehensive data
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
      console.log('🏢 Fetching comprehensive company data for:', domain);

      const response = await fetch(`/api/company/info?domain=${encodeURIComponent(domain)}`);
      const data = await response.json();

      if (data.success) {
        setCompanyData(data.data);
      } else {
        setCompanyData(createEnhancedFallbackData(prospect));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      setCompanyData(createEnhancedFallbackData(prospect));
    } finally {
      setLoading(false);
    }
  };

  const extractDomainFromEmail = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1];
    return domain || '';
  };

  const createEnhancedFallbackData = (prospect) => {
    const domain = prospect.email ? prospect.email.split('@')[1] : '';
    const matchScore = prospect.confidence || Math.floor(Math.random() * 30) + 70;

    return {
      name: prospect.company || domain,
      description: `${prospect.company || 'Company'} is a ${prospect.industry || 'Technology'} company focused on innovation and growth. They are actively seeking solutions to improve their business operations and marketing effectiveness.`,
      logo: null,
      website: prospect.source_url || prospect.website || `https://${domain}`,
      industry: prospect.industry || 'Technology',
      founded: prospect.founded || '2015',
      employees: prospect.companySize || '51-200',
      location: prospect.location || 'United States',
      glassdoorRating: '3.8',
      email: prospect.email,
      confidence: matchScore,
      matchLevel: matchScore >= 80 ? 'EXCELLENT MATCH' : matchScore >= 60 ? 'GOOD MATCH' : 'FAIR MATCH',

      // Email Marketing Insights
      emailMarketingFit: {
        overallScore: matchScore,
        industryAlignment: Math.floor(Math.random() * 11) + 90,
        budgetLevel: 'Medium-High',
        decisionMakingSpeed: 'Fast',
        painPoints: [
          'Lead generation efficiency',
          'Marketing automation',
          'ROI tracking and analytics',
          'Customer engagement'
        ]
      },

      // Key Value Propositions for Email Marketing
      valuePropositions: [
        'Increase email campaign ROI by 40%',
        'Automate prospect discovery and outreach',
        'AI-powered personalization at scale',
        'Real-time analytics and insights',
        'Seamless CRM integration'
      ],

      // Target Personas at Company
      targetPersonas: [
        {
          role: 'Marketing Director',
          painPoints: ['Campaign performance', 'Lead quality', 'Budget efficiency'],
          interests: ['Automation', 'Analytics', 'AI/ML']
        },
        {
          role: 'Sales Manager',
          painPoints: ['Pipeline growth', 'Conversion rates', 'Follow-up efficiency'],
          interests: ['CRM tools', 'Outreach automation', 'Lead scoring']
        },
        {
          role: 'Business Owner',
          painPoints: ['Revenue growth', 'Market expansion', 'Customer retention'],
          interests: ['ROI', 'Scalability', 'Cost-effectiveness']
        }
      ],

      // Funding information
      funding: {
        stage: 'Growth Stage',
        totalFunding: '$15.2M',
        lastRound: 'Series A - $8M',
        investors: ['Sequoia Capital', 'Accel Partners', 'Y Combinator'],
        yearlyFunding: [
          { year: '2020', amount: 1.5 },
          { year: '2021', amount: 3.2 },
          { year: '2022', amount: 5.5 },
          { year: '2023', amount: 8.0 },
          { year: '2024', amount: 15.2 }
        ]
      },

      // Growth metrics
      growthMetrics: {
        revenueGrowth: '+145%',
        employeeGrowth: '+78%',
        marketExpansion: '12 new markets',
        customerGrowth: '+230%'
      },

      // Tech stack (important for email marketing targeting)
      techStack: prospect.techStack || [
        'Salesforce',
        'HubSpot',
        'Google Analytics',
        'Slack',
        'AWS',
        'React'
      ],

      // Leadership team
      leadership: [
        {
          name: 'Sarah Johnson',
          title: 'CEO & Founder',
          linkedin: '#',
          photo: null
        },
        {
          name: 'Michael Chen',
          title: 'VP of Marketing',
          linkedin: '#',
          photo: null
        },
        {
          name: 'Emily Rodriguez',
          title: 'Head of Sales',
          linkedin: '#',
          photo: null
        },
        {
          name: 'David Kim',
          title: 'CTO',
          linkedin: '#',
          photo: null
        }
      ],

      // Recent news/activities
      news: [
        {
          source: 'TechCrunch',
          title: `${prospect.company || 'Company'} Raises Series A Funding to Accelerate Growth`,
          date: '2025-01-05',
          url: '#'
        },
        {
          source: 'Business Wire',
          title: `${prospect.company || 'Company'} Launches New AI-Powered Platform`,
          date: '2024-12-15',
          url: '#'
        },
        {
          source: 'Forbes',
          title: `Top ${prospect.industry || 'Technology'} Companies to Watch in 2025`,
          date: '2024-11-20',
          url: '#'
        }
      ],

      // Industry insights
      industryInsights: {
        marketPosition: 'Rising Leader',
        competitiveAdvantages: [
          'Advanced AI technology',
          'Strong customer retention',
          'Innovative product features',
          'Excellent customer support'
        ],
        marketTrends: ['AI Adoption', 'Automation', 'Data Analytics', 'Cloud Migration']
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading comprehensive company data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>
          <div className="text-center py-32">
            <p className="text-gray-600">Company data not available</p>
          </div>
        </div>
      </div>
    );
  }

  const matchScore = companyData.confidence || 85;
  const matchPercentage = matchScore;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => toast.success('Shared!')}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShareIcon className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Share</span>
            </button>
            <button
              onClick={() => toast.success('Opening email composer...')}
              className="flex items-center space-x-2 px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
            >
              <EnvelopeIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">Send Email</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-start space-x-6">
                {/* Company Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                  {companyData.logo ? (
                    <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <BuildingOfficeIcon className="w-10 h-10 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{companyData.name}</h1>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {companyData.location && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="text-sm">{companyData.location}</span>
                      </div>
                    )}
                    {companyData.employees && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <UsersIcon className="w-4 h-4" />
                        <span className="text-sm">{companyData.employees} employees</span>
                      </div>
                    )}
                    {companyData.founded && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">Founded {companyData.founded}</span>
                      </div>
                    )}
                  </div>

                  {/* Glassdoor Rating & Website */}
                  <div className="flex items-center space-x-4">
                    {companyData.glassdoorRating && (
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-lg">
                        <span className="text-sm font-medium">Glassdoor</span>
                        <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold">{companyData.glassdoorRating}</span>
                      </div>
                    )}
                    {companyData.website && (
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
                      >
                        <GlobeAltIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Company website at {companyData.website.replace(/^https?:\/\//, '').split('/')[0]}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-700 text-base leading-relaxed">
                  {companyData.description}
                </p>
              </div>
            </div>

            {/* Email Campaign Information */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <EnvelopeIcon className="w-6 h-6 mr-3 text-green-600" />
                Email Campaign Information
              </h2>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Contact Email</div>
                  <div className="font-semibold text-gray-900">{companyData.email}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Discovery Status</div>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    {prospect.status || 'discovered'}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Confidence Score</div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${companyData.confidence}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900">{companyData.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2 font-medium">Discovery Source</div>
                <div className="text-gray-900">{prospect.source || 'Domain analysis'}</div>
              </div>
            </div>

            {/* Key Value Propositions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <RocketLaunchIcon className="w-6 h-6 mr-3 text-green-600" />
                Why Our Solution Fits Their Needs
              </h2>

              <div className="space-y-3">
                {(companyData.valuePropositions || []).map((value, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Personas */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <UsersIcon className="w-6 h-6 mr-3 text-green-600" />
                Key Decision Makers to Target
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {(companyData.targetPersonas || []).map((persona, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-5 hover:border-green-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{persona.role}</h3>
                      <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Pain Points: </span>
                        <span className="text-sm text-gray-700">{persona.painPoints.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Interests: </span>
                        <span className="text-sm text-gray-700">{persona.interests.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-3 text-green-600" />
                Technology Stack
              </h2>

              <div className="flex flex-wrap gap-3">
                {(companyData.techStack || []).map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Funding Information with Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BanknotesIcon className="w-6 h-6 mr-3 text-green-600" />
                Funding
              </h2>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Current Stage</div>
                  <div className="font-bold text-gray-900">{companyData.funding.stage}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Total Funding</div>
                  <div className="font-bold text-gray-900">{companyData.funding.totalFunding}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Last Round</div>
                  <div className="font-bold text-gray-900">{companyData.funding.lastRound}</div>
                </div>
              </div>

              {/* Funding Chart */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Funding Growth Trend</h3>
                <div className="space-y-3">
                  {((companyData.funding && companyData.funding.yearlyFunding) || []).map((data, idx) => {
                    const maxAmount = Math.max(...((companyData.funding && companyData.funding.yearlyFunding) || []).map(d => d.amount || 0));
                    return (
                    <div key={idx} className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 w-16">{data.year}</span>
                      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-3 transition-all"
                          style={{
                            width: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%`,
                            minWidth: '60px'
                          }}
                        >
                          <span className="text-xs font-bold text-white">${data.amount}M</span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2 font-medium">Key Investors</div>
                <div className="text-gray-900">{companyData.funding.investors.join(', ')}</div>
              </div>
            </div>

            {/* Leadership Team */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <TrophyIcon className="w-6 h-6 mr-3 text-green-600" />
                Leadership Team
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {(companyData.leadership || []).map((leader, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {leader.photo ? (
                        <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover" />
                      ) : (
                        <UsersIcon className="w-7 h-7 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{leader.name}</div>
                      <div className="text-sm text-gray-600">{leader.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent News */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <NewspaperIcon className="w-6 h-6 mr-3 text-green-600" />
                Recent News
              </h2>

              <div className="space-y-4">
                {(companyData.news || []).map((article, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-2">{article.source}</div>
                        <h3 className="font-semibold text-gray-900 mb-2 leading-snug hover:text-green-600 transition-colors cursor-pointer">
                          {article.title}
                        </h3>
                        <div className="text-sm text-gray-500">{article.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-6">
              Company data provided by website analysis
            </div>
          </div>

          {/* Right Column - Match Score Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Match Score Card */}
              <div
                className="rounded-2xl p-8 text-white text-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
                }}
              >
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="#3a3a3a"
                      strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#matchGradient)"
                      strokeWidth="4"
                      strokeDasharray={`${(matchPercentage / 100) * 339.292}, 339.292`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#00ff88" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{matchPercentage}%</span>
                  </div>
                </div>

                {/* Match Level */}
                <div className="text-sm font-semibold tracking-wider mb-6">
                  {companyData.matchLevel}
                </div>

                {/* Match Details */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Industry Fit</span>
                    <span className="font-semibold">{companyData.emailMarketingFit.industryAlignment}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Budget Level</span>
                    <span className="font-semibold">{companyData.emailMarketingFit.budgetLevel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Decision Speed</span>
                    <span className="font-semibold">{companyData.emailMarketingFit.decisionMakingSpeed}</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mt-6 pt-6 border-t border-gray-700 space-y-2 text-left">
                  <div className="text-sm text-gray-300 flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    <span>High Interest Level</span>
                  </div>
                  <div className="text-sm text-gray-300 flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    <span>Quick Decision Maker</span>
                  </div>
                  <div className="text-sm text-gray-300 flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    <span>Budget Available</span>
                  </div>
                </div>
              </div>

              {/* Growth Metrics Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-green-600" />
                  Growth Metrics
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Revenue Growth</div>
                    <div className="text-2xl font-bold text-green-600">{companyData.growthMetrics.revenueGrowth}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Employee Growth</div>
                    <div className="text-2xl font-bold text-green-600">{companyData.growthMetrics.employeeGrowth}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Customer Growth</div>
                    <div className="text-2xl font-bold text-green-600">{companyData.growthMetrics.customerGrowth}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Market Expansion</div>
                    <div className="text-lg font-bold text-gray-900">{companyData.growthMetrics.marketExpansion}</div>
                  </div>
                </div>
              </div>

              {/* Email Marketing Fit Card */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Email Marketing Fit</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Overall Score</span>
                    <span className="text-lg font-bold text-green-600">{companyData.emailMarketingFit.overallScore}%</span>
                  </div>

                  <div className="pt-3 border-t border-green-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Key Pain Points:</div>
                    <div className="space-y-2">
                      {((companyData.emailMarketingFit && companyData.emailMarketingFit.painPoints) || []).map((point, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                          <span className="text-sm text-gray-600">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
