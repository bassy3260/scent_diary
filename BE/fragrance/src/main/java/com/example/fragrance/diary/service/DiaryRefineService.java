package com.example.fragrance.diary.service;

import com.example.fragrance.diary.dto.DiaryRefineRequest;
import com.example.fragrance.diary.dto.DiaryRefineResponse;
import com.example.fragrance.diary.dto.GMSResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiaryRefineService {
	private final RestTemplate restTemplate;

	@Value("${gms.url}")
	private String gmsUrl;

	@Value("${gms.key}")
	private String gmsKey;

	public DiaryRefineResponse refine(DiaryRefineRequest request) {
		StringBuilder userMessage = new StringBuilder();

		if (request.getPerfumeBrand() != null) {
			userMessage.append("브랜드: ").append(request.getPerfumeBrand()).append("\n");
		}
		if (request.getPerfumeName() != null) {
			userMessage.append("향수명: ").append(request.getPerfumeName()).append("\n");
		}
		if (request.getContent() != null) {
			userMessage.append("일기 내용: ").append(request.getContent());
		}

		// 아무 정보도 없으면 기본 프롬프트로 요청
		if (userMessage.isEmpty()) {
			userMessage.append("향수에 대한 감성적인 일기를 한 편 작성해주세요.");
		}

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(gmsKey);

		Map<String, Object> body = Map.of(
			"model", "gpt-4.1-nano",
			"messages", List.of(
				Map.of("role", "system", "content",
					"당신은 향수 일기 작가입니다. 사용자가 입력한 정보를 바탕으로 감성적이고 풍부한 향수 일기를 작성해주세요. " +
						"향수명과 브랜드 정보가 있다면 적극 활용하고, 일기 내용이 있다면 그 감정과 의미를 살려 더 생생하게 표현해주세요. " +
						"결과는 완성된 일기 본문만 반환해주세요."),
				Map.of("role", "user", "content", userMessage.toString())
			),
			"max_tokens", 4096,
			"temperature", 0.7
		);

		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

		ResponseEntity<GMSResponse> response = restTemplate.exchange(
			gmsUrl,
			HttpMethod.POST,
			entity,
			GMSResponse.class
		);

		String refinedContent = response.getBody().getChoices().get(0).getMessage().getContent();

		return new DiaryRefineResponse(refinedContent);
	}
}