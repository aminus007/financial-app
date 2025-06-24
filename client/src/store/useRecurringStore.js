import { create } from 'zustand';
import { recurring as recurringApi } from '../services/api';

const useRecurringStore = create((set, get) => ({
  recurring: [],
  loading: false,
  error: null,

  fetchRecurring: async () => {
    set({ loading: true, error: null });
    try {
      const data = await recurringApi.getAll();
      set({ recurring: data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch recurring transactions', loading: false });
    }
  },

  addRecurring: async (rec) => {
    set({ loading: true, error: null });
    try {
      const newRec = await recurringApi.create(rec);
      set({ recurring: [newRec, ...get().recurring], loading: false });
      return newRec;
    } catch (error) {
      set({ error: error.message || 'Failed to add recurring transaction', loading: false });
      throw error;
    }
  },

  updateRecurring: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedRec = await recurringApi.update(id, updates);
      set({
        recurring: get().recurring.map(r => r._id === id ? updatedRec : r),
        loading: false,
      });
      return updatedRec;
    } catch (error) {
      set({ error: error.message || 'Failed to update recurring transaction', loading: false });
      throw error;
    }
  },

  deleteRecurring: async (id) => {
    set({ loading: true, error: null });
    try {
      await recurringApi.remove(id);
      set({
        recurring: get().recurring.filter(r => r._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete recurring transaction', loading: false });
      throw error;
    }
  },
}));

export default useRecurringStore; 