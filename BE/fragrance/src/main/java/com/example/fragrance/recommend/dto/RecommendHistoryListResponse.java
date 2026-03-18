package com.example.fragrance.recommend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendHistoryListResponse {

	private List<RecommendHistoryItem> recommendations;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;

	@Getter
	@Builder
	public static class RecommendHistoryItem {
		private Long recommendResultId;
		private LocalDateTime createTime;
		private InputInfo input;
		private List<PerfumeSummary> results;
	}

	@Getter
	@Builder
	public static class InputInfo {
		private String age;
		private String keyword;
		private String image;
	}

	@Getter
	@Builder
	public static class PerfumeSummary {
		private String image;
		private String brand;
		private String name;
	}
}