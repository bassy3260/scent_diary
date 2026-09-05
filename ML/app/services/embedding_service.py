"""
app/services/embedding_service.py
─────────────────────────────────────────────────────
향수 1건의 임베딩을 다시 계산해서 perfume_embedding에 반영한다.
scripts/embed.py(전체 배치 스크립트)와 텍스트 조립 로직은 동일하고, 대상만
향수 1건으로 좁힌 버전 -- BE의 outbox 워커가 이 로직을 API로 호출하기 위함.
─────────────────────────────────────────────────────
"""

import logging
from typing import Callable

from app.db.database import fetch_perfume_by_id, upsert_perfume_embedding

logger = logging.getLogger(__name__)

ZERO_VEC = [0.0] * 1024

# embedder.encode(text) 시그니처를 그대로 받는다 (PodEmbedder.encode와 동일 형태).
EncodeFn = Callable[[str], list[float]]


def _encode_or_zero(encode_fn: EncodeFn, text: str | None) -> list[float]:
    """embed.py와 동일한 규칙: 텍스트가 있으면 'passage: ' 접두사를 붙여 임베딩,
    없으면(예: single_notes가 없는 향수의 single_embedding) 0벡터."""
    if text:
        return list(encode_fn("passage: " + text))
    return ZERO_VEC


def save_perfume_embedding(perfume_id: int, encode_fn: EncodeFn) -> bool:
    """
    perfume_id 하나의 임베딩을 재계산해서 perfume_embedding에 upsert한다.
    해당 향수가 없으면(soft-delete와 무관하게 perfume 테이블에 없으면) False를 반환하고
    아무것도 하지 않는다.
    """
    row = fetch_perfume_by_id(perfume_id)
    if row is None:
        logger.warning("[embedding] perfume_id=%s 없음 -- 임베딩 스킵", perfume_id)
        return False

    accord_emb = _encode_or_zero(encode_fn, row["accords"])
    top_emb = _encode_or_zero(encode_fn, row["top_notes"])
    middle_emb = _encode_or_zero(encode_fn, row["middle_notes"])
    base_emb = _encode_or_zero(encode_fn, row["base_notes"])
    single_emb = _encode_or_zero(encode_fn, row["single_notes"])
    desc_emb = _encode_or_zero(encode_fn, row["description"])

    # 싱글 노트가 있으면 single_notes만, 없으면 top/middle/base 사용 (embed.py와 동일 규칙)
    if row["single_notes"]:
        content = " ".join(filter(None, [row["accords"], row["single_notes"], row["description"]]))
    else:
        content = " ".join(filter(None, [
            row["accords"], row["top_notes"], row["middle_notes"], row["base_notes"], row["description"],
        ]))

    main_accord = row["accords"].split(",")[0] if row["accords"] else None
    accords_list = row["accords"].split(",") if row["accords"] else []

    upsert_perfume_embedding(
        perfume_id=perfume_id,
        content=content,
        accords_list=accords_list,
        main_accord=main_accord,
        accord_embedding=accord_emb,
        top_embedding=top_emb,
        middle_embedding=middle_emb,
        base_embedding=base_emb,
        single_embedding=single_emb,
        desc_embedding=desc_emb,
    )
    logger.info("[embedding] perfume_id=%s 임베딩 갱신 완료", perfume_id)
    return True
