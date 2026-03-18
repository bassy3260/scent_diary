package com.example.fragrance.review.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.fragrance.review.dto.ReviewListResponse;
import com.example.fragrance.review.service.ReviewService;
import com.example.fragrance.util.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class ReviewController {

	private final ReviewService reviewService;

	// GET /api/v1/my/reviews?page=1&size=10
	@GetMapping("/reviews")
	public ResponseEntity<ApiResponse<ReviewListResponse>> getReviews(
		@AuthenticationPrincipal String loginId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		Long memberId = Long.parseLong(loginId);
		ReviewListResponse data = reviewService.getReviewsByMemberId(memberId, page - 1, size);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}
}