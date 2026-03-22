package com.example.fragrance.recommend.service;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendHistoryListResponse;

public interface RecommendHistoryService {

	RecommendHistoryListResponse getHistoryList(Long memberId, int page, int size);

	RecommendHistoryDetailResponse getHistoryDetail(Long memberId, Long recommendResultId);
}