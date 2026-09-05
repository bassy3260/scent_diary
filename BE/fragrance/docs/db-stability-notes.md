# DB 안정성 리팩토링 — 학습 노트

> **적용 현황 (2026-09-05)**: 아래 문서에서 다룬 P0/P1/P2 항목은 로컬 DB에 실제로 적용 완료. P3(경량 항목)은 미적용.
> - Flyway 도입: `build.gradle`(플러그인+의존성), `application.yaml`(`spring.flyway.*`), `src/main/resources/db/migration/V1~V4`
> - `V1__baseline.sql` — 변경 전 실제 스키마 스냅샷 (enum 타입 포함, `pg_dump`로 캡처)
> - `V2__add_foreign_key_indexes.sql` — FK 컬럼 17개 인덱스 추가
> - `V3__member_id_partial_unique.sql` — `member.id` UNIQUE → soft-delete 인지하는 partial unique index
> - `V4__perfume_embedding_integrity.sql` — `perfume_embedding.perfume_id` 타입(int4→int8) + FK 추가
> - 로컬 DB는 Gradle Flyway 플러그인으로 `flywayBaseline`(baselineVersion=4) 실행 후 `flywayValidate` 통과 확인 완료. 적용 전 전체 백업은 `scripts/db_backups/`(git-ignored)에 보관.
> - P2 중 실제 코드로 옮길 수 있었던 부분만 반영: 회원 탈퇴 시 `diary_image`(diary의 자식), `try_diary_perfume`(try_diary의 자식)도 함께 soft-delete하도록 `MemberMapper.xml`의 `softDeleteMemberData`에 추가. `perfume`/`recommend_result` 삭제에 대한 캐스케이드는 해당 삭제 기능 자체가 코드에 아직 없어서 적용 대상이 없었음(문서의 5번 항목 참고).
> - 아래 본문은 적용 전에 작성한 원본 분석이라 "~하면 나아진다" 식 미래형 문장이 남아있는데, 실제로는 이미 적용된 상태.

> 목적: "왜 이걸 고쳐야 하는지"를 개념부터 이해하고, 실제로 뭐가 좋아지는지 확인까지 할 수 있도록 정리한 문서.
> 범위: DB 스키마/제약/인덱스만 다룬다. API 설계, 트랜잭션 경계는 별도 문서에서 다룬다.
> 스택: PostgreSQL + MyBatis (JPA/Hibernate 아님 — 스키마가 자동 생성되지 않고 수동 DDL로 관리됨)

---

## 0. 지금 상태를 한 줄로 요약하면

**스키마가 코드처럼 버전관리되지 않고, `src/main/resources/SQL/향기록.sql` 파일 하나가 유일한 문서인데 그마저 실제 DB와 다르다.**

이 한 문장에서 이후 모든 문제가 파생된다. 순서대로 보자.

---

## 1. 마이그레이션 도구 부재 (Flyway/Liquibase)

### 개념: 마이그레이션 도구가 뭐고 왜 필요한가

일반 애플리케이션 코드는 git으로 버전관리하고, `git log`로 "언제 누가 왜 바꿨는지" 추적하고, 브랜치별로 다른 버전을 가질 수 있고, 문제 생기면 이전 커밋으로 되돌릴 수 있다.

**DB 스키마는 코드가 아니라 "살아있는 상태(state)"라서 이게 안 된다.** `CREATE TABLE`을 실행하는 순간 DB는 그 상태가 되고, 그 이후에 파일을 고쳐도 이미 만들어진 테이블은 안 바뀐다. 그래서 스키마 변경은 "새 파일 하나 = 하나의 변경 단위(migration)"로 관리하고, 도구(Flyway 등)가 "이 DB에 몇 번 마이그레이션까지 적용됐는지"를 자체 테이블(`flyway_schema_history`)에 기록해서, 다음에 뭘 더 적용해야 하는지 자동으로 안다.

즉:
- git = 코드의 버전관리
- Flyway = **DB 상태의 버전관리** (git이 파일 내용을 못 버전관리하듯, git만으로는 "실행된 DDL의 순서와 적용 여부"를 못 관리함)

### 현재 상태 (근거)

- `build.gradle`에 `flyway`/`liquibase` 의존성 없음 — 확인 완료.
- `src/main/resources/SQL/향기록.sql` 딱 1개 파일이 전체 DDL. 이것도 실행용이 아니라 **참고용 덤프**로 보임 (Spring Boot가 부팅 시 자동 실행하는 위치가 아님).
- 이 파일에는 `gender_enum`, `note_level_enum`, `sillage_type`, `season_type` 타입을 **참조**만 하고(`gender public."gender_enum" NOT NULL` 등), 정작 `CREATE TYPE gender_enum ...` 문 자체가 저장소 어디에도 없음.
  - 즉 이 파일만 가지고 새 DB를 만들면 **실행이 실패한다.** 이미 스키마 소스와 실제 DB 사이에 드리프트(drift)가 있다는 뜻.
- `scripts/` 밑에 `image_route_backup.sql`, `image_route_local.sql` 등 임시 백업 스크립트들이 흩어져 있음 — 이것도 "스키마/데이터 변경을 임시방편으로 처리해왔다"는 정황.

### 왜 문제인가

1. **재현 불가능**: 로컬 DB가 죽으면, 또는 팀원이 새로 DB를 세팅해야 하면, 지금 있는 파일만으로는 100% 똑같은 스키마를 못 만든다 (enum 타입부터 막힘).
2. **변경 이력 없음**: "이 컬럼 언제 추가됐지?", "이 제약 왜 있는거지?"를 git blame으로 못 찾음. 향기록.sql은 스냅샷일 뿐, 히스토리가 아님.
3. **팀 동기화가 수동**: 누군가 로컬에서 `ALTER TABLE`을 치면 그 사람 DB만 바뀌고, 다른 사람 DB와 운영 DB는 그대로 → "내 로컬에선 되는데요?" 버그의 근원.
4. **배포 시 스키마 변경을 안전하게 자동화할 방법이 없음** — 지금은 아마 누군가 운영 DB에 직접 접속해서 SQL을 실행하고 있을 것.

### 도입하면 뭐가 나아지나

- 스키마 변경이 `V2__add_index_on_fk.sql` 같은 파일 + git 커밋으로 남는다 → PR 리뷰 대상이 되고, 이력 추적 가능.
- 앱 기동 시 Flyway가 "현재 DB 버전"과 "마이그레이션 파일들"을 비교해서 **부족한 것만 자동 적용** → 로컬/운영 스키마가 항상 일치.
- 새 팀원이 DB를 처음부터 세팅해도 `V1__baseline.sql`부터 순서대로 적용하면 지금 상태와 동일한 DB가 나온다 (재현성 확보).
- 롤백 전략을 세울 수 있는 최소 조건이 갖춰짐 (완전한 자동 롤백은 아니지만, 최소 "무엇을 되돌려야 하는지"는 명확해짐).

### 어떻게 확인하나 (검증 방법)

1. **드리프트 확인 (지금 바로 할 수 있음, 코드 변경 없이)**:
   ```
   pg_dump --schema-only --no-owner --no-privileges <운영/로컬 DB> > actual_schema.sql
   ```
   이 결과와 `향기록.sql`을 diff 떠보면, enum 타입 정의 누락 외에 또 어떤 차이가 있는지(인덱스, 컬럼 추가 등) 바로 드러난다. **이게 "지금 우리가 얼마나 모르고 있었는지"를 보여주는 가장 확실한 증거.**
2. Flyway 도입 후: 로컬 DB를 완전히 빈 상태(새 컨테이너/새 DB)에서 `flyway migrate` 한 번 돌려서, 애플리케이션이 정상 기동되고 기존 기능이 동작하는지 확인 → "이 마이그레이션 파일들만으로 처음부터 완전히 재현 가능하다"는 걸 증명.
3. 이후 실제 컬럼 하나를 추가하는 마이그레이션을 만들어보고, `flyway info`로 적용 이력이 남는지 확인.

---

## 2. Soft Delete와 UNIQUE 제약의 충돌

