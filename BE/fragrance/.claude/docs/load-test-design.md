# 부하테스트 설계 — FastAPI 이벤트 루프 블로킹 검증

작성일: 2026-09-06
상태: **설계만 완료, 아직 실행 전.** 코드 수정(`asyncio.to_thread` 적용 등) 전에 먼저
지금 상태를 실측으로 baseline 잡아두고, 수정 후 같은 테스트로 개선 효과를 숫자로
비교하는 게 목적.

---

## 0. 기초 개념부터

### 0-1. 프로세스(Process) vs 스레드(Thread)

- **프로세스**: 실행 중인 프로그램 하나. 독립된 메모리 공간을 가짐 — 비유하면 "독립된
  사무실 하나". 지금 이 프로젝트에서 `uvicorn app.main:app`을 실행하면 프로세스가 하나 뜬다.
- **스레드**: 그 프로세스 "안에서" 실제로 코드를 실행하는 흐름. 한 프로세스 안에 스레드가
  여러 개 있을 수 있고, **같은 프로세스의 스레드끼리는 메모리(변수 등)를 공유**한다 —
  비유하면 "같은 사무실 안에서 일하는 직원 여러 명, 같은 파일 캐비닛(메모리)을 같이 씀".

### 0-2. FastAPI(uvicorn)는 기본적으로 스레드 "하나"로 돈다 — 이벤트 루프

지금 이 프로젝트의 `Dockerfile`은 `uvicorn ... `을 워커 지정 없이 실행한다 → 프로세스 1개,
그 안의 "이벤트 루프"라는 **스레드 하나**가 들어오는 모든 요청을 처리한다.

비유: 웨이터 한 명이 여러 테이블을 담당. 이 웨이터가 빠른 이유는, 오래 걸리는 일(요리)은
절대 자기가 서서 하지 않고 항상 "주방에 넘기고 즉시 다음 테이블로 이동"하기 때문. 이게
`async def` + `await`가 하려는 일이다 — "나 기다리는 동안 다른 일 좀 봐줘"라고 양보하는 것.

