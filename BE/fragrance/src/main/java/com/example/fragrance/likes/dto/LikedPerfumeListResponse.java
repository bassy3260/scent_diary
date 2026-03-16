package com.example.fragrance.likes.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LikedPerfumeListResponse {
	private List<LikedPerfume> perfumes;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}
