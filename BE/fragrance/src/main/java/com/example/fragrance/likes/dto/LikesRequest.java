package com.example.fragrance.likes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LikesRequest {
	@JsonProperty("perfume_id")
    private Long perfumeId;
}