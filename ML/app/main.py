import logging
import os
import time
from contextlib import asynccontextmanager

import numpy as np
import requests
from fastapi import FastAPI, HTTPException

from app.db.database import engine
from app.services.recommender import load_perfume_rows

logger = logging.getLogger(__name__)

RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_IMAGE_ENDPOINT_ID = os.getenv("RUNPOD_IMAGE_ENDPOINT_ID")


class RunPodEmbedder:
    """RunPod serverless 임베딩 엔드포인트 호출 wrapper"""

    def __init__(self, endpoint_id: str, api_key: str):
        self.base_url = f"https://api.runpod.ai/v2/{endpoint_id}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def _submit_job(self, text: str) -> str:
        """임베딩 job을 RunPod에 제출하고 job_id를 반환"""
        try:
            response = requests.post(
                f"{self.base_url}/run",
                headers=self.headers,
                json={"input": {"text": text}},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()["id"]
        except requests.Timeout:
            raise HTTPException(status_code=504, detail="RunPod job 제출 타임아웃")
        except requests.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"RunPod job 제출 실패: {e}")

    def _poll_job(self, job_id: str) -> np.ndarray:
        """job이 완료될 때까지 폴링하고 임베딩 벡터를 반환 (최대 5분)"""
        status_url = f"{self.base_url}/status/{job_id}"
        for _ in range(300):
            time.sleep(1)
            try:
                status_resp = requests.get(status_url, headers=self.headers, timeout=10)
                status_resp.raise_for_status()
            except requests.Timeout:
                raise HTTPException(status_code=504, detail="RunPod 상태 조회 타임아웃")
            except requests.HTTPError as e:
                raise HTTPException(status_code=502, detail=f"RunPod 상태 조회 실패: {e}")

            result = status_resp.json()
            if result.get("status") == "COMPLETED":
                return np.array(result["output"]["embedding"], dtype=np.float32)
            if result.get("status") in ("FAILED", "CANCELLED"):
                raise HTTPException(status_code=502, detail=f"RunPod job 실패: {result}")

        raise HTTPException(status_code=504, detail="RunPod job 타임아웃 (5분 초과)")

    def encode(self, text: str) -> np.ndarray:
        job_id = self._submit_job(text)
        return self._poll_job(job_id)

class RunPodMoodExtractor:
    """RunPod serverless 무드 추출 엔드포인트 호출 wrapper"""

    def __init__(self, endpoint_id: str, api_key: str):
        self.base_url = f"https://api.runpod.ai/v2/{endpoint_id}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def _submit_job(self, image_base64: str, temperature: float = 15.0) -> str:
        """무드 추출 job을 RunPod에 제출하고 job_id를 반환"""
        try:
            response = requests.post(
                f"{self.base_url}/run",
                headers=self.headers,
                json={"input": {"image_base64": image_base64, "temperature": temperature}},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()["id"]
        except requests.Timeout:
            raise HTTPException(status_code=504, detail="RunPod job 제출 타임아웃")
        except requests.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"RunPod job 제출 실패: {e}")

    def _poll_job(self, job_id: str) -> dict[str, float]:
        """job이 완료될 때까지 폴링하고 무드 점수를 반환 (최대 5분)"""
        status_url = f"{self.base_url}/status/{job_id}"
        for _ in range(300):
            time.sleep(1)
            try:
                status_resp = requests.get(status_url, headers=self.headers, timeout=10)
                status_resp.raise_for_status()
            except requests.Timeout:
                raise HTTPException(status_code=504, detail="RunPod 상태 조회 타임아웃")
            except requests.HTTPError as e:
                raise HTTPException(status_code=502, detail=f"RunPod 상태 조회 실패: {e}")

            result = status_resp.json()
            if result.get("status") == "COMPLETED":
                return result["output"]["mood_scores"]
            if result.get("status") in ("FAILED", "CANCELLED"):
                raise HTTPException(status_code=502, detail=f"RunPod job 실패: {result}")

        raise HTTPException(status_code=504, detail="RunPod job 타임아웃 (5분 초과)")

    def extract_mood(self, image_base64: str, temperature: float = 15.0) -> dict[str, float]:
        """이미지 base64 → 무드 유사도 점수 추출"""
        job_id = self._submit_job(image_base64, temperature)
        return self._poll_job(job_id)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시 (startup)
    if not RUNPOD_API_KEY or not RUNPOD_ENDPOINT_ID:
        raise RuntimeError("RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID 환경변수가 필요합니다.")
    app.state.embedder = RunPodEmbedder(RUNPOD_ENDPOINT_ID, RUNPOD_API_KEY)
    app.state.perfume_rows = load_perfume_rows()
    if RUNPOD_IMAGE_ENDPOINT_ID:
        app.state.mood_extractor = RunPodMoodExtractor(RUNPOD_IMAGE_ENDPOINT_ID, RUNPOD_API_KEY)
        logger.info("이미지 무드 추출기 초기화 완료")
    logger.info("앱 시작 완료: 임베더 및 향수 데이터 로드됨")
    yield
    # shutdown
    engine.dispose()
    logger.info("앱 종료: DB 연결 풀 해제됨")


app = FastAPI(lifespan=lifespan)

from app.api.v1 import recommend
app.include_router(recommend.router, prefix="/api/v1")
