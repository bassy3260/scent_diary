import logging
import os
from contextlib import asynccontextmanager

import numpy as np
import requests
from fastapi import FastAPI, HTTPException

from app.db.database import engine
from app.services.recommender import load_perfume_rows

logger = logging.getLogger(__name__)

POD_EMBED_URL = os.getenv("POD_EMBED_URL")
POD_MOOD_URL = os.getenv("POD_MOOD_URL")


class PodEmbedder:
    """RunPod Pod 임베딩 엔드포인트 호출 wrapper"""

    def __init__(self, url: str):
        self.url = url

    def encode(self, text: str) -> np.ndarray:
        try:
            response = requests.post(self.url, json={"text": text}, timeout=60)
            response.raise_for_status()
            return np.array(response.json()["embedding"], dtype=np.float32)
        except requests.Timeout:
            raise HTTPException(status_code=504, detail="Pod 임베딩 서버 응답 시간 초과")
        except requests.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Pod 임베딩 서버 오류: {e}")


class PodMoodExtractor:
    """RunPod Pod 무드 추출 엔드포인트 호출 wrapper"""

    def __init__(self, url: str):
        self.url = url

    def extract_mood(self, image_base64: str, temperature: float = 15.0) -> dict[str, float]:
        """이미지 base64 → 무드 유사도 점수 추출"""
        try:
            response = requests.post(
                self.url,
                json={"image_base64": image_base64, "temperature": temperature},
                timeout=60,
            )
            response.raise_for_status()
            return response.json()["mood_scores"]
        except requests.Timeout:
            raise HTTPException(status_code=504, detail="Pod 무드 추출 서버 응답 시간 초과")
        except requests.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Pod 무드 추출 서버 오류: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시 (startup)
    if not POD_EMBED_URL:
        raise RuntimeError("POD_EMBED_URL 환경변수가 필요합니다.")
    app.state.embedder = PodEmbedder(POD_EMBED_URL)
    app.state.perfume_rows = load_perfume_rows()
    if POD_MOOD_URL:
        app.state.mood_extractor = PodMoodExtractor(POD_MOOD_URL)
        logger.info("이미지 무드 추출기 초기화 완료")
    logger.info("앱 시작 완료: 임베더 및 향수 데이터 로드됨")
    yield
    # shutdown
    engine.dispose()
    logger.info("앱 종료: DB 연결 풀 해제됨")


app = FastAPI(lifespan=lifespan)

from app.api.v1 import recommend
app.include_router(recommend.router, prefix="/api/v1")
