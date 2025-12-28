const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { formatCurrency } = require('../utils/helpers');

/**
 * Generate PDF receipt for a transaction
 */
const generateTransactionReceipt = async (transactionId) => {
  // Fetch transaction with related data
  const transaction = await Transaction.findById(transactionId)
    .populate('accountId')
    .populate('userId')
    .populate('relatedAccountId')
    .lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Buffer to store PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24)
         .fillColor('#3B82F6')
         .text('Abaya Bank', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(16)
         .fillColor('#000000')
         .text('Transaction Receipt', { align: 'center' })
         .moveDown(1);

      // Add a line
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown(1);

      // Transaction Details
      doc.fontSize(12).fillColor('#666666');
      
      const leftColumn = 80;
      const rightColumn = 300;
      let currentY = doc.y;

      // Transaction ID
      doc.text('Transaction ID:', leftColumn, currentY, { continued: true, width: 200 });
      doc.fillColor('#000000').text(transaction.transactionId, rightColumn, currentY);
      currentY += 25;

      // Date
      doc.fillColor('#666666').text('Date:', leftColumn, currentY, { continued: false });
      doc.fillColor('#000000').text(
        new Date(transaction.createdAt).toLocaleString(),
        rightColumn,
        currentY
      );
      currentY += 25;

      // Type
      doc.fillColor('#666666').text('Type:', leftColumn, currentY);
      doc.fillColor('#000000').text(
        transaction.transactionType.replace('_', ' ').toUpperCase(),
        rightColumn,
        currentY
      );
      currentY += 25;

      // Amount
      doc.fillColor('#666666').text('Amount:', leftColumn, currentY);
      doc.fontSize(14)
         .fillColor('#3B82F6')
         .text(formatCurrency(transaction.amount), rightColumn, currentY);
      doc.fontSize(12);
      currentY += 30;

      // Account Details
      doc.fillColor('#666666').text('Account Number:', leftColumn, currentY);
      doc.fillColor('#000000').text(
        transaction.accountId.accountNumber,
        rightColumn,
        currentY
      );
      currentY += 25;

      // Balance After
      doc.fillColor('#666666').text('Balance After:', leftColumn, currentY);
      doc.fillColor('#000000').text(
        formatCurrency(transaction.balanceAfter),
        rightColumn,
        currentY
      );
      currentY += 25;

      // Description
      if (transaction.description) {
        doc.fillColor('#666666').text('Description:', leftColumn, currentY);
        doc.fillColor('#000000').text(
          transaction.description,
          rightColumn,
          currentY,
          { width: 250 }
        );
        currentY += 30;
      }

      // Related Account (for transfers)
      if (transaction.relatedAccountId) {
        doc.fillColor('#666666').text(
          transaction.transactionType === 'transfer_out' ? 'To Account:' : 'From Account:',
          leftColumn,
          currentY
        );
        doc.fillColor('#000000').text(
          transaction.relatedAccountId.accountNumber,
          rightColumn,
          currentY
        );
        currentY += 25;
      }

      // Status
      doc.fillColor('#666666').text('Status:', leftColumn, currentY);
      const statusColor = transaction.status === 'completed' ? '#10B981' : 
                         transaction.status === 'reversed' ? '#EF4444' : '#F59E0B';
      doc.fillColor(statusColor).text(
        transaction.status.toUpperCase(),
        rightColumn,
        currentY
      );
      currentY += 40;

      // Add a line
      doc.moveTo(50, currentY)
         .lineTo(550, currentY)
         .stroke();
      currentY += 30;

      // Customer Details
      doc.fontSize(14)
         .fillColor('#3B82F6')
         .text('Customer Details', leftColumn, currentY);
      currentY += 25;

      doc.fontSize(12).fillColor('#666666');
      doc.text('Name:', leftColumn, currentY);
      doc.fillColor('#000000').text(transaction.userId.name, rightColumn, currentY);
      currentY += 20;

      doc.fillColor('#666666').text('Email:', leftColumn, currentY);
      doc.fillColor('#000000').text(transaction.userId.email, rightColumn, currentY);
      currentY += 40;

      // Footer
      doc.fontSize(10)
         .fillColor('#999999')
         .text(
           'This is a computer-generated receipt and does not require a signature.',
           50,
           doc.page.height - 100,
           { align: 'center', width: 500 }
         );

      doc.text(
        '© 2025 Abaya Bank. All rights reserved.',
        50,
        doc.page.height - 70,
        { align: 'center', width: 500 }
      );

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate monthly statement PDF
 */
const generateMonthlyStatement = async (accountId, month, year) => {
  const transactionService = require('./transaction.service');
  
  const statement = await transactionService.getMonthlyStatement(accountId, month, year);
  const account = await Account.findById(accountId).populate('userId').lean();

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24)
         .fillColor('#3B82F6')
         .text('Abaya Bank', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(16)
         .fillColor('#000000')
         .text('Monthly Account Statement', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(12)
         .fillColor('#666666')
         .text(`${statement.period.startDate.toLocaleDateString()} - ${statement.period.endDate.toLocaleDateString()}`, { align: 'center' })
         .moveDown(1);

      // Account Info
      doc.fontSize(12);
      doc.text(`Account Number: ${account.accountNumber}`, 50);
      doc.text(`Account Type: ${account.accountType.toUpperCase()}`, 50);
      doc.text(`Account Holder: ${account.userId.name}`, 50);
      doc.text(`Current Balance: ${formatCurrency(account.balance)}`, 50);
      doc.moveDown(1);

      // Summary
      doc.fontSize(14).fillColor('#3B82F6').text('Summary', 50);
      doc.fontSize(11).fillColor('#000000');
      doc.text(`Total Deposits: ${formatCurrency(statement.summary.totalDeposits)}`, 70);
      doc.text(`Total Withdrawals: ${formatCurrency(statement.summary.totalWithdrawals)}`, 70);
      doc.text(`Total Transfers In: ${formatCurrency(statement.summary.totalTransfersIn)}`, 70);
      doc.text(`Total Transfers Out: ${formatCurrency(statement.summary.totalTransfersOut)}`, 70);
      doc.text(`Total Transactions: ${statement.summary.transactionCount}`, 70);
      doc.moveDown(1);

      // Transactions Table
      doc.fontSize(14).fillColor('#3B82F6').text('Transactions', 50);
      doc.moveDown(0.5);

      // Table headers
      doc.fontSize(10).fillColor('#000000');
      const tableTop = doc.y;
      doc.text('Date', 50, tableTop, { width: 80 });
      doc.text('Type', 130, tableTop, { width: 80 });
      doc.text('Description', 210, tableTop, { width: 150 });
      doc.text('Amount', 360, tableTop, { width: 80, align: 'right' });
      doc.text('Balance', 440, tableTop, { width: 100, align: 'right' });

      let yPosition = tableTop + 20;

      // Draw line under headers
      doc.moveTo(50, yPosition - 5)
         .lineTo(550, yPosition - 5)
         .stroke();

      // Transaction rows
      statement.transactions.forEach((txn, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const date = new Date(txn.createdAt).toLocaleDateString();
        const type = txn.transactionType.replace('_', ' ');
        const desc = txn.description.substring(0, 25);
        const amount = formatCurrency(txn.amount);
        const balance = formatCurrency(txn.balanceAfter);

        doc.fontSize(9);
        doc.text(date, 50, yPosition, { width: 80 });
        doc.text(type, 130, yPosition, { width: 80 });
        doc.text(desc, 210, yPosition, { width: 150 });
        
        // Color code amounts
        const amountColor = ['deposit', 'transfer_in', 'loan_disbursement'].includes(txn.transactionType) 
          ? '#10B981' : '#EF4444';
        doc.fillColor(amountColor).text(amount, 360, yPosition, { width: 80, align: 'right' });
        
        doc.fillColor('#000000').text(balance, 440, yPosition, { width: 100, align: 'right' });

        yPosition += 20;
      });

      // Footer
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           'This is a computer-generated statement.',
           50,
           doc.page.height - 50,
           { align: 'center', width: 500 }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateTransactionReceipt,
  generateMonthlyStatement
};
