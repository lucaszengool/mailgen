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
      title: '10 Email Templates That Convert 3x Better',
      excerpt: 'Proven templates used by top-performing sales teams to book more meetings and close more deals.',
      category: 'Email Marketing',
      date: 'Jan 12, 2025',
      readTime: '6 min read',
      image: '📧',
      author: 'Michael Torres'
    },
    {
      title: 'Case Study: How TechCorp Generated $2M in Pipeline',
      excerpt: 'A deep dive into how one SaaS company used AI-powered outreach to transform their sales process.',
      category: 'Case Studies',
      date: 'Jan 10, 2025',
      readTime: '10 min read',
      image: '📊',
      author: 'Emily Rodriguez'
    },
    {
      title: 'The Complete Guide to Email Deliverability',
      excerpt: 'Everything you need to know about landing in the inbox, avoiding spam filters, and maintaining sender reputation.',
      category: 'Email Marketing',
      date: 'Jan 8, 2025',
      readTime: '12 min read',
      image: '✉️',
      author: 'David Park'
    },
    {
      title: 'Introducing: Multi-Channel Campaigns',
      excerpt: 'New feature alert! Coordinate email, LinkedIn, and phone outreach from a single dashboard.',
      category: 'Product Updates',
      date: 'Jan 5, 2025',
      readTime: '4 min read',
      image: '🚀',
      author: 'Lisa Chen'
    },
    {
      title: 'How to Build a High-Converting Lead List',
      excerpt: 'Step-by-step guide to finding, qualifying, and enriching prospects for your outbound campaigns.',
      category: 'Lead Generation',
      date: 'Jan 3, 2025',
      readTime: '7 min read',
      image: '🎯',
      author: 'James Wilson'
    },
    {
      title: 'AI Personalization: Beyond First Names',
      excerpt: 'Learn how modern AI personalizes emails using company signals, recent news, and behavioral data.',
      category: 'AI & Automation',
      date: 'Dec 28, 2024',
      readTime: '9 min read',
      image: '🧠',
      author: 'Sarah Chen'
    },
    {
      title: 'Cold Email Laws: GDPR, CAN-SPAM, and CASL Explained',
      excerpt: 'Stay compliant while scaling your outreach. A practical guide to email marketing regulations.',
      category: 'Email Marketing',
      date: 'Dec 25, 2024',
      readTime: '11 min read',
      image: '⚖️',
      author: 'Michael Torres'
    },
    {
      title: 'Case Study: 10x Pipeline Growth in 6 Months',
      excerpt: 'How a B2B startup went from 50 to 500 qualified meetings per month using AI-powered outreach.',
      category: 'Case Studies',
      date: 'Dec 22, 2024',
      readTime: '8 min read',
      image: '📈',
      author: 'Emily Rodriguez'
    },
    {
      title: 'The Psychology of Effective Follow-Up Emails',
      excerpt: 'Why timing and messaging matter more than you think when following up with prospects.',
      category: 'Email Marketing',
      date: 'Dec 20, 2024',
      readTime: '6 min read',
      image: '🧪',
      author: 'David Park'
    }
  ];

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              MailGen Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Learn about AI, email marketing, lead generation, and how to scale your outreach
            </p>
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full px-6 py-4 pl-14 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 text-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-3xl overflow-hidden shadow-2xl mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center p-12">
            <div>
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur text-white rounded-full text-sm font-semibold mb-4">
                Featured Article
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                {featuredPost.title}
              </h2>
              <p className="text-green-100 text-lg mb-6 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-6 text-white/90 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{featuredPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
              <button className="px-8 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
                Read Article <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-9xl">{featuredPost.image}</div>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-green-500 hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-12 flex items-center justify-center">
                <div className="text-6xl">{post.image}</div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{post.author}</div>
                    <div className="text-gray-500 text-xs">{post.date}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-green-500 hover:text-green-600 transition-colors">
            Load More Articles
          </button>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl border-2 border-gray-200">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Never Miss an Update
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get the latest articles, guides, and product updates delivered to your inbox
            </p>
            <div className="flex gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
              />
              <button className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Join 50,000+ marketers. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
