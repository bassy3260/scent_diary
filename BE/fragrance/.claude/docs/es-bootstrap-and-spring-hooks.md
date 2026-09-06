# ES 자동 마이그레이션 + 스프링 기동 훅 정리

작성일: 2026-08-31

---

## 1. 이번에 해결한 문제 (디버깅 기록)

### 1-1. 포트 8080 충돌

- 증상: `Web server failed to start. Port 8080 was already in use.`
- 원인: `MTAgentService` (`C:\Program Files\MiniTool ShadowMaker\AgentService.exe`, PID 5844)
  가 8080을 LISTEN 중. MiniTool ShadowMaker 백업 소프트웨어의 상주 서비스이며 `Auto` 시작이라
  재부팅해도 다시 점유함. 프로젝트와 무관.
- 조치: 백업 서비스를 죽이는 대신 앱 포트를 옮김.
  `src/main/resources/application-local.yaml` (git-ignored) 에 추가:

  ```yaml
  server:
    port: 8081
  ```

  → 앱은 이제 `http://localhost:8081`. 프론트 dev 프록시 / API base URL, `perfume-images`
  정적 URL도 8081로 맞춰야 함.

### 1-2. Elasticsearch 연결 거부

- 증상:
  ```
  org.springframework.dao.DataAccessResourceFailureException: Connection refused: getsockopt
  ... org.apache.http.impl.nio.reactor.DefaultConnectingIOReactor ...
  ```
  향수 검색 요청 시 500. "이미지가 안 뜬다"는 것도 같은 원인 — 검색 결과에 이미지 URL이
  실려오는데 검색 자체가 실패하니 결과 0건.
- 원인: 로컬 서비스 상태 점검 결과
  - PostgreSQL 5432 ✅ / Redis 6379 ✅ / FastAPI 8000 ✅
  - **Elasticsearch 9200 ❌ 안 떠 있음**
  - `.env` 는 `ES_HOST=localhost`, `ES_PORT=9200`
  - Docker 데몬은 설치돼 있고 실행 중이었으나 (`docker info` OK) ES 컨테이너가 없었음.
- 향수 검색은 전적으로 ES에 의존 (`PerfumeSearchService` → `ElasticsearchOperations.search(...)`).
  Spring Data Elasticsearch는 RDB ↔ ES 동기화를 안 해줌.

### 1-3. 조치

**(a) `docker-compose.yml` 신규 작성** (`BE/fragrance/docker-compose.yml`)

- ES 8.18.0 단일 노드, `xpack.security.enabled=false` (application.yaml 이 `http://` + 무인증이라 일치)
- `es-data` named volume 로 재시작해도 인덱스 유지
- `ES_JAVA_OPTS=-Xms256m -Xmx256m` — 처음엔 512m 였으나, 그 상태에서 `./gradlew compileJava`
  가 메모리 부족(`insufficient memory for the Java Runtime Environment`)으로 실패해서 256m로 낮춤.
- PostgreSQL / Redis 는 **의도적으로 제외**. 이미 로컬에 실데이터를 들고 상주 중이라
  compose 로 띄우면 포트 충돌 또는 빈 DB 로 시작되는 문제가 생김.

```
docker compose up -d      # 시작
docker compose down       # 중지 (인덱스 유지)
docker compose down -v    # 인덱스까지 삭제 → 재적재 필요
```

**(b) 기동 시 자동 마이그레이션 훅 신규 작성**

`src/main/java/com/example/fragrance/perfume/bootstrap/EsBootstrap.java`

```java
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
```

- `@Profile("local")` → 로컬에서만 빈 등록. 배포 환경 영향 없음.
- `count == 0` 일 때만 적재 → 매 기동마다 재적재 안 함.
- 예외를 삼켜서 ES 가 아직 안 떠 있어도 앱 기동은 계속됨.
- 기존 수동 엔드포인트 `GET /api/v1/perfume/migrate` (인증 필요) 는 강제 재적재용으로 유지.

전제: `PerfumeSearchDto` 에 `@Document(indexName = "perfumes")` 존재 (확인 완료).

