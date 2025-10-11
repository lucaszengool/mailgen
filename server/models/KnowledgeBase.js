const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class KnowledgeBase {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/knowledge-base.db');
    this.dataDir = path.dirname(this.dbPath);
    this.db = null;
    
    this.ensureDirectories();
    this.initDatabase();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📁 知识库目录已创建');
    }
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ 知识库数据库初始化失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 知识库数据库连接成功');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // 网站分析表
        `CREATE TABLE IF NOT EXISTS websites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT UNIQUE NOT NULL,
          title TEXT,
          description TEXT,
          keywords TEXT,
          industry TEXT,
          business_type TEXT,
          company_size TEXT,
          technologies TEXT,
          analysis_data TEXT,
          company_name TEXT,
          company_branding TEXT,
          sender_name TEXT,
          sender_title TEXT,
          campaign_goal TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 潜在客户表
        `CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          company TEXT,
          role TEXT,
          industry TEXT,
          business_type TEXT,
          website TEXT,
          phone TEXT,
          source TEXT,
          campaign_goal TEXT,
          priority TEXT,
          status TEXT,
          notes TEXT,
          personalized_insights TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_contacted_at DATETIME,
          response_status TEXT
        )`,

        // 邮件历史表
        `CREATE TABLE IF NOT EXISTS email_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id TEXT,
          campaign_id TEXT,
          email_type TEXT,
          subject TEXT,
          body TEXT,
          sent_at DATETIME,
          opened_at DATETIME,
          clicked_at DATETIME,
          replied_at DATETIME,
          status TEXT,
          message_id TEXT,
          ai_insights TEXT,
          personalization_level TEXT,
          FOREIGN KEY (lead_id) REFERENCES leads (id)
        )`,

        // 对话历史表
        `CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_email TEXT NOT NULL,
          message_type TEXT,
          subject TEXT,
          content TEXT,
          sentiment TEXT,
          intent TEXT,
          confidence_score REAL,
          ai_analysis TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 市场调研数据表
        `CREATE TABLE IF NOT EXISTS market_research (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          website_url TEXT,
          research_type TEXT,
          data TEXT,
          insights TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME
        )`,

        // 竞争对手分析表
        `CREATE TABLE IF NOT EXISTS competitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          website TEXT,
          industry TEXT,
          strengths TEXT,
          weaknesses TEXT,
          pricing TEXT,
          analysis TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 营销活动表
        `CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY,
          name TEXT,
          goal TEXT,
          target_website TEXT,
          status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          started_at DATETIME,
          completed_at DATETIME,
          stats TEXT,
          settings TEXT
        )`,

        // AI模型使用统计表
        `CREATE TABLE IF NOT EXISTS ai_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model_type TEXT,
          operation TEXT,
          input_tokens INTEGER,
          output_tokens INTEGER,
          cost REAL,
          success BOOLEAN,
          execution_time REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 用户配置表
        `CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      tables.forEach((sql, index) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error(`❌ 创建表失败 ${index}:`, err.message);
            reject(err);
          } else {
            completed++;
            if (completed === tables.length) {
              console.log('✅ 知识库表结构创建完成');
              resolve();
            }
          }
        });
      });
    });
  }

  // 网站分析数据管理
  async saveWebsiteAnalysis(websiteData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO websites 
        (url, title, description, keywords, industry, business_type, company_size, technologies, analysis_data, 
         company_name, company_branding, sender_name, sender_title, campaign_goal, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
      
      const params = [
        websiteData.url,
        websiteData.title,
        websiteData.description,
        websiteData.keywords,
        websiteData.industry,
        websiteData.businessType,
        websiteData.companySize,
        JSON.stringify(websiteData.technologies),
        JSON.stringify(websiteData),
        websiteData.companyName,
        JSON.stringify(websiteData.branding || {}),
        websiteData.senderName,
        websiteData.senderTitle,
        websiteData.campaignGoal
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ 保存网站分析失败:', err.message);
          reject(err);
        } else {
          console.log(`✅ 网站分析已保存: ${websiteData.url}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async getWebsiteAnalysis(url) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM websites WHERE url = ?';
      this.db.get(sql, [url], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row && row.analysis_data) {
            row.analysis_data = JSON.parse(row.analysis_data);
          }
          if (row && row.company_branding) {
            row.company_branding = JSON.parse(row.company_branding);
          }
          resolve(row);
        }
      });
    });
  }

  // 获取发件人信息
  async getSenderInfo(url) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT company_name, sender_name, sender_title, campaign_goal FROM websites WHERE url = ?';
      this.db.get(sql, [url], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 潜在客户管理
  async saveLead(leadData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO leads 
        (id, name, email, company, role, industry, business_type, website, phone, source, 
         campaign_goal, priority, status, notes, personalized_insights, updated_at, 
         last_contacted_at, response_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`;
      
      const params = [
        leadData.id,
        leadData.name,
        leadData.email,
        leadData.company,
        leadData.role,
        leadData.industry,
        leadData.businessType,
        leadData.website,
        leadData.phone,
        leadData.source,
        leadData.campaignGoal,
        leadData.priority,
        leadData.status,
        leadData.notes,
        JSON.stringify(leadData.personalizedInsights),
        leadData.lastContactedAt,
        leadData.responseStatus
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ 保存潜在客户失败:', err.message);
          reject(err);
        } else {
          resolve(leadData.id);
        }
      });
    });
  }

  async getLeadById(leadId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leads WHERE id = ?';
      this.db.get(sql, [leadId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row && row.personalized_insights) {
            row.personalized_insights = JSON.parse(row.personalized_insights);
          }
          resolve(row);
        }
      });
    });
  }

  async getLeadsByStatus(status) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC';
      this.db.all(sql, [status], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          rows.forEach(row => {
            if (row.personalized_insights) {
              row.personalized_insights = JSON.parse(row.personalized_insights);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  async getAllLeads(limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leads ORDER BY created_at DESC LIMIT ?';
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          rows.forEach(row => {
            if (row.personalized_insights) {
              row.personalized_insights = JSON.parse(row.personalized_insights);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  async updateLeadStatus(leadId, status, notes = '') {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE leads SET 
        status = ?, 
        notes = COALESCE(notes, '') || CASE WHEN ? != '' THEN ' | ' || ? ELSE '' END,
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`;
      
      this.db.run(sql, [status, notes, notes, leadId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // 邮件历史管理
  async saveEmailHistory(emailData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO email_history 
        (lead_id, campaign_id, email_type, subject, body, sent_at, status, message_id, 
         ai_insights, personalization_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        emailData.leadId,
        emailData.campaignId,
        emailData.emailType,
        emailData.subject,
        emailData.body,
        emailData.sentAt,
        emailData.status,
        emailData.messageId,
        JSON.stringify(emailData.aiInsights),
        emailData.personalizationLevel
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getEmailHistory(leadId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM email_history WHERE lead_id = ? ORDER BY sent_at DESC`;
      this.db.all(sql, [leadId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          rows.forEach(row => {
            if (row.ai_insights) {
              row.ai_insights = JSON.parse(row.ai_insights);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  // 对话历史管理
  async saveConversation(conversationData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO conversations 
        (lead_email, message_type, subject, content, sentiment, intent, confidence_score, ai_analysis)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        conversationData.leadEmail,
        conversationData.messageType,
        conversationData.subject,
        conversationData.content,
        conversationData.sentiment,
        conversationData.intent,
        conversationData.confidenceScore,
        JSON.stringify(conversationData.aiAnalysis)
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getConversationHistory(leadEmail) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM conversations WHERE lead_email = ? ORDER BY created_at DESC`;
      this.db.all(sql, [leadEmail], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          rows.forEach(row => {
            if (row.ai_analysis) {
              row.ai_analysis = JSON.parse(row.ai_analysis);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  // 市场调研数据管理
  async saveMarketResearch(researchData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO market_research 
        (website_url, research_type, data, insights, expires_at)
        VALUES (?, ?, ?, ?, datetime('now', '+7 days'))`;
      
      const params = [
        researchData.websiteUrl,
        researchData.researchType,
        JSON.stringify(researchData.data),
        JSON.stringify(researchData.insights)
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getMarketResearch(websiteUrl, researchType) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM market_research 
        WHERE website_url = ? AND research_type = ? 
        AND expires_at > datetime('now') 
        ORDER BY created_at DESC LIMIT 1`;
      
      this.db.get(sql, [websiteUrl, researchType], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.data = JSON.parse(row.data);
            row.insights = JSON.parse(row.insights);
          }
          resolve(row);
        }
      });
    });
  }

  // 营销活动管理
  async saveCampaign(campaignData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO campaigns 
        (id, name, goal, target_website, status, started_at, stats, settings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        campaignData.id,
        campaignData.name,
        campaignData.goal,
        campaignData.targetWebsite,
        campaignData.status,
        campaignData.startedAt,
        JSON.stringify(campaignData.stats),
        JSON.stringify(campaignData.settings)
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(campaignData.id);
        }
      });
    });
  }

  async getCampaign(campaignId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM campaigns WHERE id = ?';
      this.db.get(sql, [campaignId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            if (row.stats) row.stats = JSON.parse(row.stats);
            if (row.settings) row.settings = JSON.parse(row.settings);
          }
          resolve(row);
        }
      });
    });
  }

  // AI使用统计
  async logAIUsage(usageData) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO ai_usage 
        (model_type, operation, input_tokens, output_tokens, cost, success, execution_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        usageData.modelType,
        usageData.operation,
        usageData.inputTokens || 0,
        usageData.outputTokens || 0,
        usageData.cost || 0,
        usageData.success,
        usageData.executionTime || 0
      ];

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // 用户设置管理
  async saveSetting(key, value) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO user_settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)`;
      
      this.db.run(sql, [key, JSON.stringify(value)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT value FROM user_settings WHERE key = ?';
      this.db.get(sql, [key], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? JSON.parse(row.value) : null);
        }
      });
    });
  }

  // 统计和分析方法
  async getKnowledgeBaseStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as websites FROM websites',
        'SELECT COUNT(*) as leads FROM leads',
        'SELECT COUNT(*) as emails FROM email_history',
        'SELECT COUNT(*) as conversations FROM conversations',
        'SELECT COUNT(*) as campaigns FROM campaigns'
      ];

      const stats = {};
      let completed = 0;

      queries.forEach((query, index) => {
        this.db.get(query, (err, row) => {
          if (err) {
            console.error(`统计查询失败 ${index}:`, err.message);
          } else {
            Object.assign(stats, row);
          }
          
          completed++;
          if (completed === queries.length) {
            // 添加额外统计
            this.getDetailedStats().then(detailedStats => {
              resolve({ ...stats, ...detailedStats });
            }).catch(reject);
          }
        });
      });
    });
  }

  async getDetailedStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        // 按状态分组的潜在客户
        `SELECT status, COUNT(*) as count FROM leads GROUP BY status`,
        // 按行业分组的潜在客户
        `SELECT industry, COUNT(*) as count FROM leads GROUP BY industry ORDER BY count DESC LIMIT 5`,
        // 最近7天的活动
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM leads 
         WHERE created_at >= datetime('now', '-7 days') 
         GROUP BY DATE(created_at)`,
        // 邮件发送统计
        `SELECT status, COUNT(*) as count FROM email_history GROUP BY status`,
        // AI使用统计
        `SELECT operation, COUNT(*) as count, AVG(execution_time) as avg_time 
         FROM ai_usage GROUP BY operation`
      ];

      const results = {};
      let completed = 0;

      queries.forEach((query, index) => {
        this.db.all(query, (err, rows) => {
          if (err) {
            console.error(`详细统计查询失败 ${index}:`, err.message);
          } else {
            const statNames = ['leadsByStatus', 'leadsByIndustry', 'recentActivity', 'emailStats', 'aiUsage'];
            results[statNames[index]] = rows;
          }
          
          completed++;
          if (completed === queries.length) {
            resolve(results);
          }
        });
      });
    });
  }

  // 搜索功能
  async searchLeads(searchTerm) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM leads 
        WHERE name LIKE ? OR email LIKE ? OR company LIKE ? 
        ORDER BY created_at DESC LIMIT 50`;
      
      const term = `%${searchTerm}%`;
      this.db.all(sql, [term, term, term], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          rows.forEach(row => {
            if (row.personalized_insights) {
              row.personalized_insights = JSON.parse(row.personalized_insights);
            }
          });
          resolve(rows);
        }
      });
    });
  }

  // 数据清理
  async cleanup() {
    return new Promise((resolve, reject) => {
      const cleanupQueries = [
        // 清理过期的市场调研数据
        `DELETE FROM market_research WHERE expires_at < datetime('now')`,
        // 清理30天前的AI使用记录
        `DELETE FROM ai_usage WHERE created_at < datetime('now', '-30 days')`,
        // 清理已完成超过90天的营销活动
        `DELETE FROM campaigns WHERE status = 'completed' AND completed_at < datetime('now', '-90 days')`
      ];

      let completed = 0;
      let totalDeleted = 0;

      cleanupQueries.forEach((query, index) => {
        this.db.run(query, function(err) {
          if (err) {
            console.error(`清理查询失败 ${index}:`, err.message);
          } else {
            totalDeleted += this.changes;
          }
          
          completed++;
          if (completed === cleanupQueries.length) {
            console.log(`🧹 知识库清理完成，删除了 ${totalDeleted} 条过期记录`);
            resolve(totalDeleted);
          }
        });
      });
    });
  }

  // 数据导出
  async exportData(type = 'all') {
    const exportData = {};
    
    if (type === 'all' || type === 'leads') {
      exportData.leads = await this.getAllLeads(1000);
    }
    
    if (type === 'all' || type === 'websites') {
      exportData.websites = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM websites', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    
    if (type === 'all' || type === 'campaigns') {
      exportData.campaigns = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM campaigns', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }

    return exportData;
  }

  // 关闭数据库连接
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('✅ 知识库数据库已关闭');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = KnowledgeBase;