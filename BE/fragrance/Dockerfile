# ---------------------------------------------------------------
# Stage 1 : 빌드
# ---------------------------------------------------------------
FROM gradle:8.5-jdk21 AS builder

WORKDIR /app

# 의존성 캐시 레이어 (build.gradle이 바뀌지 않으면 재사용)
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true

# 소스 복사 후 빌드
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# ---------------------------------------------------------------
# Stage 2 : 실행
# JRE만 포함한 slim 이미지로 최종 용량 절감
# ---------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 타임존 설정
ENV TZ=Asia/Seoul

# 빌더에서 JAR만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# Spring profile은 docker-compose에서 주입 (SPRING_PROFILES_ACTIVE=dev)
ENTRYPOINT ["java", "-jar", "app.jar"]
