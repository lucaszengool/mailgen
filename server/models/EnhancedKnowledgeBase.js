const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class EnhancedKnowledgeBase {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/enhanced_knowledge_base.db');
    this.db = null;
    this.isConnected = false;
    this.tablesCreated = false;
  }

  async connect() {
    // 如果已经连接，直接返回
    if (this.isConnected && this.db) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ 增强知识库连接失败:', err);
          this.isConnected = false;
          reject(err);
        } else {
          // 只在首次连接时打印日志
          if (!this.isConnected) {
            console.log('✅ 增强知识库连接成功');
          }
          this.isConnected = true;
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    try {
      // 只在首次创建时打印日志
      let tablesCreated = false;
      
      // 营销策略表
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS marketing_strategies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          website TEXT,
          goal TEXT,
          strategy_data TEXT,
          business_analysis TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 潜在客户表（增强版）
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS prospects (
          id TEXT PRIMARY KEY,
          user_id TEXT DEFAULT 'anonymous',
          campaign_id TEXT,
          email TEXT,
          company TEXT,
          contact_name TEXT,
          industry TEXT,
          status TEXT DEFAULT 'discovered',
          business_size TEXT,
          potential_interest TEXT,
          source TEXT,
          source_url TEXT,
          discovery_context TEXT,
          last_contact DATETIME,
          emails_sent INTEGER DEFAULT 0,
          replies_received INTEGER DEFAULT 0,
          last_reply TEXT,
          conversion_probability INTEGER DEFAULT 0,
          priority_score INTEGER DEFAULT 0,
          next_action TEXT,
          tags TEXT,
          manual_intervention BOOLEAN DEFAULT 0,
          auto_reply_enabled BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add user_id column if it doesn't exist (for existing databases)
      await this.execSQL(`
        ALTER TABLE prospects ADD COLUMN user_id TEXT DEFAULT 'anonymous'
      `).catch(() => {}); // Ignore error if column already exists

      // Add campaign_id column if it doesn't exist (for existing databases)
      await this.execSQL(`
        ALTER TABLE prospects ADD COLUMN campaign_id TEXT
      `).catch(() => {}); // Ignore error if column already exists

      // Create index for faster user-specific queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id)
      `);

      // Create index for faster campaign-specific queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_prospects_campaign_id ON prospects(campaign_id)
      `);

      // Create composite index for user + campaign queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_prospects_user_campaign ON prospects(user_id, campaign_id)
      `);

      // 邮件记录表
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          user_id TEXT DEFAULT 'anonymous',
          campaign_id TEXT,
          prospect_id TEXT,
          subject TEXT,
          content TEXT,
          type TEXT CHECK(type IN ('outbound', 'inbound', 'auto_reply', 'manual')),
          status TEXT,
          sent_at DATETIME,
          received_at DATETIME,
          scheduled_at DATETIME,
          from_email TEXT,
          to_email TEXT,
          message_id TEXT,
          thread_id TEXT,
          personalization_notes TEXT,
          intent_analysis TEXT,
          response_strategy TEXT,
          next_action TEXT,
          opens INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prospect_id) REFERENCES prospects (id)
        )
      `);

      // Add user_id column if it doesn't exist (for existing databases)
      await this.execSQL(`
        ALTER TABLE emails ADD COLUMN user_id TEXT DEFAULT 'anonymous'
      `).catch(() => {}); // Ignore error if column already exists

      // Add campaign_id column if it doesn't exist (for existing databases)
      await this.execSQL(`
        ALTER TABLE emails ADD COLUMN campaign_id TEXT
      `).catch(() => {}); // Ignore error if column already exists

      // Create index for faster user-specific queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)
      `);

      // Create index for faster campaign-specific queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON emails(campaign_id)
      `);

      // Create composite index for user + campaign queries
      await this.execSQL(`
        CREATE INDEX IF NOT EXISTS idx_emails_user_campaign ON emails(user_id, campaign_id)
      `);

      // 业务分析表
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS business_analysis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          website TEXT UNIQUE,
          company_name TEXT,
          industry TEXT,
          business_model TEXT,
          value_proposition TEXT,
          target_market TEXT,
          key_features TEXT,
          analysis_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // AI学习记录表
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS ai_learnings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          context_type TEXT,
          input_data TEXT,
          output_data TEXT,
          feedback_score REAL,
          improvement_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 学习数据表（新增）
      await this.execSQL(`
        CREATE TABLE IF NOT EXISTS learning_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL, -- 'email_pattern_analysis', 'customer_preferences', 'strategy_optimization'
          data TEXT NOT NULL, -- JSON格式的学习结果
          source TEXT, -- 数据来源
          confidence_score REAL, -- 置信度分数
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 只在数据库连接状态改变时打印日志
      if (!this.tablesCreated) {
        console.log('✅ 增强知识库表结构创建完成');
        this.tablesCreated = true;
      }
    } catch (error) {
      console.error('❌ 创建增强知识库表失败:', error);
      throw error;
    }
  }

  async execSQL(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async getSQL(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async allSQL(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 潜在客户管理
  async saveProspect(prospectData) {
    const sql = `
      INSERT OR REPLACE INTO prospects 
      (id, email, company, industry, status, business_size, potential_interest, 
       source, source_url, discovery_context, contact_name, last_contact, emails_sent, 
       phone, website, linkedin_profile, notes, score, tags, added_by, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const prospectId = prospectData.id || `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.execSQL(sql, [
      prospectId,
      prospectData.email,
      prospectData.company || prospectData.name || 'Unknown',
      prospectData.industry || 'unknown',
      prospectData.status || 'discovered',
      prospectData.business_size || 'unknown',
      prospectData.potential_interest || '',
      prospectData.source || 'ai_search',
      prospectData.source_url || '',
      prospectData.discovery_context || '',
      prospectData.name || prospectData.contact_name || '',
      prospectData.last_contact || null,
      prospectData.emails_sent || 0,
      prospectData.phone || '',
      prospectData.website || '',
      prospectData.linkedin_profile || '',
      prospectData.notes || '',
      prospectData.score || 0,
      JSON.stringify(prospectData.tags || []),
      'ai_agent',
      new Date().toISOString()
    ]);
    
    return { ...prospectData, id: prospectId };
  }

  // 营销策略管理
  async saveMarketingStrategy(strategyData) {
    const sql = `
      INSERT OR REPLACE INTO marketing_strategies 
      (website, goal, strategy_data, business_analysis) 
      VALUES (?, ?, ?, ?)
    `;
    
    return await this.execSQL(sql, [
      strategyData.website,
      strategyData.goal,
      JSON.stringify(strategyData.strategy),
      JSON.stringify(strategyData.business_analysis)
    ]);
  }

  async getMarketingStrategy(website, goal = null, userId = 'anonymous') {
    // Add user_id to marketing_strategies table
    const sql = 'SELECT * FROM marketing_strategies WHERE website = ? ORDER BY created_at DESC LIMIT 1';
    const result = await this.getSQL(sql, [website]);

    if (result) {
      result.strategy_data = JSON.parse(result.strategy_data);
      result.business_analysis = JSON.parse(result.business_analysis);
    }

    return result;
  }

  // 潜在客户管理
  async addProspect(prospectData) {
    const sql = `
      INSERT OR REPLACE INTO prospects
      (id, user_id, campaign_id, email, company, industry, status, business_size, potential_interest,
       source, source_url, discovery_context, conversion_probability, priority_score,
       next_action, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await this.execSQL(sql, [
      prospectData.id,
      prospectData.user_id || 'anonymous',
      prospectData.campaign_id || null,
      prospectData.email,
      prospectData.company,
      prospectData.industry,
      prospectData.status || 'discovered',
      prospectData.business_size,
      prospectData.potential_interest,
      prospectData.source,
      prospectData.source_url,
      prospectData.discovery_context,
      prospectData.conversion_probability || 0,
      prospectData.priority_score || 0,
      prospectData.next_action,
      Array.isArray(prospectData.tags) ? JSON.stringify(prospectData.tags) : prospectData.tags,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  async getProspect(prospectId, userId = 'anonymous', campaignId = null) {
    let sql, params;

    if (campaignId) {
      sql = 'SELECT * FROM prospects WHERE id = ? AND user_id = ? AND campaign_id = ?';
      params = [prospectId, userId, campaignId];
    } else {
      sql = 'SELECT * FROM prospects WHERE id = ? AND user_id = ?';
      params = [prospectId, userId];
    }

    const result = await this.getSQL(sql, params);

    if (result && result.tags) {
      try {
        result.tags = JSON.parse(result.tags);
      } catch (e) {
        result.tags = [];
      }
    }

    return result;
  }

  async getProspectByEmail(email) {
    const sql = 'SELECT * FROM prospects WHERE email = ?';
    const result = await this.getSQL(sql, [email]);
    
    if (result && result.tags) {
      try {
        result.tags = JSON.parse(result.tags);
      } catch (e) {
        result.tags = [];
      }
    }
    
    return result;
  }

  async updateProspect(prospectId, updateData, userId = 'anonymous') {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'user_id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(prospectId);
    values.push(userId);

    const sql = `UPDATE prospects SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    return await this.execSQL(sql, values);
  }

  async getAllProspects(userId = 'anonymous', campaignId = null) {
    let sql, params;

    if (campaignId) {
      sql = 'SELECT * FROM prospects WHERE user_id = ? AND campaign_id = ? ORDER BY priority_score DESC, created_at DESC';
      params = [userId, campaignId];
    } else {
      sql = 'SELECT * FROM prospects WHERE user_id = ? ORDER BY priority_score DESC, created_at DESC';
      params = [userId];
    }

    const results = await this.allSQL(sql, params);

    return results.map(prospect => {
      if (prospect.tags) {
        try {
          prospect.tags = JSON.parse(prospect.tags);
        } catch (e) {
          prospect.tags = [];
        }
      }
      return prospect;
    });
  }

  async getProspectsByStatus(status) {
    const sql = 'SELECT * FROM prospects WHERE status = ? ORDER BY priority_score DESC';
    return await this.allSQL(sql, [status]);
  }

  // 邮件管理
  async saveEmail(emailData) {
    const sql = `
      INSERT INTO emails
      (id, user_id, campaign_id, prospect_id, subject, content, type, status, sent_at, received_at,
       scheduled_at, from_email, to_email, message_id, thread_id,
       personalization_notes, intent_analysis, response_strategy, next_action)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const id = emailData.id || `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return await this.execSQL(sql, [
      id,
      emailData.user_id || 'anonymous',
      emailData.campaign_id || null,
      emailData.prospect_id,
      emailData.subject,
      emailData.content,
      emailData.type,
      emailData.status,
      emailData.sent_at,
      emailData.received_at,
      emailData.scheduled_at,
      emailData.from_email,
      emailData.to_email,
      emailData.message_id,
      emailData.thread_id,
      emailData.personalization_notes,
      emailData.intent_analysis,
      emailData.response_strategy,
      emailData.next_action
    ]);
  }

  async getEmailHistory(prospectId, userId = 'anonymous', campaignId = null) {
    let sql, params;

    if (campaignId) {
      sql = `
        SELECT * FROM emails
        WHERE prospect_id = ? AND user_id = ? AND campaign_id = ?
        ORDER BY created_at ASC
      `;
      params = [prospectId, userId, campaignId];
    } else {
      sql = `
        SELECT * FROM emails
        WHERE prospect_id = ? AND user_id = ?
        ORDER BY created_at ASC
      `;
      params = [prospectId, userId];
    }

    return await this.allSQL(sql, params);
  }

  async getEmailById(emailId) {
    const sql = 'SELECT * FROM emails WHERE id = ?';
    return await this.getSQL(sql, [emailId]);
  }

  async getNewReplies() {
    const sql = `
      SELECT * FROM emails 
      WHERE type = 'inbound' AND status = 'new' 
      ORDER BY received_at DESC
    `;
    return await this.allSQL(sql);
  }

  async markEmailAsProcessed(emailId) {
    const sql = 'UPDATE emails SET status = ? WHERE id = ?';
    return await this.execSQL(sql, ['processed', emailId]);
  }

  // 业务分析管理
  async saveBusinessAnalysis(analysisData) {
    const sql = `
      INSERT OR REPLACE INTO business_analysis 
      (website, company_name, industry, business_model, value_proposition, 
       target_market, key_features, analysis_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return await this.execSQL(sql, [
      analysisData.website || analysisData.url,
      analysisData.companyName,
      analysisData.industry,
      analysisData.businessModel,
      analysisData.valueProposition,
      JSON.stringify(analysisData.targetMarket || []),
      JSON.stringify(analysisData.keyFeatures || []),
      JSON.stringify(analysisData)
    ]);
  }

  async getBusinessAnalysis(website) {
    const sql = 'SELECT * FROM business_analysis WHERE website = ? ORDER BY created_at DESC LIMIT 1';
    const result = await this.getSQL(sql, [website]);
    
    if (result) {
      try {
        result.target_market = JSON.parse(result.target_market);
        result.key_features = JSON.parse(result.key_features);
        result.analysis_data = JSON.parse(result.analysis_data);
      } catch (e) {
        console.warn('解析业务分析数据失败:', e.message);
      }
    }
    
    return result;
  }

  // AI学习管理
  async recordLearning(contextType, inputData, outputData, feedbackScore = null) {
    const sql = `
      INSERT INTO ai_learnings 
      (context_type, input_data, output_data, feedback_score) 
      VALUES (?, ?, ?, ?)
    `;
    
    return await this.execSQL(sql, [
      contextType,
      JSON.stringify(inputData),
      JSON.stringify(outputData),
      feedbackScore
    ]);
  }

  async getLearnings(contextType, limit = 100) {
    const sql = `
      SELECT * FROM ai_learnings 
      WHERE context_type = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    const results = await this.allSQL(sql, [contextType, limit]);
    
    return results.map(learning => {
      try {
        learning.input_data = JSON.parse(learning.input_data);
        learning.output_data = JSON.parse(learning.output_data);
      } catch (e) {
        console.warn('解析AI学习数据失败:', e.message);
      }
      return learning;
    });
  }

  // 统计分析
  async getStats() {
    const stats = {};
    
    // 潜在客户统计
    const prospectStats = await this.getSQL(`
      SELECT 
        COUNT(*) as total_prospects,
        SUM(CASE WHEN status = 'discovered' THEN 1 ELSE 0 END) as new_prospects,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_prospects,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_prospects,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_prospects,
        AVG(conversion_probability) as avg_conversion_probability
      FROM prospects
    `);
    
    // 邮件统计
    const emailStats = await this.getSQL(`
      SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN type = 'outbound' THEN 1 ELSE 0 END) as outbound_emails,
        SUM(CASE WHEN type = 'inbound' THEN 1 ELSE 0 END) as inbound_emails,
        SUM(CASE WHEN type = 'auto_reply' THEN 1 ELSE 0 END) as auto_replies,
        SUM(opens) as total_opens,
        SUM(clicks) as total_clicks
      FROM emails
    `);
    
    return {
      prospects: prospectStats,
      emails: emailStats
    };
  }

  // 学习数据管理方法
  async addLearning(type, data, source = 'ollama_agent', confidenceScore = null) {
    const sql = `
      INSERT INTO learning_data (type, data, source, confidence_score) 
      VALUES (?, ?, ?, ?)
    `;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    return await this.execSQL(sql, [type, dataStr, source, confidenceScore]);
  }

  async getLearning(type, limit = 10) {
    const sql = `
      SELECT * FROM learning_data 
      WHERE type = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    const results = await this.allSQL(sql, [type, limit]);
    return results.map(row => {
      try {
        row.data = JSON.parse(row.data);
      } catch (e) {
        // 保持原始字符串格式
      }
      return row;
    });
  }

  async getAllLearnings(limit = 50) {
    const sql = `
      SELECT * FROM learning_data 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    const results = await this.allSQL(sql, [limit]);
    return results.map(row => {
      try {
        row.data = JSON.parse(row.data);
      } catch (e) {
        // 保持原始字符串格式
      }
      return row;
    });
  }

  async updateLearning(id, data, confidenceScore = null) {
    const sql = `
      UPDATE learning_data 
      SET data = ?, confidence_score = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    return await this.execSQL(sql, [dataStr, confidenceScore, id]);
  }

  async deleteLearning(id) {
    const sql = 'DELETE FROM learning_data WHERE id = ?';
    return await this.execSQL(sql, [id]);
  }

  async cleanOldLearnings(daysOld = 30) {
    const sql = `
      DELETE FROM learning_data 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `;
    return await this.execSQL(sql, [daysOld]);
  }

  // 获取学习统计
  async getLearningStats() {
    const sql = `
      SELECT 
        type,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence,
        MAX(created_at) as latest_learning
      FROM learning_data 
      GROUP BY type
      ORDER BY count DESC
    `;
    
    return await this.allSQL(sql);
  }

  async updateEmailStatus(emailId, status, messageId = null) {
    const sql = 'UPDATE emails SET status = ?, message_id = ?, sent_at = ? WHERE id = ?';
    return await this.execSQL(sql, [status, messageId, new Date().toISOString(), emailId]);
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('❌ 关闭增强知识库失败:', err);
          } else {
            console.log('✅ 增强知识库连接已关闭');
          }
          resolve();
        });
      });
    }
  }
}

module.exports = EnhancedKnowledgeBase;