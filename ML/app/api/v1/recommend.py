import base64
import logging
from typing import List

from fastapi import APIRouter, File, Request, UploadFile

from app.api.v1.schemas import (
    NOTE_RATIO, RecommendRequest, RecommendListResponse, RecommendResponse,
    AccordWeight, ImageRecommendResponse, MoodScore,
)
from app.services.llm_reasoner import generate_recommendation_reason
from app.services.mood_to_accord import convert_mood_to_accord, get_top_accords
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
def recommend(req: RecommendRequest, request: Request) -> RecommendListResponse:
    embedder = request.app.state.embedder
    perfume_rows = request.app.state.perfume_rows

    weights = _build_weights(req.note)
    top_k = recommend_perfumes(req.keyword, embedder, weights, rows=perfume_rows, max_price=req.price, top_k=3)

    logger.debug("추천 결과 %d건 반환", len(top_k))

    return RecommendListResponse(
        recommendations=[
            RecommendResponse(
                perfume_id=p["perfume_id"],
                perfume_name=p["perfume_name"],
                price=p["price"],
                score=p["score"],
                accords=p["accords"],
                description=p["description"],
                reason=generate_recommendation_reason(req.keyword, p),
            )
            for p in top_k
        ]
    )


@router.post("/recommend/image", response_model=ImageRecommendResponse)
async def recommend_by_image(
    file: UploadFile = File(...),
    request: Request = None,
) -> ImageRecommendResponse:
    """이미지 업로드 → 무드 추출 → 어코드 벡터 변환"""
    # 1. 이미지 읽기 + base64 인코딩
    image_bytes = await file.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    # 2. RunPod 호출 → 무드 유사도 추출
    mood_extractor = request.app.state.mood_extractor
    mood_scores = mood_extractor.extract_mood(image_base64)

    # 3. 무드 → 어코드 벡터 변환 (CPU, rule-based)
    accord_vector = convert_mood_to_accord(mood_scores)
    top_accords = get_top_accords(accord_vector)

    # 4. 응답 반환
    return ImageRecommendResponse(
        mood_scores=[MoodScore(mood=k, score=v) for k, v in mood_scores.items()],
        accord_vector=accord_vector.tolist(),
        top_accords=[AccordWeight(**a) for a in top_accords],
    )
