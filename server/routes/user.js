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
    await user.save();
    console.log('✅ Generated redemption QR code for user:', user.redemptionQRCode);
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

