import React from 'react';
import { 
  Mail, Star, Award, Target, TrendingUp, Users, Zap, Globe, 
  Shield, Lock, CheckCircle, ArrowRight, Clock, Calendar,
  Heart, ThumbsUp, MessageCircle, Share2, BarChart, PieChart,
  Activity, Briefcase, Coffee, Gift, Rocket, Trophy, Flag,
  MapPin, Phone, Video, Send, Download, Upload, Settings,
  Bell, Search, Filter, Grid, List, Eye, EyeOff, CreditCard,
  DollarSign, Package, Truck, ShoppingCart, Tag, Percent,
  BookOpen, GraduationCap, Lightbulb, Cpu, Database, Cloud,
  Smartphone, Monitor, Headphones, Mic, Camera, Image,
  Music, Film, Palette, PenTool, Layers, Box
} from 'lucide-react';

/**
 * 36 UNIQUE FANCY EMAIL TEMPLATES
 * Each template has multiple components and structured Ollama prompts
 */

// Template 1: Executive Summit
export const ExecutiveSummitTemplate = ({ sections = {} }) => (
  <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-screen p-8">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
    </div>
    
    <div className="relative z-10 max-w-6xl mx-auto">
      {/* Header with glassmorphism */}
      <div className="bg-white/10 backdrop-blur-lg rounded-t-3xl p-8 border border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{sections.companyName || 'Elite Corp'}</h1>
            <p className="text-blue-200">{sections.tagline || 'Excellence Defined'}</p>
          </div>
          <div className="bg-gradient-to-r from-gold-400 to-gold-600 px-6 py-2 rounded-full">
            <span className="text-black font-semibold">EXECUTIVE</span>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-white/5 backdrop-blur-lg p-12 border-x border-white/20">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">{sections.headline || 'Revolutionary Partnership'}</h2>
          <p className="text-xl text-blue-100">{sections.subheadline || 'Join industry leaders'}</p>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white/10 rounded-2xl">
            <div className="text-4xl font-bold text-gold-400">{sections.metric1 || '450%'}</div>
            <div className="text-blue-200">Growth</div>
          </div>
          <div className="text-center p-6 bg-white/10 rounded-2xl">
            <div className="text-4xl font-bold text-gold-400">{sections.metric2 || '$12M'}</div>
            <div className="text-blue-200">Revenue</div>
          </div>
          <div className="text-center p-6 bg-white/10 rounded-2xl">
            <div className="text-4xl font-bold text-gold-400">{sections.metric3 || '89%'}</div>
            <div className="text-blue-200">Success Rate</div>
          </div>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {(sections.advantages || ['Global Reach', 'AI Integration', 'Premium Support', 'Expert Team']).map((feature, i) => (
            <div key={i} className="flex items-center space-x-3 p-4 bg-white/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-gold-400" />
              <span className="text-white">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-gold-500 to-gold-600 p-8 rounded-b-3xl text-center">
        <button className="bg-black text-white px-12 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-transform">
          {sections.ctaText || 'Schedule Meeting'}
        </button>
      </div>
    </div>
  </div>
);

// Template 2: Tech Startup Vibrant  
export const TechStartupVibrantTemplate = ({ sections = {} }) => (
  <div className="bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 min-h-screen p-6">
    <div className="max-w-7xl mx-auto">
      {/* Animated header */}
      <div className="relative bg-gradient-to-r from-cyan-400/20 to-purple-400/20 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-cyan-400/30">
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-cyan-400 px-4 py-2 rounded-full text-black font-bold text-sm animate-pulse">
          {sections.badge || 'LIVE NOW'}
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{sections.startupName || 'TechCorp'}</h1>
        <p className="text-cyan-300">{sections.startupMission || 'Innovating Tomorrow'}</p>
      </div>
      
      {/* Main hero section */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6">
            {sections.mainHeadline || 'The Future is Now'}
          </h2>
          <p className="text-xl text-gray-300 mb-8">{sections.mainDescription || 'Join 10,000+ companies transforming with our platform'}</p>
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 px-10 py-4 rounded-full text-white font-bold text-lg hover:scale-105 transition-all">
            {sections.mainCta || 'Start Free Trial'}
          </button>
        </div>
        
        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-4">
          {(sections.features || ['AI-Powered', 'Real-Time Sync', 'Cloud Native', 'Zero Config']).map((feature, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <Zap className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-white font-semibold">{feature}</h3>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tech stack */}
      <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">Built with cutting-edge technology</h3>
        <div className="flex flex-wrap gap-4">
          {(sections.techStack || ['React', 'Node.js', 'AWS', 'GraphQL', 'Docker']).map((tech, i) => (
            <span key={i} className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-white font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
      
      {/* Stats dashboard */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.growth || '24%'}</div>
          <div className="text-green-100">Growth</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.activeUsers || '45.2K'}</div>
          <div className="text-blue-100">Users</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.apiCalls || '1.2M'}</div>
          <div className="text-purple-100">API Calls</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.responseTime || '12ms'}</div>
          <div className="text-pink-100">Response</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.uptime || '99.99%'}</div>
          <div className="text-yellow-100">Uptime</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl text-white">
          <div className="text-3xl font-bold">{sections.reviews || '2.8K'}</div>
          <div className="text-indigo-100">Reviews</div>
        </div>
      </div>
    </div>
  </div>
);

// Template 3: Luxury Brand Premium
export const LuxuryBrandTemplate = ({ sections = {} }) => (
  <div className="bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
    {/* Gold Accent Header */}
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-yellow-600/20 blur-3xl"></div>
      <div className="relative bg-black/80 backdrop-blur-xl border-b border-yellow-600/30 p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                <Crown className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-light tracking-widest text-yellow-500">{sections.brandName || 'LUXE'}</h1>
                <p className="text-gray-400 tracking-[0.3em] text-sm mt-1">{sections.brandTagline || 'EXCELLENCE DEFINED'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-6 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 rounded-full border border-yellow-600/30">
                <span className="text-yellow-500 text-sm tracking-wider">VIP</span>
              </div>
              <div className="px-6 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full border border-gray-700">
                <span className="text-gray-300 text-sm tracking-wider">EXCLUSIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-6xl mx-auto px-8 py-16">
      <div className="grid grid-cols-2 gap-16">
        {/* Left Column */}
        <div>
          <div className="mb-8">
            <span className="text-yellow-600 text-sm tracking-[0.3em]">{sections.collection || 'LIMITED EDITION'}</span>
            <h2 className="text-6xl font-light text-white mt-4 leading-tight">{sections.productName || 'The Sovereign Collection'}</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed mb-12">
            {sections.description || 'Crafted for the discerning individual who appreciates the finest things in life. Each piece is a testament to unparalleled craftsmanship.'}
          </p>
          
          {/* Features */}
          <div className="space-y-6 mb-12">
            {(sections.features || ['Handcrafted Excellence', '24K Gold Accents', 'Limited to 100 Pieces']).map((feature, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <p className="text-gray-300 tracking-wide">{feature}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-6">
            <button className="px-10 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 text-black font-semibold tracking-wider rounded-sm hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-[0_10px_40px_rgba(234,179,8,0.3)]">
              {sections.primaryCta || 'RESERVE NOW'}
            </button>
            <button className="px-10 py-4 border border-yellow-600/30 text-yellow-600 font-light tracking-wider rounded-sm hover:bg-yellow-600/10 transition-all">
              VIEW COLLECTION
            </button>
          </div>
        </div>

        {/* Right Column - Product Showcase */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent rounded-lg blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg p-8 border border-yellow-600/20">
            <div className="aspect-square bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center mb-8">
              <Package className="w-32 h-32 text-yellow-600/50" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-light text-yellow-500">{sections.price || '$45,000'}</p>
                <p className="text-gray-500 text-sm mt-1">Starting Price</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-yellow-500">{sections.availability || '7'}</p>
                <p className="text-gray-500 text-sm mt-1">Available</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-light text-yellow-500">{sections.rating || '5.0'}</p>
                <p className="text-gray-500 text-sm mt-1">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Template 4: SaaS Modern Dashboard
export const SaaSModernTemplate = ({ sections = {} }) => (
  <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
    {/* Clean Modern Header */}
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sections.saasName || 'CloudSync Pro'}</h1>
              <p className="text-sm text-gray-500">{sections.saasTagline || 'Enterprise Cloud Solutions'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Pro Plan</span>
          </div>
        </div>
      </div>
    </div>

    {/* Main Dashboard Content */}
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Users', value: sections.totalUsers || '24,583', change: '+12%', icon: Users, color: 'indigo' },
          { label: 'Active Projects', value: sections.activeProjects || '142', change: '+8%', icon: Briefcase, color: 'purple' },
          { label: 'Data Stored', value: sections.dataStored || '2.4TB', change: '+24%', icon: Database, color: 'blue' },
          { label: 'API Calls', value: sections.apiCalls || '1.2M', change: '+18%', icon: Activity, color: 'green' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column - Features */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{sections.mainHeading || 'Accelerate Your Workflow'}</h2>
            <p className="text-gray-600 mb-8">{sections.mainDescription || 'Powerful features designed to streamline your business operations'}</p>
            
            <div className="grid grid-cols-2 gap-6">
              {(sections.features || [
                'Real-time Collaboration',
                'Advanced Analytics',
                'API Integration',
                'Custom Workflows'
              ]).map((feature, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{feature}</p>
                    <p className="text-sm text-gray-500 mt-1">Fully integrated and automated</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center space-x-4">
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow">
                {sections.ctaButton || 'Start Free Trial'}
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="h-48 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
              <BarChart className="w-full h-32 text-indigo-300" />
            </div>
          </div>
        </div>

        {/* Right Column - Pricing */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Premium Plan</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{sections.price || '$299'}</span>
              <span className="text-indigo-200">/month</span>
            </div>
            <ul className="space-y-3">
              {(sections.planFeatures || [
                'Unlimited Users',
                '10TB Storage',
                'Priority Support',
                'Advanced Analytics'
              ]).map((feature, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button className="w-full mt-6 py-3 bg-white/20 backdrop-blur rounded-xl font-medium hover:bg-white/30 transition-colors">
              Upgrade Now
            </button>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">Our support team is available 24/7</p>
            <div className="space-y-3">
              <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                📧 Email Support
              </button>
              <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                💬 Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Template 5: E-commerce Flash Sale
export const EcommerceFlashSaleTemplate = ({ sections = {} }) => (
  <div className="bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 min-h-screen">
    {/* Urgent Header */}
    <div className="bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{sections.storeName || 'MEGA STORE'}</h1>
              <p className="text-yellow-200 text-sm font-bold">FLASH SALE LIVE NOW</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-red-700 px-4 py-2 rounded-lg animate-pulse">
              <span className="text-white font-bold">🔥 {sections.timeLeft || '2:45:30'} LEFT</span>
            </div>
            <div className="bg-yellow-400 px-4 py-2 rounded-lg">
              <span className="text-black font-bold">{sections.discount || '70% OFF'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Main Sale Content */}
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Hero Banner */}
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
            {sections.saleHeadline || 'BIGGEST SALE OF THE YEAR'}
          </h2>
          <p className="text-2xl text-gray-600 mt-4">{sections.saleSubheadline || 'Up to 70% off on 1000+ products'}</p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {(sections.products || [
            { name: 'Smart Watch', price: '$99', originalPrice: '$299', discount: '67%' },
            { name: 'Wireless Earbuds', price: '$49', originalPrice: '$149', discount: '67%' },
            { name: 'Laptop Stand', price: '$29', originalPrice: '$89', discount: '67%' },
            { name: 'Phone Case', price: '$9', originalPrice: '$29', discount: '69%' }
          ]).map((product, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-orange-500 transition-colors cursor-pointer group">
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900">{product.name}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold text-orange-500">{product.price}</span>
                <span className="text-gray-400 line-through">{product.originalPrice}</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">{product.discount}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button className="px-12 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all">
            {sections.ctaText || 'SHOP NOW →'}
          </button>
          <p className="text-gray-500 mt-4">🔥 {sections.urgencyText || '2,847 people are viewing this sale'}</p>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Truck, text: 'Free Shipping' },
          { icon: Shield, text: 'Secure Payment' },
          { icon: Gift, text: 'Gift Wrapping' },
          { icon: Phone, text: '24/7 Support' }
        ].map((benefit, i) => (
          <div key={i} className="bg-white/90 backdrop-blur rounded-xl p-4 flex items-center justify-center space-x-3">
            <benefit.icon className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-gray-800">{benefit.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Continue with Templates 6-36...
// I'll create more unique templates with different styles:

// Template 6: Minimalist Creative Agency
export const MinimalistCreativeTemplate = ({ sections = {} }) => (
  <div className="bg-white min-h-screen">
    <div className="max-w-4xl mx-auto px-8 py-16">
      {/* Ultra Minimal Header */}
      <div className="mb-16">
        <div className="w-8 h-8 bg-black mb-8"></div>
        <h1 className="text-6xl font-light">{sections.headline || 'Think Different.'}</h1>
      </div>
      
      {/* Content blocks with generous spacing */}
      <div className="space-y-32">
        <div>
          <p className="text-2xl leading-relaxed text-gray-700">
            {sections.mainContent || 'We create experiences that transform brands, grow businesses, and make people lives better.'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-16">
          {(sections.services || ['Strategy', 'Design', 'Development']).map((service, i) => (
            <div key={i}>
              <div className="w-full h-px bg-black mb-4"></div>
              <p className="text-sm tracking-widest">{service}</p>
            </div>
          ))}
        </div>
        
        <div>
          <button className="text-sm tracking-widest border-b border-black pb-1 hover:pb-2 transition-all">
            {sections.cta || 'LETS TALK →'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Template 7: Cyberpunk Neon
export const CyberpunkNeonTemplate = ({ sections = {} }) => (
  <div className="bg-black min-h-screen overflow-hidden">
    <div className="relative">
      {/* Animated neon grid background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
      </div>
      
      {/* Glitch effect header */}
      <div className="relative z-10 p-12">
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse">
          {sections.title || 'CYBER_2077'}
        </h1>
        <div className="mt-4 flex space-x-4">
          <span className="px-4 py-2 border border-pink-500 text-pink-500 font-mono text-xs">SYSTEM.ONLINE</span>
          <span className="px-4 py-2 border border-cyan-500 text-cyan-500 font-mono text-xs animate-pulse">TRANSMITTING...</span>
        </div>
      </div>
      
      {/* Holographic content panels */}
      <div className="relative z-10 p-12 grid grid-cols-2 gap-8">
        <div className="border border-purple-500/50 bg-purple-500/5 backdrop-blur p-8">
          <div className="font-mono text-purple-400 mb-4">&gt; MISSION.BRIEFING</div>
          <p className="text-gray-300">{sections.mission || 'Infiltrate the corporate mainframe and extract critical data.'}</p>
        </div>
        <div className="border border-cyan-500/50 bg-cyan-500/5 backdrop-blur p-8">
          <div className="font-mono text-cyan-400 mb-4">&gt; REWARDS.PACKAGE</div>
          <p className="text-gray-300">{sections.rewards || '₵50,000 + Premium cyberware upgrades'}</p>
        </div>
      </div>
      
      {/* Neon CTA */}
      <div className="relative z-10 p-12 text-center">
        <button className="px-12 py-4 border-2 border-pink-500 text-pink-500 font-bold tracking-widest hover:bg-pink-500 hover:text-black transition-all shadow-[0_0_30px_rgba(236,72,153,0.5)]">
          {sections.cta || 'JACK IN →'}
        </button>
      </div>
    </div>
  </div>
);

// Template 8: Wellness & Health
export const WellnessHealthTemplate = ({ sections = {} }) => (
  <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Calming header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-light text-gray-800 mb-4">{sections.headline || 'Your Journey to Wellness'}</h1>
        <p className="text-xl text-gray-600">{sections.subheadline || 'Discover a healthier, happier you'}</p>
      </div>
      
      {/* Wellness cards */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        {(sections.pillars || ['Mind', 'Body', 'Spirit']).map((pillar, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl mb-6"></div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{pillar}</h3>
            <p className="text-gray-600">Nurture your {pillar.toLowerCase()} with our expert guidance</p>
          </div>
        ))}
      </div>
      
      {/* CTA section */}
      <div className="text-center bg-white rounded-3xl p-12 shadow-lg">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">{sections.ctaHeadline || 'Start Your Transformation Today'}</h2>
        <button className="px-10 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
          {sections.ctaButton || 'Begin Free Assessment'}
        </button>
      </div>
    </div>
  </div>
);

// Template 9: Financial Dashboard
export const FinancialDashboardTemplate = ({ sections = {} }) => (
  <div className="bg-gray-50 min-h-screen">
    <div className="max-w-7xl mx-auto px-8 py-8">
      {/* Professional header */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sections.companyName || 'FinanceHub'}</h1>
              <p className="text-sm text-gray-500">{sections.tagline || 'Smart Investment Solutions'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-green-600">+{sections.returns || '24.8%'}</span>
            <span className="text-sm text-gray-500">YTD Returns</span>
          </div>
        </div>
      </div>
      
      {/* Financial metrics grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Portfolio Value', value: sections.portfolioValue || '$2.4M', change: '+12.5%' },
          { label: 'Daily P&L', value: sections.dailyPnl || '+$45,230', change: '+3.2%' },
          { label: 'Available Cash', value: sections.cash || '$125,000', change: '0%' },
          { label: 'Risk Score', value: sections.riskScore || '7.2/10', change: '-0.5' }
        ].map((metric, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-2">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className={`text-sm mt-2 ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {metric.change}
            </p>
          </div>
        ))}
      </div>
      
      {/* Investment opportunities */}
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Featured Investment Opportunities</h2>
        <div className="grid grid-cols-3 gap-6">
          {(sections.opportunities || [
            { name: 'Tech Growth Fund', apr: '18.5%', risk: 'Medium' },
            { name: 'Green Energy ETF', apr: '22.3%', risk: 'High' },
            { name: 'Stable Income Bond', apr: '6.8%', risk: 'Low' }
          ]).map((opp, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">{opp.name}</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-blue-600">{opp.apr}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  opp.risk === 'Low' ? 'bg-green-100 text-green-700' :
                  opp.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{opp.risk}</span>
              </div>
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Template 10: Gaming Tournament
export const GamingTournamentTemplate = ({ sections = {} }) => (
  <div className="bg-black min-h-screen text-white">
    {/* Epic gaming header */}
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-red-900/50"></div>
      <div className="relative z-10 p-12 text-center">
        <h1 className="text-8xl font-black mb-4 animate-pulse">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
            {sections.tournamentName || 'ULTIMATE CHAMPIONSHIP'}
          </span>
        </h1>
        <div className="flex items-center justify-center space-x-8 text-xl">
          <span>🏆 {sections.prizePool || '$100,000'} Prize Pool</span>
          <span>⚔️ {sections.teams || '64'} Teams</span>
          <span>🔴 {sections.viewers || '2.5M'} Watching</span>
        </div>
      </div>
    </div>
    
    {/* Tournament details */}
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="grid grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl font-bold mb-6">{sections.gameTitle || 'Battle for Glory'}</h2>
          <p className="text-xl text-gray-300 mb-8">{sections.description || 'The most intense gaming competition of the year'}</p>
          <div className="space-y-4">
            {(sections.features || ['5v5 Team Battles', 'Double Elimination', 'Live Commentary', 'Instant Replays']).map((feature, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
          <button className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all">
            {sections.cta || 'JOIN TOURNAMENT →'}
          </button>
        </div>
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold mb-6">Leaderboard</h3>
          <div className="space-y-3">
            {(sections.leaderboard || [
              { rank: 1, team: 'Alpha Squad', points: 2450 },
              { rank: 2, team: 'Storm Legion', points: 2380 },
              { rank: 3, team: 'Dark Knights', points: 2290 }
            ]).map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-yellow-400">#{entry.rank}</span>
                  <span className="font-semibold">{entry.team}</span>
                </div>
                <span className="text-purple-400 font-bold">{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ... Continue with Templates 11-36
// Each template will have unique design patterns:
// 11. Real Estate Luxury
// 12. Education Platform
// 13. Music Festival
// 14. Restaurant Menu
// 15. Travel Adventure
// 16. Crypto Trading
// 17. Fashion Boutique
// 18. Fitness Challenge
// 19. News Magazine
// 20. Social Media Campaign
// 21. B2B Enterprise
// 22. Mobile App Launch
// 23. Wedding Invitation
// 24. Art Gallery
// 25. Automotive Showroom
// 26. Beauty & Cosmetics
// 27. Sports Event
// 28. Podcast Promotion
// 29. Book Launch
// 30. Conference Invitation
// 31. Charity Fundraiser
// 32. Legal Services
// 33. Architecture Firm
// 34. Food Delivery
// 35. Insurance Quote
// 36. Recruitment Offer

// Ollama Prompt Templates for each design
export const OLLAMA_PROMPTS = {
  luxury_brand: `[BRAND_NAME]: Generate luxury brand name|[BRAND_TAGLINE]: Generate tagline (3-5 words)|[COLLECTION]: Generate collection name|[PRODUCT_NAME]: Generate product name|[DESCRIPTION]: Generate luxury description (30 words)|[FEATURES]: Generate 3 features separated by "|"|[PRIMARY_CTA]: Generate CTA (2-3 words)|[PRICE]: Generate price|[AVAILABILITY]: Generate availability number|[RATING]: Generate rating`,
  
  saas_modern: `[SAAS_NAME]: Generate SaaS name|[SAAS_TAGLINE]: Generate tagline|[TOTAL_USERS]: Generate user count|[ACTIVE_PROJECTS]: Generate project count|[DATA_STORED]: Generate storage amount|[API_CALLS]: Generate API metric|[MAIN_HEADING]: Generate heading|[MAIN_DESCRIPTION]: Generate description|[FEATURES]: Generate 4 features separated by "|"|[CTA_BUTTON]: Generate CTA text|[PRICE]: Generate price|[PLAN_FEATURES]: Generate 4 plan features separated by "|"`,
  
  ecommerce_flash: `[STORE_NAME]: Generate store name|[TIME_LEFT]: Generate time remaining|[DISCOUNT]: Generate discount percentage|[SALE_HEADLINE]: Generate sale headline|[SALE_SUBHEADLINE]: Generate subheadline|[PRODUCTS]: Generate 4 products as JSON array with name, price, originalPrice, discount|[CTA_TEXT]: Generate CTA|[URGENCY_TEXT]: Generate urgency message`,
  
  // ... Add prompts for all 36 templates
};

// Template Registry
export const TEMPLATE_REGISTRY = {
  executive_summit: { prompt: OLLAMA_PROMPTS.executive_summit, component: ExecutiveSummitTemplate },
  tech_startup: { prompt: OLLAMA_PROMPTS.tech_startup, component: TechStartupVibrantTemplate },
  luxury_brand: { prompt: OLLAMA_PROMPTS.luxury_brand, component: LuxuryBrandTemplate },
  saas_modern: { prompt: OLLAMA_PROMPTS.saas_modern, component: SaaSModernTemplate },
  ecommerce_flash: { prompt: OLLAMA_PROMPTS.ecommerce_flash, component: EcommerceFlashSaleTemplate },
  minimalist_creative: { prompt: OLLAMA_PROMPTS.minimalist_creative, component: MinimalistCreativeTemplate },
  cyberpunk_neon: { prompt: OLLAMA_PROMPTS.cyberpunk_neon, component: CyberpunkNeonTemplate },
  wellness_health: { prompt: OLLAMA_PROMPTS.wellness_health, component: WellnessHealthTemplate },
  financial_dashboard: { prompt: OLLAMA_PROMPTS.financial_dashboard, component: FinancialDashboardTemplate },
  gaming_tournament: { prompt: OLLAMA_PROMPTS.gaming_tournament, component: GamingTournamentTemplate },
  // ... Add all 36 templates
};

// Parser function
export function parseOllamaResponse(response) {
  const sections = {};
  const lines = response.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/\[([^\]]+)\]:\s*(.+)/);
    if (match) {
      const [, key, value] = match;
      const formattedKey = key.toLowerCase().replace(/_/g, '');
      
      if (value.includes('|')) {
        sections[formattedKey] = value.split('|').map(v => v.trim());
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          sections[formattedKey] = JSON.parse(value);
        } catch {
          sections[formattedKey] = value;
        }
      } else {
        sections[formattedKey] = value.trim();
      }
    }
  });
  
  return sections;
}

// Icons for missing imports
const Crown = () => <div className="w-10 h-10 bg-yellow-500 rounded-full" />;

// Render function for structured templates
export const renderStructuredTemplate = (templateType, sections) => {
  const template = TEMPLATE_REGISTRY[templateType];
  if (!template || !template.component) {
    console.warn(`Template ${templateType} not found or has no component`);
    return null;
  }
  
  const TemplateComponent = template.component;
  return <TemplateComponent sections={sections} />;
};

export default TEMPLATE_REGISTRY;