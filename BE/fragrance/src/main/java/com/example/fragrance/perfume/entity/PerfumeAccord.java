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
public class PerfumeAccord extends common {

    private Long perfumeAccordId;
    private Long accordId;
    private Long perfumeId;
    private Long accordOrder;
}
