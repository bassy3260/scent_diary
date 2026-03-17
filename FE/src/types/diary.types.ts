export interface CanvasElement {
  id: string;
  type: 'photo' | 'perfume' | 'text' | 'sticker' | 'date-label' | 'tag';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  content: string;
  label?: string;
}

export interface DiaryEntry {
  id: string;
  type: 'diary';
  date: string;
  perfumeId?: string;
  mood: string;
  moodEmoji: string;
  weather: string;
  weatherEmoji: string;
  note: string;
  tags: string[];
  photoUrl?: string;
  canvasElements?: CanvasElement[];
  canvasBg?: string;
}

export interface TastingLogEntry {
  id: string;
  type: 'tasting';
  date: string;
  perfumeId?: string;
  situation: string;
  firstImpression: string;
  laterImpression: string;
  longevity: number; // 1–5
  sillage: number;   // 1–5
  seasons: string[];
  moods: string[];
  note: string;
  tags: string[];
  photoUrl?: string;
}

export type AnyDiaryEntry = DiaryEntry | TastingLogEntry;
