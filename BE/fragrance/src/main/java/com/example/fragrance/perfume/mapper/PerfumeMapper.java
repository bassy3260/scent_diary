package com.example.fragrance.perfume.mapper;

import com.example.fragrance.perfume.dto.PerfumeDetailResponse;
import com.example.fragrance.perfume.entity.Perfume;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PerfumeMapper {
    PerfumeDetailResponse selectPerfumeDetail(Long perfumeId);

}
