import type { StateCreator } from 'zustand';
import type {
  RecommendTextRequest,
  RecommendImageRequest,
  RecommendTextData,
  RecommendImageData,
} from '../types/recommendation.types';
import { recommendationApi } from '../api/recommendation.api';

export interface RecommendationState {
  textResult: RecommendTextData | null;
  imageResult: RecommendImageData | null;
  isLoading: boolean;
  error: string | null;
  selectedHistoryId: string | null;
  isGiftMode: boolean;
  resultsMode: 'fresh' | 'history' | null;

  setSelectedHistoryId: (id: string | null) => void;
  setIsGiftMode: (v: boolean) => void;
  setResultsMode: (mode: 'fresh' | 'history' | null) => void;
  recommendByText: (body: RecommendTextRequest) => Promise<void>;
  recommendByImage: (body: RecommendImageRequest) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createRecommendationSlice: StateCreator<any, [], [], RecommendationState> = (set) => ({
  textResult: null,
  imageResult: null,
  isLoading: false,
  error: null,
  selectedHistoryId: null,
  isGiftMode: false,
  resultsMode: null,

  setSelectedHistoryId: (id) => set({ selectedHistoryId: id }),
  setIsGiftMode: (v) => set({ isGiftMode: v }),
  setResultsMode: (mode) => set({ resultsMode: mode }),

  recommendByText: async (body) => {
    set({ isLoading: true, error: null, imageResult: null });
    try {
      const res = await recommendationApi.recommendByText(body);
      set({ textResult: res, isLoading: false });
    } catch {
      set({ error: '텍스트 추천에 실패했습니다.', isLoading: false });
    }
  },

  recommendByImage: async (body) => {
    set({ isLoading: true, error: null, textResult: null });
    try {
      const res = await recommendationApi.recommendByImage(body);
      set({ imageResult: res, isLoading: false });
    } catch {
      set({ error: '이미지 추천에 실패했습니다.', isLoading: false });
    }
  },
});
