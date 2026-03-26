package com.example.fragrance.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiMemberRecommendResponse {
    private List<RecommendationItem> recommendations;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationItem {
        @JsonProperty("perfume_id")
        private Long perfumeId;

        @JsonProperty("perfume_name")
        private String perfumeName;

        @JsonProperty("image_route")
        private String imageRoute;

        private List<String> accords;
    }
}
