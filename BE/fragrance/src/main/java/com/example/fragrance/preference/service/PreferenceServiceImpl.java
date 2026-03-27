package com.example.fragrance.preference.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.fragrance.preference.dto.TopLikedPerfumeDto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.fragrance.preference.dto.PreferenceAccordDto;
import com.example.fragrance.preference.dto.PreferenceNoteDto;
import com.example.fragrance.preference.dto.PreferenceNotesDto;
import com.example.fragrance.preference.dto.PreferenceResponse;
import com.example.fragrance.preference.mapper.PreferenceMapper;
import com.example.fragrance.recommend.dto.FastApiMemberRecommendResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PreferenceServiceImpl implements PreferenceService {

	private final PreferenceMapper preferenceMapper;
	private final RestTemplate restTemplate;

	@Value("${fastapi.url}")
	private String fastapiUrl;

	@Override
	public PreferenceResponse getPreference(Long memberId) {
		long totalPerfumes = preferenceMapper.countOwnedPerfumes(memberId);

		if (totalPerfumes == 0) {
			return new PreferenceResponse(
				null,
				Collections.emptyList(),
				new PreferenceNotesDto(
					Collections.emptyList(),
					Collections.emptyList(),
					Collections.emptyList(),
					Collections.emptyList(),
					Collections.emptyList()
				)
			);
		}

		List<PreferenceAccordDto> accords = preferenceMapper.findTopAccords(memberId);
		applyAccordRatio(accords, totalPerfumes);

		List<PreferenceNoteDto> totalNotes  = preferenceMapper.findTopNotes(memberId);
		List<PreferenceNoteDto> topNotes    = preferenceMapper.findTopNotesByLevel(memberId, "TOP");
		List<PreferenceNoteDto> middleNotes = preferenceMapper.findTopNotesByLevel(memberId, "MIDDLE");
		List<PreferenceNoteDto> baseNotes   = preferenceMapper.findTopNotesByLevel(memberId, "BASE");
		List<PreferenceNoteDto> singleNotes = preferenceMapper.findTopNotesByLevel(memberId, "SINGLE");

		applyNoteRatio(totalNotes, totalPerfumes);
		applyNoteRatio(topNotes, totalPerfumes);
		applyNoteRatio(middleNotes, totalPerfumes);
		applyNoteRatio(baseNotes, totalPerfumes);
		applyNoteRatio(singleNotes, totalPerfumes);

		PreferenceNotesDto notes = new PreferenceNotesDto(totalNotes, topNotes, middleNotes, baseNotes, singleNotes);
		String summary = buildSummary(accords);

		return new PreferenceResponse(summary, accords, notes);
	}

	@Override
	public List<FastApiMemberRecommendResponse.RecommendationItem> getMemberRecommend(Long memberId) {
		long totalPerfumes = preferenceMapper.countOwnedPerfumes(memberId);

		if (totalPerfumes == 0) {
			List<TopLikedPerfumeDto> topLiked = preferenceMapper.findTopLikedPerfumes();
			return topLiked.stream()
				.map(p -> new FastApiMemberRecommendResponse.RecommendationItem(
					p.getPerfumeId(), p.getPerfumeName(), p.getImageRoute(), p.getAccordList()
				))
				.collect(Collectors.toList());
		}

		Map<String, Object> body = new HashMap<>();
		body.put("member_id", memberId);

		FastApiMemberRecommendResponse response = restTemplate.postForObject(
			fastapiUrl + "/api/v1/recommend/member",
			body,
			FastApiMemberRecommendResponse.class
		);

		if (response == null || response.getRecommendations() == null) {
			return Collections.emptyList();
		}
		return response.getRecommendations();
	}

	private void applyAccordRatio(List<PreferenceAccordDto> accords, long totalPerfumes) {
		accords.forEach(a -> {
			double ratio = Math.round((double) a.getCount() / totalPerfumes * 1000) / 10.0;
			a.setRatio(ratio);
		});
	}

	private void applyNoteRatio(List<PreferenceNoteDto> notes, long totalPerfumes) {
		notes.forEach(n -> {
			double ratio = Math.round((double) n.getCount() / totalPerfumes * 1000) / 10.0;
			n.setRatio(ratio);
		});
	}

	private String buildSummary(List<PreferenceAccordDto> accords) {
		if (accords.isEmpty()) return null;
		if (accords.size() == 1) return accords.get(0).getAccordName() + "한 향을 선호하는 취향";
		return accords.get(0).getAccordName() + "한 베이스에 "
			+ accords.get(1).getAccordName() + "한 감성을 더한 취향";
	}
}
