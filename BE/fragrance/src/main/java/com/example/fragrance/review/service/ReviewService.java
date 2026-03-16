package com.example.fragrance.review.service;

import com.example.fragrance.review.dto.ReviewListResponse;

public interface ReviewService {
	ReviewListResponse getReviewsByMemberId(Long memberId, int page, int size);
}
