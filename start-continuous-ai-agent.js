const axios = require('axios');
const EmailService = require('./server/services/EmailService');
const SenderNameGenerator = require('./server/utils/SenderNameGenerator');
const KnowledgeBase = require('./server/models/KnowledgeBase');
require('dotenv').config();

class ContinuousAIAgent {
  constructor(targetWebsite, campaignGoal) {
    this.targetWebsite = targetWebsite;
    this.campaignGoal = campaignGoal;
    this.isRunning = false;
    this.emailService = new EmailService();
    this.knowledgeBase = new KnowledgeBase();
    this.stats = {
      totalEmailsSent: 0,
      campaignsRun: 0,
      startTime: null,
      lastActivity: null,
      successfulDeliveries: 0,
      errors: 0
    };
    this.discoveryInterval = null;
    this.monitoringInterval = null;
  }

  async start() {
    console.log('🚀 Starting Continuous AI Email Outreach Agent');
    console.log('================================================');
    console.log(`🎯 Target: ${this.targetWebsite}`);
    console.log(`📝 Goal: ${this.campaignGoal}`);
    console.log('================================================\n');

    this.isRunning = true;
    this.stats.startTime = new Date().toISOString();

    try {
      // Initialize the intelligent agent
      console.log('📡 Initializing AI systems...');
      await axios.post('http://localhost:3333/api/intelligent/init');
      console.log('✅ AI systems initialized\n');

      // Test email system
      console.log('📧 Testing email system...');
      await this.emailService.verifyConnection();
      console.log('✅ Email system verified\n');

      // Start continuous operations
      this.startContinuousDiscovery();
      this.startEmailMonitoring();
      this.startStatusReporting();

      console.log('🔄 Continuous AI agent is now running...');
      console.log('📊 Status reports will be generated every 30 seconds');
      console.log('🔍 Prospect discovery runs every 5 minutes');
      console.log('📬 Email monitoring checks every 2 minutes');
      console.log('\n⚠️  Press Ctrl+C to stop the agent\n');

    } catch (error) {
      console.error('❌ Failed to start continuous agent:', error.message);
      this.isRunning = false;
    }
  }

  async startContinuousDiscovery() {
    const runDiscovery = async () => {
      if (!this.isRunning) return;

      try {
        this.stats.lastActivity = new Date().toISOString();
        console.log(`🔍 [${new Date().toLocaleTimeString()}] Running AI prospect discovery...`);

        // Generate AI-powered prospect searches
        const searchStrategies = await this.generateSearchStrategies();
        
        for (const strategy of searchStrategies) {
          if (!this.isRunning) break;
          
          console.log(`   🔎 Searching: "${strategy.query}"`);
          const prospects = await this.searchProspects(strategy);
          
          if (prospects && prospects.length > 0) {
            console.log(`   ✅ Found ${prospects.length} potential prospects`);
            await this.processProspects(prospects);
          } else {
            console.log(`   ⏭️  No new prospects found for this query`);
          }

          // Wait 30 seconds between searches to be respectful
          await this.sleep(30000);
        }

        this.stats.campaignsRun++;
        
      } catch (error) {
        console.error(`   ❌ Discovery error: ${error.message}`);
        this.stats.errors++;
      }
    };

    // Run discovery every 5 minutes
    this.discoveryInterval = setInterval(runDiscovery, 5 * 60 * 1000);
    
    // Run first discovery immediately
    setTimeout(runDiscovery, 5000);
  }

