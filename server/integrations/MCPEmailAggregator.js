/**
 * MCP Email Aggregator Integration
 * Integrates the Multi-Source Email Aggregation MCP with existing email search system
 */

const MultiSourceEmailAggregatorMCP = require('../mcp/MultiSourceEmailAggregatorMCP');

class MCPEmailAggregator {
  constructor() {
    this.mcpServer = new MultiSourceEmailAggregatorMCP();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.mcpServer.start();
      this.initialized = true;
      console.log('✅ MCP Email Aggregator initialized');
    }
  }

  /**
   * Main interface method - compatible with existing SuperPowerEmailSearchEngine
   */
  async searchRealEmails(companyInfo) {
    await this.initialize();

    console.log('🚀 Using MCP Multi-Source Email Aggregator...');
    
    const company = companyInfo.name || companyInfo.company_name;
    const domain = companyInfo.domain || this.extractDomain(companyInfo.website);
    const website = companyInfo.website;

    try {
      // Call MCP aggregation
      const mcpResponse = await this.mcpServer.aggregateEmails({
        company,
        domain,
        website
      });

      // Parse MCP response
      const aggregationResult = JSON.parse(mcpResponse.content[0].text);
      
      // Transform to expected format
      const results = {
        emails: this.transformEmailsToExpectedFormat(aggregationResult.emails),
        sources: aggregationResult.sources,
        searchQueries: [`MCP aggregation for ${company}`],
        timestamp: aggregationResult.timestamp,
        mcp_confidence_scores: aggregationResult.confidence_scores
      };

      console.log(`✅ MCP aggregation completed: ${results.emails.length} emails from ${results.sources.length} sources`);
      
      return results;

    } catch (error) {
      console.error('❌ MCP aggregation failed:', error.message);
      
      // Return fallback format
      return {
        emails: [],
        sources: ['mcp_failed'],
        searchQueries: [`MCP aggregation for ${company}`],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Transform MCP email format to match existing system expectations
   */
  transformEmailsToExpectedFormat(mcpEmails) {
    return mcpEmails.map(mcpEmail => ({
      email: mcpEmail.email,
      source: Array.isArray(mcpEmail.sources) ? mcpEmail.sources.join(', ') : mcpEmail.source,
      title: mcpEmail.role || 'Contact',
      company: mcpEmail.company || 'Unknown',
      confidence: mcpEmail.confidence || 60,
      engine: 'mcp_multi_source',
      verified: true,
      found_method: mcpEmail.source,
      name: mcpEmail.name,
      github_username: mcpEmail.github_username,
      inferred: mcpEmail.inferred || false,
      mcp_sources: mcpEmail.sources || [mcpEmail.source]
    }));
  }

  /**
   * Enhanced prospect search using MCP capabilities
   */
  async searchForProspects(companyInfo) {
    await this.initialize();

    console.log('🎯 MCP: Searching for prospects...');
    
    // Use the user's company info to find similar companies (prospects)
    const industry = this.inferIndustry(companyInfo);
    const keywords = this.extractKeywords(companyInfo);

    try {
      // Search for companies in similar industry
      const prospectCompanies = await this.findProspectCompanies(industry, keywords);
      
      const allProspectEmails = [];
      
      // For each prospect company, find their emails
      for (const prospect of prospectCompanies.slice(0, 5)) { // Limit to 5 prospects
        try {
          console.log(`🔍 Finding emails for prospect: ${prospect.name}`);
          
          const prospectResult = await this.searchRealEmails(prospect);
          
          if (prospectResult.emails.length > 0) {
            // Tag these as prospect emails
            const prospectEmails = prospectResult.emails.map(email => ({
              ...email,
              prospect_company: prospect.name,
              prospect_domain: prospect.domain,
              is_prospect: true
            }));
            
            allProspectEmails.push(...prospectEmails);
          }
          
        } catch (error) {
          console.log(`⚠️ Failed to get emails for prospect ${prospect.name}: ${error.message}`);
        }
      }

      return {
        emails: allProspectEmails,
        sources: ['mcp_prospect_search'],
        searchQueries: [`Prospect search for ${industry} industry`],
        timestamp: new Date().toISOString(),
        prospect_companies: prospectCompanies.map(p => p.name)
      };

    } catch (error) {
      console.error('❌ MCP prospect search failed:', error.message);
      
      return {
        emails: [],
        sources: ['mcp_prospect_search_failed'],
        searchQueries: [`Prospect search for ${companyInfo.name}`],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Find prospect companies based on industry and keywords
   */
  async findProspectCompanies(industry, keywords) {
    // This would use the MCP to search for companies in the same industry
    // For now, return some example prospects based on industry
    
    const industryProspects = {
      'AI/Technology': [
        { name: 'DataRobot', domain: 'datarobot.com', website: 'https://datarobot.com' },
        { name: 'H2O.ai', domain: 'h2o.ai', website: 'https://h2o.ai' },
        { name: 'Databricks', domain: 'databricks.com', website: 'https://databricks.com' },
        { name: 'Palantir', domain: 'palantir.com', website: 'https://palantir.com' },
        { name: 'Snowflake', domain: 'snowflake.com', website: 'https://snowflake.com' }
      ],
      'Data Services': [
        { name: 'Labelbox', domain: 'labelbox.com', website: 'https://labelbox.com' },
        { name: 'Scale AI', domain: 'scale.com', website: 'https://scale.com' },
        { name: 'Appen', domain: 'appen.com', website: 'https://appen.com' },
        { name: 'Toloka', domain: 'toloka.ai', website: 'https://toloka.ai' }
      ],
      'Default': [
        { name: 'TechCorp', domain: 'techcorp.com', website: 'https://techcorp.com' },
        { name: 'DataSystems', domain: 'datasystems.io', website: 'https://datasystems.io' },
        { name: 'InnovateAI', domain: 'innovateai.com', website: 'https://innovateai.com' }
      ]
    };

    return industryProspects[industry] || industryProspects['Default'];
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
    
    return 'Default';
  }

  /**
   * Extract keywords from company information
   */
  extractKeywords(companyInfo) {
    const text = `${companyInfo.name || ''} ${companyInfo.description || ''}`.toLowerCase();
    const keywords = [];
    
    const keywordPatterns = [
      'artificial intelligence', 'machine learning', 'data science',
      'automation', 'analytics', 'business intelligence',
      'cloud computing', 'software', 'technology'
    ];
    
    keywordPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    });
    
    return keywords;
  }

  /**
   * Utility method to extract domain from URL
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

  /**
   * Health check for MCP server
   */
  async healthCheck() {
    try {
      await this.initialize();
      return {
        status: 'healthy',
        initialized: this.initialized,
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

module.exports = MCPEmailAggregator;