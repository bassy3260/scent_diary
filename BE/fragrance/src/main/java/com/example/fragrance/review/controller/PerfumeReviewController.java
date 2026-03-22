package com.example.fragrance.review.controller;

import com.example.fragrance.review.dto.ReviewRequest;
import com.example.fragrance.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/perfume")
public class PerfumeReviewController {

	private final ReviewService reviewService;

	@PostMapping("/review")
	public ResponseEntity<Map<String, Object>> createReview(
			@RequestBody ReviewRequest requestDto,
			@AuthenticationPrincipal String loginId
	) {
		Long loginMemberId = Long.parseLong(loginId);
		requestDto.setMemberId(loginMemberId);

		reviewService.saveReview(requestDto);

		return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
				"status", 201,
				"message", "리뷰가 등록되었습니다."
		));
	}
}