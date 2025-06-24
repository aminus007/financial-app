import { create } from 'zustand';
import { debts as debtsApi } from '../services/api';

const useDebtStore = create((set, get) => ({
  debts: [],
  loading: false,
  error: null,

  fetchDebts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await debtsApi.getAll();
      set({ debts: data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch debts', loading: false });
    }
  },

  addDebt: async (debt) => {
    set({ loading: true, error: null });
    try {
      const newDebt = await debtsApi.create(debt);
      set({ debts: [newDebt, ...get().debts], loading: false });
      return newDebt;
    } catch (error) {
      set({ error: error.message || 'Failed to add debt', loading: false });
      throw error;
    }
  },

  updateDebt: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedDebt = await debtsApi.update(id, updates);
      set({
        debts: get().debts.map(d => d._id === id ? updatedDebt : d),
        loading: false,
      });
      return updatedDebt;
    } catch (error) {
      set({ error: error.message || 'Failed to update debt', loading: false });
      throw error;
    }
  },

  deleteDebt: async (id) => {
    set({ loading: true, error: null });
    try {
      await debtsApi.remove(id);
      set({
        debts: get().debts.filter(d => d._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete debt', loading: false });
      throw error;
    }
  },

  payDebt: async (id, payment) => {
    set({ loading: true, error: null });
    try {
      const updatedDebt = await debtsApi.pay(id, payment);
      set({
        debts: get().debts.map(d => d._id === id ? updatedDebt : d),
        loading: false,
      });
      return updatedDebt;
    } catch (error) {
      set({ error: error.message || 'Failed to pay debt', loading: false });
      throw error;
    }
  },
}));

export default useDebtStore; 