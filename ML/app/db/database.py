
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine,text

load_dotenv() #env 파일 읽기

DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
    f"/{os.getenv('DB_NAME')}"
)

engine = create_engine(
    DATABASE_URL,
    pool_size=5, # 기본 유지할 연결 수
    max_overflow=10, #5개 다 쓰면 최대 10개 추가 허용
)

def get_connection():
    return engine.connect()

def fetch_user_likes() -> list[dict]:
    """모든 유저의 소장 향수 (member_id, perfume_id) 목록 반환"""
    query = text("""
        SELECT member_id, perfume_id
        FROM member_perfume
        WHERE is_delete = false
    """)
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    return [{"member_id": r["member_id"], "perfume_id": r["perfume_id"]} for r in rows]


def fetch_user_accord_tf(bm25_k: float = 4.0) -> list[dict]:
    """유저별 어코드 BM25 TF 반환 (CF 추천 모델 학습용)"""
    query = text(f"""
        SELECT l.member_id,
               pa.accord_id,
               CAST(COUNT(*) AS FLOAT) / (COUNT(*) + {bm25_k}) AS tf
        FROM   member_perfume l
        JOIN   perfume_accord pa ON l.perfume_id = pa.perfume_id
        WHERE  l.is_delete = false
        GROUP  BY l.member_id, pa.accord_id
    """)
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    return [{"member_id": r["member_id"], "accord_id": r["accord_id"], "tf": r["tf"]} for r in rows]


def fetch_perfume_accord_map() -> list[dict]:
    """향수-어코드 매핑 반환 (CF 콘텐츠 벡터 구축용)"""
    query = text("SELECT perfume_id, accord_id FROM perfume_accord")
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    return [{"perfume_id": r["perfume_id"], "accord_id": r["accord_id"]} for r in rows]


def fetch_accord_dict() -> dict[int, str]:
    """accord_id → accord_name 매핑 반환"""
    query = text("SELECT accord_id, accord_name FROM accord")
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    return {r["accord_id"]: r["accord_name"] for r in rows}


def fetch_perfume_cards(perfume_ids: list[int]) -> list[dict]:
    """추천 결과 응답용: 향수 이름, 이미지, 어코드 배열 반환"""
    if not perfume_ids:
        return []
    ids_sql = ", ".join(str(pid) for pid in perfume_ids)
    query = text(f"""
        SELECT p.perfume_id,
               p.perfume_name,
               p.image_route,
               STRING_AGG(a.accord_name, ',') AS accords
        FROM   perfume p
        JOIN   perfume_accord pa ON pa.perfume_id = p.perfume_id
        JOIN   accord a          ON a.accord_id   = pa.accord_id
        WHERE  p.perfume_id IN ({ids_sql})
        GROUP  BY p.perfume_id, p.perfume_name, p.image_route
    """)
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    # 추천 순서 보존
    row_map = {r["perfume_id"]: dict(r) for r in rows}
    return [row_map[pid] for pid in perfume_ids if pid in row_map]


def fetch_perfume_by_id(perfume_id: int) -> dict | None:
    """향수 1건의 임베딩 재계산에 필요한 데이터 반환. 없으면 None (fetch_perfumes()의 단건 버전)."""
    query = text("""
        SELECT
        p.perfume_id,
        p.perfume_name,
        p.price,
        p.description,
        (SELECT STRING_AGG(a.accord_name, ',')
         FROM perfume_accord pa JOIN accord a ON a.accord_id = pa.accord_id
         WHERE pa.perfume_id = p.perfume_id) AS accords,
        (SELECT STRING_AGG(n.note_name, ',')
         FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'TOP') AS top_notes,
        (SELECT STRING_AGG(n.note_name, ',')
         FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'MIDDLE') AS middle_notes,
        (SELECT STRING_AGG(n.note_name, ',')
         FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'BASE') AS base_notes,
        (SELECT STRING_AGG(n.note_name, ',')
         FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'SINGLE') AS single_notes
        FROM perfume p
        WHERE p.perfume_id = :perfume_id
    """)
    with get_connection() as conn:
        row = conn.execute(query, {"perfume_id": perfume_id}).mappings().first()
    return dict(row) if row else None