### 개념: Soft Delete가 뭐고, 왜 UNIQUE 제약과 부딪히나

- **Hard delete**: `DELETE FROM member WHERE ...` — 행 자체가 사라짐.
- **Soft delete**: 행은 남기고 `is_delete = true`, `delete_time = NOW()`만 표시 — "삭제된 것처럼 보이게" 하되 데이터는 보존 (복구, 통계, 감사 로그 목적).

문제는: **DB의 UNIQUE 제약은 "논리적으로 삭제됐는지"를 모른다.** UNIQUE는 오직 "이 컬럼 값이 테이블에 물리적으로 몇 번 존재하는가"만 본다. Soft delete는 행을 안 지우므로, UNIQUE 입장에서는 그 값이 여전히 "사용 중"이다.

### 현재 상태 (근거)

- `향기록.sql:31` — `CONSTRAINT member_id_key UNIQUE (id)` (로그인 아이디에 대한 일반 UNIQUE)
- `MemberMapper.xml`의 `softDeleteMember`: `is_delete=true`만 세우고 행 삭제 안 함.
- 회원가입 시 아이디 중복확인은 `findById` 사용, 이 쿼리는 `AND is_delete = false` 필터가 걸려있음(`MemberMapper.xml:20`, `common.notDeleted`).

### 왜 문제인가 (재현 시나리오)

1. 사용자 A가 아이디 `hong123`으로 가입.
2. A가 회원탈퇴 → `member` 행은 남고 `is_delete=true`로 표시됨.
3. 다른 사용자(또는 A 본인)가 `hong123`으로 재가입 시도.
4. **애플리케이션 로직**: `findById("hong123")` → `is_delete=false` 조건 때문에 못 찾음 → "사용 가능한 아이디"라고 판단하고 가입 진행.
5. **DB**: `INSERT INTO member (id, ...) VALUES ('hong123', ...)` 실행 → 여전히 살아있는 `member_id_key UNIQUE(id)` 제약에 걸려서 **`duplicate key value violates unique constraint` 예외 발생.**

→ 애플리케이션은 "가능하다"고 했는데 DB가 거부하는, **애플리케이션 검증과 DB 제약이 서로 다른 대답을 하는 상태**. 이런 건 재현이 안 되다가 특정 시나리오(탈퇴 후 재가입)에서만 터져서 찾기 어렵다.

### 도입하면 뭐가 나아지나

**Partial Unique Index** (조건부 유니크 인덱스)로 바꾸면 해결된다:

```sql
ALTER TABLE public.member DROP CONSTRAINT member_id_key;
CREATE UNIQUE INDEX member_id_active_key ON public.member (id) WHERE is_delete = false;
```

이렇게 하면 "삭제되지 않은 행들끼리만" 유니크를 보장한다. `is_delete=true`인 행은 인덱스 대상에서 아예 빠지므로, 탈퇴한 아이디를 재사용해도 DB 레벨에서 허용된다. **이제 애플리케이션의 "사용 가능" 판단과 DB의 실제 동작이 일치한다.**

### 어떻게 확인하나

1. **재현 먼저**: 로컬 DB에서 실제로 가입 → 탈퇴 → 같은 아이디로 재가입을 시도해서, 지금 정말 DB 예외가 나는지 직접 재현하고 스택트레이스를 남겨둔다 (수정 전/후 비교용 증거).
2. Partial index 적용 후 같은 시나리오를 다시 실행해서 성공하는지 확인.
3. 정상 케이스(탈퇴 안 한 아이디 중복 가입 시도)는 여전히 막히는지도 함께 확인 — partial index가 "삭제 안 된 것끼리는" 여전히 유니크를 보장하는지 검증.
4. `\d member` (psql) 또는 `pg_indexes`로 인덱스 정의가 의도대로 들어갔는지 확인.

---

## 3. FK 컬럼에 인덱스가 없음

### 개념: PK 인덱스는 자동, FK 인덱스는 자동이 아니다

