package com.example.fragrance.util.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private PageInfo pageInfo;

    public static <T> PageResponse<T> of(List<T> content, int totalElements, int currentPage, int size) {
        return PageResponse.<T>builder()
                .content(content)
                .pageInfo(PageInfo.of(totalElements, currentPage, size))
                .build();
    }
}
