/**
 * Multi-Source Email Integration
 * Replaces SuperPowerEmailSearchEngine with improved multi-source aggregation
 * No API keys required - uses free public sources
 */

const SimplifiedMultiSourceEmailFinder = require('../mcp/SimplifiedMultiSourceEmailFinder');

class MultiSourceEmailIntegration {
  constructor() {
    this.finder = new SimplifiedMultiSourceEmailFinder();
    this.name = 'Multi-Source Email Search Engine';
    console.log(`🚀 ${this.name} initialized with enhanced capabilities`);
  }

  /**
   * Main search method - compatible with existing SuperPowerEmailSearchEngine interface
   */
  async searchRealEmails(companyInfo) {
    // Check if this is the user's own website vs a prospect
    const isUserWebsite = this.detectIfUserWebsite(companyInfo);
    
    if (isUserWebsite) {
      console.log(`⚠️ DETECTED USER'S OWN WEBSITE: ${companyInfo.name || companyInfo.company_name} - Searching for PROSPECTS instead!`);
      return await this.searchForProspects(companyInfo);
    }

    console.log(`🔍 Using Multi-Source Email Search for: ${companyInfo.name || companyInfo.company_name}`);
    
    try {
      const results = await this.finder.searchRealEmails(companyInfo);
      
      // Transform results to match expected format
      return {
        emails: this.transformToExpectedFormat(results.emails),
        sources: results.sources,
        searchQueries: results.searchQueries,
        timestamp: results.timestamp,
        source_performance: results.source_details
      };
      
    } catch (error) {
      console.error('❌ Multi-source search failed:', error.message);
      return {
        emails: [],
        sources: ['multi_source_search_failed'],
        searchQueries: [`Multi-source search for ${companyInfo.name || companyInfo.company_name}`],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Search for prospects instead of user's own company
   */
  async searchForProspects(companyInfo) {
    console.log('🎯 Multi-Source: Searching for PROSPECTS (potential clients)...');
    
    const industry = this.inferIndustry(companyInfo);
    const prospectCompanies = this.generateProspectList(industry, companyInfo);
    
    const allProspectEmails = [];
    const prospectResults = {
      emails: [],
      sources: ['prospect_discovery'],
      searchQueries: [`Prospect search in ${industry} industry`],
      timestamp: new Date().toISOString(),
      prospect_companies: prospectCompanies.map(p => p.name)
    };

    try {
      // Search for emails from prospect companies
      for (const prospect of prospectCompanies.slice(0, 3)) { // Limit to 3 prospects
        try {
          console.log(`🔍 Finding emails for prospect: ${prospect.name}`);
          
          const prospectResult = await this.finder.searchRealEmails(prospect);
          
          if (prospectResult.emails.length > 0) {
            // Tag these as prospect emails
            const prospectEmails = prospectResult.emails.map(email => ({
              ...email,
              prospect_company: prospect.name,
              prospect_domain: prospect.domain,
              is_prospect: true,
              prospect_industry: industry
            }));
            
            allProspectEmails.push(...prospectEmails);
            console.log(`✅ Found ${prospectEmails.length} emails for ${prospect.name}`);
          }
          
        } catch (error) {
          console.log(`⚠️ Failed to get emails for prospect ${prospect.name}: ${error.message}`);
        }
      }

      prospectResults.emails = this.transformToExpectedFormat(allProspectEmails);
      
      console.log(`✅ Prospect search completed: ${prospectResults.emails.length} prospect emails found`);
      return prospectResults;

    } catch (error) {
      console.error('❌ Prospect search failed:', error.message);
      return {
        emails: [],
        sources: ['prospect_search_failed'],
        searchQueries: prospectResults.searchQueries,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Detect if the company info represents user's own website
   */
  detectIfUserWebsite(companyInfo) {
    const description = (companyInfo.description || '').toLowerCase();
    const name = (companyInfo.name || companyInfo.company_name || '').toLowerCase();
    
    // Keywords that suggest this is a business/service provider
    const businessKeywords = [
      'ai-powered', 'business solutions', 'services', 'platform', 'software',
      'technology', 'automation', 'consulting', 'solutions', 'provider'
    ];
    
    // If description contains business keywords, likely user's own website
    if (businessKeywords.some(keyword => description.includes(keyword))) {
      return true;
    }
    
    // If name suggests it's a service provider
    if (name.includes('ai') && (name.includes('solution') || name.includes('platform') || name.includes('service'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Infer industry from company information
   */
  inferIndustry(companyInfo) {
    const description = (companyInfo.description || '').toLowerCase();
    const name = (companyInfo.name || companyInfo.company_name || '').toLowerCase();
    
    if (description.includes('ai') || description.includes('artificial intelligence') || 
        description.includes('machine learning') || name.includes('ai')) {
      return 'AI/Technology';
    }
    
    if (description.includes('data') && (description.includes('annotation') || 
        description.includes('labeling') || description.includes('services'))) {
      return 'Data Services';
    }
    
    if (description.includes('software') || description.includes('platform') || description.includes('saas')) {
      return 'Software/SaaS';
    }
    
    if (description.includes('consulting') || description.includes('advisory')) {
      return 'Consulting';
    }
    
    return 'Technology';
  }

  /**
   * Generate list of prospect companies based on industry
   */
  generateProspectList(industry, userCompany) {
    const industryProspects = {
      'AI/Technology': [
        { name: 'Anthropic', domain: 'anthropic.com', website: 'https://anthropic.com' },
        { name: 'Cohere', domain: 'cohere.ai', website: 'https://cohere.ai' },
        { name: 'Stability AI', domain: 'stability.ai', website: 'https://stability.ai' },
        { name: 'Hugging Face', domain: 'huggingface.co', website: 'https://huggingface.co' },
        { name: 'Replicate', domain: 'replicate.com', website: 'https://replicate.com' }
      ],
      'Data Services': [
        { name: 'Labelbox', domain: 'labelbox.com', website: 'https://labelbox.com' },
        { name: 'Scale AI', domain: 'scale.com', website: 'https://scale.com' },
        { name: 'Appen', domain: 'appen.com', website: 'https://appen.com' },
        { name: 'Clickworker', domain: 'clickworker.com', website: 'https://clickworker.com' },
        { name: 'Toloka', domain: 'toloka.ai', website: 'https://toloka.ai' }
      ],
      'Software/SaaS': [
        { name: 'Stripe', domain: 'stripe.com', website: 'https://stripe.com' },
        { name: 'Twilio', domain: 'twilio.com', website: 'https://twilio.com' },
        { name: 'SendGrid', domain: 'sendgrid.com', website: 'https://sendgrid.com' },
        { name: 'Mailgun', domain: 'mailgun.com', website: 'https://mailgun.com' },
        { name: 'Auth0', domain: 'auth0.com', website: 'https://auth0.com' }
      ],
      'Consulting': [
        { name: 'McKinsey Digital', domain: 'mckinsey.com', website: 'https://mckinsey.com' },
        { name: 'Accenture', domain: 'accenture.com', website: 'https://accenture.com' },
        { name: 'Deloitte Digital', domain: 'deloitte.com', website: 'https://deloitte.com' },
        { name: 'BCG Digital Ventures', domain: 'bcg.com', website: 'https://bcg.com' }
      ],
      'Technology': [
        { name: 'MongoDB', domain: 'mongodb.com', website: 'https://mongodb.com' },
        { name: 'Redis', domain: 'redis.io', website: 'https://redis.io' },
        { name: 'Elastic', domain: 'elastic.co', website: 'https://elastic.co' },
        { name: 'Confluent', domain: 'confluent.io', website: 'https://confluent.io' },
        { name: 'Databricks', domain: 'databricks.com', website: 'https://databricks.com' }
      ]
    };

    return industryProspects[industry] || industryProspects['Technology'];
  }

  /**
   * Transform emails to expected format for compatibility
   */
  transformToExpectedFormat(emails) {
    return emails.map(email => ({
      email: email.email,
      source: Array.isArray(email.sources) ? email.sources.join(', ') : email.source,
      title: email.title || 'Contact',
      company: email.company || 'Unknown',
      confidence: email.confidence || 60,
      engine: 'multi_source_aggregation',
      verified: true,
      found_method: email.source,
      name: email.name,
      github_username: email.github_username,
      inferred: email.inferred || false,
      multi_source: true,
      is_prospect: email.is_prospect || false,
      prospect_company: email.prospect_company,
      prospect_domain: email.prospect_domain,
      prospect_industry: email.prospect_industry
    }));
  }

  /**
   * Generate search queries for prospect discovery (for compatibility)
   */
  async generateProspectSearchQueries(companyInfo) {
    const industry = this.inferIndustry(companyInfo);
    
    return [
      `${industry} companies email contact`,
      `businesses in ${industry} sector`,
      `${industry} industry leaders contact information`
    ];
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        engine: this.name,
        capabilities: ['multi_source_aggregation', 'prospect_discovery', 'github_search', 'domain_analysis', 'whois_lookup', 'web_scraping'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = MultiSourceEmailIntegration;