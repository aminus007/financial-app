import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updatePreferences: (data) => api.patch('/auth/preferences', data),
  getNetBalance: () => api.get('/auth/me/netbalance'),
  getAccounts: () => api.get('/auth/me/accounts'),
  updateAccount: (id, data) => api.patch(`/auth/me/accounts/${id}`, data),
  updateCash: (cash) => api.patch('/auth/me/cash', { cash }),
  addAccount: (data) => api.post('/auth/me/accounts', data),
  deleteAccount: (id) => api.delete(`/auth/me/accounts/${id}`),
  getAccountHistory: (id) => api.get(`/auth/me/accounts/${id}/history`),
  transfer: (data) => api.post('/auth/me/transfer', data),
};

// Transactions API
export const transactions = {
  getAll: (params) => api.get('/transactions', { params }),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  getCategories: (params) => api.get('/transactions/categories', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getTopCategories: (params) => api.get('/transactions/top-categories', { params }),
  getNetWorthTrend: (params) => api.get('/transactions/net-worth-trend', { params }),
};

// Budgets API
export const budgets = {
  getAll: (params) => api.get('/budgets', { params }),
  createOrUpdate: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getProgress: (params) => api.get('/budgets/progress', { params }),
};

// Goals API
export const goals = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  addFunds: (id, amount) => api.post(`/goals/${id}/add`, { amount }),
  delete: (id) => api.delete(`/goals/${id}`),
  update: (id, data) => api.patch(`/goals/${id}`, data),
};

// Recurring Transactions API
export const recurring = {
  getAll: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.patch(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
};

// Admin API
export const admin = {
  // Users
  getUsers: () => api.get('/auth/admin/users'),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/admin/users/${id}`),
  // Transactions
  getTransactions: () => api.get('/transactions/admin/all'),
  updateTransaction: (id, data) => api.patch(`/transactions/admin/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/admin/${id}`),
  // Budgets
  getBudgets: () => api.get('/budgets/admin/all'),
  updateBudget: (id, data) => api.patch(`/budgets/admin/${id}`, data),
  deleteBudget: (id) => api.delete(`/budgets/admin/${id}`),
  // Goals
  getGoals: () => api.get('/goals/admin/all'),
  updateGoal: (id, data) => api.patch(`/goals/admin/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/admin/${id}`),
  // Recurring Transactions
  getRecurring: () => api.get('/recurring/admin/all'),
  updateRecurring: (id, data) => api.patch(`/recurring/admin/${id}`, data),
  deleteRecurring: (id) => api.delete(`/recurring/admin/${id}`),
  // Accounts
  getAccounts: () => api.get('/auth/admin/accounts'),
};

// Debts API
export const debts = {
  // User endpoints
  getAll: () => api.get('/debts'),
  get: (id) => api.get(`/debts/${id}`),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.patch(`/debts/${id}`, data),
  pay: (id, amount, accountId) => api.post(`/debts/${id}/pay`, { amount, accountId }),
  delete: (id) => api.delete(`/debts/${id}`),
  // Admin endpoints
  getAllAdmin: () => api.get('/debts/admin/all'),
  updateAdmin: (id, data) => api.patch(`/debts/admin/${id}`, data),
  deleteAdmin: (id) => api.delete(`/debts/admin/${id}`),
};

// Error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api; 