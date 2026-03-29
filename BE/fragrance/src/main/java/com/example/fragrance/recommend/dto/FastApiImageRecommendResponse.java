package com.example.fragrance.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiImageRecommendResponse {
    private String keyword;
    private List<RecommendationItem> recommendations;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationItem {
        @JsonProperty("perfume_id")
        private Long perfumeId;
        private String reason;
    }
}