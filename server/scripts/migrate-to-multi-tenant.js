#!/usr/bin/env node

/**
 * Multi-Tenant Migration Script
 * Migrates existing single-tenant data to multi-tenant structure
 *
 * This script:
 * 1. Adds user_id column to database tables
 * 2. Assigns existing data to 'anonymous' or specified default user
 * 3. Migrates file-based storage to user-specific directories
 * 4. Updates Redis keys to user-scoped format
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const redis = require('redis');

const DEFAULT_USER_ID = 'anonymous';

class MultiTenantMigration {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/enhanced_knowledge_base.db');
    this.dataDir = path.join(__dirname, '../data');
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  /**
   * Main migration function
   */
  async migrate(defaultUserId = DEFAULT_USER_ID) {
    console.log('🚀 Starting Multi-Tenant Migration...\n');
    console.log(`📝 Default User ID: ${defaultUserId}\n`);

    try {
      // Step 1: Migrate SQLite database
      await this.migrateDatabaseSchema(defaultUserId);

      // Step 2: Migrate file-based storage
      await this.migrateFileStorage(defaultUserId);

      // Step 3: Migrate Redis data
      await this.migrateRedisData(defaultUserId);

      console.log('\n✅ Migration completed successfully!');
      console.log('\n📊 Migration Summary:');
      console.log(`   - Database tables updated with user_id column`);
      console.log(`   - Existing data assigned to user: ${defaultUserId}`);
      console.log(`   - File storage migrated to user-specific directories`);
      console.log(`   - Redis keys updated to user-scoped format\n`);

      return true;
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Step 1: Migrate database schema and data
   */
  async migrateDatabaseSchema(userId) {
    console.log('📊 Step 1: Migrating database schema...');

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          return reject(err);
        }

        try {
          // Check if migration is needed
          const needsMigration = await this.checkIfMigrationNeeded(db);

          if (!needsMigration) {
            console.log('   ℹ️  Database already migrated, skipping...');
            db.close();
            return resolve();
          }

          // Run migrations in a transaction
          db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Add user_id column to prospects table
            db.run(`
              ALTER TABLE prospects ADD COLUMN user_id TEXT DEFAULT '${userId}'
            `, (err) => {
              if (err && !err.message.includes('duplicate column')) {
                console.error('   ⚠️  Error adding user_id to prospects:', err.message);
              } else {
                console.log('   ✅ Added user_id column to prospects table');
              }
            });

            // Add user_id column to emails table
            db.run(`
              ALTER TABLE emails ADD COLUMN user_id TEXT DEFAULT '${userId}'
            `, (err) => {
              if (err && !err.message.includes('duplicate column')) {
                console.error('   ⚠️  Error adding user_id to emails:', err.message);
              } else {
                console.log('   ✅ Added user_id column to emails table');
              }
            });

            // Add user_id column to marketing_strategies table
            db.run(`
              ALTER TABLE marketing_strategies ADD COLUMN user_id TEXT DEFAULT '${userId}'
            `, (err) => {
              if (err && !err.message.includes('duplicate column')) {
                console.error('   ⚠️  Error adding user_id to marketing_strategies:', err.message);
              } else {
                console.log('   ✅ Added user_id column to marketing_strategies table');
              }
            });

            // Update existing NULL user_id values to default user
            db.run(`UPDATE prospects SET user_id = '${userId}' WHERE user_id IS NULL`);
            db.run(`UPDATE emails SET user_id = '${userId}' WHERE user_id IS NULL`);
            db.run(`UPDATE marketing_strategies SET user_id = '${userId}' WHERE user_id IS NULL`);

            // Create indexes for better performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_marketing_strategies_user_id ON marketing_strategies(user_id)`);

            console.log('   ✅ Created user_id indexes');

            // Commit transaction
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                db.close();
                return reject(err);
              }

              console.log('   ✅ Database migration completed\n');
              db.close();
              resolve();
            });
          });
        } catch (error) {
          db.close();
          reject(error);
        }
      });
    });
  }

  /**
   * Check if database migration is needed
   */
  async checkIfMigrationNeeded(db) {
    return new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(prospects)", (err, rows) => {
        if (err) {
          return reject(err);
        }

        const hasUserIdColumn = rows.some(row => row.name === 'user_id');
        resolve(!hasUserIdColumn);
      });
    });
  }

  /**
   * Step 2: Migrate file-based storage to user-specific directories
   */
  async migrateFileStorage(userId) {
    console.log('📁 Step 2: Migrating file storage...');

    try {
      const userDataDir = path.join(this.dataDir, 'users', userId);

      // Create user-specific directory
      await fs.mkdir(userDataDir, { recursive: true });
      console.log(`   ✅ Created user directory: ${userDataDir}`);

      // Files to migrate
      const filesToMigrate = [
        { src: 'agent-config.json', dest: 'config.json' },
        { src: 'prospects.json', dest: 'prospects.json' },
        { src: 'emails.json', dest: 'emails.json' },
        { src: 'campaign-config.json', dest: 'campaign-config.json' }
      ];

      let migratedCount = 0;

      for (const file of filesToMigrate) {
        const srcPath = path.join(this.dataDir, file.src);
        const destPath = path.join(userDataDir, file.dest);

        try {
          // Check if source file exists
          await fs.access(srcPath);

          // Check if destination already exists
          try {
            await fs.access(destPath);
            console.log(`   ℹ️  Skipping ${file.src} (already exists in user directory)`);
            continue;
          } catch {
            // Destination doesn't exist, proceed with migration
          }

          // Copy file to user directory
          await fs.copyFile(srcPath, destPath);
          console.log(`   ✅ Migrated ${file.src} -> users/${userId}/${file.dest}`);
          migratedCount++;
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log(`   ℹ️  Skipping ${file.src} (file not found)`);
          } else {
            console.error(`   ⚠️  Error migrating ${file.src}:`, err.message);
          }
        }
      }

      console.log(`   ✅ File storage migration completed (${migratedCount} files migrated)\n`);
    } catch (error) {
      console.error('   ❌ File storage migration failed:', error);
      throw error;
    }
  }

  /**
   * Step 3: Migrate Redis keys to user-scoped format
   */
  async migrateRedisData(userId) {
    console.log('🔴 Step 3: Migrating Redis data...');

    let redisClient = null;

    try {
      // Connect to Redis
      redisClient = redis.createClient({ url: this.redisUrl });
      await redisClient.connect();

      console.log('   ✅ Connected to Redis');

      // Get all keys
      const keys = await redisClient.keys('*');

      if (keys.length === 0) {
        console.log('   ℹ️  No Redis keys found, skipping...\n');
        await redisClient.quit();
        return;
      }

      console.log(`   📝 Found ${keys.length} Redis keys to migrate`);

      let migratedCount = 0;

      for (const key of keys) {
        // Skip if already user-scoped
        if (key.startsWith('user:')) {
          continue;
        }

        // Create user-scoped key
        const newKey = `user:${userId}:${key}`;

        try {
          // Get value
          const value = await redisClient.get(key);

          if (value) {
            // Set new user-scoped key
            await redisClient.set(newKey, value);

            // Get TTL if exists
            const ttl = await redisClient.ttl(key);
            if (ttl > 0) {
              await redisClient.expire(newKey, ttl);
            }

            // Delete old key
            await redisClient.del(key);

            migratedCount++;
            console.log(`   ✅ Migrated: ${key} -> ${newKey}`);
          }
        } catch (err) {
          console.error(`   ⚠️  Error migrating key ${key}:`, err.message);
        }
      }

      console.log(`   ✅ Redis migration completed (${migratedCount} keys migrated)\n`);

      await redisClient.quit();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ℹ️  Redis not available, skipping Redis migration...\n');
      } else {
        console.error('   ❌ Redis migration failed:', error.message);
        throw error;
      }

      if (redisClient) {
        try {
          await redisClient.quit();
        } catch (e) {
          // Ignore errors on quit
        }
      }
    }
  }

  /**
   * Rollback migration (for testing)
   */
  async rollback() {
    console.log('⚠️  Rolling back migration...\n');

    // This is a simplified rollback - in production you'd want more robust handling
    console.log('   ℹ️  Rollback not fully implemented');
    console.log('   ℹ️  Manual intervention may be required\n');
  }
}

// Run migration if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const userId = args[0] || DEFAULT_USER_ID;

  const migration = new MultiTenantMigration();

  migration.migrate(userId)
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = MultiTenantMigration;
