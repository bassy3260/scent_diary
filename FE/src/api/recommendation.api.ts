/**
 * 향수 추천 관련 API
 */

import type {
  RecommendTextRequest,
  RecommendImageRequest,
  RecommendTextResponse,
  RecommendImageResponse,
} from '../types/recommendation.types';
import { apiClient } from './client';

export const recommendationApi = {
  /** 텍스트 기반 향수 추천 */
  recommendByText: (params: RecommendTextRequest) =>
    apiClient.post<RecommendTextResponse>('/api/v1/recommend/text', {
      keyword: params.keyword,
      price: params.price,
      note: params.note,
    }),

  /** 이미지 기반 향수 추천 */
  recommendByImage: (body: RecommendImageRequest) =>
    apiClient.post<RecommendImageResponse>('/api/v1/recommend/image', body),
};
