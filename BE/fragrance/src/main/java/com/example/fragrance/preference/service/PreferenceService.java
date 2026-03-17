package com.example.fragrance.preference.service;

import com.example.fragrance.preference.dto.PreferenceResponse;

public interface PreferenceService {
	PreferenceResponse getPreference(Long memberId);
}