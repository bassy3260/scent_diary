package com.example.fragrance.review.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.review.dto.ReviewDto;

@Mapper
public interface ReviewMapper {

	List<ReviewDto> findReviewsByMemberId(
		@Param("memberId") Long memberId,
		@Param("offset") int offset,
		@Param("size") int size
	);

	long countReviewsByMemberId(@Param("memberId") Long memberId);
}
