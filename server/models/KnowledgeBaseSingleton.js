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
  
  async getAllProspects() {
    const kb = await this.getInstance();
    return kb.getAllProspects();
  }
  
  async getProspect(id) {
    const kb = await this.getInstance();
    return kb.getProspect(id);
  }
  
  async updateProspect(id, data) {
    const kb = await this.getInstance();
    return kb.updateProspect(id, data);
  }
  
  async getEmailHistory(prospectId) {
    const kb = await this.getInstance();
    return kb.getEmailHistory(prospectId);
  }
  
  async getEmailById(emailId) {
    const kb = await this.getInstance();
    return kb.getEmailById(emailId);
  }
  
  async saveEmail(emailData) {
    const kb = await this.getInstance();
    return kb.saveEmail(emailData);
  }
  
  async saveProspect(prospectData) {
    const kb = await this.getInstance();
    return kb.saveProspect(prospectData);
  }
  
  async saveMarketingStrategy(strategyData) {
    const kb = await this.getInstance();
    return kb.saveMarketingStrategy(strategyData);
  }
  
  async getMarketingStrategy(website, goal) {
    const kb = await this.getInstance();
    return kb.getMarketingStrategy(website, goal);
  }
}

// 导出单例实例
module.exports = new KnowledgeBaseSingleton();