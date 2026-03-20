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
public class DiaryImage extends common {

    private Long diaryImageId;
    private Long diaryId;
    private String imageRoute;
}
