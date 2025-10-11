const nodemailer = require('nodemailer');
const KnowledgeBase = require('../models/KnowledgeBase');
const SmartBusinessAnalyzer = require('./SmartBusinessAnalyzer');

class EmailAgent {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.transporter = null;
    this.config = null;
    this.prospects = [];
    this.emailQueue = [];
    this.sentEmails = [];
    this.intervalId = null;
  }

  async initialize(config) {
    this.config = config;
    this.smtpWorking = false;
    
    // Try to create SMTP transporter
    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtpConfig.host,
        port: config.smtpConfig.port,
        secure: config.smtpConfig.secure || false,
        auth: {
          user: config.smtpConfig.username,
          pass: config.smtpConfig.password
        }
      });

      // Verify SMTP connection
      await this.transporter.verify();
      this.smtpWorking = true;
      console.log('✅ SMTP connection verified - emails will be sent');
    } catch (error) {
      console.error('❌ SMTP verification failed:', error.message);
      console.log('📧 Running in simulation mode - emails will be logged but not sent');
      this.smtpWorking = false;
      this.transporter = null;
      
      // Don't throw error, just continue in simulation mode
    }

    console.log('✅ Email Agent initialized successfully');
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    
    console.log('🚀 Starting Email Agent...');
    
    // Start the main agent loop
    this.runAgentLoop();
    
    return {
      success: true,
      message: 'Email Agent started successfully'
    };
  }

  async stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('⏹️ Email Agent stopped');
    
    return {
      success: true,
      message: 'Email Agent stopped successfully'
    };
  }

  pause() {
    this.isPaused = !this.isPaused;
    console.log(`${this.isPaused ? '⏸️' : '▶️'} Email Agent ${this.isPaused ? 'paused' : 'resumed'}`);
    
    return {
      success: true,
      message: `Email Agent ${this.isPaused ? 'paused' : 'resumed'} successfully`
    };
  }

  async runAgentLoop() {
    // Initial prospect discovery
    await this.discoverProspects();
    
    // Start email sending loop
    this.intervalId = setInterval(async () => {
      if (!this.isRunning || this.isPaused) return;
      
      try {
        await this.processEmailQueue();
      } catch (error) {
        console.error('Error in agent loop:', error);
      }
    }, 60000); // Check every minute
  }

  async discoverProspects() {
    console.log('🔍 Discovering prospects...');
    
    try {
      const knowledgeBase = new KnowledgeBase();
      const analyzer = new SmartBusinessAnalyzer();
      
      // Analyze target website to understand industry
      const analysis = await analyzer.analyzeTargetBusiness(this.config.targetWebsite, this.config.campaignGoal);
      
      // Generate prospect keywords based on industry
      const prospectKeywords = this.generateProspectKeywords(analysis);
      
      // Search for prospects (mock implementation for now)
      const mockProspects = await this.generateMockProspects(analysis);
      
      // Save prospects to knowledge base
      for (const prospect of mockProspects) {
        await knowledgeBase.addProspect(prospect);
      }
      
      this.prospects = mockProspects;
      console.log(`✅ Found ${mockProspects.length} prospects`);
      
      // Add prospects to email queue
      await this.queueEmailsForProspects();
      
    } catch (error) {
      console.error('Error discovering prospects:', error);
    }
  }

  generateProspectKeywords(analysis) {
    const industry = analysis.industry || 'business';
    const keywords = [];
    
    // Generate keywords based on industry and campaign goal
    if (industry.includes('ai') || industry.includes('tech')) {
      keywords.push('ai', 'technology', 'software', 'startup', 'innovation');
    }
    
    if (this.config.campaignGoal.includes('partnership')) {
      keywords.push('partnership', 'collaboration', 'business development');
    }
    
    if (this.config.campaignGoal.includes('sales')) {
      keywords.push('sales', 'customer', 'client', 'business');
    }
    
    return keywords;
  }

  async generateMockProspects(analysis) {
    // Generate realistic prospects based on the target website's industry
    const industryType = analysis.industry || 'technology';
    
    const prospects = [
      {
        email: 'contact@techstartup.com',
        company: 'Tech Startup Inc',
        industry: industryType,
        status: 'new',
        business_size: 'small',
        potential_interest: 'high',
        source: 'industry_research'
      },
      {
        email: 'partnerships@innovativecorp.com',
        company: 'Innovative Corp',
        industry: industryType,
        status: 'new',
        business_size: 'medium',
        potential_interest: 'medium',
        source: 'competitor_analysis'
      },
      {
        email: 'business@growth-company.com',
        company: 'Growth Company LLC',
        industry: industryType,
        status: 'new',
        business_size: 'large',
        potential_interest: 'high',
        source: 'market_research'
      }
    ];
    
    return prospects;
  }

  async queueEmailsForProspects() {
    console.log('📧 Queuing emails for prospects...');
    
    for (const prospect of this.prospects) {
      const emailContent = await this.generatePersonalizedEmail(prospect);
      
      this.emailQueue.push({
        prospect,
        subject: emailContent.subject,
        content: emailContent.content,
        scheduled: new Date(Date.now() + Math.random() * 3600000), // Random delay up to 1 hour
        status: 'queued'
      });
    }
    
    console.log(`✅ Queued ${this.emailQueue.length} emails`);
  }

  async generatePersonalizedEmail(prospect) {
    const companyName = this.config.senderInfo?.companyName || 'Our Company';
    const campaignGoal = this.config.campaignGoal;
    
    let subject, content;
    
    if (campaignGoal === 'partnership' || campaignGoal.includes('partnership')) {
      subject = `🤝 Partnership Opportunity - ${companyName}`;
      content = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Dear ${prospect.company} Team,</p>
          
          <p>I hope this email finds you well. I'm reaching out from <strong>${companyName}</strong> regarding a potential partnership opportunity that could benefit both our organizations.</p>
          
          <p>We've been impressed by ${prospect.company}'s work in the ${prospect.industry} industry, and we believe there's great synergy between our companies.</p>
          
          <p><strong>What we offer:</strong></p>
          <ul>
            <li>Innovative AI-powered solutions</li>
            <li>Proven track record in technology</li>
            <li>Flexible partnership models</li>
          </ul>
          
          <p>Would you be interested in a brief 15-minute call to explore how we might collaborate?</p>
          
          <p>Best regards,<br/>
          ${this.config.smtpConfig.senderName || companyName}<br/>
          ${this.config.smtpConfig.username}</p>
        </div>
      `;
    } else if (campaignGoal.includes('sales') || campaignGoal.includes('product')) {
      subject = `🚀 Innovative Solution for ${prospect.company}`;
      content = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hi ${prospect.company} Team,</p>
          
          <p>I came across ${prospect.company} and was impressed by your work in ${prospect.industry}.</p>
          
          <p>At <strong>${companyName}</strong>, we've developed cutting-edge solutions that have helped companies like yours:</p>
          
          <ul>
            <li>Increase efficiency by 40%</li>
            <li>Reduce operational costs</li>
            <li>Improve customer satisfaction</li>
          </ul>
          
          <p>I'd love to show you how our solution could benefit ${prospect.company}. Are you available for a quick demo this week?</p>
          
          <p>Best regards,<br/>
          ${this.config.smtpConfig.senderName || companyName}<br/>
          ${this.config.smtpConfig.username}</p>
        </div>
      `;
    } else {
      subject = `💡 Business Opportunity for ${prospect.company}`;
      content = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Hello ${prospect.company} Team,</p>
          
          <p>I hope you're doing well. I'm reaching out from <strong>${companyName}</strong> with an exciting business opportunity.</p>
          
          <p>We've been following ${prospect.company}'s success in the ${prospect.industry} space and believe there's potential for collaboration.</p>
          
          <p>Would you be open to a brief conversation to explore mutual opportunities?</p>
          
          <p>Looking forward to hearing from you.</p>
          
          <p>Best regards,<br/>
          ${this.config.smtpConfig.senderName || companyName}<br/>
          ${this.config.smtpConfig.username}</p>
        </div>
      `;
    }
    
    return { subject, content };
  }

  async processEmailQueue() {
    if (this.emailQueue.length === 0) return;
    
    const now = new Date();
    const emailsToSend = this.emailQueue.filter(email => 
      email.status === 'queued' && email.scheduled <= now
    );
    
    for (const emailItem of emailsToSend) {
      if (!this.isRunning || this.isPaused) break;
      
      try {
        await this.sendEmail(emailItem);
        emailItem.status = 'sent';
        emailItem.sentAt = new Date();
        
        // Move to sent emails
        this.sentEmails.push(emailItem);
        
        // Remove from queue
        this.emailQueue = this.emailQueue.filter(e => e !== emailItem);
        
        console.log(`✅ Email sent to ${emailItem.prospect.email}`);
        
        // Respect rate limiting
        await this.delay(10000); // 10 second delay between emails
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${emailItem.prospect.email}:`, error.message);
        emailItem.status = 'failed';
        emailItem.error = error.message;
      }
    }
  }

  async sendEmail(emailItem) {
    const mailOptions = {
      from: `${this.config.smtpConfig.senderName} <${this.config.smtpConfig.username}>`,
      to: emailItem.prospect.email,
      subject: emailItem.subject,
      html: emailItem.content
    };
    
    let result;
    
    if (this.smtpWorking && this.transporter) {
      // Send real email
      result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Real email sent to ${emailItem.prospect.email}`);
    } else {
      // Simulate email sending
      result = {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        response: 'Email simulated - SMTP not configured'
      };
      console.log(`📧 Simulated email to ${emailItem.prospect.email}`);
      console.log(`   Subject: ${emailItem.subject}`);
    }
    
    // Update prospect status in knowledge base
    const knowledgeBase = new KnowledgeBase();
    await knowledgeBase.updateProspect(emailItem.prospect.id, {
      status: 'contacted',
      last_contact: new Date().toISOString(),
      emails_sent: (emailItem.prospect.emails_sent || 0) + 1
    });
    
    return result;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      totalEmailsSent: this.sentEmails.length,
      repliesReceived: 0, // Will implement email monitoring later
      activeClients: this.prospects.length,
      conversionRate: 0, // Will calculate based on responses
      avgResponseTime: 0,
      queuedEmails: this.emailQueue.filter(e => e.status === 'queued').length,
      failedEmails: this.emailQueue.filter(e => e.status === 'failed').length
    };
  }

  getCurrentTask() {
    if (!this.isRunning) return null;
    if (this.isPaused) return 'Agent paused by user';
    
    const queuedCount = this.emailQueue.filter(e => e.status === 'queued').length;
    const mode = this.smtpWorking ? 'Sending' : 'Simulating';
    
    if (queuedCount > 0) {
      return `${mode} emails... (${queuedCount} in queue)`;
    } else if (this.prospects.length === 0) {
      return 'Searching for prospects...';
    } else {
      return `${mode} complete - monitoring for responses...`;
    }
  }
}

module.exports = EmailAgent;