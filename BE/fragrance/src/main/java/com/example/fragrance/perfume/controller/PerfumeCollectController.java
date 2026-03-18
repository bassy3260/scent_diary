package com.example.fragrance.perfume.controller;

import com.example.fragrance.perfume.dto.CollectRequest;
import com.example.fragrance.perfume.dto.MemberPerfumeListResponse;
import com.example.fragrance.perfume.service.MemberPerfumeService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/perfume")
@RequiredArgsConstructor
public class PerfumeCollectController {

	private final MemberPerfumeService memberPerfumeService;

	@PostMapping("/collect")
	public ResponseEntity<?> toggleCollect(
			@AuthenticationPrincipal String loginId,
			@RequestBody CollectRequest request) {

		Long memberId = Long.parseLong(loginId);
		String message = memberPerfumeService.insertCollect(memberId, request.getPerfumeId());

		return ResponseEntity.ok(Map.of("message", message));
	}
}
