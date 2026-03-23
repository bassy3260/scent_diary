import type { StateCreator } from 'zustand';
import { userApi } from '../api';
import type { UpdateUserRequest, UserData, UserProfile } from '../types/user.types';

function createEmptyProfile(): UserProfile {
  return {
    nickname: '',
    age: '',
    ageRange: '',
    gender: '',
    moodKeywords: [],
    emotionText: '',
    tpo: '',
    priceRange: '',
    intensity: '',
    notePreference: '',
  };
}

function mergeProfile(profile: UserProfile, updates: Partial<UserProfile>): UserProfile {
  const nextProfile: UserProfile = {
    ...profile,
    ...updates,
  };

  if (updates.age !== undefined && updates.ageRange === undefined) {
    nextProfile.ageRange = updates.age;
  }

  if (updates.ageRange !== undefined && updates.age === undefined) {
    nextProfile.age = updates.ageRange;
  }

  return nextProfile;
}

export interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setProfileFromUser: (user: UserData) => void;
  resetProfile: () => void;
  fetchMe: () => Promise<UserData>;
  updateMe: (body: UpdateUserRequest) => Promise<void>;
  deleteMe: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUserSlice: StateCreator<any, [], [], UserState> = (set, get) => ({
  profile: createEmptyProfile(),

  updateProfile: (updates: Partial<UserProfile>) =>
    set((state: UserState) => ({
      profile: mergeProfile(state.profile, updates),
    })),

  setProfileFromUser: (user: UserData) =>
    set((state: UserState) => ({
      profile: mergeProfile(state.profile, {
        nickname: user.nickname,
        age: user.age,
        ageRange: user.age,
        gender: user.gender,
      }),
    })),

  resetProfile: () => set({ profile: createEmptyProfile() }),

  fetchMe: async () => {
    const user = await userApi.getMe();
    get().setProfileFromUser(user);
    return user;
  },

  updateMe: async (body: UpdateUserRequest) => {
    await userApi.updateMe(body);
    await get().fetchMe();
  },

  deleteMe: async () => {
    await userApi.deleteMe();
    get().clearAuthState();
    get().resetProfile();
  },
});
