package com.example.fragrance.recommend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendHistoryDetailResponse {

	private Long recommendResultId;
	private LocalDateTime createTime;
	private InputInfo input;
	private List<PerfumeDetail> results;

	@Getter
	@Builder
	public static class InputInfo {
		private String age;
		private String keyword;
		private String image;
	}

	@Getter
	@Builder
	public static class PerfumeDetail {
		private Long perfumeId;
		private String image;
		private String brand;
		private String name;
		private List<String> accords;
		private NoteInfo notes;
		private String reason;
	}

	@Getter
	@Builder
	public static class NoteInfo {
		private List<String> top;
		private List<String> middle;
		private List<String> base;
		private List<String> single;
	}
}