const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Create new account
 * @route   POST /api/accounts
 * @access  Private
 */
const createAccount = asyncHandler(async (req, res) => {
  const { accountType, initialDeposit = 0, interestRate, maturityDate } = req.body;

  // Validate FDR requirements
  if (accountType === 'fdr') {
    if (!interestRate || !maturityDate) {
      throw new AppError('FDR accounts require interest rate and maturity date', 400);
    }
  }

  const account = await Account.create({
    userId: req.user._id,
    accountType,
    balance: initialDeposit,
    interestRate: interestRate || 0,
    maturityDate: maturityDate || null
  });

  // Create initial deposit transaction if amount > 0
  if (initialDeposit > 0) {
    await Transaction.create({
      accountId: account._id,
      userId: req.user._id,
      transactionType: 'deposit',
      amount: initialDeposit,
      balanceAfter: initialDeposit,
      description: 'Initial deposit'
    });
  }

  logger.info(`New account created: ${account.accountNumber} for user ${req.user._id}`);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { account }
  });
});

/**
 * @desc    Get all user accounts
 * @route   GET /api/accounts
 * @access  Private
 */
const getUserAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { accounts }
  });
});

/**
 * @desc    Get account by ID
 * @route   GET /api/accounts/:id
 * @access  Private
 */
const getAccountById = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id)
    .populate('userId', 'name email')
    .lean();

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  // Check ownership (admin can view any account)
  if (req.user.role !== 'admin' && account.userId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  // Get recent transactions
  const transactions = await Transaction.find({ accountId: account._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      account,
      recentTransactions: transactions
    }
  });
});

/**
 * @desc    Update account status
 * @route   PATCH /api/accounts/:id/status
 * @access  Private/Admin
 */
const updateAccountStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  const previousStatus = account.status;
  account.status = status;
  await account.save();

  // Create audit log (will be implemented in admin controller)
  logger.info(`Account ${account.accountNumber} status changed from ${previousStatus} to ${status} by admin ${req.user._id}`);

  res.status(200).json({
    success: true,
    message: 'Account status updated successfully',
    data: { account }
  });
});

/**
 * @desc    Get account balance
 * @route   GET /api/accounts/:id/balance
 * @access  Private
 */
const getAccountBalance = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && account.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      accountNumber: account.accountNumber,
      balance: account.balance,
      status: account.status,
      lastTransactionDate: account.lastTransactionDate
    }
  });
});

module.exports = {
  createAccount,
  getUserAccounts,
  getAccountById,
  updateAccountStatus,
  getAccountBalance
};
