# 아키텍처 의사결정 기록 (ADR)

작성일: 2026-09-05

이 문서는 DB 안정성 리팩토링 + 향수 데이터 동기화 파이프라인 작업 중 내린 주요 기술
선택들을, "왜 그걸 골랐는지"와 "다른 대안은 뭐가 있었고 왜 안 골랐는지"를 중심으로
정리한 것이다. 각 항목은 상황(Context) → 결정(Decision) → 검토한 대안(Alternatives) →
트레이드오프(Consequences) 순서로 적었다.

관련 문서: [`db-stability-notes.md`](db-stability-notes.md)(개념 학습용 원본 분석),
[`.claude/docs/db-stability-refactor.md`](../.claude/docs/db-stability-refactor.md),
[`.claude/docs/perfume-data-sync-and-cf-design.md`](../.claude/docs/perfume-data-sync-and-cf-design.md)
(실제 적용 기록, 더 상세함).

---

## ADR 1. 스키마 버전 관리 도구 — Flyway

### Context
스키마가 `src/main/resources/SQL/향기록.sql`(수동 `pg_dump` 스냅샷) 하나로만 문서화돼
있었고, 이 파일엔 `CREATE TYPE gender_enum` 같은 enum 정의조차 빠져 있어서 이 파일만으론
DB를 재현할 수 없는 상태였다(문서와 실제 DB 사이에 이미 드리프트 존재). 스키마 변경 이력도
전혀 추적이 안 됐다.

### Decision
Flyway를 도입했다. `build.gradle`에 `flyway-core` + `flyway-database-postgresql` 런타임
의존성(Spring Boot 기동 시 자동 적용)과, CLI 작업용 Gradle 플러그인을 추가했다. 기존
DB(이미 스키마가 있는 상태)는 `baseline-on-migrate: true` + `baseline-version: 4`로
설정해서, `V1~V4`를 재실행하지 않고 "이미 적용됨"으로 기록만 하게 했다.

### Alternatives
- **Liquibase**: DB에 종속적이지 않은 XML/YAML/JSON 기반 changelog를 쓴다는 장점이
  있지만, 이 프로젝트는 처음부터 끝까지 PostgreSQL만 쓸 예정이라 DB 독립성이 실익이
  없고, 오히려 순수 SQL보다 문법이 한 겹 더 있어 읽기/디버깅이 번거로워진다. 기각.
- **수동 SQL 스크립트를 계속 그대로 유지**: 지금 겪고 있는 문제(드리프트, 이력 없음)의
  원인 그 자체라서 대안이 될 수 없음. 기각.
- **도구 없이 그냥 조심해서 관리**: MyBatis는 JPA/Hibernate처럼 엔티티로부터 DDL을
  자동 생성해주는 기능이 없어서, "도구 없이"는 결국 수동 SQL 방식으로 되돌아간다. 기각.

### Consequences
- `flyway_schema_history` 테이블이 생기고, 이후 모든 스키마 변경은 새 `V{n}__*.sql`
  파일로만 해야 한다는 규율이 필요해짐(팀 전체가 이 규칙을 지켜야 효과가 있음).
- 기존 DB에 대한 "베이스라인" 처리가 한 번 필요했다(신규 DB는 문제 없이 V1부터 실행됨).

---

## ADR 2. `member.id` UNIQUE 제약과 soft delete 충돌 — Partial Unique Index

### Context
`member`는 soft delete(`is_delete` 플래그, 행 유지) 방식인데 `member.id`(로그인 아이디)에
일반 `UNIQUE` 제약이 걸려 있었다. 회원가입 중복확인은 `is_delete=false` 필터를 쓰기 때문에
탈퇴한 아이디가 "사용 가능"으로 보이지만, 실제 INSERT는 여전히 살아있는 제약에 걸려
예외가 발생하는 상태였다(앱 로직과 DB 제약이 서로 다른 대답을 하는 상황).

### Decision
```sql
ALTER TABLE public.member DROP CONSTRAINT member_id_key;
CREATE UNIQUE INDEX member_id_active_key ON public.member (id) WHERE is_delete = false;
```
Postgres의 partial unique index로 "삭제 안 된 행들끼리만" 유니크를 보장하도록 바꿨다.

### Alternatives
- **하드 삭제로 전환**: 회원 탈퇴 시 행 자체를 지우면 이 충돌 자체가 사라지지만, 이미
  `diary`/`review`/`recommend_result` 등 여러 테이블이 `member_id`를 FK로 참조하고
  있어서 참조 무결성이 깨지고, 탈퇴 회원의 활동 이력(감사/통계 목적)도 사라진다. 기각.
- **탈퇴 시 id에 접미사 붙이기** (예: `id = id || '_deleted_' || now()`): 제약 충돌은
  피하지만 원본 데이터를 변형시켜서, 이후 그 회원 데이터를 조회/복구해야 할 때(예:
  법적 보관 의무, 재가입 이력 조회) `id` 컬럼만으로는 원래 아이디를 알 수 없게 된다. 기각.
- **탈퇴 회원을 별도 아카이브 테이블로 이동**: 원본 테이블에서 완전히 빼내는 방식인데,
  FK로 참조하는 다른 테이블들(`diary` 등)이 여전히 원본 `member_id`를 가리켜야 해서
  구조가 오히려 복잡해지고, "탈퇴 회원 데이터 조회"가 조인 하나 더 필요한 일이 됨. 기각.

### Consequences
- Postgres 전용 기능(partial index)이라 다른 DB로 이전 시 재검토 필요하지만, 이
  프로젝트는 PostgreSQL 고정이라 문제 없음.
- 재현 테스트(탈퇴 아이디 재가입 성공 / 활성 아이디 중복 차단)로 검증 완료.

---

## ADR 3. 향수 데이터 변경 감지 — DB 트리거 + 트랜잭셔널 아웃박스

### Context
`perfume`/`perfume_accord`/`perfume_note`/`accord`/`note`를 수정해도 `perfume_embedding`
(ML 임베딩), Elasticsearch 검색 인덱스, CF 추천 모델이 자동으로 안 따라가는 문제가 있었다.
결정적으로, 이 프로젝트에서 향수 데이터 수정은 **관리자 페이지 같은 앱 CRUD를 거치지 않고
SQL을 직접 실행하는 방식**으로 이뤄져 왔다(`scripts/image_route_local.sql` 등 전례).

### Decision
Postgres `TRIGGER` + `outbox_events` 테이블(트랜잭셔널 아웃박스 패턴)을 택했다.
`perfume`/`perfume_accord`/`perfume_note`는 자기 자신의 `perfume_id`를 그대로 기록하고,
`accord`/`note`는 연결 테이블을 조인해서 영향받는 향수 전체에 이벤트를 뿌린다(어코드 이름
하나를 바꾸면 그걸 쓰는 향수 전부의 텍스트가 바뀌므로).

### Alternatives
- **애플리케이션 레벨 이벤트** (관리자 서비스 메서드 안에서 이벤트 발행): 나중에 관리자
  페이지가 생기면 구현이 더 간단해지는 장점이 있지만, **SQL을 직접 실행하는 경로는 절대
  못 잡는다** — 애초에 이 경로가 지금 이 프로젝트의 실제 편집 방식이라 결정적 결함. 관리자
  페이지가 생기더라도 SQL 직접 수정이 완전히 없어질 거라 보장할 수 없어서 기각. (자세한
  논의는 `.claude/docs/perfume-data-sync-and-cf-design.md` 3번 항목 참고 — 처음엔 이
  방식으로 가려다가 편집 경로를 다시 짚어보고 트리거로 최종 변경함.)
