import type { StateCreator } from 'zustand';
import type { UserProfile } from '../types/user.types';

export interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUserSlice: StateCreator<any, [], [], UserState> = (set) => ({
  profile: {
    nickname: '',
    ageRange: '',
    gender: '',
    moodKeywords: [],
    emotionText: '',
    tpo: '',
    priceRange: '',
    intensity: '',
    notePreference: '',
  },

  updateProfile: (updates: Partial<UserProfile>) =>
    set((s: UserState) => ({ profile: { ...s.profile, ...updates } })),
});
