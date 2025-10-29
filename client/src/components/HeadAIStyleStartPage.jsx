import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import WebsiteAnalysisReview from './WebsiteAnalysisReview';
import WorkflowAnimation from './WorkflowAnimation';
import JobRightProspectCard from './JobRightProspectCard';
import FloatingTestimonials from './FloatingTestimonials';

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
    animation: scroll-seamless 20s linear infinite;
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

const HeadAIStyleStartPage = ({ onWebsiteSubmit, config, onComplete }) => {
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
              <a href="/ai-agent" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                AI Agent
              </a>
              <a href="/features" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                Features
              </a>
              <a href="/for-businesses" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                For Businesses
              </a>
              <a href="/about" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                About Us
              </a>
              <a href="/blog" className="font-medium text-gray-700 hover:text-black transition-all duration-300">
                Blog
              </a>
            </div>

            {/* Right side - Auth buttons or User Profile */}
            <div className="flex items-center space-x-4">
              {/* Show when user is NOT signed in */}
              <SignedOut>
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
              </SignedOut>

              {/* Show when user IS signed in */}
              <SignedIn>
                {/* Workflow Dashboard Link */}
                <button
                  onClick={() => {
                    // Navigate to SimpleWorkflowDashboard via onComplete callback
                    if (onComplete) {
                      onComplete({ nextStep: 'dashboard' });
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className="font-medium text-gray-700 hover:text-black transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Dashboard</span>
                </button>

                {/* Clerk User Button with dropdown */}
                <div className="flex items-center">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard: "shadow-lg border border-gray-200",
                        userButtonPopoverActionButton: "hover:bg-gray-100",
                      }
                    }}
                  />
                </div>
              </SignedIn>
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
                {/* OpenAI */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">OpenAI • 1 hour ago</div>
                    <div className="font-semibold text-black text-base">AI Product Manager</div>
                  </div>
                </div>

                {/* Microsoft */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <rect fill="#F25022" width="11" height="11"/>
                      <rect fill="#7FBA00" x="12.5" width="11" height="11"/>
                      <rect fill="#00A4EF" y="12.5" width="11" height="11"/>
                      <rect fill="#FFB900" x="12.5" y="12.5" width="11" height="11"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Microsoft • 2 hours ago</div>
                    <div className="font-semibold text-black text-base">Business Development Manager</div>
                  </div>
                </div>

                {/* Apple */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
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
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Google • 30 min ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Manager</div>
                  </div>
                </div>

                {/* Nvidia */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm6.326 11.998c-.113-.564-.791-.79-2.235-.79h-.902v3.408h.902c1.444 0 2.122-.225 2.235-.79.113-.564.113-1.264 0-1.828zm-1.333 4.52h-2.104V7.482h2.104c1.782 0 2.895.339 3.234 1.468.226.677.226 1.807 0 2.598-.339 1.129-1.452 1.47-3.234 1.47zm-5.654-7.036h-2.55v7.036h.902v-2.825h1.648c1.217 0 1.782-.339 2.008-1.016.113-.339.113-.79 0-1.129-.226-.677-.791-1.066-2.008-1.066zm-.226 3.52h-1.421V8.547h1.421c.678 0 1.103.225 1.217.564.113.226.113.677 0 .903-.114.339-.539.564-1.217.564zm-4.523 3.516V7.482H5.688v7.036h.902z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Nvidia • 4 hours ago</div>
                    <div className="font-semibold text-black text-base">AI Solutions Engineer</div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.911 12.86v7.625h3.12v-7.616c0-2.393 1.273-3.605 3.459-3.605.205 0 .476.014.742.043V6.221c-.242-.029-.511-.043-.734-.043-1.945 0-3.141 1.016-3.588 2.522h-.057V6.357H12.91v6.503zM6.324 20.485h3.12v-14.128H6.324v14.128zM7.885 2.5a1.827 1.827 0 1 0 0 3.654 1.827 1.827 0 0 0 0-3.654z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Meta • 5 hours ago</div>
                    <div className="font-semibold text-black text-base">Digital Marketing Specialist</div>
                  </div>
                </div>

                {/* Salesforce */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.006 5.413a4.905 4.905 0 0 1 5.223-1.283 5.346 5.346 0 0 1 7.28 2.974 4.236 4.236 0 0 1 1.49 8.058 5.036 5.036 0 0 1-5.728 4.925 5.814 5.814 0 0 1-7.974 1.513A4.893 4.893 0 0 1 3.5 18.843a4.634 4.634 0 0 1 1.912-8.09 5.186 5.186 0 0 1 4.594-5.34z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Salesforce • 6 hours ago</div>
                    <div className="font-semibold text-black text-base">CRM Solutions Manager</div>
                  </div>
                </div>

                {/* Stripe */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Stripe • 7 hours ago</div>
                    <div className="font-semibold text-black text-base">Payments Partnerships Lead</div>
                  </div>
                </div>

                {/* Shopify */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.337 2.543s-.296.232-.79.618c-.114-.352-.296-.788-.556-1.195-.662-.982-1.632-1.519-2.802-1.519h-.043c-.088 0-.177.012-.265.024-.474-.618-.97-.866-1.283-.866-3.221 0-4.772 4.025-5.261 6.066-.947.296-1.612.503-1.686.525-.556.177-.571.189-.643.708C1.93 7.447 0 20.94 0 20.94L13.23 23.5l8.77-1.856S15.337 2.543 15.337 2.543zm-3.865.76c-.428.13-.902.281-1.407.44-.39-1.519-1.117-2.256-1.883-2.669.662.21 1.61 1.117 2.15 2.669zm-2.472.044c-.662.207-1.389.43-2.121.659.408-1.568 1.177-2.333 1.845-2.641.525-.238.966-.34 1.329-.366-.284.395-.61.984-.884 2.349zm-2.012-2.543c.13 0 .265.036.407.103-.637.314-1.303 1.117-1.692 2.82l-1.889.589c.556-1.778 1.611-3.459 3.174-3.512z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Shopify • 8 hours ago</div>
                    <div className="font-semibold text-black text-base">E-commerce Growth Lead</div>
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
                    <div className="text-sm text-gray-500">Netflix • 9 hours ago</div>
                    <div className="font-semibold text-black text-base">Content Marketing Manager</div>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">LinkedIn • 10 hours ago</div>
                    <div className="font-semibold text-black text-base">B2B Marketing Director</div>
                  </div>
                </div>

                {/* Airbnb */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.388 0 0 5.388 0 12s5.388 12 12 12 12-5.38 12-12c0-6.612-5.38-12-12-12zm0 22.16c-5.607 0-10.16-4.553-10.16-10.16S6.393 1.84 12 1.84 22.16 6.393 22.16 12 17.607 22.16 12 22.16zm0-15.6c-2.44 0-4.438 1.998-4.438 4.438S9.56 15.436 12 15.436s4.44-1.998 4.44-4.438S14.44 6.56 12 6.56zm0 7.084c-1.46 0-2.646-1.186-2.646-2.646S10.54 8.352 12 8.352s2.644 1.186 2.644 2.646-1.184 2.646-2.644 2.646z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Airbnb • 12 hours ago</div>
                    <div className="font-semibold text-black text-base">Community Growth Manager</div>
                  </div>
                </div>

                {/* Adobe */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Adobe • 14 hours ago</div>
                    <div className="font-semibold text-black text-base">Creative Marketing Lead</div>
                  </div>
                </div>

                {/* Tesla */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5.362l2.475-3.026s.245-.29.69-.29c.445 0 .69.29.69.29L12 10.162 8.145 2.336s.245-.29.69-.29c.445 0 .69.29.69.29L12 5.362zm-5.763 13.728c-.03-.27-.026-.54.012-.808.18-1.287.84-2.473 1.863-3.346.465-.397.992-.71 1.558-.928.207-.08.42-.143.635-.198-.326.726-.517 1.517-.555 2.33-.037.786.034 1.57.21 2.328h-3.723zm12.008 0c.176-.758.247-1.542.21-2.328-.038-.813-.23-1.604-.555-2.33.215.055.428.118.635.198.566.218 1.093.531 1.558.928 1.023.873 1.683 2.06 1.863 3.346.038.268.042.538.012.808h-3.723zm-2.726-10.33c.025-.073-.015-.155-.093-.178l-1.08-.31c-.037-.01-.06-.04-.05-.075l.002-.01c.013-.042.042-.087.087-.125.234-.197.51-.345.806-.432.073-.022.12-.086.113-.155-.01-.096-.105-.176-.225-.176h-.018c-.33.015-.65.114-.934.287-.308.187-.562.454-.74.773-.09.163.04.337.216.29l1.893-.543c.076-.022.135.03.123.095l-.027.165c-.013.076-.107.13-.214.116-.124-.015-.224-.05-.32-.096-.17-.082-.344-.157-.525-.212-.065-.02-.13.03-.134.094-.006.094.04.192.11.27.116.128.294.186.477.142.21-.05.413-.126.604-.224.072-.037.156-.01.18.063.022.068-.015.14-.082.155-.205.048-.417.07-.63.065-.265-.007-.53-.065-.772-.17-.237-.104-.45-.254-.618-.44-.102-.114-.187-.246-.247-.39-.02-.047-.055-.086-.097-.115-.01-.007-.023-.013-.038-.018-.06-.02-.128-.005-.16.043-.036.053-.054.114-.055.178-.003.267.085.527.25.736.347.44.857.723 1.416.79.55.065 1.108-.02 1.604-.248.31-.142.594-.337.84-.574.04-.038.06-.09.052-.143z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tesla • 16 hours ago</div>
                    <div className="font-semibold text-black text-base">Brand Marketing Manager</div>
                  </div>
                </div>

                {/* Uber */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.41 0L5.33 19.54h3.54l.97-6.42h3.42c3.99 0 6.48-2.34 7.14-5.94C21.05 2.88 18.84 0 14.97 0H8.41zm6.25 3.54c1.26 0 1.98.66 1.8 1.68-.21 1.26-1.26 1.68-2.52 1.68h-2.19l.63-3.36h2.28z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Uber • 18 hours ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Lead</div>
                  </div>
                </div>

                {/* Duplicate set for seamless loop - exact same 15 companies */}
                {/* OpenAI - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">OpenAI • 1 hour ago</div>
                    <div className="font-semibold text-black text-base">AI Product Manager</div>
                  </div>
                </div>

                {/* Microsoft - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <rect fill="#F25022" width="11" height="11"/>
                      <rect fill="#7FBA00" x="12.5" width="11" height="11"/>
                      <rect fill="#00A4EF" y="12.5" width="11" height="11"/>
                      <rect fill="#FFB900" x="12.5" y="12.5" width="11" height="11"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Microsoft • 2 hours ago</div>
                    <div className="font-semibold text-black text-base">Business Development Manager</div>
                  </div>
                </div>

                {/* Apple - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Apple • 3 hours ago</div>
                    <div className="font-semibold text-black text-base">Product Marketing Lead</div>
                  </div>
                </div>

                {/* Google - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Google • 30 min ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Manager</div>
                  </div>
                </div>

                {/* Nvidia - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm6.326 11.998c-.113-.564-.791-.79-2.235-.79h-.902v3.408h.902c1.444 0 2.122-.225 2.235-.79.113-.564.113-1.264 0-1.828zm-1.333 4.52h-2.104V7.482h2.104c1.782 0 2.895.339 3.234 1.468.226.677.226 1.807 0 2.598-.339 1.129-1.452 1.47-3.234 1.47zm-5.654-7.036h-2.55v7.036h.902v-2.825h1.648c1.217 0 1.782-.339 2.008-1.016.113-.339.113-.79 0-1.129-.226-.677-.791-1.066-2.008-1.066zm-.226 3.52h-1.421V8.547h1.421c.678 0 1.103.225 1.217.564.113.226.113.677 0 .903-.114.339-.539.564-1.217.564zm-4.523 3.516V7.482H5.688v7.036h.902z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Nvidia • 4 hours ago</div>
                    <div className="font-semibold text-black text-base">AI Solutions Engineer</div>
                  </div>
                </div>

                {/* Meta - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.911 12.86v7.625h3.12v-7.616c0-2.393 1.273-3.605 3.459-3.605.205 0 .476.014.742.043V6.221c-.242-.029-.511-.043-.734-.043-1.945 0-3.141 1.016-3.588 2.522h-.057V6.357H12.91v6.503zM6.324 20.485h3.12v-14.128H6.324v14.128zM7.885 2.5a1.827 1.827 0 1 0 0 3.654 1.827 1.827 0 0 0 0-3.654z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Meta • 5 hours ago</div>
                    <div className="font-semibold text-black text-base">Digital Marketing Specialist</div>
                  </div>
                </div>

                {/* Salesforce - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.006 5.413a4.905 4.905 0 0 1 5.223-1.283 5.346 5.346 0 0 1 7.28 2.974 4.236 4.236 0 0 1 1.49 8.058 5.036 5.036 0 0 1-5.728 4.925 5.814 5.814 0 0 1-7.974 1.513A4.893 4.893 0 0 1 3.5 18.843a4.634 4.634 0 0 1 1.912-8.09 5.186 5.186 0 0 1 4.594-5.34z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Salesforce • 6 hours ago</div>
                    <div className="font-semibold text-black text-base">CRM Solutions Manager</div>
                  </div>
                </div>

                {/* Stripe - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Stripe • 7 hours ago</div>
                    <div className="font-semibold text-black text-base">Payments Partnerships Lead</div>
                  </div>
                </div>

                {/* Shopify - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.337 2.543s-.296.232-.79.618c-.114-.352-.296-.788-.556-1.195-.662-.982-1.632-1.519-2.802-1.519h-.043c-.088 0-.177.012-.265.024-.474-.618-.97-.866-1.283-.866-3.221 0-4.772 4.025-5.261 6.066-.947.296-1.612.503-1.686.525-.556.177-.571.189-.643.708C1.93 7.447 0 20.94 0 20.94L13.23 23.5l8.77-1.856S15.337 2.543 15.337 2.543zm-3.865.76c-.428.13-.902.281-1.407.44-.39-1.519-1.117-2.256-1.883-2.669.662.21 1.61 1.117 2.15 2.669zm-2.472.044c-.662.207-1.389.43-2.121.659.408-1.568 1.177-2.333 1.845-2.641.525-.238.966-.34 1.329-.366-.284.395-.61.984-.884 2.349zm-2.012-2.543c.13 0 .265.036.407.103-.637.314-1.303 1.117-1.692 2.82l-1.889.589c.556-1.778 1.611-3.459 3.174-3.512z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Shopify • 8 hours ago</div>
                    <div className="font-semibold text-black text-base">E-commerce Growth Lead</div>
                  </div>
                </div>

                {/* Netflix - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.284.002-22.95zM5.398 1.049V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Netflix • 9 hours ago</div>
                    <div className="font-semibold text-black text-base">Content Marketing Manager</div>
                  </div>
                </div>

                {/* LinkedIn - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">LinkedIn • 10 hours ago</div>
                    <div className="font-semibold text-black text-base">B2B Marketing Director</div>
                  </div>
                </div>

                {/* Airbnb - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-rose-500 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.388 0 0 5.388 0 12s5.388 12 12 12 12-5.38 12-12c0-6.612-5.38-12-12-12zm0 22.16c-5.607 0-10.16-4.553-10.16-10.16S6.393 1.84 12 1.84 22.16 6.393 22.16 12 17.607 22.16 12 22.16zm0-15.6c-2.44 0-4.438 1.998-4.438 4.438S9.56 15.436 12 15.436s4.44-1.998 4.44-4.438S14.44 6.56 12 6.56zm0 7.084c-1.46 0-2.646-1.186-2.646-2.646S10.54 8.352 12 8.352s2.644 1.186 2.644 2.646-1.184 2.646-2.644 2.646z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Airbnb • 12 hours ago</div>
                    <div className="font-semibold text-black text-base">Community Growth Manager</div>
                  </div>
                </div>

                {/* Adobe - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Adobe • 14 hours ago</div>
                    <div className="font-semibold text-black text-base">Creative Marketing Lead</div>
                  </div>
                </div>

                {/* Tesla - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5.362l2.475-3.026s.245-.29.69-.29c.445 0 .69.29.69.29L12 10.162 8.145 2.336s.245-.29.69-.29c.445 0 .69.29.69.29L12 5.362zm-5.763 13.728c-.03-.27-.026-.54.012-.808.18-1.287.84-2.473 1.863-3.346.465-.397.992-.71 1.558-.928.207-.08.42-.143.635-.198-.326.726-.517 1.517-.555 2.33-.037.786.034 1.57.21 2.328h-3.723zm12.008 0c.176-.758.247-1.542.21-2.328-.038-.813-.23-1.604-.555-2.33.215.055.428.118.635.198.566.218 1.093.531 1.558.928 1.023.873 1.683 2.06 1.863 3.346.038.268.042.538.012.808h-3.723zm-2.726-10.33c.025-.073-.015-.155-.093-.178l-1.08-.31c-.037-.01-.06-.04-.05-.075l.002-.01c.013-.042.042-.087.087-.125.234-.197.51-.345.806-.432.073-.022.12-.086.113-.155-.01-.096-.105-.176-.225-.176h-.018c-.33.015-.65.114-.934.287-.308.187-.562.454-.74.773-.09.163.04.337.216.29l1.893-.543c.076-.022.135.03.123.095l-.027.165c-.013.076-.107.13-.214.116-.124-.015-.224-.05-.32-.096-.17-.082-.344-.157-.525-.212-.065-.02-.13.03-.134.094-.006.094.04.192.11.27.116.128.294.186.477.142.21-.05.413-.126.604-.224.072-.037.156-.01.18.063.022.068-.015.14-.082.155-.205.048-.417.07-.63.065-.265-.007-.53-.065-.772-.17-.237-.104-.45-.254-.618-.44-.102-.114-.187-.246-.247-.39-.02-.047-.055-.086-.097-.115-.01-.007-.023-.013-.038-.018-.06-.02-.128-.005-.16.043-.036.053-.054.114-.055.178-.003.267.085.527.25.736.347.44.857.723 1.416.79.55.065 1.108-.02 1.604-.248.31-.142.594-.337.84-.574.04-.038.06-.09.052-.143z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tesla • 16 hours ago</div>
                    <div className="font-semibold text-black text-base">Brand Marketing Manager</div>
                  </div>
                </div>

                {/* Uber - Duplicate */}
                <div className="flex items-center space-x-4 px-8 flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.41 0L5.33 19.54h3.54l.97-6.42h3.42c3.99 0 6.48-2.34 7.14-5.94C21.05 2.88 18.84 0 14.97 0H8.41zm6.25 3.54c1.26 0 1.98.66 1.8 1.68-.21 1.26-1.26 1.68-2.52 1.68h-2.19l.63-3.36h2.28z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Uber • 18 hours ago</div>
                    <div className="font-semibold text-black text-base">Growth Marketing Lead</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Testimonials Section */}
      <FloatingTestimonials />

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
                <li><Link to="/about" className="text-black hover:text-gray-600 transition-colors text-sm">About Us</Link></li>
                <li><Link to="/privacy" className="text-black hover:text-gray-600 transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-black hover:text-gray-600 transition-colors text-sm">Terms of Service</Link></li>
                <li><Link to="/partners" className="text-black hover:text-gray-600 transition-colors text-sm">Partners</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeadAIStyleStartPage;