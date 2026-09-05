# 향수 데이터 정합성 + CF 추천 재적재 설계 논의

작성일: 2026-09-05
상태: **임베딩 동기화 파이프라인(트리거 → 아웃박스 → 워커 → ML 단건 임베딩 → DB 반영)
end-to-end 검증 완료.** 재시도/포기(DLQ) 로직도 구현 완료. 남은 건 ES 단건 반영과 CF
재적재 — 6번 체크리스트 참고.

---

## 배경

향수 데이터를 정리하다가 "perfume 테이블을 고쳐도 임베딩/검색/추천에 반영이 안 된다"는 걸
직접 겪었고, 여기서 시작해서 관련 파이프라인 전체(임베딩, ES, CF 추천)를 훑어봄. 나중에
프로덕션 레벨 관리자 페이지(향수 추가/수정/삭제)를 만들 계획이 있어서, 그때를 대비한
설계까지 같이 정리.

---

## 1. 지금 구조 — 서로 안 이어진 3개의 파이프라인

```
perfume (Postgres)
  ├─→ perfume_embedding (Postgres, pgvector)   ML/scripts/embed.py, 수동 실행, 전체 재계산
  ├─→ Elasticsearch `perfumes` 인덱스           PerfumeSearchService.migrateAllToElasticsearch()
  │                                              수동 호출(GET /api/v1/perfume/migrate) 또는
  │                                              로컬 기동 시 인덱스가 비어있을 때만 자동(EsBootstrap)
  └─→ CF 추천 모델 (ML, 메모리)                 CfRecommender.load(), FastAPI 서버 시작 시 딱 1회
```

셋 다 **"사람이 순서대로 수동 실행"**하는 구조이고, `perfume`이 바뀌었다는 사실을 서로에게
알려주는 코드는 전혀 없음. `perfume` 수정 자체도 지금은 앱 API가 아니라 SQL을 직접
실행하는 방식(`scripts/image_route_local.sql` 등 전례).

---

## 2. 발견한 문제들

### 2-1. 데이터 정합성 붕괴 (직접 겪은 것)
`perfume`을 고쳐도 `perfume_embedding`/ES는 고친 시점의 스냅샷이 아니라 마지막으로
스크립트를 돌렸던 시점에 멈춰있음. `recommender.py`가 추천 유사도 계산에
`perfume_embedding`을 직접 읽으므로, 고친 내용이 추천 이유/유사도에 반영 안 됨. 검색도
마찬가지로 옛날 이름/브랜드/노트로 계속 나옴.

### 2-2. 구조적으로 사람이 기억해야만 하는 문제
`perfume` 수정 행위와 `embed.py`/`migrate` 실행 사이에 코드 레벨 연결이 없음 → "이번엔
깜빡했다"가 아니라 애초에 언젠가는 어긋나게 설계된 시스템. 신규 팀원이 SQL 하나만 실행해도
100% 재현됨.

### 2-3. (신규 발견) ES는 삭제를 절대 반영하지 않음
`findAllForElasticsearch`(`PerfumeMapper.xml:126-141`)는 `WHERE p.is_delete = FALSE`로
살아있는 향수만 가져오지만, `migrateAllToElasticsearch()`는 그 결과를
`elasticsearchOperations.save(allPerfumes)`로 **upsert만** 함(`PerfumeSearchService.java`).
향수를 soft-delete해도 ES 문서는 절대 안 지워짐 → "검색되는데 클릭하면 없는 향수"가 발생
가능.

### 2-4. 매번 전체 재계산
향수 1건만 고쳐도 `embed.py`는 전체(1315건)를 다시 모델에 태우고, `/migrate`도 전체를
다시 ES에 씀. 지금 규모(1315건)는 참을 만해도 데이터가 늘면 "향수 하나 고치는 데 몇 분씩"
걸리는 구조.

### 2-5. 3단계 사이 원자성 없음
SQL 수정 → `embed.py` → `/migrate`를 순서대로 다 실행해도, 서로 다른 시점에 끝나는 별개
프로세스라 그 사이엔 항상 불일치 구간이 생김.

