# CLAUDE.md — ML 향수 추천 프로젝트

## 프로젝트 개요

향수 취향을 텍스트로 입력하면 의미론적 임베딩(Semantic Embedding) 기반으로 유사한 향수를 추천하는 FastAPI 서버입니다.
사용자의 자연어 입력을 벡터로 변환하고, PostgreSQL에 저장된 향수 임베딩 벡터들과 코사인 유사도를 계산해 Top-K 향수를 반환합니다.

---

## 기술 스택

| 분류 | 기술 | 용도 |
|------|------|------|
| Web Framework | FastAPI + Uvicorn | REST API 서버 |
| ML Model | BAAI/bge-m3 (SentenceTransformer) | 텍스트 → 1024차원 벡터 임베딩 |
| Vector Search | scikit-learn cosine_similarity | 향수 벡터 유사도 계산 |
| Database | PostgreSQL + psycopg2 | 향수 메타데이터 + 임베딩 벡터 저장 |
| Serverless GPU | RunPod | 런타임 임베딩 생성 (GPU 서버) |
| LLM | GPT-4o-mini (SSAFY GMS API) | 추천 이유 자연어 생성 |
| 배포 | Docker | 컨테이너화 |
| 언어 | Python 3.11 | - |

---

## 프로젝트 구조

```
ML/
├── recommendation/          # FastAPI 앱 패키지 (핵심 서비스)
│   ├── main.py              # API 엔드포인트 정의, 앱 시작점
│   ├── recommender.py       # 임베딩 기반 추천 로직
│   ├── database.py          # DB 연결 및 쿼리
│   ├── llm_reasoner.py      # LLM 추천 이유 생성
│   └── recommender_tfidf.py # (아카이브) 초기 TF-IDF 방식
│
├── dataSets/                # 데이터 준비 스크립트 (1회성)
│   ├── embed.py             # 향수 임베딩 생성 → DB 저장
│   └── Insert_perfumes.py   # CSV → PostgreSQL 삽입
│
├── runpod/                  # RunPod 서버리스 핸들러
│   ├── handler.py           # GPU 임베딩 엔드포인트
│   └── requirements.txt
│
├── Dockerfile               # 메인 앱 컨테이너
├── requirements.txt         # 의존성
└── .env                     # 환경변수 (git 제외)
```

### 각 파일의 역할 요약

- **main.py**: 요청을 받아 가중치 계산 후 `recommender.py`에 위임, 응답 포맷팅
- **recommender.py**: DB에서 임베딩 조회 → 가중합 벡터 생성 → 코사인 유사도 → Top-K 반환
- **database.py**: DB 연결 설정 및 재사용 가능한 쿼리 함수
- **llm_reasoner.py**: 추천된 향수에 대한 자연어 설명 생성
- **embed.py**: 향수 데이터를 한 번 임베딩해서 DB에 저장 (배치 작업)
- **handler.py**: RunPod에서 동작하는 GPU 임베딩 서버

---

## 코딩 컨벤션

### 1. 파일/모듈 구성 원칙

**각 파일은 하나의 책임만 갖는다 (Single Responsibility)**

```
# 나쁜 예: main.py에 DB 쿼리와 비즈니스 로직을 모두 넣기
@app.post("/recommend")
def recommend(req):
    conn = psycopg2.connect(...)  # DB 연결을 여기서 직접
    cursor.execute("SELECT ...")  # 쿼리도 여기서 직접

# 좋은 예: 각 역할을 분리
@app.post("/recommend")
def recommend(req):
    results = recommend_perfumes(req.text, embedder, weights)  # 로직은 recommender.py에
    return format_response(results)
```

### 2. FastAPI 패턴

**Pydantic 모델로 요청/응답 스키마를 명시적으로 정의한다**

```python
# 요청 모델: 입력 데이터 검증 자동화
class RecommendRequest(BaseModel):
    text: str
    note: Literal["top", "middle", "base"] = "middle"  # 허용값 제한
    money: str

# 응답 모델: 클라이언트가 받는 데이터 구조 보장
class RecommendResponse(BaseModel):
    perfume_id: int
    perfume_name: str
    score: float
```

**lifespan 이벤트로 앱 시작/종료 처리** (현재 `@app.on_event` 방식은 deprecated)

```python
# 현재 방식 (작동하지만 deprecated)
@app.on_event("startup")
def startup():
    ...

# 권장 방식 (Python 3.11+)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 실행
    init_embedder()
    yield
    # 종료 시 실행 (정리 작업)

app = FastAPI(lifespan=lifespan)
```

### 3. 환경변수 관리

**모든 설정값은 `.env` 파일 + `os.getenv()`로 관리하고, 코드에 하드코딩하지 않는다**

```python
# 나쁜 예
DB_CONFIG = {"host": "192.168.1.100", "password": "mypassword123"}

# 좋은 예
from dotenv import load_dotenv
load_dotenv()
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "password": os.getenv("DB_PASSWORD"),
}
```

