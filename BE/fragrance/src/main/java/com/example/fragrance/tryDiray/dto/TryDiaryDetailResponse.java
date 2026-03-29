package com.example.fragrance.tryDiray.dto;

import com.example.fragrance.tryDiray.entity.Season;
import com.example.fragrance.tryDiray.entity.Sillage;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TryDiaryDetailResponse {

	private Long tryDiaryId;
	private String title;
	private LocalDateTime createTime;
	private List<TryItemInfo> tryItem;

	@Getter
	@Setter
	@NoArgsConstructor
	public static class TryItemInfo {
		private Long perfumeId;
		private String perfumeImageUrl;
		private String perfumeName;
		private String brand;
		private String description;
		private String place;
		private Integer lasting;
		private Sillage sillage;
		private Season season;
	}
}