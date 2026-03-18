package com.example.fragrance.review.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Review extends common {

    private Long reviewId;
    private String detail;
    private Long memberId;
    private Long perfumeId;
    private int rating;
}