- **CDC (Change Data Capture, 예: Debezium + Kafka)**: DB의 WAL을 직접 tail해서 모든
  변경을 감지하는, 업계에서 이 문제의 "정석" 해법. 트리거처럼 쓰기 트랜잭션 안에서
  동기적으로 실행되지 않고, 테이블마다 트리거를 관리할 필요도 없다는 장점이 있다. 다만
  Kafka/Debezium 인프라를 새로 구축해야 해서, 지금 이 프로젝트 규모(향수 1300여 건, 팀
  프로젝트)엔 오버엔지니어링이라 판단해 기각. 데이터/트래픽 규모가 커지면 재검토할 후보로
  남겨둠.
- **주기적 전체 스캔/diff** (예: `modify_time` 컬럼을 주기적으로 폴링해서 마지막 스캔
  이후 바뀐 행 찾기): 구현은 제일 간단하지만 (a) 삭제를 감지 못 하고(행이 사라지면 diff로
  못 찾음), (b) 무엇이 바뀌었는지(어떤 컬럼) 정밀하게 모름, (c) 폴링 주기만큼 항상 지연이
  생김. 기각.

### Consequences
- DB 안에 로직(PL/pgSQL 트리거 함수)이 생겨서, 애플리케이션 코드보다 버전관리/테스트가
  손이 더 간다(Flyway 마이그레이션 파일로는 관리되지만, IDE 자동완성/디버거의 도움을
  못 받음).
- 트리거가 쓰기 트랜잭션 안에서 동기 실행되므로, 원본 테이블에 대한 쓰기 자체에 아주
  약간의 오버헤드가 생긴다(아웃박스 테이블에 INSERT 하나 추가되는 정도라 미미함).
- 여러 향수를 한 번에 배치 수정하거나, 어코드/노트 하나가 많은 향수에 쓰이는 경우
  한 번의 원본 수정이 아웃박스에 수십~수백 건을 만들 수 있음 — 이건 버그가 아니라 설계상
  의도된 동작이지만, 워커 쪽에서 배치 처리 상한을 두는 이유가 됨(ADR 4 참고).

---

## ADR 4. 아웃박스 소비 워커의 위치 — Spring Boot `@Scheduled`

### Context
아웃박스에 쌓인 이벤트를 실제로 처리(ML 재임베딩 요청 + ES 반영)할 주체가 필요했다.

### Decision
Spring Boot(`OutboxWorker`, `@Scheduled(fixedDelay=10_000)`)에 뒀다. ML(FastAPI)에는
"향수 1건만 재임베딩"하는 신규 엔드포인트(`POST /api/v1/embed/perfume/{id}`)만 추가하고,
실제 폴링/오케스트레이션은 스프링이 담당한다.

### Alternatives
- **Python(ML) 쪽에 워커를 두기**: 임베딩 모델을 이미 ML이 들고 있어서 자연스러워
  보이지만, ES 인덱스 매핑/색인 로직(초성 검색용 `chosung` 생성 등)이 이미 Java
  (`PerfumeSearchService`)에 있어서, 워커를 파이썬에 두면 오히려 ES 관련 로직을 두 언어에
  나눠 관리하게 된다. 기각.
- **완전히 별도의 워커 프로세스/메시지 큐(Kafka, RabbitMQ 등)**: "정석"에 더 가깝고 대량
  트래픽에 유리하지만, 지금 이 프로젝트엔 이미 있는 Spring 스케줄러만으로 충분해서 별도
  인프라를 추가할 실익이 없음. 기각(ADR 3의 CDC와 같은 이유).

### Consequences
- Spring → FastAPI 네트워크 홉이 하나 더 생긴다. 다만 이미 추천 기능(`RecommendServiceImpl`)이
  같은 방식으로 FastAPI를 호출하고 있어서 새로운 패턴은 아니다.
- 워커 전용 `RestTemplate`에 명시적 타임아웃(연결 5초/읽기 30초)을 걸었다 — 기존 공용
  `RestTemplate`(다른 기능들이 쓰는)엔 타임아웃이 없다는 걸 이전에 발견했었는데, 그걸
  그대로 재사용했다면 ML이 응답 없을 때 `@Scheduled` 스레드 자체가 영원히 막혀서 이후
  모든 폴링이 멈추는 문제가 생겼을 것.

