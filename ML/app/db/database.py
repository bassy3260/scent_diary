
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
        FROM likes
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
        FROM   likes l
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
