package com.example.fragrance.diary.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DiaryRefineRequest {
	private String content;
	private String perfumeName;
	private String perfumeBrand;
}