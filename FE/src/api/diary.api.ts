/**
 * 일기 / 시향 일기 관련 API
 */

import type {
  DiaryCreateBody, TryDiaryCreateBody, PageParams,
  GetDiaryListResponse, GetDiaryDetailResponse, CreateDiaryResponse,
  GetTryDiaryListResponse, GetTryDiaryDetailResponse, CreateTryDiaryResponse,
} from '../types/diary.types';
import { apiClient } from './client';

export interface RefineContentRequest {
  content: string;
  perfumeName: string;
  perfumeBrand: string;
}

export interface RefineContentResponse {
  content: string;
}

export const diaryApi = {
  // ── 일기 ────────────────────────────────────────────────

  /** 일기 목록 조회 */
  getEntries: ({ page, size }: PageParams) =>
    apiClient.get<GetDiaryListResponse>(`/api/v1/diaries?page=${page}&size=${size}`),

  /** 일기 상세 조회 */
  getEntry: (diaryId: number) =>
    apiClient.get<GetDiaryDetailResponse>(`/api/v1/diaries/${diaryId}`),

  /** 일기 작성 - 이미지는 S3에 업로드 후 파일명만 전달 */
  createEntry: (body: DiaryCreateBody, _images?: File[]) =>
    apiClient.post<CreateDiaryResponse>('/api/v1/diaries', body),

  // ── 시향 일기 ────────────────────────────────────────────

  /** 시향 일기 목록 조회 */
  getTryEntries: ({ page, size }: PageParams) =>
    apiClient.get<GetTryDiaryListResponse>(`/api/v1/try-diary?page=${page}&size=${size}`),

  /** 시향 일기 상세 조회 */
  getTryEntry: (tryDiaryId: number) =>
    apiClient.get<GetTryDiaryDetailResponse>(`/api/v1/try-diary/${tryDiaryId}`),

  /** 시향 일기 작성 */
  createTryEntry: (body: TryDiaryCreateBody) =>
    apiClient.post<CreateTryDiaryResponse>('/api/v1/try-diary', body),

  /** AI 일기 내용 다듬기 */
  refineContent: (body: RefineContentRequest) =>
    apiClient.post<RefineContentResponse>('/api/v1/diaries/refine', body),
};
