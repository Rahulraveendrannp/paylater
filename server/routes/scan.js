const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const AppError = require('../utils/appError');

const router = express.Router();

/**
 * @route   POST /api/scan
 * @desc    Scan QR code for game activity
 * @access  Private
 */
router.post('/', authMiddleware, asyncHandler(async (req, res, next) => {
  const { qrCode, activityType } = req.body;
  const userId = req.user._id;

  // Validate inputs
  if (!qrCode || !qrCode.trim()) {
    return next(new AppError('QR code is required', 400));
  }

  if (!activityType || activityType !== 'game') {
    return next(new AppError('Activity type must be "game"', 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (activityType === 'game') {
    const trimmedQR = qrCode.trim();
    
    // Only accept TIER1 QR code - direct redemption
    if (trimmedQR === 'PAYLATER_GAME_TIER1') {
      // Check if already redeemed
      if (user.isRedeemed) {
        return next(new AppError('You have already redeemed your gift.', 400));
      }

      // Complete the redemption
      user.isRedeemed = true;
      user.redeemedAt = new Date();
    } else {
      return next(new AppError('Invalid QR code. Please scan the correct QR code.', 400));
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `QR code scanned successfully for ${activityType} activity`,
    data: {
      activityType,
      qrCode: qrCode.trim(),
      isRedeemed: user.isRedeemed,
      redeemedAt: user.redeemedAt
    }
  });
}));

/**
 * @route   GET /api/scan/progress
 * @desc    Get user's scanning progress
 * @access  Private
 */
router.get('/progress', authMiddleware, asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      gameProgress: {
        isRedeemed: user.isRedeemed
      },
      name: user.name,
      phoneNumber: user.phoneNumber
    }
  });
}));

module.exports = router;

