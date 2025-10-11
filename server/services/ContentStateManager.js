// 内容状态管理器 - 确保每个网站的内容独立生成
class ContentStateManager {
  constructor() {
    // 为每个网站维护独立的内容状态
    this.websiteStates = new Map();
    this.currentWebsite = null;
    this.sessionId = null;
  }

  // 初始化新的网站会话
  initializeWebsiteSession(website, businessAnalysis) {
    const sessionId = `${website}_${Date.now()}`;
    console.log(`🔐 初始化网站会话: ${website} (ID: ${sessionId})`);
    
    const state = {
      sessionId,
      website,
      businessAnalysis: this.deepClone(businessAnalysis),
      generatedContent: new Map(),
      emailTemplates: new Map(),
      prospects: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    this.websiteStates.set(website, state);
    this.currentWebsite = website;
    this.sessionId = sessionId;
    
    return sessionId;
  }

  // 获取当前网站状态
  getCurrentState() {
    if (!this.currentWebsite) {
      throw new Error('No active website session');
    }
    
    const state = this.websiteStates.get(this.currentWebsite);
    if (!state) {
      throw new Error(`No state found for website: ${this.currentWebsite}`);
    }
    
    return state;
  }

  // 切换到指定网站
  switchToWebsite(website) {
    if (!this.websiteStates.has(website)) {
      throw new Error(`No session found for website: ${website}`);
    }
    
    console.log(`🔄 切换到网站: ${website}`);
    this.currentWebsite = website;
    const state = this.websiteStates.get(website);
    this.sessionId = state.sessionId;
    
    return state;
  }

  // 保存生成的内容
  saveGeneratedContent(contentType, content, metadata = {}) {
    const state = this.getCurrentState();
    
    const contentId = `${contentType}_${Date.now()}`;
    state.generatedContent.set(contentId, {
      id: contentId,
      type: contentType,
      content: this.deepClone(content),
      metadata,
      website: state.website,
      sessionId: state.sessionId,
      createdAt: new Date().toISOString()
    });
    
    state.lastUpdated = new Date().toISOString();
    console.log(`💾 保存内容 (${contentType}) for ${state.website}`);
    
    return contentId;
  }

  // 获取网站特定的业务分析
  getBusinessAnalysis(website = null) {
    const targetWebsite = website || this.currentWebsite;
    if (!targetWebsite) {
      throw new Error('No website specified');
    }
    
    const state = this.websiteStates.get(targetWebsite);
    if (!state) {
      return null;
    }
    
    return this.deepClone(state.businessAnalysis);
  }

  // 验证内容是否属于当前网站
  validateContentOwnership(content, expectedWebsite) {
    const actualWebsite = this.extractWebsiteFromContent(content);
    
    if (actualWebsite && actualWebsite !== expectedWebsite) {
      console.error(`⚠️ 内容混淆检测: 期望 ${expectedWebsite}, 实际 ${actualWebsite}`);
      return false;
    }
    
    return true;
  }

  // 从内容中提取网站信息
  extractWebsiteFromContent(content) {
    // 检查各种可能包含网站信息的字段
    if (typeof content === 'string') {
      // 使用正则表达式查找URL
      const urlMatch = content.match(/https?:\/\/[^\s<>"]+/);
      if (urlMatch) {
        return this.normalizeWebsiteUrl(urlMatch[0]);
      }
    } else if (typeof content === 'object') {
      // 检查对象中的URL字段
      const possibleFields = ['website', 'url', 'targetWebsite', 'link'];
      for (const field of possibleFields) {
        if (content[field]) {
          return this.normalizeWebsiteUrl(content[field]);
        }
      }
    }
    
    return null;
  }

  // 标准化网站URL
  normalizeWebsiteUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (error) {
      return url;
    }
  }

  // 清理特定网站的状态
  clearWebsiteState(website) {
    if (this.websiteStates.has(website)) {
      console.log(`🧹 清理网站状态: ${website}`);
      this.websiteStates.delete(website);
      
      if (this.currentWebsite === website) {
        this.currentWebsite = null;
        this.sessionId = null;
      }
    }
  }

  // 清理所有状态
  clearAllStates() {
    console.log('🧹 清理所有网站状态');
    this.websiteStates.clear();
    this.currentWebsite = null;
    this.sessionId = null;
  }

  // 获取所有活动会话
  getActiveSessions() {
    const sessions = [];
    for (const [website, state] of this.websiteStates) {
      sessions.push({
        website,
        sessionId: state.sessionId,
        contentCount: state.generatedContent.size,
        prospectCount: state.prospects.length,
        createdAt: state.createdAt,
        lastUpdated: state.lastUpdated
      });
    }
    return sessions;
  }

  // 深拷贝对象
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of obj) {
        cloned.set(key, this.deepClone(value));
      }
      return cloned;
    }
    
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  // 导出状态用于持久化
  exportState(website = null) {
    if (website) {
      const state = this.websiteStates.get(website);
      if (!state) return null;
      
      return {
        ...state,
        generatedContent: Array.from(state.generatedContent.entries()),
        emailTemplates: Array.from(state.emailTemplates.entries())
      };
    }
    
    // 导出所有状态
    const allStates = {};
    for (const [website, state] of this.websiteStates) {
      allStates[website] = {
        ...state,
        generatedContent: Array.from(state.generatedContent.entries()),
        emailTemplates: Array.from(state.emailTemplates.entries())
      };
    }
    return allStates;
  }

  // 从导出的状态恢复
  importState(exportedState) {
    if (!exportedState) return;
    
    for (const [website, state] of Object.entries(exportedState)) {
      const restoredState = {
        ...state,
        generatedContent: new Map(state.generatedContent),
        emailTemplates: new Map(state.emailTemplates)
      };
      this.websiteStates.set(website, restoredState);
    }
    
    console.log(`📥 恢复了 ${Object.keys(exportedState).length} 个网站状态`);
  }
}

module.exports = ContentStateManager;