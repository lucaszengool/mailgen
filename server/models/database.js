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
        body TEXT,
        campaign_id TEXT,
        user_id TEXT NOT NULL DEFAULT 'anonymous',
        message_id TEXT,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        recipient_index INTEGER,
        tracking_id TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🔥 MIGRATION: Add user_id and tracking_id columns to existing email_logs tables
    // Check if user_id and tracking_id columns exist
    this.db.all(`PRAGMA table_info(email_logs)`, (err, columns) => {
      if (!err && columns) {
        const hasUserId = columns.some(col => col.name === 'user_id');
        const hasTrackingId = columns.some(col => col.name === 'tracking_id');

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

        if (!hasTrackingId) {
          console.log('🔄 MIGRATION: Adding tracking_id column to email_logs table...');
          this.db.run(`ALTER TABLE email_logs ADD COLUMN tracking_id TEXT`, (err) => {
            if (err) {
              console.error('❌ Failed to add tracking_id column:', err);
            } else {
              console.log('✅ Successfully added tracking_id column to email_logs table');
            }
          });
        } else {
          console.log('✅ tracking_id column already exists in email_logs table');
        }

        // 🔥 MIGRATION: Add body column for email content storage
        const hasBody = columns.some(col => col.name === 'body');
        if (!hasBody) {
          console.log('🔄 MIGRATION: Adding body column to email_logs table...');
          this.db.run(`ALTER TABLE email_logs ADD COLUMN body TEXT`, (err) => {
            if (err) {
              console.error('❌ Failed to add body column:', err);
            } else {
              console.log('✅ Successfully added body column to email_logs table');
            }
          });
        } else {
          console.log('✅ body column already exists in email_logs table');
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
        message_id TEXT,
        reply_body TEXT,
        user_id TEXT DEFAULT 'anonymous'
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
    `, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Failed to create contacts table:', err.message);
      } else {
        console.log('✅ [DATABASE] Contacts table ready');
      }
    });

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

    // 🎯 Admin: User rate limits table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        prospects_per_hour INTEGER DEFAULT 50,
        is_unlimited BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🔥 NEW: Workflow sessions table for persistent state management
    // This enables workflow resume on browser refresh/reconnect
    this.db.run(`
      CREATE TABLE IF NOT EXISTS workflow_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        status TEXT DEFAULT 'idle',
        current_step TEXT,
        workflow_state TEXT,
        prospects_found INTEGER DEFAULT 0,
        emails_generated INTEGER DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, campaign_id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Failed to create workflow_sessions table:', err.message);
      } else {
        console.log('✅ [DATABASE] workflow_sessions table ready');
      }
    });

    // 🧠 NEW: Agent Learning table - Stores what the agent learns per campaign
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agent_learnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        learning_type TEXT NOT NULL,
        category TEXT NOT NULL,
        insight TEXT NOT NULL,
        evidence TEXT,
        confidence REAL DEFAULT 0.5,
        impact_score REAL DEFAULT 0.0,
        applied_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Failed to create agent_learnings table:', err.message);
      } else {
        console.log('✅ [DATABASE] agent_learnings table ready');
      }
    });

    // 🧠 NEW: Agent Performance Metrics - Tracks performance over time
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agent_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        previous_value REAL,
        improvement_pct REAL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Failed to create agent_metrics table:', err.message);
      } else {
        console.log('✅ [DATABASE] agent_metrics table ready');
      }
    });

    // 🧠 NEW: Agent Decisions Log - Records agent decisions for transparency
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agent_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        decision_type TEXT NOT NULL,
        decision TEXT NOT NULL,
        reasoning TEXT,
        alternatives TEXT,
        outcome TEXT,
        was_correct INTEGER DEFAULT -1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ [DATABASE] Failed to create agent_decisions table:', err.message);
      } else {
        console.log('✅ [DATABASE] agent_decisions table ready');
      }
    });

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

    // 🔥 MIGRATION: Check email_replies table for reply_body and user_id columns
    this.db.all("PRAGMA table_info(email_replies)", (err, columns) => {
      if (err) {
        console.error('❌ Failed to check email_replies table structure:', err);
        return;
      }

      const hasReplyBody = columns.some(col => col.name === 'reply_body');
      if (!hasReplyBody) {
        console.log('🔄 MIGRATION: Adding reply_body column to email_replies table...');
        this.db.run("ALTER TABLE email_replies ADD COLUMN reply_body TEXT", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Failed to add reply_body to email_replies:', err);
          } else {
            console.log('✅ email_replies table: added reply_body column');
          }
        });
      }

      const hasUserId = columns.some(col => col.name === 'user_id');
      if (!hasUserId) {
        console.log('🔄 MIGRATION: Adding user_id column to email_replies table...');
        this.db.run("ALTER TABLE email_replies ADD COLUMN user_id TEXT DEFAULT 'anonymous'", (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Failed to add user_id to email_replies:', err);
          } else {
            console.log('✅ email_replies table: added user_id column');
          }
        });
      }
    });
  }

  // 记录邮件发送
  logEmailSent(emailData, userId = 'anonymous') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO email_logs (to_email, subject, campaign_id, user_id, message_id, status, error_message, recipient_index, sent_at, tracking_id, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        emailData.sentAt,
        emailData.trackingId || null, // 📊 NEW: Store tracking ID for analytics
        emailData.body || null // 🔥 NEW: Store email body for thread display
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
      // 🔥 FIX: Join with email_logs to properly filter by campaign_id
      let openQuery = `
        SELECT COUNT(DISTINCT eo.tracking_id) as opens
        FROM email_opens eo
        INNER JOIN email_logs el ON eo.tracking_id = el.tracking_id
      `;
      let clickQuery = 'SELECT COUNT(*) as clicks FROM email_clicks';

      const openParams = [];
      const clickParams = [];

      if (campaignId) {
        openQuery += ' WHERE el.campaign_id = ?';
        openParams.push(campaignId);
        clickQuery += ' WHERE campaign_id = ?';
        clickParams.push(campaignId);
      }

      // 获取打开数据
      this.db.get(openQuery, openParams, (err, openResult) => {
        if (err) {
          console.error('[getEngagementStats] Open query error:', err);
          reject(err);
          return;
        }

        // 获取点击数据
        this.db.get(clickQuery, clickParams, (err, clickResult) => {
          if (err) {
            console.error('[getEngagementStats] Click query error:', err);
            reject(err);
            return;
          }

          console.log(`[getEngagementStats] Campaign ${campaignId || 'all'}: Opens=${openResult.opens}, Clicks=${clickResult.clicks}`);
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

      // 🔥 CRITICAL FIX: ALWAYS filter by campaign_id to prevent mixing
      // If campaignId is provided, only return drafts for that campaign
      // If campaignId is null, return drafts with NULL campaign_id (legacy drafts)
      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      } else {
        // When no campaign ID specified, exclude drafts that belong to specific campaigns
        query += ' AND campaign_id IS NULL';
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

  // 🎯 Admin: Get user's rate limit
  getUserLimit(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM user_limits WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve({
              userId: row.user_id,
              email: row.email,
              prospectsPerHour: row.prospects_per_hour,
              isUnlimited: row.is_unlimited === 1
            });
          } else {
            // Default: 50 prospects per hour
            resolve({
              userId,
              email: null,
              prospectsPerHour: 50,
              isUnlimited: false
            });
          }
        }
      );
    });
  }

  // 🎯 Admin: Set user's rate limit
  setUserLimit(userId, email, prospectsPerHour, isUnlimited = false) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO user_limits (user_id, email, prospects_per_hour, is_unlimited, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, email, prospectsPerHour, isUnlimited ? 1 : 0],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ [Admin] Set limit for user ${userId}: ${isUnlimited ? 'unlimited' : prospectsPerHour + '/hour'}`);
            resolve({ success: true, userId, prospectsPerHour, isUnlimited });
          }
        }
      );
    });
  }

  // 🎯 Admin: Get all users with their limits
  getAllUsersWithLimits() {
    return new Promise((resolve, reject) => {
      // First ensure user_limits table exists
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_limits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          prospects_per_hour INTEGER DEFAULT 50,
          is_unlimited BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Failed to create user_limits table:', err);
          return reject(err);
        }

        // 🔥 FIX: Query user_limits FIRST, then join activity data
        // This ensures we always get the latest user_limits values
        const query = `
          SELECT
            ul.user_id,
            ul.email,
            ul.prospects_per_hour,
            ul.is_unlimited,
            ul.created_at,
            ul.updated_at
          FROM user_limits ul
          WHERE ul.user_id IS NOT NULL AND ul.user_id != '' AND ul.user_id != 'anonymous'
          ORDER BY ul.updated_at DESC
        `;

        this.db.all(query, [], (err, rows) => {
          if (err) {
            console.error('❌ Failed to fetch users from user_limits:', err);
            reject(err);
          } else {
            console.log(`✅ Found ${rows.length} users in user_limits table`);

            // Log each user's is_unlimited value for debugging
            rows.forEach(row => {
              console.log(`   📊 User ${row.user_id}: is_unlimited=${row.is_unlimited} (type: ${typeof row.is_unlimited})`);
            });

            // Map results with correct boolean conversion
            const mappedUsers = rows.map(row => ({
              userId: row.user_id,
              email: row.email || 'No email configured',
              prospectsPerHour: row.prospects_per_hour,
              isUnlimited: row.is_unlimited === 1 || row.is_unlimited === true,  // Handle both integer and boolean
              createdAt: row.created_at,
              updatedAt: row.updated_at
            }));

            resolve(mappedUsers);
          }
        });
      });
    });
  }

  // 🎯 Admin: Search users by email
  searchUsersByEmail(emailQuery) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM user_limits WHERE email LIKE ? ORDER BY created_at DESC',
        [`%${emailQuery}%`],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              userId: row.user_id,
              email: row.email,
              prospectsPerHour: row.prospects_per_hour,
              isUnlimited: row.is_unlimited === 1,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            })));
          }
        }
      );
    });
  }

  // 🎯 Ensure user is tracked in user_limits table (auto-add on first use)
  ensureUserTracked(userId, email) {
    return new Promise((resolve, reject) => {
      // First check if user exists
      this.db.get(
        'SELECT * FROM user_limits WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            // User already exists, just resolve
            resolve({
              userId: row.user_id,
              email: row.email,
              prospectsPerHour: row.prospects_per_hour,
              isUnlimited: row.is_unlimited === 1
            });
          } else {
            // User doesn't exist, create with default limit of 50/hour
            this.db.run(
              `INSERT INTO user_limits (user_id, email, prospects_per_hour, is_unlimited, created_at, updated_at)
               VALUES (?, ?, 50, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [userId, email],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  console.log(`✅ [User Tracking] New user tracked: ${email} (${userId}) - Default limit: 50/hour`);
                  resolve({
                    userId,
                    email,
                    prospectsPerHour: 50,
                    isUnlimited: false
                  });
                }
              }
            );
          }
        }
      );
    });
  }
  // ============================================
  // 🔥 WORKFLOW SESSION METHODS - For persistent state management
  // ============================================

  /**
   * Save or update a workflow session
   * @param {string} userId - User ID (required, no anonymous)
   * @param {string} campaignId - Campaign ID
   * @param {object} sessionData - Session state data
   */
  saveWorkflowSession(userId, campaignId, sessionData) {
    return new Promise((resolve, reject) => {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return reject(new Error('Valid authenticated userId required'));
      }
      if (!campaignId) {
        return reject(new Error('campaignId is required'));
      }

      const sessionId = `${userId}_${campaignId}`;
      const now = new Date().toISOString();

      this.db.run(
        `INSERT INTO workflow_sessions (id, user_id, campaign_id, status, current_step, workflow_state, prospects_found, emails_generated, last_activity, started_at, completed_at, error_message, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, campaign_id) DO UPDATE SET
           status = excluded.status,
           current_step = excluded.current_step,
           workflow_state = excluded.workflow_state,
           prospects_found = excluded.prospects_found,
           emails_generated = excluded.emails_generated,
           last_activity = excluded.last_activity,
           started_at = COALESCE(excluded.started_at, started_at),
           completed_at = excluded.completed_at,
           error_message = excluded.error_message,
           updated_at = excluded.updated_at`,
        [
          sessionId,
          userId,
          campaignId,
          sessionData.status || 'idle',
          sessionData.currentStep || null,
          JSON.stringify(sessionData.workflowState || {}),
          sessionData.prospectsFound || 0,
          sessionData.emailsGenerated || 0,
          now,
          sessionData.startedAt || null,
          sessionData.completedAt || null,
          sessionData.errorMessage || null,
          now
        ],
        (err) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to save workflow session:', err);
            reject(err);
          } else {
            console.log(`✅ [DATABASE] Workflow session saved: ${sessionId} - Status: ${sessionData.status}`);
            resolve({ success: true, sessionId });
          }
        }
      );
    });
  }

  /**
   * Get workflow session for a user and campaign
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   */
  getWorkflowSession(userId, campaignId) {
    return new Promise((resolve, reject) => {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return resolve(null);
      }

      this.db.get(
        `SELECT * FROM workflow_sessions WHERE user_id = ? AND campaign_id = ?`,
        [userId, campaignId],
        (err, row) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to get workflow session:', err);
            reject(err);
          } else if (row) {
            // Parse JSON fields
            try {
              row.workflowState = JSON.parse(row.workflow_state || '{}');
            } catch (e) {
              row.workflowState = {};
            }
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Get all active workflow sessions for a user
   * @param {string} userId - User ID
   */
  getActiveWorkflowSessions(userId) {
    return new Promise((resolve, reject) => {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return resolve([]);
      }

      this.db.all(
        `SELECT * FROM workflow_sessions WHERE user_id = ? AND status IN ('running', 'paused', 'paused_for_review', 'paused_for_editing') ORDER BY last_activity DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to get active workflow sessions:', err);
            reject(err);
          } else {
            // Parse JSON fields
            const sessions = (rows || []).map(row => {
              try {
                row.workflowState = JSON.parse(row.workflow_state || '{}');
              } catch (e) {
                row.workflowState = {};
              }
              return row;
            });
            resolve(sessions);
          }
        }
      );
    });
  }

  /**
   * Update workflow session status
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {string} status - New status
   * @param {object} additionalData - Additional data to update
   */
  updateWorkflowSessionStatus(userId, campaignId, status, additionalData = {}) {
    return new Promise((resolve, reject) => {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return reject(new Error('Valid authenticated userId required'));
      }

      const now = new Date().toISOString();
      let updateFields = ['status = ?', 'last_activity = ?', 'updated_at = ?'];
      let updateValues = [status, now, now];

      if (additionalData.currentStep) {
        updateFields.push('current_step = ?');
        updateValues.push(additionalData.currentStep);
      }
      if (additionalData.prospectsFound !== undefined) {
        updateFields.push('prospects_found = ?');
        updateValues.push(additionalData.prospectsFound);
      }
      if (additionalData.emailsGenerated !== undefined) {
        updateFields.push('emails_generated = ?');
        updateValues.push(additionalData.emailsGenerated);
      }
      if (additionalData.errorMessage) {
        updateFields.push('error_message = ?');
        updateValues.push(additionalData.errorMessage);
      }
      if (status === 'completed') {
        updateFields.push('completed_at = ?');
        updateValues.push(now);
      }
      if (status === 'running' && additionalData.isStart) {
        updateFields.push('started_at = ?');
        updateValues.push(now);
      }

      updateValues.push(userId, campaignId);

      this.db.run(
        `UPDATE workflow_sessions SET ${updateFields.join(', ')} WHERE user_id = ? AND campaign_id = ?`,
        updateValues,
        (err) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to update workflow session status:', err);
            reject(err);
          } else {
            console.log(`✅ [DATABASE] Workflow session updated: ${userId}/${campaignId} -> ${status}`);
            resolve({ success: true });
          }
        }
      );
    });
  }

  /**
   * Update workflow session state (waitingForUserApproval, firstEmailGenerated, etc.)
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {string} workflowStateJson - JSON string of workflow state
   */
  updateWorkflowSessionState(userId, campaignId, workflowStateJson) {
    return new Promise((resolve, reject) => {
      if (!userId || userId === 'demo' || userId === 'anonymous') {
        return reject(new Error('Valid authenticated userId required'));
      }

      const now = new Date().toISOString();
      this.db.run(
        `UPDATE workflow_sessions SET workflow_state = ?, last_activity = ?, updated_at = ? WHERE user_id = ? AND campaign_id = ?`,
        [workflowStateJson, now, now, userId, campaignId],
        (err) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to update workflow session state:', err);
            reject(err);
          } else {
            console.log(`✅ [DATABASE] Workflow session state updated: ${userId}/${campaignId}`);
            resolve({ success: true });
          }
        }
      );
    });
  }

  /**
   * Delete workflow session
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   */
  deleteWorkflowSession(userId, campaignId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM workflow_sessions WHERE user_id = ? AND campaign_id = ?`,
        [userId, campaignId],
        (err) => {
          if (err) {
            console.error('❌ [DATABASE] Failed to delete workflow session:', err);
            reject(err);
          } else {
            console.log(`✅ [DATABASE] Workflow session deleted: ${userId}/${campaignId}`);
            resolve({ success: true });
          }
        }
      );
    });
  }

  // ============================================
  // 🧠 AGENT LEARNING METHODS - Self-improving AI
  // ============================================

  /**
   * Save an agent learning/insight
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {object} learning - Learning data
   */
  saveAgentLearning(userId, campaignId, learning) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO agent_learnings (user_id, campaign_id, learning_type, category, insight, evidence, confidence, impact_score, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          campaignId,
          learning.type || 'observation',
          learning.category || 'general',
          learning.insight,
          JSON.stringify(learning.evidence || {}),
          learning.confidence || 0.5,
          learning.impactScore || 0.0,
          JSON.stringify(learning.metadata || {})
        ],
        function(err) {
          if (err) {
            console.error('❌ [AGENT LEARNING] Failed to save:', err);
            reject(err);
          } else {
            console.log(`🧠 [AGENT LEARNING] Saved: ${learning.category} - ${learning.insight.substring(0, 50)}...`);
            resolve({ id: this.lastID, success: true });
          }
        }
      );
    });
  }

  /**
   * Get agent learnings for a campaign
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID (optional, null for all)
   * @param {object} options - Filter options
   */
  getAgentLearnings(userId, campaignId = null, options = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM agent_learnings WHERE user_id = ?';
      const params = [userId];

      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }

      if (options.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      if (options.type) {
        query += ' AND learning_type = ?';
        params.push(options.type);
      }

      if (options.minConfidence) {
        query += ' AND confidence >= ?';
        params.push(options.minConfidence);
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const learnings = (rows || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            type: row.learning_type,
            category: row.category,
            insight: row.insight,
            evidence: JSON.parse(row.evidence || '{}'),
            confidence: row.confidence,
            impactScore: row.impact_score,
            appliedCount: row.applied_count,
            successRate: row.success_rate,
            metadata: JSON.parse(row.metadata || '{}'),
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          resolve(learnings);
        }
      });
    });
  }

  /**
   * Update learning when it's applied and track success
   * @param {number} learningId - Learning ID
   * @param {boolean} wasSuccessful - Whether the application was successful
   */
  updateLearningApplication(learningId, wasSuccessful) {
    return new Promise((resolve, reject) => {
      // Get current stats first
      this.db.get(
        'SELECT applied_count, success_rate FROM agent_learnings WHERE id = ?',
        [learningId],
        (err, row) => {
          if (err || !row) {
            reject(err || new Error('Learning not found'));
            return;
          }

          const newCount = (row.applied_count || 0) + 1;
          const successfulApps = (row.success_rate * row.applied_count) + (wasSuccessful ? 1 : 0);
          const newSuccessRate = successfulApps / newCount;

          this.db.run(
            `UPDATE agent_learnings SET applied_count = ?, success_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newCount, newSuccessRate, learningId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ success: true, newCount, newSuccessRate });
              }
            }
          );
        }
      );
    });
  }

  /**
   * Save agent metric for tracking improvement
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {object} metric - Metric data
   */
  saveAgentMetric(userId, campaignId, metric) {
    return new Promise((resolve, reject) => {
      // Get previous value for comparison
      this.db.get(
        `SELECT metric_value FROM agent_metrics
         WHERE user_id = ? AND campaign_id = ? AND metric_type = ? AND metric_name = ?
         ORDER BY created_at DESC LIMIT 1`,
        [userId, campaignId, metric.type, metric.name],
        (err, prev) => {
          const previousValue = prev?.metric_value || null;
          const improvementPct = previousValue ? ((metric.value - previousValue) / previousValue) * 100 : null;

          this.db.run(
            `INSERT INTO agent_metrics (user_id, campaign_id, metric_type, metric_name, metric_value, previous_value, improvement_pct, context)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              campaignId,
              metric.type,
              metric.name,
              metric.value,
              previousValue,
              improvementPct,
              JSON.stringify(metric.context || {})
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                const emoji = improvementPct > 0 ? '📈' : improvementPct < 0 ? '📉' : '➡️';
                console.log(`${emoji} [AGENT METRIC] ${metric.name}: ${metric.value}${improvementPct ? ` (${improvementPct > 0 ? '+' : ''}${improvementPct.toFixed(1)}%)` : ''}`);
                resolve({ id: this.lastID, improvement: improvementPct });
              }
            }
          );
        }
      );
    });
  }

  /**
   * Get agent metrics history
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {object} options - Filter options
   */
  getAgentMetrics(userId, campaignId = null, options = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM agent_metrics WHERE user_id = ?';
      const params = [userId];

      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }

      if (options.type) {
        query += ' AND metric_type = ?';
        params.push(options.type);
      }

      if (options.name) {
        query += ' AND metric_name = ?';
        params.push(options.name);
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map(row => ({
            id: row.id,
            type: row.metric_type,
            name: row.metric_name,
            value: row.metric_value,
            previousValue: row.previous_value,
            improvementPct: row.improvement_pct,
            context: JSON.parse(row.context || '{}'),
            createdAt: row.created_at
          })));
        }
      });
    });
  }

  /**
   * Log an agent decision for transparency
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {object} decision - Decision data
   */
  logAgentDecision(userId, campaignId, decision) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO agent_decisions (user_id, campaign_id, decision_type, decision, reasoning, alternatives, outcome)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          campaignId,
          decision.type,
          decision.decision,
          decision.reasoning || null,
          JSON.stringify(decision.alternatives || []),
          decision.outcome || null
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`🎯 [AGENT DECISION] ${decision.type}: ${decision.decision.substring(0, 50)}...`);
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  /**
   * Update decision outcome after we know the result
   * @param {number} decisionId - Decision ID
   * @param {string} outcome - What happened
   * @param {boolean} wasCorrect - Whether decision was correct
   */
  updateDecisionOutcome(decisionId, outcome, wasCorrect) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE agent_decisions SET outcome = ?, was_correct = ? WHERE id = ?`,
        [outcome, wasCorrect ? 1 : 0, decisionId],
        (err) => {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  /**
   * Get agent decisions log
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   * @param {number} limit - Max results
   */
  getAgentDecisions(userId, campaignId = null, limit = 50) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM agent_decisions WHERE user_id = ?';
      const params = [userId];

      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve((rows || []).map(row => ({
            id: row.id,
            type: row.decision_type,
            decision: row.decision,
            reasoning: row.reasoning,
            alternatives: JSON.parse(row.alternatives || '[]'),
            outcome: row.outcome,
            wasCorrect: row.was_correct === 1 ? true : row.was_correct === 0 ? false : null,
            createdAt: row.created_at
          })));
        }
      });
    });
  }

  /**
   * Get comprehensive agent insights summary for a campaign
   * @param {string} userId - User ID
   * @param {string} campaignId - Campaign ID
   */
  getAgentInsightsSummary(userId, campaignId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get learnings grouped by category
        const learnings = await this.getAgentLearnings(userId, campaignId, { limit: 100 });

        // Get recent metrics
        const metrics = await this.getAgentMetrics(userId, campaignId, { limit: 50 });

        // Get recent decisions
        const decisions = await this.getAgentDecisions(userId, campaignId, 20);

        // Calculate summary stats
        const categoryCounts = {};
        const avgConfidence = learnings.length > 0
          ? learnings.reduce((sum, l) => sum + l.confidence, 0) / learnings.length
          : 0;

        learnings.forEach(l => {
          categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
        });

        // Calculate decision accuracy
        const evaluatedDecisions = decisions.filter(d => d.wasCorrect !== null);
        const decisionAccuracy = evaluatedDecisions.length > 0
          ? evaluatedDecisions.filter(d => d.wasCorrect).length / evaluatedDecisions.length
          : null;

        // Get improvement trends
        const improvements = metrics
          .filter(m => m.improvementPct !== null)
          .map(m => ({ name: m.name, improvement: m.improvementPct }));

        resolve({
          totalLearnings: learnings.length,
          learningsByCategory: categoryCounts,
          averageConfidence: avgConfidence,
          topLearnings: learnings.slice(0, 5),
          recentMetrics: metrics.slice(0, 10),
          improvements,
          decisionAccuracy,
          recentDecisions: decisions.slice(0, 5)
        });
      } catch (err) {
        reject(err);
      }
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