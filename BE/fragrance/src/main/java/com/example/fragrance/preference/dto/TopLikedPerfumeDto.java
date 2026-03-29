
package com.example.fragrance.preference.dto;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TopLikedPerfumeDto {
	private Long perfumeId;
	private String perfumeName;
	private String imageRoute;
	private String accordNames;

	public List<String> getAccordList() {
		if (accordNames == null || accordNames.isEmpty()) {
			return Collections.emptyList();
		}
		return Arrays.asList(accordNames.split(","));
	}
}