package com.example.fragrance.diary.mapper;

import com.example.fragrance.diary.dto.DiaryDetailResponse;
import com.example.fragrance.diary.dto.DiaryListResponse;
import com.example.fragrance.diary.entity.Diary;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DiaryMapper {

    List<DiaryListResponse> findAll(@Param("memberId") Long memberId,
                                    @Param("offset") int offset,
                                    @Param("size") int size);

    int countByMemberId(@Param("memberId") Long memberId);

    DiaryDetailResponse findById(@Param("diaryId") Long diaryId);

    void insert(Diary diary);
}
