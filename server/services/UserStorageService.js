/**
 * User-Scoped Storage Service
 * Provides isolated data storage for each user in a multi-tenant environment
 *
 * Features:
 * - Automatic user directory creation
 * - Isolated configs, prospects, workflows, templates per user
 * - Safe file operations with validation
 * - Demo mode support for unauthenticated users
 */

const fs = require('fs').promises;
const path = require('path');

class UserStorageService {
  constructor(userId) {
    this.userId = userId || 'demo';
    this.basePath = path.join(__dirname, '../data/users', this.sanitizeUserId(this.userId));
  }

  /**
   * Sanitize userId to prevent directory traversal attacks
   */
  sanitizeUserId(userId) {
    return userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Ensure user's directory exists
   */
  async ensureUserDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      console.log(`✅ User directory ensured: ${this.basePath}`);
    } catch (error) {
      console.error('❌ Failed to create user directory:', error);
      throw new Error('Failed to initialize user storage');
    }
  }

  /**
   * AGENT CONFIGURATION
   */
  async saveConfig(config) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'agent-config.json');
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    console.log(`💾 Config saved for user: ${this.userId}`);
    return config;
  }

  async getConfig() {
    try {
      const filePath = path.join(this.basePath, 'agent-config.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No config exists yet
      }
      throw error;
    }
  }

  async deleteConfig() {
    const filePath = path.join(this.basePath, 'agent-config.json');
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Config deleted for user: ${this.userId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * PROSPECTS
   */
  async saveProspects(prospects) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'prospects.json');
    await fs.writeFile(filePath, JSON.stringify(prospects, null, 2));
    console.log(`💾 ${prospects.length} prospects saved for user: ${this.userId}`);
    return prospects;
  }

  async getProspects() {
    try {
      const filePath = path.join(this.basePath, 'prospects.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No prospects yet
      }
      throw error;
    }
  }

  async addProspect(prospect) {
    const prospects = await this.getProspects();
    prospect.id = prospect.id || `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    prospect.createdAt = prospect.createdAt || new Date().toISOString();
    prospects.push(prospect);
    await this.saveProspects(prospects);
    return prospect;
  }

  /**
   * WORKFLOW STATE
   */
  async saveWorkflowState(state) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'workflow-state.json');
    await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    console.log(`💾 Workflow state saved for user: ${this.userId}`);
    return state;
  }

  async getWorkflowState() {
    try {
      const filePath = path.join(this.basePath, 'workflow-state.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No workflow state yet
      }
      throw error;
    }
  }

  /**
   * EMAIL TEMPLATES
   */
  async saveTemplates(templates) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'email_templates.json');
    await fs.writeFile(filePath, JSON.stringify(templates, null, 2));
    console.log(`💾 ${templates.length} templates saved for user: ${this.userId}`);
    return templates;
  }

  async getTemplates() {
    try {
      const filePath = path.join(this.basePath, 'email_templates.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No templates yet
      }
      throw error;
    }
  }

  async addTemplate(template) {
    const templates = await this.getTemplates();
    template.id = template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    template.createdAt = template.createdAt || new Date().toISOString();
    template.userId = this.userId;
    templates.push(template);
    await this.saveTemplates(templates);
    return template;
  }

  /**
   * WEBSITE ANALYSIS
   */
  async saveWebsiteAnalysis(url, analysis) {
    await this.ensureUserDirectory();
    const analyses = await this.getAllWebsiteAnalyses();

    const analysisEntry = {
      url,
      analysis,
      timestamp: new Date().toISOString(),
      userId: this.userId
    };

    // Update if exists, otherwise add
    const existingIndex = analyses.findIndex(a => a.url === url);
    if (existingIndex >= 0) {
      analyses[existingIndex] = analysisEntry;
    } else {
      analyses.push(analysisEntry);
    }

    const filePath = path.join(this.basePath, 'website-analyses.json');
    await fs.writeFile(filePath, JSON.stringify(analyses, null, 2));
    console.log(`💾 Website analysis saved for user: ${this.userId}, URL: ${url}`);
    return analysisEntry;
  }

  async getWebsiteAnalysis(url) {
    const analyses = await this.getAllWebsiteAnalyses();
    return analyses.find(a => a.url === url);
  }

  async getAllWebsiteAnalyses() {
    try {
      const filePath = path.join(this.basePath, 'website-analyses.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No analyses yet
      }
      throw error;
    }
  }

  /**
   * EMAIL CAMPAIGNS
   */
  async saveEmailCampaign(campaign) {
    await this.ensureUserDirectory();
    const campaigns = await this.getAllEmailCampaigns();

    campaign.id = campaign.id || `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    campaign.userId = this.userId;
    campaign.createdAt = campaign.createdAt || new Date().toISOString();

    campaigns.push(campaign);

    const filePath = path.join(this.basePath, 'email-campaigns.json');
    await fs.writeFile(filePath, JSON.stringify(campaigns, null, 2));
    console.log(`💾 Email campaign saved for user: ${this.userId}, ID: ${campaign.id}`);
    return campaign;
  }

  async getEmailCampaign(campaignId) {
    const campaigns = await this.getAllEmailCampaigns();
    return campaigns.find(c => c.id === campaignId);
  }

  async getAllEmailCampaigns() {
    try {
      const filePath = path.join(this.basePath, 'email-campaigns.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No campaigns yet
      }
      throw error;
    }
  }

  async updateEmailCampaign(campaignId, updates) {
    const campaigns = await this.getAllEmailCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);

    if (index >= 0) {
      campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() };
      const filePath = path.join(this.basePath, 'email-campaigns.json');
      await fs.writeFile(filePath, JSON.stringify(campaigns, null, 2));
      console.log(`💾 Email campaign updated for user: ${this.userId}, ID: ${campaignId}`);
      return campaigns[index];
    }

    throw new Error(`Campaign ${campaignId} not found`);
  }

  /**
   * SELECTED TEMPLATE PREFERENCE
   */
  async saveSelectedTemplate(templateId, templateName, customizations = {}) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'selected-template.json');
    const data = {
      templateId,
      templateName,
      selectedAt: new Date().toISOString(),
      userId: this.userId,
      // Save all customizations
      subject: customizations.subject || null,
      greeting: customizations.greeting || null,
      signature: customizations.signature || null,
      html: customizations.html || null,
      customizations: customizations.customizations || {},
      isCustomized: customizations.isCustomized || false,
      components: customizations.components || []
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Selected template saved for user: ${this.userId} - ${templateName}${data.isCustomized ? ' (with customizations)' : ''}`);
    return data;
  }

  async getSelectedTemplate() {
    try {
      const filePath = path.join(this.basePath, 'selected-template.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No template selected yet
      }
      throw error;
    }
  }

  async clearSelectedTemplate() {
    const filePath = path.join(this.basePath, 'selected-template.json');
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Selected template cleared for user: ${this.userId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * GMAIL OAUTH TOKENS
   */
  async saveOAuthTokens(tokens) {
    await this.ensureUserDirectory();
    const filePath = path.join(this.basePath, 'gmail-oauth.json');
    const data = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      email: tokens.email, // User's Gmail address
      savedAt: new Date().toISOString(),
      userId: this.userId
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`🔐 OAuth tokens saved for user: ${this.userId} (${tokens.email})`);
    return data;
  }

  async getOAuthTokens() {
    try {
      const filePath = path.join(this.basePath, 'gmail-oauth.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No OAuth tokens saved
      }
      throw error;
    }
  }

  async clearOAuthTokens() {
    const filePath = path.join(this.basePath, 'gmail-oauth.json');
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ OAuth tokens cleared for user: ${this.userId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async hasOAuthTokens() {
    const tokens = await this.getOAuthTokens();
    return !!tokens && !!tokens.access_token;
  }

  /**
   * UTILITY METHODS
   */
  async getUserStats() {
    const [config, prospects, workflows, templates, analyses, campaigns] = await Promise.all([
      this.getConfig(),
      this.getProspects(),
      this.getWorkflowState(),
      this.getTemplates(),
      this.getAllWebsiteAnalyses(),
      this.getAllEmailCampaigns()
    ]);

    return {
      userId: this.userId,
      hasConfig: !!config,
      prospectsCount: prospects.length,
      hasWorkflow: !!workflows,
      templatesCount: templates.length,
      analysesCount: analyses.length,
      campaignsCount: campaigns.length,
      createdAt: config?.createdAt || null
    };
  }

  async clearAllData() {
    try {
      await fs.rm(this.basePath, { recursive: true, force: true });
      console.log(`🗑️ All data cleared for user: ${this.userId}`);
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      throw error;
    }
  }
}

module.exports = UserStorageService;
