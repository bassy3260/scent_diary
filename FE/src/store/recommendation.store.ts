import type { StateCreator } from 'zustand';
import type { RecommendationHistory } from '../types/recommendation.types';

export interface RecommendationState {
  recommendationHistory: RecommendationHistory[];
  selectedHistoryId: string | null;
  isGiftMode: boolean;

  setSelectedHistoryId: (id: string | null) => void;
  setIsGiftMode: (v: boolean) => void;
  addRecommendationHistory: (rec: RecommendationHistory) => void;
  deleteRecommendationHistory: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createRecommendationSlice: StateCreator<any, [], [], RecommendationState> = (set) => ({
  recommendationHistory: [],
  selectedHistoryId: null,
  isGiftMode: false,

  setSelectedHistoryId: (id: string | null) => set({ selectedHistoryId: id }),
  setIsGiftMode: (v: boolean) => set({ isGiftMode: v }),
  addRecommendationHistory: (rec: RecommendationHistory) =>
    set((s: RecommendationState) => ({
      recommendationHistory: [rec, ...s.recommendationHistory],
    })),
  deleteRecommendationHistory: (id: string) =>
    set((s: RecommendationState) => ({
      recommendationHistory: s.recommendationHistory.filter((r) => r.id !== id),
    })),
});
