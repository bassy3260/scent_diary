import base64
import logging
from typing import Callable, Literal

import numpy as np

from fastapi import APIRouter, HTTPException, Request

import httpx

from app.api.v1.schemas import (
    NOTE_RATIO, RecommendRequest, RecommendListResponse, RecommendResponse,
    ImageRecommendListResponse, ImageRecommendRequest,
    MemberRecommendRequest, MemberRecommendResponse, MemberRecommendItem,
)
from app.db.database import fetch_perfume_cards
from app.services.llm_reasoner import generate_recommendation_reason, generate_recommendation_reason_by_mood
from app.services.mood_to_accord import convert_mood_to_accord, get_top_accords
from app.services.recommender import recommend_perfumes, rank_perfumes

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


def _build_recommend_list(perfumes: list, reason_fn: Callable[[dict], str]) -> RecommendListResponse:
    """공통 응답 포맷 생성. reason_fn은 향수 dict를 받아 추천 이유 문자열을 반환하는 함수."""
    return RecommendListResponse(
        recommendations=[
            RecommendResponse(
                perfume_id=p["perfume_id"],
                perfume_name=p["perfume_name"],
                price=p["price"],
                score=p["score"],
                accords=p["accords"],
                description=p["description"],
                reason=reason_fn(p),
            )
            for p in perfumes
        ]
    )


@router.post("/recommend/text")
def recommend(req: RecommendRequest, request: Request) -> RecommendListResponse:
    embedder = request.app.state.embedder
    perfume_rows = request.app.state.perfume_rows

    weights = _build_weights(req.note)
    results = recommend_perfumes(req.keyword, embedder, weights, rows=perfume_rows, max_price=req.price, top_k=3)

    logger.debug("추천 결과 %d건 반환", len(results))
    return _build_recommend_list(results, lambda p: generate_recommendation_reason(req.keyword, p))


@router.post("/recommend/image")
async def recommend_by_image(req: ImageRecommendRequest,request: Request) -> ImageRecommendListResponse:
    """S3 이미지 URL → 무드 추출 → 어코드 벡터 → 텍스트 임베딩 → 향수 추천"""
    import time
    t_total = time.time()

    # 1. S3 URL에서 이미지 다운로드 + base64 인코딩
    t0 = time.time()
    async with httpx.AsyncClient() as client:
        resp = await client.get(req.image_url, timeout=30.0)
        resp.raise_for_status()
        image_bytes = resp.content
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    logger.info("[타이밍] 이미지 다운로드 + 인코딩: %.2fs", time.time() - t0)

    # 2. RunPod → 무드 유사도 추출
    t0 = time.time()
    mood_extractor = request.app.state.mood_extractor
    mood_scores = mood_extractor.extract_mood(image_base64)
    logger.info("[타이밍] RunPod 무드 추출: %.2fs", time.time() - t0)

    # 3. 상위 무드 추출 (점수 1위)
    top_mood = max(mood_scores, key=mood_scores.get)
    logger.info("이미지 상위 무드: %s", top_mood)

    # 4. 무드 → 어코드 벡터 → 사전 계산된 어코드 임베딩과 가중 합산 → query_vec
    t0 = time.time()
    accord_vector = convert_mood_to_accord(mood_scores)
    accord_embeddings = request.app.state.accord_embeddings  # (33, 1024)
    query_vec = accord_vector @ accord_embeddings             # (1024,)
    query_vec = query_vec / np.linalg.norm(query_vec)
    logger.info("[타이밍] 어코드 변환 + 가중 합산: %.2fs", time.time() - t0)

    # 5. 코사인 유사도 기반 향수 추천 (텍스트와 동일 로직)
    t0 = time.time()
    weights = _build_weights(req.note)
    results = rank_perfumes(query_vec, weights, rows=request.app.state.perfume_rows, max_price=req.price, top_k=3)
    logger.info("[타이밍] 유사도 계산: %.2fs", time.time() - t0)

    # 6. LLM 추천 이유 생성 + 응답 포맷
    t0 = time.time()
    recommend_list = _build_recommend_list(results, lambda p: generate_recommendation_reason_by_mood(top_mood, p))
    logger.info("[타이밍] LLM 추천 이유 생성: %.2fs", time.time() - t0)

    logger.info("[타이밍] 전체: %.2fs", time.time() - t_total)
    return ImageRecommendListResponse(keyword=top_mood, recommendations=recommend_list.recommendations)


@router.post("/recommend/member")
def recommend_by_member(req: MemberRecommendRequest, request: Request) -> MemberRecommendResponse:
    """소장 향수 기반 협업 필터링 추천"""
    cf = request.app.state.cf_recommender
    top_ids = cf.recommend(req.member_id)

    if not top_ids:
        raise HTTPException(status_code=404, detail="소장 향수가 없거나 추천할 향수가 없습니다.")

    cards = fetch_perfume_cards(top_ids)
    return MemberRecommendResponse(
        recommendations=[
            MemberRecommendItem(
                perfume_id=c["perfume_id"],
                perfume_name=c["perfume_name"],
                image_route=c.get("image_route"),
                accords=c["accords"].split(",") if c.get("accords") else [],
            )
            for c in cards
        ]
    )