### 2-6. (신규 발견) CF 추천 모델은 서버 시작 시 1회 로드된 뒤 절대 갱신되지 않음
`ML/app/main.py`의 `lifespan()`에서 `cf_recommender.load()`가 **딱 한 번**만 호출됨. 코드
전체에 `reload`나 주기적 재적재 로직이 없음(grep으로 확인). 즉:
- 관리자가 향수 어코드를 수정해도
- 사용자가 좋아요/소장을 새로 해도
- 새 회원이 가입해도

→ ML(FastAPI) 서버를 재시작하기 전까지 CF 추천 결과에 전혀 반영 안 됨. 2-1~2-5보다 더
조용한 문제 — 서버가 몇 주째 잘 떠 있으면 아무도 신선도 문제를 의심하지 않을 수 있음.

### 2-7. (신규 발견) CF의 데이터 조회 함수들이 `perfume.is_delete`를 전혀 필터링 안 함
`ML/app/db/database.py`의 `fetch_user_likes`, `fetch_user_accord_tf`,
`fetch_perfume_accord_map` 세 함수 전부 `perfume.is_delete`(또는 `perfume_accord.is_delete`)
를 확인하지 않음. `fetch_perfume_accord_map`은 아예 어떤 `is_delete` 조건도 없음. 결과:
나중에 관리자 "삭제" 기능이 생겨도, CF 쪽에선 재적재를 아무리 자주 해도 **삭제된 향수가
계속 추천 후보로 남고, 그 향수를 과거에 좋아요했던 유저의 취향 벡터에도 계속 반영됨.**
이건 재적재 주기와 무관한 별도 버그 — 주기를 아무리 짧게 잡아도 필터 자체가 없으면
안 고쳐짐.

### 2-8. (신규 발견) `perfume_rows`도 CF와 똑같이 서버 시작 시 1회만 로드되고 절대 갱신 안 됨
`/recommend/text`, `/recommend/image`(텍스트/이미지 기반 추천)가 유사도 계산에 쓰는 향수
벡터들이 `perfume_embedding` 테이블을 매 요청마다 읽는 게 아니라, `main.py`의 `lifespan()`
에서 `app.state.perfume_rows = load_perfume_rows()`로 **딱 한 번**만 읽어 메모리에 캐싱됨
(`ML/app/services/recommender.py:32` `load_perfume_rows()`, 사용처는
`ML/app/api/v1/recommend.py:58,104`). `cf_recommender.load()`와 완전히 같은 패턴 — 이걸로
이 프로젝트에서 "서버 시작 시 1회 캐싱, 이후 절대 갱신 안 됨" 사례가 `cf_recommender`,
`accord_embeddings`, `perfume_rows` 이렇게 **3개**로 늘어남.

**왜 지금 중요한가**: 아웃박스 워커가 `perfume_embedding` 테이블을 완벽하게 갱신해도,
ML 서버가 재시작되기 전까진 `/recommend/text`/`/recommend/image`가 그 갱신된 값을 못 봄 —
DB는 맞는데 실제 서빙은 옛날 값으로 나가는 상태. **CF 재적재(4번 항목)와 같은 해법
(주기적 재로드, 가능하면 블루-그린 스왑)을 `perfume_rows`에도 그대로 적용해야 함.** 별도
작업으로 스코프에 추가만 해두고, 지금 진행 중인 3번 조각(ML 단건 임베딩 엔드포인트)과는
독립적으로 나중에 처리하기로 함(2026-09-05).

---

## 3. 향수 임베딩/ES 쪽 — 해결 방향

### 옵션 비교

| | A. 스크립트 통합 | B. 부분 갱신 | C. 이벤트/아웃박스 |
|---|---|---|---|
| 아이디어 | SQL → `embed.py` → `/migrate` 3단계를 커맨드 하나로 | 바뀐 `perfume_id`만 재임베딩/재색인 | `perfume` 변경이 감지되면 자동으로 뒤따라감 |
| 지금 코드 기준 필요 작업 | 스크립트 하나만 새로 작성 | `fetch_perfumes()`에 id 필터, ES 단건 조회/upsert 매퍼 신규 | DB 트리거 + 아웃박스 테이블 + 별도 워커 |
| 장점 | 제일 빠르게 구현 | 비용이 수정 건수에 비례 | "깜빡함" 자체가 원천 차단, 편집 경로 안 가림 |
| 단점 | 여전히 전체 재계산, 사람이 실행해야 함 | 삭제 미반영은 안 고쳐짐, 구현 범위 큼 | 구현 난이도 제일 높음, ML에 단건 임베딩 API 신규 필요 |
| 적합 상황 | 지금처럼 SQL 직접 수정이 가끔 있을 때 | 데이터/편집 빈도가 계속 늘 때 | **편집 경로가 여러 개(SQL 직접 + 관리자 페이지)일 때** |

