# DB 안정성 리팩토링 정리 (Flyway 도입 + 스키마 정합성)

작성일: 2026-09-05

---

## 배경

백엔드 리팩토링을 DB → API → 트랜잭션 순서로 진행하기로 하고, 그중 DB 파트에서 다룬
이슈들의 기록. 원래 스키마는 `src/main/resources/SQL/향기록.sql` 파일 하나(수동 덤프)로만
문서화돼 있었고, 마이그레이션 도구가 없어서 실제 DB와도 이미 어긋나 있었다(아래 1번 참고).

작업 순서: 로컬 DB 전체 백업(`pg_dump`, `scripts/db_backups/` git-ignore) → 실제 스키마를
`pg_dump --schema-only`로 재확인 → 이슈별로 수정 → 매번 트랜잭션 롤백 테스트로 검증 →
Flyway 마이그레이션 파일로 이력화.

---

## 1. 마이그레이션 도구 부재 → Flyway 도입

### 문제
- Flyway/Liquibase 등 스키마 버전관리 도구가 전혀 없었음.
- `향기록.sql`이 유일한 스키마 문서였는데, `gender_enum`/`note_level_enum`/`season_type`/
  `sillage_type` 같은 `CREATE TYPE` 문 자체가 파일에 없어서 **이 파일만으로는 DB를 재현할
  수 없는 상태**였음. 즉 이미 문서와 실제 DB 사이에 드리프트 존재.
- 실제로 `pg_dump --schema-only`로 뽑아보니, `age_enum`이라는 존재하는지도 몰랐던 타입까지
  나옴(어디에도 쓰이지 않는 죽은 타입 — 3번 문서 참고할 필요 없이 여기 기록만 해둠).

### 조치
- `build.gradle`에 `org.flywaydb:flyway-core`, `org.flywaydb:flyway-database-postgresql`
  추가 (버전은 Spring Boot BOM이 관리 — 확인해보니 11.7.2).
- CLI 작업용으로 `org.flywaydb.flyway` Gradle 플러그인도 추가 (`buildscript` 블록에
  `flyway-database-postgresql` + `postgresql` 드라이버를 classpath로 별도 추가해야
  플러그인이 정상 동작함 — 플러그인은 프로젝트 런타임 클래스패스가 아니라 자체
  classloader를 씀).
- `application.yaml`에 `spring.flyway.*` 설정 추가: `baseline-on-migrate: true`,
  `baseline-version: "4"`. 기존 DB(이미 스키마가 존재)에서는 V1~V4를 실행하지 않고
  "이미 적용됨"으로만 기록하고, **빈 DB(신규 팀원/CI)에서는 V1부터 실제로 순서대로
  실행**되는 두 시나리오를 모두 커버.
- `src/main/resources/db/migration/`에 4개 파일 작성:
  - `V1__baseline.sql` — 변경 전 실제 스키마 스냅샷 (수정 전 상태를 그대로 캡처 —
    `member_id_key` UNIQUE, `perfume_embedding.perfume_id integer` 등 "고쳐야 할 상태"
    그대로 담음. 베이스라인은 "있었던 사실"을 담아야지 "있었으면 하는 상태"를 담으면 안 됨)
  - `V2`, `V3`, `V4` — 아래 2, 3, 4번 이슈의 수정사항

### 검증
- 로컬 DB에 Gradle Flyway 플러그인으로 `flywayBaseline` 실행 → `flywayInfo`로 버전 4 확인
  → `flywayValidate` 통과.
- DB 접속 정보는 `.env`의 `DB_*` 값을 셸 환경변수로 export해서 사용 (build.gradle에
  비밀번호 하드코딩 안 함).

---

## 2. FK 컬럼에 인덱스가 하나도 없었음

