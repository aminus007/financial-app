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
};

// Recurring Transactions API
export const recurring = {
  getAll: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.patch(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
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