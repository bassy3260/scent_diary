package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.PerfumeDetailResponse;
import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.dto.PerfumeSearchListResponse;
import com.example.fragrance.perfume.mapper.PerfumeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    @Transactional(readOnly = true)
    public PerfumeSearchListResponse searchPerfumes(String search, int page, int size) {
        int offset = page * size;
        List<PerfumeSearchDto> perfumes = perfumeMapper.searchPerfumes(search, size, offset);
        long totalElements = perfumeMapper.countSearchPerfumes(search);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PerfumeSearchListResponse(perfumes, page, size, totalElements, totalPages);
    }
}
