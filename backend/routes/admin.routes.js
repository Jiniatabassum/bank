const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllAccounts,
  toggleAccountFreeze,
  getAllLoans,
  reverseTransaction,
  getAnalytics,
  getAuditLogs
} = require('../controllers/admin.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All routes require authentication and admin role
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   GET /api/admin/accounts
// @desc    Get all accounts
// @access  Private/Admin
router.get('/accounts', getAllAccounts);

// @route   PATCH /api/admin/accounts/:id/freeze
// @desc    Freeze/unfreeze account
// @access  Private/Admin
router.patch('/accounts/:id/freeze', toggleAccountFreeze);

// @route   GET /api/admin/loans
// @desc    Get all loans
// @access  Private/Admin
router.get('/loans', getAllLoans);

// @route   POST /api/admin/transactions/:id/reverse
// @desc    Reverse transaction
// @access  Private/Admin
router.post('/transactions/:id/reverse', reverseTransaction);

// @route   GET /api/admin/analytics
// @desc    Get analytics dashboard
// @access  Private/Admin
router.get('/analytics', getAnalytics);

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs
// @access  Private/Admin
router.get('/audit-logs', getAuditLogs);

module.exports = router;
