const express = require('express');
const router = express.Router();
const {
  calculateEMI,
  applyLoan,
  getUserLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  payEMI
} = require('../controllers/loan.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validate, schemas } = require('../middleware/validation');
const { loanRateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(verifyFirebaseToken);

// @route   POST /api/loans/calculate-emi
// @desc    Calculate EMI
// @access  Private
router.post('/calculate-emi', calculateEMI);

// @route   POST /api/loans
// @desc    Apply for loan
// @access  Private
router.post('/', loanRateLimiter, validate(schemas.loanApplication), applyLoan);

// @route   GET /api/loans
// @desc    Get user loans
// @access  Private
router.get('/', getUserLoans);

// @route   GET /api/loans/:id
// @desc    Get loan by ID
// @access  Private
router.get('/:id', getLoanById);

// @route   POST /api/loans/:id/approve
// @desc    Approve loan (Admin only)
// @access  Private/Admin
router.post('/:id/approve', requireAdmin, approveLoan);

// @route   POST /api/loans/:id/reject
// @desc    Reject loan (Admin only)
// @access  Private/Admin
router.post('/:id/reject', requireAdmin, rejectLoan);

// @route   POST /api/loans/:id/pay-emi
// @desc    Pay EMI manually
// @access  Private
router.post('/:id/pay-emi', payEMI);

module.exports = router;
