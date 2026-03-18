package com.example.fragrance.recommend.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class RecommendResult extends common {

    private Long recommendResultId;
    private Long memberId;
    private String keyword;
    private String imageRoute;
    private Age age;
}
