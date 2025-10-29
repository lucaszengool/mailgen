import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, Target, BarChart3, Clock, Shield, Globe, Zap, Check, X } from 'lucide-react';

const FeaturesPage = () => {
  const features = [
    {
      icon: <Mail className="w-7 h-7" />,
      title: 'AI-Powered Email Generation',
      description: 'Create personalized emails for every prospect using advanced AI that understands context, tone, and your brand voice.',
      benefits: ['Personalized at scale', 'Multiple templates', 'A/B testing built-in', 'Brand voice learning']
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: 'Smart Prospect Matching',
      description: 'AI analyzes 80M+ prospects to find perfect matches based on industry, role, company signals, and engagement patterns.',
      benefits: ['80M+ prospect database', 'AI-powered matching', 'Real-time updates', 'Custom filters']
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Advanced Analytics',
      description: 'Track every metric that matters. Understand what works and optimize campaigns with actionable insights.',
      benefits: ['Real-time dashboards', 'Engagement tracking', 'ROI calculation', 'Export reports']
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: 'Automated Follow-ups',
      description: 'Never let a lead go cold. AI automatically sends perfectly timed follow-ups based on engagement signals.',
      benefits: ['Smart timing', 'Engagement triggers', 'Custom sequences', 'Auto-pause on reply']
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Email Deliverability',
      description: 'Maximize inbox placement with AI-powered spam detection, domain warming, and compliance checking.',
      benefits: ['Spam score checking', 'Domain health monitoring', 'Bounce handling', 'List cleaning']
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: 'Multi-Channel Campaigns',
      description: 'Reach prospects across email, LinkedIn, and more. Coordinate multi-touch campaigns from one dashboard.',
      benefits: ['Email + LinkedIn', 'Unified inbox', 'Cross-channel analytics', 'Sequence coordination']
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'CRM Integration',
      description: 'Connect with Salesforce, HubSpot, Pipedrive, and more. All data syncs automatically in real-time.',
      benefits: ['20+ CRM integrations', 'Two-way sync', 'Custom field mapping', 'Webhook support']
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: 'AI Insights & Coaching',
      description: 'Get personalized recommendations to improve your campaigns. AI learns from your best-performing emails.',
      benefits: ['Performance insights', 'Writing suggestions', 'Best time to send', 'A/B test recommendations']
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
              <Sparkles className="w-4 h-4 mr-2" />
              All Features
            </div>
            <h1 className="text-5xl font-semibold mb-6 leading-tight"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Everything You Need to Scale Your Email Marketing
            </h1>
            <p className="text-lg mb-10 leading-relaxed"
               style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px', lineHeight: '1.7' }}>
              From AI-powered prospecting to advanced analytics, we have built the complete platform for modern email marketing teams.
            </p>
            <Link
              to="/start"
              className="inline-block px-10 py-4 font-semibold rounded-lg transition-all text-lg"
              style={{
                backgroundColor: '#00f0a0',
                color: '#001529',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl p-8 transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: index === 0 ? 'rgba(0, 240, 160, 0.1)' : '#f5f5f5',
                    color: index === 0 ? '#00c98d' : 'rgba(0, 0, 0, 0.65)'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="mb-6 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#00f0a0' }} />
                      <span style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              How We Compare
            </h2>
            <p className="text-lg" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              See why leading teams choose our platform
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden"
               style={{
                 backgroundColor: 'white',
                 border: '1px solid #f0f0f0',
                 boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
               }}>
            <table className="w-full">
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th className="px-6 py-4 text-left font-semibold"
                      style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold"
                      style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    MailGen
                  </th>
                  <th className="px-6 py-4 text-center font-semibold"
                      style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    Others
                  </th>
                </tr>
              </thead>
              <tbody>
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
                  <tr key={index}
                      style={{ borderTop: '1px solid #f0f0f0' }}
                      className="hover:bg-gray-50">
                    <td className="px-6 py-4" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      {row[0]}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row[1] === 'boolean' ? (
                        row[1] ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                               style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)' }}>
                            <Check className="w-4 h-4" style={{ color: '#00f0a0' }} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                               style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
                            <X className="w-4 h-4" style={{ color: '#ff4d4f' }} />
                          </div>
                        )
                      ) : (
                        <span style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 500 }}>
                          {row[1]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row[2] === 'boolean' ? (
                        row[2] ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                               style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)' }}>
                            <Check className="w-4 h-4" style={{ color: '#00f0a0' }} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                               style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
                            <X className="w-4 h-4" style={{ color: '#ff4d4f' }} />
                          </div>
                        )
                      ) : (
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                          {row[2]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              What Our Customers Say
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Real results from real customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                photo: '/assets/testimonials/michael-r.jpg',
                name: 'Michael R.',
                role: 'VP of Sales',
                testimonial: 'I am able to find more relevant leads faster, since using this platform I have tripled my outreach response rate. I am truly impressed with the AI matching.'
              },
              {
                photo: '/assets/testimonials/sarah-c.jpg',
                name: 'Sarah C.',
                role: 'Marketing Director',
                testimonial: 'Thanks to this platform I have landed 3 new clients within 2 weeks! The AI-powered prospect matching is absolutely incredible.'
              },
              {
                photo: '/assets/testimonials/david-l.jpg',
                name: 'David L.',
                role: 'Business Development Manager',
                testimonial: 'You must check out this platform. It has been saving me hours in prospecting! I am blown away at how easy it is to find qualified leads.'
              },
              {
                photo: '/assets/testimonials/jennifer-w.jpg',
                name: 'Jennifer W.',
                role: 'Growth Marketing Lead',
                testimonial: 'I have enjoyed seeing so many perfectly matched prospects. This has completely revamped my outreach process. Excited to keep exploring the features!'
              },
              {
                photo: '/assets/testimonials/thomas-b.jpg',
                name: 'Thomas B.',
                role: 'Sales Manager',
                testimonial: 'It is a 10/10! The email personalization feature helps me easily craft messages that resonate. The AI guidance has been game changing. Loving it so far!'
              },
              {
                photo: '/assets/testimonials/amanda-l.jpg',
                name: 'Amanda L.',
                role: 'Account Executive',
                testimonial: 'Not only does this platform show you the most relevant prospects, it ALSO helps you network and get warm introductions! The matching system is incredible. Definitely recommend!'
              }
            ].map((testimonial, index) => (
              <div key={index} className="rounded-xl p-6"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{
                      border: '2px solid #00f0a0'
                    }}
                  />
                  <div>
                    <div className="font-semibold"
                         style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      {testimonial.name}
                    </div>
                    <div className="text-sm"
                         style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p className="leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  "{testimonial.testimonial}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24" style={{ backgroundColor: '#001529' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h2 className="text-5xl font-semibold mb-6" style={{ color: 'white', fontWeight: 600 }}>
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-10" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Start your free trial today. No credit card required.
          </p>
          <Link
            to="/start"
            className="inline-block px-12 py-4 font-semibold rounded-lg transition-all text-lg"
            style={{
              backgroundColor: '#00f0a0',
              color: '#001529',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
