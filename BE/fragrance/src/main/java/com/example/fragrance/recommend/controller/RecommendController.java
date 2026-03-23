package com.example.fragrance.recommend.controller;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;

import com.example.fragrance.recommend.dto.RecommendTextRequest;
import com.example.fragrance.recommend.service.RecommendService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController // @Controller + @RequestBody.
@RequestMapping("/api/v1/recommend")
public class RecommendController {

    private final RecommendService recommendService;

    // ResponseEntity: Http응답 전체(상태코드+ 헤더 +바디)를 제어, ResponseEntity.ok()는 200 응답
    @PostMapping("/text")
    public ResponseEntity<ApiResponse<RecommendHistoryDetailResponse>> getTextRecommendList(
        @AuthenticationPrincipal String loginId,
        @RequestBody RecommendTextRequest request) {
        Long memberId = Long.parseLong(loginId);
        RecommendHistoryDetailResponse data = recommendService.getTextRecommendResponse(memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("텍스트 추천 성공",data));
    }
}