### 결론: DB 트리거 기반 아웃박스로 확정

처음엔 "관리자 페이지가 생기면 앱 이벤트가 더 쉽다"고 판단했었는데, 실제 이 프로젝트의
편집 방식을 다시 짚어보니 **지금도 앞으로도 `perfume`을 SQL로 직접 고치는 경로가 남아있을
가능성이 큼** (관리자 페이지가 생겨도 데이터 정리는 SQL로 하는 습관이 이어질 수 있고,
배치 스크립트도 계속 쓰일 수 있음). 앱 이벤트 방식은 **서비스 메서드를 거친 변경만** 잡고
SQL 직접 수정은 원천적으로 못 잡기 때문에, 최종적으로 **DB 트리거 기반**으로 결정.

- DB 트리거는 "누가 어떤 경로로 고쳤든"(SQL 직접, 관리자 페이지, 나중에 생길 배치
  스크립트까지) 전부 잡아냄 — 애플리케이션 코드에 의존하지 않고 DB 자체가 변경을 감지하므로
  편집 경로가 앱이든 아니든 상관없음.
- 설계:
  ```sql
  CREATE OR REPLACE FUNCTION notify_perfume_change() RETURNS trigger AS $$
  BEGIN
      INSERT INTO outbox_events (perfume_id, event_type, created_at)
      VALUES (COALESCE(NEW.perfume_id, OLD.perfume_id), TG_OP, NOW());
      RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_perfume_change
  AFTER INSERT OR UPDATE OR DELETE ON perfume
  FOR EACH ROW EXECUTE FUNCTION notify_perfume_change();
  ```
  `perfume_accord`(어코드 매핑) 변경도 임베딩/CF에 영향을 주므로 같은 방식의 트리거를
  걸어서 연관된 `perfume_id`를 아웃박스에 남기는 것까지 포함해야 함.

### 3-1. 다중 행 수정 / 어코드·노트 "원본" 테이블 수정 시 파급 처리

- **여러 향수를 한 문장으로 배치 UPDATE/DELETE 하는 경우**: `FOR EACH ROW` 트리거는 영향받은
  행마다 각각 실행되므로 자동으로 잘 처리됨(50건 UPDATE → 아웃박스 50행). 트리거 설계를
  바꿀 필요는 없고, **워커가 한 번 폴링에 처리할 최대 건수**만 정해두면 됨(대량 배치 수정 시
  ML/ES에 한꺼번에 폭탄 요청 가는 것 방지).

- **`perfume_accord`/`perfume_note`(연결 테이블) 수정**: 이 테이블엔 `perfume_id`가 있으므로
  `perfume` 테이블과 동일한 방식의 트리거로 그대로 처리 가능 (`NEW`/`OLD.perfume_id`를 그대로
  아웃박스에 기록).

- **`accord`/`note`(원본 테이블) 수정 — 파급 범위가 다름**: `accord` 테이블엔 `perfume_id`가
  없어서, 어코드 이름 하나를 고치면 **그 어코드를 쓰는 향수 전부**가 영향받음(`embed.py`가
  `accord_name` 텍스트 자체를 임베딩 문장에 넣으므로). 트리거 함수가 조인으로 연관된
  향수를 전부 찾아 아웃박스에 뿌려야 함:
  ```sql
  CREATE OR REPLACE FUNCTION notify_accord_change() RETURNS trigger AS $$
  BEGIN
      INSERT INTO outbox_events (perfume_id, event_type, created_at)
      SELECT pa.perfume_id, 'ACCORD_CHANGED', NOW()
      FROM perfume_accord pa
      WHERE pa.accord_id = COALESCE(NEW.accord_id, OLD.accord_id);
      RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_accord_change
  AFTER UPDATE OR DELETE ON accord
  FOR EACH ROW EXECUTE FUNCTION notify_accord_change();
  ```
  `note`도 `perfume_note` 조인으로 동일 패턴. 어코드 하나가 향수 수백 개에 쓰이면 이 트리거
  하나로 아웃박스에 수백 건이 한 번에 쌓일 수 있어 위 "배치 처리 상한"이 특히 중요해지는
  지점.

