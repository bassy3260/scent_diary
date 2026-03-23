package com.example.fragrance.recommend.dto;

import com.example.fragrance.recommend.entity.RecommendResult;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.web.bind.annotation.BindParam;

import java.util.List;

// 추천 결과 DTO
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiRecommendResponse  {
    private List<RecommendationItem> recommendations;

    // Jackson 역직렬화 규칙
    // RestTemplate로 응답을 받을 때 Jackson이 JSON -> Java 객체 변환
    @Getter
    @Builder // Builder만 있으면 기본 생성자가 없어서 Jaskson이 인스턴스를 못받는다.
    @NoArgsConstructor
    @AllArgsConstructor // Builder와 함께 쓰려면 필요하다.
    public static class RecommendationItem{
        @JsonProperty("perfume_id")
        private Long perfumeId;
        private String reason;
    }
}
