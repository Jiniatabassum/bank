const loanService = require('../services/loan.service');
const Loan = require('../models/Loan');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @desc    Calculate EMI
 * @route   POST /api/loans/calculate-emi
 * @access  Private
 */
const calculateEMI = asyncHandler(async (req, res) => {
  const { principalAmount, interestRate, tenureMonths } = req.body;

  const loanDetails = loanService.calculateLoanDetails(
    principalAmount,
    interestRate,
    tenureMonths
  );

  res.status(200).json({
    success: true,
    data: {
      ...loanDetails,
      formula: 'EMI = [P × R × (1 + R)^N] / [(1 + R)^N - 1]',
      explanation: {
        P: 'Principal loan amount',
        R: 'Monthly interest rate (annual rate / 12 / 100)',
        N: 'Loan tenure in months'
      }
    }
  });
});

/**
 * @desc    Apply for loan
 * @route   POST /api/loans
 * @access  Private
 */
const applyLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.applyForLoan(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Loan application submitted successfully',
    data: { loan }
  });
});

/**
 * @desc    Get user loans
 * @route   GET /api/loans
 * @access  Private
 */
const getUserLoans = asyncHandler(async (req, res) => {
  const loans = await Loan.find({ userId: req.user._id })
    .populate('accountId', 'accountNumber accountType')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { loans }
  });
});

/**
 * @desc    Get loan by ID
 * @route   GET /api/loans/:id
 * @access  Private
 */
const getLoanById = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('accountId', 'accountNumber accountType balance')
    .populate('approvedBy', 'name email')
    .lean();

  if (!loan) {
    throw new AppError('Loan not found', 404);
  }

  // Check ownership (admin can view any loan)
  if (req.user.role !== 'admin' && loan.userId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({
    success: true,
    data: { loan }
  });
});

/**
 * @desc    Approve loan (Admin only)
 * @route   POST /api/loans/:id/approve
 * @access  Private/Admin
 */
const approveLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.approveLoan(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Loan approved and amount disbursed',
    data: { loan }
  });
});

/**
 * @desc    Reject loan (Admin only)
 * @route   POST /api/loans/:id/reject
 * @access  Private/Admin
 */
const rejectLoan = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  const loan = await loanService.rejectLoan(req.params.id, req.user._id, reason);

  res.status(200).json({
    success: true,
    message: 'Loan rejected',
    data: { loan }
  });
});

/**
 * @desc    Pay EMI manually
 * @route   POST /api/loans/:id/pay-emi
 * @access  Private
 */
const payEMI = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    throw new AppError('Loan not found', 404);
  }

  // Check ownership
  if (loan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const result = await loanService.deductEMI(req.params.id);

  res.status(200).json({
    success: true,
    message: 'EMI paid successfully',
    data: {
      loan: result.loan,
      transaction: result.transaction,
      remainingBalance: result.account.balance
    }
  });
});

module.exports = {
  calculateEMI,
  applyLoan,
  getUserLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  payEMI
};
