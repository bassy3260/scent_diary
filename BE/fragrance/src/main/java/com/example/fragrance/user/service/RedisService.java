package com.example.fragrance.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final StringRedisTemplate redisTemplate;

    // RefreshToken 저장 (Key: memberId, Value: token)
    public void saveRefreshToken(Long memberId, String refreshToken, long durationInMs) {
        redisTemplate.opsForValue().set(
                "RT:" + memberId,
                refreshToken,
                Duration.ofMillis(durationInMs)
        );
    }

    // RefreshToken 가져오기
    public String getRefreshToken(Long memberId) {
        return redisTemplate.opsForValue().get("RT:" + memberId);
    }

    // 로그아웃 시 삭제
    public void deleteRefreshToken(Long memberId) {
        redisTemplate.delete("RT:" + memberId);
    }
}