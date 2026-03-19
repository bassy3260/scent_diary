package com.example.fragrance.perfume.controller;

import com.example.fragrance.perfume.dto.CollectRequest;
import com.example.fragrance.perfume.dto.PerfumeDetailResponse;
import com.example.fragrance.perfume.service.MemberPerfumeService;
import com.example.fragrance.perfume.service.PerfumeService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/perfume")
@RequiredArgsConstructor
public class PerfumeController {

	private final MemberPerfumeService memberPerfumeService;
	private final PerfumeService perfumeService;

	@PostMapping("/collect")
	public ResponseEntity<?> toggleCollect(
			@AuthenticationPrincipal String loginId,
			@RequestBody CollectRequest request) {

		Long memberId = Long.parseLong(loginId);
		String message = memberPerfumeService.insertCollect(memberId, request.getPerfumeId());

		return ResponseEntity.ok(Map.of("message", message));
	}

	@GetMapping("/{perfumeId}")
	public ResponseEntity<ApiResponse<PerfumeDetailResponse>> getPerfumeDetail(@PathVariable Long perfumeId) {
		PerfumeDetailResponse response = perfumeService.getPerfumeDetail(perfumeId);

		if (response == null) {
			return ResponseEntity.notFound().build();
		}

		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", response));
	}
}
