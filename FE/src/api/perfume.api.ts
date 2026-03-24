/**
 * 향수 관련 API
 */

import type {
  LikeRequest,
  CollectRequest,
  ReviewRequest,
  GetPerfumeListResponse,
  GetPerfumeDetailResponse,
} from '../types/perfume.types';
import type { BaseResponse } from '../types/api.types';
import { apiClient } from './client';

export const perfumeApi = {
  /** 향수 검색 */
  search: (search: string) =>
    apiClient.get<GetPerfumeListResponse>(`/api/v1/perfume?search=${encodeURIComponent(search)}`),

  /** 향수 상세 조회 */
  getById: (perfumeId: number) =>
    apiClient.get<GetPerfumeDetailResponse>(`/api/v1/perfume/${perfumeId}`),

  /** 향수 좋아요 */
  like: (body: LikeRequest) =>
    apiClient.post<BaseResponse>('/api/v1/perfume/likes', body),

  /** 향수 수집 */
  collect: (body: CollectRequest) =>
    apiClient.post<BaseResponse>('/api/v1/perfume/collect', body),

  /** 향수 리뷰 작성 */
  writeReview: (body: ReviewRequest) =>
    apiClient.post<BaseResponse>('/api/v1/perfume/review', body),

  /** 내가 좋아요한 향수 목록 조회 */
  getMyLikes: () => apiClient.get<any>('/api/v1/my/likes?page=1&size=100'),

  /** 내가 소장한 향수 목록 조회 */
  getMyCollection: () => apiClient.get<any>('/api/v1/my/perfume?page=1&size=100'),
};
