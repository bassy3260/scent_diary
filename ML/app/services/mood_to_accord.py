import numpy as np

from app.constants import ACCORD_LIST, MOOD_ACCORD_MAP


def convert_mood_to_accord(
    mood_scores: dict[str, float],
    temperature: float = 3.0,
    top_k: int = 10,
    min_threshold: float = 0.02,
) -> np.ndarray:
    """
    무드 유사도 점수 → 33차원 어코드 벡터 변환

    1단계: 무드별 어코드 벡터를 무드 유사도로 가중 합산
    2단계: temperature scaling으로 핵심 어코드 강조
    3단계: 정규화 (power scaling 후 합=1로 복원)
    4단계: top-k 필터링으로 노이즈 제거
    5단계: min threshold 이하 제거 + 재정규화
    """
    # 1단계: 가중 합산
    combined = np.zeros(len(ACCORD_LIST))
    for mood, score in mood_scores.items():
        if mood in MOOD_ACCORD_MAP:
            accord_weights = np.array(MOOD_ACCORD_MAP[mood])
            combined += accord_weights * score

    # 2단계: temperature scaling
    combined = np.power(combined, temperature)

    # 3단계: 정규화
    total = combined.sum()
    if total > 0:
        combined = combined / total

    # 4단계: top-k 필터링
    if top_k < len(combined):
        top_indices = np.argsort(combined)[-top_k:]
        mask = np.zeros_like(combined)
        mask[top_indices] = 1
        combined = combined * mask

    # 5단계: threshold + 재정규화
    combined[combined < min_threshold] = 0
    total = combined.sum()
    if total > 0:
        combined = combined / total

    return combined


def get_top_accords(vector: np.ndarray, top_n: int = 5) -> list[dict]:
    """어코드 벡터에서 상위 N개 어코드와 가중치 반환"""
    top_indices = np.argsort(vector)[-top_n:][::-1]
    return [
        {"accord": ACCORD_LIST[i], "weight": round(float(vector[i]), 4)}
        for i in top_indices
        if vector[i] > 0
    ]
