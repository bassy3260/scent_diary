import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createNavigationSlice,
  type NavigationState,
} from "./navigation.store";
import { createAuthSlice, type AuthState } from "./auth.store";
import { createUserSlice, type UserState } from "./user.store";
import { createPerfumeSlice, type PerfumeState } from "./perfume.store";
import {
  createRecommendationSlice,
  type RecommendationState,
} from "./recommendation.store";
import { createDiarySlice, type DiaryState } from "./diary.store";
import { createMyPageSlice, type MyPageState } from "./mypage.store";

type PerfumeStateCompat = Omit<PerfumeState, "setSelectedPerfumeId"> & {
  setSelectedPerfumeId: (id: number | string | null) => void;
};

export type AppState = NavigationState &
  AuthState &
  UserState &
  PerfumeStateCompat &
  RecommendationState &
  DiaryState &
  MyPageState;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => {
      const perfumeSlice = createPerfumeSlice(...a);

      return {
        ...createNavigationSlice(...a),
        ...createAuthSlice(...a),
        ...createUserSlice(...a),
        ...perfumeSlice,
        setSelectedPerfumeId: (id: number | string | null) => {
          const normalizedId =
            id === null ? null : typeof id === "string" ? Number(id) : id;

          perfumeSlice.setSelectedPerfumeId(
            Number.isNaN(normalizedId) ? null : normalizedId,
          );
        },
        ...createRecommendationSlice(...a),
        ...createDiarySlice(...a),
        ...createMyPageSlice(...a),
      };
    },
    {
      name: "fragrance-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    },
  ),
);

export const useNavigationStore = () =>
  useAppStore(useShallow((s) => ({
    screen: s.screen,
    prevScreen: s.prevScreen,
    transitionType: s.transitionType,
    setScreen: s.setScreen,
    navigateTo: s.navigateTo,
    pushTo: s.pushTo,
    sheetTo: s.sheetTo,
    goBack: s.goBack,
  })));

export const useAuthStore = () =>
  useAppStore(useShallow((s) => ({
    hasOnboarded: s.hasOnboarded,
    isAuthenticated: s.isAuthenticated,
    accessToken: s.accessToken,
    signupDraft: s.signupDraft,
    isAuthReady: s.isAuthReady,
    isBootstrappingAuth: s.isBootstrappingAuth,
    setHasOnboarded: s.setHasOnboarded,
    setAuthenticated: s.setAuthenticated,
    clearAuthState: s.clearAuthState,
    setSignupDraft: s.setSignupDraft,
    clearSignupDraft: s.clearSignupDraft,
    bootstrapAuth: s.bootstrapAuth,
    login: s.login,
    signup: s.signup,
    logout: s.logout,
  })));

export const useUserStore = () =>
  useAppStore(useShallow((s) => ({
    profile: s.profile,
    updateProfile: s.updateProfile,
    fetchMe: s.fetchMe,
    updateMe: s.updateMe,
    deleteMe: s.deleteMe,
    resetProfile: s.resetProfile,
  })));

export const usePerfumeStore = () =>
  useAppStore(useShallow((s) => ({
    selectedPerfumeId: s.selectedPerfumeId,
    perfumeDetail: s.perfumeDetail,
    searchResults: s.searchResults,
    savedPerfumes: s.savedPerfumes,
    myCollection: s.myCollection,
    isLoading: s.isLoading,
    setSelectedPerfumeId: s.setSelectedPerfumeId,
    searchPerfumes: s.searchPerfumes,
    fetchPerfumeDetail: s.fetchPerfumeDetail,
    likePerfume: s.likePerfume,
    collectPerfume: s.collectPerfume,
    submitReview: s.submitReview,
    toggleSavedPerfume: s.toggleSavedPerfume,
    toggleMyCollection: s.toggleMyCollection,
  })));

export const useRecommendationStore = () =>
  useAppStore(useShallow((s) => ({
    textResult: s.textResult,
    imageResult: s.imageResult,
    isLoading: s.isLoading,
    error: s.error,
    selectedHistoryId: s.selectedHistoryId,
    isGiftMode: s.isGiftMode,
    setSelectedHistoryId: s.setSelectedHistoryId,
    setIsGiftMode: s.setIsGiftMode,
    recommendByText: s.recommendByText,
    recommendByImage: s.recommendByImage,
  })));

export const useDiaryStore = () =>
  useAppStore(useShallow((s) => ({
    diaryEntries: s.diaryEntries,
    tryDiaryEntries: s.tryDiaryEntries,
    diaryDetail: s.diaryDetail,
    tryDiaryDetail: s.tryDiaryDetail,
    selectedDiaryId: s.selectedDiaryId,
    selectedTryDiaryId: s.selectedTryDiaryId,
    isDiaryLoading: s.isDiaryLoading,
    diaryError: s.diaryError,
    fetchDiaries: s.fetchDiaries,
    fetchDiaryDetail: s.fetchDiaryDetail,
    createDiary: s.createDiary,
    fetchTryDiaries: s.fetchTryDiaries,
    fetchTryDiaryDetail: s.fetchTryDiaryDetail,
    createTryDiary: s.createTryDiary,
    setSelectedDiaryId: s.setSelectedDiaryId,
    setSelectedTryDiaryId: s.setSelectedTryDiaryId,
  })));

export const useMyPageStore = () =>
  useAppStore(useShallow((s) => ({
    likedPerfumes: s.likedPerfumes,
    likesPageInfo: s.likesPageInfo,
    myPerfumes: s.myPerfumes,
    myPerfumesPageInfo: s.myPerfumesPageInfo,
    myReviews: s.myReviews,
    myReviewsPageInfo: s.myReviewsPageInfo,
    recommendationHistory: s.recommendationHistory,
    recommendationHistoryPageInfo: s.recommendationHistoryPageInfo,
    selectedRecommendationDetail: s.selectedRecommendationDetail,
    loading: s.loading,
    error: s.error,
    fetchLikes: s.fetchLikes,
    removeLike: s.removeLike,
    fetchMyPerfumes: s.fetchMyPerfumes,
    removeMyPerfume: s.removeMyPerfume,
    fetchMyReviews: s.fetchMyReviews,
    fetchRecommendationHistory: s.fetchRecommendationHistory,
    fetchRecommendationDetail: s.fetchRecommendationDetail,
    clearSelectedRecommendationDetail: s.clearSelectedRecommendationDetail,
    resetMyPageState: s.resetMyPageState,
  })));