- **소비자별 비대칭 — 굳이 다 정교하게 나눌 필요는 없음**: 임베딩/ES는 `accord_name`/
  `note_name` 텍스트를 직접 쓰므로 이름 변경에 반드시 반응해야 하지만, CF(`cf_recommender`)는
  `accord_id`(숫자 PK)만 쓰고 이름 텍스트는 안 쓰므로 **어코드 이름 변경 자체는 CF 매트릭스에
  영향이 없음**(연결 관계 `perfume_accord`가 바뀔 때만 CF가 영향받음). 이 비대칭을 이벤트
  타입별로 정교하게 분기할 수도 있지만, CF는 어차피 저비용 "dirty 체크"만 하는 구조라 지금
  규모에선 그런 최적화 없이 이름 변경 이벤트가 CF 워커에도 섞여 들어와도 비용 부담은 작음 —
  과설계하지 않는 쪽으로 판단.
- 트리거가 "변경이 있었다"를 기록하고 나면, 그 이후(별도 워커가 아웃박스 폴링 → ML에
  단건 재임베딩 요청 → ES 단건 upsert/delete)는 기존 설계와 동일. **바뀌는 건 "누가 아웃박스에
  기록하느냐"뿐**(애플리케이션 코드 → DB 트리거).
- 이 결정으로 2-3(ES 삭제 미반영), 2-4(전체 재계산 비용), 2-5(원자성 부재) 문제를 모두
  해결하면서, 편집 경로가 앱이든 SQL이든 가리지 않는 장점까지 얻음.

---

## 4. CF 추천 쪽 — 해결 방향

### 왜 임베딩/ES와 다르게 처리해야 하나
CF는 향수 하나하나가 독립적인 임베딩과 달리 **전역적인 배치 모델**임:
```python
user_idf = log(total_users / (1 + users_per_accord)) + 1   # 전체 유저 수 기준
knn_model.fit(tfidf_matrix)                                  # 전체 유저 매트릭스에 재학습
```
유저 한 명의 좋아요 하나가 전체 유저의 가중치 계산에 영향을 줄 수 있는 구조라, "이 유저만
업데이트"가 원천적으로 안 됨 → 이벤트 건별 즉시 재학습은 부적합(재학습 폭주 위험).

### 결론: 주기적 배치 재적재 (+ 나중에 dirty flag로 고도화)
- 1차: 순수 시간 기반 스케줄(예: 몇 시간마다 `cf_recommender.load()` 재호출). 지금 규모
  (회원 222명, 향수 1315건)에선 이 정도로 충분히 실용적.
- 이 재적재 하나가 **유저 쪽 변화(좋아요/소장)와 향수 쪽 변화(어코드 수정, 삭제) 둘 다** 동시에
  커버함 — `fetch_*` 함수들이 매번 전체를 다시 읽으므로 별도 트리거 종류를 나눌 필요 없음.
- 2차(나중에, 규모 커지면): "이벤트로 dirty 표시 + 최소 간격 제한(디바운스)" — 관련 테이블이
  바뀌면 `last_changed_at` 갱신만 해두고, 워커가 주기적으로 "dirty 여부 + 마지막 재학습 후
  최소 N분 경과"를 체크해서 재학습. 아무 변화 없으면 재학습 스킵(낭비 없음), 변화가 몰려도
  최소 간격만큼만 텀을 두고 처리(폭주 방지).
- **2-7 버그(삭제 미필터링)는 재적재 주기와 별개로 반드시 고쳐야 함**: `fetch_user_likes`,
  `fetch_user_accord_tf`, `fetch_perfume_accord_map`에 `perfume.is_delete = false` 조건
  추가.
