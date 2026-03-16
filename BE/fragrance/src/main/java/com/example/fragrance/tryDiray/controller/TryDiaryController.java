package com.example.fragrance.tryDiray.controller;

import com.example.fragrance.tryDiray.entity.TryDiary;
import com.example.fragrance.tryDiray.service.TryDiaryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/v1/try-diary", produces = "application/json; charset=utf8")
@RequiredArgsConstructor
public class TryDiaryController {

    private final TryDiaryService tryDiaryService;

    // 시향 일지 목록 조회
    @GetMapping
    public ResponseEntity<List<TryDiary>> getTryDiaries(
            @RequestAttribute("memberId") Long memberId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size) {

        List<TryDiary> tryDiaries = tryDiaryService.getTryDiaries(memberId, page, size);
        return ResponseEntity.ok(tryDiaries);
    }

    // 시향 일지 상세 조회
    @GetMapping("/{tryDiaryId}")
    public ResponseEntity<TryDiary> getTryDiary(
            @RequestAttribute("memberId") Long memberId,
            @PathVariable Long tryDiaryId) {

        TryDiary tryDiary = tryDiaryService.getTryDiary(tryDiaryId);
        return ResponseEntity.ok(tryDiary);
    }

    // 시향 일지 작성
    @PostMapping(consumes = "application/json; charset=utf8")
    public ResponseEntity<Void> createTryDiary(
            @RequestAttribute("memberId") Long memberId,
            @RequestBody TryDiary tryDiary) {

        tryDiaryService.createTryDiary(memberId, tryDiary);
        return ResponseEntity.ok().build();
    }
}
