import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GMS_API_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
GMS_API_KEY = os.getenv("GEMINI_API_KEY")


def generate_recommendation_reason(user_text: str, perfume_info: dict) -> str:
    """
    사용자가 입력한 텍스트와 추천된 향수 정보를 바탕으로
    GMS API(GPT-4o-mini)를 사용해 추천 이유를 생성합니다.
    """
    user_prompt = f"""
사용자가 "{user_text}"라는 향수 취향을 입력했습니다.

다음 향수를 추천합니다:
- 향수명: {perfume_info['perfume_name']}
- 가격: {perfume_info['price']}원
- 어코드: {', '.join(perfume_info['accords']) if perfume_info['accords'] else '없음'}
- 탑 노트: {perfume_info.get('top_notes', '없음')}
- 미들 노트: {perfume_info.get('middle_notes', '없음')}
- 베이스 노트: {perfume_info.get('base_notes', '없음')}
- 설명: {perfume_info.get('description', '없음')}

이 향수가 사용자의 취향에 맞는 이유를 1문장으로 자연스럽게 설명해주세요.
향수의 특징과 사용자 입력 텍스트를 연결하여 설명하되, 너무 형식적이지 않게 작성해주세요.
혹시 너무 무드와 맞지않다면 맞지않다고 솔직하게 얘기하세요.
(예. 고독하고 쓸쓸함 이라 했는데 플로럴하고 시트러스한 여름 냄새향 이라고 하면 맞지않음.
    남성적인 이라는 키워드를 입력했는데 여성적이라는 설명이 있는 향수면 맞지않음.
)
"""

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
        ]
    }

    try:
        response = requests.post(GMS_API_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        message = result["choices"][0]["message"]["content"].strip()
        if not message:
            raise ValueError("LLM 응답이 비어있습니다")
        return message
    except requests.Timeout:
        logger.warning("LLM API 타임아웃: %s", GMS_API_URL)
    except requests.HTTPError as e:
        logger.error("LLM API HTTP 오류: %s", e)
    except (KeyError, IndexError) as e:
        logger.error("LLM 응답 파싱 오류: %s", e)
    except ValueError as e:
        logger.error("LLM 응답 값 오류: %s", e)

    return "이 향수는 사용자의 취향과 잘 어울립니다."
