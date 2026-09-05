package com.example.fragrance.outbox.entity;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

    private Long outboxEventId;
    private Long perfumeId;
    private String eventType;
    private boolean processed;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    private int retryCount;
    private boolean givenUp;
    private String lastError;
}
