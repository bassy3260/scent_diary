
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
