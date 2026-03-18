package com.example.fragrance.review.service;

import com.example.fragrance.review.dto.ReviewListResponse;
import com.example.fragrance.review.dto.ReviewRequest;

public interface ReviewService {
	ReviewListResponse getReviewsByMemberId(Long memberId, int page, int size);
	void saveReview(ReviewRequest requestDto);
}
