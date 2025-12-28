const express = require('express');
const router = express.Router();
const {
  deposit,
  withdraw,
  transfer,
  getTransactions,
  getTransactionById,
  getMonthlyStatement,
  downloadReceipt,
  downloadStatement
} = require('../controllers/transaction.controller');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { transactionRateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(verifyFirebaseToken);

// @route   POST /api/transactions/deposit
// @desc    Deposit money
// @access  Private
router.post('/deposit', transactionRateLimiter, validate(schemas.deposit), deposit);

// @route   POST /api/transactions/withdraw
// @desc    Withdraw money
// @access  Private
router.post('/withdraw', transactionRateLimiter, validate(schemas.withdraw), withdraw);

// @route   POST /api/transactions/transfer
// @desc    Transfer money
// @access  Private
router.post('/transfer', transactionRateLimiter, validate(schemas.transfer), transfer);

// @route   GET /api/transactions
// @desc    Get transactions with filters
// @access  Private
router.get('/', validate(schemas.transactionQuery), getTransactions);

// @route   GET /api/transactions/statement/:accountId
// @desc    Get monthly statement
// @access  Private
router.get('/statement/:accountId', getMonthlyStatement);

// @route   GET /api/transactions/statement/:accountId/download
// @desc    Download monthly statement PDF
// @access  Private
router.get('/statement/:accountId/download', downloadStatement);

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', getTransactionById);

// @route   GET /api/transactions/:id/receipt
// @desc    Download transaction receipt PDF
// @access  Private
router.get('/:id/receipt', downloadReceipt);

module.exports = router;
