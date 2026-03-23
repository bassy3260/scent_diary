from pydantic import BaseModel
from typing import Literal


# 선호 노트 → 노트 내부 비율 매핑 (합 = 1.0)
NOTE_RATIO: dict[str, dict[str, float]] = {
    "top":    {"top": 0.6, "middle": 0.2, "base": 0.2},
    "middle": {"top": 0.2, "middle": 0.6, "base": 0.2},
    "base":   {"top": 0.2, "middle": 0.2, "base": 0.6},
}


class RecommendRequest(BaseModel):
    keyword: str
    note: Literal["top", "middle", "base"] = "middle"
    price: int


class RecommendResponse(BaseModel):
    perfume_id:   int
    perfume_name: str
    price:        int
    score:        float
    accords:      list[str] | None
    description:  str | None
    reason:       str | None


class RecommendListResponse(BaseModel):
    recommendations: list[RecommendResponse]
