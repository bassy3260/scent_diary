package com.example.fragrance.util.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @Scheduled 메서드(OutboxWorker 등)를 실제로 동작시키려면 이 애노테이션이
 * 어딘가에 붙어있어야 함. 없으면 @Scheduled는 그냥 조용히 무시됨.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
