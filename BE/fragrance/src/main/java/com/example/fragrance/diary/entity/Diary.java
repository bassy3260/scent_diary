package com.example.fragrance.diary.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class Diary extends common {

    private Long diaryId;
    private Long memberId;
    private Long perfumeId;
    private String title;
    private String detail;
}
