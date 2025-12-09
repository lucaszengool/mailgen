const redis = require('redis');

/**
 * Redis User Cache - Multi-tenant caching with user isolation
 * All cache keys are scoped to specific users to ensure data isolation
 */
class RedisUserCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  /**
   * Connect to Redis
   */
  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = redis.createClient({
        url: this.redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis: Too many reconnection attempts, giving up');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 50, 500);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Generate a user-scoped cache key
   * Format: user:{userId}:{key}
   */
  getUserKey(userId, key) {
    return `user:${userId}:${key}`;
  }

  /**
   * Set a value in cache for a specific user
   */
  async set(userId, key, value, expirationSeconds = 3600) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, key);
      const serializedValue = JSON.stringify(value);

      if (expirationSeconds) {
        await this.client.setEx(userKey, expirationSeconds, serializedValue);
      } else {
        await this.client.set(userKey, serializedValue);
      }

      console.log(`✅ Redis: Set ${userKey} (expires in ${expirationSeconds}s)`);
      return true;
    } catch (error) {
      console.error(`❌ Redis set error for user ${userId}, key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get a value from cache for a specific user
   */
  async get(userId, key) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, key);
      const value = await this.client.get(userKey);

      if (value) {
        console.log(`✅ Redis: Cache hit for ${userKey}`);
        return JSON.parse(value);
      }

      console.log(`⚠️ Redis: Cache miss for ${userKey}`);
      return null;
    } catch (error) {
      console.error(`❌ Redis get error for user ${userId}, key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Delete a specific key for a user
   */
  async delete(userId, key) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, key);
      await this.client.del(userKey);
      console.log(`✅ Redis: Deleted ${userKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Redis delete error for user ${userId}, key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete all keys for a specific user
   */
  async deleteUserData(userId) {
    try {
      await this.connect();
      const pattern = this.getUserKey(userId, '*');
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✅ Redis: Deleted ${keys.length} keys for user ${userId}`);
        return keys.length;
      }

      console.log(`⚠️ Redis: No keys found for user ${userId}`);
      return 0;
    } catch (error) {
      console.error(`❌ Redis deleteUserData error for user ${userId}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if a key exists for a user
   */
  async exists(userId, key) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, key);
      const exists = await this.client.exists(userKey);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Redis exists error for user ${userId}, key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get all keys for a specific user
   */
  async getUserKeys(userId) {
    try {
      await this.connect();
      const pattern = this.getUserKey(userId, '*');
      const keys = await this.client.keys(pattern);

      // Remove the user prefix to return clean keys
      return keys.map(key => key.replace(`user:${userId}:`, ''));
    } catch (error) {
      console.error(`❌ Redis getUserKeys error for user ${userId}:`, error.message);
      return [];
    }
  }

  /**
   * Set multiple values for a user
   */
  async setMultiple(userId, keyValuePairs, expirationSeconds = 3600) {
    try {
      await this.connect();
      const promises = Object.entries(keyValuePairs).map(([key, value]) =>
        this.set(userId, key, value, expirationSeconds)
      );

      await Promise.all(promises);
      console.log(`✅ Redis: Set ${Object.keys(keyValuePairs).length} keys for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Redis setMultiple error for user ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Get multiple values for a user
   */
  async getMultiple(userId, keys) {
    try {
      await this.connect();
      const promises = keys.map(key => this.get(userId, key));
      const values = await Promise.all(promises);

      // Return as object with original keys
      const result = {};
      keys.forEach((key, index) => {
        result[key] = values[index];
      });

      return result;
    } catch (error) {
      console.error(`❌ Redis getMultiple error for user ${userId}:`, error.message);
      return {};
    }
  }

  /**
   * Get ALL key-value pairs for a user
   * Returns an object with all keys and their values
   */
  async getAll(userId) {
    try {
      await this.connect();
      const pattern = this.getUserKey(userId, '*');
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return {};
      }

      // Get all values
      const result = {};
      for (const fullKey of keys) {
        const cleanKey = fullKey.replace(`user:${userId}:`, '');
        try {
          const value = await this.client.get(fullKey);
          result[cleanKey] = value ? JSON.parse(value) : null;
        } catch (parseErr) {
          result[cleanKey] = null;
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Redis getAll error for user ${userId}:`, error.message);
      return {};
    }
  }

  /**
   * Increment a counter for a user
   */
  async increment(userId, key, amount = 1) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, key);
      const newValue = await this.client.incrBy(userKey, amount);
      console.log(`✅ Redis: Incremented ${userKey} to ${newValue}`);
      return newValue;
    } catch (error) {
      console.error(`❌ Redis increment error for user ${userId}, key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Add item to a list for a user
   */
  async listPush(userId, listKey, value) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, listKey);
      const serializedValue = JSON.stringify(value);
      await this.client.rPush(userKey, serializedValue);
      console.log(`✅ Redis: Pushed to list ${userKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Redis listPush error for user ${userId}, key ${listKey}:`, error.message);
      return false;
    }
  }

  /**
   * Get all items from a list for a user
   */
  async listGetAll(userId, listKey) {
    try {
      await this.connect();
      const userKey = this.getUserKey(userId, listKey);
      const items = await this.client.lRange(userKey, 0, -1);
      return items.map(item => JSON.parse(item));
    } catch (error) {
      console.error(`❌ Redis listGetAll error for user ${userId}, key ${listKey}:`, error.message);
      return [];
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * Flush all data in Redis (USE WITH CAUTION)
   */
  async flushAll() {
    try {
      await this.connect();
      await this.client.flushAll();
      console.log('⚠️ Redis: All data flushed');
      return true;
    } catch (error) {
      console.error('❌ Redis flushAll error:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new RedisUserCache();