---

## ADR 5. 실패 처리 — 고정 횟수 재시도 + Dead Letter

### Context
ML 호출이 실패하면(서버 다운, 타임아웃) 아무 제한 없이 재시도하도록 처음 만들었더니,
실제로 ML을 잠깐 내려서 테스트해보니 (a) 10초마다 같은 에러 로그가 무한히 찍히고,
(b) `findUnprocessed`가 오래된 순으로 가져오는 특성상 실패하는 항목이 계속 배치에 다시
뽑히면서 새로 들어온 다른 항목들의 처리를 뒤로 미루는(head-of-line blocking) 문제가
실제로 재현됐다.

### Decision
`outbox_events`에 `retry_count`/`given_up`/`last_error` 컬럼을 추가하고, 실패할 때마다
`retry_count`를 늘리다가 `MAX_RETRIES(5)`를 넘으면 `given_up=true`로 표시해서 더 이상
`findUnprocessed`에 안 걸리게 했다. 간단한 Dead Letter Queue(DLQ) 패턴이다.

### Alternatives
- **무한 재시도 (원래 상태)**: 위에서 설명한 로그 폭탄 + 대기열 정체 문제를 실제로
  겪었으므로 기각.
- **실패 시 즉시 포기(재시도 없음)**: ML 서버가 배포 중 잠깝 재시작되는 것처럼 아주 흔한
  일시적 장애에도 복구가 안 되는 건 너무 손해가 큼. 기각.
- **Exponential backoff** (재시도 간격을 2배씩 늘려가기, 예: 10초 → 20초 → 40초...):
  poison pill 문제를 더 정교하게 완화할 수 있는 다음 단계 개선안이지만, 지금 규모에선
  고정 횟수 제한만으로 충분하다고 판단해 미루기로 함(향후 개선 후보로 문서에 남김).

### Consequences
- `given_up=true`가 된 이벤트는 자동으로 다시 시도되지 않는다 — 실무의 DLQ redrive와
  마찬가지로, 원인을 사람이 확인한 뒤 의도적으로
  `UPDATE outbox_events SET processed=false, given_up=false, retry_count=0 WHERE given_up=true`
  같은 쿼리로 되돌려야 한다. 이 "재실행" 자체는 아직 API/스크립트로 안 만들었고 수동 SQL로
  해야 함 — 후속 작업 후보.

---

## ADR 6. CF(협업 필터링) 추천 재적재 — 주기적 배치

### Context
CF 추천 모델(`cf_recommender.py`)이 FastAPI 서버 시작 시 딱 한 번만 `load()`되고, 이후
유저 좋아요/소장 변경이나 향수 어코드 수정이 전혀 반영되지 않는 문제를 발견했다(같은
문제가 `perfume_rows`에도 있음을 추가로 발견 — `.claude/docs/perfume-data-sync-and-cf-design.md`
2-8 참고).

### Decision
주기적으로 `load()`를 다시 호출해서 모델을 새로고침하는 방식으로 가기로 했다(1차: 단순
시간 기반 스케줄, 이후 필요해지면 "변경 감지 dirty flag + 최소 간격 디바운스"로 고도화).
아직 실제 구현 전, 설계만 확정.

### Alternatives
- **변경 이벤트마다 즉시 재학습**: `cf_recommender.py`의 `user_idf`(전체 유저 수 기준
  IDF 가중치)와 `NearestNeighbors.fit()`이 유저 전체 매트릭스에 대한 전역 재계산이라,
  좋아요 하나 바뀔 때마다 이걸 매번 다시 돌리는 건 낭비가 심하고 재학습 폭주 위험도 있음.
  기각.
- **온라인/증분 학습이 가능한 알고리즘으로 교체** (예: 근사 최근접 탐색 인덱스를 증분
  삽입 가능한 구조로 바꾸기): 진짜 근본적인 해법이지만 추천 알고리즘 자체를 새로 설계하는
  훨씬 큰 작업이라, 지금 규모(회원 222명, 향수 1315건)에 비해 투자 대비 효과가 낮다고
  판단해 미룸.

