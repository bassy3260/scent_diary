import type {
  DeleteLikeResponse,
  DeleteMyPerfumeResponse,
  GetLikesResponse,
  GetMyPerfumeResponse,
  GetMyRecommendResponse,
  GetMyReviewResponse,
  GetRecommendDetailResponse,
  GetPreferenceRecommendResponse,
} from '../types/mypage.types';
import { apiClient } from './client';

function createPaginationQuery(page = 1, size = 10) {
  return `?page=${page}&size=${size}`;
}

export const myApi = {
  getLikes: (page = 1, size = 10) =>
    apiClient.get<GetLikesResponse>(`/api/v1/my/likes${createPaginationQuery(page, size)}`),

  deleteLike: (likesId: number) =>
    apiClient.delete<DeleteLikeResponse>(`/api/v1/my/likes/${likesId}`),

  getMyPerfumes: (page = 1, size = 10) =>
    apiClient.get<GetMyPerfumeResponse>(`/api/v1/my/perfume${createPaginationQuery(page, size)}`),

  deleteMyPerfume: (memberPerfumeId: number) =>
    apiClient.delete<DeleteMyPerfumeResponse>(`/api/v1/my/perfume/${memberPerfumeId}`),

  getMyReviews: (page = 1, size = 10) =>
    apiClient.get<GetMyReviewResponse>(`/api/v1/my/review${createPaginationQuery(page, size)}`),

  getMyRecommendations: (page = 1, size = 10) =>
    apiClient.get<GetMyRecommendResponse>(`/api/v1/my/recommend${createPaginationQuery(page, size)}`),

  getMyRecommendationDetail: (id: number) =>
    apiClient.get<GetRecommendDetailResponse>(`/api/v1/my/recommend/${id}`),

  getPreferenceRecommend: () =>
    apiClient.get<GetPreferenceRecommendResponse>('/api/v1/my/preference-recommend'),

  getPopularLikes: () =>
    apiClient.get<PopularPerfume[]>('/api/v1/my/likes/popular'),
};

export interface PopularPerfume {
  perfumeId: number;
  image: string;
  brand: string;
  name: string;
  price: number;
  accords: string[];
}
