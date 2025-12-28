const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Calculate EMI and total payable amount
 */
const calculateLoanDetails = (principalAmount, interestRate, tenureMonths) => {
  const emi = Loan.calculateEMI(principalAmount, interestRate, tenureMonths);
  const totalPayableAmount = emi * tenureMonths;
  const totalInterest = totalPayableAmount - principalAmount;

  return {
    emiAmount: Math.round(emi * 100) / 100,
    totalPayableAmount: Math.round(totalPayableAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principalAmount,
    interestRate,
    tenureMonths
  };
};

/**
 * Apply for loan
 */
const applyForLoan = async (userId, loanData) => {
  const {
    accountId,
    loanType,
    principalAmount,
    interestRate,
    tenureMonths,
    purpose,
    employmentStatus,
    monthlyIncome
  } = loanData;

  // Verify account ownership
  const account = await Account.findById(accountId);

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  if (account.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  if (!account.canTransact()) {
    throw new AppError('Account is not active', 400);
  }

  // Calculate loan details
  const loanDetails = calculateLoanDetails(principalAmount, interestRate, tenureMonths);

  // Create loan application
  const loan = await Loan.create({
    userId,
    accountId,
    loanType,
    principalAmount,
    interestRate,
    tenureMonths,
    emiAmount: loanDetails.emiAmount,
    totalPayableAmount: loanDetails.totalPayableAmount,
    outstandingBalance: loanDetails.totalPayableAmount,
    remainingEmis: tenureMonths,
    purpose,
    employmentStatus,
    monthlyIncome,
    status: 'requested'
  });

  logger.info(`Loan application created: ${loan.loanNumber} by user ${userId}`);

  return loan;
};

/**
 * Approve loan and disburse amount
 */
const approveLoan = async (loanId, adminUserId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loan = await Loan.findById(loanId).session(session);

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    if (loan.status !== 'requested') {
      throw new AppError('Loan is not in requested status', 400);
    }

    const account = await Account.findById(loan.accountId).session(session);

    if (!account || !account.canTransact()) {
      throw new AppError('Account is not available for loan disbursement', 400);
    }

    // Update loan status
    loan.status = 'active';
    loan.approvedBy = adminUserId;
    loan.approvedAt = new Date();
    loan.disbursedAt = new Date();
    loan.emiStartDate = new Date();
    loan.nextEmiDate = loan.calculateNextEmiDate();
    await loan.save({ session });

    // Disburse loan amount to account
    account.balance += loan.principalAmount;
    account.lastTransactionDate = new Date();
    await account.save({ session });

    // Create transaction record
    await Transaction.create([{
      accountId: account._id,
      userId: loan.userId,
      transactionType: 'loan_disbursement',
      amount: loan.principalAmount,
      balanceAfter: account.balance,
      description: `Loan disbursement - ${loan.loanNumber}`,
      loanId: loan._id
    }], { session });

    await session.commitTransaction();
    logger.info(`Loan approved and disbursed: ${loan.loanNumber}`);

    return loan;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Reject loan
 */
const rejectLoan = async (loanId, adminUserId, reason) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new AppError('Loan not found', 404);
  }

  if (loan.status !== 'requested') {
    throw new AppError('Loan is not in requested status', 400);
  }

  loan.status = 'rejected';
  loan.approvedBy = adminUserId;
  loan.approvedAt = new Date();
  loan.rejectionReason = reason;
  await loan.save();

  logger.info(`Loan rejected: ${loan.loanNumber} by admin ${adminUserId}`);

  return loan;
};

/**
 * Deduct EMI from account
 */
const deductEMI = async (loanId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loan = await Loan.findById(loanId).session(session);

    if (!loan || loan.status !== 'active') {
      throw new AppError('Loan is not active', 400);
    }

    if (!loan.isEmiDue()) {
      throw new AppError('EMI is not due yet', 400);
    }

    const account = await Account.findById(loan.accountId).session(session);

    if (!account || !account.canTransact()) {
      throw new AppError('Account is not available', 400);
    }

    if (!account.hasSufficientBalance(loan.emiAmount)) {
      // Mark loan as overdue
      loan.status = 'overdue';
      await loan.save({ session });
      await session.commitTransaction();
      
      logger.warn(`Insufficient balance for EMI deduction: Loan ${loan.loanNumber}`);
      throw new AppError('Insufficient balance for EMI deduction', 400);
    }

    // Deduct EMI amount
    account.balance -= loan.emiAmount;
    account.lastTransactionDate = new Date();
    await account.save({ session });

    // Update loan details
    loan.paidAmount += loan.emiAmount;
    loan.outstandingBalance -= loan.emiAmount;
    loan.remainingEmis -= 1;
    loan.lastEmiDate = new Date();

    if (loan.remainingEmis === 0) {
      loan.status = 'paid';
      loan.nextEmiDate = null;
    } else {
      loan.nextEmiDate = loan.calculateNextEmiDate();
    }

    await loan.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      accountId: account._id,
      userId: loan.userId,
      transactionType: 'emi_deduction',
      amount: loan.emiAmount,
      balanceAfter: account.balance,
      description: `EMI deduction - ${loan.loanNumber}`,
      loanId: loan._id
    }], { session });

    await session.commitTransaction();
    logger.info(`EMI deducted successfully for loan ${loan.loanNumber}`);

    return {
      loan,
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
 * Get overdue loans
 */
const getOverdueLoans = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueLoans = await Loan.find({
    status: 'active',
    nextEmiDate: { $lte: today }
  })
    .populate('userId', 'name email phone')
    .populate('accountId', 'accountNumber balance')
    .lean();

  return overdueLoans;
};

module.exports = {
  calculateLoanDetails,
  applyForLoan,
  approveLoan,
  rejectLoan,
  deductEMI,
  getOverdueLoans
};
