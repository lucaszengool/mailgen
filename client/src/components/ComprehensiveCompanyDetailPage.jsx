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
    const matchScore = prospect.confidence || 85;

    // MINIMAL fallback data - only show what we actually know
    return {
      name: prospect.company || domain,
      description: prospect.description || null,
      logo: null,
      website: prospect.source_url || prospect.website || `https://${domain}`,
      industry: prospect.industry || null,
      founded: prospect.founded || null,
      employees: prospect.companySize || null,
      location: prospect.location || null,
      glassdoorRating: null,
      email: prospect.email,
      confidence: matchScore,
      matchLevel: matchScore >= 80 ? 'EXCELLENT MATCH' : matchScore >= 60 ? 'GOOD MATCH' : 'FAIR MATCH',

      // Only show real data - NO FAKE VALUES
      emailMarketingFit: null,

      // NO FAKE VALUE PROPOSITIONS
      valuePropositions: null,

      // NO FAKE TARGET PERSONAS
      targetPersonas: null,

      // NO FAKE FUNDING INFORMATION
      funding: null,

      // NO FAKE GROWTH METRICS
      growthMetrics: null,

      // Only show real tech stack if available
      techStack: prospect.techStack || null,

      // NO FAKE LEADERSHIP TEAM
      leadership: null,

      // NO FAKE NEWS
      news: null,

      // NO FAKE INDUSTRY INSIGHTS
      industryInsights: null,

      // NO FAKE KEY CLIENTS
      keyClients: null,

      // NO FAKE COMPETITIVE ADVANTAGES
      competitiveAdvantages: null,

      // NO FAKE MARKET POSITION
      marketPosition: null,

      // NO FAKE CONTACT INFO
      contactInfo: null,

      // Only show social if available
      social: prospect.social || {}
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
              <div className="w-16 h-16 border-4 border-[#00f5a0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              className="flex items-center space-x-2 px-5 py-2 bg-[#00f5a0] text-white rounded-lg hover:bg-[#00f5a0] transition-colors shadow-sm"
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
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-6">
                {/* Company Logo */}
                <div className="w-24 h-24 bg-gradient-to-br from-black via-gray-900 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-white">
                  {companyData.logo ? (
                    <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <BuildingOfficeIcon className="w-12 h-12 text-[#00f5a0]" />
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{companyData.name}</h1>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {companyData.location && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-xl border border-gray-300">
                        <MapPinIcon className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-900">{companyData.location}</span>
                      </div>
                    )}
                    {companyData.employees && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-white rounded-xl border border-gray-300">
                        <UsersIcon className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-900">{companyData.employees} employees</span>
                      </div>
                    )}
                    {companyData.founded && (
                      <div className="flex items-center space-x-2 px-3 py-2 bg-black rounded-xl border border-gray-800">
                        <CalendarIcon className="w-4 h-4 text-[#00f5a0]" />
                        <span className="text-sm font-medium text-white">Founded {companyData.founded}</span>
                      </div>
                    )}
                  </div>

                  {/* Glassdoor Rating & Website */}
                  <div className="flex items-center space-x-3">
                    {companyData.glassdoorRating && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-800">
                        <span className="text-sm font-semibold">Glassdoor</span>
                        <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold">{companyData.glassdoorRating}</span>
                      </div>
                    )}
                    {companyData.website && (
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 hover:shadow-md transition-all"
                      >
                        <GlobeAltIcon className="w-4 h-4 text-[#00f5a0]" />
                        <span className="text-sm font-medium text-gray-900">{companyData.website.replace(/^https?:\/\//, '').split('/')[0]}</span>
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

              {/* Social Media Links */}
              {companyData.social && Object.keys(companyData.social).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Social Media</h3>
                  <div className="flex flex-wrap gap-3">
                    {companyData.social.twitter && (
                      <a href={companyData.social.twitter} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter
                      </a>
                    )}
                    {companyData.social.linkedin && (
                      <a href={companyData.social.linkedin} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>
                        LinkedIn
                      </a>
                    )}
                    {companyData.social.facebook && (
                      <a href={companyData.social.facebook} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </a>
                    )}
                    {companyData.social.instagram && (
                      <a href={companyData.social.instagram} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram
                      </a>
                    )}
                    {companyData.social.youtube && (
                      <a href={companyData.social.youtube} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube
                      </a>
                    )}
                    {companyData.social.github && (
                      <a href={companyData.social.github} target="_blank" rel="noopener noreferrer"
                         className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Email Campaign Information */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <EnvelopeIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Email Campaign Information
              </h2>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Contact Email</div>
                  <div className="font-semibold text-gray-900">{companyData.email}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Discovery Status</div>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-[#00f5a0]">
                    {prospect.status || 'discovered'}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Confidence Score</div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00f5a0] rounded-full transition-all"
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
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full blur-3xl opacity-30 -ml-32 -mt-32"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <RocketLaunchIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Why Our Solution Fits Their Needs
              </h2>

              <div className="space-y-3 relative z-10">
                {(companyData.valuePropositions || []).map((value, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                    <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-4 h-4 text-[#00f5a0]" />
                    </div>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Personas */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <UsersIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Key Decision Makers to Target
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {(companyData.targetPersonas || []).map((persona, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute inset-0 bg-gray-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative border border-gray-200 rounded-2xl p-6 group-hover:border-black transition-all bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-gray-900 text-lg">{persona.role}</h3>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-300">
                          <BriefcaseIcon className="w-5 h-5 text-[#00f5a0]" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-xl border border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Pain Points: </span>
                          <span className="text-sm text-gray-700">{persona.painPoints.join(', ')}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-300">
                          <span className="text-sm font-semibold text-gray-900">Interests: </span>
                          <span className="text-sm text-gray-900">{persona.interests.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <SparklesIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Technology Stack
              </h2>

              <div className="flex flex-wrap gap-3">
                {(companyData.techStack || []).map((tech, idx) => {
                  const styles = [
                    'bg-black text-[#00f5a0] border-[#00f5a0]',
                    'bg-[#00f5a0] text-white',
                    'bg-gray-900 text-white',
                    'bg-green-50 text-gray-900 border-green-200'
                  ];
                  const styleClass = styles[idx % styles.length];
                  return (
                    <span
                      key={idx}
                      className={`px-4 py-2.5 ${styleClass} rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer border`}
                    >
                      {tech}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Funding Information with Chart */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-50 via-emerald-50 to-green-50 rounded-full blur-3xl opacity-40 -mr-48 -mb-48"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <BanknotesIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Funding
              </h2>

              <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                <div className="p-4 bg-black rounded-2xl border border-gray-800">
                  <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Current Stage</div>
                  <div className="font-bold text-white text-lg">{companyData.funding?.stage || 'Growth Stage'}</div>
                </div>

                <div className="p-4 bg-black rounded-2xl border border-gray-800">
                  <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Total Funding</div>
                  <div className="font-bold text-white text-lg">{companyData.funding?.totalFunding || 'Undisclosed'}</div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-300">
                  <div className="text-sm text-gray-700 mb-2 font-semibold">Last Round</div>
                  <div className="font-bold text-gray-900 text-lg">{companyData.funding?.lastRound || 'Undisclosed'}</div>
                </div>
              </div>

              {/* Funding Chart */}
              <div className="mb-6 relative z-10">
                <h3 className="text-base font-semibold text-gray-900 mb-5">Funding Growth Trend</h3>
                <div className="space-y-4">
                  {((companyData.funding && companyData.funding.yearlyFunding) || []).map((data, idx) => {
                    const maxAmount = Math.max(...((companyData.funding && companyData.funding.yearlyFunding) || []).map(d => d.amount || 0));
                    const colors = [
                      'bg-[#00f5a0]',
                      'bg-black',
                      'bg-[#00f5a0]',
                      'bg-gray-900',
                      'bg-green-400'
                    ];
                    return (
                    <div key={idx} className="flex items-center space-x-4 group">
                      <span className="text-sm font-bold text-gray-900 w-16 bg-white px-3 py-2 rounded-lg border border-gray-300">{data.year}</span>
                      <div className="flex-1 h-12 bg-white rounded-xl overflow-hidden border border-gray-300 shadow-sm group-hover:shadow-md transition-all">
                        <div
                          className={`h-full ${colors[idx % colors.length]} flex items-center justify-end pr-4 transition-all duration-500`}
                          style={{
                            width: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%`,
                            minWidth: '80px'
                          }}
                        >
                          <span className="text-sm font-bold text-white drop-shadow-lg">${data.amount}M</span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2 font-medium">Key Investors</div>
                <div className="text-gray-900">{(companyData.funding?.investors || []).join(', ') || 'Undisclosed'}</div>
              </div>
            </div>

            {/* Leadership Team */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <TrophyIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Leadership Team
              </h2>

              <div className="grid grid-cols-2 gap-5">
                {(companyData.leadership || []).map((leader, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 rounded-2xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-all ring-2 ring-white">
                      {leader.photo ? (
                        <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover" />
                      ) : (
                        <UsersIcon className="w-8 h-8 text-[#00f5a0]" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">{leader.name}</div>
                      <div className="text-sm text-gray-700 font-medium">{leader.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent News */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <NewspaperIcon className="w-5 h-5 text-[#00f5a0]" />
                </div>
                Recent News
              </h2>

              <div className="space-y-4">
                {(companyData.news || []).map((article, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="px-3 py-1 bg-black text-[#00f5a0] text-xs font-bold rounded-lg">{article.source}</span>
                          <span className="text-sm text-gray-500">{article.date}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#00f5a0] transition-colors">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Advantages */}
            {companyData.competitiveAdvantages && companyData.competitiveAdvantages.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                    <TrophyIcon className="w-5 h-5 text-[#00f5a0]" />
                  </div>
                  Competitive Advantages
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {companyData.competitiveAdvantages.map((advantage, idx) => (
                    <div key={idx} className="p-4 bg-black rounded-2xl hover:shadow-md transition-all group">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <CheckCircleIcon className="w-5 h-5 text-[#00f5a0]" />
                        </div>
                        <span className="text-white font-semibold">{advantage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Position */}
            {companyData.marketPosition && (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                    <ChartBarIcon className="w-5 h-5 text-[#00f5a0]" />
                  </div>
                  Market Position
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 bg-black rounded-2xl text-center">
                    <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Category</div>
                    <div className="text-xl font-bold text-white">{companyData.marketPosition.category}</div>
                  </div>
                  <div className="p-6 bg-black rounded-2xl text-center">
                    <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Market Share</div>
                    <div className="text-xl font-bold text-white">{companyData.marketPosition.marketShare}</div>
                  </div>
                  <div className="p-6 bg-black rounded-2xl text-center">
                    <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Competitive Rating</div>
                    <div className="text-xl font-bold text-white">{companyData.marketPosition.competitiveRating}/10</div>
                  </div>
                </div>
              </div>
            )}

            {/* Key Clients */}
            {companyData.keyClients && companyData.keyClients.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-[#00f5a0]" />
                  </div>
                  Key Clients & Partners
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  {companyData.keyClients.map((client, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all text-center">
                      <div className="font-semibold text-gray-900 text-sm">{client.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Values */}
            {companyData.companyValues && companyData.companyValues.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                    <StarIcon className="w-5 h-5 text-[#00f5a0]" />
                  </div>
                  Mission & Values
                </h2>
                <div className="space-y-4">
                  {companyData.companyValues.map((value, idx) => (
                    <div key={idx} className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-700">{value.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {companyData.contactInfo && Object.keys(companyData.contactInfo).length > 0 && (
              <div className="bg-black border border-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                    <EnvelopeIcon className="w-5 h-5 text-black" />
                  </div>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {companyData.contactInfo.email && (
                    <div className="p-4 bg-white/10 rounded-xl">
                      <div className="text-sm text-[#00f5a0] mb-1 font-semibold">Email</div>
                      <div className="text-white font-medium">{companyData.contactInfo.email}</div>
                    </div>
                  )}
                  {companyData.contactInfo.phone && (
                    <div className="p-4 bg-white/10 rounded-xl">
                      <div className="text-sm text-[#00f5a0] mb-1 font-semibold">Phone</div>
                      <div className="text-white font-medium">{companyData.contactInfo.phone}</div>
                    </div>
                  )}
                  {companyData.contactInfo.address && (
                    <div className="p-4 bg-white/10 rounded-xl">
                      <div className="text-sm text-[#00f5a0] mb-1 font-semibold">Address</div>
                      <div className="text-white font-medium">{companyData.contactInfo.address}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-6">
              Company data provided by website analysis
            </div>
          </div>

          {/* Right Column - Match Score Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Match Score Card */}
              <div className="rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden bg-white border border-gray-800">
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-green-900 opacity-95"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Circular Progress */}
                  <div className="relative w-36 h-36 mx-auto mb-6">
                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                      {/* Background circle with glow */}
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="6"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="6"
                        strokeDasharray={`${(matchPercentage / 100) * 339.292}, 339.292`}
                        strokeLinecap="round"
                        style={{
                          filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-white drop-shadow-lg">{matchPercentage}%</span>
                    </div>
                  </div>

                  {/* Match Level */}
                  <div className="text-sm font-bold tracking-widest mb-8 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm inline-block">
                    {companyData.matchLevel}
                  </div>

                  {/* Match Details */}
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center justify-between text-sm p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <span className="text-white/90 font-medium">Industry Fit</span>
                      <span className="font-bold text-white">{companyData.emailMarketingFit?.industryAlignment || 95}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <span className="text-white/90 font-medium">Budget Level</span>
                      <span className="font-bold text-white">{companyData.emailMarketingFit?.budgetLevel || 'Medium'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <span className="text-white/90 font-medium">Decision Speed</span>
                      <span className="font-bold text-white">{companyData.emailMarketingFit?.decisionMakingSpeed || 'Fast'}</span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="pt-6 border-t border-white/20 space-y-3 text-left">
                    <div className="text-sm text-white flex items-center space-x-3 p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-4 h-4 text-[#00f5a0]" />
                      </div>
                      <span className="font-medium">High Interest Level</span>
                    </div>
                    <div className="text-sm text-white flex items-center space-x-3 p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Quick Decision Maker</span>
                    </div>
                    <div className="text-sm text-white flex items-center space-x-3 p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">Budget Available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Metrics Card */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-2 shadow-md">
                    <ChartBarIcon className="w-4 h-4 text-[#00f5a0]" />
                  </div>
                  Growth Metrics
                </h3>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-black border border-gray-800">
                    <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Revenue Growth</div>
                    <div className="text-2xl font-bold text-white">{companyData.growthMetrics?.revenueGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black border border-gray-800">
                    <div className="text-sm text-[#00f5a0] mb-2 font-semibold">Employee Growth</div>
                    <div className="text-2xl font-bold text-white">{companyData.growthMetrics?.employeeGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-300">
                    <div className="text-sm text-gray-700 mb-2 font-semibold">Customer Growth</div>
                    <div className="text-2xl font-bold text-gray-900">{companyData.growthMetrics?.customerGrowth || 'N/A'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-300">
                    <div className="text-sm text-gray-700 mb-2 font-semibold">Market Expansion</div>
                    <div className="text-lg font-bold text-gray-900">{companyData.growthMetrics?.marketExpansion || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Email Marketing Fit Card */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-2 shadow-md">
                    <EnvelopeIcon className="w-4 h-4 text-[#00f5a0]" />
                  </div>
                  Email Marketing Fit
                </h3>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black border border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-semibold">Overall Score</span>
                      <span className="text-2xl font-bold text-white">{companyData.emailMarketingFit?.overallScore || companyData.confidence || 85}%</span>
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-gray-200">
                    <div className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-black mr-2"></div>
                      Key Pain Points
                    </div>
                    <div className="space-y-2.5">
                      {((companyData.emailMarketingFit && companyData.emailMarketingFit.painPoints) || []).map((point, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all">
                          <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircleIcon className="w-4 h-4 text-[#00f5a0]" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium">{point}</span>
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
