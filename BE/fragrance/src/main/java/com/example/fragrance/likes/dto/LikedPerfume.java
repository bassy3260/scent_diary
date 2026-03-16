package com.example.fragrance.likes.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LikedPerfume {
	private String image;
	private String brand;
	private String name;
	private List<String> accords;
}
