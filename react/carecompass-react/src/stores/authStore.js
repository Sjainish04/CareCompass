import { create } from 'zustand';
import { apiPost, apiGet, setTokenGetter } from '../lib/api';

export const useAuthStore = create((set, get) => {
  // Wire up token getter for API client
  setTokenGetter(() => get().token);

  return {
    user: null,
    token: null,
    loading: false,

    login: async (email, password) => {
      const data = await apiPost('/auth/login', { email, password });
      set({ user: data.user, token: data.token, loading: false });
      return data;
    },

    signup: async (email, password, full_name, role) => {
      const data = await apiPost('/auth/signup', { email, password, full_name, role });
      if (data.session?.access_token) {
        // Backend signup doesn't return profile, so attach it from known data
        const user = data.user || {};
        if (!user.profile) {
          user.profile = { role: role || 'patient', full_name: full_name || '' };
        }
        set({ user, token: data.session.access_token, loading: false });
      }
      return data;
    },

    logout: async () => {
      try { await apiPost('/auth/logout'); } catch {}
      set({ user: null, token: null, loading: false });
    },

    loadSession: async () => {
      const token = get().token;
      if (!token) {
        set({ loading: false });
        return;
      }
      try {
        const profile = await apiGet('/auth/me');
        set({ user: { ...get().user, profile }, loading: false });
      } catch {
        set({ user: null, token: null, loading: false });
      }
    },

    getRole: () => {
      const { user } = get();
      return user?.profile?.role || 'patient';
    },
  };
});
