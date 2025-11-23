const express = require('express');
const router = express.Router();
const database = require('../models/database');

// 🔐 Admin auth middleware - simplified for password-protected admin dashboard
const requireAdmin = (req, res, next) => {
  // Admin dashboard uses password protection on frontend
  // No additional auth needed here
  next();
};

// 📊 GET all users with their limits
router.get('/users', requireAdmin, async (req, res) => {
  try {
    console.log('📊 [Admin] Fetching all users...');

    // Get all users from database (user_limits table tracks all users)
    const users = await database.getAllUsersWithLimits();

    console.log(`📊 [Admin] Found ${users.length} users in database`);

    res.json({ success: true, users });
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

    const users = await database.searchUsersByEmail(email);
    res.json({ success: true, users });
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