- 참고: 2차(dirty flag)로 갈 때, 3번 항목에서 DB 트리거가 이미 `outbox_events`에 `perfume`/
  `perfume_accord` 변경을 기록해주므로, CF 워커도 **같은 아웃박스 테이블을 dirty 신호로
  재사용**할 수 있음 — 굳이 CF 전용 감지 로직을 별도로 만들 필요 없이, "아웃박스에 미처리
  이벤트가 있다 + 마지막 재학습 후 최소 N분 경과"만 체크하면 됨.

---

## 5. 취향 맵(CF 추천) 실제 요청 흐름 + 타이밍 분석

### 5-1. 전체 경로

```
FE: TasteProfile.tsx
  useEffect(() => { myApi.getPreferenceRecommend() }, [])   ← 페이지 들어갈 때마다 매번 호출,
                                                                캐시 없음
        ↓ GET /api/v1/my/preference-recommend
BE: PreferenceServiceImpl.getMemberRecommend(memberId)
  1. preferenceMapper.countOwnedPerfumes(memberId)          ← DB 쿼리 ①
  2. (소장 0건이면 인기향수 fallback으로 끝, CF 안 탐)
  3. restTemplate.postForObject(fastapiUrl + "/api/v1/recommend/member", ...)  ← 동기 HTTP
        ↓ POST /api/v1/recommend/member
ML(FastAPI): recommend_by_member()
  4. cf = request.app.state.cf_recommender   ← 서버 시작 시 이미 만들어진 모델을 그냥 참조
  5. cf.recommend(member_id)                 ← KNN.kneighbors() 조회 + pandas 연산
                                                (재학습 아니라 추론만, 가벼움)
  6. fetch_perfume_cards(top_ids)            ← DB 쿼리 ②
```

### 5-2. 뭐가 캐시(메모이제이션)되고 뭐가 매번 계산되나

- **무거운 부분 (서버 시작 시 1회, 메모리에 캐시)**: 유저-어코드 행렬, 향수 콘텐츠 벡터,
  IDF 가중치, KNN 모델 자체 (`cf.load()`). 모든 유저의 모든 요청이 이 하나의 결과물을 공유.
- **가벼운 부분 (요청마다 매번)**: 특정 유저 1명의 top-5를 뽑는 것(`cf.recommend(member_id)`)
  자체는 페이지 들어갈 때마다 다시 실행됨. 근데 이미 학습된 모델에 대고 추론만 하는 거라
  가벼움 (재료 손질은 1회, 요리는 매번 — 비유).
- **갱신은 지금 전혀 없음**: `load()`를 다시 부르는 코드가 없어서, 냉장고 재료(모델) 자체는
  서버를 껐다 켜지 않는 한 최초 상태로 고정. (→ 4번 항목의 주기적 재적재로 해결해야 하는 지점)

### 5-3. 타이밍 측정 방법

지금은 이 경로에 타이밍 로그가 전혀 없음. 같은 파일의 `/recommend/image` 엔드포인트는
이미 아래 패턴으로 단계별 시간을 재고 있어서, 그대로 `recommend_by_member`에 이식하면 됨:
```python
t0 = time.time()
top_ids = cf.recommend(req.member_id)
logger.info("[타이밍] CF 추론: %.2fs", time.time() - t0)

t0 = time.time()
cards = fetch_perfume_cards(top_ids)
logger.info("[타이밍] 카드 DB 조회: %.2fs", time.time() - t0)
```
Spring 쪽(`PreferenceServiceImpl`)도 `countOwnedPerfumes` 전후, `restTemplate` 호출 전후를
재면 DB/네트워크/CF추론/카드조회 중 어디가 병목인지 나눠서 볼 수 있음.

블랙박스로 전체 체감 시간만 보려면:
- 브라우저 개발자도구 Network 탭 Timing(TTFB)
- `curl -w "%{time_total}\n" -o /dev/null -s -H "Authorization: Bearer <토큰>" http://localhost:8081/api/v1/my/preference-recommend`

**참고**: `RestTemplate`(Spring→FastAPI)에 타임아웃이 없어서(`RestTemplateConfig.java`),
FastAPI가 느려지면 이 취향 맵 페이지 로딩도 그 영향을 그대로 받음.

