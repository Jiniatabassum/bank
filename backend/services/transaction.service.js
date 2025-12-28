const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Process deposit transaction
 */
const processDeposit = async (userId, accountId, amount, description = '') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and lock account
    const account = await Account.findById(accountId).session(session);

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    if (!account.canTransact()) {
      throw new AppError('Account is not active', 400);
    }

    // Check ownership
    if (account.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }

    // Update account balance
    account.balance += amount;
    account.lastTransactionDate = new Date();
    await account.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      accountId,
      userId,
      transactionType: 'deposit',
      amount,
      balanceAfter: account.balance,
      description: description || 'Deposit'
    }], { session });

    await session.commitTransaction();
    logger.info(`Deposit successful: ${amount} to account ${account.accountNumber}`);

    return {
      transaction: transaction[0],
      account
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process withdrawal transaction
 */
const processWithdrawal = async (userId, accountId, amount, description = '') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const account = await Account.findById(accountId).session(session);

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    if (!account.canTransact()) {
      throw new AppError('Account is not active', 400);
    }

    if (account.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }

    if (!account.hasSufficientBalance(amount)) {
      throw new AppError('Insufficient balance', 400);
    }

    // Update account balance
    account.balance -= amount;
    account.lastTransactionDate = new Date();
    await account.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      accountId,
      userId,
      transactionType: 'withdrawal',
      amount,
      balanceAfter: account.balance,
      description: description || 'Withdrawal'
    }], { session });

    await session.commitTransaction();
    logger.info(`Withdrawal successful: ${amount} from account ${account.accountNumber}`);

    return {
      transaction: transaction[0],
      account
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process transfer transaction
 */
const processTransfer = async (userId, fromAccountId, toAccountId, amount, description = '') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate different accounts
    if (fromAccountId === toAccountId) {
      throw new AppError('Cannot transfer to the same account', 400);
    }

    // Find and lock both accounts
    const fromAccount = await Account.findById(fromAccountId).session(session);
    const toAccount = await Account.findById(toAccountId).session(session);

    if (!fromAccount || !toAccount) {
      throw new AppError('One or both accounts not found', 404);
    }

    if (!fromAccount.canTransact() || !toAccount.canTransact()) {
      throw new AppError('One or both accounts are not active', 400);
    }

    // Check ownership of source account
    if (fromAccount.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403);
    }

    if (!fromAccount.hasSufficientBalance(amount)) {
      throw new AppError('Insufficient balance', 400);
    }

    // Update balances
    fromAccount.balance -= amount;
    fromAccount.lastTransactionDate = new Date();
    await fromAccount.save({ session });

    toAccount.balance += amount;
    toAccount.lastTransactionDate = new Date();
    await toAccount.save({ session });

    // Create transaction records
    const transactions = await Transaction.create([
      {
        accountId: fromAccountId,
        userId,
        transactionType: 'transfer_out',
        amount,
        balanceAfter: fromAccount.balance,
        description: description || `Transfer to ${toAccount.accountNumber}`,
        relatedAccountId: toAccountId,
        relatedUserId: toAccount.userId
      },
      {
        accountId: toAccountId,
        userId: toAccount.userId,
        transactionType: 'transfer_in',
        amount,
        balanceAfter: toAccount.balance,
        description: description || `Transfer from ${fromAccount.accountNumber}`,
        relatedAccountId: fromAccountId,
        relatedUserId: userId
      }
    ], { session });

    await session.commitTransaction();
    logger.info(`Transfer successful: ${amount} from ${fromAccount.accountNumber} to ${toAccount.accountNumber}`);

    return {
      transactions,
      fromAccount,
      toAccount
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get transactions with filters
 */
const getTransactions = async (filters) => {
  const {
    accountId,
    userId,
    type,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1,
    limit = 20
  } = filters;

  const query = {};

  if (accountId) query.accountId = accountId;
  if (userId) query.userId = userId;
  if (type) query.transactionType = type;

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('relatedAccountId', 'accountNumber accountType')
      .populate('relatedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Transaction.countDocuments(query)
  ]);

  return {
    transactions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTransactions: total,
      hasMore: skip + transactions.length < total
    }
  };
};

/**
 * Get monthly statement
 */
const getMonthlyStatement = async (accountId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await Transaction.find({
    accountId,
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .sort({ createdAt: 1 })
    .lean();

  // Calculate summary
  const summary = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfersIn: 0,
    totalTransfersOut: 0,
    transactionCount: transactions.length
  };

  transactions.forEach(txn => {
    switch (txn.transactionType) {
      case 'deposit':
      case 'loan_disbursement':
        summary.totalDeposits += txn.amount;
        break;
      case 'withdrawal':
      case 'emi_deduction':
        summary.totalWithdrawals += txn.amount;
        break;
      case 'transfer_in':
        summary.totalTransfersIn += txn.amount;
        break;
      case 'transfer_out':
        summary.totalTransfersOut += txn.amount;
        break;
    }
  });

  return {
    period: { month, year, startDate, endDate },
    transactions,
    summary
  };
};

module.exports = {
  processDeposit,
  processWithdrawal,
  processTransfer,
  getTransactions,
  getMonthlyStatement
};
