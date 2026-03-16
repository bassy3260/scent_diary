package com.example.fragrance.diary.mapper;

import com.example.fragrance.diary.entity.DiaryImage;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DiaryImageMapper {

    void insert(DiaryImage diaryImage);
}
