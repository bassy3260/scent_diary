package com.example.fragrance.diary.controller;

import com.example.fragrance.diary.dto.DiaryCreateRequest;
import com.example.fragrance.diary.dto.DiaryDetailResponse;
import com.example.fragrance.diary.dto.DiaryListResponse;
import com.example.fragrance.diary.dto.DiaryRefineRequest;
import com.example.fragrance.diary.dto.DiaryRefineResponse;
import com.example.fragrance.diary.service.DiaryRefineService;
import com.example.fragrance.diary.service.DiaryService;
import com.example.fragrance.util.common.ApiResponse;
import com.example.fragrance.util.common.PageResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "/api/v1/diaries", produces = "application/json; charset=utf8")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
	private final DiaryRefineService diaryRefineService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DiaryListResponse>>> getDiaries(
            @RequestAttribute("memberId") Long memberId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size) {

        PageResponse<DiaryListResponse> pageResponse = diaryService.getDiaries(memberId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("일기 목록 조회 성공", pageResponse));
    }

    @GetMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<DiaryDetailResponse>> getDiary(
            @RequestAttribute("memberId") Long memberId,
            @PathVariable Long diaryId) {

        DiaryDetailResponse diary = diaryService.getDiary(diaryId);
        return ResponseEntity.ok(ApiResponse.ok("일기 상세 조회가 완료되었습니다.", diary));
    }

    @PostMapping(consumes = "application/json; charset=utf8")
    public ResponseEntity<ApiResponse<Map<String, Long>>> createDiary(
            @RequestAttribute("memberId") Long memberId,
            @RequestBody DiaryCreateRequest request) {

        Long diaryId = diaryService.createDiary(memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("일기 작성 성공", Map.of("diaryId", diaryId)));
    }

	@PostMapping("/refine")
	public ResponseEntity<ApiResponse<DiaryRefineResponse>> refineDiary(
		@RequestAttribute("memberId") Long memberId,
		@RequestBody DiaryRefineRequest request) {

		DiaryRefineResponse response = diaryRefineService.refine(request);
		return ResponseEntity.ok(ApiResponse.ok("일기 내용 다듬기 성공", response));
	}
}
