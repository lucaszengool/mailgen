import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Zap, Shield, TrendingUp, Users } from 'lucide-react';

const AIAgentPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
                AI-Powered Marketing
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your AI Marketing Agent That Never Sleeps
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Let AI handle prospecting, email generation, and follow-ups 24/7. Focus on closing deals while your AI agent finds and engages perfect prospects.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/start"
                  className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
                >
                  Start Free Trial
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AI Marketing Agent</div>
                    <div className="text-sm text-green-600">● Active</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Today's Activity</div>
                    <div className="text-2xl font-bold text-gray-900">247 Prospects Found</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Emails Sent</div>
                    <div className="text-2xl font-bold text-gray-900">189 Personalized</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Response Rate</div>
                    <div className="text-2xl font-bold text-gray-900">34% Higher</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Your AI Agent Can Do
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete marketing automation system powered by advanced AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Intelligent Prospect Discovery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                AI analyzes 80M+ prospects to find your perfect matches based on industry, role, company size, and behavior patterns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Personalized Email Generation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Creates custom emails for each prospect using company insights, recent news, and proven templates that convert.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Automated Follow-ups
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Never miss a follow-up. AI tracks engagement and sends perfectly timed messages to keep conversations warm.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                CRM Integration
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Seamlessly syncs with your existing CRM. All prospects, emails, and interactions are automatically logged.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Team Collaboration
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple team members can manage campaigns together. AI learns from your team's best practices.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-green-500 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track opens, clicks, responses, and conversions. AI provides insights to optimize your campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes, see results in hours
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Connect Your Data', desc: 'Link your website and CRM' },
              { step: '02', title: 'Set Your Goals', desc: 'Define target audience and campaign objectives' },
              { step: '03', title: 'AI Takes Over', desc: 'Agent finds prospects and sends personalized emails' },
              { step: '04', title: 'Track Results', desc: 'Monitor performance and optimize' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-100 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-green-200 -ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10x Your Outreach?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join 520,000+ marketers using AI to scale their campaigns
          </p>
          <Link
            to="/start"
            className="inline-block px-10 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl text-lg"
          >
            Start Your Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPage;
