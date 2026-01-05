const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user (no OTP required)
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res, next) => {
  const { phoneNumber, name } = req.body;

  // Validate inputs
  if (!phoneNumber || !phoneNumber.trim()) {
    return next(new AppError('Phone number is required', 400));
  }

  if (!name || !name.trim()) {
    return next(new AppError('Name is required', 400));
  }

  // Normalize phone number
  const normalizedPhone = phoneNumber.replace(/\s/g, '');

  // Validate phone number format (must start with + and have country code + 7-15 digits)
  if (!/^\+\d{1,4}\d{7,15}$/.test(normalizedPhone)) {
    return next(new AppError('Please enter a valid phone number with country code (e.g., +971123456789)', 400));
  }

  console.log('📝 Registering user:', normalizedPhone, name);

  // Check if user already exists
  let user = await User.findByPhoneNumber(normalizedPhone);
  
  if (user) {
    // User exists, update name if provided
    user.name = name.trim();
    await user.save();
    console.log('✅ User updated:', user.phoneNumber);
  } else {
    // Create new user
    user = new User({
      phoneNumber: normalizedPhone,
      name: name.trim()
    });
    await user.save();
    console.log('✅ New user created:', user.phoneNumber);
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, phoneNumber: user.phoneNumber },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ JWT token generated for user:', user.phoneNumber);

  res.status(200).json({
    success: true,
    message: 'Registration successful',
    data: {
      session: {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name
      },
      token
    }
  });
}));

module.exports = router;

