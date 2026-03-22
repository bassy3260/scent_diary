package com.example.fragrance.diary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryListResponse {

    private Long diaryId;
    private String title;
    private LocalDateTime createTime;
    private String detail;
    private PerfumeInfo perfume;

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
