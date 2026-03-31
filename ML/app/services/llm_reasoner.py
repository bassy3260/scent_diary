import json
import logging
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GMS_API_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
GMS_API_KEY = os.getenv("GEMINI_API_KEY")


def _perfume_info_block(perfume_info: dict) -> str:
    """향수 정보를 프롬프트용 텍스트 블록으로 변환"""
    accords = ', '.join(perfume_info['accords']) if perfume_info['accords'] else '없음'
    return (
        f"- 향수명: {perfume_info['perfume_name']}\n"
        f"- 가격: {perfume_info['price']}원\n"
        f"- 어코드: {accords}\n"
        f"- 탑 노트: {perfume_info.get('top_notes', '없음')}\n"
        f"- 미들 노트: {perfume_info.get('middle_notes', '없음')}\n"
        f"- 베이스 노트: {perfume_info.get('base_notes', '없음')}\n"
        f"- 설명: {perfume_info.get('description', '없음')}"
    )


async def _call_llm(user_prompt: str) -> str | None:
    """GMS API 호출 공통 로직. 실패 시 None 반환."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GMS_API_KEY}"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "developer",
                "content": "당신은 향수 추천 전문가입니다. 사용자의 취향과 향수 정보를 바탕으로 추천 이유를 자연스럽게 설명해주세요."
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "response_format": {"type": "json_object"},
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(GMS_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        message = result["choices"][0]["message"]["content"].strip()
        if not message:
            raise ValueError("LLM 응답이 비어있습니다")
        return message
    except httpx.TimeoutException:
        logger.warning("LLM API 타임아웃: %s", GMS_API_URL)
    except httpx.HTTPStatusError as e:
        logger.error("LLM API HTTP 오류: %s", e)
    except (KeyError, IndexError) as e:
        logger.error("LLM 응답 파싱 오류: %s", e)
    except ValueError as e:
        logger.error("LLM 응답 값 오류: %s", e)
    return None


def _parse_batch_response(raw: str, count: int, default: str) -> list[str]:
    """LLM 배치 JSON 응답을 파싱하여 이유 리스트 반환. 실패 시 default로 채움."""
    try:
        text = raw.strip()
        # ```json ... ``` 블록 대응
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text.strip())
        return [str(data.get(str(i + 1), default)) for i in range(count)]
    except Exception as e:
        logger.warning("배치 LLM 응답 파싱 실패 → 기본값 사용. 원인: %s | 응답: %s", e, raw[:200])
        return [default] * count


async def generate_reasons_batch(
    input_text: str,
    perfumes: list[dict],
    mode: str = "text",
) -> list[str]:
    """여러 향수에 대한 추천 이유를 한 번의 LLM 호출로 생성.

    Args:
        input_text: 텍스트 모드면 사용자 입력 키워드, 무드 모드면 감지된 무드명
        perfumes:   추천 향수 목록
        mode:       "text" | "mood"
    """
    if not perfumes:
        return []

    count = len(perfumes)

    if mode == "text":
        context = f'사용자가 "{input_text}"라는 향수 취향을 입력했습니다.'
        mismatch_guide = (
            "취향 텍스트와 맞지 않는 향수는 솔직하게 맞지 않는다고 얘기하세요.\n"
            "(예: '고독하고 쓸쓸함'인데 플로럴·시트러스 여름향이면 맞지 않음)"
        )
        default = "이 향수는 사용자의 취향과 잘 어울립니다."
    else:
        context = f"사용자가 업로드한 이미지에서 '{input_text}' 무드가 강하게 감지되었습니다."
        mismatch_guide = "이미지 무드와 맞지 않는 향수는 솔직하게 맞지 않는다고 얘기하세요."
        default = "이 향수는 이미지의 무드와 잘 어울립니다."

    numbered_blocks = "\n\n".join(
        f"{i + 1}번 향수:\n{_perfume_info_block(p)}"
        for i, p in enumerate(perfumes)
    )
    json_template = "{" + ", ".join(f'"{i + 1}": "이유..."' for i in range(count)) + "}"

    prompt = f"""{context}

아래 {count}개 향수 각각에 대해 추천 이유를 1문장씩 작성해주세요.
{mismatch_guide}

{numbered_blocks}

반드시 아래 JSON 형식으로만 답변하세요 (다른 텍스트 없이):
{json_template}"""

    raw = await _call_llm(prompt)
    if raw is None:
        return [default] * count

    return _parse_batch_response(raw, count, default)
