/**
 * 향수 관련 API
 *
 * 현재는 더미 데이터(src/constants/perfumes.ts)를 사용합니다.
 * API 연결 시 이 파일의 함수들을 실제 구현으로 교체하세요.
 *
 * 사용 예:
 *   const perfumes = await perfumeApi.getList();
 *   const detail = await perfumeApi.getById('1');
 */

import type { Perfume } from '../types/perfume.types';
import { apiClient } from './client';

export const perfumeApi = {
  /** 향수 목록 조회 */
  getList: () =>
    apiClient.get<Perfume[]>('/api/v1/perfumes'),

  /** 향수 상세 조회 */
  getById: (id: string) =>
    apiClient.get<Perfume>(`/api/v1/perfumes/${id}`),

  /** 향수 검색 */
  search: (query: string) =>
    apiClient.get<Perfume[]>(`/api/v1/perfumes/search?q=${encodeURIComponent(query)}`),
};
