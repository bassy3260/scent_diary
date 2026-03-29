# 향수 추천 ML 학습 노트

## 전체 흐름

```
사용자 텍스트 (POST /recommend)
        ↓
DB에서 향수 목록 조회 (perfume + accord + note + description)
        ↓
임베딩으로 유사도 계산 (sentence-transformers)
        ↓
상위 N개 반환
```

## 파일 구조

```
ML/
├── dataSets/
├── recommendation/
│   ├── main.py               ← FastAPI 앱 (엔드포인트)
│   ├── database.py           ← DB 연결 & 쿼리
│   ├── recommender.py        ← 추천 로직 (임베딩 버전)
│   └── recommender_tfidf.py  ← 추천 로직 (TF-IDF 버전, 보관용)
└── requirements.txt
```

---

## 1단계 — DB 연결 & 데이터 가져오기

### DB 연결 (database.py)

```python
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    "host": "...",
    "port": 8432,
    "database": "fragrance_local",
    "user": "postgres",
    "password": "...",
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)
```

- `**DB_CONFIG` : 딕셔너리 언패킹으로 깔끔하게 전달

### SQL 쿼리 — perfume + accord 조인

```sql
SELECT
    p.perfume_id,
    p.perfume_name,
    a.accord_name
FROM perfume p
JOIN perfume_accord pa ON pa.perfume_id = p.perfume_id
JOIN accord a ON a.accord_id = pa.accord_id
```

- `perfume`을 기준으로 중간 테이블 `perfume_accord` → `accord` 순으로 JOIN
- 테이블 별칭(alias) 사용 시 컬럼은 반드시 `테이블별칭.컬럼명` 으로 명시

### 주의 — 행 중복 문제

위 쿼리는 accord 개수만큼 행이 여러 개 나옴:

```
perfume_id | perfume_name | accord_name
1          | Chanel No.5  | floral
1          | Chanel No.5  | powdery
1          | Chanel No.5  | musky
```

TF-IDF를 위해 향수 한 개당 한 행으로 만들어야 함
→ 해결: `GROUP BY` + `STRING_AGG`

---

### fetch_perfumes() 최종 쿼리

```sql
SELECT
    p.perfume_id,
    p.perfume_name,
    STRING_AGG(a.accord_name, ',') AS accords,
    STRING_AGG(n.note_name, ',') AS notes
FROM perfume p
JOIN perfume_accord pa ON pa.perfume_id = p.perfume_id
JOIN accord a ON a.accord_id = pa.accord_id
JOIN perfume_note pn ON pn.perfume_id = p.perfume_id
JOIN note n ON n.note_id = pn.note_id
GROUP BY p.perfume_id, p.perfume_name
```

- `STRING_AGG(컬럼, '구분자')` + `GROUP BY` → 여러 행을 한 줄로 합치기
- `RealDictCursor` → 결과를 딕셔너리로 반환

---

### JOIN 중복 문제 & 서브쿼리 해결

- accord + note를 동시에 JOIN하면 곱집합 발생 → `STRING_AGG`가 중복 반복
- 해결: 서브쿼리로 accord, top_notes, middle_notes, base_notes, single_notes 각각 집계

```sql
(SELECT STRING_AGG(a.accord_name, ',')
 FROM perfume_accord pa
 JOIN accord a ON a.accord_id = pa.accord_id
 WHERE pa.perfume_id = p.perfume_id) AS accords
```

---

## 2단계 — FastAPI 엔드포인트 (main.py)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

class RecommendRequest(BaseModel):
    text: str

class RecommendResponse(BaseModel):
    perfume_id: int
    perfume_name: str
    price: int

@app.post("/recommend")
def recommend(req: RecommendRequest) -> List[RecommendResponse]:
    perfumes = fetch_perfumes()
    ...
```

- `BaseModel` → 요청/응답 JSON을 Python 객체로 자동 변환
- `List[RecommendResponse]` → 여러 개 반환 시 사용
- 실행: `uvicorn recommendation.main:app --reload`
- Swagger UI: `http://localhost:8000/docs`

---

---

