package com.example.fragrance.tryDiray.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TryDiaryListResponse {

    private Long tryDiaryId;
    private String title;
    private LocalDateTime createTime;
    private String thumbnail;
    private String perfumeName;
    private String brand;
}
