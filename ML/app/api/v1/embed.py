"""
app/api/v1/embed.py
─────────────────────────────────────────────────────
향수 데이터 동기화 파이프라인의 ML측 엔드포인트.
BE(Spring)의 outbox 워커가 perfume 관련 변경을 감지하면, 향수 1건을 지정해서
이 엔드포인트를 호출 -> 그 향수의 임베딩만 재계산해서 perfume_embedding에 반영한다.
─────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.services.embedding_service import save_perfume_embedding

logger = logging.getLogger(__name__)
router = APIRouter()


class EmbedPerfumeResponse(BaseModel):
    status: str
    perfume_id: int


@router.post("/embed/perfume/{perfume_id}")
def embed_perfume(perfume_id: int, request: Request) -> EmbedPerfumeResponse:
    embedder = request.app.state.embedder
    updated = save_perfume_embedding(perfume_id, embedder.encode)

    if not updated:
        raise HTTPException(status_code=404, detail=f"perfume_id={perfume_id}를 찾을 수 없습니다")

    return EmbedPerfumeResponse(status="ok", perfume_id=perfume_id)
