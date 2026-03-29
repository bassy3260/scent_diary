import type { StateCreator } from 'zustand';
import type {
  DiaryListItem, DiaryDetailData,
  TryDiaryListItem, TryDiaryDetailData,
  DiaryCreateBody, TryDiaryCreateBody, PageParams,
} from '../types/diary.types';
import { diaryApi } from '../api/diary.api';

export interface DiaryPrefillPerfume {
  perfumeId: number;
  name: string;
  brand: string;
  image: string;
}

export interface DiaryState {
  diaryEntries: DiaryListItem[];
  tryDiaryEntries: TryDiaryListItem[];
  diaryDetail: DiaryDetailData | null;
  tryDiaryDetail: TryDiaryDetailData | null;
  selectedDiaryId: number | null;
  selectedTryDiaryId: number | null;
  isDiaryLoading: boolean;
  diaryError: string | null;
  diaryPrefill: DiaryPrefillPerfume | null;

  fetchDiaries: (params: PageParams) => Promise<void>;
  fetchDiaryDetail: (id: number) => Promise<void>;
  createDiary: (body: DiaryCreateBody) => Promise<void>;
  fetchTryDiaries: (params: PageParams) => Promise<void>;
  fetchTryDiaryDetail: (id: number) => Promise<void>;
  createTryDiary: (body: TryDiaryCreateBody) => Promise<void>;
  setSelectedDiaryId: (id: number | null) => void;
  setSelectedTryDiaryId: (id: number | null) => void;
  setDiaryPrefill: (prefill: DiaryPrefillPerfume | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDiarySlice: StateCreator<any, [], [], DiaryState> = (set) => ({
  diaryEntries: [],
  tryDiaryEntries: [],
  diaryDetail: null,
  tryDiaryDetail: null,
  selectedDiaryId: null,
  selectedTryDiaryId: null,
  isDiaryLoading: false,
  diaryError: null,
  diaryPrefill: null,

  setSelectedDiaryId: (id) => set({ selectedDiaryId: id }),
  setSelectedTryDiaryId: (id) => set({ selectedTryDiaryId: id }),
  setDiaryPrefill: (prefill) => set({ diaryPrefill: prefill }),

  fetchDiaries: async (params) => {
    set({ isDiaryLoading: true, diaryError: null });
    try {
      const res = await diaryApi.getEntries(params);
      set({ diaryEntries: res.content, isDiaryLoading: false });
    } catch {
      set({ diaryError: '일기 목록을 불러오지 못했습니다.', isDiaryLoading: false });
    }
  },

  fetchDiaryDetail: async (id) => {
    set({ isDiaryLoading: true, diaryDetail: null });
    try {
      const res = await diaryApi.getEntry(id);
      set({ diaryDetail: res, isDiaryLoading: false });
    } catch {
      set({ diaryError: '일기를 불러오지 못했습니다.', isDiaryLoading: false });
    }
  },

  createDiary: async (body) => {
    await diaryApi.createEntry(body);
    try {
      const res = await diaryApi.getEntries({ page: 1, size: 50 });
      set({ diaryEntries: res.content });
    } catch { /* 목록 갱신 실패는 무시 */ }
  },

  fetchTryDiaries: async (params) => {
    set({ isDiaryLoading: true, diaryError: null });
    try {
      const res = await diaryApi.getTryEntries(params);
      set({ tryDiaryEntries: res.content, isDiaryLoading: false });
    } catch {
      set({ diaryError: '시향 일기 목록을 불러오지 못했습니다.', isDiaryLoading: false });
    }
  },

  fetchTryDiaryDetail: async (id) => {
    set({ isDiaryLoading: true, tryDiaryDetail: null });
    try {
      const res = await diaryApi.getTryEntry(id);
      set({ tryDiaryDetail: res, isDiaryLoading: false });
    } catch {
      set({ diaryError: '시향 일기를 불러오지 못했습니다.', isDiaryLoading: false });
    }
  },

  createTryDiary: async (body) => {
    await diaryApi.createTryEntry(body);
    try {
      const res = await diaryApi.getTryEntries({ page: 1, size: 50 });
      set({ tryDiaryEntries: res.content });
    } catch { /* 목록 갱신 실패는 무시 */ }
  },
});
