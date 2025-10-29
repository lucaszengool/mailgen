import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Rocket, Users, Award, TrendingUp, Zap } from 'lucide-react';

const PartnersPage = () => {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
              <Handshake className="w-4 h-4 mr-2" />
              Partner Program
            </div>
            <h1 className="text-5xl font-semibold mb-6 leading-tight"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Partner with MailGen
            </h1>
            <p className="text-lg leading-relaxed mb-8"
               style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px', lineHeight: '1.7' }}>
              Join our partner ecosystem and help businesses transform their email marketing with AI. Earn revenue, grow your business, and deliver exceptional value to your clients.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/start"
                className="px-10 py-4 font-semibold rounded-lg transition-all text-lg"
                style={{
                  backgroundColor: '#00f0a0',
                  color: '#001529',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
              >
                Become a Partner
              </Link>
              <button
                className="px-10 py-4 font-semibold rounded-lg transition-all text-lg"
                style={{
                  border: '1px solid #d9d9d9',
                  color: 'rgba(0, 0, 0, 0.88)',
                  backgroundColor: 'white',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Partner Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Types */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Partnership Opportunities
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Choose the partnership model that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Rocket className="w-7 h-7" />,
                title: 'Reseller Partners',
                description: 'Resell MailGen to your clients and earn recurring revenue. Perfect for agencies and consultants.',
                benefits: ['30% recurring commission', 'Co-branded solution', 'Dedicated support', 'Sales enablement']
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Referral Partners',
                description: 'Refer customers and earn commission on every sale. Simple, straightforward, profitable.',
                benefits: ['20% one-time commission', 'Easy referral process', 'Marketing materials', 'Fast payouts']
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Technology Partners',
                description: 'Integrate MailGen into your platform and provide enhanced value to your users.',
                benefits: ['Technical partnership', 'API access', 'Joint marketing', 'Revenue sharing']
              }
            ].map((partner, index) => (
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
                  {partner.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {partner.title}
                </h3>
                <p className="mb-6 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                  {partner.description}
                </p>
                <ul className="space-y-3">
                  {partner.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#00f0a0' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
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

      {/* Benefits */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Why Partner with MailGen
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Benefits that help you grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
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
            ].map((benefit, index) => (
              <div key={index} className="rounded-xl p-6"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                     style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2"
                    style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                  {benefit.title}
                </h3>
                <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '14px', lineHeight: '1.6' }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Partner Success Stories
            </h2>
            <p className="text-lg"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              See how our partners are growing their businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
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
            ].map((story, index) => (
              <div key={index} className="rounded-xl p-8"
                   style={{
                     backgroundColor: 'white',
                     border: '1px solid #f0f0f0',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                   }}>
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-1"
                       style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    {story.company}
                  </div>
                  <div className="text-sm font-medium"
                       style={{ color: '#00f0a0' }}>
                    {story.result}
                  </div>
                </div>
                <p className="mb-6 leading-relaxed"
                   style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '16px', lineHeight: '1.7' }}>
                  "{story.quote}"
                </p>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  <div className="font-semibold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    {story.name}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                    {story.role}
                  </div>
                </div>
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
            Ready to Partner with Us?
          </h2>
          <p className="text-xl mb-10"
             style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            Join our growing partner network and start earning today
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
            Apply Now →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
