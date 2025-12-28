const transactionService = require('../services/transaction.service');
const pdfService = require('../services/pdf.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @desc    Deposit money
 * @route   POST /api/transactions/deposit
 * @access  Private
 */
const deposit = asyncHandler(async (req, res) => {
  const { accountId, amount, description } = req.body;

  const result = await transactionService.processDeposit(
    req.user._id,
    accountId,
    amount,
    description
  );

  res.status(200).json({
    success: true,
    message: 'Deposit successful',
    data: {
      transaction: result.transaction,
      newBalance: result.account.balance
    }
  });
});

/**
 * @desc    Withdraw money
 * @route   POST /api/transactions/withdraw
 * @access  Private
 */
const withdraw = asyncHandler(async (req, res) => {
  const { accountId, amount, description } = req.body;

  const result = await transactionService.processWithdrawal(
    req.user._id,
    accountId,
    amount,
    description
  );

  res.status(200).json({
    success: true,
    message: 'Withdrawal successful',
    data: {
      transaction: result.transaction,
      newBalance: result.account.balance
    }
  });
});

/**
 * @desc    Transfer money
 * @route   POST /api/transactions/transfer
 * @access  Private
 */
const transfer = asyncHandler(async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;

  const result = await transactionService.processTransfer(
    req.user._id,
    fromAccountId,
    toAccountId,
    amount,
    description
  );

  res.status(200).json({
    success: true,
    message: 'Transfer successful',
    data: {
      transactions: result.transactions,
      fromAccountBalance: result.fromAccount.balance,
      toAccountBalance: result.toAccount.balance
    }
  });
});

/**
 * @desc    Get transactions
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { accountId, type, startDate, endDate, minAmount, maxAmount, page, limit } = req.query;

  // If accountId provided, verify ownership
  if (accountId) {
    const Account = require('../models/Account');
    const account = await Account.findById(accountId);
    
    if (!account) {
      throw new AppError('Account not found', 404);
    }

    if (req.user.role !== 'admin' && account.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Access denied', 403);
    }
  }

  const filters = {
    accountId,
    userId: !accountId ? req.user._id : undefined, // If no accountId, get all user transactions
    type,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page,
    limit
  };

  const result = await transactionService.getTransactions(filters);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Get transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const Transaction = require('../models/Transaction');
  
  const transaction = await Transaction.findById(req.params.id)
    .populate('accountId', 'accountNumber accountType')
    .populate('userId', 'name email')
    .populate('relatedAccountId', 'accountNumber accountType')
    .populate('relatedUserId', 'name email')
    .lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && transaction.userId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  res.status(200).json({
    success: true,
    data: { transaction }
  });
});

/**
 * @desc    Get monthly statement
 * @route   GET /api/transactions/statement/:accountId
 * @access  Private
 */
const getMonthlyStatement = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { month, year } = req.query;

  // Verify account ownership
  const Account = require('../models/Account');
  const account = await Account.findById(accountId);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  if (req.user.role !== 'admin' && account.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const currentDate = new Date();
  const statementMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const statementYear = year ? parseInt(year) : currentDate.getFullYear();

  const statement = await transactionService.getMonthlyStatement(
    accountId,
    statementMonth,
    statementYear
  );

  res.status(200).json({
    success: true,
    data: {
      account: {
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        currentBalance: account.balance
      },
      ...statement
    }
  });
});

/**
 * @desc    Download transaction receipt PDF
 * @route   GET /api/transactions/:id/receipt
 * @access  Private
 */
const downloadReceipt = asyncHandler(async (req, res) => {
  const Transaction = require('../models/Transaction');
  
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Check ownership
  if (req.user.role !== 'admin' && transaction.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const pdfBuffer = await pdfService.generateTransactionReceipt(req.params.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${transaction.transactionId}.pdf`);
  res.send(pdfBuffer);
});

/**
 * @desc    Download monthly statement PDF
 * @route   GET /api/transactions/statement/:accountId/download
 * @access  Private
 */
const downloadStatement = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { month, year } = req.query;

  // Verify account ownership
  const Account = require('../models/Account');
  const account = await Account.findById(accountId);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  if (req.user.role !== 'admin' && account.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const currentDate = new Date();
  const statementMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const statementYear = year ? parseInt(year) : currentDate.getFullYear();

  const pdfBuffer = await pdfService.generateMonthlyStatement(
    accountId,
    statementMonth,
    statementYear
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=statement-${account.accountNumber}-${statementYear}-${statementMonth}.pdf`);
  res.send(pdfBuffer);
});

module.exports = {
  deposit,
  withdraw,
  transfer,
  getTransactions,
  getTransactionById,
  getMonthlyStatement,
  downloadReceipt,
  downloadStatement
};
