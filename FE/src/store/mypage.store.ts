import type { StateCreator } from "zustand";
import { myApi } from "../api";
import type {
  LikeItem,
  MyPerfumeItem,
  PageInfo,
  RecommendDetailData,
  RecommendItem,
  ReviewItem,
} from "../types/mypage.types";

let activeMyPageRequests = 0;

function getPageInfo(data: PageInfo): PageInfo {
  return {
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
  };
}

function decrementPageInfo(pageInfo: PageInfo | null): PageInfo | null {
  if (!pageInfo) {
    return null;
  }

  const totalElements = Math.max(0, pageInfo.totalElements - 1);
  const totalPages =
    pageInfo.size > 0
      ? Math.ceil(totalElements / pageInfo.size)
      : pageInfo.totalPages;

  return {
    ...pageInfo,
    totalElements,
    totalPages,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "마이페이지 데이터를 불러오지 못했어요.";
}

export interface MyPageState {
  likedPerfumes: LikeItem[];
  likesPageInfo: PageInfo | null;
  myPerfumes: MyPerfumeItem[];
  myPerfumesPageInfo: PageInfo | null;
  myReviews: ReviewItem[];
  myReviewsPageInfo: PageInfo | null;
  recommendationHistory: RecommendItem[];
  recommendationHistoryPageInfo: PageInfo | null;
  selectedRecommendationDetail: RecommendDetailData | null;
  selectedRecommendationDetailId: number | null;
  recommendationHistoryCurrentPage: number;
  loading: boolean;
  error: string | null;

  setRecommendationHistoryCurrentPage: (page: number) => void;
  fetchLikes: (page?: number, size?: number) => Promise<void>;
  removeLike: (likesId: number) => Promise<void>;
  fetchMyPerfumes: (page?: number, size?: number) => Promise<void>;
  removeMyPerfume: (memberPerfumeId: number) => Promise<void>;
  fetchMyReviews: (page?: number, size?: number) => Promise<void>;
  fetchRecommendationHistory: (page?: number, size?: number) => Promise<void>;
  fetchRecommendationDetail: (id: number) => Promise<void>;
  clearSelectedRecommendationDetail: () => void;
  resetMyPageState: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMyPageSlice: StateCreator<any, [], [], MyPageState> = (
  set,
) => {
  const beginRequest = () => {
    activeMyPageRequests += 1;
    set({ loading: true, error: null });
  };

  const endRequest = () => {
    activeMyPageRequests = Math.max(0, activeMyPageRequests - 1);
    set({ loading: activeMyPageRequests > 0 });
  };

  const runRequest = async <T>(task: () => Promise<T>) => {
    beginRequest();

    try {
      return await task();
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      endRequest();
    }
  };

  return {
    likedPerfumes: [],
    likesPageInfo: null,
    myPerfumes: [],
    myPerfumesPageInfo: null,
    myReviews: [],
    myReviewsPageInfo: null,
    recommendationHistory: [],
    recommendationHistoryPageInfo: null,
    selectedRecommendationDetail: null,
    selectedRecommendationDetailId: null,
    recommendationHistoryCurrentPage: 1,
    loading: false,
    error: null,

    setRecommendationHistoryCurrentPage: (page) => set({ recommendationHistoryCurrentPage: page }),

    fetchLikes: async (page = 1, size = 10) => {
      await runRequest(async () => {
        const response = await myApi.getLikes(page, size);

        set({
          likedPerfumes: response.perfumes,
          likesPageInfo: getPageInfo(response),
          savedPerfumes: response.perfumes.map((item) =>
            String(item.perfumeId),
          ),
        });
      });
    },

    removeLike: async (likesId: number) => {
      await runRequest(async () => {
        await myApi.deleteLike(likesId);

        set((state: MyPageState) => {
          const nextLikedPerfumes = state.likedPerfumes.filter(
            (item) => item.likesId !== likesId,
          );

          return {
            likedPerfumes: nextLikedPerfumes,
            likesPageInfo: decrementPageInfo(state.likesPageInfo),
            savedPerfumes: nextLikedPerfumes.map((item) =>
              String(item.perfumeId),
            ),
          };
        });
      });
    },

    fetchMyPerfumes: async (page = 1, size = 10) => {
      await runRequest(async () => {
        const response = await myApi.getMyPerfumes(page, size);

        set({
          myPerfumes: response.perfumes,
          myPerfumesPageInfo: getPageInfo(response),
          myCollection: response.perfumes.map((item) => String(item.perfumeId)),
        });
      });
    },

    removeMyPerfume: async (memberPerfumeId: number) => {
      await runRequest(async () => {
        await myApi.deleteMyPerfume(memberPerfumeId);

        set((state: MyPageState) => {
          const nextPerfumes = state.myPerfumes.filter(
            (item) => item.memberPerfumeId !== memberPerfumeId,
          );

          return {
            myPerfumes: nextPerfumes,
            myPerfumesPageInfo: decrementPageInfo(state.myPerfumesPageInfo),
            myCollection: nextPerfumes.map((item) => String(item.perfumeId)),
          };
        });
      });
    },

    fetchMyReviews: async (page = 1, size = 10) => {
      await runRequest(async () => {
        const response = await myApi.getMyReviews(page, size);

        set({
          myReviews: response.reviews,
          myReviewsPageInfo: getPageInfo(response),
        });
      });
    },

    fetchRecommendationHistory: async (page = 1, size = 10) => {
      await runRequest(async () => {
        const response = await myApi.getMyRecommendations(page, size);

        set({
          recommendationHistory: response.recommendations,
          recommendationHistoryPageInfo: getPageInfo(response),
        });
      });
    },

    fetchRecommendationDetail: async (id: number) => {
      await runRequest(async () => {
        const response = await myApi.getMyRecommendationDetail(id);

        set({
          selectedRecommendationDetail: response,
          selectedRecommendationDetailId: id,
        });
      });
    },

    clearSelectedRecommendationDetail: () =>
      set({
        selectedRecommendationDetail: null,
        selectedRecommendationDetailId: null,
      }),

    resetMyPageState: () => {
      activeMyPageRequests = 0;

      set({
        likedPerfumes: [],
        likesPageInfo: null,
        myPerfumes: [],
        myPerfumesPageInfo: null,
        myReviews: [],
        myReviewsPageInfo: null,
        recommendationHistory: [],
        recommendationHistoryPageInfo: null,
        selectedRecommendationDetail: null,
        selectedRecommendationDetailId: null,
        recommendationHistoryCurrentPage: 1,
        loading: false,
        error: null,
        savedPerfumes: [],
        myCollection: [],
        selectedHistoryId: null,
      });
    },
  };
};
