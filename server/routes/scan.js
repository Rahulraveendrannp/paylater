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
    
    // Check if this is the game start QR code
    if (trimmedQR === 'PAYLATER_GAME_START') {
      // Start the game
      if (!progress.gameStarted) {
        progress.gameStarted = true;
        progress.scannedQR = trimmedQR;
        progress.scannedAt = new Date();
        progress.gameStartCount = 1;
        
        // Generate redemption QR code if not already generated
        if (!user.redemptionQRCode) {
          user.redemptionQRCode = await User.generateUniqueRedemptionQRCode();
        }
      } else {
        // Game already started - allow re-scanning, increment count and update timestamp
        progress.gameStartCount = (progress.gameStartCount || 0) + 1;
        progress.scannedAt = new Date();
      }
    } else {
      // This is a tier QR code (TIER1 or TIER2)
      let tier = null;
      
      if (trimmedQR === 'PAYLATER_GAME_TIER1') {
        tier = 1;
      } else if (trimmedQR === 'PAYLATER_GAME_TIER2') {
        tier = 2;
      } else {
        return next(new AppError('Invalid QR code. Please scan the correct QR code for game activity.', 400));
      }

      // Check if game has been started
      if (!progress.gameStarted) {
        return next(new AppError('Please scan the game start QR code first.', 400));
      }

      // If first time scanning a tier QR, set tier and mark as completed
      if (!progress.completed) {
        progress.completed = true;
        progress.tier = tier;
        progress.scanCount = 1;
        // Mark as redeemed when first tier QR is scanned
        if (!user.isRedeemed) {
          user.isRedeemed = true;
          user.redeemedAt = new Date();
        }
      } else {
        // Already scanned a tier - just increment count
        progress.scanCount = (progress.scanCount || 0) + 1;
      }
    }
  } else if (activityType === 'photo') {
    // For photo: validate QR code format (exact match required)
    const trimmedQR = qrCode.trim();
    
    // Exact match validation for photo QR code
    if (trimmedQR !== 'PAYLATER_PHOTO') {
      return next(new AppError('Invalid QR code. Please scan the correct QR code for photo activity.', 400));
    }

    // Allow multiple scans - just increment count
    if (!progress.completed) {
      // First scan
      progress.completed = true;
      progress.scannedQR = trimmedQR;
      progress.scannedAt = new Date();
      progress.scanCount = 1;
    } else {
      // Subsequent scans - just increment count
      progress.scanCount = (progress.scanCount || 0) + 1;
    }

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
      ...(activityType === 'game' && { 
        gameStarted: progress.gameStarted,
        tier: progress.tier, 
        scanCount: progress.scanCount 
      }),
      ...(activityType === 'photo' && { scanCount: progress.scanCount })
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

