import base64

from fastapi import APIRouter, File, Request, UploadFile

from app.api.v1.schemas import AccordWeight, ImageRecommendResponse, MoodScore
from app.services.mood_to_accord import convert_mood_to_accord, get_top_accords

router = APIRouter()


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
