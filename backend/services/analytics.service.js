const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const { getMonthName } = require('../utils/helpers');

/**
 * Get analytics dashboard data
 */
const getAnalytics = async (period = 'month') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  // Get transaction statistics
  const transactions = await Transaction.find({
    createdAt: { $gte: startDate }
  });

  const stats = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    totalLoanDisbursements: 0,
    totalEmiCollections: 0,
    transactionCount: transactions.length
  };

  transactions.forEach(txn => {
    switch (txn.transactionType) {
      case 'deposit':
        stats.totalDeposits += txn.amount;
        break;
      case 'withdrawal':
        stats.totalWithdrawals += txn.amount;
        break;
      case 'transfer_out':
        stats.totalTransfers += txn.amount;
        break;
      case 'loan_disbursement':
        stats.totalLoanDisbursements += txn.amount;
        break;
      case 'emi_deduction':
        stats.totalEmiCollections += txn.amount;
        break;
    }
  });

  // Get account statistics
  const [totalAccounts, activeAccounts, frozenAccounts] = await Promise.all([
    Account.countDocuments(),
    Account.countDocuments({ status: 'active' }),
    Account.countDocuments({ status: 'frozen' })
  ]);

  // Get loan statistics
  const [totalLoans, activeLoans, paidLoans, overdueLoans, requestedLoans] = await Promise.all([
    Loan.countDocuments(),
    Loan.countDocuments({ status: 'active' }),
    Loan.countDocuments({ status: 'paid' }),
    Loan.countDocuments({ status: 'overdue' }),
    Loan.countDocuments({ status: 'requested' })
  ]);

  // Get user statistics
  const [totalUsers, activeUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true })
  ]);

  return {
    transactions: stats,
    accounts: {
      total: totalAccounts,
      active: activeAccounts,
      frozen: frozenAccounts
    },
    loans: {
      total: totalLoans,
      active: activeLoans,
      paid: paidLoans,
      overdue: overdueLoans,
      requested: requestedLoans
    },
    users: {
      total: totalUsers,
      active: activeUsers
    }
  };
};

/**
 * Get monthly trends (last 12 months)
 */
const getMonthlyTrends = async () => {
  const trends = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const transactions = await Transaction.find({
      createdAt: {
        $gte: monthDate,
        $lt: nextMonth
      }
    });

    const monthStats = {
      month: getMonthName(monthDate),
      year: monthDate.getFullYear(),
      deposits: 0,
      withdrawals: 0,
      transfers: 0,
      loanDisbursements: 0,
      emiCollections: 0
    };

    transactions.forEach(txn => {
      switch (txn.transactionType) {
        case 'deposit':
          monthStats.deposits += txn.amount;
          break;
        case 'withdrawal':
          monthStats.withdrawals += txn.amount;
          break;
        case 'transfer_out':
          monthStats.transfers += txn.amount;
          break;
        case 'loan_disbursement':
          monthStats.loanDisbursements += txn.amount;
          break;
        case 'emi_deduction':
          monthStats.emiCollections += txn.amount;
          break;
      }
    });

    trends.push(monthStats);
  }

  return trends;
};

/**
 * Get account growth trend
 */
const getAccountGrowthTrend = async () => {
  const now = new Date();
  const growth = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const accountsCreated = await Account.countDocuments({
      createdAt: {
        $gte: monthDate,
        $lt: nextMonth
      }
    });

    const totalAccounts = await Account.countDocuments({
      createdAt: { $lt: nextMonth }
    });

    growth.push({
      month: getMonthName(monthDate),
      year: monthDate.getFullYear(),
      newAccounts: accountsCreated,
      totalAccounts
    });
  }

  return growth;
};

/**
 * Get loan status breakdown
 */
const getLoanStatusBreakdown = async () => {
  const statuses = ['requested', 'approved', 'active', 'paid', 'overdue', 'rejected'];
  const breakdown = [];

  for (const status of statuses) {
    const count = await Loan.countDocuments({ status });
    const totalAmount = await Loan.aggregate([
      { $match: { status } },
      { $group: { _id: null, total: { $sum: '$principalAmount' } } }
    ]);

    breakdown.push({
      status,
      count,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  }

  return breakdown;
};

module.exports = {
  getAnalytics,
  getMonthlyTrends,
  getAccountGrowthTrend,
  getLoanStatusBreakdown
};