### 문제
Postgres는 PK는 자동으로 인덱싱하지만 **FK는 자동 인덱싱하지 않는다**(MySQL/InnoDB와
다른 부분). `diary`, `review`, `perfume_note`, `perfume_accord`, `try_diary`,
`try_diary_perfume`, `recommend_result`, `perfume_recommend`의 FK 컬럼 전부가 인덱스 없이
Seq Scan 대상이었음. 특히 `MemberMapper.xml`의 `softDeleteMemberData`(회원 탈퇴 시
연쇄 soft-delete)가 정확히 이 컬럼들로 `WHERE member_id = ?`를 실행.

### 조치 (`V2__add_foreign_key_indexes.sql`)
FK 컬럼 17개에 `CREATE INDEX` 추가. `likes`/`member_perfume`은 `UNIQUE(member_id, perfume_id)`
복합 인덱스가 있었지만 `perfume_id`가 선두 컬럼이 아니라서 "이 향수를 찜한/소장한 사람"
방향 조회엔 도움이 안 됐음 → `perfume_id` 단독 인덱스도 추가.

### 검증
데이터가 적어서(향수 1315건, 일기 49건 등) `EXPLAIN ANALYZE`로 지금 당장 체감 차이는
크지 않음. 데이터가 늘었을 때를 대비한 조치라는 걸 문서에 명시해둠 — "지금 안 느리다"가
"문제 없다"는 뜻은 아님.

---

## 3. Soft delete와 UNIQUE 제약 충돌 (`member.id`)

### 문제
`member.id`(로그인 아이디)에 일반 `UNIQUE` 제약이 있었는데, 회원탈퇴는 soft delete
(`is_delete=true`, 행 유지)라서 **탈퇴한 아이디를 재사용할 수 없는 버그**였음.
- 회원가입 시 중복확인은 `is_delete=false` 필터가 걸린 `findById`를 써서 "사용 가능"이라고
  판단
- 근데 실제 `INSERT`는 여전히 살아있는 `UNIQUE` 제약에 걸려서 DB 예외 발생
→ 앱 로직과 DB 제약이 서로 다른 대답을 하는 상태.

### 조치 (`V3__member_id_partial_unique.sql`)
```sql
ALTER TABLE public.member DROP CONSTRAINT member_id_key;
CREATE UNIQUE INDEX member_id_active_key ON public.member (id) WHERE is_delete = false;
```
Partial unique index로 전환 — "삭제 안 된 행들끼리만" 유니크를 보장.

### 검증
로컬 DB에 실제로 존재하던 soft-deleted 회원(`is_delete=true`, id=`test2`)의 아이디로
트랜잭션 안에서 재가입 INSERT를 시도 → 성공 확인 후 롤백. 반대로 활성 회원 아이디
중복 INSERT는 여전히 `unique_violation`으로 막히는 것도 같이 확인.

---

## 4. `perfume_embedding` 타입/참조 무결성 불일치

### 문제
- `perfume.perfume_id`는 `bigint`인데 `perfume_embedding.perfume_id`는 `integer` —
  같은 값을 가리키는 컬럼인데 타입이 다름.
- `perfume_embedding`에 `perfume`을 향한 FK가 아예 없었음 — 존재하지 않는 `perfume_id`로
  임베딩이 들어가도, `perfume`이 삭제돼도 아무 제약이 없었음.

### 조치 (`V4__perfume_embedding_integrity.sql`)
```sql
ALTER TABLE public.perfume_embedding ALTER COLUMN perfume_id TYPE bigint;
ALTER TABLE public.perfume_embedding
    ADD CONSTRAINT fk_perfume_embedding_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);
```

### 검증
FK를 걸기 전에 먼저 고아 데이터가 있는지 확인:
```sql
SELECT pe.perfume_id FROM perfume_embedding pe
LEFT JOIN perfume p ON p.perfume_id = pe.perfume_id
WHERE p.perfume_id IS NULL;
```
결과 0건 확인 후 적용(있었으면 FK 추가 자체가 실패했을 것). 적용 후 타입/FK가
`\d perfume_embedding`에 반영됐는지 재확인.

---

## 5. Soft-delete 캐스케이드 불일치 (부분 반영)

