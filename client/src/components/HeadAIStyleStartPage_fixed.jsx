import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebsiteAnalysisReview from './WebsiteAnalysisReview';
import WorkflowAnimation from './WorkflowAnimation';
import JobRightProspectCard from './JobRightProspectCard';

const HeadAIStyleStartPage = ({ onWebsiteSubmit, config }) => {
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessType, setBusinessType] = useState('auto');
  const [goal, setGoal] = useState('partnership');
  const [showAnalysisReview, setShowAnalysisReview] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (websiteUrl.trim()) {
      const initialData = {
        targetWebsite: websiteUrl,
        businessType,
        campaignGoal: goal
      };
      localStorage.setItem('agentSetupData', JSON.stringify(initialData));
      navigate('/setup');
    }
  };

  const handleAnalysisConfirm = (analysisData) => {
    setAnalysisData(analysisData);
    setShowAnalysisReview(false);
  };

  const handleBackFromAnalysis = () => {
    setShowAnalysisReview(false);
  };

  if (showAnalysisReview) {
    return (
      <WebsiteAnalysisReview
        targetWebsite={websiteUrl}
        onConfirm={handleAnalysisConfirm}
        onBack={handleBackFromAnalysis}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black relative overflow-hidden" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}}>
      {/* Header */}
      <header className="relative z-20 py-6 px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-[#00f0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-2xl font-bold">JobRight</span>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-[95vw] mx-auto">
          {/* Main Demo Window */}
          <div className="relative w-full">
            <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #a7f3d0 25%, #ffffff 70%)', height: '70vh', minHeight: '600px' }}>
              {/* Main Layout */}
              <div className="relative w-full h-full">
                {/* Content Layer */}
                <div className="relative z-10 w-full h-full flex">
                  {/* Left Side - Hero Content */}
                  <div className="w-1/2 flex flex-col px-16 py-12">
                    {/* AI Agent Status Badge */}
                    <div className="absolute top-8 left-8">
                      <div className="text-xs text-black tracking-wider uppercase font-semibold animate-pulse">
                        [AI] AGENT ACTIVELY WORKING
                      </div>
                    </div>

                    {/* Main Headline */}
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                      <h1 className="text-6xl xl:text-8xl font-bold leading-tight">
                        <span className="text-gray-900">The World's First</span><br/>
                        <span className="bg-gradient-to-r from-[#00f0a0] to-[#00c98d] bg-clip-text text-transparent animate-pulse">AI Marketer</span>
                      </h1>
                      <p className="text-xl text-black mt-6 leading-relaxed max-w-md font-semibold">
                        [AI] 24/7 Autonomous Email Marketing
                      </p>
                      <p className="text-lg text-black mt-4 leading-relaxed max-w-lg">
                        Watch your AI agent work independently - analyzing websites, finding prospects, writing emails, and optimizing campaigns while you sleep.
                      </p>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* URL Input */}
                      <div className="relative">
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="Enter your target website URL..."
                          className="w-full px-6 py-4 text-lg border-2 border-[#00f0a0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#00f0a0]/20 bg-white/90 backdrop-blur-sm shadow-lg"
                          required
                        />
                      </div>

                      {/* Business Type Selection */}
                      <div className="flex space-x-3">
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00f0a0] bg-white/90 backdrop-blur-sm"
                        >
                          <option value="auto">Auto-detect Business Type</option>
                          <option value="b2b">B2B Services</option>
                          <option value="ecommerce">E-commerce</option>
                          <option value="saas">SaaS/Technology</option>
                          <option value="agency">Marketing Agency</option>
                          <option value="consulting">Consulting</option>
                          <option value="other">Other</option>
                        </select>

                        <select
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00f0a0] bg-white/90 backdrop-blur-sm"
                        >
                          <option value="partnership">Partnership Outreach</option>
                          <option value="lead_gen">Lead Generation</option>
                          <option value="sales">Sales Outreach</option>
                          <option value="networking">Professional Networking</option>
                          <option value="customer_win_back">Customer Win-back</option>
                          <option value="event_promotion">Event Promotion</option>
                        </select>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#00f0a0] to-[#00c98d] text-white font-bold py-4 px-8 rounded-2xl hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl text-lg"
                      >
                        Start AI Analysis →
                      </button>
                    </form>
                  </div>

                  {/* Right Side - Real Workflow Animation */}
                  <div className="w-1/2 h-full flex items-center justify-center p-4">
                    <div className="w-full h-full">
                      <WorkflowAnimation />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How Your AI Agent Works Section - SIMPLIFIED */}
      <div className="relative z-10 py-12 px-8 bg-white">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 text-black">How Your AI Agent Works</h2>
            <p className="text-xl text-gray-700">Advanced AI automation that runs your email marketing campaigns autonomously</p>
          </div>

          {/* ALL 4 STEPS WITH CONSISTENT LAYOUT */}

          {/* Step 1: AI Agent */}
          <div className="mb-12">
            <div className="bg-[#00f5a0] rounded-3xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="lg:w-[35%] space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg font-bold">01</span>
                    </div>
                    <div className="text-sm font-semibold text-black uppercase tracking-wider">AI AGENT</div>
                  </div>
                  <h3 className="text-3xl font-bold text-black">24/7 Autonomous Agent</h3>
                  <p className="text-base text-black">Watch your AI agent work independently - analyzing websites, finding prospects, writing emails.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">Real-time workflow monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">Intelligent prospect discovery</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">Automated email generation</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:w-[65%]">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <h4 className="text-lg font-semibold text-black mb-3">AI Agent Dashboard</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-[#00f0a0] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="bg-white rounded-lg p-2 flex-1">
                          <p className="text-xs text-black">Starting website analysis for FruitAI.org...</p>
                          <span className="text-xs text-gray-500">2:34 PM</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-[#00f0a0] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="bg-white rounded-lg p-2 flex-1">
                          <p className="text-xs text-black">Found 247 qualified prospects...</p>
                          <span className="text-xs text-gray-500">2:35 PM</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-[#00f0a0] rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="bg-white rounded-lg p-2 flex-1">
                          <p className="text-xs text-black">Generating personalized emails...</p>
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                            <div className="w-3/4 h-1 bg-[#00f0a0] rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Discovery */}
          <div className="mb-12">
            <div className="bg-[#f0f4f8] rounded-3xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                <div className="lg:w-[65%]">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <h4 className="text-lg font-semibold text-black mb-3 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-[#00f5a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>[FIND] AI Discovery Engine</span>
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-pulse"></div>
                        <span className="text-xs text-black font-medium">Searching platforms...</span>
                      </div>
                      <div className="text-xs text-gray-500">LinkedIn • Company databases • Email validation</div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-black">Prospects Found</h5>
                      <div className="text-2xl font-bold text-[#00f5a0]">247</div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white border border-gray-200 rounded-lg p-2 hover:border-[#00f5a0] transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#00f5a0] rounded-full flex items-center justify-center">
                            <span className="text-black font-bold text-xs">SC</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-black text-xs">Sarah Chen</div>
                            <div className="text-xs text-gray-500">CTO • TechFlow Inc</div>
                          </div>
                          <div className="text-xs bg-[#00f5a0] text-black px-2 py-1 rounded-full font-medium">95%</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">+ 245 more qualified prospects</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[35%] space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00f0a0] rounded-xl flex items-center justify-center">
                      <span className="text-black text-lg font-bold">02</span>
                    </div>
                    <div className="text-sm font-semibold text-[#00f0a0] uppercase tracking-wider">DISCOVERY</div>
                  </div>
                  <h3 className="text-3xl font-bold text-black">AI-Powered Prospect Hunter</h3>
                  <p className="text-base text-gray-600">Our intelligent discovery engine searches across multiple platforms to find your ideal prospects.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">Multi-platform prospect search</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">Intelligent lead qualification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">Real-time email verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Email Composition - ULTRA SIMPLIFIED */}
          <div className="mb-12">
            <div className="bg-[#00f5a0] rounded-3xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="lg:w-[35%] space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-black text-lg font-bold">03</span>
                    </div>
                    <div className="text-sm font-semibold text-black uppercase tracking-wider">COMPOSITION</div>
                  </div>
                  <h3 className="text-3xl font-bold text-black">Personalized Email Crafting</h3>
                  <p className="text-base text-black">Each email is uniquely crafted using advanced AI that understands your prospect's business context.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">Context-aware personalization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">A/B tested subject lines</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-black">•</span>
                      <span className="text-black">Industry-specific messaging</span>
                    </li>
                  </ul>
                </div>

                <div className="lg:w-[65%]">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-black">[WRITE] AI Email Composer</h4>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500">To:</div>
                        <div className="text-sm font-medium text-black">sarah.chen@techflow.com</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Subject:</div>
                        <div className="text-sm font-medium text-black">Partnership Opportunity - FruitAI</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-black space-y-1">
                          <p>Dear Sarah,</p>
                          <p>We're excited to introduce FruitAI - our cutting-edge Freshness Analyzer.</p>
                          <div className="bg-white rounded p-2 my-2">
                            <p className="font-semibold">Key Benefits:</p>
                            <ul className="text-xs">
                              <li>• 99.9% accuracy</li>
                              <li>• Real-time monitoring</li>
                              <li>• 35% cost reduction</li>
                            </ul>
                          </div>
                          <p>Best regards,<br/>AI Marketing Agent</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">Ready to send</div>
                        <button className="text-xs bg-[#00f5a0] text-black px-3 py-1.5 rounded-lg font-medium">
                          Send Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Analytics - ULTRA SIMPLIFIED */}
          <div className="mb-12">
            <div className="bg-[#f0f4f8] rounded-3xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                <div className="lg:w-[65%]">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-black">[ANALYZE] Campaign Performance</h4>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Live</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-black">94.2%</div>
                        <div className="text-xs text-gray-600">Delivery</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-black">47.8%</div>
                        <div className="text-xs text-gray-600">Open Rate</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-black">12.4%</div>
                        <div className="text-xs text-gray-600">Response</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="text-xl font-bold text-black">247</div>
                        <div className="text-xs text-gray-600">Prospects</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-black">Real-time Activity</h5>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-700">✓ Email delivered to Mike Rodriguez • 2 min ago</div>
                        <div className="text-xs text-gray-700">👁 Sarah Chen opened email • 5 min ago</div>
                        <div className="text-xs text-gray-700">👤 New prospect discovered • 8 min ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[35%] space-y-4">
                  <div className="flex items-center space-x-3">
                  </div>
                  <h3 className="text-3xl font-bold text-black">Intelligent Performance Tracking</h3>
                  <p className="text-base text-gray-600">Real-time analytics powered by AI insights help you understand what's working.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">Real-time performance monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">AI-powered optimization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-[#00f0a0]">•</span>
                      <span className="text-black">Automatic adjustments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-gray-600 border-t border-gray-200">
        <p className="font-medium">&copy; 2024 MailFlow AI. Powered by autonomous artificial intelligence.</p>
      </footer>
    </div>
  );
};

export default HeadAIStyleStartPage;