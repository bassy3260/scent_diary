package com.example.fragrance.outbox.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.outbox.entity.OutboxEvent;

@Mapper
public interface OutboxEventMapper {

    List<OutboxEvent> findUnprocessed(@Param("limit") int limit);

    void markProcessed(@Param("outboxEventId") Long outboxEventId);

    /** 실패 기록: retry_count를 1 늘리고 에러 메시지를 남긴 뒤, 늘어난 카운트를 반환. */
    int recordFailureAndGetRetryCount(@Param("outboxEventId") Long outboxEventId,
                                       @Param("errorMessage") String errorMessage);

    /** 재시도 상한을 넘겨서 더 이상 시도하지 않기로 한 이벤트를 표시. */
    void markGivenUp(@Param("outboxEventId") Long outboxEventId);
}
