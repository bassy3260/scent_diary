package com.example.fragrance.perfume.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class MemberPerfume extends common {

    private Long memberPerfumeId;
    private Long memberId;
    private Long perfumeId;
}
