const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const AppError = require('../utils/appError');

const router = express.Router();

/**
 * @route   POST /api/scan
 * @desc    Scan QR code for game or photo activity
 * @access  Private
 */
router.post('/', authMiddleware, asyncHandler(async (req, res, next) => {
  const { qrCode, activityType } = req.body;
  const userId = req.user._id;

  // Validate inputs
  if (!qrCode || !qrCode.trim()) {
    return next(new AppError('QR code is required', 400));
  }

  if (!activityType || !['game', 'photo'].includes(activityType)) {
    return next(new AppError('Activity type must be either "game" or "photo"', 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const progress = user.gameProgress[activityType];

  if (activityType === 'game') {
    // For game: validate QR code format (exact match required)
    const trimmedQR = qrCode.trim();
    let tier = null;
    
    // Exact match validation for game QR codes
    if (trimmedQR === 'PAYLATER_GAME_TIER1') {
      tier = 1;
    } else if (trimmedQR === 'PAYLATER_GAME_TIER2') {
      tier = 2;
    } else {
      return next(new AppError('Invalid QR code. Please scan the correct QR code for game activity.', 400));
    }

    // If first time scanning, set tier and mark as completed
    if (!progress.completed) {
      progress.completed = true;
      progress.tier = tier;
      progress.scannedQR = trimmedQR;
      progress.scannedAt = new Date();
      progress.scanCount = 1;

      // Generate redemption QR code if not already generated
      if (!user.redemptionQRCode) {
        user.redemptionQRCode = await User.generateUniqueRedemptionQRCode();
      }
    } else {
      // Already scanned - just increment count
      progress.scanCount = (progress.scanCount || 0) + 1;
    }
  } else if (activityType === 'photo') {
    // For photo: validate QR code format (exact match required)
    const trimmedQR = qrCode.trim();
    
    // Exact match validation for photo QR code
    if (trimmedQR !== 'PAYLATER_PHOTO') {
      return next(new AppError('Invalid QR code. Please scan the correct QR code for photo activity.', 400));
    }

    // Check if already scanned
    if (progress.completed) {
      return next(new AppError('Photo QR code already scanned', 400));
    }

    // Mark as completed
    progress.completed = true;
    progress.scannedQR = trimmedQR;
    progress.scannedAt = new Date();

    // Generate redemption QR code if not already generated
    if (!user.redemptionQRCode) {
      user.redemptionQRCode = await User.generateUniqueRedemptionQRCode();
    }
  }

  user.updatedAt = new Date();
  
  // Retry logic for handling duplicate key errors (race conditions)
  let retries = 0;
  const maxRetries = 3;
  while (retries < maxRetries) {
    try {
      await user.save();
      break; // Success, exit retry loop
    } catch (saveError) {
      // If it's a duplicate key error for redemptionQRCode, regenerate and retry
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.redemptionQRCode) {
        retries++;
        if (retries >= maxRetries) {
          console.error('❌ Failed to save after retries:', saveError);
          return next(new AppError('Failed to process scan. Please try again.', 500));
        }
        // Regenerate QR code and retry
        console.log(`🔄 Retry ${retries}: Regenerating redemption QR code due to duplicate...`);
        user.redemptionQRCode = await User.generateUniqueRedemptionQRCode();
      } else {
        // Different error, throw it
        throw saveError;
      }
    }
  }

  res.status(200).json({
    success: true,
    message: `QR code scanned successfully for ${activityType} activity`,
    data: {
      activityType,
      qrCode: qrCode.trim(),
      scannedAt: progress.scannedAt,
      completed: progress.completed,
      ...(activityType === 'game' && { tier: progress.tier, scanCount: progress.scanCount })
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
        ...user.gameProgress.toObject(),
        isRedeemed: user.isRedeemed
      },
      name: user.name,
      phoneNumber: user.phoneNumber
    }
  });
}));

module.exports = router;

