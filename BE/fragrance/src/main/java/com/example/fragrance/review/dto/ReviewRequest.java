package com.example.fragrance.review.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ReviewRequest {

    private Long perfumeId;
    private int rating;
    private String content;
    private Long memberId;

}