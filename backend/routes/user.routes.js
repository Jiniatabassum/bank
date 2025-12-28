const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserById } = require('../controllers/user.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All routes require authentication
router.use(verifyFirebaseToken);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfile);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', requireAdmin, getUserById);

module.exports = router;