### 1-4. 기동 흐름 (하루 시작 루틴)

```
cd BE/fragrance
docker compose up -d          # ES (10~20초)
curl localhost:9200           # 응답 확인
# → IntelliJ 에서 FragranceApplication Run (profile: local, port 8081)
```

앱 로그 기대값:
- 첫 기동 / `down -v` 후: `[EsBootstrap] perfume index is empty, migrating from DB...`
  → `[EsBootstrap] SUCCESS: Migrated N perfumes to ES`
- 이후 기동: `[EsBootstrap] perfume index has N docs, skip migration`

---

## 2. 스프링 기동 훅은 어떤 원리로 실행되는가

### 2-1. 큰 그림 — `SpringApplication.run()` 의 생애

`main()` 에서 `SpringApplication.run(FragranceApplication.class, args)` 를 부르면
대략 이 순서로 진행된다:

```
SpringApplication.run()
 ├─ 1. 환경 준비 (Environment): properties, YAML, .env, 활성 프로파일(local) 결정
 ├─ 2. ApplicationContext 생성 (웹이면 AnnotationConfigServletWebServerApplicationContext)
 ├─ 3. context.refresh()   ← 여기서 대부분의 일이 벌어진다 (아래 2-2)
 │      ├─ BeanFactory 준비, BeanFactoryPostProcessor 실행
 │      ├─ BeanPostProcessor 등록
 │      ├─ 내장 웹서버(Tomcat) 생성 + start → 포트 LISTEN 시작 (onRefresh 단계)
 │      ├─ 모든 non-lazy 싱글톤 빈 생성/주입/초기화 (finishBeanFactoryInitialization)
 │      └─ finishRefresh: Lifecycle 빈 start, ContextRefreshedEvent 발행
 ├─ 4. afterRefresh() (훅 아님, 확장 포인트)
 ├─ 5. ApplicationStartedEvent 발행
 ├─ 6. callRunners(): ApplicationRunner / CommandLineRunner 빈들 실행  ← EsBootstrap 여기
 ├─ 7. ApplicationReadyEvent 발행
 └─ 8. run() 리턴 → main() 스레드 종료, 서버 스레드는 계속 살아있음
```

핵심: **`ApplicationRunner` 는 컨텍스트가 완전히 refresh 된 뒤, 즉 모든 빈이
준비되고 웹서버도 이미 떠 있는 상태에서 실행된다.** 그래서 `ElasticsearchOperations`
같은 빈을 안전하게 주입받아 쓸 수 있다.

### 2-2. `context.refresh()` 안에서 빈 하나가 만들어지는 순서

스프링 컨테이너가 싱글톤 빈 하나를 완성하는 세부 순서 (스프링 프레임워크의
`AbstractAutowireCapableBeanFactory.doCreateBean` 기준):

1. **인스턴스화(instantiation)** — 생성자 호출. `@RequiredArgsConstructor` 로 만들어진
   생성자에 의존성(위 예시의 `elasticsearchOperations`, `perfumeSearchService`)이 주입됨
   (생성자 주입).
2. **프로퍼티 채우기(populate)** — 필드/세터 주입이 있으면 여기서. `@Autowired` 필드 등.
3. **Aware 콜백** — `BeanNameAware`, `ApplicationContextAware` 등 구현 시 호출.
4. **`BeanPostProcessor.postProcessBeforeInitialization`** — 여기서 `@PostConstruct` 가
   `CommonAnnotationBeanPostProcessor` 에 의해 호출됨.
5. **`InitializingBean.afterPropertiesSet()`** → 그다음 `@Bean(initMethod=...)` 지정 메서드.
6. **`BeanPostProcessor.postProcessAfterInitialization`** — 여기서 AOP 프록시가 씌워짐
   (`@Transactional`, `@Async` 등).

즉 `@PostConstruct` / `InitializingBean` 은 **"그 빈 하나가 초기화되는 도중"** 에 불린다.
이 시점엔 다른 빈이 아직 안 만들어졌을 수 있고, 웹서버도 아직 LISTEN 전일 수 있다.
→ "전체 애플리케이션이 준비된 뒤 1회 실행" 용도로는 부적합.

