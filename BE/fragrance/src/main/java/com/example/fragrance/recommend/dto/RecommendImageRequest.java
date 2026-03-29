package com.example.fragrance.recommend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RecommendImageRequest {
    private int price;
    private String note;

    @JsonProperty("image_route") //JSON의 image_route -> Java의 imageRoute로 매핑
    private String imageRoute;
}
