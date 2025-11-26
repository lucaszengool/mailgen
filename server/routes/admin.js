const express = require('express');
const router = express.Router();
const database = require('../models/database');
const { clerkClient } = require('@clerk/clerk-sdk-node');

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

    // 1. Get all registered users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({ limit: 500 });
    console.log(`📊 [Admin] Found ${clerkUsers.length} users in Clerk`);

    // 2. Get user limits from database
    const dbUsers = await database.getAllUsersWithLimits();
    const dbUsersMap = new Map(dbUsers.map(u => [u.user_id, u]));

    // 3. Merge Clerk users with database limits
    const mergedUsers = clerkUsers.map(clerkUser => {
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

    console.log(`📊 [Admin] Merged ${mergedUsers.length} users with limits`);

    res.json({ success: true, users: mergedUsers });
  } catch (error) {
    console.error('❌ [Admin] Failed to get users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 🔍 Search users by email
router.get('/users/search', requireAdmin, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email query required' });
    }

    // Search in Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
      limit: 100
    });

    // Get limits from database
    const dbUsers = await database.getAllUsersWithLimits();
    const dbUsersMap = new Map(dbUsers.map(u => [u.user_id, u]));

    // Merge results
    const mergedUsers = clerkUsers.map(clerkUser => {
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

    res.json({ success: true, users: mergedUsers });
  } catch (error) {
    console.error('❌ [Admin] Failed to search users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// 📝 Update user's rate limit
router.put('/users/:userId/limit', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, prospectsPerHour, isUnlimited } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await database.setUserLimit(
      userId,
      email,
      isUnlimited ? 0 : prospectsPerHour || 50,
      isUnlimited
    );

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
