const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const AppError = require('../utils/appError');

const router = express.Router();

/**
 * @route   GET /api/user/qr-code
 * @desc    Get user's redemption QR code
 * @access  Private
 */
router.get('/qr-code', authMiddleware, asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  console.log('🎫 Getting redemption QR code for user:', userId);

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate QR code if not exists (should already be generated after first scan)
  if (!user.redemptionQRCode) {
    user.redemptionQRCode = await User.generateUniqueRedemptionQRCode();
    
    // Retry logic for handling duplicate key errors (race conditions)
    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
      try {
        await user.save();
        console.log('✅ Generated redemption QR code for user:', user.redemptionQRCode);
        break; // Success, exit retry loop
      } catch (saveError) {
        // If it's a duplicate key error for redemptionQRCode, regenerate and retry
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.redemptionQRCode) {
          retries++;
          if (retries >= maxRetries) {
            console.error('❌ Failed to save after retries:', saveError);
            return next(new AppError('Failed to generate QR code. Please try again.', 500));
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
  }

  res.status(200).json({
    success: true,
    data: {
      redemptionQRCode: user.redemptionQRCode,
      isRedeemed: user.isRedeemed,
      redeemedAt: user.redeemedAt,
      gameProgress: user.gameProgress
    }
  });
}));

module.exports = router;

