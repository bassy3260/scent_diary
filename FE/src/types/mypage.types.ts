export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PerfumeItem {
  perfumeId: number;
  image: string;
  brand: string;
  name: string;
  accords: string[];
}

export interface LikeItem extends PerfumeItem {
  likesId: number;
}

export interface LikesData extends PageInfo {
  perfumes: LikeItem[];
}

export type GetLikesResponse = LikesData;
export type DeleteLikeResponse = void;

export interface MyPerfumeItem extends PerfumeItem {
  memberPerfumeId: number;
}

export interface MyPerfumeData extends PageInfo {
  perfumes: MyPerfumeItem[];
}

export type GetMyPerfumeResponse = MyPerfumeData;
export type DeleteMyPerfumeResponse = void;

export interface ReviewPerfume {
  perfumeId: number;
  perfumeName: string;
  brand: string;
  image: string;
}

export interface ReviewItem {
  reviewId: number;
  perfume: ReviewPerfume;
  detail: string;
  rating: string;
  createTime: string;
}

export interface ReviewData extends PageInfo {
  reviews: ReviewItem[];
}

export type GetMyReviewResponse = ReviewData;

export interface RecommendInput {
  age?: number;
  price?: number;
  gender?: string;
  keyword?: string | null;
  keywords?: string[];
  text?: string | null;
  image?: string | null;
}

export interface RecommendResultSummary {
  image: string;
  brand: string;
  name: string;
}

export interface RecommendItem {
  recommendResultId: number;
  createTime: string;
  input: RecommendInput;
  results: RecommendResultSummary[];
}

export interface RecommendData extends PageInfo {
  recommendations: RecommendItem[];
}

export type GetMyRecommendResponse = RecommendData;

export interface RecommendDetailNotes {
  top: string[];
  middle: string[];
  base: string[];
}

export interface RecommendDetailResult {
  perfumeId: number;
  image: string;
  brand: string;
  name: string;
  accords: string[];
  notes: RecommendDetailNotes;
  reason: string;
}

export interface RecommendDetailInput {
  age?: number;
  keyword?: string | null;
  keywords?: string[];
  text?: string | null;
  image?: string | null;
}

export interface RecommendDetailData {
  createTime: string;
  input: RecommendDetailInput;
  results: RecommendDetailResult[];
}

export type GetRecommendDetailResponse = RecommendDetailData;

export interface PreferenceRecommendItem {
  perfume_id: number;
  perfume_name: string;
  image_route: string;
  accords: string[];
}

export type GetPreferenceRecommendResponse = PreferenceRecommendItem[];
