package com.example.fragrance.recommend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 텍스트 추천 시 필요한 request
@Getter
@NoArgsConstructor // 기본 생성자를 만듬. JSON -> 자바 객체 변환 가능
public class RecommendTextRequest {
    private Integer price;
    private String note;
    private String keyword;
}
