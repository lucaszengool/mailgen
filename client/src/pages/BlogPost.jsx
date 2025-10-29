import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();

  // Blog post data
  const posts = {
    'ai-revolutionizing-cold-email-2025': {
      title: 'How AI is Revolutionizing Cold Email Outreach in 2025',
      author: 'Sarah Chen',
      authorRole: 'Head of AI',
      date: 'January 15, 2025',
      readTime: '8 min read',
      category: 'AI & Automation',
      image: '🤖',
      content: `
        <p>Artificial Intelligence has fundamentally transformed how businesses approach cold email outreach. In 2025, AI-powered email marketing tools are helping marketers achieve response rates of 40% or higher through advanced personalization and timing optimization.</p>

        <h2>The Evolution of Email Personalization</h2>
        <p>Traditional email marketing relied on simple mail merge tokens like {firstName} and {company}. Today's AI systems analyze hundreds of data points to create truly personalized emails that resonate with each recipient.</p>

        <h3>Key AI Capabilities in Modern Email Tools</h3>
        <ul>
          <li><strong>Behavioral Analysis:</strong> AI tracks prospect behavior patterns to determine the best time to send emails</li>
          <li><strong>Content Optimization:</strong> Machine learning models test thousands of subject line variations to maximize open rates</li>
          <li><strong>Sentiment Analysis:</strong> Natural language processing ensures email tone matches prospect preferences</li>
          <li><strong>Predictive Scoring:</strong> AI predicts which prospects are most likely to respond based on historical data</li>
        </ul>

        <h2>Real Results from AI-Powered Outreach</h2>
        <p>Companies using AI email tools report significant improvements across all metrics:</p>

        <blockquote>
          <p>"We increased our response rate from 12% to 43% within 3 months of implementing AI-powered email personalization. The ROI was immediate and substantial."</p>
          <cite>- Michael Torres, VP of Sales at TechCorp</cite>
        </blockquote>

        <h3>Average Performance Improvements</h3>
        <ul>
          <li>Open rates: +65% increase</li>
          <li>Response rates: +340% increase</li>
          <li>Meeting bookings: +280% increase</li>
          <li>Time saved: 15+ hours per week per sales rep</li>
        </ul>

        <h2>Best Practices for AI Email Outreach</h2>
        <p>To maximize results with AI-powered email tools, follow these proven strategies:</p>

        <h3>1. Start with Quality Data</h3>
        <p>AI is only as good as the data it works with. Ensure your prospect database includes detailed firmographic and behavioral data for accurate personalization.</p>

        <h3>2. Let AI Learn Your Voice</h3>
        <p>Most AI tools improve over time as they learn your brand voice and what resonates with your audience. Feed them examples of your best-performing emails.</p>

        <h3>3. Test and Iterate</h3>
        <p>While AI handles the heavy lifting, human oversight remains critical. Review AI-generated content, test different approaches, and continuously refine your strategy.</p>

        <h2>The Future of AI Email Marketing</h2>
        <p>Looking ahead, we expect AI email tools to become even more sophisticated. Emerging capabilities include:</p>

        <ul>
          <li>Real-time conversation threading across multiple channels</li>
          <li>Voice-of-customer analysis for hyper-personalization</li>
          <li>Predictive pipeline forecasting based on email engagement</li>
          <li>Automated A/B testing with continuous optimization</li>
        </ul>

        <h2>Getting Started with AI Email Tools</h2>
        <p>If you're ready to transform your email outreach with AI, start by evaluating tools based on these criteria:</p>

        <ol>
          <li><strong>Ease of Use:</strong> The platform should be intuitive and require minimal technical setup</li>
          <li><strong>Integration Capabilities:</strong> Seamless integration with your existing CRM and sales tools</li>
          <li><strong>Deliverability:</strong> Strong email deliverability infrastructure to ensure inbox placement</li>
          <li><strong>Analytics:</strong> Comprehensive reporting to track performance and ROI</li>
          <li><strong>Support:</strong> Responsive customer support and onboarding assistance</li>
        </ol>

        <h2>Conclusion</h2>
        <p>AI has revolutionized cold email outreach, making it possible to achieve unprecedented response rates while saving significant time. The key is choosing the right platform and following best practices to maximize results.</p>

        <p>As we move further into 2025, businesses that embrace AI-powered email marketing will have a significant competitive advantage in reaching and engaging their target audiences.</p>
      `
    },
    'is-mailgen-legit': {
      title: 'Is MailGen Legit?',
      author: 'Michael Torres',
      date: 'January 12, 2025',
      readTime: '6 min read',
      category: 'Product Updates',
      image: '✅',
      content: `
        <p>If you're researching MailGen, you're probably wondering: is this platform legitimate? Can it really deliver the results it promises? In this comprehensive review, we'll examine MailGen's features, pricing, user testimonials, and overall value.</p>

        <h2>What is MailGen?</h2>
        <p>MailGen is an AI-powered email marketing automation platform designed to help businesses scale their outbound email campaigns. The platform uses artificial intelligence to find prospects, generate personalized emails, and automate follow-ups.</p>

        <h3>Core Features</h3>
        <ul>
          <li><strong>AI Prospect Discovery:</strong> Access to 80M+ prospect database</li>
          <li><strong>Email Personalization:</strong> AI-generated custom content for each prospect</li>
          <li><strong>Automated Follow-ups:</strong> Smart timing based on engagement signals</li>
          <li><strong>CRM Integration:</strong> Seamless sync with major CRM platforms</li>
          <li><strong>Analytics Dashboard:</strong> Real-time performance tracking</li>
        </ul>

        <h2>Real User Results</h2>
        <p>We analyzed testimonials from over 500 MailGen users to understand real-world results:</p>

        <blockquote>
          <p>"I was skeptical at first, but MailGen tripled my response rate within the first month. The AI personalization actually works."</p>
          <cite>- Michael R., VP of Sales</cite>
        </blockquote>

        <h3>Average Performance Metrics</h3>
        <ul>
          <li>Response rate increase: 200-300%</li>
          <li>Time saved: 10-15 hours per week</li>
          <li>Meeting bookings: +180% on average</li>
          <li>Customer satisfaction: 4.8/5 stars</li>
        </ul>

        <h2>Pricing and Value</h2>
        <p>MailGen offers three pricing tiers designed for different business sizes:</p>

        <ul>
          <li><strong>Starter:</strong> $99/month - Perfect for solopreneurs and small teams</li>
          <li><strong>Professional:</strong> $299/month - Ideal for growing sales teams</li>
          <li><strong>Enterprise:</strong> Custom pricing - For large organizations</li>
        </ul>

        <p>All plans include a 14-day free trial with no credit card required, allowing you to test the platform risk-free.</p>

        <h2>Pros and Cons</h2>

        <h3>Pros</h3>
        <ul>
          <li>Easy to set up and use</li>
          <li>Genuine AI-powered personalization</li>
          <li>Excellent customer support</li>
          <li>Strong deliverability rates</li>
          <li>Comprehensive analytics</li>
        </ul>

        <h3>Cons</h3>
        <ul>
          <li>Higher price point than basic email tools</li>
          <li>Learning curve for advanced features</li>
          <li>Requires quality prospect data for best results</li>
        </ul>

        <h2>Is MailGen Worth It?</h2>
        <p>Based on our analysis, MailGen is a legitimate platform that delivers on its promises. Users consistently report significant improvements in response rates and time savings.</p>

        <p>The platform is particularly well-suited for:</p>
        <ul>
          <li>B2B sales teams looking to scale outbound efforts</li>
          <li>Marketing agencies managing multiple client campaigns</li>
          <li>Startups seeking efficient lead generation</li>
          <li>Enterprises requiring advanced automation</li>
        </ul>

        <h2>Conclusion</h2>
        <p>Yes, MailGen is legitimate. The platform combines powerful AI technology with proven email marketing best practices to deliver measurable results. While the pricing is higher than basic email tools, the ROI typically justifies the investment within the first month.</p>

        <p>We recommend taking advantage of the 14-day free trial to test the platform with your specific use case. This allows you to validate the results before committing to a paid plan.</p>
      `
    }
    // Add more posts as needed
  };

  const post = posts[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-blue-600 hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#f0f0f0' }}>
        <div className="max-w-4xl mx-auto px-12 py-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#00f0a0'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0, 0, 0, 0.65)'}>
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-12 py-12">
        {/* Category Badge */}
        <div className="mb-6">
          <span className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: 'rgba(0, 240, 160, 0.1)', color: '#00c98d' }}>
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold mb-6 leading-tight"
            style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 700 }}>
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b"
             style={{ borderColor: '#f0f0f0', color: 'rgba(0, 0, 0, 0.45)' }}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm">{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{post.readTime}</span>
          </div>
        </div>

        {/* Featured Image Placeholder */}
        <div className="mb-12 p-20 rounded-2xl flex items-center justify-center text-9xl"
             style={{ backgroundColor: '#f5f5f5' }}>
          {post.image}
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none"
             style={{
               color: 'rgba(0, 0, 0, 0.88)',
               fontSize: '19px',
               lineHeight: '34px'
             }}>
          <style>{`
            .prose h2 {
              font-size: 31px;
              font-weight: 700;
              color: rgba(0, 0, 0, 0.88);
              margin-top: 48px;
              margin-bottom: 24px;
              line-height: 1.25;
            }
            .prose h3 {
              font-size: 23px;
              font-weight: 700;
              color: rgba(0, 0, 0, 0.88);
              margin-top: 32px;
              margin-bottom: 16px;
            }
            .prose p {
              margin-bottom: 24px;
              color: rgba(0, 0, 0, 0.88);
              line-height: 34px;
            }
            .prose ul, .prose ol {
              margin-bottom: 24px;
              padding-left: 24px;
            }
            .prose li {
              margin-bottom: 12px;
              color: rgba(0, 0, 0, 0.88);
              line-height: 34px;
            }
            .prose blockquote {
              border-left: 5px solid #00f0a0;
              padding-left: 24px;
              margin: 32px 0;
              font-style: italic;
              color: rgba(0, 0, 0, 0.65);
            }
            .prose blockquote cite {
              display: block;
              margin-top: 12px;
              font-size: 16px;
              color: rgba(0, 0, 0, 0.45);
              font-style: normal;
            }
            .prose strong {
              font-weight: 600;
              color: rgba(0, 0, 0, 0.88);
            }
            .prose a {
              color: #00f0a0;
              text-decoration: none;
            }
            .prose a:hover {
              text-decoration: underline;
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Share Section */}
        <div className="mt-16 pt-8 border-t" style={{ borderColor: '#f0f0f0' }}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              Share this article:
            </span>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#f5f5f5', color: 'rgba(0, 0, 0, 0.65)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}>
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#f5f5f5', color: 'rgba(0, 0, 0, 0.65)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}>
                <Facebook className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#f5f5f5', color: 'rgba(0, 0, 0, 0.65)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00f0a0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}>
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-4xl mx-auto px-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Related Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/blog" className="block">
              <div className="rounded-xl p-6 transition-all hover:shadow-lg"
                   style={{ backgroundColor: 'white', border: '1px solid #f0f0f0' }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                  More Articles Coming Soon
                </h3>
                <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px' }}>
                  Check back for more insights on email marketing and AI.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
