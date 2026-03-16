package com.example.fragrance.perfume.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberPerfumeListResponse {
	private List<MemberPerfumeDto> perfumes;
	private int page;
	private int size;
	private long totalElements;
	private int totalPages;
}