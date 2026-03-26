// ── 공유 도메인 타입 ──────────────────────────────────────

export interface RecommendNotes {
  top: string[];
  middle: string[];
  base: string[];
  single: string[];
}

export interface RecommendResult {
  perfumeId: number;
  image: string;
  brand: string;
  name: string;
  accords: string[];
  notes: RecommendNotes;
  reason: string;
}

// ── Request 타입 ──────────────────────────────────────────

/** 텍스트 기반 향수 추천 Request */
export interface RecommendTextRequest {
  keyword: string;
  price: number;
  note: string;   // "TOP" | "MIDDLE" | "BASE"
}

/** 이미지 기반 향수 추천 Request */
export interface RecommendImageRequest {
  image_route: string;
  price: number;
  note: string;   // "TOP" | "MIDDLE" | "BASE"
}

// ── Response 타입 ─────────────────────────────────────────

export interface RecommendTextInput {
  age: number | null;
  keyword: string;
  image: string | null;
}

export interface RecommendTextData {
  recommendResultId: number;
  createTime: string | null;
  input: RecommendTextInput;
  results: RecommendResult[];
}

export type RecommendTextResponse = RecommendTextData;

export interface RecommendImageInput {
  image: string;
}

export interface RecommendImageData {
  recommendResultId: number;
  createTime: string;
  input: RecommendImageInput;
  results: RecommendResult[];
}

export type RecommendImageResponse = RecommendImageData;
