import React, { useState } from 'react';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'AI & Automation', 'Email Marketing', 'Lead Generation', 'Case Studies', 'Product Updates'];

  const featuredPost = {
    title: 'How AI is Revolutionizing Cold Email Outreach in 2025',
    excerpt: 'Discover the latest AI techniques that are helping marketers achieve 40%+ response rates with personalized email campaigns.',
    category: 'AI & Automation',
    date: 'Jan 15, 2025',
    readTime: '8 min read',
    image: '🤖',
    author: 'Sarah Chen',
    authorRole: 'Head of AI'
  };

  const posts = [
    {
      title: 'Is MailGen Legit?',
      excerpt: 'An honest review of MailGen\'s features, pricing, and performance. See real user testimonials and find out if MailGen is the right email marketing platform for your business.',
      category: 'Product Updates',
      date: 'Jan 12, 2025',
      readTime: '6 min read',
      image: '✅',
      author: 'Michael Torres'
    },
    {
      title: 'Success Stories from MailGen Users',
      excerpt: 'Real results from real customers. Discover how companies are using MailGen to triple their response rates and generate millions in new pipeline.',
      category: 'Case Studies',
      date: 'Jan 10, 2025',
      readTime: '10 min read',
      image: '🏆',
      author: 'Emily Rodriguez'
    },
    {
      title: 'What Top AI Companies Are Looking For',
      excerpt: 'Industry insights on hiring trends and what leading AI companies prioritize when building their teams. Essential reading for tech professionals.',
      category: 'AI & Automation',
      date: 'Jan 8, 2025',
      readTime: '12 min read',
      image: '🎯',
      author: 'David Park'
    },
    {
      title: 'MailGen AI Agent Launch',
      excerpt: 'Introducing our revolutionary AI agent that handles prospecting, email generation, and follow-ups automatically. The future of email marketing is here.',
      category: 'Product Updates',
      date: 'Jan 5, 2025',
      readTime: '4 min read',
      image: '🚀',
      author: 'Lisa Chen'
    },
    {
      title: 'Top Email Marketing Strategies',
      excerpt: 'Proven strategies from top-performing marketing teams. Learn the tactics that drive 40%+ response rates and consistent revenue growth.',
      category: 'Email Marketing',
      date: 'Jan 3, 2025',
      readTime: '7 min read',
      image: '📧',
      author: 'James Wilson'
    },
    {
      title: '10 Email Templates That Convert 3x Better',
      excerpt: 'Proven templates used by top-performing sales teams to book more meetings and close more deals. Copy-paste ready for immediate results.',
      category: 'Email Marketing',
      date: 'Dec 30, 2024',
      readTime: '6 min read',
      image: '📝',
      author: 'Michael Torres'
    },
    {
      title: 'Case Study: How TechCorp Generated $2M in Pipeline',
      excerpt: 'A deep dive into how one SaaS company used AI-powered outreach to transform their sales process and generate $2M in new business.',
      category: 'Case Studies',
      date: 'Dec 28, 2024',
      readTime: '10 min read',
      image: '📊',
      author: 'Emily Rodriguez'
    },
    {
      title: 'The Complete Guide to Email Deliverability',
      excerpt: 'Everything you need to know about landing in the inbox, avoiding spam filters, and maintaining sender reputation for maximum deliverability.',
      category: 'Email Marketing',
      date: 'Dec 25, 2024',
      readTime: '12 min read',
      image: '✉️',
      author: 'David Park'
    },
    {
      title: 'AI Personalization: Beyond First Names',
      excerpt: 'Learn how modern AI personalizes emails using company signals, recent news, and behavioral data to create truly personalized outreach.',
      category: 'AI & Automation',
      date: 'Dec 22, 2024',
      readTime: '9 min read',
      image: '🧠',
      author: 'Sarah Chen'
    }
  ];

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Hero Section */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl font-semibold mb-6"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              MailGen Blog
            </h1>
            <p className="text-lg mb-8"
               style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '18px' }}>
              Learn about AI, email marketing, lead generation, and how to scale your outreach
            </p>
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full px-6 py-4 pl-14 rounded-lg text-lg transition-all"
                style={{
                  border: '1px solid #d9d9d9',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#00f0a0'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d9d9d9'}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6"
                      style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-6 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: selectedCategory === category ? '#00f0a0' : 'white',
                  color: selectedCategory === category ? '#001529' : 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid',
                  borderColor: selectedCategory === category ? '#00f0a0' : '#d9d9d9'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.borderColor = '#00f0a0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-7xl mx-auto px-12 pb-12" style={{ backgroundColor: 'white' }}>
        <div className="rounded-2xl overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, #001529 0%, #00c98d 100%)',
               boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
             }}>
          <div className="grid md:grid-cols-2 gap-8 items-center p-12">
            <div>
              <div className="inline-flex px-4 py-2 rounded-full text-sm font-semibold mb-4"
                   style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                Featured Article
              </div>
              <h2 className="text-4xl font-semibold mb-4 leading-tight"
                  style={{ color: 'white', fontWeight: 600 }}>
                {featuredPost.title}
              </h2>
              <p className="text-lg mb-6 leading-relaxed"
                 style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-6 mb-6 text-sm"
                   style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{featuredPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
              <button
                className="px-8 py-3 font-semibold rounded-lg inline-flex items-center gap-2 transition-all"
                style={{ backgroundColor: 'white', color: '#001529' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Read Article <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-9xl">{featuredPost.image}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <article
                key={index}
                className="rounded-xl overflow-hidden transition-all hover:shadow-lg cursor-pointer group"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="p-12 flex items-center justify-center"
                     style={{ backgroundColor: '#f5f5f5' }}>
                  <div className="text-6xl">{post.image}</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1 text-sm"
                         style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 leading-tight group-hover:text-green-600 transition-colors"
                      style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
                    {post.title}
                  </h3>
                  <p className="mb-4 leading-relaxed"
                     style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4"
                       style={{ borderTop: '1px solid #f0f0f0' }}>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                        {post.author}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {post.date}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1"
                                style={{ color: '#00f0a0' }} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button
              className="px-10 py-4 font-semibold rounded-lg transition-all"
              style={{
                border: '1px solid #d9d9d9',
                color: 'rgba(0, 0, 0, 0.65)',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0a0';
                e.currentTarget.style.color = '#00c98d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = 'rgba(0, 0, 0, 0.65)';
              }}
            >
              Load More Articles
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-4xl mx-auto px-12 text-center">
          <div className="rounded-2xl p-12"
               style={{
                 backgroundColor: 'white',
                 border: '1px solid #f0f0f0',
                 boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)'
               }}>
            <h2 className="text-4xl font-semibold mb-4"
                style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
              Never Miss an Update
            </h2>
            <p className="text-lg mb-8"
               style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Get the latest articles, guides, and product updates delivered to your inbox
            </p>
            <div className="flex gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-lg text-lg"
                style={{ border: '1px solid #d9d9d9' }}
              />
              <button
                className="px-8 py-4 font-semibold rounded-lg transition-all"
                style={{ backgroundColor: '#00f0a0', color: '#001529' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28fcaf'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
              >
                Subscribe
              </button>
            </div>
            <p className="text-sm mt-4" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              Join 50,000+ marketers. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
