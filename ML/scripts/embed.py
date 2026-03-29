import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import fetch_perfumes, get_connection
from sentence_transformers import SentenceTransformer
import psycopg2

ZERO_VEC = [0.0] * 1024

def encode_or_zero(model, text):
    if text:
        return model.encode("passage: " + text).tolist()
    return ZERO_VEC

def save_embeddings():
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # 1. 향수 데이터 가져오기
    perfumes = fetch_perfumes()

    # 2. 모델 로딩
    model = SentenceTransformer("BAAI/bge-m3")

    # 3. 향수마다 노트별 벡터 분리 저장
    for p in perfumes:
        print(f"처리 중: {p['perfume_id']}")

        accord_emb  = encode_or_zero(model, p["accords"])
        top_emb     = encode_or_zero(model, p["top_notes"])
        middle_emb  = encode_or_zero(model, p["middle_notes"])
        base_emb    = encode_or_zero(model, p["base_notes"])
        single_emb  = encode_or_zero(model, p["single_notes"])
        desc_emb    = encode_or_zero(model, p["description"])

        # 싱글 노트가 있으면 single_notes만, 없으면 top/middle/base 사용
        if p["single_notes"]:
            content = " ".join(filter(None, [
                p["accords"], p["single_notes"], p["description"]
            ]))
        else:
            content = " ".join(filter(None, [
                p["accords"], p["top_notes"], p["middle_notes"],
                p["base_notes"], p["description"]
            ]))

        main_accord  = p["accords"].split(",")[0] if p["accords"] else None
        accords_list = p["accords"].split(",") if p["accords"] else []

        query = """
        INSERT INTO perfume_embedding
        (perfume_id, content, accords, main_accord,
         accord_embedding, top_embedding, middle_embedding, base_embedding, single_embedding, desc_embedding)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        """

        cursor.execute(query, (
            p["perfume_id"],
            content,
            accords_list,
            main_accord,
            accord_emb,
            top_emb,
            middle_emb,
            base_emb,
            single_emb,
            desc_emb,
        ))

    conn.commit()
    conn.close()
    print("임베딩 저장 완료")

if __name__ == "__main__":
    save_embeddings()
