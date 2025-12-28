const loanService = require('../services/loan.service');
const logger = require('../utils/logger');

/**
 * Cron job to auto-deduct EMI from active loans
 * Runs on the 1st of every month at 00:00
 */
const emiDeductionJob = async () => {
  try {
    logger.info('Starting EMI auto-deduction job...');

    // Get all overdue/due loans
    const overdueLoans = await loanService.getOverdueLoans();

    logger.info(`Found ${overdueLoans.length} loans due for EMI deduction`);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each loan
    for (const loan of overdueLoans) {
      try {
        await loanService.deductEMI(loan._id);
        results.successful++;
        logger.info(`EMI deducted successfully for loan ${loan.loanNumber}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          loanNumber: loan.loanNumber,
          error: error.message
        });
        logger.error(`Failed to deduct EMI for loan ${loan.loanNumber}: ${error.message}`);
      }
    }

    logger.info(`EMI deduction job completed. Successful: ${results.successful}, Failed: ${results.failed}`);

    return results;
  } catch (error) {
    logger.error(`EMI deduction job failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  emiDeductionJob
};
