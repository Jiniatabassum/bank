const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'student', 'fdr'],
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'closed'],
    default: 'active'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  interestRate: {
    type: Number,
    default: 0 // For FDR accounts
  },
  maturityDate: {
    type: Date,
    default: null // For FDR accounts
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  lastTransactionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique account number
accountSchema.statics.generateAccountNumber = async function() {
  const prefix = 'AB'; // Abaya Bank prefix
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

// Pre-save hook to generate account number
accountSchema.pre('save', async function(next) {
  if (this.isNew && !this.accountNumber) {
    this.accountNumber = await this.constructor.generateAccountNumber();
  }
  next();
});

// Virtual for transactions
accountSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'accountId'
});

// Method to check if account can perform transaction
accountSchema.methods.canTransact = function() {
  return this.status === 'active';
};

// Method to check sufficient balance
accountSchema.methods.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

module.exports = mongoose.model('Account', accountSchema);
