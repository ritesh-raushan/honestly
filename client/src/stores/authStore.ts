import { create } from 'zustand';
import { storage } from '../utils/storage';
import { authAPI } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
  
  login: (user, accessToken) => {
    // Store access token
    storage.setToken(accessToken);
    
    // Set user in state
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user state regardless of API call success
      storage.removeToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  
  initialize: async () => {
    const token = storage.getToken();
    
    if (!token) {
      set({ isLoading: false });
      return;
    }
    
    try {
      // Fetch current user data from the backend.
      // If the access token is stale, the axios interceptor will silently refresh.
      const user = await authAPI.me();
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Invalid token or user not found - clear local state and fall back to logged-out
      console.error('Failed to initialize auth:', error);
      storage.removeToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  
  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },
}));
