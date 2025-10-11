const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Database Schema...');
  console.log('============================');

  const dbPath = path.join(__dirname, 'server/data/knowledge-base.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to knowledge base database');

      // Add missing columns to websites table
      const alterQueries = [
        'ALTER TABLE websites ADD COLUMN company_name TEXT;',
        'ALTER TABLE websites ADD COLUMN company_branding TEXT;',
        'ALTER TABLE websites ADD COLUMN sender_name TEXT;',
        'ALTER TABLE websites ADD COLUMN sender_title TEXT;',
        'ALTER TABLE websites ADD COLUMN campaign_goal TEXT;'
      ];

      let completed = 0;
      
      alterQueries.forEach((query, index) => {
        db.run(query, (err) => {
          if (err) {
            // Column might already exist, which is fine
            if (err.message.includes('duplicate column name')) {
              console.log(`   ⚠️ Column already exists (${index + 1}/${alterQueries.length})`);
            } else {
              console.log(`   ⚠️ Query ${index + 1} issue:`, err.message);
            }
          } else {
            console.log(`   ✅ Added column (${index + 1}/${alterQueries.length})`);
          }
          
          completed++;
          if (completed === alterQueries.length) {
            console.log('✅ Database schema update completed');
            
            // Verify the schema
            db.all("PRAGMA table_info(websites)", (err, rows) => {
              if (err) {
                console.error('❌ Schema verification failed:', err.message);
                reject(err);
              } else {
                console.log('\n📋 Current websites table schema:');
                rows.forEach(row => {
                  console.log(`   - ${row.name}: ${row.type}`);
                });
                
                // Check if our new columns exist
                const hasCompanyName = rows.some(row => row.name === 'company_name');
                const hasSenderName = rows.some(row => row.name === 'sender_name');
                
                if (hasCompanyName && hasSenderName) {
                  console.log('\n✅ All required columns present');
                  console.log('🚀 Database is ready for dynamic sender info storage');
                } else {
                  console.log('\n⚠️ Some columns may be missing');
                }
                
                db.close((err) => {
                  if (err) {
                    console.error('❌ Error closing database:', err.message);
                  } else {
                    console.log('✅ Database connection closed');
                  }
                  resolve();
                });
              }
            });
          }
        });
      });
    });
  });
}

// Run the schema fix
fixDatabaseSchema().catch(error => {
  console.error('Database schema fix failed:', error.message);
  process.exit(1);
});