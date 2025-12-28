const express = require('express');
const router = express.Router();
const { register, verifyToken, getCurrentUser } = require('../controllers/auth.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Apply auth rate limiter to all routes
router.use(authRateLimiter);

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validate(schemas.register), register);

// @route   POST /api/auth/verify
// @desc    Verify Firebase token
// @access  Public (requires valid token)
router.post('/verify', verifyFirebaseToken, verifyToken);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', verifyFirebaseToken, getCurrentUser);

module.exports = router;
