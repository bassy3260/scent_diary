package com.example.fragrance.perfume.bootstrap;

import com.example.fragrance.perfume.dto.PerfumeSearchDto;
import com.example.fragrance.perfume.service.PerfumeSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Component;

/**
 * 로컬 기동 시 Elasticsearch 인덱스가 비어 있으면 DB 데이터를 한 번 적재한다.
 * 이미 문서가 있으면 스킵하며, ES 접속 실패 등 예외가 나도 앱 기동은 계속된다.
 */
@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class EsBootstrap implements ApplicationRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final PerfumeSearchService perfumeSearchService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            IndexOperations index = elasticsearchOperations.indexOps(PerfumeSearchDto.class);
            long count = index.exists()
                    ? elasticsearchOperations.count(Query.findAll(), PerfumeSearchDto.class)
                    : 0;

            if (count == 0) {
                log.info("[EsBootstrap] perfume index is empty, migrating from DB...");
                String result = perfumeSearchService.migrateAllToElasticsearch();
                log.info("[EsBootstrap] {}", result);
            } else {
                log.info("[EsBootstrap] perfume index has {} docs, skip migration", count);
            }
        } catch (Exception e) {
            log.warn("[EsBootstrap] migration skipped: {}", e.getMessage());
        }
    }
}
