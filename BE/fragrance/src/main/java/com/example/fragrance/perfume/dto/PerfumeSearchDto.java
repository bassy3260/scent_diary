package com.example.fragrance.perfume.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PerfumeSearchDto {
	private String image;
	private String brand;
	private String name;
	private Integer price;
	private List<String> accords;
}
