import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Zap, Target, BarChart3, TestTube, Award, Mail, Sparkles, FileText, Radar, CheckCircle } from 'lucide-react';

const FeaturePage = () => {
  const { slug } = useParams();

  // Features data
  const features = {
    'ai-email-generator': {
      title: 'AI Email Generator',
      subtitle: 'Create personalized, high-converting emails in seconds',
      icon: '✉️',
      category: 'Core Feature',
      description: 'Our AI Email Generator uses advanced language models to create personalized, compelling emails that resonate with your prospects and drive responses.',
      content: `
        <h2>Transform Your Email Outreach with AI</h2>
        <p>The MailGen AI Email Generator is the most advanced email creation tool on the market. Powered by state-of-the-art language models, it creates personalized emails that sound human-written and drive real results.</p>

        <h3>How It Works</h3>
        <p>Simply provide basic information about your prospect and your value proposition. Our AI analyzes hundreds of data points to create emails that:</p>
        <ul>
          <li><strong>Reference specific company details</strong> - Recent news, funding rounds, product launches</li>
          <li><strong>Match prospect communication style</strong> - Professional, casual, or technical tone</li>
          <li><strong>Highlight relevant pain points</strong> - Industry-specific challenges and solutions</li>
          <li><strong>Include compelling CTAs</strong> - Optimized calls-to-action that drive responses</li>
        </ul>

        <h3>Key Capabilities</h3>
        <ul>
          <li><strong>Hyper-Personalization:</strong> Goes beyond {{firstName}} to include company signals, recent news, and competitive intelligence</li>
          <li><strong>Multiple Variations:</strong> Generate multiple email versions to A/B test</li>
          <li><strong>Tone Matching:</strong> Adjust tone from formal to conversational</li>
          <li><strong>Length Optimization:</strong> Short punchy emails or detailed introductions</li>
          <li><strong>Follow-up Sequences:</strong> Create entire email sequences automatically</li>
        </ul>

        <h3>Results You Can Expect</h3>
        <ul>
          <li><strong>3x higher response rates</strong> compared to manual emails</li>
          <li><strong>90% time savings</strong> on email creation</li>
          <li><strong>Consistent quality</strong> across your entire team</li>
          <li><strong>Scalable personalization</strong> for thousands of prospects</li>
        </ul>

        <blockquote>
          <p>"The AI Email Generator changed everything for us. We went from spending hours crafting emails to generating dozens of personalized messages in minutes. Our response rate jumped from 8% to 27%."</p>
          <cite>- Sarah Chen, VP of Sales at TechCorp</cite>
        </blockquote>

        <h3>Best Practices</h3>
        <ol>
          <li><strong>Provide quality inputs:</strong> The more context you give, the better the output</li>
          <li><strong>Review and refine:</strong> Use AI-generated emails as a starting point</li>
          <li><strong>Test variations:</strong> Let the AI create multiple versions to find what works</li>
          <li><strong>Learn from results:</strong> Feed successful emails back into the system</li>
        </ol>

        <h2>Start Generating Better Emails Today</h2>
        <p>Join thousands of sales teams using MailGen's AI Email Generator to transform their outreach. Start your free trial and see the difference AI-powered personalization makes.</p>
      `
    },
    'prospect-finder': {
      title: 'Prospect Finder',
      subtitle: 'Discover and qualify leads automatically',
      icon: '🎯',
      category: 'Core Feature',
      description: 'Access our database of 80M+ verified prospects and use AI to find your ideal customers automatically.',
      content: `
        <h2>Find Your Ideal Customers Automatically</h2>
        <p>The MailGen Prospect Finder gives you access to over 80 million verified business contacts. Our AI analyzes your ideal customer profile and automatically discovers prospects that match your criteria.</p>

        <h3>Massive Verified Database</h3>
        <ul>
          <li><strong>80M+ Prospects:</strong> Comprehensive coverage across industries</li>
          <li><strong>Verified Emails:</strong> Real-time email verification ensures deliverability</li>
          <li><strong>Rich Data:</strong> Job titles, company info, technology stack, and more</li>
          <li><strong>Daily Updates:</strong> Fresh data added continuously</li>
        </ul>

        <h3>AI-Powered Discovery</h3>
        <p>Our AI doesn't just search - it learns. Tell it about your best customers, and it finds more like them:</p>
        <ul>
          <li><strong>Lookalike Modeling:</strong> Find prospects similar to your best customers</li>
          <li><strong>Intent Signals:</strong> Identify companies actively looking for solutions like yours</li>
          <li><strong>Buying Signals:</strong> Detect funding rounds, hiring patterns, and growth indicators</li>
          <li><strong>Technology Detection:</strong> Find companies using complementary or competitive tools</li>
        </ul>

        <h3>Advanced Filtering</h3>
        <ul>
          <li>Industry and sub-industry</li>
          <li>Company size and revenue</li>
          <li>Geographic location</li>
          <li>Job title and seniority</li>
          <li>Technology stack</li>
          <li>Recent funding or growth signals</li>
        </ul>

        <blockquote>
          <p>"We used to spend 20 hours a week building prospect lists. With MailGen's Prospect Finder, we get better-qualified leads in minutes. It's like having a full-time researcher on the team."</p>
          <cite>- Michael Torres, Sales Manager at GrowthTech</cite>
        </blockquote>

        <h3>Quality Over Quantity</h3>
        <p>Finding prospects is easy. Finding the RIGHT prospects is hard. Our AI scores and ranks prospects based on fit, ensuring you spend time on leads most likely to convert.</p>

        <h2>Start Finding Better Prospects Today</h2>
        <p>Stop wasting time on unqualified leads. Let MailGen's Prospect Finder do the heavy lifting while you focus on closing deals.</p>
      `
    },
    'smart-campaigns': {
      title: 'Smart Campaigns',
      subtitle: 'Automated email sequences that adapt and optimize',
      icon: '🚀',
      category: 'Core Feature',
      description: 'Create intelligent email campaigns that automatically adjust timing, content, and follow-ups based on prospect behavior.',
      content: `
        <h2>Email Campaigns That Think for Themselves</h2>
        <p>Smart Campaigns go beyond simple automation. Using AI and machine learning, they continuously optimize your outreach based on real-time performance data.</p>

        <h3>Intelligent Automation</h3>
        <ul>
          <li><strong>Adaptive Timing:</strong> AI learns the best send times for each prospect</li>
          <li><strong>Dynamic Content:</strong> Automatically adjusts messaging based on engagement</li>
          <li><strong>Smart Follow-ups:</strong> Triggers follow-ups based on opens, clicks, and behavior</li>
          <li><strong>Automatic Optimization:</strong> Continuously improves based on results</li>
        </ul>

        <h3>Multi-Touch Sequences</h3>
        <p>Create sophisticated email sequences with multiple touchpoints:</p>
        <ul>
          <li>Initial outreach with personalized value proposition</li>
          <li>Follow-up with additional value or case study</li>
          <li>Social proof touchpoint with testimonials</li>
          <li>Final follow-up with compelling offer</li>
          <li>Re-engagement sequences for cold leads</li>
        </ul>

        <h3>Behavior-Based Triggers</h3>
        <ul>
          <li><strong>Email Opens:</strong> Trigger follow-up when prospect opens</li>
          <li><strong>Link Clicks:</strong> Send relevant content based on clicked links</li>
          <li><strong>Website Visits:</strong> Engage when prospect visits your site</li>
          <li><strong>No Response:</strong> Automatic re-engagement sequences</li>
        </ul>

        <blockquote>
          <p>"Smart Campaigns increased our meeting booking rate by 180%. The AI knows exactly when and how to follow up. It's like having a tireless SDR that never misses an opportunity."</p>
          <cite>- Lisa Martinez, Director of Sales at CloudStart</cite>
        </blockquote>

        <h3>Campaign Analytics</h3>
        <p>Track every aspect of campaign performance:</p>
        <ul>
          <li>Open and response rates by sequence step</li>
          <li>Best-performing subject lines and content</li>
          <li>Optimal send times by prospect segment</li>
          <li>Conversion rates through the funnel</li>
        </ul>

        <h2>Launch Smarter Campaigns Today</h2>
        <p>Stop guessing. Let AI optimize your campaigns automatically while you focus on what matters - closing deals.</p>
      `
    },
    'analytics-dashboard': {
      title: 'Analytics Dashboard',
      subtitle: 'Real-time insights to optimize your campaigns',
      icon: '📊',
      category: 'Core Feature',
      description: 'Comprehensive analytics dashboard that tracks every metric, identifies trends, and provides actionable recommendations.',
      content: `
        <h2>Data-Driven Email Marketing</h2>
        <p>The MailGen Analytics Dashboard gives you complete visibility into your email marketing performance. Track every metric, identify what's working, and get AI-powered recommendations to improve.</p>

        <h3>Key Metrics at a Glance</h3>
        <ul>
          <li><strong>Deliverability Rate:</strong> Percentage reaching inboxes</li>
          <li><strong>Open Rate:</strong> Email engagement tracking</li>
          <li><strong>Response Rate:</strong> Replies and engagement</li>
          <li><strong>Meeting Booking Rate:</strong> Conversions from emails</li>
          <li><strong>Pipeline Generated:</strong> Revenue impact tracking</li>
        </ul>

        <h3>Deep Dive Analytics</h3>
        <ul>
          <li><strong>Campaign Performance:</strong> Compare campaigns side-by-side</li>
          <li><strong>Sequence Analysis:</strong> See which steps perform best</li>
          <li><strong>Subject Line Testing:</strong> A/B test results</li>
          <li><strong>Time Analysis:</strong> Optimal send times</li>
          <li><strong>Segment Performance:</strong> Results by industry, role, company size</li>
        </ul>

        <h3>AI-Powered Insights</h3>
        <p>Our AI doesn't just show data - it tells you what to do with it:</p>
        <ul>
          <li><strong>Performance Alerts:</strong> Notified when metrics change significantly</li>
          <li><strong>Optimization Suggestions:</strong> Specific recommendations to improve</li>
          <li><strong>Trend Analysis:</strong> Identify patterns over time</li>
          <li><strong>Predictive Forecasting:</strong> Project future performance</li>
        </ul>

        <blockquote>
          <p>"The Analytics Dashboard transformed how we approach email marketing. We can see exactly what's working and why. Our team makes data-driven decisions every day."</p>
          <cite>- David Park, Head of Growth at DataCore</cite>
        </blockquote>

        <h3>Custom Reports</h3>
        <ul>
          <li>Build custom dashboards for different stakeholders</li>
          <li>Schedule automated report delivery</li>
          <li>Export data for further analysis</li>
          <li>Integrate with BI tools</li>
        </ul>

        <h2>Start Making Data-Driven Decisions</h2>
        <p>Stop guessing what works. Let data guide your email marketing strategy and watch your results improve.</p>
      `
    },
    'ab-testing': {
      title: 'A/B Testing',
      subtitle: 'Test everything to maximize performance',
      icon: '🧪',
      category: 'Core Feature',
      description: 'Comprehensive A/B testing for subject lines, email content, send times, and more. Let data drive your optimization.',
      content: `
        <h2>Optimize Every Element of Your Emails</h2>
        <p>MailGen's A/B Testing feature lets you test every aspect of your email campaigns - from subject lines to send times - and automatically applies winning variations.</p>

        <h3>What You Can Test</h3>
        <ul>
          <li><strong>Subject Lines:</strong> Test multiple variations to maximize opens</li>
          <li><strong>Email Content:</strong> Compare different messaging approaches</li>
          <li><strong>Send Times:</strong> Find optimal delivery windows</li>
          <li><strong>Call-to-Action:</strong> Test different CTAs and placements</li>
          <li><strong>Email Length:</strong> Short vs. detailed emails</li>
          <li><strong>Personalization Depth:</strong> Light vs. heavy personalization</li>
        </ul>

        <h3>Statistical Significance</h3>
        <p>Our A/B testing uses rigorous statistical analysis to ensure results are meaningful:</p>
        <ul>
          <li>Automatic sample size calculation</li>
          <li>Statistical significance indicators</li>
          <li>Confidence intervals on results</li>
          <li>Multi-variant testing support</li>
        </ul>

        <h3>Automatic Optimization</h3>
        <p>Set it and forget it - MailGen automatically:</p>
        <ul>
          <li>Distributes test traffic evenly</li>
          <li>Detects winners as soon as statistically significant</li>
          <li>Applies winning variations to remaining sends</li>
          <li>Learns and applies insights to future campaigns</li>
        </ul>

        <blockquote>
          <p>"A/B testing helped us increase our open rates by 45%. We test everything now - it's become core to how we operate. The automatic optimization means we're always improving."</p>
          <cite>- Emily Rodriguez, Marketing Manager at ScaleUp</cite>
        </blockquote>

        <h3>Testing Best Practices</h3>
        <ol>
          <li><strong>Test one variable at a time:</strong> Isolate what's driving changes</li>
          <li><strong>Use meaningful sample sizes:</strong> Ensure statistical validity</li>
          <li><strong>Document learnings:</strong> Build institutional knowledge</li>
          <li><strong>Test continuously:</strong> Markets change, keep optimizing</li>
        </ol>

        <h2>Start Testing Today</h2>
        <p>Stop guessing what works. Let data drive your email optimization and watch your results improve.</p>
      `
    },
    'lead-scoring': {
      title: 'Lead Scoring',
      subtitle: 'Prioritize your best opportunities automatically',
      icon: '⭐',
      category: 'Core Feature',
      description: 'AI-powered lead scoring that identifies your most valuable prospects and helps you focus on the deals most likely to close.',
      content: `
        <h2>Focus on the Leads That Matter</h2>
        <p>Not all leads are created equal. MailGen's Lead Scoring uses AI to analyze dozens of signals and automatically prioritize prospects most likely to convert.</p>

        <h3>How Lead Scoring Works</h3>
        <p>Our AI analyzes multiple factors to score each lead:</p>
        <ul>
          <li><strong>Fit Score:</strong> How well the prospect matches your ICP</li>
          <li><strong>Engagement Score:</strong> Email opens, clicks, and responses</li>
          <li><strong>Intent Score:</strong> Buying signals and research activity</li>
          <li><strong>Timing Score:</strong> Budget cycles and purchase readiness</li>
        </ul>

        <h3>Scoring Signals</h3>
        <ul>
          <li>Company size and revenue</li>
          <li>Technology stack alignment</li>
          <li>Recent funding or growth</li>
          <li>Job title and seniority</li>
          <li>Email engagement history</li>
          <li>Website visit behavior</li>
          <li>Content downloads</li>
          <li>Social media activity</li>
        </ul>

        <h3>Actionable Prioritization</h3>
        <ul>
          <li><strong>Hot Leads:</strong> Ready to buy - prioritize immediately</li>
          <li><strong>Warm Leads:</strong> Engaged and interested - nurture actively</li>
          <li><strong>Cold Leads:</strong> Low engagement - automated nurturing</li>
          <li><strong>Disqualified:</strong> Poor fit - remove from sequences</li>
        </ul>

        <blockquote>
          <p>"Lead Scoring helped us focus our limited resources on the right prospects. We closed 40% more deals with the same team size. It's like having an extra SDR doing qualification."</p>
          <cite>- Marcus Chen, VP of Sales at CloudTech</cite>
        </blockquote>

        <h3>Custom Scoring Models</h3>
        <p>Customize scoring based on your business:</p>
        <ul>
          <li>Define your own scoring criteria</li>
          <li>Weight factors based on importance</li>
          <li>Create segment-specific models</li>
          <li>Train models on your historical data</li>
        </ul>

        <h2>Start Scoring Leads Today</h2>
        <p>Stop wasting time on unqualified prospects. Let AI identify your best opportunities and focus your efforts where they matter most.</p>
      `
    },
    'ai-email-assistant': {
      title: 'AI Email Assistant',
      subtitle: 'Your intelligent email writing companion',
      icon: '🤖',
      category: 'Related Tool',
      description: 'An AI-powered assistant that helps you write better emails, suggests improvements, and ensures your messaging resonates.',
      content: `
        <h2>Your Personal Email Writing Expert</h2>
        <p>The AI Email Assistant is like having an expert copywriter available 24/7. It helps you craft compelling emails, suggests improvements, and ensures your messaging hits the mark every time.</p>

        <h3>Real-Time Writing Assistance</h3>
        <ul>
          <li><strong>Smart Suggestions:</strong> Get real-time recommendations as you write</li>
          <li><strong>Tone Analysis:</strong> Ensure your email strikes the right tone</li>
          <li><strong>Grammar & Clarity:</strong> Catch errors and improve readability</li>
          <li><strong>Length Optimization:</strong> Keep emails concise and impactful</li>
        </ul>

        <h3>Personalization Help</h3>
        <p>The assistant helps you personalize effectively:</p>
        <ul>
          <li>Suggests relevant company details to reference</li>
          <li>Recommends personalization hooks</li>
          <li>Identifies opportunities to add value</li>
          <li>Warns against generic messaging</li>
        </ul>

        <h3>Subject Line Optimization</h3>
        <ul>
          <li>Generate multiple subject line options</li>
          <li>Predict open rate potential</li>
          <li>Check for spam triggers</li>
          <li>Ensure mobile-friendly length</li>
        </ul>

        <blockquote>
          <p>"The AI Email Assistant is like having a writing coach in my pocket. It catches things I miss and always suggests ways to make my emails more compelling. My confidence in every email I send has skyrocketed."</p>
          <cite>- Jennifer Wu, Account Executive at SalesForce</cite>
        </blockquote>

        <h3>Learning Your Style</h3>
        <p>The assistant learns your preferences over time:</p>
        <ul>
          <li>Adapts to your writing style</li>
          <li>Remembers your brand voice</li>
          <li>Suggests based on your successful emails</li>
          <li>Gets smarter with every interaction</li>
        </ul>

        <h2>Start Writing Better Emails Today</h2>
        <p>Every email is an opportunity to impress. Let the AI Email Assistant help you make the most of each one.</p>
      `
    },
    'ai-subject-line-generator': {
      title: 'AI Subject Line Generator',
      subtitle: 'Create subject lines that get opened',
      icon: '📝',
      category: 'Related Tool',
      description: 'Generate high-converting subject lines using AI trained on millions of successful emails.',
      content: `
        <h2>Subject Lines That Get Opened</h2>
        <p>Your subject line determines whether your email gets opened or ignored. Our AI Subject Line Generator creates compelling subject lines based on what actually works.</p>

        <h3>AI-Powered Generation</h3>
        <p>Our AI is trained on millions of successful email subject lines across industries:</p>
        <ul>
          <li><strong>Pattern Recognition:</strong> Identifies what makes subject lines successful</li>
          <li><strong>Industry Adaptation:</strong> Adjusts style for your specific industry</li>
          <li><strong>Personalization:</strong> Incorporates prospect-specific details</li>
          <li><strong>A/B Optimization:</strong> Generates multiple variants for testing</li>
        </ul>

        <h3>Subject Line Types</h3>
        <ul>
          <li><strong>Question-Based:</strong> Engage curiosity with relevant questions</li>
          <li><strong>Value-Focused:</strong> Lead with specific benefits</li>
          <li><strong>Social Proof:</strong> Reference mutual connections or similar companies</li>
          <li><strong>Urgency-Based:</strong> Create appropriate time sensitivity</li>
          <li><strong>Personalized:</strong> Include company or personal details</li>
        </ul>

        <h3>Performance Prediction</h3>
        <p>Before you send, know how your subject line will perform:</p>
        <ul>
          <li>Predicted open rate score</li>
          <li>Spam trigger warnings</li>
          <li>Mobile preview</li>
          <li>Character count optimization</li>
        </ul>

        <blockquote>
          <p>"The Subject Line Generator consistently produces winners. We A/B test every email, and the AI-generated options outperform our manual attempts 80% of the time. Open rates are up 35%."</p>
          <cite>- David Kim, Email Marketing Manager at GrowthLabs</cite>
        </blockquote>

        <h3>Best Practices Built In</h3>
        <ul>
          <li>Optimal length (6-10 words)</li>
          <li>No spam trigger words</li>
          <li>Personalization tokens</li>
          <li>Mobile-friendly preview text</li>
        </ul>

        <h2>Start Generating Better Subject Lines</h2>
        <p>Your subject line is your first impression. Make it count with AI-powered generation.</p>
      `
    },
    'ai-campaign-helper': {
      title: 'AI Campaign Helper',
      subtitle: 'Plan and optimize campaigns with AI guidance',
      icon: '💡',
      category: 'Related Tool',
      description: 'Get AI-powered recommendations for campaign strategy, timing, targeting, and optimization.',
      content: `
        <h2>Your AI Campaign Strategist</h2>
        <p>The AI Campaign Helper provides intelligent guidance at every stage of your email campaign - from planning to optimization.</p>

        <h3>Campaign Planning</h3>
        <p>Get strategic recommendations before you launch:</p>
        <ul>
          <li><strong>Target Audience:</strong> AI suggests ideal segments to target</li>
          <li><strong>Messaging Strategy:</strong> Recommended angles and value propositions</li>
          <li><strong>Sequence Design:</strong> Optimal number and timing of touches</li>
          <li><strong>Goal Setting:</strong> Realistic benchmarks based on industry data</li>
        </ul>

        <h3>Real-Time Optimization</h3>
        <ul>
          <li>Monitor campaign performance in real-time</li>
          <li>Get alerts when metrics deviate from targets</li>
          <li>Receive specific recommendations to improve</li>
          <li>Automatic adjustments to timing and content</li>
        </ul>

        <h3>AI Recommendations</h3>
        <p>The Campaign Helper continuously analyzes your campaigns and suggests:</p>
        <ul>
          <li>Subject line improvements</li>
          <li>Content adjustments</li>
          <li>Send time optimization</li>
          <li>Segment refinements</li>
          <li>Follow-up strategy changes</li>
        </ul>

        <blockquote>
          <p>"The AI Campaign Helper is like having a senior marketing strategist on call 24/7. It caught issues we missed and suggested optimizations that increased our response rate by 60%."</p>
          <cite>- Amanda Lee, Director of Marketing at TechStart</cite>
        </blockquote>

        <h3>Learning from Results</h3>
        <p>The AI learns from every campaign:</p>
        <ul>
          <li>Identifies winning patterns</li>
          <li>Applies learnings to future campaigns</li>
          <li>Builds institutional knowledge</li>
          <li>Gets smarter over time</li>
        </ul>

        <h2>Launch Smarter Campaigns</h2>
        <p>Don't go it alone. Let AI guide your campaign strategy and watch your results improve.</p>
      `
    },
    'ai-lead-tracker': {
      title: 'AI Lead Tracker',
      subtitle: 'Never lose track of a potential customer',
      icon: '📍',
      category: 'Related Tool',
      description: 'Intelligent lead tracking that monitors engagement, predicts behavior, and ensures no opportunity falls through the cracks.',
      content: `
        <h2>Complete Visibility Into Every Lead</h2>
        <p>The AI Lead Tracker gives you a 360-degree view of every prospect's journey - from first touch to closed deal. Never miss an opportunity again.</p>

        <h3>Comprehensive Tracking</h3>
        <ul>
          <li><strong>Email Engagement:</strong> Opens, clicks, replies, and forwards</li>
          <li><strong>Website Activity:</strong> Pages visited, time spent, content downloaded</li>
          <li><strong>Timeline View:</strong> Complete history of all interactions</li>
          <li><strong>Multi-Channel:</strong> Track engagement across email, web, and social</li>
        </ul>

        <h3>AI-Powered Insights</h3>
        <p>Go beyond basic tracking with intelligent analysis:</p>
        <ul>
          <li><strong>Engagement Scoring:</strong> Quantify prospect interest level</li>
          <li><strong>Behavior Prediction:</strong> Predict next likely actions</li>
          <li><strong>Opportunity Alerts:</strong> Get notified when prospects show buying signals</li>
          <li><strong>Risk Detection:</strong> Identify deals at risk of going cold</li>
        </ul>

        <h3>Automated Follow-Up Triggers</h3>
        <ul>
          <li>Trigger follow-up when prospect revisits your site</li>
          <li>Alert sales when high-value prospect engages</li>
          <li>Re-engage cold leads automatically</li>
          <li>Schedule outreach based on optimal timing</li>
        </ul>

        <blockquote>
          <p>"The AI Lead Tracker caught a $500K opportunity we would have missed. A prospect we thought was cold suddenly showed interest, and the system alerted us immediately. That single deal paid for a year of the platform."</p>
          <cite>- Robert Kim, Sales Director at EnterpriseCo</cite>
        </blockquote>

        <h3>CRM Integration</h3>
        <p>Seamlessly sync with your existing tools:</p>
        <ul>
          <li>Automatic CRM updates</li>
          <li>Bi-directional sync</li>
          <li>Custom field mapping</li>
          <li>Activity logging</li>
        </ul>

        <h2>Start Tracking Leads Intelligently</h2>
        <p>Every lead is valuable. Make sure you're tracking and nurturing them effectively with AI-powered insights.</p>
      `
    }
  };

  const feature = features[slug];

  if (!feature) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="max-w-4xl mx-auto px-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Feature Not Found</h1>
          <Link to="/" className="text-[#00f5a0] hover:underline">
            Back to Home
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
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#00f5a0'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0, 0, 0, 0.65)'}>
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-12 py-12">
        {/* Category Badge */}
        <div className="mb-6">
          <span className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ backgroundColor: 'rgba(0, 245, 160, 0.1)', color: '#00f5a0' }}>
            {feature.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold mb-4 leading-tight"
            style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 700 }}>
          {feature.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xl mb-8" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
          {feature.subtitle}
        </p>

        {/* Description */}
        <div className="mb-8 pb-8 border-b" style={{ borderColor: '#f0f0f0' }}>
          <p className="text-lg" style={{ color: 'rgba(0, 0, 0, 0.88)', lineHeight: '1.8' }}>
            {feature.description}
          </p>
        </div>

        {/* Featured Image Placeholder */}
        <div className="mb-12 p-20 rounded-2xl flex items-center justify-center text-9xl"
             style={{ backgroundColor: '#f5f5f5' }}>
          {feature.icon}
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
              border-left: 5px solid #00f5a0;
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
              color: #00f5a0;
              text-decoration: none;
            }
            .prose a:hover {
              text-decoration: underline;
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: feature.content }} />
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 rounded-2xl text-center" style={{ backgroundColor: 'rgba(0, 245, 160, 0.1)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Ready to Get Started?
          </h2>
          <p className="mb-6" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            Start your free 14-day trial and experience the power of AI-driven email marketing.
          </p>
          <Link to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black transition-all hover:scale-105"
                style={{ backgroundColor: '#00f5a0' }}>
            <Sparkles className="w-5 h-5" />
            Start Free Trial
          </Link>
        </div>
      </article>

      {/* Related Features */}
      <div className="py-20" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-4xl mx-auto px-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            Explore More Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(features)
              .filter(([key]) => key !== slug)
              .slice(0, 4)
              .map(([key, f]) => (
                <Link key={key} to={`/features/${key}`} className="block">
                  <div className="rounded-xl p-6 transition-all hover:shadow-lg"
                       style={{ backgroundColor: 'white', border: '1px solid #f0f0f0' }}>
                    <div className="text-4xl mb-4">{f.icon}</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      {f.title}
                    </h3>
                    <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px' }}>
                      {f.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturePage;
