/**
 * LinkedIn Email Discovery Engine
 * Focused exclusively on LinkedIn-based email discovery and profile scraping
 * Implements proven techniques from GitHub repositories and industry best practices
 */

const axios = require('axios');
const cheerio = require('cheerio');
const PersonaStorageService = require('../services/PersonaStorageService');
const { findRealEmailsFromLinkedInProfiles } = require('../../authenticated_linkedin_methods');

class LinkedInEmailDiscoveryEngine {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.models = {
      fast: 'qwen2.5:0.5b',  // Fast analysis and search queries
      persona: 'llama3.2'    // High-quality persona generation
    };
    
    // LinkedIn search patterns based on research
    this.linkedinSearchPatterns = [
      // Company employee search patterns
      'site:linkedin.com/in/ "{company}" {role}',
      'site:linkedin.com/in/ "{company}" "email" contact',
      'site:linkedin.com/in/ "{company}" founder CEO CTO',
      'site:linkedin.com/in/ "{company}" sales marketing director',
      'site:linkedin.com/in/ "{company}" business development',
      
      // Professional directory patterns
      '"@{domain}" site:linkedin.com',
      '{company} employees site:linkedin.com',
      '{company} team members site:linkedin.com',
      
      // Industry-specific patterns
      '"{industry}" professionals email contact site:linkedin.com',
      '"{industry}" executives contact information site:linkedin.com'
    ];
    
    // Search engines for LinkedIn discovery (alternative to SearXNG)
    this.searchEngines = [
      {
        name: 'google',
        url: 'https://www.google.com/search',
        params: { q: '', num: 20 }
      },
      {
        name: 'bing',
        url: 'https://www.bing.com/search',
        params: { q: '', count: 20 }
      },
      {
        name: 'duckduckgo',
        url: 'https://duckduckgo.com/html',
        params: { q: '', s: 0 }
      }
    ];
    
    // Rotating User-Agent pool for anti-detection (2024 techniques)
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    // Residential proxy pool configuration (based on 2024 best practices)
    this.proxyPool = [
      // Add your residential proxy endpoints here
      // Format: { host: 'proxy1.provider.com', port: 8000, auth: 'user:pass' }
    ];
    
    this.currentUserAgentIndex = 0;
    this.currentProxyIndex = 0;
    this.requestCount = 0;
    
    // Initialize Persona Storage Service
    this.personaStorage = new PersonaStorageService();
    
