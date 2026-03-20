package com.example.fragrance.recommend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse.InputInfo;
import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse.NoteInfo;
import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse.PerfumeDetail;
import com.example.fragrance.recommend.dto.RecommendHistoryListResponse;
import com.example.fragrance.recommend.dto.RecommendHistoryListResponse.PerfumeSummary;
import com.example.fragrance.recommend.dto.RecommendHistoryListResponse.RecommendHistoryItem;
import com.example.fragrance.recommend.dto.RecommendHistoryQueryResult;
import com.example.fragrance.recommend.mapper.RecommendResultMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendHistoryServiceImpl implements RecommendHistoryService {

	private final RecommendResultMapper recommendMapper;

	// ----------------------------------------------------------------
	// 목록 조회
	// ----------------------------------------------------------------

	@Override
	public RecommendHistoryListResponse getHistoryList(Long memberId, int page, int size) {
		int offset = page * size;

		List<RecommendHistoryQueryResult.ListRow> rows = recommendMapper.findHistoryList(memberId, offset, size);
		long totalElements = recommendMapper.countHistory(memberId);
		int totalPages = (int) Math.ceil((double) totalElements / size);

		// recommend_result_id 기준으로 그룹핑 (INSERT 순서 유지)
		Map<Long, RecommendHistoryItem> itemMap = new LinkedHashMap<>();

		for (RecommendHistoryQueryResult.ListRow row : rows) {
			itemMap.computeIfAbsent(row.getRecommendResultId(), id ->
				RecommendHistoryItem.builder()
					.recommendResultId(row.getRecommendResultId())
					.createTime(row.getCreateTime())
					.input(RecommendHistoryListResponse.InputInfo.builder()
						.age(row.getAge())
						.keyword(row.getKeyword())
						.image(row.getInputImage())
						.build())
					.results(new ArrayList<>())
					.build()
			);

			itemMap.get(row.getRecommendResultId()).getResults().add(
				PerfumeSummary.builder()
					.image(row.getPerfumeImage())
					.brand(row.getBrand())
					.name(row.getPerfumeName())
					.build()
			);
		}

		return RecommendHistoryListResponse.builder()
			.recommendations(new ArrayList<>(itemMap.values()))
			.page(page)
			.size(size)
			.totalElements(totalElements)
			.totalPages(totalPages)
			.build();
	}

	// ----------------------------------------------------------------
	// 상세 조회
	// ----------------------------------------------------------------

	@Override
	public RecommendHistoryDetailResponse getHistoryDetail(Long memberId, Long recommendResultId) {

		// 1. 헤더 조회 (본인 소유 확인 포함)
		RecommendHistoryQueryResult.DetailHeaderRow header =
			recommendMapper.findDetailHeader(recommendResultId, memberId);

		if (header == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
				"추천 결과를 찾을 수 없습니다.");
		}

		// 2. 추천 향수 flat row 조회
		List<RecommendHistoryQueryResult.DetailPerfumeRow> rows =
			recommendMapper.findDetailPerfumes(recommendResultId);

		// 3. perfumeId 기준 그룹핑 → accords, notes 중복 제거
		Map<Long, PerfumeDetail.PerfumeDetailBuilder> builderMap = new LinkedHashMap<>();
		Map<Long, List<String>> accordMap = new LinkedHashMap<>();
		Map<Long, Map<String, List<String>>> noteMap = new LinkedHashMap<>();

		for (RecommendHistoryQueryResult.DetailPerfumeRow row : rows) {
			Long perfumeId = row.getPerfumeId();

			// PerfumeDetail 기본 정보 (처음 한 번만)
			builderMap.computeIfAbsent(perfumeId, id ->
				PerfumeDetail.builder()
					.perfumeId(row.getPerfumeId())
					.image(row.getPerfumeImage())
					.brand(row.getBrand())
					.name(row.getPerfumeName())
					.reason(row.getReasons())
			);

			// 어코드 (중복 제거)
			if (row.getAccordName() != null) {
				List<String> accords = accordMap.computeIfAbsent(perfumeId, k -> new ArrayList<>());
				if (!accords.contains(row.getAccordName())) {
					accords.add(row.getAccordName());
				}
			}

			// 노트 (중복 제거)
			if (row.getNoteLevel() != null && row.getNoteName() != null) {
				List<String> noteList = noteMap
					.computeIfAbsent(perfumeId, k -> new LinkedHashMap<>())
					.computeIfAbsent(row.getNoteLevel(), k -> new ArrayList<>());
				if (!noteList.contains(row.getNoteName())) {
					noteList.add(row.getNoteName());
				}
			}
		}

		// 4. 조립
		List<PerfumeDetail> details = builderMap.entrySet().stream()
			.map(entry -> {
				Long perfumeId = entry.getKey();
				Map<String, List<String>> levelMap = noteMap.getOrDefault(perfumeId, Map.of());
				return entry.getValue()
					.accords(accordMap.getOrDefault(perfumeId, List.of()))
					.notes(NoteInfo.builder()
						.top(levelMap.getOrDefault("TOP", List.of()))
						.middle(levelMap.getOrDefault("MIDDLE", List.of()))
						.base(levelMap.getOrDefault("BASE", List.of()))
						.single(levelMap.getOrDefault("SINGLE", List.of()))
						.build())
					.build();
			})
			.collect(Collectors.toList());

		return RecommendHistoryDetailResponse.builder()
			.createTime(header.getCreateTime())
			.input(InputInfo.builder()
				.age(header.getAge())
				.keyword(header.getKeyword())
				.image(header.getInputImage())
				.build())
			.results(details)
			.build();
	}
}