- `PRIMARY KEY`를 선언하면 Postgres가 **자동으로 UNIQUE 인덱스**를 만들어준다.
- 하지만 `FOREIGN KEY`는 다르다. **Postgres는 FK 컬�럼에 인덱스를 자동으로 만들지 않는다.** (MySQL/InnoDB는 자동으로 만들어주지만 Postgres는 그렇지 않다 — 엔진마다 다르다는 점이 함정.)
- 인덱스가 없으면 그 컬럼으로 `WHERE`, `JOIN`을 할 때 Postgres는 테이블 전체를 훑는 **Sequential Scan**을 한다. 행이 몇백 개일 땐 안 느껴지지만, 데이터가 쌓이면 선형으로 느려진다.
- 추가로, 부모 행을 지우거나 상태를 바꿀 때 자식 테이블에서 그 FK로 조회하는 경우(예: 캐스케이드 삭제)도 이 스캔 비용을 그대로 받는다.

### 현재 상태 (근거)

`향기록.sql` 전체를 봤을 때 인덱스가 있는 컬럼은 PK와, `likes`/`member_perfume`의 복합 `UNIQUE(member_id, perfume_id)` (이건 부수 효과로 `member_id` 선두 컬럼 조회에 인덱스 역할을 함) 뿐이다. 아래는 **인덱스가 전혀 없는 FK 컬럼들**:

| 테이블 | 인덱스 없는 FK 컬럼 |
|---|---|
| `diary` | `member_id`, `perfume_id` |
| `diary_image` | `diary_id` |
| `review` | `member_id`, `perfume_id` |
| `perfume_note` | `perfume_id`, `note_id` |
| `perfume_accord` | `perfume_id`, `accord_id` |
| `try_diary` | `member_id` |
| `try_diary_perfume` | `perfume_id`, `try_diary_id` |
| `recommend_result` | `member_id` |
| `perfume_recommend` | `recommend_result_id`, `perfume_id` |

특히 `MemberMapper.xml`의 `softDeleteMemberData`는 회원 탈퇴 시 `diary`, `try_diary`, `likes`, `member_perfume`, `recommend_result`를 전부 `WHERE member_id = ?`로 UPDATE하는데, 이 중 `diary`, `try_diary`, `recommend_result`는 인덱스가 없는 컬럼으로 스캔한다.

### 왜 문제인가

- 향수 상세 페이지 하나 뜨는데 필요한 쿼리들 — 그 향수의 노트(`perfume_note`), 어코드(`perfume_accord`), 리뷰(`review`) — 이 전부 인덱스 없는 컬럼으로 조회된다. 데이터가 적을 땐 안 보이다가, 향수/리뷰/일기 데이터가 늘어나면 응답 속도가 눈에 띄게 느려지는 시점이 온다.
- 회원 탈퇴 로직처럼 여러 테이블을 순회하는 배치성 작업은 테이블이 커질수록 트랜잭션 점유 시간이 길어져서, 다른 요청과의 락 경합 가능성도 커진다.

### 도입하면 뭐가 나아지나

각 FK 컬럼에 `CREATE INDEX ON table(column);` 추가 → Postgres 옵티마이저가 Sequential Scan 대신 **Index Scan**을 선택하게 됨. 데이터 양이 늘어나도 조회 비용이 로그 스케일에 가깝게 유지됨.

### 어떻게 확인하나

인덱스는 "느껴지는 체감"이 아니라 **`EXPLAIN ANALYZE`로 실행계획을 직접 보고 확인**하는 게 정석이다.

```sql
EXPLAIN ANALYZE SELECT * FROM diary WHERE member_id = 1;
```

- 인덱스 추가 전: `Seq Scan on diary (cost=... rows=...)` 가 나올 것 (테이블이 작으면 지금도 Seq Scan이 더 빠르다고 나올 수 있음 — Postgres는 작은 테이블은 일부러 Seq Scan을 택함. 이건 정상).
- 인덱스 추가 후, 데이터가 일정 규모 이상이면 `Index Scan using ...` 으로 바뀌는 걸 확인.
- 실전에서 의미 있게 확인하려면 **더미 데이터를 몇만 건 넣고** 전/후 `EXPLAIN ANALYZE`의 `actual time`을 비교하는 게 가장 확실하다 (지금처럼 데이터가 적으면 차이가 안 보일 수 있음 — 이게 "지금 당장 체감 안 되니 문제 없다"가 아니라 "아직 데이터가 적어서 안 드러났을 뿐"이라는 점이 핵심).

