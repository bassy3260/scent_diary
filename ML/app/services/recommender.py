import logging
import time
from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import text

from app.db.database import get_connection

logger = logging.getLogger(__name__)

ZERO_VEC = np.zeros(1024)


def parse_vec(raw: str | None) -> np.ndarray:
    if raw is None:
        return ZERO_VEC
    try:
        stripped = str(raw).strip()
        if not (stripped.startswith("[") and stripped.endswith("]")):
            raise ValueError(f"예상치 못한 벡터 형식: {stripped[:50]}")
        vec = np.fromstring(stripped[1:-1], sep=",")
        if vec.size == 0:
            raise ValueError("파싱 결과가 빈 벡터입니다")
        return vec
    except Exception as e:
        logger.warning("벡터 파싱 실패 → ZERO_VEC 반환. 원인: %s", e)
        return ZERO_VEC


def load_perfume_rows() -> list[dict[str, Any]]:
    query = text("""
        SELECT
            pe.perfume_id,
            pe.accords,
            pe.accord_embedding,
            pe.top_embedding,
            pe.middle_embedding,
            pe.base_embedding,
            pe.single_embedding,
            pe.desc_embedding,
            p.perfume_name,
            p.price,
            p.description,
            (SELECT STRING_AGG(n.note_name, ', ')
             FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
             WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'TOP') AS top_notes,
            (SELECT STRING_AGG(n.note_name, ', ')
             FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
             WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'MIDDLE') AS middle_notes,
            (SELECT STRING_AGG(n.note_name, ', ')
             FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
             WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'BASE') AS base_notes,
            (SELECT STRING_AGG(n.note_name, ', ')
             FROM perfume_note pn JOIN note n ON n.note_id = pn.note_id
             WHERE pn.perfume_id = p.perfume_id AND pn.note_level = 'SINGLE') AS single_notes
        FROM perfume_embedding pe
        JOIN perfume p ON p.perfume_id = pe.perfume_id
    """)
    with get_connection() as conn:
        rows = conn.execute(query).mappings().all()
    return rows


def _filter_by_price(rows: list, max_price: int) -> list:
    """가격 이하인 향수만 필터링"""
    return [r for r in rows if r["price"] <= max_price]


def _build_weighted_vec(row: dict, weights: dict[str, float]) -> np.ndarray:
    """향수 한 개의 가중합 임베딩 벡터 생성"""
    is_single_note = bool(row.get("single_notes"))
    single_vec = parse_vec(row.get("single_embedding"))

    if is_single_note:
        vecs = [parse_vec(row["accord_embedding"]), single_vec, parse_vec(row["desc_embedding"])]
        note_weight = weights.get("top", 0) + weights.get("middle", 0) + weights.get("base", 0)
        base_w = [weights.get("accord", 0), note_weight, weights.get("desc", 0)]
    else:
        keys = ["accord", "top", "middle", "base", "desc"]
        cols = ["accord_embedding", "top_embedding", "middle_embedding", "base_embedding", "desc_embedding"]
        vecs = [parse_vec(row[c]) for c in cols]
        base_w = [weights.get(k, 0) for k in keys]

    # non-zero 항목만 추려서 가중치 정규화
    active_w = [w if np.any(v) else 0.0 for v, w in zip(vecs, base_w)]
    total = sum(active_w)
    norm_w = [w / total if total > 0 else 0.0 for w in active_w]

    return sum(v * w for v, w in zip(vecs, norm_w))


def _build_corpus_vectors(rows: list, weights: dict[str, float]) -> np.ndarray:
    """전체 향수의 가중합 벡터 행렬 생성"""
    return np.array([_build_weighted_vec(row, weights) for row in rows])


def recommend_perfumes(
    keyword: str,
    model,
    weights: dict[str, float],
    rows: list,
    max_price: int | None = None,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    weights 예시:
    {
        "accord": 0.3,
        "top":    0.3,
        "middle": 0.2,
        "base":   0.1,
        "desc":   0.1
    }
    합이 1.0이 되도록 전달할 것.
    max_price: None이면 가격 필터 없음, 숫자면 해당 가격 이하만 조회
    """
    t0 = time.time()

    if max_price is not None:
        rows = _filter_by_price(rows, max_price)

    t1 = time.time()
    user_vec = model.encode("query: " + keyword)
    logger.debug("[타이밍] RunPod 임베딩: %.2fs", time.time() - t1)

    t2 = time.time()
    corpus_vectors = _build_corpus_vectors(rows, weights)
    scores = cosine_similarity(user_vec.reshape(1, -1), corpus_vectors)[0]
    top_indices = scores.argsort()[::-1][:top_k]
    logger.debug("[타이밍] 유사도 계산: %.2fs", time.time() - t2)
    logger.debug("[타이밍] 전체: %.2fs", time.time() - t0)

    return [{**rows[i], "score": float(scores[i])} for i in top_indices]