`.env` 파일은 반드시 `.gitignore`에 추가한다.

### 4. 타입 힌트 (Type Hints)

**모든 함수 인자와 반환값에 타입을 명시한다**

```python
# 나쁜 예
def recommend_perfumes(user_text, model, weights, top_k=5):
    ...

# 좋은 예
def recommend_perfumes(
    user_text: str,
    model: RunPodEmbedder,
    weights: dict[str, float],
    top_k: int = 5,
) -> list[dict]:
    ...
```

타입 힌트는 코드를 읽는 사람에게 문서 역할을 하고, IDE의 자동완성/오류 감지를 도와줍니다.

### 5. 예외 처리

**외부 의존성(DB, API 호출)에는 반드시 예외 처리를 추가한다**

```python
# 나쁜 예: 오류 시 서버 전체 크래시
response = requests.post(url, json=payload)
return response.json()["output"]["embedding"]

# 좋은 예: 명확한 오류 메시지 반환
from fastapi import HTTPException

try:
    response = requests.post(url, json=payload, timeout=30)
    response.raise_for_status()
except requests.Timeout:
    raise HTTPException(status_code=504, detail="임베딩 서버 응답 시간 초과")
except requests.HTTPError as e:
    raise HTTPException(status_code=502, detail=f"임베딩 서버 오류: {e}")
```

### 6. 네이밍 컨벤션

```
snake_case     → 변수, 함수, 모듈명 (recommend_perfumes, user_text)
PascalCase     → 클래스명 (RunPodEmbedder, RecommendRequest)
UPPER_SNAKE    → 상수 (NOTE_RATIO, ZERO_VEC)
_prefix        → 내부 전용 함수/변수 (_parse_vec)
```

### 7. DB 연결 관리

**현재 방식(매 요청마다 연결/해제)은 개발엔 괜찮지만, 운영 환경에선 Connection Pool을 써야 합니다**

```python
# 현재 방식 (단순하지만 성능 비효율)
def get_connection():
    return psycopg2.connect(**DB_CONFIG)

# 운영 권장 방식 (SQLAlchemy connection pool)
from sqlalchemy import create_engine
engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
```

---

## 데이터 플로우

```
사용자 요청 (텍스트 + 취향 옵션)
    │
    ▼
main.py: 노트 비율 가중치 계산
    │
    ▼
RunPodEmbedder.encode()  →  RunPod GPU 서버 (BAAI/bge-m3)
    │  사용자 텍스트 → 1024차원 벡터
    ▼
recommender.py:
    ├─ PostgreSQL에서 향수 임베딩 전체 조회
    ├─ 향수별 가중합 벡터 생성
    │   (accord×0.4 + note_levels×0.3 + desc×0.3)
    ├─ 코사인 유사도 계산
    └─ Top-5 반환
    │
    ▼
main.py: 응답 포맷팅 → JSON 반환
```

---

## 환경변수 목록

`.env` 파일에 아래 값들을 설정합니다:

```env
# RunPod (임베딩 서버)
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_ENDPOINT_ID=your_endpoint_id

# SSAFY GMS API (LLM)
GEMINI_API_KEY=your_gms_api_key

# PostgreSQL
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

---

## 로컬 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (루트 디렉토리에서)
uvicorn recommendation.main:app --reload --port 8000

# API 문서 확인 (자동 생성됨)
# http://localhost:8000/docs
```

---

## 학습 로드맵

FastAPI와 ML이 처음이라면, 아래 순서로 학습하면 이 코드베이스를 빠르게 이해할 수 있습니다.

### Phase 1: Python 기초 탄탄히 (1-2주)

이 프로젝트에서 반드시 알아야 하는 파이썬 개념들:

