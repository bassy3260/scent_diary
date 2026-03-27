package com.example.fragrance.likes.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.fragrance.likes.dto.LikedPerfume;
import com.example.fragrance.likes.dto.LikedPerfumeListResponse;
import com.example.fragrance.likes.dto.LikesRequest;
import com.example.fragrance.likes.service.LikesService;
import com.example.fragrance.util.common.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class LikesController {

	private final LikesService likesService;

	// GET /api/v1/my/likes?page=1&size=10
	@GetMapping("/likes")
	public ResponseEntity<ApiResponse<LikedPerfumeListResponse>> getLikedPerfumes(
		@AuthenticationPrincipal String loginId,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		Long memberId = Long.parseLong(loginId);
		LikedPerfumeListResponse data = likesService.getLikedPerfumes(memberId, page - 1, size);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}

	// GET /api/v1/my/likes/popular
	@GetMapping("/likes/popular")
	public ResponseEntity<ApiResponse<List<LikedPerfume>>> getTopLikedPerfumes() {
		List<LikedPerfume> data = likesService.getTopLikedPerfumes();
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}

	// DELETE /api/v1/my/likes/{likesId}
	@DeleteMapping("/likes/{likesId}")
	public ResponseEntity<ApiResponse<Void>> deleteLikes(
		@AuthenticationPrincipal String loginId,
		@PathVariable Long likesId
	) {
		Long memberId = Long.parseLong(loginId);
		likesService.deleteLikes(likesId, memberId);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS"));
	}

}