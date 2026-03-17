package com.example.fragrance.likes.controller;

import com.example.fragrance.likes.dto.LikesRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.fragrance.likes.dto.LikedPerfumeListResponse;
import com.example.fragrance.likes.service.LikesService;
import com.example.fragrance.util.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class LikesController {

	private final LikesService likesService;

	// GET /api/v1/my/likes?page=1&size=10
	@GetMapping("/likes")
	public ResponseEntity<ApiResponse<LikedPerfumeListResponse>> getLikedPerfumes(
		@RequestAttribute("memberId") Long memberId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		LikedPerfumeListResponse data = likesService.getLikedPerfumes(memberId, page - 1, size);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}

	// DELETE /api/v1/my/likes/{likesId}
	@DeleteMapping("/likes/{likesId}")
	public ResponseEntity<ApiResponse<Void>> deleteLikes(
		@RequestAttribute("memberId") Long memberId,
		@PathVariable Long likesId
	) {
		likesService.deleteLikes(likesId, memberId);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS"));
	}

}