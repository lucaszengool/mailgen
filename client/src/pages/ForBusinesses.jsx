import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, Shield, Zap, Award, BarChart3, Globe, Check } from 'lucide-react';

const ForBusinessesPage = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
                   style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
                <Building2 className="w-4 h-4 mr-2" />
                For Enterprise Teams
              </div>
              <h1 className="text-5xl font-semibold mb-6 leading-tight"
                  style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                Scale Your Marketing Team with AI
              </h1>
              <p className="text-lg mb-8 leading-relaxed"
                 style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px', lineHeight: '1.7' }}>
                Enterprise-grade email marketing automation built for teams that need security, compliance, and performance at scale.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/start"
                  className="px-8 py-3 font-semibold rounded-lg transition-all"
                  style={{
                    backgroundColor: '#00f0a0',
                    color: '#001529',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                >
                  Request Demo
                </Link>
                <button
                  className="px-8 py-3 font-semibold rounded-lg transition-all"
                  style={{
                    border: '1px solid #d9d9d9',
                    color: 'rgba(0, 0, 0, 0.88)',
                    backgroundColor: 'white',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '500+', label: 'Enterprise Clients' },
                { value: '98%', label: 'Customer Satisfaction' },
                { value: '10M+', label: 'Emails Sent Monthly' },
                { value: '24/7', label: 'Enterprise Support' }
              ].map((stat, index) => (
                <div key={index} className="rounded-xl p-6 text-center"
                     style={{
                       backgroundColor: 'white',
                       border: '1px solid #f0f0f0',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                     }}>
                  <div className="text-4xl font-bold mb-2" style={{ color: '#00f0a0' }}>
                    {stat.value}
                  </div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Enterprise-Grade Features
            </h2>
            <p className="text-lg max-w-3xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Everything your team needs to succeed at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="w-7 h-7" />,
                title: 'Security & Compliance',
                description: 'SOC 2 Type II, GDPR, HIPAA compliant. Enterprise-grade security for your data.'
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Team Management',
                description: 'Role-based access, team collaboration, and shared templates for your organization.'
              },
              {
                icon: <BarChart3 className="w-7 h-7" />,
                title: 'Advanced Analytics',
                description: 'Custom dashboards, team performance metrics, and exportable reports.'
              },
              {
                icon: <Globe className="w-7 h-7" />,
                title: 'Global Infrastructure',
                description: '99.99% uptime SLA, multi-region deployment, and dedicated infrastructure.'
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'API & Integrations',
                description: 'REST API, webhooks, and 50+ native integrations with enterprise tools.'
              },
              {
                icon: <Award className="w-7 h-7" />,
                title: 'Dedicated Support',
                description: '24/7 phone & email support, dedicated account manager, and onboarding.'
              },
              {
                icon: <TrendingUp className="w-7 h-7" />,
                title: 'Scalability',
                description: 'Handle millions of emails per month with guaranteed deliverability.'
              },
              {
                icon: <Building2 className="w-7 h-7" />,
                title: 'Custom Solutions',
                description: 'Tailored features, custom integrations, and white-label options.'
              }
            ].map((feature, index) => (
              <div key={index} className="rounded-xl p-6 transition-all hover:shadow-lg"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                     style={{
                       backgroundColor: index === 0 ? 'rgba(0, 240, 160, 0.1)' : '#f5f5f5',
                       color: index === 0 ? '#00c98d' : 'rgba(0, 0, 0, 0.65)'
                     }}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Built for Growing Teams
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              See how different teams use our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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
              <div key={index} className="rounded-xl p-8"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
                  {useCase.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {useCase.title}
                </h3>
                <p className="mb-6"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  {useCase.description}
                </p>
                <div className="space-y-3">
                  {useCase.metrics.map((metric, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#00f0a0' }} />
                      <span style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                        {metric}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Join 500+ companies scaling their marketing with AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              {
                quote: "This platform has transformed how we do outbound. We have 3x'd our pipeline in 6 months.",
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
              <div key={index} className="rounded-xl p-8"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <svg className="w-10 h-10 mb-4" style={{ color: '#00f0a0' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <p className="text-lg mb-6 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-bold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    {testimonial.author}
                  </div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                    {testimonial.role}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                    {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-16 items-center">
            {['Microsoft', 'Google', 'Salesforce', 'Stripe', 'Adobe'].map((company, index) => (
              <div key={index} className="text-3xl font-bold"
                   style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24" style={{ backgroundColor: '#001529' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h2 className="text-5xl font-semibold mb-6"
              style={{ color: 'white', fontWeight: 600 }}>
            Ready to Scale Your Marketing?
          </h2>
          <p className="text-xl mb-10"
             style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Talk to our team about enterprise pricing and features
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/start"
              className="px-12 py-4 font-semibold rounded-lg transition-all text-lg"
              style={{
                backgroundColor: '#00f0a0',
                color: '#001529',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
            >
              Request Demo
            </Link>
            <button
              className="px-12 py-4 font-semibold rounded-lg transition-all text-lg"
              style={{
                border: '2px solid white',
                color: 'white',
                backgroundColor: 'transparent',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForBusinessesPage;
