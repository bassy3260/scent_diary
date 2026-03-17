import type { StateCreator } from 'zustand';

export interface AuthState {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;

  setHasOnboarded: (v: boolean) => void;
  setAuthenticated: (token: string) => void;
  logout: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAuthSlice: StateCreator<any, [], [], AuthState> = (set) => ({
  hasOnboarded: false,
  isAuthenticated: false,
  accessToken: null,

  setHasOnboarded: (v: boolean) => set({ hasOnboarded: v }),
  setAuthenticated: (token: string) => set({ isAuthenticated: true, accessToken: token }),
  logout: () => set({ isAuthenticated: false, accessToken: null }),
});
