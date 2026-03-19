package com.example.fragrance.likes.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Likes extends common {

    private Long likesId;
    private Long memberId;
    private Long perfumeId;
}
