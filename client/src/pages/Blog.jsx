import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, Bot, Star, Gem, Target, Rocket, Zap, FileText, TrendingUp, Shield, Sparkles, ChevronRight } from 'lucide-react';

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

// Animated blog card component
const BlogCard = ({ post, index, renderIcon }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <Link
      ref={ref}
      to={`/blog/${post.slug}`}
      className="block rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${index * 80}ms`
      }}
    >
      {/* Card Header with gradient */}
      <div className="h-3" style={{ background: 'linear-gradient(90deg, #00f5a0 0%, #00c98d 100%)' }} />

      <div className="p-7">
        {/* Category Badge */}
        <div className="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold mb-4 transition-all duration-300 group-hover:scale-105"
             style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
          {post.category}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 leading-tight transition-colors duration-300 group-hover:text-[#00c98d]"
            style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-5 leading-relaxed line-clamp-3"
           style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '15px', lineHeight: '1.7' }}>
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-5 mb-5 text-sm"
             style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
               style={{ background: 'linear-gradient(135deg, rgba(0, 240, 160, 0.15) 0%, rgba(0, 200, 140, 0.1) 100%)' }}>
            {renderIcon(post.icon, 'w-6 h-6')}
          </div>
          <span className="flex items-center gap-1 text-sm font-medium transition-all duration-300 group-hover:gap-2"
                style={{ color: '#00c98d' }}>
            Read More
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [heroRef, heroVisible] = useScrollReveal();

  const categories = ['All', 'AI & Automation', 'Email Marketing', 'Lead Generation', 'Case Studies', 'Product Updates'];

  // Icon mapping for clean display
  const iconComponents = {
    bot: Bot,
    star: Star,
    gem: Gem,
    target: Target,
    rocket: Rocket,
    zap: Zap,
    filetext: FileText,
    trending: TrendingUp,
    shield: Shield,
    sparkles: Sparkles
  };

  const featuredPost = {
    title: 'How AI is Revolutionizing Cold Email Outreach in 2025',
    excerpt: 'Discover the latest AI techniques that are helping marketers achieve 40%+ response rates with personalized email campaigns.',
    category: 'AI & Automation',
    date: 'Jan 15, 2025',
    readTime: '8 min read',
    icon: 'bot',
    author: 'Sarah Chen',
    authorRole: 'Head of AI',
    slug: 'ai-revolutionizing-cold-email-2025'
  };

  const posts = [
    {
      title: 'Is MailGen Legit?',
      excerpt: 'An honest review of MailGen\'s features, pricing, and performance. See real user testimonials and find out if MailGen is the right email marketing platform for your business.',
      category: 'Product Updates',
      date: 'Jan 12, 2025',
      readTime: '6 min read',
      icon: 'star',
      author: 'Michael Torres',
      slug: 'is-mailgen-legit'
    },
    {
      title: 'Success Stories from MailGen Users',
      excerpt: 'Real results from real customers. Discover how companies are using MailGen to triple their response rates and generate millions in new pipeline.',
      category: 'Case Studies',
      date: 'Jan 10, 2025',
      readTime: '10 min read',
      icon: 'gem',
      author: 'Emily Rodriguez',
      slug: 'success-stories'
    },
    {
      title: 'What Top AI Companies Are Looking For',
      excerpt: 'Industry insights on hiring trends and what leading AI companies prioritize when building their teams. Essential reading for tech professionals.',
      category: 'AI & Automation',
      date: 'Jan 8, 2025',
      readTime: '12 min read',
      icon: 'target',
      author: 'David Park',
      slug: 'ai-companies-hiring'
    },
    {
      title: 'MailGen AI Agent Launch',
      excerpt: 'Introducing our revolutionary AI agent that handles prospecting, email generation, and follow-ups automatically. The future of email marketing is here.',
      category: 'Product Updates',
      date: 'Jan 5, 2025',
      readTime: '4 min read',
      icon: 'rocket',
      author: 'Lisa Chen',
      slug: 'ai-agent-launch'
    },
    {
      title: 'Top Email Marketing Strategies',
      excerpt: 'Proven strategies from top-performing marketing teams. Learn the tactics that drive 40%+ response rates and consistent revenue growth.',
      category: 'Email Marketing',
      date: 'Jan 3, 2025',
      readTime: '7 min read',
      icon: 'zap',
      author: 'James Wilson',
      slug: 'top-email-strategies'
    },
    {
      title: '10 Email Templates That Convert 3x Better',
      excerpt: 'Proven templates used by top-performing sales teams to book more meetings and close more deals. Copy-paste ready for immediate results.',
      category: 'Email Marketing',
      date: 'Dec 30, 2024',
      readTime: '6 min read',
      icon: 'filetext',
      author: 'Michael Torres',
      slug: 'email-templates-convert'
    },
    {
      title: 'Case Study: How TechCorp Generated $2M in Pipeline',
      excerpt: 'A deep dive into how one SaaS company used AI-powered outreach to transform their sales process and generate $2M in new business.',
      category: 'Case Studies',
      date: 'Dec 28, 2024',
      readTime: '10 min read',
      icon: 'trending',
      author: 'Emily Rodriguez',
      slug: 'techcorp-case-study'
    },
    {
      title: 'The Complete Guide to Email Deliverability',
      excerpt: 'Everything you need to know about landing in the inbox, avoiding spam filters, and maintaining sender reputation for maximum deliverability.',
      category: 'Email Marketing',
      date: 'Dec 25, 2024',
      readTime: '12 min read',
      icon: 'shield',
      author: 'David Park',
      slug: 'email-deliverability-guide'
    },
    {
      title: 'AI Personalization: Beyond First Names',
      excerpt: 'Learn how modern AI personalizes emails using company signals, recent news, and behavioral data to create truly personalized outreach.',
      category: 'AI & Automation',
      date: 'Dec 22, 2024',
      readTime: '9 min read',
      icon: 'sparkles',
      author: 'Sarah Chen',
      slug: 'ai-personalization'
    }
  ];

  // Helper to render icon
  const renderIcon = (iconName, size = 'w-12 h-12') => {
    const IconComponent = iconComponents[iconName];
    if (IconComponent) {
      return <IconComponent className={`${size}`} style={{ color: '#00c98d' }} />;
    }
    return <Bot className={`${size}`} style={{ color: '#00c98d' }} />;
  };

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

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
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
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

        <div className="relative py-20 max-w-7xl mx-auto px-6 lg:px-12">
          <div
            ref={heroRef}
            className="text-center max-w-3xl mx-auto mb-12 transition-all duration-1000"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6"
                 style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00a86b' }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Latest Insights
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-5"
                style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              MailGen Blog
            </h1>
            <p className="text-xl mb-10"
               style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Learn about AI, email marketing, lead generation, and how to scale your outreach
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full px-6 py-4 pl-14 rounded-2xl text-lg transition-all duration-300 focus:shadow-lg"
                style={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#00f0a0'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'}
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: 'rgba(0, 0, 0, 0.35)' }} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: selectedCategory === category ? '#00f0a0' : 'white',
                  color: selectedCategory === category ? '#001529' : 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid',
                  borderColor: selectedCategory === category ? '#00f0a0' : 'rgba(0, 0, 0, 0.1)',
                  boxShadow: selectedCategory === category ? '0 4px 12px rgba(0, 240, 160, 0.3)' : 'none'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 -mt-4">
        <Link
          to={`/blog/${featuredPost.slug}`}
          className="block rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl group"
          style={{
            background: 'linear-gradient(135deg, #001529 0%, #00332b 100%)',
          }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center p-10 lg:p-14">
            <div>
              <div className="inline-flex px-4 py-2 rounded-full text-sm font-semibold mb-5"
                   style={{ backgroundColor: 'rgba(0, 245, 160, 0.2)', color: '#00f5a0' }}>
                Featured Article
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight text-white">
                {featuredPost.title}
              </h2>
              <p className="text-lg mb-6 leading-relaxed"
                 style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-6 mb-8 text-sm"
                   style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{featuredPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-300 group-hover:gap-3"
                style={{ backgroundColor: 'white', color: '#001529' }}
              >
                Read Article
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                   style={{ background: 'linear-gradient(135deg, rgba(0, 245, 160, 0.2) 0%, rgba(0, 200, 140, 0.1) 100%)' }}>
                {renderIcon(featuredPost.icon, 'w-20 h-20')}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Blog Grid */}
      <div className="py-16" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
              {selectedCategory === 'All' ? 'All Articles' : selectedCategory}
            </h2>
            <span className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredPosts.map((post, index) => (
              <BlogCard key={index} post={post} index={index} renderIcon={renderIcon} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-14">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.1)',
                color: 'rgba(0, 0, 0, 0.7)',
                backgroundColor: 'white'
              }}
            >
              Load More Articles
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <div className="rounded-3xl p-10 lg:p-14 relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #001529 0%, #00332b 100%)',
               }}>
            {/* Background orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pulse-glow"
                 style={{ background: 'radial-gradient(circle, rgba(0, 245, 160, 0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
                Never Miss an Update
              </h2>
              <p className="text-lg mb-8"
                 style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Get the latest articles, guides, and product updates delivered to your inbox
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-xl text-lg"
                  style={{ border: 'none', outline: 'none' }}
                />
                <button
                  className="px-8 py-4 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: '#00f0a0', color: '#001529' }}
                >
                  Subscribe
                </button>
              </div>
              <p className="text-sm mt-5" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Join 50,000+ marketers. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
