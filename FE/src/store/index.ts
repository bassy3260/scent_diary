import { create } from 'zustand';
import { createNavigationSlice, type NavigationState }         from './navigation.store';
import { createAuthSlice, type AuthState }                     from './auth.store';
import { createUserSlice, type UserState }                     from './user.store';
import { createPerfumeSlice, type PerfumeState }               from './perfume.store';
import { createRecommendationSlice, type RecommendationState } from './recommendation.store';
import { createDiarySlice, type DiaryState }                   from './diary.store';

export type AppState =
  & NavigationState
  & AuthState
  & UserState
  & PerfumeState
  & RecommendationState
  & DiaryState;

export const useAppStore = create<AppState>()((...a) => ({
  ...createNavigationSlice(...a),
  ...createAuthSlice(...a),
  ...createUserSlice(...a),
  ...createPerfumeSlice(...a),
  ...createRecommendationSlice(...a),
  ...createDiarySlice(...a),
}));

// 도메인별 선택자 — 컴포넌트에서 필요한 slice만 구독
export const useNavigationStore = () =>
  useAppStore((s) => ({
    screen: s.screen, prevScreen: s.prevScreen, transitionType: s.transitionType,
    setScreen: s.setScreen, navigateTo: s.navigateTo,
    pushTo: s.pushTo, sheetTo: s.sheetTo, goBack: s.goBack,
  }));

export const useAuthStore = () =>
  useAppStore((s) => ({
    hasOnboarded: s.hasOnboarded, isAuthenticated: s.isAuthenticated, accessToken: s.accessToken,
    setHasOnboarded: s.setHasOnboarded, setAuthenticated: s.setAuthenticated, logout: s.logout,
  }));

export const useUserStore = () =>
  useAppStore((s) => ({ profile: s.profile, updateProfile: s.updateProfile }));

export const usePerfumeStore = () =>
  useAppStore((s) => ({
    selectedPerfumeId: s.selectedPerfumeId, savedPerfumes: s.savedPerfumes, myCollection: s.myCollection,
    setSelectedPerfumeId: s.setSelectedPerfumeId,
    toggleSavedPerfume: s.toggleSavedPerfume, toggleMyCollection: s.toggleMyCollection,
  }));

export const useRecommendationStore = () =>
  useAppStore((s) => ({
    recommendationHistory: s.recommendationHistory,
    selectedHistoryId: s.selectedHistoryId, isGiftMode: s.isGiftMode,
    setSelectedHistoryId: s.setSelectedHistoryId, setIsGiftMode: s.setIsGiftMode,
    addRecommendationHistory: s.addRecommendationHistory,
    deleteRecommendationHistory: s.deleteRecommendationHistory,
  }));

export const useDiaryStore = () =>
  useAppStore((s) => ({
    diaryEntries: s.diaryEntries, tastingLogs: s.tastingLogs, selectedDiaryId: s.selectedDiaryId,
    setSelectedDiaryId: s.setSelectedDiaryId, addDiaryEntry: s.addDiaryEntry,
    updateDiaryEntry: s.updateDiaryEntry, addTastingLog: s.addTastingLog,
  }));
