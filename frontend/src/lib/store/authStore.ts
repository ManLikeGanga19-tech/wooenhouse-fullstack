'use client';

import { create } from 'zustand';
import { api, type AuthUser } from '@/lib/api/client';

interface AuthState {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:          () => Promise<void>;
  checkSession:    () => Promise<void>;
}

// Helpers — only run in the browser
const setAdminCookie  = () => { if (typeof document !== "undefined") document.cookie = "wh_is_admin=1; path=/; SameSite=Lax"; };
const clearAdminCookie = () => { if (typeof document !== "undefined") document.cookie = "wh_is_admin=; path=/; max-age=0; SameSite=Lax"; };

export const useAuthStore = create<AuthState>()((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  /**
   * Calls the backend login endpoint.
   * The backend sets a secure httpOnly cookie — we never touch the token directly.
   * We also set wh_is_admin=1 so the middleware recognises this browser as admin
   * for local dev routing without needing ?_admin=1 in every URL.
   */
  login: async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      set({ user: res.data, isAuthenticated: true });
      setAdminCookie();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Login failed.';
      return { success: false, error };
    }
  },

  /**
   * Calls the backend logout endpoint which clears the httpOnly cookie.
   * Also clears the wh_is_admin routing cookie.
   */
  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Even if the request fails, clear local state
    } finally {
      set({ user: null, isAuthenticated: false });
      clearAdminCookie();
    }
  },

  /**
   * Called on app load to verify the existing cookie session.
   * Re-stamps wh_is_admin if the session is still valid (survives page refresh).
   */
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const res = await api.auth.me();
      set({ user: res.data, isAuthenticated: true });
      setAdminCookie();
    } catch {
      set({ user: null, isAuthenticated: false });
      clearAdminCookie();
    } finally {
      set({ isLoading: false });
    }
  },
}));
