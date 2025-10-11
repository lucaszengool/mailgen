const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixDatabaseComplete() {
  const dbPath = path.join(__dirname, 'server/data/enhanced_knowledge_base.db');
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 修复数据库表结构 - 添加所有缺失列...');
  
  try {
    const columnsToAdd = [
      { name: 'contact_name', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'website', type: 'TEXT' },
      { name: 'linkedin_profile', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' },
      { name: 'score', type: 'INTEGER' },
      { name: 'added_by', type: 'TEXT' },
      { name: 'replies_received', type: 'INTEGER DEFAULT 0' },
      { name: 'last_reply', type: 'TEXT' },
      { name: 'conversion_probability', type: 'INTEGER DEFAULT 0' },
      { name: 'priority_score', type: 'INTEGER DEFAULT 0' },
      { name: 'next_action', type: 'TEXT' },
      { name: 'manual_intervention', type: 'BOOLEAN DEFAULT 0' },
      { name: 'auto_reply_enabled', type: 'BOOLEAN DEFAULT 1' }
    ];
    
    for (const column of columnsToAdd) {
      await new Promise((resolve, reject) => {
        db.run(`ALTER TABLE prospects ADD COLUMN ${column.name} ${column.type}`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log(`⚠️ 添加列 ${column.name} 失败: ${err.message}`);
          } else {
            console.log(`✅ 添加列 ${column.name} 成功`);
          }
          resolve();
        });
      });
    }
    
    console.log('✅ 数据库修复完成');
  } catch (error) {
    console.log('⚠️ 数据库修复:', error.message);
  } finally {
    db.close();
  }
}

fixDatabaseComplete();