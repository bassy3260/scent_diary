/**
 * 다이어리 / 테이스팅 로그 관련 API
 *
 * 현재는 로컬 상태(Zustand diary.store)로만 관리합니다.
 * API 연결 시 이 파일의 함수들을 실제 구현으로 교체하세요.
 */

import type { DiaryEntry, TastingLog } from '../types/diary.types';
import { apiClient } from './client';

export const diaryApi = {
  /** 다이어리 목록 조회 */
  getEntries: () =>
    apiClient.get<DiaryEntry[]>('/api/v1/diary'),

  /** 다이어리 작성 */
  createEntry: (body: Omit<DiaryEntry, 'id'>) =>
    apiClient.post<DiaryEntry>('/api/v1/diary', body),

  /** 다이어리 수정 */
  updateEntry: (id: string, body: Partial<DiaryEntry>) =>
    apiClient.patch<DiaryEntry>(`/api/v1/diary/${id}`, body),

  /** 다이어리 삭제 */
  deleteEntry: (id: string) =>
    apiClient.delete<void>(`/api/v1/diary/${id}`),

  /** 테이스팅 로그 작성 */
  createTastingLog: (body: Omit<TastingLog, 'id'>) =>
    apiClient.post<TastingLog>('/api/v1/diary/tasting', body),
};