### 문제
회원 탈퇴 시 `recommend_result`/`member_perfume`/`likes`/`diary`/`try_diary`는
soft-delete 처리되는데, 그 자식 테이블인 `diary_image`(diary의 자식),
`try_diary_perfume`(try_diary의 자식)은 처리 안 됨. 부모는 "삭제됨"으로 보이는데
자식이 안 지워지는 정합성 공백.

`perfume`/`recommend_result` 자체를 지우는 기능은 코드에 아직 없어서(soft-delete
메서드가 `member`에만 존재), 그쪽 캐스케이드는 적용 대상이 없어 손대지 않음 —
없는 기능을 위한 캐스케이드를 임의로 새로 만들지는 않았음.

### 조치
`MemberMapper.xml`의 `softDeleteMemberData`에 두 UPDATE 추가:
```sql
UPDATE public.diary_image
SET is_delete = true, delete_time = NOW()
WHERE diary_id IN (SELECT diary_id FROM public.diary WHERE member_id = #{memberId});

UPDATE public.try_diary_perfume
SET is_delete = true, delete_time = NOW()
WHERE try_diary_id IN (SELECT try_diary_id FROM public.try_diary WHERE member_id = #{memberId});
```
기존에 이미 5개 UPDATE를 세미콜론으로 이어붙인 하나의 `<update>` 블록에 자연스럽게
추가 — 새 패턴을 만든 게 아니라 기존 패턴을 확장.

### 검증
PgJDBC가 파라미터 있는 다중 문장 `PreparedStatement`를 실제로 지원하는지부터 별도로
확인(간단한 자바 테스트로 재현) — 지원함을 확인. 그다음 전체 7문장 블록을 실제 회원
데이터(`member_id=5`)로 트랜잭션 롤백 테스트하여 정상 동작 확인.

---

## 발견했지만 아직 미적용 (다음에 다룰 것)

DB 이론(정규화/데이터 독립성/트랜잭션/정합성) 관점으로 다시 훑으면서 추가로 찾은 것들.
스키마 변경이 아니라 서비스 코드 변경이 필요해서 "DB 리팩토링" 범위를 넘어간다고 보고
보류함:

- **`RecommendServiceImpl`에 `@Transactional` 없음** — `insertRecommendResult` 성공 후
  `insertPerfumeRecommend`가 실패하면(FK 위반, 혹은 추천 리스트가 비어서 `<foreach>`가
  빈 `VALUES ()`를 만드는 경우) 향수 없는 고아 `recommend_result`가 남음. 원자성 위반.
- **`review.rating`에 도메인/사용자 정의 무결성 없음** — DB에 `CHECK` 제약도 없고
  `ReviewRequest.java`에 `@Min`/`@Max` 검증도 없어서 범위 밖 값이 그냥 저장됨.
- **`perfume.brand`가 원시 문자열** — 브랜드를 별도 엔티티로 뺄지는 기획 의존(브랜드에
  추가 속성이 필요해질지에 따라 다름), 지금 코드만으론 판단 불가.
- **`try_diary_perfume.place`/`season`/`sillage`가 행(향수)당 붙어있음** — "한 시향
  일기에서 여러 장소를 다녔다"는 의도인지, 원래 `try_diary` 레벨 속성인지 기획 확인 필요.

---

## 참고 파일

- `BE/fragrance/src/main/resources/db/migration/V1__baseline.sql` ~ `V4__perfume_embedding_integrity.sql`
- `BE/fragrance/build.gradle` — Flyway 의존성 + `buildscript`/`flyway {}` 블록
- `BE/fragrance/src/main/resources/application.yaml` — `spring.flyway.*` 설정
- `BE/fragrance/src/main/resources/mapper/user/MemberMapper.xml` — `softDeleteMemberData`
- `BE/fragrance/docs/db-stability-notes.md` — 적용 전 학습용 원본 분석 문서(개념 설명 포함,
  이 문서는 그걸 "무엇을 실제로 했는지" 관점으로 압축한 버전)
- `BE/fragrance/scripts/db_backups/` — 적용 전 전체 백업(git-ignored, 실데이터 포함)
