import logging
from typing import List

from fastapi import APIRouter, Request

from app.api.v1.schemas import NOTE_RATIO, RecommendRequest, RecommendResponse
from app.services.recommender import recommend_perfumes

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_weights(note: str) -> dict[str, float]:
    """선호 노트 기반 가중치 딕셔너리 생성"""
    ratio = NOTE_RATIO[note]
    return {
        "accord": 0.4,
        "top":    0.3 * ratio["top"],
        "middle": 0.3 * ratio["middle"],
        "base":   0.3 * ratio["base"],
        "desc":   0.3,
    }


@router.post("/recommend/text")
def recommend(req: RecommendRequest, request: Request) -> List[RecommendResponse]:
    embedder = request.app.state.embedder
    perfume_rows = request.app.state.perfume_rows

    weights = _build_weights(req.note)
    top_k = recommend_perfumes(req.text, embedder, weights, rows=perfume_rows, top_k=5)

    logger.debug("추천 결과 %d건 반환", len(top_k))

    return [
        RecommendResponse(
            perfume_id=p["perfume_id"],
            perfume_name=p["perfume_name"],
            price=p["price"],
            score=p["score"],
            accords=p["accords"],
            description=p["description"],
        )
        for p in top_k
    ]
