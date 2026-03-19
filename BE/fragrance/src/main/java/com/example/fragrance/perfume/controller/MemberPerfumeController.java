package com.example.fragrance.perfume.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.fragrance.perfume.dto.MemberPerfumeListResponse;
import com.example.fragrance.perfume.service.MemberPerfumeService;
import com.example.fragrance.util.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class MemberPerfumeController {

	private final MemberPerfumeService memberPerfumeService;

	// GET /api/v1/my/perfume?page=1&size=10
	@GetMapping("/perfume")
	public ResponseEntity<ApiResponse<MemberPerfumeListResponse>> getOwnedPerfumes(
		@AuthenticationPrincipal String loginId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		Long memberId = Long.parseLong(loginId);
		MemberPerfumeListResponse data = memberPerfumeService.getOwnedPerfumes(memberId, page - 1, size);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}

	// DELETE /api/v1/my/perfume/{memberPerfumeId}
	@DeleteMapping("/perfume/{memberPerfumeId}")
	public ResponseEntity<ApiResponse<Void>> deleteMemberPerfume(
		@AuthenticationPrincipal String loginId,
		@PathVariable Long memberPerfumeId
	) {
		Long memberId = Long.parseLong(loginId);
		memberPerfumeService.deleteMemberPerfume(memberPerfumeId, memberId);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS"));
	}
}

