import type { StateCreator } from 'zustand';

export interface PerfumeState {
  selectedPerfumeId: string | null;
  savedPerfumes: string[];
  myCollection: string[];

  setSelectedPerfumeId: (id: string | null) => void;
  toggleSavedPerfume: (id: string) => void;
  toggleMyCollection: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPerfumeSlice: StateCreator<any, [], [], PerfumeState> = (set) => ({
  selectedPerfumeId: null,
  savedPerfumes: [],
  myCollection: [],

  setSelectedPerfumeId: (id: string | null) => set({ selectedPerfumeId: id }),
  toggleSavedPerfume: (id: string) =>
    set((s: PerfumeState) => ({
      savedPerfumes: s.savedPerfumes.includes(id)
        ? s.savedPerfumes.filter((p) => p !== id)
        : [...s.savedPerfumes, id],
    })),
  toggleMyCollection: (id: string) =>
    set((s: PerfumeState) => ({
      myCollection: s.myCollection.includes(id)
        ? s.myCollection.filter((p) => p !== id)
        : [...s.myCollection, id],
    })),
});
