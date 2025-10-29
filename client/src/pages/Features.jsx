import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, Target, BarChart3, Clock, Shield, Globe, Zap } from 'lucide-react';

const FeaturesPage = () => {
  const features = [
    {
      icon: <Mail className="w-8 h-8" />,
      color: 'green',
      title: 'AI-Powered Email Generation',
      description: 'Create personalized emails for every prospect using advanced AI that understands context, tone, and your brand voice.',
      benefits: ['Personalized at scale', 'Multiple templates', 'A/B testing built-in', 'Brand voice learning']
    },
    {
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
      title: 'Smart Prospect Matching',
      description: 'AI analyzes 80M+ prospects to find perfect matches based on industry, role, company signals, and engagement patterns.',
      benefits: ['80M+ prospect database', 'AI-powered matching', 'Real-time updates', 'Custom filters']
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'purple',
      title: 'Advanced Analytics',
      description: 'Track every metric that matters. Understand what works and optimize campaigns with actionable insights.',
      benefits: ['Real-time dashboards', 'Engagement tracking', 'ROI calculation', 'Export reports']
    },
    {
      icon: <Clock className="w-8 h-8" />,
      color: 'orange',
      title: 'Automated Follow-ups',
      description: 'Never let a lead go cold. AI automatically sends perfectly timed follow-ups based on engagement signals.',
      benefits: ['Smart timing', 'Engagement triggers', 'Custom sequences', 'Auto-pause on reply']
    },
    {
      icon: <Shield className="w-8 h-8" />,
      color: 'red',
      title: 'Email Deliverability',
      description: 'Maximize inbox placement with AI-powered spam detection, domain warming, and compliance checking.',
      benefits: ['Spam score checking', 'Domain health monitoring', 'Bounce handling', 'List cleaning']
    },
    {
      icon: <Globe className="w-8 h-8" />,
      color: 'teal',
      title: 'Multi-Channel Campaigns',
      description: 'Reach prospects across email, LinkedIn, and more. Coordinate multi-touch campaigns from one dashboard.',
      benefits: ['Email + LinkedIn', 'Unified inbox', 'Cross-channel analytics', 'Sequence coordination']
    },
    {
      icon: <Zap className="w-8 h-8" />,
      color: 'yellow',
      title: 'CRM Integration',
      description: 'Connect with Salesforce, HubSpot, Pipedrive, and more. All data syncs automatically in real-time.',
      benefits: ['20+ CRM integrations', 'Two-way sync', 'Custom field mapping', 'Webhook support']
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      color: 'pink',
      title: 'AI Insights & Coaching',
      description: 'Get personalized recommendations to improve your campaigns. AI learns from your best-performing emails.',
      benefits: ['Performance insights', 'Writing suggestions', 'Best time to send', 'A/B test recommendations']
    }
  ];

  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    pink: 'bg-pink-100 text-pink-600'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
              All Features
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Everything You Need to Scale Your Email Marketing
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              From AI-powered prospecting to advanced analytics, we've built the complete platform for modern email marketing teams.
            </p>
            <Link
              to="/start"
              className="inline-block px-10 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 text-lg"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How We Compare
            </h2>
            <p className="text-xl text-gray-600">
              See why leading teams choose our platform
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-900 font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-gray-900 font-semibold">Our Platform</th>
                  <th className="px-6 py-4 text-center text-gray-900 font-semibold">Others</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  ['AI-Powered Prospect Discovery', true, false],
                  ['Personalized Email Generation', true, 'Limited'],
                  ['Automated Follow-up Sequences', true, true],
                  ['Real-Time Analytics', true, 'Basic'],
                  ['CRM Integration', '20+ platforms', '5-10 platforms'],
                  ['Multi-Channel Campaigns', true, false],
                  ['AI Insights & Coaching', true, false],
                  ['24/7 Support', true, 'Business hours']
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{row[0]}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row[1] === 'boolean' ? (
                        row[1] ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-900 font-medium">{row[1]}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row[2] === 'boolean' ? (
                        row[2] ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-600">{row[2]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <Link
            to="/start"
            className="inline-block px-10 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl text-lg"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
