package com.example.fragrance.preference.service;

import com.example.fragrance.preference.dto.PreferenceResponse;
import com.example.fragrance.recommend.dto.FastApiMemberRecommendResponse;

import java.util.List;

public interface PreferenceService {
	PreferenceResponse getPreference(Long memberId);

	List<FastApiMemberRecommendResponse.RecommendationItem> getMemberRecommend(Long memberId);
}
