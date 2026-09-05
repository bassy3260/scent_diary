package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.dto.PerfumeSearchListResponse;
import com.example.fragrance.perfume.mapper.PerfumeMapper;
import com.example.fragrance.util.perfume.KoreanUtils;
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
                            .fields("name", "brand", "notes", "chosung")
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

        // 2. 각 향수 데이터에 초성 심어주기 (초성 검색을 위함)
        for (PerfumeSearchDto perfume : allPerfumes) {
            // 이름(name)에서 초성을 뽑아 chosung 필드에 저장
            perfume.setChosung(KoreanUtils.getChosung(perfume.getName()));
        }

        // 3. ES에 한 번에 저장 (Bulk)
        elasticsearchOperations.save(allPerfumes);

        return "SUCCESS: Migrated " + allPerfumes.size() + " perfumes to ES";
    }

    /**
     * 향수 1건만 ES에 반영한다 (outbox 워커가 호출).
     * event_type(UPDATE/DELETE 등)으로 분기하지 않고, 지금 이 순간 DB에서
     * 다시 조회한 상태를 그대로 신뢰한다 -- perfume이 없거나 is_delete=true면
     * ES에서 제거, 살아있으면 upsert. 트리거가 기록해둔 event_type 문자열보다
     * "지금 DB에 뭐가 있는지"가 더 확실한 진실이기 때문.
     */
    @Transactional(readOnly = true)
    public void syncPerfumeToElasticsearch(Long perfumeId) {
        PerfumeSearchDto dto = perfumeMapper.findByIdForElasticsearch(perfumeId);

        if (dto == null) {
            elasticsearchOperations.delete(String.valueOf(perfumeId), PerfumeSearchDto.class);
            return;
        }

        dto.setChosung(KoreanUtils.getChosung(dto.getName()));
        elasticsearchOperations.save(dto);
    }
}