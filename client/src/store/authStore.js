import { create } from 'zustand';
import { authService } from '../services/services';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('sop_token'),
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null });
    const res = await authService.login(email, password);
    localStorage.setItem('sop_token', res.data.token);
    set({ user: res.data.user, token: res.data.token });
  },

  logout: () => {
    localStorage.removeItem('sop_token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('sop_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await authService.me();
      set({ user: res.data.user, loading: false });
    } catch {
      localStorage.removeItem('sop_token');
      set({ user: null, token: null, loading: false });
    }
  },

  isAdmin: () => get().user?.roles?.includes('admin'),
  isEditor: () => get().user?.roles?.includes('editor') || get().user?.roles?.includes('admin'),
}));
