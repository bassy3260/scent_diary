package com.example.fragrance.perfume.mapper;

import com.example.fragrance.perfume.dto.PerfumeDetailResponse;
import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.entity.Perfume;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PerfumeMapper {
    PerfumeDetailResponse selectPerfumeDetail(Long perfumeId);

    List<PerfumeSearchDto> searchPerfumes(@Param("search") String search, @Param("size") int size, @Param("offset") int offset);

    long countSearchPerfumes(@Param("search") String search);

    List<PerfumeSearchDto> findAllForElasticsearch();
}
