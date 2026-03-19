package com.example.fragrance.recommend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendHistoryListResponse;
import com.example.fragrance.recommend.service.RecommendHistoryService;
import com.example.fragrance.util.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class RecommendHistoryController {

	private final RecommendHistoryService recommendHistoryService;

	// GET /api/v1/my/recommend?page=1&size=10
	@GetMapping("/recommend")
	public ResponseEntity<ApiResponse<RecommendHistoryListResponse>> getHistoryList(
		@AuthenticationPrincipal String loginId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		Long memberId = Long.parseLong(loginId);
		RecommendHistoryListResponse data = recommendHistoryService.getHistoryList(memberId, page - 1, size);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}

	// GET /api/v1/my/recommend/{recommendResultId}
	@GetMapping("/recommend/{recommendResultId}")
	public ResponseEntity<ApiResponse<RecommendHistoryDetailResponse>> getHistoryDetail(
		@AuthenticationPrincipal String loginId,
		@PathVariable Long recommendResultId
	) {
		Long memberId = Long.parseLong(loginId);
		RecommendHistoryDetailResponse data = recommendHistoryService.getHistoryDetail(memberId, recommendResultId);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}
}