import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebsiteAnalysisReview from './WebsiteAnalysisReview';
import WorkflowAnimation from './WorkflowAnimation';
import JobRightProspectCard from './JobRightProspectCard';

// CSS for scrolling animation
const scrollingStyle = `
  @keyframes scroll-seamless {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .animate-scroll-seamless {
    animation: scroll-seamless 40s linear infinite;
  }

  .scroll-container {
    mask: linear-gradient(90deg, transparent, white 10%, white 90%, transparent);
    -webkit-mask: linear-gradient(90deg, transparent, white 10%, white 90%, transparent);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = scrollingStyle;
  if (!document.head.querySelector('style[data-scroll-animation]')) {
    styleSheet.setAttribute('data-scroll-animation', 'true');
    document.head.appendChild(styleSheet);
  }
}

const HeadAIStyleStartPage = ({ onWebsiteSubmit, config }) => {
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessType, setBusinessType] = useState('auto');
  const [goal, setGoal] = useState('partnership');
  const [showAnalysisReview, setShowAnalysisReview] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(4); // FAQ item 5 is expanded by default (0-indexed)
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10; // 降低阈值，更快触发
      setScrolled(isScrolled);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "How is MailGen different from other email marketing platforms like Mailchimp?",
      answer: "MailGen is powered by AI that works 24/7 autonomously. Unlike traditional platforms that require manual setup and management, our AI agent automatically finds prospects, analyzes their needs, crafts personalized emails, and optimizes campaigns in real-time without human intervention."
    },
    {
      question: "Will MailGen share my business data or email lists?",
      answer: "No, we never share your business data or email lists. Your data is encrypted and stored securely. We follow strict privacy protocols and only use your information to improve your email campaigns. You maintain full ownership and control of all your data."
    },
    {
      question: "Is MailGen free to use?",
      answer: "MailGen offers a free trial to get you started. After the trial, we have flexible pricing plans based on the number of prospects and emails sent. Our AI optimization often leads to better ROI compared to traditional email platforms."
    },
    {
      question: "Where does MailGen's prospect and email data come from?",
      answer: "Our AI agent sources prospect data from publicly available business information, professional networks, and verified databases. All data collection complies with privacy regulations and best practices. We ensure high-quality, accurate contact information for better deliverability."
    },
    {
      question: "What regions does MailGen's email automation service cover?",
      answer: "Our primary service is currently within the United States. Additionally, we offer email marketing automation that supports international campaigns and global outreach. We're continuously expanding into new regions and will keep our users informed as we grow."
    },
    {
      question: "I have more questions!",
      answer: "We're here to help! Contact our support team through the chat widget, email us at support@mailgen.ai, or schedule a demo call. Our team is available to answer any questions about how MailGen can transform your email marketing."
    }
  ];

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
    <div className="min-h-screen text-black relative overflow-hidden" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}}>
      {/* Fixed Top Navigation Bar - Dynamic transparent/solid style */}
      <nav className="fixed top-3 left-0 right-0 z-50 transition-all duration-300">
        <div className="flex justify-center px-4">
          <div className={`transition-all duration-300 rounded-full px-12 py-2 flex items-center space-x-12 ${
            scrolled
              ? 'bg-white shadow-lg border border-gray-200'
              : 'bg-transparent'
          }`}>
            {/* Left side - MailGen Logo */}
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                scrolled ? 'bg-[#00f0a0]' : 'bg-[#00f0a0]/80 backdrop-blur-sm'
              }`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l4-4m0 0l4 4m-4-4v11a3 3 0 003 3h4m0 0l-4 4m4-4l4-4" />
                </svg>
              </div>
              <span className="text-base font-bold text-black">MailGen</span>
            </div>

            {/* Center - Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="relative group">
                <button className="font-medium text-gray-700 hover:text-black transition-all duration-300 flex items-center space-x-1">
                  <span>Features</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <a href="#" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                AI Agent
              </a>
              <a href="#" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                Email AI
              </a>
              <a href="#" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                For Businesses
              </a>
              <a href="#" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                About Us
              </a>
              <a href="#" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                Blog
              </a>
            </div>

            {/* Right side - Auth buttons */}
            <div className="flex items-center space-x-4">
              {/* Sign In Button */}
              <button
                onClick={() => navigate('/sign-in')}
                className="font-medium text-gray-700 hover:text-black transition-all duration-300"
              >
                SIGN IN
              </button>

              {/* Join Now Button */}
              <button
                onClick={() => navigate('/sign-up')}
                className="font-medium px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-300"
              >
                JOIN NOW
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Top Section with Gradient Background - Added top padding for floating nav */}
      <div style={{ background: 'linear-gradient(to bottom, #22d3ee 0%, #a7f3d0 40%, #ffffff 80%, #ffffff 100%)', paddingTop: '70px' }}>
        {/* Header - Empty to maintain spacing */}
        <header className="relative z-20 py-6 px-8">
          <div className="h-10"></div>
        </header>

        {/* Main Hero Section */}
        <main className="flex-1 flex items-center justify-center" style={{ minHeight: '70vh' }}>
          <div className="w-full max-w-[85vw] mx-auto">
            {/* Main Layout */}
            <div className="relative w-full h-full py-12">
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
        </main>

      </div>

      {/* Companies Section - Exact replica of Desktop/com.png */}
      <div className="relative z-10 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-gray-100 rounded-3xl p-12 mb-12" style={{ height: '380px' }}>
            <div className="flex items-center justify-between mb-8">
              {/* Left side text - smaller than stats */}
              <div className="flex-1 pr-16">
                <h2 className="text-2xl font-bold text-black leading-tight">
                  Never Miss Your Clients Again.<br />
                  Join The Largest Marketing Platform!
                </h2>
              </div>

              {/* Right side stats - largest text */}
              <div className="flex items-center space-x-16">
                <div className="text-center">
                  <div className="text-5xl font-bold text-black mb-2">900,000+</div>
                  <div className="text-sm text-gray-600">Today's new prospects</div>
                </div>
                <div className="w-px h-16 bg-gray-400"></div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-black mb-2">80,000,000+</div>
                  <div className="text-sm text-gray-600">Total prospects</div>
                </div>
              </div>
            </div>

            {/* Continuous scrolling companies inside gray container - fully contained */}
            <div className="overflow-hidden relative" style={{ height: '120px' }}>
              <div className="flex items-center animate-scroll-seamless py-3" style={{ width: '300%', height: '100%' }}>
                {/* Microsoft */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Microsoft • 47 hours ago</div>
                    <div className="font-semibold text-black text-base">Business Development Manager</div>
                  </div>
                </div>

                {/* Apple */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Apple • 3 hours ago</div>
                    <div className="font-semibold text-black text-base">Product Marketing Lead</div>
                  </div>
                </div>

                {/* Google */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Google • 1 hour ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Manager</div>
                  </div>
                </div>

                {/* Amazon */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.84 22.13c3.59-.7 6.73-3.07 8.53-6.43.19-.37-.01-.8-.44-.8h-1.87c-.27 0-.51.15-.64.39a8.75 8.75 0 01-4.93 4.17c-.24.1-.32.38-.18.58l.96 1.37c.18.26.34.39.57.72zm-3.68 0c3.59-.7 6.73-3.07 8.53-6.43.19-.37-.01-.8-.44-.8h-1.87c-.27 0-.51.15-.64.39a8.75 8.75 0 01-4.93 4.17c-.24.1-.32.38-.18.58l.96 1.37c.18.26.34.39.57.72z"/>
                      <path d="M20.88 19.44c-1.46 1.92-3.83 3.16-6.5 3.16-2.67 0-5.04-1.24-6.5-3.16-.13-.17-.35-.27-.58-.27-.24 0-.46.11-.58.29-.12.18-.15.4-.08.6.36.99.91 1.9 1.6 2.68.69.78 1.51 1.43 2.42 1.91.91.48 1.9.73 2.92.73s2.01-.25 2.92-.73c.91-.48 1.73-1.13 2.42-1.91.69-.78 1.24-1.69 1.6-2.68.07-.2.04-.42-.08-.6-.12-.18-.34-.29-.58-.29-.23 0-.45.1-.58.27z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Amazon • 5 hours ago</div>
                    <div className="font-semibold text-black text-base">Marketing Director</div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Meta • 2 hours ago</div>
                    <div className="font-semibold text-black text-base">Digital Marketing Specialist</div>
                  </div>
                </div>

                {/* Tesla */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3.848L7.154 1.539 2.308 3.848 7.154 6.157zm0 0l4.846-2.309L21.692 3.848 16.846 6.157zm-4.846 8.464l4.846 2.309 4.846-2.309-4.846-2.309zm0-4.156l4.846 2.309 4.846-2.309L12 5.847zm-4.846 8.465l4.846 2.309 4.846-2.309-4.846-2.309zm9.692-4.156l4.846 2.309 4.846-2.309-4.846-2.309z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tesla • 4 hours ago</div>
                    <div className="font-semibold text-black text-base">Brand Manager</div>
                  </div>
                </div>

                {/* Netflix */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.284.002-22.95zM5.398 1.049V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Netflix • 6 hours ago</div>
                    <div className="font-semibold text-black text-base">Content Marketing Manager</div>
                  </div>
                </div>

                {/* Spotify */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Spotify • 8 hours ago</div>
                    <div className="font-semibold text-black text-base">Music Marketing Lead</div>
                  </div>
                </div>

                {/* Duplicate set for seamless loop - exact same companies */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Microsoft • 47 hours ago</div>
                    <div className="font-semibold text-black text-base">Business Development Manager</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Apple • 3 hours ago</div>
                    <div className="font-semibold text-black text-base">Product Marketing Lead</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Google • 1 hour ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Manager</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.84 22.13c3.59-.7 6.73-3.07 8.53-6.43.19-.37-.01-.8-.44-.8h-1.87c-.27 0-.51.15-.64.39a8.75 8.75 0 01-4.93 4.17c-.24.1-.32.38-.18.58l.96 1.37c.18.26.34.39.57.72zm-3.68 0c3.59-.7 6.73-3.07 8.53-6.43.19-.37-.01-.8-.44-.8h-1.87c-.27 0-.51.15-.64.39a8.75 8.75 0 01-4.93 4.17c-.24.1-.32.38-.18.58l.96 1.37c.18.26.34.39.57.72z"/>
                      <path d="M20.88 19.44c-1.46 1.92-3.83 3.16-6.5 3.16-2.67 0-5.04-1.24-6.5-3.16-.13-.17-.35-.27-.58-.27-.24 0-.46.11-.58.29-.12.18-.15.4-.08.6.36.99.91 1.9 1.6 2.68.69.78 1.51 1.43 2.42 1.91.91.48 1.9.73 2.92.73s2.01-.25 2.92-.73c.91-.48 1.73-1.13 2.42-1.91.69-.78 1.24-1.69 1.6-2.68.07-.2.04-.42-.08-.6-.12-.18-.34-.29-.58-.29-.23 0-.45.1-.58.27z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Amazon • 5 hours ago</div>
                    <div className="font-semibold text-black text-base">Marketing Director</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How Your AI Agent Works Section - White Background */}
      <div className="relative z-10 py-12 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">

          {/* ALL 4 STEPS WITH CONSISTENT LAYOUT */}

          {/* Step 1: AI Agent - Full screen size like Desktop/chat.png */}
          <div className="mb-12">
            <div className="bg-[#00f5a0] rounded-3xl shadow-lg" style={{ minHeight: '800px', width: '100%', padding: '60px' }}>
              <div className="relative w-full h-full" style={{ minHeight: '680px' }}>

                {/* Left text area - exact positioning from Desktop/chat.png (left side, vertically centered) */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2" style={{ width: '55%', paddingRight: '40px' }}>
                  <div className="text-left">
                    {/* Main title text - exact size and style from Desktop/chat.png */}
                    <h1 className="font-bold text-black leading-tight" style={{ fontSize: '52px', marginBottom: '40px', lineHeight: '1.2' }}>
                      Your AI Copilot 
                      Marketing automation can be lonely
                    </h1>

                    {/* Bullet points - exact spacing from Desktop/chat.png */}
                    <div className="space-y-4 text-black" style={{ fontSize: '22px' }}>
                      <p>• Focus your efforts with a more tailored list of prospects</p>
                      <p>• Wow in your outreach with specific company insights</p>
                      <p>• Understand why you are a good fit for a partnership</p>
                      <p>• Stuck in your marketing or outreach? Get personalized guidance and coaching</p>
                    </div>
                  </div>
                </div>

                {/* Chat interface - exact bottom-right positioning from Desktop/chat.png */}
                <div className="absolute" style={{ bottom: '0px', right: '0px', width: '480px', height: '580px' }}>
                  <div className="bg-white rounded-3xl shadow-2xl overflow-visible relative w-full h-full" style={{ border: '1px solid #e5e7eb' }}>

                    {/* Chat header - smaller sizing */}
                    <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-t-3xl border-b border-gray-100">
                      <div className="flex items-center justify-center rounded-full" style={{ width: '40px', height: '40px', backgroundColor: '#00f0a0' }}>
                        <div className="w-2 h-2 bg-black rounded-full mr-0.5"></div>
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                      <div>
                        <h2 className="text-black font-semibold" style={{ fontSize: '20px' }}>AI Agent</h2>
                      </div>
                    </div>

                    {/* Chat content area - smaller padding */}
                    <div className="px-6 py-4 bg-white relative overflow-visible" style={{ height: 'calc(100% - 140px)' }}>

                      {/* AI greeting message - smaller components */}
                      <div className="flex items-start gap-3 mb-6">
                        <div className="flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', backgroundColor: '#00f0a0' }}>
                          <div className="w-2 h-2 bg-black rounded-full mr-0.5"></div>
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                        <div style={{ maxWidth: '280px' }}>
                          <p className="text-black leading-relaxed" style={{ fontSize: '14px' }}>
                            Welcome to AI Agent! I am your personal AI marketing copilot.
                            How can I help you today?
                          </p>
                        </div>
                      </div>

                      {/* User suggestion buttons - smaller spacing and padding */}
                      <div className="space-y-3" style={{ marginTop: '40px' }}>
                        <div className="flex justify-center">
                          <div className="rounded-2xl text-black shadow-sm" style={{
                            backgroundColor: '#00f0a0',
                            fontSize: '13px',
                            padding: '10px 16px'
                          }}>
                            Show me website analysis at AI startups in Silicon Valley
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="rounded-2xl text-black shadow-sm" style={{
                            backgroundColor: '#00f0a0',
                            fontSize: '13px',
                            padding: '10px 16px'
                          }}>
                            What are the latest qualified prospects for data analyst?
                          </div>
                        </div>

                        {/* This bubble extends outside container */}
                        <div className="flex justify-end">
                          <div className="rounded-2xl text-black shadow-sm whitespace-nowrap" style={{
                            backgroundColor: '#00f0a0',
                            fontSize: '13px',
                            padding: '10px 16px',
                            transform: 'translateX(70px)'
                          }}>
                            Which startups in New York recently received Series A funding?
                          </div>
                        </div>
                      </div>

                      {/* Typing dots - smaller and repositioned */}
                      <div className="absolute" style={{ bottom: '10px', right: '24px' }}>
                        <div className="flex items-center space-x-1">
                          <div className="rounded-full animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: '#00f0a0' }}></div>
                          <div className="rounded-full animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: '#00f0a0', animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom input - smaller sizing */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black text-white rounded-full flex items-center justify-between cursor-pointer shadow-xl" style={{
                        fontSize: '14px',
                        padding: '12px 20px'
                      }}>
                        <span>Ask AI Agent</span>
                        <div className="rounded-full bg-white flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                          <svg className="text-black" style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Discovery - Exact Desktop/prospect.png layout recreation */}
          <div className="mb-12">
            <div className="bg-gray-100 rounded-3xl shadow-lg" style={{ minHeight: '800px', width: '100%', padding: '60px' }}>
              <div className="relative w-full h-full" style={{ minHeight: '680px' }}>

                {/* Left text area - exact positioning from Desktop/prospect.png */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2" style={{ width: '55%', paddingRight: '40px' }}>
                  <div className="text-left">
                    {/* Star icon and title - exact style from Desktop/prospect.png */}
                    <div className="flex items-start mb-8">
                      <div className="w-12 h-12 mr-4 flex items-center justify-center flex-shrink-0 mt-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center transform rotate-45">
                          <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45"></div>
                        </div>
                      </div>
                      <h1 className="font-bold text-black leading-tight" style={{ fontSize: '52px', marginBottom: '40px', lineHeight: '1.2' }}>
                        AI Prospect Hunter 
                        Increase your success with AI matched Prospects
                      </h1>
                    </div>

                    {/* Bullet points - exact spacing from Desktop/prospect.png */}
                    <div className="space-y-4 text-black" style={{ fontSize: '22px' }}>
                      <p>• Apply only to Prospects you are qualified for</p>
                      <p>• Discover matched prospects based on your business, not only titles</p>
                      <p>• Say goodbye to fake prospects</p>
                      <p>• Find early with our custom prospect alerts</p>
                    </div>

                    {/* Black button - exact style from Desktop/prospect.png */}
                    <div style={{ marginTop: '60px' }}>
                      <div className="bg-black text-white rounded-full flex items-center cursor-pointer shadow-lg" style={{
                        fontSize: '16px',
                        padding: '12px 24px',
                        width: 'fit-content'
                      }}>
                        <span>Start Hunting</span>
                        <div className="rounded-full bg-white flex items-center justify-center ml-3" style={{ width: '24px', height: '24px' }}>
                          <svg className="text-black" style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Job match interface from Desktop/prospect.png */}
                <div className="absolute" style={{ bottom: '0px', right: '0px', width: '480px', height: '580px' }}>
                  <div className="bg-white rounded-3xl shadow-2xl relative w-full h-full p-8" style={{ border: '1px solid #e5e7eb' }}>

                    {/* Job card header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5">
                          <svg className="w-full h-full" viewBox="0 0 24 24">
                            {/* Microsoft's four colored squares */}
                            <rect x="0" y="0" width="11" height="11" fill="#f25022"/> {/* Red - Top Left */}
                            <rect x="12.5" y="0" width="11" height="11" fill="#7fba00"/> {/* Green - Top Right */}
                            <rect x="0" y="12.5" width="11" height="11" fill="#00a4ef"/> {/* Blue - Bottom Left */}
                            <rect x="12.5" y="12.5" width="11" height="11" fill="#ffb900"/> {/* Yellow - Bottom Right */}
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">2 hours ago</div>
                          <h3 className="text-xl font-bold text-black">Marketing Director</h3>
                          <div className="text-gray-600">SaaS Solutions Corp</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10d9c4" strokeWidth="2" strokeDasharray="96, 100" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-black">89%</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Match Score</div>
                      </div>
                    </div>

                    {/* Match percentages */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10d9c4" strokeWidth="2" strokeDasharray="100, 100" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-black">95%</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">Budget Fit</div>
                      </div>
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10d9c4" strokeWidth="2" strokeDasharray="92, 100" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-black">87%</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">Need Urgency</div>
                      </div>
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10d9c4" strokeWidth="2" strokeDasharray="96, 100" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-black">91%</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">Authority Level</div>
                      </div>
                    </div>

                    {/* Why You Are A Good Fit section */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-black mb-4">Why This Is A Quality Prospect</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-green-400 rounded flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="bg-green-400 text-black px-3 py-1 rounded-full text-sm font-medium">Decision Maker</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-green-400 rounded flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="bg-green-400 text-black px-3 py-1 rounded-full text-sm font-medium">Active Buyer</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-gray-300 rounded flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <span className="text-gray-600 text-sm">Price Sensitive</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-5 h-5 bg-green-400 rounded flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="bg-green-400 text-black px-3 py-1 rounded-full text-sm font-medium">Growth Focused</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Step 3: Email Composition */}
          <div className="mb-12">
            <div className="bg-[#00f5a0] rounded-3xl shadow-lg" style={{ minHeight: '800px', width: '100%', padding: '60px' }}>
              <div className="relative w-full h-full" style={{ minHeight: '680px' }}>

                {/* Left text area - same positioning as Step 1 & 2 */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2" style={{ width: '55%', paddingRight: '40px' }}>
                  <div className="text-left">
                    {/* Step header */}
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="text-sm font-semibold text-black uppercase tracking-wider"></div>
                    </div>

                    {/* Main title text - same size as Step 1 & 2 */}
                    <h1 className="font-bold text-black leading-tight" style={{ fontSize: '52px', marginBottom: '40px', lineHeight: '1.2' }}>
                      Personalized Email Crafting
                    </h1>

                    <p className="text-black mb-8 leading-relaxed" style={{ fontSize: '22px' }}>
                      Each email is uniquely crafted using advanced AI that understands your prospect's business context, pain points, and communication style. The system generates compelling subject lines and personalized content that resonates with each recipient.
                    </p>

                    {/* Bullet points - same spacing as Step 1 & 2 */}
                    <div className="space-y-4 text-black" style={{ fontSize: '22px' }}>
                      <p>• Context-aware personalization</p>
                      <p>• A/B tested subject lines</p>
                      <p>• Industry-specific messaging</p>
                    </div>

                    {/* Black button - same style as Step 2 */}
                    <div style={{ marginTop: '60px' }}>
                      <div className="bg-black text-white rounded-full flex items-center cursor-pointer shadow-lg" style={{
                        fontSize: '16px',
                        padding: '12px 24px',
                        width: 'fit-content'
                      }}>
                        <span>Start Writing</span>
                        <div className="rounded-full bg-white flex items-center justify-center ml-3" style={{ width: '24px', height: '24px' }}>
                          <svg className="text-black" style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Email interface positioned like Step 1 & 2 */}
                <div className="absolute" style={{ bottom: '0px', right: '0px', width: '480px', height: '580px' }}>
                  <div className="bg-white rounded-3xl shadow-2xl relative w-full h-full p-6" style={{ border: '1px solid #e5e7eb' }}>
                    {/* Email Interface Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-black">[WRITE] AI Email Composer</h4>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Live</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Composer Header with AI Indicators */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-black">AI Writing Assistant Active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs bg-black text-white px-3 py-1 rounded-full font-medium">95% Quality Score</div>
                          <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Personalized</div>
                        </div>
                      </div>

                      {/* Enhanced Email Fields */}
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-black w-16">To:</span>
                          <div className="flex items-center space-x-2 bg-white border border-[#00f5a0]/20 rounded-lg p-2 flex-1">
                            <div className="w-8 h-8 bg-[#00f5a0] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">SC</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-black">sarah.chen@techflow.com</div>
                              <div className="text-xs text-gray-600">CTO at TechFlow Inc • Verified</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-black w-16">Subject:</span>
                          <div className="flex items-center justify-between bg-white border border-[#00f5a0]/20 rounded-lg p-2 flex-1">
                            <span className="text-sm font-medium text-black">Partnership Opportunity - FruitAI</span>
                            <div className="flex items-center space-x-1">
                              <div className="text-xs bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded">A/B Tested</div>
                              <div className="text-xs bg-[#00f5a0]/10 text-[#00c98d] px-2 py-1 rounded">85% Open Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Editor Toolbar */}
                      <div className="flex items-center justify-between border-y border-gray-200 py-2">
                        <div className="flex items-center space-x-2">
                          <button className="text-xs bg-white hover:bg-gray-100 text-black px-2 py-1 rounded border border-gray-200 font-medium transition-colors">
                            <span className="font-bold">B</span>
                          </button>
                          <button className="text-xs bg-white hover:bg-gray-100 text-black px-2 py-1 rounded border border-gray-200 font-medium italic transition-colors">
                            <span>I</span>
                          </button>
                          <button className="text-xs bg-white hover:bg-gray-100 text-black px-2 py-1 rounded border border-gray-200 font-medium underline transition-colors">
                            U
                          </button>
                          <div className="h-4 w-px bg-gray-300 mx-2"></div>
                          <button className="text-xs bg-white hover:bg-gray-100 text-black px-3 py-1 rounded border border-gray-200 font-medium transition-colors flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>Link</span>
                          </button>
                          <button className="text-xs bg-white hover:bg-gray-100 text-black px-3 py-1 rounded border border-gray-200 font-medium transition-colors flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span>Attach</span>
                          </button>
                        </div>
                        <button className="text-xs bg-[#00f5a0] text-black px-3 py-1 rounded font-medium hover:bg-green-400 transition-colors flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span>AI Enhance</span>
                        </button>
                      </div>

                      {/* Email Content */}
                      <div className="bg-white border border-[#00f5a0]/20 rounded-xl p-4 min-h-[250px]">
                        <div className="text-sm text-black leading-relaxed space-y-3">
                          <p><strong>Dear Sarah,</strong></p>
                          <p>I hope this message finds you well!</p>
                          <p>
                            We're excited to introduce <strong>FruitAI</strong> - our cutting-edge Freshness Analyzer that could
                            significantly enhance TechFlow Inc's supply chain operations and drive operational excellence.
                          </p>

                        </div>
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Analytics */}
          <div className="mb-12">
            <div className="bg-[#f0f4f8] rounded-3xl shadow-lg" style={{ minHeight: '800px', width: '100%', padding: '60px' }}>
              <div className="relative w-full h-full" style={{ minHeight: '680px' }}>

                {/* Left text area - same positioning as Step 1 & 2 */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2" style={{ width: '55%', paddingRight: '40px' }}>
                  <div className="text-left">
                    {/* Step header */}
                    <div className="flex items-center space-x-3 mb-8">
                    </div>

                    {/* Main title text - same size as Step 1 & 2 */}
                    <h1 className="font-bold text-black leading-tight" style={{ fontSize: '52px', marginBottom: '40px', lineHeight: '1.2' }}>
                      Intelligent Performance Tracking
                    </h1>

                    <p className="text-black mb-8 leading-relaxed" style={{ fontSize: '22px' }}>
                      Real-time analytics powered by AI insights help you understand what's working.
                    </p>

                    {/* Bullet points - same spacing as Step 1 & 2 */}
                    <div className="space-y-4 text-black" style={{ fontSize: '22px' }}>
                      <p>• Real-time performance monitoring</p>
                      <p>• AI-powered optimization</p>
                      <p>• Automatic adjustments</p>
                    </div>

                    {/* Black button - same style as Step 2 */}
                    <div style={{ marginTop: '60px' }}>
                      <div className="bg-black text-white rounded-full flex items-center cursor-pointer shadow-lg" style={{
                        fontSize: '16px',
                        padding: '12px 24px',
                        width: 'fit-content'
                      }}>
                        <span>Start Analyzing</span>
                        <div className="rounded-full bg-white flex items-center justify-center ml-3" style={{ width: '24px', height: '24px' }}>
                          <svg className="text-black" style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Analytics interface positioned like Step 1 & 2 */}
                <div className="absolute" style={{ bottom: '0px', right: '0px', width: '480px', height: '580px' }}>
                  <div className="bg-white rounded-3xl shadow-2xl relative w-full h-full p-6" style={{ border: '1px solid #e5e7eb' }}>
                    {/* Dashboard Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-black">[ANALYZE] Campaign Performance Dashboard</h4>
                        <div className="bg-[#00f5a0]/10 text-black px-3 py-1 rounded-full text-sm font-medium">Live Data</div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-[#00f5a0] rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-pulse"></div>
                            <span className="text-xs text-black font-medium">Live</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-black mb-1">94.2%</div>
                        <div className="text-sm font-medium text-black mb-1">Email Deliverability</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded-full font-medium">+2.3% vs avg</div>
                          <span className="text-xs text-gray-500">Industry: 91.9%</span>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-[#00f5a0] rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <div className="text-xs bg-gray-100 text-black px-2 py-1 rounded-full font-medium">Trending Up</div>
                        </div>
                        <div className="text-2xl font-bold text-black mb-1">47.8%</div>
                        <div className="text-sm font-medium text-black mb-1">Open Rate</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded-full font-medium">+15.2% this week</div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-[#00f5a0] rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <div className="text-xs bg-gray-100 text-black px-2 py-1 rounded-full font-medium">Above Target</div>
                        </div>
                        <div className="text-2xl font-bold text-black mb-1">12.4%</div>
                        <div className="text-sm font-medium text-black mb-1">Response Rate</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded-full font-medium">Target: 8%</div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-[#00f5a0] rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-xs bg-gray-100 text-black px-2 py-1 rounded-full font-medium">24h</div>
                        </div>
                        <div className="text-2xl font-bold text-black mb-1">247</div>
                        <div className="text-sm font-medium text-black mb-1">Qualified Prospects</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded-full font-medium">+34 today</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Matching Desktop/question.png design with grey container */}
      <div className="relative z-10 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-gray-100 rounded-3xl p-16 mb-12" style={{ minHeight: '600px' }}>
            {/* FAQ Header */}
            <div className="mb-12">
              <h2 className="text-6xl font-bold text-black leading-tight">
                FREQUENTLY<br />
                ASKED QUESTIONS
              </h2>
            </div>

            {/* FAQ Items */}
            <div className="space-y-6 max-w-4xl">
              {faqData.map((faq, index) => (
                <div key={index} className={`${index === faqData.length - 1 ? 'pb-6' : 'border-b border-gray-300 pb-6'}`}>
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleFaq(index)}
                  >
                    <h3 className="text-xl font-medium text-black pr-8">
                      {faq.question}
                    </h3>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 group-hover:border-gray-500 transition-colors flex-shrink-0">
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedFaq === index ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Answer content with smooth animation */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === index ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-0">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Matching Desktop/foot.png design */}
      <footer className="relative z-10 bg-white py-12 px-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex justify-between items-start">
            {/* Left side - MailGen logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-[#00f0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l4-4m0 0l4 4m-4-4v11a3 3 0 003 3h4m0 0l-4 4m4-4l4-4" />
                </svg>
                <span className="text-xl font-bold text-black">MailGen</span>
              </div>
            </div>

            {/* Right side - Social media icons */}
            <div className="flex items-center space-x-3">
              {/* LinkedIn */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>

              {/* Instagram */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>

              {/* TikTok */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </div>

              {/* Twitter/X */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                </svg>
              </div>

              {/* YouTube */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>

              {/* Facebook */}
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-12 grid grid-cols-4 gap-8">
            {/* Features Column */}
            <div>
              <h3 className="text-base font-semibold text-black mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">AI Email Generator</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Prospect Finder</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Smart Campaigns</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Analytics Dashboard</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">A/B Testing</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Lead Scoring</a></li>
              </ul>
            </div>

            {/* Blog Column */}
            <div>
              <h3 className="text-base font-semibold text-black mb-4">Blog</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Is MailGen Legit?</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Success Stories from MailGen Users</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">What Top AI Companies Are Looking For</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">MailGen AI Agent Launch</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Top Email Marketing Strategies</a></li>
              </ul>
            </div>

            {/* Related Tools Column */}
            <div>
              <h3 className="text-base font-semibold text-black mb-4">Related Tools</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">AI Email Assistant</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">AI Subject Line Generator</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">AI Campaign Helper</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">AI Lead Tracker</a></li>
              </ul>
            </div>

            {/* Information Column */}
            <div>
              <h3 className="text-base font-semibold text-black mb-4">Information</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">About Us</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-black hover:text-gray-600 transition-colors text-sm">Partners</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeadAIStyleStartPage;