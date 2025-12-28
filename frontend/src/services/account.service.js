import api from './api';

/**
 * Get all user accounts
 */
export const getAccounts = async () => {
  const response = await api.get('/accounts');
  return response;
};

/**
 * Get account by ID
 */
export const getAccountById = async (id) => {
  const response = await api.get(`/accounts/${id}`);
  return response;
};

/**
 * Create new account
 */
export const createAccount = async (accountData) => {
  const response = await api.post('/accounts', accountData);
  return response;
};

/**
 * Get account balance
 */
export const getAccountBalance = async (id) => {
  const response = await api.get(`/accounts/${id}/balance`);
  return response;
};

/**
 * Update account status (Admin only)
 */
export const updateAccountStatus = async (id, status, reason) => {
  const response = await api.patch(`/accounts/${id}/status`, { status, reason });
  return response;
};
