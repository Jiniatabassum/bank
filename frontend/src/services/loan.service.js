import api from './api';

/**
 * Calculate EMI
 */
export const calculateEMI = async (principalAmount, interestRate, tenureMonths) => {
  const response = await api.post('/loans/calculate-emi', {
    principalAmount,
    interestRate,
    tenureMonths
  });
  return response;
};

/**
 * Apply for loan
 */
export const applyForLoan = async (loanData) => {
  const response = await api.post('/loans', loanData);
  return response;
};

/**
 * Get user loans
 */
export const getLoans = async () => {
  const response = await api.get('/loans');
  return response;
};

/**
 * Get loan by ID
 */
export const getLoanById = async (id) => {
  const response = await api.get(`/loans/${id}`);
  return response;
};

/**
 * Pay EMI manually
 */
export const payEMI = async (loanId) => {
  const response = await api.post(`/loans/${loanId}/pay-emi`);
  return response;
};

/**
 * Approve loan (Admin only)
 */
export const approveLoan = async (loanId) => {
  const response = await api.post(`/loans/${loanId}/approve`);
  return response;
};

/**
 * Reject loan (Admin only)
 */
export const rejectLoan = async (loanId, reason) => {
  const response = await api.post(`/loans/${loanId}/reject`, { reason });
  return response;
};
