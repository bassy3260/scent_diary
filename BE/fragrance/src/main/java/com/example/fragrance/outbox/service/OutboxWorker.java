package com.example.fragrance.outbox.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.example.fragrance.outbox.entity.OutboxEvent;
import com.example.fragrance.outbox.mapper.OutboxEventMapper;
import com.example.fragrance.perfume.service.PerfumeSearchService;

import lombok.extern.slf4j.Slf4j;

/**
 * outbox_events를 주기적으로 폴링해서 처리하는 워커.
 *
 * 향수 1건당 ML의 단건 임베딩 재계산 API를 호출하고, 이어서 ES에도 그 향수 1건을 반영한다.
 */
@Slf4j
@Component
public class OutboxWorker {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_RETRIES = 5;

    private final OutboxEventMapper outboxEventMapper;
    private final PerfumeSearchService perfumeSearchService;
    private final RestTemplate embeddingApiClient;
    private final String fastapiUrl;

    // 이 워커 전용 RestTemplate에만 타임아웃을 건다. 프로젝트 공용 RestTemplate(다른 곳에서
    // 이미 쓰고 있는)은 그대로 두고 건드리지 않음 -- 여긴 새로 짜는 코드니까 처음부터
    // 안전하게. 타임아웃이 없으면 ML이 응답을 안 줄 때 이 호출이 무한 대기하면서
    // @Scheduled 스레드 자체가 막혀, 그 뒤로 폴링이 전부 멈추는 훨씬 심각한 문제가 됨.
    public OutboxWorker(
            OutboxEventMapper outboxEventMapper,
            PerfumeSearchService perfumeSearchService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${fastapi.url}") String fastapiUrl
    ) {
        this.outboxEventMapper = outboxEventMapper;
        this.perfumeSearchService = perfumeSearchService;
        this.fastapiUrl = fastapiUrl;
        this.embeddingApiClient = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(30))
                .build();
    }

    // fixedDelay: 이전 실행이 "끝난 시점"부터 다음 실행까지의 간격(ms).
    // 처리 중 이 폴링 주기보다 오래 걸려도 두 번이 겹쳐서 동시에 도는 일은 없음.
    @Scheduled(fixedDelay = 10_000)
    public void processOutboxEvents() {
        List<OutboxEvent> events = outboxEventMapper.findUnprocessed(BATCH_SIZE);

        if (events.isEmpty()) {
            return; // 할 일 없으면 로그도 안 남김 (매 10초마다 "처리할 거 없음" 찍히면 로그만 지저분해짐)
        }

        // 같은 perfume_id에 이벤트가 여러 개 쌓여있을 수 있음(어코드/노트 파급 트리거는
        // 향수 하나당 이벤트를 여러 번 만들 수 있고, 같은 향수가 짧은 시간에 여러 번 수정될
        // 수도 있음). 향수 하나는 어차피 "재임베딩 + ES 반영"을 한 번만 하면 되므로,
        // perfume_id로 묶어서 한 번만 처리하고 그 그룹에 속한 이벤트 전부를 한꺼번에
        // 처리완료 표시한다.
        Map<Long, List<OutboxEvent>> byPerfumeId = events.stream()
                .collect(Collectors.groupingBy(OutboxEvent::getPerfumeId));

        log.info("[OutboxWorker] 이벤트 {}건 -> 중복 제거 후 향수 {}건 처리",
                events.size(), byPerfumeId.size());

        for (Map.Entry<Long, List<OutboxEvent>> entry : byPerfumeId.entrySet()) {
            Long perfumeId = entry.getKey();
            List<OutboxEvent> group = entry.getValue();
            try {
                handle(perfumeId, group);
                for (OutboxEvent event : group) {
                    outboxEventMapper.markProcessed(event.getOutboxEventId());
                }
            } catch (Exception e) {
                // 한 향수가 실패해도 나머지 향수 처리는 계속 진행.
                log.error("[OutboxWorker] perfumeId={} 처리 실패 (묶인 이벤트 {}건)",
                        perfumeId, group.size(), e);
                recordFailure(perfumeId, group, e);
            }
        }
    }

    private void handle(Long perfumeId, List<OutboxEvent> group) {
        String url = fastapiUrl + "/api/v1/embed/perfume/" + perfumeId;
        embeddingApiClient.postForObject(url, null, String.class);

        // event_type으로 분기하지 않는다 -- syncPerfumeToElasticsearch가 그 시점의 DB 상태를
        // 다시 조회해서 살아있으면 upsert, 없거나 soft-delete면 ES에서 제거를 알아서 처리함.
        perfumeSearchService.syncPerfumeToElasticsearch(perfumeId);

        log.debug("[OutboxWorker] perfumeId={} 임베딩+ES 반영 완료 (묶인 이벤트: {})", perfumeId,
                group.stream().map(OutboxEvent::getEventType).collect(Collectors.joining(", ")));
    }

    /**
     * 실패한 이벤트마다 재시도 횟수를 늘리고, MAX_RETRIES를 넘긴 것은 포기 처리해서
     * 더 이상 findUnprocessed에 안 걸리게 한다. 이게 없으면 계속 실패하는 항목 하나가
     * (a) 로그를 무한히 찍고, (b) findUnprocessed가 오래된 순으로 가져오는 특성상
     * 새로 생긴 다른 항목들의 처리를 계속 뒤로 밀어내는 문제가 생김.
     */
    private void recordFailure(Long perfumeId, List<OutboxEvent> group, Exception cause) {
        String errorMessage = String.valueOf(cause.getMessage());
        for (OutboxEvent event : group) {
            int retryCount = outboxEventMapper.recordFailureAndGetRetryCount(
                    event.getOutboxEventId(), errorMessage);
            if (retryCount >= MAX_RETRIES) {
                outboxEventMapper.markGivenUp(event.getOutboxEventId());
                log.warn("[OutboxWorker] outboxEventId={} (perfumeId={}) {}번 실패 -> 포기, 더 이상 재시도 안 함",
                        event.getOutboxEventId(), perfumeId, retryCount);
            }
        }
    }
}
