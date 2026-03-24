package com.example.fragrance.tryDiray.service;

import com.example.fragrance.tryDiray.dto.TryDiaryCreateRequest;
import com.example.fragrance.tryDiray.dto.TryDiaryDetailResponse;
import com.example.fragrance.tryDiray.dto.TryDiaryListResponse;
import com.example.fragrance.tryDiray.entity.TryDiary;
import com.example.fragrance.tryDiray.entity.TryDiaryPerfume;
import com.example.fragrance.tryDiray.mapper.TryDiaryMapper;
import com.example.fragrance.tryDiray.mapper.TryDiaryPerfumeMapper;
import com.example.fragrance.util.common.PageResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TryDiaryService {

	private final TryDiaryMapper tryDiaryMapper;
	private final TryDiaryPerfumeMapper tryDiaryPerfumeMapper;

	public PageResponse<TryDiaryListResponse> getTryDiaries(Long memberId, int page, int size) {
		int offset = (page - 1) * size;
		List<TryDiaryListResponse> list = tryDiaryMapper.findAll(memberId, offset, size);
		int totalElements = tryDiaryMapper.countByMemberId(memberId);
		return PageResponse.of(list, totalElements, page, size);
	}

	public TryDiaryDetailResponse getTryDiary(Long tryDiaryId) {
		return tryDiaryMapper.findById(tryDiaryId);
	}

	@Transactional
	public Long createTryDiary(Long memberId, TryDiaryCreateRequest request) {
		TryDiary tryDiary = TryDiary.builder()
			.memberId(memberId)
			.title(request.getTitle())
			.build();
		tryDiaryMapper.insert(tryDiary);

		if (request.getTryItems() != null && !request.getTryItems().isEmpty()) {
			List<TryDiaryPerfume> perfumes = request.getTryItems().stream()
				.map(item -> TryDiaryPerfume.builder()
					.tryDiaryId(tryDiary.getTryDiaryId())
					.perfumeId(item.getPerfumeId())
					.description(item.getDescription())
					.place(item.getPlace())
					.lasting(item.getLasting())
					.sillage(item.getSillage())
					.season(item.getSeason())
					.build())
				.collect(Collectors.toList());
			tryDiaryPerfumeMapper.insertBatch(perfumes);
		}

		return tryDiary.getTryDiaryId();
	}
}