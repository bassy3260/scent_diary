package com.example.fragrance.tryDiray.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class TryDiaryCreateRequest {

    private String title;
    private List<TryItem> tryItems;

    @Getter
    @NoArgsConstructor
    public static class TryItem {
        private Long perfumeId;
        private String detail;
    }
}
