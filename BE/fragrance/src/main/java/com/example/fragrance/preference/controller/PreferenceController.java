package com.example.fragrance.preference.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.fragrance.preference.dto.PreferenceResponse;
import com.example.fragrance.preference.service.PreferenceService;
import com.example.fragrance.util.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class PreferenceController {

	private final PreferenceService preferenceService;

	// GET /api/v1/my/preference
	@GetMapping("/preference")
	public ResponseEntity<ApiResponse<PreferenceResponse>> getPreference(
		@AuthenticationPrincipal String loginId
	) {
		Long memberId = Long.parseLong(loginId);
		PreferenceResponse data = preferenceService.getPreference(memberId);
		return ResponseEntity.ok(ApiResponse.ok("SUCCESS", data));
	}
}