---

## 4. `perfume_embedding` 테이블의 타입/무결성 불일치

### 현재 상태 (근거, `향기록.sql:82-95`)

```sql
CREATE TABLE public.perfume (
    perfume_id int8 GENERATED ALWAYS AS IDENTITY ...   -- int8 (8바이트)
    ...
);

CREATE TABLE public.perfume_embedding (
    perfume_id int4 NOT NULL,                           -- int4 (4바이트) ← 타입 불일치
    ...
    CONSTRAINT perfume_embedding_pkey PRIMARY KEY (perfume_id)
    -- perfume 테이블을 참조하는 FOREIGN KEY가 아예 없음
);
```

### 왜 문제인가

1. **타입 불일치**: `perfume.perfume_id`는 `int8`(bigint, ~922경까지), `perfume_embedding.perfume_id`는 `int4`(int, ~21억까지). 지금 데이터양에선 문제 없지만, 개념적으로 "같은 값을 가리키는 컬럼인데 타입이 다르다"는 건 설계 실수의 흔적이고, JOIN 시 암묵적 타입 변환이 끼어든다(성능에 미세하게 불리하고, 인덱스 활용에도 제약이 생길 수 있음).
2. **FK 부재로 참조 무결성 없음**: `perfume_embedding.perfume_id`가 실제 `perfume` 테이블에 존재하는 값인지 DB가 전혀 보장하지 않는다.
   - 존재하지 않는 `perfume_id`로 임베딩이 잘못 들어가도 막을 방법이 없음 (배치 스크립트 버그가 나면 조용히 고아 데이터가 쌓임).
   - `perfume`을 soft-delete 해도 `perfume_embedding`은 그대로 남아있어서, 추천 로직이 "삭제된 향수"의 임베딩을 계속 사용할 위험이 있음.

### 도입하면 뭐가 나아지나

```sql
ALTER TABLE public.perfume_embedding ALTER COLUMN perfume_id TYPE int8;
ALTER TABLE public.perfume_embedding
    ADD CONSTRAINT fk_perfume_embedding_perfume
    FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);
```

- 타입 일치로 JOIN이 더 단순해짐.
- FK로 "존재하지 않는 향수의 임베딩" 자체가 DB 레벨에서 차단됨.
- (단, `perfume`은 soft-delete를 쓰므로 FK만으로 "삭제된 향수의 임베딩 정리"까지는 못 막음 — 이건 5번 항목인 애플리케이션/배치 레벨 cascade 정책으로 별도 처리해야 함.)

### 어떻게 확인하나

1. 실제로 `perfume_embedding`에 존재하지 않는 `perfume_id`를 가진 행이 있는지 먼저 조사:
   ```sql
   SELECT pe.perfume_id FROM perfume_embedding pe
   LEFT JOIN perfume p ON p.perfume_id = pe.perfume_id
   WHERE p.perfume_id IS NULL;
   ```
   → 만약 결과가 있으면, FK를 걸기 전에 그 고아 데이터부터 정리해야 함 (FK 제약 추가 자체가 실패함). 이 조사 결과 자체가 "지금 데이터가 이미 얼마나 깨져있는지"를 보여주는 증거.
2. FK 추가 후, 존재하지 않는 `perfume_id`로 INSERT를 시도해서 정말 막히는지 확인.

---

## 5. Soft-delete 캐스케이드 정책 불일치

### 현재 상태

`MemberMapper.xml`의 `softDeleteMemberData`는 회원 탈퇴 시 `recommend_result`, `member_perfume`, `likes`, `diary`, `try_diary`를 명시적으로 soft-delete 처리한다 (5개의 UPDATE를 한 SQL 블록에 몰아넣은 형태).

