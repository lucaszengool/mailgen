import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, Zap, Users, TrendingUp, Globe, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

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

// Stat card with animation
const StatCard = ({ value, suffix, label, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  const numValue = parseInt(value.replace(/[^0-9]/g, '')) || parseInt(value);

  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 text-center transition-all duration-700 hover:shadow-lg hover:-translate-y-1"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${delay}ms`
      }}
    >
      <div className="text-5xl font-bold mb-2" style={{ color: '#00c98d' }}>
        <AnimatedCounter end={numValue} suffix={suffix} />
      </div>
      <div className="text-sm font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>{label}</div>
    </div>
  );
};

// Value card with animation
const ValueCard = ({ value, index }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className="rounded-2xl p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 group"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 100}ms`
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
           style={{
             background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)',
             color: '#00c98d'
           }}>
        {value.icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 transition-colors duration-300 group-hover:text-[#00c98d]"
          style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
        {value.title}
      </h3>
      <p className="leading-relaxed"
         style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '15px', lineHeight: '1.7' }}>
        {value.description}
      </p>
    </div>
  );
};

const AboutPage = () => {
  const [heroRef, heroVisible] = useScrollReveal();
  const [storyRef, storyVisible] = useScrollReveal();

  const values = [
    {
      icon: <Target className="w-7 h-7" />,
      title: 'Customer First',
      description: 'Every decision starts with our customers. We build features they need, not ones we think are cool.'
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: 'Human Connection',
      description: 'AI should enhance human relationships, not replace them. We make technology that brings people together.'
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Move Fast',
      description: 'Speed matters in business. We ship quickly, learn rapidly, and iterate constantly.'
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: 'Transparency',
      description: 'We are honest about what works and what does not. Clear communication builds trust.'
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: 'Continuous Growth',
      description: 'We never stop learning. Every day is an opportunity to improve and innovate.'
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: 'Global Impact',
      description: 'Great ideas come from everywhere. We build for diverse teams across the world.'
    }
  ];

  const investors = ['Sequoia Capital', 'Andreessen Horowitz', 'Y Combinator', 'Tiger Global'];

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
              <Sparkles className="w-4 h-4 mr-2" />
              About MailGen
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: 'rgba(0, 0, 0, 0.88)', lineHeight: 1.1 }}>
              We are Building the{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00c98d 0%, #00a86b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Future of Email
              </span>
            </h1>
            <p className="text-xl leading-relaxed max-w-2xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Our mission is to empower every marketer with AI tools that make personalized outreach accessible, effective, and scalable.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div
              ref={storyRef}
              className="transition-all duration-1000"
              style={{
                opacity: storyVisible ? 1 : 0,
                transform: storyVisible ? 'translateX(0)' : 'translateX(-40px)'
              }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                   style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
                Our Journey
              </div>
              <h2 className="text-4xl font-bold mb-8"
                  style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                Our Story
              </h2>
              <div className="space-y-6 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '17px', lineHeight: '1.8' }}>
                <p>
                  Founded in 2023, MailGen was born from a simple frustration: email marketing was either too manual or too generic. We saw talented sales and marketing professionals spending hours personalizing emails, while automation tools sent robotic messages that nobody wanted to read.
                </p>
                <p>
                  We knew there had to be a better way. By combining advanced AI with deep email marketing expertise, we created a platform that delivers the personalization of manual outreach with the scale of automation.
                </p>
                <p>
                  Today, we are proud to help over 520,000 marketers worldwide send better emails, build stronger relationships, and grow their businesses faster.
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-5">
              <StatCard value="520" suffix="K+" label="Active Users" delay={0} />
              <StatCard value="80" suffix="M+" label="Prospects" delay={100} />
              <StatCard value="10" suffix="M+" label="Emails/Month" delay={200} />
              <StatCard value="150" suffix="+" label="Countries" delay={300} />
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              What We Stand For
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              Our Values
            </h2>
            <p className="text-lg max-w-2xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <ValueCard key={index} value={value} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Investors Section */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
               style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
            Backed By The Best
          </div>
          <h2 className="text-4xl font-bold mb-4"
              style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Our Investors
          </h2>
          <p className="text-lg mb-14"
             style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Series A funding to accelerate AI innovation
          </p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-20 items-center">
            {investors.map((investor, index) => (
              <div key={index}
                   className="text-2xl lg:text-3xl font-bold transition-all duration-300 hover:scale-105"
                   style={{ color: 'rgba(0, 0, 0, 0.2)' }}>
                {investor}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Careers CTA */}
      <div className="py-24" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <div className="rounded-3xl p-10 lg:p-14 relative overflow-hidden"
               style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 8px 40px rgba(0, 0, 0, 0.04)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pulse-glow"
                 style={{ background: 'radial-gradient(circle, rgba(0, 240, 160, 0.15) 0%, transparent 70%)' }} />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-5"
                  style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                Join Our Team
              </h2>
              <p className="text-lg mb-8 max-w-xl mx-auto"
                 style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                We are always looking for talented people who want to build the future of marketing
              </p>
              <button
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-lg group"
                style={{ backgroundColor: '#00f0a0', color: '#001529' }}
              >
                View Open Positions
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
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
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Join 520,000+ marketers using MailGen to scale their campaigns
          </p>
          <Link
            to="/start"
            className="inline-flex items-center gap-2 px-10 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg group"
            style={{ backgroundColor: '#00f0a0', color: '#001529' }}
          >
            Start Free Trial
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
