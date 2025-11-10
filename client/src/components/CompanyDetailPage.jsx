import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Building2, MapPin, Users, Calendar,
  Globe, Linkedin, Twitter, Facebook, TrendingUp,
  DollarSign, Award, Briefcase, Mail, Phone,
  ExternalLink, Star, CheckCircle, AlertCircle, Share2,
  BarChart3, PieChart, Clock, Newspaper, Target
} from 'lucide-react';
import { apiGet } from '../utils/apiClient';

/**
 * Comprehensive Company Detail Page - Matches reference design
 * Single overview page with all information, charts, and data
 */
export default function CompanyDetailPage({ prospect, onBack }) {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prospect) {
      fetchCompanyData();
    }
  }, [prospect]);

  const fetchCompanyData = async () => {
    setLoading(true);
    setError(null);

    try {
      const domain = prospect.source_url || prospect.website || extractDomainFromEmail(prospect.email);
      console.log('🏢 Fetching comprehensive company data for:', domain);

      const response = await apiGet(`/api/company/info?domain=${encodeURIComponent(domain)}`);

      if (response.success) {
        setCompanyData(response.data);
      } else {
        setCompanyData(createFallbackCompanyData(prospect));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      setError(error.message);
      setCompanyData(createFallbackCompanyData(prospect));
    } finally {
      setLoading(false);
    }
  };

  const extractDomainFromEmail = (email) => {
    if (!email) return '';
    const domain = email.split('@')[1];
    return `https://${domain}`;
  };

  const createFallbackCompanyData = (prospect) => {
    const domain = prospect.email ? prospect.email.split('@')[1] : '';
    return {
      name: prospect.company || domain,
      description: `${prospect.company || 'Company'} in the ${prospect.industry || 'Technology'} industry.`,
      logo: null,
      website: prospect.source_url || prospect.website || `https://${domain}`,
      industry: prospect.industry || 'Technology',
      founded: null,
      employees: null,
      location: null,
      rating: null,
      email: prospect.email,
      emailStatus: prospect.status || 'discovered',
      emailSource: prospect.source || 'Email discovery',
      confidence: prospect.confidence || 85,
      social: {},
      funding: { stage: 'Unknown', investors: [], totalFunding: 'Undisclosed', rounds: [] },
      leadership: [],
      news: [],
      industryTrends: { fields: [], yearlyData: [] },
      products: [],
      specialties: []
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button onClick={onBack} className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading company information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Prospects</span>
          </button>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Send Email</span>
            </button>
          </div>
        </div>

        {/* Company Header Section */}
        <div className="mb-8">
          <div className="flex items-start space-x-6 mb-6">
            {/* Company Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              {companyData.logo ? (
                <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-white" />
              )}
            </div>

            {/* Company Name and Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyData.name}</h1>

              {/* Social Links */}
              <div className="flex items-center space-x-3 mb-3">
                {companyData.social?.twitter && (
                  <a href={companyData.social.twitter} target="_blank" rel="noopener noreferrer"
                     className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Twitter className="w-4 h-4 text-gray-700" />
                  </a>
                )}
                {companyData.social?.linkedin && (
                  <a href={companyData.social.linkedin} target="_blank" rel="noopener noreferrer"
                     className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Linkedin className="w-4 h-4 text-gray-700" />
                  </a>
                )}
                {companyData.rating && (
                  <div className="flex items-center space-x-1 px-3 py-1 bg-black text-white rounded-lg text-sm font-medium">
                    <span>Glassdoor</span>
                    <Star className="w-3 h-3 fill-current" />
                    <span>{companyData.rating}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-base leading-relaxed mb-4 max-w-4xl">
                {companyData.description}
              </p>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 min-w-[280px]">
              <div className="space-y-3">
                {companyData.founded && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Founded in {companyData.founded}</div>
                    </div>
                  </div>
                )}

                {companyData.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">{companyData.location}</div>
                    </div>
                  </div>
                )}

                {companyData.employees && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">{companyData.employees} employees</div>
                    </div>
                  </div>
                )}

                {companyData.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={companyData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-green-600 truncate block"
                      >
                        {companyData.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Campaign Information */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Email Campaign Information</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-sm text-gray-600 mb-2">Contact Email</div>
                <div className="font-medium text-gray-900">{prospect.email}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Discovery Status</div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  prospect.status === 'sent'
                    ? 'bg-blue-100 text-blue-700'
                    : prospect.status === 'replied'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {prospect.status || 'discovered'}
                </span>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Confidence Score</div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${companyData.confidence || 85}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900">{companyData.confidence || 85}%</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Discovery Source</div>
              <div className="text-gray-900">{companyData.emailSource}</div>
            </div>
          </div>
        </div>

        {/* Industry Trends Section (like H1B Sponsorship in reference) */}
        {companyData.industryTrends && (companyData.industryTrends.fields?.length > 0 || companyData.industryTrends.yearlyData?.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Industry Trends</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Fields Distribution */}
                {companyData.industryTrends.fields?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Distribution of Different Business Fields</h3>
                    <div className="space-y-3">
                      {companyData.industryTrends.fields.map((field, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-sm text-gray-700">{field.name}</span>
                          <span className="text-sm text-gray-500">({field.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Yearly Trends */}
                {companyData.industryTrends.yearlyData?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Growth Trends</h3>
                    <div className="space-y-2">
                      {companyData.industryTrends.yearlyData.map((data, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700 w-16">{data.year}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-green-500 flex items-center justify-end pr-2"
                              style={{ width: `${(data.value / Math.max(...companyData.industryTrends.yearlyData.map(d => d.value))) * 100}%` }}
                            >
                              <span className="text-xs font-medium text-white">{data.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Funding Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Funding</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-sm text-gray-600 mb-2">Current Stage</div>
                <div className="font-medium text-gray-900">{companyData.funding?.stage || 'Growth Stage'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Key Investors</div>
                <div className="font-medium text-gray-900">
                  {Array.isArray(companyData.funding?.investors) && companyData.funding.investors.length > 0
                    ? companyData.funding.investors.join(', ')
                    : companyData.funding?.investors || 'Undisclosed'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">Last Round</div>
                <div className="font-medium text-gray-900">{companyData.funding?.lastRound || 'Undisclosed'}</div>
              </div>
            </div>

            {companyData.funding?.totalFunding && (
              <div className="mt-5 pt-5 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Funding</div>
                <div className="font-medium text-gray-900">{companyData.funding.totalFunding}</div>
              </div>
            )}
          </div>
        </div>

        {/* Leadership Team */}
        {companyData.leadership && companyData.leadership.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leadership Team</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-6">
                {companyData.leadership.map((leader, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {leader.photo ? (
                        <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{leader.name}</span>
                        {leader.linkedin && (
                          <a href={leader.linkedin} target="_blank" rel="noopener noreferrer"
                             className="text-gray-400 hover:text-green-500">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{leader.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent News */}
        {companyData.news && companyData.news.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent News</h2>
            <div className="space-y-4">
              {companyData.news.map((article, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-2">{article.source}</div>
                      <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{article.title}</h3>
                      <div className="text-sm text-gray-500">{article.date}</div>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex-shrink-0 text-gray-400 hover:text-green-500"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Attribution */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Company data provided by website analysis
        </div>
      </div>
    </div>
  );
}
