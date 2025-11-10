import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Building2, MapPin, Users, Calendar,
  Globe, Linkedin, Twitter, Facebook, TrendingUp,
  DollarSign, Award, Briefcase, Mail, Phone,
  ExternalLink, Star, CheckCircle, AlertCircle
} from 'lucide-react';
import { apiGet } from '../utils/apiClient';

/**
 * Comprehensive Company Detail Page
 * Displays detailed company information in a clean white layout with green accents
 */
export default function CompanyDetailPage({ prospect, onBack }) {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
      // Extract company domain from prospect data
      const domain = prospect.source_url || prospect.website || extractDomainFromEmail(prospect.email);

      console.log('🏢 Fetching company data for:', domain);

      // Call backend API to fetch company information
      const response = await apiGet(`/api/company/info?domain=${encodeURIComponent(domain)}`);

      if (response.success) {
        setCompanyData(response.data);
      } else {
        // Fallback to prospect data if API fails
        setCompanyData(createFallbackCompanyData(prospect));
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      setError(error.message);
      // Use prospect data as fallback
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
      email: prospect.email,
      emailStatus: prospect.status || 'discovered',
      emailSource: prospect.source || 'Email discovery',
      confidence: prospect.confidence || 85,
      social: {},
      funding: null,
      leadership: [],
      news: []
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Prospects</span>
        </button>

        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="min-h-screen bg-white p-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 mb-6 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Prospects</span>
        </button>

        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Failed to load company information</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back to Prospects</span>
            </button>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Send Email</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'company'
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Company
              {activeTab === 'company' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab companyData={companyData} prospect={prospect} />
        )}
        {activeTab === 'company' && (
          <CompanyTab companyData={companyData} prospect={prospect} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ companyData, prospect }) {
  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-6">
          {/* Company Logo */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            {companyData.logo ? (
              <img src={companyData.logo} alt={companyData.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Building2 className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{companyData.name}</h1>
              {companyData.verified && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3 mb-4">
              {companyData.social?.twitter && (
                <a href={companyData.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-500">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {companyData.social?.linkedin && (
                <a href={companyData.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-500">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {companyData.social?.facebook && (
                <a href={companyData.social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-500">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed max-w-3xl">
              {companyData.description}
            </p>
          </div>
        </div>

        {/* Quick Info Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 min-w-[280px]">
          <div className="space-y-4">
            {companyData.founded && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Founded in</div>
                  <div className="font-semibold">{companyData.founded}</div>
                </div>
              </div>
            )}

            {companyData.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-semibold">{companyData.location}</div>
                </div>
              </div>
            )}

            {companyData.employees && (
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Employees</div>
                  <div className="font-semibold">{companyData.employees}</div>
                </div>
              </div>
            )}

            {companyData.website && (
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500">Website</div>
                  <a
                    href={companyData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-green-600 hover:text-green-700 truncate block"
                  >
                    {companyData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Campaign Info */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-green-600" />
          Email Campaign Information
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Contact Email</div>
            <div className="font-semibold text-gray-900">{prospect.email}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Discovery Status</div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                prospect.status === 'sent'
                  ? 'bg-blue-100 text-blue-700'
                  : prospect.status === 'replied'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {prospect.status || 'discovered'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Confidence Score</div>
            <div className="flex items-center space-x-2">
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

        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="text-sm text-gray-600 mb-2">Discovery Source</div>
          <div className="font-medium text-gray-900">{companyData.emailSource}</div>
        </div>
      </div>

      {/* Funding Section */}
      {companyData.funding && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Funding</h2>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-2">Current Stage</div>
              <div className="font-semibold text-gray-900">{companyData.funding.stage || 'Growth Stage'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Key Investors</div>
              <div className="font-semibold text-gray-900">{companyData.funding.investors || 'Onex'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Last Round</div>
              <div className="font-semibold text-gray-900">
                {companyData.funding.lastRound || 'Private Equity'}
              </div>
            </div>
          </div>

          {companyData.funding.totalFunding && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">Total Funding</div>
              <div className="font-semibold text-gray-900">{companyData.funding.totalFunding}</div>
            </div>
          )}
        </div>
      )}

      {/* Leadership Team */}
      {companyData.leadership && companyData.leadership.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Leadership Team</h2>

          <div className="grid grid-cols-2 gap-6">
            {companyData.leadership.map((leader, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {leader.name}
                    {leader.linkedin && (
                      <a href={leader.linkedin} target="_blank" rel="noopener noreferrer" className="ml-2">
                        <Linkedin className="w-4 h-4 text-gray-400 hover:text-green-500" />
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{leader.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent News */}
      {companyData.news && companyData.news.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent News</h2>

          <div className="space-y-4">
            {companyData.news.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border-2 border-transparent transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">{article.source}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <div className="text-sm text-gray-500">{article.date}</div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Company Tab Component
function CompanyTab({ companyData, prospect }) {
  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Company Details</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Industry</h3>
            <p className="text-gray-700">{companyData.industry || 'Technology'}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{companyData.description}</p>
          </div>

          {companyData.specialties && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {companyData.specialties.map((specialty, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {companyData.products && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Products & Services</h3>
              <ul className="space-y-2">
                {companyData.products.map((product, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{product}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>

        <div className="space-y-4">
          {prospect.email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <a href={`mailto:${prospect.email}`} className="font-medium text-green-600 hover:text-green-700">
                  {prospect.email}
                </a>
              </div>
            </div>
          )}

          {prospect.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <a href={`tel:${prospect.phone}`} className="font-medium text-green-600 hover:text-green-700">
                  {prospect.phone}
                </a>
              </div>
            </div>
          )}

          {companyData.website && (
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Website</div>
                <a
                  href={companyData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-600 hover:text-green-700"
                >
                  {companyData.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
