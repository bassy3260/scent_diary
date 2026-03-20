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

  setSelectedHistoryId: (id: string | null) => void;
  setIsGiftMode: (v: boolean) => void;
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

  setSelectedHistoryId: (id) => set({ selectedHistoryId: id }),
  setIsGiftMode: (v) => set({ isGiftMode: v }),

  recommendByText: async (body) => {
    set({ isLoading: true, error: null });
    try {
      const res = await recommendationApi.recommendByText(body);
      set({ textResult: res.data, isLoading: false });
    } catch {
      set({ error: '텍스트 추천에 실패했습니다.', isLoading: false });
    }
  },

  recommendByImage: async (body) => {
    set({ isLoading: true, error: null });
    try {
      const res = await recommendationApi.recommendByImage(body);
      set({ imageResult: res.data, isLoading: false });
    } catch {
      set({ error: '이미지 추천에 실패했습니다.', isLoading: false });
    }
  },
});
