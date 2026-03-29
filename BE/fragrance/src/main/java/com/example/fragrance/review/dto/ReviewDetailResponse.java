package com.example.fragrance.review.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewDetailResponse {
    private String nickname;
    private String content;
    private int rating;
    private String createdAt;
}
