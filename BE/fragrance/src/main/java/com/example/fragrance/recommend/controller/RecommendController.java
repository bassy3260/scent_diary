package com.example.fragrance.recommend.controller;

import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendImageRequest;
import com.example.fragrance.recommend.dto.RecommendTextRequest;
import com.example.fragrance.recommend.service.RecommendService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@RestController // @Controller + @RequestBody.
@RequestMapping("/api/v1/recommend")
public class RecommendController {

    private final RecommendService recommendService;

    // S3 미사용 임시 방식: 업로드 파일을 로컬(./local-assets/uploads/)에 저장.
    // 저장 위치는 application-local.yaml 의 static-locations(file:./local-assets/) 와 맞물려
    // http://<host>:<port>/uploads/<파일명> 으로 서빙되고, FastAPI가 이 URL로 다운로드한다.
    private static final Path UPLOAD_DIR = Paths.get("local-assets", "uploads");

    /** 추천용 이미지를 로컬에 업로드하고 파일명(image_route)을 반환한다. */
    @PostMapping("/image-upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadRecommendImage(
            @AuthenticationPrincipal String loginId,
            @RequestParam("image") MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.ok("빈 파일입니다", Map.of()));
        }

        String original = image.getOriginalFilename();
        String ext = "jpg";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        String fileName = System.currentTimeMillis() + "_"
                + UUID.randomUUID().toString().substring(0, 8) + "." + ext;

        try {
            Files.createDirectories(UPLOAD_DIR);
            Path target = UPLOAD_DIR.resolve(fileName);
            try (var in = image.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("이미지 저장 실패", e);
        }

        log.info("이미지 로컬 업로드 완료: {} (member={})", fileName, loginId);
        return ResponseEntity.ok(ApiResponse.ok("이미지 업로드 성공", Map.of("imageRoute", fileName)));
    }

    // ResponseEntity: Http응답 전체(상태코드+ 헤더 +바디)를 제어, ResponseEntity.ok()는 200 응답
    @PostMapping("/text")
    public ResponseEntity<ApiResponse<RecommendHistoryDetailResponse>> getTextRecommendList(
            @AuthenticationPrincipal String loginId,
            @RequestBody RecommendTextRequest request) {
        Long memberId = Long.parseLong(loginId);
        RecommendHistoryDetailResponse data = recommendService.getTextRecommendResponse(memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("텍스트 추천 성공", data));
    }

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<RecommendHistoryDetailResponse>> getRecommendByImage(
            @AuthenticationPrincipal String loginId,
            @RequestBody RecommendImageRequest request) {
        Long memberId = Long.parseLong(loginId);
        log.info("컨트롤러 - url 확인: {}", request.getImageRoute());
        RecommendHistoryDetailResponse data = recommendService.getImageRecommedResponse(memberId, request);
        return ResponseEntity.ok(ApiResponse.ok("이미지 추천 성공", data));
    }

}
