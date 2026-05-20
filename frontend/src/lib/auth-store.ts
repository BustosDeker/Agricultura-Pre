import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'GESTOR' | 'OPERADOR';
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      const { access_token, user } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token: access_token, user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },
}));
