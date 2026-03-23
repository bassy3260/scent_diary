package com.example.fragrance.tryDiray.dto;

import com.example.fragrance.tryDiray.entity.Season;
import com.example.fragrance.tryDiray.entity.Sillage;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class TryDiaryCreateRequest {

	private String title;
	private List<TryItem> tryItems;

	@Getter
	@NoArgsConstructor
	public static class TryItem {
		private Long perfumeId;
		private String description;
		private String place;
		private Integer lasting;
		private Sillage sillage;
		private Season season;
	}
}