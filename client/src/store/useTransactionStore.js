import { create } from 'zustand';
import { transactions as transactionsApi } from '../services/api';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await transactionsApi.getAll(params);
      set({ transactions: data.transactions || data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch transactions', loading: false });
    }
  },

  addTransaction: async (transaction) => {
    set({ loading: true, error: null });
    try {
      const newTx = await transactionsApi.create(transaction);
      set({ transactions: [newTx, ...get().transactions], loading: false });
      return newTx;
    } catch (error) {
      set({ error: error.message || 'Failed to add transaction', loading: false });
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedTx = await transactionsApi.update(id, updates);
      set({
        transactions: get().transactions.map(tx => tx._id === id ? updatedTx : tx),
        loading: false,
      });
      return updatedTx;
    } catch (error) {
      set({ error: error.message || 'Failed to update transaction', loading: false });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await transactionsApi.remove(id);
      set({
        transactions: get().transactions.filter(tx => tx._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete transaction', loading: false });
      throw error;
    }
  },
}));

export default useTransactionStore; 