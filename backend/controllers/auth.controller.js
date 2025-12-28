const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firebaseUid, email, name, phone, nidOrPassport, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ firebaseUid }, { email }, { nidOrPassport }] 
  });

  if (existingUser) {
    if (existingUser.firebaseUid === firebaseUid) {
      throw new AppError('User with this Firebase UID already exists', 409);
    }
    if (existingUser.email === email) {
      throw new AppError('Email already registered', 409);
    }
    if (existingUser.nidOrPassport === nidOrPassport) {
      throw new AppError('NID/Passport already registered', 409);
    }
  }

  // Create new user
  const user = await User.create({
    firebaseUid,
    email,
    name,
    phone,
    nidOrPassport,
    role: role === 'admin' ? 'admin' : 'customer', // Only allow admin role from backend config
    lastLogin: new Date()
  });

  logger.info(`New user registered: ${user.email} (${user._id})`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

/**
 * @desc    Verify Firebase token and get user
 * @route   POST /api/auth/verify
 * @access  Public (token in body)
 */
const verifyToken = asyncHandler(async (req, res) => {
  // User is already attached by middleware
  res.status(200).json({
    success: true,
    message: 'Token verified successfully',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-firebaseUid')
    .lean();

  res.status(200).json({
    success: true,
    data: { user }
  });
});

module.exports = {
  register,
  verifyToken,
  getCurrentUser
};
