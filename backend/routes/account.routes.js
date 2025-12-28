const express = require('express');
const router = express.Router();
const {
  createAccount,
  getUserAccounts,
  getAccountById,
  updateAccountStatus,
  getAccountBalance
} = require('../controllers/account.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validate, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(verifyFirebaseToken);

// @route   POST /api/accounts
// @desc    Create new account
// @access  Private
router.post('/', validate(schemas.createAccount), createAccount);

// @route   GET /api/accounts
// @desc    Get all user accounts
// @access  Private
router.get('/', getUserAccounts);

// @route   GET /api/accounts/:id
// @desc    Get account by ID
// @access  Private
router.get('/:id', getAccountById);

// @route   GET /api/accounts/:id/balance
// @desc    Get account balance
// @access  Private
router.get('/:id/balance', getAccountBalance);

// @route   PATCH /api/accounts/:id/status
// @desc    Update account status (Admin only)
// @access  Private/Admin
router.patch('/:id/status', requireAdmin, validate(schemas.updateAccountStatus), updateAccountStatus);

module.exports = router;
