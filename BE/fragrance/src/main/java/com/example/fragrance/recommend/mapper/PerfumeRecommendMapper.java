package com.example.fragrance.recommend.mapper;

import com.example.fragrance.recommend.dto.FastApiRecommendResponse;
import com.example.fragrance.recommend.entity.PerfumeRecommend;

import com.example.fragrance.recommend.entity.RecommendResult;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

//
// 추천 결과 저장
// 향수 추천 결과 저장
@Mapper
public interface PerfumeRecommendMapper {
    // RecommendResult 엔티티를 받아서 INSERT, 생성된 ID를 recommendResultId에 세팅
    int insertRecommendResult(RecommendResult recommendResultListResponse);

    // 여러 건을 한 번에 INSERT(batch Insert)
    void insertPerfumeRecommend(List<PerfumeRecommend> perfumeRecommendList);
}
