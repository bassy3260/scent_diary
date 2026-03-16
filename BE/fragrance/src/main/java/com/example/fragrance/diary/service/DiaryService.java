package com.example.fragrance.diary.service;

import com.example.fragrance.diary.dto.DiaryCreateRequest;
import com.example.fragrance.diary.dto.DiaryDetailResponse;
import com.example.fragrance.diary.dto.DiaryListResponse;
import com.example.fragrance.diary.entity.Diary;
import com.example.fragrance.diary.entity.DiaryImage;
import com.example.fragrance.diary.mapper.DiaryImageMapper;
import com.example.fragrance.diary.mapper.DiaryMapper;
import com.example.fragrance.util.common.PageResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryMapper diaryMapper;
    private final DiaryImageMapper diaryImageMapper;

    public PageResponse<DiaryListResponse> getDiaries(Long memberId, int page, int size) {
        int offset = (page - 1) * size;
        List<DiaryListResponse> diaries = diaryMapper.findAll(memberId, offset, size);
        int totalElements = diaryMapper.countByMemberId(memberId);
        return PageResponse.of(diaries, totalElements, page, size);
    }

    public DiaryDetailResponse getDiary(Long diaryId) {
        return diaryMapper.findById(diaryId);
    }

    public Long createDiary(Long memberId, DiaryCreateRequest request) {
        Diary diary = Diary.builder()
                .memberId(memberId)
                .perfumeId(request.getPerfumeId())
                .title(request.getTitle())
                .detail(request.getContent())
                .build();
        diaryMapper.insert(diary);

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (String imageUrl : request.getImages()) {
                DiaryImage diaryImage = DiaryImage.builder()
                        .diaryId(diary.getDiaryId())
                        .imageRoute(imageUrl)
                        .build();
                diaryImageMapper.insert(diaryImage);
            }
        }

        return diary.getDiaryId();
    }
}
