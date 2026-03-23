import type { StateCreator } from 'zustand';
import type { PerfumeListItem, PerfumeDetail } from '../types/perfume.types';
import { perfumeApi } from '../api/perfume.api';

export interface PerfumeState {
  selectedPerfumeId: number | null;
  perfumeDetail: PerfumeDetail | null;
  searchResults: PerfumeListItem[];
  savedPerfumes: number[];
  myCollection: number[];
  isLoading: boolean;
  error: string | null;

  setSelectedPerfumeId: (id: number | null) => void;
  searchPerfumes: (query: string) => Promise<void>;
  fetchPerfumeDetail: (id: number) => Promise<void>;
  likePerfume: (id: number) => Promise<void>;
  collectPerfume: (id: number) => Promise<void>;
  submitReview: (perfumeId: number, rating: number, content: string) => Promise<void>;
  toggleSavedPerfume: (id: number) => Promise<void>;
  toggleMyCollection: (id: number) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPerfumeSlice: StateCreator<any, [], [], PerfumeState> = (set, get) => ({
  selectedPerfumeId: null,
  perfumeDetail: null,
  searchResults: [],
  savedPerfumes: [],
  myCollection: [],
  isLoading: false,
  error: null,

  setSelectedPerfumeId: (id) => set({ selectedPerfumeId: id }),

  searchPerfumes: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const res = await perfumeApi.search(query);
      set({ searchResults: res.perfumes, isLoading: false });
    } catch {
      set({ error: '검색에 실패했습니다.', isLoading: false });
    }
  },

  fetchPerfumeDetail: async (id) => {
    set({ isLoading: true, error: null, perfumeDetail: null });
    try {
      const res = await perfumeApi.getById(id);
      set({ perfumeDetail: res, isLoading: false });
    } catch {
      set({ error: '향수 정보를 불러오지 못했습니다.', isLoading: false });
    }
  },

  likePerfume: async (id) => {
    try {
      await perfumeApi.like({ perfume_id: id });
      set((s: PerfumeState) => ({
        savedPerfumes: s.savedPerfumes.includes(id)
          ? s.savedPerfumes.filter((p) => p !== id)
          : [...s.savedPerfumes, id],
      }));
    } catch {
      // 실패 시 상태 변경 없음
    }
  },

  collectPerfume: async (id) => {
    try {
      await perfumeApi.collect({ perfume_id: id });
      set((s: PerfumeState) => ({
        myCollection: s.myCollection.includes(id)
          ? s.myCollection.filter((p) => p !== id)
          : [...s.myCollection, id],
      }));
    } catch {
      // 실패 시 상태 변경 없음
    }
  },

  submitReview: async (perfumeId, rating, content) => {
    await perfumeApi.writeReview({ perfumeId, rating, content });
    await get().fetchPerfumeDetail(perfumeId);
  },

  toggleSavedPerfume: async (id) => {
    await get().likePerfume(id);
  },

  toggleMyCollection: async (id) => {
    await get().collectPerfume(id);
  },
});
