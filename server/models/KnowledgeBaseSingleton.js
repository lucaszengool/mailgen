const EnhancedKnowledgeBase = require('./EnhancedKnowledgeBase');

/**
 * Knowledge Base Singleton
 * 确保整个应用只有一个数据库连接实例
 */
class KnowledgeBaseSingleton {
  constructor() {
    if (KnowledgeBaseSingleton.instance) {
      return KnowledgeBaseSingleton.instance;
    }
    
    this.knowledgeBase = new EnhancedKnowledgeBase();
    this.isInitialized = false;
    
    KnowledgeBaseSingleton.instance = this;
  }
  
  async getInstance() {
    if (!this.isInitialized) {
      await this.knowledgeBase.connect();
      this.isInitialized = true;
    }
    return this.knowledgeBase;
  }
  
  // 直接代理所有方法到 knowledgeBase 实例
  async connect() {
    return this.getInstance();
  }
  
  async getAllProspects(userId = 'anonymous') {
    const kb = await this.getInstance();
    return kb.getAllProspects(userId);
  }

  async getProspect(id, userId = 'anonymous') {
    const kb = await this.getInstance();
    return kb.getProspect(id, userId);
  }

  async updateProspect(id, data, userId = 'anonymous') {
    const kb = await this.getInstance();
    return kb.updateProspect(id, data, userId);
  }

  async getEmailHistory(prospectId, userId = 'anonymous') {
    const kb = await this.getInstance();
    return kb.getEmailHistory(prospectId, userId);
  }
  
  async getEmailById(emailId) {
    const kb = await this.getInstance();
    return kb.getEmailById(emailId);
  }
  
  async saveEmail(emailData, userId = 'anonymous') {
    const kb = await this.getInstance();
    // Add userId to email data
    return kb.saveEmail({ ...emailData, user_id: userId });
  }

  async saveProspect(prospectData, userId = 'anonymous') {
    const kb = await this.getInstance();
    // Add userId to prospect data
    return kb.saveProspect({ ...prospectData, user_id: userId });
  }

  async saveMarketingStrategy(strategyData, userId = 'anonymous') {
    const kb = await this.getInstance();
    // Add userId to strategy data
    return kb.saveMarketingStrategy({ ...strategyData, user_id: userId });
  }

  async getMarketingStrategy(website, goal, userId = 'anonymous') {
    const kb = await this.getInstance();
    return kb.getMarketingStrategy(website, goal, userId);
  }
}

// 导出单例实例
module.exports = new KnowledgeBaseSingleton();