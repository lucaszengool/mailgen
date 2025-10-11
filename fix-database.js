const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixDatabase() {
  const dbPath = path.join(__dirname, 'server/data/enhanced_knowledge_base.db');
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 修复数据库表结构...');
  
  try {
    // 添加缺失的contact_name列
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE prospects ADD COLUMN contact_name TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✅ 添加contact_name列成功');
          resolve();
        }
      });
    });
    
    console.log('✅ 数据库修复完成');
  } catch (error) {
    console.log('⚠️ 数据库修复:', error.message);
  } finally {
    db.close();
  }
}

fixDatabase();