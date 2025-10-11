import React from 'react';
import { 
  Mail, Star, Award, Target, TrendingUp, Users, Zap, Globe, 
  Shield, Lock, CheckCircle, ArrowRight, Clock, Calendar,
  Heart, ThumbsUp, MessageCircle, Share2, BarChart, PieChart,
  Activity, Briefcase, Coffee, Gift, Rocket, Trophy, Flag,
  MapPin, Phone, Video, Send, Download, Upload, Settings,
  Bell, Search, Filter, Grid, List, Eye, EyeOff
} from 'lucide-react';

/**
 * 36 DIFFERENT FANCY EMAIL UI TEMPLATES
 * Each template has:
 * - Multiple UI components and sections
 * - Corresponding Ollama prompt structure
 * - Fancy animations and interactions
 * - Professional design elements
 */

// Template 1: Executive Summit Style
export const ExecutiveSummitTemplate = ({ emailData }) => {
  const sections = emailData.sections || {};
  
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-screen p-8">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      </div>

      {/* Header Section with Company Logo */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-t-3xl p-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{sections.companyName || 'Elite Corp'}</h1>
              <p className="text-blue-200">{sections.tagline || 'Transforming Business Excellence'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30">
              <span className="text-green-300 text-sm font-semibold">Priority</span>
            </div>
            <div className="px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-400/30">
              <span className="text-yellow-300 text-sm font-semibold">Executive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="relative z-10 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg p-12 border-x border-white/20">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              {sections.headline || 'Revolutionary Partnership Opportunity'}
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {sections.subheadline || 'Join the top 1% of industry leaders transforming the future'}
            </p>
            <div className="flex items-center space-x-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all">
                {sections.ctaText || 'Schedule Executive Meeting'}
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur text-white rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-all">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <BarChart className="w-full h-48 text-blue-300" />
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{sections.metric1 || '450%'}</p>
                  <p className="text-sm text-blue-200">ROI Increase</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{sections.metric2 || '$12M'}</p>
                  <p className="text-sm text-blue-200">Revenue Growth</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{sections.metric3 || '89%'}</p>
                  <p className="text-sm text-blue-200">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Propositions Grid */}
      <div className="relative z-10 bg-white/5 backdrop-blur-lg p-8 border-x border-white/20">
        <h3 className="text-2xl font-bold text-white mb-6">Strategic Advantages</h3>
        <div className="grid grid-cols-4 gap-4">
          {(sections.advantages || ['Global Reach', 'AI Integration', 'Premium Support', '24/7 Availability']).map((advantage, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-semibold">{advantage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="relative z-10 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg p-8 border-x border-white/20">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{sections.testimonialAuthorInitial || 'JD'}</span>
          </div>
          <div className="flex-1">
            <p className="text-xl text-white italic mb-4">
              "{sections.testimonial || 'This partnership transformed our entire business model. The results exceeded all expectations.'}"
            </p>
            <div>
              <p className="text-white font-semibold">{sections.testimonialAuthor || 'John Doe'}</p>
              <p className="text-blue-200">{sections.testimonialTitle || 'CEO, Fortune 500'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Multiple CTAs */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-b-3xl p-8 border border-white/20">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-blue-300 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">Book a Meeting</p>
            <p className="text-blue-200 text-sm">{sections.meetingText || 'Available this week'}</p>
          </div>
          <div className="text-center">
            <Download className="w-8 h-8 text-blue-300 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">Download Case Study</p>
            <p className="text-blue-200 text-sm">{sections.caseStudyText || '50+ success stories'}</p>
          </div>
          <div className="text-center">
            <Phone className="w-8 h-8 text-blue-300 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">Direct Contact</p>
            <p className="text-blue-200 text-sm">{sections.contactText || '24/7 executive line'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ollama Prompt Structure for Executive Summit Template
export const executiveSummitPrompt = `Generate email content in the following EXACT format with clear section markers:

[COMPANY_NAME]: Generate a professional company name
[TAGLINE]: Generate a compelling company tagline
[HEADLINE]: Generate a powerful headline (max 10 words)
[SUBHEADLINE]: Generate an engaging subheadline (max 20 words)
[CTA_TEXT]: Generate call-to-action button text (max 4 words)
[METRIC_1]: Generate an impressive metric (e.g., "450%")
[METRIC_2]: Generate a revenue metric (e.g., "$12M")
[METRIC_3]: Generate a success percentage (e.g., "89%")
[ADVANTAGES]: Generate 4 strategic advantages separated by "|" (e.g., "Global Reach|AI Integration|Premium Support|24/7 Availability")
[TESTIMONIAL]: Generate a compelling testimonial quote (max 30 words)
[TESTIMONIAL_AUTHOR]: Generate a person's name
[TESTIMONIAL_TITLE]: Generate their title and company
[TESTIMONIAL_INITIAL]: Generate their initials (2 letters)
[MEETING_TEXT]: Generate meeting availability text (max 5 words)
[CASE_STUDY_TEXT]: Generate case study description (max 5 words)
[CONTACT_TEXT]: Generate contact availability text (max 5 words)

Context: {context}
Industry: {industry}
Goal: {goal}`;

// Template 2: Tech Startup Vibrant Style
export const TechStartupVibrantTemplate = ({ emailData }) => {
  const sections = emailData.sections || {};
  
  return (
    <div className="bg-black min-h-screen">
      {/* Neon Grid Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.1
        }}></div>
      </div>

      {/* Floating Neon Header */}
      <div className="relative z-10 p-8">
        <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur-xl rounded-3xl p-6 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,255,255,0.3)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl blur-xl animate-pulse"></div>
                <div className="relative w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {sections.startupName || 'TechVenture Labs'}
                </h1>
                <p className="text-gray-400 text-sm">{sections.startupMission || 'Disrupting the Future'}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="px-3 py-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full border border-green-400/30">
                <span className="text-green-400 text-xs font-bold">LIVE</span>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-full border border-yellow-400/30">
                <span className="text-yellow-400 text-xs font-bold">HOT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Glassmorphism */}
      <div className="relative z-10 px-8 pb-8">
        <div className="bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-blue-900/20 backdrop-blur-xl rounded-3xl border border-purple-500/20 overflow-hidden">
          
          {/* Hero Section with Animation */}
          <div className="p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative grid grid-cols-2 gap-12">
              <div>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-full border border-cyan-500/30 mb-6">
                  <span className="text-cyan-400 text-sm font-semibold">🚀 {sections.badge || 'LAUNCHING NOW'}</span>
                </div>
                <h2 className="text-6xl font-black mb-6">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {sections.mainHeadline || 'The Future is Here'}
                  </span>
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {sections.mainDescription || 'Join 10,000+ innovators already transforming their business with next-gen technology'}
                </p>
                <div className="flex items-center space-x-4">
                  <button className="group relative px-8 py-4 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:shadow-[0_0_50px_rgba(0,255,255,0.8)] transition-all">
                    <span className="relative z-10">{sections.mainCta || 'Start Free Trial'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  <button className="px-8 py-4 bg-black/50 backdrop-blur border border-cyan-500/30 text-cyan-400 rounded-2xl font-semibold hover:bg-cyan-500/10 transition-all">
                    Watch Demo
                  </button>
                </div>
              </div>
              
              {/* Interactive Feature Cards */}
              <div className="grid grid-cols-2 gap-4">
                {(sections.features || ['AI-Powered', 'Real-Time Sync', 'Cloud Native', 'Zero Config']).map((feature, i) => (
                  <div key={i} className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 blur-xl group-hover:from-cyan-500/20 group-hover:to-purple-600/20 transition-all"></div>
                    <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 group-hover:border-cyan-400/40 transition-all cursor-pointer">
                      <Activity className="w-8 h-8 text-cyan-400 mb-3" />
                      <p className="text-white font-semibold">{feature}</p>
                      <p className="text-gray-400 text-sm mt-1">Enabled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tech Stack Showcase */}
          <div className="px-12 pb-8">
            <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-2xl p-6 border border-cyan-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Powered By</h3>
              <div className="flex items-center justify-between">
                {(sections.techStack || ['React', 'Node.js', 'AWS', 'GraphQL', 'Docker']).map((tech, i) => (
                  <div key={i} className="px-4 py-2 bg-black/50 rounded-lg border border-cyan-500/20">
                    <span className="text-cyan-400 font-mono text-sm">{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Metrics Dashboard */}
          <div className="px-12 pb-12">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 text-xs">+{sections.growth || '24%'}</span>
                </div>
                <p className="text-2xl font-bold text-white">{sections.activeUsers || '45.2K'}</p>
                <p className="text-gray-400 text-sm">Active Users</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-400 text-xs">Live</span>
                </div>
                <p className="text-2xl font-bold text-white">{sections.apiCalls || '1.2M'}</p>
                <p className="text-gray-400 text-sm">API Calls/Day</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-6 h-6 text-purple-400" />
                  <span className="text-purple-400 text-xs">{sections.responseTime || '12ms'}</span>
                </div>
                <p className="text-2xl font-bold text-white">{sections.uptime || '99.99%'}</p>
                <p className="text-gray-400 text-sm">Uptime SLA</p>
              </div>
              <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-2xl p-6 border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-6 h-6 text-orange-400" />
                  <span className="text-orange-400 text-xs">5.0</span>
                </div>
                <p className="text-2xl font-bold text-white">{sections.reviews || '2.8K'}</p>
                <p className="text-gray-400 text-sm">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ollama Prompt for Tech Startup Template
export const techStartupPrompt = `Generate startup email content in this EXACT format:

[STARTUP_NAME]: Generate a tech startup name
[STARTUP_MISSION]: Generate a mission statement (max 5 words)
[BADGE]: Generate a launch badge text (max 3 words)
[MAIN_HEADLINE]: Generate an exciting headline (max 6 words)
[MAIN_DESCRIPTION]: Generate a description (max 25 words)
[MAIN_CTA]: Generate CTA button text (max 3 words)
[FEATURES]: Generate 4 features separated by "|" (e.g., "AI-Powered|Real-Time Sync|Cloud Native|Zero Config")
[TECH_STACK]: Generate 5 technologies separated by "|" (e.g., "React|Node.js|AWS|GraphQL|Docker")
[GROWTH]: Generate growth percentage (e.g., "24%")
[ACTIVE_USERS]: Generate user count (e.g., "45.2K")
[API_CALLS]: Generate API call metric (e.g., "1.2M")
[RESPONSE_TIME]: Generate response time (e.g., "12ms")
[UPTIME]: Generate uptime percentage (e.g., "99.99%")
[REVIEWS]: Generate review count (e.g., "2.8K")

Context: {context}
Industry: {industry}
Goal: {goal}`;

// Continue with remaining 34 templates...
// Each with unique UI components and corresponding Ollama prompts

// Template Registry
export const EMAIL_TEMPLATES = {
  executive_summit: {
    component: ExecutiveSummitTemplate,
    prompt: executiveSummitPrompt,
    name: 'Executive Summit',
    category: 'Professional'
  },
  tech_startup_vibrant: {
    component: TechStartupVibrantTemplate,
    prompt: techStartupPrompt,
    name: 'Tech Startup Vibrant',
    category: 'Modern'
  },
  // ... 34 more templates
};

// Parser for Ollama Output
export function parseOllamaOutput(output, templateType) {
  const sections = {};
  const lines = output.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/\[([^\]]+)\]:\s*(.+)/);
    if (match) {
      const [, key, value] = match;
      const formattedKey = key.toLowerCase().replace(/_/g, '');
      
      // Handle pipe-separated values
      if (value.includes('|')) {
        sections[formattedKey] = value.split('|').map(v => v.trim());
      } else {
        sections[formattedKey] = value.trim();
      }
    }
  });
  
  return sections;
}

// Main Email Display Component
export const FancyEmailDisplay = ({ emailData, templateType = 'executive_summit' }) => {
  const template = EMAIL_TEMPLATES[templateType];
  
  if (!template) {
    console.error(`Template ${templateType} not found`);
    return null;
  }
  
  const TemplateComponent = template.component;
  
  // Parse Ollama output if it's a string
  if (typeof emailData === 'string') {
    emailData = {
      sections: parseOllamaOutput(emailData, templateType)
    };
  }
  
  return <TemplateComponent emailData={emailData} />;
};

export default FancyEmailDisplay;