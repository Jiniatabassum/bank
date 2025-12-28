import api from './api';

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/users?${params.toString()}`);
  return response;
};

/**
 * Get all accounts (Admin only)
 */
export const getAllAccounts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/accounts?${params.toString()}`);
  return response;
};

/**
 * Freeze/unfreeze account (Admin only)
 */
export const toggleAccountFreeze = async (accountId, reason) => {
  const response = await api.patch(`/admin/accounts/${accountId}/freeze`, { reason });
  return response;
};

/**
 * Get all loans (Admin only)
 */
export const getAllLoans = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/loans?${params.toString()}`);
  return response;
};

/**
 * Reverse transaction (Admin only)
 */
export const reverseTransaction = async (transactionId, reason) => {
  const response = await api.post(`/admin/transactions/${transactionId}/reverse`, { reason });
  return response;
};

/**
 * Get analytics dashboard (Admin only)
 */
export const getAnalytics = async (period = 'month') => {
  const response = await api.get(`/admin/analytics?period=${period}`);
  return response;
};

/**
 * Get audit logs (Admin only)
 */
export const getAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/audit-logs?${params.toString()}`);
  return response;
};
