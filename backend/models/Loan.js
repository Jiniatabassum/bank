const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  loanNumber: {
    type: String,
    unique: true,
    required: true
  },
  loanType: {
    type: String,
    enum: ['personal', 'home', 'education', 'business', 'vehicle'],
    required: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 1000
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 30 // Annual interest rate percentage
  },
  tenureMonths: {
    type: Number,
    required: true,
    min: 6,
    max: 360 // 30 years max
  },
  emiAmount: {
    type: Number,
    required: true
  },
  totalPayableAmount: {
    type: Number,
    required: true
  },
  outstandingBalance: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingEmis: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'active', 'paid', 'overdue', 'rejected'],
    default: 'requested'
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  // EMI details
  nextEmiDate: {
    type: Date,
    default: null
  },
  lastEmiDate: {
    type: Date,
    default: null
  },
  emiStartDate: {
    type: Date,
    default: null
  },
  // Approval details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  disbursedAt: {
    type: Date,
    default: null
  },
  // Application details
  employmentStatus: {
    type: String,
    enum: ['employed', 'self-employed', 'business', 'student'],
    required: true
  },
  monthlyIncome: {
    type: Number,
    required: true
  },
  documents: [{
    type: String,
    url: String
  }]
}, {
  timestamps: true
});

// Generate unique loan number
loanSchema.statics.generateLoanNumber = function() {
  const prefix = 'LOAN';
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Pre-save hook to generate loan number
loanSchema.pre('save', function(next) {
  if (this.isNew && !this.loanNumber) {
    this.loanNumber = this.constructor.generateLoanNumber();
  }
  next();
});

// Static method to calculate EMI
// Formula: EMI = [P × R × (1 + R)^N] / [(1 + R)^N - 1]
loanSchema.statics.calculateEMI = function(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / 12 / 100; // Convert annual rate to monthly decimal
  
  if (monthlyRate === 0) {
    // If interest rate is 0, EMI is simply principal / tenure
    return principal / tenureMonths;
  }
  
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
  
  return numerator / denominator;
};

// Method to check if EMI is due
loanSchema.methods.isEmiDue = function() {
  if (this.status !== 'active' || !this.nextEmiDate) {
    return false;
  }
  return new Date() >= this.nextEmiDate;
};

// Method to calculate next EMI date
loanSchema.methods.calculateNextEmiDate = function() {
  if (!this.nextEmiDate) {
    // First EMI
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1); // Set to 1st of next month
    return nextMonth;
  }
  
  const next = new Date(this.nextEmiDate);
  next.setMonth(next.getMonth() + 1);
  return next;
};

// Index for querying overdue loans
loanSchema.index({ status: 1, nextEmiDate: 1 });

module.exports = mongoose.model('Loan', loanSchema);
