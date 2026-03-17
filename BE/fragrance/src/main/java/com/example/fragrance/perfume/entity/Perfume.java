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
public class Perfume extends common {

    private Long perfumeId;
    private String imageRoute;
    private String perfumeName;
    private String brand;
    private String price;
	private String description;
}
