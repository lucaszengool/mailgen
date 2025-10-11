/**
 * Multi-Source Email Aggregation MCP Server
 * No API keys required - uses free public sources
 * Based on Model Context Protocol specification
 */

const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;
const { McpServer } = require('@modelcontextprotocol/sdk/server');

class MultiSourceEmailAggregatorMCP {
  constructor() {
    this.name = 'multi-source-email-aggregator';
    this.version = '1.0.0';
    this.description = 'Aggregates email data from multiple free sources without API keys';
    
    // Initialize MCP server
    this.server = new McpServer({
      name: this.name,
      version: this.version
    });
    
    this.setupMCPHandlers();
  }

  setupMCPHandlers() {
    // Register MCP tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'aggregate_emails',
          description: 'Find emails from multiple sources for a company',
          inputSchema: {
            type: 'object',
            properties: {
              company: { type: 'string', description: 'Company name' },
              domain: { type: 'string', description: 'Company domain' },
              website: { type: 'string', description: 'Company website URL' }
            },
            required: ['company']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'aggregate_emails') {
        return await this.aggregateEmails(args);
      }
      
      throw new Error(`Unknown tool: ${name}`);
    });
  }

  /**
   * Main aggregation method - combines all sources
   */
  async aggregateEmails({ company, domain, website }) {
    console.log(`🔍 MCP: Starting multi-source email aggregation for ${company}`);
    
    const results = {
      company,
      domain: domain || this.extractDomain(website),
      emails: [],
      sources: [],
      confidence_scores: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Run all sources in parallel for better performance
      const [
        githubResults,
        domainIntelResults, 
        socialResults,
        whoisResults,
        webScrapingResults
      ] = await Promise.allSettled([
        this.searchGitHub(company, domain),
        this.analyzeDomain(domain || this.extractDomain(website)),
        this.searchSocialMedia(company),
        this.analyzeWHOIS(domain || this.extractDomain(website)),
        this.intelligentWebScraping(company, website)
      ]);

      // Aggregate results from all sources
      this.aggregateResults(results, 'github', githubResults);
      this.aggregateResults(results, 'domain_intel', domainIntelResults);
      this.aggregateResults(results, 'social_media', socialResults);
      this.aggregateResults(results, 'whois', whoisResults);
      this.aggregateResults(results, 'web_scraping', webScrapingResults);

      // Deduplicate and score emails
      results.emails = this.deduplicateAndScore(results.emails);
      
      console.log(`✅ MCP: Found ${results.emails.length} emails from ${results.sources.length} sources`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }
        ]
      };

    } catch (error) {
      console.error('❌ MCP aggregation failed:', error.message);
      return {
        content: [
          {
            type: 'text', 
            text: JSON.stringify({ error: error.message, results }, null, 2)
          }
        ]
      };
    }
  }

  /**
   * 1. GitHub Source - Find developers and their public emails
   */
  async searchGitHub(company, domain) {
    console.log('🔍 MCP: Searching GitHub...');
    const emails = [];
    
    try {
      // Search for GitHub users by company
      const searchQueries = [
        `company:"${company}"`,
        `"${company}" in:name`,
        `"${company}" in:bio`
      ];

      for (const query of searchQueries) {
        try {
          const response = await axios.get(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=20`, {
            headers: { 'User-Agent': 'Mozilla/5.0 Email-Aggregator' },
            timeout: 10000
          });

          if (response.data && response.data.items) {
            for (const user of response.data.items.slice(0, 10)) {
              // Get user details to find email
              try {
                const userResponse = await axios.get(user.url, {
                  headers: { 'User-Agent': 'Mozilla/5.0 Email-Aggregator' },
                  timeout: 5000
                });

                if (userResponse.data.email) {
                  emails.push({
                    email: userResponse.data.email,
                    source: 'github_profile',
                    name: userResponse.data.name,
                    role: 'Developer',
                    confidence: 75,
                    github_username: user.login
                  });
                }

                // Get commits to find email
                const commitsResponse = await axios.get(`${user.url}/events/public`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 Email-Aggregator' },
                  timeout: 5000
                });

                if (commitsResponse.data) {
                  commitsResponse.data.slice(0, 5).forEach(event => {
                    if (event.type === 'PushEvent' && event.payload.commits) {
                      event.payload.commits.forEach(commit => {
                        if (commit.author && commit.author.email) {
                          emails.push({
                            email: commit.author.email,
                            source: 'github_commits',
                            name: commit.author.name,
                            role: 'Developer',
                            confidence: 80,
                            github_username: user.login
                          });
                        }
                      });
                    }
                  });
                }

              } catch (userError) {
                console.log(`⚠️ Could not fetch GitHub user details: ${userError.message}`);
              }
            }
          }
        } catch (searchError) {
          console.log(`⚠️ GitHub search failed: ${searchError.message}`);
        }
      }

    } catch (error) {
      console.log(`⚠️ GitHub source failed: ${error.message}`);
    }

    console.log(`✅ GitHub: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * 2. Domain Intelligence - Analyze company domain for emails
   */
  async analyzeDomain(domain) {
    console.log(`🔍 MCP: Analyzing domain ${domain}...`);
    const emails = [];

    if (!domain) return emails;

    try {
      // DNS TXT records might contain emails
      const txtRecords = await dns.resolveTxt(domain);
      txtRecords.flat().forEach(record => {
        const emailMatches = record.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailMatches) {
          emailMatches.forEach(email => {
            emails.push({
              email,
              source: 'dns_txt_records',
              role: 'Technical',
              confidence: 85
            });
          });
        }
      });

      // MX records to understand email infrastructure
      const mxRecords = await dns.resolveMx(domain);
      const hasCustomMX = mxRecords.some(mx => !mx.exchange.includes('google') && !mx.exchange.includes('outlook'));
      
      if (hasCustomMX) {
        // Likely has custom email setup, try common patterns
        const commonPrefixes = ['info', 'contact', 'hello', 'support', 'sales', 'team'];
        commonPrefixes.forEach(prefix => {
          emails.push({
            email: `${prefix}@${domain}`,
            source: 'domain_pattern_analysis',
            role: this.getRoleFromPrefix(prefix),
            confidence: 60,
            inferred: true
          });
        });
      }

    } catch (error) {
      console.log(`⚠️ Domain analysis failed: ${error.message}`);
    }

    console.log(`✅ Domain Intel: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * 3. Social Media Sources - Extract from public profiles
   */
  async searchSocialMedia(company) {
    console.log('🔍 MCP: Searching social media...');
    const emails = [];

    try {
      // Search Twitter/X (using web scraping)
      const twitterResults = await this.searchTwitter(company);
      emails.push(...twitterResults);

      // Search Facebook pages
      const facebookResults = await this.searchFacebook(company);
      emails.push(...facebookResults);

    } catch (error) {
      console.log(`⚠️ Social media search failed: ${error.message}`);
    }

    console.log(`✅ Social Media: Found ${emails.length} emails`);
    return emails;
  }

  async searchTwitter(company) {
    // Twitter web scraping (limited due to auth requirements)
    // Implementation would use public search without API
    return [];
  }

  async searchFacebook(company) {
    // Facebook page scraping for contact info
    // Implementation would search for business pages
    return [];
  }

  /**
   * 4. WHOIS Analysis - Extract registration emails
   */
  async analyzeWHOIS(domain) {
    console.log(`🔍 MCP: Analyzing WHOIS for ${domain}...`);
    const emails = [];

    if (!domain) return emails;

    try {
      // Use free WHOIS API service
      const response = await axios.get(`https://www.whoisfreaks.com/api/whois?domain=${domain}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 Email-Aggregator' }
      });

      if (response.data) {
        const whoisText = JSON.stringify(response.data);
        const emailMatches = whoisText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        
        if (emailMatches) {
          emailMatches.forEach(email => {
            // Filter out privacy protection emails
            if (!this.isPrivacyEmail(email)) {
              emails.push({
                email,
                source: 'whois_records',
                role: 'Administrative',
                confidence: 70
              });
            }
          });
        }
      }

    } catch (error) {
      console.log(`⚠️ WHOIS analysis failed: ${error.message}`);
    }

    console.log(`✅ WHOIS: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * 5. Intelligent Web Scraping - Enhanced website analysis
   */
  async intelligentWebScraping(company, website) {
    console.log('🔍 MCP: Intelligent web scraping...');
    const emails = [];

    if (!website) return emails;

    try {
      // Scrape main website
      const mainPageEmails = await this.scrapeWebsite(website);
      emails.push(...mainPageEmails);

      // Try common contact pages
      const contactPages = [
        `${website}/contact`,
        `${website}/contact-us`,
        `${website}/about`,
        `${website}/team`,
        `${website}/about-us`
      ];

      for (const contactUrl of contactPages) {
        try {
          const contactEmails = await this.scrapeWebsite(contactUrl);
          emails.push(...contactEmails);
        } catch (error) {
          // Continue with other pages
        }
      }

    } catch (error) {
      console.log(`⚠️ Web scraping failed: ${error.message}`);
    }

    console.log(`✅ Web Scraping: Found ${emails.length} emails`);
    return emails;
  }

  async scrapeWebsite(url) {
    const emails = [];
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const pageText = $.text();
      const pageHtml = response.data;

      // Extract emails from text
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = pageText.match(emailRegex) || [];

      // Extract from mailto links
      $('a[href^="mailto:"]').each((i, elem) => {
        const mailto = $(elem).attr('href');
        if (mailto) {
          const email = mailto.replace('mailto:', '').split('?')[0];
          foundEmails.push(email);
        }
      });

      foundEmails.forEach(email => {
        if (this.isValidBusinessEmail(email)) {
          emails.push({
            email: email.toLowerCase(),
            source: 'website_scraping',
            role: this.inferRoleFromEmail(email),
            confidence: 65,
            found_on: url
          });
        }
      });

    } catch (error) {
      // Fail silently for individual pages
    }

    return emails;
  }

  /**
   * Helper methods
   */
  extractDomain(url) {
    if (!url) return '';
    try {
      if (!url.startsWith('http')) url = `https://${url}`;
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  aggregateResults(results, sourceName, promiseResult) {
    if (promiseResult.status === 'fulfilled' && promiseResult.value) {
      results.emails.push(...promiseResult.value);
      results.sources.push(sourceName);
      results.confidence_scores[sourceName] = promiseResult.value.length;
    }
  }

  deduplicateAndScore(emails) {
    const emailMap = new Map();
    
    emails.forEach(emailObj => {
      const key = emailObj.email.toLowerCase();
      
      if (emailMap.has(key)) {
        // Merge data from multiple sources
        const existing = emailMap.get(key);
        existing.sources = [...new Set([...existing.sources || [existing.source], emailObj.source])];
        existing.confidence = Math.max(existing.confidence, emailObj.confidence);
        
        // Keep additional metadata
        if (emailObj.name && !existing.name) existing.name = emailObj.name;
        if (emailObj.role && !existing.role) existing.role = emailObj.role;
        
      } else {
        emailMap.set(key, {
          ...emailObj,
          sources: [emailObj.source]
        });
      }
    });

    return Array.from(emailMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  isValidBusinessEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    // Filter out personal emails
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1];
    if (personalDomains.includes(domain)) return false;
    
    return true;
  }

  isPrivacyEmail(email) {
    const privacyServices = ['whoisguard', 'domains.google', 'registration-private'];
    return privacyServices.some(service => email.includes(service));
  }

  getRoleFromPrefix(prefix) {
    const roleMap = {
      'info': 'Information',
      'contact': 'Contact', 
      'hello': 'General',
      'support': 'Support',
      'sales': 'Sales',
      'team': 'Team'
    };
    return roleMap[prefix] || 'Contact';
  }

  inferRoleFromEmail(email) {
    const prefix = email.split('@')[0].toLowerCase();
    return this.getRoleFromPrefix(prefix);
  }

  /**
   * Start the MCP server
   */
  async start() {
    console.log(`🚀 Starting Multi-Source Email Aggregator MCP Server v${this.version}`);
    await this.server.start();
    console.log('✅ MCP Server running and ready for requests');
  }
}

module.exports = MultiSourceEmailAggregatorMCP;

// If run directly
if (require.main === module) {
  const server = new MultiSourceEmailAggregatorMCP();
  server.start().catch(console.error);
}