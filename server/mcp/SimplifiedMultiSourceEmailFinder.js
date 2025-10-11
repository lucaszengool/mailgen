/**
 * Simplified Multi-Source Email Finder (No MCP SDK required)
 * Aggregates emails from multiple free sources without API keys
 * Compatible with existing system architecture
 */

const axios = require('axios');
const cheerio = require('cheerio');

const dns = require('dns').promises;

class SimplifiedMultiSourceEmailFinder {
  constructor() {
    this.name = 'simplified-multi-source-email-finder';
    this.version = '1.0.0';
    console.log(`🚀 ${this.name} v${this.version} initialized`);
  }

  /**
   * Main aggregation method - compatible with existing SuperPowerEmailSearchEngine interface
   */
  async searchRealEmails(companyInfo) {
    console.log(`🔍 Multi-Source: Starting aggregation for ${companyInfo.name || companyInfo.company_name}`);
    
    const company = companyInfo.name || companyInfo.company_name;
    const domain = companyInfo.domain || this.extractDomain(companyInfo.website);
    const website = companyInfo.website;

    const results = {
      emails: [],
      sources: [],
      searchQueries: [`Multi-source aggregation for ${company}`],
      timestamp: new Date().toISOString(),
      source_details: {}
    };

    try {
      // Run all sources in parallel for better performance
      console.log('🚀 Running multi-source search in parallel...');
      
      const [
        githubResults,
        domainIntelResults, 
        whoisResults,
        webScrapingResults,
        socialResults
      ] = await Promise.allSettled([
        this.searchGitHub(company, domain),
        this.analyzeDomain(domain),
        this.analyzeWHOIS(domain),
        this.intelligentWebScraping(company, website),
        this.searchSocialMedia(company)
      ]);

      // Aggregate results from all sources
      this.aggregateResults(results, 'github', githubResults);
      this.aggregateResults(results, 'domain_intel', domainIntelResults);
      this.aggregateResults(results, 'whois', whoisResults);
      this.aggregateResults(results, 'web_scraping', webScrapingResults);
      this.aggregateResults(results, 'social_media', socialResults);

      // Deduplicate and score emails
      results.emails = this.deduplicateAndScore(results.emails);
      
      console.log(`✅ Multi-Source: Found ${results.emails.length} emails from ${results.sources.length} sources`);
      
      return results;

    } catch (error) {
      console.error('❌ Multi-source aggregation failed:', error.message);
      return {
        emails: [],
        sources: ['multi_source_failed'],
        searchQueries: results.searchQueries,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Enhanced GitHub search with multiple strategies
   */
  async searchGitHub(company, domain) {
    console.log('🔍 Searching GitHub...');
    const emails = [];
    
    if (!company) return emails;

    try {
      // Strategy 1: Search GitHub users by company name
      const searchQueries = [
        company,
        `company:"${company}"`,
        `"${company}" in:bio`,
        domain ? `@${domain}` : null
      ].filter(Boolean);

      for (const query of searchQueries.slice(0, 2)) { // Limit queries
        try {
          console.log(`   GitHub query: ${query}`);
          
          const response = await axios.get(`https://api.github.com/search/users`, {
            params: {
              q: query,
              per_page: 10
            },
            headers: { 
              'User-Agent': 'Mozilla/5.0 Multi-Source-Email-Finder',
              'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 8000
          });

          if (response.data && response.data.items) {
            for (const user of response.data.items.slice(0, 5)) {
              try {
                // Get user details
                const userResponse = await axios.get(`https://api.github.com/users/${user.login}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 Multi-Source-Email-Finder' },
                  timeout: 5000
                });

                if (userResponse.data.email && this.isValidBusinessEmail(userResponse.data.email)) {
                  emails.push({
                    email: userResponse.data.email,
                    source: 'github_profile',
                    name: userResponse.data.name,
                    title: 'Developer',
                    confidence: 75,
                    github_username: user.login,
                    company: userResponse.data.company || company
                  });
                }

              } catch (userError) {
                console.log(`   ⚠️ GitHub user fetch failed: ${userError.message}`);
              }
            }
          }
        } catch (searchError) {
          console.log(`   ⚠️ GitHub search failed: ${searchError.message}`);
        }
      }

    } catch (error) {
      console.log(`⚠️ GitHub source error: ${error.message}`);
    }

    console.log(`✅ GitHub: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * Enhanced domain intelligence with DNS analysis
   */
  async analyzeDomain(domain) {
    console.log(`🔍 Analyzing domain: ${domain}`);
    const emails = [];

    if (!domain) return emails;

    try {
      // DNS TXT records analysis
      try {
        const txtRecords = await dns.resolveTxt(domain);
        console.log(`   Found ${txtRecords.length} TXT records`);
        
        txtRecords.flat().forEach(record => {
          const emailMatches = record.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (emailMatches) {
            emailMatches.forEach(email => {
              if (this.isValidBusinessEmail(email)) {
                emails.push({
                  email: email.toLowerCase(),
                  source: 'dns_txt_records',
                  title: 'Technical Contact',
                  confidence: 85,
                  company: domain
                });
              }
            });
          }
        });
      } catch (dnsError) {
        console.log(`   ⚠️ DNS TXT lookup failed: ${dnsError.message}`);
      }

      // MX records analysis for email infrastructure
      try {
        const mxRecords = await dns.resolveMx(domain);
        const hasCustomMX = mxRecords.some(mx => 
          !mx.exchange.includes('google') && 
          !mx.exchange.includes('outlook') && 
          !mx.exchange.includes('microsoft')
        );
        
        if (hasCustomMX) {
          console.log(`   Domain has custom email infrastructure`);
          
          // Generate common email patterns
          const commonPrefixes = ['info', 'contact', 'hello', 'support', 'sales', 'team', 'admin'];
          commonPrefixes.forEach(prefix => {
            emails.push({
              email: `${prefix}@${domain}`,
              source: 'domain_pattern_analysis',
              title: this.getRoleFromPrefix(prefix),
              confidence: 60,
              inferred: true,
              company: domain
            });
          });
        }
      } catch (mxError) {
        console.log(`   ⚠️ MX lookup failed: ${mxError.message}`);
      }

    } catch (error) {
      console.log(`⚠️ Domain analysis error: ${error.message}`);
    }

    console.log(`✅ Domain Intel: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * WHOIS analysis for registration data
   */
  async analyzeWHOIS(domain) {
    console.log(`🔍 WHOIS analysis: ${domain}`);
    const emails = [];

    if (!domain) return emails;

    try {
      // Try multiple free WHOIS services
      const whoisServices = [
        `https://www.whoisfreaks.com/api/whois?domain=${domain}`,
        `https://whois.freeaiapi.xyz/?domain=${domain}`
      ];

      for (const serviceUrl of whoisServices) {
        try {
          console.log(`   Trying WHOIS service...`);
          
          const response = await axios.get(serviceUrl, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 Multi-Source-Email-Finder' }
          });

          if (response.data) {
            const whoisText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            const emailMatches = whoisText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            
            if (emailMatches) {
              emailMatches.forEach(email => {
                if (this.isValidBusinessEmail(email) && !this.isPrivacyEmail(email)) {
                  emails.push({
                    email: email.toLowerCase(),
                    source: 'whois_records',
                    title: 'Administrative Contact',
                    confidence: 70,
                    company: domain
                  });
                }
              });
            }
            
            break; // Success, don't try other services
          }
        } catch (serviceError) {
          console.log(`   ⚠️ WHOIS service failed: ${serviceError.message}`);
        }
      }

    } catch (error) {
      console.log(`⚠️ WHOIS analysis error: ${error.message}`);
    }

    console.log(`✅ WHOIS: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * Intelligent web scraping with targeted pages
   */
  async intelligentWebScraping(company, website) {
    console.log(`🔍 Web scraping: ${website}`);
    const emails = [];

    if (!website) return emails;

    try {
      // Normalize website URL
      if (!website.startsWith('http')) {
        website = `https://${website}`;
      }

      // Target pages most likely to contain emails
      const targetPages = [
        website,
        `${website}/contact`,
        `${website}/contact-us`,
        `${website}/about`,
        `${website}/about-us`,
        `${website}/team`,
        `${website}/people`,
        `${website}/leadership`
      ];

      for (const pageUrl of targetPages.slice(0, 5)) { // Limit pages
        try {
          console.log(`   Scraping: ${pageUrl}`);
          
          const response = await axios.get(pageUrl, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          
          // Extract emails from page text
          const pageText = $.text();
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

          // Look for obfuscated emails
          const obfuscatedPattern = /([a-zA-Z0-9._%+-]+)\s*\[at\]\s*([a-zA-Z0-9.-]+)\s*\[dot\]\s*([a-zA-Z]{2,})/gi;
          let match;
          while ((match = obfuscatedPattern.exec(pageText)) !== null) {
            foundEmails.push(`${match[1]}@${match[2]}.${match[3]}`);
          }

          foundEmails.forEach(email => {
            if (this.isValidBusinessEmail(email)) {
              emails.push({
                email: email.toLowerCase(),
                source: 'website_scraping',
                title: this.inferRoleFromEmail(email),
                confidence: 65,
                found_on: pageUrl,
                company: company
              });
            }
          });

        } catch (pageError) {
          console.log(`   ⚠️ Page scraping failed: ${pageError.message}`);
        }
      }

    } catch (error) {
      console.log(`⚠️ Web scraping error: ${error.message}`);
    }

    console.log(`✅ Web Scraping: Found ${emails.length} emails`);
    return emails;
  }

  /**
   * Social media search (placeholder for future enhancement)
   */
  async searchSocialMedia(company) {
    console.log(`🔍 Social media search: ${company}`);
    // Placeholder - would implement LinkedIn, Twitter scraping
    return [];
  }

  /**
   * Utility methods
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
      const sourceEmails = promiseResult.value;
      results.emails.push(...sourceEmails);
      results.sources.push(sourceName);
      results.source_details[sourceName] = {
        count: sourceEmails.length,
        status: 'success'
      };
    } else {
      results.source_details[sourceName] = {
        count: 0,
        status: 'failed',
        error: promiseResult.reason?.message || 'Unknown error'
      };
    }
  }

  deduplicateAndScore(emails) {
    const emailMap = new Map();
    
    emails.forEach(emailObj => {
      const key = emailObj.email.toLowerCase();
      
      if (emailMap.has(key)) {
        // Merge data from multiple sources
        const existing = emailMap.get(key);
        existing.sources = [...new Set([...(existing.sources || [existing.source]), emailObj.source])];
        existing.confidence = Math.max(existing.confidence, emailObj.confidence);
        
        // Keep additional metadata
        if (emailObj.name && !existing.name) existing.name = emailObj.name;
        if (emailObj.title && !existing.title) existing.title = emailObj.title;
        if (emailObj.github_username && !existing.github_username) existing.github_username = emailObj.github_username;
        
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
    
    // Filter out personal domains
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'me.com', 'live.com'
    ];
    const domain = email.split('@')[1];
    if (personalDomains.includes(domain)) return false;
    
    // Filter out spam/system emails
    const spamPrefixes = ['noreply', 'no-reply', 'donotreply', 'postmaster', 'webmaster'];
    const prefix = email.split('@')[0].toLowerCase();
    if (spamPrefixes.some(spam => prefix.includes(spam))) return false;
    
    return true;
  }

  isPrivacyEmail(email) {
    const privacyServices = ['whoisguard', 'domains.google', 'registration-private', 'redacted', 'privacy'];
    return privacyServices.some(service => email.toLowerCase().includes(service));
  }

  getRoleFromPrefix(prefix) {
    const roleMap = {
      'info': 'Information',
      'contact': 'Contact',
      'hello': 'General',
      'support': 'Support',
      'sales': 'Sales',
      'team': 'Team',
      'admin': 'Administrator'
    };
    return roleMap[prefix] || 'Contact';
  }

  inferRoleFromEmail(email) {
    const prefix = email.split('@')[0].toLowerCase();
    
    if (prefix.includes('ceo') || prefix.includes('founder')) return 'Executive';
    if (prefix.includes('sales') || prefix.includes('business')) return 'Sales';
    if (prefix.includes('marketing')) return 'Marketing';
    if (prefix.includes('support') || prefix.includes('help')) return 'Support';
    if (prefix.includes('info') || prefix.includes('contact')) return 'Information';
    
    return this.getRoleFromPrefix(prefix.split('.')[0]);
  }
}

module.exports = SimplifiedMultiSourceEmailFinder;