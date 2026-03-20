import type { DataResponse } from './api.types';

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
  money: number;
  age: string;
  note: string;
}

/** 이미지 기반 향수 추천 Request */
export interface RecommendImageRequest {
  image_route: string;
}

// ── Response 타입 ─────────────────────────────────────────

export interface RecommendTextInput {
  age: string;
  keyword: string;
}

export interface RecommendTextData {
  createTime: string;
  input: RecommendTextInput;
  results: RecommendResult[];
}

export type RecommendTextResponse = DataResponse<RecommendTextData>;

export interface RecommendImageInput {
  image: string;
}

export interface RecommendImageData {
  createTime: string;
  input: RecommendImageInput;
  results: RecommendResult[];
}

export type RecommendImageResponse = DataResponse<RecommendImageData>;
