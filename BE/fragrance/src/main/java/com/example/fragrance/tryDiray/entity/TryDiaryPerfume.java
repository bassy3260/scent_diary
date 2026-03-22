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
public class TryDiaryPerfume extends common {

    private Long tryDiaryPerfumeId;
    private Long perfumeId;
    private Long tryDiaryId;
    private String description;
}