### Consequences
- 재적재 주기만큼의 지연이 항상 존재한다(추천 결과가 최대 주기만큼 옛날 데이터를 반영할
  수 있음). 검색/임베딩과 달리 추천은 이 정도 지연이 통상적으로 용인되는 영역이라고 보고
  받아들이기로 함.
- 아직 구현 전 — 실제 스케줄러 코드와 CF 쪽 `perfume.is_delete` 필터 누락 버그(발견됨,
  별도 문서화)를 같이 손봐야 함.

---

## ADR 7. pgvector 컬럼 쓰기 방식 — 텍스트 CAST

### Context
`perfume_embedding`의 벡터 컬럼(`vector(1024)`)에 파이썬 리스트를 그대로 바인딩하려
했으나, 이 프로젝트엔 `pgvector` 파이썬 패키지(어댑터 등록용)가 설치돼 있지 않아서
psycopg2가 리스트를 일반 배열 리터럴로 잘못 변환해버리는 문제를 확인했다(기존
`scripts/embed.py`도 같은 이유로 이미 깨져 있었을 가능성이 높음 — SQLAlchemy 2.0의
`Connection`에 `.cursor()`가 없다는 별개의 버그와 함께 발견).

### Decision
벡터를 `'[0.1,0.2,...]'` 형식의 문자열로 직접 변환해서 `CAST(:x AS vector)`로 바인딩하는
방식을 택했다(`ML/app/db/database.py`의 `_to_pgvector_literal`).

### Alternatives
- **`pgvector` 파이썬 패키지 설치 + `register_vector(conn)` 호출**: 더 "정석"에 가깝고
  넘파이 배열을 자동으로 변환해주지만, 새 의존성을 추가해야 하고 이번 작업 범위(향수 1건
  재임베딩 API 하나 추가)에 비해 변경 범위가 커짐. 지금은 최소 변경으로 가고, 나중에
  임베딩 관련 코드를 더 손볼 일이 생기면 그때 도입을 재검토하기로 함.

### Consequences
- 벡터 차원이 커지면(지금 1024) 문자열 변환/파싱 오버헤드가 약간 있지만, 임베딩 계산
  자체(모델 추론)에 비하면 무시할 수준.
- `fetch_perfume_by_id`/`upsert_perfume_embedding`이 SQLAlchemy의 `text()` + `execute()`
  컨벤션(이 프로젝트 `database.py`의 기존 스타일)을 따르도록 맞췄다.

---

## ADR 8. `perfume_rows` 캐시 재로드 — Dirty 체크 + 최소 간격 제한

### Context
ML의 `/recommend/text`, `/recommend/image`가 유사도 계산에 쓰는 `perfume_rows`도
`cf_recommender`와 같은 문제(서버 시작 시 1회 로드, 이후 절대 갱신 안 됨)를 갖고 있었다
(ADR 6 Context에서 같이 발견). ADR 6에서는 "1차: 단순 시간 기반, 2차: dirty flag + 디바운스"로
단계적으로 가기로 했었는데, 실제 구현 단계에서 바로 2차로 가기로 결정을 바꿨다.

### Decision
`outbox_events` 테이블을 그대로 "dirty 신호"로 재사용하는 방식을 택했다. 새 컬럼이나
별도 상태 저장 없이, "마지막 재로드 이후로 처리 완료된 이벤트가 있는가"를 매번 쿼리로
확인한다(`has_outbox_activity_since`). 백그라운드 루프가 `PERFUME_ROWS_DIRTY_CHECK_SECONDS`
(5초)마다 이 확인을 하고, dirty이면서 마지막 재로드로부터 `PERFUME_ROWS_RELOAD_SECONDS`
(30초, 최소 간격) 이상 지났을 때만 실제로 `load_perfume_rows()`를 다시 호출해
`app.state.perfume_rows`를 통째로 교체한다(블루-그린 스왑).

