import api from './api';

/**
 * Deposit money
 */
export const deposit = async (accountId, amount, description) => {
  const response = await api.post('/transactions/deposit', {
    accountId,
    amount,
    description
  });
  return response;
};

/**
 * Withdraw money
 */
export const withdraw = async (accountId, amount, description) => {
  const response = await api.post('/transactions/withdraw', {
    accountId,
    amount,
    description
  });
  return response;
};

/**
 * Transfer money
 */
export const transfer = async (fromAccountId, toAccountId, amount, description) => {
  const response = await api.post('/transactions/transfer', {
    fromAccountId,
    toAccountId,
    amount,
    description
  });
  return response;
};

/**
 * Get transactions
 */
export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });
  
  const response = await api.get(`/transactions?${params.toString()}`);
  return response;
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response;
};

/**
 * Get monthly statement
 */
export const getMonthlyStatement = async (accountId, month, year) => {
  const params = new URLSearchParams({ month, year });
  const response = await api.get(`/transactions/statement/${accountId}?${params.toString()}`);
  return response;
};

/**
 * Download transaction receipt
 */
export const downloadReceipt = async (id) => {
  const response = await api.get(`/transactions/${id}/receipt`, {
    responseType: 'blob'
  });
  return response;
};

/**
 * Download monthly statement
 */
export const downloadStatement = async (accountId, month, year) => {
  const params = new URLSearchParams({ month, year });
  const response = await api.get(
    `/transactions/statement/${accountId}/download?${params.toString()}`,
    { responseType: 'blob' }
  );
  return response;
};
