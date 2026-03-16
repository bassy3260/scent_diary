package com.example.fragrance.likes.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.fragrance.likes.dto.LikedPerfumeListResponse;
import com.example.fragrance.likes.service.LikesService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class LikesController {
	private final LikesService likesService;

	// GET /api/v1/my/likes?page=1&size=10
	@GetMapping("/likes")
	public ResponseEntity<Map<String, Object>> getLikedPerfumes(
		// @AuthenticationPrincipal UserDetails userDetails,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "10") int size
	) {
		//Long memberId = extractMemberId(userDetails);
		Long memberId = 1L;
		LikedPerfumeListResponse data = likesService.getLikedPerfumes(memberId, page - 1, size);
		return ResponseEntity.ok(buildResponse(200, "SUCCESS", data));
	}

	// DELETE /api/v1/my/likes/{likesId}
	@DeleteMapping("/likes/{likesId}")
	public ResponseEntity<Map<String, Object>> deleteLikes(
		//@AuthenticationPrincipal UserDetails userDetails,
		@PathVariable Long likesId
	) {
		//Long memberId = extractMemberId(userDetails);
		Long memberId = 1L;
		likesService.deleteLikes(likesId, memberId);
		return ResponseEntity.ok(buildResponse(200, "SUCCESS", null));
	}

	private Long extractMemberId(UserDetails userDetails) {
		return Long.parseLong(userDetails.getUsername());
	}

	private Map<String, Object> buildResponse(int status, String message, Object data) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("status", status);
		response.put("message", message);
		response.put("data", data);
		return response;
	}

}