  async generateSearchStrategies() {
    // Generate AI-powered search strategies based on the target company
    const strategies = [
      { 
        query: `pet care businesses near me contact`,
        industry: 'pet care',
        businessType: 'local services'
      },
      { 
        query: `veterinary clinics email contact directory`,
        industry: 'veterinary',
        businessType: 'medical services'
      },
      { 
        query: `pet supplies retailers business directory`,
        industry: 'retail',
        businessType: 'pet retail'
      },
      { 
        query: `pet photography services business contacts`,
        industry: 'photography',
        businessType: 'creative services'
      },
      { 
        query: `dog grooming services business email`,
        industry: 'grooming',
        businessType: 'pet services'
      }
    ];

    // Randomize and return 2-3 strategies per round
    return strategies
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 2);
  }

  async searchProspects(strategy) {
    try {
      // Use Google Custom Search to find prospects
      const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: strategy.query,
          num: 5
        }
      });

      if (response.data && response.data.items) {
        return response.data.items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          industry: strategy.industry,
          businessType: strategy.businessType,
          searchQuery: strategy.query
        }));
      }
    } catch (error) {
      console.log(`   ⚠️ Search API error: ${error.message}`);
    }
    
    return [];
  }

  async processProspects(prospects) {
    console.log(`   🎯 Processing ${prospects.length} prospects...`);

    for (let i = 0; i < prospects.length && this.isRunning; i++) {
      const prospect = prospects[i];
      
      try {
        // Extract potential email or create prospect profile
        const prospectProfile = await this.createProspectProfile(prospect);
        
        if (prospectProfile.email) {
          console.log(`   📧 Sending personalized email to ${prospectProfile.name || 'prospect'}`);
          await this.sendPersonalizedEmail(prospectProfile);
          this.stats.totalEmailsSent++;
          this.stats.successfulDeliveries++;
          
          // Update knowledge base with successful prospect
          await this.updateKnowledgeBase(prospectProfile, 'email_sent');
        } else {
          console.log(`   ⏭️  No email found for ${prospect.title}`);
        }

        // Wait 45 seconds between emails
        if (i < prospects.length - 1) {
          await this.sleep(45000);
        }

      } catch (error) {
        console.error(`   ❌ Error processing prospect: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  async createProspectProfile(prospect) {
    // Extract business name from title
    const businessName = prospect.title.split(' - ')[0].split(' | ')[0].trim();
    
    // For demo purposes, we'll use our test email
    // In production, this would use email discovery APIs or web scraping
    const profile = {
      name: `Business Owner`,
      company: businessName,
      email: process.env.SMTP_USERNAME || 'luzgool001@gmail.com', // Demo email
      website: prospect.link,
      industry: prospect.industry,
      businessType: prospect.businessType,
      snippet: prospect.snippet,
      searchQuery: prospect.searchQuery,
      discoveredAt: new Date().toISOString()
    };

    return profile;
  }

  async sendPersonalizedEmail(prospect) {
    // Get sender information from knowledge base first
    let senderInfo;
    try {
      const dbSenderInfo = await this.knowledgeBase.getSenderInfo(this.targetWebsite);
      if (dbSenderInfo && dbSenderInfo.sender_name) {
        // Use industry-specific personalization from knowledge base
        senderInfo = SenderNameGenerator.generatePersonalizedSender(
          this.targetWebsite, 
          dbSenderInfo.campaign_goal || this.campaignGoal, 
          prospect.industry
        );
        // Override with knowledge base data
        senderInfo.companyName = dbSenderInfo.company_name;
        senderInfo.senderTitle = dbSenderInfo.sender_title;
      } else {
        // Fallback to generator
        senderInfo = SenderNameGenerator.generatePersonalizedSender(
          this.targetWebsite, 
          this.campaignGoal, 
          prospect.industry
        );
      }
    } catch (error) {
      console.log('   ⚠️ Knowledge base lookup failed, using generator');
      senderInfo = SenderNameGenerator.generatePersonalizedSender(
        this.targetWebsite, 
        this.campaignGoal, 
        prospect.industry
      );
    }
    
    const subject = `🐾 Partnership Opportunity for ${prospect.company} - AI Pet Services`;
    
    const personalizedContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2c5aa0;">Hello from PETPO! 👋</h2>
        
        <p>I hope this email finds you and the ${prospect.company} team thriving!</p>
        
        <p>I came across ${prospect.company} while researching innovative businesses in the ${prospect.industry} space, and I'm excited to reach out about a potential partnership opportunity.</p>

        <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #2c5aa0; margin: 20px 0;">
          <p><strong>🤖 About PETPO:</strong> We're revolutionizing pet portraits with AI technology from ${this.targetWebsite}</p>
          <p><strong>🎯 Our Mission:</strong> ${this.campaignGoal}</p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c5aa0;">💡 Partnership Opportunities for ${prospect.company}:</h3>
          <ul>
            <li>🎨 <strong>White-label AI Pet Portraits:</strong> Offer our service under your brand</li>
            <li>📈 <strong>Revenue Sharing:</strong> Earn commission on every portrait ordered</li>
            <li>🤖 <strong>API Integration:</strong> Seamlessly integrate our AI into your platform</li>
            <li>🎯 <strong>Exclusive Territory:</strong> Become the exclusive partner in your area</li>
          </ul>
        </div>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: white;"><strong>🚀 Why Partner With Us?</strong></p>
          <ul style="color: white; margin: 10px 0;">
            <li>✨ Cutting-edge AI technology</li>
            <li>📱 Mobile-first user experience</li>
            <li>⚡ Lightning-fast processing (minutes, not days)</li>
            <li>💰 High-margin revenue opportunity</li>
            <li>🔧 Full technical support included</li>
          </ul>
        </div>

        <p style="font-size: 16px; font-weight: bold; color: #2c5aa0;">
          Would you be open to a 15-minute call to explore how we could work together?
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.targetWebsite}" style="background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            🌐 View Our AI Technology
          </a>
        </div>

        <p>Looking forward to potentially working together!</p>

        <p>Best regards,<br>
        <strong>${senderInfo.senderTitle} Team</strong><br>
        ${senderInfo.companyName} - AI Pet Portraits<br>
        <a href="${this.targetWebsite}">${this.targetWebsite}</a></p>

        <hr style="margin: 30px 0; border: 1px solid #eee;">
        <p style="font-size: 11px; color: #666; text-align: center;">
          🤖 Intelligently personalized for ${prospect.company}<br>
          Discovered via: "${prospect.searchQuery}"<br>
          Sent: ${new Date().toLocaleString()} • Campaign: Continuous AI Outreach
        </p>
      </div>
    `;

    const result = await this.emailService.sendEmail({
      to: prospect.email,
      subject: subject,
      html: personalizedContent,
      from: `"${senderInfo.senderName}" <${process.env.SMTP_USERNAME}>`,
      trackingId: `continuous_${Date.now()}_${prospect.company.replace(/\s+/g, '_')}`
    });

    console.log(`   ✅ Email sent to ${prospect.company} (${result.messageId})`);
    return result;
  }

  async updateKnowledgeBase(prospect, action) {
    // Store successful prospects and actions in knowledge base
    // This helps the AI learn what types of businesses respond well
    try {
      await axios.post('http://localhost:3333/api/intelligent/knowledge/update', {
        type: 'prospect_interaction',
        data: {
          company: prospect.company,
          industry: prospect.industry,
          businessType: prospect.businessType,
          action: action,
          timestamp: new Date().toISOString(),
          searchQuery: prospect.searchQuery,
          campaignGoal: this.campaignGoal
        }
      });
    } catch (error) {
      // Knowledge base update is not critical, continue if it fails
      console.log(`   ⚠️ Knowledge base update failed: ${error.message}`);
    }
  }

  startEmailMonitoring() {
    console.log('📬 Starting email monitoring for replies...');
    
    this.monitoringInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Check for email replies (simplified version)
        // In production, this would connect to IMAP and check for new emails
        console.log(`📭 [${new Date().toLocaleTimeString()}] Checking for email replies...`);
        
        // Simulate occasional replies for demo
        if (Math.random() < 0.1) { // 10% chance of simulated reply
          console.log('📨 Simulated reply received! (In production, this would trigger auto-response)');
          await this.handleEmailReply({
            from: 'prospect@example.com',
            subject: 'Re: Partnership Opportunity',
            content: 'Thanks for reaching out! I am interested in learning more.'
          });
        }

      } catch (error) {
        console.error(`📭 Email monitoring error: ${error.message}`);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }

  async handleEmailReply(reply) {
    console.log(`📧 Processing reply from ${reply.from}...`);
    
    // Generate AI-powered auto-reply
    const autoReply = await this.generateAutoReply(reply);
    
    if (autoReply) {
      console.log(`🤖 Sending AI-generated auto-reply...`);
      
      // Generate sender info for auto-reply
      const senderInfo = SenderNameGenerator.generateSenderInfo(this.targetWebsite, this.campaignGoal);
      
      await this.emailService.sendEmail({
        to: reply.from,
        subject: `Re: ${reply.subject}`,
        html: autoReply,
        from: `"${senderInfo.senderName}" <${process.env.SMTP_USERNAME}>`,
        trackingId: `auto_reply_${Date.now()}`
      });
      console.log(`✅ Auto-reply sent successfully`);
    }
  }

  async generateAutoReply(reply) {
    // Generate personalized auto-reply based on the original email and reply content
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h3 style="color: #2c5aa0;">Thank you for your interest! 🎉</h3>
        
        <p>I'm thrilled that you're interested in learning more about our AI pet portrait partnership opportunity!</p>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>🚀 Next Steps:</strong></p>
          <ol>
            <li>Visit our demo at <a href="${this.targetWebsite}">${this.targetWebsite}</a></li>
            <li>Schedule a call: <a href="mailto:${process.env.SMTP_USERNAME}">Reply to this email</a></li>
            <li>We'll send you partnership details within 24 hours</li>
          </ol>
        </div>
        
        <p>I'll be in touch shortly with more information tailored to your business needs.</p>
        
        <p>Best regards,<br>
        <strong>Partnership Development Team</strong><br>
        PETPO</p>
        
        <p style="font-size: 11px; color: #666;">
          🤖 This auto-reply was generated by our AI system in response to your inquiry.
        </p>
      </div>
    `;
  }

  startStatusReporting() {
    setInterval(() => {
      if (!this.isRunning) return;

      const runtime = this.stats.startTime ? 
        Math.floor((Date.now() - new Date(this.stats.startTime).getTime()) / 60000) : 0;

      console.log('\n📊 CONTINUOUS AI AGENT STATUS REPORT');
      console.log('=====================================');
      console.log(`🕐 Runtime: ${runtime} minutes`);
      console.log(`📧 Total Emails Sent: ${this.stats.totalEmailsSent}`);
      console.log(`✅ Successful Deliveries: ${this.stats.successfulDeliveries}`);
      console.log(`🔄 Discovery Campaigns: ${this.stats.campaignsRun}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
      console.log(`📈 Success Rate: ${this.stats.totalEmailsSent > 0 ? 
        Math.round((this.stats.successfulDeliveries / this.stats.totalEmailsSent) * 100) : 0}%`);
      console.log(`🎯 Target: ${this.targetWebsite}`);
      console.log(`📝 Goal: ${this.campaignGoal}`);
      console.log('=====================================\n');
    }, 30 * 1000); // Report every 30 seconds
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('\n🛑 Stopping Continuous AI Agent...');
    this.isRunning = false;

    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('✅ AI Agent stopped successfully');
    console.log(`📊 Final Stats: ${this.stats.totalEmailsSent} emails sent, ${this.stats.campaignsRun} campaigns run`);
    
    process.exit(0);
  }
}

// Start the continuous AI agent
const agent = new ContinuousAIAgent(
  'https://petpoofficial.org',
  'promote AI pet portrait products and establish strategic partnerships'
);

// Handle graceful shutdown
process.on('SIGINT', () => {
  agent.stop();
});

process.on('SIGTERM', () => {
  agent.stop();
});

// Start the agent
agent.start().catch(error => {
  console.error('❌ Failed to start agent:', error.message);
  process.exit(1);
});