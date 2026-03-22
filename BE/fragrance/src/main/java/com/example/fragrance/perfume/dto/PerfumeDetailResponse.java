package com.example.fragrance.perfume.dto;

import com.example.fragrance.note.dto.NotesDetailResponse;
import com.example.fragrance.review.dto.ReviewDetailResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PerfumeDetailResponse {
    private String image;
    private String brand;
    private String name;
    private int price;
    private List<String> accords;
    private NotesDetailResponse notes;
    private List<ReviewDetailResponse> reviews;
}