### 2-3. 훅 종류별 실행 시점 비교

| 훅 | 정의 위치 | 실행 시점 | 특징 |
|---|---|---|---|
| `@PostConstruct`, `InitializingBean` | 빈 자신 | 그 빈 초기화 도중 (2-2 의 4~5단계) | 다른 빈/웹서버 준비 보장 안 됨. 그 빈 자체 세팅용 |
| `SmartInitializingSingleton.afterSingletonsInstantiated()` | 빈 | 모든 싱글톤 생성 완료 후, **아직 refresh 안에서** | 웹서버 start 전일 수 있음 |
| `Lifecycle` / `SmartLifecycle.start()` | 빈 | `finishRefresh` 단계 | 웹서버와 같이 start. 순서 제어(`getPhase()`) 가능. stop 콜백도 있음 |
| `ContextRefreshedEvent` 리스너 | `@EventListener` | refresh 끝 직후, 아직 `run()` 안 | 테스트 컨텍스트에서도 뜸 |
| **`ApplicationRunner` / `CommandLineRunner`** | 빈 | refresh 완료 후 `callRunners()` | **모든 빈 + 웹서버 준비 완료.** 기동 시 1회 작업 표준 |
| `ApplicationReadyEvent` 리스너 | `@EventListener` | 러너들 다음 | 가장 느슨한 결합. "이제 트래픽 받아도 됨" 신호 |

`EsBootstrap` 이 `ApplicationRunner` 를 고른 이유: 데이터 적재는
"컨테이너가 완전히 뜬 다음 한 번만" 이 필요조건이고, 그게 정확히 이 훅의 자리다.

### 2-4. `ApplicationRunner` vs `CommandLineRunner`

둘 다 스프링 부트(`org.springframework.boot`) 제공, **실행 시점 동일**. 인자 타입만 다름:

- `ApplicationRunner` → `ApplicationArguments` : `--key=value` 옵션이 파싱돼 있음
  (`args.getOptionValues("key")`, `args.containsOption("key")`).
- `CommandLineRunner` → `String...` : 원본 인자 배열 그대로.

여러 개면 `@Order(n)` 또는 `Ordered` 구현으로 실행 순서 제어. `ApplicationRunner` 와
`CommandLineRunner` 가 섞여 있어도 `@Order` 값으로 함께 정렬된다.

### 2-5. 예외가 나면?

`callRunners()` 에서 러너가 예외를 던지면 스프링 부트는 그 예외를 다시 던지고,
`SpringApplication.run()` 이 실패하며 **애플리케이션이 종료된다** (`ApplicationFailedEvent` 발행).

→ `EsBootstrap` 에서 `try/catch` 로 감싼 이유: ES 가 잠깐 안 떠 있다고 해서 앱 기동
자체가 막히면 안 되기 때문. 실패해도 `log.warn` 만 남기고 앱은 정상 기동, 이후 수동
`GET /api/v1/perfume/migrate` 로 복구 가능.

### 2-6. `@Profile("local")` 은 언제 평가되나 — "정적 조건" vs "런타임 조건"

- `@Profile`, `@ConditionalOnProperty`, `@ConditionalOnClass` 등 **`@Conditional` 계열**은
  `context.refresh()` 의 **빈 정의 등록 단계**(`ConfigurationClassPostProcessor`)에서 평가된다.
  이때 볼 수 있는 건 Environment(활성 프로파일), 클래스패스, 다른 빈 정의 유무 같은
  **정적인 사실**뿐이다. → 조건 불충족이면 그 빈은 아예 컨테이너에 등록되지 않음.
- "ES 인덱스가 비어 있는가?" 는 외부 시스템의 **런타임 상태**라서 `@Conditional` 로는
  볼 수 없다. 그래서 이 검사는 반드시 **러너의 `run()` 메서드 본문 안**에서 실제로
  ES 에 질의해서 해야 한다.

정리하면 `EsBootstrap` 에는 두 종류의 조건이 공존한다:

