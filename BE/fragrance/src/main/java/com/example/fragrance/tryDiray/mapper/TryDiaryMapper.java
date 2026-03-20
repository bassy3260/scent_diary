package com.example.fragrance.tryDiray.mapper;

import com.example.fragrance.tryDiray.dto.TryDiaryDetailResponse;
import com.example.fragrance.tryDiray.dto.TryDiaryListResponse;
import com.example.fragrance.tryDiray.entity.TryDiary;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TryDiaryMapper {

    List<TryDiaryListResponse> findAll(@Param("memberId") Long memberId, @Param("offset") int offset, @Param("size") int size);

    int countByMemberId(@Param("memberId") Long memberId);

    TryDiaryDetailResponse findById(@Param("tryDiaryId") Long tryDiaryId);

    void insert(TryDiary tryDiary);
}