---

## 6. 다음에 실제로 할 일 (구현 착수 시 체크리스트)

**향수 임베딩/ES (DB 트리거 기반 아웃박스)**
- [x] `outbox_events` 테이블 설계 (perfume_id, event_type, processed, created_at) —
      `V5__perfume_change_outbox.sql`, 로컬 DB에 `flywayMigrate`로 적용 완료(스키마 버전 5)
- [x] `perfume`, `perfume_accord`, `perfume_note` 각각에 `AFTER INSERT/UPDATE/DELETE`
      트리거 — `NEW`/`OLD.perfume_id`를 그대로 아웃박스에 기록. 실제 커밋 테스트로 검증 완료
      (`perfume_id=1` UPDATE → `outbox_events`에 즉시 행 생성 확인)
- [x] `accord`, `note` 각각에 트리거 — `perfume_accord`/`perfume_note` 조인으로 연관된
      `perfume_id` 전체를 찾아 아웃박스에 기록 (3-1절 참고, 파급 범위 큼 주의). 검증 완료
      (사용자가 직접 함수/트리거를 재작성해서 파급 동작까지 확인함)
- [x] 아웃박스 폴링 워커 — `OutboxWorker`(BE, `@Scheduled(fixedDelay=10_000)`), 배치 내
      `perfume_id` 중복 제거 후 처리(2-8 발견 계기가 된 실측 로그 참고). 지금은 뼈대만이고
      `handle()` 내부(ML 호출/ES 반영)는 비어있음 — 아래 두 항목이 그 자리를 채움
- [ ] ML 쪽에 단건 임베딩 엔드포인트 신규 (`embed.py` 로직을 API로) — 진행 중
- [ ] ES upsert를 단건으로 처리하는 매퍼/서비스 신규, DELETE 이벤트는 ES `delete` 호출
- [ ] (2-8 신규) `perfume_rows`도 CF와 같은 방식으로 주기적 재로드 추가 필요 — 별도 작업

**CF 추천**
- [ ] `cf_recommender.load()`를 주기적으로 재호출하는 스케줄러 추가 (1차: 단순 시간 기반)
- [ ] `fetch_user_likes`, `fetch_user_accord_tf`, `fetch_perfume_accord_map`에
      `perfume.is_delete = false` 필터 추가 (2-7 버그 수정, 재적재 주기와 무관하게 필요)
- [ ] (규모 커지면) dirty flag + 최소 간격 디바운스로 고도화

**타이밍 계측**
- [ ] `recommend_by_member`에 `/recommend/image`와 같은 패턴의 타이밍 로그 추가
- [ ] `PreferenceServiceImpl`에도 단계별 타이밍 로그 추가

---

## 참고 파일

- `ML/scripts/embed.py` — 향수 임베딩 배치 스크립트 (수동)
- `BE/fragrance/src/main/java/com/example/fragrance/perfume/service/PerfumeSearchService.java` — ES 전체 재색인
- `BE/fragrance/src/main/resources/mapper/perfume/PerfumeMapper.xml` — `findAllForElasticsearch` (2-3 문제)
- `ML/app/services/cf_recommender.py` — CF 추천 모델 (전역 배치 학습 구조)
- `ML/app/db/database.py` — `fetch_user_likes`/`fetch_user_accord_tf`/`fetch_perfume_accord_map` (2-7 문제)
- `ML/app/main.py` — `lifespan()`에서 `cf_recommender.load()` 1회 호출
- `ML/app/api/v1/recommend.py` — `/recommend/member`(CF), `/recommend/image`(타이밍 로그 참고 패턴)
- `BE/fragrance/src/main/java/com/example/fragrance/preference/service/PreferenceServiceImpl.java`
- `BE/fragrance/src/main/java/com/example/fragrance/preference/controller/PreferenceController.java`
- `FE/src/pages/mypage/TasteProfile.tsx` — 취향 맵 페이지
- `BE/fragrance/.claude/docs/db-stability-refactor.md` — 앞서 진행한 DB 안정성 작업(이 문서와
  이어지는 맥락)
