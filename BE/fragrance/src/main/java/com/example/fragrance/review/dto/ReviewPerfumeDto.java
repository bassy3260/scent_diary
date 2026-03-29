package com.example.fragrance.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewPerfumeDto {
	private Long perfumeId;
	private String perfumeName;
	private String brand;
	private String image;
}
