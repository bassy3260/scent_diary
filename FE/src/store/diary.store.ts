import type { StateCreator } from 'zustand';
import type { DiaryEntry, TastingLogEntry } from '../types/diary.types';

export interface DiaryState {
  diaryEntries: DiaryEntry[];
  tastingLogs: TastingLogEntry[];
  selectedDiaryId: string | null;

  setSelectedDiaryId: (id: string | null) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  updateDiaryEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  addTastingLog: (entry: TastingLogEntry) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDiarySlice: StateCreator<any, [], [], DiaryState> = (set) => ({
  diaryEntries: [],
  tastingLogs: [],
  selectedDiaryId: null,

  setSelectedDiaryId: (id: string | null) => set({ selectedDiaryId: id }),
  addDiaryEntry: (entry: DiaryEntry) =>
    set((s: DiaryState) => ({ diaryEntries: [entry, ...s.diaryEntries] })),
  updateDiaryEntry: (id: string, updates: Partial<DiaryEntry>) =>
    set((s: DiaryState) => ({
      diaryEntries: s.diaryEntries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  addTastingLog: (entry: TastingLogEntry) =>
    set((s: DiaryState) => ({ tastingLogs: [entry, ...s.tastingLogs] })),
});
