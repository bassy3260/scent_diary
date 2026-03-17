package com.example.fragrance.preference.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PreferenceNotesDto {
	private List<PreferenceNoteDto> total;
	private List<PreferenceNoteDto> top;
	private List<PreferenceNoteDto> middle;
	private List<PreferenceNoteDto> base;
	private List<PreferenceNoteDto> single;
}