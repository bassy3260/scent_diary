package com.example.fragrance.perfume.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CollectRequest {
	@JsonProperty("perfume_id")
    private Long perfumeId;
}