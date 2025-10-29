import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Zap, Shield, TrendingUp, Users, Mail, BarChart3, Clock, Check } from 'lucide-react';
import FloatingTestimonials from '../components/FloatingTestimonials';

const AIAgentPage = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-12 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
                   style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Email Marketing
              </div>
              <h1 className="text-5xl font-semibold mb-6 leading-tight"
                  style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                Your AI Marketing Agent That Never Sleeps
              </h1>
              <p className="text-lg mb-8 leading-relaxed"
                 style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px', lineHeight: '1.7' }}>
                Let AI handle prospecting, email generation, and follow-ups 24/7. Focus on closing deals while your AI agent finds and engages perfect prospects automatically.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to="/start"
                  className="px-8 py-3 font-semibold rounded-lg transition-all inline-flex items-center hover:shadow-lg"
                  style={{
                    backgroundColor: '#00f0a0',
                    color: '#001529',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                >
                  Start Free Trial
                  <span className="ml-2">→</span>
                </Link>
                <button
                  className="px-8 py-3 font-semibold rounded-lg transition-all"
                  style={{
                    border: '1px solid #d9d9d9',
                    color: 'rgba(0, 0, 0, 0.88)',
                    backgroundColor: 'white',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Watch Demo
                </button>
              </div>
              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" style={{ color: '#00f0a0' }} />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" style={{ color: '#00f0a0' }} />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="rounded-2xl p-8 border"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
                   }}>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: '#f0f0f0' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: '#00f0a0' }}>
                    <Sparkles className="w-6 h-6" style={{ color: '#001529' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      AI Marketing Agent
                    </div>
                    <div className="text-sm flex items-center gap-1" style={{ color: '#00f0a0' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00f0a0' }}></span>
                      Active Now
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg p-5" style={{ backgroundColor: '#f5f5f5' }}>
                    <div className="text-sm mb-2" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      Today's Activity
                    </div>
                    <div className="text-3xl font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      247 Prospects Found
                    </div>
                  </div>
                  <div className="rounded-lg p-5" style={{ backgroundColor: '#f5f5f5' }}>
                    <div className="text-sm mb-2" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      Emails Sent
                    </div>
                    <div className="text-3xl font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      189 Personalized
                    </div>
                  </div>
                  <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)' }}>
                    <div className="text-sm mb-2" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      Response Rate
                    </div>
                    <div className="text-3xl font-semibold flex items-center gap-2"
                         style={{ color: '#00c98d' }}>
                      34% <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              What Your AI Agent Can Do
            </h2>
            <p className="text-lg max-w-3xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              A complete marketing automation system powered by advanced AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Target className="w-7 h-7" />,
                iconBg: 'rgba(0, 240, 160, 0.1)',
                iconColor: '#00c98d',
                title: 'Intelligent Prospect Discovery',
                desc: 'AI analyzes 80M+ prospects to find your perfect matches based on industry, role, company size, and behavior patterns.'
              },
              {
                icon: <Mail className="w-7 h-7" />,
                iconBg: '#f5f5f5',
                iconColor: 'rgba(0, 0, 0, 0.65)',
                title: 'Personalized Email Generation',
                desc: 'Creates custom emails for each prospect using company insights, recent news, and proven templates that convert.'
              },
              {
                icon: <Clock className="w-7 h-7" />,
                iconBg: '#f5f5f5',
                iconColor: 'rgba(0, 0, 0, 0.65)',
                title: 'Automated Follow-ups',
                desc: 'Never miss a follow-up. AI tracks engagement and sends perfectly timed messages to keep conversations warm.'
              },
              {
                icon: <Shield className="w-7 h-7" />,
                iconBg: '#f5f5f5',
                iconColor: 'rgba(0, 0, 0, 0.65)',
                title: 'CRM Integration',
                desc: 'Seamlessly syncs with your existing CRM. All prospects, emails, and interactions are automatically logged.'
              },
              {
                icon: <Users className="w-7 h-7" />,
                iconBg: '#f5f5f5',
                iconColor: 'rgba(0, 0, 0, 0.65)',
                title: 'Team Collaboration',
                desc: 'Multiple team members can manage campaigns together. AI learns from your team\'s best practices.'
              },
              {
                icon: <BarChart3 className="w-7 h-7" />,
                iconBg: '#f5f5f5',
                iconColor: 'rgba(0, 0, 0, 0.65)',
                title: 'Real-Time Analytics',
                desc: 'Track opens, clicks, responses, and conversions. AI provides insights to optimize your campaigns.'
              }
            ].map((feature, index) => (
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
                  style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              How It Works
            </h2>
            <p className="text-lg" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Get started in minutes, see results in hours
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Connect Your Data', desc: 'Link your website and CRM to get started' },
              { step: '02', title: 'Set Your Goals', desc: 'Define target audience and objectives' },
              { step: '03', title: 'AI Takes Over', desc: 'Agent finds and engages prospects' },
              { step: '04', title: 'Track Results', desc: 'Monitor performance in real-time' }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div
                  className="text-6xl font-bold mb-4 opacity-20"
                  style={{ color: '#00f0a0', fontWeight: 700 }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20" style={{ backgroundColor: '#001529' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            {[
              { value: '520K+', label: 'Active Users' },
              { value: '80M+', label: 'Prospects in Database' },
              { value: '10M+', label: 'Emails Sent Monthly' },
              { value: '34%', label: 'Avg. Response Rate' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-5xl font-bold mb-2" style={{ color: '#00f0a0' }}>
                  {stat.value}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Testimonials Section */}
      <FloatingTestimonials />

      {/* CTA Section */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h2 className="text-5xl font-semibold mb-6"
              style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
            Ready to 10x Your Outreach?
          </h2>
          <p className="text-xl mb-10"
             style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            Join 520,000+ marketers using AI to scale their campaigns
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
            Start Your Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
