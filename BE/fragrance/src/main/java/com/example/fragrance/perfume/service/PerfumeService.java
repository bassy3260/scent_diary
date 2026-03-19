package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.PerfumeDetailResponse;
import com.example.fragrance.perfume.mapper.PerfumeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PerfumeService {
    private final PerfumeMapper perfumeMapper;

    @Transactional(readOnly = true)
    public PerfumeDetailResponse getPerfumeDetail(Long perfumeId) {
        PerfumeDetailResponse detail = perfumeMapper.selectPerfumeDetail(perfumeId);

        if (detail == null) {
            throw new NoSuchElementException("해당 향수 정보를 찾을 수 없습니다. ID: " + perfumeId);
        }

        return detail;
    }

}
