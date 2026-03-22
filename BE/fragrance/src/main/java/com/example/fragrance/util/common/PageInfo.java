package com.example.fragrance.util.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PageInfo {

    private int totalElements;
    private int totalPages;
    private int currentPage;

    public static PageInfo of(int totalElements, int currentPage, int size) {
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return new PageInfo(totalElements, totalPages, currentPage);
    }
}
