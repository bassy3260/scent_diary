package com.example.fragrance.recommend.service;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendImageRequest;
import com.example.fragrance.recommend.dto.RecommendTextRequest;
import com.example.fragrance.recommend.entity.RecommendResult;


public interface RecommendService {
    // 텍스트 추천
    RecommendHistoryDetailResponse getTextRecommendResponse(Long memberId, RecommendTextRequest request);

    // 이미지 추천
    RecommendHistoryDetailResponse getImageRecommedResponse(Long memberId, RecommendImageRequest request);
}