하지만:
- `diary`를 지울 때 자식인 `diary_image`는 같이 처리되지 않음.
- `perfume`이 삭제될 때 `perfume_note`, `perfume_accord`(DB에는 `ON DELETE CASCADE`가 걸려있지만 이건 **hard delete 기준**이고, soft-delete에는 적용 안 됨), `perfume_embedding`은 안 지워짐.
- `try_diary`가 지워질 때 `try_diary_perfume`은 안 지워짐.
- `recommend_result`가 지워질 때 `perfume_recommend`은 안 지워짐.

즉 **"부모 자식 관계마다 삭제 정책이 다 다르고 일관성이 없다"** — 어떤 곳은 애플리케이션 코드로 수동 처리, 어떤 곳은 DB `ON DELETE CASCADE`(근데 soft-delete라 안 씀), 대부분은 아무 처리도 없음.

### 왜 문제인가

- 부모는 "삭제됨"으로 보이는데 자식은 "안 삭제됨"으로 계속 조회되는 상태 = 데이터 정합성 붕괴. 예를 들어 탈퇴한 회원의 `diary`는 안 보이지만 그 일기의 사진(`diary_image`)이 다른 경로(향수 상세의 "사용자가 올린 사진" 같은 기능이 있다면)로 여전히 조회될 수 있음.
- 정책이 테이블마다 다르니, 새로운 개발자가 새 테이블을 추가할 때 "여기는 어떤 규칙을 따라야 하지?"에 대한 기준이 없음.

### 도입하면 뭐가 나아지나 / 어떻게 확인하나

이건 스키마 한 줄로 끝나는 문제가 아니라 **정책 결정이 먼저 필요**하다 (예: "부모-자식 soft-delete는 DB 트리거로 통일할지, 애플리케이션 서비스 레이어에서 통일할지"). 결정 전이라 여기선 판단을 보류하고, 다음 단계(API/트랜잭션 리팩토링)에서 다시 다루는 게 맞다고 본다. 지금은 "이게 불일치 상태다"라는 것만 기록해둔다.

---

## 6. 그 밖에 가벼운 항목들 (우선순위 낮음, 기록만)

- **`timestamp` (without time zone)**: 전 테이블 공통. 서버와 DB의 타임존 설정이 다르면 시간이 어긋날 수 있음. 지금 당장 장애는 아니지만, 배포 환경(서버 타임존)이 바뀌면 조용히 버그가 생기는 유형. `timestamptz` 전환은 기존 데이터 마이그레이션이 필요해서 별도 계획 필요.
- **`is_delete bool DEFAULT false NULL`**: NOT NULL이 아니라서 이론상 NULL 허용. `is_delete = false` 필터는 NULL을 포함하지 않으므로(3값 논리), NULL이 들어간 행은 "삭제 안 됨" 목록에서 조용히 빠질 수 있음. `NOT NULL DEFAULT false`로 좁히는 게 안전.
- **HikariCP 커넥션 풀**: `application.yaml`에 별도 설정 없이 Spring Boot 기본값(최대 10개 커넥션) 사용 중. 지금 트래픽 규모에선 문제 없어 보이지만, 운영 배포 전에 최소 `maximum-pool-size`, `connection-timeout`은 명시적으로 정해두는 걸 권장 (기본값에 의존하면 트래픽 늘 때 원인 파악이 어려움).

---

## 다음 단계 (실제 작업할 때 참고용 순서)

이 문서는 "이해"가 목적이라 아직 스키마를 건드리지 않았다. 실제로 손댈 때는:

1. `pg_dump --schema-only`로 로컬 DB의 **진짜 현재 스키마**를 뽑아서 `향기록.sql`과 diff → 드리프트 전체 목록 확보.
2. Flyway 도입, 그 결과로 나온 진짜 스키마를 `V1__baseline.sql`로 고정.
3. `V2`부터 위 문제들을 한 이슈당 한 마이그레이션 파일로 분리해서 적용 (한 파일에 여러 문제를 섞지 않기 — 문제 생기면 어느 변경 때문인지 알아야 하니까).
4. 로컬 DB에 이미 실제 데이터가 있으므로, 각 마이그레이션 적용 전 반드시 백업(`pg_dump`)부터.