## 3단계 — TF-IDF 추천 로직 (recommender.py)

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_perfumes(user_text: str, perfumes: list, top_k: int = 5):
    # 1. 향수별 텍스트 합치기
    corpus = []
    for p in perfumes:
        if p["single_notes"] is None:
            notes = " ".join(filter(None, [p["top_notes"], p["middle_notes"], p["base_notes"]]))
        else:
            notes = p["single_notes"]
        text = " ".join(filter(None, [p["perfume_name"], p["accords"], notes]))
        corpus.append(text)

    # 2. TF-IDF 벡터화
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)   # 향수 전체 학습 + 변환
    user_vector = vectorizer.transform([user_text])   # 사용자 입력은 변환만

    # 3. 코사인 유사도 계산
    scores = cosine_similarity(user_vector, tfidf_matrix)[0]
    top_indices = scores.argsort()[::-1][:top_k]     # 높은 순으로 top_k개

    # 4. 결과 반환 (유사도 점수 포함)
    return [{**perfumes[i], "score": float(scores[i])} for i in top_indices]
```

### 핵심 개념

- `fit_transform` vs `transform`: 향수 전체로 학습(fit), 사용자 입력은 같은 공간으로 변환(transform)만
- `filter(None, 리스트)`: None 제거 → TypeError 방지
- `argsort()[::-1]`: 낮은 순 정렬 후 뒤집기 = 높은 순
- `{**perfumes[i], "score": ...}`: 딕셔너리 언패킹으로 score 필드 추가

---

## main.py 최종 구조

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from database import fetch_perfumes
from recommender import recommend_perfumes

app = FastAPI()

class RecommendRequest(BaseModel):
    text: str

class RecommendResponse(BaseModel):
    perfume_id: int
    perfume_name: str
    price: int
    score: float

@app.post("/recommend")
def recommend(req: RecommendRequest) -> List[RecommendResponse]:
    perfumes = fetch_perfumes()
    top_k = recommend_perfumes(req.text, perfumes, 5)
    return [
        RecommendResponse(
            perfume_id=p["perfume_id"],
            perfume_name=p["perfume_name"],
            price=p["price"],
            score=p["score"]
        )
        for p in top_k
    ]
```

---

---

## 4단계 — 임베딩으로 업그레이드 (recommender.py)

### TF-IDF의 한계

| 문제 | 예시 |
|------|------|
| 단어 일치만 봄 | "꿀" ≠ "honey" → 매칭 안 됨 |
| 동의어 모름 | "woody" ≠ "wood" |
| 문맥 모름 | "not sweet" → sweet 향수 추천 |

### 임베딩 (sentence-transformers)

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
corpus_vectors = model.encode(corpus)      # 향수 전체
user_vector = model.encode([user_text])    # 사용자 입력
```

- `fit_transform` / `transform` 없음 → `encode` 만 사용
- 한국어/영어 모두 같은 벡터 공간으로 표현
- 의미 기반 → "꿀 같은 향" ≈ "달콤한 앰버 향"

### 추천 시스템 종류

| 종류 | 방법 |
|------|------|
| **콘텐츠 기반 필터링** | 아이템 특징으로 추천 ← **우리 것** |
| 협업 필터링 | 비슷한 사용자 행동 기반 |
| 하이브리드 | 둘 다 섞음 |

### 가중치 전략 (다음 단계)

accord > description > notes 순으로 가중치 부여:

```python
accord_vec = model.encode(p["accords"])       # 가중치 0.6
desc_vec   = model.encode(p["description"])   # 가중치 0.3
notes_vec  = model.encode(notes)              # 가중치 0.1

final_vec = accord_vec * 0.6 + desc_vec * 0.3 + notes_vec * 0.1
```

---

## 다음 단계

- [x] `STRING_AGG`로 accord를 한 줄로 합치기
- [x] note 도 같이 가져오기 (TOP/MIDDLE/BASE/SINGLE 분리)
- [x] `fetch_perfumes()` 완성 (price, description 포함)
- [x] FastAPI 엔드포인트 작성 (main.py)
- [x] TF-IDF 추천 로직 작성 (recommender_tfidf.py 보관)
- [x] 임베딩 버전으로 업그레이드 (recommender.py)
- [ ] accord/description/notes 가중치 분리 적용
- [ ] 가중치 튜닝 & 성능 테스트
