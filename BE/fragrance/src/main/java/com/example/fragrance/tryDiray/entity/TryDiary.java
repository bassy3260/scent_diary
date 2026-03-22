package com.example.fragrance.tryDiray.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class TryDiary extends common {

    private Long tryDiaryId;
    private String imageRoute;
    private Long memberId;
    private String title;
}
