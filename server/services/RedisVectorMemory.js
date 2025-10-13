/**
 * Redis Vector Memory System
 * 为LangGraph Agent提供向量记忆和学习能力
 */

const Redis = require('ioredis');
const crypto = require('crypto');

class RedisVectorMemory {
  constructor(options = {}) {
    // Support both REDIS_URL and individual config
    const redisConfig = process.env.REDIS_URL
      ? process.env.REDIS_URL  // Use connection string if available
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        };

    this.redis = new Redis(redisConfig, {
      db: options.db || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,  // Don't queue commands when offline
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis retry limit reached, giving up');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms...`);
        return delay;
      },
      reconnectOnError: (err) => {
        console.error('❌ Redis reconnect error:', err.message);
        return false; // Don't automatically reconnect on error
      }
    });

    // Handle Redis errors to prevent unhandled error events
    this.redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      this.connected = false;
    });

    this.redis.on('close', () => {
      console.log('⚠️ Redis connection closed');
      this.connected = false;
    });

    this.vectorDim = options.vectorDim || 384; // Default embedding dimension
    this.indexName = options.indexName || 'agent_memory';
    this.keyPrefix = options.keyPrefix || 'memory:';
    this.connected = false; // Initialize as disconnected

    console.log('🧠 Redis Vector Memory System initialized');
  }

  async connect() {
    try {
      await this.redis.connect();
      console.log('✅ Redis connected successfully');
      this.connected = true;
      await this.createVectorIndex();
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      console.log('⚠️ Continuing without Redis - memory features disabled');
      this.connected = false;
      return false;
    }
  }

  // Helper method to check if Redis is available
  isConnected() {
    return this.connected === true;
  }

  async createVectorIndex() {
    try {
      // 使用标准Redis操作，不依赖RediSearch
      console.log(`✅ Using standard Redis operations (RediSearch not required)`);
    } catch (error) {
      console.error('❌ Failed to create vector index:', error.message);
    }
  }

  /**
   * 存储搜索查询学习数据
   */
  async storeSearchLearning(campaignId, query, results, performance) {
    if (!this.isConnected()) {
      console.log('⚠️ Redis not connected, skipping search learning storage');
      return null;
    }

    try {
      const id = this.generateId('search_learning');
      const key = `${this.keyPrefix}${id}`;

      const data = {
        id,
        type: 'search_learning',
        campaign_id: campaignId,
        timestamp: Date.now(),
        content: query,
        results_count: results.length,
        performance: {
          emails_found: results.length,
          success_rate: performance.success_rate || 0,
          relevance_score: performance.relevance_score || 0
        },
        metadata: JSON.stringify({
          query_type: performance.query_type,
          search_terms: performance.search_terms,
          domains_searched: performance.domains_searched
        }),
        embedding: await this.generateEmbedding(query)
      };

      await this.redis.set(key, JSON.stringify(data));
      console.log(`📚 Stored search learning: ${query} (${results.length} results)`);
      return id;
    } catch (error) {
      console.error('❌ Failed to store search learning:', error.message);
      return null;
    }
  }

  /**
   * 存储营销策略学习数据
   */
  async storeMarketingLearning(campaignId, strategy, results, feedback) {
    if (!this.isConnected()) {
      console.log('⚠️ Redis not connected, skipping marketing learning storage');
      return null;
    }

    try {
      const id = this.generateId('marketing_learning');
      const key = `${this.keyPrefix}${id}`;

      const data = {
        id,
        type: 'marketing_learning',
        campaign_id: campaignId,
        timestamp: Date.now(),
        content: JSON.stringify(strategy),
        results: {
          emails_sent: results.emails_sent || 0,
          responses: results.responses || 0,
          conversions: results.conversions || 0,
          response_rate: results.response_rate || 0
        },
        feedback: {
          user_rating: feedback.user_rating || 0,
          user_comments: feedback.user_comments || '',
          effectiveness: feedback.effectiveness || 0
        },
        metadata: JSON.stringify({
          target_audience: strategy.target_audience,
          value_proposition: strategy.value_proposition,
          approach: strategy.approach
        }),
        embedding: await this.generateEmbedding(JSON.stringify(strategy))
      };

      await this.redis.set(key, JSON.stringify(data));
      console.log(`🎯 Stored marketing learning for campaign: ${campaignId}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to store marketing learning:', error.message);
      return null;
    }
  }

  /**
   * 存储邮件学习数据
   */
  async storeEmailLearning(campaignId, emailContent, results, userFeedback) {
    if (!this.isConnected()) {
      console.log('⚠️ Redis not connected, skipping email learning storage');
      return null;
    }

    try {
      const id = this.generateId('email_learning');
      const key = `${this.keyPrefix}${id}`;

      const data = {
        id,
        type: 'email_learning',
        campaign_id: campaignId,
        timestamp: Date.now(),
        content: emailContent.subject + ' ' + emailContent.body,
        results: {
          sent: results.sent || false,
          opened: results.opened || false,
          replied: results.replied || false,
          conversion: results.conversion || false
        },
        user_feedback: {
          approval: userFeedback.approval || false,
          modifications: userFeedback.modifications || '',
          rating: userFeedback.rating || 0
        },
        metadata: JSON.stringify({
          email_type: emailContent.type,
          template_used: emailContent.template,
          personalization: emailContent.personalization
        }),
        embedding: await this.generateEmbedding(emailContent.subject + ' ' + emailContent.body)
      };

      await this.redis.set(key, JSON.stringify(data));
      console.log(`📧 Stored email learning for campaign: ${campaignId}`);
      return id;
    } catch (error) {
      console.error('❌ Failed to store email learning:', error.message);
      return null;
    }
  }

  /**
   * 检索相似的学习经验 (使用标准Redis操作)
   */
  async retrieveSimilarLearning(query, type, limit = 10) {
    if (!this.isConnected()) {
      console.log('⚠️ Redis not connected, returning empty learning results');
      return [];
    }

    try {
      // 使用标准Redis操作检索数据
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const results = [];

      for (const key of keys.slice(0, limit)) {
        try {
          const dataStr = await this.redis.get(key);
          if (dataStr) {
            const data = JSON.parse(dataStr);
            if (!type || data.type === type) {
              results.push(data);
            }
          }
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
        }
      }

      return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
      console.error('❌ Error retrieving similar learning:', error.message);
      return [];
    }
  }

  /**
   * 获取搜索优化建议
   */
  async getSearchOptimizationSuggestions(currentQuery, campaignId) {
    const similarSearches = await this.retrieveSimilarLearning(currentQuery, 'search_learning', 5);
    
    // 分析历史最佳搜索模式
    const bestPerforming = similarSearches
      .filter(search => search.performance?.success_rate > 0.3)
      .sort((a, b) => (b.performance?.success_rate || 0) - (a.performance?.success_rate || 0));

    return {
      suggested_queries: bestPerforming.map(search => search.content),
      optimization_tips: this.generateSearchOptimizationTips(bestPerforming),
      avoid_patterns: this.getAvoidPatterns(similarSearches)
    };
  }

  /**
   * 获取营销策略优化建议
   */
  async getMarketingOptimizationSuggestions(currentStrategy, campaignId) {
    const similarStrategies = await this.retrieveSimilarLearning(
      JSON.stringify(currentStrategy), 
      'marketing_learning', 
      5
    );

    const bestPerforming = similarStrategies
      .filter(strategy => strategy.results?.response_rate > 0.1)
      .sort((a, b) => (b.results?.response_rate || 0) - (a.results?.response_rate || 0));

    return {
      suggested_approaches: bestPerforming.map(strategy => JSON.parse(strategy.content)),
      optimization_tips: this.generateMarketingOptimizationTips(bestPerforming),
      user_preferred_styles: this.getUserPreferredStyles(similarStrategies)
    };
  }

  /**
   * 获取邮件优化建议
   */
  async getEmailOptimizationSuggestions(emailContent, campaignId) {
    const similarEmails = await this.retrieveSimilarLearning(
      emailContent.subject + ' ' + emailContent.body,
      'email_learning',
      5
    );

    const bestPerforming = similarEmails
      .filter(email => email.results?.replied || email.user_feedback?.rating > 3)
      .sort((a, b) => (b.user_feedback?.rating || 0) - (a.user_feedback?.rating || 0));

    return {
      suggested_subjects: bestPerforming.map(email => this.extractSubject(email.content)),
      content_optimizations: this.generateEmailOptimizationTips(bestPerforming),
      user_preferences: this.getUserEmailPreferences(similarEmails)
    };
  }

  /**
   * 生成简单的文本嵌入向量 (可以后续替换为更复杂的模型)
   */
  async generateEmbedding(text) {
    // 简单的TF-IDF风格嵌入，生产环境应该使用专门的嵌入模型
    if (!text || typeof text !== 'string') {
      text = String(text || '');
    }
    const words = text.toLowerCase().match(/\w+/g) || [];
    const embedding = new Array(this.vectorDim).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const hash = this.hashString(words[i]);
      for (let j = 0; j < this.vectorDim; j++) {
        embedding[j] += Math.sin(hash * (j + 1)) * 0.1;
      }
    }
    
    // 归一化
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  generateId(type) {
    return `${type}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }


  generateSearchOptimizationTips(bestPerforming) {
    return [
      '使用特定的业务目录网站 (LinkedIn, Crunchbase)',
      '包含行业相关关键词',
      '避免过于宽泛的搜索词',
      '结合地理位置和公司规模限制'
    ];
  }

  generateMarketingOptimizationTips(bestPerforming) {
    return [
      '个性化价值主张',
      '突出具体的业务收益',
      '使用行业特定语言',
      '提供明确的行动号召'
    ];
  }

  generateEmailOptimizationTips(bestPerforming) {
    return [
      '主题行保持简洁明了',
      '开头直接说明价值',
      '使用个性化称呼',
      '包含明确的下一步行动'
    ];
  }

  getUserPreferredStyles(strategies) {
    // 分析用户历史偏好
    return {
      tone: 'professional',
      length: 'medium',
      approach: 'value-focused'
    };
  }

  getUserEmailPreferences(emails) {
    return {
      subject_style: 'direct',
      content_length: 'concise',
      call_to_action: 'soft'
    };
  }

  getAvoidPatterns(searches) {
    return searches
      .filter(search => search.performance?.success_rate < 0.1)
      .map(search => search.content)
      .slice(0, 3);
  }

  extractSubject(emailContent) {
    const lines = emailContent.split('\n');
    return lines[0] || 'Subject not found';
  }

  async disconnect() {
    await this.redis.disconnect();
    console.log('🔌 Redis disconnected');
  }
}

module.exports = RedisVectorMemory;