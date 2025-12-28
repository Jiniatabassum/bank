const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const AuditLog = require('../models/AuditLog');
const analyticsService = require('../services/analytics.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/helpers');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const { skip, limit: limitNum } = paginate(page, limit);

  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.isActive = status === 'active';
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get account count for each user
  const usersWithAccounts = await Promise.all(
    users.map(async (user) => {
      const accountCount = await Account.countDocuments({ userId: user._id });
      return { ...user, accountCount };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      users: usersWithAccounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total
      }
    }
  });
});

/**
 * @desc    Get all accounts
 * @route   GET /api/admin/accounts
 * @access  Private/Admin
 */
const getAllAccounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, accountType } = req.query;
  const { skip, limit: limitNum } = paginate(page, limit);

  const query = {};
  if (status) query.status = status;
  if (accountType) query.accountType = accountType;

  const [accounts, total] = await Promise.all([
    Account.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Account.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      accounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalAccounts: total
      }
    }
  });
});

/**
 * @desc    Freeze/unfreeze account
 * @route   PATCH /api/admin/accounts/:id/freeze
 * @access  Private/Admin
 */
const toggleAccountFreeze = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  const previousStatus = account.status;
  const newStatus = account.status === 'frozen' ? 'active' : 'frozen';
  
  account.status = newStatus;
  await account.save();

  // Create audit log
  await AuditLog.log({
    userId: req.user._id,
    action: newStatus === 'frozen' ? 'account_frozen' : 'account_unfrozen',
    targetType: 'account',
    targetId: account._id,
    reason,
    previousState: { status: previousStatus },
    newState: { status: newStatus },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: `Account ${newStatus === 'frozen' ? 'frozen' : 'unfrozen'} successfully`,
    data: { account }
  });
});

/**
 * @desc    Get all loans
 * @route   GET /api/admin/loans
 * @access  Private/Admin
 */
const getAllLoans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { skip, limit: limitNum } = paginate(page, limit);

  const query = {};
  if (status) query.status = status;

  const [loans, total] = await Promise.all([
    Loan.find(query)
      .populate('userId', 'name email phone')
      .populate('accountId', 'accountNumber accountType')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Loan.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      loans,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalLoans: total
      }
    }
  });
});

/**
 * @desc    Reverse transaction
 * @route   POST /api/admin/transactions/:id/reverse
 * @access  Private/Admin
 */
const reverseTransaction = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Reversal reason is required', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await Transaction.findById(req.params.id).session(session);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status === 'reversed') {
      throw new AppError('Transaction already reversed', 400);
    }

    const account = await Account.findById(transaction.accountId).session(session);

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Reverse the transaction based on type
    let reversalAmount = transaction.amount;

    switch (transaction.transactionType) {
      case 'deposit':
      case 'transfer_in':
      case 'loan_disbursement':
        // Deduct the amount
        if (!account.hasSufficientBalance(reversalAmount)) {
          throw new AppError('Insufficient balance to reverse this transaction', 400);
        }
        account.balance -= reversalAmount;
        break;
      
      case 'withdrawal':
      case 'transfer_out':
      case 'emi_deduction':
        // Add the amount back
        account.balance += reversalAmount;
        break;
      
      default:
        throw new AppError('Cannot reverse this transaction type', 400);
    }

    await account.save({ session });

    // Mark original transaction as reversed
    transaction.status = 'reversed';
    transaction.reversedBy = req.user._id;
    transaction.reversedAt = new Date();
    transaction.reversalReason = reason;
    await transaction.save({ session });

    // Create reversal transaction
    const reversalTxn = await Transaction.create([{
      accountId: account._id,
      userId: transaction.userId,
      transactionType: transaction.transactionType,
      amount: -reversalAmount, // Negative amount to indicate reversal
      balanceAfter: account.balance,
      description: `Reversal: ${transaction.description}`,
      status: 'completed',
      originalTransactionId: transaction._id
    }], { session });

    // Create audit log
    await AuditLog.log({
      userId: req.user._id,
      action: 'transaction_reversed',
      targetType: 'transaction',
      targetId: transaction._id,
      reason,
      previousState: { status: 'completed', balance: transaction.balanceAfter },
      newState: { status: 'reversed', balance: account.balance },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Transaction reversed successfully',
      data: {
        originalTransaction: transaction,
        reversalTransaction: reversalTxn[0],
        newBalance: account.balance
      }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Get analytics dashboard
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  const [analytics, monthlyTrends, accountGrowth, loanBreakdown] = await Promise.all([
    analyticsService.getAnalytics(period),
    analyticsService.getMonthlyTrends(),
    analyticsService.getAccountGrowthTrend(),
    analyticsService.getLoanStatusBreakdown()
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: analytics,
      trends: {
        monthly: monthlyTrends,
        accountGrowth,
        loanStatus: loanBreakdown
      }
    }
  });
});

/**
 * @desc    Get audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, targetType } = req.query;
  const { skip, limit: limitNum } = paginate(page, limit);

  const query = {};
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalLogs: total
      }
    }
  });
});

module.exports = {
  getAllUsers,
  getAllAccounts,
  toggleAccountFreeze,
  getAllLoans,
  reverseTransaction,
  getAnalytics,
  getAuditLogs
};
