import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Rocket, Users, Award, TrendingUp, Zap, Check, ArrowRight, ChevronRight, Sparkles, Building2, DollarSign } from 'lucide-react';

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

// Partner type card with animation
const PartnerCard = ({ partner, index, isHighlighted }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group relative overflow-hidden"
      style={{
        backgroundColor: 'white',
        border: isHighlighted ? '2px solid #00f0a0' : '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: isHighlighted ? '0 8px 30px rgba(0, 240, 160, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 100}ms`
      }}
    >
      {isHighlighted && (
        <div className="absolute top-0 right-0">
          <div className="px-4 py-1.5 text-xs font-semibold rounded-bl-xl"
               style={{ backgroundColor: '#00f0a0', color: '#001529' }}>
            Most Popular
          </div>
        </div>
      )}

      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
           style={{
             background: isHighlighted ? 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)' : 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)',
             color: isHighlighted ? '#001529' : '#00c98d'
           }}>
        {partner.icon}
      </div>

      <h3 className="text-2xl font-bold mb-3 transition-colors duration-300 group-hover:text-[#00c98d]"
          style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
        {partner.title}
      </h3>

      <p className="mb-6 leading-relaxed"
         style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '15px', lineHeight: '1.7' }}>
        {partner.description}
      </p>

      <ul className="space-y-3 mb-8">
        {partner.benefits.map((benefit, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.15)' }}>
              <Check className="w-3 h-3" style={{ color: '#00c98d' }} />
            </div>
            <span style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
              {benefit}
            </span>
          </li>
        ))}
      </ul>

      <button
        className="w-full py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group/btn"
        style={{
          backgroundColor: isHighlighted ? '#00f0a0' : 'transparent',
          color: isHighlighted ? '#001529' : '#00c98d',
          border: isHighlighted ? 'none' : '1px solid #00c98d'
        }}
      >
        Learn More
        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  );
};

// Benefit card with animation
const BenefitCard = ({ benefit, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className="rounded-2xl p-7 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${index * 80}ms`
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
           style={{ background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)', color: '#00c98d' }}>
        {benefit.icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 transition-colors duration-300 group-hover:text-[#00c98d]"
          style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
        {benefit.title}
      </h3>
      <p style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px', lineHeight: '1.6' }}>
        {benefit.description}
      </p>
    </div>
  );
};

// Success story card with animation
const StoryCard = ({ story, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 transition-all duration-500 hover:shadow-xl group"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${index * 100}ms`
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)' }}>
          <Building2 className="w-5 h-5" style={{ color: '#00c98d' }} />
        </div>
        <div>
          <div className="font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            {story.company}
          </div>
          <div className="text-sm font-medium" style={{ color: '#00c98d' }}>
            {story.result}
          </div>
        </div>
      </div>

      <p className="mb-6 leading-relaxed italic"
         style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '16px', lineHeight: '1.7' }}>
        "{story.quote}"
      </p>

      <div className="pt-5" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <div className="font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
          {story.name}
        </div>
        <div className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          {story.role}
        </div>
      </div>
    </div>
  );
};

const PartnersPage = () => {
  const [heroRef, heroVisible] = useScrollReveal();

  const partnerTypes = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Referral Partners',
      description: 'Refer customers and earn commission on every sale. Simple, straightforward, profitable.',
      benefits: ['20% one-time commission', 'Easy referral process', 'Marketing materials', 'Fast payouts']
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Reseller Partners',
      description: 'Resell MailGen to your clients and earn recurring revenue. Perfect for agencies and consultants.',
      benefits: ['30% recurring commission', 'Co-branded solution', 'Dedicated support', 'Sales enablement'],
      highlighted: true
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Technology Partners',
      description: 'Integrate MailGen into your platform and provide enhanced value to your users.',
      benefits: ['Technical partnership', 'API access', 'Joint marketing', 'Revenue sharing']
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Recurring Revenue',
      description: 'Earn consistent monthly income from every customer you bring to MailGen.'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Market Leading Product',
      description: 'Promote a product your customers will love with industry-leading AI technology.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Dedicated Support',
      description: 'Get priority support from our partner success team to help you succeed.'
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Marketing Resources',
      description: 'Access our complete library of sales materials, case studies, and marketing assets.'
    }
  ];

  const stories = [
    {
      company: 'TechConsult Agency',
      result: '$50K+ Monthly Recurring Revenue',
      quote: 'Partnering with MailGen has opened up a new revenue stream for our agency. Our clients love the platform, and we love the recurring commissions.',
      name: 'Sarah Johnson',
      role: 'Agency Owner'
    },
    {
      company: 'GrowthPartners',
      result: '100+ Successful Referrals',
      quote: 'The referral program is incredibly easy to use. We have referred over 100 clients and the commission structure is very generous.',
      name: 'Michael Chen',
      role: 'Sales Director'
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 240, 160, 0.2) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full pulse-glow"
               style={{ background: 'radial-gradient(circle, rgba(0, 200, 140, 0.15) 0%, transparent 70%)', animationDelay: '2s' }} />
        </div>

        <div className="relative py-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div
            ref={heroRef}
            className="max-w-4xl mx-auto text-center transition-all duration-1000"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(40px)'
            }}
          >
            <div className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium mb-8"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b', border: '1px solid rgba(0, 240, 160, 0.2)' }}>
              <Handshake className="w-4 h-4 mr-2" />
              Partner Program
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: 'rgba(0, 0, 0, 0.88)', lineHeight: 1.1 }}>
              Partner with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00c98d 0%, #00a86b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                MailGen
              </span>
            </h1>

            <p className="text-xl leading-relaxed max-w-2xl mx-auto mb-10"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Join our partner ecosystem and help businesses transform their email marketing with AI. Earn revenue, grow your business, and deliver exceptional value to your clients.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/start"
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-lg group"
                style={{ backgroundColor: '#00f0a0', color: '#001529' }}
              >
                Become a Partner
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                className="px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 text-lg"
                style={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: 'rgba(0, 0, 0, 0.88)',
                  backgroundColor: 'white'
                }}
              >
                Partner Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Types */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              Choose Your Path
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              Partnership Opportunities
            </h2>
            <p className="text-lg max-w-2xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Choose the partnership model that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {partnerTypes.map((partner, index) => (
              <PartnerCard key={index} partner={partner} index={index} isHighlighted={partner.highlighted} />
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-24" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              Partner Benefits
            </div>
            <h2 className="text-4xl font-bold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              Why Partner with MailGen
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Benefits that help you grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} benefit={benefit} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              Success Stories
            </div>
            <h2 className="text-4xl font-bold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              Partner Success Stories
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              See how our partners are growing their businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {stories.map((story, index) => (
              <StoryCard key={index} story={story} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
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
            Ready to Partner with Us?
          </h2>
          <p className="text-xl mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Join our growing partner network and start earning today
          </p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 px-10 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg group"
            style={{ backgroundColor: '#00f0a0', color: '#001529' }}
          >
            Apply Now
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
