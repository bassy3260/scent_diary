package com.example.fragrance.likes.controller;

import com.example.fragrance.likes.dto.LikedPerfumeListResponse;
import com.example.fragrance.likes.dto.LikesRequest;
import com.example.fragrance.likes.service.LikesService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/perfume")
@RequiredArgsConstructor
public class PerfumeLikesController {

	private final LikesService likesService;

	@PostMapping("/likes")
	public ResponseEntity<?> toggleLike(
			@AuthenticationPrincipal String loginId,
			@RequestBody LikesRequest request) {
		Long userId = Long.parseLong(loginId);

		String message = likesService.toggleLike(userId, request.getPerfumeId());

		return ResponseEntity.ok(Map.of("message", message));
	}
}