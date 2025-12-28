const User = require('../models/User');
const Account = require('../models/Account');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-firebaseUid')
    .lean();

  // Get user's accounts
  const accounts = await Account.find({ userId: req.user._id })
    .select('accountNumber accountType balance status')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      user,
      accounts
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, profileImage } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update allowed fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-firebaseUid')
    .lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const accounts = await Account.find({ userId: user._id })
    .select('accountNumber accountType balance status')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      user,
      accounts
    }
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserById
};
