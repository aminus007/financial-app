import { create } from 'zustand';
import { auth as authApi } from '../services/api';

const useAccountStore = create((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.getAccounts();
      set({ accounts: data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch accounts', loading: false });
    }
  },

  addAccount: async (account) => {
    set({ loading: true, error: null });
    try {
      const newAccount = await authApi.addAccount(account);
      set({ accounts: [newAccount, ...get().accounts], loading: false });
      return newAccount;
    } catch (error) {
      set({ error: error.message || 'Failed to add account', loading: false });
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedAccount = await authApi.updateAccount(id, updates);
      set({
        accounts: get().accounts.map(a => a._id === id ? updatedAccount : a),
        loading: false,
      });
      return updatedAccount;
    } catch (error) {
      set({ error: error.message || 'Failed to update account', loading: false });
      throw error;
    }
  },

  deleteAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      await authApi.deleteAccount(id);
      set({
        accounts: get().accounts.filter(a => a._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete account', loading: false });
      throw error;
    }
  },
}));

export default useAccountStore; 