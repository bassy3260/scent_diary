export interface DiaryPageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// ── Request 타입 ──────────────────────────────────────────

/** 일기 작성 Request */
export interface DiaryCreateBody {
  title: string;
  content: string;
  perfumeId: number;
  imageNames?: string[];
  images?: string[];
}

/** 시향 일기 작성 Request */
export interface TryDiaryCreateBody {
  title: string;
  tryItems: TryItemRequest[];
}

export interface TryItemRequest {
  perfumeId: number;
  description: string;
  place: string;
  lasting: number;
  sillage: string;
  season: string;
}

/** 페이지네이션 공통 파라미터 */
export interface PageParams {
  page: number;
  size: number;
}

// ── 일기 응답 타입 ────────────────────────────────────────

export interface DiaryPerfumeSummary {
  perfumeId: number;
  perfumeImageUrl: string;
  perfumeName: string;
  brand: string;
}

export interface DiaryListItem {
  diaryId: number;
  title: string;
  createTime: string;
  detail: string;
  perfume: DiaryPerfumeSummary;
}

export interface DiaryListData {
  content: DiaryListItem[];
  pageInfo: DiaryPageInfo;
}

export interface DiaryImage {
  diaryImageUrl: string;
}

export interface DiaryDetailData {
  diaryId: number;
  title: string;
  createTime: string;
  detail: string;
  diaryImage: DiaryImage[];
  perfume: DiaryPerfumeSummary;
}

export interface CreateDiaryData {
  diaryId: number;
}

export type GetDiaryListResponse = DiaryListData;
export type GetDiaryDetailResponse = DiaryDetailData;
export type CreateDiaryResponse = CreateDiaryData;

// ── 시향 일기 응답 타입 ───────────────────────────────────

export interface TryDiaryListItem {
  tryDiaryId: number;
  title: string;
  createTime: string;
  thumbnail: string;
  perfumeName: string;
  brand: string;
}

export interface TryDiaryListData {
  content: TryDiaryListItem[];
  pageInfo: DiaryPageInfo;
}

export interface TryItem {
  perfumeId: number;
  perfumeImageUrl: string;
  perfumeName: string;
  brand: string;
  description: string;
  place: string;
  lasting: number;
  sillage: string;
  season: string;
}

export interface TryDiaryDetailData {
  tryDiaryId: number;
  title: string;
  createTime: string;
  tryItem: TryItem[];
}

export type GetTryDiaryListResponse = TryDiaryListData;
export type GetTryDiaryDetailResponse = TryDiaryDetailData;
export interface CreateTryDiaryData {
  tryDiaryId: number;
}
export type CreateTryDiaryResponse = CreateTryDiaryData;

// ── 캔버스 UI 타입 (DiaryCanvas 전용) ─────────────────────

export interface CanvasElement {
  id: string;
  type: "photo" | "perfume" | "text" | "sticker" | "date-label" | "tag";
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
  type: "diary";
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
  type: "tasting";
  date: string;
  perfumeId?: string;
  situation: string;
  firstImpression: string;
  laterImpression: string;
  longevity: number; // 1–5
  sillage: number; // 1–5
  seasons: string[];
  moods: string[];
  note: string;
  tags: string[];
  photoUrl?: string;
}

export type TastingLog = TastingLogEntry;
export type AnyDiaryEntry = DiaryEntry | TastingLogEntry;