```java
@Profile("local")                 // (A) 정적 조건: 빈 등록 시점 — local 프로파일에서만 존재
...
if (count == 0) { ... }           // (B) 런타임 조건: 실행 시점 — 인덱스가 비었을 때만 적재
```

### 2-7. 부트 이벤트 타임라인 요약

```
ApplicationContextInitializedEvent
ApplicationPreparedEvent
── context.refresh() ──
  ContextRefreshedEvent
  (내장 톰캣 start, 포트 LISTEN)
ApplicationStartedEvent
── callRunners() ──  ← ApplicationRunner / CommandLineRunner (EsBootstrap)
ApplicationReadyEvent
(장애 시) ApplicationFailedEvent
```

---

## 1-5. 후속: 포트 변경으로 향수 이미지가 안 뜨던 문제

### 증상
검색은 되는데 향수 사진이 하나도 안 뜸.

### 원인
`perfume.image_route` 컬럼에 이미지 주소가 **절대 URL로 하드코딩**돼 있었음:
`http://localhost:8080/perfume-images/{id}.{ext}` — 1315건 전부.
1-1에서 앱을 8081로 옮겼으므로 프론트가 `:8080` 이미지를 요청 → 그 포트엔 MiniTool
백업 서비스가 있어 HTTP 응답을 안 줌 → 이미지 무한 대기/실패.

- `http://localhost:8081/perfume-images/1.webp` 는 200 OK (정적 서빙·시큐리티 정상)
- 이 URL을 만든 곳: `scripts/image_route_local.sql` (생성물), `scripts/scrape_bysuco_images.py`
  의 `PUBLIC_PREFIX` 기본값
- `diary_image`, `recommend_result` 등 다른 테이블엔 `:8080` URL 없음 (perfume만)
- ES `perfumes` 인덱스에도 이미 1315건이 `:8080` URL로 들어가 있었음

### 조치 (`:8080` → `:8081` 일괄 변경)

1. **DB** — 트랜잭션으로 1315건 갱신:
   ```sql
   UPDATE perfume
      SET image_route = REPLACE(image_route, 'http://localhost:8080/', 'http://localhost:8081/')
    WHERE image_route LIKE 'http://localhost:8080/%';
   ```
2. **ES** — 낡은 인덱스 삭제: `DELETE http://localhost:9200/perfumes`.
   다음 앱 기동 때 `EsBootstrap`(2장 참고)이 `count == 0` 을 보고 DB에서 재적재 →
   자동으로 `:8081` URL이 색인됨. **→ 이 수정 반영하려면 앱 재시작 필요.**
3. **스크립트** — 재실행 시 일관성 유지:
   - `scripts/scrape_bysuco_images.py`: `PUBLIC_PREFIX` 기본값 `:8080` → `:8081`
     (환경변수 `PUBLIC_PREFIX` 로 계속 오버라이드 가능)
   - `scripts/image_route_local.sql`: 1315줄 전부 `:8081` 로 치환
   - `scripts/image_route_backup.sql` 은 건드리지 않음 (스크랩 이전 외부 URL 복원용)
4. `application-local.yaml` 주석도 `:8081` 로 갱신.

### 남은 부채
`image_route` 에 `host:port` 를 하드코딩하는 구조 자체가 취약. 포트가 또 바뀌면 같은 일이
반복된다. 장기적으로는 상대경로(`/perfume-images/{id}.{ext}`) 저장 + 프론트가 API base URL
기준으로 렌더하는 방식이 맞다.

---

## 3. 참고 파일

- `BE/fragrance/docker-compose.yml` — 로컬 ES
- `BE/fragrance/src/main/resources/application-local.yaml` — 포트 8081, 정적 리소스 경로
- `BE/fragrance/src/main/java/com/example/fragrance/perfume/bootstrap/EsBootstrap.java` — 자동 마이그레이션 훅
- `BE/fragrance/src/main/java/com/example/fragrance/perfume/service/PerfumeSearchService.java` — `migrateAllToElasticsearch()`
- `BE/fragrance/src/main/java/com/example/fragrance/perfume/controller/PerfumeController.java` — `GET /api/v1/perfume/migrate` (수동, 인증 필요)
