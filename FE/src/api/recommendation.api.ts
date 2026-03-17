/**
 * 향수 추천 관련 API
 *
 * 현재는 더미 데이터를 사용합니다.
 * API 연결 시 이 파일의 함수들을 실제 구현으로 교체하세요.
 */

import type { RecommendationHistory } from '../types/recommendation.types';
import { apiClient } from './client';

export const recommendationApi = {
  /** 텍스트 기반 향수 추천 */
  getByText: (prompt: string) =>
    apiClient.post<RecommendationHistory>('/api/v1/recommendations/text', { prompt }),

  /** 사진 기반 향수 추천 */
  getByPhoto: (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return apiClient.post<RecommendationHistory>('/api/v1/recommendations/photo', formData, {
      headers: {}, // Content-Type은 fetch가 multipart 자동 설정
    });
  },

  /** 추천 내역 목록 조회 */
  getHistory: () =>
    apiClient.get<RecommendationHistory[]>('/api/v1/recommendations/history'),
};
