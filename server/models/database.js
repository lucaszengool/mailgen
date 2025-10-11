const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../data/email_agent.db'), (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      } else {
        console.log('✅ SQLite数据库连接成功');
        this.initTables();
      }
    });
  }

  initTables() {
    // 邮件发送记录表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_email TEXT NOT NULL,
        subject TEXT,
        campaign_id TEXT,
        message_id TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        recipient_index INTEGER,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 邮件打开跟踪表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_opens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_id TEXT NOT NULL,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT
      )
    `);

    // 邮件点击跟踪表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        link_id TEXT NOT NULL,
        target_url TEXT,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT
      )
    `);

    // 营销活动表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        target_audience TEXT,
        email_template TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 联系人表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        company TEXT,
        position TEXT,
        industry TEXT,
        phone TEXT,
        address TEXT,
        source TEXT,
        tags TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SMTP配置表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS smtp_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        secure BOOLEAN DEFAULT 0,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 数据库表初始化完成');
  }

  // 记录邮件发送
  logEmailSent(emailData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_logs (to_email, subject, campaign_id, message_id, status, error_message, recipient_index, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        emailData.to,
        emailData.subject,
        emailData.campaignId,
        emailData.messageId,
        emailData.status,
        emailData.error,
        emailData.recipientIndex,
        emailData.sentAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  // 记录邮件打开
  logEmailOpen(openData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_opens (tracking_id, opened_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        openData.trackingId,
        openData.openedAt,
        openData.userAgent,
        openData.ip
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  // 记录邮件点击
  logEmailClick(clickData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_clicks (campaign_id, link_id, target_url, clicked_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        clickData.campaignId,
        clickData.linkId,
        clickData.targetUrl,
        clickData.clickedAt,
        clickData.userAgent,
        clickData.ip
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  // 获取邮件统计数据
  getEmailStats(campaignId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sent,
          DATE(sent_at) as date
        FROM email_logs
      `;
      
      const params = [];
      if (campaignId) {
        query += ' WHERE campaign_id = ?';
        params.push(campaignId);
      }
      
      query += ' GROUP BY DATE(sent_at) ORDER BY date DESC LIMIT 30';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 获取打开率和点击率
          this.getEngagementStats(campaignId).then(engagement => {
            resolve({
              sendingStats: rows,
              engagement: engagement
            });
          });
        }
      });
    });
  }

  // 获取互动统计数据
  getEngagementStats(campaignId = null) {
    return new Promise((resolve, reject) => {
      let openQuery = 'SELECT COUNT(DISTINCT tracking_id) as opens FROM email_opens';
      let clickQuery = 'SELECT COUNT(*) as clicks FROM email_clicks';
      
      const params = [];
      if (campaignId) {
        openQuery += ' WHERE tracking_id LIKE ?';
        clickQuery += ' WHERE campaign_id = ?';
        params.push(campaignId + '%');
      }

      // 获取打开数据
      this.db.get(openQuery, campaignId ? [campaignId + '%'] : [], (err, openResult) => {
        if (err) {
          reject(err);
          return;
        }

        // 获取点击数据
        this.db.get(clickQuery, campaignId ? [campaignId] : [], (err, clickResult) => {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            totalOpens: openResult.opens || 0,
            totalClicks: clickResult.clicks || 0
          });
        });
      });
    });
  }

  // 保存营销活动
  saveCampaign(campaign) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO campaigns (id, name, description, status, target_audience, email_template, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        campaign.id,
        campaign.name,
        campaign.description,
        campaign.status,
        JSON.stringify(campaign.targetAudience),
        campaign.emailTemplate
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(campaign.id);
        }
      });
      
      stmt.finalize();
    });
  }

  // 获取营销活动列表
  getCampaigns(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const campaigns = rows.map(row => ({
              ...row,
              targetAudience: JSON.parse(row.target_audience || '{}')
            }));
            resolve(campaigns);
          }
        }
      );
    });
  }

  // 保存联系人
  saveContact(contact) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO contacts 
        (email, name, company, position, industry, phone, address, source, tags, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        contact.email,
        contact.name,
        contact.company,
        contact.position,
        contact.industry,
        contact.phone,
        contact.address,
        contact.source,
        contact.tags,
        contact.notes
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  // 获取联系人列表
  getContacts(filter = {}, limit = 100) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM contacts WHERE 1=1';
      const params = [];

      if (filter.industry) {
        query += ' AND industry = ?';
        params.push(filter.industry);
      }
      
      if (filter.company) {
        query += ' AND company LIKE ?';
        params.push('%' + filter.company + '%');
      }
      
      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 关闭数据库连接
  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库时出错:', err.message);
        } else {
          console.log('数据库连接已关闭');
        }
        resolve();
      });
    });
  }
}

// 确保数据目录存在
const fs = require('fs');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = new Database();