문제가 됐던 코드(`recommend_by_image` 안에서 `requests.post()`를 직접 호출)는 **웨이터가
직접 주방에 서서 요리가 끝날 때까지 기다리는 것**과 같다. 그동안 다른 테이블(다른 요청)은
아무도 못 본다. → [이전 대화에서 데모로 실측: `/fast`가 2.91초 지연됨](#1-배경--지금까지-확인한-것)

### 0-3. 직렬화(Serialization) — 이 문서에서 쓰는 의미

주의: "직렬화"는 보통 객체를 JSON/바이트로 변환하는 의미(`JSON.stringify` 같은 것)로도
쓰이는데, **여기서 말하는 직렬화는 그 뜻이 아니다.** 여기서는 "원래는 동시에 처리될 수
있었던 여러 작업이, 하나의 공유 자원(웨이터/이벤트 루프)을 두고 경쟁하는 바람에 어쩔 수
없이 **한 번에 하나씩, 순서대로만** 처리되는 상태"를 말한다. 병렬 처리의 반대 개념.

### 0-4. 동시성(Concurrency) vs 병렬성(Parallelism)

- **동시성**: 여러 일을 "번갈아 가며" 처리해서 전체적으로 동시에 진행되는 것처럼 보이게
  하는 것. 웨이터 한 명이 여러 테이블 주문을 번갈아 받는 것 — 실제로 한 순간엔 한 가지만
  하지만, 아주 짧은 단위로 왔다갔다하니 여러 명을 동시에 응대하는 것처럼 느껴짐. 지금
  FastAPI의 기본 모델이 이것.
- **병렬성**: 진짜로 여러 일이 물리적으로 동시에 실행되는 것. 요리사가 여러 명이라 여러
  요리가 실제로 동시에 만들어지는 것. `asyncio.to_thread`로 스레드풀에 위임하면, 적어도
  "네트워크 응답을 기다리는 구간"만큼은 여러 요청이 진짜로 동시에 대기할 수 있게 된다
  (파이썬 GIL은 "대기 중"엔 풀리기 때문 — 자세한 내용은 이전 대화 참고).

이 부하테스트가 확인하려는 것은 결국: **"동시성(번갈아 처리)이어야 할 것이, 실제로는
직렬화(한 줄로 줄서기)되어 있는가?"** 를 숫자로 증명하는 것.

---

## 1. 배경 — 지금까지 확인한 것

- `ML/app/api/v1/recommend.py`의 `recommend_by_image`(`async def`)가 내부에서
  `mood_extractor.extract_mood()`(동기 `requests.post`, 최대 60s)와
  `generate_reasons_batch()`(동기 `requests.post`, `llm_reasoner.py:56`, 15s)를
  `await` 없이 직접 호출 → 이벤트 루프를 그 시간만큼 통째로 막음.
- `ML/Dockerfile`이 `uvicorn`을 `--workers` 지정 없이 실행 → 프로세스 1개, 이벤트 루프 1개.
- 최소 재현(로컬 데모 서버, 같은 uvicorn 단일 워커 조건)으로 실측 확인 완료:

  | 패턴 | 무관한 엔드포인트(`/fast`) 응답 시간 |
  |---|---|
  | 지금 코드와 동일 (동기 호출 직접) | **2.91초** (블로킹 요청이 끝날 때까지 같이 묶임) |
  | 개선안 (`asyncio.to_thread`로 위임) | **0.28초** (즉시 응답) |

- 이 데모는 "메커니즘이 실제로 이렇게 동작한다"는 것만 증명한 것이고, **실제 서비스
  엔드포인트(`/recommend/image`, `/recommend/member` 등)와 실제 네트워크 호출(RunPod, GMS)
  조건에서 체감 임팩트가 얼마나 되는지는 아직 측정 안 함** — 이걸 이 부하테스트로 확인한다.

---

## 2. 부하테스트로 검증하려는 가설

- **H1 (직렬화 확인)**: 이미지 추천 요청을 동시에 N개 보내면, 응답 시간이 요청 수에
  거의 비례해서 늘어난다 (진짜 병렬이면 거의 안 늘어야 함).
- **H2 (노이즈 이웃 확인)**: 이미지 추천 요청이 진행 중인 동안, 완전히 무관한 엔드포인트
  (`/recommend/member`)를 호출하면 그 요청도 함께 지연된다.
- **H3 (Spring 스레드 고갈 확인, 참고용)**: `RestTemplate` 타임아웃이 없는 상태에서
  Spring을 경유해 동시 요청을 보내면, Tomcat 스레드가 묶여 다른 API(향수 검색 등)까지
  느려질 수 있다. 다만 Tomcat 기본 스레드 수(200)가 넉넉해서, 지금 예상 동시 사용자
  규모로는 재현이 어려울 수 있음 — 참고 항목으로만 두고 우선순위는 H1/H2보다 낮게.

---

## 3. 측정 지표

- 엔드포인트별 응답 시간: p50 / p95 / p99, 최대값
- 처리량(RPS, requests/sec)
- 에러율(타임아웃/5xx)
- **가장 중요한 지표**: "무관한 엔드포인트(`/recommend/member`)의 응답 시간이, 이미지
  추천 트래픽이 없을 때 vs 있을 때 얼마나 차이 나는가" — H2를 직접 증명하는 숫자

---

## 4. 도구 선택

현재 이 환경엔 **k6도 locust도 설치돼 있지 않음** (`ML/.venv`엔 pip도 없는 uv 관리 venv).
선택지:

| | k6 | locust | 커스텀 스크립트 (httpx + asyncio) |
|---|---|---|---|
| 설치 | `winget install k6.k6` 필요 (winget은 설치돼 있음 확인) | `pip install locust` 필요 (venv에 pip부터 필요) | **불필요** — `httpx` 이미 `ML/.venv`에 있음 |
| 시나리오 표현력 | JS로 작성, HTML/JSON 리포트 자동 생성 | Python으로 작성, 웹 UI로 실시간 모니터링 | 가장 단순, 리포트는 직접 계산 |
| 이번 목적 적합도 | 좋음 (표준 지표 리포트 바로 나옴) | 좋음 (Python이라 프로젝트와 친화적) | 빠르게 시작하기엔 최적 (설치 0) |
| 추천 |  | | **1차: 커스텀 스크립트로 먼저 가설 확인 → 필요하면 k6로 정식 측정** |

**결론**: 설치 없이 바로 시작할 수 있는 커스텀 `httpx` 비동기 스크립트로 H1/H2부터 빠르게
확인하고, 수치를 표/그래프로 제대로 정리하고 싶어지면 그때 `k6` 설치(`winget install
k6.k6`)해서 정식 스크립트로 재측정하는 2단계 접근.

### 4-1. 커스텀 스크립트 스케치 (실행 준비물)

```python
# ML/scripts/loadtest_recommend.py (설계 초안, 아직 미작성)
import asyncio, time, httpx

FASTAPI_URL = "http://localhost:8126"

async def call_image_recommend(client: httpx.AsyncClient, idx: int):
    t0 = time.time()
    r = await client.post(f"{FASTAPI_URL}/api/v1/recommend/image", json={...}, timeout=90)
    return ("image", idx, time.time() - t0, r.status_code)

async def call_member_recommend(client: httpx.AsyncClient, idx: int):
    t0 = time.time()
    r = await client.post(f"{FASTAPI_URL}/api/v1/recommend/member", json={"member_id": 1}, timeout=10)
    return ("member", idx, time.time() - t0, r.status_code)

async def main():
    async with httpx.AsyncClient() as client:
        tasks = [call_image_recommend(client, i) for i in range(5)]
        tasks += [call_member_recommend(client, i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        for kind, idx, elapsed, status in sorted(results, key=lambda r: r[2]):
            print(f"{kind}#{idx}: {elapsed:.2f}s (status={status})")

asyncio.run(main())
```

핵심 아이디어: `image` 요청 5개와 `member` 요청 5개를 **정확히 같은 시점에** 동시 발사해서,
`member` 요청들의 응답 시간이 `image` 요청들과 비슷하게 늘어지는지(H1/H2 증명) 확인.

---

## 5. 테스트 시나리오 설계

### 시나리오 A — ML(FastAPI) 서버 단독 (Spring 안 거침)

- 대상: `http://localhost:8126` 직접
- 목적: H1, H2를 가장 순수하게 확인 (Spring/Tomcat 변수 제거)
- 부하 패턴: `/recommend/image` 동시 N개(N = 3, 5, 10 단계적으로) + `/recommend/member`
  동시 M개를 같은 타이밍에 섞어서 발사

### 시나리오 B — Spring 경유 전체 스택

- 대상: `http://localhost:8081` (BE) → 내부적으로 FastAPI 호출
- 목적: H3 확인 + 실제 사용자가 체감하는 엔드투엔드 지연 측정
- 부하 패턴: `/api/v1/recommend/image`, `/api/v1/my/preference-recommend`를 동시에 섞어서 발사
- 필요 조건: 로그인 토큰 필요 (JWT) — 테스트용 계정 준비 필요

**진행 순서 제안**: A부터 (변수 적고 빠르게 확인 가능) → 개선(`asyncio.to_thread` 적용) →
A 재측정으로 효과 확인 → 그다음 B로 넘어가서 전체 스택 관점 확인.

---

## 6. 테스트 환경 유의사항

- **RunPod 콜드스타트/비용**: `/recommend/image`가 실제 RunPod GPU 엔드포인트를 호출함.
  부하테스트로 짧은 시간에 여러 번 호출하면 (a) 콜드스타트 타이밍에 따라 결과가 들쭉날쭉할
  수 있고 (b) 과금이 발생할 수 있음. **첫 실행은 소량(동시 3~5개)으로 시작해서 비용/영향
  파악 후 늘리는 걸 권장.**
- **GMS API(LLM) 비용**: `generate_reasons_batch`도 마찬가지로 실제 호출 시 과금.
- **대안**: 순수하게 "이벤트 루프 블로킹" 현상만 확인하고 싶다면, RunPod/GMS 호출 부분을
  로컬 mock 서버(FastAPI로 `time.sleep(N)` 흉내)로 잠깐 바꿔서 테스트하는 것도 방법 —
  이전 대화의 최소 재현 데모가 정확히 이 방식. 실제 서비스 코드/설정 변경 없이 하려면
  이 방식이 더 안전함.
- **로컬 전용**: 운영 서버가 아니라 로컬 개발 환경 기준으로 진행 (지금까지의 모든 검증도
  로컬 기준).

---

## 7. Before/After 비교 계획

1. **Before**: 지금 코드 그대로 시나리오 A 실행 → 결과 기록 (특히 `member` 요청들의
   응답시간 분포)
2. **수정**: `recommend_by_image`/`generate_reasons_batch` 호출부에 `asyncio.to_thread`
   적용 (또는 `httpx.AsyncClient`로 전환)
3. **After**: 같은 시나리오 A 재실행 → Before와 비교
4. 개선 폭이 확인되면 시나리오 B(Spring 경유)로 확장

---

## 8. 진행 상태

문제 메커니즘 최소 재현(데모 서버, `/blocking` vs `/blocking_fixed`)과 가설/지표/시나리오
설계까지 마친 단계. `ML/scripts/loadtest_recommend.py` 작성, 시나리오 A Before 측정,
`asyncio.to_thread` 적용, After 측정 및 비교는 아직 실행 전 — 실제 부하테스트는 사용자가
직접 진행할 예정.

---

## 참고 파일

- `ML/app/api/v1/recommend.py` — `recommend_by_image` (문제 위치)
- `ML/app/services/llm_reasoner.py:56` — `generate_reasons_batch` 내 동기 호출
- `ML/Dockerfile` — `uvicorn` 워커 수 설정 (현재 미지정 = 1)
- `BE/fragrance/src/main/java/com/example/fragrance/util/config/RestTemplateConfig.java` — 타임아웃 미설정 (H3 관련)
