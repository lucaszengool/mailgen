const express = require('express');
const router = express.Router();
const database = require('../models/database');

// Try to import Clerk - it may not be available in all environments
let clerkClient = null;
try {
  const clerk = require('@clerk/express');
  clerkClient = clerk.clerkClient;
} catch (error) {
  console.warn('⚠️ Clerk SDK not available, admin will use database only');
}

// 🔐 Admin auth middleware - simplified for password-protected admin dashboard
const requireAdmin = (req, res, next) => {
  // Admin dashboard uses password protection on frontend
  // No additional auth needed here
  next();
};

// 📊 GET all users with their limits
router.get('/users', requireAdmin, async (req, res) => {
  try {
    console.log('📊 [Admin] Fetching all users from Clerk and database...');

    let mergedUsers = [];

    // 1. Try to get all registered users from Clerk (if available)
    try {
      if (!clerkClient) {
        throw new Error('Clerk client not available');
      }

      const clerkResponse = await clerkClient.users.getUserList({ limit: 500 });
      const clerkUsers = clerkResponse.data || clerkResponse || [];
      console.log(`📊 [Admin] Found ${clerkUsers.length} users in Clerk`);

      // 2. Get user limits from database
      const dbUsers = await database.getAllUsersWithLimits();
      const dbUsersMap = new Map(dbUsers.map(u => [u.user_id, u]));

      // 3. Merge Clerk users with database limits
      mergedUsers = (Array.isArray(clerkUsers) ? clerkUsers : []).map(clerkUser => {
        const dbUser = dbUsersMap.get(clerkUser.id);
        const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);

        return {
          userId: clerkUser.id,
          email: primaryEmail?.emailAddress || 'No email configured',
          prospectsPerHour: dbUser?.prospects_per_hour ?? 50,
          isUnlimited: Boolean(dbUser?.is_unlimited),  // Convert 0/1 to boolean
          createdAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt
        };
      });

      console.log(`📊 [Admin] Merged ${mergedUsers.length} users with limits`);
    } catch (clerkError) {
      console.error('⚠️ [Admin] Clerk API error, falling back to database only:', clerkError.message);

      // Fallback: Use database users only if Clerk fails
      const dbUsers = await database.getAllUsersWithLimits();
      mergedUsers = dbUsers.map(u => ({
        userId: u.user_id,
        email: u.email || 'No email configured',
        prospectsPerHour: u.prospects_per_hour ?? 50,
        isUnlimited: Boolean(u.is_unlimited),  // Convert 0/1 to boolean
        createdAt: u.created_at,
        lastSignInAt: null
      }));

      console.log(`📊 [Admin] Using ${mergedUsers.length} users from database only`);
    }

    res.json({ success: true, users: mergedUsers });
  } catch (error) {
    console.error('❌ [Admin] Failed to get users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// 🔍 Search users by email
router.get('/users/search', requireAdmin, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email query required' });
    }

    let mergedUsers = [];

    // Try to search in Clerk first (if available)
    try {
      if (!clerkClient) {
        throw new Error('Clerk client not available');
      }

      const clerkResponse = await clerkClient.users.getUserList({
        emailAddress: [email],
        limit: 100
      });
      const clerkUsers = clerkResponse.data || clerkResponse || [];

      // Get limits from database
      const dbUsers = await database.getAllUsersWithLimits();
      const dbUsersMap = new Map(dbUsers.map(u => [u.user_id, u]));

      // Merge results
      mergedUsers = (Array.isArray(clerkUsers) ? clerkUsers : []).map(clerkUser => {
        const dbUser = dbUsersMap.get(clerkUser.id);
        const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);

        return {
          userId: clerkUser.id,
          email: primaryEmail?.emailAddress || 'No email configured',
          prospectsPerHour: dbUser?.prospects_per_hour || 50,
          isUnlimited: dbUser?.is_unlimited || false,
          createdAt: clerkUser.createdAt,
          lastSignInAt: clerkUser.lastSignInAt
        };
      });
    } catch (clerkError) {
      console.error('⚠️ [Admin] Clerk search error, falling back to database:', clerkError.message);

      // Fallback: Search in database only
      const dbUsers = await database.searchUsersByEmail(email);
      mergedUsers = dbUsers.map(u => ({
        userId: u.user_id,
        email: u.email || 'No email configured',
        prospectsPerHour: u.prospects_per_hour || 50,
        isUnlimited: u.is_unlimited || false,
        createdAt: u.created_at,
        lastSignInAt: null
      }));
    }

    res.json({ success: true, users: mergedUsers });
  } catch (error) {
    console.error('❌ [Admin] Failed to search users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: error.message
    });
  }
});

// 📝 Update user's rate limit
router.put('/users/:userId/limit', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, prospectsPerHour, isUnlimited } = req.body;

    console.log(`📝 [Admin] Updating limit for user ${userId}:`, {
      email,
      prospectsPerHour,
      isUnlimited
    });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await database.setUserLimit(
      userId,
      email,
      isUnlimited ? 0 : prospectsPerHour || 50,
      isUnlimited
    );

    console.log(`✅ [Admin] User limit updated successfully:`, result);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [Admin] Failed to update user limit:', error);
    res.status(500).json({ error: 'Failed to update user limit' });
  }
});

// 📊 Get specific user's limit
router.get('/users/:userId/limit', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = await database.getUserLimit(userId);
    res.json({ success: true, limit });
  } catch (error) {
    console.error('❌ [Admin] Failed to get user limit:', error);
    res.status(500).json({ error: 'Failed to get user limit' });
  }
});

module.exports = router;
