package com.example.fragrance.recommend.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.recommend.dto.RecommendHistoryQueryResult;

@Mapper
public interface RecommendResultMapper {

	List<RecommendHistoryQueryResult.ListRow> findHistoryList(
		@Param("memberId") Long memberId,
		@Param("offset") int offset,
		@Param("size") int size
	);

	long countHistory(@Param("memberId") Long memberId);

	RecommendHistoryQueryResult.DetailHeaderRow findDetailHeader(
		@Param("recommendResultId") Long recommendResultId,
		@Param("memberId") Long memberId
	);

	List<RecommendHistoryQueryResult.DetailPerfumeRow> findDetailPerfumes(
		@Param("recommendResultId") Long recommendResultId
	);
}