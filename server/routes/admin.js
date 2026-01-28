const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');

const router = express.Router();

// Simple admin login (no password for now, can be enhanced later)
router.post('/login', asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  
  // Simple password check (should be in env in production)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (password !== ADMIN_PASSWORD) {
    return next(new AppError('Invalid admin password', 401));
  }

  console.log('✅ Admin login successful');

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      authenticated: true
    }
  });
}));

// Get all users with pagination
router.get('/users', asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  console.log('📊 Admin: Getting users...', { page, limit, search });

  // Build search query
  const searchQuery = search ? {
    $or: [
      { phoneNumber: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ]
  } : {};

  const users = await User.find(searchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('phoneNumber name isRedeemed redeemedAt createdAt')
    .lean();

  const totalUsers = await User.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    success: true,
    data: {
      users: users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
}));


// Get statistics
router.get('/statistics', asyncHandler(async (req, res, next) => {
  console.log('📊 Admin: Getting statistics...');

  const totalUsers = await User.countDocuments();
  const redeemedUsers = await User.countDocuments({ isRedeemed: true });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      redeemedUsers
    }
  });
}));

module.exports = router;

