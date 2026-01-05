const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./asyncHandler');
const AppError = require('../utils/appError');

const authMiddleware = asyncHandler(async (req, res, next) => {
  console.log('🔐 Auth Middleware: Checking authentication...');
  
  // Get token from Authorization header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔐 Auth Middleware: Token found in Authorization header');
  }

  if (!token) {
    console.log('🔐 Auth Middleware: No token found');
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  console.log('🔐 Auth Middleware: Token found, verifying...');
  
  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Auth Middleware: Token decoded successfully:', { id: decoded.id, phoneNumber: decoded.phoneNumber });
  } catch (jwtError) {
    console.error('🔐 Auth Middleware: JWT verification failed:', jwtError.message);
    return next(new AppError('Invalid token', 401));
  }

  // Check if user still exists
  console.log('🔐 Auth Middleware: Looking for user with ID:', decoded.id);
  try {
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      console.log('🔐 Auth Middleware: User not found with ID:', decoded.id);
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }
    console.log('🔐 Auth Middleware: User found:', currentUser.phoneNumber);
    
    // Grant access to protected route
    req.user = {
      _id: currentUser._id,
      phoneNumber: decoded.phoneNumber || currentUser.phoneNumber,
      name: currentUser.name
    };
    next();
  } catch (error) {
    console.error('🔐 Auth Middleware: Error finding user:', error);
    return next(new AppError('Authentication error', 500));
  }
});

module.exports = {
  authMiddleware
};