def _to_pgvector_literal(values: list[float]) -> str:
    """pgvector의 vector 타입은 '[0.1,0.2,...]' 형식의 텍스트를 CAST로 받아들인다.
    (이 프로젝트엔 pgvector 파이썬 패키지의 어댑터 등록이 없어서, 리스트를 바로
    바인딩하면 psycopg2가 일반 배열 리터럴로 변환해버려 타입이 안 맞음 -- 그래서
    직접 이 형식의 문자열로 만들어 CAST(:x AS vector)로 넘긴다.)"""
    return "[" + ",".join(str(v) for v in values) + "]"


def upsert_perfume_embedding(
    perfume_id: int,
    content: str,
    accords_list: list[str],
    main_accord: str | None,
    accord_embedding: list[float],
    top_embedding: list[float],
    middle_embedding: list[float],
    base_embedding: list[float],
    single_embedding: list[float],
    desc_embedding: list[float],
) -> None:
    """perfume_embedding에 향수 1건을 upsert (scripts/embed.py의 ON CONFLICT 로직과 동일)."""
    query = text("""
        INSERT INTO perfume_embedding
        (perfume_id, content, accords, main_accord,
         accord_embedding, top_embedding, middle_embedding, base_embedding, single_embedding, desc_embedding)
        VALUES
        (:perfume_id, :content, :accords, :main_accord,
         CAST(:accord_embedding AS vector), CAST(:top_embedding AS vector),
         CAST(:middle_embedding AS vector), CAST(:base_embedding AS vector),
         CAST(:single_embedding AS vector), CAST(:desc_embedding AS vector))
        ON CONFLICT (perfume_id) DO UPDATE SET
            content          = EXCLUDED.content,
            accords          = EXCLUDED.accords,
            main_accord      = EXCLUDED.main_accord,
            accord_embedding = EXCLUDED.accord_embedding,
            top_embedding    = EXCLUDED.top_embedding,
            middle_embedding = EXCLUDED.middle_embedding,
            base_embedding   = EXCLUDED.base_embedding,
            single_embedding = EXCLUDED.single_embedding,
            desc_embedding   = EXCLUDED.desc_embedding
    """)
    # engine.begin(): 블록이 정상 종료되면 자동 커밋, 예외가 나면 자동 롤백.
    with engine.begin() as conn:
        conn.execute(query, {
            "perfume_id": perfume_id,
            "content": content,
            "accords": accords_list,
            "main_accord": main_accord,
            "accord_embedding": _to_pgvector_literal(accord_embedding),
            "top_embedding": _to_pgvector_literal(top_embedding),
            "middle_embedding": _to_pgvector_literal(middle_embedding),
            "base_embedding": _to_pgvector_literal(base_embedding),
            "single_embedding": _to_pgvector_literal(single_embedding),
            "desc_embedding": _to_pgvector_literal(desc_embedding),
        })


def fetch_perfumes():
    with get_connection() as conn:

        query = text("""
        SELECT
        p.perfume_id,
        p.perfume_name,
        p.price,
        p.description,
        (SELECT
            STRING_AGG(a.accord_name, ',') AS accords
         FROM perfume_accord pa
         JOIN accord a ON a.accord_id = pa.accord_id
         WHERE pa.perfume_id = p.perfume_id) AS accords,
        (SELECT
            STRING_AGG(n.note_name,',') AS notes
         FROM perfume_note pn
         JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level='TOP') AS top_notes,
         (SELECT
            STRING_AGG(n.note_name,',') AS notes
         FROM perfume_note pn
         JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level='MIDDLE') AS middle_notes,
         (SELECT
            STRING_AGG(n.note_name,',') AS notes
         FROM perfume_note pn
         JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level='BASE') AS base_notes,
         (SELECT
            STRING_AGG(n.note_name,',') AS notes
         FROM perfume_note pn
         JOIN note n ON n.note_id = pn.note_id
         WHERE pn.perfume_id = p.perfume_id AND pn.note_level='SINGLE') AS single_notes
        FROM perfume p
        """)
        rows = conn.execute(query).mappings().all()
        # with블록이 끝나면 자동 conn.close 반환되는 효과!!

    return rows
