import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, Zap, Users, TrendingUp, Globe } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
              About MailGen
            </div>
            <h1 className="text-5xl font-semibold mb-6 leading-tight"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              We are Building the Future of Email Marketing
            </h1>
            <p className="text-lg leading-relaxed"
               style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px', lineHeight: '1.7' }}>
              Our mission is to empower every marketer with AI tools that make personalized outreach accessible, effective, and scalable.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-semibold mb-6"
                  style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                Our Story
              </h2>
              <div className="space-y-5 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '16px', lineHeight: '1.7' }}>
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
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl p-8 text-center"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="text-5xl font-bold mb-2" style={{ color: '#00f0a0' }}>520K+</div>
                <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>Active Users</div>
              </div>
              <div className="rounded-2xl p-8 text-center"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="text-5xl font-bold mb-2" style={{ color: '#00f0a0' }}>80M+</div>
                <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>Prospects</div>
              </div>
              <div className="rounded-2xl p-8 text-center"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="text-5xl font-bold mb-2" style={{ color: '#00f0a0' }}>10M+</div>
                <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>Emails/Month</div>
              </div>
              <div className="rounded-2xl p-8 text-center"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="text-5xl font-bold mb-2" style={{ color: '#00f0a0' }}>150+</div>
                <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>Countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Our Values
            </h2>
            <p className="text-lg max-w-3xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
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
            ].map((value, index) => (
              <div key={index} className="rounded-xl p-8 transition-all hover:shadow-lg"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                     style={{
                       backgroundColor: index === 0 ? 'rgba(0, 240, 160, 0.1)' : '#f5f5f5',
                       color: index === 0 ? '#00c98d' : 'rgba(0, 0, 0, 0.65)'
                     }}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {value.title}
                </h3>
                <p className="leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Meet Our Team
            </h2>
            <p className="text-lg max-w-3xl mx-auto"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Passionate people building the future of marketing
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { name: 'Alex Chen', role: 'CEO & Co-Founder', image: 'AC' },
              { name: 'Sarah Johnson', role: 'CTO & Co-Founder', image: 'SJ' },
              { name: 'Michael Kim', role: 'Head of AI', image: 'MK' },
              { name: 'Emily Rodriguez', role: 'VP of Product', image: 'ER' },
              { name: 'David Park', role: 'Head of Engineering', image: 'DP' },
              { name: 'Lisa Chen', role: 'VP of Sales', image: 'LC' },
              { name: 'James Wilson', role: 'Head of Marketing', image: 'JW' },
              { name: 'Maria Garcia', role: 'VP of Customer Success', image: 'MG' }
            ].map((member, index) => (
              <div key={index} className="text-center group">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform group-hover:scale-105"
                     style={{
                       background: 'linear-gradient(135deg, #00f0a0 0%, #00c98d 100%)'
                     }}>
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold mb-1"
                    style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                  {member.name}
                </h3>
                <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px' }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investors Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12 text-center">
          <h2 className="text-4xl font-semibold mb-4"
              style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
            Backed by Leading Investors
          </h2>
          <p className="text-lg mb-12"
             style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            Series A funding to accelerate AI innovation
          </p>
          <div className="flex flex-wrap justify-center gap-16 items-center">
            {['Sequoia Capital', 'Andreessen Horowitz', 'Y Combinator', 'Tiger Global'].map((investor, index) => (
              <div key={index} className="text-3xl font-bold"
                   style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
                {investor}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Careers CTA */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h2 className="text-4xl font-semibold mb-6"
              style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
            Join Our Team
          </h2>
          <p className="text-lg mb-8"
             style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            We are always looking for talented people who want to build the future of marketing
          </p>
          <button
            className="px-10 py-4 font-semibold rounded-lg transition-all text-lg"
            style={{
              backgroundColor: '#00f0a0',
              color: '#001529',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
          >
            View Open Positions
          </button>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24" style={{ backgroundColor: '#001529' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h2 className="text-5xl font-semibold mb-6"
              style={{ color: 'white', fontWeight: 600 }}>
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl mb-10"
             style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Join 520,000+ marketers using MailGen to scale their campaigns
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
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