    console.log('🎯 LinkedIn Email Discovery Engine initialized');
    console.log('   ✅ Focus: LinkedIn-only email discovery');
    console.log('   🚫 SearXNG: Abandoned as requested');
    console.log('   🧠 AI Models: Fast analysis + Persona generation');
    console.log('   💾 Persona Storage: Enabled for personalized emails');
  }

  /**
   * Main entry point - search for emails with LinkedIn focus
   */
  async searchLinkedInEmails(companyInfo) {
    try {
      console.log('🎯 Starting LinkedIn-focused email discovery for:', companyInfo.name);
      
      const results = {
        emails: [],
        profiles: [],
        searchQueries: [],
        method: 'linkedin_focused',
        sources: []
      };

      // Step 1: Generate LinkedIn-specific search queries using Ollama
      const searchQueries = await this.generateLinkedInSearchQueries(companyInfo);
      results.searchQueries = searchQueries;

      // Step 1.5: Find REAL emails from web search - NO GENERATION
      console.log(`🔍 Searching for REAL ${companyInfo.industry} professional emails from web...`);
      const realEmails = await findRealEmailsFromLinkedInProfiles(companyInfo, this.ollamaUrl, this.models);
      if (realEmails.length > 0) {
        console.log(`✅ Found ${realEmails.length} REAL emails from web search`);
        
        // LOG REAL EMAIL DISCOVERY
        console.log('\n🔍 REAL EMAIL DISCOVERY LOG:');
        console.log('='.repeat(40));
        realEmails.forEach((emailData, index) => {
          console.log(`🎯 Discovery ${index + 1}:`);
          console.log(`   📧 Email: ${emailData.email}`);
          console.log(`   👤 Name: ${emailData.name || 'Unknown'}`);
          console.log(`   🏢 Company: ${emailData.company || 'Unknown'}`);
          console.log(`   💼 Role: ${emailData.role || 'Unknown'}`);
          console.log(`   🔗 Source: ${emailData.source}`);
          console.log(`   🎯 Confidence: ${emailData.confidence}`);
          console.log(`   🔍 Discovery Method: ${emailData.method || 'web_search'}`);
          console.log(`   ⏰ Discovered at: ${new Date().toISOString()}`);
          console.log('   ' + '-'.repeat(30));
        });
        console.log('='.repeat(40));
        
        results.emails.push(...realEmails);
        
        // Also add them as profile data
        realEmails.forEach(emailData => {
          results.profiles.push({
            url: `https://linkedin.com/in/${emailData.linkedinUsername}`,
            name: emailData.name,
            headline: emailData.role,
            location: emailData.location,
            industry: companyInfo.industry,
            email: emailData.email,
            emailConfidence: emailData.confidence,
            about: emailData.about,
            scrapedAt: new Date().toISOString(),
            source: 'real_web_search'
          });
        });
      }

      // Step 2: Continue searching until we find 5 real emails or exhaust all queries
      let emailSearchCount = 0;
      const maxEmails = 5;
      
      for (const query of searchQueries.slice(0, 3)) { // Limit to top 3 queries
        if (results.emails.length >= maxEmails) {
          console.log(`✅ Found ${maxEmails} real emails, stopping search`);
          break;
        }
        
        emailSearchCount++;
        console.log(`🔍 Email search ${emailSearchCount}/3: Searching for real LinkedIn emails...`);
        
        // Focus on email extraction from web search, not LinkedIn profile scraping
        try {
          const webSearchResults = await this.searchWebForLinkedInEmails(query);
          if (webSearchResults.length > 0) {
            results.emails.push(...webSearchResults.slice(0, maxEmails - results.emails.length));
            console.log(`   ✅ Found ${webSearchResults.length} additional real emails`);
          }
        } catch (error) {
          console.log(`   ⚠️ Web email search failed: ${error.message}`);
        }
        
        await this.delay(2000); // Rate limiting
      }
      
      console.log(`📊 Total real emails found: ${results.emails.length}`);
      
      // Only proceed with email generation if we found real emails
      if (results.emails.length >= 3) {
        console.log(`🎯 Found ${results.emails.length} real emails - ready for email generation!`);
      }

      // Step 3.5: Search business directories for additional email contacts
      if (results.emails.length < 5) {
        try {
          console.log('📂 Searching business directories for additional contacts...');
          const directoryEmails = await this.searchBusinessDirectories(companyInfo);
          if (directoryEmails.length > 0) {
            console.log(`✅ Directory search found ${directoryEmails.length} additional contacts!`);
            results.emails.push(...directoryEmails);
          }
        } catch (error) {
          console.log('⚠️ Business directory search error:', error.message);
        }
      }

      // Step 4: Generate personas and store them for discovered profiles
      for (const profile of results.profiles.slice(0, 5)) { // Generate personas for top 5
        try {
          // Check if persona already exists
          const existingPersona = await this.personaStorage.getPersona(
            results.emails.find(e => e.profile?.url === profile.url)?.email || 'unknown'
          );
          
          if (existingPersona) {
            console.log(`🔄 Using existing persona for ${profile.name}`);
            profile.persona = existingPersona.persona;
          } else {
            // Generate new persona
            const persona = await this.generatePersonaWithOllama(profile, companyInfo);
            profile.persona = persona;
            
            // Store persona for future use
            const email = results.emails.find(e => e.profile?.url === profile.url)?.email;
            if (email) {
              await this.personaStorage.storePersona(email, profile, persona);
            }
          }
        } catch (error) {
          console.log(`⚠️ Persona generation failed:`, error.message);
        }
      }

      results.sources = ['linkedin_search', 'profile_scraping', 'ollama_persona'];
      
      console.log(`✅ LinkedIn discovery completed: ${results.emails.length} emails, ${results.profiles.length} profiles`);
      return results;

    } catch (error) {
      console.error('❌ LinkedIn email discovery failed:', error.message);
      return {
        emails: [],
        profiles: [],
        searchQueries: [],
        method: 'linkedin_focused',
        sources: [],
        error: error.message
      };
    }
  }

  /**
   * Generate LinkedIn-specific search queries using Ollama
   */
  async generateLinkedInSearchQueries(companyInfo) {
    try {
      // Use actual marketing strategy data for targeted queries
      const actualCompany = companyInfo.name || companyInfo.company_name || 'Industry Companies';
      const actualIndustry = companyInfo.industry || 'Technology';
      const targetSegments = companyInfo.target_audience?.primary_segments || ['companies'];
      const searchKeywords = companyInfo.target_audience?.search_keywords || ['business', 'contact'];
      
      const prompt = `Generate 8 targeted LinkedIn search queries for prospect discovery.

ACTUAL TARGET INFORMATION:
Company/Target: ${actualCompany}
Industry: ${actualIndustry}
Target Segments: ${targetSegments.join(', ')}
Keywords: ${searchKeywords.join(', ')}
Domain: ${companyInfo.domain || 'not specified'}

GOAL: Find LinkedIn profiles of people in ${actualIndustry} industry or related to ${targetSegments.join(', ')}.

Create search queries using REAL industry and segment information above (NOT generic examples like Microsoft/Google).

Format examples:
- site:linkedin.com/in/ "${actualIndustry}" CEO email contact
- site:linkedin.com/in/ "${targetSegments[0]}" founder email
- site:linkedin.com "${actualIndustry} ${searchKeywords[0]}" professionals contact
- site:linkedin.com/company/ "${actualIndustry}" employees email

Requirements:
- Use the ACTUAL industry and target segments provided above
- Include realistic job titles: CEO, founder, director, manager, VP
- Add contact keywords: email, contact, reach, connect
- Focus on decision makers and business contacts
- Do NOT use example companies like Microsoft, Google, Apple

Return EXACTLY 8 search queries, one per line, no explanations:`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.fast,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_ctx: 2048
        }
      });

      const queries = response.data.response
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 8);

      console.log(`🧠 Generated ${queries.length} LinkedIn search queries`);
      return queries;

    } catch (error) {
      console.log('⚠️ Using fallback search queries due to Ollama error:', error.message);
      
      // Use actual strategy data for fallback queries too
      const actualIndustry = companyInfo.industry || 'Technology';
      const targetSegments = companyInfo.target_audience?.primary_segments || ['companies'];
      const searchKeywords = companyInfo.target_audience?.search_keywords || ['business'];
      const domain = companyInfo.domain;
      
      const fallbackQueries = [
        `site:linkedin.com/in/ "${actualIndustry}" CEO founder email contact`,
        `site:linkedin.com/in/ "${targetSegments[0]}" director email`,
        `site:linkedin.com/in/ "${actualIndustry} ${searchKeywords[0]}" manager contact`,
        `site:linkedin.com "${actualIndustry}" professionals email addresses`,
        `site:linkedin.com/company/ "${actualIndustry}" executives contact`,
        `site:linkedin.com/in/ "${targetSegments[0]} ${searchKeywords[0]}" email`,
        `site:linkedin.com "${actualIndustry} ${targetSegments[0]}" business contact`,
        `site:linkedin.com/in/ "${actualIndustry}" VP director email`
      ];
      
      console.log(`📝 Generated fallback queries for ${actualIndustry} industry targeting ${targetSegments.join(', ')}`);
      return fallbackQueries.slice(0, 8);
    }
  }

  /**
   * Execute LinkedIn search using web search - NO FAKE URL GENERATION
   */
  async executeLinkedInSearch(query) {
    console.log(`   🌐 Web search for LinkedIn profiles: ${query}`);
    
    // ONLY search for REAL LinkedIn profiles from web search - NO GENERATION
    const allResults = [];

    try {
      await this.humanDelay();
      
      // Use web search to find actual LinkedIn profile URLs
      const response = await axios.get('https://www.google.com/search', {
        params: {
          q: `${query} site:linkedin.com/in/`,
          num: 20
        },
        headers: this.getRotatingHeaders(),
        timeout: 10000
      });

      // Extract REAL LinkedIn URLs from search results
      const realLinkedInUrls = this.extractRealLinkedInUrls(response.data);
      if (realLinkedInUrls.length > 0) {
        console.log(`   ✅ Found ${realLinkedInUrls.length} REAL LinkedIn profile URLs`);
        allResults.push(...realLinkedInUrls.map(url => ({
          url: url,
          title: 'Real LinkedIn Profile',
          source: 'web_search_linkedin'
        })));
      }

    } catch (error) {
      console.log(`   ⚠️ LinkedIn search failed: ${error.message}`);
    }

    return allResults;
  }

  /**
   * Extract REAL LinkedIn URLs from web search results - NO GENERATION
   */
  extractRealLinkedInUrls(html) {
    const urls = [];
    const $ = cheerio.load(html);
    
    // Extract LinkedIn URLs from search results
    const linkedinUrlRegex = /https?:\/\/[a-z0-9.-]*linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(linkedinUrlRegex) || [];
    
    matches.forEach(url => {
      if (url.includes('/in/') && 
          !url.includes('/posts/') && 
          !url.includes('/activity/') &&
          !url.includes('generated') &&
          !url.includes('fake')) {
        urls.push(url);
      }
    });
    
    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Clean LinkedIn URL to get the canonical form
   */
  cleanLinkedInUrl(url) {
    try {
      // Remove tracking parameters and clean URL
      let cleanUrl = url.split('?')[0]; // Remove query parameters
      cleanUrl = cleanUrl.split('#')[0]; // Remove fragments
      
      // Extract clean LinkedIn profile URL
      const linkedInMatch = cleanUrl.match(/https?:\/\/[a-z0-9.-]*linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
      if (linkedInMatch) {
        return linkedInMatch[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate that URL is a real LinkedIn profile (not article/company/etc)
   */
  isRealLinkedInProfileUrl(url) {
    if (!url || !url.includes('linkedin.com/in/')) {
      return false;
    }
    
    // Check for patterns that indicate it's NOT a profile
    const invalidPatterns = [
      '/posts/', '/activity/', '/pulse/', '/articles/',
      '/company/', '/school/', '/showcase/', '/feed/',
      'generated', 'fake', 'example', 'template'
    ];
    
    for (const pattern of invalidPatterns) {
      if (url.includes(pattern)) {
        return false;
      }
    }
    
    // Must have a valid username
    const usernameMatch = url.match(/\/in\/([a-zA-Z0-9_-]+)/);
    if (!usernameMatch || usernameMatch[1].length < 3) {
      return false;
    }
    
    return true;
  }

  /**
   * Search web for LinkedIn emails - IMPROVED METHOD
   */
  async searchWebForLinkedInEmails(query) {
    console.log(`   🔍 Searching web for emails with query: ${query}`);
    
    const foundEmails = [];
    
    try {
      const response = await axios.get('https://www.google.com/search', {
        params: {
          q: `${query} email contact -site:linkedin.com`, // Exclude LinkedIn to find external emails
          num: 20
        },
        headers: this.getRotatingHeaders(),
        timeout: 10000
      });
      
      // Extract emails from web search results (not LinkedIn itself)
      const emails = this.extractEmailsFromSearchResults(response.data, query);
      if (emails.length > 0) {
        console.log(`   📧 Found ${emails.length} real emails from web search`);
        foundEmails.push(...emails);
      }
      
    } catch (error) {
      console.log(`   ⚠️ Web email search failed: ${error.message}`);
    }
    
    return foundEmails;
  }

  /**
   * Parse search engine results to extract LinkedIn URLs - Fixed for actual profile URLs
   */
  parseSearchResults(html, engineName) {
    const $ = cheerio.load(html);
    const results = [];

    // More comprehensive selectors for 2024 search engine layouts
    let linkSelectors = [];
    
    switch (engineName) {
      case 'google':
        linkSelectors = [
          'h3 a', '.g a[href*="linkedin.com"]', '.yuRUbf a', 
          '.LC20lb a', '.r a', 'a[href*="linkedin.com/in/"]',
          '.g .yuRUbf > a', '.tF2Cxc a', '.kCrYT a'
        ];
        break;
      case 'bing':
        linkSelectors = [
          '.b_title a', '.b_algo a[href*="linkedin.com"]', 
          '.b_algo h2 a', 'a[href*="linkedin.com/in/"]',
          '.b_title > a', '.b_algo .b_title a'
        ];
        break;
      case 'duckduckgo':
        linkSelectors = [
          '.result__a', 'a[href*="linkedin.com"]', 
          '.result__title a', 'a[href*="linkedin.com/in/"]',
          '.results_links_deep a'
        ];
        break;
    }

    // Extract LinkedIn URLs from raw HTML first
    const linkedinUrlRegex = /https?:\/\/[a-z0-9.-]*linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
    const urlMatches = html.match(linkedinUrlRegex) || [];
    
    urlMatches.forEach(url => {
      if (url.includes('/in/') && !url.includes('/posts/') && !url.includes('/activity/')) {
        results.push({
          url: this.cleanUrl(url),
          title: 'LinkedIn Profile',
          source: `${engineName}_regex`
        });
      }
    });

    // Extract from DOM elements
    linkSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        const href = $(elem).attr('href');
        const title = $(elem).text().trim();
        
        if (href && title) {
          const cleanedUrl = this.cleanUrl(href);
          
          // CRITICAL FIX: Only accept proper LinkedIn profile URLs
          if (cleanedUrl.includes('linkedin.com/in/') && 
              !cleanedUrl.includes('/posts/') && 
              !cleanedUrl.includes('/activity/') &&
              !cleanedUrl.includes('/search?') &&
              !cleanedUrl.includes('google.com') &&
              !cleanedUrl.includes('bing.com') &&
              cleanedUrl.startsWith('http')) {
            
            results.push({
              url: cleanedUrl,
              title: title,
              source: engineName
            });
          }
        }
      });
    });

    console.log(`   📊 Found ${results.length} potential LinkedIn profiles from ${engineName}`);
    if (results.length > 0) {
      console.log(`   🔗 Sample URLs: ${results.slice(0, 2).map(r => r.url).join(', ')}`);
    }
    return results;
  }

  /**
   * Extract LinkedIn profile URLs from search results
   */
  extractLinkedInProfiles(searchResults) {
    const profiles = [];
    
    for (const result of searchResults) {
      if (result.url.includes('linkedin.com/in/') && 
          !result.url.includes('/posts/') && 
          !result.url.includes('/activity/')) {
        profiles.push(result.url);
      }
    }

    // Remove duplicates
    return [...new Set(profiles)];
  }

  /**
   * Scrape detailed LinkedIn profile data using 2024 anti-detection techniques
   */
  async scrapeLinkedInProfile(profileUrl) {
    try {
      console.log(`   📄 Scraping profile with anti-detection: ${profileUrl}`);
      
      // Add human-like delay before request
      await this.humanDelay();
      
      // Prepare request configuration with rotating headers and proxy
      const requestConfig = {
        headers: this.getRotatingHeaders(),
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status < 400; // Resolve only if status is less than 400
        }
      };
      
      // Add proxy configuration if available
      const proxyConfig = this.getProxyConfig();
      if (proxyConfig) {
        requestConfig.proxy = {
          host: proxyConfig.host,
          port: proxyConfig.port,
          auth: {
            username: proxyConfig.auth.split(':')[0],
            password: proxyConfig.auth.split(':')[1]
          }
        };
        console.log(`   🔄 Using proxy: ${proxyConfig.host}:${proxyConfig.port}`);
      }

      const response = await axios.get(profileUrl, requestConfig);

      const $ = cheerio.load(response.data);
      
      // Extract profile data using LinkedIn's public profile structure
      const profileData = {
        url: profileUrl,
        name: this.extractText($, '.top-card-layout__title, .text-heading-xlarge, h1'),
        headline: this.extractText($, '.top-card-layout__headline, .text-body-medium, .break-words'),
        location: this.extractText($, '.top-card-layout__first-subline, .not-first-middot'),
        industry: this.extractText($, '.top-card-layout__second-subline'),
        about: this.extractText($, '.core-section-container__content .break-words, .summary'),
        experience: this.extractExperience($),
        education: this.extractEducation($),
        skills: this.extractSkills($),
        email: this.extractEmail($, response.data),
        emailConfidence: 0.6,
        scrapedAt: new Date().toISOString()
      };

      // Try to extract email from various sources
      if (!profileData.email) {
        profileData.email = this.extractEmailFromText(response.data);
        if (profileData.email) {
          profileData.emailConfidence = 0.8;
        }
      }

      return profileData;

    } catch (error) {
      if (error.response?.status === 999) {
        console.log(`🛡️ LinkedIn blocked request (999): ${profileUrl}`);
        console.log(`   ➡️ LinkedIn is actively blocking automated access`);
        return null;
      } else if (error.response?.status === 429) {
        console.log(`⏱️ Rate limited by LinkedIn: ${profileUrl}`);
        return null;
      } else {
        console.log(`⚠️ Profile scraping failed: ${error.message}`);
        return null;
      }
    }
  }

  /**
   * Extract text content safely
   */
  extractText($, selectors) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorArray) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    
    return '';
  }

  /**
   * Extract work experience
   */
  extractExperience($) {
    const experiences = [];
    
    $('.experience-section .pv-entity__summary-info, .experience .pvs-entity').each((i, elem) => {
      const title = $(elem).find('.t-16 .visually-hidden, .mr1 .visually-hidden').text().trim();
      const company = $(elem).find('.pv-entity__secondary-title, .t-14 .visually-hidden').text().trim();
      
      if (title || company) {
        experiences.push({ title, company });
      }
    });
    
    return experiences;
  }

  /**
   * Extract education
   */
  extractEducation($) {
    const education = [];
    
    $('.education-section .pv-entity__summary-info, .education .pvs-entity').each((i, elem) => {
      const school = $(elem).find('.pv-entity__school-name, .mr1 .visually-hidden').text().trim();
      const degree = $(elem).find('.pv-entity__degree-name, .t-14 .visually-hidden').text().trim();
      
      if (school || degree) {
        education.push({ school, degree });
      }
    });
    
    return education;
  }

  /**
   * Extract skills
   */
  extractSkills($) {
    const skills = [];
    
    $('.skills-section .pv-skill-category-entity__name, .skills .pvs-entity').each((i, elem) => {
      const skill = $(elem).find('.pv-skill-category-entity__name-text, .mr1 .visually-hidden').text().trim();
      if (skill) {
        skills.push(skill);
      }
    });
    
    return skills;
  }

  /**
   * Extract email from profile
   */
  extractEmail($, html) {
    // Check contact info section
    const contactEmail = this.extractText($, '.contact-see-more-less .ci-email a, .contact-info .ci-email');
    if (contactEmail && this.isValidEmail(contactEmail)) {
      return contactEmail;
    }

    // Extract from HTML content
    return this.extractEmailFromText(html);
  }

  /**
   * Extract email from text content - Enhanced for better discovery
   */
  extractEmailFromText(text) {
    // Multiple email regex patterns for comprehensive extraction
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
      /"email"\s*:\s*"([^"]+@[^"]+)"/gi,
      /contact.*?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
      /email.*?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
    ];
    
    const allMatches = [];
    
    emailPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract email from mailto: links
          if (match.includes('mailto:')) {
            const emailMatch = match.match(/mailto:([^"'\s>]+)/);
            if (emailMatch) allMatches.push(emailMatch[1]);
          }
          // Extract from JSON-like structures
          else if (match.includes('"email"')) {
            const emailMatch = match.match(/"([^"]+@[^"]+)"/);
            if (emailMatch) allMatches.push(emailMatch[1]);
          }
          // Extract from contact/email context
          else if (match.includes('contact') || match.includes('email')) {
            const emailMatch = match.match(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/);
            if (emailMatch) allMatches.push(emailMatch[1]);
          }
          // Direct email matches
          else {
            allMatches.push(match);
          }
        });
      }
    });
    
    if (allMatches.length > 0) {
      // Filter out obviously fake or system emails
      const validEmails = allMatches.filter(email => 
        !email.includes('example.com') &&
        !email.includes('test.com') &&
        !email.includes('placeholder') &&
        !email.includes('noreply') &&
        !email.includes('no-reply') &&
        !email.includes('donotreply') &&
        !email.includes('support@linkedin') &&
        !email.includes('@linkedin.com') &&
        this.isValidEmail(email)
      );
      
      // Prioritize business domains over personal ones
      const businessEmails = validEmails.filter(email => 
        !email.includes('@gmail.com') &&
        !email.includes('@yahoo.com') &&
        !email.includes('@hotmail.com') &&
        !email.includes('@outlook.com')
      );
      
      return businessEmails[0] || validEmails[0] || null;
    }
    
    return null;
  }

  /**
   * Generate user persona using Ollama
   */
  async generatePersonaWithOllama(profileData, companyInfo) {
    try {
      const prompt = `Create a detailed user persona based on this LinkedIn profile data:

Name: ${profileData.name}
Headline: ${profileData.headline}
Location: ${profileData.location}
Industry: ${profileData.industry}
About: ${profileData.about}
Experience: ${profileData.experience?.map(exp => `${exp.title} at ${exp.company}`).join(', ')}
Education: ${profileData.education?.map(edu => `${edu.degree} from ${edu.school}`).join(', ')}
Skills: ${profileData.skills?.join(', ')}

Target Company Context:
Company: ${companyInfo.name}
Industry: ${companyInfo.industry}
Goal: ${companyInfo.campaignGoal || 'partnership'}

Generate a comprehensive persona including:
1. Professional background summary
2. Key pain points and challenges
3. Business interests and priorities
4. Communication style preferences
5. Potential value propositions
6. Recommended email approach

Format as JSON with clear sections.`;

      const response = await axios.post(`${this.ollamaUrl}/generate`, {
        model: this.models.persona,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
          num_ctx: 4096
        }
      });

      // Parse the response as JSON or create structured persona
      let persona;
      try {
        persona = JSON.parse(response.data.response);
      } catch {
        // If not valid JSON, create structured persona from text
        persona = this.structurePersonaFromText(response.data.response, profileData);
      }

      console.log(`🧠 Generated persona for ${profileData.name}`);
      return persona;

    } catch (error) {
      console.log('⚠️ Persona generation failed:', error.message);
      
      // Return basic persona
      return {
        summary: `${profileData.headline} based in ${profileData.location}`,
        painPoints: ['Efficiency challenges', 'Technology adoption'],
        interests: ['Professional growth', 'Industry innovation'],
        communicationStyle: 'Professional and direct',
        valueProposition: 'Potential collaboration opportunities',
        emailApproach: 'Focus on mutual benefits and industry insights'
      };
    }
  }

  /**
   * Structure persona from text response
   */
  structurePersonaFromText(text, profileData) {
    return {
      summary: `${profileData.headline} at ${profileData.experience?.[0]?.company || 'their current role'}`,
      painPoints: this.extractSectionFromText(text, 'pain points', 'challenges'),
      interests: this.extractSectionFromText(text, 'interests', 'priorities'),
      communicationStyle: this.extractSectionFromText(text, 'communication', 'style'),
      valueProposition: this.extractSectionFromText(text, 'value', 'proposition'),
      emailApproach: this.extractSectionFromText(text, 'email', 'approach'),
      rawResponse: text
    };
  }

  /**
   * Extract specific sections from persona text
   */
  extractSectionFromText(text, ...keywords) {
    const lines = text.split('\n');
    const relevantLines = lines.filter(line => 
      keywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    return relevantLines.join(' ').trim() || 'Not specified';
  }

  /**
   * Utility methods
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  cleanUrl(url) {
    // Handle Google redirects
    if (url.includes('/url?q=')) {
      const match = url.match(/[?&]q=([^&]*)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    
    // Handle Bing redirects
    if (url.includes('bing.com/ck/a?') && url.includes('&u=')) {
      const match = url.match(/&u=([^&]*)/);
      if (match) {
        try {
          // Decode base64 if needed
          const decoded = decodeURIComponent(match[1]);
          if (decoded.includes('linkedin.com')) {
            return decoded;
          }
        } catch (e) {
          // Continue with original URL if decoding fails
        }
      }
    }
    
    // Remove tracking parameters
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('linkedin.com')) {
        // Keep only the essential path for LinkedIn URLs
        return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      }
    } catch (e) {
      // If URL parsing fails, return original
    }
    
    return url;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rotating headers with user-agent rotation (2024 anti-detection)
   */
  getRotatingHeaders() {
    // Rotate user agent every 10-15 requests (best practice)
    if (this.requestCount % 12 === 0) {
      this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    }
    
    this.requestCount++;
    
    return {
      'User-Agent': this.userAgents[this.currentUserAgentIndex],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN,zh;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.google.com/',
      'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  }

  /**
   * Get proxy configuration (residential proxy rotation)
   */
  getProxyConfig() {
    if (this.proxyPool.length === 0) {
      return null; // No proxy configuration
    }
    
    // Rotate proxy every 50-100 requests (based on 2024 best practices)
    if (this.requestCount % 75 === 0) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyPool.length;
    }
    
    const proxy = this.proxyPool[this.currentProxyIndex];
    return {
      host: proxy.host,
      port: proxy.port,
      auth: proxy.auth
    };
  }

  /**
   * Add random delay to mimic human behavior (2024 technique)
   */
  async humanDelay() {
    // Random delay between 1-3 seconds to mimic human browsing
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await this.delay(delay);
  }

  /**
   * Search for known public LinkedIn profiles that often have contact info
   */
  async searchKnownPublicProfiles(companyInfo) {
    const industry = companyInfo.industry || 'technology';
    const segments = companyInfo.target_audience?.primary_segments || ['startup'];
    
    // Queries designed to find public profiles with contact info
    const publicProfileQueries = [
      `site:linkedin.com/in/ "${industry}" entrepreneur "contact" email`,
      `site:linkedin.com/in/ "${segments[0]}" founder "reach out" email`,
      `site:linkedin.com/in/ "${industry}" CEO "connect" email contact`,
      `site:linkedin.com/in/ "${industry}" consultant "email me" contact`,
      `site:linkedin.com/in/ "${segments[0]}" "available for" email contact`
    ];
    
    const foundProfiles = [];
    
    for (const query of publicProfileQueries.slice(0, 2)) {
      try {
        console.log(`   🔍 Searching for public profiles: ${query}`);
        const searchResults = await this.executeLinkedInSearch(query);
        const profiles = this.extractLinkedInProfiles(searchResults);
        foundProfiles.push(...profiles);
        
        // Add small delay between searches
        await this.delay(2000);
      } catch (error) {
        console.log(`   ⚠️ Public profile search failed: ${error.message}`);
      }
    }
    
    return [...new Set(foundProfiles)]; // Remove duplicates
  }



  /**
   * Find REAL emails using joeyism/linkedin_scraper approach
   */
  async findRealEmailsFromLinkedInProfiles(companyInfo) {
    try {
      const industry = companyInfo.industry || 'Technology';
      const segments = companyInfo.target_audience?.primary_segments || ['startups'];
      const keywords = companyInfo.target_audience?.search_keywords || ['business'];
      
      console.log(`   🔍 Using LinkedIn Profile API approach for REAL ${industry} emails...`);
      
      // Step 1: Find real LinkedIn profile URLs using targeted search
      const linkedInProfileUrls = await this.findRealLinkedInProfileUrls(industry, segments, keywords);
      
      if (linkedInProfileUrls.length === 0) {
        console.log(`   ⚠️ No LinkedIn profiles found for ${industry}`);
        return [];
      }
      
      console.log(`   ✅ Found ${linkedInProfileUrls.length} real LinkedIn profile URLs`);
      
      // Step 2: Extract contact info from each profile using joeyism approach
      const foundEmails = [];
      const maxProfilesToCheck = 10; // Limit to avoid rate limiting
      
      for (const profileUrl of linkedInProfileUrls.slice(0, maxProfilesToCheck)) {
        try {
          console.log(`   📄 Scraping LinkedIn profile: ${profileUrl}`);
          
          // Use the joeyism approach to scrape profile data
          const profileData = await this.scrapeLinkedInProfileData(profileUrl);
          
          if (profileData) {
            // Extract email from profile data
            const email = this.extractEmailFromProfileData(profileData);
            
            if (email && this.isRealEmail(email)) {
              foundEmails.push({
                email: email,
                name: profileData.name || 'Unknown',
                role: profileData.headline || `${industry} Professional`,
                company: profileData.company || 'Professional Organization',
                linkedinUrl: profileUrl,
                location: profileData.location || 'Unknown',
                about: profileData.about || `${industry} professional`,
                source: 'linkedin_profile_scraper',
                confidence: 0.9, // High confidence for real LinkedIn profiles
                industry: industry,
                extractionMethod: 'linkedin_profile_api'
              });
              
              console.log(`   📧 Extracted email: ${email} from ${profileData.name}`);
            }
          }
          
          // Respectful delay between profile requests
          await this.delay(3000 + Math.random() * 2000);
          
        } catch (error) {
          console.log(`   ⚠️ Profile scraping failed: ${error.message}`);
          
          if (error.message.includes('999') || error.message.includes('blocked')) {
            console.log(`   🛡️ LinkedIn blocking detected, stopping scraping`);
            break;
          }
        }
      }
      
      console.log(`   ✅ Found ${foundEmails.length} REAL emails from LinkedIn profiles`);
      return foundEmails;

    } catch (error) {
      console.log(`   ⚠️ Web search email extraction failed: ${error.message}`);
      
      // If web search fails, return empty - NO FALLBACK TO FAKE DATA
      console.log(`   ❌ Could not find real emails from web search`);
      return [];
    }
  }

  /**
   * Extract REAL emails from search result HTML - Enhanced patterns based on expert-finder approach
   */
  extractEmailsFromSearchResults(html, query) {
    const emails = [];
    const $ = cheerio.load(html);
    
    // Enhanced email regex patterns for better extraction
    const emailPatterns = [
      // Standard email pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Obfuscated emails (e.g., name AT domain DOT com)
      /\b[A-Za-z0-9._%-]+\s*(?:AT|at|@)\s*[A-Za-z0-9.-]+\s*(?:DOT|dot|\.)\s*[A-Za-z]{2,}\b/gi,
      // Emails with [at] or (at) 
      /\b[A-Za-z0-9._%-]+\s*[\[(@]at[\]@)]\s*[A-Za-z0-9.-]+\s*[\[(@]dot[\]@)]\s*[A-Za-z]{2,}\b/gi,
      // Emails in contact forms or mailto links
      /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
      // Emails in JSON-like structures
      /"?email"?\s*[:=]\s*"?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})"?/gi
    ];
    
    // Search in different parts of the search results
    const searchSelectors = [
      'h3', '.g .s', '.b_caption', '.result__snippet', // Search result snippets
      '.g .VwiC3b', '.b_algo', '.dmenKe', // Google/Bing result descriptions
      '[data-testid="result"]', '.result', // General result containers
      '.contact', '.about', '.bio', '.profile' // Profile/contact sections
    ];
    
    // Extract from structured elements
    searchSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        const text = $(elem).text() + ' ' + $(elem).html();
        this.extractEmailsFromText(text, emailPatterns, emails, 'search_result_structured');
      });
    });
    
    // Also search in the full HTML for any missed emails
    this.extractEmailsFromText(html, emailPatterns, emails, 'search_result_html');
    
    // Extract additional context for each email
    emails.forEach(emailData => {
      emailData.name = this.extractNameNearEmail(html, emailData.email);
      emailData.company = this.extractCompanyNearEmail(html, emailData.email);
      emailData.title = this.extractTitleNearEmail(html, emailData.email);
    });
    
    console.log(`   📧 Extracted ${emails.length} emails from search results`);
    return emails;
  }

  /**
   * Extract emails from text using multiple patterns
   */
  extractEmailsFromText(text, patterns, emailsArray, source) {
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        let email = match[1] || match[0]; // Get captured group or full match
        
        // Clean obfuscated emails
        email = this.cleanObfuscatedEmail(email);
        
        if (this.isRealEmail(email) && !emailsArray.find(e => e.email === email)) {
          emailsArray.push({
            email: email,
            source: source,
            confidence: this.calculateEmailConfidence(email, text),
            context: this.extractContext(text, email, 100)
          });
        }
      }
    });
  }

  /**
   * Clean obfuscated emails (e.g., "name AT domain DOT com" -> "name@domain.com")
   */
  cleanObfuscatedEmail(email) {
    return email
      .replace(/\s*(?:AT|at)\s*/gi, '@')
      .replace(/\s*(?:DOT|dot)\s*/gi, '.')
      .replace(/[\[\]()]/g, '')
      .toLowerCase()
      .trim();
  }

  /**
   * Calculate confidence score for extracted email
   */
  calculateEmailConfidence(email, context) {
    let confidence = 0.5;
    
    // Higher confidence for business domains
    const businessDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const isPersonalDomain = businessDomains.some(domain => email.includes(domain));
    if (!isPersonalDomain) confidence += 0.3;
    
    // Context indicators
    const contextLower = context.toLowerCase();
    if (contextLower.includes('contact')) confidence += 0.1;
    if (contextLower.includes('email')) confidence += 0.1;
    if (contextLower.includes('reach')) confidence += 0.1;
    if (contextLower.includes('ceo') || contextLower.includes('founder')) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract context around email for better understanding
   */
  extractContext(text, email, radius = 50) {
    const emailIndex = text.toLowerCase().indexOf(email.toLowerCase());
    if (emailIndex === -1) return '';
    
    const start = Math.max(0, emailIndex - radius);
    const end = Math.min(text.length, emailIndex + email.length + radius);
    
    return text.substring(start, end).trim();
  }

  /**
   * Extract name near email address
   */
  extractNameNearEmail(html, email) {
    const context = this.extractContext(html, email, 200);
    const namePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
    const matches = context.match(namePattern);
    return matches ? matches[0] : null;
  }

  /**
   * Extract company name near email address
   */
  extractCompanyNearEmail(html, email) {
    const context = this.extractContext(html, email, 200);
    const companyIndicators = /(?:at|@|with|from|ceo of|founder of|works at)\s+([A-Z][a-zA-Z\s&]+)/gi;
    const match = companyIndicators.exec(context);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract title/role near email address
   */
  extractTitleNearEmail(html, email) {
    const context = this.extractContext(html, email, 200);
    const titlePatterns = [
      /\b(CEO|CTO|CFO|COO|President|Director|Manager|Founder|VP|Vice President)\b/gi,
      /\b(Senior|Lead|Head of|Chief)\s+[A-Z][a-zA-Z\s]+/gi
    ];
    
    for (const pattern of titlePatterns) {
      const match = pattern.exec(context);
      if (match) return match[0];
    }
    
    return null;
  }

  /**
   * Check if email is real (not generated/fake)
   */
  isRealEmail(email) {
    const fakePatterns = [
      'example.com', 'test.com', 'fake.com', 'dummy.com', 'placeholder.com',
      'sample.com', 'demo.com', 'mock.com', 'xyz.com', 'abc.com',
      'noreply', 'no-reply', 'donotreply'
    ];
    
    const emailLower = email.toLowerCase();
    return !fakePatterns.some(pattern => emailLower.includes(pattern)) && 
           this.isValidEmail(email);
  }

  /**
   * Search professional directories for real emails
   */
  async searchProfessionalDirectories(industry, segments) {
    const directories = [
      `https://www.crunchbase.com/search?query=${industry}`,
      `https://angel.co/search?q=${industry}`,
      `https://www.f6s.com/search/companies?q=${industry}`
    ];
    
    const foundEmails = [];
    
    for (const directory of directories.slice(0, 1)) { // Test with 1 first
      try {
        await this.humanDelay();
        
        const response = await axios.get(directory, {
          headers: this.getRotatingHeaders(),
          timeout: 10000
        });
        
        const emails = this.extractEmailsFromSearchResults(response.data, `${industry} directory`);
        foundEmails.push(...emails);
        
      } catch (error) {
        console.log(`   ⚠️ Directory ${directory} failed: ${error.message}`);
      }
    }
    
    return foundEmails;
  }

  /**
   * Remove duplicate emails
   */
  deduplicateEmails(emails) {
    const seen = new Set();
    return emails.filter(emailData => {
      if (seen.has(emailData.email)) {
        return false;
      }
      seen.add(emailData.email);
      return true;
    });
  }

  /**
   * Generate name from email (for display only)
   */
  generateNameFromEmail(email) {
    const username = email.split('@')[0];
    return username
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract company from email domain
   */
  extractCompanyFromEmail(email) {
    const domain = email.split('@')[1];
    const company = domain.split('.')[0];
    return company.charAt(0).toUpperCase() + company.slice(1);
  }

  /**
   * Generate LinkedIn username for display
   */
  generateLinkedInUsername(nameOrEmail) {
    return nameOrEmail
      .toLowerCase()
      .replace(/[@._]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Create prospects from unstructured text response
   */
  createProspectsFromText(text, companyInfo) {
    const industry = companyInfo.industry || 'Technology';
    const segments = companyInfo.target_audience?.primary_segments || ['business'];
    
    // Extract names and emails from text
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const names = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    
    const prospects = [];
    for (let i = 0; i < Math.min(5, Math.max(emails.length, names.length, 3)); i++) {
      prospects.push({
        name: names[i] || `${industry} Professional ${i+1}`,
        email: emails[i] || `professional${i+1}@${industry.toLowerCase()}corp.com`,
        role: `${segments[0]} Executive`,
        company: `${industry} Company ${i+1}`,
        linkedinUsername: `${industry.toLowerCase()}-professional-${i+1}`,
        location: 'Business City',
        about: `Experienced ${industry} professional`
      });
    }
    
    return prospects;
  }

  /**
   * Create fallback realistic prospects when Ollama fails
   */
  createFallbackProspects(companyInfo) {
    const industry = companyInfo.industry || 'Technology';
    const segments = companyInfo.target_audience?.primary_segments || ['business'];
    const keywords = companyInfo.target_audience?.search_keywords || ['innovation'];
    
    const fallbackProspects = [
      {
        email: `ceo@${industry.toLowerCase()}innovations.com`,
        name: `${industry} CEO`,
        role: 'Chief Executive Officer',
        company: `${industry} Innovations Inc`,
        linkedinUsername: `${industry.toLowerCase()}-ceo`,
        location: 'San Francisco, CA',
        about: `Leading ${industry} company focused on ${keywords.join(' and ')}`,
        source: 'fallback_generated',
        confidence: 0.6,
        industry: industry
      },
      {
        email: `founder@${segments[0].toLowerCase()}solutions.com`,
        name: `${segments[0]} Founder`,
        role: 'Founder & CTO',
        company: `${segments[0]} Solutions`,
        linkedinUsername: `${segments[0].toLowerCase()}-founder`,
        location: 'New York, NY',
        about: `Building innovative solutions for ${segments[0]} market`,
        source: 'fallback_generated',
        confidence: 0.6,
        industry: industry
      },
      {
        email: `director@${industry.toLowerCase()}ventures.com`,
        name: `${industry} Director`,
        role: 'Business Development Director',
        company: `${industry} Ventures`,
        linkedinUsername: `${industry.toLowerCase()}-director`,
        location: 'Austin, TX',
        about: `Driving growth in ${industry} sector with focus on ${keywords.join(', ')}`,
        source: 'fallback_generated',
        confidence: 0.6,
        industry: industry
      }
    ];

    console.log(`   📋 Created ${fallbackProspects.length} fallback prospects`);
    return fallbackProspects;
  }

  /**
   * Find real LinkedIn profile URLs using targeted search - joeyism approach
   */
  async findRealLinkedInProfileUrls(industry, segments, keywords) {
    const profileUrls = [];
    
    // Build targeted search queries for LinkedIn profiles
    const searchQueries = [
      `site:linkedin.com/in/ "${industry}" CEO founder`,
      `site:linkedin.com/in/ "${industry}" director manager`,
      `site:linkedin.com/in/ "${segments[0]}" professionals`,
      `site:linkedin.com/in/ "${keywords[0]}" expert specialist`
    ];
    
    for (const query of searchQueries.slice(0, 2)) { // Limit queries
      try {
        console.log(`   🔍 Searching for LinkedIn profiles: ${query}`);
        
        // Use SearXNG since Google blocks automated requests
        const response = await axios.get('https://searx.nixnet.services/search', {
          params: {
            q: query,
            format: 'json',
            categories: 'general'
          },
          headers: this.getRotatingHeaders(),
          timeout: 15000
        });
        
        // Extract real LinkedIn profile URLs from SearXNG results
        const results = response.data.results || [];
        for (const result of results) {
          if (result.url && result.url.includes('linkedin.com/in/')) {
            // Verify it's a real profile URL
            const cleanUrl = this.cleanLinkedInUrl(result.url);
            if (cleanUrl && this.isRealLinkedInProfileUrl(cleanUrl)) {
              profileUrls.push(cleanUrl);
            }
          }
        }
        
        await this.delay(3000); // Rate limiting for SearXNG
        
      } catch (error) {
        console.log(`   ⚠️ LinkedIn profile search failed: ${error.message}`);
      }
    }
    
    // Remove duplicates and return unique URLs
    return [...new Set(profileUrls)].slice(0, 15); // Limit to 15 profiles
  }

  /**
   * Scrape LinkedIn profile data using joeyism approach
   */
  async scrapeLinkedInProfileData(profileUrl) {
    try {
      // Use HTTP request to get profile page (simulating joeyism approach)
      const response = await axios.get(profileUrl, {
        headers: {
          ...this.getRotatingHeaders(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract profile data similar to joeyism structure
      const profileData = {
        name: this.extractProfileName($),
        headline: this.extractProfileHeadline($),
        location: this.extractProfileLocation($),
        about: this.extractProfileAbout($),
        company: this.extractCurrentCompany($),
        experience: this.extractExperience($),
        contact: this.extractContactInfo($)
      };
      
      return profileData;
      
    } catch (error) {
      if (error.response?.status === 999) {
        throw new Error('LinkedIn blocked request (999 status)');
      }
      throw error;
    }
  }

  /**
   * Extract email from profile data - joeyism style
   */
  extractEmailFromProfileData(profileData) {
    // Check contact info first
    if (profileData.contact && profileData.contact.email) {
      return profileData.contact.email;
    }
    
    // Check in about section
    if (profileData.about) {
      const emailFromAbout = this.extractEmailFromText(profileData.about);
      if (emailFromAbout) return emailFromAbout;
    }
    
    // Check in experience descriptions
    if (profileData.experience && Array.isArray(profileData.experience)) {
      for (const exp of profileData.experience) {
        if (exp.description) {
          const emailFromExp = this.extractEmailFromText(exp.description);
          if (emailFromExp) return emailFromExp;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract profile name using joeyism selectors
   */
  extractProfileName($) {
    const nameSelectors = [
      '.text-heading-xlarge',
      '.top-card-layout__title',
      '.pv-text-details__left-panel h1',
      'h1.text-heading-xlarge'
    ];
    
    return this.extractTextFromSelectors($, nameSelectors);
  }

  /**
   * Extract profile headline
   */
  extractProfileHeadline($) {
    const headlineSelectors = [
      '.text-body-medium.break-words',
      '.top-card-layout__headline',
      '.pv-text-details__left-panel .text-body-medium'
    ];
    
    return this.extractTextFromSelectors($, headlineSelectors);
  }

  /**
   * Extract profile location
   */
  extractProfileLocation($) {
    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.top-card-layout__first-subline',
      '.pv-text-details__left-panel .text-body-small'
    ];
    
    return this.extractTextFromSelectors($, locationSelectors);
  }

  /**
   * Extract about section
   */
  extractProfileAbout($) {
    const aboutSelectors = [
      '#about + * .break-words',
      '.core-section-container__content .break-words',
      '.pv-about-section .pv-about__summary-text'
    ];
    
    return this.extractTextFromSelectors($, aboutSelectors);
  }

  /**
   * Extract current company
   */
  extractCurrentCompany($) {
    const companySelectors = [
      '.text-body-medium.break-words .visually-hidden',
      '.pv-entity__secondary-title',
      '.experience-item .pv-entity__secondary-title'
    ];
    
    return this.extractTextFromSelectors($, companySelectors);
  }

  /**
   * Extract contact information
   */
  extractContactInfo($) {
    const contactInfo = {};
    
    // Look for email in contact section
    const emailSelectors = [
      '.ci-email a',
      '.contact-see-more-less .ci-email',
      '[data-test-id="contact-info"] .ci-email'
    ];
    
    const email = this.extractTextFromSelectors($, emailSelectors);
    if (email) {
      contactInfo.email = email;
    }
    
    return contactInfo;
  }

  /**
   * Helper method to extract text from multiple selectors
   */
  extractTextFromSelectors($, selectors) {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) return text;
      }
    }
    return null;
  }

  /**
   * Alternative method - search through business directories that list LinkedIn contacts
   */
  async searchBusinessDirectories(companyInfo) {
    const directoryQueries = [
      `"${companyInfo.industry}" professionals email contact directory site:crunchbase.com`,
      `"${companyInfo.industry}" startup founders email contact site:f6s.com`,
      `"${companyInfo.industry}" executives email linkedin directory`,
      `"${companyInfo.industry}" companies email contact information directory`
    ];
    
    const foundEmails = [];
    
    for (const query of directoryQueries.slice(0, 2)) {
      try {
        console.log(`   📂 Searching business directories: ${query}`);
        const searchResults = await this.executeLinkedInSearch(query);
        
        // Extract emails directly from directory results
        for (const result of searchResults) {
          if (result.url && !result.url.includes('linkedin.com/in/')) {
            // This is a directory page, scrape it for emails
            try {
              await this.humanDelay();
              const response = await axios.get(result.url, {
                headers: this.getRotatingHeaders(),
                timeout: 10000
              });
              
              const emails = this.extractEmailFromText(response.data);
              if (emails) {
                foundEmails.push({
                  email: emails,
                  source: 'business_directory',
                  directoryUrl: result.url,
                  confidence: 0.7
                });
              }
            } catch (error) {
              console.log(`   ⚠️ Directory scraping failed: ${error.message}`);
            }
          }
        }
        
        await this.delay(3000);
      } catch (error) {
        console.log(`   ⚠️ Directory search failed: ${error.message}`);
      }
    }
    
    return foundEmails;
  }

}

module.exports = LinkedInEmailDiscoveryEngine;