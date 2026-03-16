package com.example.fragrance.review.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.fragrance.review.dto.ReviewDto;
import com.example.fragrance.review.dto.ReviewListResponse;
import com.example.fragrance.review.mapper.ReviewMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

	private final ReviewMapper reviewMapper;

	@Override
	public ReviewListResponse getReviewsByMemberId(Long memberId, int page, int size) {
		int offset = page * size;
		List<ReviewDto> reviews = reviewMapper.findReviewsByMemberId(memberId, offset, size);
		long totalElements = reviewMapper.countReviewsByMemberId(memberId);
		int totalPages = (int) Math.ceil((double) totalElements / size);
		return new ReviewListResponse(reviews, page, size, totalElements, totalPages);
	}
}