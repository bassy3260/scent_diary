package com.example.fragrance.tryDiray.service;

import com.example.fragrance.tryDiray.entity.TryDiary;
import com.example.fragrance.tryDiray.mapper.TryDiaryMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TryDiaryService {

    private final TryDiaryMapper tryDiaryMapper;

    public List<TryDiary> getTryDiaries(Long memberId, int page, int size) {
        int offset = (page - 1) * size;
        return tryDiaryMapper.findAll(memberId, offset, size);
    }

    public TryDiary getTryDiary(Long tryDiaryId) {
        return tryDiaryMapper.findById(tryDiaryId);
    }

    public void createTryDiary(Long memberId, TryDiary tryDiary) {
        tryDiary.setMemberId(memberId);
        tryDiaryMapper.insert(tryDiary);
    }
}
