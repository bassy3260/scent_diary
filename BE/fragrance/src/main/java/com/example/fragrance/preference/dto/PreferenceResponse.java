package com.example.fragrance.preference.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PreferenceResponse {
	private String summary;
	private List<PreferenceAccordDto> accords;
	private PreferenceNotesDto notes;
}