package com.example.fragrance.review.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewDto {
	private Long reviewId;
	private ReviewPerfumeDto perfume;
	private String detail;
	private String rating;
	private LocalDateTime createTime;
}