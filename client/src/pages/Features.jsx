import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, Target, BarChart3, Clock, Shield, Globe, Zap, Check, X, ArrowRight, Play, ChevronRight } from 'lucide-react';
import FloatingTestimonials from '../components/FloatingTestimonials';
import LiveProspectBanner from '../components/LiveProspectBanner';

// Animation hook for scroll reveal
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Animated counter component
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Feature card with animation
const FeatureCard = ({ feature, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 100}ms`
      }}
    >
      {/* Icon with animated gradient background */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)',
          color: '#00c98d'
        }}
      >
        {feature.icon}
      </div>

      <h3 className="text-xl font-semibold mb-3 transition-colors duration-300 group-hover:text-[#00c98d]"
          style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
        {feature.title}
      </h3>

      <p className="mb-6 leading-relaxed"
         style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '15px', lineHeight: '1.7' }}>
        {feature.description}
      </p>

      <ul className="space-y-3">
        {feature.benefits.map((benefit, i) => (
          <li key={i} className="flex items-center gap-3 group/item">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/item:scale-110"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.15)' }}>
              <Check className="w-3 h-3" style={{ color: '#00c98d' }} />
            </div>
            <span style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
              {benefit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FeaturesPage = () => {
  const [heroRef, heroVisible] = useScrollReveal();

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

      {/* Animated background gradient */}
      <style>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-animation 8s ease infinite;
        }
        .float-animation {
          animation: float-slow 6s ease-in-out infinite;
        }
        .pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section with animated gradient */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 240, 160, 0.3) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 200, 140, 0.2) 0%, transparent 70%)', animationDelay: '2s' }} />
        </div>

        <div className="relative py-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div
            ref={heroRef}
            className="text-center max-w-4xl mx-auto transition-all duration-1000"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)'
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium mb-8 transition-all hover:scale-105"
                 style={{
                   backgroundColor: 'rgba(0, 240, 160, 0.1)',
                   color: '#00a86b',
                   border: '1px solid rgba(0, 240, 160, 0.2)'
                 }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </div>

            {/* Main heading with gradient text */}
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{
                  color: 'rgba(0, 0, 0, 0.88)',
                  lineHeight: 1.1
                }}>
              Everything You Need to{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00c98d 0%, #00a86b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Scale Your Outreach
              </span>
            </h1>

            <p className="text-xl mb-10 leading-relaxed max-w-2xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              From AI-powered prospecting to advanced analytics, we have built the complete platform for modern email marketing teams.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/start"
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-lg group"
                style={{
                  backgroundColor: '#00f0a0',
                  color: '#001529',
                }}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 text-lg"
                style={{
                  backgroundColor: 'white',
                  color: 'rgba(0, 0, 0, 0.88)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <Play className="w-5 h-5" style={{ color: '#00c98d' }} />
                Watch Demo
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-12 mt-16 pt-8 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
              {[
                { value: 520, suffix: 'K+', label: 'Active Users' },
                { value: 40, suffix: '%+', label: 'Avg Response Rate' },
                { value: 10, suffix: 'M+', label: 'Emails Sent' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold mb-1" style={{ color: '#00c98d' }}>
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '14px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Comparison Table */}
      <div className="py-24" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              Why Choose Us
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              How We Compare
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              See why leading teams choose our platform over alternatives
            </p>
          </div>

          {/* Modern comparison table */}
          <div className="rounded-3xl overflow-hidden"
               style={{
                 backgroundColor: 'white',
                 boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)'
               }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                  <th className="px-8 py-6 text-left font-semibold text-lg"
                      style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    Feature
                  </th>
                  <th className="px-8 py-6 text-center font-semibold text-lg"
                      style={{ color: '#00c98d' }}>
                    MailGen
                  </th>
                  <th className="px-8 py-6 text-center font-semibold text-lg"
                      style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
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
                      className="transition-colors hover:bg-gray-50/50"
                      style={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <td className="px-8 py-5" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      {row[0]}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {typeof row[1] === 'boolean' ? (
                        row[1] ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform hover:scale-110"
                               style={{ backgroundColor: 'rgba(0, 240, 160, 0.15)' }}>
                            <Check className="w-5 h-5" style={{ color: '#00c98d' }} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                               style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
                            <X className="w-5 h-5" style={{ color: '#ff4d4f' }} />
                          </div>
                        )
                      ) : (
                        <span className="font-medium" style={{ color: '#00c98d' }}>
                          {row[1]}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {typeof row[2] === 'boolean' ? (
                        row[2] ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                               style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)' }}>
                            <Check className="w-5 h-5" style={{ color: '#00c98d' }} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                               style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
                            <X className="w-5 h-5" style={{ color: '#ff4d4f' }} />
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

      {/* Live Prospect Finding Banner */}
      <LiveProspectBanner />

      {/* Floating Testimonials Section */}
      <FloatingTestimonials />

      {/* Final CTA with gradient background */}
      <div className="relative overflow-hidden py-32" style={{ backgroundColor: '#001529' }}>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 240, 160, 0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 200, 140, 0.1) 0%, transparent 70%)', animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: 'white' }}>
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Start your free trial today. No credit card required.
          </p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 px-10 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg group"
            style={{
              backgroundColor: '#00f0a0',
              color: '#001529',
            }}
          >
            Get Started Free
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
