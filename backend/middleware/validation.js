const { z } = require('zod');
const logger = require('../utils/logger');

/**
 * Middleware to validate request data using Zod schemas
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      logger.warn('Validation error:', error.errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

// Common validation schemas
const schemas = {
  // User registration
  register: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(100),
      email: z.string().email('Invalid email address'),
      phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number'),
      nidOrPassport: z.string().min(5, 'NID/Passport must be at least 5 characters'),
      firebaseUid: z.string().min(1, 'Firebase UID is required')
    })
  }),

  // Create account
  createAccount: z.object({
    body: z.object({
      accountType: z.enum(['savings', 'student', 'fdr'], {
        errorMap: () => ({ message: 'Account type must be savings, student, or fdr' })
      }),
      initialDeposit: z.number().min(0, 'Initial deposit must be at least 0').optional(),
      interestRate: z.number().min(0).max(30).optional(),
      maturityDate: z.string().datetime().optional()
    })
  }),

  // Deposit
  deposit: z.object({
    body: z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      amount: z.number().min(1, 'Amount must be at least 1'),
      description: z.string().max(200).optional()
    })
  }),

  // Withdraw
  withdraw: z.object({
    body: z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      amount: z.number().min(1, 'Amount must be at least 1'),
      description: z.string().max(200).optional()
    })
  }),

  // Transfer
  transfer: z.object({
    body: z.object({
      fromAccountId: z.string().min(1, 'Source account ID is required'),
      toAccountId: z.string().min(1, 'Destination account ID is required'),
      amount: z.number().min(1, 'Amount must be at least 1'),
      description: z.string().max(200).optional()
    })
  }),

  // Loan application
  loanApplication: z.object({
    body: z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      loanType: z.enum(['personal', 'home', 'education', 'business', 'vehicle']),
      principalAmount: z.number().min(1000, 'Loan amount must be at least 1000'),
      interestRate: z.number().min(0).max(30, 'Interest rate must be between 0 and 30'),
      tenureMonths: z.number().min(6).max(360, 'Tenure must be between 6 and 360 months'),
      purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
      employmentStatus: z.enum(['employed', 'self-employed', 'business', 'student']),
      monthlyIncome: z.number().min(0)
    })
  }),

  // Update account status
  updateAccountStatus: z.object({
    body: z.object({
      status: z.enum(['active', 'frozen', 'closed']),
      reason: z.string().min(5, 'Reason must be at least 5 characters').optional()
    })
  }),

  // Transaction query
  transactionQuery: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      type: z.enum(['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'loan_disbursement', 'emi_deduction']).optional(),
      minAmount: z.string().regex(/^\d+\.?\d*$/).transform(Number).optional(),
      maxAmount: z.string().regex(/^\d+\.?\d*$/).transform(Number).optional()
    })
  })
};

module.exports = {
  validate,
  schemas
};
