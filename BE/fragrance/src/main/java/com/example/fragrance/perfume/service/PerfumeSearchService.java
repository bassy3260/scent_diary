package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.dto.PerfumeSearchListResponse;
import com.example.fragrance.perfume.mapper.PerfumeMapper;
import com.example.fragrance.util.perfume.KoreanUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.ResourceNotFoundException;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.index.AliasAction;
import org.springframework.data.elasticsearch.core.index.AliasActionParameters;
import org.springframework.data.elasticsearch.core.index.AliasActions;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PerfumeSearchService {

    private static final String PERFUMES_ALIAS = "perfumes";

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

    /**
     * 전체 향수를 ES에 재색인한다 (Reindex + Alias Swap).
     *
     * "perfumes"는 검색 서비스가 바라보는 별칭(alias)이고, 실제 데이터는 항상
     * "perfumes_<timestamp>"라는 진짜 인덱스에 들어간다. 매핑이 바뀌었거나 데이터
     * 정합성이 깨졌을 때 이 메서드를 다시 돌리면:
     *   1) 새 인덱스를 만들어 전체 데이터를 적재
     *   2) 별칭을 (옛 인덱스 제거 + 새 인덱스 추가) 원자적으로 스왑
     *   3) 더는 안 쓰는 옛 인덱스를 삭제
     * 새 인덱스 적재가 끝나기 전까지는 별칭이 계속 옛 인덱스를 가리키므로, 재색인
     * 도중에도 검색 API는 끊김 없이 옛 데이터로 계속 응답한다.
     */
    @Transactional(readOnly = true)
    public String migrateAllToElasticsearch() {
        List<PerfumeSearchDto> allPerfumes = perfumeMapper.findAllForElasticsearch();

        if (allPerfumes.isEmpty()) {
            return "REINDEX FAILED: No data found in DB";
        }

        for (PerfumeSearchDto perfume : allPerfumes) {
            perfume.setChosung(KoreanUtils.getChosung(perfume.getName()));
        }

        String newIndexName = PERFUMES_ALIAS + "_" + System.currentTimeMillis();
        IndexCoordinates newIndexCoords = IndexCoordinates.of(newIndexName);
        IndexOperations newIndexOps = elasticsearchOperations.indexOps(newIndexCoords);

        newIndexOps.create();
        newIndexOps.putMapping(newIndexOps.createMapping(PerfumeSearchDto.class));
        elasticsearchOperations.save(allPerfumes, newIndexCoords);
        log.info("[ES 재색인] 새 인덱스 '{}' 생성 및 {}건 적재 완료", newIndexName, allPerfumes.size());

        Set<String> oldIndices;
        try {
            IndexOperations aliasOps = elasticsearchOperations.indexOps(IndexCoordinates.of(PERFUMES_ALIAS));
            try {
                oldIndices = aliasOps.getAliases(PERFUMES_ALIAS).keySet();
            } catch (ResourceNotFoundException e) {
                // "perfumes"라는 별칭 자체가 아직 없는 경우 (최초 재색인이거나, "perfumes"가
                // 별칭이 아니라 진짜 인덱스로 존재하는 경우) ES가 GET _alias/perfumes에 404를
                // 내려주는데, Spring Data ES가 이를 예외로 번역한다. 옛 별칭 인덱스가 없다는
                // 뜻이므로 빈 Set으로 취급한다.
                oldIndices = Set.of();
            }

            if (oldIndices.isEmpty() && aliasOps.exists()) {
                // 최초 재색인: "perfumes"가 별칭이 아니라 과거 마이그레이션이 만들어둔
                // 진짜 인덱스로 이미 존재하는 경우. ES는 별칭과 인덱스가 이름을 공유할
                // 수 없으므로, 같은 이름을 별칭으로 쓰려면 그 실제 인덱스를 먼저 지워야 한다.
                aliasOps.delete();
                log.info("[ES 재색인] 최초 마이그레이션 감지: 기존 실제 인덱스 '{}' 삭제", PERFUMES_ALIAS);
            }

            AliasActions actions = new AliasActions();
            for (String oldIndex : oldIndices) {
                actions.add(new AliasAction.Remove(
                        AliasActionParameters.builder().withIndices(oldIndex).withAliases(PERFUMES_ALIAS).build()));
            }
            actions.add(new AliasAction.Add(
                    AliasActionParameters.builder().withIndices(newIndexName).withAliases(PERFUMES_ALIAS).build()));

            newIndexOps.alias(actions);
            log.info("[ES 재색인] 별칭 '{}' → '{}' 스왑 완료", PERFUMES_ALIAS, newIndexName);
        } catch (RuntimeException e) {
            // 별칭 스왑 전 단계에서 실패하면 이제 막 만든 새 인덱스는 아무도 참조하지
            // 않는 고아가 된다. "perfumes" 별칭은 아직 옛 인덱스를 그대로 가리키고
            // 있으므로 서비스에는 영향이 없지만, 디스크에 계속 쌓이지 않도록 정리한다.
            log.error("[ES 재색인] 별칭 스왑 실패, 새 인덱스 '{}' 정리 후 예외 재전파", newIndexName, e);
            newIndexOps.delete();
            throw e;
        }

        for (String oldIndex : oldIndices) {
            elasticsearchOperations.indexOps(IndexCoordinates.of(oldIndex)).delete();
            log.info("[ES 재색인] 옛 인덱스 '{}' 삭제", oldIndex);
        }

        return "SUCCESS: reindexed " + allPerfumes.size() + " perfumes into " + newIndexName
                + " (alias " + PERFUMES_ALIAS + ")";
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