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
      { name: { $regex: search, $options: 'i' } },
      { redemptionQRCode: { $regex: search, $options: 'i' } }
    ]
  } : {};

  const users = await User.find(searchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('phoneNumber name gameProgress redemptionQRCode isRedeemed redeemedAt createdAt')
    .lean();
  
  // Ensure gameStartCount is included in the response
  const usersWithGameStartCount = users.map(user => ({
    ...user,
    gameProgress: {
      ...user.gameProgress,
      game: user.gameProgress?.game ? {
        ...user.gameProgress.game,
        gameStartCount: user.gameProgress.game.gameStartCount || 0
      } : undefined
    }
  }));

  const totalUsers = await User.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    success: true,
    data: {
      users: usersWithGameStartCount,
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

// Scan user's redemption QR code
router.post('/scan-qr', asyncHandler(async (req, res, next) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return next(new AppError('QR code is required', 400));
  }

  const user = await User.findOne({ redemptionQRCode: qrCode });

  if (!user) {
    return next(new AppError('Invalid QR code or user not found', 404));
  }

  if (user.isRedeemed) {
    return next(new AppError('User has already redeemed their gift', 400));
  }

  // Mark as redeemed
  user.isRedeemed = true;
  user.redeemedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      phoneNumber: user.phoneNumber,
      name: user.name,
      isRedeemed: true,
      redeemedAt: user.redeemedAt
    },
    message: `User ${user.phoneNumber} marked as redeemed`
  });
}));

// Get statistics
router.get('/statistics', asyncHandler(async (req, res, next) => {
  console.log('📊 Admin: Getting statistics...');

  const totalUsers = await User.countDocuments();
  const redeemedUsers = await User.countDocuments({ isRedeemed: true });
  
  // Calculate total game starts (sum of all gameStartCount values)
  const usersWithGameStarted = await User.find({ 'gameProgress.game.gameStarted': true })
    .select('gameProgress.game.gameStartCount');
  const gameCompleted = usersWithGameStarted.reduce((total, user) => {
    return total + (user.gameProgress?.game?.gameStartCount || 1);
  }, 0);
  
  const photoCompleted = await User.countDocuments({ 'gameProgress.photo.completed': true });
  const bothCompleted = await User.countDocuments({
    'gameProgress.game.completed': true,
    'gameProgress.photo.completed': true
  });

  // Tier breakdown
  const tier1Count = await User.countDocuments({ 'gameProgress.game.tier': 1 });
  const tier2Count = await User.countDocuments({ 'gameProgress.game.tier': 2 });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      redeemedUsers,
      unredeemedUsers: totalUsers - redeemedUsers,
      gameCompleted,
      photoCompleted,
      bothCompleted,
      tier1Count,
      tier2Count
    }
  });
}));

module.exports = router;

