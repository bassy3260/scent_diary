package com.example.fragrance.preference.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PreferenceAccordDto {
	private String accordName;
	private int count;
	private double ratio;
}