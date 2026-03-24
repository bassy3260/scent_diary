package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.dto.PerfumeSearchListResponse;
import com.example.fragrance.perfume.mapper.PerfumeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerfumeSearchService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final PerfumeMapper perfumeMapper;

    public PerfumeSearchListResponse searchPerfumes(String search, int page, int size) {
        // 페이징 설정
        Pageable pageable = PageRequest.of(page, size);

        // 쿼리 빌드
        Query query = NativeQuery.builder()
                .withQuery(q -> {
                    if (search == null || search.isBlank()) {
                        return q.matchAll(m -> m);
                    }
                    return q.multiMatch(m -> m
                            .fields("name", "brand")
                            .query(search)
                            .fuzziness("AUTO")
                    );
                })
                .withPageable(pageable)
                .build();

        // ES 실행 (결과를 바로 PerfumeSearchDto로 받음)
        SearchHits<PerfumeSearchDto> searchHits = elasticsearchOperations.search(query, PerfumeSearchDto.class);

        // 리스트 추출
        List<PerfumeSearchDto> perfumes = searchHits.getSearchHits().stream()
                .map(hit -> {
                    PerfumeSearchDto dto = hit.getContent();
                    dto.setId(hit.getId());
                    return dto;
                })
                .collect(Collectors.toList());

        // 페이징 계산
        long totalElements = searchHits.getTotalHits();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        // 결과 반환
        return new PerfumeSearchListResponse(
                perfumes,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    @Transactional(readOnly = true)
    public String migrateAllToElasticsearch() {
        // 1. DB에서 전체 향수 데이터(어코드 포함) 가져오기
        List<PerfumeSearchDto> allPerfumes = perfumeMapper.findAllForElasticsearch();

        if (allPerfumes.isEmpty()) {
            return "MIGRATION FAILED: No data found in MySQL";
        }

        // 2. ES에 한 번에 저장 (Bulk)
        elasticsearchOperations.save(allPerfumes);

        return "SUCCESS: Migrated " + allPerfumes.size() + " perfumes to ES";
    }
}