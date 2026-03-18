package com.example.fragrance.review.service;

import java.util.List;

import com.example.fragrance.review.dto.ReviewRequest;
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

	@Override
	public void saveReview(ReviewRequest requestDto) {
		// DB 저장 (성공 시 insert된 행의 개수가 반환됨)
		int result = reviewMapper.insertReview(requestDto);

		if (result == 0) {
			throw new RuntimeException("리뷰 등록에 실패했습니다.");
		}
	}
}