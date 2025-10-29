import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Heart, Zap, Users, TrendingUp, Globe } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
              About MailGen
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              We're Building the Future of Email Marketing
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our mission is to empower every marketer with AI tools that make personalized outreach accessible, effective, and scalable.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                <p>
                  Founded in 2023, MailGen was born from a simple frustration: email marketing was either too manual or too generic. We saw talented sales and marketing professionals spending hours personalizing emails, while automation tools sent robotic messages that nobody wanted to read.
                </p>
                <p>
                  We knew there had to be a better way. By combining advanced AI with deep email marketing expertise, we created a platform that delivers the personalization of manual outreach with the scale of automation.
                </p>
                <p>
                  Today, we're proud to help over 520,000 marketers worldwide send better emails, build stronger relationships, and grow their businesses faster.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">520K+</div>
                <div className="text-gray-700">Active Users</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">80M+</div>
                <div className="text-gray-700">Prospects</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">10M+</div>
                <div className="text-gray-700">Emails/Month</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">150+</div>
                <div className="text-gray-700">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                color: 'green',
                title: 'Customer First',
                description: 'Every decision starts with our customers. We build features they need, not ones we think are cool.'
              },
              {
                icon: <Heart className="w-8 h-8" />,
                color: 'red',
                title: 'Human Connection',
                description: 'AI should enhance human relationships, not replace them. We make technology that brings people together.'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                color: 'yellow',
                title: 'Move Fast',
                description: 'Speed matters in business. We ship quickly, learn rapidly, and iterate constantly.'
              },
              {
                icon: <Users className="w-8 h-8" />,
                color: 'blue',
                title: 'Transparency',
                description: 'We're honest about what works and what doesn't. Clear communication builds trust.'
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                color: 'purple',
                title: 'Continuous Growth',
                description: 'We never stop learning. Every day is an opportunity to improve and innovate.'
              },
              {
                icon: <Globe className="w-8 h-8" />,
                color: 'teal',
                title: 'Global Impact',
                description: 'Great ideas come from everywhere. We build for diverse teams across the world.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl bg-${value.color}-100 text-${value.color}-600 flex items-center justify-center mb-6`}>
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                  {member.image}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investors Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Backed by Leading Investors
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Series A funding to accelerate AI innovation
          </p>
          <div className="flex flex-wrap justify-center gap-16 items-center grayscale opacity-60">
            <div className="text-3xl font-bold text-gray-400">Sequoia Capital</div>
            <div className="text-3xl font-bold text-gray-400">Andreessen Horowitz</div>
            <div className="text-3xl font-bold text-gray-400">Y Combinator</div>
            <div className="text-3xl font-bold text-gray-400">Tiger Global</div>
          </div>
        </div>
      </div>

      {/* Careers CTA */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Join Our Team
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're always looking for talented people who want to build the future of marketing
          </p>
          <button className="px-10 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 text-lg">
            View Open Positions
          </button>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-br from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join 520,000+ marketers using MailGen to scale their campaigns
          </p>
          <Link
            to="/start"
            className="inline-block px-10 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl text-lg"
          >
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
