package com.example.fragrance.recommend.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;

public class RecommendHistoryQueryResult {

	/** 목록 조회: recommend_result + perfume flat row */
	@Getter
	@NoArgsConstructor
	public static class ListRow {
		private Long recommendResultId;
		private LocalDateTime createTime;
		private String age;
		private String keyword;
		private String inputImage;
		private Long perfumeId;
		private String perfumeImage;
		private String brand;
		private String perfumeName;
	}

	/** 상세 조회: recommend_result 헤더 */
	@Getter
	@NoArgsConstructor
	public static class DetailHeaderRow {
		private Long recommendResultId;
		private LocalDateTime createTime;
		private String age;
		private String keyword;
		private String inputImage;
	}

	/** 상세 조회: perfume_recommend + perfume + accord + note flat row */
	@Getter
	@NoArgsConstructor
	public static class DetailPerfumeRow {
		private Long perfumeId;
		private String perfumeImage;
		private String brand;
		private String perfumeName;
		private String reasons;
		private String accordName;
		private String noteLevel;
		private String noteName;
	}
}