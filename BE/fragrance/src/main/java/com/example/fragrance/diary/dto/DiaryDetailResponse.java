package com.example.fragrance.diary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryDetailResponse {

    private Long diaryId;
    private String title;
    private LocalDateTime createTime;
    private String detail;
    private List<DiaryImageInfo> diaryImage;
    private PerfumeInfo perfume;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiaryImageInfo {
        private String diaryImageUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PerfumeInfo {
        private Long perfumeId;
        private String perfumeImageUrl;
        private String perfumeName;
        private String brand;
    }
}
