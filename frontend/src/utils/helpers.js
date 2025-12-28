/**
 * Format currency with proper symbol and decimals
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (format === 'datetime') {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString();
};

/**
 * Get transaction type badge color
 */
export const getTransactionTypeColor = (type) => {
  const colors = {
    deposit: 'success',
    withdrawal: 'danger',
    transfer_in: 'success',
    transfer_out: 'warning',
    loan_disbursement: 'info',
    emi_deduction: 'danger'
  };
  
  return colors[type] || 'info';
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type) => {
  const labels = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    loan_disbursement: 'Loan Disbursement',
    emi_deduction: 'EMI Deduction'
  };
  
  return labels[type] || type;
};

/**
 * Get account type label
 */
export const getAccountTypeLabel = (type) => {
  const labels = {
    savings: 'Savings Account',
    student: 'Student Account',
    fdr: 'Fixed Deposit'
  };
  
  return labels[type] || type;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    frozen: 'warning',
    closed: 'danger',
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
    reversed: 'danger',
    requested: 'warning',
    approved: 'info',
    paid: 'success',
    overdue: 'danger',
    rejected: 'danger'
  };
  
  return colors[status] || 'info';
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const re = /^[\d\s-()]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Download file
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