### Alternatives
- **순수 시간 기반 스케줄만** (당초 ADR 6의 1차안): 구현이 제일 단순하지만, 바뀐 게
  하나도 없어도 매번 전체(1314건, 실측 0.6~1초)를 다시 읽어오는 낭비가 생김. 실제
  구현하면서 "이왕 만드는 거 처음부터 낭비 없는 방식으로 가자"고 판단해 1차안을
  건너뛰고 바로 아래 방식으로 감.
- **Spring(OutboxWorker)이 향수 갱신 직후 ML에 "지금 재로드해" 호출**: 이벤트 즉시 반응
  이라 제일 빨라 보이지만, `perfume_rows` 재로드는 건별이 아니라 전체를 다시 읽는
  배치성 작업이라(ADR 6과 동일 이유) 향수 여러 건이 짧은 시간에 바뀌면 똑같은 전체
  재로드가 여러 번 겹쳐 도는 문제가 생김. 또한 스프링이 ML의 내부 캐싱 전략(언제
  새로고침할지)까지 알아야 해서 두 서비스가 불필요하게 얽히게 됨. 기각.
- **아예 새 "dirty" 테이블/컬럼을 만들기**: 더 명시적이지만, 이미 있는 `outbox_events`가
  "무언가 바뀌었다"는 사실을 정확히 기록하고 있어서 그대로 재사용하는 게 중복을 피하는
  선택. 기각(불필요).

### Consequences
- `outbox_events.processed_at`을 조회 조건으로 쓰므로 인덱스(`V7__outbox_processed_at_index.sql`,
  `WHERE processed = true` 부분 인덱스)를 추가로 만들었다.
- dirty 체크 자체가 5초마다 도는 추가 쿼리이긴 하지만 `EXISTS` + 인덱스라 매우 저렴함.
- 검증 완료: 변화 없을 때 재로드 안 일어남 확인, `outbox_events`에 처리완료 행을 직접
  넣어 다음 체크 주기(2초 이내)에 재로드 발동하는 것까지 확인(1314건, 1.03s).
- CF 쪽(`cf_recommender.load()`) 재로드도 아직 미구현인데, 이 구현을 그대로 템플릿
  삼아 복제/일반화하면 될 것으로 봄 — ADR 6은 그 상태로 유지.

---

## 아직 결정 안 하고 남겨둔 것

- **ES 전체 재색인(`migrateAllToElasticsearch`) 방식**: 트리거 경로로 들어오는 개별
  변경은 ADR 3/`syncPerfumeToElasticsearch`로 삭제까지 정확히 반영되도록 이미 해결됨
  (검증 완료 — soft-delete 시 ES 문서 삭제, 복구 시 재생성 둘 다 확인). 다만
  `migrateAllToElasticsearch()`(전체 재색인 API) 자체는 여전히 upsert-only라 이걸로
  전체 재색인을 돌리면 그새 삭제된 향수가 안 지워지는 문제가 남아있음. 업계 표준인
  "Reindex + Alias Swap"(새 인덱스에 전체를 새로 채우고 alias만 원자적으로 교체) 방식을
  검토 중 — 다음 ADR 후보.
- **`PerfumeSearchService.syncPerfumeToElasticsearch`에 타임아웃 없음**: ML 호출 쪽(ADR 4)엔
  전용 타임아웃을 걸었는데, 바로 다음에 실행되는 ES 호출엔 아직 명시적 타임아웃이 없음
  (Spring Data Elasticsearch 클라이언트 기본값에 의존 중). 발견만 하고 아직 미수정.
- **CF 모델 교체 시 Blue-Green 스왑**: 지금 설계(`load()` 재호출)는 재학습 도중 기존
  서빙을 막을 위험이 있음. `app.state.cf_recommender`를 새 인스턴스로 다 만든 뒤
  참조만 교체하는 방식이 더 안전 — 다음 ADR 후보.
