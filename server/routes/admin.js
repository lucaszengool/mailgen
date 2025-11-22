const express = require('express');
const router = express.Router();
const database = require('../models/database');

// 🔐 Admin auth middleware (you can enhance this with proper admin checking)
const requireAdmin = (req, res, next) => {
  const { userId } = req;

  // TODO: Add proper admin checking logic
  // For now, checking if user exists in request
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// 📊 GET all users with their limits
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await database.getAllUsersWithLimits();
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
