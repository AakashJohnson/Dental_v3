import { create } from 'zustand';
import { api, setToken } from '../lib/api';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  username: string;
  collegeId?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  restore: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  async login(username, password) {
    set({ loading: true, error: null });
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        username,
        password,
      });
      setToken(res.token);
      set({ user: res.user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
  async restore() {
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ user });
    } catch {
      setToken(null);
      set({ user: null });
    }
  },
  logout() {
    setToken(null);
    set({ user: null });
  },
}));
