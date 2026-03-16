package com.example.fragrance.review.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReviewListResponse {
	private List<ReviewDto> reviews;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}
