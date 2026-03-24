import type { PageInfo } from './mypage.types';

// ── Request 타입 ──────────────────────────────────────────
export interface LikeRequest {
  perfume_id: number;
}

export interface CollectRequest {
  perfume_id: number;
}

export interface ReviewRequest {
  perfumeId: number;
  rating: number;
  content: string;
}

// ── 도메인 타입 (API 응답) ────────────────────────────────
export interface PerfumeNotes {
  top: string[];
  middle: string[];
  base: string[];
  single: string[];
}

export interface PerfumeReview {
  nickname: string;
  content: string;
  rating: number;
  createdAt: string;
}

/** 향수 검색 목록 아이템 */
export interface PerfumeListItem {
  perfumeId: number;
  id: number;
  image: string;
  brand: string;
  name: string;
  price: number;
  accords: string[];
}

export interface PerfumeListData extends PageInfo {
  perfumes: PerfumeListItem[];
}

/** 향수 상세 */
export interface PerfumeDetail {
  image: string;
  brand: string;
  name: string;
  price: number;
  accords: string[];
  notes: PerfumeNotes;
  reviews: PerfumeReview[];
  isLiked?: boolean;
  isCollected?: boolean;
  description?: string | null;
}

// ── 응답 타입 ─────────────────────────────────────────────
export type GetPerfumeListResponse = PerfumeListData;
export type GetPerfumeDetailResponse = PerfumeDetail;
export type CollectPerfumeResponse = void;
export type PostPerfumeReviewResponse = void;

// ── 프론트엔드 목업 타입 ──────────────────────────────────
interface PerfumeNote {
  name: string;
  description: string;
}

interface PerfumeMockAccord {
  name: string;
  percentage: number;
  color: string;
}

interface PerfumeMockReview {
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

/** 목업 데이터용 향수 타입 */
export interface Perfume {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: string;
  family: string;
  familyColor: string;
  score: number;
  reason: string;
  story: string;
  seasonFit: string[];
  tpoFit: string[];
  warmCool: number;
  softBold: number;
  longevity: number;
  sillage: number;
  topNotes: PerfumeNote[];
  middleNotes: PerfumeNote[];
  baseNotes: PerfumeNote[];
  accords: PerfumeMockAccord[];
  tags: string[];
  reviews: PerfumeMockReview[];
}
