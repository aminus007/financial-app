import { create } from 'zustand';
import { goals as goalsApi } from '../services/api';

const useGoalStore = create((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const data = await goalsApi.getAll();
      set({ goals: data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch goals', loading: false });
    }
  },

  addGoal: async (goal) => {
    set({ loading: true, error: null });
    try {
      const newGoal = await goalsApi.create(goal);
      set({ goals: [newGoal, ...get().goals], loading: false });
      return newGoal;
    } catch (error) {
      set({ error: error.message || 'Failed to add goal', loading: false });
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedGoal = await goalsApi.update(id, updates);
      set({
        goals: get().goals.map(g => g._id === id ? updatedGoal : g),
        loading: false,
      });
      return updatedGoal;
    } catch (error) {
      set({ error: error.message || 'Failed to update goal', loading: false });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await goalsApi.remove(id);
      set({
        goals: get().goals.filter(g => g._id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message || 'Failed to delete goal', loading: false });
      throw error;
    }
  },

  addFunds: async (id, amount) => {
    set({ loading: true, error: null });
    try {
      const updatedGoal = await goalsApi.addFunds(id, amount);
      set({
        goals: get().goals.map(g => g._id === id ? updatedGoal : g),
        loading: false,
      });
      return updatedGoal;
    } catch (error) {
      set({ error: error.message || 'Failed to add funds', loading: false });
      throw error;
    }
  },
}));

export default useGoalStore; 