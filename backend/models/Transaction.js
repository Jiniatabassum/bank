const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'loan_disbursement', 'emi_deduction'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  // For transfers
  relatedAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // For loans
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    default: null
  },
  // Transaction metadata
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reversedAt: {
    type: Date,
    default: null
  },
  reversalReason: {
    type: String,
    default: null
  },
  // Reference to original transaction if this is a reversal
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
transactionSchema.statics.generateTransactionId = function() {
  const prefix = 'TXN';
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}${timestamp}${random}`;
};

// Pre-save hook to generate transaction ID
transactionSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = this.constructor.generateTransactionId();
  }
  next();
});

// Index for querying transactions by date range
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ accountId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

// Method to format transaction for receipt
transactionSchema.methods.toReceipt = function() {
  return {
    transactionId: this.transactionId,
    type: this.transactionType,
    amount: this.amount,
    balanceAfter: this.balanceAfter,
    description: this.description,
    date: this.createdAt,
    status: this.status
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
