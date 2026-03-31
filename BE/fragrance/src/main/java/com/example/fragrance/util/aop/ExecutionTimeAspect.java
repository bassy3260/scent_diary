package com.example.fragrance.util.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect // AOP Aspect임을 알리는 어노테이션
@Component // Spring Bean으로 등록
@Slf4j // 로그 출력용(Lombok)
public class ExecutionTimeAspect {


    @Around("execution(* com.example.fragrance..*Service*.*(..))")
    public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable{
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed(); // 이걸 호출해야 실제 메서드가 실행됨.
        long end= System.currentTimeMillis();

        log.info("[실행시간] {}.{}() -> {}ms",
        joinPoint.getTarget().getClass().getSimpleName(),
        joinPoint.getSignature().getName(),
                (end-start));
        return result;
    }

}
