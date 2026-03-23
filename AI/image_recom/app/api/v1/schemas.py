from pydantic import BaseModel


class MoodScore(BaseModel):
    mood: str
    score: float


class AccordWeight(BaseModel):
    accord: str
    weight: float


class ImageRecommendResponse(BaseModel):
    mood_scores: list[MoodScore]
    accord_vector: list[float]
    top_accords: list[AccordWeight]
