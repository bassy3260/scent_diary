package com.example.fragrance.perfume.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

@Getter
@Setter
@NoArgsConstructor
@Document(indexName = "perfumes")
public class PerfumeSearchDto {
    @Id // ES ID 매핑용
    private String id;

	private String image;
	private String brand;
	private String name;
	private Integer price;
	private List<String> accords;
	private List<String> notes;
}