- **타입 힌트** (`str`, `int`, `list[dict]`, `dict[str, float]`) → [공식 docs](https://docs.python.org/3/library/typing.html)
- **클래스와 메서드** (`RunPodEmbedder`, `BaseModel` 상속) → `recommender.py` 참고
- **리스트 컴프리헨션** (`[{**rows[i], "score": ...} for i in top_indices]`) → `recommender.py:55`
- **딕셔너리** (`weights.get("accord", 0)`, `{**row, "score": score}`) → 프로젝트 전체에 사용
- **환경변수** (`os.getenv()`) → `database.py` 참고

### Phase 2: FastAPI 입문 (1-2주)

이 프로젝트 코드와 함께 학습하면 효과적입니다:

1. **왜 FastAPI인가?** — 타입 힌트 기반 자동 검증 + 자동 API 문서 생성
2. **Pydantic 모델** — `RecommendRequest`, `RecommendResponse` 클래스 읽기 → [main.py:33-48](recommendation/main.py)
3. **라우터와 엔드포인트** — `@app.post("/recommend")` 패턴 → [main.py:51](recommendation/main.py)
4. **lifespan/startup** — 앱 시작 시 DB/모델 초기화 → [main.py:28](recommendation/main.py)
5. **HTTP 상태코드** — 200 성공, 422 검증 오류, 500 서버 오류
6. **Swagger UI 활용** — `http://localhost:8000/docs`에서 직접 API 테스트

**추천 학습 자료:**
- FastAPI 공식 튜토리얼: https://fastapi.tiangolo.com/tutorial/ (한국어 지원)

### Phase 3: ML 핵심 개념 이해 (2-3주)

이 프로젝트가 사용하는 ML 개념만 집중적으로:

#### 임베딩(Embedding)이란?
> 텍스트를 숫자 벡터로 변환하는 것. "장미향" → [0.12, -0.34, 0.89, ...] (1024개 숫자)
> 의미가 비슷한 텍스트는 벡터 공간에서 가까운 위치에 있습니다.

```
이 프로젝트에서 보는 곳:
- runpod/handler.py: 모델이 실제로 임베딩을 생성하는 부분
- dataSets/embed.py: 향수 데이터를 임베딩해서 저장
- recommender.py: 저장된 임베딩을 불러와서 사용
```

#### 코사인 유사도(Cosine Similarity)란?
> 두 벡터가 얼마나 같은 방향을 가리키는지 측정. 1에 가까울수록 유사.
> `from sklearn.metrics.pairwise import cosine_similarity` → `recommender.py:50`

#### BAAI/bge-m3 모델이란?
> 다국어 지원 임베딩 모델. 한국어 텍스트도 잘 처리합니다.
> "query: " 접두사 = 사용자 검색 쿼리에 사용
> "passage: " 접두사 = 데이터베이스 문서에 사용 (BGE 모델의 특징)

#### TF-IDF vs 임베딩 (이 프로젝트의 발전 과정)
```
recommender_tfidf.py (초기)  →  recommender.py (현재)
단순 키워드 빈도 기반             의미론적 유사도 기반
"장미" 검색 시 "장미"만 찾음      "장미" 검색 시 "로즈"도 찾음
```

### Phase 4: 데이터베이스 연동 (1주)

- **psycopg2**: Python ↔ PostgreSQL 연결 라이브러리 → `database.py`
- **RealDictCursor**: 쿼리 결과를 딕셔너리로 받기 (컬럼명으로 접근 가능)
- **환경변수로 DB 연결**: 절대 코드에 비밀번호 하드코딩 금지
- **SQL 서브쿼리**: `STRING_AGG` 함수로 노트 목록 가져오기 → `database.py:15-50`

### Phase 5: 배포 이해 (1주)

- **Docker**: 코드 + 환경을 하나의 이미지로 패키징 → `Dockerfile`
- **RunPod**: GPU가 필요한 ML 모델을 서버리스로 실행 → `runpod/handler.py`
- **환경변수 분리**: 개발/운영 환경별로 `.env` 파일을 다르게 관리

---

## 개발 시 자주 쓰는 패턴

### API 테스트

서버 실행 후 `http://localhost:8000/docs`에서 Swagger UI로 테스트:

```json
POST /recommend
{
  "text": "신선하고 시트러스한 여름 느낌",
  "age": "20대",
  "note": "top",
  "money": "100000"
}
```

### 임베딩 재생성 (향수 데이터 변경 시)

```bash
python dataSets/embed.py
```

### RunPod 핸들러 로컬 테스트

```python
# 핸들러 함수를 직접 호출해서 테스트
from runpod.handler import handler
result = handler({"input": {"text": "장미꽃 향기"}})
print(len(result["embedding"]))  # 1024
```

---

## 현재 알려진 개선 포인트

1. ~~**`@app.on_event("startup")` deprecated** → `lifespan` 패턴으로 교체 필요~~ ✅ 완료
2. ~~**DB 연결 풀링 없음** → 요청마다 연결/해제 중, SQLAlchemy 도입 권장~~ ✅ 완료
3. **`money`, `age` 파라미터 미활용** → 가격 필터링 로직 연결 필요
4. **LLM 추천 이유가 엔드포인트에 연결 안 됨** → `llm_reasoner.py` 통합 필요
5. **벡터 검색 성능** → 데이터 수 증가 시 pgvector 확장 도입 권장

---

## 도움 요청하는 법

코드 수정 요청 시 아래처럼 말해주면 빠르게 도울 수 있습니다:

- "현재 `/recommend` 엔드포인트에서 가격 필터링을 추가하고 싶어"
- "`recommender.py`의 가중치 계산 방식이 이해가 안 돼, 설명해줘"
- "LLM 추천 이유를 응답에 포함하려면 어떻게 해야 해?"
- "DB 연결 방식을 SQLAlchemy로 바꾸고 싶어"
