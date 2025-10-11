/**
 * Simplified Web Email Search Engine
 * Directly scrapes websites and search engines for real emails
 * No external dependencies - just raw web scraping power!
 */

const axios = require('axios');
const cheerio = require('cheerio');

class SimplifiedWebEmailSearchEngine {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 10000;
    
    // Search engines we'll scrape directly
    this.searchEngines = [
      {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/html',
        params: { q: '' },
        working: true
      },
      {
        name: 'Startpage',
        url: 'https://www.startpage.com/sp/search',
        params: { query: '' },
        working: true
      }
    ];
    
    console.log('🚀 Simplified Web Email Search Engine initialized');
    console.log('   ⚡ Direct web scraping (no external APIs needed)');
    console.log('   🌐 Multi-engine search capability');
  }

  /**
   * Main search method - finds REAL emails from the web
   */
  async searchRealEmails(companyInfo) {
    console.log(`🔍 Starting direct web search for: ${companyInfo.name || companyInfo.domain}`);
    
    const results = {
      emails: [],
      sources: [],
      timestamp: new Date().toISOString()
    };

    try {
      const domain = this.extractDomain(companyInfo.website || companyInfo.domain);
      const companyName = companyInfo.name || domain.replace(/\.(com|io|org|net)$/, '');

      // Step 1: Direct website scraping
      console.log(`🌐 Scraping company website: ${domain}`);
      const websiteEmails = await this.scrapeCompanyWebsite(companyInfo.website || `https://${domain}`);
      results.emails.push(...websiteEmails);
      if (websiteEmails.length > 0) {
        results.sources.push('company_website');
      }

      // Step 2: Search for contact pages and about pages
      console.log(`📄 Searching contact and about pages...`);
      const pageEmails = await this.searchContactPages(domain, companyName);
      results.emails.push(...pageEmails);
      if (pageEmails.length > 0) {
        results.sources.push('contact_pages');
      }

      // Step 3: Search engines for email mentions
      console.log(`🔎 Searching web for email mentions...`);
      const searchEmails = await this.searchWebForEmails(companyName, domain);
      results.emails.push(...searchEmails);
      if (searchEmails.length > 0) {
        results.sources.push('web_search');
      }

      // Step 4: GitHub and social media search
      console.log(`👥 Searching social platforms...`);
      const socialEmails = await this.searchSocialPlatforms(companyName, domain);
      results.emails.push(...socialEmails);
      if (socialEmails.length > 0) {
        results.sources.push('social_platforms');
      }

      // Step 5: News and press release search
      console.log(`📰 Searching news and press releases...`);
      const newsEmails = await this.searchNewsAndPress(companyName, domain);
      results.emails.push(...newsEmails);
      if (newsEmails.length > 0) {
        results.sources.push('news_press');
      }

      // Cleanup and deduplicate
      results.emails = this.cleanupAndRankEmails(results.emails, domain);
      
      console.log(`✅ Web search completed: ${results.emails.length} unique emails found`);
      return results;

    } catch (error) {
      console.error('❌ Web search failed:', error.message);
      return {
        emails: [],
        sources: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scrape company website directly
   */
  async scrapeCompanyWebsite(websiteUrl) {
    const emails = [];
    
    try {
      const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      
      console.log(`   📥 Fetching: ${url}`);
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: { 'User-Agent': this.userAgent }
      });

      const $ = cheerio.load(response.data);
      
      // Extract emails from page content
      const pageText = $.text();
      const htmlContent = response.data;
      
      // Find email patterns
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = [...pageText.match(emailRegex) || [], ...htmlContent.match(emailRegex) || []];
      
      // Find mailto links
      $('a[href^="mailto:"]').each((i, elem) => {
        const mailto = $(elem).attr('href');
        const email = mailto.replace('mailto:', '').split('?')[0];
        foundEmails.push(email);
      });

      // Process found emails
      for (const email of foundEmails) {
        if (this.isValidBusinessEmail(email)) {
          emails.push({
            email: email.toLowerCase(),
            source: 'website_main',
            title: this.guessRole(email),
            confidence: 90,
            verified: true
          });
        }
      }

      console.log(`   ✅ Found ${emails.length} emails on main website`);
      
    } catch (error) {
      console.log(`   ⚠️ Could not scrape website: ${error.message}`);
    }

    return emails;
  }

  /**
   * Search contact and about pages
   */
  async searchContactPages(domain, companyName) {
    const emails = [];
    const pages = [
      '/contact',
      '/contact-us',
      '/contactus',
      '/about',
      '/about-us',
      '/team',
      '/leadership',
      '/press',
      '/media',
      '/support',
      '/help'
    ];

    for (const page of pages) {
      try {
        const url = `https://${domain}${page}`;
        console.log(`   📄 Checking: ${page}`);
        
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': this.userAgent }
        });

        const $ = cheerio.load(response.data);
        const pageText = $.text();
        
        // Find emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = pageText.match(emailRegex) || [];
        
        // Find mailto links
        $('a[href^="mailto:"]').each((i, elem) => {
          const mailto = $(elem).attr('href');
          const email = mailto.replace('mailto:', '').split('?')[0];
          foundEmails.push(email);
        });

        for (const email of foundEmails) {
          if (this.isValidBusinessEmail(email) && email.includes(domain)) {
            emails.push({
              email: email.toLowerCase(),
              source: `website_${page.replace('/', '')}`,
              title: this.guessRole(email),
              confidence: 95,
              verified: true
            });
          }
        }

      } catch (error) {
        // Page doesn't exist or can't be accessed
      }
    }

    return emails;
  }

  /**
   * Search web using search engines
   */
  async searchWebForEmails(companyName, domain) {
    const emails = [];
    
    // Create search queries
    const queries = [
      `"${companyName}" email contact "@${domain}"`,
      `site:${domain} email contact`,
      `"${companyName}" "@${domain}" -password -login`,
      `"${companyName}" "contact us" email`,
      `"${companyName}" press media email`
    ];

    for (const query of queries.slice(0, 3)) { // Limit to 3 queries
      try {
        console.log(`   🔎 Searching: "${query}"`);
        
        // Try DuckDuckGo search
        const searchResults = await this.searchDuckDuckGo(query);
        
        // Extract emails from search results
        for (const result of searchResults) {
          const text = `${result.title} ${result.snippet}`;
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const foundEmails = text.match(emailRegex) || [];
          
          for (const email of foundEmails) {
            if (this.isValidBusinessEmail(email) && email.includes(domain)) {
              emails.push({
                email: email.toLowerCase(),
                source: 'web_search',
                title: this.guessRole(email),
                confidence: 75,
                verified: false
              });
            }
          }
        }

      } catch (error) {
        console.log(`   ⚠️ Search failed: ${error.message}`);
      }
    }

    return emails;
  }

  /**
   * Search DuckDuckGo (works without API)
   */
  async searchDuckDuckGo(query) {
    try {
      const response = await axios.get('https://duckduckgo.com/html', {
        params: { q: query },
        headers: { 
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Extract search results
      $('.result').each((i, elem) => {
        const title = $(elem).find('.result__title').text().trim();
        const snippet = $(elem).find('.result__snippet').text().trim();
        const url = $(elem).find('.result__url').attr('href');

        if (title && snippet) {
          results.push({ title, snippet, url });
        }
      });

      console.log(`   📊 Found ${results.length} search results`);
      return results.slice(0, 10); // Limit results
      
    } catch (error) {
      console.log(`   ⚠️ DuckDuckGo search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Search social platforms
   */
  async searchSocialPlatforms(companyName, domain) {
    const emails = [];
    
    try {
      // Search for GitHub organization
      console.log(`   🐙 Searching GitHub...`);
      const githubEmails = await this.searchGitHub(companyName, domain);
      emails.push(...githubEmails);
      
    } catch (error) {
      console.log(`   ⚠️ Social search failed: ${error.message}`);
    }

    return emails;
  }

  /**
   * Search GitHub for emails
   */
  async searchGitHub(companyName, domain) {
    const emails = [];
    
    try {
      // Search GitHub user/org pages
      const searchQuery = companyName.toLowerCase().replace(/\s+/g, '');
      const url = `https://github.com/${searchQuery}`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });

      const $ = cheerio.load(response.data);
      const pageText = $.text();
      
      // Look for emails in the page
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = pageText.match(emailRegex) || [];
      
      for (const email of foundEmails) {
        if (this.isValidBusinessEmail(email) && email.includes(domain)) {
          emails.push({
            email: email.toLowerCase(),
            source: 'github',
            title: 'Developer Contact',
            confidence: 80,
            verified: false
          });
        }
      }

    } catch (error) {
      // GitHub page doesn't exist or can't be accessed
    }

    return emails;
  }

  /**
   * Search news and press releases
   */
  async searchNewsAndPress(companyName, domain) {
    const emails = [];
    
    try {
      // Search for press releases with company name
      const query = `"${companyName}" press release email contact`;
      const searchResults = await this.searchDuckDuckGo(query);
      
      for (const result of searchResults.slice(0, 5)) {
        if (result.url && (result.url.includes('prnewswire') || 
                          result.url.includes('businesswire') || 
                          result.url.includes('reuters') ||
                          result.url.includes('bloomberg'))) {
          
          // This is a press release, might contain contact info
          const text = `${result.title} ${result.snippet}`;
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const foundEmails = text.match(emailRegex) || [];
          
          for (const email of foundEmails) {
            if (this.isValidBusinessEmail(email) && email.includes(domain)) {
              emails.push({
                email: email.toLowerCase(),
                source: 'press_release',
                title: 'Press Contact',
                confidence: 85,
                verified: false
              });
            }
          }
        }
      }

    } catch (error) {
      console.log(`   ⚠️ News search failed: ${error.message}`);
    }

    return emails;
  }

  /**
   * Helper methods
   */
  extractDomain(url) {
    if (!url) return '';
    
    // Handle object input - convert to string
    if (typeof url === 'object') {
      if (url.toString && url.toString() !== '[object Object]') {
        url = url.toString();
      } else {
        console.warn('⚠️ Invalid URL object passed to extractDomain:', url);
        return '';
      }
    }
    
    // Ensure url is a string
    if (typeof url !== 'string') {
      console.warn('⚠️ Invalid URL type passed to extractDomain:', typeof url, url);
      return '';
    }
    
    if (url.includes('@')) return url.split('@')[1];
    
    try {
      if (!url.startsWith('http')) url = `https://${url}`;
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  guessRole(email) {
    const prefix = email.split('@')[0].toLowerCase();
    
    const roleMap = {
      'info': 'Information',
      'contact': 'Contact',
      'hello': 'General Contact',
      'support': 'Customer Support',
      'sales': 'Sales',
      'marketing': 'Marketing',
      'press': 'Press Relations',
      'media': 'Media Relations',
      'partnerships': 'Business Development',
      'careers': 'Human Resources',
      'team': 'Team Contact',
      'admin': 'Administration',
      'ceo': 'CEO',
      'founder': 'Founder'
    };

    for (const [key, value] of Object.entries(roleMap)) {
      if (prefix.includes(key)) return value;
    }

    return 'Contact';
  }

  isValidBusinessEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;
    
    // Filter out personal emails
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com'
    ];
    
    const domain = email.split('@')[1];
    if (personalDomains.includes(domain)) return false;
    
    // Filter out spam emails
    const spamPatterns = ['noreply', 'no-reply', 'donotreply', 'do-not-reply'];
    const prefix = email.split('@')[0].toLowerCase();
    if (spamPatterns.some(spam => prefix.includes(spam))) return false;
    
    return true;
  }

  cleanupAndRankEmails(emails, targetDomain) {
    // Remove duplicates
    const seen = new Set();
    const unique = emails.filter(emailObj => {
      const key = emailObj.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Rank by confidence and source quality
    const ranked = unique.sort((a, b) => {
      // Prioritize verified emails
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      
      // Then by confidence
      return (b.confidence || 0) - (a.confidence || 0);
    });

    // Add final scores
    return ranked.map((emailObj, index) => ({
      ...emailObj,
      rank: index + 1,
      finalScore: Math.max(0, (emailObj.confidence || 50) - (index * 2))
    }));
  }
}

module.exports = SimplifiedWebEmailSearchEngine;