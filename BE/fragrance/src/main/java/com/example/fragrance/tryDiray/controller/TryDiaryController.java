package com.example.fragrance.tryDiray.controller;

import com.example.fragrance.tryDiray.dto.TryDiaryCreateRequest;
import com.example.fragrance.tryDiray.dto.TryDiaryDetailResponse;
import com.example.fragrance.tryDiray.dto.TryDiaryListResponse;
import com.example.fragrance.tryDiray.service.TryDiaryService;
import com.example.fragrance.util.common.ApiResponse;
import com.example.fragrance.util.common.PageResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "/api/v1/try-diary", produces = "application/json; charset=utf8")
@RequiredArgsConstructor
public class TryDiaryController {

    private final TryDiaryService tryDiaryService;

    // 시향 일지 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TryDiaryListResponse>>> getTryDiaries(
            @RequestAttribute("memberId") Long memberId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size) {

        PageResponse<TryDiaryListResponse> pageResponse = tryDiaryService.getTryDiaries(memberId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("시향 일지 목록 조회 성공", pageResponse));
    }

    @GetMapping("/{tryDiaryId}")
    public ResponseEntity<ApiResponse<TryDiaryDetailResponse>> getTryDiary(
            @RequestAttribute("memberId") Long memberId,
            @PathVariable Long tryDiaryId) {

        TryDiaryDetailResponse tryDiary = tryDiaryService.getTryDiary(tryDiaryId);
        return ResponseEntity.ok(ApiResponse.ok("시향 일지 상세 조회가 완료되었습니다.", tryDiary));
    }

    @PostMapping(consumes = "application/json; charset=utf8")
    public ResponseEntity<ApiResponse<Map<String, Long>>> createTryDiary(
            @RequestAttribute("memberId") Long memberId,
            @RequestBody TryDiaryCreateRequest request) {

        Long tryDiaryId = tryDiaryService.createTryDiary(memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("시향 일지 작성 성공", Map.of("tryDiaryId", tryDiaryId)));
    }
}
