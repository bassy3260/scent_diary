import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

import numpy as np
import requests
from fastapi import FastAPI, HTTPException

from app.constants import ACCORD_LIST
from app.db.database import engine, has_outbox_activity_since
from app.services.recommender import load_perfume_rows
from app.services.cf_recommender import CfRecommender

logger = logging.getLogger(__name__)

POD_EMBED_URL = os.getenv("POD_EMBED_URL")
POD_MOOD_URL = os.getenv("POD_MOOD_URL")

# perfume_rows(= perfume_embedding 전체를 메모리에 캐싱한 것)는 서버 시작 시 1회만
# 로드되고, outbox 워커가 DB의 perfume_embedding을 갱신해도 이 캐시엔 자동 반영이
# 안 됐음. 그래서 "dirty 체크 + 최소 간격 제한" 방식으로 새로고침한다:
#   - DIRTY_CHECK_SECONDS마다 "마지막 재로드 이후 뭔가 바뀌었나?"만 저비용으로 확인
#   - 바뀐 게 있어도, 마지막 재로드로부터 MIN_RELOAD_INTERVAL_SECONDS는 지나야 실제 재로드
# 이러면 아무것도 안 바뀌었을 땐 무거운 재로드 자체를 아예 안 하고, 짧은 시간에 여러 건이
# 몰려도 재로드가 폭주하지 않는다.
PERFUME_ROWS_DIRTY_CHECK_SECONDS = int(os.getenv("PERFUME_ROWS_DIRTY_CHECK_SECONDS", "5"))
PERFUME_ROWS_MIN_RELOAD_INTERVAL_SECONDS = int(os.getenv("PERFUME_ROWS_RELOAD_SECONDS", "30"))


async def _reload_perfume_rows_periodically(app: FastAPI) -> None:
    """dirty 체크 + 최소 간격 제한 방식으로 perfume_rows를 새로고침한다.

    블루-그린 스왑: 새 리스트를 다 만든 뒤 app.state.perfume_rows에 한 번에
    대입하므로, 이미 요청을 처리 중인(옛 리스트를 참조하고 있는) 스레드는 영향을
    안 받고, 그 다음 요청부터 새 리스트를 본다. 재로드 중 서빙이 멈추거나 일부만
    갱신된 상태로 보이는 일이 없음.
    """
    last_reload_time = datetime.now()  # lifespan에서 이미 최초 로드를 마친 시점 기준
    while True:
        await asyncio.sleep(PERFUME_ROWS_DIRTY_CHECK_SECONDS)

        elapsed = (datetime.now() - last_reload_time).total_seconds()
        if elapsed < PERFUME_ROWS_MIN_RELOAD_INTERVAL_SECONDS:
            continue  # 최소 간격 안 지났으면 dirty 체크도 없이 그냥 스킵

        try:
            dirty = await asyncio.to_thread(has_outbox_activity_since, last_reload_time)
        except Exception:
            logger.exception("[perfume_rows] dirty 체크 실패, 이번 주기는 건너뜀")
            continue

        if not dirty:
            continue  # 바뀐 게 없으면 무거운 재로드 자체를 안 함

        t0 = time.time()
        try:
            # load_perfume_rows()는 동기(블로킹) DB 호출이라, 이벤트 루프를
            # 막지 않도록 별도 스레드에서 실행한다.
            new_rows = await asyncio.to_thread(load_perfume_rows)
            app.state.perfume_rows = new_rows  # 참조 교체 (원자적)
            last_reload_time = datetime.now()
            logger.info("[perfume_rows] 재로드 완료: %d건, %.2fs 소요",
                        len(new_rows), time.time() - t0)
        except Exception:
            # 재로드가 실패해도 기존 app.state.perfume_rows는 그대로 유지되므로
            # 서빙 자체는 계속 정상 동작함 -- last_reload_time은 안 갱신하니 다음
            # 주기에 dirty 체크부터 다시 시도됨.
            logger.exception("[perfume_rows] 재로드 실패(%.2fs 경과), 기존 값 유지", time.time() - t0)


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
    app.state.cf_recommender = CfRecommender()
    app.state.cf_recommender.load()
    if POD_MOOD_URL:
        app.state.mood_extractor = PodMoodExtractor(POD_MOOD_URL)
        logger.info("이미지 무드 추출기 초기화 완료")
        ACCORD_EMB_PATH = "accord_embeddings.npy"
        if os.path.exists(ACCORD_EMB_PATH):
            accord_vecs = np.load(ACCORD_EMB_PATH)
            logger.info("어코드 임베딩 파일 로드 완료 (%s)", ACCORD_EMB_PATH)
        else:
            t0 = time.time()
            accord_vecs = app.state.embedder.encode_many([f"query: {a}" for a in ACCORD_LIST])
            accord_vecs = accord_vecs / np.linalg.norm(accord_vecs, axis=1, keepdims=True)
            np.save(ACCORD_EMB_PATH, accord_vecs)
            logger.info("어코드 임베딩 계산 및 저장 완료: %.2fs → %s", time.time() - t0, ACCORD_EMB_PATH)
        app.state.accord_embeddings = accord_vecs  # shape: (33, 1024)
    reload_task = asyncio.create_task(_reload_perfume_rows_periodically(app))
    logger.info(
        "앱 시작 완료: 임베더 및 향수 데이터 로드됨 "
        "(perfume_rows: %d초마다 dirty 체크, 바뀐 게 있어도 최소 %d초 간격으로 재로드)",
        PERFUME_ROWS_DIRTY_CHECK_SECONDS, PERFUME_ROWS_MIN_RELOAD_INTERVAL_SECONDS,
    )
    yield
    # shutdown
    reload_task.cancel()
    engine.dispose()
    logger.info("앱 종료: DB 연결 풀 해제됨")


app = FastAPI(lifespan=lifespan)

from app.api.v1 import recommend
app.include_router(recommend.router, prefix="/api/v1")

from app.api.v1 import embed
app.include_router(embed.router, prefix="/api/v1")
