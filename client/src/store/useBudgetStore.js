import { create } from 'zustand'; // Corrected import
import { budgets as budgetsApi } from '../services/api';

const useBudgetStore = create((set, get) => ({
  budgets: [],
  loading: false,
  error: null,

  fetchBudgets: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await budgetsApi.getAll(params);
      set({ budgets: data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch budgets', loading: false });
    }
  },

  addBudget: async (budget) => {
    set({ loading: true, error: null });
    try {
      const newBudget = await budgetsApi.create(budget);
      set({ budgets: [newBudget, ...get().budgets], loading: false });
      return newBudget;
    } catch (error) {
      set({ error: error.message || 'Failed to add budget', loading: false });
      throw error;
    }
  },

  updateBudget: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedBudget = await budgetsApi.update(id, updates);
      set({
        budgets: get().budgets.map(b => b._id === id ? updatedBudget : b),
        loading: false,
      });
      return updatedBudget;
    } catch (error) {
      set({ error: error.message || 'Failed to update budget', loading: false });
      throw error;
    }
  },

  deleteBudget: async (id) => {
    set({ loading: true, error: null });
    try {
      await budgetsApi.remove(id);
      set({
        budgets: get().budgets.filter(b => b._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete budget', loading: false });
      throw error;
    }
  },
}));

export default useBudgetStore; 