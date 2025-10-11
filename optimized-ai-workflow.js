const axios = require('axios');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');

class OptimizedAIWorkflow {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.googleApiKey = 'AIzaSyCFE922xC7dFh5xLzQhK7fxUWNVuHYmEpU';
    this.searchEngineId = '53880567acf744d97';
  }

  // Enhanced website analysis with deep content scraping
  async analyzeWebsiteThoroughly(url) {
    console.log(`🔍 ENHANCED WEBSITE ANALYSIS: ${url}`);
    console.log('   📖 Scraping website content thoroughly...');
    
    try {
      // Fetch main page with proper headers
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract comprehensive content
      const analysis = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        headings: [],
        bodyText: '',
        links: [],
        images: []
      };

      // Extract all headings
      $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text) analysis.headings.push(text);
      });

      // Extract main content
      const contentSelectors = ['main', '.content', '.main-content', '#content', 'article', '.container'];
      let mainContent = '';
      
      for (const selector of contentSelectors) {
        const content = $(selector).text();
        if (content && content.length > mainContent.length) {
          mainContent = content;
        }
      }
      
      if (!mainContent) {
        mainContent = $('body').text();
      }
      
      // Clean and limit text
      analysis.bodyText = mainContent
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?-]/g, '')
        .trim()
        .substring(0, 2000);

      // Extract navigation links
      $('nav a, .menu a, .navigation a').each((i, elem) => {
        const linkText = $(elem).text().trim();
        const href = $(elem).attr('href');
        if (linkText && href) {
          analysis.links.push({ text: linkText, href });
        }
      });

      console.log('   ✅ Content extracted successfully');
      console.log(`      Title: ${analysis.title}`);
      console.log(`      Headings: ${analysis.headings.length}`);
      console.log(`      Content length: ${analysis.bodyText.length} chars`);

      // Use AI to analyze the scraped content
      return await this.aiAnalyzeScrapedContent(analysis, url);

    } catch (error) {
      console.log('   ⚠️ Scraping failed, using AI with URL only');
      return await this.aiAnalyzeUrlOnly(url);
    }
  }

  // AI analysis of scraped content
  async aiAnalyzeScrapedContent(scrapedData, url) {
    console.log('   🤖 AI analyzing scraped content...');
    
    const prompt = `<|im_start|>system
You are a business analyst expert. Analyze website content and provide precise business intelligence in JSON format. Be factual and specific based only on the provided content.
<|im_end|>

<|im_start|>user
Analyze this website content for business intelligence:

URL: ${url}
Title: ${scrapedData.title}
Description: ${scrapedData.description}
Key headings: ${scrapedData.headings.slice(0, 10).join(', ')}
Content sample: ${scrapedData.bodyText.substring(0, 800)}...

Extract ONLY factual information from the content provided. Return a JSON object with these exact fields:

{
  "companyName": "exact company name found in title/content",
  "industry": "specific industry based on products/services mentioned", 
  "products": ["list specific products/services found in content"],
  "targetMarket": "specific customer types mentioned in content",
  "valueProposition": "main benefit/value stated in content",
  "businessModel": "B2B/B2C/marketplace - infer from content",
  "keyFeatures": ["specific features/benefits mentioned"],
  "companySize": "startup/small/medium/large - infer from content tone and scale"
}

Requirements:
1. Use ONLY information found in the provided content
2. Do not make assumptions beyond what's stated
3. Return valid JSON only, no additional text
4. Be specific and accurate, avoid generic terms
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.1,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_ctx: 2048,
          stop: ['<|im_end|>', '\n\n\n']
        }
      }, { timeout: 60000 });

      try {
        const analysis = JSON.parse(response.data.response);
        console.log('   ✅ AI analysis complete');
        return analysis;
      } catch (parseError) {
        throw new Error('JSON parsing failed');
      }
    } catch (error) {
      console.log('   ⚠️ AI analysis failed, using intelligent defaults');
      return this.generateIntelligentDefaults(scrapedData, url);
    }
  }

  // Fallback AI analysis for URL only
  async aiAnalyzeUrlOnly(url) {
    console.log('   🤖 AI analyzing URL structure...');
    
    const prompt = `Analyze this business URL: ${url}

Based on the domain name and any visible patterns, provide intelligent business analysis:
{
  "companyName": "likely company name",
  "industry": "probable industry",
  "products": ["likely products/services"],
  "targetMarket": "probable target customers",
  "valueProposition": "estimated value prop",
  "businessModel": "likely model",
  "keyFeatures": ["probable features"],
  "companySize": "estimated size"
}`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.3 }
      }, { timeout: 30000 });

      return JSON.parse(response.data.response);
    } catch (error) {
      return this.generateBasicDefaults(url);
    }
  }

  // Generate intelligent defaults from scraped data
  generateIntelligentDefaults(scrapedData, url) {
    const domain = new URL(url).hostname.replace('www.', '');
    const companyName = scrapedData.title.split(' - ')[0] || 
                       scrapedData.title.split(' | ')[0] || 
                       domain.split('.')[0];

    return {
      companyName: companyName,
      industry: this.guessIndustryFromContent(scrapedData.bodyText + ' ' + scrapedData.headings.join(' ')),
      products: this.extractProductsFromContent(scrapedData.bodyText, scrapedData.headings),
      targetMarket: "Business customers and consumers",
      valueProposition: scrapedData.description || "Quality products and services",
      businessModel: "B2B/B2C",
      keyFeatures: scrapedData.headings.slice(0, 5),
      companySize: "Small to medium business"
    };
  }

  // Improved prospect discovery with multiple sources
  async findHighQualityProspects(businessAnalysis, goal, limit = 5) {
    console.log('🎯 ENHANCED PROSPECT DISCOVERY');
    console.log(`   Goal: ${goal}`);
    console.log(`   Target industry connections for: ${businessAnalysis.industry}`);
    
    const prospects = [];
    
    // Generate better search queries based on goal
    const searchQueries = await this.generateTargetedSearchQueries(businessAnalysis, goal);
    
    // Search with multiple strategies
    for (const query of searchQueries.slice(0, 3)) {
      console.log(`   🔍 Searching: "${query}"`);
      
      try {
        const searchResults = await this.searchWithGoogleAPI(query);
        const processedProspects = await this.processSearchResults(searchResults, businessAnalysis, goal);
        prospects.push(...processedProspects);
        
        console.log(`      ✅ Found ${processedProspects.length} qualified prospects`);
      } catch (error) {
        console.log(`      ⚠️ Search failed: ${error.message}`);
      }
    }

    // Add high-quality known prospects based on industry
    const industryProspects = await this.getIndustrySpecificProspects(businessAnalysis.industry);
    prospects.push(...industryProspects);

    // Deduplicate and score prospects
    const uniqueProspects = this.deduplicateAndScore(prospects, businessAnalysis, goal);
    
    console.log(`   ✅ Total qualified prospects: ${uniqueProspects.length}`);
    return uniqueProspects.slice(0, limit);
  }

  // Generate targeted search queries based on business analysis and goal
  async generateTargetedSearchQueries(businessAnalysis, goal) {
    const prompt = `<|im_start|>system
You are a B2B marketing expert specializing in lead generation search strategies. Create highly targeted search queries that will find real potential customers with contact information.
<|im_end|>

<|im_start|>user
Create specific Google search queries to find potential B2B customers for:

Company: ${businessAnalysis.companyName}
Industry: ${businessAnalysis.industry}
Products/Services: ${businessAnalysis.products.join(', ')}
Campaign Goal: ${goal}
Target Market: ${businessAnalysis.targetMarket}

Requirements for search queries:
1. Each query should find businesses likely to need these products/services
2. Include terms that lead to contact information (email, phone)
3. Focus on decision makers and business contacts
4. Target relevant industry keywords
5. Include location qualifiers if helpful

Generate exactly 5 search queries optimized for finding business contacts with email addresses.

Return only a JSON array in this exact format:
["search query 1 with contact terms", "search query 2 with contact terms", "search query 3 with contact terms", "search query 4 with contact terms", "search query 5 with contact terms"]

Example: ["pet store owners contact email", "veterinary clinic purchasing managers email", "pet grooming business wholesale suppliers contact"]
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.3,
          top_p: 0.8,
          repeat_penalty: 1.1,
          num_ctx: 1024,
          stop: ['<|im_end|>']
        }
      }, { timeout: 30000 });

      const queries = JSON.parse(response.data.response);
      return Array.isArray(queries) ? queries : this.getFallbackQueries(businessAnalysis, goal);
    } catch (error) {
      return this.getFallbackQueries(businessAnalysis, goal);
    }
  }

  // Enhanced search result processing
  async processSearchResults(searchResults, businessAnalysis, goal) {
    const prospects = [];
    
    for (const result of searchResults) {
      try {
        // Extract potential contact information
        const emailMatches = result.snippet.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        const phoneMatches = result.snippet.match(/[\(\d\s\)-]{10,}/g) || [];
        
        // Analyze relevance with AI
        const relevanceAnalysis = await this.analyzeProspectRelevance(result, businessAnalysis, goal);
        
        if (relevanceAnalysis.isRelevant) {
          prospects.push({
            company: this.extractCompanyName(result.title),
            website: result.link,
            description: result.snippet,
            emails: emailMatches,
            phones: phoneMatches,
            relevanceScore: relevanceAnalysis.score,
            relevanceReason: relevanceAnalysis.reason,
            searchQuery: result.query,
            aiAnalyzed: true
          });
        }
      } catch (error) {
        console.log(`      ⚠️ Failed to process result: ${error.message}`);
      }
    }
    
    return prospects;
  }

  // AI-powered prospect relevance analysis
  async analyzeProspectRelevance(searchResult, businessAnalysis, goal) {
    const prompt = `<|im_start|>system
You are a B2B sales qualification expert. Analyze search results to determine if they represent viable business prospects. Be strict in your evaluation - only qualify highly relevant prospects.
<|im_end|>

<|im_start|>user
Evaluate this search result as a potential B2B prospect:

SEARCH RESULT:
Title: ${searchResult.title}
URL: ${searchResult.link}
Description: ${searchResult.snippet}

OUR COMPANY:
Name: ${businessAnalysis.companyName}
Industry: ${businessAnalysis.industry}
Products/Services: ${businessAnalysis.products.join(', ')}
Campaign Goal: ${goal}
Target Market: ${businessAnalysis.targetMarket}

QUALIFICATION CRITERIA:
1. Is this a real business (not directory/article/blog post)?
2. Would they likely need our products/services?
3. Do they appear to be in our target market?
4. Is there a clear business case for partnership?
5. Does this align with our campaign goal?

Return ONLY this JSON format:
{
  "isRelevant": true,
  "score": 85,
  "reason": "Specific business reason why this is a qualified prospect"
}

OR

{
  "isRelevant": false,
  "score": 25,
  "reason": "Specific reason why this is not a qualified prospect"
}

Score 80-100: Excellent prospect
Score 60-79: Good prospect  
Score 40-59: Marginal prospect
Score 0-39: Poor prospect
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { temperature: 0.3 }
      }, { timeout: 15000 });

      return JSON.parse(response.data.response);
    } catch (error) {
      return {
        isRelevant: true,
        score: 60,
        reason: "Appears relevant based on search context"
      };
    }
  }

  // Enhanced email content generation with deep personalization
  async generateHighlyPersonalizedEmail(prospect, businessAnalysis, goal) {
    console.log(`   🎨 Creating personalized email for ${prospect.company}...`);
    
    // First, analyze the prospect's website for deeper insights
    let prospectInsights = {};
    try {
      if (prospect.website) {
        prospectInsights = await this.analyzeProspectWebsite(prospect.website);
        console.log(`      📊 Prospect website analyzed`);
      }
    } catch (error) {
      console.log(`      ⚠️ Could not analyze prospect website`);
    }

    const prompt = `<|im_start|>system
You are an expert B2B sales copywriter specializing in highly personalized cold outreach emails. Write emails that feel personal, research-based, and directly relevant to the recipient's business needs.
<|im_end|>

<|im_start|>user
Write a highly personalized B2B sales email:

SENDER COMPANY:
- Name: ${businessAnalysis.companyName}
- Industry: ${businessAnalysis.industry}  
- Products/Services: ${businessAnalysis.products.join(', ')}
- Value Proposition: ${businessAnalysis.valueProposition}
- Key Differentiators: ${businessAnalysis.keyFeatures?.join(', ') || 'Quality, Innovation, Service'}

TARGET PROSPECT:
- Company: ${prospect.company}
- Website: ${prospect.website || 'Not available'}
- Business Context: ${prospect.description}
- Qualification Reason: ${prospect.relevanceReason}
- Additional Insights: ${JSON.stringify(prospectInsights)}

CAMPAIGN OBJECTIVE: ${goal}

EMAIL REQUIREMENTS:
1. Length: 120-180 words (concise but thorough)
2. Tone: Professional, consultative, research-based
3. Structure: Hook → Research insight → Value proposition → Specific benefit → Soft CTA
4. Personalization: Reference their specific business/industry/challenges
5. Credibility: Mention relevant experience or similar clients
6. Call-to-Action: Soft, low-pressure (brief conversation, information sharing)

AVOID:
- Generic templates or buzzwords
- Aggressive sales language
- Multiple CTAs or complex requests
- Assumptions not based on provided data

Write ONLY the email body (no subject line). Start with a personalized greeting using their company name.
<|im_end|>

<|im_start|>assistant`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5:7b',
        prompt: prompt,
        stream: false,
        options: { 
          temperature: 0.6,
          top_p: 0.9,
          repeat_penalty: 1.15,
          num_ctx: 2048,
          stop: ['<|im_end|>', '\n---', 'Subject:']
        }
      }, { timeout: 45000 });

      const emailBody = response.data.response;
      console.log(`      ✅ Personalized email generated (${emailBody.length} chars)`);
      
      return {
        body: emailBody,
        subject: this.generateSubjectLine(prospect, businessAnalysis, goal),
        personalizationScore: this.calculatePersonalizationScore(emailBody, prospect),
        aiGenerated: true
      };
    } catch (error) {
      console.log(`      ⚠️ AI generation failed, using enhanced template`);
      return this.generateEnhancedTemplate(prospect, businessAnalysis, goal);
    }
  }

  // Analyze prospect's website for insights
  async analyzeProspectWebsite(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BusinessBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      return {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        mainHeadings: $('h1, h2').map((i, el) => $(el).text().trim()).get().slice(0, 5),
        hasEcommerce: $('.shop, .store, .cart, .buy').length > 0,
        hasContact: $('.contact, .about').length > 0,
        technology: this.detectTechnology($)
      };
    } catch (error) {
      return { error: 'Could not analyze website' };
    }
  }

  // Enhanced email address discovery
  async findBetterEmailAddresses(prospect) {
    const emails = [...(prospect.emails || [])];
    
    // Try to find more specific contact emails
    if (prospect.website) {
      try {
        const contactEmails = await this.extractContactEmails(prospect.website);
        emails.push(...contactEmails);
      } catch (error) {
        console.log(`      ⚠️ Could not extract contact emails: ${error.message}`);
      }
    }

    // Generate likely business email patterns
    const domain = prospect.website ? new URL(prospect.website).hostname : null;
    if (domain) {
      const likelyEmails = [
        `info@${domain}`,
        `contact@${domain}`,
        `sales@${domain}`,
        `hello@${domain}`,
        `support@${domain}`
      ];
      emails.push(...likelyEmails);
    }

    // Remove duplicates and invalid emails
    const validEmails = [...new Set(emails)]
      .filter(email => email.includes('@') && email.includes('.'))
      .filter(email => !email.includes('example') && !email.includes('test'));

    return validEmails;
  }

  // Extract contact emails from website
  async extractContactEmails(url) {
    try {
      // Try contact page first
      const contactUrls = [
        url + '/contact',
        url + '/contact-us',
        url + '/about',
        url + '/about-us'
      ];

      for (const contactUrl of contactUrls) {
        try {
          const response = await axios.get(contactUrl, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContactBot/1.0)' }
          });

          const emails = response.data.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
          if (emails.length > 0) {
            return emails.filter(email => 
              !email.includes('example') && 
              !email.includes('placeholder') &&
              !email.includes('noreply')
            );
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      // Ignore extraction errors
    }
    
    return [];
  }

  // Comprehensive workflow execution
  async runOptimizedWorkflow(websiteUrl, goal, emailLimit = 3) {
    console.log('🚀 OPTIMIZED AI WORKFLOW EXECUTION');
    console.log('='.repeat(70));
    console.log(`Target Website: ${websiteUrl}`);
    console.log(`Campaign Goal: ${goal}`);
    console.log(`Email Limit: ${emailLimit}`);
    console.log('='.repeat(70) + '\n');

    try {
      // Step 1: Enhanced Website Analysis
      console.log('📌 STEP 1: Enhanced Website Analysis');
      const businessAnalysis = await this.analyzeWebsiteThoroughly(websiteUrl);
      this.logBusinessAnalysis(businessAnalysis);

      // Step 2: High-Quality Prospect Discovery
      console.log('\n📌 STEP 2: High-Quality Prospect Discovery');
      const prospects = await this.findHighQualityProspects(businessAnalysis, goal, emailLimit);
      
      if (prospects.length === 0) {
        throw new Error('No qualified prospects found');
      }

      // Step 3: Enhanced Email Generation and Sending
      console.log('\n📌 STEP 3: Enhanced Email Generation & Sending');
      const results = await this.sendOptimizedEmails(prospects, businessAnalysis, goal);

      // Step 4: Results Analysis
      console.log('\n📌 STEP 4: Results Analysis');
      this.displayOptimizedResults(results, prospects, businessAnalysis, goal);

      return results;

    } catch (error) {
      console.error(`\n❌ WORKFLOW FAILED: ${error.message}`);
      throw error;
    }
  }

  // Send optimized emails with better addresses
  async sendOptimizedEmails(prospects, businessAnalysis, goal) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'luzgool001@gmail.com',
        pass: 'rksj xojs zqbs fnsg'
      }
    });

    const results = [];

    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      console.log(`\n   📧 [${i + 1}/${prospects.length}] Processing ${prospect.company}...`);

      // Find best email addresses
      const emailAddresses = await this.findBetterEmailAddresses(prospect);
      console.log(`      📮 Found ${emailAddresses.length} potential email addresses`);

      if (emailAddresses.length === 0) {
        console.log(`      ⚠️ No email addresses found - skipping`);
        results.push({
          success: false,
          company: prospect.company,
          error: 'No email addresses found'
        });
        continue;
      }

      // Use the best email address (prefer info@, contact@, sales@)
      const bestEmail = this.selectBestEmail(emailAddresses);
      console.log(`      🎯 Selected: ${bestEmail}`);

      // Generate highly personalized email
      const emailContent = await this.generateHighlyPersonalizedEmail(prospect, businessAnalysis, goal);

      // Send the email
      try {
        const mailOptions = {
          from: `"${businessAnalysis.companyName} Team" <luzgool001@gmail.com>`,
          to: bestEmail,
          subject: emailContent.subject,
          html: this.formatEmailHTML(emailContent.body, prospect, businessAnalysis, emailContent.personalizationScore)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`      ✅ Email sent successfully!`);
        console.log(`      📬 Message ID: ${info.messageId}`);
        console.log(`      🎯 Personalization: ${emailContent.personalizationScore}%`);

        results.push({
          success: true,
          company: prospect.company,
          email: bestEmail,
          messageId: info.messageId,
          personalizationScore: emailContent.personalizationScore,
          relevanceScore: prospect.relevanceScore,
          aiGenerated: emailContent.aiGenerated,
          timestamp: new Date().toISOString()
        });

        // Wait between emails
        if (i < prospects.length - 1) {
          console.log(`      ⏳ Waiting 4 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

      } catch (error) {
        console.log(`      ❌ Send failed: ${error.message}`);
        results.push({
          success: false,
          company: prospect.company,
          email: bestEmail,
          error: error.message
        });
      }
    }

    return results;
  }

  // Helper methods
  selectBestEmail(emails) {
    const priorities = ['info@', 'contact@', 'sales@', 'hello@', 'support@'];
    
    for (const priority of priorities) {
      const found = emails.find(email => email.includes(priority));
      if (found) return found;
    }
    
    return emails[0]; // Return first available
  }

  generateSubjectLine(prospect, businessAnalysis, goal) {
    const templates = [
      `Partnership Opportunity - ${businessAnalysis.companyName} x ${prospect.company}`,
      `${goal} Solution for ${prospect.company}`,
      `Helping ${prospect.company} with ${businessAnalysis.industry} Solutions`,
      `Quick Question About ${prospect.company}'s Growth`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  calculatePersonalizationScore(emailBody, prospect) {
    let score = 50; // Base score
    
    if (emailBody.includes(prospect.company)) score += 15;
    if (emailBody.toLowerCase().includes('your business') || emailBody.toLowerCase().includes('your company')) score += 10;
    if (emailBody.length > 300) score += 10; // Detailed email
    if (emailBody.includes('specific') || emailBody.includes('particular')) score += 10;
    if (emailBody.match(/\b(you|your)\b/gi)?.length > 5) score += 5; // Personal pronouns
    
    return Math.min(score, 100);
  }

  formatEmailHTML(body, prospect, businessAnalysis, personalizationScore) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        ${body.split('\n').filter(p => p.trim()).map(paragraph => 
          `<p style="margin-bottom: 12px;">${paragraph}</p>`
        ).join('')}
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px;">
          <h4 style="color: #007bff; margin-top: 0;">Why ${businessAnalysis.companyName}?</h4>
          <ul style="margin: 10px 0; color: #333;">
            <li>${businessAnalysis.valueProposition}</li>
            <li>Proven results in ${businessAnalysis.industry}</li>
            <li>Tailored solutions for your business needs</li>
          </ul>
        </div>
        
        <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 11px; color: #666; text-align: center;">
          <strong>Campaign:</strong> Optimized AI Outreach<br>
          <strong>Personalization:</strong> ${personalizationScore}%<br>
          <strong>Relevance Score:</strong> ${prospect.relevanceScore || 'N/A'}%<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </p>
      </div>
    `;
  }

  logBusinessAnalysis(analysis) {
    console.log('   ✅ Enhanced analysis complete:');
    console.log(`      Company: ${analysis.companyName}`);
    console.log(`      Industry: ${analysis.industry}`);
    console.log(`      Business Model: ${analysis.businessModel}`);
    console.log(`      Products: ${analysis.products?.join(', ')}`);
    console.log(`      Target Market: ${analysis.targetMarket}`);
    console.log(`      Key Features: ${analysis.keyFeatures?.join(', ') || 'N/A'}`);
  }

  displayOptimizedResults(results, prospects, businessAnalysis, goal) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 OPTIMIZED WORKFLOW RESULTS');
    console.log('='.repeat(70));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const avgPersonalization = successful.length > 0 ? 
      successful.reduce((sum, r) => sum + (r.personalizationScore || 0), 0) / successful.length : 0;
    const avgRelevance = prospects.length > 0 ? 
      prospects.reduce((sum, p) => sum + (p.relevanceScore || 0), 0) / prospects.length : 0;

    console.log(`\n🎯 CAMPAIGN PERFORMANCE:`);
    console.log(`   Goal: ${goal}`);
    console.log(`   Target Business: ${businessAnalysis.companyName} (${businessAnalysis.industry})`);
    console.log(`   Prospects Analyzed: ${prospects.length}`);
    console.log(`   Emails Sent: ${successful.length}/${results.length}`);
    console.log(`   Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
    console.log(`   Avg Personalization: ${avgPersonalization.toFixed(1)}%`);
    console.log(`   Avg Relevance Score: ${avgRelevance.toFixed(1)}%`);

    if (successful.length > 0) {
      console.log(`\n✅ SUCCESSFUL DELIVERIES:`);
      successful.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.company}`);
        console.log(`      📧 ${result.email}`);
        console.log(`      🆔 ${result.messageId}`);
        console.log(`      🎯 Personalization: ${result.personalizationScore}%`);
        console.log(`      📊 Relevance: ${result.relevanceScore || 'N/A'}%`);
      });
    }

    if (failed.length > 0) {
      console.log(`\n❌ FAILED ATTEMPTS:`);
      failed.forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.company}: ${result.error}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏆 OPTIMIZATION COMPLETE!');
    console.log('✅ Enhanced analysis, better emails, improved targeting');
    console.log('='.repeat(70));
  }

  // Utility methods
  guessIndustryFromContent(content) {
    const keywords = {
      'pet': 'Pet Products & Services',
      'technology': 'Technology',
      'software': 'Software Development',
      'health': 'Healthcare',
      'education': 'Education',
      'finance': 'Financial Services',
      'real estate': 'Real Estate',
      'food': 'Food & Beverage',
      'retail': 'Retail',
      'consulting': 'Consulting Services'
    };

    const contentLower = content.toLowerCase();
    for (const [keyword, industry] of Object.entries(keywords)) {
      if (contentLower.includes(keyword)) {
        return industry;
      }
    }
    return 'Business Services';
  }

  extractProductsFromContent(bodyText, headings) {
    const content = (bodyText + ' ' + headings.join(' ')).toLowerCase();
    const products = [];
    
    const productPatterns = [
      /(\w+\s+)?(products?|services?|solutions?)/gi,
      /(custom|premium|professional)\s+\w+/gi,
      /we (offer|provide|sell)\s+([\w\s]+)/gi
    ];

    for (const pattern of productPatterns) {
      const matches = content.match(pattern) || [];
      products.push(...matches.slice(0, 3));
    }

    return products.length > 0 ? products : ['Products', 'Services', 'Solutions'];
  }

  getFallbackQueries(businessAnalysis, goal) {
    return [
      `${businessAnalysis.industry} companies contact`,
      `${businessAnalysis.products[0]} customers email`,
      `${goal} ${businessAnalysis.industry}`,
      `businesses need ${businessAnalysis.products[0]}`,
      `${businessAnalysis.targetMarket} directory`
    ];
  }

  async searchWithGoogleAPI(query) {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: this.googleApiKey,
        cx: this.searchEngineId,
        q: query,
        num: 5
      },
      timeout: 10000
    });

    return response.data.items?.map(item => ({
      ...item,
      query: query
    })) || [];
  }

  extractCompanyName(title) {
    return title.split(' - ')[0].split(' | ')[0].split(' :: ')[0].trim();
  }

  deduplicateAndScore(prospects, businessAnalysis, goal) {
    const seen = new Set();
    const unique = [];
    
    for (const prospect of prospects) {
      const key = prospect.company?.toLowerCase() || prospect.website;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(prospect);
      }
    }
    
    return unique.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  async getIndustrySpecificProspects(industry) {
    // Return industry-specific high-quality prospects
    const industryMap = {
      'Pet Products & Services': [
        {
          company: 'Petco Corporate',
          website: 'https://corporate.petco.com',
          description: 'Leading pet specialty retailer',
          emails: ['corporate@petco.com'],
          relevanceScore: 85,
          relevanceReason: 'Major pet retailer, perfect for product partnerships'
        }
      ]
    };

    return industryMap[industry] || [];
  }

  generateBasicDefaults(url) {
    const domain = new URL(url).hostname.replace('www.', '');
    return {
      companyName: domain.split('.')[0],
      industry: 'Business Services',
      products: ['Products', 'Services'],
      targetMarket: 'Business customers',
      valueProposition: 'Quality solutions',
      businessModel: 'B2B',
      keyFeatures: ['Quality', 'Service', 'Support'],
      companySize: 'Small business'
    };
  }

  generateEnhancedTemplate(prospect, businessAnalysis, goal) {
    return {
      body: `Dear ${prospect.company} Team,

I hope this message finds you well. I'm reaching out from ${businessAnalysis.companyName}, where we specialize in ${businessAnalysis.products.join(', ')}.

I came across your company while researching ${prospect.relevanceReason || 'businesses in your industry'}, and I believe there's a strong alignment between what you do and how we can help.

Our ${businessAnalysis.valueProposition} has helped similar companies in ${businessAnalysis.industry} achieve their goals related to ${goal}.

I'd love to learn more about your current challenges and explore how we might be able to support ${prospect.company}'s growth.

Would you be open to a brief 15-minute conversation this week?

Best regards,
${businessAnalysis.companyName} Team`,
      subject: `${goal} Partnership Opportunity - ${prospect.company}`,
      personalizationScore: 65,
      aiGenerated: false
    };
  }

  detectTechnology($) {
    const technologies = [];
    if ($('script[src*="shopify"]').length > 0) technologies.push('Shopify');
    if ($('script[src*="wordpress"]').length > 0) technologies.push('WordPress');
    if ($('script[src*="react"]').length > 0) technologies.push('React');
    return technologies;
  }
}

// Execute the optimized workflow
async function testOptimizedWorkflow() {
  const workflow = new OptimizedAIWorkflow();
  
  try {
    const results = await workflow.runOptimizedWorkflow(
      'https://petpoofficial.org',
      'advertise pet products and establish wholesale partnerships',
      3
    );
    
    console.log('\n📊 Final JSON Results:', JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testOptimizedWorkflow();