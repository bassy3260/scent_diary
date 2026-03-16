package com.example.fragrance.diary.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class DiaryCreateRequest {

    private String title;
    private String content;
    private Long perfumeId;
    private List<String> images;
}
