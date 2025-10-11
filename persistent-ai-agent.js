const axios = require('axios');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class PersistentAIAgent {
  constructor() {
    this.isRunning = false;
    this.config = {
      targetWebsite: null,
      goal: null,
      emailInterval: 30 * 60 * 1000, // 30 minutes between email cycles
      prospectInterval: 60 * 60 * 1000, // 1 hour between prospect searches
      maxEmailsPerCycle: 3,
      maxEmailsPerDay: 20
    };
    
    this.knowledgeBase = {
      prospects: [],
      emailHistory: [],
      learnings: [],
      businessAnalysis: {},
      successMetrics: {}
    };
    
    this.stats = {
      emailsSent: 0,
      prospectsFound: 0,
      successRate: 0,
      startTime: null
    };

    this.knowledgeBasePath = '/Users/James/Desktop/agent/data/knowledge_base.json';
    this.logPath = '/Users/James/Desktop/agent/data/agent_log.txt';
    
    this.setupDirectories();
    this.loadKnowledgeBase();
  }

  async setupDirectories() {
    try {
      await fs.mkdir('/Users/James/Desktop/agent/data', { recursive: true });
      this.log('📁 Data directory created');
    } catch (error) {
      // Directory already exists
    }
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    try {
      await fs.appendFile(this.logPath, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  async loadKnowledgeBase() {
    try {
      const data = await fs.readFile(this.knowledgeBasePath, 'utf8');
      this.knowledgeBase = { ...this.knowledgeBase, ...JSON.parse(data) };
      this.log('📚 Knowledge base loaded successfully');
    } catch (error) {
      this.log('📚 Creating new knowledge base');
      await this.saveKnowledgeBase();
    }
  }

  async saveKnowledgeBase() {
    try {
      await fs.writeFile(this.knowledgeBasePath, JSON.stringify(this.knowledgeBase, null, 2));
      this.log('💾 Knowledge base saved');
    } catch (error) {
      this.log(`❌ Failed to save knowledge base: ${error.message}`);
    }
  }

  async startAgent(targetWebsite, goal) {
    if (this.isRunning) {
      this.log('⚠️ Agent is already running');
      return { success: false, message: 'Agent already running' };
    }

    this.config.targetWebsite = targetWebsite;
    this.config.goal = goal;
    this.isRunning = true;
    this.stats.startTime = new Date();

    this.log('🚀 PERSISTENT AI AGENT STARTING');
    this.log(`🎯 Target Website: ${targetWebsite}`);
    this.log(`📋 Goal: ${goal}`);
    this.log('='.repeat(60));

    // Initial analysis
    await this.performInitialAnalysis();
    
    // Start continuous operation
    this.startContinuousOperation();
    
    return { 
      success: true, 
      message: 'Agent started successfully',
      config: this.config,
      pid: process.pid
    };
  }

  async performInitialAnalysis() {
    this.log('\n📌 PERFORMING INITIAL ANALYSIS');
    
    try {
      // Deep website analysis
      const businessAnalysis = await this.analyzeWebsiteDeep(this.config.targetWebsite);
      this.knowledgeBase.businessAnalysis = businessAnalysis;
      
      this.log(`✅ Business Analysis Complete:`);
      this.log(`   Company: ${businessAnalysis.companyName}`);
      this.log(`   Industry: ${businessAnalysis.industry}`);
      this.log(`   Products: ${businessAnalysis.products.join(', ')}`);
      
      // Save learning
      this.knowledgeBase.learnings.push({
        type: 'business_analysis',
        timestamp: new Date().toISOString(),
        data: businessAnalysis,
        source: 'initial_website_scraping'
      });
      
      await this.saveKnowledgeBase();
      
    } catch (error) {
      this.log(`❌ Initial analysis failed: ${error.message}`);
    }
  }

  async analyzeWebsiteDeep(url) {
    this.log(`🔍 Deep website analysis: ${url}`);
    
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const extractedData = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        headings: [],
        content: '',
        links: [],
        contactInfo: []
      };

      // Extract all content
      $('h1, h2, h3, h4').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) extractedData.headings.push(text);
      });

      extractedData.content = $('body').text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 2000);

      // Extract potential contact info
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const phoneRegex = /[\(\d\s\)-]{10,}/g;
      
      const emails = extractedData.content.match(emailRegex) || [];
      const phones = extractedData.content.match(phoneRegex) || [];
      
      extractedData.contactInfo = [...emails, ...phones];

      // AI analysis with knowledge base context
      return await this.aiAnalyzeWithContext(extractedData, url);
      
    } catch (error) {
      this.log(`⚠️ Website scraping failed: ${error.message}`);
      return this.generateFallbackAnalysis(url);
    }
  }

  async aiAnalyzeWithContext(extractedData, url) {
    const prompt = `<|im_start|>system
You are a business intelligence expert. Analyze website content and provide detailed business analysis. Use previous knowledge if available.
<|im_end|>

<|im_start|>user
Analyze this website for business intelligence:

URL: ${url}
Title: ${extractedData.title}
Description: ${extractedData.description}
Content: ${extractedData.content}
Headings: ${extractedData.headings.join(', ')}

Previous Knowledge: ${JSON.stringify(this.knowledgeBase.learnings.slice(-3))}

Return detailed JSON analysis:
{
  "companyName": "exact name from content",
  "industry": "specific industry",
  "products": ["specific products/services"],
  "targetMarket": "target customers",
  "valueProposition": "unique value",
  "businessModel": "B2B/B2C/both",
  "keyFeatures": ["main features"],
  "competitiveAdvantages": ["advantages"],
  "potentialPartners": ["ideal partner types"],
  "marketingChannels": ["likely channels"],
  "businessSize": "size estimate"
}
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
          repeat_penalty: 1.1,
          stop: ['<|im_end|>']
        }
      }, { timeout: 60000 });

      const analysis = JSON.parse(response.data.response);
      this.log('✅ AI analysis successful');
      return analysis;
      
    } catch (error) {
      this.log('⚠️ AI analysis failed, using enhanced defaults');
      return this.generateFallbackAnalysis(url);
    }
  }

  startContinuousOperation() {
    this.log('\n🔄 STARTING CONTINUOUS OPERATION');
    
    // Prospect discovery cycle
    this.prospectTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.findNewProspects();
      }
    }, this.config.prospectInterval);
    
    // Email sending cycle
    this.emailTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.sendEmailCycle();
      }
    }, this.config.emailInterval);
    
    // Knowledge base backup cycle (every 10 minutes)
    this.backupTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.saveKnowledgeBase();
      }
    }, 10 * 60 * 1000);
    
    this.log('✅ Continuous operation timers started');
    this.log(`📊 Prospect search: every ${this.config.prospectInterval / 60000} minutes`);
    this.log(`📧 Email cycles: every ${this.config.emailInterval / 60000} minutes`);
  }

  async findNewProspects() {
    this.log('\n🔍 FINDING NEW PROSPECTS');
    
    try {
      // Generate AI-powered search strategies
      const searchStrategies = await this.generateSearchStrategies();
      
      for (const query of searchStrategies.slice(0, 3)) {
        this.log(`   🔎 Searching: "${query}"`);
        
        try {
          const prospects = await this.searchProspects(query);
          
          for (const prospect of prospects) {
            // Check if prospect already exists
            const exists = this.knowledgeBase.prospects.find(p => 
              p.company === prospect.company || p.website === prospect.website
            );
            
            if (!exists) {
              // Analyze prospect with AI
              const analysis = await this.analyzeProspectWithAI(prospect);
              
              if (analysis.isQualified) {
                prospect.aiAnalysis = analysis;
                prospect.addedAt = new Date().toISOString();
                prospect.status = 'discovered';
                
                this.knowledgeBase.prospects.push(prospect);
                this.stats.prospectsFound++;
                
                this.log(`   ✅ New qualified prospect: ${prospect.company} (Score: ${analysis.score})`);
                
                // Save learning
                this.knowledgeBase.learnings.push({
                  type: 'prospect_discovery',
                  timestamp: new Date().toISOString(),
                  data: prospect,
                  source: 'google_search',
                  query: query
                });
              }
            }
          }
        } catch (searchError) {
          this.log(`   ⚠️ Search failed: ${searchError.message}`);
        }
      }
      
      await this.saveKnowledgeBase();
      this.log(`📊 Total prospects in knowledge base: ${this.knowledgeBase.prospects.length}`);
      
    } catch (error) {
      this.log(`❌ Prospect discovery failed: ${error.message}`);
    }
  }

  async generateSearchStrategies() {
    const prompt = `<|im_start|>system
You are a B2B lead generation expert. Generate targeted search queries based on business analysis and previous learnings.
<|im_end|>

<|im_start|>user
Generate search strategies for:

Business: ${JSON.stringify(this.knowledgeBase.businessAnalysis)}
Goal: ${this.config.goal}
Previous successful searches: ${JSON.stringify(this.knowledgeBase.learnings
  .filter(l => l.type === 'prospect_discovery')
  .slice(-5)
  .map(l => l.query))}

Generate 5 targeted search queries for finding potential customers.
Return as JSON array: ["query1", "query2", "query3", "query4", "query5"]
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.4,
          top_p: 0.8,
          stop: ['<|im_end|>']
        }
      }, { timeout: 30000 });

      return JSON.parse(response.data.response);
      
    } catch (error) {
      // Fallback strategies
      return [
        `${this.knowledgeBase.businessAnalysis.industry} companies contact`,
        `${this.knowledgeBase.businessAnalysis.products?.[0]} customers email`,
        `${this.config.goal} ${this.knowledgeBase.businessAnalysis.industry}`,
        `businesses need ${this.knowledgeBase.businessAnalysis.products?.[0]}`,
        `${this.knowledgeBase.businessAnalysis.targetMarket} directory`
      ];
    }
  }

  async searchProspects(query) {
    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: 'AIzaSyCFE922xC7dFh5xLzQhK7fxUWNVuHYmEpU',
          cx: '53880567acf744d97',
          q: query,
          num: 5
        },
        timeout: 10000
      });

      return response.data.items?.map(item => ({
        title: item.title,
        company: this.extractCompanyName(item.title),
        website: item.link,
        description: item.snippet,
        searchQuery: query
      })) || [];
      
    } catch (error) {
      throw new Error(`Google Search failed: ${error.message}`);
    }
  }

  async analyzeProspectWithAI(prospect) {
    const prompt = `<|im_start|>system
You are a B2B sales qualification expert. Analyze prospects and determine if they're qualified leads.
<|im_end|>

<|im_start|>user
Evaluate this prospect:

Prospect: ${JSON.stringify(prospect)}
Our Business: ${JSON.stringify(this.knowledgeBase.businessAnalysis)}
Goal: ${this.config.goal}

Previous successful prospects: ${JSON.stringify(this.knowledgeBase.prospects
  .filter(p => p.status === 'email_sent' || p.status === 'responded')
  .slice(-3)
  .map(p => ({ company: p.company, aiAnalysis: p.aiAnalysis })))}

Return JSON:
{
  "isQualified": true/false,
  "score": 0-100,
  "reason": "qualification reason",
  "emailStrategy": "approach strategy",
  "valueProposition": "specific value for them",
  "urgency": "low/medium/high"
}
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          stop: ['<|im_end|>']
        }
      }, { timeout: 25000 });

      return JSON.parse(response.data.response);
      
    } catch (error) {
      return {
        isQualified: true,
        score: 60,
        reason: "Basic qualification based on search context",
        emailStrategy: "partnership approach",
        valueProposition: "potential business collaboration",
        urgency: "medium"
      };
    }
  }

  async sendEmailCycle() {
    this.log('\n📧 EMAIL SENDING CYCLE');
    
    // Check daily limit
    const today = new Date().toDateString();
    const todaysSentEmails = this.knowledgeBase.emailHistory.filter(e => 
      new Date(e.sentAt).toDateString() === today
    ).length;
    
    if (todaysSentEmails >= this.config.maxEmailsPerDay) {
      this.log(`⚠️ Daily email limit reached (${this.config.maxEmailsPerDay})`);
      return;
    }
    
    // Get prospects ready for email
    const readyProspects = this.knowledgeBase.prospects
      .filter(p => p.status === 'discovered' && !p.emailSent)
      .sort((a, b) => (b.aiAnalysis?.score || 0) - (a.aiAnalysis?.score || 0))
      .slice(0, this.config.maxEmailsPerCycle);
    
    if (readyProspects.length === 0) {
      this.log('📭 No prospects ready for email');
      return;
    }
    
    this.log(`📮 Sending emails to ${readyProspects.length} prospects`);
    
    for (const prospect of readyProspects) {
      try {
        await this.sendPersonalizedEmail(prospect);
        prospect.status = 'email_sent';
        prospect.emailSent = true;
        prospect.emailSentAt = new Date().toISOString();
        
        this.stats.emailsSent++;
        
        // Wait between emails
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        this.log(`❌ Email failed for ${prospect.company}: ${error.message}`);
        prospect.status = 'email_failed';
        prospect.emailError = error.message;
      }
    }
    
    await this.saveKnowledgeBase();
  }

  async sendPersonalizedEmail(prospect) {
    this.log(`   📧 Generating email for ${prospect.company}...`);
    
    // Generate highly personalized email using knowledge base
    const emailContent = await this.generatePersonalizedEmailWithKnowledge(prospect);
    
    // Setup email transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'luzgool001@gmail.com',
        pass: 'rksj xojs zqbs fnsg'
      }
    });

    // Find best email address
    const emailAddress = await this.findBestEmailAddress(prospect);
    
    if (!emailAddress) {
      throw new Error('No valid email address found');
    }

    const mailOptions = {
      from: `"${this.knowledgeBase.businessAnalysis.companyName} Team" <luzgool001@gmail.com>`,
      to: emailAddress,
      subject: emailContent.subject,
      html: this.formatEmailHTML(emailContent.body, prospect, emailContent)
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Record email in history and knowledge base
    const emailRecord = {
      prospectId: prospect.company,
      recipient: emailAddress,
      subject: emailContent.subject,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      personalizationScore: emailContent.personalizationScore,
      aiGenerated: emailContent.aiGenerated,
      campaign: this.config.goal
    };
    
    this.knowledgeBase.emailHistory.push(emailRecord);
    
    // Save learning
    this.knowledgeBase.learnings.push({
      type: 'email_sent',
      timestamp: new Date().toISOString(),
      data: emailRecord,
      source: 'automated_campaign'
    });
    
    this.log(`   ✅ Email sent: ${info.messageId} (Score: ${emailContent.personalizationScore}%)`);
    
    return emailRecord;
  }

  async generatePersonalizedEmailWithKnowledge(prospect) {
    // Get similar successful emails from knowledge base
    const similarEmails = this.knowledgeBase.emailHistory
      .filter(e => e.personalizationScore > 80)
      .slice(-3);

    const prompt = `<|im_start|>system
You are an expert B2B email copywriter. Create highly personalized emails using knowledge base insights and successful patterns.
<|im_end|>

<|im_start|>user
Create a personalized email using all available intelligence:

OUR BUSINESS: ${JSON.stringify(this.knowledgeBase.businessAnalysis)}
CAMPAIGN GOAL: ${this.config.goal}

TARGET PROSPECT: ${JSON.stringify(prospect)}
AI ANALYSIS: ${JSON.stringify(prospect.aiAnalysis)}

KNOWLEDGE BASE INSIGHTS:
- Similar successful emails: ${JSON.stringify(similarEmails)}
- Previous learnings: ${JSON.stringify(this.knowledgeBase.learnings.slice(-5))}

REQUIREMENTS:
1. 120-180 words
2. Reference specific business needs
3. Use knowledge base insights
4. Professional, consultative tone
5. Clear value proposition
6. Soft call-to-action

Write only the email body, starting with personalized greeting.
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1,
          stop: ['<|im_end|>', 'Subject:', '---']
        }
      }, { timeout: 40000 });

      const body = response.data.response.trim();
      
      return {
        body: body,
        subject: this.generateSubject(prospect),
        personalizationScore: this.calculatePersonalizationScore(body, prospect),
        aiGenerated: true,
        knowledgeBased: true
      };
      
    } catch (error) {
      this.log(`   ⚠️ AI email generation failed, using enhanced template`);
      return this.generateEnhancedTemplate(prospect);
    }
  }

  generateSubject(prospect) {
    const templates = [
      `${this.config.goal} - ${prospect.company} Partnership`,
      `Collaboration Opportunity - ${prospect.company}`,
      `${this.knowledgeBase.businessAnalysis.companyName} x ${prospect.company}`,
      `Quick Question About ${prospect.company}'s Growth`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async findBestEmailAddress(prospect) {
    // Try to extract email from website
    if (prospect.website) {
      try {
        const emails = await this.extractEmailsFromWebsite(prospect.website);
        if (emails.length > 0) {
          return this.selectBestEmail(emails);
        }
      } catch (error) {
        this.log(`   ⚠️ Email extraction failed: ${error.message}`);
      }
    }

    // Generate likely email addresses
    if (prospect.website) {
      const domain = new URL(prospect.website).hostname;
      const likelyEmails = [
        `info@${domain}`,
        `contact@${domain}`,
        `sales@${domain}`,
        `hello@${domain}`
      ];
      
      return likelyEmails[0];
    }

    return null;
  }

  async extractEmailsFromWebsite(url) {
    try {
      const response = await axios.get(url + '/contact', {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmailBot/1.0)' }
      });

      const emails = response.data.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
      return emails.filter(email => 
        !email.includes('example') && 
        !email.includes('noreply')
      );
    } catch (error) {
      return [];
    }
  }

  selectBestEmail(emails) {
    const priorities = ['info@', 'contact@', 'sales@', 'hello@', 'support@'];
    
    for (const priority of priorities) {
      const found = emails.find(email => email.includes(priority));
      if (found) return found;
    }
    
    return emails[0];
  }

  formatEmailHTML(body, prospect, emailContent) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6;">
        ${body.split('\n').filter(p => p.trim()).map(paragraph => 
          `<p style="margin-bottom: 12px;">${paragraph}</p>`
        ).join('')}
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-left: 4px solid #007bff;">
          <h4 style="color: #007bff; margin-top: 0;">About ${this.knowledgeBase.businessAnalysis.companyName}</h4>
          <p style="margin-bottom: 8px;">🎯 ${this.knowledgeBase.businessAnalysis.valueProposition}</p>
          <p style="margin-bottom: 8px;">🏢 Industry: ${this.knowledgeBase.businessAnalysis.industry}</p>
          <p style="margin-bottom: 0;">🤝 ${this.knowledgeBase.businessAnalysis.businessModel}</p>
        </div>
        
        <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 11px; color: #666; text-align: center;">
          <strong>Campaign:</strong> Persistent AI Agent<br>
          <strong>Personalization:</strong> ${emailContent.personalizationScore}%<br>
          <strong>Knowledge-Based:</strong> ${emailContent.knowledgeBased ? 'Yes' : 'No'}<br>
          <strong>Sent:</strong> ${new Date().toLocaleString()}
        </p>
      </div>
    `;
  }

  calculatePersonalizationScore(body, prospect) {
    let score = 50;
    
    if (body.toLowerCase().includes(prospect.company.toLowerCase())) score += 20;
    if (body.includes('your business') || body.includes('your company')) score += 10;
    if (body.length > 300) score += 10;
    if (prospect.aiAnalysis?.valueProposition && body.includes('value')) score += 10;
    
    return Math.min(score, 100);
  }

  generateEnhancedTemplate(prospect) {
    const body = `Dear ${prospect.company} Team,

I hope this message finds you well. I'm reaching out from ${this.knowledgeBase.businessAnalysis.companyName}, where we specialize in ${this.knowledgeBase.businessAnalysis.products?.join(', ') || 'business solutions'}.

${prospect.aiAnalysis?.reason || 'I came across your company and believe there could be valuable synergies between our services.'}

Our goal is ${this.config.goal}, and I think ${prospect.company} could benefit from our ${this.knowledgeBase.businessAnalysis.valueProposition || 'innovative approach'}.

${prospect.aiAnalysis?.valueProposition || 'We could help enhance your business operations and growth.'}

Would you be interested in a brief conversation to explore potential collaboration opportunities?

Best regards,
${this.knowledgeBase.businessAnalysis.companyName} Team`;

    return {
      body: body,
      subject: this.generateSubject(prospect),
      personalizationScore: 70,
      aiGenerated: false,
      knowledgeBased: true
    };
  }

  async stopAgent() {
    if (!this.isRunning) {
      return { success: false, message: 'Agent not running' };
    }

    this.isRunning = false;
    
    // Clear all timers
    if (this.prospectTimer) clearInterval(this.prospectTimer);
    if (this.emailTimer) clearInterval(this.emailTimer);
    if (this.backupTimer) clearInterval(this.backupTimer);
    
    // Final save
    await this.saveKnowledgeBase();
    
    this.log('\n⏹️ PERSISTENT AI AGENT STOPPED');
    this.log(`📊 Final Statistics:`);
    this.log(`   Runtime: ${Math.round((Date.now() - this.stats.startTime) / 60000)} minutes`);
    this.log(`   Prospects Found: ${this.stats.prospectsFound}`);
    this.log(`   Emails Sent: ${this.stats.emailsSent}`);
    this.log(`   Knowledge Base Entries: ${this.knowledgeBase.learnings.length}`);
    
    return { 
      success: true, 
      message: 'Agent stopped successfully',
      stats: this.stats,
      knowledgeBaseSize: this.knowledgeBase.learnings.length
    };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: {
        ...this.stats,
        runtime: this.stats.startTime ? Math.round((Date.now() - this.stats.startTime) / 60000) : 0,
        prospectsInKB: this.knowledgeBase.prospects.length,
        emailsInHistory: this.knowledgeBase.emailHistory.length,
        learningsCount: this.knowledgeBase.learnings.length
      },
      recentActivity: this.knowledgeBase.learnings.slice(-5),
      upcomingEmails: this.knowledgeBase.prospects.filter(p => p.status === 'discovered').length
    };
  }

  // Utility methods
  extractCompanyName(title) {
    return title.split(' - ')[0].split(' | ')[0].split(' :: ')[0].trim();
  }

  generateFallbackAnalysis(url) {
    const domain = new URL(url).hostname.replace('www.', '');
    return {
      companyName: domain.split('.')[0],
      industry: 'Business Services',
      products: ['Products', 'Services'],
      targetMarket: 'Business customers',
      valueProposition: 'Quality solutions',
      businessModel: 'B2B',
      keyFeatures: ['Quality', 'Service', 'Innovation']
    };
  }
}

// Global agent instance
let globalAgent = null;

// Command line interface
async function handleCommand(command, ...args) {
  switch (command) {
    case 'start':
      const [website, goal] = args;
      if (!website || !goal) {
        console.log('Usage: node persistent-ai-agent.js start <website> <goal>');
        return;
      }
      
      if (!globalAgent) {
        globalAgent = new PersistentAIAgent();
      }
      
      const result = await globalAgent.startAgent(website, goal);
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'stop':
      if (!globalAgent) {
        console.log('No agent running');
        return;
      }
      
      const stopResult = await globalAgent.stopAgent();
      console.log(JSON.stringify(stopResult, null, 2));
      process.exit(0);
      break;
      
    case 'status':
      if (!globalAgent) {
        console.log('No agent initialized');
        return;
      }
      
      const status = globalAgent.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'monitor':
      if (!globalAgent) {
        console.log('No agent running');
        return;
      }
      
      console.log('📊 MONITORING MODE - Press Ctrl+C to exit');
      setInterval(() => {
        const status = globalAgent.getStatus();
        console.clear();
        console.log('🤖 PERSISTENT AI AGENT MONITOR');
        console.log('='.repeat(50));
        console.log(`Status: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}`);
        console.log(`Runtime: ${status.stats.runtime} minutes`);
        console.log(`Prospects Found: ${status.stats.prospectsFound}`);
        console.log(`Emails Sent: ${status.stats.emailsSent}`);
        console.log(`Knowledge Base: ${status.stats.learningsCount} entries`);
        console.log(`Pending Emails: ${status.upcomingEmails}`);
        console.log('\nRecent Activity:');
        status.recentActivity.forEach((activity, i) => {
          console.log(`  ${i + 1}. ${activity.type} - ${new Date(activity.timestamp).toLocaleTimeString()}`);
        });
        console.log(`\nLast Update: ${new Date().toLocaleTimeString()}`);
      }, 5000);
      break;
      
    default:
      console.log(`
🤖 Persistent AI Agent Commands:

start <website> <goal>    - Start the agent
stop                      - Stop the agent
status                    - Get current status
monitor                   - Monitor agent in real-time

Examples:
  node persistent-ai-agent.js start "https://petpoofficial.org" "promote custom pet portrait services"
  node persistent-ai-agent.js status
  node persistent-ai-agent.js monitor
  node persistent-ai-agent.js stop
      `);
  }
}

// Handle command line arguments
if (require.main === module) {
  const [,, command, ...args] = process.argv;
  
  if (command) {
    handleCommand(command, ...args);
  } else {
    handleCommand('help');
  }
  
  // Keep process alive for 'start' command
  if (command === 'start') {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Graceful shutdown initiated...');
      if (globalAgent) {
        await globalAgent.stopAgent();
      }
      process.exit(0);
    });
  }
}

module.exports = PersistentAIAgent;