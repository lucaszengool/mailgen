import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, Shield, Zap, Award, BarChart3, Globe } from 'lucide-react';

const ForBusinessesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                For Enterprise Teams
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Scale Your Marketing Team with AI
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Enterprise-grade email marketing automation built for teams that need security, compliance, and performance at scale.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/start"
                  className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
                >
                  Request Demo
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
                <div className="text-gray-600">Enterprise Clients</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">98%</div>
                <div className="text-gray-600">Customer Satisfaction</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">10M+</div>
                <div className="text-gray-600">Emails Sent Monthly</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Enterprise Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything your team needs to succeed at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                color: 'green',
                title: 'Security & Compliance',
                description: 'SOC 2 Type II, GDPR, HIPAA compliant. Enterprise-grade security for your data.'
              },
              {
                icon: <Users className="w-8 h-8" />,
                color: 'blue',
                title: 'Team Management',
                description: 'Role-based access, team collaboration, and shared templates for your organization.'
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                color: 'purple',
                title: 'Advanced Analytics',
                description: 'Custom dashboards, team performance metrics, and exportable reports.'
              },
              {
                icon: <Globe className="w-8 h-8" />,
                color: 'orange',
                title: 'Global Infrastructure',
                description: '99.99% uptime SLA, multi-region deployment, and dedicated infrastructure.'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                color: 'teal',
                title: 'API & Integrations',
                description: 'REST API, webhooks, and 50+ native integrations with enterprise tools.'
              },
              {
                icon: <Award className="w-8 h-8" />,
                color: 'pink',
                title: 'Dedicated Support',
                description: '24/7 phone & email support, dedicated account manager, and onboarding.'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                color: 'indigo',
                title: 'Scalability',
                description: 'Handle millions of emails per month with guaranteed deliverability.'
              },
              {
                icon: <Building2 className="w-8 h-8" />,
                color: 'red',
                title: 'Custom Solutions',
                description: 'Tailored features, custom integrations, and white-label options.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4 text-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Growing Teams
            </h2>
            <p className="text-xl text-gray-600">
              See how different teams use our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Sales Teams',
                description: 'Generate qualified leads, personalize outreach at scale, and track pipeline progress.',
                metrics: ['3x more meetings', '40% higher response rate', '2x faster sales cycle']
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Marketing Teams',
                description: 'Run multi-channel campaigns, segment audiences, and measure ROI with precision.',
                metrics: ['50% more conversions', '10x campaign volume', '90% time saved']
              },
              {
                icon: <Building2 className="w-6 h-6" />,
                title: 'Agencies',
                description: 'Manage multiple clients, white-label solutions, and deliver measurable results.',
                metrics: ['5x more clients', 'Automated reporting', 'Full white-label']
              }
            ].map((useCase, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  {useCase.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <div className="space-y-2">
                  {useCase.metrics.map((metric, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ companies scaling their marketing with AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                quote: "This platform has transformed how we do outbound. We've 3x'd our pipeline in 6 months.",
                author: "Sarah Chen",
                role: "VP of Sales, TechCorp",
                company: "Series B SaaS"
              },
              {
                quote: "The AI personalization is incredible. Our response rates jumped from 8% to 34%.",
                author: "Michael Torres",
                role: "Head of Marketing, GrowthCo",
                company: "Fast-growing startup"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
                <svg className="w-10 h-10 text-green-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <p className="text-lg text-gray-900 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-12 items-center grayscale opacity-60">
            <div className="text-3xl font-bold text-gray-400">Microsoft</div>
            <div className="text-3xl font-bold text-gray-400">Google</div>
            <div className="text-3xl font-bold text-gray-400">Salesforce</div>
            <div className="text-3xl font-bold text-gray-400">Stripe</div>
            <div className="text-3xl font-bold text-gray-400">Adobe</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-br from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Scale Your Marketing?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Talk to our team about enterprise pricing and features
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/start"
              className="px-10 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl text-lg"
            >
              Request Demo
            </Link>
            <button className="px-10 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForBusinessesPage;
