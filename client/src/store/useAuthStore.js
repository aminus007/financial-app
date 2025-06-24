import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  // Set user and token (e.g., after login/register)
  login: (user, token) => set({ user, token }),
  // Clear user and token (e.g., on logout)
  logout: () => set({ user: null, token: null }),
  // Optionally, add a method to update user info
  setUser: (user) => set((state) => ({ ...state, user })),
  register: async (userData) => {
    try {
      const { user, token } = await authApi.register(userData);
      set({ user, token });
      return { user, token };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },
}));

export default useAuthStore; 