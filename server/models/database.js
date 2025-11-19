const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    // 🔥 RAILWAY: Use data directory that persists on Railway
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/email_agent.db');
    console.log(`🔧 [DATABASE] Using path: ${dbPath}`);
    console.log(`🔧 [DATABASE] Environment: ${process.env.NODE_ENV || 'development'}`);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Connection failed:', err.message);
      } else {
        console.log('✅ [DATABASE] SQLite connected successfully');
        console.log(`📍 [DATABASE] Location: ${dbPath}`);
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
        user_id TEXT NOT NULL DEFAULT 'anonymous',
        message_id TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        recipient_index INTEGER,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🔥 MIGRATION: Add user_id column to existing email_logs tables
    // Check if user_id column exists
    this.db.all(`PRAGMA table_info(email_logs)`, (err, columns) => {
      if (!err && columns) {
        const hasUserId = columns.some(col => col.name === 'user_id');
        if (!hasUserId) {
          console.log('🔄 MIGRATION: Adding user_id column to email_logs table...');
          this.db.run(`ALTER TABLE email_logs ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous'`, (err) => {
            if (err) {
              console.error('❌ Failed to add user_id column:', err);
            } else {
              console.log('✅ Successfully added user_id column to email_logs table');
            }
          });
        } else {
          console.log('✅ user_id column already exists in email_logs table');
        }
      } else if (err) {
        console.error('❌ Failed to check email_logs table structure:', err);
      }
    });

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

    // 邮件回复跟踪表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        replied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        subject TEXT,
        message_id TEXT
      )
    `);

    // 邮件退信跟踪表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_bounces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        bounced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        bounce_type TEXT,
        reason TEXT
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
        user_id TEXT NOT NULL DEFAULT 'anonymous',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 联系人表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
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
        user_id TEXT NOT NULL DEFAULT 'anonymous',
        campaign_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, user_id, campaign_id)
      )
    `);

    // 邮件草稿表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_drafts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        campaign_id TEXT,
        email_key TEXT NOT NULL,
        subject TEXT,
        preheader TEXT,
        components TEXT NOT NULL,
        html TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email_key, user_id, campaign_id)
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

    // 用户配置表 (for website analysis, campaign settings, etc.)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        smtp_config TEXT,
        website_config TEXT,
        campaign_config TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 迁移现有数据：为旧数据添加 user_id
    this.migrateExistingData();

    console.log('✅ 数据库表初始化完成');
  }

  // 迁移现有数据
  migrateExistingData() {
    // 检查 contacts 表是否有 user_id 列
    this.db.all("PRAGMA table_info(contacts)", (err, columns) => {
      if (err) {
        console.error('检查 contacts 表结构失败:', err);
        return;
      }

      const hasUserId = columns.some(col => col.name === 'user_id');
      if (!hasUserId) {
        // 添加 user_id 列到现有表
        this.db.run("ALTER TABLE contacts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous'", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 user_id 到 contacts 失败:', err);
          } else {
            console.log('✅ Contacts 表已添加 user_id 列');
          }
        });
      }

      const hasCampaignId = columns.some(col => col.name === 'campaign_id');
      if (!hasCampaignId) {
        // 添加 campaign_id 列到现有表
        this.db.run("ALTER TABLE contacts ADD COLUMN campaign_id TEXT", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 campaign_id 到 contacts 失败:', err);
          } else {
            console.log('✅ Contacts 表已添加 campaign_id 列');
          }
        });
      }
    });

    // 检查 campaigns 表是否有 user_id 列
    this.db.all("PRAGMA table_info(campaigns)", (err, columns) => {
      if (err) {
        console.error('检查 campaigns 表结构失败:', err);
        return;
      }

      const hasUserId = columns.some(col => col.name === 'user_id');
      if (!hasUserId) {
        // 添加 user_id 列到现有表
        this.db.run("ALTER TABLE campaigns ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous'", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 user_id 到 campaigns 失败:', err);
          } else {
            console.log('✅ Campaigns 表已添加 user_id 列');
          }
        });
      }
    });

    // 检查 email_drafts 表是否有 campaign_id 列
    this.db.all("PRAGMA table_info(email_drafts)", (err, columns) => {
      if (err) {
        console.error('检查 email_drafts 表结构失败:', err);
        return;
      }

      const hasCampaignId = columns.some(col => col.name === 'campaign_id');
      if (!hasCampaignId) {
        // 添加 campaign_id 列到现有表
        this.db.run("ALTER TABLE email_drafts ADD COLUMN campaign_id TEXT", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 campaign_id 到 email_drafts 失败:', err);
          } else {
            console.log('✅ Email Drafts 表已添加 campaign_id 列');
          }
        });
      }

      const hasStatus = columns.some(col => col.name === 'status');
      if (!hasStatus) {
        // 添加 status 列到现有表
        this.db.run("ALTER TABLE email_drafts ADD COLUMN status TEXT DEFAULT 'draft'", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 status 到 email_drafts 失败:', err);
          } else {
            console.log('✅ Email Drafts 表已添加 status 列');
          }
        });
      }
    });

    // 检查 smtp_configs 表是否有 user_id 列
    this.db.all("PRAGMA table_info(smtp_configs)", (err, columns) => {
      if (err) {
        console.error('检查 smtp_configs 表结构失败:', err);
        return;
      }

      const hasUserId = columns.some(col => col.name === 'user_id');
      if (!hasUserId) {
        // 添加 user_id 列到现有表
        this.db.run("ALTER TABLE smtp_configs ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous'", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('添加 user_id 到 smtp_configs 失败:', err);
          } else {
            console.log('✅ SMTP Configs 表已添加 user_id 列');
          }
        });
      }
    });
  }

  // 记录邮件发送
  logEmailSent(emailData, userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_logs (to_email, subject, campaign_id, user_id, message_id, status, error_message, recipient_index, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        emailData.to,
        emailData.subject,
        emailData.campaignId,
        userId, // 🔥 CRITICAL FIX: Add user_id for multi-user isolation
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

  // 🔥 NEW: Get email logs with user and campaign filtering (like getContacts for prospects)
  getEmailLogs(userId = 'anonymous', filter = {}, limit = 100) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM email_logs WHERE user_id = ?';
      const params = [userId];

      // 🔥 CRITICAL: Filter by campaign_id if provided
      if (filter.campaignId) {
        query += ' AND campaign_id = ?';
        params.push(filter.campaignId);
      }

      if (filter.status) {
        query += ' AND status = ?';
        params.push(filter.status);
      }

      if (filter.toEmail) {
        query += ' AND to_email LIKE ?';
        params.push('%' + filter.toEmail + '%');
      }

      query += ' ORDER BY sent_at DESC LIMIT ?';
      params.push(limit);

      console.log(`📧 [getEmailLogs] Query: ${query}`);
      console.log(`📧 [getEmailLogs] Params:`, params);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📧 [getEmailLogs] Found ${rows?.length || 0} email logs for user=${userId}, campaign=${filter.campaignId || 'all'}`);
          resolve(rows);
        }
      });
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

  // 记录邮件回复
  logEmailReply(replyData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_replies (campaign_id, recipient_email, replied_at, subject, message_id)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        replyData.campaignId || 'unknown',
        replyData.recipientEmail,
        replyData.repliedAt || new Date().toISOString(),
        replyData.subject || '',
        replyData.messageId || ''
      ], function(err) {
        if (err) {
          console.error('[DB] Error logging reply:', err);
          reject(err);
        } else {
          console.log(`[DB] ✅ Reply logged: ${replyData.recipientEmail}`);
          resolve(this.lastID);
        }
      });

      stmt.finalize();
    });
  }

  // 记录邮件退信
  logEmailBounce(bounceData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_bounces (campaign_id, recipient_email, bounced_at, bounce_type, reason)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        bounceData.campaignId || 'unknown',
        bounceData.recipientEmail,
        bounceData.bouncedAt || new Date().toISOString(),
        bounceData.bounceType || 'hard',
        bounceData.reason || 'Unknown'
      ], function(err) {
        if (err) {
          console.error('[DB] Error logging bounce:', err);
          reject(err);
        } else {
          console.log(`[DB] ✅ Bounce logged: ${bounceData.recipientEmail}`);
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
  saveCampaign(campaign, userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO campaigns (id, name, description, status, target_audience, email_template, user_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([
        campaign.id,
        campaign.name,
        campaign.description,
        campaign.status,
        JSON.stringify(campaign.targetAudience),
        campaign.emailTemplate,
        userId
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
  getCampaigns(userId = 'anonymous', limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
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
  saveContact(contact, userId = 'anonymous', campaignId = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO contacts
        (email, name, company, position, industry, phone, address, source, tags, notes, status, user_id, campaign_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
        contact.notes,
        contact.status || 'active',  // 🔥 CRITICAL FIX: Always set status to 'active' by default
        userId,
        campaignId
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
  getContacts(userId = 'anonymous', filter = {}, limit = 100) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM contacts WHERE user_id = ?';
      const params = [userId];

      // 🔥 CRITICAL: Filter by campaign_id if provided
      if (filter.campaignId) {
        query += ' AND campaign_id = ?';
        params.push(filter.campaignId);
      }

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

  // 保存邮件草稿
  saveEmailDraft(draft, userId = 'anonymous', campaignId = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO email_drafts
        (id, user_id, campaign_id, email_key, subject, preheader, components, html, metadata, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([
        draft.id || `draft_${Date.now()}`,
        userId,
        campaignId,
        draft.emailKey,
        draft.subject,
        draft.preheader,
        JSON.stringify(draft.components),
        draft.html,
        JSON.stringify(draft.metadata),
        draft.status || 'draft'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(draft.id || `draft_${Date.now()}`);
        }
      });

      stmt.finalize();
    });
  }

  // 获取邮件草稿列表
  getEmailDrafts(userId = 'anonymous', campaignId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM email_drafts WHERE user_id = ?';
      const params = [userId];

      // 🔥 CRITICAL: Filter by campaign_id if provided
      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }

      query += ' ORDER BY updated_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const drafts = rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            emailKey: row.email_key,
            subject: row.subject,
            preheader: row.preheader,
            components: JSON.parse(row.components || '[]'),
            html: row.html,
            metadata: JSON.parse(row.metadata || '{}'),
            status: row.status || 'draft',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          resolve(drafts);
        }
      });
    });
  }

  // 获取单个邮件草稿
  getEmailDraft(emailKey, userId = 'anonymous', campaignId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM email_drafts WHERE email_key = ? AND user_id = ?';
      const params = [emailKey, userId];

      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            emailKey: row.email_key,
            subject: row.subject,
            preheader: row.preheader,
            components: JSON.parse(row.components || '[]'),
            html: row.html,
            metadata: JSON.parse(row.metadata || '{}'),
            status: row.status || 'draft',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          });
        }
      });
    });
  }

  // 删除邮件草稿
  deleteEmailDraft(emailKey, userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM email_drafts WHERE email_key = ? AND user_id = ?',
        [emailKey, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  // 💾 Save SMTP config for user
  saveSMTPConfig(smtpConfig, userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      // First, unset any existing default for this user
      this.db.run(
        'UPDATE smtp_configs SET is_default = 0 WHERE user_id = ?',
        [userId],
        (err) => {
          if (err) {
            console.error('Error unsetting default SMTP:', err);
          }

          // Then insert or update the new config
          const stmt = this.db.prepare(`
            INSERT INTO smtp_configs (name, host, port, secure, username, password, is_default, user_id)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(id) DO UPDATE SET
              host = excluded.host,
              port = excluded.port,
              secure = excluded.secure,
              username = excluded.username,
              password = excluded.password,
              is_default = 1
          `);

          stmt.run(
            smtpConfig.provider || 'gmail',
            smtpConfig.host || 'smtp.gmail.com',
            smtpConfig.port || 587,
            smtpConfig.secure ? 1 : 0,
            smtpConfig.username || smtpConfig.user || smtpConfig.email,
            smtpConfig.password || smtpConfig.pass,
            userId,
            function(err) {
              if (err) {
                reject(err);
              } else {
                console.log(`✅ [User: ${userId}] SMTP config saved to database`);
                resolve({ id: this.lastID, message: 'SMTP config saved successfully' });
              }
            }
          );
          stmt.finalize();
        }
      );
    });
  }

  // 💾 Get SMTP config for user
  getSMTPConfig(userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM smtp_configs WHERE user_id = ? AND is_default = 1 ORDER BY created_at DESC LIMIT 1',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              console.log(`✅ [User: ${userId}] Loaded SMTP config from database`);
              resolve({
                provider: row.name,
                host: row.host,
                port: row.port,
                secure: row.secure === 1,
                username: row.username,
                user: row.username,
                email: row.username,
                password: row.password,
                pass: row.password
              });
            } else {
              console.log(`⚠️ [User: ${userId}] No SMTP config found in database`);
              resolve(null);
            }
          }
        }
      );
    });
  }

  // 清空用户所有数据
  clearUserData(userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM contacts WHERE user_id = ?', [userId]);
        this.db.run('DELETE FROM campaigns WHERE user_id = ?', [userId]);
        this.db.run('DELETE FROM email_drafts WHERE user_id = ?', [userId]);
        this.db.run('DELETE FROM smtp_configs WHERE user_id = ?', [userId], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ [User: ${userId}] All user data cleared from database`);
            resolve({ message: 'All user data cleared successfully' });
          }
        });
      });
    });
  }

  // 🔧 Get user configuration
  getUserConfig(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_configs WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            console.error('❌ Failed to get user config:', err);
            reject(err);
          } else if (row) {
            // Parse JSON fields
            try {
              resolve({
                smtp: row.smtp_config ? JSON.parse(row.smtp_config) : null,
                website: row.website_config ? JSON.parse(row.website_config) : null,
                campaign: row.campaign_config ? JSON.parse(row.campaign_config) : null
              });
            } catch (parseError) {
              console.error('❌ Failed to parse user config:', parseError);
              resolve({ smtp: null, website: null, campaign: null });
            }
          } else {
            // No config found, return null
            resolve({ smtp: null, website: null, campaign: null });
          }
        }
      );
    });
  }

  // 💾 Save user configuration
  saveUserConfig(userId, config) {
    return new Promise((resolve, reject) => {
      const smtpConfigJson = config.smtp ? JSON.stringify(config.smtp) : null;
      const websiteConfigJson = config.website ? JSON.stringify(config.website) : null;
      const campaignConfigJson = config.campaign ? JSON.stringify(config.campaign) : null;

      // Use INSERT OR REPLACE to update existing or create new
      this.db.run(
        `INSERT OR REPLACE INTO user_configs (user_id, smtp_config, website_config, campaign_config, updated_at)
         VALUES (
           ?,
           ?,
           ?,
           ?,
           CURRENT_TIMESTAMP
         )`,
        [userId, smtpConfigJson, websiteConfigJson, campaignConfigJson],
        function(err) {
          if (err) {
            console.error('❌ Failed to save user config:', err);
            reject(err);
          } else {
            console.log(`✅ User config saved for user: ${userId}`);
            resolve({ success: true, userId });
          }
        }
      );
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