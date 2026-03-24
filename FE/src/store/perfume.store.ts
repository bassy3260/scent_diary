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

  initUserActivity: () => Promise<void>;
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

  setSelectedPerfumeId: (id) => set((state: any) => ({ ...state, selectedPerfumeId: id })),

  searchPerfumes: async (query) => {
    set((state: any) => ({ ...state, isLoading: true, error: null }));
    try {
      const res = await perfumeApi.search(query);
      const normalized = res.perfumes.map(p => ({ ...p, perfumeId: Number(p.perfumeId ?? p.id) }));
      set((state: any) => ({ ...state, searchResults: normalized, isLoading: false }));
    } catch {
      set({ error: '검색에 실패했습니다.', isLoading: false });
    }
  },

  fetchPerfumeDetail: async (id) => {
    set((state: any) => ({ ...state, error: null, perfumeDetail: null }));
    try {
      const res = await perfumeApi.getById(id);
      set((state: any) => ({ ...state, perfumeDetail: res }));
    } catch {
      set((state: any) => ({ ...state, error: '향수 정보를 불러오지 못했습니다.' }));
    }
  },

  likePerfume: async (id) => {
    try {
      await perfumeApi.like({ perfume_id: id });
      set((s: PerfumeState) => ({
          ...s,
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
          ...s,
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

  initUserActivity: async () => {
    try {
      const [saved, collected] = await Promise.all([
        perfumeApi.getMyLikes(),
        perfumeApi.getMyCollection()
      ]);

      const likedIds = saved?.perfumes?.map((p: any) => p.id || p.perfumeId || p.perfume_id) || [];
      const collectedIds = collected?.perfumes?.map((p: any) => p.id || p.perfumeId || p.perfume_id) || [];

      set((state: any) => ({
        ...state,
        savedPerfumes: likedIds,
        myCollection: collectedIds,
      }));
    } catch (e) {
      console.error("유저 활동 내역 로드 실패", e);
    }
  },
});
