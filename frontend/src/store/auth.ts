import { create } from 'zustand';
import { api, setToken } from '../lib/api';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  username: string;
  collegeId?: string;
}

/**
 * Dev/demo mode: a client-only session that never touches the backend. The
 * fake user is persisted so a page refresh keeps you signed in. Data pages
 * fall back to their bundled demo data when API calls return nothing.
 */
const DEV_USER_KEY = 'dd_dev_user';

function readDevUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEV_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  devMode: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  devLogin: (user: AuthUser) => void;
  restore: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  devMode: false,
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
      localStorage.removeItem(DEV_USER_KEY);
      set({ user: res.user, devMode: false, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
  devLogin(user) {
    setToken(null);
    localStorage.setItem(DEV_USER_KEY, JSON.stringify(user));
    set({ user, devMode: true, error: null, loading: false });
  },
  async restore() {
    const devUser = readDevUser();
    if (devUser) {
      set({ user: devUser, devMode: true });
      return;
    }
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
    localStorage.removeItem(DEV_USER_KEY);
    set({ user: null, devMode: false });
  },
}));
